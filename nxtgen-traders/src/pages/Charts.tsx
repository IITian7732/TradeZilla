// src/pages/Charts.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useMarketStore } from '../store/marketStore';
import { useOHLCV, useQuote } from '../hooks/useMarketData';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { formatINR, formatPct, formatVolume } from '../utils/formatters';
import { searchStocks } from '../api/marketData';
import { POPULAR_STOCKS } from '../utils/constants';
import type { Timeframe } from '../types/market';

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1M' },
  { label: '1H', value: '1h' },
  { label: '15m', value: '15m' },
];

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true' || !import.meta.env.VITE_SUPABASE_URL;

export default function Charts() {
  const navigate = useNavigate();
  const { selectedSymbol, selectedExchange, setSelectedSymbol } = useMarketStore();
  const [timeframe, setTimeframe] = useState<Timeframe>('1d');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof searchStocks>>([]);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<unknown>(null);

  const { data: quote, isLoading: quoteLoading } = useQuote(selectedSymbol, selectedExchange);
  const { data: candles, isLoading: candlesLoading } = useOHLCV(selectedSymbol, selectedExchange, timeframe, 150);

  // Search
  useEffect(() => {
    if (searchQuery.length >= 1) {
      setSearchResults(searchStocks(searchQuery));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Initialize and update chart
  useEffect(() => {
    if (!chartContainerRef.current || !candles || candles.length === 0) return;

    const initChart = async () => {
      try {
        const { createChart, CandlestickSeries } = await import('lightweight-charts');
        
        if (chartRef.current) {
          (chartRef.current as { remove: () => void }).remove();
          chartRef.current = null;
        }

        const chart = createChart(chartContainerRef.current!, {
          width: chartContainerRef.current!.clientWidth,
          height: 320,
          layout: { background: { color: '#FFFFFF' }, textColor: '#475569' },
          grid: { vertLines: { color: '#F8FAFC' }, horzLines: { color: '#F8FAFC' } },
          crosshair: { mode: 1 },
          rightPriceScale: { borderColor: '#E2E8F0' },
          timeScale: { borderColor: '#E2E8F0', timeVisible: true },
        });

        const series = chart.addSeries(CandlestickSeries, {
          upColor: '#10B981',
          downColor: '#EF4444',
          borderUpColor: '#10B981',
          borderDownColor: '#EF4444',
          wickUpColor: '#10B981',
          wickDownColor: '#EF4444',
        });

        series.setData(candles.map(c => ({
          time: c.time as unknown as import('lightweight-charts').UTCTimestamp,
          open: c.open, high: c.high, low: c.low, close: c.close,
        })));

        chart.timeScale().fitContent();
        chartRef.current = chart;

        const handleResize = () => {
          if (chartContainerRef.current) {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
          }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      } catch (err) {
        console.error('Chart init error:', err);
      }
    };

    initChart();
  }, [candles]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Symbol selector */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', position: 'relative' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search symbol..."
              className="input-base"
              style={{ paddingLeft: 36, paddingTop: 10, paddingBottom: 10 }}
            />
            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50,
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden',
              }}>
                {searchResults.map(s => (
                  <button key={s.symbol} onClick={() => { setSelectedSymbol(s.symbol, s.exchange as 'NSE' | 'BSE'); setSearchQuery(''); setSearchResults([]); }}
                    style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: '#0B0F19', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', fontSize: 14 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#E2E8F0')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <span style={{ fontWeight: 600 }}>{s.symbol}</span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>{s.exchange}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/trade')}
            style={{ padding: '10px 16px', background: '#0E7490', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Trade
          </button>
        </div>

        {/* Popular symbols */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {POPULAR_STOCKS.slice(0, 8).map(s => (
            <button key={s.symbol} onClick={() => setSelectedSymbol(s.symbol, s.exchange as 'NSE' | 'BSE')}
              style={{
                padding: '5px 12px', borderRadius: 100, border: '1px solid',
                borderColor: selectedSymbol === s.symbol ? '#0E7490' : '#E2E8F0',
                background: selectedSymbol === s.symbol ? 'rgba(14, 116, 144,0.15)' : 'transparent',
                color: selectedSymbol === s.symbol ? '#0E7490' : '#64748B',
                fontWeight: 600, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
              {s.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Quote header */}
      <div style={{ padding: '16px 16px 0', background: '#F4F6F9' }}>
        {quoteLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            <Skeleton width={120} height={14} />
            <Skeleton width={180} height={36} />
          </div>
        ) : quote && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0B0F19', margin: 0 }}>{quote.symbol}</h1>
              <span style={{ fontSize: 12, color: '#64748B' }}>{quote.exchange}</span>
              {quote.isStale && <span className="stale-tag">Delayed</span>}
              {USE_MOCK && <span className="simulated-tag">SIMULATED</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <p className="mono" style={{ fontSize: 28, fontWeight: 900, color: '#0B0F19', margin: 0, letterSpacing: '-0.5px' }}>
                {formatINR(quote.ltp)}
              </p>
              <Badge variant={quote.changePct >= 0 ? 'positive' : 'negative'}>{formatPct(quote.changePct)}</Badge>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              {[['Open', quote.open], ['High', quote.high], ['Low', quote.low], ['Vol', null]].map(([label, val]) => (
                <div key={label as string} style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 11, color: '#64748B' }}>{label}</span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                    {label === 'Vol' ? formatVolume(quote.volume) : formatINR(val as number)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeframe tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf.value} onClick={() => setTimeframe(tf.value)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: '1px solid',
                borderColor: timeframe === tf.value ? '#0E7490' : 'transparent',
                background: timeframe === tf.value ? 'rgba(14, 116, 144,0.15)' : 'transparent',
                color: timeframe === tf.value ? '#0E7490' : '#64748B',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: 'relative', margin: '12px 0' }}>
        {candlesLoading ? (
          <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
            <Skeleton width="100%" height={320} borderRadius={0} />
          </div>
        ) : (
          <div ref={chartContainerRef} style={{ width: '100%', height: 320 }} />
        )}
      </div>
    </div>
  );
}

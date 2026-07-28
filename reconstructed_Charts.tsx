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
  X,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { useMarketStore } from '../store/marketStore';
import { useOHLCV, useQuote } from '../hooks/useMarketData';
import { Skeleton } from '../components/ui/Skeleton';
import { formatVolume } from '../utils/formatters';
import { searchStocks } from '../api/marketData';
import type { Timeframe } from '../types/market';
import { PriceAlertManager } from '../utils/PriceAlertManager';
import { ChartDrawingOverlay } from '../components/ChartDrawingOverlay';
import { RealTimeClock } from '../components/RealTimeClock';
import type { Drawing, DrawingType } from '../components/ChartDrawingOverlay';
import * as ta from 'ta.js';

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '1D', value: '1d' },
  { label: '1M', value: '1M' },
];

const INDICATORS = ['VOLUME', 'EMA', 'RSI', 'SUPERTREND', 'MACD', 'ATR', 'PIVOT POINTS', 'VWAP'];

const DRAWING_TOOLS = [
  { id: 'cursor', icon: MousePointer2, label: 'CURSOR' },
  { id: 'trend_line', icon: TrendingUp, label: 'TREND LINE' },
  { id: 'horizontal_line', icon: Minus, label: 'HORIZONTAL LINE' },
  { id: 'vertical_line', icon: SeparatorVertical, label: 'VERTICAL LINE' },
  { id: 'parallel_channel', icon: Columns, label: 'PARALLEL CHANNEL' },
  { id: 'fib_retracement', icon: List, label: 'FIB RETRACEMENT' },
  { id: 'rectangle', icon: Square, label: 'RECTANGLE' },
  { id: 'circle', icon: Circle, label: 'CIRCLE' },
  { id: 'long_position', icon: ArrowUpRight, label: 'LONG POSITION' },
  { id: 'short_position', icon: ArrowDownRight, label: 'SHORT POSITION' },
  { id: 'text', icon: Type, label: 'TEXT' },
  { id: 'measure', icon: Ruler, label: 'MEASURE (Ruler)' },
  { id: 'alert', icon: Bell, label: 'PLACE AN ALERT' },
];

const IndicatorLegendRow = ({ ind, value, isHidden, onToggleHide, onRemove, onSettings }: any) => {
  const [hovered, setHovered] = useState(false);
  const baseName = ind.split('-')[0];
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', pointerEvents: 'auto', padding: '2px 0', height: 24 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span>{baseName}</span>
      {value !== undefined && <span style={{ color: '#0B0F19', fontWeight: 600 }}>{value.toFixed(2)}</span>}
      {hovered ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 4, padding: '0 4px', height: 20 }}>
          <button onClick={onToggleHide} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}>
            {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button onClick={onSettings} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}>
            <Settings size={14} />
          </button>
          <button onClick={onRemove} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}>
            <Trash2 size={14} />
          </button>
          <button style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}>
            <MoreHorizontal size={14} />
          </button>
        </div>
      ) : isHidden ? (
        <EyeOff size={14} color="#94A3B8" />
      ) : null}
    </div>
  );
};

export default function Charts() {
  const navigate = useNavigate();
  const { selectedSymbol, selectedExchange, setSelectedSymbol } = useMarketStore();
  const fullScreenRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<Record<string, any>>({});
  const alertManager = useRef(new PriceAlertManager());
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof searchStocks>>([]);

  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [isIndicatorsOpen, setIsIndicatorsOpen] = useState(false);
  const [isChartTypeOpen, setIsChartTypeOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [hiddenIndicators, setHiddenIndicators] = useState<string[]>([]);
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);
  const [indicatorSearch, setIndicatorSearch] = useState('');
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingType>('cursor');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Alert Modal State
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertForm, setAlertForm] = useState({ condition: 'above', value: '' });

  // Interval Modal State
  const [isIntervalModalOpen, setIsIntervalModalOpen] = useState(false);
  const [intervalInput, setIntervalInput] = useState('');
  
  // Option Chain State
  const [isOptionChainOpen, setIsOptionChainOpen] = useState(false);
  
  // Candle Settings State
  const [candleSettings, setCandleSettings] = useState({
    bodyVisible: true,
    bodyUpColor: '#10B981',
    bodyDownColor: '#EF4444',
    borderVisible: true,
    borderUpColor: '#10B981',
    borderDownColor: '#EF4444',
    wickVisible: true,
    wickUpColor: '#10B981',
    wickDownColor: '#EF4444',
  });
  const [tempCandleSettings, setTempCandleSettings] = useState(candleSettings);
  const [isChartSettingsModalOpen, setIsChartSettingsModalOpen] = useState(false);
  
  // Volume Settings State
  const [volumeSettings, setVolumeSettings] = useState({
    upColor: '#10B981',
    downColor: '#EF4444'
  });
  const [tempVolumeSettings, setTempVolumeSettings] = useState(volumeSettings);
  const [isVolumeSettingsModalOpen, setIsVolumeSettingsModalOpen] = useState(false);

  // RSI Settings State
  const [rsiSettings, setRsiSettings] = useState({
    length: 14,
    smoothingLine: 'SMA',
    smoothingLength: 14,
    plot: true,
    plotColor: '#7e57c2',
    plotLineWidth: 2,
    smoothedMA: false,
    smoothedMAColor: '#64b5f6',
    upperLimit: true,
    upperLimitColor: '#787b86',
    upperLimitValue: 70,
    upperLimitLineStyle: 2,
    middleLimit: true,
    middleLimitColor: '#787b86',
    middleLimitValue: 50,
    middleLimitLineStyle: 2,
    lowerLimit: true,
    lowerLimitColor: '#787b86',
    lowerLimitValue: 30,
    lowerLimitLineStyle: 2,
    hlinesBackground: true,
    hlinesBackgroundColor: '#e0e0e0',
  });
  const prevRsiSettings = useRef(rsiSettings);
  const [tempRsiSettings, setTempRsiSettings] = useState(rsiSettings);
  const [isRsiSettingsModalOpen, setIsRsiSettingsModalOpen] = useState(false);
  const [rsiSettingsActiveTab, setRsiSettingsActiveTab] = useState('Inputs');
  
  interface ChartHistorySnapshot {
    drawings: Drawing[];
    activeIndicators: string[];
    rsiSettings: any;
    volumeSettings: any;
    candleSettings: any;
  }
  
  // Undo/Redo State
  const [history, setHistory] = useState<ChartHistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyIndexRef = useRef(-1);













































































































                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    minHeight: 0,
                    gridColumn,
                    gridRow
                  }}
                >
                  <ChartPane
                  paneId={pane.id}
                  symbol={pane.symbol}
                  exchange={pane.exchange}
                  timeframe={pane.timeframe}
                  isActive={activePaneId === pane.id}
                  onClick={() => setActivePaneId(pane.id)}
                  activeDrawingTool={activeDrawingTool}
                  setActiveDrawingTool={setActiveDrawingTool}
                  syncOptions={syncOptions}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}





















































      return next;
    });
  };

  const filteredIndicators = INDICATORS.filter(ind => ind.toLowerCase().includes(indicatorSearch.toLowerCase()));

  // Setup the chart and add standard series + indicators
  useEffect(() => {
    if (!chartContainerRef.current || !candles || candles.length === 0) return;

    const initChart = async () => {
      try {
        const { createChart, CandlestickSeries, LineSeries } = await import('lightweight-charts');

        if (chartRef.current) {
          (chartRef.current as { remove: () => void }).remove();
          chartRef.current = null;
          seriesRef.current = {};
        }

        const width = chartContainerRef.current!.clientWidth || 400;
        const height = chartContainerRef.current!.clientHeight || 320;
        setContainerSize({ width, height });

        const chart = createChart(chartContainerRef.current!, {
          width,
          height,
          layout: { background: { color: '#FFFFFF' }, textColor: '#475569' },
          grid: { vertLines: { color: '#F8FAFC' }, horzLines: { color: '#F8FAFC' } },
          crosshair: { mode: 0 },
        const chart = createChart(chartContainerRef.current!, {
          width,
          height,
          layout: { background: { color: '#FFFFFF' }, textColor: '#475569' },
          grid: { vertLines: { color: '#F8FAFC' }, horzLines: { color: '#F8FAFC' } },
          crosshair: { mode: 0 },
          rightPriceScale: { borderColor: '#E2E8F0' },
          timeScale: { borderColor: '#E2E8F0', timeVisible: true },
        });

        const timeFormat = (c: any) => c.time as unknown as import('lightweight-charts').UTCTimestamp;

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: candleSettings.bodyVisible ? candleSettings.bodyUpColor : 'transparent', 
          downColor: candleSettings.bodyVisible ? candleSettings.bodyDownColor : 'transparent', 
          borderUpColor: candleSettings.borderUpColor, 
          borderDownColor: candleSettings.borderDownColor, 
          wickUpColor: candleSettings.wickUpColor, 
          wickDownColor: candleSettings.wickDownColor,
          borderVisible: candleSettings.borderVisible,
          wickVisible: candleSettings.wickVisible,
          visible: chartType === 'candle'
        });
        candlestickSeries.setData(candles.map(c => ({ time: timeFormat(c), open: c.open, high: c.high, low: c.low, close: c.close })));
        seriesRef.current['candlestick'] = candlestickSeries;

        const lineSeries = chart.addSeries(LineSeries, { color: '#0E7490', lineWidth: 2, visible: chartType === 'line' });
        lineSeries.setData(candles.map(c => ({ time: timeFormat(c), value: c.close })));
        seriesRef.current['line'] = lineSeries;

        // Indicators are now added dynamically via a separate useEffect

        chart.timeScale().fitContent();

        // Subscription for crosshair move to update OHLC legend
        chart.subscribeCrosshairMove((param: any) => {
          if (param.time && param.seriesData && param.seriesData.size > 0) {
            isHoveringRef.current = true;
            const data = param.seriesData.get(candlestickSeries) || param.seriesData.get(lineSeries);
            if (data) {
              const candleIndex = candles.findIndex(c => c.time === param.time);
                close: data.close ?? data.value,
                volume: candles[candleIndex]?.volume,
                prevClose: prevCandle?.close,
              });
            }

            const newIndicatorValues: Record<string, number> = {};
            Object.keys(seriesRef.current).forEach(id => {
              if (id !== 'candlestick' && id !== 'line') {
                const series = seriesRef.current[id];
                if (series) {
                  const seriesData = param.seriesData.get(series);
                  if (seriesData && seriesData.value !== undefined) {
                    newIndicatorValues[id] = seriesData.value;
                  }
                }
              }
            });
            setIndicatorValues(newIndicatorValues);

          } else {
            isHoveringRef.current = false;
            const newCandle = { ...candles![candles!.length - 1] };
            const prev = candles.length > 1 ? candles[candles.length - 2] : null;
            if (newCandle) {
              setHoveredCandle({
                open: newCandle.open, high: newCandle.high, low: newCandle.low, close: newCandle.close,
                volume: newCandle.volume, prevClose: prev?.close,
              });
            } else {
              setHoveredCandle(null);
            }
            
            const newIndicatorValues: Record<string, number> = {};
            Object.keys(seriesRef.current).forEach(id => {
              if (id !== 'candlestick' && id !== 'line') {
                const series = seriesRef.current[id];
                if (series && typeof series.data === 'function') {
                  const data = series.data();
                  if (data && data.length > 0) {
                    newIndicatorValues[id] = data[data.length - 1].value ?? data[data.length - 1].close;
                  }
                }
              }
            });
            setIndicatorValues(newIndicatorValues);
          }
        });

        const latest = candles[candles.length - 1];
        const prev = candles.length > 1 ? candles[candles.length - 2] : null;
        if (latest) {
          setHoveredCandle({
            open: latest.open, high: latest.high, low: latest.low, close: latest.close,
            volume: latest.volume, prevClose: prev?.close,
          });
        }
        setIndicatorValues({});

        chartRef.current = chart;

        const resizeObserver = new ResizeObserver(entries => {
          if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
          const newRect = entries[0].contentRect;
          chart.applyOptions({ width: newRect.width, height: newRect.height });
          setContainerSize({ width: newRect.width, height: newRect.height });
        });
        resizeObserver.observe(chartContainerRef.current!);
        
        return () => {
          resizeObserver.disconnect();
        };
      } catch (err) {
        console.error('Chart init error:', err);
      }
    };

initChart();
  }, [candles]);

// Dynamic Indicator Management
useEffect(() => {
  if (!chartRef.current || !candles || candles.length === 0) return;

  let isMounted = true;

  const updateIndicators = async () => {
    const { LineSeries, HistogramSeries, BaselineSeries } = await import('lightweight-charts');
    if (!isMounted || !chartRef.current) return;
    const chart = chartRef.current as any;
    
    // Check if RSI settings changed and clear stale ones
    if (JSON.stringify(prevRsiSettings.current) !== JSON.stringify(rsiSettings)) {
       Object.keys(seriesRef.current).forEach(id => {
         if (id.startsWith('RSI')) {
            try { chart.removeSeries(seriesRef.current[id]); } catch(e){}
            delete seriesRef.current[id];
         }
       });
       prevRsiSettings.current = rsiSettings;
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const timeFormat = (c: any) => c.time as any;

    // Add missing indicators
    for (const id of activeIndicators) {
      if (!seriesRef.current[id]) {
        const type = id.split('-')[0];
        let series;
        if (type === 'VOLUME') {
          series = chart.addSeries(HistogramSeries, { color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: '' });
          series.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
          series.setData(candles.map((c: any) => ({ 
            time: timeFormat(c), 
            value: c.volume || 0,
            color: c.close >= c.open ? volumeSettings.upColor : volumeSettings.downColor
          })));
        } else if (type === 'EMA') {
          series = chart.addSeries(LineSeries, { color: '#FFA500', lineWidth: 2 });
          const emaData = (ta as any).ema(closes, 14) || [];
          series.setData(candles.map((c: any, i: number) => ({ time: timeFormat(c), value: emaData[i] || c.close })));
        } else if (type === 'RSI') {
          const rsiCalc = new RSICalculator(rsiSettings.length, rsiSettings.smoothingLine);
          const rsiValues = rsiCalc.calculate(closes);
          const rsiData = candles.map((c: any, i: number) => ({ time: timeFormat(c), value: rsiValues[i] !== undefined ? rsiValues[i] : 50 }));
          
          const extendedLimitData = [...rsiData];
          if (rsiData.length > 0) {
            let lastTime = rsiData[rsiData.length - 1].time as number;
            let interval = 900;
            if (rsiData.length > 1) {
               interval = (rsiData[rsiData.length - 1].time as number) - (rsiData[rsiData.length - 2].time as number);
            }
            for (let i = 1; i <= 500; i++) {
               extendedLimitData.push({ time: (lastTime + interval * i) as any, value: 50 });
            }
          }
          
          // Solid white background for the entire RSI pane (0 to 100) to engulf candles completely
          const mainBgSeries = chart.addSeries(BaselineSeries, {
            priceScaleId: 'left',
            baseValue: { type: 'price', price: 0 },
            topFillColor1: '#ffffff',
            topFillColor2: '#ffffff',
            bottomFillColor1: '#ffffff',
            bottomFillColor2: '#ffffff',
            topLineColor: 'transparent',
            bottomLineColor: 'transparent',
            lineWidth: 0,
            crosshairMarkerVisible: false,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          mainBgSeries.setData(extendedLimitData.map(d => ({ time: d.time, value: 100 })));
          seriesRef.current[`${id}-mainbg`] = mainBgSeries;

          if (rsiSettings.hlinesBackground) {
            const hexColor = rsiSettings.hlinesBackgroundColor || '#e0e0e0';
            const bgFillColor = hexColor; 
            
            const bgSeries = chart.addSeries(BaselineSeries, {
              priceScaleId: 'left',
              baseValue: { type: 'price', price: rsiSettings.lowerLimitValue },
              topFillColor1: bgFillColor,
              topFillColor2: bgFillColor,
              bottomFillColor1: 'transparent',
              bottomFillColor2: 'transparent',
              topLineColor: 'transparent',
              bottomLineColor: 'transparent',
              lineWidth: 0,
              crosshairMarkerVisible: false,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            bgSeries.setData(extendedLimitData.map(d => ({ time: d.time, value: rsiSettings.upperLimitValue })));
            seriesRef.current[`${id}-bg`] = bgSeries;
          }

          if (rsiSettings.upperLimit) {
            const upperLine = chart.addSeries(LineSeries, {
              priceScaleId: 'left',
              color: rsiSettings.upperLimitColor,
              lineWidth: 1,
              lineStyle: rsiSettings.upperLimitLineStyle,
              crosshairMarkerVisible: false,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            upperLine.setData(extendedLimitData.map(d => ({ time: d.time, value: rsiSettings.upperLimitValue })));
            seriesRef.current[`${id}-upper`] = upperLine;
          }

          if (rsiSettings.middleLimit) {
            const middleLine = chart.addSeries(LineSeries, {
              priceScaleId: 'left',
              color: rsiSettings.middleLimitColor,
              lineWidth: 1,
              lineStyle: rsiSettings.middleLimitLineStyle,
              crosshairMarkerVisible: false,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            middleLine.setData(extendedLimitData.map(d => ({ time: d.time, value: rsiSettings.middleLimitValue })));
            seriesRef.current[`${id}-middle`] = middleLine;
          }

          if (rsiSettings.lowerLimit) {
            const lowerLine = chart.addSeries(LineSeries, {
              priceScaleId: 'left',
              color: rsiSettings.lowerLimitColor,
              lineWidth: 1,
              lineStyle: rsiSettings.lowerLimitLineStyle,
              crosshairMarkerVisible: false,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            lowerLine.setData(extendedLimitData.map(d => ({ time: d.time, value: rsiSettings.lowerLimitValue })));
            seriesRef.current[`${id}-lower`] = lowerLine;
          }

          if (rsiSettings.smoothedMA) {
             const maCalc = new RSICalculator(rsiSettings.smoothingLength, rsiSettings.smoothingLine);
             const validRsi = rsiValues.filter(v => v !== undefined);
             const maValues = maCalc.smooth(validRsi, rsiSettings.smoothingLength);
             let maDataIndex = 0;
             const maData = rsiData.map((d, i) => {
          if (rsiSettings.smoothedMA) {
             const maCalc = new RSICalculator(rsiSettings.smoothingLength, rsiSettings.smoothingLine);
             const validRsi = rsiValues.filter(v => v !== undefined);
             const maValues = maCalc.smooth(validRsi, rsiSettings.smoothingLength);
             let maDataIndex = 0;
             const maData = rsiData.map((d, i) => {
                if (i < rsiSettings.smoothingLength - 1) return undefined;
                return { time: d.time, value: maValues[maDataIndex++] };
             }).filter(d => d !== undefined);
             
             const maSeries = chart.addSeries(LineSeries, {
               priceScaleId: 'left',
               color: rsiSettings.smoothedMAColor,
               lineWidth: 2,
               crosshairMarkerVisible: false,
               priceLineVisible: false,
               lastValueVisible: false,
             });
             maSeries.setData(maData as any);
             seriesRef.current[`${id}-ma`] = maSeries;
          }

          const topBorder = chart.addSeries(LineSeries, {
              priceScaleId: 'left',
              color: '#f0f0f0',
              lineWidth: 1,
              lineStyle: 0,
              crosshairMarkerVisible: false,
              priceLineVisible: false,
              lastValueVisible: false,
          });
          topBorder.setData(extendedLimitData.map(d => ({ time: d.time, value: 100 })));
          seriesRef.current[`${id}-border`] = topBorder;

          series = chart.addSeries(LineSeries, { 
            color: rsiSettings.plotColor, 
            lineWidth: rsiSettings.plotLineWidth,
            priceScaleId: 'left',
            visible: rsiSettings.plot,
            priceLineVisible: false,
          });
        } else if (type === 'SUPERTREND') {
          series = chart.addSeries(LineSeries, { color: '#00AA00', lineWidth: 2 });
          series.setData(candles.map((c: any) => ({ time: timeFormat(c), value: c.close })));
        } else if (type === 'MACD') {
          series = chart.addSeries(LineSeries, { color: '#4C72B0', lineWidth: 2 });
          const macdData = (ta as any).macd(closes, 12, 26, 9) || [];
          series.setData(candles.map((c: any, i: number) => ({ time: timeFormat(c), value: macdData[i] || 0 })));
        } else if (type === 'ATR') {
          series = chart.addSeries(LineSeries, { color: '#9B59B6', lineWidth: 2 });
          const atrData = (ta as any).atr(highs, lows, closes, 14) || [];
          series.setData(candles.map((c: any, i: number) => ({ time: timeFormat(c), value: atrData[i] || 0 })));
        } else if (type === 'PIVOT POINTS') {
          series = chart.addSeries(LineSeries, { color: '#FFD700', lineWidth: 2 });
          series.setData(candles.map((c: any) => ({ time: timeFormat(c), value: (c.high + c.low + c.close) / 3 })));
        } else if (type === 'VWAP') {
          series = chart.addSeries(LineSeries, { color: '#AA00AA', lineWidth: 2 });
          series.setData(candles.map((c: any) => ({ time: timeFormat(c), value: c.close })));
        }

        if (series) {
          series.applyOptions({ visible: !hiddenIndicators.includes(id) });
          seriesRef.current[id] = series;
        }
      } else {
        seriesRef.current[id].applyOptions({ visible: !hiddenIndicators.includes(id) });
      }
    }

    // Remove stale indicators
    const activeIds = new Set(activeIndicators);
    Object.keys(seriesRef.current).forEach(id => {
      let baseId = id;
      ['-mainbg', '-bg', '-upper', '-middle', '-lower', '-ma', '-border'].forEach(suffix => {
        if (id.endsWith(suffix)) baseId = id.slice(0, -suffix.length);
      });
      if (baseId !== 'candlestick' && baseId !== 'line' && !activeIds.has(baseId)) {
        try {
          chart.removeSeries(seriesRef.current[id]);
        } catch (e) {
          console.error('Error removing series', e);
        }
        delete seriesRef.current[id];
      }
    });

    if (!isHoveringRef.current) {
      const newIndicatorValues: Record<string, number> = {};
      Object.keys(seriesRef.current).forEach(id => {
        if (id !== 'candlestick' && id !== 'line') {
          const series = seriesRef.current[id];
          if (series && typeof series.data === 'function') {
            const data = series.data();
            if (data && data.length > 0) {
              newIndicatorValues[id] = data[data.length - 1].value ?? data[data.length - 1].close;
            }
          }
        }
      });
      setIndicatorValues(newIndicatorValues);
    }
  };

  updateIndicators();

  return () => { isMounted = false; };
}, [activeIndicators, hiddenIndicators, candles, rsiSettings]);

  // Cleanup history
  useEffect(() => {
    return () => {
      (chartRef.current as any)?.remove();
    }
  }, []);

  // Apply Candle Settings Dynamically
  useEffect(() => {
    if (!candles) return;
    if (seriesRef.current['candlestick']) {
      seriesRef.current['candlestick'].applyOptions({
        upColor: candleSettings.bodyVisible ? candleSettings.bodyUpColor : 'transparent',
        downColor: candleSettings.bodyVisible ? candleSettings.bodyDownColor : 'transparent',
        borderUpColor: candleSettings.borderUpColor,
        borderDownColor: candleSettings.borderDownColor,
        wickUpColor: candleSettings.wickUpColor,
        wickDownColor: candleSettings.wickDownColor,
        borderVisible: candleSettings.borderVisible,
        wickVisible: candleSettings.wickVisible,
      });
    }
    



















        seriesRef.current[id].setData(candles.map((c: any) => ({ 
          time: timeFormat(c), 
          value: c.volume || 0,
          color: c.close >= c.open ? volumeSettings.upColor : volumeSettings.downColor
        })));
      }
    });
  }, [candleSettings, volumeSettings, candles]);

useEffect(() => {
  if (!chartRef.current) return;
  if (seriesRef.current['candlestick']) {
    seriesRef.current['candlestick'].applyOptions({ visible: chartType === 'candle' });
  }
  if (seriesRef.current['line']) {
    seriesRef.current['line'].applyOptions({ visible: chartType === 'line' });
  }
}, [chartType]);

// Alert simulation update
useEffect(() => {
  if (hoveredCandle) {
    const triggeredIds = alertManager.current.checkAlerts(selectedSymbol, hoveredCandle.close);
    if (triggeredIds && triggeredIds.length > 0) {
      setAlerts(prev => prev.filter(a => !triggeredIds.includes(a.id)));
    }
  }
}, [hoveredCandle, alertManager, selectedSymbol]);

const candleChange = hoveredCandle?.prevClose
  ? hoveredCandle.close - hoveredCandle.prevClose
  : (hoveredCandle ? hoveredCandle.close - hoveredCandle.open : 0);
const candleChangePct = hoveredCandle?.prevClose
  ? (candleChange / hoveredCandle.prevClose) * 100
  : (hoveredCandle ? (candleChange / hoveredCandle.open) * 100 : 0);
const isPositive = candleChange >= 0;

return (
  <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
    {/* Symbol selector */}
    <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', position: 'relative', flexShrink: 0, background: '#FFFFFF' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search symbol..."
            className="input-base"
            style={{ paddingLeft: 36, paddingTop: 10, paddingBottom: 10, width: '100%' }}
          />
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50,
              background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
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
    </div>

    {/* Fullscreen Wrapper */}
    <div ref={fullScreenRef} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#FFFFFF' }}>
      {/* Sub-header (Toolbar Area) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 16px', borderBottom: '1px solid #E2E8F0', flexShrink: 0, overflow: 'visible', flexWrap: 'wrap', background: '#FFFFFF' }}>

        {/* Timeframe tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf.value} onClick={() => setTimeframe(tf.value)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: '1px solid',
                borderColor: timeframe === tf.value ? '#0E7490' : 'transparent',
                background: timeframe === tf.value ? 'rgba(14, 116, 144,0.1)' : 'transparent',
                color: timeframe === tf.value ? '#0E7490' : '#64748B',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>
              {tf.label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: '#E2E8F0', flexShrink: 0 }} />
        
        {/* Undo / Redo */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={handleUndo}
            disabled={historyIndex === 0}
            title="Undo (Ctrl+Z)"
            style={{
              padding: '6px', borderRadius: 8, border: '1px solid transparent',
              background: 'transparent', color: historyIndex === 0 ? '#CBD5E1' : '#475569',
              cursor: historyIndex === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            title="Redo (Ctrl+Y)"
            style={{
              padding: '6px', borderRadius: 8, border: '1px solid transparent',
              background: 'transparent', color: historyIndex === history.length - 1 ? '#CBD5E1' : '#475569',
              cursor: historyIndex === history.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
          </button>
        </div>
        
        {/* Option Chain */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsOptionChainOpen(!isOptionChainOpen)}
            title="Option Chain"
            style={{
              padding: '6px 8px', borderRadius: 8, border: '1px solid transparent',
              background: isOptionChainOpen ? '#F1F5F9' : 'transparent', color: '#475569',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600
            }}
            onMouseEnter={(e) => { if (!isOptionChainOpen) e.currentTarget.style.background = '#F8FAFC'; }}
            onMouseLeave={(e) => { if (!isOptionChainOpen) e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="4" x2="12" y2="20" />
              <line x1="4" y1="6" x2="10" y2="6" />
              <line x1="6" y1="10" x2="10" y2="10" />
              <line x1="8" y1="14" x2="10" y2="14" />
              <line x1="14" y1="10" x2="18" y2="10" />
              <line x1="14" y1="14" x2="20" y2="14" />
              <line x1="14" y1="18" x2="22" y2="18" />
            </svg>


























































































































































































































































        {/* Chart Container */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', border: '1px solid black', borderRadius: '4px' }}>
          {/* TradingView Style Legend Overlay */}
          {hoveredCandle && quote && (
            <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none' }}>
              {/* Symbol & Timeframe */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 16, fontWeight: 700, color: '#0B0F19' }}>
                <span>{(quote as any).companyName || quote.symbol}</span>
                <span style={{ color: '#94A3B8', fontSize: 14 }}>•</span>
                <span style={{ fontSize: 14 }}>{timeframe}</span>
                <span style={{ color: '#94A3B8', fontSize: 14 }}>•</span>
                <span style={{ fontSize: 14, color: '#64748B' }}>{quote.exchange}</span>
              </div>

              {/* OHLCV Data */}
              <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569', flexWrap: 'wrap' }}>
                <span>O <span style={{ fontWeight: 600, color: '#0B0F19' }}>{hoveredCandle.open.toFixed(2)}</span></span>
                <span>H <span style={{ fontWeight: 600, color: '#0B0F19' }}>{hoveredCandle.high.toFixed(2)}</span></span>
                <span>L <span style={{ fontWeight: 600, color: '#0B0F19' }}>{hoveredCandle.low.toFixed(2)}</span></span>
                <span>C <span style={{ fontWeight: 600, color: '#0B0F19' }}>{hoveredCandle.close.toFixed(2)}</span></span>
                <span style={{ fontWeight: 600, color: isPositive ? '#10B981' : '#EF4444' }}>
                  {isPositive ? '+' : ''}{candleChange.toFixed(2)} ({isPositive ? '+' : ''}{candleChangePct.toFixed(2)}%)
                </span>
                {hoveredCandle.volume !== undefined && (
                  <span>Vol <span style={{ fontWeight: 600, color: '#0B0F19' }}>{formatVolume(hoveredCandle.volume)}</span></span>
                )}
              </div>

              {/* Buy/Sell Options */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto', marginTop: 4 }}>
                <button
                  onClick={() => navigate('/trade')}
                  style={{ background: '#fff', border: '1px solid #EF4444', color: '#EF4444', padding: '2px 8px', borderRadius: 4, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                >
                  {hoveredCandle.close.toFixed(2)}
                </button>
                <span style={{ fontSize: 12, color: '#475569' }}>0.00</span>
                <button
                  onClick={() => navigate('/trade')}
                  style={{ background: '#fff', border: '1px solid #10B981', color: '#10B981', padding: '2px 8px', borderRadius: 4, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                >
                  {hoveredCandle.close.toFixed(2)}
                </button>
              </div>

              {/* Indicator Legend */}
              {activeIndicators.length > 0 && (
                <div style={{ pointerEvents: 'auto', marginTop: 4 }}>
                  <button
                    onClick={() => setIsLegendExpanded(!isLegendExpanded)}
                    style={{ background: '#fff', border: '1px solid #E2E8F0', padding: '2px 6px', borderRadius: 4, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#0F172A' }}
                  >
                    {isLegendExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {activeIndicators.length}
                  </button>
                  {isLegendExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 6, gap: 2 }}>
                      {activeIndicators.map(ind => (
                        <IndicatorLegendRow
                          key={ind}
                          ind={ind}
                          value={indicatorValues[ind]}
                          isHidden={hiddenIndicators.includes(ind)}
                          onToggleHide={() => {
                            setHiddenIndicators(prev =>
                              prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
                            );
                          }}
                          onRemove={() => {
                            setActiveIndicators(prev => {
                              const next = prev.filter(i => i !== ind);
                              pushToHistory({ activeIndicators: next });
                              return next;
                            });
                          }}
                          onSettings={() => {
                            if (ind.startsWith('VOLUME')) {
                              setTempVolumeSettings(volumeSettings);
                              setIsVolumeSettingsModalOpen(true);
                            } else if (ind.startsWith('RSI')) {
                              setTempRsiSettings(rsiSettings);
                              setRsiSettingsActiveTab('Inputs');
                              setIsRsiSettingsModalOpen(true);
                            }
                          }}
                        />
              {containerSize.width > 0 && containerSize.height > 0 && (
                <ChartDrawingOverlay
                  chart={chartRef.current as any}
                  series={seriesRef.current['candlestick'] || null}
                  activeTool={activeDrawingTool}
                  setActiveTool={setActiveDrawingTool}
                  drawings={drawings}
                  setDrawings={setDrawings}
                  onHistoryCommit={commitHistory}
                  triggerResize={containerSize.width + containerSize.height}













































              {containerSize.width > 0 && containerSize.height > 0 && (
                <ChartDrawingOverlay
                  chart={chartRef.current as any}
                  series={seriesRef.current['candlestick'] || null}
                  activeTool={activeDrawingTool}
                  setActiveTool={setActiveDrawingTool}
                  drawings={drawings}
                  setDrawings={setDrawings}
                  onHistoryCommit={commitHistory}
                  triggerResize={containerSize.width + containerSize.height}
                  currentPrice={candles && candles.length > 0 ? candles[candles.length - 1].close : undefined}
                  candles={candles}
                  alerts={alerts}
                  onRemoveAlert={(id) => setAlerts(prev => prev.filter(a => a.id !== id))}
                />
              )}
              <RealTimeClock />
            </>
          )}
        </div>
      </div>
      
      {/* Alert Modal */}
      {isAlertModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Create alert on {(quote as any)?.companyName || selectedSymbol}</h3>
              <button onClick={() => setIsAlertModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                style={{ padding: '8px 24px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 15, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#0E7490'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interval Modal */}
      {isIntervalModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '24px 32px', width: 320, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Change interval</h3>
              <Info size={16} color="#94A3B8" />
            </div>
            
            <input 
              autoFocus
              type="text" 
              value={intervalInput}
              onChange={(e) => setIntervalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = intervalInput.toUpperCase();
                  let mapped = '';
                  if (val === '1') mapped = '1m';
                  else if (val === '5') mapped = '5m';
                  else if (val === '15') mapped = '15m';
                  else if (val === '1H') mapped = '1h';
                  else if (val === '1D') mapped = '1d';
                  else if (val === '1M') mapped = '1M';
                  
                  if (mapped) {
                    setTimeframe(mapped as any);
                  }
                  setIsIntervalModalOpen(false);
                } else if (e.key === 'Escape') {
                  setIsIntervalModalOpen(false);
                }
              }}
              style={{ width: '100%', padding: '12px', border: '2px solid #3B82F6', borderRadius: 8, fontSize: 18, color: '#0F172A', outline: 'none', textAlign: 'center', marginBottom: 8 }} 
            />
            
            <span style={{ fontSize: 13, color: '#64748B' }}>
              {intervalInput === '1' ? '1 minute' : 
               intervalInput === '5' ? '5 minutes' : 
               intervalInput === '15' ? '15 minutes' : 
               intervalInput.toUpperCase() === '1H' ? '1 hour' : 
               intervalInput.toUpperCase() === '1D' ? '1 day' : 
               intervalInput.toUpperCase() === '1M' ? '1 month' : 
               'Invalid interval'}
            </span>
          </div>
        </div>
      )}
      
      {/* Chart Settings Modal */}
      {isChartSettingsModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ background: '#fff', borderRadius: 8, width: 360, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E2E8F0', position: 'relative' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Candle Setting</h3>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, letterSpacing: 0.5, marginBottom: 20 }}>CANDLES</div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <input type="checkbox" checked={tempCandleSettings.bodyVisible} onChange={(e) => setTempCandleSettings({...tempCandleSettings, bodyVisible: e.target.checked})} style={{ width: 20, height: 20, accentColor: '#3b82f6', cursor: 'pointer' }} />
                <span style={{ fontSize: 15, color: '#0F172A', flex: 1 }}>Body</span>
                <input type="color" value={tempCandleSettings.bodyUpColor} onChange={(e) => setTempCandleSettings({...tempCandleSettings, bodyUpColor: e.target.value})} style={{ width: 36, height: 36, padding: 0, border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer' }} />
                <input type="color" value={tempCandleSettings.bodyDownColor} onChange={(e) => setTempCandleSettings({...tempCandleSettings, bodyDownColor: e.target.value})} style={{ width: 36, height: 36, padding: 0, border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <input type="checkbox" checked={tempCandleSettings.borderVisible} onChange={(e) => setTempCandleSettings({...tempCandleSettings, borderVisible: e.target.checked})} style={{ width: 20, height: 20, accentColor: '#3b82f6', cursor: 'pointer' }} />
                <span style={{ fontSize: 15, color: '#0F172A', flex: 1 }}>Borders</span>
                <input type="color" value={tempCandleSettings.borderUpColor} onChange={(e) => setTempCandleSettings({...tempCandleSettings, borderUpColor: e.target.value})} style={{ width: 36, height: 36, padding: 0, border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer' }} />
                <input type="color" value={tempCandleSettings.borderDownColor} onChange={(e) => setTempCandleSettings({...tempCandleSettings, borderDownColor: e.target.value})} style={{ width: 36, height: 36, padding: 0, border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <input type="checkbox" checked={tempCandleSettings.wickVisible} onChange={(e) => setTempCandleSettings({...tempCandleSettings, wickVisible: e.target.checked})} style={{ width: 20, height: 20, accentColor: '#3b82f6', cursor: 'pointer' }} />
                <span style={{ fontSize: 15, color: '#0F172A', flex: 1 }}>Wick</span>
                <input type="color" value={tempCandleSettings.wickUpColor} onChange={(e) => setTempCandleSettings({...tempCandleSettings, wickUpColor: e.target.value})} style={{ width: 36, height: 36, padding: 0, border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer' }} />
                <input type="color" value={tempCandleSettings.wickDownColor} onChange={(e) => setTempCandleSettings({...tempCandleSettings, wickDownColor: e.target.value})} style={{ width: 36, height: 36, padding: 0, border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer' }} />
              </div>
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { setIsChartSettingsModalOpen(false); setTempCandleSettings(candleSettings); }} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#0F172A', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setCandleSettings(tempCandleSettings); pushToHistory({ candleSettings: tempCandleSettings }); setIsChartSettingsModalOpen(false); }} style={{ padding: '8px 24px', background: '#3b82f6', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#fff', cursor: 'pointer' }}>Ok</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Volume Settings Modal */}
      {isVolumeSettingsModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ background: '#fff', borderRadius: 8, width: 360, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E2E8F0', position: 'relative' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Volume Bar setting</h3>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <span style={{ fontSize: 15, color: '#0F172A', flex: 1 }}>Bullish Volume</span>
                <input type="color" value={tempVolumeSettings.upColor} onChange={(e) => setTempVolumeSettings({...tempVolumeSettings, upColor: e.target.value})} style={{ width: 36, height: 36, padding: 0, border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 15, color: '#0F172A', flex: 1 }}>Bearish Volume</span>
                <input type="color" value={tempVolumeSettings.downColor} onChange={(e) => setTempVolumeSettings({...tempVolumeSettings, downColor: e.target.value})} style={{ width: 36, height: 36, padding: 0, border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer' }} />
              </div>
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { setIsVolumeSettingsModalOpen(false); setTempVolumeSettings(volumeSettings); }} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#0F172A', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setVolumeSettings(tempVolumeSettings); pushToHistory({ volumeSettings: tempVolumeSettings }); setIsVolumeSettingsModalOpen(false); }} style={{ padding: '8px 24px', background: '#3b82f6', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#fff', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
      
      {/* RSI Settings Modal */}
      {isRsiSettingsModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ background: '#fff', borderRadius: 8, width: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>RSI</h3>
              <button onClick={() => setIsRsiSettingsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', padding: '0 20px', borderBottom: '1px solid #E2E8F0', gap: 24 }}>
              <button 
                onClick={() => setRsiSettingsActiveTab('Inputs')}
                style={{ padding: '8px 0', background: 'none', border: 'none', borderBottom: rsiSettingsActiveTab === 'Inputs' ? '2px solid #0F172A' : '2px solid transparent', fontSize: 15, fontWeight: rsiSettingsActiveTab === 'Inputs' ? 600 : 500, color: rsiSettingsActiveTab === 'Inputs' ? '#0F172A' : '#64748B', cursor: 'pointer' }}
              >Inputs</button>
              <button 
                onClick={() => setRsiSettingsActiveTab('Style')}
                style={{ padding: '8px 0', background: 'none', border: 'none', borderBottom: rsiSettingsActiveTab === 'Style' ? '2px solid #0F172A' : '2px solid transparent', fontSize: 15, fontWeight: rsiSettingsActiveTab === 'Style' ? 600 : 500, color: rsiSettingsActiveTab === 'Style' ? '#0F172A' : '#64748B', cursor: 'pointer' }}
              >Style</button>
            </div>
            
            <div style={{ padding: '24px 20px', flex: 1, minHeight: 250 }}>
              {rsiSettingsActiveTab === 'Inputs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Length</span>
                    <input type="number" value={tempRsiSettings.length} onChange={(e) => setTempRsiSettings({...tempRsiSettings, length: parseInt(e.target.value) || 0})} style={{ width: 120, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Smoothing Line</span>
                    <select value={tempRsiSettings.smoothingLine} onChange={(e) => setTempRsiSettings({...tempRsiSettings, smoothingLine: e.target.value})} style={{ width: 120, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none', background: '#fff' }}>
                      <option value="SMA">SMA</option>
                      <option value="EMA">EMA</option>
                      <option value="WMA">WMA</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Smoothing Length</span>
                    <input type="number" value={tempRsiSettings.smoothingLength} onChange={(e) => setTempRsiSettings({...tempRsiSettings, smoothingLength: parseInt(e.target.value) || 0})} style={{ width: 120, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                  </div>
                </div>
              )}
              {rsiSettingsActiveTab === 'Style' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Plot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempRsiSettings.plot} onChange={(e) => setTempRsiSettings({...tempRsiSettings, plot: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>RSI</span>
                    <input type="color" value={tempRsiSettings.plotColor} onChange={(e) => setTempRsiSettings({...tempRsiSettings, plotColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer' }} />
                    <input type="number" min={1} max={10} value={tempRsiSettings.plotLineWidth} onChange={(e) => setTempRsiSettings({...tempRsiSettings, plotLineWidth: parseInt(e.target.value) || 2})} title="Line Thickness" style={{ width: 60, padding: '6px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 13, outline: 'none' }} />
                  </div>
                  {/* Smoothed MA */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempRsiSettings.smoothedMA} onChange={(e) => setTempRsiSettings({...tempRsiSettings, smoothedMA: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Smoothed MA</span>
                    <input type="color" value={tempRsiSettings.smoothedMAColor} onChange={(e) => setTempRsiSettings({...tempRsiSettings, smoothedMAColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer' }} />
                  </div>
                  {/* UpperLimit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempRsiSettings.upperLimit} onChange={(e) => setTempRsiSettings({...tempRsiSettings, upperLimit: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>UpperLimit</span>
                    <input type="color" value={tempRsiSettings.upperLimitColor} onChange={(e) => setTempRsiSettings({...tempRsiSettings, upperLimitColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer' }} />
                    <select value={tempRsiSettings.upperLimitLineStyle} onChange={(e) => setTempRsiSettings({...tempRsiSettings, upperLimitLineStyle: parseInt(e.target.value)})} style={{ width: 80, padding: '6px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 13, outline: 'none', background: '#fff' }}>
                      <option value={0}>Solid</option>
                      <option value={1}>Dotted</option>
                      <option value={2}>Dashed</option>
                    </select>
                    <input type="number" value={tempRsiSettings.upperLimitValue} onChange={(e) => setTempRsiSettings({...tempRsiSettings, upperLimitValue: parseInt(e.target.value) || 0})} style={{ width: 70, padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 14, outline: 'none' }} />
                  </div>
                  {/* MiddleLimit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempRsiSettings.middleLimit} onChange={(e) => setTempRsiSettings({...tempRsiSettings, middleLimit: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>MiddleLimit</span>
                    <input type="color" value={tempRsiSettings.middleLimitColor} onChange={(e) => setTempRsiSettings({...tempRsiSettings, middleLimitColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer' }} />
                    <select value={tempRsiSettings.middleLimitLineStyle} onChange={(e) => setTempRsiSettings({...tempRsiSettings, middleLimitLineStyle: parseInt(e.target.value)})} style={{ width: 80, padding: '6px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 13, outline: 'none', background: '#fff' }}>
                      <option value={0}>Solid</option>
                      <option value={1}>Dotted</option>
                      <option value={2}>Dashed</option>
                    </select>
                    <input type="number" value={tempRsiSettings.middleLimitValue} onChange={(e) => setTempRsiSettings({...tempRsiSettings, middleLimitValue: parseInt(e.target.value) || 0})} style={{ width: 70, padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 14, outline: 'none' }} />
                  </div>
                  {/* LowerLimit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempRsiSettings.lowerLimit} onChange={(e) => setTempRsiSettings({...tempRsiSettings, lowerLimit: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>LowerLimit</span>
                    <input type="color" value={tempRsiSettings.lowerLimitColor} onChange={(e) => setTempRsiSettings({...tempRsiSettings, lowerLimitColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer' }} />
                    <select value={tempRsiSettings.lowerLimitLineStyle} onChange={(e) => setTempRsiSettings({...tempRsiSettings, lowerLimitLineStyle: parseInt(e.target.value)})} style={{ width: 80, padding: '6px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 13, outline: 'none', background: '#fff' }}>
                      <option value={0}>Solid</option>
                      <option value={1}>Dotted</option>
                      <option value={2}>Dashed</option>
                    </select>
                    <input type="number" value={tempRsiSettings.lowerLimitValue} onChange={(e) => setTempRsiSettings({...tempRsiSettings, lowerLimitValue: parseInt(e.target.value) || 0})} style={{ width: 70, padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 14, outline: 'none' }} />
                  </div>
                  {/* Hlines Background */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={tempRsiSettings.hlinesBackground} onChange={(e) => setTempRsiSettings({...tempRsiSettings, hlinesBackground: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} />
                    <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>Hlines Background</span>
                    <input type="color" value={tempRsiSettings.hlinesBackgroundColor} onChange={(e) => setTempRsiSettings({...tempRsiSettings, hlinesBackgroundColor: e.target.value})} style={{ width: 32, height: 32, padding: 0, border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer' }} />
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { setIsRsiSettingsModalOpen(false); setTempRsiSettings(rsiSettings); }} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#0F172A', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setRsiSettings(tempRsiSettings); pushToHistory({ rsiSettings: tempRsiSettings }); setIsRsiSettingsModalOpen(false); }} style={{ padding: '8px 24px', background: '#3b82f6', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, color: '#fff', cursor: 'pointer' }}>Ok</button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}


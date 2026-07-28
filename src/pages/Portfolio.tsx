// src/pages/Portfolio.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Download, ChevronRight } from 'lucide-react';
import { usePortfolio } from '../hooks/usePortfolio';
import { useTradingStats } from '../hooks/useTradingStats';
import { usePlaceOrder } from '../hooks/useOrders';
import { useMarketStore } from '../store/marketStore';
import { StatCard } from '../components/ui/Card';
import { Skeleton, SkeletonStockRow } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatINR, formatPct, formatPnL } from '../utils/formatters';
import { CTA } from '../utils/constants';

export default function Portfolio() {
  const navigate = useNavigate();
  const { setSelectedSymbol } = useMarketStore();
  const { holdings, isLoading, totalInvested, totalCurrentValue, totalUnrealisedPnL, totalPortfolioValue, balance } = usePortfolio();
  const { stats } = useTradingStats(); // Same hook as Profile uses — data consistency
  const placeOrder = usePlaceOrder();

  const handleExit = (e: React.MouseEvent, h: any) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to exit your entire position of ${h.quantity} shares in ${h.symbol}?`)) {
      placeOrder.mutate({
        symbol: h.symbol,
        exchange: h.exchange,
        companyName: h.companyName || h.symbol,
        side: 'SELL',
        orderType: 'MARKET',
        quantity: h.quantity,
      });
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Symbol', 'Exchange', 'Qty', 'Avg Price', 'Current Price', 'Invested', 'Current Value', 'P&L', 'P&L%'],
      ...holdings.map(h => [h.symbol, h.exchange, h.quantity, h.avgBuyPrice, h.currentPrice ?? '', h.investedValue, h.currentValue ?? '', h.pnl ?? '', h.pnlPct ?? '']),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tradezilla-portfolio.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const portfolioReturn = ((totalPortfolioValue - 100000) / 100000) * 100;

  return (
    <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="section-title">Portfolio</h1>
        <Button variant="secondary" size="sm" onClick={exportCSV} leftIcon={<Download size={14} />}>Export</Button>
      </div>

      {/* Portfolio overview */}
      <div style={{ background: 'linear-gradient(135deg, #FFFFFF, #F8FAFC)', border: '1px solid #E2E8F0', borderRadius: 20, padding: 20 }}>
        {isLoading ? <Skeleton width={200} height={36} /> : (
          <>
            <p style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>TOTAL VALUE</p>
            <p className="mono" style={{ fontSize: 36, fontWeight: 900, color: '#0B0F19', margin: '0 0 4px', letterSpacing: '-1px' }}>{formatINR(totalPortfolioValue)}</p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
              <span className={`mono ${totalUnrealisedPnL >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: 15, fontWeight: 600 }}>
                {formatPnL(totalUnrealisedPnL)}
              </span>
              <Badge variant={portfolioReturn >= 0 ? 'positive' : 'negative'}>{formatPct(portfolioReturn)}</Badge>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[{ l: 'Balance', v: formatINR(balance) }, { l: 'Invested', v: formatINR(totalInvested) }, { l: 'Current', v: formatINR(totalCurrentValue) }].map(x => (
                <div key={x.l} style={{ background: 'rgba(244, 246, 249,0.5)', borderRadius: 10, padding: '10px 10px' }}>
                  <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 3px' }}>{x.l}</p>
                  <p className="mono" style={{ fontSize: 13, fontWeight: 700, color: '#475569', margin: 0 }}>{x.v}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Stats — same useTradingStats hook as Profile page */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <StatCard label="Trades" value={stats.totalTrades} />
          <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} trend={stats.winRate >= 50 ? 'positive' : 'negative'} />
          <StatCard 
            label="Statistics" 
            value="View" 
            icon={<ChevronRight size={18} />} 
            onClick={() => navigate('/statistics')} 
          />
        </div>
      )}

      {/* Holdings */}
      <section>
        <h2 className="section-title" style={{ marginBottom: 12 }}>Holdings ({holdings.length})</h2>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: '4px 16px' }}>
              {Array(4).fill(0).map((_, i) => <SkeletonStockRow key={i} />)}
            </div>
          ) : holdings.length === 0 ? (
            <EmptyState
              icon={<TrendingUp size={24} />}
              title="No holdings yet"
              description="Buy your first stock to start building your portfolio."
              action={{ label: CTA.EXPLORE_STOCKS, onClick: () => navigate('/charts') }}
            />
          ) : (
            holdings.map((h, i) => (
              <button
                key={h.id}
                onClick={() => { setSelectedSymbol(h.symbol, h.exchange); navigate('/trade'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: i < holdings.length - 1 ? '1px solid #E2E8F0' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: (h.pnl ?? 0) >= 0 ? 'rgba(16, 185, 129,0.1)' : 'rgba(239, 68, 68,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: (h.pnl ?? 0) >= 0 ? '#10B981' : '#EF4444',
                }}>
                  {(h.pnl ?? 0) >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                </div>
                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0B0F19', margin: '0 0 2px' }}>{h.symbol}</p>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{h.quantity} shares · Avg {formatINR(h.avgBuyPrice)}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <p className="mono" style={{ fontSize: 14, fontWeight: 700, color: '#0B0F19', margin: 0 }}>{formatINR(h.currentPrice)}</p>
                  <p className={`mono ${(h.pnl ?? 0) >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>
                    {formatPnL(h.pnl)} ({formatPct(h.pnlPct)})
                  </p>
                  <button 
                    onClick={(e) => handleExit(e, h)}
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444', 
                      fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
                      textTransform: 'uppercase', marginTop: 4
                    }}
                  >
                    Exit
                  </button>
                </div>
              </button>
            ))
          )}
        </div>
      </section>
      <div style={{ height: 16 }} />
    </div>
  );
}

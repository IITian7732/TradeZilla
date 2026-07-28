// src/pages/Dashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Briefcase, ArrowRight, RefreshCw } from 'lucide-react';
import { usePortfolio } from '../hooks/usePortfolio';
import { useTradingStats, useRecentTrades } from '../hooks/useTradingStats';
import { useMultipleQuotes } from '../hooks/useMarketData';
import { useAuthStore } from '../store/authStore';
import { useMarketStore } from '../store/marketStore';
import { Card, StatCard } from '../components/ui/Card';
import { Skeleton, SkeletonCard, SkeletonStockRow } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { formatINR, formatPct, formatPnL, formatRelativeTime } from '../utils/formatters';
import { CTA, POPULAR_STOCKS } from '../utils/constants';
import { fetchNews } from '../api/news';
import { useQuery } from '@tanstack/react-query';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true' ||
  !import.meta.env.VITE_SUPABASE_URL;

const TOP_MOVERS = POPULAR_STOCKS.slice(0, 6).map(s => ({ symbol: s.symbol, exchange: s.exchange as 'NSE' | 'BSE' }));

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setSelectedSymbol } = useMarketStore();
  const { holdings, isLoading: portfolioLoading, totalPortfolioValue, totalUnrealisedPnL, balance } = usePortfolio();
  const { stats, isLoading: statsLoading } = useTradingStats();
  const { data: recentTrades = [], isLoading: tradesLoading } = useRecentTrades(5);
  const quotesQuery = useMultipleQuotes(TOP_MOVERS);
  const newsQuery = useQuery({
    queryKey: ['news-preview'],
    queryFn: () => fetchNews(undefined, 1),
    staleTime: 300000,
  });

  const quotes = quotesQuery.data ?? [];
  const news = (newsQuery.data ?? []).slice(0, 3);
  const portfolioReturn = ((totalPortfolioValue - 100000) / 100000) * 100;

  return (
    <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Welcome */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 2px' }}>Good {getGreeting()},</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0B0F19', margin: 0, letterSpacing: '-0.3px' }}>
            {user?.fullName?.split(' ')[0] ?? 'Trader'} 👋
          </h2>
        </div>
        {USE_MOCK && <span className="simulated-tag">SIMULATED</span>}
      </div>

      {/* Portfolio summary card */}
      <div style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        border: '1px solid #E2E8F0', borderRadius: 20, padding: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(14, 116, 144,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(16, 185, 129,0.05)', pointerEvents: 'none' }} />
        {portfolioLoading ? (
          <>
            <Skeleton width={140} height={13} style={{ marginBottom: 8 }} />
            <Skeleton width={180} height={36} style={{ marginBottom: 8 }} />
            <Skeleton width={120} height={14} />
          </>
        ) : (
          <>
            <p style={{ fontSize: 12, color: '#64748B', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>TOTAL PORTFOLIO VALUE</p>
            <p className="mono" style={{ fontSize: 36, fontWeight: 900, color: '#0B0F19', margin: '0 0 4px', letterSpacing: '-1px' }}>
              {formatINR(totalPortfolioValue)}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span className={`mono ${totalUnrealisedPnL >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: 14, fontWeight: 600 }}>
                {formatPnL(totalUnrealisedPnL)}
              </span>
              <Badge variant={portfolioReturn >= 0 ? 'positive' : 'negative'}>
                {formatPct(portfolioReturn)}
              </Badge>
            </div>
            {/* Mini stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Available', value: formatINR(balance) },
                { label: 'Invested', value: formatINR(holdings.reduce((s,h) => s + h.investedValue, 0)) },
                { label: 'Holdings', value: String(holdings.length) + ' stocks' },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(244, 246, 249,0.5)', borderRadius: 10, padding: '10px 10px' }}>
                  <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 3px' }}>{item.label}</p>
                  <p className="mono" style={{ fontSize: 13, fontWeight: 700, color: '#475569', margin: 0 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: CTA.EXPLORE_STOCKS, icon: '📈', action: () => navigate('/charts') },
          { label: CTA.VIEW_PORTFOLIO, icon: '💼', action: () => navigate('/portfolio') },
          { label: CTA.VIEW_ORDERS, icon: '📋', action: () => navigate('/orders') },
        ].map(item => (
          <button key={item.label} onClick={item.action} style={{
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14,
            padding: '14px 10px', cursor: 'pointer', textAlign: 'center',
            transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#0E7490'; e.currentTarget.style.background = 'rgba(14, 116, 144,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FFFFFF'; }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', lineHeight: 1.2 }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Stats row */}
      {(statsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <StatCard label="Trades" value={stats.totalTrades} icon={<RefreshCw size={18} />} />
          <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} trend={stats.winRate >= 50 ? 'positive' : 'negative'} />
          <StatCard label="Best Trade" value={formatINR(stats.bestTradePnl, 0)} trend="positive" />
        </div>
      ) : null)}

      {/* Market movers */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="section-title">Market Movers</h3>
          <button onClick={() => navigate('/charts')} style={{ background: 'none', border: 'none', color: '#0E7490', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            {CTA.EXPLORE_STOCKS} <ArrowRight size={14} />
          </button>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {quotesQuery.isLoading ? (
            <div style={{ padding: '4px 16px' }}>
              {Array(4).fill(0).map((_, i) => <SkeletonStockRow key={i} />)}
            </div>
          ) : quotes.length === 0 ? (
            <EmptyState icon={<TrendingUp size={24} />} title="No market data" description="Market data unavailable. Try again shortly." />
          ) : (
            quotes.map((q, i) => (
              <ErrorBoundary key={q.symbol}>
                <button
                  onClick={() => { setSelectedSymbol(q.symbol, q.exchange); navigate('/trade'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: i < quotes.length - 1 ? '1px solid #E2E8F0' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: q.changePct >= 0 ? 'rgba(16, 185, 129,0.1)' : 'rgba(239, 68, 68,0.1)',
                    border: `1px solid ${q.changePct >= 0 ? 'rgba(16, 185, 129,0.2)' : 'rgba(239, 68, 68,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: q.changePct >= 0 ? '#10B981' : '#EF4444',
                  }}>
                    {q.changePct >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0B0F19', margin: 0 }}>{q.symbol}</p>
                    <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{q.exchange}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="mono" style={{ fontSize: 15, fontWeight: 700, color: '#0B0F19', margin: 0 }}>
                      {formatINR(q.ltp)}
                      {q.isStale && <span className="stale-tag" style={{ marginLeft: 4 }}>stale</span>}
                    </p>
                    <p className={`mono ${q.changePct >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>
                      {formatPct(q.changePct)}
                    </p>
                  </div>
                </button>
              </ErrorBoundary>
            ))
          )}
        </div>
      </section>

      {/* Recent trades */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="section-title">Recent Activity</h3>
          <button onClick={() => navigate('/orders')} style={{ background: 'none', border: 'none', color: '#0E7490', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            All Orders <ArrowRight size={14} />
          </button>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {tradesLoading ? (
            <div style={{ padding: '4px 16px' }}>
              {Array(3).fill(0).map((_, i) => <SkeletonStockRow key={i} />)}
            </div>
          ) : recentTrades.length === 0 ? (
            <EmptyState
              icon={<Briefcase size={24} />}
              title="No trades yet"
              description="Place your first order to start trading."
              action={{ label: CTA.EXPLORE_STOCKS, onClick: () => navigate('/charts') }}
            />
          ) : (
            recentTrades.map((t, i) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderBottom: i < recentTrades.length - 1 ? '1px solid #E2E8F0' : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: t.side === 'BUY' ? 'rgba(16, 185, 129,0.1)' : 'rgba(239, 68, 68,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {t.side === 'BUY' ? '↑' : '↓'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0B0F19', margin: 0 }}>{t.symbol}</p>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                    {t.side} · {t.quantity} shares · {formatRelativeTime(t.tradedAt)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="mono" style={{ fontSize: 13, fontWeight: 700, color: '#475569', margin: 0 }}>{formatINR(t.price)}</p>
                  {t.pnl !== undefined && t.pnl !== null && (
                    <p className={`mono ${t.pnl >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>
                      {formatPnL(t.pnl)}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* News preview */}
      <section style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="section-title">Market News</h3>
          <button onClick={() => navigate('/news')} style={{ background: 'none', border: 'none', color: '#0E7490', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            All News <ArrowRight size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {newsQuery.isLoading ? (
            Array(2).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : news.length === 0 ? (
            <EmptyState icon={<ArrowRight size={24} />} title="No news available" description="Check back soon for the latest market updates." />
          ) : (
            news.map(article => (
              <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div className="card" style={{ display: 'flex', gap: 12, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#0E7490')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#E2E8F0')}>
                  {article.urlToImage && (
                    <img src={article.urlToImage} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0B0F19', margin: '0 0 4px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {article.title}
                    </p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#64748B' }}>{article.source}</span>
                      <span style={{ fontSize: 11, color: '#64748B' }}>·</span>
                      <span style={{ fontSize: 11, color: '#64748B' }}>{formatRelativeTime(article.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </section>

      <div style={{ height: 16 }} />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

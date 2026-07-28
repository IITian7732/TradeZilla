// src/pages/Watchlist.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, TrendingUp, TrendingDown, Plus, Trash2, Bell } from 'lucide-react';
import { useWatchlists, useRemoveFromWatchlist, useAddToWatchlist } from '../hooks/useWatchlist';
import { useMultipleQuotes } from '../hooks/useMarketData';
import { useMarketStore } from '../store/marketStore';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton, SkeletonStockRow } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { formatINR, formatPct } from '../utils/formatters';
import { searchStocks } from '../api/marketData';
import { CTA } from '../utils/constants';

export default function Watchlist() {
  const navigate = useNavigate();
  const { setSelectedSymbol } = useMarketStore();
  const { data: watchlists = [], isLoading } = useWatchlists();
  const removeItem = useRemoveFromWatchlist();
  const addItem = useAddToWatchlist();
  const [activeWlId, setActiveWlId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeWl = watchlists.find(wl => wl.id === (activeWlId ?? watchlists[0]?.id));
  const watchlistItems = activeWl?.items ?? [];
  const symbols = watchlistItems.map(i => ({ symbol: i.symbol, exchange: i.exchange as 'NSE' | 'BSE' }));
  const quotesQuery = useMultipleQuotes(symbols);
  const quotes = quotesQuery.data ?? [];

  const searchResults = searchQuery.length >= 1 ? searchStocks(searchQuery) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Watchlist tabs */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {isLoading ? (
          <Skeleton width={120} height={34} />
        ) : watchlists.length === 0 ? null : (
          <>
            {watchlists.map(wl => (
              <button key={wl.id}
                onClick={() => setActiveWlId(wl.id)}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: '1px solid',
                  borderColor: (activeWlId ?? watchlists[0]?.id) === wl.id ? '#0E7490' : '#E2E8F0',
                  background: (activeWlId ?? watchlists[0]?.id) === wl.id ? 'rgba(14, 116, 144,0.15)' : 'transparent',
                  color: (activeWlId ?? watchlists[0]?.id) === wl.id ? '#0E7490' : '#64748B',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                <Star size={12} style={{ display: 'inline', marginRight: 4 }} />
                {wl.name}
              </button>
            ))}
          </>
        )}
        <button
          onClick={() => setAddModalOpen(true)}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px dashed #E2E8F0', background: 'transparent', color: '#64748B', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={14} /> Add Stock
        </button>
      </div>

      {/* Stock list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '4px 16px' }}>{Array(5).fill(0).map((_, i) => <SkeletonStockRow key={i} />)}</div>
        ) : watchlistItems.length === 0 ? (
          <EmptyState
            icon={<Star size={24} />}
            title="Watchlist is empty"
            description="Add stocks to track their prices and get alerts."
            action={{ label: CTA.EXPLORE_STOCKS, onClick: () => navigate('/charts') }}
          />
        ) : (
          <div className="card" style={{ margin: 12, padding: 0, overflow: 'hidden' }}>
            {watchlistItems.map((item, i) => {
              const quote = quotes.find(q => q.symbol === item.symbol);
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  borderBottom: i < watchlistItems.length - 1 ? '1px solid #E2E8F0' : 'none',
                }}>
                  <button
                    onClick={() => { setSelectedSymbol(item.symbol, item.exchange as 'NSE' | 'BSE'); navigate('/trade'); }}
                    style={{ display: 'flex', gap: 12, flex: 1, alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: quote && quote.changePct >= 0 ? 'rgba(16, 185, 129,0.1)' : 'rgba(239, 68, 68,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: quote && quote.changePct >= 0 ? '#10B981' : '#EF4444',
                    }}>
                      {!quote || quote.changePct >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0B0F19', margin: '0 0 2px' }}>{item.symbol}</p>
                      <p style={{ fontSize: 12, color: '#64748B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.companyName}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {quote ? (
                        <>
                          <p className="mono" style={{ fontSize: 14, fontWeight: 700, color: '#0B0F19', margin: '0 0 2px' }}>{formatINR(quote.ltp)}</p>
                          <p className={`mono ${quote.changePct >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: 12, margin: 0 }}>{formatPct(quote.changePct)}</p>
                        </>
                      ) : (
                        <Skeleton width={70} height={14} />
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => removeItem.mutate(item.id)}
                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 6, display: 'flex', flexShrink: 0 }}
                    aria-label={`Remove ${item.symbol} from watchlist`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add stock modal */}
      <Modal isOpen={addModalOpen} onClose={() => { setAddModalOpen(false); setSearchQuery(''); }} title="Add to Watchlist">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            placeholder="Search stocks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
            id="watchlist-search"
          />
          {searchResults.map(s => (
            <button key={s.symbol}
              onClick={() => {
                if (activeWl) {
                  addItem.mutate({ watchlistId: activeWl.id, symbol: s.symbol, exchange: s.exchange as 'NSE' | 'BSE', companyName: s.companyName });
                  setAddModalOpen(false); setSearchQuery('');
                }
              }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', color: '#0B0F19' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#0E7490')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#E2E8F0')}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{s.symbol}</p>
                <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{s.companyName}</p>
              </div>
              <span className="badge badge-neutral">{s.exchange}</span>
            </button>
          ))}
          {searchQuery && searchResults.length === 0 && (
            <p style={{ textAlign: 'center', color: '#64748B', fontSize: 14 }}>No stocks found for "{searchQuery}"</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

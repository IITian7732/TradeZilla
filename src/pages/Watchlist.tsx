// src/pages/Watchlist.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, TrendingUp, TrendingDown, Plus, Trash2, Edit2 } from 'lucide-react';
import { useWatchlists, useRemoveFromWatchlist, useAddToWatchlist, useCreateWatchlist, useRenameWatchlist, useDeleteWatchlist } from '../hooks/useWatchlist';
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
  const createWl = useCreateWatchlist();
  const renameWl = useRenameWatchlist();
  const deleteWl = useDeleteWatchlist();

  const [activeWlId, setActiveWlId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newWlName, setNewWlName] = useState('');
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameWlName, setRenameWlName] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetWlId, setTargetWlId] = useState<string | null>(null);

  const activeWl = watchlists.find(wl => wl.id === (activeWlId ?? watchlists[0]?.id));
  const watchlistItems = activeWl?.items ?? [];
  const symbols = watchlistItems.map(i => ({ symbol: i.symbol, exchange: i.exchange as 'NSE' | 'BSE' }));
  const quotesQuery = useMultipleQuotes(symbols);
  const quotes = quotesQuery.data ?? [];

  const searchResults = searchQuery.length >= 1 ? searchStocks(searchQuery) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Watchlist tabs */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
        {isLoading ? (
          <Skeleton width={120} height={34} />
        ) : (
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
            <button
              onClick={() => setCreateModalOpen(true)}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px dashed #E2E8F0', background: 'transparent', color: '#64748B', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> New List
            </button>
          </>
        )}
        <div style={{ flex: 1, minWidth: 16 }} />
        {activeWl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => { setRenameWlName(activeWl.name); setRenameModalOpen(true); }}
              style={{ padding: '8px', borderRadius: 10, border: '1px solid #E2E8F0', background: 'white', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Rename Watchlist">
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => setDeleteModalOpen(true)}
              style={{ padding: '8px', borderRadius: 10, border: '1px solid #E2E8F0', background: 'white', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Delete Watchlist">
              <Trash2 size={14} />
            </button>
            <button
              onClick={() => { setTargetWlId(activeWl.id); setAddModalOpen(true); }}
              style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#0E7490', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> Add Stock
            </button>
          </div>
        )}
      </div>

      {/* Stock list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '4px 16px' }}>{Array(5).fill(0).map((_, i) => <SkeletonStockRow key={i} />)}</div>
        ) : watchlistItems.length === 0 ? (
          <EmptyState
            icon={<Star size={24} />}
            title="Watchlist is empty"
            description={watchlists.length === 0 ? "Create a new watchlist to track stocks." : "Add stocks to track their prices and get alerts."}
            action={watchlists.length === 0 ? { label: "Create Watchlist", onClick: () => setCreateModalOpen(true) } : undefined}
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
                    onClick={() => { setSelectedSymbol(item.symbol, item.exchange as 'NSE' | 'BSE'); navigate('/charts'); }}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedSymbol(item.symbol, item.exchange as 'NSE' | 'BSE'); navigate('/trade'); }}
                      style={{ background: '#EFF6FF', border: 'none', color: '#2563EB', cursor: 'pointer', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'flex', flexShrink: 0 }}
                    >
                      Trade
                    </button>
                    <button
                      onClick={() => removeItem.mutate(item.id)}
                      style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 6, display: 'flex', flexShrink: 0 }}
                      aria-label={`Remove ${item.symbol} from watchlist`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add stock modal */}
      <Modal isOpen={addModalOpen} onClose={() => { setAddModalOpen(false); setSearchQuery(''); }} title="Add to Watchlist">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {watchlists.length > 0 && (
            <select 
              value={targetWlId ?? activeWl?.id ?? ''} 
              onChange={(e) => setTargetWlId(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', outline: 'none', fontSize: 14, color: '#0B0F19' }}
            >
              {watchlists.map(wl => <option key={wl.id} value={wl.id}>{wl.name}</option>)}
            </select>
          )}
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
                const wlId = targetWlId ?? activeWl?.id;
                if (wlId) {
                  addItem.mutate({ watchlistId: wlId, symbol: s.symbol, exchange: s.exchange as 'NSE' | 'BSE', companyName: s.companyName });
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

      {/* Create Watchlist Modal */}
      <Modal isOpen={createModalOpen} onClose={() => { setCreateModalOpen(false); setNewWlName(''); }} title="New Watchlist">
        <form onSubmit={(e) => { e.preventDefault(); if (newWlName.trim()) { createWl.mutate(newWlName.trim()); setCreateModalOpen(false); setNewWlName(''); } }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Watchlist Name" value={newWlName} onChange={e => setNewWlName(e.target.value)} placeholder="e.g. Tech Stocks" autoFocus required id="create-wl-name" />
          <Button type="submit" fullWidth isLoading={createWl.isPending}>Create</Button>
        </form>
      </Modal>

      {/* Rename Watchlist Modal */}
      <Modal isOpen={renameModalOpen} onClose={() => { setRenameModalOpen(false); setRenameWlName(''); }} title="Rename Watchlist">
        <form onSubmit={(e) => { e.preventDefault(); if (renameWlName.trim() && activeWl) { renameWl.mutate({ id: activeWl.id, name: renameWlName.trim() }); setRenameModalOpen(false); setRenameWlName(''); } }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="New Name" value={renameWlName} onChange={e => setRenameWlName(e.target.value)} placeholder="e.g. Tech Stocks" autoFocus required id="rename-wl-name" />
          <Button type="submit" fullWidth isLoading={renameWl.isPending}>Save</Button>
        </form>
      </Modal>

      {/* Delete Watchlist Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Watchlist">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, color: '#64748B', fontSize: 14 }}>
            Are you sure you want to delete the watchlist <strong>"{activeWl?.name}"</strong>? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} fullWidth>Cancel</Button>
            <Button 
              onClick={() => {
                if (activeWl) {
                  deleteWl.mutate(activeWl.id);
                  setActiveWlId(null);
                  setDeleteModalOpen(false);
                }
              }} 
              isLoading={deleteWl.isPending} 
              fullWidth
              style={{ background: '#EF4444', color: 'white', border: 'none' }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import React, { useState } from 'react';
import { Clock, TrendingUp, TrendingDown, BarChart2, List } from 'lucide-react';
import { useHistoryStore, type ResetSnapshot } from '../store/historyStore';
import { formatINR, formatDate, formatRelativeTime, formatPnL } from '../utils/formatters';
import { EmptyState } from '../components/ui/EmptyState';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { AdvancedStatsView } from '../components/ui/AdvancedStatsView';
import { Button } from '../components/ui/Button';

export default function History() {
  const { snapshots, clearHistory } = useHistoryStore();
  const [selectedStats, setSelectedStats] = useState<ResetSnapshot | null>(null);
  const [selectedTrades, setSelectedTrades] = useState<ResetSnapshot | null>(null);

  return (
    <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="section-title" style={{ margin: 0 }}>Portfolio History</h1>
        {snapshots.length > 0 && (
          <button 
            onClick={clearHistory}
            style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Clear Log
          </button>
        )}
      </div>

      {snapshots.length === 0 ? (
        <EmptyState 
          icon={<Clock size={24} />} 
          title="No history yet" 
          description="Your portfolio data will be archived here when you reset your account." 
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {snapshots.map((snap, index) => (
            <Card key={snap.id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 2px', color: '#0B0F19' }}>
                    Reset {snapshots.length - index}
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                    {formatDate(snap.resetAt, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: (snap.stats?.netPnl || 0) >= 0 ? 'rgba(16, 185, 129,0.1)' : 'rgba(239, 68, 68,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: (snap.stats?.netPnl || 0) >= 0 ? '#10B981' : '#EF4444',
                }}>
                  {(snap.stats?.netPnl || 0) >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 4px' }}>Starting Balance</p>
                  <p className="mono" style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#0B0F19' }}>
                    {formatINR(snap.startingBalance)}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <Button variant="secondary" fullWidth onClick={() => setSelectedStats(snap)}>
                    <BarChart2 size={16} style={{ marginRight: 6 }} /> View Statistics
                  </Button>
                  <Button variant="secondary" fullWidth onClick={() => setSelectedTrades(snap)}>
                    <List size={16} style={{ marginRight: 6 }} /> View Trades
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Modal */}
      <Modal
        isOpen={!!selectedStats}
        onClose={() => setSelectedStats(null)}
        title="Historical Statistics"
      >
        {selectedStats && selectedStats.stats ? (
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
            <AdvancedStatsView stats={selectedStats.stats} />
          </div>
        ) : (
          <p>No statistics available for this period.</p>
        )}
      </Modal>

      {/* Trades Modal */}
      <Modal
        isOpen={!!selectedTrades}
        onClose={() => setSelectedTrades(null)}
        title="Historical Trades"
      >
        {selectedTrades && selectedTrades.trades && selectedTrades.trades.length > 0 ? (
          <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {selectedTrades.trades.map((t: any, i: number) => (
              <div key={t.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                borderBottom: i < selectedTrades.trades.length - 1 ? '1px solid #E2E8F0' : 'none',
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
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748B', textAlign: 'center', padding: '20px 0' }}>No trades recorded in this period.</p>
        )}
      </Modal>
    </div>
  );
}

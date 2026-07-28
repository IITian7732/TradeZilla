// src/pages/Leaderboard.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, TrendingUp, Medal } from 'lucide-react';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/authStore';
import { useTradingStats } from '../hooks/useTradingStats';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { formatINR, formatPct } from '../utils/formatters';
import type { LeaderboardEntry, LeaderboardPeriod } from '../types/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true' || !import.meta.env.VITE_SUPABASE_URL;

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', userId: 'u1', fullName: 'Arjun Sharma', totalReturn: 18.4, totalPnl: 18400, winRate: 78.5, totalTrades: 42, period: 'MONTHLY', rank: 1, snapshotDate: new Date().toISOString(), rankChange: 2 },
  { id: '2', userId: 'u2', fullName: 'Priya Mehta', totalReturn: 15.2, totalPnl: 15200, winRate: 72.0, totalTrades: 38, period: 'MONTHLY', rank: 2, snapshotDate: new Date().toISOString(), rankChange: 0 },
  { id: '3', userId: 'u3', fullName: 'Rahul Gupta', totalReturn: 12.8, totalPnl: 12800, winRate: 68.3, totalTrades: 55, period: 'MONTHLY', rank: 3, snapshotDate: new Date().toISOString(), rankChange: -1 },
  { id: '4', userId: 'mock-user-1', fullName: 'Demo Trader', totalReturn: 3.22, totalPnl: 3220, winRate: 66.7, totalTrades: 24, period: 'MONTHLY', rank: 14, snapshotDate: new Date().toISOString(), rankChange: 3 },
  { id: '5', userId: 'u5', fullName: 'Sneha Patel', totalReturn: 9.6, totalPnl: 9600, winRate: 65.1, totalTrades: 31, period: 'MONTHLY', rank: 4, snapshotDate: new Date().toISOString(), rankChange: 1 },
  { id: '6', userId: 'u6', fullName: 'Vikram Nair', totalReturn: 8.1, totalPnl: 8100, winRate: 61.2, totalTrades: 27, period: 'MONTHLY', rank: 5, snapshotDate: new Date().toISOString(), rankChange: -2 },
];

const MEDAL_COLORS = ['#F59E0B', '#475569', '#CD7F32'];

export default function Leaderboard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('MONTHLY');
  const { user } = useAuthStore();
  const { stats } = useTradingStats(); // SAME hook as Profile — data consistency

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      if (USE_MOCK) return MOCK_LEADERBOARD.sort((a, b) => a.rank - b.rank);
      const { data, error } = await supabase
        .from('leaderboard_snapshots')
        .select('*')
        .eq('period', period)
        .order('rank')
        .limit(100);
      if (error) throw error;
      return (data ?? []).map(r => ({
        id: r.id, userId: r.user_id, fullName: r.full_name, avatarUrl: r.avatar_url,
        totalReturn: r.total_return, totalPnl: r.total_pnl, winRate: r.win_rate,
        totalTrades: r.total_trades, period: r.period, rank: r.rank,
        snapshotDate: r.snapshot_date, rankChange: r.rank_change,
      }));
    },
    staleTime: 300000,
  });

  const currentUserEntry = entries.find(e => e.userId === user?.id);
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 className="section-title">Leaderboard</h1>

      {/* Period tabs */}
      <div className="tabs">
        {(['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME'] as LeaderboardPeriod[]).map(p => (
          <button key={p} className={`tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
            {p === 'ALL_TIME' ? 'All' : p.charAt(0) + p.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Podium top 3 */}
      {isLoading ? (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} width={100} height={120} borderRadius={16} />)}
        </div>
      ) : top3.length > 0 && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'flex-end' }}>
          {[top3[1], top3[0], top3[2]].map((entry, idx) => {
            if (!entry) return <div key={idx} style={{ width: 100 }} />;
            const rankIdx = entry.rank - 1;
            const heights = [100, 130, 90];
            return (
              <div key={entry.id} style={{
                flex: 1, maxWidth: 110,
                background: '#FFFFFF', border: `1px solid ${MEDAL_COLORS[rankIdx]}40`,
                borderRadius: 16, padding: '16px 10px',
                textAlign: 'center', height: heights[idx],
                display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6,
                ...(entry.userId === user?.id ? { borderColor: '#0E7490', background: 'rgba(14, 116, 144,0.08)' } : {}),
              }}>
                <div style={{ fontSize: 24 }}>{['🥈', '🥇', '🥉'][idx]}</div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#0B0F19', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.fullName.split(' ')[0]}
                </p>
                <p className="mono" style={{ fontSize: 13, fontWeight: 700, color: '#10B981', margin: 0 }}>
                  +{entry.totalReturn.toFixed(1)}%
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Current user highlight (if not in top 100 visible) */}
      {currentUserEntry && (
        <div style={{ background: 'rgba(14, 116, 144,0.1)', border: '1px solid rgba(14, 116, 144,0.3)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0E7490', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 13 }}>
            #{currentUserEntry.rank}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0B0F19', margin: '0 0 2px' }}>You · {user?.fullName}</p>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
              {/* Stats from useTradingStats — same as Profile page */}
              {stats?.totalTrades ?? currentUserEntry.totalTrades} trades · {(stats?.winRate ?? currentUserEntry.winRate).toFixed(1)}% win rate
            </p>
          </div>
          <p className="mono positive" style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>+{currentUserEntry.totalReturn.toFixed(2)}%</p>
        </div>
      )}

      {/* Ranked list */}
      {isLoading ? (
        <div className="card" style={{ padding: '4px 0' }}>
          {Array(5).fill(0).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
              <Skeleton width={32} height={32} borderRadius={8} />
              <Skeleton width={120} height={14} />
              <div style={{ flex: 1 }} />
              <Skeleton width={60} height={14} />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={<Trophy size={24} />} title="No rankings yet" description="Leaderboard updates daily at 6 PM IST." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {entries.slice(0, 20).map((entry, i) => (
            <div key={entry.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderBottom: i < Math.min(entries.length, 20) - 1 ? '1px solid #E2E8F0' : 'none',
              background: entry.userId === user?.id ? 'rgba(14, 116, 144,0.05)' : 'transparent',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: entry.rank <= 3 ? `${MEDAL_COLORS[entry.rank - 1]}20` : '#F8FAFC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13,
                color: entry.rank <= 3 ? MEDAL_COLORS[entry.rank - 1] : '#64748B',
              }}>
                #{entry.rank}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: entry.userId === user?.id ? 800 : 600, color: '#0B0F19', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.fullName}{entry.userId === user?.id ? ' (You)' : ''}
                </p>
                <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                  {entry.totalTrades} trades · {entry.winRate.toFixed(1)}% wins
                  {/* Rank change indicator with legend */}
                  {entry.rankChange !== undefined && entry.rankChange !== 0 && (
                    <span
                      title={`${entry.rankChange > 0 ? '↑ Moved up' : '↓ Moved down'} ${Math.abs(entry.rankChange)} positions`}
                      style={{ marginLeft: 6, color: entry.rankChange > 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                      {entry.rankChange > 0 ? `↑${entry.rankChange}` : `↓${Math.abs(entry.rankChange)}`}
                    </span>
                  )}
                  {entry.rankChange === 0 && <span style={{ marginLeft: 6, color: '#64748B' }}>—</span>}
                </p>
              </div>
              <p className="mono positive" style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                +{entry.totalReturn.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      )}
      <div style={{ height: 16 }} />
    </div>
  );
}

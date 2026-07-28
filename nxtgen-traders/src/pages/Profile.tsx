// src/pages/Profile.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Crown, LogOut, ChevronRight, TrendingUp, Award } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { useTradingStats } from '../hooks/useTradingStats'; // SAME source as Leaderboard
import { StatCard } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { formatINR, formatPct } from '../utils/formatters';

const ACHIEVEMENTS = [
  { id: 'first_trade', label: 'First Trade', icon: '🚀', unlocked: true },
  { id: 'profit_maker', label: 'Profit Maker', icon: '💰', unlocked: true },
  { id: 'diversified', label: 'Diversified', icon: '🌐', unlocked: false },
  { id: 'hundred_trades', label: 'Century Trader', icon: '💯', unlocked: false },
  { id: 'big_winner', label: 'Big Winner', icon: '🏆', unlocked: false },
  { id: 'market_guru', label: 'Market Guru', icon: '🧠', unlocked: false },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, account } = useAuthStore();
  const { signOut } = useAuth();
  const { stats, isLoading: statsLoading } = useTradingStats();
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  const maskedPhone = user?.phone
    ? user.phone.slice(0, 4) + '•••' + user.phone.slice(-3)
    : null;

  return (
    <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Avatar + name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0 4px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: 'linear-gradient(135deg, #0E7490, #F59E0B)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, fontWeight: 800, color: 'white',
          border: '3px solid #E2E8F0',
        }}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} style={{ width: '100%', height: '100%', borderRadius: 22, objectFit: 'cover' }} />
          ) : (
            user?.fullName?.charAt(0).toUpperCase() ?? 'T'
          )}
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0B0F19', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            {user?.fullName ?? 'Trader'}
          </h1>
          {user?.isPremium && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(245, 158, 11,0.1)', border: '1px solid rgba(245, 158, 11,0.3)', borderRadius: 100, padding: '3px 10px' }}>
              <Crown size={12} style={{ color: '#F59E0B' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>Premium</span>
            </div>
          )}
          {maskedPhone && (
            <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>
              {phoneRevealed ? user?.phone : maskedPhone}
              {' '}
              <button onClick={() => setPhoneRevealed(!phoneRevealed)} style={{ background: 'none', border: 'none', color: '#0E7490', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                {phoneRevealed ? 'Hide' : 'Reveal'}
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Trading stats — SAME useTradingStats hook as Leaderboard */}
      {statsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="card"><Skeleton width="100%" height={50} /></div>
          ))}
        </div>
      ) : stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <StatCard label="Total Trades" value={stats.totalTrades} />
          <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} trend={stats.winRate >= 50 ? 'positive' : 'negative'} />
          <StatCard label="Best Trade" value={formatINR(stats.bestTradePnl, 0)} trend="positive" />
        </div>
      ) : null}

      {/* Achievement badges */}
      <section>
        <h2 className="section-title" style={{ marginBottom: 12 }}>Achievements</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {ACHIEVEMENTS.map(a => (
            <div key={a.id} style={{
              background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 10px',
              textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
              opacity: a.unlocked ? 1 : 0.45,
              filter: a.unlocked ? 'none' : 'grayscale(80%)',
            }}>
              <span style={{ fontSize: 28, position: 'relative' }}>
                {a.icon}
                {!a.unlocked && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔒</span>}
              </span>
              <p style={{ fontSize: 11, fontWeight: 700, color: a.unlocked ? '#0B0F19' : '#64748B', margin: 0, lineHeight: 1.3 }}>{a.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Menu items */}
      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {[
          { icon: <Settings size={18} />, label: 'Settings', action: () => navigate('/settings') },
          { icon: <Crown size={18} />, label: 'Upgrade to Premium', action: () => navigate('/premium'), highlight: true },
          { icon: <TrendingUp size={18} />, label: 'View Portfolio', action: () => navigate('/portfolio') },
          { icon: <Award size={18} />, label: 'Leaderboard', action: () => navigate('/leaderboard') },
        ].map((item, i, arr) => (
          <button key={item.label} onClick={item.action} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px',
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: i < arr.length - 1 ? '1px solid #E2E8F0' : 'none',
            color: item.highlight ? '#F59E0B' : '#0B0F19',
            transition: 'background 0.15s', textAlign: 'left',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <span style={{ color: item.highlight ? '#F59E0B' : '#0E7490' }}>{item.icon}</span>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{item.label}</span>
            <ChevronRight size={16} style={{ color: '#64748B' }} />
          </button>
        ))}
      </section>

      {/* Sign out */}
      <button
        onClick={() => signOut.mutate()}
        disabled={signOut.isPending}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '14px', background: 'rgba(239, 68, 68,0.08)', border: '1px solid rgba(239, 68, 68,0.2)',
          borderRadius: 14, cursor: 'pointer', color: '#EF4444', fontWeight: 700, fontSize: 15,
          width: '100%',
        }}>
        <LogOut size={18} /> Sign Out
      </button>
      <div style={{ height: 16 }} />
    </div>
  );
}

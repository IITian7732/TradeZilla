// src/pages/Profile.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Crown, LogOut, ChevronRight, TrendingUp, Award, FileText, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { useTradingStats } from '../hooks/useTradingStats'; // SAME source as Leaderboard
import { StatCard } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { formatINR, formatPct } from '../utils/formatters';

import { Modal } from '../components/ui/Modal';
import { Info } from 'lucide-react';

const ACHIEVEMENTS_DEF = [
  { id: 'first_trade', label: 'First Trade', icon: '🚀', desc: 'Place your very first paper trade.', check: (s: any) => s?.totalTrades >= 1 },
  { id: 'profit_maker', label: 'Profit Maker', icon: '💰', desc: 'Close a trade with a positive profit.', check: (s: any) => s?.bestTradePnl > 0 },
  { id: 'diversified', label: 'Diversified', icon: '🌐', desc: 'Execute at least 5 trades to build a diversified portfolio.', check: (s: any) => s?.totalTrades >= 5 },
  { id: 'hundred_trades', label: 'Century Trader', icon: '💯', desc: 'Complete 100 total trades.', check: (s: any) => s?.totalTrades >= 100 },
  { id: 'big_winner', label: 'Big Winner', icon: '🏆', desc: 'Make a single trade profit of over ₹1,000.', check: (s: any) => s?.bestTradePnl >= 1000 },
  { id: 'market_guru', label: 'Market Guru', icon: '🧠', desc: 'Achieve a win rate of over 60% with at least 10 trades.', check: (s: any) => s?.winRate >= 60 && s?.totalTrades >= 10 },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, account } = useAuthStore();
  const { signOut } = useAuth();
  const { stats, isLoading: statsLoading } = useTradingStats();
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);

  const achievements = ACHIEVEMENTS_DEF.map(a => ({
    ...a,
    unlocked: a.check(stats),
  }));

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
          <button
            onClick={() => navigate('/profile/edit')}
            style={{ 
              marginTop: 12, padding: '6px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', 
              borderRadius: 100, color: '#0B0F19', fontSize: 13, fontWeight: 600, cursor: 'pointer' 
            }}
          >
            Edit Profile
          </button>
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
          <StatCard 
            label="Statistics" 
            value="View" 
            icon={<ChevronRight size={18} />} 
            onClick={() => navigate('/statistics')} 
          />
        </div>
      ) : null}

      {/* Achievement badges */}
      <section>
        <h2 className="section-title" style={{ marginBottom: 12 }}>Achievements</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {achievements.map(a => (
            <div key={a.id} style={{
              background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 10px',
              textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
              opacity: a.unlocked ? 1 : 0.45,
              filter: a.unlocked ? 'none' : 'grayscale(80%)',
              position: 'relative', cursor: 'pointer',
            }} onClick={() => setSelectedAchievement(a)}>
              <button style={{ 
                position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', 
                color: a.unlocked ? '#0E7490' : '#94A3B8', padding: 4, cursor: 'pointer' 
              }}>
                <Info size={14} />
              </button>
              <span style={{ fontSize: 28, position: 'relative', marginTop: 4 }}>
                {a.icon}
                {!a.unlocked && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔒</span>}
              </span>
              <p style={{ fontSize: 11, fontWeight: 700, color: a.unlocked ? '#0B0F19' : '#64748B', margin: 0, lineHeight: 1.3 }}>{a.label}</p>
            </div>
          ))}
        </div>
      </section>

      <Modal 
        isOpen={!!selectedAchievement} 
        onClose={() => setSelectedAchievement(null)}
        title="Achievement Details"
      >
        {selectedAchievement && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{selectedAchievement.icon}</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0B0F19', marginBottom: 8 }}>
              {selectedAchievement.label}
            </h3>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 20 }}>
              {selectedAchievement.desc}
            </p>
            <div style={{ 
              display: 'inline-block', padding: '6px 16px', borderRadius: 100, 
              background: selectedAchievement.unlocked ? 'rgba(16, 185, 129,0.1)' : 'rgba(148, 163, 184,0.1)',
              color: selectedAchievement.unlocked ? '#10B981' : '#64748B',
              fontWeight: 700, fontSize: 13
            }}>
              {selectedAchievement.unlocked ? '✅ Unlocked' : '🔒 Locked'}
            </div>
          </div>
        )}
      </Modal>

      {/* Menu items */}
      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {[
          { icon: <Settings size={18} />, label: 'Settings', action: () => navigate('/settings') },
          { icon: <Crown size={18} />, label: 'Upgrade to Premium', action: () => navigate('/premium'), highlight: true },
          { icon: <TrendingUp size={18} />, label: 'View Portfolio', action: () => navigate('/portfolio') },
          { icon: <Award size={18} />, label: 'Leaderboard', action: () => navigate('/leaderboard') },
          { icon: <FileText size={18} />, label: 'Terms of Service', action: () => navigate('/terms') },
          { icon: <Shield size={18} />, label: 'Privacy Policy', action: () => navigate('/privacy') },
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

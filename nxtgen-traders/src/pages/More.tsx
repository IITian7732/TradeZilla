// src/pages/More.tsx — More menu page (accessed via bottom nav "More" tab)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Crown, HelpCircle, BarChart2, List, Newspaper, Trophy, ChevronRight } from 'lucide-react';

const MENU_ITEMS = [
  { icon: <User size={20} />, label: 'Profile', path: '/profile' },
  { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
  { icon: <Crown size={20} />, label: 'Premium', path: '/premium', highlight: true },
  { icon: <BarChart2 size={20} />, label: 'Advanced Charts', path: '/charts' },
  { icon: <List size={20} />, label: 'Orders', path: '/orders' },
  { icon: <Newspaper size={20} />, label: 'News', path: '/news' },
  { icon: <Trophy size={20} />, label: 'Leaderboard', path: '/leaderboard' },
  { icon: <HelpCircle size={20} />, label: 'Help Center', path: '/help' },
];

export default function More() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 className="section-title">More</h1>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {MENU_ITEMS.map((item, i) => (
          <button key={item.label} onClick={() => navigate(item.path)} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 16px',
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: i < MENU_ITEMS.length - 1 ? '1px solid #E2E8F0' : 'none',
            color: item.highlight ? '#F59E0B' : '#0B0F19', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: item.highlight ? 'rgba(245, 158, 11,0.1)' : 'rgba(14, 116, 144,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: item.highlight ? '#F59E0B' : '#0E7490',
            }}>
              {item.icon}
            </div>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 600, textAlign: 'left' }}>{item.label}</span>
            <ChevronRight size={16} style={{ color: '#64748B' }} />
          </button>
        ))}
      </div>
      <div style={{ height: 16 }} />
    </div>
  );
}

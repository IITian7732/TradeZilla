// src/components/layout/TopBar.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getMarketStatusLabel } from '../../utils/marketHours';
import { searchStocks } from '../../api/marketData';
import { useMarketStore } from '../../store/marketStore';
import { useNotificationStore } from '../../store/notificationStore';

interface TopBarProps {
  title?: string;
  showSearch?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, showSearch = false, showBack = false, onBack }) => {
  const { user } = useAuthStore();
  const { setSelectedSymbol } = useMarketStore();
  const unreadCount = useNotificationStore(state => state.getUnreadCount());
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const marketStatus = getMarketStatusLabel();

  const results = query.length >= 1 ? searchStocks(query) : [];

  const handleSelectStock = (symbol: string, exchange: 'NSE' | 'BSE') => {
    setSelectedSymbol(symbol, exchange);
    setQuery('');
    setSearchOpen(false);
    navigate('/trade');
  };

  return (
    <header className="page-header">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, gap: 12 }}>
        {/* Left: Logo or title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {showBack && (
            <button
              onClick={onBack ?? (() => navigate(-1))}
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 8 }}
              aria-label="Go back"
            >
              ←
            </button>
          )}
          {title ? (
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0B0F19', margin: 0, letterSpacing: '-0.3px' }} className={searchOpen ? 'hidden sm:block' : ''}>{title}</h1>
          ) : (
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
              onClick={() => navigate('/dashboard')}
              className={searchOpen ? 'hidden sm:flex' : 'flex'}
            >
              <img src="/logo.png" alt="TradeZilla Logo" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0B0F19', margin: 0, letterSpacing: '-0.3px' }}>TradeZilla</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                  <span className={`market-dot ${marketStatus === 'Market Open' ? 'open' : marketStatus === 'Pre-Open' ? 'pre-open' : 'closed'}`} />
                  <span style={{ fontSize: 11, color: '#64748B' }}>{marketStatus}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center: Search Bar */}
        {showSearch && searchOpen && (
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search stocks..."
              className="input-base"
              style={{ paddingRight: 40, width: '100%' }}
              aria-label="Search stocks"
            />
            <button
              onClick={() => { setSearchOpen(false); setQuery(''); }}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex' }}
              aria-label="Close search"
            >
              <X size={18} />
            </button>
            {/* Search results dropdown */}
            {results.length > 0 && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50,
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12,
                overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}>
                {results.map(s => (
                  <button
                    key={`${s.symbol}:${s.exchange}`}
                    onClick={() => handleSelectStock(s.symbol, s.exchange as 'NSE' | 'BSE')}
                    style={{
                      width: '100%', padding: '12px 16px', background: 'none', border: 'none',
                      color: '#0B0F19', cursor: 'pointer', textAlign: 'left',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      borderBottom: '1px solid #E2E8F0', fontSize: 14,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#E2E8F0')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>{s.symbol}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{s.companyName}</p>
                    </div>
                    <span className="badge badge-neutral">{s.exchange}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {showSearch && !searchOpen && (
            <button
              onClick={() => setSearchOpen(true)}
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 8, borderRadius: 10, display: 'flex' }}
              aria-label="Search stocks"
            >
              <Search size={20} />
            </button>
          )}
          <button
            onClick={() => navigate('/notifications')}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 8, borderRadius: 10, display: 'flex', position: 'relative' }}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 6, width: 8, height: 8,
                background: '#EF4444', borderRadius: '50%', border: '2px solid #FFFFFF'
              }} />
            )}
          </button>
          {user && (
            <button
              onClick={() => navigate('/profile')}
              style={{
                width: 34, height: 34, borderRadius: 10, overflow: 'hidden',
                background: 'linear-gradient(135deg, #0E7490, #F59E0B)',
                border: '2px solid #E2E8F0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0,
              }}
              aria-label="Profile"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user.fullName.charAt(0).toUpperCase()
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

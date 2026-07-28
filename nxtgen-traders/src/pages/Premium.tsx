// src/pages/Premium.tsx
import React from 'react';
import { Crown, Check, Zap, Star, Bell, BarChart2, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { CTA } from '../utils/constants';

const FEATURES = {
  free: [
    '₹1,00,000 virtual capital',
    '1 watchlist (up to 50 stocks)',
    'Basic charts (EOD)',
    'Market & limit orders',
    'News feed',
    'Leaderboard access',
  ],
  premium: [
    'Everything in Free',
    'Unlimited watchlists',
    'Advanced real-time charts',
    'Stop-loss & SL-M orders',
    'Price alerts (push notifications)',
    'Portfolio analytics & CSV export',
    'Priority market data',
    'Advanced chart indicators',
  ],
};

export default function Premium() {
  const { user } = useAuthStore();

  const handleUpgrade = () => {
    // In production: invoke Razorpay via Supabase edge function
    alert('Razorpay integration: Coming soon! Connect your Razorpay test key in .env');
  };

  if (user?.isPremium) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>👑</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F59E0B', marginBottom: 8 }}>You're Premium!</h1>
        <p style={{ fontSize: 15, color: '#475569' }}>Enjoy unlimited access to all TradeZilla features.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Crown size={40} style={{ color: '#F59E0B', marginBottom: 12 }} />
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0B0F19', marginBottom: 8, letterSpacing: '-0.5px' }}>
          Upgrade to <span style={{ color: '#F59E0B' }}>Premium</span>
        </h1>
        <p style={{ fontSize: 15, color: '#475569' }}>Unlock advanced tools and trade like a pro</p>
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Free */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#475569', margin: '0 0 4px' }}>FREE</p>
            <p className="mono" style={{ fontSize: 26, fontWeight: 900, color: '#0B0F19', margin: 0 }}>₹0</p>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Forever free</p>
          </div>
          <div className="divider" />
          {FEATURES.free.map(f => (
            <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Check size={14} style={{ color: '#64748B', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{f}</p>
            </div>
          ))}
        </div>

        {/* Premium */}
        <div className="card" style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          border: '1px solid rgba(245, 158, 11,0.4)',
          background: 'linear-gradient(145deg, #FFFFFF, #1d1a10)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 8, right: -12, background: '#F59E0B', color: '#F4F6F9', fontSize: 10, fontWeight: 800, padding: '3px 20px', transform: 'rotate(12deg)' }}>
            POPULAR
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B', margin: '0 0 4px' }}>PREMIUM</p>
            <p className="mono" style={{ fontSize: 26, fontWeight: 900, color: '#0B0F19', margin: 0 }}>₹299<span style={{ fontSize: 14, color: '#64748B' }}>/mo</span></p>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>or ₹2,499/year (save 30%)</p>
          </div>
          <div className="divider" />
          {FEATURES.premium.map(f => (
            <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Check size={14} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{f}</p>
            </div>
          ))}
        </div>
      </div>

      <Button fullWidth size="lg" onClick={handleUpgrade} style={{ background: 'linear-gradient(135deg, #F59E0B, #e8952a)', color: '#F4F6F9', fontWeight: 800 }}>
        <Crown size={18} /> {CTA.UPGRADE_TO_PREMIUM}
      </Button>
      <p style={{ textAlign: 'center', fontSize: 12, color: '#64748B' }}>
        Powered by Razorpay · Cancel anytime · No hidden charges
      </p>
      <div style={{ height: 16 }} />
    </div>
  );
}

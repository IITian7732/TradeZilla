import { useState } from 'react';
import { 
  Star, RefreshCw, TrendingUp, Infinity, Clock, ShieldOff, 
  Activity, BarChart2, Download, Bell, CheckCircle2 
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';

const PREMIUM_FEATURES = [
  {
    icon: <RefreshCw size={20} />,
    title: 'Unlimited PNL Reset + Custom Capital',
    desc: 'Reset anytime, customize your starting amount.',
  },
  {
    icon: <TrendingUp size={20} />,
    title: 'Futures & Options Trading',
    desc: 'Full F&O access with realistic pricing.',
  },
  {
    icon: <Infinity size={20} />,
    title: 'Unlimited Trades Per Day',
    desc: 'No daily limits on your paper trades.',
  },
  {
    icon: <Clock size={20} />,
    title: 'AMO (After Market Orders)',
    desc: 'Place orders anytime, even after market close.',
  },
  {
    icon: <ShieldOff size={20} />,
    title: 'No Ads',
    desc: 'Clean, completely distraction-free experience.',
  },
  {
    icon: <Activity size={20} />,
    title: 'Options Greeks Display',
    desc: 'Delta, Gamma, Theta, Vega tracking.',
  },
  {
    icon: <BarChart2 size={20} />,
    title: 'Performance Analytics',
    desc: 'Win rate, Sharpe ratio, max drawdown, profit factor.',
  },
  {
    icon: <Download size={20} />,
    title: 'Trade Export & Tax Reports',
    desc: 'Download trades and generate tax documentation.',
  },
  {
    icon: <Bell size={20} />,
    title: 'Custom Alerts',
    desc: 'Price & technical alerts + Telegram/Discord webhooks.',
  },
];

const PLANS = [
  { id: 'weekly', name: 'Weekly', price: 20, period: 'week', tag: null },
  { id: 'monthly', name: 'Monthly', price: 69, period: 'month', tag: null },
  { id: 'yearly', name: '1 Year', price: 499, period: 'year', tag: 'Most Popular' },
];

export default function Premium() {
  const { user } = useAuthStore();
  const [selectedPlanId, setSelectedPlanId] = useState('yearly');
  
  const selectedPlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[2];

  const handleUpgrade = () => {
    // In production: invoke Razorpay via Supabase edge function
    alert('Razorpay integration: Coming soon! Connect your Razorpay test key in .env');
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', 
      minHeight: '100%', paddingBottom: 160 // Space for sticky footer + bottom nav
    }}>
      
      <div style={{ padding: '24px 16px 16px', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: 24, fontWeight: 900, color: '#0B0F19', 
          margin: '0 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          TradeZilla <span style={{ 
            color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4,
            background: '#FEF3C7', padding: '4px 12px', borderRadius: 20
          }}>
            <Star size={16} fill="currentColor" /> Premium
          </span>
        </h1>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#F59E0B', textAlign: 'center', marginBottom: 16 }}>
          Ad-free experience & more features
        </p>

        {/* Plans */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PLANS.map(plan => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div 
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                style={{
                  border: isSelected ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                  background: isSelected ? '#FEF3C7' : '#FFFFFF',
                  borderRadius: 12, padding: '16px', cursor: 'pointer',
                  position: 'relative', transition: 'all 0.2s ease',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#0B0F19', margin: 0 }}>
                      {plan.name}
                    </p>
                    {plan.tag && (
                      <span style={{ background: '#10B981', color: '#FFFFFF', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 12 }}>
                        {plan.tag}
                      </span>
                    )}
                  </div>
                  <p className="mono" style={{ fontSize: 20, fontWeight: 800, color: '#0B0F19', margin: 0 }}>
                    ₹{plan.price}
                  </p>
                  {plan.id === 'yearly' && (
                    <p style={{ fontSize: 11, color: '#64748B', marginTop: 4, marginBottom: 0 }}>
                      One time Payment. Save an extra 44% compared to monthly plan
                    </p>
                  )}
                </div>
                <div style={{ 
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: isSelected ? 'none' : '2px solid #CBD5E1',
                  background: isSelected ? '#F59E0B' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isSelected && <CheckCircle2 size={20} color="#FFFFFF" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Premium Benefits */}
        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#475569', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center', marginBottom: 20 }}>
            Premium Benefits
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {PREMIUM_FEATURES.map((feature, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B'
                }}>
                  {feature.icon}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0B0F19', margin: '0 0 4px' }}>
                    {feature.title}
                  </p>
                  <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div style={{
        position: 'fixed', bottom: 64, left: 0, right: 0,
        background: '#FFFFFF', padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        borderTop: '1px solid #E2E8F0', boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
        zIndex: 50
      }}>
        <Button 
          fullWidth size="lg" onClick={handleUpgrade} 
          style={{ 
            background: '#F59E0B', color: '#FFFFFF', fontWeight: 800, 
            fontSize: 16, border: 'none', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
          }}
        >
          Buy at ₹{selectedPlan.price} for {selectedPlan.name}
        </Button>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', margin: '8px 0 0' }}>
          Pay once. No recurring charges or renewals.
        </p>
      </div>

    </div>
  );
}

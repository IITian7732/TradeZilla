// src/pages/Landing.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Shield, Zap, BarChart2, Star, Trophy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CTA } from '../utils/constants';

const FEATURES = [
  { icon: <TrendingUp size={22} />, title: 'Real NSE/BSE Data', desc: 'Live prices from Indian exchanges with ₹1,00,000 virtual money' },
  { icon: <BarChart2 size={22} />, title: 'Advanced Charting', desc: 'Professional TradingView charts with candlesticks and indicators' },
  { icon: <Shield size={22} />, title: 'Risk-Free Trading', desc: 'Learn to trade without risking a single real rupee' },
  { icon: <Zap size={22} />, title: 'Instant Execution', desc: 'Market, limit, and stop-loss orders executed in seconds' },
  { icon: <Star size={22} />, title: 'Smart Watchlist', desc: 'Track unlimited stocks with live price alerts' },
  { icon: <Trophy size={22} />, title: 'Leaderboard', desc: 'Compete with traders across India and climb the ranks' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9', overflowX: 'hidden' }}>
      {/* Navigation */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(244, 246, 249, 0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="TradeZilla Logo" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0B0F19', letterSpacing: '-0.3px' }}>TradeZilla</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>{CTA.SIGN_IN}</Button>
          <Button size="sm" onClick={() => navigate('/register')}>{CTA.SIGN_UP}</Button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '64px 20px 48px', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        {/* Glow orb */}
        <div style={{
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 116, 144,0.3) 0%, transparent 70%)',
          position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 100,
          pointerEvents: 'none', filter: 'blur(40px)',
        }} />
        <div style={{ position: 'relative' }}>
          <div className="badge badge-brand" style={{ marginBottom: 20, display: 'inline-flex' }}>
            🇮🇳 India's #1 Paper Trading App
          </div>
          <h1 style={{
            fontSize: 'clamp(36px, 8vw, 56px)', fontWeight: 900,
            letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 20,
          }}>
            <span style={{ color: '#0B0F19' }}>Master the</span>
            <br />
            <span className="gradient-text">Stock Market</span>
            <br />
            <span style={{ color: '#0B0F19' }}>Risk-Free</span>
          </h1>
          <p style={{ fontSize: 18, color: '#475569', lineHeight: 1.7, marginBottom: 36 }}>
            Trade NSE & BSE stocks with <span className="mono" style={{ color: '#0B0F19' }}>₹1,00,000</span> virtual money.
            Real prices. Real strategies. Zero risk.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button size="lg" onClick={() => navigate('/register')}>
              {CTA.START_TRADING} →
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/login')}>
              {CTA.SIGN_IN}
            </Button>
          </div>
          {/* Trust indicators */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
            {[['10K+', 'Traders'], ['₹1L', 'Virtual Capital'], ['NSE + BSE', 'Exchanges']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <p className="mono" style={{ fontSize: 22, fontWeight: 700, color: '#0E7490', margin: 0 }}>{val}</p>
                <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mock portfolio preview */}
      <section style={{ padding: '0 20px 48px', maxWidth: 400, margin: '0 auto' }}>
        <div className="card" style={{ background: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(14, 116, 144,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>PORTFOLIO VALUE</span>
            <span className="badge badge-positive">+3.21% ▲</span>
          </div>
          <p className="mono" style={{ fontSize: 32, fontWeight: 800, color: '#0B0F19', margin: '0 0 4px' }}>₹1,03,215.00</p>
          <p className="mono positive" style={{ fontSize: 14, margin: '0 0 20px' }}>+₹3,215.00 today</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Balance', value: '₹57,984', color: '#475569' },
              { label: 'Invested', value: '₹45,231', color: '#475569' },
              { label: 'P&L', value: '+₹3,215', color: '#10B981' },
            ].map(item => (
              <div key={item.label} style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 4px' }}>{item.label}</p>
                <p className="mono" style={{ fontSize: 13, fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '0 20px 64px', maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', color: '#0B0F19', marginBottom: 32, letterSpacing: '-0.5px' }}>
          Everything you need to{' '}
          <span className="gradient-text">trade smarter</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(14, 116, 144,0.1)', border: '1px solid rgba(14, 116, 144,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#0E7490',
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0B0F19', margin: 0 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section style={{ padding: '48px 20px 80px', textAlign: 'center', background: 'rgba(14, 116, 144,0.05)', borderTop: '1px solid rgba(14, 116, 144,0.1)' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0B0F19', marginBottom: 12, letterSpacing: '-0.5px' }}>Ready to start trading?</h2>
        <p style={{ fontSize: 16, color: '#475569', marginBottom: 28 }}>Join thousands of Indian traders learning the markets risk-free.</p>
        <Button size="lg" onClick={() => navigate('/register')}>{CTA.START_TRADING} →</Button>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 16 }}>No credit card required · Free forever</p>
      </section>
    </div>
  );
}

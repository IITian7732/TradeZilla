// src/pages/Login.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { CTA } from '../utils/constants';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn.mutateAsync({ email, password });
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src="/logo.png" alt="TradeZilla Logo" style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover', margin: '0 auto 12px', display: 'block' }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0B0F19', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Welcome back</h1>
          <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>Sign in to your trading account</p>
        </div>

        {/* Demo mode notice */}
        {import.meta.env.VITE_USE_MOCK_DATA === 'true' && (
          <div style={{ background: 'rgba(245, 158, 11,0.1)', border: '1px solid rgba(245, 158, 11,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#F59E0B', margin: 0 }}>
              🚧 Running in <strong>Demo Mode</strong> — any email/password works
            </p>
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              leftAddon={<Mail size={16} />}
              required
              autoComplete="email"
              id="login-email"
            />
            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              leftAddon={<Lock size={16} />}
              rightAddon={
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: 0 }} aria-label={showPass ? 'Hide password' : 'Show password'}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
              autoComplete="current-password"
              id="login-password"
            />
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <Link to="/forgot-password" style={{ fontSize: 13, color: '#0E7490', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
            <Button type="submit" fullWidth isLoading={signIn.isPending}>{CTA.SIGN_IN}</Button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
            <span style={{ fontSize: 13, color: '#64748B' }}>or continue with</span>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
          </div>

          <button
            onClick={() => signInWithGoogle.mutate()}
            disabled={signInWithGoogle.isPending}
            style={{
              width: '100%', padding: '12px 20px', background: '#F8FAFC',
              border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer',
              color: '#0B0F19', fontSize: 15, fontWeight: 600, display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#0E7490')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </button>

          <p style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            By signing in you agree to our{' '}
            <Link to="/terms" style={{ color: '#0E7490', textDecoration: 'none' }}>Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" style={{ color: '#0E7490', textDecoration: 'none' }}>Privacy Policy</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#64748B', marginTop: 24 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#0E7490', textDecoration: 'none', fontWeight: 600 }}>
            {CTA.SIGN_UP}
          </Link>
        </p>
      </div>
    </div>
  );
}

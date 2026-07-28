// src/pages/Register.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Phone, Camera } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { CTA, INITIAL_BALANCE } from '../utils/constants';
import { formatINR } from '../utils/formatters';

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    await signUp.mutateAsync({ email, password, fullName, phone, avatar });
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src="/logo.png" alt="TradeZilla Logo" style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover', margin: '0 auto 12px', display: 'block' }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0B0F19', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Create your account</h1>
          <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
            Start with <span className="mono" style={{ color: '#10B981' }}>{formatINR(INITIAL_BALANCE, 0)}</span> virtual capital
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Avatar Upload */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <label htmlFor="avatar-upload" style={{ cursor: 'pointer', position: 'relative' }}>
                <div style={{ 
                  width: 80, height: 80, borderRadius: '50%', backgroundColor: '#F8FAFC', 
                  border: '2px dashed #E2E8F0', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', overflow: 'hidden' 
                }}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Camera size={24} color="#94A3B8" />
                  )}
                </div>
                <div style={{ 
                  position: 'absolute', bottom: 0, right: 0, background: '#0E7490', 
                  borderRadius: '50%', padding: 6, display: 'flex', border: '2px solid #FFFFFF' 
                }}>
                  <Camera size={12} color="#FFFFFF" />
                </div>
                <input 
                  type="file" id="avatar-upload" accept="image/*" 
                  style={{ display: 'none' }} onChange={handleAvatarChange} 
                />
              </label>
            </div>

            <Input
              label="Full name"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Yash Jaiswal"
              leftAddon={<User size={16} />}
              required
              autoComplete="name"
              id="register-name"
            />
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              leftAddon={<Mail size={16} />}
              required
              autoComplete="email"
              id="register-email"
            />
            <Input
              label="Phone number"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              leftAddon={<Phone size={16} />}
              required
              autoComplete="tel"
              id="register-phone"
            />
            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              leftAddon={<Lock size={16} />}
              rightAddon={
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: 0 }} aria-label={showPass ? 'Hide password' : 'Show password'}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
              minLength={6}
              autoComplete="new-password"
              id="register-password"
            />
            <Input
              label="Confirm Password"
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Min. 6 characters"
              leftAddon={<Lock size={16} />}
              required
              minLength={6}
              autoComplete="new-password"
              id="register-confirm-password"
            />
            <Button type="submit" fullWidth isLoading={signUp.isPending}>{CTA.SIGN_UP}</Button>
          </form>

          <p style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            By creating an account you agree to our{' '}
            <a href="#" style={{ color: '#0E7490', textDecoration: 'none' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" style={{ color: '#0E7490', textDecoration: 'none' }}>Privacy Policy</a>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#64748B', marginTop: 24 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0E7490', textDecoration: 'none', fontWeight: 600 }}>
            {CTA.SIGN_IN}
          </Link>
        </p>
      </div>
    </div>
  );
}

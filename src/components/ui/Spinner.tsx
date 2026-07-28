// src/components/ui/Spinner.tsx
import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizes = { sm: 16, md: 24, lg: 40 };

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', label = 'Loading...' }) => (
  <div role="status" aria-label={label} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg
      width={sizes[size]}
      height={sizes[size]}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="#E2E8F0" strokeWidth="2.5" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#0E7490" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  </div>
);

export const FullPageSpinner: React.FC = () => (
  <div style={{
    position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 16,
    background: '#F4F6F9', zIndex: 999,
  }}>
    <Spinner size="lg" />
    <p style={{ color: '#64748B', fontSize: 14 }}>Loading TradeZilla...</p>
  </div>
);

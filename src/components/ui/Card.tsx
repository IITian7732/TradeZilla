// src/components/ui/Card.tsx
import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', elevated = false, onClick, style }) => (
  <div
    className={`card ${elevated ? 'card-elevated' : ''} ${className}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    style={style}
  >
    {children}
  </div>
);

// ─── Stat Card ─────────────────────────────────────────────────────────────
export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: 'positive' | 'negative' | 'neutral';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon, trend, onClick }) => (
  <Card onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </p>
        <p className="mono" style={{ fontSize: 22, fontWeight: 700, color: '#0B0F19', lineHeight: 1.2 }}>
          {value}
        </p>
        {subValue && (
          <p className={`mono ${trend === 'positive' ? 'positive' : trend === 'negative' ? 'negative' : 'neutral-color'}`}
            style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>
            {subValue}
          </p>
        )}
      </div>
      {icon && (
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: trend === 'positive' ? 'rgba(16, 185, 129,0.1)' : trend === 'negative' ? 'rgba(239, 68, 68,0.1)' : 'rgba(14, 116, 144,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: trend === 'positive' ? '#10B981' : trend === 'negative' ? '#EF4444' : '#0E7490',
          flexShrink: 0,
        }}>
          {icon}
        </div>
      )}
    </div>
  </Card>
);

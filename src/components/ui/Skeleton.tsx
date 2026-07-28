// src/components/ui/Skeleton.tsx
import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 6,
  className = '',
  style,
}) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius, ...style }}
    role="status"
    aria-label="Loading..."
    aria-busy="true"
  />
);

// ─── Skeleton variants ─────────────────────────────────────────────────────
export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} width={i === lines - 1 ? '65%' : '100%'} height={14} />
    ))}
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton width={120} height={14} />
      <Skeleton width={60} height={20} borderRadius={10} />
    </div>
    <Skeleton width="55%" height={28} />
    <Skeleton width="40%" height={13} />
  </div>
);

export const SkeletonStockRow: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
    <Skeleton width={40} height={40} borderRadius={12} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Skeleton width={90} height={14} />
      <Skeleton width={60} height={12} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
      <Skeleton width={70} height={14} />
      <Skeleton width={50} height={12} />
    </div>
  </div>
);

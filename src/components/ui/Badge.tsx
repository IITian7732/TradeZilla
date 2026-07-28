// src/components/ui/Badge.tsx
import React from 'react';

export type BadgeVariant = 'positive' | 'negative' | 'neutral' | 'brand' | 'premium';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'brand', children, icon }) => (
  <span className={`badge badge-${variant}`}>
    {icon && <span aria-hidden="true">{icon}</span>}
    {children}
  </span>
);

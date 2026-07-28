// src/components/ui/EmptyState.tsx
import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '48px 24px', gap: 16, textAlign: 'center', minHeight: 220,
  }}>
    {icon && (
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'rgba(14, 116, 144,0.08)',
        border: '1px solid rgba(14, 116, 144,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#0E7490', marginBottom: 8,
      }}>
        {icon}
      </div>
    )}
    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0B0F19', margin: 0 }}>{title}</h3>
    {description && (
      <p style={{ fontSize: 14, color: '#64748B', margin: 0, maxWidth: 280, lineHeight: 1.6 }}>
        {description}
      </p>
    )}
    {action && (
      <Button onClick={action.onClick} style={{ marginTop: 8 }}>
        {action.label}
      </Button>
    )}
  </div>
);

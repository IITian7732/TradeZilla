// src/components/common/ErrorBoundary.tsx
import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '48px 24px', gap: 16, textAlign: 'center',
          minHeight: 220,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(239, 68, 68,0.1)', border: '1px solid rgba(239, 68, 68,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#EF4444',
          }}>
            <AlertOctagon size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0B0F19', margin: '0 0 6px' }}>
              Something went wrong
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0, maxWidth: 260 }}>
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

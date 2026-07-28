// src/pages/Orders.tsx
import React, { useState } from 'react';
import { useOrders, useCancelOrder } from '../hooks/useOrders';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton, SkeletonStockRow } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatINR, formatDate } from '../utils/formatters';
import { Briefcase, X } from 'lucide-react';
import type { Order } from '../types/trade';

const STATUS_BADGE: Record<Order['status'], 'positive' | 'negative' | 'neutral' | 'brand'> = {
  EXECUTED: 'positive', PENDING: 'brand', CANCELLED: 'neutral', REJECTED: 'negative',
};

export default function Orders() {
  const [tab, setTab] = useState<'ALL' | 'PENDING' | 'EXECUTED' | 'CANCELLED'>('ALL');
  const { data: orders = [], isLoading } = useOrders(tab === 'ALL' ? undefined : tab as Order['status']);
  const cancelOrder = useCancelOrder();

  return (
    <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 className="section-title">Orders</h1>
      <div className="tabs">
        {(['ALL', 'PENDING', 'EXECUTED', 'CANCELLED'] as const).map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '4px 16px' }}>{Array(4).fill(0).map((_, i) => <SkeletonStockRow key={i} />)}</div>
        ) : orders.length === 0 ? (
          <EmptyState icon={<Briefcase size={24} />} title="No orders found" description="Your order history will appear here." />
        ) : (
          orders.map((o, i) => (
            <div key={o.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              borderBottom: i < orders.length - 1 ? '1px solid #E2E8F0' : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: o.side === 'BUY' ? 'rgba(16, 185, 129,0.1)' : 'rgba(239, 68, 68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                color: o.side === 'BUY' ? '#10B981' : '#EF4444',
              }}>
                {o.side === 'BUY' ? '↑' : '↓'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0B0F19', margin: 0 }}>{o.symbol}</p>
                  <Badge variant={STATUS_BADGE[o.status]}>{o.status}</Badge>
                </div>
                <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                  {o.side} {o.quantity} shares · {o.orderType} · {formatDate(o.createdAt, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="mono" style={{ fontSize: 13, fontWeight: 700, color: '#0B0F19', margin: '0 0 2px' }}>
                  {o.executedPrice ? formatINR(o.executedPrice) : o.price ? formatINR(o.price) : 'Market'}
                </p>
                {o.status === 'PENDING' && (
                  <button onClick={() => cancelOrder.mutate(o.id)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0 }}
                    aria-label={`Cancel order for ${o.symbol}`}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ height: 16 }} />
    </div>
  );
}

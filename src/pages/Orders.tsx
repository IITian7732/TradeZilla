// src/pages/Orders.tsx
import React, { useState } from 'react';
import { useOrders, useCancelOrder, usePlaceOrder } from '../hooks/useOrders';
import { usePortfolio } from '../hooks/usePortfolio';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton, SkeletonStockRow } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatINR, formatDate } from '../utils/formatters';
import { Briefcase, X, FileText, Info } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import type { Order } from '../types/trade';

const STATUS_BADGE: Record<Order['status'], 'positive' | 'negative' | 'neutral' | 'brand'> = {
  EXECUTED: 'positive', PENDING: 'brand', CANCELLED: 'neutral', REJECTED: 'negative',
};

export default function Orders() {
  const [tab, setTab] = useState<'ALL' | 'PENDING' | 'EXECUTED' | 'CANCELLED'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { data: rawOrders = [], isLoading } = useOrders(tab === 'ALL' ? undefined : tab as Order['status']);
  const cancelOrder = useCancelOrder();
  const placeOrder = usePlaceOrder();
  const { holdings } = usePortfolio();

  const handleExitFromOrder = () => {
    if (!selectedOrder) return;
    const holding = holdings.find(h => h.symbol === selectedOrder.symbol);
    if (!holding) return;
    if (window.confirm(`Are you sure you want to exit your entire position of ${holding.quantity} shares in ${holding.symbol}?`)) {
      placeOrder.mutate({
        symbol: holding.symbol,
        exchange: holding.exchange,
        companyName: holding.companyName || holding.symbol,
        side: 'SELL',
        orderType: 'MARKET',
        quantity: holding.quantity,
      });
      setSelectedOrder(null);
    }
  };

  // Filter orders by date range
  const orders = rawOrders.filter(o => {
    if (!startDate && !endDate) return true;
    const orderDate = new Date(o.createdAt);
    
    let isValid = true;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (orderDate < start) isValid = false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (orderDate > end) isValid = false;
    }
    return isValid;
  });

  return (
    <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <h1 className="section-title" style={{ margin: 0 }}>Orders</h1>
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>From</label>
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{
                padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0',
                background: '#F8FAFC', color: '#0B0F19', fontSize: 13,
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>To</label>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{
                padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0',
                background: '#F8FAFC', color: '#0B0F19', fontSize: 13,
              }}
            />
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '6px', alignSelf: 'flex-end', marginBottom: 2 }}
              aria-label="Clear dates"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
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
            <div 
              key={o.id} 
              onClick={() => setSelectedOrder(o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderBottom: i < orders.length - 1 ? '1px solid #E2E8F0' : 'none',
                cursor: 'pointer', transition: 'background 0.2s'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
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
                  <button onClick={(e) => { e.stopPropagation(); cancelOrder.mutate(o.id); }}
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

      <Modal 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)}
        title="Order Details"
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0B0F19', margin: '0 0 4px' }}>
                  {selectedOrder.symbol}
                </h3>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                  {selectedOrder.companyName || 'Stock Market Asset'}
                </p>
              </div>
              <Badge variant={STATUS_BADGE[selectedOrder.status]}>{selectedOrder.status}</Badge>
            </div>

            {/* Grid data */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase' }}>Action</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: selectedOrder.side === 'BUY' ? '#10B981' : '#EF4444', margin: 0 }}>
                  {selectedOrder.side}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase' }}>Quantity</p>
                <p className="mono" style={{ fontSize: 14, fontWeight: 600, color: '#0B0F19', margin: 0 }}>
                  {selectedOrder.quantity} shares
                </p>
              </div>
              
              <div>
                <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase' }}>Order Type</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0B0F19', margin: 0 }}>
                  {selectedOrder.orderType} {selectedOrder.productType ? `(${selectedOrder.productType})` : ''}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase' }}>Order Price</p>
                <p className="mono" style={{ fontSize: 14, fontWeight: 600, color: '#0B0F19', margin: 0 }}>
                  {selectedOrder.price ? formatINR(selectedOrder.price) : 'Market'}
                </p>
              </div>

              {selectedOrder.status === 'EXECUTED' && (
                <>
                  <div>
                    <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase' }}>Executed Price</p>
                    <p className="mono" style={{ fontSize: 14, fontWeight: 600, color: '#0B0F19', margin: 0 }}>
                      {selectedOrder.executedPrice ? formatINR(selectedOrder.executedPrice) : '-'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase' }}>Capital Value</p>
                    <p className="mono" style={{ fontSize: 14, fontWeight: 600, color: '#0B0F19', margin: 0 }}>
                      {selectedOrder.executedPrice ? formatINR(selectedOrder.executedPrice * selectedOrder.quantity) : '-'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Timeline */}
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, marginTop: 4 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: selectedOrder.executedAt ? 16 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#94A3B8' }} />
                  {selectedOrder.executedAt && <div style={{ width: 2, flex: 1, background: '#E2E8F0', margin: '4px 0' }} />}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0B0F19', margin: '0 0 2px' }}>Order Placed</p>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                    {formatDate(selectedOrder.createdAt, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                  </p>
                </div>
              </div>
              
              {selectedOrder.executedAt && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0B0F19', margin: '0 0 2px' }}>Order Executed</p>
                    <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                      {formatDate(selectedOrder.executedAt, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(14, 116, 144, 0.05)', padding: 12, borderRadius: 8 }}>
              <Info size={16} color="#0E7490" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 11, color: '#0E7490', margin: 0, lineHeight: 1.4 }}>
                This represents a single order transaction (Buy or Sell). P&L is tracked per completed trade cycle, which can be viewed in your History tab.
              </p>
            </div>

            {holdings.some(h => h.symbol === selectedOrder.symbol) && (
              <Button 
                variant="primary" 
                style={{ background: '#EF4444', border: 'none', color: 'white' }} 
                onClick={handleExitFromOrder}
              >
                Exit Active Position
              </Button>
            )}
            
            <p style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 8 }}>
              Order ID: {selectedOrder.id}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

// src/pages/Trade.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, Info } from 'lucide-react';
import { useMarketStore } from '../store/marketStore';
import { useQuote } from '../hooks/useMarketData';
import { usePortfolio } from '../hooks/usePortfolio';
import { usePlaceOrder } from '../hooks/useOrders';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { formatINR, formatPct } from '../utils/formatters';
import { validateOrder } from '../utils/validators';
import type { OrderSide, OrderType } from '../types/trade';
import { POPULAR_STOCKS } from '../utils/constants';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true' || !import.meta.env.VITE_SUPABASE_URL;

export default function Trade() {
  const navigate = useNavigate();
  const { selectedSymbol, selectedExchange } = useMarketStore();
  const { data: quote, isLoading } = useQuote(selectedSymbol, selectedExchange);
  const { balance, holdings } = usePortfolio();
  const placeOrder = usePlaceOrder();

  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [productType, setProductType] = useState<'INTRADAY' | 'DELIVERY'>('DELIVERY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [hasStopLoss, setHasStopLoss] = useState(false);
  const [hasTarget, setHasTarget] = useState(false);
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const stock = POPULAR_STOCKS.find(s => s.symbol === selectedSymbol);
  const currentHolding = holdings.find(h => h.symbol === selectedSymbol);
  const marketPrice = quote?.ltp ?? 0;
  const estimatedCost = parseInt(quantity || '0') * (orderType === 'MARKET' ? marketPrice : parseFloat(price || '0'));

  useEffect(() => {
    setPrice(marketPrice > 0 ? marketPrice.toFixed(2) : '');
  }, [selectedSymbol, marketPrice]);

  const validate = () => {
    const result = validateOrder({
      side, orderType,
      quantity: parseInt(quantity || '0'),
      price: parseFloat(price),
      availableBalance: balance,
      currentHoldings: currentHolding?.quantity ?? 0,
      marketPrice,
    });
    setErrors(result.errors);
    return result.isValid;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    await placeOrder.mutateAsync({
      symbol: selectedSymbol,
      exchange: selectedExchange,
      companyName: stock?.companyName ?? selectedSymbol,
      side, orderType, productType,
      quantity: parseInt(quantity),
      price: orderType !== 'MARKET' ? parseFloat(price) : undefined,
      // Note: SL and Target could be passed here if the backend supported them
    });
    setConfirmOpen(false);
    setQuantity('');
    setHasStopLoss(false);
    setHasTarget(false);
    setStopLossPrice('');
    setTargetPrice('');
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stock header */}
      <div className="card">
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton width={120} height={22} />
            <Skeleton width={180} height={36} />
            <Skeleton width={100} height={14} />
          </div>
        ) : quote ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0B0F19', margin: '0 0 2px' }}>{quote.symbol}</h1>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{stock?.companyName ?? quote.symbol} · {quote.exchange}</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {quote.isStale && <span className="stale-tag">Data delayed</span>}
              </div>
            </div>
            <p className="mono" style={{ fontSize: 36, fontWeight: 900, color: '#0B0F19', margin: '0 0 4px', letterSpacing: '-1px' }}>
              {formatINR(quote.ltp)}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Badge variant={quote.changePct >= 0 ? 'positive' : 'negative'}>{formatPct(quote.changePct)}</Badge>
              <span className="mono" style={{ fontSize: 13, color: '#64748B' }}>
                O: {formatINR(quote.open)} · H: {formatINR(quote.high)} · L: {formatINR(quote.low)}
              </span>
            </div>
          </>
        ) : (
          <p style={{ color: '#64748B', fontSize: 14 }}>Stock data unavailable. Please search for another stock.</p>
        )}
      </div>

      {/* Holding info */}
      {currentHolding && (
        <div style={{ background: 'rgba(14, 116, 144,0.08)', border: '1px solid rgba(14, 116, 144,0.2)', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 2px' }}>You own</p>
            <p className="mono" style={{ fontSize: 15, fontWeight: 700, color: '#0E7490', margin: 0 }}>{currentHolding.quantity} shares</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 2px' }}>Avg buy price</p>
            <p className="mono" style={{ fontSize: 15, fontWeight: 700, color: '#475569', margin: 0 }}>{formatINR(currentHolding.avgBuyPrice)}</p>
          </div>
        </div>
      )}

      {/* Order form */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* BUY / SELL toggle */}
        <div className="tabs">
          <button className={`tab ${side === 'BUY' ? 'active' : ''}`} onClick={() => setSide('BUY')}
            style={{ ...(side === 'BUY' ? { background: '#10B981', color: '#F4F6F9' } : {}) }}>
            ▲ BUY
          </button>
          <button className={`tab ${side === 'SELL' ? 'active' : ''}`} onClick={() => setSide('SELL')}
            style={{ ...(side === 'SELL' ? { background: '#EF4444', color: 'white' } : {}) }}>
            ▼ SELL
          </button>
        </div>

        {/* Order type */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['MARKET', 'LIMIT'] as OrderType[]).map(t => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid',
                borderColor: orderType === t ? '#0E7490' : '#E2E8F0',
                background: orderType === t ? 'rgba(14, 116, 144,0.15)' : 'transparent',
                color: orderType === t ? '#0E7490' : '#64748B',
                fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Product type (Intraday / Delivery) */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: -8 }}>
          {(['DELIVERY', 'INTRADAY'] as ('INTRADAY' | 'DELIVERY')[]).map(t => (
            <button
              key={t}
              onClick={() => setProductType(t)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid',
                borderColor: productType === t ? '#F59E0B' : '#E2E8F0',
                background: productType === t ? 'rgba(245, 158, 11,0.1)' : 'transparent',
                color: productType === t ? '#F59E0B' : '#64748B',
                fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t === 'INTRADAY' ? 'Intraday (MIS)' : 'Delivery (CNC)'}
            </button>
          ))}
        </div>

        {/* Quantity */}
        <Input
          label="Quantity (shares)"
          type="number"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          placeholder="0"
          min="1"
          step="1"
          error={errors.quantity}
          id="trade-quantity"
        />

        {/* Price (for non-market orders) */}
        {orderType !== 'MARKET' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Limit price (₹)"
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0.00"
              step="0.05"
              error={errors.price}
              id="trade-price"
            />
            
            <div style={{ display: 'flex', gap: 16, marginTop: -4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#475569' }}>
                <input type="checkbox" checked={hasStopLoss} onChange={e => setHasStopLoss(e.target.checked)} style={{ accentColor: '#0E7490' }} />
                Stop Loss
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#475569' }}>
                <input type="checkbox" checked={hasTarget} onChange={e => setHasTarget(e.target.checked)} style={{ accentColor: '#0E7490' }} />
                Target
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              {hasStopLoss && (
                <div style={{ flex: 1 }}>
                  <Input
                    label="Stop Loss (₹)"
                    type="number"
                    value={stopLossPrice}
                    onChange={e => setStopLossPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.05"
                  />
                </div>
              )}
              {hasTarget && (
                <div style={{ flex: 1 }}>
                  <Input
                    label="Target (₹)"
                    type="number"
                    value={targetPrice}
                    onChange={e => setTargetPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.05"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estimated cost */}
        {quantity && (
          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>Estimated {side === 'BUY' ? 'cost' : 'proceeds'}</span>
            <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: '#0B0F19' }}>{formatINR(estimatedCost)}</span>
          </div>
        )}

        {/* Available balance */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#64748B' }}>Available balance</span>
          <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{formatINR(balance)}</span>
        </div>

        <Button
          variant={side === 'BUY' ? 'buy' : 'sell'}
          fullWidth
          size="lg"
          onClick={handleSubmit}
          disabled={!quote || !quantity}
        >
          {side === 'BUY' ? '▲ Place Buy Order' : '▼ Place Sell Order'}
        </Button>
      </div>

      {/* Confirm modal */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Order"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" fullWidth onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant={side === 'BUY' ? 'buy' : 'sell'} fullWidth onClick={handleConfirm} isLoading={placeOrder.isPending}>
              Confirm {side}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Stock', value: `${selectedSymbol} (${selectedExchange})` },
            { label: 'Order type', value: `${side} · ${orderType} · ${productType}` },
            { label: 'Quantity', value: `${quantity} shares` },
            { label: 'Price', value: orderType === 'MARKET' ? `Market (~${formatINR(marketPrice)})` : formatINR(parseFloat(price)) },
            ...(hasStopLoss ? [{ label: 'Stop Loss', value: stopLossPrice ? formatINR(parseFloat(stopLossPrice)) : 'Not set', highlight: false }] : []),
            ...(hasTarget ? [{ label: 'Target', value: targetPrice ? formatINR(parseFloat(targetPrice)) : 'Not set', highlight: false }] : []),
            { label: 'Est. total', value: formatINR(estimatedCost), highlight: true },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#64748B' }}>{row.label}</span>
              <span className={`mono ${row.highlight ? (side === 'BUY' ? 'positive' : 'negative') : ''}`} style={{ fontSize: 14, fontWeight: 700, color: row.highlight ? undefined : '#0B0F19' }}>{row.value}</span>
            </div>
          ))}
          <div className="divider" />
          <p style={{ fontSize: 12, color: '#64748B', textAlign: 'center', margin: 0 }}>
            <Info size={12} style={{ display: 'inline', marginRight: 4 }} />
            This is a paper trade. No real money will be transacted.
          </p>
        </div>
      </Modal>
    </div>
  );
}

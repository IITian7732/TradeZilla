import React, { useState, useEffect } from 'react';
import { X, Pin, ArrowLeftRight, ChevronDown, RefreshCw, Info } from 'lucide-react';
import { useMarketStore } from '../../store/marketStore';
import { useQuote } from '../../hooks/useMarketData';
import { usePortfolio } from '../../hooks/usePortfolio';
import { usePlaceOrder } from '../../hooks/useOrders';
import { validateOrder } from '../../utils/validators';
import { Modal } from '../ui/Modal';
import type { OrderSide, OrderType } from '../../types/trade';

interface ChartTradePanelProps {
  initialSide?: OrderSide;
  onClose: () => void;
  isInstantOrder?: boolean;
}

export function ChartTradePanel({ initialSide = 'BUY', onClose, isInstantOrder }: ChartTradePanelProps) {
  const { selectedSymbol, selectedExchange } = useMarketStore();
  const { data: quote, isLoading } = useQuote(selectedSymbol, selectedExchange);
  const { balance, holdings } = usePortfolio();
  const placeOrder = usePlaceOrder();

  const [side, setSide] = useState<OrderSide>(initialSide);
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [productType, setProductType] = useState<'INTRADAY' | 'DELIVERY'>('DELIVERY');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [hasStopLoss, setHasStopLoss] = useState(false);
  const [hasTarget, setHasTarget] = useState(false);
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'Regular' | 'GTT'>('Regular');

  useEffect(() => {
    setSide(initialSide);
  }, [initialSide]);

  const currentHolding = holdings.find(h => h.symbol === selectedSymbol);
  const marketPrice = quote?.ltp ?? 0;
  
  const effectiveOrderType = activeTab === 'GTT' ? 'LIMIT' : orderType;
  const estimatedCost = parseInt(quantity || '0') * (effectiveOrderType === 'MARKET' ? marketPrice : parseFloat(price || '0'));

  useEffect(() => {
    if (effectiveOrderType !== 'MARKET' && marketPrice > 0 && !price) {
      setPrice(marketPrice.toFixed(2));
    }
  }, [selectedSymbol, marketPrice, effectiveOrderType]);

  const validate = () => {
    const result = validateOrder({
      side, orderType: effectiveOrderType,
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
    if (isInstantOrder) {
      confirmTrade();
    } else {
      setShowConfirm(true);
    }
  };

  const confirmTrade = async () => {
    await placeOrder.mutateAsync({
      symbol: selectedSymbol,
      exchange: selectedExchange,
      companyName: selectedSymbol,
      side, orderType: effectiveOrderType, productType,
      quantity: parseInt(quantity),
      price: effectiveOrderType !== 'MARKET' ? parseFloat(price) : marketPrice,
      tp: (effectiveOrderType !== 'MARKET' && hasTarget && targetPrice) ? parseFloat(targetPrice) : undefined,
      sl: (effectiveOrderType !== 'MARKET' && hasStopLoss && stopLossPrice) ? parseFloat(stopLossPrice) : undefined,
    });
    
    setShowConfirm(false);
    onClose();
  };

  const handleQtyChange = (delta: number) => {
    const newQty = parseInt(quantity || '0') + delta;
    if (newQty > 0) setQuantity(newQty.toString());
  };

  return (
    <div style={{
      width: 380,
      height: '100%',
      background: '#FFFFFF',
      borderLeft: '1px solid #E2E8F0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      zIndex: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#0F172A' }}>Place Order</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: 0 }}>
            <Pin size={16} />
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: 0 }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body scrollable */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
        
        {/* Symbol Info */}
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{selectedSymbol}</span>
            </div>
            <div style={{ fontSize: 12, color: (quote?.changePct ?? 0) >= 0 ? '#10B981' : '#EF4444', marginTop: 4 }}>
              {quote ? `${(quote.changePct >= 0 ? '+' : '')}${(quote.ltp - quote.close).toFixed(2)} (${(quote.changePct >= 0 ? '+' : '')}${quote.changePct.toFixed(2)}%)` : '--'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: (quote?.changePct ?? 0) >= 0 ? '#10B981' : '#EF4444' }}>
              {quote?.ltp.toFixed(2) ?? '--'} <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{selectedExchange}</span>
            </div>
          </div>
        </div>

        {/* Tabs: Regular / GTT */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 16px', gap: 24 }}>
          {['Regular', 'GTT'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                background: 'none', border: 'none', padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                color: activeTab === tab ? '#0F172A' : '#64748B',
                borderBottom: activeTab === tab ? '2px solid #5B21B6' : '2px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* GTT Banner */}
          {activeTab === 'GTT' && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: '12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Info size={16} color="#0F172A" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
                This order is active till 1 Aug 2027 (1 year).<br />
                <a href="#" style={{ color: '#5B21B6', textDecoration: 'underline' }}>Learn more</a>
              </div>
            </div>
          )}

          {/* Product Type */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => setProductType('DELIVERY')}
              style={{ 
                flex: 1, padding: '10px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: '1px solid',
                borderColor: productType === 'DELIVERY' ? '#5B21B6' : '#E2E8F0',
                background: productType === 'DELIVERY' ? '#5B21B6' : '#FFFFFF',
                color: productType === 'DELIVERY' ? '#FFFFFF' : '#475569'
              }}
            >
              Delivery (Longterm)
            </button>
            <button 
              onClick={() => setProductType('INTRADAY')}
              style={{ 
                flex: 1, padding: '10px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: '1px solid',
                borderColor: productType === 'INTRADAY' ? '#5B21B6' : '#E2E8F0',
                background: productType === 'INTRADAY' ? '#5B21B6' : '#FFFFFF',
                color: productType === 'INTRADAY' ? '#FFFFFF' : '#475569'
              }}
            >
              Intraday (Same day)
            </button>
          </div>

          {/* Quantity and Side */}
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Quantity Controls */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, cursor: 'pointer' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>Quantity</span>
                <ChevronDown size={14} color="#64748B" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                <button onClick={() => handleQtyChange(-1)} style={{ background: '#F8FAFC', border: 'none', padding: '10px', cursor: 'pointer', color: '#64748B', fontWeight: 600 }}>-</button>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)}
                  style={{ width: '100%', border: 'none', textAlign: 'center', padding: '10px', fontSize: 14, fontWeight: 500, outline: 'none' }}
                />
                <button onClick={() => handleQtyChange(1)} style={{ background: '#F8FAFC', border: 'none', padding: '10px', cursor: 'pointer', color: '#64748B', fontWeight: 600 }}>+</button>
              </div>
            </div>
            
            {/* Side Controls */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>Side</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button 
                  onClick={() => setSide('BUY')}
                  style={{ 
                    flex: 1, padding: '10px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: '1px solid', borderColor: side === 'BUY' ? '#10B981' : '#E2E8F0',
                    background: side === 'BUY' ? '#10B981' : '#FFFFFF',
                    color: side === 'BUY' ? '#FFFFFF' : '#475569'
                  }}
                >
                  Buy
                </button>
                <button 
                  onClick={() => setSide('SELL')}
                  style={{ 
                    flex: 1, padding: '10px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: '1px solid', borderColor: side === 'SELL' ? '#EF4444' : '#E2E8F0',
                    background: side === 'SELL' ? '#EF4444' : '#FFFFFF',
                    color: side === 'SELL' ? '#FFFFFF' : '#475569'
                  }}
                >
                  Sell
                </button>
              </div>
            </div>
          </div>

          {/* Order Type Toggle & Price Input */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>Place order</span>
                <span onClick={() => { if (activeTab !== 'GTT') setOrderType(orderType === 'MARKET' ? 'LIMIT' : 'MARKET'); }} style={{ color: '#5B21B6', fontSize: 12, fontWeight: 600, borderBottom: '1px dashed #5B21B6' }}>
                  {activeTab === 'GTT' ? 'If price is below' : (orderType === 'MARKET' ? 'At market price' : 'At limit price')}
                </span>
                <ChevronDown size={14} color="#5B21B6" />
              </div>
            </div>
            {(orderType === 'LIMIT' || activeTab === 'GTT') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 2, display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                  <span style={{ padding: '10px 12px', background: '#F8FAFC', color: '#64748B', fontWeight: 500, fontSize: 14 }}>₹</span>
                  <input 
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    style={{ width: '100%', border: 'none', padding: '10px', fontSize: 14, fontWeight: 500, outline: 'none' }}
                  />
                </div>
                <div style={{ color: '#94A3B8' }}><ArrowLeftRight size={16} /></div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                  <input 
                    type="number"
                    placeholder="0.00"
                    style={{ width: '100%', border: 'none', padding: '10px', fontSize: 14, fontWeight: 500, outline: 'none', textAlign: 'right' }}
                  />
                  <span style={{ padding: '10px 12px', background: '#F8FAFC', color: '#64748B', fontWeight: 500, fontSize: 14 }}>%</span>
                </div>
              </div>
            )}
          </div>

          {/* Stop Loss and Target */}
          {(orderType === 'LIMIT' || activeTab === 'GTT') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={hasStopLoss} 
                  onChange={e => setHasStopLoss(e.target.checked)} 
                  style={{ width: 16, height: 16, accentColor: '#5B21B6', cursor: 'pointer' }}
                />
                Add stop loss
              </label>
              {hasStopLoss && (
                <div style={{ paddingLeft: 24, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 2, display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                    <span style={{ padding: '8px 10px', background: '#F8FAFC', color: '#64748B', fontWeight: 500, fontSize: 13 }}>₹</span>
                    <input 
                      type="number" 
                      value={stopLossPrice} 
                      onChange={e => setStopLossPrice(e.target.value)} 
                      style={{ width: '100%', border: 'none', padding: '8px', fontSize: 13, fontWeight: 500, outline: 'none' }}
                    />
                  </div>
                  <div style={{ color: '#94A3B8' }}><ArrowLeftRight size={14} /></div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                    <input 
                      type="number"
                      placeholder="0.00"
                      style={{ width: '100%', border: 'none', padding: '8px', fontSize: 13, fontWeight: 500, outline: 'none', textAlign: 'right' }}
                    />
                    <span style={{ padding: '8px 10px', background: '#F8FAFC', color: '#64748B', fontWeight: 500, fontSize: 13 }}>%</span>
                  </div>
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={hasTarget} 
                  onChange={e => setHasTarget(e.target.checked)} 
                  style={{ width: 16, height: 16, accentColor: '#5B21B6', cursor: 'pointer' }}
                />
                Add target
              </label>
              {hasTarget && (
                <div style={{ paddingLeft: 24, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 2, display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                    <span style={{ padding: '8px 10px', background: '#F8FAFC', color: '#64748B', fontWeight: 500, fontSize: 13 }}>₹</span>
                    <input 
                      type="number" 
                      value={targetPrice} 
                      onChange={e => setTargetPrice(e.target.value)} 
                      style={{ width: '100%', border: 'none', padding: '8px', fontSize: 13, fontWeight: 500, outline: 'none' }}
                    />
                  </div>
                  <div style={{ color: '#94A3B8' }}><ArrowLeftRight size={14} /></div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                    <input 
                      type="number"
                      placeholder="0.00"
                      style={{ width: '100%', border: 'none', padding: '8px', fontSize: 13, fontWeight: 500, outline: 'none', textAlign: 'right' }}
                    />
                    <span style={{ padding: '8px 10px', background: '#F8FAFC', color: '#64748B', fontWeight: 500, fontSize: 13 }}>%</span>
                  </div>
                </div>
              )}
              
              {/* MPP Banner - Only for Regular */}
              {activeTab !== 'GTT' && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Info size={14} color="#64748B" />
                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
                      Protect your order with MPP
                    </span>
                  </div>
                  <span style={{ color: '#5B21B6', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Enable MPP
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Insufficient Funds Warning */}
          {estimatedCost > balance && (
            <div style={{ color: '#EF4444', fontSize: 12, lineHeight: 1.4 }}>
              You've insufficient funds to {side.toLowerCase()} {selectedSymbol}. To continue, add funds.
            </div>
          )}

          {/* Info Banner & T&C */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Info size={14} color="#64748B" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
                Markets are closed. Order will be placed during the next trading session.
              </span>
            </div>
            
            <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>
              I accept the <a href="#" style={{ color: '#5B21B6', textDecoration: 'none', fontWeight: 500 }}>T&C</a> and agree that the execution of the triggered order is not guaranteed.
            </div>
          </div>
          
        </div>
      </div>

      {/* Footer Area */}
      <div style={{ borderTop: '1px solid #E2E8F0', padding: '16px', background: '#FAFAFA' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0F172A' }}>
            <span style={{ color: '#5B21B6', fontWeight: 600 }}>Required:</span> 
            <span style={{ fontWeight: 600 }}>₹ {estimatedCost.toFixed(2)}</span>
            <RefreshCw size={12} color="#64748B" cursor="pointer" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0F172A' }}>
            <span style={{ color: '#64748B' }}>Available:</span> 
            <span style={{ fontWeight: 600, color: estimatedCost > balance ? '#EF4444' : '#0F172A' }}>₹ {balance.toFixed(2)}</span>
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={placeOrder.isPending}
          style={{
            width: '100%',
            padding: '14px',
            border: 'none',
            borderRadius: 6,
            fontSize: 15,
            fontWeight: 700,
            cursor: placeOrder.isPending ? 'not-allowed' : 'pointer',
            background: side === 'BUY' ? '#10B981' : '#EF4444',
            color: '#FFFFFF',
            opacity: placeOrder.isPending ? 0.7 : 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {placeOrder.isPending ? 'Processing...' : `Place ${side.toLowerCase()} order`}
        </button>
      </div>

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Order"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: 6, fontWeight: 600, color: '#334155' }}>Cancel</button>
            <button 
              onClick={confirmTrade}
              disabled={placeOrder.isPending}
              style={{ flex: 1, padding: '10px', background: side === 'BUY' ? '#10B981' : '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}
            >
              {placeOrder.isPending ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 14, color: '#475569' }}>
            Are you sure you want to place a <strong>{side}</strong> order for <strong>{quantity}</strong> shares of <strong>{selectedSymbol}</strong> at {effectiveOrderType === 'MARKET' ? 'Market Price' : `₹${price}`}?
          </p>
          {(hasTarget || hasStopLoss) && effectiveOrderType !== 'MARKET' && (
            <div style={{ background: '#F8FAFC', padding: 10, borderRadius: 6, fontSize: 13, color: '#334155' }}>
              {hasTarget && <div>Take Profit: ₹{targetPrice}</div>}
              {hasStopLoss && <div>Stop Loss: ₹{stopLossPrice}</div>}
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
}

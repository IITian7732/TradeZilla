import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Square, Minimize2 } from 'lucide-react';
import { usePortfolio } from '../../hooks/usePortfolio';
import { useOrders, useCancelOrder, usePlaceOrder } from '../../hooks/useOrders';
import { useAuthStore } from '../../store/authStore';
import { useRecentTrades } from '../../hooks/useTradingStats';

interface ChartDashboardPanelProps {
  isMaximized: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeOrderTab: string;
  setActiveOrderTab: (tab: string) => void;
  onToggleMaximize?: () => void;
  onClose?: () => void;
}

export function ChartDashboardPanel({ 
  isMaximized, 
  activeTab, 
  setActiveTab,
  activeOrderTab,
  setActiveOrderTab,
  onToggleMaximize,
  onClose
}: ChartDashboardPanelProps) {
  const { holdings = [], totalUnrealisedPnL, totalInvested, totalCurrentValue } = usePortfolio();
  const { data: orders = [] } = useOrders();
  const { account } = useAuthStore();
  const { data: recentTrades = [] } = useRecentTrades();
  const cancelOrder = useCancelOrder();
  const placeOrder = usePlaceOrder();
  const navigate = useNavigate();

  const TABS = ['Positions', 'Orders', 'GTT Orders', 'Funds', 'Closed Positions', 'Holdings'];
  const ORDER_TABS = ['All', 'Working', 'Inactive', 'Filled', 'Cancelled', 'Rejected'];

  const filteredOrders = useMemo(() => {
    if (activeOrderTab === 'All') return orders;
    if (activeOrderTab === 'Working') return orders.filter(o => o.status === 'PENDING');
    if (activeOrderTab === 'Filled') return orders.filter(o => o.status === 'EXECUTED');
    if (activeOrderTab === 'Cancelled') return orders.filter(o => o.status === 'CANCELLED');
    if (activeOrderTab === 'Inactive') return orders.filter(o => o.status === 'CANCELLED' || o.status === 'EXECUTED');
    return orders; // Rejected, etc.
  }, [orders, activeOrderTab]);

  return (
    <div style={{
      height: isMaximized ? 'calc(100vh - 100px)' : 300,
      background: '#FFFFFF',
      borderTop: '1px solid #E2E8F0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
      zIndex: 10
    }}>


      {/* Account Info and P&L Summary Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Account:</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>***</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 12, color: '#0F172A', fontWeight: 600 }}>Today's Positions P&L</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>₹0.00</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 12, color: '#0F172A', fontWeight: 600 }}>Total Positions P&L</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: (totalUnrealisedPnL || 0) >= 0 ? '#10B981' : '#EF4444' }}>
              {(totalUnrealisedPnL || 0) >= 0 ? '+' : ''}₹{(totalUnrealisedPnL || 0).toFixed(2)}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 12, color: '#0F172A', fontWeight: 600 }}>Holdings P&L</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: (totalCurrentValue - totalInvested) >= 0 ? '#10B981' : '#EF4444' }}>
               {(totalCurrentValue - totalInvested) >= 0 ? '+' : ''}₹{(totalCurrentValue - totalInvested).toFixed(2)}
            </span>
          </div>

        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 16px' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 500,
              color: activeTab === tab ? '#2563EB' : '#64748B',
              borderBottom: activeTab === tab ? '2px solid #2563EB' : '2px solid transparent',
              outline: 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Sub Tabs for Orders */}
      {activeTab === 'Orders' && (
        <div style={{ display: 'flex', gap: 16, padding: '8px 16px', borderBottom: '1px solid #F1F5F9' }}>
          {ORDER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveOrderTab(tab)}
              style={{
                background: activeOrderTab === tab ? '#F1F5F9' : 'transparent',
                border: 'none',
                borderRadius: 4,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: activeOrderTab === tab ? '#0F172A' : '#64748B',
                cursor: 'pointer'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {activeTab === 'Positions' && (
          <div>
            {holdings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: 13 }}>
                There are no open positions in your trading account yet
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: '#64748B', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Symbol</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Exchange</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Side</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Product</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Net Qty</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Avg trade price</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>LTP</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Trade-wise Realised PnL</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Trade-wise Unrealised PnL</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 0', fontWeight: 600 }}>{h.symbol}</td>
                      <td style={{ padding: '12px 0' }}>{h.exchange}</td>
                      <td style={{ padding: '12px 0' }}>BUY</td>
                      <td style={{ padding: '12px 0' }}>DELIVERY</td>
                      <td style={{ padding: '12px 0' }}>{h.quantity}</td>
                      <td style={{ padding: '12px 0' }}>₹{h.avgBuyPrice.toFixed(2)}</td>
                      <td style={{ padding: '12px 0' }}>₹{(h.currentPrice || h.avgBuyPrice).toFixed(2)}</td>
                      <td style={{ padding: '12px 0' }}>₹0.00</td>
                      <td style={{ padding: '12px 0', color: (h.pnl || 0) >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                        {(h.pnl || 0) >= 0 ? '+' : ''}{(h.pnl || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 0' }}>
                        <button 
                          onClick={() => {
                            placeOrder.mutate({
                              symbol: h.symbol,
                              exchange: h.exchange as any,
                              companyName: h.companyName,
                              side: 'SELL',
                              orderType: 'MARKET',
                              quantity: h.quantity,
                              price: h.currentPrice,
                            });
                          }}
                          style={{ background: '#EF4444', color: '#FFF', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                        >
                          Exit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'Orders' && (
          <div>
            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: 13 }}>
                There is no trading data here yet
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: '#64748B', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Symbol</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Exchange</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Status</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Date and Time</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Product ↑</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Side</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Qty</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Traded qty</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Limit Price</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Traded Price</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Rejection Reason</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Order Type</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Trigger Price</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Order Number</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Exchange Order No</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 0', fontWeight: 600 }}>{o.symbol}</td>
                      <td style={{ padding: '12px 0' }}>{(o as any).exchange || 'NSE'}</td>
                      <td style={{ padding: '12px 0' }}>
                        <span style={{ 
                          background: o.status === 'EXECUTED' ? '#D1FAE5' : o.status === 'PENDING' ? '#FEF3C7' : '#F1F5F9',
                          color: o.status === 'EXECUTED' ? '#065F46' : o.status === 'PENDING' ? '#92400E' : '#475569',
                          padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700
                        }}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 0' }}>{new Date(o.createdAt).toLocaleString()}</td>
                      <td style={{ padding: '12px 0' }}>DELIVERY</td>
                      <td style={{ padding: '12px 0', color: o.side === 'BUY' ? '#10B981' : '#EF4444', fontWeight: 600 }}>{o.side}</td>
                      <td style={{ padding: '12px 0' }}>{o.quantity}</td>
                      <td style={{ padding: '12px 0' }}>0</td>
                      <td style={{ padding: '12px 0' }}>{o.price ? `₹${o.price.toFixed(2)}` : 'MKT'}</td>
                      <td style={{ padding: '12px 0' }}>{o.executedPrice ? `₹${o.executedPrice.toFixed(2)}` : '0.00'}</td>
                      <td style={{ padding: '12px 0' }}>-</td>
                      <td style={{ padding: '12px 0' }}>{o.orderType}</td>
                      <td style={{ padding: '12px 0' }}>-</td>
                      <td style={{ padding: '12px 0' }}>{o.id.substring(0, 8)}</td>
                      <td style={{ padding: '12px 0' }}>-</td>
                      <td style={{ padding: '12px 0' }}>
                        {o.status === 'PENDING' && (
                          <button 
                            onClick={() => cancelOrder.mutate(o.id)}
                            style={{ background: '#EF4444', color: '#FFF', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'GTT Orders' && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: 13 }}>
            There is no trading data here yet
          </div>
        )}

        {activeTab === 'Funds' && (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ color: '#64748B', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '8px 0', fontWeight: 500 }}>Segment</th>
                  <th style={{ padding: '8px 0', fontWeight: 500 }}>Available Balance</th>
                  <th style={{ padding: '8px 0', fontWeight: 500 }}>Margin Utilized</th>
                  <th style={{ padding: '8px 0', fontWeight: 500 }}>Opening Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px 0', fontWeight: 600 }}>SECURITIES</td>
                  <td style={{ padding: '12px 0' }}>₹{(account?.balance || 0).toFixed(2)}</td>
                  <td style={{ padding: '12px 0' }}>₹0.00</td>
                  <td style={{ padding: '12px 0' }}>₹{(account?.balance || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Closed Positions' && (
          <div>
            {recentTrades.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: 13 }}>
                There is no trading data here yet
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: '#64748B', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Symbol</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Exchange</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Product</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Avg buy price</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Avg sell price</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Total buy qty</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Total sell qty</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>LTP</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Realised PnL</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Unrealised PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 0', fontWeight: 600 }}>{t.symbol}</td>
                      <td style={{ padding: '12px 0' }}>NSE</td>
                      <td style={{ padding: '12px 0' }}>DELIVERY</td>
                      <td style={{ padding: '12px 0' }}>₹{t.side === 'BUY' ? t.price.toFixed(2) : '0.00'}</td>
                      <td style={{ padding: '12px 0' }}>₹{t.side === 'SELL' ? t.price.toFixed(2) : '0.00'}</td>
                      <td style={{ padding: '12px 0' }}>{t.side === 'BUY' ? t.quantity : 0}</td>
                      <td style={{ padding: '12px 0' }}>{t.side === 'SELL' ? t.quantity : 0}</td>
                      <td style={{ padding: '12px 0' }}>₹{t.price.toFixed(2)}</td>
                      <td style={{ padding: '12px 0', color: (t.pnl || 0) >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                        {(t.pnl || 0) >= 0 ? '+' : ''}{(t.pnl || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 0' }}>₹0.00</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'Holdings' && (
          <div>
            {holdings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: 13 }}>
                There is no trading data here yet
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: '#64748B', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Symbol</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Net Quantity</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Avg. Price</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Last Traded Price</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Investment</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Current Value</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Day P&L</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Day %</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Overall P&L</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Overall %</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Demat Qty.</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>T1 Qty.</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map(h => {
                    const price = h.currentPrice || h.avgBuyPrice;
                    const invested = h.quantity * h.avgBuyPrice;
                    const current = h.quantity * price;
                    const overallPnl = current - invested;
                    const overallPct = invested > 0 ? (overallPnl / invested) * 100 : 0;
                    return (
                      <tr key={h.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 0', fontWeight: 600 }}>{h.symbol}</td>
                        <td style={{ padding: '12px 0' }}>{h.quantity}</td>
                        <td style={{ padding: '12px 0' }}>₹{h.avgBuyPrice.toFixed(2)}</td>
                        <td style={{ padding: '12px 0' }}>₹{(h.currentPrice || h.avgBuyPrice).toFixed(2)}</td>
                        <td style={{ padding: '12px 0' }}>₹{invested.toFixed(2)}</td>
                        <td style={{ padding: '12px 0' }}>₹{current.toFixed(2)}</td>
                        <td style={{ padding: '12px 0' }}>₹0.00</td>
                        <td style={{ padding: '12px 0' }}>0.00%</td>
                        <td style={{ padding: '12px 0', color: overallPnl >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                          {overallPnl >= 0 ? '+' : ''}₹{overallPnl.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 0', color: overallPnl >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                          {overallPnl >= 0 ? '+' : ''}{overallPct.toFixed(2)}%
                        </td>
                        <td style={{ padding: '12px 0' }}>{h.quantity}</td>
                        <td style={{ padding: '12px 0' }}>0</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

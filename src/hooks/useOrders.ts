import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import type { Order, OrderSide, OrderType } from '../types/trade';
import { calcCharges } from '../utils/brokerageCalculator';

import { MOCK_HOLDINGS } from './usePortfolio';
import { MOCK_STATS, MOCK_RECENT_TRADES } from './useTradingStats';
import { calcWinRate } from '../utils/calculations';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true' ||
  !import.meta.env.VITE_SUPABASE_URL;

export const MOCK_ORDERS: Order[] = [];

export interface PlaceOrderInput {
  symbol: string;
  exchange: 'NSE' | 'BSE';
  companyName: string;
  side: OrderSide;
  orderType: OrderType;
  productType?: 'INTRADAY' | 'DELIVERY';
  quantity: number;
  price?: number;
  triggerPrice?: number;
  tp?: number;
  sl?: number;
}

export function useOrders(status?: Order['status']) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['orders', user?.id, status],
    queryFn: async (): Promise<Order[]> => {
      if (USE_MOCK) {
        return status ? MOCK_ORDERS.filter(o => o.status === status) : MOCK_ORDERS;
      }
      if (!user?.id) return [];
      let query = supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(o => ({
        id: o.id, userId: o.user_id, symbol: o.symbol, exchange: o.exchange,
        companyName: o.company_name, orderType: o.order_type, side: o.side,
        quantity: o.quantity, price: o.price, triggerPrice: o.trigger_price,
        status: o.status, executedPrice: o.executed_price,
        executedAt: o.executed_at, createdAt: o.created_at,
      }));
    },
    staleTime: 15000,
    enabled: !!user?.id || USE_MOCK,
  });
}

export function usePlaceOrder() {
  const { user, account, setAccount } = useAuthStore();
  const { addToast } = useUIStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: PlaceOrderInput) => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 500));
        const execPrice = input.price ?? (Math.random() * 1000 + 100);
        const isPending = input.orderType !== 'MARKET';
        const productType = input.productType ?? 'DELIVERY';

        const mockOrder: Order = {
          id: Math.random().toString(36).slice(2),
          userId: 'mock',
          ...input,
          status: isPending ? 'PENDING' : 'EXECUTED',
          executedPrice: isPending ? undefined : execPrice,
          executedAt: isPending ? undefined : new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        MOCK_ORDERS.unshift(mockOrder);

        if (!isPending) {
          const orderValue = mockOrder.quantity * execPrice;
          // Calculate brokerage charges
          const charges = calcCharges({
            side: input.side,
            productType,
            quantity: input.quantity,
            price: execPrice,
            exchange: input.exchange,
          });

          if (input.side === 'BUY') {
            // Cost = order value + all charges
            const totalCost = orderValue + charges.total;
            if (account) setAccount({ ...account, balance: account.balance - totalCost });

            const existing = MOCK_HOLDINGS.find(h => h.symbol === input.symbol);

            if (existing && (existing as any).isShort) {
              // Covering a short position
              const shortAvg = existing.avgBuyPrice;
              const pnl = (shortAvg - execPrice) * Math.min(mockOrder.quantity, existing.quantity) - charges.total;
              existing.quantity -= input.quantity;
              if (existing.quantity <= 0) {
                const idx = MOCK_HOLDINGS.findIndex(h => h.symbol === input.symbol && (h as any).isShort);
                if (idx >= 0) MOCK_HOLDINGS.splice(idx, 1);
              }
              MOCK_STATS.totalTrades += 1;
              MOCK_STATS.bestTradePnl = Math.max(MOCK_STATS.bestTradePnl, pnl);
              MOCK_RECENT_TRADES.unshift({
                id: mockOrder.id, userId: 'mock', symbol: input.symbol,
                exchange: input.exchange, side: 'BUY', quantity: input.quantity,
                price: execPrice, pnl, tradedAt: mockOrder.executedAt!,
              } as any);
              MOCK_STATS.winRate = calcWinRate(MOCK_RECENT_TRADES as any) ?? 0;
            } else if (existing) {
              // Adding to long position
              const totalValue = (existing.quantity * existing.avgBuyPrice) + orderValue;
              existing.quantity += input.quantity;
              existing.avgBuyPrice = totalValue / existing.quantity;
            } else {
              // New long position
              MOCK_HOLDINGS.push({
                id: Math.random().toString(),
                symbol: input.symbol, exchange: input.exchange,
                companyName: input.companyName, quantity: input.quantity,
                avgBuyPrice: execPrice, currentPrice: execPrice,
                currentValue: orderValue, investedValue: orderValue,
                productType,
              } as any);
            }
          } else {
            // SELL
            const proceeds = orderValue - charges.total;
            const existingIdx = MOCK_HOLDINGS.findIndex(h => h.symbol === input.symbol && !(h as any).isShort);

            if (existingIdx >= 0) {
              // Normal sell of long position
              if (account) setAccount({ ...account, balance: account.balance + proceeds });
              const h = MOCK_HOLDINGS[existingIdx];
              const pnl = (execPrice - h.avgBuyPrice) * mockOrder.quantity - charges.total;
              h.quantity -= input.quantity;
              if (h.quantity <= 0) MOCK_HOLDINGS.splice(existingIdx, 1);

              MOCK_STATS.totalTrades += 1;
              MOCK_STATS.bestTradePnl = Math.max(MOCK_STATS.bestTradePnl, pnl);
              MOCK_RECENT_TRADES.unshift({
                id: mockOrder.id, userId: 'mock', symbol: input.symbol,
                exchange: input.exchange, side: 'SELL', quantity: input.quantity,
                price: execPrice, pnl, tradedAt: mockOrder.executedAt!,
              } as any);
              MOCK_STATS.winRate = calcWinRate(MOCK_RECENT_TRADES as any) ?? 0;
            } else if (productType === 'INTRADAY') {
              // Short sell — intraday only; create a short position
              // Margin requirement: 20% of order value (simplified)
              const marginRequired = orderValue * 0.2 + charges.total;
              if (account) setAccount({ ...account, balance: account.balance - marginRequired });

              const existingShort = MOCK_HOLDINGS.find(h => h.symbol === input.symbol && (h as any).isShort);
              if (existingShort) {
                const totalValue = (existingShort.quantity * existingShort.avgBuyPrice) + orderValue;
                existingShort.quantity += input.quantity;
                existingShort.avgBuyPrice = totalValue / existingShort.quantity;
              } else {
                MOCK_HOLDINGS.push({
                  id: Math.random().toString(),
                  symbol: input.symbol, exchange: input.exchange,
                  companyName: input.companyName, quantity: input.quantity,
                  avgBuyPrice: execPrice, currentPrice: execPrice,
                  currentValue: orderValue, investedValue: orderValue,
                  isShort: true, productType: 'INTRADAY',
                } as any);
              }
            }
          }
        }
        return mockOrder;
      }

      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('place-order', {
        body: { userId: user.id, ...input },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['holdings'] });
      qc.invalidateQueries({ queryKey: ['trading-stats'] });
      qc.invalidateQueries({ queryKey: ['recent-trades'] });
      addToast({
        type: 'success',
        title: `Order ${(order as Order).status === 'EXECUTED' ? 'Executed' : 'Placed'}`,
        message: `${(order as Order).side} ${(order as Order).quantity} ${(order as Order).symbol}`,
        duration: 5000,
      });
    },
    onError: (err: Error) => {
      addToast({ type: 'error', title: 'Order Failed', message: err.message });
    },
  });
}

export function useCancelOrder() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (USE_MOCK) {
        const order = MOCK_ORDERS.find(o => o.id === orderId);
        if (order) order.status = 'CANCELLED';
        return;
      }
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('orders')
        .update({ status: 'CANCELLED' })
        .eq('id', orderId)
        .eq('user_id', user.id)
        .eq('status', 'PENDING');
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      addToast({ type: 'info', title: 'Order Cancelled' });
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Cancel failed', message: err.message }),
  });
}

// src/hooks/usePortfolio.ts
// SINGLE source of truth for portfolio-derived numbers (current value, P&L).
// Dashboard, Portfolio page, and Trade screen all import this hook.
// Do NOT recompute portfolio metrics independently in any page.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/authStore';
import { calcUnrealisedPnL, calcPnLPct } from '../utils/calculations';
import { fetchQuote } from '../api/marketData';
import type { Holding } from '../types/trade';
import { MOCK_ACCOUNT } from './useAuth';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true' ||
  !import.meta.env.VITE_SUPABASE_URL;

export const MOCK_HOLDINGS: Holding[] = [];

export function usePortfolio() {
  const { user, account } = useAuthStore();

  const holdingsQuery = useQuery({
    queryKey: ['holdings', user?.id],
    queryFn: async (): Promise<Holding[]> => {
      if (USE_MOCK) return MOCK_HOLDINGS;
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', user.id)
        .gt('quantity', 0);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Enrich with current prices
      const enriched = await Promise.all(
        data.map(async (h) => {
          const quote = await fetchQuote(h.symbol, h.exchange);
          const investedValue = h.quantity * h.avg_buy_price;
          const currentPrice = quote.ltp;
          const currentValue = h.quantity * currentPrice;
          const pnl = calcUnrealisedPnL({ quantity: h.quantity, avgBuyPrice: h.avg_buy_price, currentPrice });
          const pnlPct = calcPnLPct(pnl, investedValue);
          return {
            id: h.id,
            symbol: h.symbol,
            exchange: h.exchange,
            companyName: h.company_name,
            quantity: h.quantity,
            avgBuyPrice: h.avg_buy_price,
            currentPrice,
            currentValue,
            investedValue,
            pnl,
            pnlPct,
          } as Holding;
        })
      );
      return enriched;
    },
    staleTime: 30000,
    enabled: !!user?.id || USE_MOCK,
  });

  const holdings = holdingsQuery.data ?? [];
  const totalInvested = holdings.reduce((s, h) => s + h.investedValue, 0);
  const totalCurrentValue = holdings.reduce((s, h) => s + (h.currentValue ?? h.investedValue), 0);
  const totalUnrealisedPnL = holdings.reduce((s, h) => s + (h.pnl ?? 0), 0);
  const totalPortfolioValue = (account?.balance ?? 0) + totalCurrentValue;

  return {
    holdings,
    isLoading: holdingsQuery.isLoading,
    error: holdingsQuery.error,
    totalInvested,
    totalCurrentValue,
    totalUnrealisedPnL,
    totalPortfolioValue,
    balance: account?.balance ?? (USE_MOCK ? MOCK_ACCOUNT.balance : 0),
  };
}

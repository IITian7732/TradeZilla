// src/hooks/useTradingStats.ts
// SINGLE source of truth for trade count, win rate, best trade P&L.
// Profile page and Leaderboard both import this hook — never recompute independently.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/authStore';
import { calcWinRate, calcBestTradePnL } from '../utils/calculations';
import type { TradingStats } from '../types/user';
import type { Trade } from '../types/trade';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true' ||
  !import.meta.env.VITE_SUPABASE_URL;

export const MOCK_STATS: TradingStats = {
  totalTrades: 0,
  winRate: 0,
  bestTradePnl: 0,
};

export const MOCK_RECENT_TRADES: Trade[] = [];

export function useTradingStats(): { stats: TradingStats | null; isLoading: boolean; error: unknown } {
  const { user } = useAuthStore();

  const query = useQuery({
    queryKey: ['trading-stats', user?.id],
    queryFn: async (): Promise<TradingStats> => {
      if (USE_MOCK) return MOCK_STATS;
      if (!user?.id) return { totalTrades: 0, winRate: 0, bestTradePnl: 0 };

      // Read from the user_trading_stats view — same SQL as the leaderboard edge function
      const { data, error } = await supabase
        .from('user_trading_stats')
        .select('total_trades, win_rate, best_trade_pnl')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Fallback: compute from trades table
        const { data: trades } = await supabase
          .from('trades')
          .select('side, pnl')
          .eq('user_id', user.id);

        if (!trades) return { totalTrades: 0, winRate: 0, bestTradePnl: 0 };
        const winRate = calcWinRate(trades as Pick<Trade, 'side' | 'pnl'>[]);
        const bestTradePnl = calcBestTradePnL(trades as Pick<Trade, 'side' | 'pnl'>[]);
        return { totalTrades: trades.length, winRate: winRate ?? 0, bestTradePnl };
      }

      return {
        totalTrades: data.total_trades ?? 0,
        winRate: data.win_rate ?? 0,
        bestTradePnl: data.best_trade_pnl ?? 0,
      };
    },
    staleTime: 60000,
    enabled: !!user?.id || USE_MOCK,
  });

  return { stats: query.data ?? null, isLoading: query.isLoading, error: query.error };
}

export function useRecentTrades(limit = 10) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['recent-trades', user?.id, limit],
    queryFn: async (): Promise<Trade[]> => {
      if (USE_MOCK) return MOCK_RECENT_TRADES.slice(0, limit);
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('traded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map(t => ({
        id: t.id,
        userId: t.user_id,
        symbol: t.symbol,
        exchange: t.exchange,
        side: t.side,
        quantity: t.quantity,
        price: t.price,
        pnl: t.pnl,
        tradedAt: t.traded_at,
      }));
    },
    staleTime: 30000,
    enabled: !!user?.id || USE_MOCK,
  });
}

import { calcAdvancedStats, type AdvancedStats } from '../utils/calculations';

export function useAdvancedStats() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['advanced-stats', user?.id],
    queryFn: async (): Promise<AdvancedStats> => {
      if (USE_MOCK) return calcAdvancedStats(MOCK_RECENT_TRADES);
      
      if (!user?.id) return calcAdvancedStats([]);

      // Fetch all closed trades to compute stats accurately
      const { data, error } = await supabase
        .from('trades')
        .select('side, pnl')
        .eq('user_id', user.id)
        .order('traded_at', { ascending: true }); // chronological order needed for streak calculations

      if (error) throw error;
      return calcAdvancedStats((data ?? []) as Pick<Trade, 'side' | 'pnl'>[]);
    },
    staleTime: 30000,
    enabled: !!user?.id || USE_MOCK,
  });
}

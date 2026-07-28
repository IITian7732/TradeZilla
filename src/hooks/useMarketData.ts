// src/hooks/useMarketData.ts
// React Query hook for live quote data with polling.
// Polling interval is tied to market hours — no 5s polling when market is closed.
import { useQuery } from '@tanstack/react-query';
import { fetchQuote, fetchOHLCV } from '../api/marketData';
import { getPollingInterval } from '../utils/marketHours';
import type { Timeframe } from '../types/market';

export function useQuote(symbol: string, exchange: 'NSE' | 'BSE' = 'NSE') {
  return useQuery({
    queryKey: ['quote', symbol, exchange],
    queryFn: () => fetchQuote(symbol, exchange),
    refetchInterval: getPollingInterval,
    staleTime: 4000,
    enabled: !!symbol,
  });
}

export function useOHLCV(
  symbol: string,
  exchange: 'NSE' | 'BSE',
  timeframe: Timeframe,
  bars = 100
) {
  return useQuery({
    queryKey: ['ohlcv', symbol, exchange, timeframe, bars],
    queryFn: () => fetchOHLCV(symbol, exchange, timeframe, bars),
    staleTime: 60000,
    enabled: !!symbol,
  });
}

export function useMultipleQuotes(symbols: { symbol: string; exchange: 'NSE' | 'BSE' }[]) {
  return useQuery({
    queryKey: ['quotes', symbols.map(s => `${s.symbol}:${s.exchange}`).join(',')],
    queryFn: () => Promise.all(symbols.map(s => fetchQuote(s.symbol, s.exchange))),
    refetchInterval: getPollingInterval,
    staleTime: 4000,
    enabled: symbols.length > 0,
  });
}

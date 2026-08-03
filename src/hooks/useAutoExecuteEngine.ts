import { useEffect, useRef } from 'react';
import { usePortfolio } from './usePortfolio';
import { fetchQuote } from '../api/marketData';
import { usePlaceOrder } from './useOrders';
import { getPollingInterval } from '../utils/marketHours';
import { useAuthStore } from '../store/authStore';

export function useAutoExecuteEngine() {
  const { holdings } = usePortfolio();
  const placeOrder = usePlaceOrder();
  const { isAuthenticated } = useAuthStore();
  const processingRef = useRef(new Set<string>());

  useEffect(() => {
    if (!isAuthenticated || !holdings || holdings.length === 0) return;

    // Filter holdings that have TP or SL
    const activeHoldings = holdings.filter(h => h.tp || h.sl);
    if (activeHoldings.length === 0) return;

    const interval = setInterval(async () => {
      for (const holding of activeHoldings) {
        if (processingRef.current.has(holding.id)) continue;

        try {
          const quote = await fetchQuote(holding.symbol, holding.exchange);
          const currentPrice = quote.ltp;
          
          let shouldExit = false;
          
          if (holding.tp && currentPrice >= holding.tp) {
             shouldExit = true;
          } else if (holding.sl && currentPrice <= holding.sl) {
             shouldExit = true;
          }

          if (shouldExit) {
            processingRef.current.add(holding.id);
            await placeOrder.mutateAsync({
              symbol: holding.symbol,
              exchange: holding.exchange as any,
              companyName: holding.companyName,
              side: 'SELL',
              orderType: 'MARKET',
              quantity: holding.quantity,
            });
            // Cleanup just in case it doesn't unmount
            setTimeout(() => processingRef.current.delete(holding.id), 10000);
          }
        } catch (error) {
          console.error("Auto execute error for", holding.symbol, error);
        }
      }
    }, getPollingInterval());

    return () => clearInterval(interval);
  }, [holdings, isAuthenticated, placeOrder]);
}

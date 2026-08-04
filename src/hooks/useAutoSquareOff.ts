// src/hooks/useAutoSquareOff.ts
// Auto square-off for intraday positions at 3:15 PM IST
// Brokers typically auto-exit open intraday trades ~15 min before market close

import { useEffect, useRef } from 'react';
import { usePortfolio } from './usePortfolio';
import { usePlaceOrder } from './useOrders';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { getNowIST } from '../utils/marketHours';

// Square-off time: 3:15 PM IST (15 mins before market close at 3:30 PM)
const SQUARE_OFF_HOUR = 15;
const SQUARE_OFF_MINUTE = 15;
const WARNING_MINUTE = 10; // Warn at 3:10 PM

export function useAutoSquareOff() {
  const { holdings } = usePortfolio();
  const placeOrder = usePlaceOrder();
  const { addToast } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const warnedRef = useRef(false);
  const squaredOffRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const check = () => {
      const now = getNowIST();
      const day = now.getDay();
      // Only on weekdays
      if (day === 0 || day === 6) return;

      const h = now.getHours();
      const m = now.getMinutes();

      // Warning at 3:10 PM
      if (h === SQUARE_OFF_HOUR && m >= WARNING_MINUTE && m < SQUARE_OFF_MINUTE && !warnedRef.current) {
        const intradayPositions = holdings.filter(h => (h as any).productType === 'INTRADAY' || (h as any).isShort);
        if (intradayPositions.length > 0) {
          warnedRef.current = true;
          addToast({
            type: 'warning',
            title: '⚠️ Auto Square-Off Warning',
            message: `${intradayPositions.length} intraday position(s) will be auto square-off at 3:15 PM IST. Extra charges apply.`,
            duration: 30000,
          });
        }
      }

      // Auto square-off at 3:15 PM
      if (h === SQUARE_OFF_HOUR && m >= SQUARE_OFF_MINUTE && !squaredOffRef.current) {
        const intradayPositions = holdings.filter(h => (h as any).productType === 'INTRADAY' || (h as any).isShort);
        if (intradayPositions.length > 0) {
          squaredOffRef.current = true;
          addToast({
            type: 'warning',
            title: '🔴 Auto Square-Off Triggered',
            message: 'All intraday positions are being squared off. Additional charges apply.',
            duration: 10000,
          });

          intradayPositions.forEach(pos => {
            // Short positions need a BUY to cover; long need a SELL
            const coverSide = (pos as any).isShort ? 'BUY' : 'SELL';
            placeOrder.mutate({
              symbol: pos.symbol,
              exchange: pos.exchange,
              companyName: pos.companyName,
              side: coverSide,
              orderType: 'MARKET',
              productType: 'INTRADAY',
              quantity: pos.quantity,
            });
          });
        }
      }
    };

    // Check every 30 seconds
    const interval = setInterval(check, 30000);
    check(); // Run immediately on mount

    return () => clearInterval(interval);
  }, [holdings, isAuthenticated]);
}

// src/utils/marketHours.ts
import { MARKET_HOURS } from './constants';

/**
 * Get current IST time as a Date object.
 * Timestamps are always stored in UTC and converted at render time.
 */
export function getNowIST(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

/**
 * Check if the Indian stock market is currently open.
 * Market hours: 9:15 AM – 3:30 PM IST, Monday–Friday (excluding holidays).
 * Note: This does not account for exchange holidays — add holiday list if needed.
 */
export function isMarketOpen(): boolean {
  const now = getNowIST();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const totalMinutes = hour * 60 + minute;
  const openMinutes = MARKET_HOURS.OPEN_HOUR_IST * 60 + MARKET_HOURS.OPEN_MINUTE_IST;
  const closeMinutes = MARKET_HOURS.CLOSE_HOUR_IST * 60 + MARKET_HOURS.CLOSE_MINUTE_IST;

  if (!MARKET_HOURS.OPEN_DAYS.includes(day as 1 | 2 | 3 | 4 | 5 | 6)) return false;
  return totalMinutes >= openMinutes && totalMinutes < closeMinutes;
}

/**
 * Get human-readable market status.
 */
export function getMarketStatusLabel(): 'Market Open' | 'Market Closed' | 'Pre-Open' {
  const now = getNowIST();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const totalMinutes = hour * 60 + minute;
  const preOpenStart = 9 * 60; // 9:00 AM IST
  const openMinutes = MARKET_HOURS.OPEN_HOUR_IST * 60 + MARKET_HOURS.OPEN_MINUTE_IST;
  const closeMinutes = MARKET_HOURS.CLOSE_HOUR_IST * 60 + MARKET_HOURS.CLOSE_MINUTE_IST;

  if (!MARKET_HOURS.OPEN_DAYS.includes(day as 1 | 2 | 3 | 4 | 5 | 6)) return 'Market Closed';
  if (totalMinutes >= preOpenStart && totalMinutes < openMinutes) return 'Pre-Open';
  if (totalMinutes >= openMinutes && totalMinutes < closeMinutes) return 'Market Open';
  return 'Market Closed';
}

/**
 * Get the polling interval to use based on market status.
 * Don't poll every 5s while market is closed.
 */
export function getPollingInterval(): number {
  return isMarketOpen() ? 5000 : 60000;
}

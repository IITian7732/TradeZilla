// src/utils/calculations.ts
// P&L, avg cost, win rate math.
// IMPORTANT: This file is imported ONLY by useTradingStats.ts and usePortfolio.ts.
// Any page needing trade count, win rate, or P&L imports one of those two hooks.
// Do NOT import this file directly from pages or components.

import type { Trade, Holding } from '../types/trade';

/**
 * Calculate average buy price using weighted average cost method.
 */
export function calcAvgBuyPrice(trades: Pick<Trade, 'side' | 'quantity' | 'price'>[]): number {
  const buys = trades.filter(t => t.side === 'BUY');
  const totalCost = buys.reduce((sum, t) => sum + t.quantity * t.price, 0);
  const totalQty = buys.reduce((sum, t) => sum + t.quantity, 0);
  return totalQty > 0 ? totalCost / totalQty : 0;
}

/**
 * Calculate unrealised P&L for a holding.
 */
export function calcUnrealisedPnL(holding: Pick<Holding, 'quantity' | 'avgBuyPrice' | 'currentPrice'>): number {
  if (holding.currentPrice === undefined) return 0;
  return (holding.currentPrice - holding.avgBuyPrice) * holding.quantity;
}

/**
 * Calculate P&L percentage.
 */
export function calcPnLPct(pnl: number, investedValue: number): number {
  if (investedValue === 0) return 0;
  return (pnl / investedValue) * 100;
}

/**
 * Calculate win rate from a list of sell trades with P&L.
 * Win rate = (profitable sells / total sells) * 100.
 * Returns null if no sell trades exist (not 0 — that would be misleading).
 */
export function calcWinRate(trades: Pick<Trade, 'side' | 'pnl'>[]): number | null {
  const sells = trades.filter(t => t.side === 'SELL' && t.pnl !== null && t.pnl !== undefined);
  if (sells.length === 0) return null;
  const wins = sells.filter(t => (t.pnl ?? 0) > 0);
  return (wins.length / sells.length) * 100;
}

/**
 * Best single trade P&L from a list of sell trades.
 */
export function calcBestTradePnL(trades: Pick<Trade, 'side' | 'pnl'>[]): number {
  const sells = trades.filter(t => t.side === 'SELL' && t.pnl !== null && t.pnl !== undefined);
  if (sells.length === 0) return 0;
  return Math.max(...sells.map(t => t.pnl ?? 0));
}

/**
 * Total realised P&L from all sell trades.
 */
export function calcTotalRealisedPnL(trades: Pick<Trade, 'side' | 'pnl'>[]): number {
  return trades
    .filter(t => t.side === 'SELL')
    .reduce((sum, t) => sum + (t.pnl ?? 0), 0);
}

/**
 * Total portfolio value = account balance + invested value + unrealised P&L.
 */
export function calcTotalPortfolioValue(
  balance: number,
  holdings: Pick<Holding, 'quantity' | 'avgBuyPrice' | 'currentPrice'>[]
): number {
  const investedValue = holdings.reduce((sum, h) => sum + h.quantity * h.avgBuyPrice, 0);
  const currentValue = holdings.reduce(
    (sum, h) => sum + h.quantity * (h.currentPrice ?? h.avgBuyPrice),
    0
  );
  const unrealisedPnL = currentValue - investedValue;
  return balance + investedValue + unrealisedPnL;
}

export interface AdvancedStats {
  totalTrades: number;
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  successRate: number;
  longWinPct: number;
  shortWinPct: number;
  avgLongProfit: number;
  avgLongLoss: number;
  avgShortProfit: number;
  avgShortLoss: number;
  biggestProfit: number;
  biggestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

/**
 * Calculates 15 advanced statistics from a list of trades.
 * Note: Since the app currently only supports going long (BUY to open, SELL to close),
 * short metrics will be 0.
 */
export function calcAdvancedStats(trades: Pick<Trade, 'side' | 'pnl'>[]): AdvancedStats {
  const closedTrades = trades.filter(t => t.side === 'SELL' && t.pnl !== null && t.pnl !== undefined);
  
  let netPnl = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  
  let longWins = 0;
  let longLosses = 0;
  let grossLongProfit = 0;
  let grossLongLoss = 0;

  let biggestProfit = 0;
  let biggestLoss = 0;

  let currentWinStreak = 0;
  let maxWinStreak = 0;
  let currentLossStreak = 0;
  let maxLossStreak = 0;

  for (const t of closedTrades) {
    const pnl = t.pnl ?? 0;
    netPnl += pnl;

    if (pnl > 0) {
      grossProfit += pnl;
      longWins += 1;
      grossLongProfit += pnl;
      if (pnl > biggestProfit) biggestProfit = pnl;
      
      currentWinStreak += 1;
      currentLossStreak = 0;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    } else if (pnl < 0) {
      grossLoss += pnl;
      longLosses += 1;
      grossLongLoss += pnl;
      if (pnl < biggestLoss) biggestLoss = pnl;
      
      currentLossStreak += 1;
      currentWinStreak = 0;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
    }
  }

  const totalClosed = closedTrades.length;
  const totalLongs = longWins + longLosses;

  return {
    totalTrades: totalClosed, // Total completed trades (round trips)
    netPnl,
    grossProfit,
    grossLoss,
    successRate: totalClosed > 0 ? (longWins / totalClosed) * 100 : 0,
    longWinPct: totalLongs > 0 ? (longWins / totalLongs) * 100 : 0,
    shortWinPct: 0, // Shorts not supported yet
    avgLongProfit: longWins > 0 ? grossLongProfit / longWins : 0,
    avgLongLoss: longLosses > 0 ? grossLongLoss / longLosses : 0,
    avgShortProfit: 0,
    avgShortLoss: 0,
    biggestProfit,
    biggestLoss,
    consecutiveWins: maxWinStreak,
    consecutiveLosses: maxLossStreak,
  };
}

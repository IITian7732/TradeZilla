// src/types/user.ts
export interface UserProfile {
  id: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  isPremium: boolean;
  premiumUntil?: string;
}

export interface Account {
  balance: number;
  investedValue: number;
  totalPnl: number;
  totalPortfolioValue: number; // balance + investedValue + unrealisedPnl
}

// TradingStats is the ONLY shape used to render trade counts / win rate anywhere.
// Always import from useTradingStats hook — never recompute independently.
export interface TradingStats {
  totalTrades: number;
  winRate: number;     // 0–100 (percentage)
  bestTradePnl: number;
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  companyName: string;
  addedAt: string;
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  items: WatchlistItem[];
}

export interface PriceAlert {
  id: string;
  userId: string;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  condition: 'ABOVE' | 'BELOW';
  targetPrice: number;
  isActive: boolean;
  triggeredAt?: string;
  createdAt: string;
}

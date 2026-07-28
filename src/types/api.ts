// src/types/api.ts
// All API response shapes — use explicit unknown-based typing, never `any`

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  isStale?: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  source: string;
  publishedAt: string;
  category: NewsCategory;
  relatedSymbols?: string[];
}

export type NewsCategory = 'markets' | 'economy' | 'ipo' | 'results' | 'global' | 'crypto';

export interface LeaderboardEntry {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  totalReturn: number;  // percentage
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  period: LeaderboardPeriod;
  rank: number;
  snapshotDate: string;
  rankChange?: number;  // positive = moved up
}

export type LeaderboardPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';

export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

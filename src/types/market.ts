// src/types/market.ts
export interface Stock {
  symbol: string;
  exchange: 'NSE' | 'BSE';
  companyName: string;
  sector: string;
  isin: string;
}

export interface Quote {
  symbol: string;
  exchange: 'NSE' | 'BSE';
  ltp: number;          // Last traded price
  open: number;
  high: number;
  low: number;
  close: number;        // Previous close
  change: number;
  changePct: number;
  volume: number;
  timestamp: string;    // ISO string, always stored/converted via IST utils
  isStale: boolean;     // true if cached/fallback value — never show as live
}

export interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '1d' | '1w' | '1M';

export interface MarketStatus {
  isOpen: boolean;
  nextEvent: 'opens' | 'closes';
  nextEventTime: Date;
}

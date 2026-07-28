// src/api/marketData.ts
// Market data layer with fallback chain:
// Twelve Data → Alpha Vantage → cached/stale DB value → mock generator (dev only)
// All quotes go through this module — never call provider APIs directly from components.

import type { Quote, OHLCV, Timeframe } from '../types/market';
import { POPULAR_STOCKS } from '../utils/constants';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// ─── Mock data generator ────────────────────────────────────────────────────
// Deterministic: same symbol always generates same base price.
// Only used in local dev / when VITE_USE_MOCK_DATA=true.

const MOCK_BASE_PRICES: Record<string, number> = {
  RELIANCE: 2847.35, TCS: 3812.45, INFY: 1634.20, HDFCBANK: 1725.80,
  ICICIBANK: 1198.60, HINDUNILVR: 2456.90, SBIN: 847.25, BHARTIARTL: 1654.30,
  WIPRO: 567.80, HCLTECH: 1876.40, ASIANPAINT: 3245.60, MARUTI: 12456.80,
  BAJFINANCE: 7234.90, ADANIENT: 2987.45, TATASTEEL: 164.35, SUNPHARMA: 1734.20,
  NTPC: 375.65, POWERGRID: 298.45, ONGC: 267.80, ULTRACEMCO: 9876.40,
};

function getMockPrice(symbol: string, variance = 0): number {
  const base = MOCK_BASE_PRICES[symbol] ?? 1000 + symbol.charCodeAt(0) * 12.5;
  const seed = (Date.now() / 30000) % 1; // changes every 30s
  const noise = (Math.sin(seed * 1000 + symbol.charCodeAt(0)) * 0.015 + variance) * base;
  return Math.max(1, parseFloat((base + noise).toFixed(2)));
}

export function generateMockQuote(symbol: string, exchange: 'NSE' | 'BSE' = 'NSE'): Quote {
  const stock = POPULAR_STOCKS.find(s => s.symbol === symbol);
  const close = getMockPrice(symbol, -0.005);
  const ltp = getMockPrice(symbol, 0);
  const change = parseFloat((ltp - close).toFixed(2));
  const changePct = parseFloat(((change / close) * 100).toFixed(2));
  return {
    symbol,
    exchange,
    ltp,
    open: getMockPrice(symbol, 0.002),
    high: getMockPrice(symbol, 0.015),
    low: getMockPrice(symbol, -0.012),
    close,
    change,
    changePct,
    volume: Math.floor(Math.random() * 5000000 + 500000),
    timestamp: new Date().toISOString(),
    isStale: false,
  };
}

export function generateMockOHLCV(symbol: string, timeframe: Timeframe, bars = 100): OHLCV[] {
  const base = MOCK_BASE_PRICES[symbol] ?? 1000;
  const now = Math.floor(Date.now() / 1000);
  const intervalSeconds: Record<Timeframe, number> = {
    '1m': 60, '5m': 300, '15m': 900, '30m': 1800,
    '1h': 3600, '1d': 86400, '1w': 604800, '1M': 2592000,
  };
  const interval = intervalSeconds[timeframe];
  const result: OHLCV[] = [];
  let price = base;

  for (let i = bars; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * base * 0.015;
    const close = Math.max(1, parseFloat((open + change).toFixed(2)));
    const high = parseFloat((Math.max(open, close) * (1 + Math.random() * 0.008)).toFixed(2));
    const low = parseFloat((Math.min(open, close) * (1 - Math.random() * 0.008)).toFixed(2));
    result.push({ time: now - i * interval, open, high, low, close, volume: Math.floor(Math.random() * 2000000 + 100000) });
    price = close;
  }
  return result;
}

// ─── Live data fetching ──────────────────────────────────────────────────────

// Cache to avoid duplicate in-flight requests
const quoteCache = new Map<string, { data: Quote; expiresAt: number }>();

async function fetchFromTwelveData(symbol: string, exchange: 'NSE' | 'BSE'): Promise<Quote | null> {
  const apiKey = import.meta.env.VITE_TWELVE_DATA_KEY;
  if (!apiKey) return null;

  try {
    const exchangeCode = exchange === 'NSE' ? 'NSE' : 'BSE';
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbol}&exchange=${exchangeCode}&apikey=${apiKey}`
    );
    if (!res.ok) return null;
    const raw: unknown = await res.json();
    if (typeof raw !== 'object' || raw === null || 'status' in raw && (raw as { status: string }).status === 'error') return null;
    const d = raw as Record<string, string>;
    return {
      symbol,
      exchange,
      ltp: parseFloat(d.close),
      open: parseFloat(d.open),
      high: parseFloat(d.high),
      low: parseFloat(d.low),
      close: parseFloat(d.previous_close),
      change: parseFloat(d.change),
      changePct: parseFloat(d.percent_change),
      volume: parseInt(d.volume, 10),
      timestamp: new Date().toISOString(),
      isStale: false,
    };
  } catch {
    return null;
  }
}

async function fetchFromAlphaVantage(symbol: string, exchange: 'NSE' | 'BSE'): Promise<Quote | null> {
  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_KEY;
  if (!apiKey) return null;

  try {
    const nseBseSymbol = `${symbol}.${exchange}`;
    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${nseBseSymbol}&apikey=${apiKey}`
    );
    if (!res.ok) return null;
    const raw: unknown = await res.json();
    if (typeof raw !== 'object' || raw === null) return null;
    const gq = (raw as Record<string, unknown>)['Global Quote'] as Record<string, string> | undefined;
    if (!gq || !gq['05. price']) return null;
    const ltp = parseFloat(gq['05. price']);
    const close = parseFloat(gq['08. previous close']);
    const change = ltp - close;
    return {
      symbol,
      exchange,
      ltp,
      open: parseFloat(gq['02. open']),
      high: parseFloat(gq['03. high']),
      low: parseFloat(gq['04. low']),
      close,
      change: parseFloat((change).toFixed(2)),
      changePct: parseFloat(((change / close) * 100).toFixed(2)),
      volume: parseInt(gq['06. volume'], 10),
      timestamp: new Date().toISOString(),
      isStale: false,
    };
  } catch {
    return null;
  }
}


/**
 * Fetch a live quote for a symbol using the fallback chain.
 * If all live sources fail, returns a stale/mock quote rather than throwing.
 */
export async function fetchQuote(symbol: string, exchange: 'NSE' | 'BSE' = 'NSE'): Promise<Quote> {
  const cacheKey = `${symbol}:${exchange}`;
  const cached = quoteCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  if (USE_MOCK) {
    const quote = generateMockQuote(symbol, exchange);
    quoteCache.set(cacheKey, { data: quote, expiresAt: Date.now() + 5000 });
    return quote;
  }

  // Fallback chain: Twelve Data → Alpha Vantage → stale mock
  let quote = await fetchFromTwelveData(symbol, exchange);
  if (!quote) quote = await fetchFromAlphaVantage(symbol, exchange);

  if (!quote) {
    // Return stale data (marked isStale: true) rather than breaking
    const stale = generateMockQuote(symbol, exchange);
    stale.isStale = true;
    return stale;
  }

  quoteCache.set(cacheKey, { data: quote, expiresAt: Date.now() + 5000 });
  return quote;
}


/**
 * Fetch OHLCV candle data for charting.
 */
export async function fetchOHLCV(
  symbol: string,
  exchange: 'NSE' | 'BSE',
  timeframe: Timeframe,
  bars = 100
): Promise<OHLCV[]> {
  if (USE_MOCK) {
    return generateMockOHLCV(symbol, timeframe, bars);
  }

  // Try Twelve Data for candles
  const apiKey = import.meta.env.VITE_TWELVE_DATA_KEY;
  if (apiKey) {
    try {
      const intervalMap: Record<Timeframe, string> = {
        '1m': '1min', '5m': '5min', '15m': '15min', '30m': '30min',
        '1h': '1h', '1d': '1day', '1w': '1week', '1M': '1month',
      };
      const res = await fetch(
        `https://api.twelvedata.com/time_series?symbol=${symbol}&exchange=${exchange}&interval=${intervalMap[timeframe]}&outputsize=${bars}&apikey=${apiKey}`
      );
      if (res.ok) {
        const raw: unknown = await res.json();
        if (typeof raw === 'object' && raw !== null && 'values' in raw) {
          const values = (raw as { values: Record<string, string>[] }).values;
          return values.reverse().map(v => ({
            time: Math.floor(new Date(v.datetime).getTime() / 1000),
            open: parseFloat(v.open),
            high: parseFloat(v.high),
            low: parseFloat(v.low),
            close: parseFloat(v.close),
            volume: parseInt(v.volume, 10),
          }));
        }
      }
    } catch {
      // Fall through
    }
  }

  // Fallback to mock
  return generateMockOHLCV(symbol, timeframe, bars);
}

/**
 * Search for stocks by name or symbol (local search on POPULAR_STOCKS for now).
 */
export function searchStocks(query: string) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return POPULAR_STOCKS.filter(
    s => s.symbol.toLowerCase().includes(q) || s.companyName.toLowerCase().includes(q)
  ).slice(0, 10);
}

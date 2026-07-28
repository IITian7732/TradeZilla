// src/api/news.ts
// News fetching with 5-minute cache.
// The Dashboard news preview and full News page MUST use this same function.

import type { NewsArticle, NewsCategory } from '../types/api';

const NEWS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let newsCache: { data: NewsArticle[]; expiresAt: number } | null = null;

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true' ||
  !import.meta.env.VITE_SUPABASE_URL;

// Mock news for dev mode
const MOCK_NEWS: NewsArticle[] = [
  {
    id: '1', title: 'Nifty 50 hits fresh 52-week high amid strong FII inflows',
    description: 'The benchmark index surged 1.2% to close at a record high as foreign institutional investors poured in over ₹4,500 crore on Thursday.',
    url: '#', urlToImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
    source: 'Economic Times', publishedAt: new Date(Date.now() - 3600000).toISOString(),
    category: 'markets', relatedSymbols: ['NIFTY50'],
  },
  {
    id: '2', title: 'Reliance Industries Q4 profit jumps 18% YoY, beats estimates',
    description: 'Reliance Industries reported a net profit of ₹19,600 crore for Q4 FY25, beating analyst estimates of ₹18,200 crore.',
    url: '#', urlToImage: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400',
    source: 'Mint', publishedAt: new Date(Date.now() - 7200000).toISOString(),
    category: 'results', relatedSymbols: ['RELIANCE'],
  },
  {
    id: '3', title: 'RBI holds repo rate at 6.5%, signals dovish pivot',
    description: 'The Reserve Bank of India kept rates unchanged but shifted its stance to "accommodative", fuelling hopes of a rate cut by August.',
    url: '#', urlToImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400',
    source: 'Business Standard', publishedAt: new Date(Date.now() - 14400000).toISOString(),
    category: 'economy', relatedSymbols: [],
  },
  {
    id: '4', title: 'TCS, Infosys see demand recovery in BFSI vertical',
    description: 'Top IT firms are reporting improved deal momentum in banking and financial services, reversing a two-quarter slowdown.',
    url: '#', urlToImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
    source: 'CNBC-TV18', publishedAt: new Date(Date.now() - 18000000).toISOString(),
    category: 'results', relatedSymbols: ['TCS', 'INFY'],
  },
  {
    id: '5', title: 'New IPO: Hyundai India opens subscription at ₹1,960–₹1,960 per share',
    description: 'Hyundai Motor India\'s massive ₹27,870 crore IPO opens for subscription. Analysts recommend subscribing for listing gains.',
    url: '#', urlToImage: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
    source: 'Moneycontrol', publishedAt: new Date(Date.now() - 21600000).toISOString(),
    category: 'ipo', relatedSymbols: [],
  },
  {
    id: '6', title: 'US Fed signals two rate cuts in 2025; Asian markets rally',
    description: 'Federal Reserve minutes indicate a hawkish pause, with markets pricing in two 25bps cuts. Asian indices including Sensex rose 0.8%.',
    url: '#', urlToImage: 'https://images.unsplash.com/photo-1504607798333-52a30db54a5d?w=400',
    source: 'Reuters', publishedAt: new Date(Date.now() - 28800000).toISOString(),
    category: 'global', relatedSymbols: [],
  },
];

export async function fetchNews(category?: NewsCategory, page = 1): Promise<NewsArticle[]> {
  if (USE_MOCK) {
    const filtered = category ? MOCK_NEWS.filter(n => n.category === category) : MOCK_NEWS;
    return filtered;
  }

  // Check cache
  if (newsCache && newsCache.expiresAt > Date.now() && page === 1 && !category) {
    return newsCache.data;
  }

  const apiKey = import.meta.env.VITE_NEWS_API_KEY;
  if (!apiKey) return MOCK_NEWS;

  try {
    const query = category === 'markets' ? 'NSE BSE Nifty Sensex' : 
                  category === 'economy' ? 'RBI economy India GDP' :
                  category === 'ipo' ? 'IPO India stock' : 'India stock market';
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=20&page=${page}&apiKey=${apiKey}`
    );
    if (!res.ok) return MOCK_NEWS;
    const raw: unknown = await res.json();
    if (typeof raw !== 'object' || raw === null) return MOCK_NEWS;
    const { articles } = raw as { articles: Record<string, string>[] };
    const mapped: NewsArticle[] = articles.map((a, i) => ({
      id: `news-${page}-${i}`,
      title: a.title,
      description: a.description ?? '',
      url: a.url,
      urlToImage: a.urlToImage,
      source: a.source ?? 'Unknown',
      publishedAt: a.publishedAt,
      category: category ?? 'markets',
      relatedSymbols: [],
    }));
    if (page === 1 && !category) {
      newsCache = { data: mapped, expiresAt: Date.now() + NEWS_CACHE_TTL };
    }
    return mapped;
  } catch {
    return MOCK_NEWS;
  }
}

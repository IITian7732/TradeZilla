// src/pages/News.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchNews } from '../api/news';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { formatRelativeTime } from '../utils/formatters';
import type { NewsCategory } from '../types/api';
import { Newspaper } from 'lucide-react';

const CATEGORIES: { label: string; value: NewsCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Markets', value: 'markets' },
  { label: 'Economy', value: 'economy' },
  { label: 'IPO', value: 'ipo' },
  { label: 'Results', value: 'results' },
  { label: 'Global', value: 'global' },
];

export default function News() {
  const [category, setCategory] = useState<NewsCategory | 'all'>('all');

  // Same fetchNews function used by Dashboard — never two implementations
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['news', category],
    queryFn: () => fetchNews(category === 'all' ? undefined : category),
    staleTime: 300000,
  });

  return (
    <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 className="section-title">Market News</h1>
      {/* Category pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)}
            style={{
              padding: '7px 16px', borderRadius: 100, border: '1px solid',
              borderColor: category === c.value ? '#0E7490' : '#E2E8F0',
              background: category === c.value ? 'rgba(14, 116, 144,0.15)' : 'transparent',
              color: category === c.value ? '#0E7490' : '#64748B',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Articles */}
      {isLoading ? (
        Array(4).fill(0).map((_, i) => (
          <div key={i} className="card" style={{ display: 'flex', gap: 12 }}>
            <Skeleton width={72} height={72} borderRadius={10} />
            <div style={{ flex: 1 }}>
              <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
              <Skeleton width="80%" height={14} style={{ marginBottom: 8 }} />
              <Skeleton width={100} height={11} />
            </div>
          </div>
        ))
      ) : articles.length === 0 ? (
        <EmptyState icon={<Newspaper size={24} />} title="No news available" description="Check back soon for the latest market updates." />
      ) : (
        articles.map(article => (
          <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', gap: 12, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#0E7490')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#E2E8F0')}>
              {article.urlToImage && (
                <img src={article.urlToImage} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="badge badge-brand" style={{ marginBottom: 6, fontSize: 10 }}>{article.category.toUpperCase()}</span>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0B0F19', margin: '4px 0', lineHeight: 1.4 }}>{article.title}</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 8px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.description}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748B' }}>{article.source}</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>·</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>{formatRelativeTime(article.publishedAt)}</span>
                </div>
              </div>
            </div>
          </a>
        ))
      )}
      <div style={{ height: 16 }} />
    </div>
  );
}

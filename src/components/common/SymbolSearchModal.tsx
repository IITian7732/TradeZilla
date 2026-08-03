import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { searchStocks } from '../../api/marketData';

export interface Stock {
  symbol: string;
  exchange: string;
  companyName: string;
  sector?: string;
  isin?: string;
}

interface SymbolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (symbol: string, exchange: string) => void;
}

export const SymbolSearchModal: React.FC<SymbolSearchModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length >= 2) {
      setLoading(true);
      const timer = setTimeout(() => {
        const res = searchStocks(query);
        setResults(res as Stock[]);
        setLoading(false);
      }, 300); // Debounce
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.4)', zIndex: 9999,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '8vh'
    }}>
      <div style={{
        background: '#FFFFFF', width: '100%', maxWidth: 640,
        borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        maxHeight: '80vh'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0F172A' }}>Symbol Search</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={24} />
          </button>
        </div>

        {/* Search Input */}
        <div style={{ padding: '0 24px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Search size={22} color="#94A3B8" />
          <input 
            ref={inputRef}
            type="text"
            placeholder="Search stocks..."
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 18, 
              color: '#0F172A', fontWeight: 500, padding: '4px 0'
            }}
          />
        </div>

        {/* Tabs (Visual only for matching TradingView style) */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <span style={{ background: '#0F172A', color: 'white', padding: '4px 12px', borderRadius: 16, fontSize: 13, fontWeight: 600 }}>ALL</span>
          <span style={{ color: '#64748B', padding: '4px 12px', borderRadius: 16, fontSize: 13, fontWeight: 500 }}>Cash</span>
          <span style={{ color: '#64748B', padding: '4px 12px', borderRadius: 16, fontSize: 13, fontWeight: 500 }}>F&O</span>
        </div>

        {/* Results List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {results.length > 0 ? (
            <div style={{ padding: '4px 24px 8px', display: 'flex', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
              <div style={{ flex: 1 }}>Symbol</div>
              <div style={{ flex: 1 }}>Description</div>
              <div style={{ width: 80, textAlign: 'right' }}>Exchange</div>
            </div>
          ) : null}

          {results.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => {
                onSelect(stock.symbol, stock.exchange);
                onClose();
              }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', padding: '12px 24px',
                background: 'none', border: 'none', borderBottom: '1px solid #F1F5F9',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <div style={{ flex: 1, fontWeight: 700, color: '#0E7490', fontSize: 15 }}>
                {stock.symbol}
              </div>
              <div style={{ flex: 1, color: '#475569', fontSize: 14 }}>
                {stock.companyName}
              </div>
              <div style={{ width: 80, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>EQ</span>
                <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 600 }}>{stock.exchange}</span>
              </div>
            </button>
          ))}
          
          {query.length >= 2 && results.length === 0 && !loading && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
              No symbols match your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

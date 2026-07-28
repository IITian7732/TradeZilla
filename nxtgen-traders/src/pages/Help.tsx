// src/pages/Help.tsx
import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Input } from '../components/ui/Input';

const FAQS = [
  { q: 'What is paper trading?', a: 'Paper trading lets you practice buying and selling stocks with virtual money. No real money is involved — it\'s a risk-free way to learn investing and test strategies before using real capital.' },
  { q: 'How much virtual money do I get?', a: 'Every new account starts with ₹1,00,000 (one lakh) in virtual capital. This represents what a typical beginner might invest in the stock market.' },
  { q: 'Are the prices real?', a: 'Yes — prices are fetched from real NSE/BSE market data sources. When the app is in demo mode, prices are simulated based on real market patterns but clearly marked "SIMULATED".' },
  { q: 'What order types are supported?', a: 'We support Market orders (execute at current price), Limit orders (execute at your specified price), Stop-Loss (SL), and Stop-Loss Market (SL-M) orders.' },
  { q: 'How is P&L calculated?', a: 'Profit & Loss = (Current Price − Avg Buy Price) × Quantity for holdings. For completed sell trades, P&L = (Sell Price − Avg Buy Price) × Quantity Sold.' },
  { q: 'What is win rate?', a: 'Win rate = (Number of profitable sell trades ÷ Total sell trades) × 100. A trade is "won" if the sell price was higher than the average buy price.' },
  { q: 'Why does my balance differ from total portfolio value?', a: 'Balance = cash available for new trades. Portfolio value = balance + current market value of all your holdings. These are always different unless you have no holdings.' },
  { q: 'How do I reset my portfolio?', a: 'Go to Settings → Reset Portfolio. This will clear all holdings, orders, and trade history, and restore your balance to ₹1,00,000. This cannot be undone.' },
  { q: 'What is a watchlist?', a: 'A watchlist is a list of stocks you want to monitor. Free users can create 1 watchlist. Premium users get unlimited watchlists. You can set price alerts on any watchlisted stock.' },
  { q: 'How do price alerts work?', a: 'Set a target price (above or below current price) for any stock. When the market price crosses your target, you\'ll receive a push notification — even if the app is closed.' },
  { q: 'What is the Leaderboard?', a: 'The Leaderboard ranks all traders by total return percentage. Rankings are updated daily at 6 PM IST. You can filter by Daily, Weekly, Monthly, or All Time.' },
  { q: 'Is my data safe?', a: 'Yes. All data is stored securely in Supabase (PostgreSQL) with row-level security. Only you can access your portfolio, orders, and trade history.' },
  { q: 'What is IST market time?', a: 'NSE/BSE market hours are 9:15 AM to 3:30 PM IST (Indian Standard Time), Monday to Friday. The app shows real-time status and adjusts polling frequency accordingly.' },
  { q: 'Can I export my trade history?', a: 'Yes — go to Portfolio and tap Export. Your holdings and performance data will download as a CSV file.' },
  { q: 'How do I upgrade to Premium?', a: 'Go to More → Premium. We use Razorpay for secure payments. You can subscribe monthly (₹299/month) or annually (₹2,499/year, saving 30%).' },
];

const GLOSSARY = [
  { term: 'LTP', def: 'Last Traded Price — the most recent price at which a stock was bought or sold.' },
  { term: 'P&L', def: 'Profit & Loss — the gain or loss on your investments.' },
  { term: 'Market Order', def: 'An order to buy or sell at the current market price, executed immediately.' },
  { term: 'Limit Order', def: 'An order to buy/sell only at a specified price or better.' },
  { term: 'NSE', def: 'National Stock Exchange of India — the largest stock exchange in India.' },
  { term: 'BSE', def: 'Bombay Stock Exchange — the oldest stock exchange in Asia.' },
  { term: 'NIFTY 50', def: 'The benchmark index of the top 50 companies on the NSE.' },
  { term: 'SENSEX', def: 'The benchmark index of the top 30 companies on the BSE.' },
  { term: 'Bull Market', def: 'A market trending upward, with rising stock prices.' },
  { term: 'Bear Market', def: 'A market trending downward, with falling stock prices (>20% decline).' },
];

export default function Help() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'faq' | 'glossary'>('faq');

  const filteredFaqs = FAQS.filter(f =>
    search === '' || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );
  const filteredGlossary = GLOSSARY.filter(g =>
    search === '' || g.term.toLowerCase().includes(search.toLowerCase()) || g.def.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 className="section-title">Help Center</h1>
      <Input placeholder="Search FAQs and glossary..." value={search} onChange={e => setSearch(e.target.value)} leftAddon={<Search size={16} />} id="help-search" />
      <div className="tabs">
        <button className={`tab ${activeTab === 'faq' ? 'active' : ''}`} onClick={() => setActiveTab('faq')}>FAQ</button>
        <button className={`tab ${activeTab === 'glossary' ? 'active' : ''}`} onClick={() => setActiveTab('glossary')}>Glossary</button>
      </div>

      {activeTab === 'faq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredFaqs.map((faq, i) => (
            <div key={i} className="card" style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#0E7490')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = openFaq === i ? '#0E7490' : '#E2E8F0')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0B0F19', margin: 0, lineHeight: 1.4 }}>{faq.q}</p>
                <ChevronDown size={18} style={{ color: '#64748B', flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'none' }} />
              </div>
              {openFaq === i && (
                <p style={{ fontSize: 14, color: '#475569', margin: '12px 0 0', lineHeight: 1.7 }}>{faq.a}</p>
              )}
            </div>
          ))}
          {filteredFaqs.length === 0 && <p style={{ textAlign: 'center', color: '#64748B' }}>No results for "{search}"</p>}
        </div>
      )}

      {activeTab === 'glossary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredGlossary.map((item, i) => (
            <div key={i} className="card">
              <p style={{ fontSize: 15, fontWeight: 800, color: '#0E7490', margin: '0 0 6px' }}>{item.term}</p>
              <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.6 }}>{item.def}</p>
            </div>
          ))}
          {filteredGlossary.length === 0 && <p style={{ textAlign: 'center', color: '#64748B' }}>No results for "{search}"</p>}
        </div>
      )}
      <div style={{ height: 16 }} />
    </div>
  );
}

// src/pages/TradeJournal.tsx
import React, { useState } from 'react';
import { BookOpen, TrendingUp, TrendingDown, Trash2, Filter, ChevronDown, ChevronUp, Edit3, Check, X } from 'lucide-react';
import { useTradeJournalStore, type JournalEntry, type EmotionTag } from '../store/tradeJournalStore';
import { formatINR } from '../utils/formatters';
import { formatDistanceToNow } from 'date-fns';

const EMOTION_OPTIONS: { value: EmotionTag; label: string; emoji: string; color: string }[] = [
  { value: 'disciplined', label: 'Disciplined', emoji: '🧠', color: '#26A65B' },
  { value: 'confident',   label: 'Confident',   emoji: '💪', color: '#00C2A8' },
  { value: 'neutral',     label: 'Neutral',      emoji: '😐', color: '#8B95A2' },
  { value: 'fomo',        label: 'FOMO',         emoji: '😰', color: '#F0B429' },
  { value: 'fear',        label: 'Fear',         emoji: '😨', color: '#F0B429' },
  { value: 'greedy',      label: 'Greedy',       emoji: '🤑', color: '#E84040' },
];

function getEmotion(tag: EmotionTag) {
  return EMOTION_OPTIONS.find(e => e.value === tag) ?? EMOTION_OPTIONS[2];
}

function StatBar({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: color ?? '#E8EDF3', fontFamily: 'JetBrains Mono, monospace' }}>{value}</span>
      <span style={{ fontSize: 11, color: '#4A5568', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function JournalEntryCard({ entry }: { entry: JournalEntry }) {
  const { updateEntry, deleteEntry } = useTradeJournalStore();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    entryReason: entry.entryReason,
    exitReason: entry.exitReason,
    emotionTag: entry.emotionTag,
    lessons: entry.lessons,
  });

  const isPnlPositive = entry.pnl >= 0;
  const emotion = getEmotion(entry.emotionTag);

  const saveEdits = () => {
    updateEntry(entry.id, draft);
    setEditing(false);
  };

  return (
    <div style={{
      background: '#161B22',
      border: `1px solid ${isPnlPositive ? 'rgba(38,166,91,0.2)' : 'rgba(232,64,64,0.2)'}`,
      borderRadius: 16,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Header row */}
      <div
        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* PnL indicator stripe */}
        <div style={{ width: 4, height: 40, borderRadius: 2, background: isPnlPositive ? '#26A65B' : '#E84040', flexShrink: 0 }} />

        {/* Symbol & company */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#E8EDF3' }}>{entry.symbol}</span>
            <span style={{ fontSize: 11, color: '#4A5568', background: '#1E2530', padding: '2px 6px', borderRadius: 4 }}>{entry.exchange}</span>
            <span style={{ fontSize: 11, color: emotion.color }}>{emotion.emoji} {emotion.label}</span>
          </div>
          <div style={{ fontSize: 12, color: '#4A5568', marginTop: 2 }}>{entry.companyName}</div>
        </div>

        {/* PnL */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
            color: isPnlPositive ? '#26A65B' : '#E84040'
          }}>
            {isPnlPositive ? '+' : ''}{formatINR(entry.pnl)}
          </div>
          <div style={{ fontSize: 11, color: '#4A5568' }}>
            {isPnlPositive ? '+' : ''}{entry.pnlPct.toFixed(2)}% · {entry.quantity} qty
          </div>
        </div>

        {/* Expand icon */}
        <div style={{ color: '#4A5568', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #1E2A38' }}>
          {/* Price info */}
          <div style={{ display: 'flex', gap: 16, marginTop: 14, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: '#4A5568' }}>Entry Price</div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: '#E8EDF3' }}>{formatINR(entry.entryPrice)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#4A5568' }}>Exit Price</div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: '#E8EDF3' }}>{formatINR(entry.exitPrice)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#4A5568' }}>Traded</div>
              <div style={{ fontSize: 12, color: '#8B95A2' }}>{formatDistanceToNow(new Date(entry.tradedAt), { addSuffix: true })}</div>
            </div>
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Emotion selector */}
              <div>
                <label style={{ fontSize: 12, color: '#8B95A2', display: 'block', marginBottom: 6 }}>How were you feeling?</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {EMOTION_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setDraft(d => ({ ...d, emotionTag: opt.value }))}
                      style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${draft.emotionTag === opt.value ? opt.color : '#1E2A38'}`,
                        background: draft.emotionTag === opt.value ? `${opt.color}22` : '#1E2530',
                        color: draft.emotionTag === opt.value ? opt.color : '#8B95A2',
                      }}
                    >{opt.emoji} {opt.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#8B95A2', display: 'block', marginBottom: 4 }}>Why did you enter?</label>
                <textarea rows={2} value={draft.entryReason} onChange={e => setDraft(d => ({ ...d, entryReason: e.target.value }))}
                  placeholder="e.g. RSI was oversold, breakout above 200 EMA..." style={{ width: '100%', background: '#1E2530', border: '1px solid #1E2A38', borderRadius: 8, padding: '8px 10px', color: '#E8EDF3', fontSize: 13, outline: 'none', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#8B95A2', display: 'block', marginBottom: 4 }}>Why did you exit?</label>
                <textarea rows={2} value={draft.exitReason} onChange={e => setDraft(d => ({ ...d, exitReason: e.target.value }))}
                  placeholder="e.g. Hit target, TP triggered, pattern invalidated..." style={{ width: '100%', background: '#1E2530', border: '1px solid #1E2A38', borderRadius: 8, padding: '8px 10px', color: '#E8EDF3', fontSize: 13, outline: 'none', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#8B95A2', display: 'block', marginBottom: 4 }}>Lessons learned</label>
                <textarea rows={2} value={draft.lessons} onChange={e => setDraft(d => ({ ...d, lessons: e.target.value }))}
                  placeholder="e.g. Should have waited for volume confirmation..." style={{ width: '100%', background: '#1E2530', border: '1px solid #1E2A38', borderRadius: 8, padding: '8px 10px', color: '#E8EDF3', fontSize: 13, outline: 'none', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveEdits} style={{ flex: 1, padding: '8px', background: '#00C2A8', color: '#0D1117', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Check size={14} /> Save
                </button>
                <button onClick={() => setEditing(false)} style={{ padding: '8px 16px', background: '#1E2530', color: '#8B95A2', borderRadius: 8, border: '1px solid #1E2A38', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {entry.entryReason && (
                <div><span style={{ fontSize: 11, color: '#4A5568' }}>Entry reason: </span><span style={{ fontSize: 13, color: '#8B95A2' }}>{entry.entryReason}</span></div>
              )}
              {entry.exitReason && (
                <div><span style={{ fontSize: 11, color: '#4A5568' }}>Exit reason: </span><span style={{ fontSize: 13, color: '#8B95A2' }}>{entry.exitReason}</span></div>
              )}
              {entry.lessons && (
                <div><span style={{ fontSize: 11, color: '#4A5568' }}>Lessons: </span><span style={{ fontSize: 13, color: '#E8EDF3' }}>{entry.lessons}</span></div>
              )}
              {!entry.entryReason && !entry.exitReason && !entry.lessons && (
                <div style={{ fontSize: 13, color: '#4A5568', fontStyle: 'italic' }}>No notes yet. Tap Edit to add your analysis.</div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => { setEditing(true); setDraft({ entryReason: entry.entryReason, exitReason: entry.exitReason, emotionTag: entry.emotionTag, lessons: entry.lessons }); }}
                  style={{ flex: 1, padding: '8px', background: '#1E2530', color: '#8B95A2', borderRadius: 8, border: '1px solid #1E2A38', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                  <Edit3 size={13} /> Edit Notes
                </button>
                <button onClick={() => deleteEntry(entry.id)}
                  style={{ padding: '8px 14px', background: 'rgba(232,64,64,0.1)', color: '#E84040', borderRadius: 8, border: '1px solid rgba(232,64,64,0.2)', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TradeJournal() {
  const { entries, clearAll } = useTradeJournalStore();
  const [filter, setFilter] = useState<'all' | 'win' | 'loss'>('all');

  const filtered = entries.filter(e => {
    if (filter === 'win') return e.pnl >= 0;
    if (filter === 'loss') return e.pnl < 0;
    return true;
  });

  const wins = entries.filter(e => e.pnl >= 0);
  const losses = entries.filter(e => e.pnl < 0);
  const totalPnl = entries.reduce((s, e) => s + e.pnl, 0);
  const winRate = entries.length > 0 ? Math.round((wins.length / entries.length) * 100) : 0;
  const avgWin = wins.length > 0 ? wins.reduce((s, e) => s + e.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, e) => s + e.pnl, 0) / losses.length) : 0;
  const rrRatio = avgLoss > 0 ? (avgWin / avgLoss).toFixed(1) : '—';

  return (
    <div style={{ padding: '16px 16px 80px', minHeight: '100vh', background: '#0D1117' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#E8EDF3', letterSpacing: '-0.3px' }}>Trade Journal</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#4A5568' }}>{entries.length} trades logged</p>
        </div>
        {entries.length > 0 && (
          <button onClick={() => { if (confirm('Clear all journal entries?')) clearAll(); }}
            style={{ background: 'rgba(232,64,64,0.1)', color: '#E84040', border: '1px solid rgba(232,64,64,0.2)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trash2 size={14} /> Clear All
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        /* Empty state */
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,194,168,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BookOpen size={32} color="#00C2A8" />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#E8EDF3' }}>No Trades Yet</h3>
          <p style={{ margin: 0, fontSize: 14, color: '#4A5568', lineHeight: 1.6, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
            Every trade you exit will automatically appear here. Add your analysis to become a better trader.
          </p>
        </div>
      ) : (
        <>
          {/* Stats bar */}
          <div style={{ background: '#161B22', border: '1px solid #1E2A38', borderRadius: 16, padding: '16px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 12 }}>
            <StatBar label="Win Rate" value={`${winRate}%`} color={winRate >= 50 ? '#26A65B' : '#E84040'} />
            <StatBar label="Total P&L" value={`${totalPnl >= 0 ? '+' : ''}${formatINR(totalPnl)}`} color={totalPnl >= 0 ? '#26A65B' : '#E84040'} />
            <StatBar label="Avg Win" value={formatINR(avgWin)} color="#26A65B" />
            <StatBar label="Avg Loss" value={formatINR(avgLoss)} color="#E84040" />
            <StatBar label="R:R Ratio" value={String(rrRatio)} color="#00C2A8" />
            <StatBar label="Trades" value={String(entries.length)} />
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {([['all', 'All'], ['win', `✅ Wins (${wins.length})`], ['loss', `❌ Losses (${losses.length})`]] as const).map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${filter === val ? '#00C2A8' : '#1E2A38'}`,
                  background: filter === val ? 'rgba(0,194,168,0.1)' : '#161B22',
                  color: filter === val ? '#00C2A8' : '#4A5568',
                }}
              >{label}</button>
            ))}
          </div>

          {/* Entries list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#4A5568' }}>No {filter} trades found.</div>
            ) : (
              filtered.map(entry => <JournalEntryCard key={entry.id} entry={entry} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}

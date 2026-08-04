// src/store/tradeJournalStore.ts
// Persisted trade journal — auto-populated on every SELL order.
// Users can then enrich each entry with reason, emotion, and lessons.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EmotionTag = 'confident' | 'disciplined' | 'fomo' | 'fear' | 'greedy' | 'neutral';

export interface JournalEntry {
  id: string;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  companyName: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;    // avg buy price
  exitPrice: number;     // executed sell price
  pnl: number;           // (exitPrice - entryPrice) * quantity
  pnlPct: number;
  entryReason: string;
  exitReason: string;
  emotionTag: EmotionTag;
  lessons: string;
  tradedAt: string;       // ISO timestamp of the exit
}

interface TradeJournalStore {
  entries: JournalEntry[];
  addEntry: (entry: JournalEntry) => void;
  updateEntry: (id: string, updates: Partial<Pick<JournalEntry, 'entryReason' | 'exitReason' | 'emotionTag' | 'lessons'>>) => void;
  deleteEntry: (id: string) => void;
  clearAll: () => void;
}

export const useTradeJournalStore = create<TradeJournalStore>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({ entries: [entry, ...state.entries] })),
      updateEntry: (id, updates) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),
      clearAll: () => set({ entries: [] }),
    }),
    { name: 'tz-trade-journal' }
  )
);

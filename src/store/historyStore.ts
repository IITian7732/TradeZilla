import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ResetSnapshot {
  id: string;
  resetAt: string;
  startingBalance: number;
  stats: any; // AdvancedStats
  trades: any[]; // Trade[]
}

interface HistoryState {
  snapshots: ResetSnapshot[];
  addSnapshot: (snapshot: ResetSnapshot) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      snapshots: [],
      addSnapshot: (snapshot) =>
        set((state) => ({ snapshots: [snapshot, ...state.snapshots] })),
      clearHistory: () => set({ snapshots: [] }),
    }),
    {
      name: 'trading-history-storage',
    }
  )
);

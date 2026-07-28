// src/store/marketStore.ts
// Zustand store for purely client-side market UI state.
// Stores the currently selected symbol/exchange for the Trade/Charts pages.
import { create } from 'zustand';

interface MarketState {
  selectedSymbol: string;
  selectedExchange: 'NSE' | 'BSE';
  searchQuery: string;
  setSelectedSymbol: (symbol: string, exchange: 'NSE' | 'BSE') => void;
  setSearchQuery: (q: string) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  selectedSymbol: 'RELIANCE',
  selectedExchange: 'NSE',
  searchQuery: '',
  setSelectedSymbol: (symbol, exchange) => set({ selectedSymbol: symbol, selectedExchange: exchange }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));

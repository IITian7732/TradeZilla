// src/store/authStore.ts
// Zustand store for auth + account state (UI/global state only).
// React Query owns server fetching; Zustand owns the in-memory snapshot.
import { create } from 'zustand';
import type { UserProfile, Account } from '../types/user';

interface AuthState {
  user: UserProfile | null;
  account: Account | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  setAccount: (account: Account | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  account: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setAccount: (account) => set({ account }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, account: null, isAuthenticated: false, isLoading: false }),
}));

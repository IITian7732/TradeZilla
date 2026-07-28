// src/store/uiStore.ts
// Zustand store for purely client-side UI state.
// Rule: Never put server data here — use React Query for that.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface UIState {
  theme: Theme;
  activeBottomTab: string;
  isOrderFormOpen: boolean;
  isAlertModalOpen: boolean;
  toasts: Toast[];
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setActiveTab: (tab: string) => void;
  openOrderForm: () => void;
  closeOrderForm: () => void;
  openAlertModal: () => void;
  closeAlertModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      activeBottomTab: 'home',
      isOrderFormOpen: false,
      isAlertModalOpen: false,
      toasts: [],

      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),
      setActiveTab: (tab) => set({ activeBottomTab: tab }),
      openOrderForm: () => set({ isOrderFormOpen: true }),
      closeOrderForm: () => set({ isOrderFormOpen: false }),
      openAlertModal: () => set({ isAlertModalOpen: true }),
      closeAlertModal: () => set({ isAlertModalOpen: false }),

      addToast: (toast) => {
        const id = Math.random().toString(36).slice(2);
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
        setTimeout(() => get().removeToast(id), toast.duration ?? 4000);
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
    }),
    { name: 'nxtgen-ui', partialize: (s) => ({ theme: s.theme }) }
  )
);

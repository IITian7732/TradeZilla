// src/hooks/useWatchlist.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import type { Watchlist, WatchlistItem } from '../types/user';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true' ||
  !import.meta.env.VITE_SUPABASE_URL;

let MOCK_WATCHLISTS: Watchlist[] = [
  {
    id: 'default-wl',
    userId: 'mock-user-id',
    name: 'My Watchlist',
    createdAt: new Date().toISOString(),
    items: [],
  }
];
export function useWatchlists() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['watchlists', user?.id],
    queryFn: async (): Promise<Watchlist[]> => {
      if (USE_MOCK) return MOCK_WATCHLISTS;
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('watchlists')
        .select('*, watchlist_items(*)')
        .eq('user_id', user.id)
        .order('created_at');
      if (error) throw error;
      return (data ?? []).map(wl => ({
        id: wl.id, userId: wl.user_id, name: wl.name, createdAt: wl.created_at,
        items: (wl.watchlist_items ?? []).map((wi: Record<string, string>) => ({
          id: wi.id, watchlistId: wi.watchlist_id, symbol: wi.symbol,
          exchange: wi.exchange, companyName: wi.company_name, addedAt: wi.added_at,
        })),
      }));
    },
    staleTime: 30000,
    enabled: !!user?.id || USE_MOCK,
  });
}

export function useAddToWatchlist() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ watchlistId, symbol, exchange, companyName }: {
      watchlistId: string; symbol: string; exchange: 'NSE' | 'BSE'; companyName: string;
    }) => {
      if (USE_MOCK) {
        const wl = MOCK_WATCHLISTS.find(w => w.id === watchlistId);
        if (wl) {
          wl.items.push({
            id: `wi-${Date.now()}`, watchlistId, symbol, exchange, companyName, addedAt: new Date().toISOString()
          });
        }
        return;
      }
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('watchlist_items').insert({
        watchlist_id: watchlistId, symbol, exchange, company_name: companyName,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlists'] });
      addToast({ type: 'success', title: 'Added to Watchlist' });
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Failed to add', message: err.message }),
  });
}

export function useRemoveFromWatchlist() {
  const { addToast } = useUIStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (USE_MOCK) {
        MOCK_WATCHLISTS.forEach(wl => {
          wl.items = wl.items.filter(i => i.id !== itemId);
        });
        return;
      }
      const { error } = await supabase.from('watchlist_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlists'] });
      addToast({ type: 'info', title: 'Removed from Watchlist' });
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Failed to remove', message: err.message }),
  });
}

export function useCreateWatchlist() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (USE_MOCK) {
        MOCK_WATCHLISTS.push({
          id: `wl-${Date.now()}`,
          userId: user?.id || 'mock',
          name,
          createdAt: new Date().toISOString(),
          items: [],
        });
        return;
      }
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('watchlists').insert({
        user_id: user.id, name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlists'] });
      addToast({ type: 'success', title: 'Watchlist created' });
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Failed to create', message: err.message }),
  });
}

export function useRenameWatchlist() {
  const { addToast } = useUIStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (USE_MOCK) {
        const wl = MOCK_WATCHLISTS.find(w => w.id === id);
        if (wl) wl.name = name;
        return;
      }
      const { error } = await supabase.from('watchlists').update({ name }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlists'] });
      addToast({ type: 'success', title: 'Watchlist renamed' });
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Failed to rename', message: err.message }),
  });
}

export function useDeleteWatchlist() {
  const { addToast } = useUIStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK) {
        MOCK_WATCHLISTS = MOCK_WATCHLISTS.filter(w => w.id !== id);
        return;
      }
      const { error } = await supabase.from('watchlists').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlists'] });
      addToast({ type: 'info', title: 'Watchlist deleted' });
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Failed to delete', message: err.message }),
  });
}

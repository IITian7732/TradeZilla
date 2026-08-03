// src/hooks/useAuth.ts
// Auth hook wrapping Supabase Auth.
// Populates authStore on auth state change. Creates account on first login.
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { INITIAL_BALANCE } from '../utils/constants';
import type { UserProfile, Account } from '../types/user';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true' ||
  !import.meta.env.VITE_SUPABASE_URL;

// Mock user for dev mode
export const MOCK_USER: UserProfile = {
  id: 'mock-user-1',
  fullName: 'Yash Jaiswal',
  phone: '7771020162',
  isPremium: false,
};

export const MOCK_ACCOUNT: Account = {
  balance: INITIAL_BALANCE,
  investedValue: 0,
  totalPnl: 0,
  totalPortfolioValue: INITIAL_BALANCE,
};

export function useAuth() {
  const { user, account, isLoading, isAuthenticated, setUser, setAccount, setLoading, reset } = useAuthStore();
  const { addToast } = useUIStore();
  const qc = useQueryClient();

  // Subscribe to auth state changes
  useEffect(() => {
    if (USE_MOCK) {
      // Don't auto-login on mount anymore, so the user stays logged out on refresh.
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch or create profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({
            id: profile.id,
            fullName: profile.full_name,
            phone: profile.phone,
            avatarUrl: profile.avatar_url,
            isPremium: profile.is_premium,
            premiumUntil: profile.premium_until,
          });
        }

        // Fetch or create account (idempotent)
        const { data: acc } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (!acc) {
          await supabase.from('accounts').insert({
            user_id: session.user.id,
            balance: INITIAL_BALANCE,
          });
          setAccount({ balance: INITIAL_BALANCE, investedValue: 0, totalPnl: 0, totalPortfolioValue: INITIAL_BALANCE });
        } else {
          setAccount({
            balance: acc.balance,
            investedValue: acc.invested_value ?? 0,
            totalPnl: acc.total_pnl ?? 0,
            totalPortfolioValue: acc.total_portfolio_value ?? acc.balance,
          });
        }
      } else {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useMutation({
    mutationFn: async ({ email, password, fullName, phone, avatar }: { email: string; password: string; fullName: string; phone: string; avatar?: File | null }) => {
      if (USE_MOCK) {
        // Simulate a successful signup in mock mode
        const mockNewUser = { ...MOCK_USER, fullName, phone, email };
        setUser(mockNewUser);
        setAccount(MOCK_ACCOUNT);
        return { user: { id: mockNewUser.id } };
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      
      let avatarUrl = undefined;
      
      // If we have an avatar and we're not in mock mode, upload it.
      // (If in mock mode, it won't persist across reloads anyway unless we use a blob URL)
      if (avatar && data.user) {
        if (!USE_MOCK) {
          const fileExt = avatar.name.split('.').pop();
          const fileName = `${data.user.id}-${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatar);
            
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
            avatarUrl = publicUrl;
          }
        } else {
          avatarUrl = URL.createObjectURL(avatar);
        }
      }

      // Create profile row and default watchlist
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          phone: phone,
          ...(avatarUrl && { avatar_url: avatarUrl })
        });
        
        await supabase.from('watchlists').insert({
          user_id: data.user.id,
          name: 'My Watchlist'
        });
      }
      return data;
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Sign up failed', message: err.message }),
  });

  const signIn = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      if (USE_MOCK) {
        if (email === 'shankarjaiswal713@gmail.com' && password === 'yash@843') {
          setUser(MOCK_USER);
          setAccount(MOCK_ACCOUNT);
          return { user: { id: MOCK_USER.id } };
        } else {
          throw new Error('Invalid login credentials. Please use your registered email and password.');
        }
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Sign in failed', message: err.message }),
  });

  const signInWithGoogle = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Google sign in failed', message: err.message }),
  });

  const signOut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      qc.clear();
      reset();
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Sign out failed', message: err.message }),
  });

  const resetPassword = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    },
    onSuccess: () => addToast({ type: 'success', title: 'Email sent', message: 'Check your inbox for a reset link.' }),
    onError: (err: Error) => addToast({ type: 'error', title: 'Reset failed', message: err.message }),
  });

  const updateProfile = useMutation({
    mutationFn: async ({ fullName, avatar }: { fullName: string; avatar?: File | null | string }) => {
      if (USE_MOCK) {
        let avatarUrl = user?.avatarUrl;
        if (avatar instanceof File) {
          avatarUrl = URL.createObjectURL(avatar);
        } else if (typeof avatar === 'string') {
          avatarUrl = avatar;
        }
        const updated = { ...user!, fullName, avatarUrl };
        setUser(updated);
        return { user: updated };
      }
      
      let avatarUrl = user?.avatarUrl;
      if (avatar instanceof File && user) {
        const fileExt = avatar.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatar);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      } else if (typeof avatar === 'string') {
        avatarUrl = avatar;
      }

      if (user) {
        await supabase.from('profiles').update({
          full_name: fullName,
          ...(avatarUrl && { avatar_url: avatarUrl })
        }).eq('id', user.id);
        
        await supabase.auth.updateUser({
          data: { full_name: fullName }
        });
      }
      
      qc.invalidateQueries({ queryKey: ['profile'] });
      return { success: true };
    },
    onSuccess: () => addToast({ type: 'success', title: 'Profile Updated' }),
    onError: (err: Error) => addToast({ type: 'error', title: 'Update failed', message: err.message }),
  });

  const updatePassword = useMutation({
    mutationFn: async (newPassword: string) => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 500));
        return { success: true };
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => addToast({ type: 'success', title: 'Password Updated' }),
    onError: (err: Error) => addToast({ type: 'error', title: 'Password update failed', message: err.message }),
  });

  return {
    user,
    account,
    isLoading,
    isAuthenticated,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    updatePassword,
  };
}

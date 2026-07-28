// src/pages/Settings.tsx
import React, { useState } from 'react';
import { Moon, Sun, Bell, Shield, Download, Trash2, RefreshCw } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { INITIAL_BALANCE } from '../utils/constants';
import { formatINR } from '../utils/formatters';
import { useQueryClient } from '@tanstack/react-query';
import { useHistoryStore } from '../store/historyStore';
import { MOCK_HOLDINGS } from '../hooks/usePortfolio';
import { MOCK_RECENT_TRADES } from '../hooks/useTradingStats';
import { MOCK_ORDERS } from '../hooks/useOrders';
import { calcAdvancedStats } from '../utils/calculations';

export default function Settings() {
  const { theme, toggleTheme } = useUIStore();
  const { user, account, setAccount } = useAuthStore();
  const { signOut } = useAuth();
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { addSnapshot } = useHistoryStore();

  const handleResetPortfolio = () => {
    // 1. Calculate stats before wiping
    const stats = calcAdvancedStats(MOCK_RECENT_TRADES);
    
    // 2. Save snapshot to history
    addSnapshot({
      id: Math.random().toString(36).substring(7),
      resetAt: new Date().toISOString(),
      startingBalance: account?.balance ?? INITIAL_BALANCE,
      stats: stats,
      trades: [...MOCK_RECENT_TRADES],
    });

    // 3. Clear mock arrays
    MOCK_HOLDINGS.length = 0;
    MOCK_RECENT_TRADES.length = 0;
    MOCK_ORDERS.length = 0;

    // 4. Reset account balance
    setAccount({
      balance: INITIAL_BALANCE,
      investedValue: 0,
      totalPnl: 0,
      totalPortfolioValue: INITIAL_BALANCE,
    });

    // 5. Invalidate queries to refresh UI
    queryClient.invalidateQueries();

    setResetModalOpen(false);
    useUIStore.getState().addToast({ type: 'success', title: 'Portfolio Reset', message: `Your portfolio has been reset to ${formatINR(INITIAL_BALANCE, 0)}` });
  };

  const handleDeleteAccount = () => {
    setDeleteModalOpen(false);
    useUIStore.getState().addToast({ type: 'success', title: 'Account Deleted', message: 'Your account has been deleted.' });
    signOut.mutate();
  };

  return (
    <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 className="section-title">Settings</h1>

      {/* Appearance */}
      <section>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Appearance</p>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(14, 116, 144,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0E7490' }}>
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#0B0F19', margin: '0 0 2px' }}>Theme</p>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{theme === 'dark' ? 'Dark' : 'Light'} mode</p>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                width: 50, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: theme === 'dark' ? '#0E7490' : '#E2E8F0',
                position: 'relative', transition: 'background 0.3s',
              }}
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label="Toggle theme"
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 3, left: theme === 'dark' ? 25 : 3,
                transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>
        </div>
      </section>

      {/* Account */}
      <section>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Account</p>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245, 158, 11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
              <RefreshCw size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#0B0F19', margin: '0 0 2px' }}>Reset Portfolio</p>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Restart with {formatINR(INITIAL_BALANCE, 0)} virtual money</p>
            </div>
            <button onClick={() => setResetModalOpen(true)} style={{ background: 'rgba(245, 158, 11,0.1)', border: '1px solid rgba(245, 158, 11,0.3)', borderRadius: 8, padding: '6px 12px', color: '#F59E0B', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Reset
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239, 68, 68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
              <Trash2 size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#EF4444', margin: '0 0 2px' }}>Delete Account</p>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Permanently delete your account and data</p>
            </div>
            <button onClick={() => setDeleteModalOpen(true)} style={{ background: 'rgba(239, 68, 68,0.1)', border: '1px solid rgba(239, 68, 68,0.3)', borderRadius: 8, padding: '6px 12px', color: '#EF4444', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Delete
            </button>
          </div>
        </div>
      </section>

      {/* Reset portfolio confirmation */}
      <Modal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} title="Reset Portfolio?"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" fullWidth onClick={() => setResetModalOpen(false)}>Cancel</Button>
            <Button fullWidth onClick={handleResetPortfolio} style={{ background: '#F59E0B', color: '#F4F6F9' }}>
              Yes, Reset
            </Button>
          </div>
        }>
        <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          This will clear all your holdings, orders, and trades, and restore your balance to <span className="mono" style={{ color: '#0B0F19' }}>{formatINR(INITIAL_BALANCE, 0)}</span>. This action cannot be undone.
        </p>
      </Modal>

      {/* Delete account confirmation */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Account?"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" fullWidth onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="sell" fullWidth onClick={handleDeleteAccount}>Delete Account</Button>
          </div>
        }>
        <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Your account and all associated data will be permanently deleted. This cannot be undone.
        </p>
      </Modal>
      <div style={{ height: 16 }} />
    </div>
  );
}

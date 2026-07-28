// src/components/ui/Toast.tsx
import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import type { Toast as ToastType } from '../../store/uiStore';

const icons = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const iconColors = {
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#0E7490',
};

const ToastItem: React.FC<{ toast: ToastType; onDismiss: () => void }> = ({ toast, onDismiss }) => (
  <div className={`toast toast-${toast.type}`} role="alert" aria-live="polite">
    <span style={{ color: iconColors[toast.type], flexShrink: 0, marginTop: 1 }}>
      {icons[toast.type]}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#0B0F19', margin: 0 }}>{toast.title}</p>
      {toast.message && (
        <p style={{ fontSize: 13, color: '#475569', margin: '2px 0 0' }}>{toast.message}</p>
      )}
    </div>
    <button
      onClick={onDismiss}
      style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 2, flexShrink: 0 }}
      aria-label="Dismiss notification"
    >
      <X size={14} />
    </button>
  </div>
);

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
      ))}
    </div>
  );
};

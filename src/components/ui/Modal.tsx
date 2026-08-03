import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-content">
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B0F19', margin: 0 }}>{title}</h2>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4, borderRadius: 8, display: 'flex' }}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div style={{ padding: 20 }}>{children}</div>
        {footer && <div style={{ padding: '0 20px 20px' }}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

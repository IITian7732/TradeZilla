import React, { useEffect } from 'react';
import { useNotificationStore, type Notification } from '../store/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { Bell, TrendingUp, AlertCircle, Info, Trash2 } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  // Mark all as read when opening the page
  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'trade': return <TrendingUp size={20} color="#10B981" />;
      case 'alert': return <AlertCircle size={20} color="#F59E0B" />;
      case 'market': return <Bell size={20} color="#3B82F6" />;
      case 'system': return <Info size={20} color="#6366F1" />;
      default: return <Bell size={20} color="#64748B" />;
    }
  };

  return (
    <>
      <TopBar title="Notifications" showBack />
      <div style={{ padding: '16px 16px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#0F172A', fontWeight: 600 }}>Recent</h2>
          {notifications.length > 0 && (
            <button 
              onClick={clearAll}
              style={{ 
                background: 'none', border: 'none', color: '#EF4444', 
                fontSize: 14, fontWeight: 500, cursor: 'pointer', 
                display: 'flex', alignItems: 'center', gap: 6 
              }}
            >
              <Trash2 size={16} /> Clear All
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Bell size={32} color="#94A3B8" />
            </div>
            <h3 style={{ margin: '0 0 8px', color: '#0F172A' }}>No Notifications Yet</h3>
            <p style={{ margin: 0, fontSize: 14 }}>When you execute trades or receive alerts, they will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.map(notif => (
              <div 
                key={notif.id}
                onClick={() => !notif.isRead && markAsRead(notif.id)}
                style={{
                  background: notif.isRead ? '#FFFFFF' : '#F8FAFC',
                  border: `1px solid ${notif.isRead ? '#E2E8F0' : '#CBD5E1'}`,
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  gap: 16,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {!notif.isRead && (
                  <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: '#3B82F6' }} />
                )}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {getIcon(notif.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <h4 style={{ margin: 0, fontSize: 15, color: '#0F172A', fontWeight: notif.isRead ? 500 : 600 }}>
                      {notif.title}
                    </h4>
                    <span style={{ fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      {formatDistanceToNow(notif.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
                    {notif.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

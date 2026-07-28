import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'trade' | 'alert' | 'system' | 'market';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  timestamp: number;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [
        {
          id: 'mock-notif-1',
          title: 'Welcome to TradeZilla!',
          message: 'Start your paper trading journey with ₹1,00,000 in virtual capital.',
          type: 'system',
          isRead: false,
          timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        },
        {
          id: 'mock-notif-2',
          title: 'Market is Open',
          message: 'Indian markets are now open for trading. Good luck!',
          type: 'market',
          isRead: false,
          timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        }
      ],
      addNotification: (notif) => set((state) => ({
        notifications: [
          {
            ...notif,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            isRead: false,
            timestamp: Date.now(),
          },
          ...state.notifications
        ]
      })),
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        )
      })),
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true }))
      })),
      clearAll: () => set({ notifications: [] }),
      getUnreadCount: () => get().notifications.filter(n => !n.isRead).length,
    }),
    {
      name: 'tradezilla-notifications',
    }
  )
);

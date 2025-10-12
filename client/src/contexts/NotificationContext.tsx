import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToNotifications, subscribeToUnreadCount, type Notification } from '@/services/firebase';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    console.log('🌍 NotificationContext: Setting up subscriptions for user', currentUser.id);
    setLoading(true);

    // Single subscription for notifications
    const unsubscribeNotifications = subscribeToNotifications(
      currentUser.id,
      (newNotifications) => {
        console.log('🌍 NotificationContext: Received', newNotifications.length, 'notifications');
        setNotifications(newNotifications);
        setLoading(false);
      },
      50
    );

    // Single subscription for unread count
    const unsubscribeUnread = subscribeToUnreadCount(
      currentUser.id,
      (count) => {
        console.log('🌍 NotificationContext: Unread count update:', count);
        setUnreadCount(count);
      }
    );

    return () => {
      console.log('🌍 NotificationContext: Cleaning up subscriptions');
      unsubscribeNotifications();
      unsubscribeUnread();
    };
  }, [currentUser?.id]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}


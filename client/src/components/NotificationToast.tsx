import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, DollarSign, MessageCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToNotifications, type Notification } from '@/services/firebase';

interface NotificationToastProps {
  onNavigateToNotifications: () => void;
}

export default function NotificationToast({ onNavigateToNotifications }: NotificationToastProps) {
  const { currentUser } = useAuth();
  const [visibleNotification, setVisibleNotification] = useState<Notification | null>(null);
  const [previousNotificationIds, setPreviousNotificationIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUser?.id) return;

    console.log('🎨 NotificationToast: Setting up listener');

    const unsubscribe = subscribeToNotifications(
      currentUser.id,
      (notifications) => {
        // Find new unread notifications
        const newNotifications = notifications.filter(
          n => !n.isRead && !previousNotificationIds.has(n.id)
        );

        if (newNotifications.length > 0) {
          const latestNotification = newNotifications[0];
          console.log('🎨 NotificationToast: Showing new notification:', latestNotification);
          
          // Show the notification toast
          setVisibleNotification(latestNotification);
          
          // Update previous IDs
          setPreviousNotificationIds(prev => {
            const newSet = new Set(prev);
            newNotifications.forEach(n => newSet.add(n.id));
            return newSet;
          });

          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            setVisibleNotification(null);
          }, 5000);
        }
      },
      50
    );

    return () => {
      console.log('🎨 NotificationToast: Cleaning up');
      unsubscribe();
    };
  }, [currentUser?.id]);

  const handleClick = () => {
    setVisibleNotification(null);
    onNavigateToNotifications();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisibleNotification(null);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_post':
        return <AlertTriangle className="w-5 h-5 text-blue-500" />;
      case 'new_campaign':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'comment_reply':
        return <MessageCircle className="w-5 h-5 text-purple-500" />;
      case 'issue_resolved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'new_report':
        return <Bell className="w-5 h-5 text-red-500" />;
      case 'report_resolved':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <AnimatePresence>
      {visibleNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: 100 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 50, x: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 right-6 z-[100] max-w-md"
        >
          <div
            onClick={handleClick}
            className="bg-card border-2 border-primary shadow-2xl rounded-lg p-4 cursor-pointer hover:shadow-3xl transition-shadow"
          >
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                visibleNotification.type === 'new_post' ? 'bg-blue-500/20' :
                visibleNotification.type === 'new_campaign' ? 'bg-green-500/20' :
                visibleNotification.type === 'comment_reply' ? 'bg-purple-500/20' :
                visibleNotification.type === 'new_report' ? 'bg-red-500/20' :
                visibleNotification.type === 'report_resolved' ? 'bg-green-500/20' :
                'bg-emerald-500/20'
              }`}>
                {getNotificationIcon(visibleNotification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-card-foreground text-sm">
                    {visibleNotification.title}
                  </h4>
                  <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 ml-2 text-muted-foreground hover:text-card-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {visibleNotification.message}
                </p>
                <p className="text-xs text-primary mt-2 font-medium">
                  Click to view →
                </p>
              </div>
            </div>

            {/* Progress bar for auto-dismiss */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-1 bg-primary rounded-bl-lg"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


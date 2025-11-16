import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, DollarSign, MessageCircle, CheckCircle2, Check, Filter } from 'lucide-react';
import { useMarkAsRead } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import LoadingSkeleton from './LoadingSkeleton';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { notifications, unreadCount, loading } = useNotificationContext();
  const { markAsRead, markAllAsRead, loading: markingRead } = useMarkAsRead();

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (currentUser?.id) {
      await markAllAsRead(currentUser.id);
    }
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
        return <Bell className="w-5 h-5" />;
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  if (loading) {
    return <LoadingSkeleton type="dashboard" />;
  }

  return (
    <div className="md:ml-64 p-4 sm:p-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs sm:text-sm text-muted-foreground">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex rounded-lg border border-border w-full sm:w-auto">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
                className="rounded-r-none flex-1 sm:flex-none text-xs sm:text-sm"
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('unread')}
                className="rounded-l-none border-l flex-1 sm:flex-none text-xs sm:text-sm"
              >
                Unread ({unreadCount})
              </Button>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markingRead}
                data-testid="button-mark-all-read"
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Mark all as read</span>
                <span className="sm:hidden">Mark all read</span>
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      <div className="space-y-3 max-w-3xl mx-auto">
        {filteredNotifications.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 sm:p-12 text-center">
              <Bell className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
              <h3 className="text-base sm:text-lg font-medium text-card-foreground mb-2">
                {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground px-4">
                {filter === 'unread' 
                  ? "You don't have any unread notifications" 
                  : "You'll see notifications here when there's activity in your community"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <Card 
                className={`border-border cursor-pointer transition-all hover:shadow-md ${
                  notification.isRead ? 'bg-card' : 'bg-accent/30 border-l-4 border-l-blue-500'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                        notification.type === 'new_post' ? 'bg-blue-500/20' :
                        notification.type === 'new_campaign' ? 'bg-green-500/20' :
                        notification.type === 'comment_reply' ? 'bg-purple-500/20' :
                        notification.type === 'new_report' ? 'bg-red-500/20' :
                        notification.type === 'report_resolved' ? 'bg-green-500/20' :
                        'bg-emerald-500/20'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h3 className={`text-sm sm:text-base font-semibold ${
                          notification.isRead ? 'text-muted-foreground' : 'text-card-foreground'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <Badge variant="default" className="ml-2 bg-blue-500 text-white text-xs flex-shrink-0">New</Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          {formatTime(notification.createdAt)}
                        </p>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-xs h-7 w-full sm:w-auto"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

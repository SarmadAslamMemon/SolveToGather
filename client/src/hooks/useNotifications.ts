import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeToNotifications,
  subscribeToUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getAdminPostEngagement,
  getTrendingPosts,
  getCampaignProgress,
  getPendingIssues,
  type Notification
} from '@/services/firebase';

// Hook for real-time notifications
export const useNotifications = (limitCount: number = 20) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToNotifications(
      currentUser.id,
      (newNotifications) => {
        setNotifications(newNotifications);
        setLoading(false);
      },
      limitCount
    );

    return () => unsubscribe();
  }, [currentUser?.id, limitCount]);

  return { notifications, loading };
};

// Hook for real-time unread count (use sparingly - prefer calculating from notifications)
export const useUnreadCount = () => {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) {
      setUnreadCount(0);
      setIsSubscribed(false);
      return;
    }

    // Prevent multiple subscriptions
    if (isSubscribed) {
      console.log('⚠️ useUnreadCount: Already subscribed, skipping');
      return;
    }

    console.log('🎯 useUnreadCount: Setting up subscription for', currentUser.id);
    setIsSubscribed(true);
    
    const unsubscribe = subscribeToUnreadCount(currentUser.id, (count) => {
      console.log('🎯 useUnreadCount: Received count update:', count);
      setUnreadCount(count);
    });

    return () => {
      console.log('🎯 useUnreadCount: Cleaning up subscription');
      setIsSubscribed(false);
      unsubscribe();
    };
  }, [currentUser?.id]);

  return unreadCount;
};

// Hook for marking notification as read
export const useMarkAsRead = () => {
  const [loading, setLoading] = useState(false);

  const markAsRead = async (notificationId: string) => {
    setLoading(true);
    try {
      await markNotificationAsRead(notificationId);
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async (userId: string) => {
    setLoading(true);
    try {
      await markAllNotificationsAsRead(userId);
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { markAsRead, markAllAsRead, loading };
};

// Hook for admin activity metrics
export const useAdminMetrics = (communityId: string) => {
  const { currentUser } = useAuth();
  const [postEngagement, setPostEngagement] = useState<any[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [pendingIssues, setPendingIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id || !communityId) {
      setLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const [engagement, trending, campaignProgress, issues] = await Promise.all([
          getAdminPostEngagement(communityId, currentUser.id, 5),
          getTrendingPosts(communityId, 10, 7),
          getCampaignProgress(communityId),
          getPendingIssues(communityId)
        ]);

        setPostEngagement(engagement);
        setTrendingPosts(trending);
        setCampaigns(campaignProgress);
        setPendingIssues(issues);
      } catch (error) {
        console.error('Error fetching admin metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Refresh metrics every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUser?.id, communityId]);

  return {
    postEngagement,
    trendingPosts,
    campaigns,
    pendingIssues,
    loading,
  };
};


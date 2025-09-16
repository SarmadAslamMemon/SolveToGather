import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  read: boolean;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: '1', title: 'New donation received', description: '₨2,000 donated to your campaign', read: false },
    { id: '2', title: 'Issue upvoted', description: 'Street Light Repairs got 5 new upvotes', read: false },
    { id: '3', title: 'Comment on issue', description: 'Ali commented on Pothole Repair', read: true },
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  };

  return (
    <div className="ml-64 p-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Notifications</h1>
        </div>
        <Button variant="outline" onClick={markAllAsRead} data-testid="button-mark-all-read">
          Mark all as read
        </Button>
      </motion.header>

      <div className="space-y-4">
        {notifications.map((n, index) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
          >
            <Card className={`border-border ${n.read ? 'opacity-70' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{n.title}</span>
                  <Button size="sm" variant="ghost" onClick={() => toggleRead(n.id)}>
                    {n.read ? 'Mark unread' : 'Mark read'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{n.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}



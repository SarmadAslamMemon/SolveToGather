import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMetrics } from '@/hooks/useNotifications';
import { Heart, MessageCircle, TrendingUp, Target, CheckCircle2 } from 'lucide-react';
import LoadingSkeleton from './LoadingSkeleton';
import { formatDistanceToNow } from 'date-fns';

export default function AdminActivityDashboard() {
  const { currentUser } = useAuth();
  const { postEngagement, trendingPosts, campaigns, loading } = useAdminMetrics(
    currentUser?.communityId || ''
  );


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
    <div className="p-4 sm:p-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6 sm:mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">Activity & Insights</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Monitor engagement and activity in your community</p>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Section 1: Your Recent Posts Engagement */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                <span>Your Recent Posts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {postEngagement.length === 0 ? (
                <p className="text-center text-sm sm:text-base text-muted-foreground py-6 sm:py-8">
                  You haven't created any posts yet
                </p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {postEngagement.map((post: any) => (
                    <div key={post.id} className="p-3 sm:p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-card-foreground text-xs sm:text-sm truncate">{post.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(post.createdAt)}
                          </p>
                        </div>
                        <Badge variant={post.type === 'issue' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                          {post.type === 'issue' ? 'Issue' : 'Campaign'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                        <div className="flex items-center space-x-1 text-xs sm:text-sm">
                          <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                          <span className="text-muted-foreground">{post.likesCount || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs sm:text-sm">
                          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                          <span className="text-muted-foreground">{post.commentsCount || 0}</span>
                        </div>
                        <div className="text-xs text-muted-foreground ml-auto">
                          {(post.likesCount || 0) + (post.commentsCount || 0)} total engagement
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 2: Trending Posts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                <span>Most Active Posts (7 days)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {trendingPosts.length === 0 ? (
                <p className="text-center text-sm sm:text-base text-muted-foreground py-6 sm:py-8">
                  No active posts in the last 7 days
                </p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {trendingPosts.slice(0, 5).map((post: any, index: number) => (
                    <div key={post.id} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border border-border rounded-lg">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-card-foreground truncate">{post.title}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Heart className="w-3 h-3 mr-1 text-red-500" />
                            {post.likesCount || 0}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <MessageCircle className="w-3 h-3 mr-1 text-blue-500" />
                            {post.commentsCount || 0}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {post.engagement} total
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 3: Fundraising Progress */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                <span>Fundraising Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {campaigns.length === 0 ? (
                <p className="text-center text-sm sm:text-base text-muted-foreground py-6 sm:py-8">
                  No active campaigns
                </p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {campaigns.map((campaign: any) => (
                    <div key={campaign.id} className="p-3 sm:p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                        <h4 className="font-medium text-card-foreground text-xs sm:text-sm flex-1 min-w-0 truncate">{campaign.title}</h4>
                        {campaign.progress >= 100 && (
                          <Badge className="bg-green-500 text-white text-xs flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Funded!
                          </Badge>
                        )}
                        {campaign.progress >= 75 && campaign.progress < 100 && (
                          <Badge className="bg-orange-500 text-white text-xs flex-shrink-0">Almost there!</Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">
                            ₨{(campaign.raised || 0).toLocaleString()} raised
                          </span>
                          <span className="font-medium text-card-foreground">
                            {Math.round(campaign.progress)}%
                          </span>
                        </div>
                        <Progress value={campaign.progress} className="h-1.5 sm:h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Goal: ₨{(campaign.goal || 0).toLocaleString()}</span>
                          <span>{campaign.duration || 'Ongoing'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}


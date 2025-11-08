import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import IssueCard from './IssueCard';
import CampaignCard from './CampaignCard';
import DonationModal from './DonationModal';
import CreateReportModal from './CreateReportModal';
import CommunityLeaderProfileModal from './CommunityLeaderProfileModal';
import LoadingSkeleton from './LoadingSkeleton';
import NotificationDropdown from './NotificationDropdown';
import { useIssues, useCampaigns } from '@/hooks/useFirestore';
import { useComments, useAddComment, useDeleteComment, usePostLikes } from '@/hooks/useComments';
import { useToast } from '@/hooks/use-toast';
import { getDoc, doc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bell, Plus, AlertTriangle, DollarSign, Users, Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, Clock, Send, X } from 'lucide-react';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [notificationCount] = useState(3);
  const [openPost, setOpenPost] = useState<any | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [selectedLeader, setSelectedLeader] = useState<any | null>(null);
  const [isLeaderProfileOpen, setIsLeaderProfileOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [communityMembersCount, setCommunityMembersCount] = useState(0);
  const [membersLoading, setMembersLoading] = useState(true);

  const { issues, loading: issuesLoading } = useIssues(currentUser?.communityId, true);
  const { campaigns, loading: campaignsLoading } = useCampaigns(currentUser?.communityId, true);

  // Hooks for post modal
  const { comments, loading: commentsLoading } = useComments(openPost?.id || '', 10);
  const { addComment, loading: addingComment } = useAddComment();
  const { deleteComment, loading: deletingComment } = useDeleteComment();
  const { isLiked: isPostLiked, toggleLike: togglePostLike, loading: postLikeLoading } = usePostLikes(openPost?.id || '');

  // Fetch real community member count
  useEffect(() => {
    const fetchCommunityMembers = async () => {
      if (!currentUser?.communityId) return;
      
      try {
        setMembersLoading(true);
        const usersQuery = query(collection(db, 'users'), where('communityId', '==', currentUser.communityId));
        const usersSnapshot = await getDocs(usersQuery);
        setCommunityMembersCount(usersSnapshot.size);
      } catch (error) {
        console.error('Error fetching community members:', error);
        toast({
          title: "Error",
          description: "Failed to load community member count",
          variant: "destructive",
        });
      } finally {
        setMembersLoading(false);
      }
    };

    fetchCommunityMembers();
  }, [currentUser?.communityId, toast]);

  // Real stats data from database
  const stats = {
    activeIssues: issues.length,
    totalRaised: campaigns.reduce((sum, campaign) => sum + (campaign.raised || 0), 0),
    communityMembers: communityMembersCount,
  };
  const isNormalUser = currentUser?.role !== 'super_user' && currentUser?.role !== 'community_leader';

  const handleDonate = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      setSelectedCampaign(campaign);
      setIsDonationModalOpen(true);
    }
  };

  const handleCloseDonationModal = () => {
    setIsDonationModalOpen(false);
    setSelectedCampaign(null);
  };

  const handleOpenPost = (post: any) => {
    setOpenPost(post);
    setImageIndex(0);
    setNewComment('');
  };

  const handleClosePost = () => {
    setOpenPost(null);
    setImageIndex(0);
    setNewComment('');
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !openPost || !currentUser) return;
    
    try {
      await addComment(openPost.id, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAuthorClick = async (authorId: string) => {
    try {
      const authorDoc = await getDoc(doc(db, 'users', authorId));
      if (authorDoc.exists()) {
        const authorData = authorDoc.data();
        setSelectedLeader({
          ...authorData,
          id: authorId,
        });
        setIsLeaderProfileOpen(true);
      } else {
        toast({
          title: "Profile not found",
          description: "The leader's profile could not be found.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching leader profile:', error);
      toast({
        title: "Error",
        description: "Failed to load leader profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (issuesLoading || campaignsLoading) {
    return <LoadingSkeleton type="dashboard" />;
  }

  return (
    <div className="ml-64 p-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2" data-testid="text-welcome">
              Welcome back, {currentUser?.firstName || 'User'}!
            </h1>
            <p className="text-muted-foreground">Here's what's happening in your community today.</p>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationDropdown />
            {!isNormalUser && (
              <Button className="btn-primary" data-testid="button-new-post">
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`grid grid-cols-1 ${isNormalUser ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6 mb-8`}
      >
        <Card className="bg-card border-border card-hover" data-testid="card-stats-issues">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-1/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-chart-1" />
              </div>
              <span className="text-2xl font-bold text-card-foreground" data-testid="text-active-issues">
                {stats.activeIssues}
              </span>
            </div>
            <h3 className="font-medium text-card-foreground mb-1">Active Issues</h3>
            <p className="text-sm text-muted-foreground">Community challenges</p>
          </CardContent>
        </Card>

        {!isNormalUser && (
        <Card className="bg-card border-border card-hover" data-testid="card-stats-raised">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-2/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-chart-2" />
              </div>
              <span className="text-2xl font-bold text-card-foreground" data-testid="text-total-raised">
                ₨{(stats.totalRaised / 1000000).toFixed(1)}M
              </span>
            </div>
            <h3 className="font-medium text-card-foreground mb-1">Total Raised</h3>
            <p className="text-sm text-muted-foreground">Funds collected</p>
          </CardContent>
        </Card>
        )}

        <Card className="bg-card border-border card-hover" data-testid="card-stats-members">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-3/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-chart-3" />
              </div>
              <span className="text-2xl font-bold text-card-foreground" data-testid="text-community-members">
                {membersLoading ? '...' : stats.communityMembers.toLocaleString()}
              </span>
            </div>
            <h3 className="font-medium text-card-foreground mb-1">Community Members</h3>
            <p className="text-sm text-muted-foreground">Active participants</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trending Issues */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gradient">Trending Issues</h2>
            <Button variant="ghost" className="text-primary hover:underline" data-testid="button-view-all-issues" onClick={() => window.dispatchEvent(new CustomEvent('navigate-view', { detail: { view: 'issues' } }))}>
              View all
            </Button>
          </div>

          <div className="space-y-3">
            {issues.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium text-card-foreground mb-2">No Issues Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    There are no issues reported in your community yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              issues.slice(0, 4).map((issue) => (
                <Card 
                  key={issue.id} 
                  className="bg-card border-border hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => handleOpenPost(issue)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-card-foreground text-sm truncate">{issue.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{issue.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {issue.likesCount || 0} likes • {issue.commentsCount || 0} comments
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {issue.createdAt?.toDate ? 
                              new Date(issue.createdAt.toDate()).toLocaleDateString() : 
                              'Recently'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </motion.div>

        {/* Fundraising Campaigns */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gradient">Active Campaigns</h2>
            <Button variant="ghost" size="sm" className="text-primary hover:underline" data-testid="button-view-all-campaigns" onClick={() => window.dispatchEvent(new CustomEvent('navigate-view', { detail: { view: 'campaigns' } }))}>
              View all
            </Button>
          </div>

          <div className="space-y-3">
            {campaigns.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium text-card-foreground mb-2">No Active Campaigns</h3>
                  <p className="text-sm text-muted-foreground">
                    There are no fundraising campaigns at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              campaigns.slice(0, 4).map((campaign) => {
                const isGoalReached = Number(campaign.raised || 0) >= Number(campaign.goal || 0);
                return (
                <Card 
                  key={campaign.id} 
                  className={`bg-card border-border transition-shadow duration-200 ${!isGoalReached ? 'hover:shadow-md cursor-pointer' : 'opacity-75'}`}
                  onClick={() => !isGoalReached && handleDonate(campaign.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-card-foreground text-sm truncate">{campaign.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{campaign.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            ₨{(campaign.raised || 0).toLocaleString()} raised
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {campaign.createdAt?.toDate ? 
                              new Date(campaign.createdAt.toDate()).toLocaleDateString() : 
                              'Recently'
                            }
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                              className="bg-orange-500 h-1.5 rounded-full transition-all duration-300" 
                              style={{ 
                                width: `${Math.min(((campaign.raised || 0) / (campaign.goal || 1)) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {isGoalReached && (
                      <div className="mt-2 bg-green-500/10 border border-green-500/20 rounded px-2 py-1 text-center">
                        <p className="text-xs font-medium text-green-600 dark:text-green-400">
                          ✓ Goal Achieved
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                );
              })
            )}
          </div>

          {/* Quick Actions */}
          {isNormalUser && (
            <Button
              variant="outline"
              className="w-full justify-center mt-8"
              data-testid="button-report-issue"
              onClick={() => setIsReportModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Report Issue
            </Button>
          )}
        </motion.div>
      </div>

      {/* Donation Modal */}
      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={handleCloseDonationModal}
        campaign={selectedCampaign}
      />

      {/* Post Modal */}
      <Dialog open={!!openPost} onOpenChange={handleClosePost}>
        <DialogContent className="sm:max-w-4xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-hidden p-0">
          {openPost && (
            <div className="flex flex-col h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div 
                  className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg p-2 -m-2 transition-colors"
                  onClick={() => handleAuthorClick(openPost.authorId)}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={openPost.authorImage || openPost.image} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-orange-500 text-white">
                      {openPost.authorName?.charAt(0) || openPost.title?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {openPost.authorName || openPost.title || 'Community Leader'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatTimeAgo(openPost.createdAt)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClosePost}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {/* Post Content */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                    {openPost.title}
                  </h2>
                  
                  <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                    {openPost.description}
                  </p>

                  {/* Campaign-specific content */}
                  {openPost.goal && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Fundraising Progress</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(openPost.raised || 0)} / {formatCurrency(openPost.goal)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(((openPost.raised || 0) / openPost.goal) * 100, 100)} 
                        className="h-3 mb-2"
                      />
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{Math.round(((openPost.raised || 0) / openPost.goal) * 100)}% funded</span>
                        <span>{openPost.daysLeft || 0} days left</span>
                      </div>
                    </div>
                  )}

                  {/* Images */}
                  {((openPost.images && openPost.images.length > 0) || openPost.image) && (
                    <div className="mb-6">
                      <div className="relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                        <img
                          src={(openPost.images && openPost.images[imageIndex]) || openPost.image}
                          alt={openPost.title}
                          className="w-full h-64 object-cover"
                        />
                        
                        {/* Image Navigation */}
                        {openPost.images && openPost.images.length > 1 && (
                          <>
                            <button
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                              onClick={() => setImageIndex((prev) => (prev - 1 + openPost.images.length) % openPost.images.length)}
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                              onClick={() => setImageIndex((prev) => (prev + 1) % openPost.images.length)}
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                              {openPost.images.map((_: any, idx: number) => (
                                <span key={idx} className={`w-2 h-2 rounded-full ${idx === imageIndex ? 'bg-white' : 'bg-white/60'}`} />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center space-x-6 mb-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePostLike}
                      disabled={postLikeLoading}
                      className={`flex items-center space-x-2 transition-colors ${
                        isPostLiked 
                          ? 'text-red-500 hover:text-red-600' 
                          : 'text-slate-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isPostLiked ? 'fill-current' : ''}`} />
                      <span>{openPost.likesCount || 0}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-slate-500 hover:text-blue-500 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{openPost.commentsCount || 0}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-slate-500 hover:text-orange-500 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                      <span>Share</span>
                    </Button>

                    {/* Donate Button for Campaigns - Only show if goal not reached */}
                    {openPost.goal && Number(openPost.raised || 0) < Number(openPost.goal || 0) && (
                      <Button
                        onClick={() => {
                          handleClosePost();
                          handleDonate(openPost.id);
                        }}
                        className="ml-auto bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Donate Now
                      </Button>
                    )}
                    {/* Goal Achieved Message for Campaigns */}
                    {openPost.goal && Number(openPost.raised || 0) >= Number(openPost.goal || 0) && (
                      <div className="ml-auto bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2 text-center">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          ✓ Goal Achieved!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Comments */}
                  <div className="space-y-4 mb-6">
                    {commentsLoading ? (
                      <div className="text-center text-slate-500">Loading comments...</div>
                    ) : comments.length === 0 ? (
                      <div className="text-center text-slate-500">No comments yet. Be the first to comment!</div>
                    ) : (
                      comments.map((comment: any) => (
                        <div key={comment.id} className="flex space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.authorImage} />
                            <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white">
                              {comment.authorName?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                                  {comment.authorName || 'Anonymous'}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatTimeAgo(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="flex space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={currentUser?.profileImage} />
                      <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white">
                        {currentUser?.firstName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex space-x-2">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                        className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button 
                        size="sm" 
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || addingComment}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Community Leader Profile Modal */}
      <CommunityLeaderProfileModal
        isOpen={isLeaderProfileOpen}
        onClose={() => {
          setIsLeaderProfileOpen(false);
          setSelectedLeader(null);
        }}
        leader={selectedLeader}
      />

      {/* Report Modal */}
      <CreateReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}

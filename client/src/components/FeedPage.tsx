import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Heart, MessageCircle, Share2, DollarSign, AlertTriangle, Users, Calendar, Clock, ChevronLeft, ChevronRight, X, Send } from 'lucide-react';
import { useIssues, useCampaigns } from '@/hooks/useFirestore';
import { useComments, useAddComment, usePostLikes } from '@/hooks/useComments';
import { useToast } from '@/hooks/use-toast';
import ShareModal from './ShareModal';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoadingSkeleton from './LoadingSkeleton';
import DonationModal from './DonationModal';
import CommunityLeaderProfileModal from './CommunityLeaderProfileModal';

// Individual Post Card Component with proper like functionality
const PostCard = ({ post, onOpenPost, onShare, onDonate, onAuthorClick }: {
  post: any;
  onOpenPost: (post: any) => void;
  onShare: (post: any) => void;
  onDonate: (id: string) => void;
  onAuthorClick: (id: string) => void;
}) => {
  const { isLiked, toggleLike, loading: likeLoading } = usePostLikes(post.id);
  
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
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-card border-border hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        {/* Post Header */}
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="w-12 h-12 cursor-pointer" onClick={() => onAuthorClick(post.authorId)}>
              <AvatarImage src={post.authorImage || ''} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-orange-500 text-white">
                {post.authorName?.charAt(0) || post.title?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 
                  className="font-semibold text-card-foreground hover:text-primary cursor-pointer transition-colors"
                  onClick={() => onAuthorClick(post.authorId)}
                >
                  {post.authorName || 'Community Leader'}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  post.type === 'issue' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                }`}>
                  {post.type === 'issue' ? 'Issue' : 'Campaign'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatTimeAgo(post.createdAt)}</span>
                <span>•</span>
                <span>{post.communityName || 'Community'}</span>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-card-foreground mb-3">
              {post.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {post.description}
            </p>
          </div>

          {/* Campaign Progress */}
          {post.type === 'campaign' && post.goal && (
            <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-card-foreground">Fundraising Progress</span>
                <span className="text-sm font-bold text-card-foreground">
                  {formatCurrency(post.raised || 0)} / {formatCurrency(post.goal)}
                </span>
              </div>
              <Progress 
                value={Math.min(((post.raised || 0) / post.goal) * 100, 100)} 
                className="h-3 mb-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(((post.raised || 0) / post.goal) * 100)}% funded</span>
                <span>{post.daysLeft || 0} days left</span>
              </div>
            </div>
          )}

          {/* Images */}
          {((post.images && post.images.length > 0) || post.image) && (
            <div className="mb-4">
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <img
                  src={(post.images && post.images[0]) || post.image}
                  alt={post.title}
                  className="w-full h-64 object-cover cursor-pointer"
                  onClick={() => onOpenPost(post)}
                />
                
                {/* Image Navigation */}
                {post.images && post.images.length > 1 && (
                  <>
                    <button
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle image navigation
                      }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle image navigation
                      }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                      {post.images.map((_: any, idx: number) => (
                        <span key={idx} className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-white' : 'bg-white/60'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike();
                }}
                disabled={likeLoading}
                className={`flex items-center space-x-2 transition-colors ${
                  isLiked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-muted-foreground hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{post.likesCount || 0}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPost(post);
                }}
                className="flex items-center space-x-2 text-muted-foreground hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{post.commentsCount || 0}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(post);
                }}
                className="flex items-center space-x-2 text-muted-foreground hover:text-orange-500 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </Button>
            </div>

            {/* Donate Button for Campaigns - Only show if goal not reached */}
            {post.type === 'campaign' && Number(post.raised || 0) < Number(post.goal || 0) && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDonate(post.id);
                }}
                className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
              >
                <Heart className="w-4 h-4 mr-2" />
                Donate Now
              </Button>
            )}
            {/* Goal Achieved Message for Campaigns */}
            {post.type === 'campaign' && Number(post.raised || 0) >= Number(post.goal || 0) && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2 text-center">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  ✓ Goal Achieved!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function FeedPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [openPost, setOpenPost] = useState<any | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [selectedLeader, setSelectedLeader] = useState<any | null>(null);
  const [isLeaderProfileOpen, setIsLeaderProfileOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharePost, setSharePost] = useState<any | null>(null);

  // Fetch all issues and campaigns (no community filter)
  const { issues, loading: issuesLoading } = useIssues(undefined, true);
  const { campaigns, loading: campaignsLoading } = useCampaigns(undefined, true);

  // Hooks for post modal
  const { comments, loading: commentsLoading } = useComments(openPost?.id || '', 10);
  const { addComment, loading: addingComment } = useAddComment();
  const { isLiked: isPostLiked, toggleLike: togglePostLike, loading: postLikeLoading } = usePostLikes(openPost?.id || '');

  // Combine and sort all posts by creation date
  const allPosts = [
    ...issues.map(issue => ({ ...issue, type: 'issue' })),
    ...campaigns.map(campaign => ({ ...campaign, type: 'campaign' }))
  ].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  const filteredPosts = activeTab === 'all' ? allPosts : allPosts.filter(post => post.type === activeTab);

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

  const handleShare = (post: any) => {
    setSharePost(post);
    setIsShareModalOpen(true);
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
            <h1 className="text-3xl font-bold text-gradient mb-2">
              Community Feed
            </h1>
            <p className="text-muted-foreground">Discover what's happening across all communities</p>
          </div>
        </div>
      </motion.header>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-8"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <span>All Posts</span>
              <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs">
                {allPosts.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="issue" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Issues</span>
              <span className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded-full text-xs">
                {issues.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="campaign" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Campaigns</span>
              <span className="bg-orange-500/20 text-orange-500 px-2 py-1 rounded-full text-xs">
                {campaigns.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <AnimatePresence mode="wait">
                {filteredPosts.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="bg-card border-border">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          {activeTab === 'issue' ? (
                            <AlertTriangle className="w-8 h-8 text-muted-foreground" />
                          ) : activeTab === 'campaign' ? (
                            <DollarSign className="w-8 h-8 text-muted-foreground" />
                          ) : (
                            <Users className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <h3 className="font-medium text-card-foreground mb-2">
                          {activeTab === 'all' ? 'No Posts Yet' : 
                           activeTab === 'issue' ? 'No Issues Yet' : 'No Campaigns Yet'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {activeTab === 'all' ? 'There are no posts from any community yet.' :
                           activeTab === 'issue' ? 'No issues have been reported across communities.' :
                           'No fundraising campaigns are active at the moment.'}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  filteredPosts.map((post, index) => (
                    <PostCard
                      key={`${post.type}-${post.id}`}
                      post={post}
                      onOpenPost={handleOpenPost}
                      onShare={handleShare}
                      onDonate={handleDonate}
                      onAuthorClick={handleAuthorClick}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

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
                    <AvatarImage src={openPost?.authorImage || ''} />
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

                    {/* Donate Button for Campaigns */}
                    {openPost.goal && (
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

      {/* Share Modal */}
      {sharePost && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setSharePost(null);
          }}
          post={{
            id: sharePost.id,
            title: sharePost.title,
            description: sharePost.description,
            type: sharePost.type,
            authorName: sharePost.authorName,
            communityName: sharePost.communityName,
          }}
        />
      )}
    </div>
  );
}

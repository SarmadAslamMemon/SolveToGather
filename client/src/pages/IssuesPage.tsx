import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useIssues } from '@/hooks/useFirestore';
import { useComments, useCommentReplies, useAddComment, useDeleteComment, usePostLikes, useCommentLikes } from '@/hooks/useComments';
import ShareModal from '@/components/ShareModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, Clock, MoreHorizontal, Flag, Bookmark, Send, ThumbsUp, Reply, Trash2, Eye, MapPin, AlertTriangle, Users } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import CommunityLeaderProfileModal from '@/components/CommunityLeaderProfileModal';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Individual Issue Card Component with proper like functionality
const IssueCard = ({ issue, onOpenIssue, onShare, onAuthorClick }: {
  issue: any;
  onOpenIssue: (issue: any) => void;
  onShare: (issue: any) => void;
  onAuthorClick: (id: string) => void;
}) => {
  const { isLiked, toggleLike, loading: likeLoading } = usePostLikes(issue.id);
  
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
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ 
        duration: 0.4, 
        ease: "easeOut"
      }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card 
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
        onClick={() => onOpenIssue(issue)}
      >
        <CardContent className="p-0">
          {/* Enhanced Post Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <div 
              className="flex items-center space-x-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg p-2 -m-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onAuthorClick(issue.authorId);
              }}
            >
              <div className="relative">
                <Avatar className="w-12 h-12 ring-2 ring-blue-200 dark:ring-blue-800">
                  <AvatarImage src={issue.authorImage} />
                  <AvatarFallback className="text-sm font-semibold bg-gradient-to-r from-blue-500 to-orange-500 text-white">
                    {issue.authorName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {issue.authorName || 'Community Leader'}
                </h3>
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{formatTimeAgo(issue.createdAt)}</span>
                  <span className="mx-2">•</span>
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>Community</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Bookmark className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Post Content */}
          <div className="px-4 pb-3">
            <h2 className="font-semibold text-card-foreground mb-2">{issue.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{issue.description}</p>
          </div>

          {/* Post Images */}
          {(issue.images?.length || issue.image) && (
            <div className="relative">
              <div className="relative w-full bg-muted">
                <img
                  src={(issue.images && issue.images[0]) || issue.image}
                  alt={issue.title}
                  className="w-full max-h-96 object-cover"
                />
                {issue.images && issue.images.length > 1 && (
                  <>
                    <button
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle image navigation
                      }}
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle image navigation
                      }}
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {issue.images.map((_: string, idx: number) => (
                        <span key={idx} className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-white' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Post Actions */}
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center justify-between">
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
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{issue.likesCount || 0}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenIssue(issue);
                }}
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{issue.commentsCount || 0}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(issue);
                }}
                className="flex items-center space-x-2 text-muted-foreground hover:text-accent-foreground"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function IssuesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { issues, loading } = useIssues(currentUser?.communityId, true);
  const [openIssue, setOpenIssue] = useState<any | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
  const [selectedLeader, setSelectedLeader] = useState<any | null>(null);
  const [isLeaderProfileOpen, setIsLeaderProfileOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharePost, setSharePost] = useState<any | null>(null);

  // Hooks for comments
  const { comments, loading: commentsLoading, hasMore, showAll, loadMore } = useComments(openIssue?.id || '', 5);
  const { addComment, loading: addingComment } = useAddComment();
  const { deleteComment, loading: deletingComment } = useDeleteComment();
  const { isLiked: isPostLiked, toggleLike: togglePostLike, loading: postLikeLoading } = usePostLikes(openIssue?.id || '');

  useEffect(() => {
    if (openIssue) {
      setImageIndex(0);
      setNewComment('');
      setReplyingTo(null);
      setReplyText('');
    }
  }, [openIssue]);

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

  const handleShare = (issue: any) => {
    setSharePost(issue);
    setIsShareModalOpen(true);
  };

  useEffect(() => {
    if (openIssue) {
      setImageIndex(0);
      setNewComment('');
      setReplyingTo(null);
      setReplyText('');
      setShowReplies({});
    }
  }, [openIssue]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !openIssue?.id) return;

    try {
      await addComment(openIssue.id, newComment.trim());
      setNewComment('');
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment.",
        variant: "destructive",
      });
    }
  };

  const handleAddReply = async (commentId: string) => {
    if (!replyText.trim()) return;

    try {
      await addComment(openIssue.id, replyText.trim(), commentId);
      setReplyText('');
      setReplyingTo(null);
      toast({
        title: "Reply added",
        description: "Your reply has been posted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add reply.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      toast({
        title: "Comment deleted",
        description: "The comment has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete comment.",
        variant: "destructive",
      });
    }
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Recursive Comment Component
  const CommentComponent = ({ comment, depth = 0 }: { comment: any; depth?: number }) => {
    const { replies, loading: repliesLoading, loadReplies } = useCommentReplies(comment.id);
    const { isLiked, toggleLike, loading: likeLoading } = useCommentLikes(comment.id);
    const showRepliesForThis = showReplies[comment.id];
    const isOwner = currentUser?.id === comment.userId;

    const handleLoadReplies = async () => {
      if (!showRepliesForThis && replies.length === 0) {
        await loadReplies();
      }
      toggleReplies(comment.id);
    };

    return (
      <div className="space-y-3">
        {/* Main Comment */}
        <div className="flex space-x-3">
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
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-red-500 hover:text-red-700 p-0 h-auto"
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deletingComment}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {comment.text}
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-2 ml-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`text-xs ${isLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}
                onClick={toggleLike}
                disabled={likeLoading}
              >
                <ThumbsUp className={`w-3 h-3 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                Like ({comment.likesCount || 0})
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-slate-500 hover:text-blue-500"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
              {comment.repliesCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-slate-500 hover:text-blue-500"
                  onClick={handleLoadReplies}
                  disabled={repliesLoading}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  {showRepliesForThis ? 'Hide' : 'View'} {comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Replies */}
        {showRepliesForThis && (
          <div className="ml-11 space-y-3">
            {replies.map((reply) => (
              <CommentComponent key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}

        {/* Reply Input */}
        {replyingTo === comment.id && (
          <div className="ml-11">
            <div className="flex space-x-3">
              <Avatar className="w-7 h-7">
                <AvatarImage src={currentUser?.profileImage} />
                <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white">
                  {currentUser?.firstName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex space-x-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[40px] resize-none"
                  maxLength={1000}
                />
                <Button 
                  size="sm" 
                  onClick={() => handleAddReply(comment.id)}
                  disabled={!replyText.trim() || addingComment}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <LoadingSkeleton type="dashboard" />;
  }

  return (
    <div className="ml-64 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Enhanced Facebook-style Feed */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {issues.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-xl">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-orange-100 dark:from-blue-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">No Issues Yet</h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">Be the first to report a community issue and help make a difference.</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <AnimatePresence>
              {issues.map((issue, index) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onOpenIssue={setOpenIssue}
                  onShare={handleShare}
                  onAuthorClick={handleAuthorClick}
                />
            ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Enhanced Issue Modal */}
      <Dialog open={!!openIssue} onOpenChange={() => setOpenIssue(null)}>
        <DialogContent className="sm:max-w-4xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-hidden p-0">
          {openIssue && (
            <div className="flex flex-col h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div 
                  className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg p-2 -m-2 transition-colors"
                  onClick={() => handleAuthorClick(openIssue.authorId)}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={openIssue.authorImage} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-orange-500 text-white">
                      {openIssue.authorName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {openIssue.authorName || 'Community Leader'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatTimeAgo(openIssue.createdAt)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {/* Post Content */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                    {openIssue.title}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    {openIssue.description}
                  </p>

                  {/* Images */}
                  {(openIssue.images?.length || openIssue.image) && (
                    <div className="relative mb-6">
                      <div className="relative w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                        <img 
                          src={(openIssue.images && openIssue.images[imageIndex]) || openIssue.image} 
                          alt={openIssue.title} 
                          className="w-full max-h-96 object-cover" 
                        />
                        {openIssue.images && openIssue.images.length > 1 && (
                          <>
                            <button
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImageIndex((prev: number) => (prev - 1 + openIssue.images.length) % openIssue.images.length);
                              }}
                              aria-label="Previous image"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImageIndex((prev: number) => (prev + 1) % openIssue.images.length);
                              }}
                              aria-label="Next image"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              {openIssue.images.map((_: string, idx: number) => (
                                <span key={idx} className={`w-2 h-2 rounded-full ${idx === imageIndex ? 'bg-white' : 'bg-white/50'}`} />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center justify-between py-4 border-t border-slate-200 dark:border-slate-700">
                    <Button 
                      variant="ghost" 
                      className={`flex items-center space-x-2 ${isPostLiked ? 'text-red-500' : 'text-slate-600 dark:text-slate-400 hover:text-red-500'}`}
                      onClick={togglePostLike}
                      disabled={postLikeLoading}
                    >
                      <Heart className={`w-5 h-5 ${isPostLiked ? 'fill-current' : ''}`} />
                      <span>{openIssue.likesCount || 0}</span>
                    </Button>
                    <Button variant="ghost" className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-blue-500">
                      <MessageCircle className="w-5 h-5" />
                      <span>{openIssue.commentsCount || 0}</span>
                    </Button>
                    <Button variant="ghost" className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-green-500">
                      <Share2 className="w-5 h-5" />
                      <span>Share</span>
                    </Button>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                      Comments ({openIssue.commentsCount || 0})
                    </h3>
                    {hasMore && !showAll && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={loadMore}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View all comments
                      </Button>
                    )}
                  </div>

                  {/* Comments List */}
                  {commentsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex space-x-3">
                          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                          <div className="flex-1">
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
                              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4 mb-6">
                      {comments.map((comment) => (
                        <CommentComponent key={comment.id} comment={comment} />
                      ))}
                      {comments.length === 0 && (
                        <div className="text-center py-8">
                          <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                          <p className="text-slate-500 dark:text-slate-400">No comments yet. Be the first to comment!</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="flex space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={currentUser?.profileImage} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-orange-500 text-white">
                        {currentUser?.firstName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex space-x-2">
                      <Textarea
                        placeholder="Write a comment... (max 200 words)"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[40px] resize-none"
                        maxLength={1000}
                      />
                      <Button 
                        size="sm" 
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || addingComment}
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
            type: 'issue',
            authorName: sharePost.authorName,
            communityName: sharePost.communityName,
          }}
        />
      )}
    </div>
  );
}

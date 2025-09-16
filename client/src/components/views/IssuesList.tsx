import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useIssues } from '@/hooks/useFirestore';
import { useComments, useAddComment, useDeleteComment, usePostLikes } from '@/hooks/useComments';
import IssueCard from '@/components/IssueCard';
import CommunityLeaderProfileModal from '@/components/CommunityLeaderProfileModal';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, Clock, Send, X, AlertTriangle } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function IssuesList() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { issues, loading } = useIssues(currentUser?.communityId, true);
  const [openIssue, setOpenIssue] = useState<any | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [selectedLeader, setSelectedLeader] = useState<any | null>(null);
  const [isLeaderProfileOpen, setIsLeaderProfileOpen] = useState(false);

  // Hooks for post modal
  const { comments, loading: commentsLoading } = useComments(openIssue?.id || '', 10);
  const { addComment, loading: addingComment } = useAddComment();
  const { deleteComment, loading: deletingComment } = useDeleteComment();
  const { isLiked: isPostLiked, toggleLike: togglePostLike, loading: postLikeLoading } = usePostLikes(openIssue?.id || '');

  useEffect(() => {
    if (openIssue) {
      setImageIndex(0);
      setNewComment('');
    }
  }, [openIssue]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !openIssue || !currentUser) return;

    try {
      await addComment(openIssue.id, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
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

  if (loading) {
    return <LoadingSkeleton type="dashboard" />;
  }

  return (
    <div className="ml-64 p-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-gradient">Issues</h1>
        <p className="text-muted-foreground">All issues from your community</p>
      </motion.header>

      <div className="space-y-6 max-w-2xl">
        {issues.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">No Issues Yet</h3>
              <p className="text-muted-foreground">Be the first to report a community issue.</p>
            </CardContent>
          </Card>
        ) : (
          issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onLike={(id) => console.log('Liked issue:', id)}
              onComment={(id) => console.log('Comment on issue:', id)}
              onShare={(id) => console.log('Share issue:', id)}
              onOpen={(it) => setOpenIssue(it)}
            />
          ))
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
                <Button variant="ghost" size="sm" onClick={() => setOpenIssue(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {/* Post Content */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                    {openIssue.title}
                  </h2>

                  <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                    {openIssue.description}
                  </p>

                  {/* Images */}
                  {((openIssue.images && openIssue.images.length > 0) || openIssue.image) && (
                    <div className="mb-6">
                      <div className="relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                        <img
                          src={(openIssue.images && openIssue.images[imageIndex]) || openIssue.image}
                          alt={openIssue.title}
                          className="w-full h-64 object-cover"
                        />

                        {/* Image Navigation */}
                        {openIssue.images && openIssue.images.length > 1 && (
                          <>
                            <button
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                              onClick={() => setImageIndex((prev) => (prev - 1 + openIssue.images.length) % openIssue.images.length)}
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                              onClick={() => setImageIndex((prev) => (prev + 1) % openIssue.images.length)}
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                              {openIssue.images.map((_: any, idx: number) => (
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
                      <span>{openIssue.likesCount || 0}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-slate-500 hover:text-blue-500 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{openIssue.commentsCount || 0}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-slate-500 hover:text-orange-500 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                      <span>Share</span>
                    </Button>
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
    </div>
  );
}



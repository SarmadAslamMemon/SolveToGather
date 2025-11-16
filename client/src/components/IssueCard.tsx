import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { usePostLikes } from '@/hooks/useComments';
import { deleteIssue } from '@/services/firebase';
import { Heart, MessageCircle, Share2, Clock, Trash2 } from 'lucide-react';
import ShareModal from './ShareModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface IssueCardProps {
  issue: {
    id: string;
    title: string;
    description: string;
    image?: string;
    likes: number;
    comments: number;
    authorId: string;
    createdAt: any;
    authorName?: string;
    authorImage?: string;
    communityId?: string;
  };
  onLike?: (issueId: string) => void;
  onComment?: (issueId: string) => void;
  onShare?: (issueId: string) => void;
  onOpen?: (issue: any) => void;
  onDelete?: (issueId: string) => void;
  showDelete?: boolean;
}

export default function IssueCard({ issue, onLike, onComment, onShare, onOpen, onDelete, showDelete = false }: IssueCardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [likesCount, setLikesCount] = useState(issue.likesCount || 0);
  const [imageIndex, setImageIndex] = useState(0);

  const isAdmin = currentUser?.role === 'community_leader' || currentUser?.role === 'super_user';
  const canDelete = showDelete && isAdmin && currentUser?.communityId === issue.communityId;

  // Use the proper hook for like functionality
  const { isLiked, loading: isLiking, toggleLike } = usePostLikes(issue.id);

  // Sync local state with props when they change (for real-time updates)
  useEffect(() => {
    setLikesCount(issue.likesCount || 0);
  }, [issue.likesCount]);

  const handleLike = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentUser) {
      toast({
        title: "Login required",
        description: "You need to login to like posts",
        variant: "destructive",
      });
      return;
    }

    try {
      await toggleLike();
      onLike?.(issue.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleComment = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onComment?.(issue.id);
  };

  const handleShare = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsShareModalOpen(true);
    onShare?.(issue.id);
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentUser || !currentUser.communityId) {
      toast({
        title: "Error",
        description: "Unable to delete issue. Missing user or community information.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteIssue(issue.id, currentUser.id, currentUser.communityId);
      toast({
        title: "Success",
        description: "Issue deleted successfully.",
      });
      onDelete?.(issue.id);
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Error deleting issue:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete issue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="hover-lift"
      onClick={() => onOpen?.(issue)}
    >
      <Card className="bg-card border-border hover:shadow-lg transition-shadow duration-300 overflow-hidden" data-testid={`card-issue-${issue.id}`}>
        {/* Large Image */}
        {((issue.images && (issue.images as any[]).length > 0) || issue.image) && (
          <div className="relative">
            <img
              src={(issue.images && (issue.images as any[])[imageIndex]) || issue.image}
              alt={issue.title}
              className="w-full h-48 sm:h-56 object-cover"
              data-testid={`img-issue-${issue.id}`}
            />
            
            {/* Image Navigation */}
            {issue.images && (issue.images as any[]).length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                  onClick={(e) => { e.stopPropagation(); setImageIndex((prev) => (prev - 1 + (issue.images as any[]).length) % (issue.images as any[]).length); }}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                  onClick={(e) => { e.stopPropagation(); setImageIndex((prev) => (prev + 1) % (issue.images as any[]).length); }}
                  aria-label="Next image"
                >
                  ›
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {(issue.images as any[]).map((_: any, idx: number) => (
                    <span key={idx} className={`w-2 h-2 rounded-full ${idx === imageIndex ? 'bg-white' : 'bg-white/60'}`} />
                  ))}
                </div>
              </>
            )}
            
            {/* Time overlay */}
            <div className="absolute top-2 right-2">
              <div className="bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                <span data-testid={`text-time-${issue.id}`}>{formatTimeAgo(issue.createdAt)}</span>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-4 sm:p-5">
          {/* Title */}
          <h3 className="font-semibold text-card-foreground mb-2 text-lg sm:text-xl line-clamp-2" data-testid={`text-title-${issue.id}`}>
            {issue.title}
          </h3>

          {/* Author info */}
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
            <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
              <AvatarImage src={issue.authorImage} />
              <AvatarFallback className="text-xs sm:text-sm bg-gradient-to-r from-blue-500 to-orange-500 text-white">
                {issue.authorName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm sm:text-base text-muted-foreground" data-testid={`text-author-${issue.id}`}>
              {issue.authorName || 'Anonymous'}
            </span>
            {!((issue.images && (issue.images as any[]).length > 0) || issue.image) && (
              <div className="ml-auto flex items-center text-muted-foreground text-sm">
                <Clock className="w-4 h-4 mr-1" />
                <span data-testid={`text-time-${issue.id}`}>{formatTimeAgo(issue.createdAt)}</span>
              </div>
            )}
          </div>
          
          {/* Description */}
          <p className="text-muted-foreground text-sm sm:text-base mb-4 line-clamp-3" data-testid={`text-description-${issue.id}`}>
            {issue.description}
          </p>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center space-x-2 transition-colors ${
                  isLiked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-muted-foreground hover:text-red-500'
                }`}
                data-testid={`button-like-${issue.id}`}
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span data-testid={`text-likes-${issue.id}`}>{likesCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleComment}
                className="flex items-center space-x-2 text-muted-foreground hover:text-blue-500 transition-colors"
                data-testid={`button-comment-${issue.id}`}
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span data-testid={`text-comments-${issue.id}`}>{issue.commentsCount || 0}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="flex items-center space-x-2 text-muted-foreground hover:text-orange-500 transition-colors"
                data-testid={`button-share-${issue.id}`}
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Share</span>
              </Button>
            </div>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(true);
                }}
                className="flex items-center space-x-2 text-red-500 hover:text-red-600 transition-colors"
                data-testid={`button-delete-${issue.id}`}
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={{
          id: issue.id,
          title: issue.title,
          description: issue.description,
          type: 'issue',
          authorName: issue.authorName,
          communityName: issue.communityName,
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Delete Issue</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete this issue? This action cannot be undone. All comments, likes, and related data will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

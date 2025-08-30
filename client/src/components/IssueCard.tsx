import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toggleLike } from '@/services/firebase';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Share2, Clock } from 'lucide-react';

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
  };
  onLike?: (issueId: string) => void;
  onComment?: (issueId: string) => void;
  onShare?: (issueId: string) => void;
}

export default function IssueCard({ issue, onLike, onComment, onShare }: IssueCardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(issue.likes || 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!currentUser) {
      toast({
        title: "Login required",
        description: "You need to login to like posts",
        variant: "destructive",
      });
      return;
    }

    setIsLiking(true);
    try {
      const liked = await toggleLike(issue.id, currentUser.id);
      setIsLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : prev - 1);
      onLike?.(issue.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = () => {
    onComment?.(issue.id);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: issue.title,
        text: issue.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Issue link copied to clipboard",
      });
    }
    onShare?.(issue.id);
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
    >
      <Card className="bg-card border-border hover:shadow-lg transition-shadow duration-300" data-testid={`card-issue-${issue.id}`}>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            {issue.image && (
              <div className="flex-shrink-0">
                <img
                  src={issue.image}
                  alt={issue.title}
                  className="w-20 h-20 rounded-lg object-cover border border-border"
                  data-testid={`img-issue-${issue.id}`}
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-card-foreground text-lg leading-tight" data-testid={`text-title-${issue.id}`}>
                  {issue.title}
                </h3>
                <div className="flex items-center text-muted-foreground text-sm ml-4">
                  <Clock className="w-4 h-4 mr-1" />
                  <span data-testid={`text-time-${issue.id}`}>{formatTimeAgo(issue.createdAt)}</span>
                </div>
              </div>

              {/* Author info */}
              <div className="flex items-center space-x-2 mb-3">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={issue.authorImage} />
                  <AvatarFallback className="text-xs">
                    {issue.authorName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground" data-testid={`text-author-${issue.id}`}>
                  {issue.authorName || 'Anonymous'}
                </span>
              </div>

              <p className="text-muted-foreground text-sm mb-4 line-clamp-3" data-testid={`text-description-${issue.id}`}>
                {issue.description}
              </p>

              <div className="flex items-center space-x-6">
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
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span data-testid={`text-likes-${issue.id}`}>{likesCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleComment}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
                  data-testid={`button-comment-${issue.id}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span data-testid={`text-comments-${issue.id}`}>{issue.comments || 0}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-accent-foreground transition-colors"
                  data-testid={`button-share-${issue.id}`}
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

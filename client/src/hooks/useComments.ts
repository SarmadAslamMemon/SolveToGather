import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  subscribeToComments, 
  getCommentReplies, 
  addComment, 
  deleteComment,
  likePost,
  unlikePost,
  likeComment,
  unlikeComment,
  isPostLiked,
  isCommentLiked
} from '@/services/firebase';

// Hook for real-time comments with pagination
export const useComments = (postId: string, initialLimit: number = 5) => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!postId) return;

    setLoading(true);
    const limit = showAll ? 50 : initialLimit; // Show more when "View all" is clicked
    
    const unsubscribe = subscribeToComments(postId, (newComments) => {
      setComments(newComments);
      setHasMore(newComments.length >= limit);
      setLoading(false);
    }, limit);

    return () => unsubscribe();
  }, [postId, showAll, initialLimit]);

  const loadMore = () => {
    setShowAll(true);
  };

  return {
    comments,
    loading,
    hasMore,
    showAll,
    loadMore,
    setComments
  };
};

// Hook for comment replies
export const useCommentReplies = (commentId: string) => {
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReplies = async () => {
    if (!commentId) return;
    
    setLoading(true);
    try {
      const commentReplies = await getCommentReplies(commentId);
      setReplies(commentReplies);
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    replies,
    loading,
    loadReplies,
    setReplies
  };
};

// Hook for adding comments
export const useAddComment = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const addNewComment = async (postId: string, text: string, parentCommentId?: string) => {
    if (!currentUser?.id) throw new Error('User not authenticated');
    if (!text.trim()) throw new Error('Comment cannot be empty');

    setLoading(true);
    try {
      const commentId = await addComment(postId, currentUser.id, text, parentCommentId);
      return commentId;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    addComment: addNewComment,
    loading
  };
};

// Hook for deleting comments
export const useDeleteComment = () => {
  const [loading, setLoading] = useState(false);

  const deleteCommentById = async (commentId: string) => {
    setLoading(true);
    try {
      await deleteComment(commentId);
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteComment: deleteCommentById,
    loading
  };
};

// Hook for post likes
export const usePostLikes = (postId: string) => {
  const { currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postId || !currentUser?.id) return;

    const checkLikeStatus = async () => {
      try {
        const liked = await isPostLiked(postId, currentUser.id);
        setIsLiked(liked);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    checkLikeStatus();
  }, [postId, currentUser?.id]);

  const toggleLike = async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      if (isLiked) {
        await unlikePost(postId, currentUser.id);
        setIsLiked(false);
      } else {
        await likePost(postId, currentUser.id);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    isLiked,
    loading,
    toggleLike
  };
};

// Hook for comment likes
export const useCommentLikes = (commentId: string) => {
  const { currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!commentId || !currentUser?.id) return;

    const checkLikeStatus = async () => {
      try {
        const liked = await isCommentLiked(commentId, currentUser.id);
        setIsLiked(liked);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    checkLikeStatus();
  }, [commentId, currentUser?.id]);

  const toggleLike = async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      if (isLiked) {
        await unlikeComment(commentId, currentUser.id);
        setIsLiked(false);
      } else {
        await likeComment(commentId, currentUser.id);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    isLiked,
    loading,
    toggleLike
  };
};

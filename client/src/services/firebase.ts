import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  where,
  increment,
  deleteDoc,
  onSnapshot,
  Timestamp,
  arrayUnion 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary, uploadToCloudinaryFallback } from '@/lib/cloudinary';

// Issues
export const getIssues = async (communityId?: string) => {
  try {
    let q = query(collection(db, 'issues'));
    
    if (communityId) {
      q = query(collection(db, 'issues'), where('communityId', '==', communityId));
    }

    const snapshot = await getDocs(q);
    const issues = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    
    // Fetch author information for each issue
    const issuesWithAuthors = await Promise.all(
      issues.map(async (issue) => {
        try {
          if (issue.authorId) {
            const authorDoc = await getDoc(doc(db, 'users', issue.authorId));
            if (authorDoc.exists()) {
              const authorData = authorDoc.data();
              return {
                ...issue,
                authorName: `${authorData.firstName} ${authorData.lastName}`.trim(),
                authorImage: authorData.profileImage || '',
                authorRole: authorData.role || 'normal_user',
              };
            }
          }
          return {
            ...issue,
            authorName: 'Community Leader',
            authorImage: '',
            authorRole: 'community_leader',
          };
        } catch (error) {
          console.error('Error fetching author for issue:', issue.id, error);
          return {
            ...issue,
            authorName: 'Community Leader',
            authorImage: '',
            authorRole: 'community_leader',
          };
        }
      })
    );
    
    // Sort in memory instead of using orderBy in query
    return issuesWithAuthors.sort((a, b) => {
      const aTime = (a as any).createdAt?.toDate?.() || new Date((a as any).createdAt);
      const bTime = (b as any).createdAt?.toDate?.() || new Date((b as any).createdAt);
      return bTime.getTime() - aTime.getTime();
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return [];
  }
};

export const createIssue = async (issueData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'issues'), {
      ...issueData,
      createdAt: Timestamp.now(),
      likes: 0,
      comments: 0,
    });
    // Track on author document
    if (issueData.authorId) {
      await updateDoc(doc(db, 'users', issueData.authorId), {
        issuesPosted: arrayUnion(docRef.id),
      });
    }
    return docRef.id;
  } catch (error) {
    console.error('Error creating issue:', error);
    throw error;
  }
};

export const toggleLike = async (issueId: string, userId: string) => {
  try {
    const likeQuery = query(
      collection(db, 'likes'), 
      where('issueId', '==', issueId),
      where('userId', '==', userId)
    );
    
    const likeSnapshot = await getDocs(likeQuery);
    
    if (likeSnapshot.empty) {
      // Add like
      await addDoc(collection(db, 'likes'), {
        issueId,
        userId,
        createdAt: Timestamp.now(),
      });
      
      // Increment issue likes count
      await updateDoc(doc(db, 'issues', issueId), {
        likes: increment(1),
      });
      
      return true;
    } else {
      // Remove like
      await deleteDoc(likeSnapshot.docs[0].ref);
      
      // Decrement issue likes count
      await updateDoc(doc(db, 'issues', issueId), {
        likes: increment(-1),
      });
      
      return false;
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

// Campaigns
export const getCampaigns = async (communityId?: string) => {
  try {
    let q = query(collection(db, 'campaigns'), where('isActive', '==', true));
    
    if (communityId) {
      q = query(collection(db, 'campaigns'), where('communityId', '==', communityId), where('isActive', '==', true));
    }

    const snapshot = await getDocs(q);
    const campaigns = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    
    // Sort in memory instead of using orderBy in query
    return campaigns.sort((a, b) => {
      const aTime = (a as any).createdAt?.toDate?.() || new Date((a as any).createdAt);
      const bTime = (b as any).createdAt?.toDate?.() || new Date((b as any).createdAt);
      return bTime.getTime() - aTime.getTime();
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
};

export const createCampaign = async (campaignData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'campaigns'), {
      ...campaignData,
      createdAt: Timestamp.now(),
      raised: 0,
      isActive: true,
    });
    // Track on author document
    if (campaignData.authorId) {
      await updateDoc(doc(db, 'users', campaignData.authorId), {
        campaignsPosted: arrayUnion(docRef.id),
      });
    }
    return docRef.id;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

// Payments
export const createPayment = async (paymentData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...paymentData,
      createdAt: Timestamp.now(),
      status: 'pending',
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (paymentId: string, status: string, transactionId?: string, failureReason?: string) => {
  try {
    const updateData: any = { 
      status,
      updatedAt: Timestamp.now()
    };
    
    if (transactionId) {
      updateData.jazzcashTransactionId = transactionId;
    }
    
    if (failureReason) {
      updateData.failureReason = failureReason;
    }
    
    if (status === 'completed') {
      updateData.completedAt = Timestamp.now();
    }
    
    await updateDoc(doc(db, 'payments', paymentId), updateData);
    
    // If payment is completed, update campaign raised amount
    if (status === 'completed') {
      const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
      if (paymentDoc.exists()) {
        const payment = paymentDoc.data();
        await updateDoc(doc(db, 'campaigns', payment.campaignId), {
          raised: increment(Number(payment.amount)),
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

export const getPaymentById = async (paymentId: string) => {
  try {
    const docRef = doc(db, 'payments', paymentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Payment not found');
    }
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw error;
  }
};

export const getPaymentsByCampaign = async (campaignId: string) => {
  try {
    const q = query(
      collection(db, 'payments'),
      where('campaignId', '==', campaignId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching campaign payments:', error);
    return [];
  }
};

export const getPaymentsByUser = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'payments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching user payments:', error);
    return [];
  }
};

// Legacy Donations (keeping for backward compatibility)
export const createDonation = async (donationData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'donations'), {
      ...donationData,
      createdAt: Timestamp.now(),
      status: 'pending',
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating donation:', error);
    throw error;
  }
};

export const updateDonationStatus = async (donationId: string, status: string, transactionId?: string) => {
  try {
    const updateData: any = { status };
    if (transactionId) {
      updateData.transactionId = transactionId;
    }
    
    await updateDoc(doc(db, 'donations', donationId), updateData);
    
    // If donation is completed, update campaign raised amount
    if (status === 'completed') {
      const donationDoc = await getDoc(doc(db, 'donations', donationId));
      if (donationDoc.exists()) {
        const donation = donationDoc.data();
        await updateDoc(doc(db, 'campaigns', donation.campaignId), {
          raised: increment(Number(donation.amount)),
        });
      }
    }
  } catch (error) {
    console.error('Error updating donation status:', error);
    throw error;
  }
};

// Communities
export const getCommunities = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'communities'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching communities:', error);
    return [];
  }
};

// File Upload - Cloudinary
export const uploadFile = async (file: File, path: string) => {
  try {
    console.log('Uploading to Cloudinary:', file.name);
    
    // Try Cloudinary first, fallback to placeholder if it fails
    try {
      const result = await uploadToCloudinary(file);
      console.log('Cloudinary upload successful:', result);
      return result;
    } catch (error) {
      console.warn('Cloudinary upload failed, using fallback:', error);
      const fallbackResult = await uploadToCloudinaryFallback(file);
      console.log('Fallback upload successful:', fallbackResult);
      return fallbackResult;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Users
export const updateUserProfileImage = async (userId: string, imageUrl: string) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      profileImage: imageUrl,
    });
  } catch (error) {
    console.error('Error updating user profile image:', error);
    throw error;
  }
};

// Get accurate counts for user's issues and campaigns
export const getUserActivityCounts = async (userId: string) => {
  try {
    // Count issues posted by this user
    const issuesQuery = query(collection(db, 'issues'), where('authorId', '==', userId));
    const issuesSnapshot = await getDocs(issuesQuery);
    const issuesCount = issuesSnapshot.size;

    // Count campaigns posted by this user
    const campaignsQuery = query(collection(db, 'campaigns'), where('authorId', '==', userId));
    const campaignsSnapshot = await getDocs(campaignsQuery);
    const campaignsCount = campaignsSnapshot.size;

    return {
      issuesCount,
      campaignsCount,
    };
  } catch (error) {
    console.error('Error getting user activity counts:', error);
    return {
      issuesCount: 0,
      campaignsCount: 0,
    };
  }
};

// Real-time subscriptions
export const subscribeToIssues = (callback: (issues: any[]) => void, communityId?: string) => {
  let q = query(collection(db, 'issues'));
  
  if (communityId) {
    q = query(collection(db, 'issues'), where('communityId', '==', communityId));
  }

  return onSnapshot(q, async (snapshot) => {
    const issues = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    
    // Fetch author information for each issue
    const issuesWithAuthors = await Promise.all(
      issues.map(async (issue) => {
        try {
          if (issue.authorId) {
            const authorDoc = await getDoc(doc(db, 'users', issue.authorId));
            if (authorDoc.exists()) {
              const authorData = authorDoc.data();
              return {
                ...issue,
                authorName: `${authorData.firstName} ${authorData.lastName}`.trim(),
                authorImage: authorData.profileImage || '',
                authorRole: authorData.role || 'normal_user',
              };
            }
          }
          return {
            ...issue,
            authorName: 'Community Leader',
            authorImage: '',
            authorRole: 'community_leader',
          };
        } catch (error) {
          console.error('Error fetching author for issue:', issue.id, error);
          return {
            ...issue,
            authorName: 'Community Leader',
            authorImage: '',
            authorRole: 'community_leader',
          };
        }
      })
    );
    
    // Sort in memory instead of using orderBy in query
    const sortedIssues = issuesWithAuthors.sort((a, b) => {
      const aTime = (a as any).createdAt?.toDate?.() || new Date((a as any).createdAt);
      const bTime = (b as any).createdAt?.toDate?.() || new Date((b as any).createdAt);
      return bTime.getTime() - aTime.getTime();
    });
    
    callback(sortedIssues);
  });
};

export const subscribeToCampaigns = (callback: (campaigns: any[]) => void, communityId?: string) => {
  let q = query(collection(db, 'campaigns'), where('isActive', '==', true));
  
  if (communityId) {
    q = query(collection(db, 'campaigns'), where('communityId', '==', communityId), where('isActive', '==', true));
  }

  return onSnapshot(q, (snapshot) => {
    const campaigns = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    
    // Sort in memory instead of using orderBy in query
    const sortedCampaigns = campaigns.sort((a, b) => {
      const aTime = (a as any).createdAt?.toDate?.() || new Date((a as any).createdAt);
      const bTime = (b as any).createdAt?.toDate?.() || new Date((b as any).createdAt);
      return bTime.getTime() - aTime.getTime();
    });
    
    callback(sortedCampaigns);
  });
};

// ==================== COMMENTS SYSTEM ====================

export const addComment = async (postId: string, userId: string, text: string, parentCommentId?: string) => {
  try {
    // Validate text length (200 words max)
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount > 200) {
      throw new Error('Comment cannot exceed 200 words');
    }

    const commentData = {
      postId,
      userId,
      text: text.trim(),
      parentCommentId: parentCommentId || null,
      likesCount: 0,
      repliesCount: 0,
      depth: parentCommentId ? await getCommentDepth(parentCommentId) + 1 : 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Add comment
    const commentRef = await addDoc(collection(db, 'comments'), commentData);
    
    // Update post comments count
    await updateDoc(doc(db, 'issues', postId), {
      commentsCount: increment(1)
    });

    // Update parent comment replies count if it's a reply
    if (parentCommentId) {
      await updateDoc(doc(db, 'comments', parentCommentId), {
        repliesCount: increment(1)
      });
    }

    return commentRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const getCommentDepth = async (commentId: string): Promise<number> => {
  const commentDoc = await getDoc(doc(db, 'comments', commentId));
  if (commentDoc.exists()) {
    return commentDoc.data().depth || 0;
  }
  return 0;
};

export const getComments = async (postId: string, commentLimit: number = 10): Promise<any[]> => {
  try {
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      where('parentCommentId', '==', null)
    );

    const snapshot = await getDocs(q);
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort and limit in memory to avoid complex index requirements
    const sortedComments = comments.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return bTime.getTime() - aTime.getTime();
    }).slice(0, commentLimit);

    // Get user info for each comment
    const commentsWithUsers = await Promise.all(
      sortedComments.map(async (comment: any) => {
        const userDoc = await getDoc(doc(db, 'users', comment.userId));
        const userData = userDoc.exists() ? userDoc.data() : null;
        return {
          ...comment,
          authorName: userData ? `${userData.firstName} ${userData.lastName}` : 'Anonymous',
          authorImage: userData?.profileImage || ''
        };
      })
    );

    return commentsWithUsers;
  } catch (error) {
    console.error('Error getting comments:', error);
    throw error;
  }
};

export const getCommentReplies = async (commentId: string): Promise<any[]> => {
  try {
    const q = query(
      collection(db, 'comments'),
      where('parentCommentId', '==', commentId)
    );

    const snapshot = await getDocs(q);
    const replies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort in memory to avoid complex index requirements
    const sortedReplies = replies.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return aTime.getTime() - bTime.getTime(); // Ascending order for replies
    });

    // Get user info for each reply
    const repliesWithUsers = await Promise.all(
      sortedReplies.map(async (reply: any) => {
        const userDoc = await getDoc(doc(db, 'users', reply.userId));
        const userData = userDoc.exists() ? userDoc.data() : null;
        return {
          ...reply,
          authorName: userData ? `${userData.firstName} ${userData.lastName}` : 'Anonymous',
          authorImage: userData?.profileImage || ''
        };
      })
    );

    return repliesWithUsers;
  } catch (error) {
    console.error('Error getting comment replies:', error);
    throw error;
  }
};

export const subscribeToComments = (postId: string, callback: (comments: any[]) => void, commentLimit: number = 10) => {
  const q = query(
    collection(db, 'comments'),
    where('postId', '==', postId),
    where('parentCommentId', '==', null)
  );

  return onSnapshot(q, async (snapshot) => {
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort and limit in memory to avoid complex index requirements
    const sortedComments = comments.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return bTime.getTime() - aTime.getTime();
    }).slice(0, commentLimit);

    // Get user info for each comment
    const commentsWithUsers = await Promise.all(
      sortedComments.map(async (comment: any) => {
        const userDoc = await getDoc(doc(db, 'users', comment.userId));
        const userData = userDoc.exists() ? userDoc.data() : null;
        return {
          ...comment,
          authorName: userData ? `${userData.firstName} ${userData.lastName}` : 'Anonymous',
          authorImage: userData?.profileImage || ''
        };
      })
    );

    callback(commentsWithUsers);
  });
};

export const deleteComment = async (commentId: string) => {
  try {
    const commentDoc = await getDoc(doc(db, 'comments', commentId));
    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }

    const commentData = commentDoc.data();
    
    // Delete all replies first (recursive)
    const replies = await getCommentReplies(commentId);
    for (const reply of replies) {
      await deleteComment(reply.id);
    }

    // Delete the comment
    await deleteDoc(doc(db, 'comments', commentId));

    // Update post comments count
    await updateDoc(doc(db, 'issues', commentData.postId), {
      commentsCount: increment(-1)
    });

    // Update parent comment replies count if it's a reply
    if (commentData.parentCommentId) {
      await updateDoc(doc(db, 'comments', commentData.parentCommentId), {
        repliesCount: increment(-1)
      });
    }

    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// ==================== LIKES SYSTEM ====================

export const likePost = async (postId: string, userId: string) => {
  try {
    // Check if already liked
    const likeQuery = query(
      collection(db, 'likes'),
      where('userId', '==', userId),
      where('targetType', '==', 'post'),
      where('targetId', '==', postId)
    );
    
    const existingLikes = await getDocs(likeQuery);
    
    if (existingLikes.empty) {
      // Add like
      await addDoc(collection(db, 'likes'), {
        userId,
        targetType: 'post',
        targetId: postId,
        createdAt: Timestamp.now()
      });

      // Update post likes count
      await updateDoc(doc(db, 'issues', postId), {
        likesCount: increment(1)
      });

      return true;
    }
    
    return false; // Already liked
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
};

export const unlikePost = async (postId: string, userId: string) => {
  try {
    const likeQuery = query(
      collection(db, 'likes'),
      where('userId', '==', userId),
      where('targetType', '==', 'post'),
      where('targetId', '==', postId)
    );
    
    const existingLikes = await getDocs(likeQuery);
    
    if (!existingLikes.empty) {
      // Remove like
      await deleteDoc(existingLikes.docs[0].ref);

      // Update post likes count
      await updateDoc(doc(db, 'issues', postId), {
        likesCount: increment(-1)
      });

      return true;
    }
    
    return false; // Not liked
  } catch (error) {
    console.error('Error unliking post:', error);
    throw error;
  }
};

export const likeComment = async (commentId: string, userId: string) => {
  try {
    // Check if already liked
    const likeQuery = query(
      collection(db, 'likes'),
      where('userId', '==', userId),
      where('targetType', '==', 'comment'),
      where('targetId', '==', commentId)
    );
    
    const existingLikes = await getDocs(likeQuery);
    
    if (existingLikes.empty) {
      // Add like
      await addDoc(collection(db, 'likes'), {
        userId,
        targetType: 'comment',
        targetId: commentId,
        createdAt: Timestamp.now()
      });

      // Update comment likes count
      await updateDoc(doc(db, 'comments', commentId), {
        likesCount: increment(1)
      });

      return true;
    }
    
    return false; // Already liked
  } catch (error) {
    console.error('Error liking comment:', error);
    throw error;
  }
};

export const unlikeComment = async (commentId: string, userId: string) => {
  try {
    const likeQuery = query(
      collection(db, 'likes'),
      where('userId', '==', userId),
      where('targetType', '==', 'comment'),
      where('targetId', '==', commentId)
    );
    
    const existingLikes = await getDocs(likeQuery);
    
    if (!existingLikes.empty) {
      // Remove like
      await deleteDoc(existingLikes.docs[0].ref);

      // Update comment likes count
      await updateDoc(doc(db, 'comments', commentId), {
        likesCount: increment(-1)
      });

      return true;
    }
    
    return false; // Not liked
  } catch (error) {
    console.error('Error unliking comment:', error);
    throw error;
  }
};

export const isPostLiked = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const likeQuery = query(
      collection(db, 'likes'),
      where('userId', '==', userId),
      where('targetType', '==', 'post'),
      where('targetId', '==', postId)
    );
    
    const existingLikes = await getDocs(likeQuery);
    return !existingLikes.empty;
  } catch (error) {
    console.error('Error checking post like status:', error);
    return false;
  }
};

export const isCommentLiked = async (commentId: string, userId: string): Promise<boolean> => {
  try {
    const likeQuery = query(
      collection(db, 'likes'),
      where('userId', '==', userId),
      where('targetType', '==', 'comment'),
      where('targetId', '==', commentId)
    );
    
    const existingLikes = await getDocs(likeQuery);
    return !existingLikes.empty;
  } catch (error) {
    console.error('Error checking comment like status:', error);
    return false;
  }
};

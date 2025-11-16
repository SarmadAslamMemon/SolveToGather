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
    
    // Fetch author information for each campaign
    const campaignsWithAuthors = await Promise.all(
      campaigns.map(async (campaign) => {
        try {
          if (campaign.authorId) {
            const authorDoc = await getDoc(doc(db, 'users', campaign.authorId));
            if (authorDoc.exists()) {
              const authorData = authorDoc.data();
              return {
                ...campaign,
                authorName: `${authorData.firstName} ${authorData.lastName}`.trim(),
                authorImage: authorData.profileImage || '',
                authorRole: authorData.role || 'normal_user',
              };
            }
          }
          return {
            ...campaign,
            authorName: 'Community Leader',
            authorImage: '',
            authorRole: 'community_leader',
          };
        } catch (error) {
          console.error('Error fetching author for campaign:', campaign.id, error);
          return {
            ...campaign,
            authorName: 'Community Leader',
            authorImage: '',
            authorRole: 'community_leader',
          };
        }
      })
    );
    
    // Sort in memory instead of using orderBy in query
    return campaignsWithAuthors.sort((a, b) => {
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

// Delete Issue
export const deleteIssue = async (issueId: string, userId: string, communityId: string) => {
  try {
    // Verify the user is a community leader of this community
    const issueDoc = await getDoc(doc(db, 'issues', issueId));
    if (!issueDoc.exists()) {
      throw new Error('Issue not found');
    }

    const issueData = issueDoc.data();
    
    // Check if user is the author or a community leader of the same community
    if (issueData.authorId !== userId && issueData.communityId !== communityId) {
      throw new Error('Unauthorized: You can only delete issues from your community');
    }

    // Delete all likes for this issue (using targetId and targetType)
    const likesQuery = query(
      collection(db, 'likes'),
      where('targetId', '==', issueId),
      where('targetType', '==', 'post')
    );
    const likesSnapshot = await getDocs(likesQuery);
    await Promise.all(
      likesSnapshot.docs.map(async (likeDoc) => {
        await deleteDoc(likeDoc.ref);
      })
    );

    // Delete all comments for this issue (recursively)
    const commentsQuery = query(
      collection(db, 'comments'),
      where('postId', '==', issueId)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    await Promise.all(
      commentsSnapshot.docs.map(async (commentDoc) => {
        // Delete comment and its replies recursively
        await deleteComment(commentDoc.id);
      })
    );

    // Delete the issue document
    await deleteDoc(doc(db, 'issues', issueId));

    // Remove from author's issuesPosted array if exists
    if (issueData.authorId) {
      const authorDoc = await getDoc(doc(db, 'users', issueData.authorId));
      if (authorDoc.exists()) {
        const authorData = authorDoc.data();
        const issuesPosted = (authorData.issuesPosted || []).filter((id: string) => id !== issueId);
        await updateDoc(doc(db, 'users', issueData.authorId), {
          issuesPosted,
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error deleting issue:', error);
    throw error;
  }
};

// Delete Campaign
export const deleteCampaign = async (campaignId: string, userId: string, communityId: string) => {
  try {
    // Verify the user is a community leader of this community
    const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId));
    if (!campaignDoc.exists()) {
      throw new Error('Campaign not found');
    }

    const campaignData = campaignDoc.data();
    
    // Check if user is the author or a community leader of the same community
    if (campaignData.authorId !== userId && campaignData.communityId !== communityId) {
      throw new Error('Unauthorized: You can only delete campaigns from your community');
    }

    // Delete all likes for this campaign (using targetId and targetType)
    const likesQuery = query(
      collection(db, 'likes'),
      where('targetId', '==', campaignId),
      where('targetType', '==', 'post')
    );
    const likesSnapshot = await getDocs(likesQuery);
    await Promise.all(
      likesSnapshot.docs.map(async (likeDoc) => {
        await deleteDoc(likeDoc.ref);
      })
    );

    // Delete all comments for this campaign (recursively)
    const commentsQuery = query(
      collection(db, 'comments'),
      where('postId', '==', campaignId)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    await Promise.all(
      commentsSnapshot.docs.map(async (commentDoc) => {
        // Delete comment and its replies recursively
        await deleteComment(commentDoc.id);
      })
    );

    // Delete all transactions for this campaign
    const transactionsQuery = query(
      collection(db, 'transactionHistory'),
      where('campaignId', '==', campaignId)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);
    await Promise.all(
      transactionsSnapshot.docs.map(async (transactionDoc) => {
        const transactionData = transactionDoc.data();
        // Delete transaction detail if exists
        if (transactionData.transactionDetailId) {
          await deleteDoc(doc(db, 'transactionDetails', transactionData.transactionDetailId));
        }
        // Delete transaction history
        await deleteDoc(transactionDoc.ref);
      })
    );

    // Delete the campaign document
    await deleteDoc(doc(db, 'campaigns', campaignId));

    // Remove from author's campaignsPosted array if exists
    if (campaignData.authorId) {
      const authorDoc = await getDoc(doc(db, 'users', campaignData.authorId));
      if (authorDoc.exists()) {
        const authorData = authorDoc.data();
        const campaignsPosted = (authorData.campaignsPosted || []).filter((id: string) => id !== campaignId);
        await updateDoc(doc(db, 'users', campaignData.authorId), {
          campaignsPosted,
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
};

// Payment Methods
export const getPaymentMethods = async (communityId: string, leaderId?: string) => {
  try {
    let q;
    if (leaderId) {
      // Query by both communityId and leaderId
      q = query(
        collection(db, 'paymentMethod'),
        where('communityId', '==', communityId),
        where('leaderId', '==', leaderId),
        where('isActive', '==', true)
      );
    } else {
      // Query by communityId only
      q = query(
        collection(db, 'paymentMethod'),
        where('communityId', '==', communityId),
        where('isActive', '==', true)
      );
    }

    const snapshot = await getDocs(q);
    const methods = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return methods;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }
};

// Transactions - New Receipt Upload System
export const uploadReceiptImage = async (file: File, transactionId: string, communityId: string): Promise<string> => {
  try {
    const imagePath = `receipts/${communityId}/${transactionId}/${Date.now()}-${file.name}`;
    const url = await uploadFile(file, imagePath);
    return url;
  } catch (error) {
    console.error('Error uploading receipt image:', error);
    throw error;
  }
};

export const createTransaction = async (transactionData: {
  campaignId: string;
  communityId: string;
  senderId: string;
  senderName: string;
  amount: number;
  totalAmount: number;
  requiredAmount: number;
  paymentMethod: string;
  receiptImageUrl: string;
}): Promise<{ transactionHistoryId: string; transactionDetailId: string }> => {
  try {
    console.log(`📝 [createTransaction] Creating new transaction for campaign ${transactionData.campaignId}`);
    console.log(`📝 [createTransaction] Transaction data:`, {
      senderId: transactionData.senderId,
      senderName: transactionData.senderName,
      amount: transactionData.amount,
      totalAmount: transactionData.totalAmount,
      paymentMethod: transactionData.paymentMethod
    });
    
    // Create transactionDetails first
    const transactionDetailRef = await addDoc(collection(db, 'transactionDetails'), {
      senderName: transactionData.senderName,
      senderId: transactionData.senderId,
      amount: transactionData.amount,
      time: Timestamp.now(),
      receiptImage: transactionData.receiptImageUrl,
      isPaymentVerified: false,
      paymentMethod: transactionData.paymentMethod,
      communityId: transactionData.communityId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`✅ [createTransaction] Created transactionDetails: ${transactionDetailRef.id}`);

    // Create transactionHistory with reference to transactionDetails
    const transactionHistoryRef = await addDoc(collection(db, 'transactionHistory'), {
      transId: '', // Will be set after creation
      campaignId: transactionData.campaignId,
      requiredAmount: transactionData.requiredAmount,
      totalAmount: transactionData.totalAmount,
      transactionDetailId: transactionDetailRef.id,
      status: 'pending',
      communityId: transactionData.communityId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`✅ [createTransaction] Created transactionHistory: ${transactionHistoryRef.id} with status: pending`);

    // Update transactionHistory with the actual transId
    await updateDoc(doc(db, 'transactionHistory', transactionHistoryRef.id), {
      transId: transactionHistoryRef.id,
    });

    // Update transactionDetails with transactionHistoryId
    await updateDoc(doc(db, 'transactionDetails', transactionDetailRef.id), {
      transactionHistoryId: transactionHistoryRef.id,
    });
    
    console.log(`✅ [createTransaction] Transaction created successfully. Will appear in admin pending transactions.`);
    console.log(`📋 [createTransaction] Transaction will be visible to admin for campaign: ${transactionData.campaignId}`);

    return {
      transactionHistoryId: transactionHistoryRef.id,
      transactionDetailId: transactionDetailRef.id,
    };
  } catch (error) {
    console.error('❌ [createTransaction] Error creating transaction:', error);
    throw error;
  }
};

export const getCampaignSupporterCount = async (campaignId: string): Promise<number> => {
  try {
    // Get all verified transactions for this campaign
    const q = query(
      collection(db, 'transactionHistory'),
      where('campaignId', '==', campaignId),
      where('status', '==', 'verified')
    );
    const snapshot = await getDocs(q);
    
    // Count unique supporters (unique senderIds from transactionDetails)
    const supporterIds = new Set<string>();
    await Promise.all(
      snapshot.docs.map(async (transactionDoc) => {
        const data = transactionDoc.data();
        if (data.transactionDetailId) {
          const detailDoc = await getDoc(doc(db, 'transactionDetails', data.transactionDetailId));
          if (detailDoc.exists()) {
            const detailData = detailDoc.data() as any;
            if (detailData.senderId) {
              supporterIds.add(detailData.senderId);
            }
          }
        }
      })
    );
    
    return supporterIds.size;
  } catch (error) {
    console.error('Error fetching campaign supporter count:', error);
    return 0;
  }
};

export const getTransactionsByCampaign = async (campaignId: string) => {
  try {
    const q = query(
      collection(db, 'transactionHistory'),
      where('campaignId', '==', campaignId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const transactions = await Promise.all(
      snapshot.docs.map(async (transactionDoc) => {
        const data = transactionDoc.data();
        // Fetch transaction details
        if (data.transactionDetailId) {
          const detailDoc = await getDoc(doc(db, 'transactionDetails', data.transactionDetailId));
          return {
            id: transactionDoc.id,
            ...data,
            details: detailDoc.exists() ? detailDoc.data() : null,
          };
        }
        return {
          id: transactionDoc.id,
          ...data,
          details: null,
        };
      })
    );
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions by campaign:', error);
    return [];
  }
};

export const getTransactionsByUser = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'transactionDetails'),
      where('senderId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const transactions = await Promise.all(
      snapshot.docs.map(async (transactionDetailDoc) => {
        const data = transactionDetailDoc.data();
        // Fetch transaction history
        if (data.transactionHistoryId) {
          const historyDoc = await getDoc(doc(db, 'transactionHistory', data.transactionHistoryId));
          return {
            id: transactionDetailDoc.id,
            ...data,
            history: historyDoc.exists() ? historyDoc.data() : null,
          };
        }
        return { id: transactionDetailDoc.id, ...data };
      })
    );
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions by user:', error);
    return [];
  }
};

export const getPendingTransactions = async (communityId: string, leaderId?: string) => {
  try {
    // Query without orderBy to avoid index requirement - we'll sort in memory
    const q = query(
      collection(db, 'transactionHistory'),
      where('communityId', '==', communityId),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);
    
    // If leaderId is provided, filter transactions for campaigns created by the leader
    let transactions = await Promise.all(
      snapshot.docs.map(async (transactionHistoryDoc) => {
        const data = transactionHistoryDoc.data();
        // Fetch transaction details
        let details = null;
        if (data.transactionDetailId) {
          const detailDoc = await getDoc(doc(db, 'transactionDetails', data.transactionDetailId));
          if (detailDoc.exists()) {
            details = detailDoc.data();
          }
        }
        
        // Fetch campaign to check authorId
        let campaign: any = null;
        if (data.campaignId) {
          const campaignDoc = await getDoc(doc(db, 'campaigns', data.campaignId));
          if (campaignDoc.exists()) {
            campaign = campaignDoc.data();
          }
        }
        
        return {
          id: transactionHistoryDoc.id,
          ...data,
          details,
          campaign,
        };
      })
    );
    
    // Filter by leader's campaigns if leaderId is provided
    if (leaderId) {
      transactions = transactions.filter(transaction => 
        transaction.campaign && transaction.campaign.authorId === leaderId
      );
    }
    
    // Sort by createdAt in memory (descending - newest first)
    transactions.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return bTime.getTime() - aTime.getTime();
    });
    
    return transactions;
  } catch (error) {
    console.error('Error fetching pending transactions:', error);
    return [];
  }
};

export const verifyTransaction = async (
  transactionHistoryId: string,
  leaderId: string,
  verified: boolean,
  rejectionReason?: string
): Promise<void> => {
  try {
    console.log(`🔍 [verifyTransaction] Starting verification for transaction ${transactionHistoryId}, verified: ${verified}`);
    
    const transactionHistoryDoc = await getDoc(doc(db, 'transactionHistory', transactionHistoryId));
    if (!transactionHistoryDoc.exists()) {
      throw new Error('Transaction not found');
    }

    const transactionData = transactionHistoryDoc.data();
    const status = verified ? 'verified' : 'rejected';
    
    console.log(`📊 [verifyTransaction] Transaction data:`, {
      campaignId: transactionData.campaignId,
      totalAmount: transactionData.totalAmount,
      status: status
    });

    // Update transactionHistory
    await updateDoc(doc(db, 'transactionHistory', transactionHistoryId), {
      status,
      updatedAt: Timestamp.now(),
    });
    console.log(`✅ [verifyTransaction] Updated transactionHistory status to: ${status}`);

    // Update transactionDetails and get sender info for notifications
    let senderId: string | null = null;
    if (transactionData.transactionDetailId) {
      const detailDoc = await getDoc(doc(db, 'transactionDetails', transactionData.transactionDetailId));
      if (detailDoc.exists()) {
        const detailData = detailDoc.data();
        senderId = detailData.senderId || null;
      }
      
      const updateData: any = {
        isPaymentVerified: verified,
        updatedAt: Timestamp.now(),
      };
      
      if (verified) {
        updateData.verifiedBy = leaderId;
        updateData.verifiedAt = Timestamp.now();
        console.log(`✅ [verifyTransaction] Setting verification details for transactionDetails`);
      } else {
        // When rejecting, set rejectionReason if provided
        if (rejectionReason) {
          updateData.rejectionReason = rejectionReason;
          console.log(`❌ [verifyTransaction] Setting rejection reason`);
        }
      }
      
      await updateDoc(doc(db, 'transactionDetails', transactionData.transactionDetailId), updateData);
      console.log(`✅ [verifyTransaction] Updated transactionDetails`);
    }

    // If verified, update campaign raised amount
    if (verified) {
      console.log(`💰 [verifyTransaction] Updating campaign raised amount: campaignId=${transactionData.campaignId}, amount=${transactionData.totalAmount}`);
      await updateCampaignRaisedAmount(transactionData.campaignId, transactionData.totalAmount);
      console.log(`✅ [verifyTransaction] Campaign raised amount updated successfully`);
    } else if (senderId && rejectionReason) {
      // If rejected, notify the user with the rejection reason
      try {
        console.log(`📧 [verifyTransaction] Sending rejection notification to user: ${senderId}`);
        await createNotification(
          senderId,
          'transaction_rejected',
          'Payment Rejected',
          `Your payment has been rejected. Reason: ${rejectionReason}`,
          transactionHistoryId,
          'transaction',
          transactionData.communityId
        );
        console.log(`✅ [verifyTransaction] Rejection notification sent successfully`);
      } catch (notificationError) {
        console.error('⚠️ [verifyTransaction] Failed to send rejection notification (continuing anyway):', notificationError);
        // Don't throw - notification failure shouldn't break the rejection process
      }
    }
    
    console.log(`✅ [verifyTransaction] Transaction verification completed successfully`);
  } catch (error) {
    console.error('❌ [verifyTransaction] Error verifying transaction:', error);
    throw error;
  }
};

export const updateCampaignRaisedAmount = async (campaignId: string, amount: number): Promise<void> => {
  try {
    // Ensure amount is a valid number
    const addAmount = Number(amount);
    if (isNaN(addAmount) || addAmount <= 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }
    
    // Get current campaign to check raised amount
    const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId));
    if (!campaignDoc.exists()) {
      throw new Error('Campaign not found');
    }
    
    const campaignData = campaignDoc.data();
    const currentRaised = Number(campaignData.raised || 0);
    const newRaised = currentRaised + addAmount;
    
    await updateDoc(doc(db, 'campaigns', campaignId), {
      raised: newRaised,
      updatedAt: Timestamp.now(),
    });
    
    console.log(`✅ Updated campaign ${campaignId} raised amount: ${currentRaised} + ${addAmount} = ${newRaised}`);
  } catch (error) {
    console.error('Error updating campaign raised amount:', error);
    throw error;
  }
};

export const updateTransactionStatus = async (transactionId: string, status: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'transactionHistory', transactionId), {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
};

// Payments - DEPRECATED: Use transactions instead
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

// Communities - Fetch from API endpoint to get enriched data
export const getCommunities = async () => {
  try {
    const response = await fetch('/api/communities');
    if (!response.ok) {
      throw new Error('Failed to fetch communities from API');
    }
    const communities = await response.json();
    console.log('✅ Fetched communities from API:', communities);
    return communities;
  } catch (error) {
    console.error('Error fetching communities from API:', error);
    // Fallback to direct Firestore query
    try {
      console.log('⚠️ Falling back to direct Firestore query...');
      const snapshot = await getDocs(collection(db, 'communities'));
      const communities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('✅ Fetched communities from Firestore:', communities);
      return communities;
    } catch (firestoreError) {
      console.error('Error fetching communities from Firestore:', firestoreError);
      return [];
    }
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

  return onSnapshot(q, async (snapshot) => {
    const campaigns = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    
    // Fetch author information for each campaign
    const campaignsWithAuthors = await Promise.all(
      campaigns.map(async (campaign) => {
        try {
          if (campaign.authorId) {
            const authorDoc = await getDoc(doc(db, 'users', campaign.authorId));
            if (authorDoc.exists()) {
              const authorData = authorDoc.data();
              return {
                ...campaign,
                authorName: `${authorData.firstName} ${authorData.lastName}`.trim(),
                authorImage: authorData.profileImage || '',
                authorRole: authorData.role || 'normal_user',
              };
            }
          }
          return {
            ...campaign,
            authorName: 'Community Leader',
            authorImage: '',
            authorRole: 'community_leader',
          };
        } catch (error) {
          console.error('Error fetching author for campaign:', campaign.id, error);
          return {
            ...campaign,
            authorName: 'Community Leader',
            authorImage: '',
            authorRole: 'community_leader',
          };
        }
      })
    );
    
    // Sort in memory instead of using orderBy in query
    const sortedCampaigns = campaignsWithAuthors.sort((a, b) => {
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
    
    // Update post comments count - check if it's an issue or campaign
    const issueRef = doc(db, 'issues', postId);
    const campaignRef = doc(db, 'campaigns', postId);
    
    try {
      // Try to update as issue first
      await updateDoc(issueRef, {
        commentsCount: increment(1)
      });
    } catch (error) {
      // If it fails, try as campaign
      try {
        await updateDoc(campaignRef, {
          commentsCount: increment(1)
        });
      } catch (campaignError) {
        console.error('Error updating comments count for post:', postId);
      }
    }

    // Update parent comment replies count if it's a reply
    if (parentCommentId) {
      await updateDoc(doc(db, 'comments', parentCommentId), {
        repliesCount: increment(1)
      });

      // Notify the parent comment author
      const parentCommentDoc = await getDoc(doc(db, 'comments', parentCommentId));
      if (parentCommentDoc.exists()) {
        const parentCommentData = parentCommentDoc.data();
        if (parentCommentData.userId !== userId) { // Don't notify if replying to own comment
          // Try to get post data from issues first, then campaigns
          let postDoc = await getDoc(doc(db, 'issues', postId));
          let postData = postDoc.exists() ? postDoc.data() : null;
          
          if (!postData) {
            postDoc = await getDoc(doc(db, 'campaigns', postId));
            postData = postDoc.exists() ? postDoc.data() : null;
          }
          
          if (postData && postData.communityId) {
            // Get commenter's name
            const userDoc = await getDoc(doc(db, 'users', userId));
            const userData = userDoc.exists() ? userDoc.data() : null;
            const commenterName = userData ? `${userData.firstName} ${userData.lastName}` : 'Someone';

            await createNotification(
              parentCommentData.userId,
              'comment_reply',
              'New Reply to Your Comment',
              `${commenterName} replied to your comment`,
              commentRef.id,
              'comment',
              postData.communityId
            );
          }
        }
      }
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

    // Update post comments count - check if it's an issue or campaign
    const issueRef = doc(db, 'issues', commentData.postId);
    const campaignRef = doc(db, 'campaigns', commentData.postId);
    
    try {
      // Try to update as issue first
      await updateDoc(issueRef, {
        commentsCount: increment(-1)
      });
    } catch (error) {
      // If it fails, try as campaign
      try {
        await updateDoc(campaignRef, {
          commentsCount: increment(-1)
        });
      } catch (campaignError) {
        console.error('Error updating comments count for post:', commentData.postId);
      }
    }

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

      // Update post likes count - check if it's an issue or campaign
      const issueRef = doc(db, 'issues', postId);
      const campaignRef = doc(db, 'campaigns', postId);
      
      try {
        // Try to update as issue first
        await updateDoc(issueRef, {
          likesCount: increment(1)
        });
      } catch (error) {
        // If it fails, try as campaign
        try {
          await updateDoc(campaignRef, {
            likesCount: increment(1)
          });
        } catch (campaignError) {
          console.error('Error updating likes count for post:', postId);
        }
      }

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

      // Update post likes count - check if it's an issue or campaign
      const issueRef = doc(db, 'issues', postId);
      const campaignRef = doc(db, 'campaigns', postId);
      
      try {
        // Try to update as issue first
        await updateDoc(issueRef, {
          likesCount: increment(-1)
        });
      } catch (error) {
        // If it fails, try as campaign
        try {
          await updateDoc(campaignRef, {
            likesCount: increment(-1)
          });
        } catch (campaignError) {
          console.error('Error updating likes count for post:', postId);
        }
      }

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

// ==================== REPORTS ====================

// Report structure reference
// {
//   target: 'community_leader' | 'super_user',
//   subject: string,
//   description: string,
//   isResolved: boolean,
//   fromUserId: string,
//   fromUserName: string,
//   communityId?: string, // required when target is community_leader
//   createdAt: Timestamp,
//   updatedAt: Timestamp
// }

export const createReport = async (reportData: {
  target: 'community_leader' | 'super_user';
  subject: string;
  description: string;
  fromUserId: string;
  fromUserName: string;
  communityId?: string | null;
}) => {
  try {
    console.log('📋 Creating report:', reportData);
    
    const payload: any = {
      target: reportData.target,
      subject: reportData.subject.trim(),
      description: reportData.description.trim(),
      isResolved: false,
      fromUserId: reportData.fromUserId,
      fromUserName: reportData.fromUserName,
      communityId: reportData.communityId || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'reports'), payload);
    console.log('✅ Report created with ID:', docRef.id);

    // Notify the appropriate person based on target
    if (reportData.target === 'community_leader' && reportData.communityId) {
      // Find the community leader for this community
      console.log('🔍 Finding community leader for:', reportData.communityId);
      
      const usersQuery = query(
        collection(db, 'users'),
        where('communityId', '==', reportData.communityId),
        where('role', '==', 'community_leader')
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        const leaderDoc = usersSnapshot.docs[0];
        console.log('✅ Found community leader:', leaderDoc.id);
        
        await createNotification(
          leaderDoc.id,
          'new_report',
          'New Report Submitted',
          `${reportData.fromUserName} submitted: ${reportData.subject}`,
          docRef.id,
          'report',
          reportData.communityId
        );
        console.log('✅ Notified community leader about report');
      } else {
        console.warn('⚠️ No community leader found for this community');
      }
    } else if (reportData.target === 'super_user') {
      // Find all super users
      console.log('🔍 Finding super users');
      
      const superUsersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'super_user')
      );
      
      const superUsersSnapshot = await getDocs(superUsersQuery);
      console.log(`✅ Found ${superUsersSnapshot.docs.length} super users`);
      
      // Notify all super users
      const notificationPromises = superUsersSnapshot.docs.map(superUserDoc =>
        createNotification(
          superUserDoc.id,
          'new_report',
          'New Report Submitted',
          `${reportData.fromUserName} submitted: ${reportData.subject}`,
          docRef.id,
          'report',
          reportData.communityId || ''
        )
      );
      
      await Promise.all(notificationPromises);
      console.log(`✅ Notified ${superUsersSnapshot.docs.length} super users about report`);
    }

    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating report:', error);
    throw error;
  }
};

export const getReportsForLeader = async (communityId: string) => {
  try {
    const q = query(
      collection(db, 'reports'),
      where('target', '==', 'community_leader'),
      where('communityId', '==', communityId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return (bTime as any) - (aTime as any);
      });
  } catch (error) {
    console.error('Error fetching leader reports:', error);
    return [];
  }
};

export const getReportsForSuperUser = async () => {
  try {
    const q = query(
      collection(db, 'reports'),
      where('target', '==', 'super_user')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return (bTime as any) - (aTime as any);
      });
  } catch (error) {
    console.error('Error fetching super user reports:', error);
    return [];
  }
};

export const getUserReports = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'reports'),
      where('fromUserId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return (bTime as any) - (aTime as any);
      });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    return [];
  }
};

export const updateReport = async (reportId: string, updates: Partial<{ subject: string; description: string; isResolved: boolean; }>) => {
  try {
    console.log('📝 Updating report:', reportId, updates);
    
    // Get the report data before updating
    const reportRef = doc(db, 'reports', reportId);
    const reportDoc = await getDoc(reportRef);
    
    if (!reportDoc.exists()) {
      throw new Error('Report not found');
    }

    const reportData = reportDoc.data();
    
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(reportRef, updateData);
    console.log('✅ Report updated');

    // If marking as resolved, notify the person who created the report
    if (updates.isResolved === true && reportData.fromUserId) {
      console.log('📢 Notifying report author about resolution:', reportData.fromUserId);
      
      try {
        await createNotification(
          reportData.fromUserId,
          'report_resolved',
          'Your Report Has Been Resolved',
          `Your report "${reportData.subject}" has been marked as resolved`,
          reportId,
          'report',
          reportData.communityId || ''
        );
        console.log('✅ Notified report author');
      } catch (notificationError) {
        console.error('⚠️ Failed to notify report author (continuing anyway):', notificationError);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error updating report:', error);
    throw error;
  }
};

export const deleteReport = async (reportId: string) => {
  try {
    await deleteDoc(doc(db, 'reports', reportId));
    return true;
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

// ==================== NOTIFICATIONS SYSTEM ====================

export interface Notification {
  id: string;
  userId: string;
  type: 'new_post' | 'new_campaign' | 'comment_reply' | 'issue_resolved' | 'new_report' | 'report_resolved' | 'transaction_rejected';
  title: string;
  message: string;
  relatedId: string;
  relatedType: 'issue' | 'campaign' | 'comment' | 'report' | 'transaction';
  communityId: string;
  isRead: boolean;
  createdAt: any;
}

export const createNotification = async (
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  relatedId: string,
  relatedType: Notification['relatedType'],
  communityId: string
) => {
  try {
    console.log('📝 Creating notification:', { userId, type, title, message });
    
    const notificationData = {
      userId,
      type,
      title,
      message,
      relatedId,
      relatedType,
      communityId,
      isRead: false,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    console.log('✅ Notification created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    console.error('Notification data was:', { userId, type, title, message, relatedId, relatedType, communityId });
    throw error;
  }
};

export const getUserNotifications = async (userId: string, limitCount: number = 20): Promise<Notification[]> => {
  try {
    console.log('📥 Fetching notifications for user:', userId);
    
    // Use simple query without orderBy to avoid index requirement
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    console.log(`✅ Found ${snapshot.docs.length} notifications`);
    
    const notifications = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Notification[];

    // Sort in memory
    return notifications.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return bTime.getTime() - aTime.getTime();
    }).slice(0, limitCount);
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return [];
  }
};

export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void, limitCount: number = 20) => {
  console.log('🔔 Setting up real-time notification subscription for user:', userId);
  
  // Use simple query without orderBy to avoid index requirement
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    console.log(`📬 Received ${snapshot.docs.length} notifications via subscription`);
    const notifications = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Notification[];
    
    // Sort in memory
    const sorted = notifications.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return bTime.getTime() - aTime.getTime();
    }).slice(0, limitCount);
    
    callback(sorted);
  }, (error) => {
    console.error('❌ Subscription error:', error);
    callback([]);
  });
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true
    });
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { isRead: true })
    );

    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

export const subscribeToUnreadCount = (userId: string, callback: (count: number) => void) => {
  console.log('🔔 Setting up unread count subscription for user:', userId);
  
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );

  return onSnapshot(q, (snapshot) => {
    console.log(`📊 Unread count: ${snapshot.size}`);
    callback(snapshot.size);
  }, (error) => {
    console.error('❌ Error in unread count subscription:', error);
    callback(0);
  });
};

// Helper function to notify all community members
const notifyAllCommunityMembers = async (
  communityId: string,
  type: Notification['type'],
  title: string,
  message: string,
  relatedId: string,
  relatedType: Notification['relatedType'],
  excludeUserId?: string
) => {
  try {
    console.log('📢 Starting notification to community:', communityId);
    
    // Get all users in the community
    const usersQuery = query(
      collection(db, 'users'),
      where('communityId', '==', communityId)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    console.log(`👥 Found ${usersSnapshot.docs.length} users in community`);
    
    // Filter out the author
    const usersToNotify = usersSnapshot.docs.filter(userDoc => userDoc.id !== excludeUserId);
    console.log(`📧 Will notify ${usersToNotify.length} users (excluding author)`);
    
    // Create notifications for each user (except the one who created the post)
    const notificationPromises = usersToNotify.map(userDoc => {
      console.log(`📨 Creating notification for user: ${userDoc.id}`);
      return createNotification(
        userDoc.id,
        type,
        title,
        message,
        relatedId,
        relatedType,
        communityId
      );
    });

    const results = await Promise.all(notificationPromises);
    console.log(`✅ Created ${results.length} notifications successfully`);
  } catch (error) {
    console.error('❌ Error notifying community members:', error);
    throw error;
  }
};

// Update createIssue to send notifications
export const createIssueWithNotification = async (issueData: any) => {
  try {
    console.log('🔵 Creating issue with notification:', issueData);
    
    const docRef = await addDoc(collection(db, 'issues'), {
      ...issueData,
      createdAt: Timestamp.now(),
      likesCount: 0,
      commentsCount: 0,
      status: 'pending'
    });

    console.log('✅ Issue created with ID:', docRef.id);

    // Track on author document
    if (issueData.authorId) {
      await updateDoc(doc(db, 'users', issueData.authorId), {
        issuesPosted: arrayUnion(docRef.id),
      });
      console.log('✅ Updated author document');
    }

    // Notify all community members
    if (issueData.communityId && issueData.authorId) {
      console.log('📢 Notifying community members:', issueData.communityId);
      try {
        await notifyAllCommunityMembers(
          issueData.communityId,
          'new_post',
          'New Issue in Your Community',
          `${issueData.title}`,
          docRef.id,
          'issue',
          issueData.authorId
        );
        console.log('✅ Notifications sent successfully');
      } catch (notificationError) {
        console.error('⚠️ Failed to send notifications (continuing anyway):', notificationError);
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating issue:', error);
    throw error;
  }
};

// Update createCampaign to send notifications
export const createCampaignWithNotification = async (campaignData: any) => {
  try {
    console.log('🔵 Creating campaign with notification:', campaignData);
    
    const docRef = await addDoc(collection(db, 'campaigns'), {
      ...campaignData,
      createdAt: Timestamp.now(),
      raised: 0,
      isActive: true,
      likesCount: 0,
      commentsCount: 0
    });

    console.log('✅ Campaign created with ID:', docRef.id);

    // Track on author document
    if (campaignData.authorId) {
      await updateDoc(doc(db, 'users', campaignData.authorId), {
        campaignsPosted: arrayUnion(docRef.id),
      });
      console.log('✅ Updated author document');
    }

    // Notify all community members
    if (campaignData.communityId && campaignData.authorId) {
      console.log('📢 Notifying community members:', campaignData.communityId);
      try {
        await notifyAllCommunityMembers(
          campaignData.communityId,
          'new_campaign',
          'New Fundraising Campaign',
          `${campaignData.title}`,
          docRef.id,
          'campaign',
          campaignData.authorId
        );
        console.log('✅ Notifications sent successfully');
      } catch (notificationError) {
        console.error('⚠️ Failed to send notifications (continuing anyway):', notificationError);
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating campaign:', error);
    throw error;
  }
};

// Resolve issue and notify author
export const resolveIssue = async (issueId: string) => {
  try {
    const issueRef = doc(db, 'issues', issueId);
    const issueDoc = await getDoc(issueRef);
    
    if (!issueDoc.exists()) {
      throw new Error('Issue not found');
    }

    const issueData = issueDoc.data();

    // Update issue status
    await updateDoc(issueRef, {
      status: 'resolved',
      resolvedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Notify the issue author
    if (issueData.authorId && issueData.communityId) {
      await createNotification(
        issueData.authorId,
        'issue_resolved',
        'Your Issue Has Been Resolved',
        `${issueData.title} has been marked as resolved`,
        issueId,
        'issue',
        issueData.communityId
      );
    }

    // Also notify users who commented on the issue
    const commentsQuery = query(
      collection(db, 'comments'),
      where('postId', '==', issueId)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    
    const uniqueCommenters = new Set<string>();
    commentsSnapshot.docs.forEach(commentDoc => {
      const commentData = commentDoc.data();
      if (commentData.userId && commentData.userId !== issueData.authorId) {
        uniqueCommenters.add(commentData.userId);
      }
    });

    // Notify all commenters
    const notificationPromises = Array.from(uniqueCommenters).map(userId =>
      createNotification(
        userId,
        'issue_resolved',
        'Issue You Commented On Was Resolved',
        `${issueData.title} has been marked as resolved`,
        issueId,
        'issue',
        issueData.communityId
      )
    );

    await Promise.all(notificationPromises);

    return true;
  } catch (error) {
    console.error('Error resolving issue:', error);
    throw error;
  }
};

// ==================== ADMIN ANALYTICS ====================

export const getAdminPostEngagement = async (communityId: string, adminId: string, limitCount: number = 5) => {
  try {
    // Get admin's recent issues (no orderBy to avoid index)
    const issuesQuery = query(
      collection(db, 'issues'),
      where('communityId', '==', communityId),
      where('authorId', '==', adminId)
    );

    const issuesSnapshot = await getDocs(issuesQuery);
    const issues = issuesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: 'issue'
    }));

    // Get admin's recent campaigns (no orderBy to avoid index)
    const campaignsQuery = query(
      collection(db, 'campaigns'),
      where('communityId', '==', communityId),
      where('authorId', '==', adminId)
    );

    const campaignsSnapshot = await getDocs(campaignsQuery);
    const campaigns = campaignsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: 'campaign'
    }));

    // Combine and sort by date in memory
    const allPosts = [...issues, ...campaigns].sort((a: any, b: any) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return bTime.getTime() - aTime.getTime();
    }).slice(0, limitCount);

    return allPosts;
  } catch (error) {
    console.error('Error fetching admin post engagement:', error);
    return [];
  }
};

export const getTrendingPosts = async (communityId: string, limitCount: number = 10, daysAgo: number = 7) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    // Get recent issues
    const issuesQuery = query(
      collection(db, 'issues'),
      where('communityId', '==', communityId)
    );

    const issuesSnapshot = await getDocs(issuesQuery);
    const issues = issuesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'issue'
      }))
      .filter((issue: any) => {
        const issueDate = issue.createdAt?.toDate?.() || new Date(issue.createdAt);
        return issueDate >= cutoffDate;
      });

    // Get recent campaigns
    const campaignsQuery = query(
      collection(db, 'campaigns'),
      where('communityId', '==', communityId)
    );

    const campaignsSnapshot = await getDocs(campaignsQuery);
    const campaigns = campaignsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'campaign'
      }))
      .filter((campaign: any) => {
        const campaignDate = campaign.createdAt?.toDate?.() || new Date(campaign.createdAt);
        return campaignDate >= cutoffDate;
      });

    // Combine and sort by engagement (likes + comments)
    const allPosts = [...issues, ...campaigns].map((post: any) => ({
      ...post,
      engagement: (post.likesCount || 0) + (post.commentsCount || 0)
    })).sort((a, b) => b.engagement - a.engagement).slice(0, limitCount);

    return allPosts;
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return [];
  }
};

export const getCampaignProgress = async (communityId: string) => {
  try {
    const campaignsQuery = query(
      collection(db, 'campaigns'),
      where('communityId', '==', communityId),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(campaignsQuery);
    const campaigns = snapshot.docs.map(doc => {
      const data = doc.data();
      const progress = ((data.raised || 0) / (data.goal || 1)) * 100;
      return {
        id: doc.id,
        ...data,
        progress: Math.min(progress, 100)
      };
    });

    // Sort by progress (highest first)
    return campaigns.sort((a: any, b: any) => b.progress - a.progress);
  } catch (error) {
    console.error('Error fetching campaign progress:', error);
    return [];
  }
};

export const getPendingIssues = async (communityId: string) => {
  try {
    const issuesQuery = query(
      collection(db, 'issues'),
      where('communityId', '==', communityId),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(issuesQuery);
    const issues = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      urgency: (doc.data().likesCount || 0) + (doc.data().commentsCount || 0)
    }));

    // Sort by urgency (likes + comments)
    return issues.sort((a: any, b: any) => b.urgency - a.urgency);
  } catch (error) {
    console.error('Error fetching pending issues:', error);
    return [];
  }
};

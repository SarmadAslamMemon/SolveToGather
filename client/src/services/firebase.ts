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
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

// Issues
export const getIssues = async (communityId?: string) => {
  try {
    let q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));
    
    if (communityId) {
      q = query(collection(db, 'issues'), where('communityId', '==', communityId), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    let q = query(
      collection(db, 'campaigns'), 
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    if (communityId) {
      q = query(
        collection(db, 'campaigns'), 
        where('communityId', '==', communityId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    return docRef.id;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

// Donations
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

// File Upload
export const uploadFile = async (file: File, path: string) => {
  try {
    const fileRef = ref(storage, path);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Real-time subscriptions
export const subscribeToIssues = (callback: (issues: any[]) => void, communityId?: string) => {
  let q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));
  
  if (communityId) {
    q = query(collection(db, 'issues'), where('communityId', '==', communityId), orderBy('createdAt', 'desc'));
  }

  return onSnapshot(q, (snapshot) => {
    const issues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(issues);
  });
};

export const subscribeToCampaigns = (callback: (campaigns: any[]) => void, communityId?: string) => {
  let q = query(
    collection(db, 'campaigns'), 
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  
  if (communityId) {
    q = query(
      collection(db, 'campaigns'), 
      where('communityId', '==', communityId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
  }

  return onSnapshot(q, (snapshot) => {
    const campaigns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(campaigns);
  });
};

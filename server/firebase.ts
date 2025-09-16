import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, getDoc, query, where, limit, setDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDhQZhmelEU5SeV4trChALR_ei0TyCkpFo",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "savetogather-19574.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "savetogather-19574",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "savetogather-19574.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "986993003813",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:986993003813:web:7b4dc10bffb0d8e26ddecc",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-WM7FRZ6XC4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Firebase Firestore Collections
export const COLLECTIONS = {
  USERS: 'users',
  COMMUNITIES: 'communities',
  ISSUES: 'issues',
  CAMPAIGNS: 'campaigns',
  DONATIONS: 'donations',
  LIKES: 'likes',
  COMMENTS: 'comments',
  SYSTEM: 'system',
} as const;

// Database Schema Types
export interface FirebaseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  nic: string;
  phoneNumber: string;
  role: 'super_user' | 'community_leader' | 'normal_user';
  communityId?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirebaseCommunity {
  id: string;
  name: string;
  description?: string;
  location?: string;
  leaderId?: string;
  memberCount: number;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirebaseIssue {
  id: string;
  title: string;
  description: string;
  image?: string;
  likes: number;
  comments: number;
  communityId: string;
  authorId: string;
  status: 'pending' | 'in-progress' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

export interface FirebaseCampaign {
  id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  image?: string;
  daysLeft: number;
  communityId: string;
  authorId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirebaseDonation {
  id: string;
  campaignId: string;
  donorId?: string;
  amount: number;
  paymentMethod: 'jazzcash' | 'easypaisa' | 'bank';
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirebaseLike {
  id: string;
  issueId: string;
  userId: string;
  createdAt: Date;
}

export interface FirebaseComment {
  id: string;
  issueId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Database initialization function
export async function initializeDatabase() {
  try {
    console.log('Initializing Firebase database...');
    
    // Check if database has any data by looking at communities collection
    const communitiesRef = collection(db, COLLECTIONS.COMMUNITIES);
    const communitiesSnapshot = await getDocs(communitiesRef);
    
    if (communitiesSnapshot.empty) {
      console.log('Database is empty, collections will be created when first documents are added');
    } else {
      console.log(`Database initialized - found ${communitiesSnapshot.size} communities`);
    }
    
    console.log('Firebase database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Sample data for testing
export const sampleData = {
  communities: [
    {
      id: 'gulshan',
      name: 'Gulshan-e-Iqbal',
      description: 'A vibrant community in Karachi',
      location: 'Karachi, Pakistan',
      memberCount: 1247,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'korangi',
      name: 'Korangi',
      description: 'Industrial area community',
      location: 'Karachi, Pakistan',
      memberCount: 892,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'orangi',
      name: 'Orangi Town',
      description: 'Largest slum area in Asia',
      location: 'Karachi, Pakistan',
      memberCount: 567,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  
  users: [
    {
      email: 'yasir@gmail.com',
      firstName: 'Yasir',
      lastName: 'Admin',
      address: 'Karachi, Pakistan',
      nic: '12345-1234567-1',
      phoneNumber: '+92-300-1234567',
      role: 'super_user' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      email: 'ahmed@example.com',
      firstName: 'Ahmed',
      lastName: 'Khan',
      address: 'Gulshan-e-Iqbal, Karachi',
      nic: '12345-1234567-2',
      phoneNumber: '+92-300-1234568',
      role: 'community_leader' as const,
      communityId: 'gulshan',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      email: 'fatima@example.com',
      firstName: 'Fatima',
      lastName: 'Ali',
      address: 'Korangi, Karachi',
      nic: '12345-1234567-3',
      phoneNumber: '+92-300-1234569',
      role: 'community_leader' as const,
      communityId: 'korangi',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      email: 'hassan@example.com',
      firstName: 'Hassan',
      lastName: 'Ahmed',
      address: 'Orangi Town, Karachi',
      nic: '12345-1234567-4',
      phoneNumber: '+92-300-1234570',
      role: 'community_leader' as const,
      communityId: 'orangi',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Normal users for testing
    {
      email: 'sara@example.com',
      firstName: 'Sara',
      lastName: 'Khan',
      address: 'Gulshan-e-Iqbal, Karachi',
      nic: '12345-1234567-5',
      phoneNumber: '+92-300-1234571',
      role: 'normal_user' as const,
      communityId: 'gulshan',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      email: 'ali@example.com',
      firstName: 'Ali',
      lastName: 'Hassan',
      address: 'Korangi, Karachi',
      nic: '12345-1234567-6',
      phoneNumber: '+92-300-1234572',
      role: 'normal_user' as const,
      communityId: 'korangi',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      email: 'amina@example.com',
      firstName: 'Amina',
      lastName: 'Malik',
      address: 'Orangi Town, Karachi',
      nic: '12345-1234567-7',
      phoneNumber: '+92-300-1234573',
      role: 'normal_user' as const,
      communityId: 'orangi',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  
  issues: [
    // Gulshan-e-Iqbal Community Issues
    {
      title: 'Street Lighting Problem in Block 6',
      description: 'Several street lights in Block 6 have been non-functional for over a month, making it unsafe for residents to walk at night. This is particularly concerning for women and children.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      likes: 23,
      comments: 8,
      communityId: 'gulshan',
      authorId: 'ahmed-khan',
      status: 'pending' as const,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Garbage Collection Delays',
      description: 'Garbage collection has been inconsistent in our area for the past two weeks. Piles of garbage are accumulating, creating health hazards and unpleasant odors.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      likes: 45,
      comments: 12,
      communityId: 'gulshan',
      authorId: 'ahmed-khan',
      status: 'in-progress' as const,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      title: 'Water Supply Shortage',
      description: 'Residents in Block 2 and 3 are experiencing severe water shortage. Water pressure is extremely low, and many households are without water for hours.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      likes: 67,
      comments: 19,
      communityId: 'gulshan',
      authorId: 'ahmed-khan',
      status: 'pending' as const,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    
    // Korangi Community Issues
    {
      title: 'Industrial Pollution Concerns',
      description: 'Local factories are releasing harmful emissions that are affecting air quality in residential areas. Residents are experiencing respiratory problems.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      likes: 89,
      comments: 25,
      communityId: 'korangi',
      authorId: 'fatima-ali',
      status: 'in-progress' as const,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      title: 'Road Repair Needed - Sector 31',
      description: 'The main road in Sector 31 has multiple potholes and damaged sections. This is causing traffic congestion and vehicle damage.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      likes: 34,
      comments: 7,
      communityId: 'korangi',
      authorId: 'fatima-ali',
      status: 'pending' as const,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Sewage System Overflow',
      description: 'Sewage system in Sector 25 is overflowing, creating health hazards and unpleasant conditions for residents. Immediate action is required.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      likes: 56,
      comments: 15,
      communityId: 'korangi',
      authorId: 'fatima-ali',
      status: 'resolved' as const,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    
    // Orangi Town Community Issues
    {
      title: 'Lack of Proper Drainage System',
      description: 'During monsoon season, water accumulates in streets and homes due to inadequate drainage. This causes property damage and health risks.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      likes: 78,
      comments: 22,
      communityId: 'orangi',
      authorId: 'hassan-ahmed',
      status: 'pending' as const,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Electricity Load Shedding Issues',
      description: 'Frequent power outages lasting 8-10 hours daily are affecting daily life, especially for students and small businesses.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      likes: 92,
      comments: 28,
      communityId: 'orangi',
      authorId: 'hassan-ahmed',
      status: 'in-progress' as const,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      title: 'Access to Clean Drinking Water',
      description: 'Many households in Orangi Town do not have access to clean drinking water. Residents are forced to buy expensive bottled water.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      likes: 101,
      comments: 31,
      communityId: 'orangi',
      authorId: 'hassan-ahmed',
      status: 'pending' as const,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
      updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    },
  ],
};

// Function to check if database has been seeded
async function isDatabaseSeeded(): Promise<boolean> {
  try {
    // Check for a seeding status document
    const seedingStatusRef = doc(db, COLLECTIONS.SYSTEM, 'seeding-status');
    const seedingStatusDoc = await getDoc(seedingStatusRef);
    
    if (seedingStatusDoc.exists()) {
      const status = seedingStatusDoc.data();
      return status?.seeded === true && status?.version === '1.0';
    }
    
    // Fallback: check if collections have data
    const communitiesSnapshot = await getDocs(collection(db, COLLECTIONS.COMMUNITIES));
    const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    const issuesSnapshot = await getDocs(collection(db, COLLECTIONS.ISSUES));
    
    return !communitiesSnapshot.empty || !usersSnapshot.empty || !issuesSnapshot.empty;
  } catch (error) {
    console.error('❌ Error checking seeding status:', error);
    return false;
  }
}

// Function to mark database as seeded
async function markDatabaseAsSeeded(): Promise<void> {
  try {
    const seedingStatusRef = doc(db, COLLECTIONS.SYSTEM, 'seeding-status');
    await setDoc(seedingStatusRef, {
      seeded: true,
      version: '1.0',
      seededAt: new Date().toISOString(),
      timestamp: Date.now()
    });
    console.log('✅ Database marked as seeded');
  } catch (error) {
    console.error('❌ Error marking database as seeded:', error);
  }
}

// Function to seed the database with sample data
export async function seedDatabase() {
  console.log('🌱 Checking if database needs seeding...');
  
  try {
    // Check if database has already been seeded
    const alreadySeeded = await isDatabaseSeeded();
    
    if (alreadySeeded) {
      console.log('✅ Database already seeded, skipping...');
      return;
    }
    
    console.log('🌱 Seeding database with sample data...');
    
    // Add sample communities with specific IDs
    for (const community of sampleData.communities) {
      await setDoc(doc(db, COLLECTIONS.COMMUNITIES, community.id), {
        ...community,
      });
      console.log(`✅ Added community: ${community.name} with ID: ${community.id}`);
    }
    
    // Add sample users
    for (const user of sampleData.users) {
      const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
        ...user,
      });
      console.log(`✅ Added user: ${user.email} with ID: ${docRef.id}`);
    }
    
    // Add sample issues
    for (const issue of sampleData.issues) {
      const docRef = await addDoc(collection(db, COLLECTIONS.ISSUES), {
        ...issue,
      });
      console.log(`✅ Added issue: ${issue.title} with ID: ${docRef.id}`);
    }
    
    // Mark database as seeded
    await markDatabaseAsSeeded();
    
    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

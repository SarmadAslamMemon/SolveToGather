import { initializeApp, applicationDefault, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
function initializeAdmin() {
  if (getApps().length > 0) return getApp();

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'savetogather-19574';

  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const svcJsonB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  try {
    if (svcJson || svcJsonB64) {
      const jsonStr = svcJson || Buffer.from(svcJsonB64 as string, 'base64').toString('utf8');
      const credentials = JSON.parse(jsonStr);
      return initializeApp({
        credential: cert(credentials),
        projectId,
      });
    }

    // Try to load from local serviceAccount.json file
    const localServiceAccountPath = join(__dirname, 'secrets', 'serviceAccount.json');
    if (existsSync(localServiceAccountPath)) {
      console.log('Loading service account from local file:', localServiceAccountPath);
      const serviceAccountJson = readFileSync(localServiceAccountPath, 'utf8');
      const credentials = JSON.parse(serviceAccountJson);
      return initializeApp({
        credential: cert(credentials),
        projectId,
      });
    }

    // Fallback to ADC (gcloud/emulator)
    return initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  } catch (e) {
    console.error('Error initializing Firebase Admin:', e);
    // Final fallback for emulator without creds
    return initializeApp({ projectId });
  }
}

initializeAdmin();
export const db = getFirestore();

// Firebase Firestore Collections
export const COLLECTIONS = {
  USERS: 'users',
  COMMUNITIES: 'communities',
  ISSUES: 'issues',
  CAMPAIGNS: 'campaigns',
  DONATIONS: 'donations',
  LIKES: 'likes',
  COMMENTS: 'comments',
  NOTIFICATIONS: 'notifications',
  SYSTEM: 'system',
  REPORTS: 'reports',
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
    const communitiesSnapshot = await db.collection(COLLECTIONS.COMMUNITIES).limit(1).get();
    if (communitiesSnapshot.empty) {
      console.log('Database is empty, collections will be created when first documents are added');
    } else {
      console.log(`Database initialized - found ${communitiesSnapshot.size} communities (sample)`);
    }
    
    console.log('Firebase database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    // With Admin SDK, this should rarely fail; continue without crashing
  }
}

// Sample data for testing
export const sampleData: {
  communities: any[];
  users: any[];
  issues: any[];
} = {
  communities: [
    // No static communities - super admin will create communities as needed
  ],
  
  users: [
    // No static users - they will register through the application
  ],
  
  issues: [
    // No static issues - users will create issues through the application
  ],
};

// Function to check if database has been seeded
async function isDatabaseSeeded(): Promise<boolean> {
  try {
    // Check for a seeding status document
    const seedingStatusRef = db.collection(COLLECTIONS.SYSTEM).doc('seeding-status');
    const seedingStatusDoc = await seedingStatusRef.get();
    if (seedingStatusDoc.exists) {
      const status = seedingStatusDoc.data();
      return status?.seeded === true && status?.version === '1.0';
    }
    
    // Fallback: check if collections have data
    const communitiesSnapshot = await db.collection(COLLECTIONS.COMMUNITIES).limit(1).get();
    const usersSnapshot = await db.collection(COLLECTIONS.USERS).limit(1).get();
    const issuesSnapshot = await db.collection(COLLECTIONS.ISSUES).limit(1).get();
    
    return !communitiesSnapshot.empty || !usersSnapshot.empty || !issuesSnapshot.empty;
  } catch (error) {
    console.error('❌ Error checking seeding status:', error);
    return false;
  }
}

// Function to mark database as seeded
async function markDatabaseAsSeeded(): Promise<void> {
  try {
    const seedingStatusRef = db.collection(COLLECTIONS.SYSTEM).doc('seeding-status');
    await seedingStatusRef.set({
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
    if (sampleData.communities.length > 0) {
    for (const community of sampleData.communities) {
      await db.collection(COLLECTIONS.COMMUNITIES).doc(community.id).set({
        ...community,
      });
      console.log(`✅ Added community: ${community.name} with ID: ${community.id}`);
      }
    } else {
      console.log('ℹ️  No sample communities to seed');
    }
    
    // Add sample users
    if (sampleData.users.length > 0) {
    for (const user of sampleData.users) {
      const docRef = await db.collection(COLLECTIONS.USERS).add({
        ...user,
      });
      console.log(`✅ Added user: ${user.email} with ID: ${docRef.id}`);
      }
    } else {
      console.log('ℹ️  No sample users to seed');
    }
    
    // Add sample issues
    if (sampleData.issues.length > 0) {
    for (const issue of sampleData.issues) {
      const docRef = await db.collection(COLLECTIONS.ISSUES).add({
        ...issue,
      });
      console.log(`✅ Added issue: ${issue.title} with ID: ${docRef.id}`);
      }
    } else {
      console.log('ℹ️  No sample issues to seed');
    }
    
    // Mark database as seeded
    await markDatabaseAsSeeded();
    
    console.log('🎉 Database seeding completed - ready for use!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    // With Admin SDK, this should not be due to rules; continue without crashing
  }
}

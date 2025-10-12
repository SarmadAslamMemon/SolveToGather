import { type Community, type InsertCommunity, type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";
import { db, COLLECTIONS } from "./firebase";
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, getDoc, query, where, limit, setDoc } from 'firebase/firestore';
import type { FirebaseUser, FirebaseCommunity } from "./firebase";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Community operations
  getCommunity(id: string): Promise<Community | undefined>;
  getAllCommunities(): Promise<Community[]>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  updateCommunity(id: string, updates: Partial<Community>): Promise<Community>;
  deleteCommunity(id: string): Promise<void>;
  assignLeaderToCommunity(communityId: string, leaderId: string): Promise<void>;
  removeLeaderFromCommunity(communityId: string): Promise<void>;
}

export class FirebaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const docRef = db.collection(COLLECTIONS.USERS).doc(id);
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        const data = docSnap.data() as FirebaseUser;
        return {
          id: docSnap.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          address: data.address,
          nic: data.nic,
          phoneNumber: data.phoneNumber,
          role: data.role,
          communityId: (data as any).communityId || null,
          profileImage: (data as any).profileImage || null,
          createdAt: data.createdAt,
        };
      }
      return undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const snapshot = await db.collection(COLLECTIONS.USERS)
        .where('email', '==', username)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data() as FirebaseUser;
        return {
          id: docSnap.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          address: data.address,
          nic: data.nic,
          phoneNumber: data.phoneNumber,
          role: data.role,
          communityId: (data as any).communityId || null,
          profileImage: (data as any).profileImage || null,
          createdAt: data.createdAt,
        };
      }
      return undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const snapshot = await db.collection(COLLECTIONS.USERS).get();
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data() as FirebaseUser;
        return {
          id: docSnap.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          address: data.address,
          nic: data.nic,
          phoneNumber: data.phoneNumber,
          role: data.role,
          communityId: (data as any).communityId || null,
          profileImage: (data as any).profileImage || null,
          createdAt: data.createdAt,
        };
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const id = randomUUID();
      const now = new Date();
      const user: FirebaseUser = {
        ...insertUser,
        id,
        createdAt: now,
        updatedAt: now,
      } as any;
      
      const docRef = await db.collection(COLLECTIONS.USERS).add(user as any);
      
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        nic: user.nic,
        phoneNumber: user.phoneNumber,
        role: user.role,
        communityId: (user as any).communityId || null,
        profileImage: (user as any).profileImage || null,
        createdAt: user.createdAt,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const docRef = db.collection(COLLECTIONS.USERS).doc(id);
      
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      } as any;
      
      await docRef.update(updateData);
      
      const updatedDoc = await docRef.get();
      if (!updatedDoc.exists) {
        throw new Error('User not found after update');
      }
      
      const data = updatedDoc.data() as FirebaseUser;
      return {
        id: updatedDoc.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        address: data.address,
        nic: data.nic,
        phoneNumber: data.phoneNumber,
        role: data.role,
        communityId: (data as any).communityId || null,
        profileImage: (data as any).profileImage || null,
        createdAt: data.createdAt,
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Community operations
  async getCommunity(id: string): Promise<Community | undefined> {
    try {
      const docRef = db.collection(COLLECTIONS.COMMUNITIES).doc(id);
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        const data = docSnap.data() as FirebaseCommunity;
        // Use document ID as the source of truth, but prefer data.id if it exists
        const communityId = data.id || docSnap.id;
        return {
          id: communityId,
          name: data.name,
          description: (data as any).description || null,
          location: (data as any).location || null,
          leaderId: (data as any).leaderId || null,
          memberCount: data.memberCount,
          createdAt: data.createdAt,
        };
      }
      return undefined;
    } catch (error) {
      console.error('Error getting community:', error);
      return undefined;
    }
  }

  async getAllCommunities(): Promise<Community[]> {
    try {
      const snapshot = await db.collection(COLLECTIONS.COMMUNITIES).get();
      const communities = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as FirebaseCommunity;
        // Use document ID as the source of truth, but prefer data.id if it exists
        const communityId = data.id || docSnap.id;
        return {
          id: communityId,
          name: data.name,
          description: (data as any).description || null,
          location: (data as any).location || null,
          leaderId: (data as any).leaderId || null,
          memberCount: data.memberCount,
          createdAt: data.createdAt,
        };
      });
      console.log(`✅ Fetched ${communities.length} communities from Firestore`);
      return communities;
    } catch (error) {
      console.error('❌ Error getting all communities:', error);
      return [];
    }
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    try {
      const now = new Date();
      const customId = community.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      
      const newCommunity: FirebaseCommunity = {
        ...community,
        id: customId,
        memberCount: 0,
        createdAt: now,
        updatedAt: now,
      } as any;
      
      await db.collection(COLLECTIONS.COMMUNITIES).doc(customId).set(newCommunity as any);
      
      return {
        id: newCommunity.id,
        name: newCommunity.name,
        description: (newCommunity as any).description || null,
        location: (newCommunity as any).location || null,
        leaderId: (newCommunity as any).leaderId || null,
        memberCount: newCommunity.memberCount,
        createdAt: newCommunity.createdAt,
      };
    } catch (error) {
      console.error('Error creating community:', error);
      throw error;
    }
  }

  async updateCommunity(id: string, updates: Partial<Community>): Promise<Community> {
    try {
      const docRef = db.collection(COLLECTIONS.COMMUNITIES).doc(id);
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      } as any;
      
      await docRef.update(updateData);
      
      const updatedDoc = await docRef.get();
      if (updatedDoc.exists) {
        const data = updatedDoc.data() as FirebaseCommunity;
        return {
          id: data.id,
          name: data.name,
          description: (data as any).description || null,
          location: (data as any).location || null,
          leaderId: (data as any).leaderId || null,
          memberCount: (data as any).memberCount ?? null,
          createdAt: (data as any).createdAt ?? null,
        } as Community;
      }
      throw new Error('Community not found');
    } catch (error) {
      console.error('Error updating community:', error);
      throw error;
    }
  }

  async deleteCommunity(id: string): Promise<void> {
    try {
      await db.collection(COLLECTIONS.COMMUNITIES).doc(id).delete();
    } catch (error) {
      console.error('Error deleting community:', error);
      throw error;
    }
  }

  async assignLeaderToCommunity(communityId: string, leaderId: string): Promise<void> {
    try {
      await db.collection(COLLECTIONS.COMMUNITIES).doc(communityId).update({
        leaderId,
        updatedAt: new Date(),
      } as any);
    } catch (error) {
      console.error('Error assigning leader to community:', error);
      throw error;
    }
  }

  async removeLeaderFromCommunity(communityId: string): Promise<void> {
    try {
      await db.collection(COLLECTIONS.COMMUNITIES).doc(communityId).update({
        leaderId: null,
        updatedAt: new Date(),
      } as any);
    } catch (error) {
      console.error('Error removing leader from community:', error);
      throw error;
    }
  }
}

export const storage = new FirebaseStorage();

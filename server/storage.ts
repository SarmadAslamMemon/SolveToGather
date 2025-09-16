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
      const docRef = doc(db, COLLECTIONS.USERS, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as FirebaseUser;
        return {
          id: docSnap.id, // Use document ID from Firestore
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          address: data.address,
          nic: data.nic,
          phoneNumber: data.phoneNumber,
          role: data.role,
          communityId: data.communityId || null,
          profileImage: data.profileImage || null,
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
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where('email', '==', username),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data() as FirebaseUser;
        return {
          id: docSnap.id, // Use document ID from Firestore
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          address: data.address,
          nic: data.nic,
          phoneNumber: data.phoneNumber,
          role: data.role,
          communityId: data.communityId || null,
          profileImage: data.profileImage || null,
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
      const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data() as FirebaseUser;
        return {
          id: docSnap.id, // Use document ID from Firestore
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          address: data.address,
          nic: data.nic,
          phoneNumber: data.phoneNumber,
          role: data.role,
          communityId: data.communityId || null,
          profileImage: data.profileImage || null,
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
      };
      
      const docRef = await addDoc(collection(db, COLLECTIONS.USERS), user);
      
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        nic: user.nic,
        phoneNumber: user.phoneNumber,
        role: user.role,
        communityId: user.communityId || null,
        profileImage: user.profileImage || null,
        createdAt: user.createdAt,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, id);
      
      // Prepare update data with updatedAt timestamp
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };
      
      await updateDoc(docRef, updateData);
      
      // Get the updated user data
      const updatedDoc = await getDoc(docRef);
      if (!updatedDoc.exists()) {
        throw new Error('User not found after update');
      }
      
      const data = updatedDoc.data() as FirebaseUser;
      return {
        id: updatedDoc.id, // Use document ID from Firestore
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        address: data.address,
        nic: data.nic,
        phoneNumber: data.phoneNumber,
        role: data.role,
        communityId: data.communityId || null,
        profileImage: data.profileImage || null,
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
      const docRef = doc(db, COLLECTIONS.COMMUNITIES, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as FirebaseCommunity;
        return {
          id: data.id,
          name: data.name,
          description: data.description || null,
          location: data.location || null,
          leaderId: data.leaderId || null,
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
      const snapshot = await getDocs(collection(db, COLLECTIONS.COMMUNITIES));
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data() as FirebaseCommunity;
        return {
          id: data.id,
          name: data.name,
          description: data.description || null,
          location: data.location || null,
          leaderId: data.leaderId || null,
          memberCount: data.memberCount,
          createdAt: data.createdAt,
        };
      });
    } catch (error) {
      console.error('Error getting all communities:', error);
      return [];
    }
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    try {
      const now = new Date();
      
      // Generate a custom ID based on the community name (like the seeded data)
      const customId = community.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      
      const newCommunity: FirebaseCommunity = {
        ...community,
        id: customId,
        memberCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      
      // Use setDoc with custom ID instead of addDoc with random ID
      const docRef = doc(db, COLLECTIONS.COMMUNITIES, customId);
      await setDoc(docRef, newCommunity);
      
      return {
        id: newCommunity.id,
        name: newCommunity.name,
        description: newCommunity.description || null,
        location: newCommunity.location || null,
        leaderId: newCommunity.leaderId || null,
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
      const docRef = doc(db, COLLECTIONS.COMMUNITIES, id);
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };
      
      await updateDoc(docRef, updateData);
      
      const updatedDoc = await getDoc(docRef);
      if (updatedDoc.exists()) {
        const data = updatedDoc.data() as FirebaseCommunity;
        return {
          id: data.id,
          name: data.name,
          leaderId: data.leaderId || null,
          memberCount: data.memberCount,
          createdAt: data.createdAt,
        };
      }
      throw new Error('Community not found');
    } catch (error) {
      console.error('Error updating community:', error);
      throw error;
    }
  }

  async deleteCommunity(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.COMMUNITIES, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting community:', error);
      throw error;
    }
  }

  async assignLeaderToCommunity(communityId: string, leaderId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.COMMUNITIES, communityId);
      await updateDoc(docRef, {
        leaderId: leaderId,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error assigning leader to community:', error);
      throw error;
    }
  }

  async removeLeaderFromCommunity(communityId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.COMMUNITIES, communityId);
      await updateDoc(docRef, {
        leaderId: null,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error removing leader from community:', error);
      throw error;
    }
  }
}

export const storage = new FirebaseStorage();

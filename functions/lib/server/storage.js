import { randomUUID } from "crypto";
import { db, COLLECTIONS } from "./firebase";
export class FirebaseStorage {
    // User operations
    async getUser(id) {
        try {
            const docRef = db.collection(COLLECTIONS.USERS).doc(id);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
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
        }
        catch (error) {
            console.error('Error getting user:', error);
            return undefined;
        }
    }
    async getUserByUsername(username) {
        try {
            const snapshot = await db.collection(COLLECTIONS.USERS)
                .where('email', '==', username)
                .limit(1)
                .get();
            if (!snapshot.empty) {
                const docSnap = snapshot.docs[0];
                const data = docSnap.data();
                return {
                    id: docSnap.id,
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
        }
        catch (error) {
            console.error('Error getting user by username:', error);
            return undefined;
        }
    }
    async getAllUsers() {
        try {
            const snapshot = await db.collection(COLLECTIONS.USERS).get();
            return snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
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
        }
        catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }
    async createUser(insertUser) {
        try {
            const id = randomUUID();
            const now = new Date();
            const user = {
                ...insertUser,
                id,
                createdAt: now,
                updatedAt: now,
            };
            await db.collection(COLLECTIONS.USERS).add(user);
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
        }
        catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }
    async updateUser(id, updates) {
        try {
            const docRef = db.collection(COLLECTIONS.USERS).doc(id);
            const updateData = {
                ...updates,
                updatedAt: new Date(),
            };
            await docRef.update(updateData);
            const updatedDoc = await docRef.get();
            if (!updatedDoc.exists) {
                throw new Error('User not found after update');
            }
            const data = updatedDoc.data();
            return {
                id: updatedDoc.id,
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
        catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }
    // Community operations
    async getCommunity(id) {
        try {
            const docRef = db.collection(COLLECTIONS.COMMUNITIES).doc(id);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                const data = docSnap.data();
                // Use document ID as the source of truth, but prefer data.id if it exists
                const communityId = data.id || docSnap.id;
                return {
                    id: communityId,
                    name: data.name,
                    description: data.description || null,
                    location: data.location || null,
                    leaderId: data.leaderId || null,
                    memberCount: data.memberCount,
                    createdAt: data.createdAt,
                };
            }
            return undefined;
        }
        catch (error) {
            console.error('Error getting community:', error);
            return undefined;
        }
    }
    async getAllCommunities() {
        try {
            const snapshot = await db.collection(COLLECTIONS.COMMUNITIES).get();
            const communities = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                // Use document ID as the source of truth, but prefer data.id if it exists
                const communityId = data.id || docSnap.id;
                return {
                    id: communityId,
                    name: data.name,
                    description: data.description || null,
                    location: data.location || null,
                    leaderId: data.leaderId || null,
                    memberCount: data.memberCount,
                    createdAt: data.createdAt,
                };
            });
            console.log(`✅ Fetched ${communities.length} communities from Firestore`);
            return communities;
        }
        catch (error) {
            console.error('❌ Error getting all communities:', error);
            return [];
        }
    }
    async createCommunity(community) {
        try {
            const now = new Date();
            const customId = community.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            const newCommunity = {
                ...community,
                id: customId,
                memberCount: 0,
                createdAt: now,
                updatedAt: now,
            };
            await db.collection(COLLECTIONS.COMMUNITIES).doc(customId).set(newCommunity);
            return {
                id: newCommunity.id,
                name: newCommunity.name,
                description: newCommunity.description || null,
                location: newCommunity.location || null,
                leaderId: newCommunity.leaderId || null,
                memberCount: newCommunity.memberCount,
                createdAt: newCommunity.createdAt,
            };
        }
        catch (error) {
            console.error('Error creating community:', error);
            throw error;
        }
    }
    async updateCommunity(id, updates) {
        try {
            const docRef = db.collection(COLLECTIONS.COMMUNITIES).doc(id);
            const updateData = {
                ...updates,
                updatedAt: new Date(),
            };
            await docRef.update(updateData);
            const updatedDoc = await docRef.get();
            if (updatedDoc.exists) {
                const data = updatedDoc.data();
                return {
                    id: data.id,
                    name: data.name,
                    description: data.description || null,
                    location: data.location || null,
                    leaderId: data.leaderId || null,
                    memberCount: data.memberCount ?? null,
                    createdAt: data.createdAt ?? null,
                };
            }
            throw new Error('Community not found');
        }
        catch (error) {
            console.error('Error updating community:', error);
            throw error;
        }
    }
    async deleteCommunity(id) {
        try {
            await db.collection(COLLECTIONS.COMMUNITIES).doc(id).delete();
        }
        catch (error) {
            console.error('Error deleting community:', error);
            throw error;
        }
    }
    async assignLeaderToCommunity(communityId, leaderId) {
        try {
            await db.collection(COLLECTIONS.COMMUNITIES).doc(communityId).update({
                leaderId,
                updatedAt: new Date(),
            });
        }
        catch (error) {
            console.error('Error assigning leader to community:', error);
            throw error;
        }
    }
    async removeLeaderFromCommunity(communityId) {
        try {
            await db.collection(COLLECTIONS.COMMUNITIES).doc(communityId).update({
                leaderId: null,
                updatedAt: new Date(),
            });
        }
        catch (error) {
            console.error('Error removing leader from community:', error);
            throw error;
        }
    }
}
export const storage = new FirebaseStorage();
//# sourceMappingURL=storage.js.map
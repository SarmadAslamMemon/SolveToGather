import { db, COLLECTIONS } from './firebase';
import { collection, getDocs, deleteDoc, doc, addDoc, setDoc } from 'firebase/firestore';

// Function to clear all collections
export async function clearDatabase() {
  console.log('🗑️ Clearing database...');
  
  try {
    // Clear users
    const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    for (const userDoc of usersSnapshot.docs) {
      await deleteDoc(doc(db, COLLECTIONS.USERS, userDoc.id));
      console.log(`🗑️ Deleted user: ${userDoc.id}`);
    }
    
    // Clear communities
    const communitiesSnapshot = await getDocs(collection(db, COLLECTIONS.COMMUNITIES));
    for (const communityDoc of communitiesSnapshot.docs) {
      await deleteDoc(doc(db, COLLECTIONS.COMMUNITIES, communityDoc.id));
      console.log(`🗑️ Deleted community: ${communityDoc.id}`);
    }
    
    // Clear issues
    const issuesSnapshot = await getDocs(collection(db, COLLECTIONS.ISSUES));
    for (const issueDoc of issuesSnapshot.docs) {
      await deleteDoc(doc(db, COLLECTIONS.ISSUES, issueDoc.id));
      console.log(`🗑️ Deleted issue: ${issueDoc.id}`);
    }
    
    // Clear campaigns
    const campaignsSnapshot = await getDocs(collection(db, COLLECTIONS.CAMPAIGNS));
    for (const campaignDoc of campaignsSnapshot.docs) {
      await deleteDoc(doc(db, COLLECTIONS.CAMPAIGNS, campaignDoc.id));
      console.log(`🗑️ Deleted campaign: ${campaignDoc.id}`);
    }
    
    console.log('✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

// New clean sample data
export const cleanSampleData = {
  communities: [
    {
      id: 'gulshan',
      name: 'Gulshan-e-Iqbal',
      description: 'A vibrant community in Karachi',
      location: 'Karachi, Pakistan',
      leaderId: null, // No leader initially
      memberCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'korangi',
      name: 'Korangi',
      description: 'Industrial area community',
      location: 'Karachi, Pakistan',
      leaderId: null, // No leader initially
      memberCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  
  users: [
    // Super user
    {
      id: '00000-0000000-0',
      email: 'admin@community.com',
      firstName: 'Admin',
      lastName: 'User',
      address: 'Karachi, Pakistan',
      nic: '00000-0000000-0',
      phoneNumber: '+92-300-0000000',
      role: 'super_user' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Normal users for Gulshan
    {
      id: '12345-1234567-1',
      email: 'sara@gulshan.com',
      firstName: 'Sara',
      lastName: 'Khan',
      address: 'Gulshan-e-Iqbal, Karachi',
      nic: '12345-1234567-1',
      phoneNumber: '+92-300-1234567',
      role: 'normal_user' as const,
      communityId: 'gulshan',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '12345-1234567-2',
      email: 'ahmed@gulshan.com',
      firstName: 'Ahmed',
      lastName: 'Ali',
      address: 'Gulshan-e-Iqbal, Karachi',
      nic: '12345-1234567-2',
      phoneNumber: '+92-300-1234568',
      role: 'normal_user' as const,
      communityId: 'gulshan',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Normal users for Korangi
    {
      id: '12345-1234567-3',
      email: 'fatima@korangi.com',
      firstName: 'Fatima',
      lastName: 'Hassan',
      address: 'Korangi, Karachi',
      nic: '12345-1234567-3',
      phoneNumber: '+92-300-1234569',
      role: 'normal_user' as const,
      communityId: 'korangi',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '12345-1234567-4',
      email: 'hassan@korangi.com',
      firstName: 'Hassan',
      lastName: 'Malik',
      address: 'Korangi, Karachi',
      nic: '12345-1234567-4',
      phoneNumber: '+92-300-1234570',
      role: 'normal_user' as const,
      communityId: 'korangi',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

// Function to seed with clean data
export async function seedCleanDatabase() {
  console.log('🌱 Seeding database with clean data...');
  
  try {
    // Add communities with specific IDs
    for (const community of cleanSampleData.communities) {
      await setDoc(doc(db, COLLECTIONS.COMMUNITIES, community.id), {
        ...community,
      });
      console.log(`✅ Added community: ${community.name} with ID: ${community.id}`);
    }
    
    // Add users with specific IDs
    for (const user of cleanSampleData.users) {
      await setDoc(doc(db, COLLECTIONS.USERS, user.id), {
        ...user,
      });
      console.log(`✅ Added user: ${user.email} with ID: ${user.id}`);
    }
    
    console.log('🎉 Clean database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding clean database:', error);
    throw error;
  }
}

// Main function to reset database
export async function resetDatabase() {
  try {
    await clearDatabase();
    await seedCleanDatabase();
    console.log('🎉 Database reset completed successfully!');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  }
}

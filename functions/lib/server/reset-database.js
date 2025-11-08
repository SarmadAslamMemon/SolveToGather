import { db, COLLECTIONS } from './firebase';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
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
    }
    catch (error) {
        console.error('❌ Error clearing database:', error);
        throw error;
    }
}
// New clean sample data
export const cleanSampleData = {
    communities: [
    // No dummy communities - super admin will create communities as needed
    ],
    users: [
    // No dummy users - users will register through the application
    ],
};
// Function to seed with clean data
export async function seedCleanDatabase() {
    console.log('🌱 Seeding database with clean data...');
    try {
        // Add communities with specific IDs
        if (cleanSampleData.communities.length > 0) {
            for (const community of cleanSampleData.communities) {
                await setDoc(doc(db, COLLECTIONS.COMMUNITIES, community.id), {
                    ...community,
                });
                console.log(`✅ Added community: ${community.name} with ID: ${community.id}`);
            }
        }
        else {
            console.log('ℹ️  No sample communities to seed - database is clean');
        }
        // Add users with specific IDs
        if (cleanSampleData.users.length > 0) {
            for (const user of cleanSampleData.users) {
                await setDoc(doc(db, COLLECTIONS.USERS, user.id), {
                    ...user,
                });
                console.log(`✅ Added user: ${user.email} with ID: ${user.id}`);
            }
        }
        else {
            console.log('ℹ️  No sample users to seed - database is clean');
        }
        console.log('🎉 Database reset completed - ready for use!');
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('❌ Error resetting database:', error);
        throw error;
    }
}
//# sourceMappingURL=reset-database.js.map
import { db, COLLECTIONS } from './firebase';

async function clearCollections() {
  console.log('🗑️ Clearing issues, campaigns, transactions, likes, comments, and reports...');
  
  try {
    const collectionsToClear = [
      { name: 'Issues', collection: COLLECTIONS.ISSUES },
      { name: 'Campaigns', collection: COLLECTIONS.CAMPAIGNS },
      { name: 'Donations', collection: COLLECTIONS.DONATIONS },
      { name: 'Likes', collection: COLLECTIONS.LIKES },
      { name: 'Comments', collection: COLLECTIONS.COMMENTS },
      { name: 'Reports', collection: COLLECTIONS.REPORTS },
    ];

    // Also check for transaction-related collections
    const transactionCollections = ['transactions', 'transactionhistory', 'payments'];
    
    for (const { name, collection: collectionName } of collectionsToClear) {
      try {
        console.log(`📋 Fetching ${name}...`);
        const snapshot = await db.collection(collectionName).get();
        console.log(`Found ${snapshot.size} ${name.toLowerCase()} to delete`);
        
        if (snapshot.size > 0) {
          const deletes = snapshot.docs.map(async (doc) => {
            await doc.ref.delete();
            console.log(`🗑️ Deleted ${name.toLowerCase().slice(0, -1)}: ${doc.id}`);
          });
          
          await Promise.all(deletes);
          console.log(`✅ Deleted ${snapshot.size} ${name.toLowerCase()}`);
        } else {
          console.log(`ℹ️  No ${name.toLowerCase()} found`);
        }
      } catch (error) {
        console.error(`❌ Error clearing ${name}:`, error);
        // Continue with other collections even if one fails
      }
    }

    // Clear transaction-related collections
    for (const collectionName of transactionCollections) {
      try {
        console.log(`📋 Fetching ${collectionName}...`);
        const snapshot = await db.collection(collectionName).get();
        console.log(`Found ${snapshot.size} ${collectionName} to delete`);
        
        if (snapshot.size > 0) {
          const deletes = snapshot.docs.map(async (doc) => {
            await doc.ref.delete();
            console.log(`🗑️ Deleted ${collectionName.slice(0, -1)}: ${doc.id}`);
          });
          
          await Promise.all(deletes);
          console.log(`✅ Deleted ${snapshot.size} ${collectionName}`);
        } else {
          console.log(`ℹ️  No ${collectionName} found`);
        }
      } catch (error) {
        console.error(`❌ Error clearing ${collectionName}:`, error);
        // Continue with other collections even if one fails
      }
    }
    
    console.log('🎉 All collections cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing collections:', error);
    throw error;
  }
}

async function main() {
  try {
    await clearCollections();
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

main();


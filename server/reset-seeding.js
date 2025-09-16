const { db, COLLECTIONS } = require('./firebase.ts');
const { doc, deleteDoc, getDoc } = require('firebase/firestore');

async function resetSeedingStatus() {
  try {
    console.log('🔄 Resetting seeding status...');
    
    const seedingStatusRef = doc(db, COLLECTIONS.SYSTEM, 'seeding-status');
    const seedingStatusDoc = await getDoc(seedingStatusRef);
    
    if (seedingStatusDoc.exists()) {
      await deleteDoc(seedingStatusRef);
      console.log('✅ Seeding status reset successfully!');
      console.log('🌱 Database will be seeded on next startup');
    } else {
      console.log('ℹ️ No seeding status found - database will be seeded on next startup');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting seeding status:', error);
    process.exit(1);
  }
}

resetSeedingStatus();

import { resetDatabase } from './reset-database';
async function main() {
    try {
        console.log('🚀 Starting database reset...');
        await resetDatabase();
        console.log('✅ Database reset completed!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Database reset failed:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=reset-db.js.map
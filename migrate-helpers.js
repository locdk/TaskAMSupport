import { doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { db } from './src/firebase.js';
import fs from 'fs';

// Read db.json
const data = JSON.parse(fs.readFileSync('./db.json', 'utf8'));

const COLLECTIONS_TO_MIGRATE = [
    'teams',
    'roles',
    'taskStatuses',
    'taskPriorities',
    'taskTypes',
    'designTaskTypes'
];

async function migrateHelpers() {
    console.log('📦 Migrating helper collections...');

    for (const colName of COLLECTIONS_TO_MIGRATE) {
        if (!data[colName] || !Array.isArray(data[colName])) {
            console.log(`⚠️  Skipping ${colName}: Not found or not an array in db.json`);
            continue;
        }

        console.log(`Processing ${colName} (${data[colName].length} items)...`);
        const batch = writeBatch(db);
        let batchCount = 0;

        for (const item of data[colName]) {
            // Use existing ID if available, otherwise generate one
            const id = item.id ? item.id.toString() : Date.now().toString();
            const docRef = doc(db, colName, id);
            batch.set(docRef, item);
            batchCount++;
        }

        if (batchCount > 0) {
            await batch.commit();
            console.log(`✅ ${colName}: Migrated ${batchCount} items`);
        } else {
            console.log(`ℹ️  ${colName}: No items to migrate`);
        }
    }

    console.log('🎉 Migration complete!');
    process.exit(0);
}

migrateHelpers().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});

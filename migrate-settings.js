import { doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import { db } from './src/firebase.js';

// Read db.json
const data = JSON.parse(fs.readFileSync('./db.json', 'utf8'));

async function migrateSettings() {
    console.log('📦 Migrating settings...');

    if (!data.settings) {
        console.log('❌ No settings found in db.json');
        process.exit(0);
    }

    try {
        // Use a fixed ID 'global' for the single settings document
        await setDoc(doc(db, 'settings', 'global'), data.settings);
        console.log('✅ Settings migrated successfully to settings/global');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error migrating settings:', error);
        process.exit(1);
    }
}

migrateSettings();

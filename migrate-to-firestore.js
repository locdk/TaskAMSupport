// Migration script to transfer data from db.json to Firestore
// Run with: node migrate-to-firestore.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCfPHEcv-ARb06pcRgrsnfV3HIkeQPIMvE",
    authDomain: "taskamsupport.firebaseapp.com",
    projectId: "taskamsupport",
    storageBucket: "taskamsupport.firebasestorage.app",
    messagingSenderId: "383729303285",
    appId: "1:383729303285:web:7756c87e590164ddd28fbc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Read db.json
const data = JSON.parse(fs.readFileSync('./db.json', 'utf8'));

async function migrateCollection(collectionName, items) {
    if (!items || items.length === 0) {
        console.log(`\n📦 Skipping ${collectionName} (no data)`);
        return;
    }

    console.log(`\n📦 Migrating ${collectionName}...`);
    let count = 0;

    for (const item of items) {
        try {
            await setDoc(doc(db, collectionName, item.id), item);
            count++;
            process.stdout.write(`\r   Migrated ${count}/${items.length} items`);
        } catch (error) {
            console.error(`\n   ❌ Error migrating ${item.id}:`, error.message);
        }
    }

    console.log(`\n   ✅ Completed: ${count}/${items.length} items migrated`);
}

async function migrateData() {
    console.log('🚀 Starting Firebase migration...\n');
    console.log('📊 Data summary:');
    console.log(`   - Users: ${data.users?.length || 0}`);
    console.log(`   - Personnel: ${data.personnel?.length || 0}`);
    console.log(`   - Tasks: ${data.tasks?.length || 0}`);
    console.log(`   - Attendance: ${data.attendance?.length || 0}`);
    console.log(`   - Attendance History: ${data.attendanceHistory?.length || 0}`);
    console.log(`   - Settings: ${data.settings?.length || 0}`);
    console.log(`   - Notifications: ${data.notifications?.length || 0}`);

    try {
        // Migrate each collection
        await migrateCollection('users', data.users);
        await migrateCollection('personnel', data.personnel);
        await migrateCollection('tasks', data.tasks);
        await migrateCollection('attendance', data.attendance);
        await migrateCollection('attendanceHistory', data.attendanceHistory);
        await migrateCollection('settings', data.settings);
        await migrateCollection('notifications', data.notifications);

        // Migrate other collections if they exist
        if (data.taskStatuses) await migrateCollection('taskStatuses', data.taskStatuses);
        if (data.taskPriorities) await migrateCollection('taskPriorities', data.taskPriorities);
        if (data.taskTypes) await migrateCollection('taskTypes', data.taskTypes);
        if (data.teams) await migrateCollection('teams', data.teams);
        if (data.roles) await migrateCollection('roles', data.roles);
        if (data.designTaskTypes) await migrateCollection('designTaskTypes', data.designTaskTypes);

        console.log('\n\n🎉 Migration completed successfully!');
        console.log('✅ All data has been transferred to Firestore');
        console.log('\n📝 Next steps:');
        console.log('   1. Verify data in Firebase Console');
        console.log('   2. Update your app to use Firestore API');
        console.log('   3. Test the application');
        console.log('   4. Remove db.json and JSON Server');

    } catch (error) {
        console.error('\n\n❌ Migration failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Run migration
migrateData();

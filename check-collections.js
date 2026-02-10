import { getDocs, collection } from 'firebase/firestore';
import { db } from './src/firebase.js';

async function checkCollections() {
    console.log('🔍 Checking Helper Collections...');

    const collections = [
        'teams',
        'roles',
        'taskStatuses',
        'taskPriorities',
        'taskTypes',
        'designTaskTypes'
    ];

    try {
        for (const colName of collections) {
            const snapshot = await getDocs(collection(db, colName));
            console.log(`- ${colName}: ${snapshot.size} documents`);
            if (snapshot.size > 0 && colName === 'teams') {
                console.log('  Teams found:', snapshot.docs.map(d => d.data().name));
            }
        }
    } catch (error) {
        console.error('❌ Error checking collections:', error);
    }
    process.exit(0);
}

checkCollections();

import { getDocs, collection } from 'firebase/firestore';
import { db } from './src/firebase.js';

async function checkRolesDetail() {
    console.log('🔍 Checking Roles Permissions Detail...');
    try {
        const snapshot = await getDocs(collection(db, 'roles'));
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`\nRole ID: ${doc.id}`);
            console.log(`Name: ${data.name}`);
            console.log(`Permissions Type: ${typeof data.permissions}`);
            if (Array.isArray(data.permissions)) {
                console.log(`Is Array: YES. Length: ${data.permissions.length}`);
                console.log(`Sample: ${data.permissions.slice(0, 3)}`);
            } else {
                console.log(`Is Array: NO. Value:`, data.permissions);
            }
        });

    } catch (error) {
        console.error('❌ Error checking roles:', error);
    }
    process.exit(0);
}

checkRolesDetail();

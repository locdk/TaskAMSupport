import { getDocs, collection } from 'firebase/firestore';
import { db } from './src/firebase.js';

async function checkPersonnelRoles() {
    console.log('🔍 Checking Personnel Roles...');
    try {
        const snapshot = await getDocs(collection(db, 'personnel'));
        const personnel = snapshot.docs.map(doc => doc.data());

        const uniqueRoles = [...new Set(personnel.map(p => p.role))];
        console.log('Unique Roles found in Personnel:', uniqueRoles);

    } catch (error) {
        console.error('❌ Error checking personnel roles:', error);
    }
    process.exit(0);
}

checkPersonnelRoles();

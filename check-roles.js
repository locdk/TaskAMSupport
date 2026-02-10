import { getDocs, collection } from 'firebase/firestore';
import { db } from './src/firebase.js';

async function checkRoles() {
    console.log('🔍 Checking Roles Collection...');
    try {
        const snapshot = await getDocs(collection(db, 'roles'));
        const roles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log('Roles found:', roles.length);
        roles.forEach(role => {
            console.log(`\nRole: ${role.name}`);
            console.log(`Permissions: ${JSON.stringify(role.permissions)}`);
        });

    } catch (error) {
        console.error('❌ Error checking roles:', error);
    }
    process.exit(0);
}

checkRoles();

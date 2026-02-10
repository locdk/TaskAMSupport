import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDWGEsTrack-xJqLlx_CnhQBNBWEVQQkLgI",
    authDomain: "taskamsupport.firebaseapp.com",
    projectId: "taskamsupport",
    storageBucket: "taskamsupport.firebasestorage.app",
    messagingSenderId: "655961983115",
    appId: "1:655961983115:web:5e0f5c0e2c4e4b8e8f8f8f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkDuplicates() {
    console.log('🔍 Checking for duplicate personnel...');

    const snapshot = await getDocs(collection(db, 'personnel'));
    const personnel = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const nameMap = {};
    const duplicates = [];

    personnel.forEach(p => {
        const name = (p.name || '').trim().toLowerCase();
        if (name) {
            if (nameMap[name]) {
                duplicates.push({
                    name: p.name,
                    ids: [nameMap[name].id, p.id],
                    emails: [nameMap[name].email, p.email]
                });
            } else {
                nameMap[name] = p;
            }
        }
    });

    if (duplicates.length > 0) {
        console.log(`⚠️ Found ${duplicates.length} duplicate names:`);
        duplicates.forEach(d => {
            console.log(`- Name: "${d.name}"`);
            console.log(`  IDs: ${JSON.stringify(d.ids)}`);
            console.log(`  Emails: ${JSON.stringify(d.emails)}`);
        });

        // Auto-delete duplicates if email is missing or looks like a test/bad data? 
        // Or just report for now.
    } else {
        console.log('✅ No duplicate names found.');
    }

    process.exit(0);
}

checkDuplicates().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});

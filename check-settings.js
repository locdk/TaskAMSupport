import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkSettings() {
    console.log('🔍 Checking settings in Firestore...');

    const snapshot = await getDocs(collection(db, 'settings'));

    if (snapshot.empty) {
        console.log('❌ No settings found in database!');
    } else {
        snapshot.forEach(doc => {
            console.log('\n✅ Settings found:');
            console.log('Document ID:', doc.id);
            console.log('Data:', JSON.stringify(doc.data(), null, 2));
        });
    }

    process.exit(0);
}

checkSettings().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});

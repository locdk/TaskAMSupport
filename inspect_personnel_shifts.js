import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

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

async function inspect() {
    console.log('Inspecting Personnel WorkShifts...');
    const snapshot = await getDocs(collection(db, 'personnel'));
    snapshot.docs.forEach(d => {
        const data = d.data();
        if (data.workShifts && Object.keys(data.workShifts).length > 0) {
            console.log(`User: ${data.name} (${data.email})`);
            console.log('WorkShifts:', JSON.stringify(data.workShifts, null, 2));
        }
    });

    console.log('\nCurrent Shift Definitions:');
    const shifts = await getDocs(collection(db, 'shiftDefinitions'));
    shifts.docs.forEach(d => {
        console.log(`ID: ${d.id}, Name: ${d.data().name}`);
    });
    process.exit(0);
}

inspect();

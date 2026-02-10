import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';

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

async function initShiftDefinitions() {
    console.log('🔍 Checking existing shift definitions...');

    // Get all existing shifts
    const shiftsSnapshot = await getDocs(collection(db, 'shiftDefinitions'));
    const existingShifts = shiftsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    console.log(`Found ${existingShifts.length} existing shifts:`);
    existingShifts.forEach(shift => {
        console.log(`  - ${shift.name} (${shift.startTime || 'no start'} - ${shift.endTime || 'no end'})`);
    });

    // Delete all existing shifts
    console.log('\n🗑️  Deleting all existing shifts...');
    for (const shift of existingShifts) {
        await deleteDoc(doc(db, 'shiftDefinitions', shift.id));
        console.log(`  ✓ Deleted: ${shift.name}`);
    }

    // Create new shift definitions
    console.log('\n✨ Creating new shift definitions...');

    const newShifts = [
        // AM Team - Day Shifts
        { name: 'Ca 1', startTime: '08:00', endTime: '17:00', order: 0 },
        { name: 'Ca 2', startTime: '09:00', endTime: '18:00', order: 1 },
        { name: 'Ca 3', startTime: '10:00', endTime: '19:00', order: 2 },
        { name: 'HC', startTime: '08:30', endTime: '17:30', order: 3 },

        // MKT Support - Night Shifts
        { name: 'S1', startTime: '21:00', endTime: '05:00', order: 4 },
        { name: 'S2', startTime: '22:00', endTime: '06:00', order: 5 },
        { name: 'S3', startTime: '23:00', endTime: '07:00', order: 6 },
    ];

    for (const shift of newShifts) {
        const docRef = doc(collection(db, 'shiftDefinitions'));
        await setDoc(docRef, shift);
        console.log(`  ✓ Created: ${shift.name} (${shift.startTime} - ${shift.endTime})`);
    }

    console.log('\n✅ Shift definitions initialized successfully!');
    console.log('\nYou can now:');
    console.log('1. Go to Settings page');
    console.log('2. Scroll to "Quản lý Ca làm việc"');
    console.log('3. Edit or add more shifts as needed');

    process.exit(0);
}

initShiftDefinitions().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});

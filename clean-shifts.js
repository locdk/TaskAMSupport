import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc, writeBatch } from 'firebase/firestore';

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

async function cleanAndInitShifts() {
    console.log('🔍 Checking current shift definitions...');

    // Get all existing shifts
    const shiftsSnapshot = await getDocs(collection(db, 'shiftDefinitions'));
    const existingShifts = shiftsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    console.log(`\n📊 Found ${existingShifts.length} existing shifts:`);
    existingShifts.forEach((shift, index) => {
        console.log(`  ${index + 1}. ${shift.name} (${shift.startTime || 'no start'} - ${shift.endTime || 'no end'}) [ID: ${shift.id}]`);
    });

    // Delete ALL existing shifts using batch
    if (existingShifts.length > 0) {
        console.log('\n🗑️  Deleting ALL existing shifts...');
        const batch = writeBatch(db);

        for (const shift of existingShifts) {
            batch.delete(doc(db, 'shiftDefinitions', shift.id));
        }

        await batch.commit();
        console.log(`  ✓ Deleted ${existingShifts.length} shifts successfully`);
    }

    // Wait a bit to ensure deletion is complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify deletion
    const verifySnapshot = await getDocs(collection(db, 'shiftDefinitions'));
    console.log(`\n✅ Verification: ${verifySnapshot.docs.length} shifts remaining (should be 0)`);

    if (verifySnapshot.docs.length > 0) {
        console.log('⚠️  Warning: Some shifts still exist. Deleting them individually...');
        for (const doc of verifySnapshot.docs) {
            await deleteDoc(doc.ref);
            console.log(`  ✓ Force deleted: ${doc.data().name}`);
        }
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

    const createBatch = writeBatch(db);
    const createdIds = [];

    for (const shift of newShifts) {
        const docRef = doc(collection(db, 'shiftDefinitions'));
        createBatch.set(docRef, shift);
        createdIds.push(docRef.id);
        console.log(`  ✓ Prepared: ${shift.name} (${shift.startTime} - ${shift.endTime})`);
    }

    await createBatch.commit();
    console.log('\n✅ All shifts created successfully!');

    // Final verification
    const finalSnapshot = await getDocs(collection(db, 'shiftDefinitions'));
    console.log(`\n📊 Final count: ${finalSnapshot.docs.length} shifts in database`);
    finalSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ${data.name} (${data.startTime} - ${data.endTime})`);
    });

    console.log('\n✅ Done! Please refresh your browser to see the changes.');

    process.exit(0);
}

cleanAndInitShifts().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});

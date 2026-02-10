
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCfPHEcv-ARb06pcRgrsnfV3HIkeQPIMvE",
    authDomain: "taskamsupport.firebaseapp.com",
    projectId: "taskamsupport",
    storageBucket: "taskamsupport.firebasestorage.app",
    messagingSenderId: "383729303285",
    appId: "1:383729303285:web:7756c87e590164ddd28fbc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearAttendanceData() {
    console.log("Starting to clear attendance data...");

    // 1. Clear 'attendance' collection (Real-time tracking)
    console.log("Fetching 'attendance' collection...");
    const attSnap = await getDocs(collection(db, 'attendance'));
    console.log(`Found ${attSnap.size} documents in 'attendance'.`);

    if (attSnap.size > 0) {
        const batch1 = writeBatch(db);
        attSnap.docs.forEach(d => batch1.delete(d.ref));
        await batch1.commit();
        console.log("Deleted all documents in 'attendance'.");
    }

    // 2. Clear 'attendanceHistory' collection (Logs)
    console.log("Fetching 'attendanceHistory' collection...");
    const histSnap = await getDocs(collection(db, 'attendanceHistory'));
    console.log(`Found ${histSnap.size} documents in 'attendanceHistory'.`);

    if (histSnap.size > 0) {
        // Firestore batches limited to 500 ops. Simple handling here.
        const chunks = [];
        let tempDocs = [...histSnap.docs];
        while (tempDocs.length > 0) {
            chunks.push(tempDocs.splice(0, 450));
        }

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(d => batch.delete(d.ref));
            await batch.commit();
            console.log(`Deleted batch of ${chunk.length} documents from 'attendanceHistory'.`);
        }
    }

    console.log("All attendance data cleared successfully.");
}

clearAttendanceData().then(() => process.exit(0)).catch(e => console.error(e));

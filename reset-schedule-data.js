import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const AM_SHIFTS = ['Ca 1', 'Ca 2', 'Ca 3', 'HC'];
const SUPPORT_SHIFTS = ['S1', 'S2', 'S3'];

async function resetScheduleData() {
    console.log('🔍 Fetching all personnel...');

    const personnelSnapshot = await getDocs(collection(db, 'personnel'));
    const personnelList = personnelSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    console.log(`Found ${personnelList.length} personnel.`);

    for (const p of personnelList) {
        const pTeam = (p.parentTeam || p.team || '').trim().toLowerCase();
        let newWorkShifts = {};
        let newWorkDays = [];
        let shiftsPool = [];

        if (pTeam.includes('am')) {
            shiftsPool = AM_SHIFTS;
        } else if (pTeam.includes('mkt') || pTeam.includes('support')) {
            shiftsPool = SUPPORT_SHIFTS;
        } else if (pTeam.includes('designer')) {
            shiftsPool = ['HC']; // Designers usually standard hours
        } else {
            // Default to Day shifts for others
            shiftsPool = AM_SHIFTS;
        }

        // Randomly assign shifts for 5-6 days a week
        DAYS.forEach(day => {
            // 80% chance to work on a given day
            if (Math.random() > 0.2) {
                const randomShift = shiftsPool[Math.floor(Math.random() * shiftsPool.length)];
                newWorkShifts[day] = randomShift;
                newWorkDays.push(day);
            } else {
                newWorkShifts[day] = 'Nghỉ';
            }
        });

        // Ensure at least some work days if 80% chance failed (unlikely but possible)
        if (newWorkDays.length === 0) {
            newWorkDays = ['T2', 'T3', 'T4', 'T5', 'T6'];
            ['T2', 'T3', 'T4', 'T5', 'T6'].forEach(day => {
                newWorkShifts[day] = shiftsPool[0];
            });
        }

        console.log(`  Updating ${p.name} (${pTeam}) -> ${newWorkDays.length} work days`);

        try {
            const docRef = doc(db, 'personnel', p.id);
            await updateDoc(docRef, {
                workShifts: newWorkShifts,
                workDays: newWorkDays
            });
        } catch (error) {
            console.error(`  ❌ Failed to update ${p.name}:`, error);
        }
    }

    console.log('\n✅ Schedule data reset and re-seeded successfully!');
    process.exit(0);
}

resetScheduleData().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});

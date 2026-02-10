import { doc, getDocs, collection } from 'firebase/firestore';
import { db } from './src/firebase.js';

async function inspectPersonnel() {
    console.log('🔍 Inspecting Personnel collection...');

    try {
        const snapshot = await getDocs(collection(db, 'personnel'));
        const personnel = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log(`Total Personnel: ${personnel.length}`);

        console.log('\n--- TEAM DISTRIBUTION ---');
        const teams = {};
        personnel.forEach(p => {
            const team = p.parentTeam || 'No Team';
            teams[team] = (teams[team] || 0) + 1;
        });
        console.table(teams);

        console.log('\n--- AM TEAM MEMBERS ---');
        // Check for exact 'AM' match
        const amMembers = personnel.filter(p => p.parentTeam === 'AM');
        if (amMembers.length === 0) {
            console.log("No members found with parentTeam === 'AM'");
        } else {
            console.log(`Found ${amMembers.length} members with parentTeam === 'AM'`);
        }

        console.log('\n--- ALL PARENT TEAMS FOUND ---');
        const uniqueTeams = [...new Set(personnel.map(p => p.parentTeam))];
        console.log(uniqueTeams);

    } catch (error) {
        console.error('❌ Error fetching personnel:', error);
        process.exit(1);
    }
    process.exit(0);
}

inspectPersonnel();

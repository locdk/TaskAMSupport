
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

async function checkAndFixRoles() {
    console.log("Fetching roles...");
    const snapshot = await getDocs(collection(db, 'roles'));
    const roles = snapshot.docs.map(d => ({ _id: d.id, ...d.data() }));

    console.log(`Found ${roles.length} roles.`);

    const targetName = "Test Role Sanitized";
    const targets = roles.filter(r => r.name === targetName);

    if (targets.length === 0) {
        console.log(`No role found with name "${targetName}"`);
    } else {
        console.log(`Found ${targets.length} roles with name "${targetName}":`);
        for (const role of targets) {
            console.log(`- ID: ${role._id}, Name: ${role.name}`);
            // Provide option to delete
            console.log(`DELETING role ${role._id}...`);
            await deleteDoc(doc(db, 'roles', role._id));
            console.log("Deleted.");
        }
    }
}

checkAndFixRoles().then(() => process.exit(0)).catch(e => console.error(e));

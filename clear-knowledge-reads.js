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

async function clearKnowledgeReads() {
    console.log('🔍 Fetching all knowledge articles...');

    const knowledgeSnapshot = await getDocs(collection(db, 'knowledge'));
    const knowledgeList = knowledgeSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    console.log(`Found ${knowledgeList.length} knowledge articles.`);

    for (const article of knowledgeList) {
        const readBy = article.readBy || [];

        if (readBy.length > 0) {
            console.log(`  Clearing ${readBy.length} read records from "${article.title}"`);

            try {
                const docRef = doc(db, 'knowledge', article.id);
                await updateDoc(docRef, {
                    readBy: []
                });
            } catch (error) {
                console.error(`  ❌ Failed to clear reads for "${article.title}":`, error);
            }
        } else {
            console.log(`  ✓ "${article.title}" already has no read records`);
        }
    }

    console.log('\n✅ All knowledge read records cleared successfully!');
    console.log('Users will now see all articles as unread.');
    process.exit(0);
}

clearKnowledgeReads().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});

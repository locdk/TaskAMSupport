import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    arrayUnion,
    serverTimestamp as firestoreServerTimestamp,
    Timestamp as firestoreTimestamp,
    deleteField
} from 'firebase/firestore';
import { db } from '../firebase.js';

export const serverTimestamp = firestoreServerTimestamp;
export const Timestamp = firestoreTimestamp;

// ==================== USERS ====================
export const getUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const getUserById = async (id) => {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const getUserByEmail = async (email) => {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

export const addUser = async (user) => {
    const docRef = await addDoc(collection(db, 'users'), {
        ...user,
        createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...user };
};

export const updateUser = async (id, updates) => {
    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
    });
};

// ==================== PERSONNEL ====================
export const getPersonnel = async () => {
    const snapshot = await getDocs(collection(db, 'personnel'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const addPersonnel = async (person) => {
    if (person.id) {
        const docRef = doc(db, 'personnel', person.id);
        await setDoc(docRef, {
            ...person,
            createdAt: serverTimestamp()
        });
        return { ...person };
    } else {
        const docRef = await addDoc(collection(db, 'personnel'), {
            ...person,
            createdAt: serverTimestamp()
        });
        return { id: docRef.id, ...person };
    }
};

export const updatePersonnel = async (id, updates) => {
    // CRITICAL: Clean undefined values from updates to prevent Firestore rejection
    const cleanUpdates = Object.keys(updates).reduce((acc, key) => {
        if (updates[key] !== undefined) acc[key] = updates[key];
        return acc;
    }, {});

    const docRef = doc(db, 'personnel', id);
    await setDoc(docRef, {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
    }, { merge: true });
};

export const deletePersonnel = async (id) => {
    await deleteDoc(doc(db, 'personnel', id));
};

export const resetAllPersonnelSchedule = async () => {
    const AM_SHIFTS = ['Ca 1', 'Ca 2', 'Ca 3', 'HC'];
    const SUPPORT_SHIFTS = ['S1', 'S2', 'S3'];
    const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    const snapshot = await getDocs(collection(db, 'personnel'));
    const updates = snapshot.docs.map(async (docSnapshot) => {
        const p = docSnapshot.data();
        const pTeam = (p.parentTeam || p.team || '').trim().toLowerCase();

        let newWorkShifts = {};
        let newWorkDays = [];
        let shiftsPool = [];

        if (pTeam.includes('am')) {
            shiftsPool = AM_SHIFTS;
        } else if (pTeam.includes('mkt') || pTeam.includes('support')) {
            shiftsPool = SUPPORT_SHIFTS;
        } else if (pTeam.includes('designer')) {
            shiftsPool = ['HC'];
        } else {
            shiftsPool = AM_SHIFTS;
        }

        // Generate schedule
        DAYS.forEach(day => {
            // 80% chance to work
            if (Math.random() > 0.2) {
                const randomShift = shiftsPool[Math.floor(Math.random() * shiftsPool.length)];
                newWorkShifts[day] = randomShift;
                newWorkDays.push(day);
            } else {
                newWorkShifts[day] = 'Nghỉ';
            }
        });

        // Ensure at least some work days if empty
        if (newWorkDays.length === 0) {
            newWorkDays = ['T2', 'T3', 'T4', 'T5', 'T6'];
            ['T2', 'T3', 'T4', 'T5', 'T6'].forEach(day => {
                newWorkShifts[day] = shiftsPool[0];
            });
        }

        const docRef = doc(db, 'personnel', docSnapshot.id);
        return updateDoc(docRef, {
            workShifts: newWorkShifts,
            workDays: newWorkDays
        });
    });

    await Promise.all(updates);
};

// ==================== TASKS ====================
export const getTasks = async () => {
    const snapshot = await getDocs(collection(db, 'tasks'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const addTask = async (task) => {
    // Remove undefined fields to prevent Firestore errors
    const cleanTask = Object.keys(task).reduce((acc, key) => {
        if (task[key] !== undefined) acc[key] = task[key];
        return acc;
    }, {});

    if (task.id) {
        const docRef = doc(db, 'tasks', task.id);
        await setDoc(docRef, {
            ...cleanTask,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { ...cleanTask };
    } else {
        const docRef = await addDoc(collection(db, 'tasks'), {
            ...cleanTask,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { id: docRef.id, ...cleanTask };
    }
};

export const updateTask = async (id, updates) => {
    // Remove undefined fields
    const cleanUpdates = Object.keys(updates).reduce((acc, key) => {
        if (updates[key] !== undefined) acc[key] = updates[key];
        return acc;
    }, {});

    const docRef = doc(db, 'tasks', id);
    await updateDoc(docRef, {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
    });
};

export const deleteTask = async (id) => {
    await deleteDoc(doc(db, 'tasks', id));
};

// ==================== ATTENDANCE ====================
export const getAttendance = async () => {
    const snapshot = await getDocs(collection(db, 'attendance'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const getAttendanceByUser = async (userId) => {
    const q = query(
        collection(db, 'attendance'),
        where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const addAttendance = async (record) => {
    const docRef = await addDoc(collection(db, 'attendance'), {
        ...record,
        createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...record };
};

export const updateAttendance = async (id, updates) => {
    const docRef = doc(db, 'attendance', id);
    await updateDoc(docRef, updates);
};

export const deleteAllAttendance = async () => {
    const snapshot = await getDocs(collection(db, 'attendance'));

    const promises = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const docRef = docSnap.ref;

        // Logic: Keep the record, but wipe Check-in/Check-out data
        // Restore status to 'Work' if it was 'working' or 'completed'
        // If status was 'OFF', 'NP', etc., keep it as is.

        const isAttendanceActive = data.checkInTime || data.checkOutTime || data.duration || data.lastActive;
        const isWorkingStatus = ['working', 'completed'].includes(data.status);

        if (isAttendanceActive || isWorkingStatus) {
            return updateDoc(docRef, {
                checkInTime: deleteField(),
                checkOutTime: deleteField(),
                duration: deleteField(),
                lastActive: deleteField(),
                // Only reset status to 'Work' if it was a working usage. 
                // If it was 'OFF' but somehow had data (unlikely), keep 'OFF'.
                status: isWorkingStatus ? 'Work' : data.status
            });
        }

        // Pure schedule records (Work/OFF/NP... without timing) -> KEEP INTACI
        return Promise.resolve();
    });

    await Promise.all(promises);
};

// ==================== HELPER COLLECTIONS ====================
// Task Statuses
export const getTaskStatuses = async () => {
    const snapshot = await getDocs(collection(db, 'taskStatuses'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};
export const addTaskStatus = async (item) => {
    const docRef = await addDoc(collection(db, 'taskStatuses'), item);
    return { id: docRef.id, ...item };
};
export const updateTaskStatus = async (item) => {
    const docRef = doc(db, 'taskStatuses', item.id);
    await setDoc(docRef, item, { merge: true });
};
export const deleteTaskStatus = async (id) => {
    await deleteDoc(doc(db, 'taskStatuses', id));
};

// Task Priorities
export const getTaskPriorities = async () => {
    const snapshot = await getDocs(collection(db, 'taskPriorities'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};
export const addTaskPriority = async (item) => {
    const docRef = await addDoc(collection(db, 'taskPriorities'), item);
    return { id: docRef.id, ...item };
};
export const updateTaskPriority = async (item) => {
    const docRef = doc(db, 'taskPriorities', item.id);
    await setDoc(docRef, item, { merge: true });
};
export const deleteTaskPriority = async (id) => {
    await deleteDoc(doc(db, 'taskPriorities', id));
};

// Task Types
export const getTaskTypes = async () => {
    const snapshot = await getDocs(collection(db, 'taskTypes'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};
export const addTaskType = async (item) => {
    const docRef = await addDoc(collection(db, 'taskTypes'), item);
    return { id: docRef.id, ...item };
};
export const updateTaskType = async (item) => {
    const docRef = doc(db, 'taskTypes', item.id);
    await setDoc(docRef, item, { merge: true });
};
export const deleteTaskType = async (id) => {
    await deleteDoc(doc(db, 'taskTypes', id));
};

// Teams
export const getTeams = async () => {
    const snapshot = await getDocs(collection(db, 'teams'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};
export const addTeam = async (item) => {
    const docRef = await addDoc(collection(db, 'teams'), item);
    return { id: docRef.id, ...item };
};
export const updateTeam = async (item) => {
    const docRef = doc(db, 'teams', item.id);
    await setDoc(docRef, item, { merge: true });
};
export const deleteTeam = async (id) => {
    await deleteDoc(doc(db, 'teams', id));
};

// Roles
export const getRoles = async () => {
    const snapshot = await getDocs(collection(db, 'roles'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};
export const addRole = async (item) => {
    const docRef = await addDoc(collection(db, 'roles'), item);
    return { id: docRef.id, ...item };
};
export const updateRole = async (item) => {
    const docRef = doc(db, 'roles', item.id);
    await setDoc(docRef, item, { merge: true });
};
export const deleteRole = async (id) => {
    await deleteDoc(doc(db, 'roles', id));
};

// Design Task Types
export const getDesignTaskTypes = async () => {
    const snapshot = await getDocs(collection(db, 'designTaskTypes'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};
export const addDesignTaskType = async (item) => {
    const docRef = await addDoc(collection(db, 'designTaskTypes'), item);
    return { id: docRef.id, ...item };
};
export const updateDesignTaskType = async (item) => {
    const docRef = doc(db, 'designTaskTypes', item.id);
    await setDoc(docRef, item, { merge: true });
};
export const deleteDesignTaskType = async (id) => {
    await deleteDoc(doc(db, 'designTaskTypes', id));
};

// Shift Definitions
export const getShiftDefinitions = async () => {
    const snapshot = await getDocs(collection(db, 'shiftDefinitions'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};
export const addShiftDefinition = async (item) => {
    const docRef = await addDoc(collection(db, 'shiftDefinitions'), item);
    return { id: docRef.id, ...item };
};
export const updateShiftDefinition = async (item) => {
    const docRef = doc(db, 'shiftDefinitions', item.id);
    await setDoc(docRef, item, { merge: true });
};
export const deleteShiftDefinition = async (id) => {
    await deleteDoc(doc(db, 'shiftDefinitions', id));
};

// ==================== ATTENDANCE HISTORY ====================
export const getAttendanceHistory = async () => {
    const snapshot = await getDocs(collection(db, 'attendanceHistory'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const addAttendanceHistory = async (history) => {
    const docRef = await addDoc(collection(db, 'attendanceHistory'), history);

    // Sync to Google Sheet
    syncToGoogleSheet({
        type: 'attendance_history',
        ...history,
        timestamp: new Date().toISOString()
    });

    return { id: docRef.id, ...history };
};

export const deleteAllAttendanceHistory = async () => {
    const snapshot = await getDocs(collection(db, 'attendanceHistory'));
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
};

// ==================== SETTINGS ====================
export const getSettings = async () => {
    const snapshot = await getDocs(collection(db, 'settings'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const updateSettings = async (id, updates) => {
    const docRef = doc(db, 'settings', id);
    await setDoc(docRef, updates, { merge: true });
};

// ==================== NOTIFICATIONS ====================
export const getNotifications = async () => {
    const snapshot = await getDocs(collection(db, 'notifications'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const addNotification = async (notification) => {
    const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: serverTimestamp()
    });

    // Sync to Google Sheet
    syncToGoogleSheet({
        type: 'notification',
        ...notification,
        timestamp: new Date().toISOString()
    });

    return { id: docRef.id, ...notification };
};

export const updateNotification = async (id, updates) => {
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, updates);
};

export const deleteNotification = async (id) => {
    await deleteDoc(doc(db, 'notifications', id));
};

export const clearAllNotifications = async () => {
    const snapshot = await getDocs(collection(db, 'notifications'));
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
};

// ==================== REAL-TIME LISTENERS ====================
export const subscribeToTasks = (callback) => {
    const q = query(collection(db, 'tasks'));
    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        // Client-side sort to ensure tasks without createdAt are still included (handled as old or new based on logic)
        tasks.sort((a, b) => {
            const timeA = a.createdAt?.seconds || (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() / 1000 : 0);
            const timeB = b.createdAt?.seconds || (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() / 1000 : 0);
            return timeB - timeA; // Descending
        });
        callback(tasks);
    });
};

export const subscribeToMyAttendance = (userId, callback) => {
    const q = query(
        collection(db, 'attendance'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(records);
    });
};

export const subscribeToAllAttendance = (callback) => {
    // Note: For large datasets, this should be paginated or filtered by date
    const q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(records);
    });
};

export const subscribeToPersonnel = (callback) => {
    return onSnapshot(collection(db, 'personnel'), (snapshot) => {
        const personnel = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(personnel);
    });
};

export const subscribeToNotifications = (callback) => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(notifs);
    });
};

export const subscribeToSettings = (callback) => {
    return onSnapshot(collection(db, 'settings'), (snapshot) => {
        const settingsList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        if (settingsList.length > 0) {
            callback(settingsList[0]);
        }
    });
};

export const subscribeToAttendanceHistory = (callback) => {
    // Sort by timestamp desc to get latest events first
    const q = query(collection(db, 'attendanceHistory'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const history = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(history);
    });
};

// ==================== KNOWLEDGE BASE ====================
export const getKnowledge = async () => {
    const q = query(collection(db, 'knowledge'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const addKnowledge = async (item) => {
    const docRef = await addDoc(collection(db, 'knowledge'), {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...item };
};

export const updateKnowledge = async (id, updates) => {
    const docRef = doc(db, 'knowledge', id);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
    });
};

export const deleteKnowledge = async (id) => {
    await deleteDoc(doc(db, 'knowledge', id));
};

export const subscribeToKnowledge = (callback) => {
    const q = query(collection(db, 'knowledge'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    });
};

// Mark knowledge as read by user
export const markKnowledgeAsRead = async (knowledgeId, userId, userName) => {
    const docRef = doc(db, 'knowledge', knowledgeId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        const readBy = data.readBy || [];

        // Check if user already read this
        const alreadyRead = readBy.some(reader => reader.userId === userId);

        if (!alreadyRead) {
            await updateDoc(docRef, {
                readBy: arrayUnion({
                    userId,
                    userName,
                    readAt: new Date().toISOString()
                })
            });
        }
    }
};

// Clear all read records from all knowledge articles
export const clearAllKnowledgeReads = async () => {
    const snapshot = await getDocs(collection(db, 'knowledge'));
    const updates = snapshot.docs.map(async (docSnapshot) => {
        const docRef = doc(db, 'knowledge', docSnapshot.id);
        return updateDoc(docRef, {
            readBy: []
        });
    });
    await Promise.all(updates);
};

// Knowledge Categories
export const getKnowledgeCategories = async () => {
    const q = query(collection(db, 'knowledgeCategories'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const addKnowledgeCategory = async (item) => {
    const docRef = await addDoc(collection(db, 'knowledgeCategories'), item);
    return { id: docRef.id, ...item };
};

export const updateKnowledgeCategory = async (item) => {
    const docRef = doc(db, 'knowledgeCategories', item.id);
    await setDoc(docRef, item, { merge: true });
};

export const deleteKnowledgeCategory = async (id) => {
    await deleteDoc(doc(db, 'knowledgeCategories', id));
};

export const subscribeToKnowledgeCategories = (callback) => {
    const q = query(collection(db, 'knowledgeCategories'), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    });
};

// ==================== STORES (Sổ tay thông tin tiệm) ====================
export const getStores = async () => {
    const q = query(collection(db, 'stores'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const addStore = async (store) => {
    // Clean undefined
    const cleanStore = Object.keys(store).reduce((acc, key) => {
        if (store[key] !== undefined) acc[key] = store[key];
        return acc;
    }, {});

    const docRef = await addDoc(collection(db, 'stores'), {
        ...cleanStore,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deletePending: false
    });
    return { id: docRef.id, ...cleanStore };
};

export const updateStore = async (id, updates) => {
    const cleanUpdates = Object.keys(updates).reduce((acc, key) => {
        if (updates[key] !== undefined) acc[key] = updates[key];
        return acc;
    }, {});

    const docRef = doc(db, 'stores', id);
    await updateDoc(docRef, {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
    });
};

export const deleteStore = async (id) => {
    // Hard delete
    await deleteDoc(doc(db, 'stores', id));
};

export const subscribeToStores = (callback) => {
    const q = query(collection(db, 'stores'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const stores = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(stores);
    });
};

// ==================== STORE LOGS (Nhật ký chỉnh sửa) ====================
export const getStoreLogs = async () => {
    const q = query(collection(db, 'storeLogs'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const addStoreLog = async (log) => {
    const docRef = await addDoc(collection(db, 'storeLogs'), {
        ...log,
        timestamp: serverTimestamp()
    });

    // Sync to Google Sheet
    syncToGoogleSheet({
        type: 'store_log',
        ...log,
        timestamp: new Date().toISOString()
    });

    return { id: docRef.id, ...log };
};

export const subscribeToStoreLogs = (callback) => {
    const q = query(collection(db, 'storeLogs'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(logs);
    });
};

export const clearAllStoreLogs = async () => {
    const snapshot = await getDocs(collection(db, 'storeLogs'));
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
};

// ==================== HELPER FUNCTIONS ====================
export const convertTimestampToDate = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return new Date(timestamp);
};

// ==================== GOOGLE SHEET SYNC (WEBHOOK) ====================
export const syncToGoogleSheet = async (data) => {
    try {
        // Fetch webhook URL from settings
        const settingsSnap = await getDocs(collection(db, 'settings'));
        if (settingsSnap.empty) return;

        const settings = settingsSnap.docs[0].data();
        const webhookUrl = settings.googleSheetWebhook;

        if (!webhookUrl) return;

        // Fire and forget - don't await response to avoid blocking UI
        fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors', // Important for Google Script Web App
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        }).catch(err => console.error("Sync partial error:", err));

    } catch (error) {
        console.error("Failed to sync to Google Sheet:", error);
    }
};

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './src/firebase.js';

async function updateRoles() {
    console.log('🔄 Updating Roles...');

    // 1. Get existing permissions for 'Staff' to copy to 'Nhân viên'
    const staffRef = doc(db, 'roles', 'staff'); // Assuming ID is 'staff' or similar? Need to check IDs.
    // Actually, let's fetch all and find by name to be safe
    const { collection, getDocs } = await import('firebase/firestore');
    const snapshot = await getDocs(collection(db, 'roles'));
    const roles = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const staffRole = roles.find(r => r.name === 'Staff');
    const adminRole = roles.find(r => r.name === 'Admin');

    if (!staffRole) {
        console.error('❌ Staff role not found in collection!');
    } else {
        // Add "Nhân viên" role
        const nhanVienRef = doc(db, 'roles', 'nhan_vien');
        await setDoc(nhanVienRef, {
            name: 'Nhân viên',
            permissions: staffRole.permissions,
            description: 'Employees (Vietnamese)'
        });
        console.log('✅ Added "Nhân viên" role.');
    }

    if (adminRole) {
        // Update Admin permissions
        const newPerms = [...new Set([...adminRole.permissions, 'settings.edit'])];
        const adminRef = doc(db, 'roles', adminRole.id);
        await setDoc(adminRef, {
            ...adminRole,
            permissions: newPerms
        });
        console.log('✅ Updated "Admin" permissions with settings.edit');
    } else {
        console.error('❌ Admin role not found!');
    }

    process.exit(0);
}

updateRoles();

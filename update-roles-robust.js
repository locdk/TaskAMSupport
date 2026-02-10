import { doc, getDocs, setDoc, collection } from 'firebase/firestore';
import { db } from './src/firebase.js';

async function updateRoles() {
    console.log('🔄 Updating Roles (Robust)...');

    try {
        const snapshot = await getDocs(collection(db, 'roles'));
        const roles = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        console.log(`Found ${roles.length} roles.`);

        // 1. Fix Admin
        const adminRole = roles.find(r => r.name === 'Admin');
        if (adminRole) {
            console.log('Found Admin:', adminRole.id);
            const currentPerms = Array.isArray(adminRole.permissions) ? adminRole.permissions : [];
            if (!currentPerms.includes('settings.edit')) {
                const newPerms = [...currentPerms, 'settings.edit'];
                await setDoc(doc(db, 'roles', adminRole.id), {
                    ...adminRole,
                    permissions: newPerms
                });
                console.log('✅ Updated Admin with settings.edit');
            } else {
                console.log('ℹ️ Admin already has settings.edit');
            }
        } else {
            console.error('❌ Admin role NOT found!');
        }

        // 2. Add/Fix "Nhân viên"
        const staffRole = roles.find(r => r.name === 'Staff');
        const nhanVienRole = roles.find(r => r.name === 'Nhân viên');

        if (staffRole) {
            console.log('Found Staff:', staffRole.id);
            const staffPerms = Array.isArray(staffRole.permissions) ? staffRole.permissions : [];

            // If "Nhân viên" doesn't exist, or we want to overwrite to ensure it helps
            // Use a fixed ID 'nhan_vien' or the existing ID if found
            const targetId = nhanVienRole ? nhanVienRole.id : 'nhan_vien';
            const targetName = 'Nhân viên';

            await setDoc(doc(db, 'roles', targetId), {
                name: targetName,
                permissions: staffPerms, // Copy from Staff
                description: 'Employees (Vietnamese)',
                order: 99 // Put at end
            });
            console.log(`✅ Ensured "${targetName}" role exists with ${staffPerms.length} permissions.`);

        } else {
            console.error('❌ Staff role NOT found! Cannot copy permissions.');
        }

    } catch (e) {
        console.error('❌ Script failed:', e);
    }

    process.exit(0);
}

updateRoles();

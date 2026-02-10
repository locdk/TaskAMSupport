import { updateRole, addRole, deleteRole } from './src/services/firestoreAPI.js';

async function testSaveRole() {
    console.log('🧪 Testing Role Save...');

    // 1. Create a dummy role with proper array permissions
    const dummyRole = {
        id: 'test-role-' + Date.now(),
        name: 'Test Role Sanitized',
        permissions: ['tasks.view_all', 'settings.edit'] // Array
    };

    try {
        // 2. Add
        console.log('Adding role...');
        await addRole(dummyRole);
        console.log('✅ Added role');

        // 3. Update
        console.log('Updating role...');
        const updatedRole = { ...dummyRole, permissions: [] }; // Empty array
        await updateRole(updatedRole);
        console.log('✅ Updated role with empty array');

        // 4. Delete
        console.log('Deleting role...');
        await deleteRole(dummyRole.id);
        console.log('✅ Deleted role');

    } catch (error) {
        console.error('❌ Error during role save test:', error);
        process.exit(1);
    }
    process.exit(0);
}

testSaveRole();

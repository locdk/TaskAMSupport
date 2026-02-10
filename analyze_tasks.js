import fs from 'fs';

try {
    const data = fs.readFileSync('db.json', 'utf8');
    const db = JSON.parse(data);
    const tasks = db.tasks || [];

    const totalCompleted = tasks.filter(t => t.status === 'Hoàn thành' && !t.deletePending).length;

    // Đếm task design
    const designCompleted = tasks.filter(t =>
        t.status === 'Hoàn thành' &&
        !t.deletePending &&
        (t.source || '').toLowerCase() === 'design'
    ).length;

    // Đếm task thường (không phải design)
    const normalCompleted = tasks.filter(t =>
        t.status === 'Hoàn thành' &&
        !t.deletePending &&
        (t.source || '').toLowerCase() !== 'design'
    ).length;

    console.log('--- PHÂN TÍCH DỮ LIỆU DB.JSON ---');
    console.log(`Tổng số task 'Hoàn thành' (không tính đã xóa): ${totalCompleted}`);
    console.log(`- Task Design hoàn thành: ${designCompleted}`);
    console.log(`- Task Thường hoàn thành: ${normalCompleted}`);
    console.log('-----------------------------------');

    // Kiểm tra trùng lặp ID
    const idCounts = {};
    const duplicateIds = [];
    tasks.forEach(t => {
        idCounts[t.id] = (idCounts[t.id] || 0) + 1;
        if (idCounts[t.id] === 2) duplicateIds.push(t.id);
    });

    console.log(`Số lượng Task bị trùng ID: ${duplicateIds.length}`);
    if (duplicateIds.length > 0) {
        console.log(`Các ID trùng: ${duplicateIds.join(', ')}`);
    }

} catch (err) {
    console.error('Lỗi khi đọc file:', err);
}

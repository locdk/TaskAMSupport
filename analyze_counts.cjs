
const fs = require('fs');

try {
    const data = fs.readFileSync('db.json', 'utf8');
    const db = JSON.parse(data);
    const tasks = db.tasks || [];

    const activeTasks = tasks.filter(t => !t.deletePending && t.status !== 'Hoàn thành');
    console.log(`Total Active Tasks: ${activeTasks.length}`);

    // Check if 217 matches specific filtering criteria
    const designTasks = activeTasks.filter(t => (t.source || '').toLowerCase() === 'design');
    const normalTasks = activeTasks.filter(t => (t.source || '').toLowerCase() !== 'design');

    console.log(`Active Design Tasks: ${designTasks.length}`);
    console.log(`Active Normal Tasks: ${normalTasks.length}`);

} catch (err) {
    console.error(err);
}

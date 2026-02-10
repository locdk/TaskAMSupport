const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

const parseDate = (val) => {
    if (!val) return null;
    if (typeof val === 'number') return new Date(val);
    const dateMatch = val.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
        const [_, d, m, y] = dateMatch;
        return new Date(y, m - 1, d);
    }
    return new Date(val);
};

const isJanuary2026 = (date) => {
    return date && date.getMonth() === 0 && date.getFullYear() === 2026;
};

const personnel = db.personnel || [];
const teamPersonnel = personnel.filter(p => {
    const pTeam = (p.parentTeam || p.team || '').toLowerCase();
    const isDesigner = (p.team || '').toLowerCase() === 'designer';
    const isChris = p.name === 'Chris';
    return pTeam === 'mkt support' && !isDesigner && !isChris;
});
const teamIds = new Set(teamPersonnel.map(p => p.id));

const allJanReceived = db.tasks.filter(t => {
    if (t.source === 'design') return false;
    const idMatch = t.id?.toString().match(/TASK-(\d+)$/);
    if (!idMatch) return false;
    const date = new Date(parseInt(idMatch[1]));
    return isJanuary2026(date);
});

console.log("Total Tasks Received (Created) in Jan (excluding Design):", allJanReceived.length);

const byAssignee = {};
allJanReceived.forEach(t => {
    const name = t.assignee?.name || 'Unassigned';
    const id = t.assignee?.id || 'none';
    const key = `${name} (${id})`;
    byAssignee[key] = (byAssignee[key] || 0) + 1;
});

console.log("Received Tasks in Jan by Assignee:");
console.log(JSON.stringify(byAssignee, null, 2));

const reportedReceived = allJanReceived.filter(t => t.assignee && teamIds.has(t.assignee.id));
console.log("Received Tasks in Jan (Reported - Team only):", reportedReceived.length);


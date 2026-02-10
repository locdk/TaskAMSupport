
const fs = require('fs');

try {
    const data = fs.readFileSync('db.json', 'utf8');
    const db = JSON.parse(data);
    const tasks = db.tasks || [];

    // Chris: "Chris"
    const uName = "chris";

    const getStr = (val) => {
        if (!val) return '';
        if (typeof val === 'string') return val.trim().toLowerCase();
        if (val.name) return val.name.trim().toLowerCase();
        return '';
    };

    let count = 0;

    console.log("Checking dangerous 'uName includes v' matches for Chris...");

    tasks.forEach(t => {
        // Ignore deleted
        if (t.deletePending) return;

        const amVal = getStr(t.am);
        const supportVal = getStr(t.support);
        const assigneeVal = getStr(t.assignee);
        const vals = [amVal, supportVal, assigneeVal].filter(v => v);

        vals.forEach(v => {
            if (uName.includes(v) && v !== uName) {
                console.log(`DANGEROUS MATCH: Task[${t.name}] Value[${v}] is substring of [${uName}]`);
                count++;
            }
        });

    });

    console.log(`Total dangerous matches: ${count}`);

    // Check Completed tasks count for Chris
    const chrisTasks = tasks.filter(t => {
        if (t.deletePending) return false;
        // Logic from app
        const cEmail = "chris.duong@macusaone.com";
        const ePrefix = "chris.duong";

        const isUserMatch = (val) => {
            const v = getStr(val);
            if (!v) return false;
            // ... standard matches ...
            if (v === uName) return true;
            if (v === cEmail) return true;
            return false;
        };

        const author = (t.createdBy || t.author || '').toLowerCase();

        return isUserMatch(t.am) || isUserMatch(t.support) || isUserMatch(t.assignee) || author === cEmail;
    });

    console.log(`Total Chris Tasks (Completed + Active) Exact Match: ${chrisTasks.length}`);
    console.log(`- Active: ${chrisTasks.filter(t => t.status !== 'Hoàn thành').length}`);
    console.log(`- Completed: ${chrisTasks.filter(t => t.status === 'Hoàn thành').length}`);

} catch (err) {
    console.error(err);
}

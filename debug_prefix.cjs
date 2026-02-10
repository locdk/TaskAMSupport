
const fs = require('fs');

try {
    const data = fs.readFileSync('db.json', 'utf8');
    const db = JSON.parse(data);
    const tasks = db.tasks || [];

    // Chris
    const cEmail = "chris.duong@macusaone.com";
    const ePrefix = "chris.duong"; // "chris.duong"

    const getStr = (val) => {
        if (!val) return '';
        if (typeof val === 'string') return val.trim().toLowerCase();
        if (val.name) return val.name.trim().toLowerCase();
        if (val.id) return val.id.toLowerCase();
        return '';
    };

    let count = 0;

    console.log(`Checking 'ePrefix.includes(v)' logic for prefix: ${ePrefix}`);

    tasks.forEach(t => {
        if (t.deletePending) return;

        const vals = [t.am, t.support, t.assignee].map(getStr).filter(v => v);

        let matched = false;
        vals.forEach(v => {
            // The problematic logic line from TaskManagement.jsx
            // if (ePrefix && (v.includes(ePrefix) || ePrefix.includes(v)))

            if (ePrefix.includes(v) && v !== ePrefix) {
                console.log(`[${t.id}] Prefix '${ePrefix}' includes value '${v}' (from ${t.am}/${t.support}/${t.assignee?.name})`);
                matched = true;
            }
        });

        if (matched) count++;
    });

    console.log(`Total tasks matching via reverse prefix inclusion: ${count}`);

} catch (err) {
    console.error(err);
}

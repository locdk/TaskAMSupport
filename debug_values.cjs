
const fs = require('fs');

try {
    const data = fs.readFileSync('db.json', 'utf8');
    const db = JSON.parse(data);
    const tasks = db.tasks || [];

    const ePrefix = "chris.duong";
    const cEmail = "chris.duong@macusaone.com";

    // Collect all AM/Support values
    const uniqueVals = new Set();
    tasks.forEach(t => {
        if (t.am) uniqueVals.add(t.am);
        if (t.support) uniqueVals.add(t.support);
        if (t.assignee) {
            if (typeof t.assignee === 'string') uniqueVals.add(t.assignee);
            else if (t.assignee.name) uniqueVals.add(t.assignee.name);
        }
    });

    console.log("Unique AM/Support/Assignee values in DB:", uniqueVals.size);

    // Check which ones match 'chris.duong' via substring
    console.log(`Checking if prefix '${ePrefix}' includes any of these values...`);

    let badMatches = 0;
    uniqueVals.forEach(val => {
        if (!val) return;
        const v = String(val).trim().toLowerCase();
        if (!v) return;

        // Exact Logic
        if (v !== ePrefix && ePrefix.includes(v)) {
            console.log(`DANGEROUS MATCH: '${ePrefix}' includes '${v}'`);
            badMatches++;
        }
    });

    console.log(`Total dangerous value types: ${badMatches}`);

} catch (err) {
    console.error(err);
}

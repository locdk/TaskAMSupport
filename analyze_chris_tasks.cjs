
const fs = require('fs');

try {
    const data = fs.readFileSync('db.json', 'utf8');
    const db = JSON.parse(data);
    const tasks = db.tasks || [];
    const personnel = db.personnel || [];

    // Simulate Chris User
    let chrisUser = personnel.find(p => p.email === 'chris.duong@macusaone.com');
    if (!chrisUser) {
        chrisUser = { id: 'P-1769291546205-205', name: 'Chris', email: 'chris.duong@macusaone.com' };
    }

    // EXACT Logic from TaskManagement.jsx (Step 1091/1094)
    const matchesMyTaskCountFilter = (t, user) => {
        if (!t || t.deletePending || t.status === 'Hoàn thành') return false;

        const cEmail = (user.email || '').toLowerCase();
        const uName = (user.name || '').trim().toLowerCase();
        const uId = (user.id || '').toLowerCase();
        const ePrefix = cEmail.split('@')[0];

        const getStr = (val) => {
            if (!val) return '';
            if (typeof val === 'string') return val.trim().toLowerCase();
            if (val.name) return val.name.trim().toLowerCase();
            if (val.id) return val.id.toLowerCase();
            return '';
        };

        const isUserMatch = (val, fieldName) => {
            const v = getStr(val);
            if (!v) return false;

            if (uId && v === uId) return { match: true, reason: 'ID Match' };

            if (uName) {
                if (v.includes(uName)) return { match: true, reason: `v(${v}) includes uName(${uName})` };
                // DANGEROUS ONE: uName includes v
                if (uName.includes(v)) return { match: true, reason: `uName(${uName}) includes v(${v})` };

                const nameParts = uName.split(/\s+/).filter(p => p.length > 2);
                for (const p of nameParts) if (v.includes(p)) return { match: true, reason: `v(${v}) includes part(${p})` };

                const vParts = v.split(/\s+/).filter(p => p.length > 2);
                for (const p of vParts) if (uName.includes(p)) return { match: true, reason: `uName(${uName}) includes vPart(${p})` };
            }

            if (v === cEmail) return { match: true, reason: 'Email Exact' };
            if (ePrefix && (v.includes(ePrefix) || ePrefix.includes(v))) return { match: true, reason: 'Email Prefix' };

            if (v === 'nancy' && (cEmail.includes('nancy') || uName.includes('nancy'))) return { match: true, reason: 'Nancy Fallback' };

            return false;
        };

        const authorEmail = (t.createdBy || t.author || '').toLowerCase();

        // Check fields
        let res = isUserMatch(t.am, 'am');
        if (res && res.match) return `AM: ${res.reason}`;

        res = isUserMatch(t.support, 'support');
        if (res && res.match) return `Support: ${res.reason}`;

        res = isUserMatch(t.assignee, 'assignee');
        if (res && res.match) return `Assignee: ${res.reason}`;

        if (authorEmail === cEmail) return 'Author Match';

        return false;
    };

    let count = 0;
    const reasons = {};
    const suspiciousMatches = [];

    console.log(`Analyzing tasks for Chris (${chrisUser.name}, ${chrisUser.email})...`);

    tasks.forEach(t => {
        const matchReason = matchesMyTaskCountFilter(t, chrisUser);
        if (matchReason) {
            count++;
            reasons[matchReason] = (reasons[matchReason] || 0) + 1;

            // Log matching details if it seems "weird" (e.g. includes v)
            // Or log everything to be sure
            suspiciousMatches.push(`[${t.id}] ${t.name} -> ${matchReason}`);
        }
    });

    console.log('--- RESULT ---');
    console.log(`Total 'My Tasks' for Chris: ${count}`);
    console.log('Breakdown by reason:');
    // Aggregate reasons
    const aggReasons = {};
    suspiciousMatches.forEach(msg => {
        const reason = msg.split('->')[1].trim();
        aggReasons[reason] = (aggReasons[reason] || 0) + 1;
    });
    console.log(aggReasons);

    if (suspiciousMatches.length > 0) {
        console.log('\n--- MATCH SAMPLE (First 50) ---');
        console.log(suspiciousMatches.slice(0, 50).join('\n'));
    }

} catch (err) {
    console.error('Error:', err);
}

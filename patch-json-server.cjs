const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'node_modules', 'json-server', 'lib', 'app.js');

if (fs.existsSync(targetFile)) {
    let content = fs.readFileSync(targetFile, 'utf8');

    // Check if any patch is already applied by looking for payloadLimit
    const isPatched = content.includes('payloadLimit:');

    const newCode = `    app.use((req, res, next) => {
        if (req.method === 'PATCH' || req.method === 'POST' || req.method === 'PUT') {
            const contentLength = req.headers['content-length'];
            console.log(\`Incoming request: \${req.method} \${req.url}, Content-Length: \${contentLength}\`);
        }
        next();
    });
    app.use(json({ payloadLimit: 50 * 1024 * 1024 }));`;

    if (isPatched) {
        console.log('Update: Patching already applied version...');
        // Match the whole block from app.use((req to the end of json({ ... })) or just the json() line
        if (content.includes('app.use((req, res, next) =>')) {
            // Already has logging patch, just update the limit
            content = content.replace(/payloadLimit: \d+ \* 1024 \* 1024/, 'payloadLimit: 50 * 1024 * 1024');
        } else {
            // Has old 10MB patch, replace it with new block
            content = content.replace(/app\.use\(json\(\{ payloadLimit: 10 \* 1024 \* 1024 \}\)\);/, newCode);
        }
        fs.writeFileSync(targetFile, content);
        console.log('Successfully updated json-server payload limit to 50MB.');
    } else if (content.includes('app.use(json());')) {
        console.log('Original: Patching json-server payload limit...');
        content = content.replace('app.use(json());', newCode);
        fs.writeFileSync(targetFile, content);
        console.log('Successfully patched json-server payload limit to 50MB with logging.');
    } else {
        console.log('json-server target line not found.');
    }
} else {
    console.log('json-server/lib/app.js not found. Skipping patch.');
}

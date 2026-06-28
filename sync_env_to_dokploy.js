const fs = require('fs');
const path = require('path');
const https = require('https');

// Extract branch from command line arguments
const branch = process.argv[2] || '';
console.log(`[Dokploy Sync] Pushing branch: ${branch}`);

// Determine which env file to use
let envFile = null;
if (branch === 'main' || branch === 'master' || branch.includes('prod')) {
    envFile = '.env.prod';
} else if (branch === 'dev' || branch.includes('dev')) {
    envFile = '.env.dev';
} else {
    console.log(`[Dokploy Sync] Branch '${branch}' is not a target deployment branch (main/dev). Skipping env sync.`);
    process.exit(0);
}
const envPath = path.join(__dirname, envFile);

if (!fs.existsSync(envPath)) {
    console.error(`[Dokploy Sync] Error: Environment file ${envFile} not found!`);
    process.exit(1);
}

console.log(`[Dokploy Sync] Reading environment variables from ${envFile}...`);
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            envVars[key] = value;
        }
    }
});

const apiKey = envVars['DOKPLOY_API_KEY'];
const dokployUrl = envVars['DOKPLOY_URL'] || 'https://dokploy.dyve.dev';

if (!apiKey) {
    console.error('[Dokploy Sync] Error: DOKPLOY_API_KEY not found in environment file.');
    process.exit(1);
}

// Find all compose IDs starting with DOKPLOY_COMPOSE_ID_
const composeIds = Object.keys(envVars)
    .filter(key => key.startsWith('DOKPLOY_COMPOSE_ID_'))
    .map(key => envVars[key])
    .filter(Boolean);

if (composeIds.length === 0) {
    console.warn('[Dokploy Sync] Warning: No compose IDs found starting with DOKPLOY_COMPOSE_ID_');
    process.exit(0);
}

console.log(`[Dokploy Sync] Found ${composeIds.length} compose stack(s) to synchronize.`);

// Helper function to make request for a specific compose ID
function syncComposeEnv(composeId) {
    return new Promise((resolve) => {
        console.log(`[Dokploy Sync] Syncing to Compose ID: ${composeId}...`);
        
        const payload = JSON.stringify({
            json: {
                composeId,
                env: envContent
            }
        });

        const req = https.request(`${dokployUrl}/api/trpc/compose.update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length,
                'Authorization': `Bearer ${apiKey}`,
                'x-api-key': apiKey
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`[Dokploy Sync] ✅ Success for Compose ID: ${composeId}`);
                    resolve(true);
                } else {
                    console.error(`[Dokploy Sync] ❌ Failed for Compose ID: ${composeId}. Status: ${res.statusCode}`);
                    console.error(`[Dokploy Sync] Response:`, body);
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            console.error(`[Dokploy Sync] ❌ Error requesting Compose ID: ${composeId}: ${err.message}`);
            resolve(false);
        });

        req.write(payload);
        req.end();
    });
}

// Execute sync for all compose IDs sequentially
async function run() {
    let allSuccess = true;
    for (const composeId of composeIds) {
        const success = await syncComposeEnv(composeId);
        if (!success) {
            allSuccess = false;
        }
    }
    
    if (allSuccess) {
        console.log('✅ [Dokploy Sync] All environment variables synchronized successfully!');
        process.exit(0);
    } else {
        console.error('❌ [Dokploy Sync] Some or all environment variables failed to synchronize.');
        process.exit(1);
    }
}

run();

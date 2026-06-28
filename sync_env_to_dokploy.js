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
    console.log(`[Dokploy Sync] Branch '${branch}' is not a target deployment branch (main/dev). Skipping env sync and deploy.`);
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
const mainComposeId = envVars['DOKPLOY_COMPOSE_ID'] || envVars['DOKPLOY_COMPOSE_ID_SC'];
const s3ComposeId = envVars['DOKPLOY_COMPOSE_ID_S3'];

if (!apiKey) {
    console.error('[Dokploy Sync] Error: DOKPLOY_API_KEY not found in environment file.');
    process.exit(1);
}

if (!mainComposeId && !s3ComposeId) {
    console.error('[Dokploy Sync] Error: Neither DOKPLOY_COMPOSE_ID nor DOKPLOY_COMPOSE_ID_S3 found in environment file.');
    process.exit(1);
}

// Function to update env variables
function syncComposeEnv(composeId) {
    return new Promise((resolve) => {
        console.log(`[Dokploy Sync] Syncing env variables to Compose ID: ${composeId}...`);
        
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
                    console.log(`[Dokploy Sync] ✅ Environment variables synced successfully.`);
                    resolve(true);
                } else {
                    console.error(`[Dokploy Sync] ❌ Failed to sync environment variables. Status: ${res.statusCode}`);
                    console.error(`[Dokploy Sync] Response:`, body);
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            console.error(`[Dokploy Sync] ❌ Error syncing environment variables: ${err.message}`);
            resolve(false);
        });

        req.write(payload);
        req.end();
    });
}

// Function to trigger deployment
function triggerDeploy(composeId) {
    return new Promise((resolve) => {
        console.log(`[Dokploy Sync] Triggering deployment for Compose ID: ${composeId} via tRPC API...`);
        
        const payload = JSON.stringify({
            json: {
                composeId
            }
        });

        const req = https.request(`${dokployUrl}/api/trpc/compose.deploy`, {
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
                    console.log(`[Dokploy Sync] ✅ Deployment triggered successfully!`);
                    resolve(true);
                } else {
                    console.error(`[Dokploy Sync] ❌ Failed to trigger deployment. Status: ${res.statusCode}`);
                    console.error(`[Dokploy Sync] Response:`, body);
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            console.error(`[Dokploy Sync] ❌ Error triggering deployment: ${err.message}`);
            resolve(false);
        });

        req.write(payload);
        req.end();
    });
}

async function run() {
    if (mainComposeId) {
        console.log(`\n[Dokploy Sync] Deploying Main Compose App (${mainComposeId})...`);
        const syncSuccess = await syncComposeEnv(mainComposeId);
        if (!syncSuccess) process.exit(1);
        
        const deploySuccess = await triggerDeploy(mainComposeId);
        if (!deploySuccess) process.exit(1);
    }
    
    if (s3ComposeId) {
        console.log(`\n[Dokploy Sync] Deploying S3/Backup Compose App (${s3ComposeId})...`);
        const syncSuccess = await syncComposeEnv(s3ComposeId);
        if (!syncSuccess) process.exit(1);
        
        const deploySuccess = await triggerDeploy(s3ComposeId);
        if (!deploySuccess) process.exit(1);
    }
    
    console.log('\n🎉 [Dokploy Sync & Deploy] All tasks completed successfully!');
    process.exit(0);
}

run();

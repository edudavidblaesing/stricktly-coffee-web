const fs = require('fs');
const path = require('path');
const https = require('https');

// Check both .env.prod and local .env
let envVars = {};
const envPaths = [
  path.join(__dirname, '.env.prod'),
  path.join(__dirname, '.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
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
    break;
  }
}

const cfToken = envVars['CLOUDFLARE_API_TOKEN'];
const cfZoneId = envVars['CLOUDFLARE_ZONE_ID'];

if (!cfToken || !cfZoneId) {
  console.error('❌ Error: CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID not found in .env.prod or .env.');
  process.exit(1);
}

// Helper to make HTTPS requests to Cloudflare API
function makeRequest(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(`https://api.cloudflare.com/client/v4${urlPath}`, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message}. Raw: ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  try {
    console.log('🌐 [Cloudflare SSL Config] Adjusting SSL edge settings via API...');

    // 1. Set SSL mode to "full"
    console.log('🔒 Setting SSL mode to "Full"...');
    const sslRes = await makeRequest('PATCH', `/zones/${cfZoneId}/settings/ssl`, { value: 'full' });
    if (sslRes.status === 200 && sslRes.data.success) {
      console.log('✅ SSL mode set to Full successfully.');
    } else {
      console.error('❌ Failed to set SSL mode:', sslRes.data);
    }

    // 2. Set Always Use HTTPS to "on"
    console.log('🔄 Enabling Always Use HTTPS redirect...');
    const httpsRedirectRes = await makeRequest('PATCH', `/zones/${cfZoneId}/settings/always_use_https`, { value: 'on' });
    if (httpsRedirectRes.status === 200 && httpsRedirectRes.data.success) {
      console.log('✅ Always Use HTTPS redirect enabled successfully.');
    } else {
      console.error('❌ Failed to enable Always Use HTTPS:', httpsRedirectRes.data);
    }

    // 3. Set Automatic HTTPS Rewrites to "on"
    console.log('⚡ Enabling Automatic HTTPS Rewrites...');
    const rewritesRes = await makeRequest('PATCH', `/zones/${cfZoneId}/settings/automatic_https_rewrites`, { value: 'on' });
    if (rewritesRes.status === 200 && rewritesRes.data.success) {
      console.log('✅ Automatic HTTPS Rewrites enabled successfully.');
    } else {
      console.error('❌ Failed to enable Automatic HTTPS Rewrites:', rewritesRes.data);
    }

    console.log('\n🎉 [Cloudflare SSL Config] Edge certificates configuration completed successfully!');
  } catch (err) {
    console.error('❌ Unexpected error occurred:', err.message);
    process.exit(1);
  }
}

run();

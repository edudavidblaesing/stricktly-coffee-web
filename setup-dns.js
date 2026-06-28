const fs = require('fs');
const path = require('path');
const https = require('https');

const ENV_PATH = path.join(__dirname, '.env.prod');
const TARGET_IP = '159.195.76.181';

if (!fs.existsSync(ENV_PATH)) {
  console.error('Error: .env.prod file not found in root workspace.');
  process.exit(1);
}

// Simple Env Parser
const envContent = fs.readFileSync(ENV_PATH, 'utf8');
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

const cfToken = envVars['CLOUDFLARE_API_TOKEN'];
const cfZoneId = envVars['CLOUDFLARE_ZONE_ID'];
const cfDomain = envVars['CLOUDFLARE_DOMAIN'] || 'stricktlycoffee.be';

if (!cfToken || !cfZoneId) {
  console.error('Error: CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID not found in .env.prod');
  process.exit(1);
}

// Define the 10 target records we need
const targetRecords = [
  { name: cfDomain, type: 'A', content: TARGET_IP, proxied: true },
  { name: `www.${cfDomain}`, type: 'A', content: TARGET_IP, proxied: true },
  { name: `dash.${cfDomain}`, type: 'A', content: TARGET_IP, proxied: true },
  { name: `s3.${cfDomain}`, type: 'A', content: TARGET_IP, proxied: true },
  
  { name: `dev.${cfDomain}`, type: 'A', content: TARGET_IP, proxied: true },
  { name: `www.dev.${cfDomain}`, type: 'A', content: TARGET_IP, proxied: true },
  { name: `dash.dev.${cfDomain}`, type: 'A', content: TARGET_IP, proxied: false },
  { name: `s3.dev.${cfDomain}`, type: 'A', content: TARGET_IP, proxied: false },
  
  { name: `*.${cfDomain}`, type: 'A', content: TARGET_IP, proxied: false },
  { name: `*.dev.${cfDomain}`, type: 'A', content: TARGET_IP, proxied: false }
];

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
    console.log('🌐 [Cloudflare DNS Setup] Fetching existing DNS records...');
    const listRes = await makeRequest('GET', `/zones/${cfZoneId}/dns_records?per_page=100`);
    if (listRes.status !== 200 || !listRes.data.success) {
      console.error('❌ Failed to list DNS records from Cloudflare:', listRes.data);
      process.exit(1);
    }

    const existingRecords = listRes.data.result;
    console.log(`ℹ️ Found ${existingRecords.length} existing DNS records.`);

    for (const target of targetRecords) {
      // Find matching existing record of type A or CNAME (we want to replace/update if matched)
      const existing = existingRecords.find(r => 
        r.name.toLowerCase() === target.name.toLowerCase() && 
        (r.type === 'A' || r.type === 'CNAME')
      );

      if (existing) {
        // If content or proxying is different, update it
        const needsUpdate = existing.content !== target.content || 
                            existing.proxied !== target.proxied || 
                            existing.type !== target.type;

        if (needsUpdate) {
          console.log(`🔄 Updating record for ${target.name} (${existing.type} -> ${target.type}, content: ${existing.content} -> ${target.content}, proxied: ${existing.proxied} -> ${target.proxied})...`);
          const updateRes = await makeRequest('PUT', `/zones/${cfZoneId}/dns_records/${existing.id}`, {
            type: target.type,
            name: target.name,
            content: target.content,
            ttl: 1,
            proxied: target.proxied
          });
          if (updateRes.status === 200 && updateRes.data.success) {
            console.log(`✅ Successfully updated ${target.name}`);
          } else {
            console.error(`❌ Failed to update ${target.name}:`, updateRes.data);
          }
        } else {
          console.log(`✔️ Record for ${target.name} is already up to date.`);
        }
      } else {
        // Create new record
        console.log(`➕ Creating new A record for ${target.name} -> ${target.content} (proxied: ${target.proxied})...`);
        const createRes = await makeRequest('POST', `/zones/${cfZoneId}/dns_records`, {
          type: target.type,
          name: target.name,
          content: target.content,
          ttl: 1,
          proxied: target.proxied
        });
        if (createRes.status === 200 && createRes.data.success) {
          console.log(`✅ Successfully created ${target.name}`);
        } else {
          console.error(`❌ Failed to create ${target.name}:`, createRes.data);
        }
      }
    }

    console.log('\n🎉 [Cloudflare DNS Setup] Configuration run complete!');
  } catch (err) {
    console.error('❌ Unexpected error occurred:', err.message);
    process.exit(1);
  }
}

run();

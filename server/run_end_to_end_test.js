import pg from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '/Users/davidblaesing/sc/.env' });

const { Pool } = pg;
const pool = new Pool({
  host: 'localhost',
  port: 5435,
  database: 'stricktlycoffee',
  user: 'sc_admin',
  password: 'sc_secure_password_local_123',
});

async function run() {
  // 1. Get user for brand pesado585
  const userRes = await pool.query("SELECT email, brand_id, role FROM users WHERE brand_id = 'pesado585' LIMIT 1");
  if (userRes.rows.length === 0) {
    console.error("No pesado585 user found in database!");
    await pool.end();
    return;
  }
  const user = userRes.rows[0];
  console.log("Using user:", user);

  // 2. Generate signed JWT token
  const payload = { email: user.email, role: user.role, brand_id: user.brand_id, time: Date.now() };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const secret = process.env.JWT_SECRET || 'fallback-auth-secret-key-12984-sc';
  const signature = crypto.createHmac('sha256', secret).update(payloadBase64).digest('hex');
  const token = `${payloadBase64}.${signature}`;

  // 3. Make sure Sophia the Barista has a public image URL in the DB brand_canvas and AI tier is professional/free
  const brandRes = await pool.query("SELECT brand_canvas FROM brands WHERE id = 'pesado585'");
  if (brandRes.rows.length > 0 && brandRes.rows[0].brand_canvas) {
    let canvas = JSON.parse(brandRes.rows[0].brand_canvas);
    if (canvas.personas) {
      const sophia = canvas.personas.find(p => p.name === 'Sophia the Barista');
      if (sophia) {
        sophia.image = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600';
      }
    }
    await pool.query(
      "UPDATE brands SET brand_canvas = $1, ai_tier = 'professional', ai_free_tier = true WHERE id = 'pesado585'",
      [JSON.stringify(canvas)]
    );
    console.log("Updated Sophia the Barista's image and set brand ai_tier='professional' in DB.");
  }

  // 4. Test 1: Non-composite request with Identity Lock, Best-of-2, and Upscaler
  console.log("\n--- Triggering Test 1 (Identity Lock, Best-of-2, Candidate Judge, Upscaler) ---");
  const test1Payload = {
    action: 'generate',
    prompt: 'Sophia the Barista holding a modular precision tamper, close up studio shot',
    personaName: 'Sophia the Barista',
    bestOf: 2,
    draft: false,
    backend: 'flux-pro',
    aspectRatio: '1:1',
  };

  try {
    const res = await fetch('http://localhost:3000/api/global/media/ai-studio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-brand-id': 'pesado585',
      },
      body: JSON.stringify(test1Payload),
    });
    console.log("Test 1 Status:", res.status);
    const data = await res.json();
    console.log("Test 1 Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Test 1 failed:", err);
  }

  // 5. Test 2: Composite request with Advanced Pipeline
  console.log("\n--- Triggering Test 2 (Advanced Pipeline, Upscaler) ---");
  const test2Payload = {
    action: 'generate',
    prompt: 'A rigid modular precision tamper on a table',
    productImageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600',
    sceneryImageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600',
    draft: false,
    backend: 'flux-pro',
    aspectRatio: '1:1',
  };

  try {
    const res = await fetch('http://localhost:3000/api/global/media/ai-studio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-brand-id': 'pesado585',
      },
      body: JSON.stringify(test2Payload),
    });
    console.log("Test 2 Status:", res.status);
    const data = await res.json();
    console.log("Test 2 Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Test 2 failed:", err);
  }

  await pool.end();
}

run().catch(console.error);

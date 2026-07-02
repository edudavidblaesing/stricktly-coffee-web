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

  // 3. Backup product images and set them to null
  const products = await pool.query("SELECT id, image FROM products WHERE brand_id = 'pesado585'");
  console.log("Backing up products images:", products.rows);
  await pool.query("UPDATE products SET image = null WHERE brand_id = 'pesado585'");
  console.log("Temporarily set product images to null to trigger non-composite flow.");

  // 4. Update Sophia's image in brand_canvas to a public URL and set professional tier
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
  }

  // 5. Trigger Non-Composite Request
  console.log("\n--- Triggering Non-Composite Test (Identity Lock, Best-of-2, Candidate Judge, Upscaler) ---");
  const testPayload = {
    action: 'generate',
    prompt: 'Candid photo of Sophia the Barista smiling in a modern cafe',
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
      body: JSON.stringify(testPayload),
    });
    console.log("Response Status:", res.status);
    const data = await res.json();
    console.log("Response Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Non-composite generation request failed:", err);
  }

  // 6. Restore product images
  console.log("\nRestoring product images from backup...");
  for (const prod of products.rows) {
    await pool.query("UPDATE products SET image = $1 WHERE id = $2", [prod.image, prod.id]);
  }
  console.log("Restored product images successfully.");

  await pool.end();
}

run().catch(console.error);

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
  const userRes = await pool.query("SELECT email, brand_id, role FROM users LIMIT 10");
  console.log("Users in DB:", userRes.rows);
  if (userRes.rows.length === 0) {
    console.log("No user found.");
    await pool.end();
    return;
  }
  const user = userRes.rows.find(u => u.brand_id) || userRes.rows[0];
  console.log("Using user:", user);

  const payload = { email: user.email, role: user.role, brand_id: user.brand_id, time: Date.now() };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const secret = process.env.JWT_SECRET || 'fallback-auth-secret-key-12984-sc';
  const signature = crypto.createHmac('sha256', secret).update(payloadBase64).digest('hex');
  const token = `${payloadBase64}.${signature}`;

  const brandRes = await pool.query("SELECT * FROM brands WHERE id = $1", [user.brand_id]);
  const brand = brandRes.rows[0];
  console.log("Found brand:", brand);

  const mockPayload = {
    ...brand,
    ai_tier: 'professional',
    subscription_billing_method: 'stripe_card',
  };

  try {
    const res = await fetch('http://localhost:3000/api/global/brands', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(mockPayload),
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Fetch failed:", err);
  }

  await pool.end();
}

run().catch(console.error);

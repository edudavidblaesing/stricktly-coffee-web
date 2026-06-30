import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const { Pool } = pg;
const pool = new Pool({
  host: 'localhost',
  port: 5435,
  database: process.env.DB_NAME || 'stricktlycoffee',
  user: process.env.DB_USER || 'sc_admin',
  password: process.env.DB_PASSWORD || 'sc_secure_password_local_123',
});

async function run() {
  const { rows } = await pool.query('SELECT id, name, subdomain, custom_domain FROM brands');
  console.log('Brands:', JSON.stringify(rows, null, 2));
  await pool.end();
}

run().catch(console.error);

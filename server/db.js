import pg from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const { Pool } = pg;

// Connection config matching safety parameters
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'stricktlycoffee',
  user: process.env.DB_USER || 'sc_admin',
  password: process.env.DB_PASSWORD || 'sc_secure_password_local_123',
};

console.log(`[Database] Connecting to PostgreSQL at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} as ${dbConfig.user}`);

const pool = new Pool(dbConfig);

// Initialize DB schema and seed default Pesado store configurations
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create Brands Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(255) UNIQUE NOT NULL,
        shopify_shop_name VARCHAR(255),
        shopify_access_token VARCHAR(255),
        stripe_secret_key VARCHAR(255),
        stripe_webhook_secret VARCHAR(255),
        contact_email VARCHAR(255),
        primary_color VARCHAR(50) DEFAULT '#c5a059',
        cloudflare_dns_record_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure migration columns exist on legacy databases
    await client.query(`
      ALTER TABLE brands ADD COLUMN IF NOT EXISTS cloudflare_dns_record_id VARCHAR(255)
    `);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo TEXT`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS favicon TEXT`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255)`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS cloudflare_custom_domain_dns_record_id VARCHAR(255)`);

    // 2. Create Products Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'EUR',
        image TEXT,
        description TEXT,
        tag VARCHAR(50),
        original_link TEXT,
        long_description TEXT,
        features TEXT, -- JSON string array
        compatibility TEXT, -- JSON string array
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create Orders Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(100) PRIMARY KEY,
        brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE SET NULL,
        stripe_session_id VARCHAR(255) UNIQUE,
        shopify_order_id VARCHAR(255),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        shipping_address TEXT, -- JSON string
        items TEXT, -- JSON string
        subtotal NUMERIC(10, 2),
        total NUMERIC(10, 2),
        status VARCHAR(50) DEFAULT 'pending_payment',
        tracking_number VARCHAR(100),
        tracking_carrier VARCHAR(100),
        tracking_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Create Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE SET NULL;
    `);

    await client.query('COMMIT');
    console.log('✅ PostgreSQL database tables initialized successfully.');

    // Seed Default Pesado Brand Configuration and Products
    await seedDefaultData();

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to migrate database tables:', err.message);
  } finally {
    client.release();
  }
}

async function seedDefaultData() {
  // Check if default 'pesado' brand exists
  const brandCheck = await getQuery('SELECT id FROM brands WHERE id = $1', ['pesado']);
  if (!brandCheck) {
    console.log('[Database Seed] Inserting default Pesado brand configuration...');
    // Seed default settings leveraging existing process env details
    await runQuery(`
      INSERT INTO brands (id, name, subdomain, shopify_shop_name, shopify_access_token, stripe_secret_key, stripe_webhook_secret, contact_email, primary_color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      'pesado',
      'Pesado 58.5',
      'pesado.stricktlycoffee.be',
      process.env.SHOPIFY_SHOP_NAME || '',
      process.env.SHOPIFY_ACCESS_TOKEN || '',
      process.env.STRIPE_SECRET_KEY || '',
      process.env.STRIPE_WEBHOOK_SECRET || '',
      'support@stricktlycoffee.be',
      '#c5a059'
    ]);
  }

  // Check if products exist for 'pesado'
  const productCount = await getQuery('SELECT COUNT(*) as count FROM products WHERE brand_id = $1', ['pesado']);
  if (parseInt(productCount.count, 10) === 0) {
    console.log('[Database Seed] Seeding products for Pesado brand...');

    const productsToSeed = [
      {
        title: "High Diffusion Espresso Shower Screen",
        price: 60.50,
        image: "https://pesado585.com/cdn/shop/files/LMHD_a20fcda8-4b93-430c-ba92-da68aac7be98.jpg?v=1757481591",
        description: "Introducing the Pesado High Diffusion Shower Screen. This HD espresso shower screen is designed for precision, ensuring consistency in every shot. Fits E61, La Marzocco, and standard 58mm group heads.",
        tag: "Best Seller",
        original_link: "https://pesado585.com/collections/best-sellers/products/pesado-hd-high-diffusion-shower-screen",
        long_description: "The Pesado HD (High Diffusion) Shower Screen is a precision-engineered upgrade designed to optimize water distribution across the coffee puck, eliminating weak spots and preventing channeling.",
        features: JSON.stringify([
          "18 Targeted Channels: Precisely cut channels deliver a balanced and uniform flow.",
          "Edge-to-Edge Coverage: Saturation extends to the very edges of the basket.",
          "High-Quality 304 Stainless Steel: Offers durability and easy maintenance.",
          "E61 and LM Variants available for all standard commercial-style machines."
        ]),
        compatibility: JSON.stringify([
          "La Marzocco (Linea Mini, GS3, Strada)",
          "Synesso Machines",
          "E61 Group Heads (Lelit Bianca, Ascaso Steel)"
        ])
      },
      {
        title: "Magnetic Espresso Dosing Ring",
        price: 24.75,
        image: "https://pesado585.com/cdn/shop/files/Pesado54mmMagneticDosingRing.png?v=1740032571",
        description: "Upgrade your coffee game with our Magnetic Espresso Dosing Ring. It's the efficient and effective way to dose for maximum preparation, preventing messy spills and ensuring all grounds end up in the portafilter.",
        tag: "Essential",
        original_link: "https://pesado585.com/collections/best-sellers/products/dosing-ring",
        long_description: "The Pesado Dosing Ring is a premium accessory designed to prevent coffee waste and spills during the grinding and distribution phases of espresso puck prep.",
        features: JSON.stringify([
          "Magnetic Snap-On Base: Securely locks to your portafilter basket.",
          "Adjustable Collar Height: Unique adjustable depth ensures a flush fit with any grinder.",
          "Sleek Anodized Finish: Durable, aesthetic design in standard black and white gloss.",
          "Perfect for WDT: Acts as a containment barrier for intensive distribution techniques."
        ]),
        compatibility: JSON.stringify([
          "Standard 58mm Portafilters",
          "54mm Portafilters (Breville, Sage, etc.)"
        ])
      },
      {
        title: "Spring-Loaded Self-Leveling Tamper",
        price: 132.00,
        image: "https://pesado585.com/cdn/shop/files/ADTamperFrontOpen.png?v=1734500064",
        description: "In collaboration with 2022 World Barista Champion Anthony Douglas, we created a self-leveling spring-loaded tamper worthy of barista championships. Perfect consistency and level every single time.",
        tag: "AD Edition",
        original_link: "https://pesado585.com/collections/tamper/products/self-leveling-spring-tamper",
        long_description: "Crafted in partnership with 2022 World Barista Champion Anthony Douglas, this spring-loaded self-leveling tamper ensures consistent, level, and flat tamping pressure to eliminate human error.",
        features: JSON.stringify([
          "Self-Leveling Mechanism: Aligns automatically flat against the basket rim.",
          "Spring-Loaded Consistency: Deliver the exact calibrated pressure with every press.",
          "58.5mm Precision Base: Sharp 90-degree edge prevents residual coffee rings.",
          "Champion-Class Ergonomics: Handle contoured for the palm, thumb, and forefinger."
        ]),
        compatibility: JSON.stringify([
          "E61 and commercial 58mm filter baskets",
          "Precision baskets (IMS, VST, Pesado)"
        ])
      },
      {
        title: "High Diffusion Espresso Shower Screen - Breville",
        price: 55.00,
        image: "https://pesado585.com/cdn/shop/files/BREVILLEHIGHDIFFUSION_79fa8dc9-5393-490c-86b4-a8726e133756.jpg?v=1774927374",
        description: "Precision Coffee tools for all barista levels. Designed specifically for Breville/Sage 54mm group heads to ensure perfect water distribution and prevent channeling.",
        tag: "New Release",
        original_link: "https://pesado585.com/products/high-diffusion-espresso-shower-screen-breville",
        long_description: "The Pesado High Diffusion (HD) Espresso Shower Screen for Breville/Sage is specifically designed to bring commercial-grade water distribution and extraction uniformity to home espresso machines.",
        features: JSON.stringify([
          "18 Custom Machined Channels: Distributes water evenly across the entire puck.",
          "Wall-to-Wall Coverage: Prevents dry spots or under-extracted borders.",
          "Drier Puck Discard: Stabilizes pressure for clean, solid coffee puck removal.",
          "Grade 304 Stainless Steel: Durable, rust-resistant, and easily cleaned."
        ]),
        compatibility: JSON.stringify([
          "Breville/Sage 54mm (Bambino, Bambino Plus, Barista Pro, Barista Touch)",
          "Breville/Sage 58mm Dual Boiler/Oracle (with included MV-HD set replacement plate)"
        ])
      }
    ];

    for (const prod of productsToSeed) {
      await runQuery(`
        INSERT INTO products (brand_id, title, price, currency, image, description, tag, original_link, long_description, features, compatibility)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        'pesado',
        prod.title,
        prod.price,
        'EUR',
        prod.image,
        prod.description,
        prod.tag,
        prod.original_link,
        prod.long_description,
        prod.features,
        prod.compatibility
      ]);
    }
    console.log('✅ Default products seeded successfully.');
  }

  // Seed Superadmin user
  const adminCheck = await getQuery('SELECT id FROM users WHERE email = $1', ['sc@davidblaesing.com']);
  if (!adminCheck) {
    console.log('[Database Seed] Seeding default superadmin user sc@davidblaesing.com...');
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'TheKey4u';
    const passwordHash = crypto.createHash('sha256').update(defaultPassword).digest('hex');
    await runQuery(`
      INSERT INTO users (email, password_hash, role)
      VALUES ($1, $2, $3)
    `, ['sc@davidblaesing.com', passwordHash, 'superadmin']);
  }

  // Seed default Merchant Operator
  const merchantCheck = await getQuery('SELECT id FROM users WHERE email = $1', ['merchant@davidblaesing.com']);
  if (!merchantCheck) {
    console.log('[Database Seed] Seeding default merchant user merchant@davidblaesing.com context...');
    const passwordHash = crypto.createHash('sha256').update('TheKey4u').digest('hex');
    await runQuery(`
      INSERT INTO users (email, password_hash, role, brand_id)
      VALUES ($1, $2, $3, $4)
    `, ['merchant@davidblaesing.com', passwordHash, 'merchant', 'pesado']);
  }
}

// Helper query wrappers
export function runQuery(sql, params = []) {
  return pool.query(sql, params);
}

export async function getQuery(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows[0] || null;
}

export async function allQuery(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows;
}

// Trigger initial migration
initializeDatabase().catch((err) => {
  console.error('[Database] Initialization error:', err);
});

export default pool;

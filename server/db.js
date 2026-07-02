import pg from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

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
  let client;
  let retries = 10;
  while (retries > 0) {
    try {
      client = await pool.connect();
      break;
    } catch (err) {
      retries--;
      console.log(`[Database] Connection failed (${err.message}). Retrying in 2 seconds... (${retries} attempts left)`);
      if (retries === 0) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

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
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS custom_subscription_price NUMERIC(10, 2) DEFAULT NULL`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo TEXT`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS favicon TEXT`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS theme_settings TEXT`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255)`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS cloudflare_custom_domain_dns_record_id VARCHAR(255)`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS platform VARCHAR(50) DEFAULT 'shopify'`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS woocommerce_shop_url VARCHAR(255)`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS woocommerce_consumer_key VARCHAR(255)`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS woocommerce_consumer_secret VARCHAR(255)`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft'`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS stripe_enabled BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS languages VARCHAR(255) DEFAULT 'en'`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS marketing_protocol TEXT`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS ai_tier VARCHAR(20) DEFAULT 'professional'`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS ai_free_tier BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS pay_as_you_go_enabled BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS protocol_status VARCHAR(20) DEFAULT 'idle'`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS protocol_error TEXT`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS competitors TEXT`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS auto_find_competitors BOOLEAN DEFAULT TRUE`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS billing_type VARCHAR(50) DEFAULT 'standard'`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS platform_take_rate NUMERIC(5, 4) DEFAULT 0.15`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS price_markup NUMERIC(5, 2) DEFAULT 0.00`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR(255)`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS subscription_billing_method VARCHAR(50) DEFAULT 'ledger'`);
    await client.query(`UPDATE brands SET subscription_billing_method = 'ledger' WHERE subscription_billing_method IS NULL OR subscription_billing_method = ''`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_canvas TEXT`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS active_model VARCHAR(255)`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS meta_pixel_id VARCHAR(255)`);
    await client.query(`UPDATE brands SET meta_pixel_id = 'mock_pixel_' || id WHERE meta_pixel_id IS NULL OR meta_pixel_id = ''`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS google_analytics_id VARCHAR(255)`);
    await client.query(`UPDATE brands SET google_analytics_id = 'mock_ga4_' || id WHERE google_analytics_id IS NULL OR google_analytics_id = ''`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_voice_copy TEXT`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS typography_fonts VARCHAR(255)`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS target_audience_demographics TEXT`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS visual_identity_guidelines TEXT`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS billing_name VARCHAR(255)`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS billing_address TEXT`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS billing_vat VARCHAR(100)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS visual_dna TEXT`);
    await client.query(`ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS modality VARCHAR(20) DEFAULT 'text'`);
    await client.query(`ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE ai_model_pricing ADD COLUMN IF NOT EXISTS flat_rate NUMERIC(10, 6) DEFAULT 0.0`);
    await client.query(`ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS tool VARCHAR(50) DEFAULT 'Generic'`);
    
    // Migrate existing logs by parsing 'operation' into 'tool' and clean 'operation'
    await client.query(`
      UPDATE ai_usage_logs
      SET 
        tool = CASE 
          WHEN operation LIKE 'AI Studio %' THEN 'AI Studio'
          WHEN operation LIKE 'AI Campaign %' THEN 'Campaigns'
          WHEN operation LIKE 'AI Copy %' THEN 'AI Copywriter'
          WHEN operation LIKE 'AI Creative %' THEN 'AI Creative Autopilot'
          WHEN operation LIKE 'Brand Style %' THEN 'Design System'
          WHEN operation LIKE 'Campaign Page %' THEN 'Page Builder'
          WHEN operation LIKE 'Campaign Ad %' THEN 'Ad Creator'
          WHEN operation LIKE 'Brand Protocol %' THEN 'Strategy'
          ELSE 'Generic'
        END,
        operation = CASE 
          WHEN operation LIKE 'AI Studio %' THEN SUBSTRING(operation FROM 11)
          WHEN operation LIKE 'AI Campaign %' THEN SUBSTRING(operation FROM 13)
          WHEN operation LIKE 'AI Copy %' THEN SUBSTRING(operation FROM 9)
          WHEN operation LIKE 'AI Creative %' THEN SUBSTRING(operation FROM 13)
          WHEN operation LIKE 'Brand Style %' THEN SUBSTRING(operation FROM 13)
          WHEN operation LIKE 'Campaign Page %' THEN SUBSTRING(operation FROM 15)
          WHEN operation LIKE 'Campaign Ad %' THEN SUBSTRING(operation FROM 13)
          WHEN operation LIKE 'Brand Protocol %' THEN SUBSTRING(operation FROM 7)
          ELSE operation
        END
      WHERE tool = 'Generic'
    `);

    // Create Agencies Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS agencies (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255) UNIQUE NOT NULL,
        margin_share_ratio NUMERIC(5, 4) DEFAULT 0.5000,
        stripe_connect_account_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Alter Brands Table to reference agencies
    await client.query(`
      ALTER TABLE brands ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50) REFERENCES agencies(id) ON DELETE SET NULL
    `);

    // Alter Users Table to reference agencies
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50) REFERENCES agencies(id) ON DELETE SET NULL
    `);

    // Add white-label billing fields to agencies
    await client.query(`ALTER TABLE agencies ADD COLUMN IF NOT EXISTS is_platform_biller BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE agencies ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT`);
    await client.query(`ALTER TABLE agencies ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT`);
    await client.query(`ALTER TABLE agencies ADD COLUMN IF NOT EXISTS billing_display_name VARCHAR(255)`);
    await client.query(`ALTER TABLE agencies ADD COLUMN IF NOT EXISTS billing_support_email VARCHAR(255)`);
    await client.query(`ALTER TABLE agencies ADD COLUMN IF NOT EXISTS billing_name VARCHAR(255)`);
    await client.query(`ALTER TABLE agencies ADD COLUMN IF NOT EXISTS billing_address TEXT`);
    await client.query(`ALTER TABLE agencies ADD COLUMN IF NOT EXISTS billing_vat VARCHAR(100)`);

    // Create Agency Payout Ledger Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS agency_payout_ledger (
        id SERIAL PRIMARY KEY,
        agency_id VARCHAR(50) REFERENCES agencies(id) ON DELETE CASCADE,
        order_id VARCHAR(100) REFERENCES orders(id) ON DELETE SET NULL,
        gross_amount NUMERIC(10, 2) NOT NULL,
        platform_margin NUMERIC(10, 2) NOT NULL,
        agency_share NUMERIC(10, 2) NOT NULL,
        platform_share NUMERIC(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'unpaid',
        payout_transaction_id VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Invoices Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(50) PRIMARY KEY,
        brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        vat_amount NUMERIC(10, 2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'unpaid',
        pdf_url TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`UPDATE brands SET status = 'active', stripe_enabled = TRUE WHERE id = 'pesado'`);
    await client.query(`UPDATE brands SET status = 'active' WHERE status IS NULL`);
    await client.query(`ALTER TABLE merchant_payout_ledger ADD COLUMN IF NOT EXISTS processing_fee NUMERIC(10, 2) DEFAULT 0.00`);

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

    // Ensure products migration columns exist on legacy databases
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS active INTEGER DEFAULT 1`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS external_id VARCHAR(100)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_details TEXT`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS price_source VARCHAR(20) DEFAULT 'external'`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS translations TEXT`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS details_source VARCHAR(20) DEFAULT 'external'`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2)`);
    await client.query(`UPDATE products SET original_price = price WHERE original_price IS NULL`);
    await client.query(`UPDATE products SET price_source = 'manual', details_source = 'manual' WHERE external_id IS NULL`);
    
    // Inventory & Platform Allocation migrations
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_quantity INTEGER DEFAULT NULL`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_limit INTEGER DEFAULT NULL`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS total_sold INTEGER DEFAULT 0`);

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

    // 5. Add UTM tracking and coupon columns to orders table
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100)`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100)`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100)`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_term VARCHAR(100)`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_content VARCHAR(100)`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(100)`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0.00`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2)`);
    await client.query(`UPDATE orders SET total_amount = total WHERE total_amount IS NULL`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(100) DEFAULT NULL`);

    // Add first_name and last_name columns to users table
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)`);

    // 6. Create Coupons Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id VARCHAR(100) PRIMARY KEY,
        brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE CASCADE,
        code VARCHAR(100) UNIQUE NOT NULL,
        discount_type VARCHAR(50) DEFAULT 'percentage',
        discount_value NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        rules TEXT, -- JSON string storing conditions
        expire_at TIMESTAMP,
        origin_order_id VARCHAR(100) REFERENCES orders(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Create Referral Rules Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS referral_rules (
        brand_id VARCHAR(50) PRIMARY KEY REFERENCES brands(id) ON DELETE CASCADE,
        days_after_delivery INTEGER DEFAULT 3,
        discount_type VARCHAR(50) DEFAULT 'percentage',
        discount_value NUMERIC(10, 2) DEFAULT 10.00,
        expire_days INTEGER DEFAULT 14,
        email_subject TEXT,
        email_body TEXT,
        rules TEXT, -- JSON rulesets
        enabled BOOLEAN DEFAULT TRUE
      )
    `);

    // 8. Create Coupon Emails Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupon_emails (
        id SERIAL PRIMARY KEY,
        brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE CASCADE,
        order_id VARCHAR(100) REFERENCES orders(id) ON DELETE CASCADE,
        customer_email VARCHAR(255) NOT NULL,
        scheduled_for TIMESTAMP NOT NULL,
        sent_at TIMESTAMP,
        coupon_code VARCHAR(100) NOT NULL
      )
    `);

    // 9. Add Attribution and Language columns to orders table
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS first_touch_url TEXT`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_touch_url TEXT`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS referrer TEXT`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS browser_info TEXT`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS attribution_channel VARCHAR(100)`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en'`);

    // 10. Add templates column to referral_rules table
    await client.query(`ALTER TABLE referral_rules ADD COLUMN IF NOT EXISTS templates TEXT`);

    // 11. Add subject and body log columns to coupon_emails table
    await client.query(`ALTER TABLE coupon_emails ADD COLUMN IF NOT EXISTS email_subject TEXT`);
    await client.query(`ALTER TABLE coupon_emails ADD COLUMN IF NOT EXISTS email_body TEXT`);

    // 12. Create Marketing Campaigns Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id VARCHAR(100) PRIMARY KEY,
        brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        budget NUMERIC(10,2) NOT NULL,
        segmentation VARCHAR(100) NOT NULL,
        languages TEXT,
        format VARCHAR(50) NOT NULL,
        ad_copy TEXT,
        headline TEXT,
        media_url TEXT,
        carousel_cards TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add landing page target columns
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS destination_type VARCHAR(50) DEFAULT 'homepage'`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS landing_page_id VARCHAR(100)`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS campaign_type VARCHAR(50) DEFAULT 'manual'`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS custom_url TEXT`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS translations TEXT`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '7 days')`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS budget_type VARCHAR(50) DEFAULT 'lifetime'`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS bidding_strategy VARCHAR(50) DEFAULT 'manual'`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS target_roas NUMERIC(4,2) DEFAULT 4.00`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS performance_history TEXT DEFAULT '[]'`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS automation_rules TEXT DEFAULT '[]'`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS autopilot_enabled BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS dynamic_optimization_enabled BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS ai_cost NUMERIC(10,6) DEFAULT 0.000000`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS campaign_creative_stats (
        id VARCHAR(100) PRIMARY KEY,
        campaign_id VARCHAR(100) REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
        asset_url TEXT,
        headline VARCHAR(255),
        impressions INT DEFAULT 0,
        clicks INT DEFAULT 0,
        conversions INT DEFAULT 0,
        ctr NUMERIC(5,2) DEFAULT 0.00,
        cvr NUMERIC(5,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS campaign_ai_proposals (
        id VARCHAR(100) PRIMARY KEY,
        campaign_id VARCHAR(100) REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
        original_headline TEXT,
        original_ad_copy TEXT,
        proposed_headline TEXT,
        proposed_ad_copy TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      ALTER TABLE campaign_ai_proposals ADD COLUMN IF NOT EXISTS original_budget NUMERIC(10,2);
      ALTER TABLE campaign_ai_proposals ADD COLUMN IF NOT EXISTS proposed_budget NUMERIC(10,2);
      ALTER TABLE campaign_ai_proposals ADD COLUMN IF NOT EXISTS original_media_url TEXT;
      ALTER TABLE campaign_ai_proposals ADD COLUMN IF NOT EXISTS proposed_media_url TEXT;
    `);
    await client.query(`ALTER TABLE campaign_creative_stats ADD COLUMN IF NOT EXISTS tournament_status VARCHAR(50) DEFAULT 'testing'`);

    // Create Media Library Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS media_library (
        id VARCHAR(100) PRIMARY KEY,
        brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        folder VARCHAR(100) DEFAULT 'General',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`ALTER TABLE media_library ADD COLUMN IF NOT EXISTS metadata TEXT`);

    // Create AI Usage Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_usage_logs (
        id SERIAL PRIMARY KEY,
        brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE CASCADE,
        tool VARCHAR(50) DEFAULT 'Generic',
        operation VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        prompt_tokens INTEGER DEFAULT 0,
        completion_tokens INTEGER DEFAULT 0,
        total_tokens INTEGER DEFAULT 0,
        estimated_cost_usd NUMERIC(10, 6) DEFAULT 0.0,
        modality VARCHAR(20) DEFAULT 'text',
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create AI Model Pricing Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_model_pricing (
        model VARCHAR(100) PRIMARY KEY,
        prompt_rate_per_million NUMERIC(10, 4) NOT NULL,
        completion_rate_per_million NUMERIC(10, 4) NOT NULL,
        flat_rate NUMERIC(10, 6) DEFAULT 0.0
      )
    `);

    // Insert Default Gemini and Fal.ai model rates
    await client.query(`
      INSERT INTO ai_model_pricing (model, prompt_rate_per_million, completion_rate_per_million, flat_rate)
      VALUES 
        ('gemini-1.5-pro', 1.25, 5.00, 0.0),
        ('gemini-3.1-pro', 1.25, 5.00, 0.0),
        ('gemini-1.5-flash', 0.075, 0.30, 0.0),
        ('gemini-2.5-flash', 0.075, 0.30, 0.0),
        ('deep-research-pro-preview', 10.00, 40.00, 0.0),
        ('flux-2-flex', 0.0, 0.0, 0.050000),
        ('flux-2-max', 0.0, 0.0, 0.070000),
        ('flux-pro', 0.0, 0.0, 0.040000),
        ('flux-schnell', 0.0, 0.0, 0.003000),
        ('flux', 0.0, 0.0, 0.025000),
        ('luma', 0.0, 0.0, 0.080000),
        ('imagen', 0.0, 0.0, 0.030000),
        ('dalle', 0.0, 0.0, 0.040000),
        ('image-apps-v2/product-holding', 0.0, 0.0, 0.040000),
        ('image-apps-v2/product-photography', 0.0, 0.0, 0.040000),
        ('bria/product-shot', 0.0, 0.0, 0.040000),
        ('sam-3/image', 0.0, 0.0, 0.005000),
        ('iclight-v2', 0.0, 0.0, 0.100000),
        ('flux-2-max/edit', 0.0, 0.0, 0.070000)
      ON CONFLICT (model) DO UPDATE SET flat_rate = EXCLUDED.flat_rate
    `);

    // Create AI Tier Features Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_tier_features (
        tier VARCHAR(20) PRIMARY KEY,
        display_name VARCHAR(100) DEFAULT '',
        monthly_price NUMERIC(10, 2) DEFAULT 0.00,
        yearly_price NUMERIC(10, 2) DEFAULT 0.00,
        products_limit INTEGER DEFAULT 0,
        campaigns_limit INTEGER DEFAULT 0,
        visuals_limit INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT TRUE,
        allow_manuscript BOOLEAN DEFAULT TRUE,
        allow_copywriter BOOLEAN DEFAULT TRUE,
        allow_translator BOOLEAN DEFAULT TRUE,
        allow_seo BOOLEAN DEFAULT TRUE,
        allow_designer BOOLEAN DEFAULT TRUE,
        allow_page_builder BOOLEAN DEFAULT TRUE,
        allow_dynamic_optimization BOOLEAN DEFAULT TRUE
      )
    `);

    // Add new columns to existing table if they don't exist
    await client.query(`ALTER TABLE ai_tier_features ADD COLUMN IF NOT EXISTS display_name VARCHAR(100) DEFAULT ''`);
    await client.query(`ALTER TABLE ai_tier_features ADD COLUMN IF NOT EXISTS monthly_price NUMERIC(10, 2) DEFAULT 0.00`);
    await client.query(`ALTER TABLE ai_tier_features ADD COLUMN IF NOT EXISTS yearly_price NUMERIC(10, 2) DEFAULT 0.00`);
    await client.query(`ALTER TABLE ai_tier_features ADD COLUMN IF NOT EXISTS products_limit INTEGER DEFAULT 0`);
    await client.query(`ALTER TABLE ai_tier_features ADD COLUMN IF NOT EXISTS campaigns_limit INTEGER DEFAULT 0`);
    await client.query(`ALTER TABLE ai_tier_features ADD COLUMN IF NOT EXISTS visuals_limit INTEGER DEFAULT 0`);
    await client.query(`ALTER TABLE ai_tier_features ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE`);

    // Seed Defaults / Updates
    await client.query(`
      INSERT INTO ai_tier_features (
        tier, display_name, monthly_price, yearly_price, products_limit, campaigns_limit, visuals_limit, is_public,
        allow_manuscript, allow_copywriter, allow_translator, allow_seo, allow_designer, allow_page_builder, allow_dynamic_optimization
      )
      VALUES 
        ('none', 'Sandbox Trial', 0.00, 0.00, 0, 0, 0, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),
        ('standard', 'Standard', 49.00, 468.00, 15, 5, 30, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, FALSE),
        ('professional', 'Professional', 149.00, 1428.00, 100, 30, 150, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE),
        ('enterprise', 'Enterprise', 499.00, 4788.00, 1000, 150, 600, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE)
      ON CONFLICT (tier) DO UPDATE SET
        display_name = COALESCE(NULLIF(EXCLUDED.display_name, ''), ai_tier_features.display_name),
        monthly_price = EXCLUDED.monthly_price,
        yearly_price = EXCLUDED.yearly_price,
        products_limit = EXCLUDED.products_limit,
        campaigns_limit = EXCLUDED.campaigns_limit,
        visuals_limit = EXCLUDED.visuals_limit,
        is_public = EXCLUDED.is_public
    `);

    // Create global system settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value VARCHAR(255) NOT NULL,
        description TEXT
      )
    `);

    // Seed default cost markup parameter
    await client.query(`
      INSERT INTO system_settings (key, value, description)
      VALUES ('token_cost_markup_percentage', '0', 'Global percentage markup/topping applied on estimated token cost calculations for users.')
      ON CONFLICT (key) DO NOTHING
    `);

    // Create Payout Ledger Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS merchant_payout_ledger (
        id SERIAL PRIMARY KEY,
        brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE CASCADE,
        order_id VARCHAR(100) REFERENCES orders(id) ON DELETE SET NULL,
        amount NUMERIC(10, 2) NOT NULL,
        platform_margin NUMERIC(10, 2) NOT NULL,
        processing_fee NUMERIC(10, 2) DEFAULT 0.00,
        net_amount NUMERIC(10, 2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Merchant Subscriptions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS merchant_subscriptions (
        id SERIAL PRIMARY KEY,
        brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        interval VARCHAR(20) DEFAULT 'monthly',
        status VARCHAR(20) DEFAULT 'active',
        last_charged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        next_charge_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add columns to support scheduled downgrades
    await client.query(`ALTER TABLE merchant_subscriptions ADD COLUMN IF NOT EXISTS pending_tier VARCHAR(50)`);
    await client.query(`ALTER TABLE merchant_subscriptions ADD COLUMN IF NOT EXISTS pending_interval VARCHAR(50)`);

    // campaign agent migrations
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS agent_mode VARCHAR(50) DEFAULT 'recommendation'`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS autopilot_guardrails TEXT DEFAULT '{"max_budget_change_pct":20,"min_roas_floor":1.8,"max_spend_ceiling":500}'`);

    // A/B Testing columns migration
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS enable_ab_testing BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS ab_test_headlines TEXT DEFAULT '[]'`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS ab_test_descriptions TEXT DEFAULT '[]'`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS ab_test_links TEXT DEFAULT '[]'`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS ab_test_media_urls TEXT DEFAULT '[]'`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS warmup_days INTEGER DEFAULT 3`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS warmup_budget_percent INTEGER DEFAULT 15`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS lookalike_seeding_enabled BOOLEAN DEFAULT FALSE`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS campaign_agent_recommendations (
        id SERIAL PRIMARY KEY,
        campaign_id VARCHAR(100) REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
        metric VARCHAR(50) NOT NULL,
        operator VARCHAR(10) NOT NULL,
        trigger_value NUMERIC(10, 2) NOT NULL,
        current_value NUMERIC(10, 2) NOT NULL,
        action VARCHAR(50) NOT NULL,
        action_value NUMERIC(10, 2),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        applied_at TIMESTAMP
      )
    `);

    await client.query(`ALTER TABLE campaign_agent_recommendations ADD COLUMN IF NOT EXISTS agent_role VARCHAR(50) DEFAULT 'budget_allocator'`);
    await client.query(`ALTER TABLE campaign_agent_recommendations ADD COLUMN IF NOT EXISTS performance_impact TEXT`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_conflict_logs (
        id SERIAL PRIMARY KEY,
        campaign_id VARCHAR(100) REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
        conflicting_agents VARCHAR(100) NOT NULL,
        conflict_description TEXT NOT NULL,
        resolution VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS storefront_traffic (
        id SERIAL PRIMARY KEY,
        brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE CASCADE,
        session_id VARCHAR(100),
        page_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS brand_manuscripts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_id VARCHAR(50) NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT FALSE
      )
    `);

    // Platform Learning System Columns & Tables
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS business_segment VARCHAR(100)`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS business_niche VARCHAR(100)`);
    await client.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS share_performance_data BOOLEAN DEFAULT TRUE`);
    await client.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS historical_roas NUMERIC(6,2) DEFAULT NULL`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS global_segment_benchmarks (
        id SERIAL PRIMARY KEY,
        business_segment VARCHAR(100) UNIQUE NOT NULL,
        avg_ctr NUMERIC(5,2) DEFAULT 1.50,
        avg_cvr NUMERIC(5,2) DEFAULT 2.00,
        avg_roas NUMERIC(5,2) DEFAULT 2.80,
        active_campaigns_count INT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default segment benchmarks if they don't exist
    await client.query(`
      INSERT INTO global_segment_benchmarks (business_segment, avg_ctr, avg_cvr, avg_roas, active_campaigns_count)
      VALUES 
        ('Food & Beverage', 1.80, 2.50, 3.20, 12),
        ('Apparel & Fashion', 2.10, 1.80, 2.90, 8),
        ('Electronics', 1.20, 1.10, 2.40, 5),
        ('Health & Beauty', 1.95, 2.20, 3.10, 15),
        ('Home & Living', 1.40, 1.50, 2.70, 4)
      ON CONFLICT (business_segment) DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅ PostgreSQL database tables initialized successfully.');

    // Seed Default Pesado Brand Configuration and Products
    await seedDefaultData();

  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('❌ Failed to migrate database tables:', err.message);
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function seedDefaultData() {
  // Migrate existing marketing_protocols to brand_manuscripts
  try {
    const oldProtocols = await allQuery("SELECT id, marketing_protocol FROM brands WHERE marketing_protocol IS NOT NULL AND marketing_protocol != ''");
    if (oldProtocols && oldProtocols.length > 0) {
      for (let row of oldProtocols) {
        const existing = await getQuery("SELECT id FROM brand_manuscripts WHERE brand_id = $1 LIMIT 1", [row.id]);
        if (!existing) {
          let summary = row.marketing_protocol.substring(0, 150).replace(/\r?\n/g, ' ') + '...';
          await runQuery("INSERT INTO brand_manuscripts (brand_id, content, summary, is_active) VALUES ($1, $2, $3, TRUE)", [row.id, row.marketing_protocol, summary]);
          console.log(`[Database Migration] Migrated existing marketing protocol for brand ${row.id} to version history.`);
        }
      }
    }
  } catch (migErr) {
    console.error('[Database Migration] Error migrating old marketing protocols:', migErr.message);
  }

  // Update pesado brand default values if it exists
  try {
    await runQuery(`
      UPDATE brands 
      SET business_segment = COALESCE(business_segment, 'Food & Beverage'),
          business_niche = COALESCE(business_niche, 'Specialty Coffee'),
          share_performance_data = COALESCE(share_performance_data, TRUE)
      WHERE id = 'pesado'
    `);
  } catch (err) {
    console.error('[Database Migration] Error setting default pesado segments:', err.message);
  }

  const shouldSeedMock = process.env.NODE_ENV !== 'production';

  // Seed Superadmin user (always required)
  const adminCheckUser = await getQuery('SELECT id FROM users WHERE email = $1', ['sc@davidblaesing.com']);
  if (!adminCheckUser) {
    console.log('[Database Seed] Seeding default superadmin user sc@davidblaesing.com...');
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'TheKey4u';
    const passwordHash = crypto.createHash('sha256').update(defaultPassword).digest('hex');
    await runQuery(`
      INSERT INTO users (email, password_hash, role)
      VALUES ($1, $2, $3)
    `, ['sc@davidblaesing.com', passwordHash, 'superadmin']);
  }

  // If not seeding mock data, skip the rest
  if (!shouldSeedMock) {
    console.log('[Database Seed] Mock data seeding disabled for remote stacks.');
    return;
  }

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

  // Seed default Orders
  const orderCheck = await getQuery('SELECT id FROM orders LIMIT 1');
  if (!orderCheck) {
    console.log('[Database Seed] Seeding default orders database metrics...');
    const seedOrders = [
      {
        id: 'ORD-2026-9812',
        brand_id: 'pesado',
        stripe_session_id: 'cs_test_a1B2c3D4e5',
        customer_name: 'Sarah Connor',
        customer_email: 'sarah.connor@cyberdyne.com',
        shipping_address: JSON.stringify({ street: '101 T-800 Lane', city: 'Los Angeles', state: 'CA', zip: '90210', country: 'US' }),
        items: JSON.stringify([{ id: 1, title: 'Precision Portafilter (Wooden Handle)', price: 132.00, quantity: 1 }]),
        total: 132.00,
        status: 'delivered',
        created_at: '2026-04-12 14:32:00'
      },
      {
        id: 'ORD-2026-5421',
        brand_id: 'pesado',
        stripe_session_id: 'cs_test_b2C3d4E5f6',
        customer_name: 'Marcus Wright',
        customer_email: 'marcus.wright@projectangel.org',
        shipping_address: JSON.stringify({ street: '204 Salvation Blvd', city: 'San Francisco', state: 'CA', zip: '94103', country: 'US' }),
        items: JSON.stringify([{ id: 2, title: 'Precision Shower Screen (E61 Compatible)', price: 28.50, quantity: 2 }]),
        total: 57.00,
        status: 'shipped',
        created_at: '2026-05-18 10:15:00'
      },
      {
        id: 'ORD-2026-1049',
        brand_id: 'pesado',
        stripe_session_id: 'cs_test_c3D4e5F6g7',
        customer_name: 'John Connor',
        customer_email: 'john.connor@resistance.net',
        shipping_address: JSON.stringify({ street: '500 Future Way', city: 'Crystal Lake', state: 'IL', zip: '60014', country: 'US' }),
        items: JSON.stringify([
          { id: 1, title: 'Precision Portafilter (Wooden Handle)', price: 132.00, quantity: 1 },
          { id: 3, title: '90-Degree Edge Premium Portafilter Tamper', price: 85.00, quantity: 1 }
        ]),
        total: 217.00,
        status: 'delivered',
        created_at: '2026-06-05 09:44:00'
      },
      {
        id: 'ORD-2026-7832',
        brand_id: 'pesado',
        stripe_session_id: 'cs_test_d4E5f6G7h8',
        customer_name: 'Kate Brewster',
        customer_email: 'kate.b@skynet.gov',
        shipping_address: JSON.stringify({ street: 'Silo 12 Fallout Rd', city: 'Cheyenne Mountain', state: 'CO', zip: '80901', country: 'US' }),
        items: JSON.stringify([{ id: 4, title: 'Classic Barista Tamping Station', price: 45.00, quantity: 1 }]),
        total: 45.00,
        status: 'pending_payment',
        created_at: '2026-06-25 18:22:00'
      },
      {
        id: 'ORD-2026-3021',
        brand_id: 'pesado',
        stripe_session_id: 'cs_test_e5F6g7H8i9',
        customer_name: 'Sarah Connor',
        customer_email: 'sarah.connor@cyberdyne.com',
        shipping_address: JSON.stringify({ street: '101 T-800 Lane', city: 'Los Angeles', state: 'CA', zip: '90210', country: 'US' }),
        items: JSON.stringify([{ id: 3, title: '90-Degree Edge Premium Portafilter Tamper', price: 85.00, quantity: 1 }]),
        total: 85.00,
        status: 'delivered',
        created_at: '2026-05-22 15:10:00'
      },
      {
        id: 'ORD-2026-8942',
        brand_id: 'pesado',
        stripe_session_id: 'cs_test_f6G7h8I9j0',
        customer_name: 'Miles Dyson',
        customer_email: 'miles.dyson@cyberdyne.com',
        shipping_address: JSON.stringify({ street: '742 Cyberdyne Blvd', city: 'Sunnyvale', state: 'CA', zip: '94089', country: 'US' }),
        items: JSON.stringify([
          { id: 2, title: 'Precision Shower Screen (E61 Compatible)', price: 28.50, quantity: 1 },
          { id: 4, title: 'Classic Barista Tamping Station', price: 45.00, quantity: 1 }
        ]),
        total: 73.50,
        status: 'delivered',
        created_at: '2026-06-12 11:30:00'
      }
    ];

    for (const o of seedOrders) {
      await runQuery(`
        INSERT INTO orders (id, brand_id, stripe_session_id, customer_name, customer_email, shipping_address, items, total, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [o.id, o.brand_id, o.stripe_session_id, o.customer_name, o.customer_email, o.shipping_address, o.items, o.total, o.status, o.created_at]);
    }
    console.log('✅ Default orders seeded successfully.');
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

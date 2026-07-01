import pg from 'pg';
import dotenv from 'dotenv';

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
  console.log('--- Checking Brand heavy details for "pesado585" ---');
  const brandRes = await pool.query('SELECT * FROM brands WHERE id = $1', ['pesado585']);
  if (brandRes.rows.length === 0) {
    console.log('Brand "pesado585" not found in database.');
    await pool.end();
    return;
  }
  
  const brand = brandRes.rows[0];
  console.log('Brand fields in DB:', brand);

  const subRes = await pool.query('SELECT * FROM merchant_subscriptions WHERE brand_id = $1', ['pesado585']);
  console.log('Merchant Subscriptions for brand:', subRes.rows);

  // Let\'s simulate the exact payload sent by BillingSubscriptionView.vue:
  // payload is brand fields + updated ai_tier & subscription_billing_method
  const mockPayload = {
    ...brand,
    ai_tier: 'professional',
    subscription_billing_method: 'stripe_card',
  };

  console.log('\n--- Simulating REST endpoint update logic ---');
  try {
    const reqId = mockPayload.id.trim().toLowerCase();
    
    // Simulate query to verify existing
    const existing = brand; 
    
    // Mimic parameter resolution
    const finalColor = mockPayload.primary_color || '#c5a059';
    const finalLogo = mockPayload.logo || null;
    const finalFavicon = mockPayload.favicon || null;
    const finalLangs = Array.isArray(mockPayload.languages) ? mockPayload.languages.join(',') : String(mockPayload.languages || 'en');
    const finalAiTier = mockPayload.ai_tier || 'professional';
    const finalAiFreeTier = mockPayload.ai_free_tier === true || mockPayload.ai_free_tier === 'true';
    const finalPayAsYouGo = mockPayload.pay_as_you_go_enabled === true || mockPayload.pay_as_you_go_enabled === 'true';
    
    let finalCompetitors = existing ? existing.competitors : null;
    let finalAutoFind = existing ? existing.auto_find_competitors : true;
    const finalPriceMarkup = parseFloat(mockPayload.price_markup || 0.00);
    const finalBillingType = mockPayload.billing_type || 'standard';
    let finalPlatformTakeRate = parseFloat(mockPayload.platform_take_rate || 0.15);
    const finalBillingMethod = mockPayload.subscription_billing_method || 'ledger';
    const finalStatus = mockPayload.status || 'draft';
    const finalSegment = mockPayload.business_segment || 'Food & Beverage';
    const finalNiche = mockPayload.business_niche || 'Specialty Coffee';
    const finalSharing = mockPayload.share_performance_data !== undefined ? (mockPayload.share_performance_data === true || mockPayload.share_performance_data === 'true') : true;
    const finalMetaPixelId = mockPayload.meta_pixel_id || `mock_pixel_${reqId}`;
    const finalGoogleAnalyticsId = mockPayload.google_analytics_id || `mock_ga4_${reqId}`;
    const finalVoiceCopy = mockPayload.brand_voice_copy || null;
    const finalFonts = mockPayload.typography_fonts || 'Outfit';
    const finalDemographics = mockPayload.target_audience_demographics ? JSON.stringify(mockPayload.target_audience_demographics) : null;
    const finalGuidelines = mockPayload.visual_identity_guidelines ? JSON.stringify(mockPayload.visual_identity_guidelines) : null;
    const finalAgencyId = mockPayload.agency_id || null;

    console.log('Inserting/updating brand in DB...');
    await pool.query(`
      INSERT INTO brands (id, name, subdomain, shopify_shop_name, shopify_access_token, stripe_secret_key, stripe_webhook_secret, contact_email, primary_color, cloudflare_dns_record_id, custom_domain, cloudflare_custom_domain_dns_record_id, logo, favicon, theme_settings, languages, marketing_protocol, ai_tier, ai_free_tier, pay_as_you_go_enabled, competitors, auto_find_competitors, price_markup, billing_type, platform_take_rate, stripe_connect_account_id, subscription_billing_method, stripe_customer_id, status, business_segment, business_niche, share_performance_data, meta_pixel_id, google_analytics_id, brand_voice_copy, typography_fonts, target_audience_demographics, visual_identity_guidelines, agency_id, billing_name, billing_address, billing_vat)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        subdomain = EXCLUDED.subdomain,
        shopify_shop_name = EXCLUDED.shopify_shop_name,
        shopify_access_token = EXCLUDED.shopify_access_token,
        stripe_secret_key = EXCLUDED.stripe_secret_key,
        stripe_webhook_secret = EXCLUDED.stripe_webhook_secret,
        contact_email = EXCLUDED.contact_email,
        primary_color = EXCLUDED.primary_color,
        cloudflare_dns_record_id = COALESCE(EXCLUDED.cloudflare_dns_record_id, brands.cloudflare_dns_record_id),
        custom_domain = EXCLUDED.custom_domain,
        cloudflare_custom_domain_dns_record_id = COALESCE(EXCLUDED.cloudflare_custom_domain_dns_record_id, brands.cloudflare_custom_domain_dns_record_id),
        logo = EXCLUDED.logo,
        favicon = EXCLUDED.favicon,
        theme_settings = EXCLUDED.theme_settings,
        languages = EXCLUDED.languages,
        marketing_protocol = EXCLUDED.marketing_protocol,
        ai_tier = EXCLUDED.ai_tier,
        ai_free_tier = EXCLUDED.ai_free_tier,
        pay_as_you_go_enabled = EXCLUDED.pay_as_you_go_enabled,
        competitors = EXCLUDED.competitors,
        auto_find_competitors = EXCLUDED.auto_find_competitors,
        price_markup = EXCLUDED.price_markup,
        billing_type = EXCLUDED.billing_type,
        platform_take_rate = EXCLUDED.platform_take_rate,
        stripe_connect_account_id = EXCLUDED.stripe_connect_account_id,
        subscription_billing_method = EXCLUDED.subscription_billing_method,
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        status = EXCLUDED.status,
        business_segment = EXCLUDED.business_segment,
        business_niche = EXCLUDED.business_niche,
        share_performance_data = EXCLUDED.share_performance_data,
        meta_pixel_id = EXCLUDED.meta_pixel_id,
        google_analytics_id = EXCLUDED.google_analytics_id,
        brand_voice_copy = EXCLUDED.brand_voice_copy,
        typography_fonts = EXCLUDED.typography_fonts,
        target_audience_demographics = EXCLUDED.target_audience_demographics,
        visual_identity_guidelines = EXCLUDED.visual_identity_guidelines,
        agency_id = EXCLUDED.agency_id,
        billing_name = EXCLUDED.billing_name,
        billing_address = EXCLUDED.billing_address,
        billing_vat = EXCLUDED.billing_vat,
        updated_at = CURRENT_TIMESTAMP
    `, [
      reqId,
      mockPayload.name,
      mockPayload.subdomain,
      mockPayload.shopify_shop_name || null,
      mockPayload.shopify_access_token || null,
      mockPayload.stripe_secret_key || null,
      mockPayload.stripe_webhook_secret || null,
      mockPayload.contact_email || null,
      finalColor,
      mockPayload.cloudflare_dns_record_id || null,
      mockPayload.custom_domain || null,
      mockPayload.cloudflare_custom_domain_dns_record_id || null,
      finalLogo,
      finalFavicon,
      mockPayload.theme_settings || null,
      finalLangs,
      mockPayload.marketing_protocol || null,
      finalAiTier,
      finalAiFreeTier,
      finalPayAsYouGo,
      finalCompetitors,
      finalAutoFind,
      finalPriceMarkup,
      finalBillingType,
      finalPlatformTakeRate,
      mockPayload.stripe_connect_account_id || null,
      finalBillingMethod,
      mockPayload.stripe_customer_id || null,
      finalStatus,
      finalSegment,
      finalNiche,
      finalSharing,
      finalMetaPixelId,
      finalGoogleAnalyticsId,
      finalVoiceCopy,
      finalFonts,
      finalDemographics,
      finalGuidelines,
      finalAgencyId,
      mockPayload.billing_name || null,
      mockPayload.billing_address || null,
      mockPayload.billing_vat || null
    ]);

    console.log('✓ Brand insertion/update SQL succeeded.');

    // Simulate active subscription update on AI tier change
    if (existing.ai_tier !== finalAiTier) {
      let subAmount = 149.00; // professional
      
      const hasSub = await pool.query(`SELECT id FROM merchant_subscriptions WHERE brand_id = $1 AND status = 'active'`, [reqId]);
      if (hasSub.rows.length > 0) {
        console.log('Updating existing active sub...');
        await pool.query(`
          UPDATE merchant_subscriptions 
          SET name = $1, amount = $2
          WHERE brand_id = $3 AND status = 'active'
        `, [`ai_subscription_${finalAiTier}`, subAmount, reqId]);
      } else {
        console.log('Inserting new active sub...');
        await pool.query(`
          INSERT INTO merchant_subscriptions (brand_id, name, amount, interval, status, last_charged_at, next_charge_at)
          VALUES ($1, $2, $3, 'monthly', 'active', CURRENT_TIMESTAMP, $4)
        `, [
          reqId,
          `ai_subscription_${finalAiTier}`,
          subAmount,
          new Date(Date.now() + 30 * 24 * 3600 * 1000)
        ]);
      }
    }
    console.log('✓ Subscription settings update simulation PASSED.');
  } catch (err) {
    console.error('❌ SIMULATION FAILED:', err);
  }

  await pool.end();
}

run().catch(console.error);

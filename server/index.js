import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stripeLib from 'stripe';
import crypto from 'crypto';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { runQuery, getQuery, allQuery } from './db.js';

dotenv.config();

import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';

// Initialize S3 Client
const s3Endpoint = process.env.S3_ENDPOINT || 'http://minio:9000';
const s3Client = new S3Client({
  endpoint: s3Endpoint,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minio_admin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minio_secure_password_local_123'
  },
  forcePathStyle: true
});
const s3BucketMedia = process.env.S3_BUCKET_MEDIA || 'media';

// Auto initialize S3 buckets
async function initS3Buckets() {
  try {
    const buckets = [s3BucketMedia, process.env.S3_BUCKET_BACKUPS || 'backups'];
    for (const bucket of buckets) {
      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
        console.log(`[S3 Storage] Bucket '${bucket}' already exists.`);
      } catch (err) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
          console.log(`[S3 Storage] Bucket '${bucket}' not found. Creating it...`);
          await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
          
          if (bucket === s3BucketMedia) {
            const publicPolicy = {
              Version: "2012-10-17",
              Statement: [
                {
                  Sid: "PublicReadGetObject",
                  Effect: "Allow",
                  Principal: "*",
                  Action: "s3:GetObject",
                  Resource: `arn:aws:s3:::${bucket}/*`
                }
              ]
            };
            await s3Client.send(new PutBucketPolicyCommand({
              Bucket: bucket,
              Policy: JSON.stringify(publicPolicy)
            }));
            console.log(`[S3 Storage] Public read policy set for bucket '${bucket}'.`);
          }
          console.log(`[S3 Storage] Bucket '${bucket}' created successfully.`);
        } else {
          throw err;
        }
      }
    }
  } catch (err) {
    console.error('[S3 Storage] Failed to initialize S3 buckets:', err.message);
  }
}

// Fire bucket initialization
initS3Buckets();

const app = express();
const port = process.env.PORT || 3000;

// CORS Enablement
app.use(cors());

// Stripe Instances Cache per brand
const stripeInstances = {};
function getStripeInstance(brand) {
  if (!brand.stripe_secret_key) return null;
  if (!stripeInstances[brand.id]) {
    stripeInstances[brand.id] = new stripeLib(brand.stripe_secret_key);
  }
  return stripeInstances[brand.id];
}

// Cloudflare DNS Record helper
async function createCloudflareSubdomain(subdomain) {
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;
  const baseDomain = process.env.CLOUDFLARE_DOMAIN || 'stricktlycoffee.be';

  if (!cfToken || !cfZoneId) {
    console.log('[Cloudflare] API token or Zone ID missing. Skipping DNS record creation.');
    return null;
  }

  // Extract prefix from subdomain
  const prefix = subdomain.replace(`.${baseDomain}`, '').trim();

  // If the subdomain is just the baseDomain itself, or they input something invalid, skip
  if (prefix === baseDomain || !prefix) {
    console.log('[Cloudflare] Subdomain prefix matches base domain or is invalid. Skipping DNS.');
    return null;
  }

  console.log(`[Cloudflare] Creating CNAME record for ${prefix}.${baseDomain} pointing to ${baseDomain}...`);

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'CNAME',
        name: prefix,
        content: baseDomain,
        ttl: 1, // automatic
        proxied: true
      })
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      console.error('[Cloudflare] Error response:', result);
      throw new Error(result.errors?.[0]?.message || 'Failed to create DNS record');
    }

    console.log(`[Cloudflare] Successfully created DNS record ID: ${result.result.id}`);
    return result.result.id;
  } catch (err) {
    console.error('[Cloudflare] DNS record creation failed:', err.message);
    return null;
  }
}

// Cloudflare DNS Record helper for manual custom domains
async function createCloudflareCustomDomain(customDomain) {
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;
  const baseDomain = process.env.CLOUDFLARE_DOMAIN || 'stricktlycoffee.be';

  if (!cfToken || !cfZoneId || !customDomain) {
    console.log('[Cloudflare] Missing tokens or custom domain. Skipping custom domain DNS registration.');
    return null;
  }

  const targetDomain = customDomain.replace(/^https?:\/\//i, '').trim();
  console.log(`[Cloudflare] Registering custom CNAME record for ${targetDomain} pointing to ${baseDomain}...`);

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'CNAME',
        name: targetDomain,
        content: baseDomain,
        ttl: 1, // automatic
        proxied: true
      })
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      console.error('[Cloudflare] Custom domain DNS creation failed:', result);
      return null;
    }

    console.log(`[Cloudflare] Successfully created custom domain DNS record ID: ${result.result.id}`);
    return result.result.id;
  } catch (err) {
    console.error('[Cloudflare] Custom domain DNS creation error:', err.message);
    return null;
  }
}

// Scrape styles, favicon, and logo from a public Shopify store URL
async function scrapeShopifyBranding(shopUrl) {
  try {
    let url = shopUrl;
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    
    console.log(`[Branding Scraper] Fetching homepage elements from: ${url}`);
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    
    const html = await res.text();
    
    // 1. Extract favicon link
    let faviconUrl = null;
    const faviconMatch = html.match(/<link[^>]+(?:rel=["'](?:shortcut )?icon["'])[^>]+href=["']([^"']+)["']/i) ||
                         html.match(/<link[^>]+href=["']([^"']+)["']/i);
    if (faviconMatch) {
      faviconUrl = faviconMatch[1];
      if (faviconUrl.startsWith('//')) {
        faviconUrl = `https:${faviconUrl}`;
      } else if (faviconUrl.startsWith('/') && !faviconUrl.startsWith('//')) {
        const parsed = new URL(url);
        faviconUrl = `${parsed.origin}${faviconUrl}`;
      }
    }
    
    // 2. Extract logo image
    let logoUrl = null;
    const logoMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]+alt=["'][^"']*(?:logo|brand)[^"']*["']/i) ||
                      html.match(/<img[^>]+alt=["'][^"']*(?:logo|brand)[^"']*["'][^>]+src=["']([^"']+)["']/i) ||
                      html.match(/class=["'][^"']*(?:logo|brand)[^"']*["'][^>]*src=["']([^"']+)["']/i);
    if (logoMatch) {
      logoUrl = logoMatch[1];
      if (logoUrl.startsWith('//')) {
        logoUrl = `https:${logoUrl}`;
      } else if (logoUrl.startsWith('/') && !logoUrl.startsWith('//')) {
        const parsed = new URL(url);
        logoUrl = `${parsed.origin}${logoUrl}`;
      }
    }
    
    // 3. Extract primary accent color
    let primaryColor = '#c5a059';
    const colorMatch = html.match(/--color-accent:\s*(#[0-9a-fA-F]{3,6})/i) ||
                       html.match(/--color-primary:\s*(#[0-9a-fA-F]{3,6})/i) ||
                       html.match(/primary-color:\s*(#[0-9a-fA-F]{3,6})/i);
    if (colorMatch) {
      primaryColor = colorMatch[1];
    }
    
    console.log(`[Branding Scraper] Extracted assets: favicon=${faviconUrl}, logo=${logoUrl}, color=${primaryColor}`);
    return { favicon: faviconUrl, logo: logoUrl, primary_color: primaryColor };
  } catch (e) {
    console.error('[Branding Scraper] Failed to fetch storefront branding:', e.message);
    return { favicon: null, logo: null, primary_color: '#c5a059' };
  }
}


async function deleteCloudflareSubdomain(recordId) {
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;

  if (!cfToken || !cfZoneId || !recordId) {
    console.log('[Cloudflare] Missing config or Record ID. Skipping DNS record deletion.');
    return false;
  }

  console.log(`[Cloudflare] Deleting DNS record ID: ${recordId}...`);

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      console.error('[Cloudflare] Error response:', result);
      throw new Error(result.errors?.[0]?.message || 'Failed to delete DNS record');
    }

    console.log(`[Cloudflare] Successfully deleted DNS record ID: ${recordId}`);
    return true;
  } catch (err) {
    console.error('[Cloudflare] DNS record deletion failed:', err.message);
    return false;
  }
}

// ----------------------------------------------------------------------------
// STRIPE WEBHOOK (Needs raw body parser)
// ----------------------------------------------------------------------------
app.post('/api/webhook/stripe/:brandId', express.raw({ type: 'application/json' }), async (req, res) => {
  const { brandId } = req.params;
  const sig = req.headers['stripe-signature'];

  try {
    const brand = await getQuery('SELECT * FROM brands WHERE id = $1', [brandId]);
    if (!brand) {
      return res.status(404).send(`Brand ${brandId} not found`);
    }

    const stripe = getStripeInstance(brand);
    const endpointSecret = brand.stripe_webhook_secret;

    let event;

    if (stripe && sig && endpointSecret) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.error(`[Webhook Stripe] Signature verification failed for brand ${brandId}: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle checkout.session.completed event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        await handleSuccessfulPayment(session.client_reference_id, {
          name: session.customer_details?.name || 'Customer',
          email: session.customer_details?.email,
          address: session.shipping_details || session.customer_details?.address
        }, session.payment_intent, brand);
      }
    } else {
      return res.status(400).send('Stripe credentials or webhook signature missing.');
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`[Webhook Stripe] Error processing webhook:`, err);
    res.status(500).send(err.message);
  }
});

// JSON body parser for all other routes
app.use(express.json());

// Multer configuration for file uploads
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Serve static uploaded files
app.use('/uploads', express.static('uploads'));

// User Auth endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await getQuery('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    if (inputHash !== user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Return stateless user info token (using simple credentials or dynamic signature)
    const token = Buffer.from(JSON.stringify({ email: user.email, role: user.role, brand_id: user.brand_id, time: Date.now() })).toString('base64');
    res.json({ success: true, email: user.email, role: user.role, brand_id: user.brand_id, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload local file to S3 media bucket
async function uploadFileToS3(filePath, key, mimeType) {
  const fileStream = fs.createReadStream(filePath);
  await s3Client.send(new PutObjectCommand({
    Bucket: s3BucketMedia,
    Key: key,
    Body: fileStream,
    ContentType: mimeType
  }));
}

// Media upload & downsizing endpoint
app.post('/api/global/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const localPath = req.file.path;
  const isImage = req.file.mimetype.startsWith('image/');
  let targetFilename = req.file.filename;
  let uploadPath = localPath;
  let isResized = false;

  try {
    if (isImage) {
      try {
        const resizedFilename = 'resized-' + req.file.filename;
        const resizedPath = path.join(uploadDir, resizedFilename);

        // Downsize image to max-width 800px using sharp
        await sharp(localPath)
          .resize({ width: 800, withoutEnlargement: true })
          .toFile(resizedPath);

        // Delete the original large file since we have the resized one
        fs.unlinkSync(localPath);
        uploadPath = resizedPath;
        targetFilename = resizedFilename;
        isResized = true;
      } catch (err) {
        console.error('[Upload Resizing Error]', err);
        // Fallback to serving the original large image (uploadPath & targetFilename remain as original)
      }
    }

    // Upload the final file to MinIO S3 media bucket
    await uploadFileToS3(uploadPath, targetFilename, req.file.mimetype);

    // Clean up local file from disk after successful upload
    fs.unlinkSync(uploadPath);

    return res.json({
      success: true,
      url: `/uploads/${targetFilename}`,
      originalName: req.file.originalname,
      resized: isResized
    });
  } catch (err) {
    // Attempt local file cleanup in case of catastrophic failures
    if (fs.existsSync(uploadPath)) {
      try { fs.unlinkSync(uploadPath); } catch (_) {}
    }
    if (fs.existsSync(localPath)) {
      try { fs.unlinkSync(localPath); } catch (_) {}
    }
    console.error('[S3 Upload Catastrophic Failure]', err);
    return res.status(500).json({ error: 'Failed to upload asset to S3: ' + err.message });
  }
});

// ----------------------------------------------------------------------------
// MULTI-TENANT BRAND HOST RESOLUTION MIDDLEWARE
// ----------------------------------------------------------------------------
app.use(async (req, res, next) => {
  // Skip brand resolution for global endpoints, auth, and Stripe webhook parameters
  if (req.path.startsWith('/api/global/') || req.path.startsWith('/api/webhook/stripe/') || req.path.startsWith('/api/auth/')) {
    return next();
  }

  const host = req.headers.host || '';
  const hostname = host.split(':')[0]; // strip port in local dev (e.g. :8081)
  const previewBrandId = req.query.previewBrandId;

  try {
    let brand = null;

    // 0. Preview override resolver
    if (previewBrandId) {
      brand = await getQuery('SELECT * FROM brands WHERE id = $1', [previewBrandId]);
    }

    // 1. Direct subdomain or custom domain lookup (e.g. resolved.stricktlycoffee.be or brand-custom.com)
    if (!brand) {
      brand = await getQuery('SELECT * FROM brands WHERE subdomain = $1 OR custom_domain = $1', [hostname]);
    }

    // 2. Fallback matching for local dev or alternative domains containing brand ID
    if (!brand) {
      // Look for a brand whose ID is contained in the hostname (e.g. dev-pesado.stricktlycoffee.be)
      const allBrands = await allQuery('SELECT * FROM brands');
      brand = allBrands.find(b => hostname.includes(b.id));

      // 3. Absolute fallback: use the first brand in the DB if none match (usually 'pesado')
      if (!brand && allBrands.length > 0) {
        brand = allBrands[0];
      }
    }

    if (!brand) {
      return res.status(404).json({ error: 'Shop tenant brand not found for host ' + hostname });
    }

    req.brand = brand;
    next();
  } catch (err) {
    console.error('[Middleware] Tenant resolution error:', err);
    res.status(500).json({ error: 'Internal server error resolving tenant' });
  }
});

// ----------------------------------------------------------------------------
// BRAND TENANT API ENDPOINTS
// ----------------------------------------------------------------------------

// Get resolved brand config (public safe properties)
app.get('/api/brand', (req, res) => {
  const { id, name, subdomain, contact_email, primary_color, logo, favicon, custom_domain } = req.brand;
  res.json({ id, name, subdomain, contact_email, primary_color, logo, favicon, custom_domain });
});

// Get Products for the active brand
app.get('/api/products', async (req, res) => {
  try {
    const rows = await allQuery('SELECT * FROM products WHERE brand_id = $1 ORDER BY id ASC', [req.brand.id]);
    // Parse json columns
    const parsedRows = rows.map(row => ({
      ...row,
      features: row.features ? JSON.parse(row.features) : [],
      compatibility: row.compatibility ? JSON.parse(row.compatibility) : []
    }));
    res.json(parsedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Checkout Session for the active brand
app.post('/api/checkout', async (req, res) => {
  try {
    const { items, customerName, customerEmail } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    let subtotal = 0;
    const validatedItems = [];
    
    for (const cartItem of items) {
      // Find product belonging to this brand
      const prod = await getQuery('SELECT * FROM products WHERE id = $1 AND brand_id = $2', [cartItem.id, req.brand.id]);
      if (!prod) {
        return res.status(400).json({ error: `Invalid product ID for this brand: ${cartItem.id}` });
      }
      subtotal += parseFloat(prod.price) * cartItem.quantity;
      validatedItems.push({
        id: prod.id,
        title: prod.title,
        price: parseFloat(prod.price),
        quantity: cartItem.quantity,
        image: prod.image
      });
    }

    const total = subtotal;
    const orderPrefix = req.brand.id.toUpperCase().substring(0, 3);
    const orderId = `${orderPrefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Create Order in pending state
    await runQuery(`
      INSERT INTO orders (id, brand_id, stripe_session_id, customer_name, customer_email, items, subtotal, total, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      orderId,
      req.brand.id,
      orderId, // Temp session ID for mock tracking
      customerName || 'Anonymous User',
      customerEmail || 'no-email@example.com',
      JSON.stringify(validatedItems),
      subtotal,
      total,
      'pending_payment'
    ]);

    const stripe = getStripeInstance(req.brand);
    if (stripe) {
      const lineItems = validatedItems.map(item => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.title,
            images: [item.image]
          },
          unit_amount: Math.round(item.price * 100)
        },
        quantity: item.quantity
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        client_reference_id: orderId,
        customer_email: customerEmail,
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'DE', 'FR', 'BE', 'AU']
        },
        success_url: `${req.headers.origin}/track.html?orderId=${orderId}&status=success`,
        cancel_url: `${req.headers.origin}/index.html`
      });

      // Update order with the real session ID
      await runQuery('UPDATE orders SET stripe_session_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [session.id, orderId]);

      res.json({ url: session.url });
    } else {
      // Mock Sandbox Checkout redirect
      console.log(`[Stripe Sandbox] Brand ${req.brand.name} checkout. Returning mock checkout URL.`);
      const origin = req.headers.origin || `${req.protocol}://${req.headers.host}`;
      res.json({ 
        url: `/api/checkout-mock-page?orderId=${orderId}&email=${encodeURIComponent(customerEmail)}&name=${encodeURIComponent(customerName)}&origin=${encodeURIComponent(origin)}`
      });
    }
  } catch (err) {
    console.error('[Checkout] Error initiating checkout:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper to escape HTML tags to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// Stripe Sandbox Mock Checkout Page HTML Renderer
app.get('/api/checkout-mock-page', async (req, res) => {
  const { orderId, email, name, origin } = req.query;

  if (!orderId) {
    return res.status(400).send('<h1>Missing required parameter: orderId</h1>');
  }

  // Render checkout simulation page
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stripe Sandbox | Payment Gateway</title>
    <meta name="robots" content="noindex, nofollow">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0d0c;
            --card-bg: #121514;
            --primary: #c5a059;
            --primary-hover: #b08d47;
            --text-main: #f3f4f3;
            --text-muted: #8e9290;
            --accent: #1e2221;
            --border: #232826;
            --font-display: 'Space Grotesk', sans-serif;
            --font-body: 'Outfit', sans-serif;
            --transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            font-family: var(--font-body);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 24px;
            box-sizing: border-box;
        }

        .checkout-container {
            max-width: 500px;
            width: 100%;
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            text-align: center;
        }

        .stripe-badge {
            background-color: #635bff;
            color: #fff;
            font-family: var(--font-display);
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 4px 12px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 24px;
        }

        h2 {
            font-family: var(--font-display);
            font-size: 1.8rem;
            margin-bottom: 12px;
        }

        p {
            color: var(--text-muted);
            margin-bottom: 32px;
            font-size: 0.95rem;
        }

        .order-summary {
            background: var(--accent);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 24px;
            margin-bottom: 32px;
            text-align: left;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 0.95rem;
        }

        .summary-row:last-child {
            margin-bottom: 0;
            border-top: 1px solid var(--border);
            padding-top: 12px;
            margin-top: 12px;
            font-weight: 700;
            color: var(--primary);
        }

        .btn {
            display: block;
            width: 100%;
            padding: 16px;
            font-family: var(--font-display);
            font-size: 0.95rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            transition: var(--transition);
        }

        .btn-primary {
            background-color: #635bff;
            color: #fff;
            margin-bottom: 12px;
        }

        .btn-primary:hover {
            background-color: #4f46e5;
        }

        .btn-cancel {
            background-color: transparent;
            color: var(--text-muted);
            border: 1px solid var(--border);
        }

        .btn-cancel:hover {
            border-color: var(--text-main);
            color: var(--text-main);
        }
    </style>
</head>
<body>

    <div class="checkout-container">
        <span class="stripe-badge">Stripe Sandbox</span>
        <h2>Stripe Payment Simulation</h2>
        <p>You are using Sandbox Mode because no live Stripe API keys are configured in your environment.</p>

        <div class="order-summary">
            <div class="summary-row">
                <span>Order Reference</span>
                <span id="summary-order-id" style="font-family: monospace;">${escapeHtml(orderId)}</span>
            </div>
            <div class="summary-row">
                <span>Customer Email</span>
                <span id="summary-email">${escapeHtml(email || '')}</span>
            </div>
            <div class="summary-row">
                <span>Payment Amount</span>
                <span id="summary-total" style="font-weight: 600;">Loading...</span>
            </div>
        </div>

        <button class="btn btn-primary" id="pay-btn">Authorize sandbox Payment</button>
        <button class="btn btn-cancel" id="cancel-btn">Cancel Transaction</button>
    </div>

    <script>
        const orderId = "${escapeHtml(orderId)}";
        const email = "${escapeHtml(email || '')}";
        const name = "${escapeHtml(name || '')}";
        const origin = "${escapeHtml(origin || '')}";

        // Fetch total amount from backend
        async function fetchOrderDetails() {
            try {
                const res = await fetch(\`/api/order/\${orderId}\`);
                if (res.ok) {
                    const order = await res.json();
                    document.getElementById('summary-total').textContent = \`€\${order.total.toFixed(2)}\`;
                }
            } catch (err) {
                console.error('Failed to load summary details:', err);
            }
        }

        fetchOrderDetails();

        document.getElementById('pay-btn').addEventListener('click', async () => {
            const payBtn = document.getElementById('pay-btn');
            payBtn.textContent = 'Processing Payment...';
            payBtn.disabled = true;

            try {
                // Post to payment simulation endpoint
                const res = await fetch('/api/admin/simulate-stripe-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId,
                        name,
                        email
                    })
                });

                if (res.ok) {
                    // Redirect back to storefront origin on success
                    window.location.href = \`\${origin}/track.html?orderId=\${orderId}&status=success\`;
                } else {
                    alert('Simulation payment authorization failed.');
                    payBtn.textContent = 'Authorize sandbox Payment';
                    payBtn.disabled = false;
                }
            } catch (err) {
                alert(\`Network error: \${err.message}\`);
                payBtn.textContent = 'Authorize sandbox Payment';
                payBtn.disabled = false;
            }
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            window.location.href = \`\${origin}/index.html\`;
        });
    </script>
</body>
</html>`);
});

// Simulated payment trigger for Sandbox
app.post('/api/admin/simulate-stripe-payment', async (req, res) => {
  const { orderId, name, email, shipping } = req.body;

  try {
    const order = await getQuery('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending_payment') {
      return res.status(400).json({ error: 'Order has already been processed' });
    }

    const brand = await getQuery('SELECT * FROM brands WHERE id = $1', [order.brand_id]);
    if (!brand) {
      return res.status(404).json({ error: 'Order brand not found' });
    }

    const defaultAddress = {
      address: {
        line1: '123 Coffee Bean Lane',
        city: 'Brussels',
        postal_code: '1000',
        country: 'BE'
      }
    };

    await handleSuccessfulPayment(orderId, {
      name: name || order.customer_name,
      email: email || order.customer_email,
      address: shipping || defaultAddress
    }, 'MOCK_PAY_INTENT_' + Date.now(), brand);

    res.json({ success: true, orderId });
  } catch (err) {
    console.error('Simulation payment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Shopify fulfillment status webhook callback
app.post('/api/webhook/shopify', async (req, res) => {
  const payload = req.body;
  const shopifyOrderId = (payload.order_id || payload.id)?.toString();
  const fulfillment = payload.fulfillment || (payload.fulfillments ? payload.fulfillments[0] : null);

  if (fulfillment && shopifyOrderId) {
    const trackingNumber = fulfillment.tracking_number;
    const trackingCarrier = fulfillment.tracking_company || 'DHL';
    const trackingUrl = fulfillment.tracking_url || `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;

    try {
      const order = await getQuery('SELECT * FROM orders WHERE shopify_order_id = $1', [shopifyOrderId]);
      if (order) {
        await runQuery(`
          UPDATE orders 
          SET status = 'shipped', tracking_number = $1, tracking_carrier = $2, tracking_url = $3, updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [trackingNumber, trackingCarrier, trackingUrl, order.id]);
        
        console.log(`[Webhook Shopify] Order ${order.id} marked shipped. Tracking: ${trackingNumber}`);
      }
    } catch (err) {
      console.error('Shopify webhook processing failed:', err);
    }
  }

  res.status(200).send('OK');
});

// Retrieve single order tracking details
app.get('/api/order/:id', async (req, res) => {
  try {
    const order = await getQuery('SELECT * FROM orders WHERE id = $1 OR stripe_session_id = $2', [req.params.id, req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      ...order,
      items: JSON.parse(order.items),
      shipping_address: order.shipping_address ? JSON.parse(order.shipping_address) : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware to verify the admin token for simulator access
function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const urlToken = req.query.token;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : urlToken;

  if (!token) {
    return res.status(401).json({ error: 'Access Denied. Unauthorized operator.' });
  }

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (!payload.email || !payload.role) {
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Malformed authentication token.' });
  }
}

// Retrieve orders for the active tenant brand (Warehouse dashboard context)
app.get('/api/admin/orders', verifyAdminToken, async (req, res) => {
  let brandId = req.brand ? req.brand.id : null;
  if (req.user.role.toLowerCase() === 'merchant') {
    brandId = req.user.brand_id;
  }

  if (!brandId) {
    return res.status(400).json({ error: 'No brand context resolved.' });
  }

  try {
    const rows = await allQuery('SELECT * FROM orders WHERE brand_id = $1 ORDER BY created_at DESC', [brandId]);
    const parsedRows = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items),
      shipping_address: row.shipping_address ? JSON.parse(row.shipping_address) : null
    }));
    res.json(parsedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark order fulfilled
app.post('/api/admin/fulfill', verifyAdminToken, async (req, res) => {
  const { orderId, trackingNumber, trackingCarrier } = req.body;
  let brandId = req.brand ? req.brand.id : null;
  if (req.user.role.toLowerCase() === 'merchant') {
    brandId = req.user.brand_id;
  }

  if (!brandId) {
    return res.status(400).json({ error: 'No brand context resolved.' });
  }

  try {
    const order = await getQuery('SELECT * FROM orders WHERE id = $1 AND brand_id = $2', [orderId, brandId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found for this brand' });
    }

    const tNumber = trackingNumber || `TRACK${Math.floor(100000 + Math.random() * 900000)}`;
    const tCarrier = trackingCarrier || 'DHL Express';
    const tUrl = `https://www.dhl.com/en/express/tracking.html?AWB=${tNumber}`;

    await runQuery(`
      UPDATE orders 
      SET status = 'shipped', tracking_number = $1, tracking_carrier = $2, tracking_url = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [tNumber, tCarrier, tUrl, orderId]);

    console.log(`[Warehouse Simulation] Fulfilling order ${orderId} with tracking: ${tNumber}`);
    res.json({ success: true, trackingNumber: tNumber, trackingCarrier: tCarrier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// SYSTEM ADMINISTRATION API (For onboarding new shops at dash.stricktlycoffee.be)
// ----------------------------------------------------------------------------

// List all brands
app.get('/api/global/brands', verifyAdminToken, async (req, res) => {
  try {
    if (req.user.role === 'merchant') {
      const rows = await allQuery('SELECT id, name, subdomain, contact_email, primary_color, shopify_shop_name, stripe_secret_key IS NOT NULL as has_stripe, shopify_access_token IS NOT NULL as has_shopify, custom_domain, logo, favicon FROM brands WHERE id = $1', [req.user.brand_id]);
      return res.json(rows);
    }
    const rows = await allQuery('SELECT id, name, subdomain, contact_email, primary_color, shopify_shop_name, stripe_secret_key IS NOT NULL as has_stripe, shopify_access_token IS NOT NULL as has_shopify, custom_domain, logo, favicon FROM brands ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Onboard new brand
app.post('/api/global/brands', verifyAdminToken, async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Permission denied. Superadmin access required.' });
  }
  const { id, name, subdomain, shopify_shop_name, shopify_access_token, stripe_secret_key, stripe_webhook_secret, contact_email, primary_color, custom_domain, logo, favicon } = req.body;

  if (!id || !name || !subdomain) {
    return res.status(400).json({ error: 'Missing required fields: id, name, subdomain' });
  }

  const brandId = id.trim().toLowerCase();

  try {
    // Check if brand already exists to see if subdomain/custom domain changed
    const existing = await getQuery('SELECT subdomain, cloudflare_dns_record_id, custom_domain, cloudflare_custom_domain_dns_record_id FROM brands WHERE id = $1', [brandId]);
    
    let dnsRecordId = existing ? existing.cloudflare_dns_record_id : null;
    let customDnsRecordId = existing ? existing.cloudflare_custom_domain_dns_record_id : null;

    // 1. Handle default subdomain CNAME record
    if (!existing || existing.subdomain !== subdomain) {
      if (existing && existing.cloudflare_dns_record_id) {
        await deleteCloudflareSubdomain(existing.cloudflare_dns_record_id);
      }
      dnsRecordId = await createCloudflareSubdomain(subdomain);
    }

    // 2. Handle manual custom domain CNAME record
    if (custom_domain && (!existing || existing.custom_domain !== custom_domain)) {
      if (existing && existing.cloudflare_custom_domain_dns_record_id) {
        await deleteCloudflareSubdomain(existing.cloudflare_custom_domain_dns_record_id);
      }
      customDnsRecordId = await createCloudflareCustomDomain(custom_domain);
    } else if (!custom_domain && existing && existing.cloudflare_custom_domain_dns_record_id) {
      // If custom domain was cleared, remove the DNS record
      await deleteCloudflareSubdomain(existing.cloudflare_custom_domain_dns_record_id);
      customDnsRecordId = null;
    }

    // 3. Auto-scrape styles, favicon, and logo from Shopify store url if not explicitly provided
    let finalColor = primary_color || '#c5a059';
    let finalLogo = logo || null;
    let finalFavicon = favicon || null;

    if (shopify_shop_name && (!logo || !favicon || !primary_color)) {
      const targetUrl = shopify_shop_name.includes('.') ? shopify_shop_name : `${shopify_shop_name}.myshopify.com`;
      const scraped = await scrapeShopifyBranding(targetUrl);
      if (!primary_color && scraped.primary_color) finalColor = scraped.primary_color;
      if (!logo && scraped.logo) finalLogo = scraped.logo;
      if (!favicon && scraped.favicon) finalFavicon = scraped.favicon;
    }

    await runQuery(`
      INSERT INTO brands (id, name, subdomain, shopify_shop_name, shopify_access_token, stripe_secret_key, stripe_webhook_secret, contact_email, primary_color, cloudflare_dns_record_id, custom_domain, cloudflare_custom_domain_dns_record_id, logo, favicon)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
        updated_at = CURRENT_TIMESTAMP
    `, [
      brandId,
      name,
      subdomain,
      shopify_shop_name || null,
      shopify_access_token || null,
      stripe_secret_key || null,
      stripe_webhook_secret || null,
      contact_email || null,
      finalColor,
      dnsRecordId,
      custom_domain || null,
      customDnsRecordId,
      finalLogo,
      finalFavicon
    ]);

    res.json({ success: true, brandId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete/De-onboard brand
app.delete('/api/global/brands/:id', verifyAdminToken, async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Permission denied. Superadmin access required.' });
  }
  const { id } = req.params;

  try {
    // 1. Fetch brand details to get DNS record ID
    const brand = await getQuery('SELECT name, cloudflare_dns_record_id FROM brands WHERE id = $1', [id]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand shop not found' });
    }

    // 2. Delete DNS record on Cloudflare if present
    if (brand.cloudflare_dns_record_id) {
      await deleteCloudflareSubdomain(brand.cloudflare_dns_record_id);
    }

    // 3. Delete from database (cascades to products)
    await runQuery('DELETE FROM brands WHERE id = $1', [id]);

    res.json({ success: true, message: `Brand ${brand.name} has been successfully de-onboarded.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List products (scoped by brand if merchant role)
app.get('/api/global/products', verifyAdminToken, async (req, res) => {
  try {
    if (req.user.role === 'merchant') {
      const rows = await allQuery('SELECT * FROM products WHERE brand_id = $1 ORDER BY title ASC', [req.user.brand_id]);
      return res.json(rows);
    }
    const rows = await allQuery('SELECT * FROM products ORDER BY title ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new product to specific brand
app.post('/api/global/products', verifyAdminToken, async (req, res) => {
  const { brand_id, title, price, currency, image, description, tag, original_link, long_description, features, compatibility } = req.body;

  if (!brand_id || !title || !price) {
    return res.status(400).json({ error: 'Missing required fields: brand_id, title, price' });
  }

  // Scope validation for merchants
  if (req.user.role === 'merchant' && req.user.brand_id !== brand_id) {
    return res.status(403).json({ error: 'Permission denied. Cannot add product to other brands.' });
  }

  try {
    const brand = await getQuery('SELECT id FROM brands WHERE id = $1', [brand_id]);
    if (!brand) {
      return res.status(400).json({ error: `Brand ${brand_id} does not exist.` });
    }

    const featuresJson = Array.isArray(features) ? JSON.stringify(features) : features || '[]';
    const compatibilityJson = Array.isArray(compatibility) ? JSON.stringify(compatibility) : compatibility || '[]';

    await runQuery(`
      INSERT INTO products (brand_id, title, price, currency, image, description, tag, original_link, long_description, features, compatibility)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      brand_id,
      title,
      price,
      currency || 'EUR',
      image || null,
      description || null,
      tag || null,
      original_link || null,
      long_description || null,
      featuresJson,
      compatibilityJson
    ]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product from catalog
app.delete('/api/global/products/:id', verifyAdminToken, async (req, res) => {
  const { id } = req.params;

  try {
    const product = await getQuery('SELECT brand_id, title FROM products WHERE id = $1', [parseInt(id, 10)]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Scope validation for merchants
    if (req.user.role === 'merchant' && req.user.brand_id !== product.brand_id) {
      return res.status(403).json({ error: 'Permission denied. Cannot delete product from other brands.' });
    }

    await runQuery('DELETE FROM products WHERE id = $1', [parseInt(id, 10)]);
    res.json({ success: true, message: `Product ${product.title} has been successfully deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve combined orders across all stores (Consolidated Audit List)
app.get('/api/global/orders', verifyAdminToken, async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'merchant') {
      rows = await allQuery(`
        SELECT o.*, b.name as brand_name 
        FROM orders o
        LEFT JOIN brands b ON o.brand_id = b.id
        WHERE o.brand_id = $1
        ORDER BY o.created_at DESC
      `, [req.user.brand_id]);
    } else {
      rows = await allQuery(`
        SELECT o.*, b.name as brand_name 
        FROM orders o
        LEFT JOIN brands b ON o.brand_id = b.id
        ORDER BY o.created_at DESC
      `);
    }
    const parsedRows = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items),
      shipping_address: row.shipping_address ? JSON.parse(row.shipping_address) : null
    }));
    res.json(parsedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// HANDLERS
// ----------------------------------------------------------------------------
async function handleSuccessfulPayment(orderId, customerInfo, paymentIntentId, brand) {
  try {
    console.log(`💳 Payment confirmed for order ${orderId} on brand ${brand.name}`);
    
    await runQuery(`
      UPDATE orders 
      SET status = 'paid', customer_name = $1, customer_email = $2, shipping_address = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [
      customerInfo.name, 
      customerInfo.email, 
      JSON.stringify(customerInfo.address),
      orderId
    ]);

    const order = await getQuery('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!order) return;

    const hasShopify = !!brand.shopify_shop_name && !!brand.shopify_access_token;
    if (hasShopify) {
      console.log(`🚚 Transmitting order ${orderId} to Shopify warehouse (${brand.shopify_shop_name})...`);
      const items = JSON.parse(order.items);
      
      const shopifyOrderPayload = {
        order: {
          line_items: items.map(item => ({
            title: item.title,
            price: item.price.toString(),
            quantity: item.quantity
          })),
          customer: {
            first_name: customerInfo.name.split(' ')[0] || 'Customer',
            last_name: customerInfo.name.split(' ').slice(1).join(' ') || 'User',
            email: customerInfo.email
          },
          shipping_address: {
            first_name: customerInfo.name.split(' ')[0] || 'Customer',
            last_name: customerInfo.name.split(' ').slice(1).join(' ') || 'User',
            address1: customerInfo.address?.address?.line1 || customerInfo.address?.line1 || 'No street provided',
            address2: customerInfo.address?.address?.line2 || customerInfo.address?.line2 || '',
            city: customerInfo.address?.address?.city || customerInfo.address?.city || 'No city provided',
            province: customerInfo.address?.address?.state || customerInfo.address?.state || '',
            zip: customerInfo.address?.address?.postal_code || customerInfo.address?.postal_code || '',
            country: customerInfo.address?.address?.country || customerInfo.address?.country || 'US'
          },
          financial_status: 'paid',
          note: `Dropshipped order via Stricktly Coffee Storefront. Local Ref: ${orderId}`
        }
      };

      const response = await fetch(`https://${brand.shopify_shop_name}/admin/api/2024-04/orders.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': brand.shopify_access_token
        },
        body: JSON.stringify(shopifyOrderPayload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Order logged in Shopify: ${data.order.id}`);
        await runQuery(`
          UPDATE orders 
          SET shopify_order_id = $1, status = 'sent_to_warehouse', updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [data.order.id.toString(), orderId]);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to push order to Shopify:`, errorText);
      }
    } else {
      // Mock Sandbox Shopify fulfillment
      const mockShopifyOrderId = `MOCK_SHOPIFY_${Math.floor(100000 + Math.random() * 900000)}`;
      console.log(`🚚 [Shopify Sandbox] Generating mock shopify ID: ${mockShopifyOrderId}`);
      await runQuery(`
        UPDATE orders 
        SET shopify_order_id = $1, status = 'sent_to_warehouse', updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [mockShopifyOrderId, orderId]);
    }
  } catch (err) {
    console.error('Error handling payment completion:', err);
  }
}

// Fetch products from Shopify or fallback to mock list
app.get('/api/global/shopify-import', verifyAdminToken, async (req, res) => {
  const { brandId } = req.query;
  if (!brandId) {
    return res.status(400).json({ error: 'Brand ID is required.' });
  }

  if (req.user.role === 'merchant' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Cannot import for other brands.' });
  }

  try {
    const brand = await getQuery('SELECT * FROM brands WHERE id = $1', [brandId]);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found.' });
    }

    if (brand.shopify_shop_name && brand.shopify_access_token) {
      try {
        const response = await fetch(`https://${brand.shopify_shop_name}/admin/api/2024-04/products.json`, {
          headers: {
            'X-Shopify-Access-Token': brand.shopify_access_token,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const formatted = data.products.map(p => ({
            id: p.id,
            title: p.title,
            price: p.variants && p.variants.length > 0 ? parseFloat(p.variants[0].price) : 55.00,
            image: p.images && p.images.length > 0 ? p.images[0].src : '',
            description: p.body_html || 'Premium coffee accessory imported from Shopify.'
          }));
          return res.json({ success: true, products: formatted, source: 'shopify_api' });
        }
      } catch (apiErr) {
        console.warn('[Shopify API Fetch Failed, using sandbox fallback]', apiErr.message);
      }
    }

    // Mock Fallback (Sandbox)
    const mockProducts = [
      {
        id: 'mock-1',
        title: 'Calibrated Precision Tamper (58.5mm)',
        price: 89.00,
        image: 'https://pesado585.com/cdn/shop/files/ADTamperFrontOpen.png?v=1734500064',
        description: 'caliber-calibrated 58.5mm coffee tamper built with World Barista Champion collaboration.'
      },
      {
        id: 'mock-2',
        title: 'Magnetic Espresso Funnel',
        price: 22.50,
        image: 'https://pesado585.com/cdn/shop/files/Pesado54mmMagneticDosingRing.png?v=1740032571',
        description: 'Magnetic coffee dosing ring ring to prevent grind spills.'
      },
      {
        id: 'mock-3',
        title: 'Shower Screen E61 (High Diffusion)',
        price: 49.00,
        image: 'https://pesado585.com/cdn/shop/files/LMHD_a20fcda8-4b93-430c-ba92-da68aac7be98.jpg?v=1757481591',
        description: 'Precision water diffusion screens for optimal commercial extraction.'
      }
    ];

    res.json({ success: true, products: mockProducts, source: 'sandbox_mock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import product from Shopify into brand catalog
app.post('/api/global/shopify-import', verifyAdminToken, async (req, res) => {
  const { brandId, title, price, image, description } = req.body;

  if (!brandId || !title || !price) {
    return res.status(400).json({ error: 'Brand ID, Title, and Price are required.' });
  }

  if (req.user.role === 'merchant' && req.user.brand_id !== brandId) {
    return res.status(403).json({ error: 'Permission denied. Cannot import for other brands.' });
  }

  try {
    // Insert imported item into DB
    await runQuery(`
      INSERT INTO products (brand_id, title, price, currency, image, description, tag, original_link, long_description, features, compatibility)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      brandId,
      title,
      price,
      'EUR',
      image || '',
      description || '',
      'Imported',
      'https://shopify.com',
      description || '',
      JSON.stringify(['Imported via Shopify integration', 'Calibrated dimensions']),
      JSON.stringify(['Commercial 58mm filter baskets'])
    ]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

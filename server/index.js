import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stripeLib from 'stripe';
import { runQuery, getQuery, allQuery } from './db.js';

dotenv.config();

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

// ----------------------------------------------------------------------------
// MULTI-TENANT BRAND HOST RESOLUTION MIDDLEWARE
// ----------------------------------------------------------------------------
app.use(async (req, res, next) => {
  // Skip brand resolution for global endpoints and Stripe webhook parameters
  if (req.path.startsWith('/api/global/') || req.path.startsWith('/api/webhook/stripe/')) {
    return next();
  }

  const host = req.headers.host || '';
  const hostname = host.split(':')[0]; // strip port in local dev (e.g. :8081)

  try {
    // 1. Direct subdomain lookup (e.g. pesado.stricktlycoffee.be)
    let brand = await getQuery('SELECT * FROM brands WHERE subdomain = $1', [hostname]);

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
  const { id, name, subdomain, contact_email, primary_color } = req.brand;
  res.json({ id, name, subdomain, contact_email, primary_color });
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
        success_url: `${req.headers.origin}/pesado/track.html?orderId=${orderId}&status=success`,
        cancel_url: `${req.headers.origin}/pesado/index.html`
      });

      // Update order with the real session ID
      await runQuery('UPDATE orders SET stripe_session_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [session.id, orderId]);

      res.json({ url: session.url });
    } else {
      // Mock Sandbox Checkout redirect
      console.log(`[Stripe Sandbox] Brand ${req.brand.name} checkout. Returning mock checkout URL.`);
      res.json({ 
        url: `/pesado/checkout-mock.html?orderId=${orderId}&email=${encodeURIComponent(customerEmail)}&name=${encodeURIComponent(customerName)}`
      });
    }
  } catch (err) {
    console.error('[Checkout] Error initiating checkout:', err);
    res.status(500).json({ error: err.message });
  }
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

// Retrieve orders for the active tenant brand (Warehouse dashboard context)
app.get('/api/admin/orders', async (req, res) => {
  try {
    const rows = await allQuery('SELECT * FROM orders WHERE brand_id = $1 ORDER BY created_at DESC', [req.brand.id]);
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
app.post('/api/admin/fulfill', async (req, res) => {
  const { orderId, trackingNumber, trackingCarrier } = req.body;

  try {
    const order = await getQuery('SELECT * FROM orders WHERE id = $1 AND brand_id = $2', [orderId, req.brand.id]);
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
// SYSTEM ADMINISTRATION API (For onboarding new shops at admin.stricktlycoffee.be)
// ----------------------------------------------------------------------------

// List all brands
app.get('/api/global/brands', async (req, res) => {
  try {
    const rows = await allQuery('SELECT id, name, subdomain, contact_email, primary_color, shopify_shop_name, stripe_secret_key IS NOT NULL as has_stripe, shopify_access_token IS NOT NULL as has_shopify FROM brands ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Onboard new brand
app.post('/api/global/brands', async (req, res) => {
  const { id, name, subdomain, shopify_shop_name, shopify_access_token, stripe_secret_key, stripe_webhook_secret, contact_email, primary_color } = req.body;

  if (!id || !name || !subdomain) {
    return res.status(400).json({ error: 'Missing required fields: id, name, subdomain' });
  }

  try {
    await runQuery(`
      INSERT INTO brands (id, name, subdomain, shopify_shop_name, shopify_access_token, stripe_secret_key, stripe_webhook_secret, contact_email, primary_color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        subdomain = EXCLUDED.subdomain,
        shopify_shop_name = EXCLUDED.shopify_shop_name,
        shopify_access_token = EXCLUDED.shopify_access_token,
        stripe_secret_key = EXCLUDED.stripe_secret_key,
        stripe_webhook_secret = EXCLUDED.stripe_webhook_secret,
        contact_email = EXCLUDED.contact_email,
        primary_color = EXCLUDED.primary_color,
        updated_at = CURRENT_TIMESTAMP
    `, [
      id.trim().toLowerCase(),
      name,
      subdomain,
      shopify_shop_name || null,
      shopify_access_token || null,
      stripe_secret_key || null,
      stripe_webhook_secret || null,
      contact_email || null,
      primary_color || '#c5a059'
    ]);

    res.json({ success: true, brandId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new product to specific brand
app.post('/api/global/products', async (req, res) => {
  const { brand_id, title, price, currency, image, description, tag, original_link, long_description, features, compatibility } = req.body;

  if (!brand_id || !title || !price) {
    return res.status(400).json({ error: 'Missing required fields: brand_id, title, price' });
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

// Retrieve combined orders across all stores (Consolidated Audit List)
app.get('/api/global/orders', async (req, res) => {
  try {
    const rows = await allQuery(`
      SELECT o.*, b.name as brand_name 
      FROM orders o
      LEFT JOIN brands b ON o.brand_id = b.id
      ORDER BY o.created_at DESC
    `);
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

// Start Server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

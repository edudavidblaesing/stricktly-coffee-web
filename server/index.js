import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stripeLib from 'stripe';
import { runQuery, getQuery, allQuery } from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Dynamic configuration status logging
const hasStripe = !!process.env.STRIPE_SECRET_KEY;
const hasShopify = !!process.env.SHOPIFY_SHOP_NAME && !!process.env.SHOPIFY_ACCESS_TOKEN;

console.log(`Backend Mode: Stripe API is ${hasStripe ? 'ACTIVE' : 'MOCKED (Sandbox)'}`);
console.log(`Backend Mode: Shopify API is ${hasShopify ? 'ACTIVE' : 'MOCKED (Sandbox)'}`);

const stripe = hasStripe ? new stripeLib(process.env.STRIPE_SECRET_KEY) : null;

// Products Data Catalog
const products = [
  {
    id: 1,
    title: "High Diffusion Espresso Shower Screen",
    price: 60.50,
    currency: "EUR",
    image: "https://pesado585.com/cdn/shop/files/LMHD_a20fcda8-4b93-430c-ba92-da68aac7be98.jpg?v=1757481591",
    description: "Introducing the Pesado High Diffusion Shower Screen. This HD espresso shower screen is designed for precision, ensuring consistency in every shot. Fits E61, La Marzocco, and standard 58mm group heads.",
    tag: "Best Seller"
  },
  {
    id: 2,
    title: "Magnetic Espresso Dosing Ring",
    price: 24.75,
    currency: "EUR",
    image: "https://pesado585.com/cdn/shop/files/Pesado54mmMagneticDosingRing.png?v=1740032571",
    description: "Upgrade your coffee game with our Magnetic Espresso Dosing Ring. It's the efficient and effective way to dose for maximum preparation, preventing messy spills and ensuring all grounds end up in the portafilter.",
    tag: "Essential"
  },
  {
    id: 3,
    title: "Spring-Loaded Self-Leveling Tamper",
    price: 132.00,
    currency: "EUR",
    image: "https://pesado585.com/cdn/shop/files/ADTamperFrontOpen.png?v=1734500064",
    description: "In collaboration with 2022 World Barista Champion Anthony Douglas, we created a self-leveling spring-loaded tamper worthy of barista championships. Perfect consistency and level every single time.",
    tag: "AD Edition"
  },
  {
    id: 4,
    title: "High Diffusion Espresso Shower Screen - Breville",
    price: 55.00,
    currency: "EUR",
    image: "https://pesado585.com/cdn/shop/files/BREVILLEHIGHDIFFUSION_79fa8dc9-5393-490c-86b4-a8726e133756.jpg?v=1774927374",
    description: "Precision Coffee tools for all barista levels. Designed specifically for Breville/Sage 54mm group heads to ensure perfect water distribution and prevent channeling.",
    tag: "New Release"
  }
];

// Helper to resolve product
const getProductById = (id) => products.find(p => p.id === parseInt(id));

// CORS Enablement
app.use(cors());

// Stripe Webhook Endpoint (needs raw body)
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  if (hasStripe && sig && endpointSecret) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // If not in live mode, webhooks are simulated via simulated routes
    return res.status(400).send('Stripe webhook keys missing; webhooks are simulated.');
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await handleSuccessfulPayment(session.client_reference_id, {
      name: session.customer_details?.name || 'Customer',
      email: session.customer_details?.email,
      address: session.shipping_details || session.customer_details?.address
    }, session.payment_intent);
  }

  res.json({ received: true });
});

// JSON parser for all other routes
app.use(express.json());

// Get Products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Create Checkout Session
app.post('/api/checkout', async (req, res) => {
  try {
    const { items, customerName, customerEmail } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate details and validate items
    let subtotal = 0;
    const validatedItems = [];
    
    for (const cartItem of items) {
      const prod = getProductById(cartItem.id);
      if (!prod) {
        return res.status(400).json({ error: `Invalid product ID: ${cartItem.id}` });
      }
      subtotal += prod.price * cartItem.quantity;
      validatedItems.push({
        id: prod.id,
        title: prod.title,
        price: prod.price,
        quantity: cartItem.quantity,
        image: prod.image
      });
    }

    const total = subtotal; // Simplicity: no shipping/tax logic added here
    const orderId = `PES_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Create Order in pending state
    await runQuery(`
      INSERT INTO orders (id, stripe_session_id, customer_name, customer_email, items, subtotal, total, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderId,
      orderId, // In mock mode, stripe session is the order ID
      customerName || 'Anonymous User',
      customerEmail || 'no-email@example.com',
      JSON.stringify(validatedItems),
      subtotal,
      total,
      'pending_payment'
    ]);

    if (hasStripe) {
      // Create actual Stripe Checkout Session
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
      await runQuery(`
        UPDATE orders SET stripe_session_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `, [session.id, orderId]);

      res.json({ url: session.url });
    } else {
      // Return simulation url for sandbox
      console.log(`[Stripe Sandbox] Order ${orderId} created. Returning mock checkout URL.`);
      res.json({ 
        url: `/pesado/checkout-mock.html?orderId=${orderId}&email=${encodeURIComponent(customerEmail)}&name=${encodeURIComponent(customerName)}`
      });
    }
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Simulated checkout confirmation (Sandbox Webhook alternative)
app.post('/api/admin/simulate-stripe-payment', async (req, res) => {
  const { orderId, name, email, shipping } = req.body;

  try {
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending_payment') {
      return res.status(400).json({ error: 'Order has already been processed' });
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
    }, 'MOCK_PAY_INTENT_' + Date.now());

    res.json({ success: true, orderId });
  } catch (err) {
    console.error('Simulation payment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Shopify fulfillment status webhook callback
app.post('/api/webhook/shopify', async (req, res) => {
  // Webhook received from Shopify when an order is updated/fulfilled
  const payload = req.body;
  const shopifyOrderId = payload.order_id || payload.id;
  const fulfillment = payload.fulfillment || (payload.fulfillments ? payload.fulfillments[0] : null);

  if (fulfillment && shopifyOrderId) {
    const trackingNumber = fulfillment.tracking_number;
    const trackingCarrier = fulfillment.tracking_company || 'DHL';
    const trackingUrl = fulfillment.tracking_url || `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;

    try {
      const order = await getQuery('SELECT * FROM orders WHERE shopify_order_id = ?', [shopifyOrderId]);
      if (order) {
        await runQuery(`
          UPDATE orders 
          SET status = 'shipped', tracking_number = ?, tracking_carrier = ?, tracking_url = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [trackingNumber, trackingCarrier, trackingUrl, order.id]);
        
        console.log(`[Webhook Shopify] Order ${order.id} updated with tracking: ${trackingNumber} via ${trackingCarrier}`);
      }
    } catch (err) {
      console.error('Shopify webhook processing failed:', err);
    }
  }

  res.status(200).send('OK');
});

// Retrieve Order tracking details
app.get('/api/order/:id', async (req, res) => {
  try {
    const order = await getQuery('SELECT * FROM orders WHERE id = ? OR stripe_session_id = ?', [req.params.id, req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Convert items back to object
    order.items = JSON.parse(order.items);
    if (order.shipping_address) {
      order.shipping_address = JSON.parse(order.shipping_address);
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve list of all orders (for Admin / Mock Warehouse Dashboard)
app.get('/api/admin/orders', async (req, res) => {
  try {
    const rows = await allQuery('SELECT * FROM orders ORDER BY created_at DESC');
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

// Simulate shopify warehouse dispatch fulfillment
app.post('/api/admin/fulfill', async (req, res) => {
  const { orderId, trackingNumber, trackingCarrier } = req.body;

  try {
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const tNumber = trackingNumber || `TRACK${Math.floor(100000 + Math.random() * 900000)}`;
    const tCarrier = trackingCarrier || 'DHL Express';
    const tUrl = `https://www.dhl.com/en/express/tracking.html?AWB=${tNumber}`;

    await runQuery(`
      UPDATE orders 
      SET status = 'shipped', tracking_number = ?, tracking_carrier = ?, tracking_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [tNumber, tCarrier, tUrl, orderId]);

    console.log(`[Warehouse Simulation] Fulfilling order ${orderId} with tracking code: ${tNumber}`);
    res.json({ success: true, trackingNumber: tNumber, trackingCarrier: tCarrier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Process successful payment and dispatch to Shopify
async function handleSuccessfulPayment(orderId, customerInfo, paymentIntentId) {
  try {
    console.log(`💳 Payment confirmed for order: ${orderId}`);
    
    // Update local database to Paid
    await runQuery(`
      UPDATE orders 
      SET status = 'paid', customer_name = ?, customer_email = ?, shipping_address = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      customerInfo.name, 
      customerInfo.email, 
      JSON.stringify(customerInfo.address),
      orderId
    ]);

    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return;

    // Send order to Shopify warehouse (dropshipping destination)
    if (hasShopify) {
      console.log(`🚚 Transmitting order ${orderId} to Shopify warehouse...`);
      const items = JSON.parse(order.items);
      
      // Structure Shopify JSON request payload
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
          note: `Dropshipped order via Stricktly Coffee Pesado Webshop. Local order Ref: ${orderId}`
        }
      };

      const response = await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}/admin/api/2024-04/orders.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN
        },
        body: JSON.stringify(shopifyOrderPayload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Order successfully logged in Shopify: ${data.order.id}`);
        await runQuery(`
          UPDATE orders 
          SET shopify_order_id = ?, status = 'sent_to_warehouse', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [data.order.id.toString(), orderId]);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to push order to Shopify:`, errorText);
      }
    } else {
      // Mock shopify integration
      const mockShopifyOrderId = `MOCK_SHOPIFY_${Math.floor(100000 + Math.random() * 900000)}`;
      console.log(`🚚 [Shopify Sandbox] Creating order in Shopify. Generated mock ID: ${mockShopifyOrderId}`);
      await runQuery(`
        UPDATE orders 
        SET shopify_order_id = ?, status = 'sent_to_warehouse', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [mockShopifyOrderId, orderId]);
    }
  } catch (err) {
    console.error('Error handling successful payment:', err);
  }
}

// Start Server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

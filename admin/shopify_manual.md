# Shopify Dropshipping Integration Manual

Follow this step-by-step guide to integrate new Shopify brand storefronts with the Stricktly Coffee dropshipping engine.

---

## 1. Create a Shopify Custom Partner App
To securely link your store catalog and fulfill client transactions, you must generate an **Admin API Access Token**:
1. Log into your **Shopify Admin Dashboard**.
2. Navigate to **Settings** > **App and sales channels** > **Develop apps**.
3. Click **Create an app**. Name it `Stricktly Coffee Fulfillment` and select your developer account.

---

## 2. Configure Admin API Permissions
Stricktly Coffee requires specific API scopes to fetch products and manage fulfillment:
1. Click **Configuration** in your new App panel.
2. Select **Configure Admin API integration**.
3. Check the following scopes:
   - `write_orders`, `read_orders` (For syncing purchases to the warehouse simulator)
   - `read_products` (For scanning and importing items to the catalog)
   - `read_inventory` (To synchronize product stock levels)
4. Click **Save** at the bottom of the configuration view.

---

## 3. Install App & Copy Access Token
Once scopes are configured, you can install the custom app:
1. Click **Install App** in the top-right corner.
2. Under **Admin API access token**, click **Reveal token once**.
3. **IMPORTANT**: Copy this token immediately (starts with `shpat_`) and save it securely. You cannot reveal it again.

---

## 4. Register Shopify Webhooks
To automatically notify our warehouse simulator when an order is created on Shopify:
1. Scroll down to the **Webhooks** section in App Settings.
2. Click **Create Webhook**.
3. Set the event to: `Order creation` (`orders/create`).
4. Set the URL endpoint to:
   - **Local Sandbox**: `http://localhost:8082/api/webhook/stripe/pesado`
   - **Production Stack**: `https://api.stricktlycoffee.be/api/webhook/stripe/[YOUR_BRAND_ID]`
5. Set the format to `JSON` and click **Save**.

---

## 5. Add Brand Configuration inside Stricktly Coffee Admin Hub
Once credentials are ready, add them inside our panel:
1. Go to the **Channels** tab in the Stricktly Coffee Admin Hub.
2. Fill out the onboarding form:
   - **Brand ID**: e.g., `pesado` (matches the slug)
   - **Subdomain**: e.g., `pesado.stricktlycoffee.be` (Cloudflare subdomain will be created instantly!)
   - **Shopify Shop Name**: `your-store-name.myshopify.com`
   - **Shopify Admin API Token**: Paste the `shpat_` token copied in Step 3.
3. Click **Onboard & Save**.

<template>
    <div id="view-help" class="admin-view inset-view" :class="{ active: app.activeView === 'help' }">
        <div style="display: grid; grid-template-columns: 240px 1fr; gap: 20px; flex: 1; min-height: 0;">
            <!-- Left Sidebar: Guide Categories -->
            <div class="panel" style="height: 100%; overflow-y: auto;">
                <div class="panel-header">
                    <h3 class="panel-title">Knowledge Base</h3>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px; padding: 16px;">
                    <button v-for="cat in categories" :key="cat.id" class="btn" style="text-align: left; width: 100%; margin: 0; padding: 10px 12px; font-size: 0.85rem; font-weight: 600; border-radius: 6px; display: flex; align-items: center; gap: 8px;"
                        :style="activeCategory === cat.id ? 'background: var(--primary); color: var(--bg-color); border-color: var(--primary);' : 'background: none; border: none; color: var(--text-muted);'"
                        @click="activeCategory = cat.id">
                        <span>{{ cat.icon }}</span>
                        <span>{{ cat.name }}</span>
                    </button>
                </div>
            </div>

            <!-- Main Content Area -->
            <div class="panel" style="height: 100%; display: flex; flex-direction: column; overflow: hidden;">
                <div class="panel-header" style="flex-shrink: 0; margin-bottom: 20px;">
                    <h3 class="panel-title">Help Center Guidelines</h3>
                    <div style="position: relative; width: 300px;">
                        <input type="text" v-model="searchQuery" placeholder="Search guides..." 
                            style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 6px 12px 6px 30px; font-size: 0.82rem; height: 32px;">
                        <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.82rem;">🔍</span>
                    </div>
                </div>

                <div style="flex: 1; min-height: 0; overflow-y: auto; padding-right: 4px;">
                    <!-- Searching state -->
                    <div v-if="searchQuery.trim()" style="flex-grow: 1;">
                        <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 16px;">Search Results for "{{ searchQuery }}"</h3>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div v-for="article in searchedArticles" :key="article.title" class="panel" style="padding: 16px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px;">
                                <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--accent); margin-bottom: 6px;">{{ article.title }}</h4>
                                <p style="font-size: 0.85rem; color: var(--text-main); line-height: 1.5; white-space: pre-line;" v-html="highlightCode(article.content)"></p>
                            </div>
                            <div v-if="searchedArticles.length === 0" style="text-align: center; color: var(--text-muted); padding: 40px 10px;">
                                <span style="font-size: 2rem; display: block; margin-bottom: 8px;">🔍</span>
                                <span>No guides match your search parameters. Try searching for "Shopify", "API", or "DNS".</span>
                            </div>
                        </div>
                    </div>

                    <!-- Standard Category Views -->
                    <div v-else style="flex-grow: 1;">
                        <!-- Category 1: Shopify Integration -->
                        <div v-if="activeCategory === 'shopify'">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                                <span style="font-size: 1.8rem;">🛍️</span>
                                <div>
                                    <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin: 0;">Shopify Partner App Connection Guide</h3>
                                    <p style="font-size: 0.78rem; color: var(--text-muted); margin: 2px 0 0 0;">Synchronize catalogs, track inventory, and automate customer order logs</p>
                                </div>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 16px;">
                                <div class="panel" style="padding: 16px; border-left: 4px solid var(--primary); background: var(--card-bg);">
                                    <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Step 1: Create a Custom Partner App</h4>
                                    <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin: 0;">
                                        Log into your Shopify Admin Panel, navigate to <strong>Settings</strong> > <strong>Apps and sales channels</strong> > <strong>Develop apps</strong>, and click <strong>Create an app</strong>. Name the integration <code>Stricktly Coffee Fulfillment</code>.
                                    </p>
                                </div>

                                <div class="panel" style="padding: 16px; border-left: 4px solid var(--primary); background: var(--card-bg);">
                                    <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Step 2: Configure Admin API Integration Scopes</h4>
                                    <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin: 0; mb-4: 10px;">
                                        Click <strong>Configuration</strong> > <strong>Configure Admin API integration</strong>. Select and grant the following permissions:
                                    </p>
                                    <ul style="margin: 8px 0 0 16px; font-size: 0.82rem; color: var(--text-main); line-height: 1.6;">
                                        <li><code>write_orders</code>, <code>read_orders</code> — For sending order transactions to the warehouse simulator</li>
                                        <li><code>read_products</code> — For scanning catalogs and importing items</li>
                                        <li><code>read_inventory</code> — To automatically monitor and synchronize coffee bean stock levels</li>
                                    </ul>
                                </div>

                                <div class="panel" style="padding: 16px; border-left: 4px solid var(--primary); background: var(--card-bg);">
                                    <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Step 3: Reveal and Copy Token</h4>
                                    <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin: 0;">
                                        Click <strong>Install App</strong> in the top header. Click <strong>Reveal token once</strong> and copy the Admin API token key (starts with <code>shpat_</code>). Keep this private.
                                    </p>
                                </div>

                                <div class="panel" style="padding: 16px; border-left: 4px solid var(--primary); background: var(--card-bg);">
                                    <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Step 4: Register Order Creation Webhooks</h4>
                                    <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin: 0;">
                                        Scroll down to the Webhooks segment. Click <strong>Create Webhook</strong>. Select event <code>orders/create</code> (Order creation) and format <code>JSON</code>. Set URL to:
                                        <code style="display: block; background: var(--bg-color); padding: 8px; border-radius: 6px; margin-top: 8px; font-family: monospace; font-size: 0.78rem; border: 1px solid var(--border); color: var(--accent);">https://api.stricktlycoffee.be/api/webhook/stripe/[YOUR_BRAND_ID]</code>
                                    </p>
                                </div>

                                <div class="panel" style="padding: 16px; border-left: 4px solid var(--primary); background: var(--card-bg);">
                                    <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Step 5: Activate Brand Config</h4>
                                    <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin: 0;">
                                        Go to the <strong>Brands</strong> or <strong>System Settings</strong> panel inside Stricktly Coffee dashboard. Input your Shopify store URL (e.g. <code>my-store.myshopify.com</code>) and paste the token, then click Onboard to verify.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Category 2: WooCommerce Integration -->
                        <div v-if="activeCategory === 'woocommerce'">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                                <span style="font-size: 1.8rem;">🔌</span>
                                <div>
                                    <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin: 0;">WooCommerce API Connection Guide</h3>
                                    <p style="font-size: 0.78rem; color: var(--text-muted); margin: 2px 0 0 0;">Link WordPress-based storefronts to our fulfillment backend</p>
                                </div>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 16px;">
                                <div class="panel" style="padding: 16px; border-left: 4px solid var(--primary); background: var(--card-bg);">
                                    <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Step 1: Generate REST API Consumer Credentials</h4>
                                    <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin: 0;">
                                        Log into WordPress Admin. Go to <strong>WooCommerce</strong> > <strong>Settings</strong> > <strong>Advanced</strong> > <strong>REST API</strong>. Click <strong>Add Key</strong>. Provide description <code>Stricktly Coffee Fulfillment</code>, select owner, and grant <strong>Read/Write</strong> permissions.
                                    </p>
                                </div>

                                <div class="panel" style="padding: 16px; border-left: 4px solid var(--primary); background: var(--card-bg);">
                                    <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Step 2: Copy API Keys</h4>
                                    <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin: 0;">
                                        Copy the generated Consumer Key (starts with <code>ck_</code>) and Consumer Secret (starts with <code>cs_</code>) keys. Paste these into your shop channels settings inside Stricktly Coffee dashboard.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Category 3: DNS & Custom Domains -->
                        <div v-if="activeCategory === 'dns'">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                                <span style="font-size: 1.8rem;">🌐</span>
                                <div>
                                    <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin: 0;">DNS Routing & Domain White-Labeling</h3>
                                    <p style="font-size: 0.78rem; color: var(--text-muted); margin: 2px 0 0 0;">Map your own brand domain address to host strictly coffee storefronts</p>
                                </div>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 16px;">
                                <div class="panel" style="padding: 16px; border-left: 4px solid var(--primary); background: var(--card-bg);">
                                    <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Step 1: Point DNS CNAME Records</h4>
                                    <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin: 0;">
                                        Navigate to your domain registrar (GoDaddy, Namecheap, Google Domains) or Cloudflare panel. Add a new <strong>CNAME</strong> record:
                                    </p>
                                    <ul style="margin: 8px 0 0 16px; font-size: 0.82rem; color: var(--text-main); line-height: 1.6;">
                                        <li><strong>Type:</strong> <code>CNAME</code></li>
                                        <li><strong>Host/Name:</strong> <code>@</code> (root) or subdomain (e.g. <code>shop</code>)</li>
                                        <li><strong>Value/Target:</strong> <code>cname.stricktlycoffee.be</code></li>
                                        <li><strong>TTL:</strong> <code>Auto</code> or <code>3600</code></li>
                                    </ul>
                                </div>

                                <div class="panel" style="padding: 16px; border-left: 4px solid var(--primary); background: var(--card-bg);">
                                    <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Step 2: Disable Proxy (DNS Only)</h4>
                                    <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin: 0;">
                                        If you use Cloudflare DNS, make sure to set the Proxy Status toggle to <strong>DNS Only</strong> (Grey cloud icon). Enabling Cloudflare proxy over our Traefik routes will break automated Let's Encrypt SSL handshake verification.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Category 4: FAQs -->
                        <div v-if="activeCategory === 'faqs'">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                                <span style="font-size: 1.8rem;">❓</span>
                                <div>
                                    <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin: 0;">Frequently Asked Questions</h3>
                                    <p style="font-size: 0.78rem; color: var(--text-muted); margin: 2px 0 0 0;">Quick answers to common merchant and fulfillment topics</p>
                                </div>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <div v-for="(faq, idx) in faqs" :key="idx" class="panel" style="padding: 12px 16px; cursor: pointer; transition: 0.2s;" @click="toggleFaq(idx)">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-size: 0.88rem; font-weight: 700; color: var(--text-main);">{{ faq.q }}</span>
                                        <span style="font-size: 0.8rem; color: var(--text-muted);">{{ activeFaq === idx ? '▲' : '▼' }}</span>
                                    </div>
                                    <div v-if="activeFaq === idx" style="margin-top: 10px; font-size: 0.82rem; color: var(--text-muted); line-height: 1.5; border-top: 1px solid var(--border); padding-top: 8px;">
                                        {{ faq.a }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'HelpView',
    inject: ['app'],
    data() {
        return {
            categories: [
                { id: 'shopify', name: 'Shopify Sync', icon: '🛍️' },
                { id: 'woocommerce', name: 'WooCommerce REST', icon: '🔌' },
                { id: 'dns', name: 'DNS & Domains', icon: '🌐' },
                { id: 'faqs', name: 'FAQs', icon: '❓' }
            ],
            activeCategory: 'shopify',
            searchQuery: '',
            activeFaq: null,
            faqs: [
                { q: 'How does Stricktly Coffee fulfill my products?', a: 'Stricktly Coffee integrates directly with warehouse centers. When an order is created, the system triggers the warehouse fulfillment flow. The orders list tracks real-time packages packaging, sorting, and dispatch steps.' },
                { q: 'What is the Warehouse Simulator?', a: 'The Warehouse Simulator replicates third-party dropshipping logistics. Merchants can simulate order creation, trigger fulfillment packaging, assign tracking numbers, and view automatic shipping updates downstream.' },
                { q: 'How do I customize my storefront design?', a: 'In the Channels list, click "Design" next to any brand subdomain to launch the Storefront Designer. You can configure primary/secondary colors, text colors, margins, radii, upload custom logos, and test layouts using the preview sandbox.' },
                { q: 'Does Stripe payment flow support sandboxed testing?', a: 'Yes! The platform is configured to process Stripe checkout parameters. For local testing, Stripe uses pre-configured sandbox modes, allowing you to checkout using test cards without real charges.' },
                { q: 'Can I add custom color values to storefront themes?', a: 'Absolutely. Both System Settings and the Storefront Customizer include Hex color pickers. You can type or pick exact hex codes to match your brand assets.' }
            ],
            articles: [
                { title: 'Shopify Partner App credentials setup', content: 'Create a custom partner app inside Shopify Admin > Settings > Apps. Grant permissions for read_products, read_inventory, read_orders, and write_orders. Install the app, copy the API access token (starts with shpat_), and save it inside your Stricktly Coffee settings.' },
                { title: 'WooCommerce WordPress API configuration', content: 'Generate WooCommerce REST API keys in WordPress settings > Advanced > REST API. Grant Read/Write access. Paste the Consumer Key (ck_...) and Consumer Secret (cs_...) to link WordPress coffee products directly to our warehouse simulator.' },
                { title: 'Custom CNAME Record mapping guide', content: 'To map a custom domain (e.g. coffee.shop.com), create a CNAME record at your DNS provider pointing to cname.stricktlycoffee.be. Disable Cloudflare proxy (set to DNS Only) if you encounter SSL handshake failures.' },
                { title: 'Attribution tracking parameters (UTM)', content: 'The storefront tracks visitor attributions. When checking out, utm_source, utm_medium, utm_campaign, and referral referrers are saved automatically to the orders table, allowing you to view campaign performance charts.' },
                { title: 'Referral rewards & post-purchase email coupons', content: 'Referral systems automatically schedule discount emails to customers after their packages are marked delivered. You can customize wait times, discount values, and email templates under System Settings.' }
            ]
        };
    },
    computed: {
        searchedArticles() {
            if (!this.searchQuery.trim()) return [];
            const query = this.searchQuery.toLowerCase();
            return this.articles.filter(a => 
                a.title.toLowerCase().includes(query) || 
                a.content.toLowerCase().includes(query)
            );
        }
    },
    methods: {
        toggleFaq(idx) {
            this.activeFaq = this.activeFaq === idx ? null : idx;
        },
        highlightCode(text) {
            // Replaces text inside backticks with styled code tags
            return text.replace(/`(.*?)`/g, '<code style="background: var(--border); border: 1px solid var(--border); padding: 1px 5px; border-radius: 4px; font-family: monospace; font-size: 0.8rem; color: var(--accent);">$1</code>');
        }
    }
}
</script>

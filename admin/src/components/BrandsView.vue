<template>
    <div id="view-brands" class="admin-view" :class="{ active: app.activeView === 'brands' }">
        <!-- Sub-View: Embedded Storefront Designer -->
        <div v-if="activeSubView === 'designer'" style="width: 100%;">
            <DesignerView @back="activeSubView = 'list'" />
        </div>

        <!-- Sub-View: Embedded Landing Page Designer -->
        <div v-else-if="activeSubView === 'landing-designer'" style="width: 100%;">
            <LandingPageDesignerView @back="activeSubView = 'list'" />
        </div>

        <div v-else style="width: 100%;">

            <div class="panel" v-if="userRole.toLowerCase() === 'superadmin' && isCreatingBrand">
            <div class="panel-header">
                <h3 class="panel-title" style="margin: 0;">Spin Up New Brand Shop</h3>
            </div>
            
            <!-- Step Progress Indicator -->
            <div class="step-progress-bar" style="display: flex; justify-content: space-between; margin: 10px 0 15px 0; border-bottom: 1px solid var(--border); padding-bottom: 8px; gap: 10px;">
                <div v-for="step in [1, 2, 3, 4]" :key="step" 
                     :style="{ 
                        flex: 1, 
                        textAlign: 'center', 
                        padding: '4px 0', 
                        borderBottom: currentStep === step ? '2px solid var(--accent)' : '2px solid transparent',
                        color: currentStep === step ? 'var(--text-main)' : 'var(--text-muted)',
                        fontWeight: currentStep === step ? 'bold' : 'normal',
                        cursor: 'pointer',
                        fontSize: '0.82rem'
                     }"
                     @click="goToStep(step)">
                    Step {{ step }}: {{ getStepTitle(step) }}
                </div>
            </div>

            <form @submit.prevent style="margin-top: 15px;">
                <!-- STEP 1: CONNECTION & VERIFICATION -->
                <div v-if="currentStep === 1">
                    <!-- Easy Setup section -->
                    <div class="easy-setup-container" style="margin: 15px 0 25px 0; padding: 18px; background: rgba(255, 255, 255, 0.02); border: 1px dashed var(--border); border-radius: 8px;">
                        <label style="display: block; font-weight: 700; margin-bottom: 8px; color: var(--text-main);">⚡ Easy Setup (Autofill via Website/Shopify URL)</label>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <input type="text" v-model="easySetupUrl" placeholder="Enter shop URL (e.g., https://pesado585.com)" style="margin: 0; flex: 1;" @keydown.enter.prevent="runEasySetup">
                            <button type="button" class="btn" @click="runEasySetup" :disabled="easySetupLoading" style="margin: 0; height: 42px; display: flex; align-items: center; justify-content: center; gap: 8px; min-width: 140px;">
                                <span v-if="easySetupLoading" class="spinner"></span>
                                <span>{{ easySetupLoading ? 'Scraping...' : 'Autofill Form' }}</span>
                            </button>
                        </div>
                        <div v-if="easySetupError" style="color: #ef4444; font-size: 0.82rem; margin-top: 8px; font-weight: 500;">
                            ❌ {{ easySetupError }}
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 6px;">
                            Enter any website or store link. We will crawl it to auto-extract the Brand ID slug, name, subdomain, support contact, custom colors, logo, favicon, and detect the platform type.
                        </div>
                    </div>

                    <div class="form-grid">
                        <div class="form-group">
                            <label>Brand ID (Unique Slug, e.g. "pesado")</label>
                            <input type="text" v-model="newBrand.id" required placeholder="pesado" :disabled="dnsVerified && !previewMode">
                        </div>
                        <div class="form-group">
                            <label>Brand Display Name</label>
                            <input type="text" v-model="newBrand.name" required placeholder="Pesado 58.5">
                        </div>
                        <div class="form-group form-full">
                            <label>Storefront Domain Routing Address</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="text" 
                                    v-model="domainInputValue" 
                                    :placeholder="localDomainType === 'external' ? 'coffee-brandsite.com' : 'brand-slug'" 
                                    :pattern="localDomainType === 'external' ? '^(?!:\\/\\/)([a-zA-Z0-9-_]+\\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\\.[a-zA-Z]{2,11}$' : '^[a-z0-9-]+$'" 
                                    required 
                                    :disabled="dnsVerified && !previewMode" 
                                    style="flex: 1; margin: 0; background: var(--workspace-bg);">
                                
                                <select v-model="localDomainType" 
                                    :disabled="dnsVerified && !previewMode" 
                                    style="width: 200px; height: 42px; border-radius: 8px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 12px; font-size: 0.85rem; cursor: pointer; font-weight: 700; margin: 0;">
                                    <option value="subdomain">.{{ app.baseBrandDomain }}</option>
                                    <option value="external">Custom Domain</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Support Contact Email</label>
                            <input type="email" v-model="newBrand.contact_email" required placeholder="support@pesado585.com">
                        </div>

                        <!-- Language Selection -->
                        <div class="form-group form-full">
                            <label style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--text-main);">Storefront Supported Languages</label>
                            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px;">
                                <label v-for="lang in availableLanguages" :key="lang.code" 
                                       :style="{
                                           display: 'inline-flex',
                                           alignItems: 'center',
                                           gap: '6px',
                                           padding: '6px 12px',
                                           borderRadius: '20px',
                                           border: '1px solid ' + (newBrand.languages && newBrand.languages.includes(lang.code) ? 'var(--text-main)' : 'var(--border)'),
                                           background: newBrand.languages && newBrand.languages.includes(lang.code) ? 'var(--text-main)' : 'transparent',
                                           color: newBrand.languages && newBrand.languages.includes(lang.code) ? 'var(--workspace-bg)' : 'var(--text-main)',
                                           cursor: 'pointer',
                                           fontSize: '0.82rem',
                                           fontWeight: '600',
                                           userSelect: 'none',
                                           transition: 'all 0.2s ease'
                                       }">
                                    <input type="checkbox" :value="lang.code" v-model="newBrand.languages" style="display: none;">
                                    <span>{{ lang.flag }} {{ lang.name }}</span>
                                </label>
                            </div>
                        </div>

                        <!-- Platform Selection -->
                        <div class="form-group form-full">
                            <label style="margin-bottom: 8px; display: block;">Integration Platform / Shop Type</label>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                                <div @click="!(connectionVerified && !previewMode) ? newBrand.platform = 'shopify' : null"
                                     :style="{
                                         border: '1px solid ' + (newBrand.platform === 'shopify' ? 'var(--accent)' : 'var(--border)'),
                                         background: newBrand.platform === 'shopify' ? 'rgba(197, 160, 89, 0.06)' : 'rgba(255,255,255,0.01)',
                                         cursor: (connectionVerified && !previewMode) ? 'not-allowed' : 'pointer',
                                         opacity: ((connectionVerified && !previewMode) && newBrand.platform !== 'shopify') ? 0.4 : 1
                                     }"
                                     style="border-radius: 10px; padding: 16px 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; transition: all 0.2s ease;"
                                     class="platform-card">
                                    <span v-html="getPlatformLogoSvg('shopify', 32)"></span>
                                    <span style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); margin-top: 2px;">Shopify</span>
                                </div>
                                <div @click="!(connectionVerified && !previewMode) ? newBrand.platform = 'woocommerce' : null"
                                     :style="{
                                         border: '1px solid ' + (newBrand.platform === 'woocommerce' ? 'var(--accent)' : 'var(--border)'),
                                         background: newBrand.platform === 'woocommerce' ? 'rgba(197, 160, 89, 0.06)' : 'rgba(255,255,255,0.01)',
                                         cursor: (connectionVerified && !previewMode) ? 'not-allowed' : 'pointer',
                                         opacity: ((connectionVerified && !previewMode) && newBrand.platform !== 'woocommerce') ? 0.4 : 1
                                     }"
                                     style="border-radius: 10px; padding: 16px 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; transition: all 0.2s ease;"
                                     class="platform-card">
                                    <span v-html="getPlatformLogoSvg('woocommerce', 32)"></span>
                                    <span style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); margin-top: 2px;">WooCommerce</span>
                                </div>
                                <div @click="!(connectionVerified && !previewMode) ? newBrand.platform = 'custom' : null"
                                     :style="{
                                         border: '1px solid ' + (newBrand.platform === 'custom' ? 'var(--accent)' : 'var(--border)'),
                                         background: newBrand.platform === 'custom' ? 'rgba(197, 160, 89, 0.06)' : 'rgba(255,255,255,0.01)',
                                         cursor: (connectionVerified && !previewMode) ? 'not-allowed' : 'pointer',
                                         opacity: ((connectionVerified && !previewMode) && newBrand.platform !== 'custom') ? 0.4 : 1
                                     }"
                                     style="border-radius: 10px; padding: 16px 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; transition: all 0.2s ease;"
                                     class="platform-card">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; line-height: 1;">🛠️</div>
                                    <span style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); margin-top: 2px;">Manual / Sandbox</span>
                                </div>
                            </div>
                        </div>

                        <!-- Shopify Fields -->
                        <template v-if="newBrand.platform === 'shopify'">
                            <!-- OAuth vs Manual Segment Selector -->
                            <div class="form-group form-full" style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px;">Shopify Connection Mode</label>
                                <div style="display: flex; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 3px; gap: 4px;">
                                    <button type="button" 
                                            :style="{
                                                flex: 1,
                                                border: 'none',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                background: shopifyConnectionMode === 'oauth' ? 'var(--text-main)' : 'transparent',
                                                color: shopifyConnectionMode === 'oauth' ? 'var(--workspace-bg)' : 'var(--text-muted)',
                                                transition: 'all 0.2s ease'
                                            }"
                                             @click="shopifyConnectionMode = 'oauth'">
                                         ⚡ Single-Click Connect (OAuth)
                                    </button>
                                    <button type="button" 
                                            :style="{
                                                flex: 1,
                                                border: 'none',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                background: shopifyConnectionMode === 'manual' ? 'var(--text-main)' : 'transparent',
                                                color: shopifyConnectionMode === 'manual' ? 'var(--workspace-bg)' : 'var(--text-muted)',
                                                transition: 'all 0.2s ease'
                                            }"
                                             @click="shopifyConnectionMode = 'manual'">
                                         ⚙️ Manual API Keys Setup
                                    </button>
                                </div>
                            </div>

                            <div class="form-group form-full">
                                <label>Shopify Shop Address (URL)</label>
                                <input type="text" v-model="newBrand.shopify_shop_name" placeholder="pesado585.com" :disabled="connectionVerified && !previewMode">
                            </div>

                            <!-- OAuth Connect Button -->
                            <template v-if="shopifyConnectionMode === 'oauth'">
                                <div class="form-group form-full" style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                                    <button type="button" class="btn btn-accent" 
                                            style="margin: 0; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: bold; height: 42px; width: 100%;"
                                            @click="connectShopifyOAuth" :disabled="!newBrand.shopify_shop_name || connectionVerified">
                                        <span v-html="getPlatformLogoSvg('shopify', 20)"></span>
                                        <span>Connect with Shopify</span>
                                    </button>
                                    <div v-if="connectionVerified" style="color: #10b981; font-size: 0.8rem; font-weight: 600; text-align: center;">
                                        ✅ Connected via Shopify App OAuth
                                    </div>
                                </div>
                            </template>

                            <!-- Manual Token Input -->
                            <template v-else>
                                <div class="form-group form-full">
                                    <label>Shopify Admin API Access Token</label>
                                    <input type="password" v-model="newBrand.shopify_access_token" placeholder="Shopify Admin API Access Token (shpat_...)" :disabled="connectionVerified && !previewMode">
                                 </div>
                            </template>
                        </template>

                        <!-- WooCommerce Fields -->
                        <template v-if="newBrand.platform === 'woocommerce'">
                            <!-- OAuth vs Manual Segment Selector -->
                            <div class="form-group form-full" style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px;">WooCommerce Connection Mode</label>
                                <div style="display: flex; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 3px; gap: 4px;">
                                    <button type="button" 
                                            :style="{
                                                flex: 1,
                                                border: 'none',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                background: woocommerceConnectionMode === 'oauth' ? 'var(--text-main)' : 'transparent',
                                                color: woocommerceConnectionMode === 'oauth' ? 'var(--workspace-bg)' : 'var(--text-muted)',
                                                transition: 'all 0.2s ease'
                                            }"
                                             @click="woocommerceConnectionMode = 'oauth'">
                                         ⚡ Single-Click Connect (OAuth)
                                    </button>
                                    <button type="button" 
                                            :style="{
                                                flex: 1,
                                                border: 'none',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                background: woocommerceConnectionMode === 'manual' ? 'var(--text-main)' : 'transparent',
                                                color: woocommerceConnectionMode === 'manual' ? 'var(--workspace-bg)' : 'var(--text-muted)',
                                                transition: 'all 0.2s ease'
                                            }"
                                             @click="woocommerceConnectionMode = 'manual'">
                                         ⚙️ Manual API Keys Setup
                                    </button>
                                </div>
                            </div>

                            <div class="form-group form-full">
                                <label>WooCommerce Store URL</label>
                                <input type="text" v-model="newBrand.woocommerce_shop_url" placeholder="barista-essentials.de" :disabled="connectionVerified && !previewMode">
                            </div>

                            <!-- OAuth Connect Button -->
                            <template v-if="woocommerceConnectionMode === 'oauth'">
                                <div class="form-group form-full" style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                                    <button type="button" class="btn btn-accent" 
                                            style="margin: 0; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: bold; height: 42px; width: 100%;"
                                            @click="connectWooCommerceOAuth" :disabled="!newBrand.woocommerce_shop_url || connectionVerified">
                                        <span v-html="getPlatformLogoSvg('woocommerce', 20)"></span>
                                        <span>Connect with WooCommerce</span>
                                    </button>
                                    <div v-if="connectionVerified" style="color: #10b981; font-size: 0.8rem; font-weight: 600; text-align: center;">
                                        ✅ Connected via WooCommerce API OAuth
                                    </div>
                                </div>
                            </template>

                            <!-- Manual Key Inputs -->
                            <template v-else>
                                <div class="form-group">
                                    <label style="display: flex; align-items: center; gap: 6px;"><span v-html="getPlatformLogoSvg('woocommerce')"></span>WooCommerce Consumer Key</label>
                                    <input type="password" v-model="newBrand.woocommerce_consumer_key" placeholder="WooCommerce Consumer Key (ck_...)" :disabled="connectionVerified && !previewMode">
                                </div>
                                <div class="form-group">
                                    <label style="display: flex; align-items: center; gap: 6px;"><span v-html="getPlatformLogoSvg('woocommerce')"></span>WooCommerce Consumer Secret</label>
                                    <input type="password" v-model="newBrand.woocommerce_consumer_secret" placeholder="WooCommerce Consumer Secret (cs_...)" :disabled="connectionVerified && !previewMode">
                                </div>
                            </template>
                        </template>

                        <!-- Stripe Config Selection Toggle -->
                        <div class="form-group form-full" style="border-top: 1px solid var(--border); padding-top: 15px; margin-top: 10px;">
                            <label style="display: flex; align-items: center; gap: 8px; font-weight: bold; cursor: pointer; color: var(--text-main);">
                                <input type="checkbox" v-model="useCustomStripe" style="margin: 0; width: 18px; height: 18px;">
                                Configure Custom Stripe Gateway (Optional)
                            </label>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                                If unconfigured, the storefront defaults to the global agency Stripe keys.
                            </div>
                        </div>

                        <template v-if="useCustomStripe">
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 6px;"><span v-html="getStripeLogoSvg()"></span>Stripe Secret Key (API Key)</label>
                                <input type="password" v-model="newBrand.stripe_secret_key" placeholder="Stripe Secret Key (sk_live_...)">
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 6px;"><span v-html="getStripeLogoSvg()"></span>Stripe Webhook Secret</label>
                                <input type="password" v-model="newBrand.stripe_webhook_secret" placeholder="Stripe Webhook Secret (whsec_...)">
                            </div>
                        </template>

                        <!-- Preview Mode Toggle (Skip connection verification) -->
                        <div class="form-group form-full" style="background: rgba(255, 255, 255, 0.02); padding: 12px 18px; border-radius: 8px; border: 1px solid var(--border); margin-top: 10px;">
                            <label style="display: flex; align-items: center; gap: 8px; font-weight: bold; cursor: pointer; color: var(--text-main);">
                                <input type="checkbox" v-model="previewMode" style="margin: 0; width: 18px; height: 18px;" @change="handlePreviewModeChange">
                                Enable Offline Preview Mode (Skip DNS & API Checks)
                            </label>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                                Select this to spin up a sandbox storefront instantly using mock products, skipping integration validation.
                            </div>
                        </div>

                        <!-- Verification Dashboard -->
                        <div v-if="!previewMode" class="form-group form-full" style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 8px; border: 1px solid var(--border); margin-top: 15px; display: flex; flex-direction: column; gap: 15px;">
                            <h4 style="margin: 0; color: var(--text-main); display: flex; align-items: center; gap: 6px;">🛡️ Onboarding Verification & Checks</h4>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap;">
                                <div style="flex: 1; min-width: 250px;">
                                    <div style="font-weight: 600; font-size: 0.9rem;">1. Cloudflare DNS Subdomain routing</div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted);">Validates subdomain DNS status.</div>
                                    <div v-if="dnsVerifyError" style="color: #ef4444; font-size: 0.78rem; margin-top: 2px;">❌ {{ dnsVerifyError }}</div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span v-if="dnsVerified" style="color: #10b981; font-weight: bold; font-size: 0.85rem;">✅ DNS Verified</span>
                                    <button type="button" class="btn" style="margin: 0;" @click="verifyDns" :disabled="dnsVerifying">
                                        {{ dnsVerifying ? 'Checking...' : (dnsVerified ? 'Re-Verify' : 'Verify DNS') }}
                                    </button>
                                    <button v-if="dnsMissing && !dnsVerified" type="button" class="btn btn-accent" style="margin: 0; font-weight: 700;" @click="createDnsRecord" :disabled="dnsCreating">
                                        {{ dnsCreating ? 'Registering...' : 'Register on Cloudflare' }}
                                    </button>
                                </div>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; flex-wrap: wrap;">
                                <div style="flex: 1; min-width: 250px;">
                                    <div style="font-weight: 600; font-size: 0.9rem;">2. E-Commerce API integration keys</div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted);">Establishes connection to sync product listings.</div>
                                    <div v-if="connectionVerifyError" style="color: #ef4444; font-size: 0.78rem; margin-top: 2px;">❌ {{ connectionVerifyError }}</div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span v-if="connectionVerified" style="color: #10b981; font-weight: bold; font-size: 0.85rem;">✅ API Connected</span>
                                    <button type="button" class="btn" style="margin: 0;" @click="verifyConnection" :disabled="connectionVerifying">
                                        {{ connectionVerifying ? 'Testing...' : (connectionVerified ? 'Re-Test' : 'Test API') }}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div v-else class="form-group form-full" style="background: rgba(16, 185, 129, 0.05); padding: 15px; border-radius: 8px; border: 1px solid #10b981; margin-top: 15px; font-weight: 600; color: #10b981; text-align: center;">
                            ✨ Sandbox Preview Mode Enabled: Verification checks bypassed!
                        </div>
                        <div class="form-group form-full" style="display: flex; justify-content: flex-end; margin-top: 15px;">
                            <button type="button" class="btn" style="background-color: var(--primary); color: var(--workspace-bg); font-weight: 700; height: 44px; padding: 0 30px; display: flex; align-items: center; gap: 8px;" @click="saveBrandDraft" :disabled="savingDraft">
                                <span v-if="savingDraft" class="spinner"></span>
                                <span>{{ savingDraft ? 'Saving Draft...' : 'Create Draft & Select Channels ➡️' }}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- STEP 2: SELECT CHANNELS TO CONNECT -->
                <div v-if="currentStep === 2">
                    <h4 style="margin: 0 0 8px 0; color: var(--accent);">🛍️ Select Channels to Connect</h4>
                    <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 24px;">
                        Choose which sales and marketing channels you want to activate for your brand storefront. You can connect, design, and configure these channels later in the dashboard.
                    </p>

                    <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 30px;">
                        <!-- Storefront Checkbox Card -->
                        <div style="display: flex; align-items: flex-start; gap: 12px; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 14px; cursor: pointer;" @click="selectedChannels.storefront = !selectedChannels.storefront">
                            <input type="checkbox" v-model="selectedChannels.storefront" style="width: 20px; height: 20px; cursor: pointer; margin: 4px 0 0 0;" @click.stop>
                            <div>
                                <strong style="display: flex; align-items: center; gap: 6px; font-size: 0.92rem; color: var(--text-main);">
                                    <span v-html="getChannelLogoSvg('storefront', 16)"></span>
                                    <span>Storefront E-Commerce Shop</span>
                                </strong>
                                <span style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; display: block; margin-top: 2px;">
                                    Host a custom checkout experience on your subdomain (.{{ app.baseBrandDomain }}) or your own external custom domain.
                                </span>
                            </div>
                        </div>

                        <!-- Campaign Landing Page Checkbox Card -->
                        <div style="display: flex; align-items: flex-start; gap: 12px; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 14px; cursor: pointer;" @click="selectedChannels.landingpage = !selectedChannels.landingpage">
                            <input type="checkbox" v-model="selectedChannels.landingpage" style="width: 20px; height: 20px; cursor: pointer; margin: 4px 0 0 0;" @click.stop>
                            <div>
                                <strong style="display: flex; align-items: center; gap: 6px; font-size: 0.92rem; color: var(--text-main);">
                                    <span v-html="getChannelLogoSvg('landingpage', 16)"></span>
                                    <span>Campaign Landing Page</span>
                                </strong>
                                <span style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; display: block; margin-top: 2px;">
                                    A dedicated marketing landing page to drive promotional campaign traffic and newsletter signups.
                                </span>
                            </div>
                        </div>

                        <!-- Instagram Shopping Checkbox Card -->
                        <div style="display: flex; align-items: flex-start; gap: 12px; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 14px; cursor: pointer;" @click="selectedChannels.instagram = !selectedChannels.instagram">
                            <input type="checkbox" v-model="selectedChannels.instagram" style="width: 20px; height: 20px; cursor: pointer; margin: 4px 0 0 0;" @click.stop>
                            <div>
                                <strong style="display: flex; align-items: center; gap: 6px; font-size: 0.92rem; color: var(--text-main);">
                                    <span v-html="getChannelLogoSvg('instagram', 16)"></span>
                                    <span>Instagram Shopping Feed</span>
                                </strong>
                                <span style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; display: block; margin-top: 2px;">
                                    Sync your product catalog to Instagram posts, reels, and stories, enabling users to shop directly on-platform.
                                </span>
                            </div>
                        </div>

                        <!-- Facebook Page Shop Checkbox Card -->
                        <div style="display: flex; align-items: flex-start; gap: 12px; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 14px; cursor: pointer;" @click="selectedChannels.facebook = !selectedChannels.facebook">
                            <input type="checkbox" v-model="selectedChannels.facebook" style="width: 20px; height: 20px; cursor: pointer; margin: 4px 0 0 0;" @click.stop>
                            <div>
                                <strong style="display: flex; align-items: center; gap: 6px; font-size: 0.92rem; color: var(--text-main);">
                                    <span v-html="getChannelLogoSvg('facebook', 16)"></span>
                                    <span>Facebook Page Shop</span>
                                </strong>
                                <span style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; display: block; margin-top: 2px;">
                                    Synchronize your catalog list and create a shopping tab inside your brand's official Facebook Page.
                                </span>
                            </div>
                        </div>

                        <!-- Twitter/X Profile Checkbox Card -->
                        <div style="display: flex; align-items: flex-start; gap: 12px; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 14px; cursor: pointer;" @click="selectedChannels.twitter = !selectedChannels.twitter">
                            <input type="checkbox" v-model="selectedChannels.twitter" style="width: 20px; height: 20px; cursor: pointer; margin: 4px 0 0 0;" @click.stop>
                            <div>
                                <strong style="display: flex; align-items: center; gap: 6px; font-size: 0.92rem; color: var(--text-main);">
                                    <span v-html="getChannelLogoSvg('twitter', 16)"></span>
                                    <span>Twitter / X Profile Shop</span>
                                </strong>
                                <span style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; display: block; margin-top: 2px;">
                                    Display a product showcase module on your professional profile on X (Twitter).
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 20px;">
                        <button type="button" class="btn" style="margin: 0;" @click="currentStep = 1">
                            ⬅️ Back to Connection
                        </button>
                        <button type="button" class="btn" style="margin: 0; background-color: var(--primary); color: var(--workspace-bg); font-weight: 700; height: 44px; padding: 0 30px; display: flex; align-items: center;" @click="goToStep(3)">
                            <span>Continue to Catalog Setup ➡️</span>
                        </button>
                    </div>
                </div>

                <!-- STEP 3: CATALOG SETUP (SELECT PRODUCTS) -->
                <div v-if="currentStep === 3">
                    <h4 style="margin: 0 0 8px 0; color: var(--accent);">🛒 Catalog Setup & Product Sync</h4>
                    <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 20px;">
                        Select which products you want to import into your storefront catalog. You can set custom price overrides and descriptions now or edit them later.
                    </p>

                    <div v-if="loadingProducts" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; gap: 10px;">
                        <span class="spinner" style="width: 32px; height: 32px; border-width: 3px;"></span>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">Fetching store catalog products...</span>
                    </div>

                    <div v-else-if="productSyncError" style="background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 12px; border-radius: 6px; color: var(--text-main); font-size: 0.85rem; margin-bottom: 15px;">
                        ❌ Failed to load products: {{ productSyncError }}
                    </div>

                    <template v-else>
                        <!-- Search & Markup Controls -->
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 12px; flex-wrap: wrap;">
                            <!-- Search products -->
                            <div style="position: relative; flex-grow: 1; max-width: 320px;">
                                <input type="text" v-model="catalogSearchQuery" placeholder="Search catalog products..." 
                                    style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px 12px 8px 32px; font-size: 0.85rem; margin: 0;">
                                <span style="position: absolute; left: 10px; top: 10px; color: var(--text-muted); font-size: 0.85rem;">🔍</span>
                            </div>

                            <!-- Markup Percentage -->
                            <div style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 6px 12px; border-radius: 8px;">
                                <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">💰 Global Price Markup:</span>
                                <input type="number" min="0" step="1" v-model="globalMarkupPercent" @input="applyGlobalMarkup" placeholder="0"
                                       style="width: 60px; height: 26px; padding: 4px 6px; line-height: normal; font-size: 0.82rem; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); text-align: center; font-weight: bold; margin: 0;">
                                <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">%</span>
                            </div>
                        </div>

                        <div style="background: rgba(255,255,255,0.015); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                            <div style="padding: 10px 14px; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-main); font-weight: bold; font-size: 0.85rem; margin: 0;">
                                    <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" style="width: 16px; height: 16px; margin: 0; cursor: pointer;">
                                    Select All Products
                                </label>
                                <span style="font-size: 0.78rem; color: var(--text-muted);">{{ Object.values(selectedProducts).filter(Boolean).length }} of {{ importedProducts.length }} selected</span>
                            </div>

                            <div style="max-height: 380px; overflow-y: auto;">
                                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                                    <thead>
                                        <tr style="border-bottom: 1px solid var(--border); text-align: left; background: rgba(255,255,255,0.01);">
                                            <th style="padding: 10px; font-weight: 700; color: var(--text-muted); width: 8%; text-align: center;">Select</th>
                                            <th style="padding: 10px; font-weight: 700; color: var(--text-muted); width: 42%;">Product</th>
                                            <th style="padding: 10px; font-weight: 700; color: var(--text-muted); width: 25%;">Storefront Price (€)</th>
                                            <th style="padding: 10px; font-weight: 700; color: var(--text-muted); width: 25%;">Custom Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="p in filteredImportedProducts" :key="p.id || 'p-' + importedProducts.indexOf(p)" style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                                            <td style="padding: 10px; text-align: center;">
                                                <input type="checkbox" v-model="selectedProducts[p.id || 'p-' + importedProducts.indexOf(p)]" style="width: 18px; height: 18px; margin: 0; cursor: pointer;">
                                            </td>
                                            <td style="padding: 10px;">
                                                <div style="display: flex; align-items: center; gap: 10px;">
                                                    <div style="width: 36px; height: 36px; border-radius: 6px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid var(--border);">
                                                        <img v-if="p.image" :src="p.image" style="width: 100%; height: 100%; object-fit: contain;" />
                                                        <span v-else style="font-size: 0.7rem; color: var(--text-muted);">☕</span>
                                                    </div>
                                                    <div>
                                                        <div style="font-weight: 600; color: var(--text-main);">{{ p.title }}</div>
                                                        <div style="font-size: 0.72rem; color: var(--text-muted);">Orig. Price: €{{ p.price ? p.price.toFixed(2) : '55.00' }}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style="padding: 10px;">
                                                <input type="number" step="0.01" v-model="customPrices[p.id || 'p-' + importedProducts.indexOf(p)]" style="width: 90px; padding: 4px 8px; font-size: 0.8rem; margin: 0; background: var(--workspace-bg); color: var(--text-main); border: 1px solid var(--border); border-radius: 6px;" :disabled="!selectedProducts[p.id || 'p-' + importedProducts.indexOf(p)]">
                                            </td>
                                            <td style="padding: 10px;">
                                                <input type="text" v-model="customDescriptions[p.id || 'p-' + importedProducts.indexOf(p)]" placeholder="Keep original" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; margin: 0; background: var(--workspace-bg); color: var(--text-main); border: 1px solid var(--border); border-radius: 6px;" :disabled="!selectedProducts[p.id || 'p-' + importedProducts.indexOf(p)]">
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </template>

                    <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 20px;">
                        <button type="button" class="btn" style="margin: 0;" @click="currentStep = 2">
                            ⬅️ Back to Channels
                        </button>
                        <button type="button" class="btn" style="margin: 0; background-color: var(--primary); color: var(--workspace-bg); font-weight: 700; height: 44px; padding: 0 30px; display: flex; align-items: center;" @click="currentStep = 4">
                            <span>Continue to Publish ➡️</span>
                        </button>
                    </div>
                </div>

                <!-- STEP 4: FINALIZE & PUBLISH -->
                <div v-if="currentStep === 4">
                    <h4 style="margin: 0 0 15px 0; color: var(--accent);">🚀 Publish Storefront & Save Channel</h4>

                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 24px; border-radius: 8px; display: flex; flex-direction: column; gap: 20px;">
                        <div>
                            <label style="font-weight: 700; display: block; margin-bottom: 8px; color: var(--text-main);">Storefront Status</label>
                            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-main);">
                                    <input type="radio" value="active" v-model="newBrand.status" style="width: 18px; height: 18px; margin: 0;">
                                    <span style="font-weight: 600;">🟢 Active (Live & online on subdomain)</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-main);">
                                    <input type="radio" value="draft" v-model="newBrand.status" style="width: 18px; height: 18px; margin: 0;">
                                    <span style="font-weight: 600;">🟡 Draft (Offline, only visible in preview mode)</span>
                                </label>
                            </div>
                        </div>

                        <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
                            <h5 style="margin: 0 0 10px 0; color: var(--text-main);">Summary Checklist</h5>
                            <ul style="margin: 0; padding-left: 20px; line-height: 1.6; font-size: 0.85rem; color: var(--text-muted);">
                                <li>Subdomain routing: <strong style="color: var(--text-main);">{{ newBrand.subdomain }}</strong></li>
                                <li>Integration Platform: <strong style="color: var(--text-main);">{{ newBrand.platform.toUpperCase() }}</strong></li>
                                <li>Stripe Configuration: <strong style="color: var(--text-main);">{{ useCustomStripe ? 'Custom credentials' : 'SC Global default settings' }}</strong></li>
                                <li>Selected Sales Channels: 
                                    <strong style="color: var(--text-main);">
                                        {{ Object.keys(selectedChannels).filter(k => selectedChannels[k]).map(k => k === 'landingpage' ? 'Landing Page' : k.charAt(0).toUpperCase() + k.slice(1)).join(', ') || 'None' }}
                                    </strong>
                                </li>
                                <li>Selected Products to Sync: <strong style="color: var(--text-main);">{{ Object.values(selectedProducts).filter(Boolean).length }} products</strong></li>
                                <li>Preview Mode: <strong style="color: var(--accent);">{{ previewMode ? 'Yes (Sandbox)' : 'No (Live integration)' }}</strong></li>
                            </ul>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 20px; margin-top: 25px;">
                        <button type="button" class="btn" style="margin: 0;" @click="currentStep = 3">
                            ⬅️ Back to Catalog Setup
                        </button>
                        <button type="button" class="btn" style="margin: 0; background: #10b981; color: #fff; font-weight: 700; padding: 0 30px; border-color: #10b981; display: flex; align-items: center; gap: 8px;" @click="finalizeOnboarding" :disabled="savingFinal">
                            <span v-if="savingFinal" class="spinner"></span>
                            <span>{{ savingFinal ? 'Finalizing...' : 'Complete Onboarding & Save' }}</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>

        <div class="panel" v-if="!isCreatingBrand">
            <div class="panel-header">
                <div>
                    <h3 class="panel-title" style="margin: 0;">🛍️ Brand Channel Configurations</h3>
                    <p style="font-size: 0.82rem; color: var(--text-muted); margin: 4px 0 0 0;">
                        Configure subdomains, design custom storefront templates, and connect social integrations for each shop under your organization.
                    </p>
                </div>
            </div>
            
            <div v-for="b in brands" :key="b.id" class="channel-card" style="background: rgba(255,255,255,0.015); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div :style="{ background: b.favicon ? '#ffffff' : 'var(--accent)' }"
                             style="width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--workspace-bg); font-size: 0.9rem; overflow: hidden; border: 1px solid var(--border);">
                            <img v-if="b.favicon" :src="b.favicon" style="width: 100%; height: 100%; object-fit: contain;" />
                            <span v-else>{{ b.name.charAt(0).toUpperCase() }}</span>
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 1.05rem; color: var(--text-main); font-weight: 700;">{{ b.name }} <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: normal; margin-left: 6px;">(ID: {{ b.id }})</span></h4>
                            <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 12px; margin-top: 4px;">
                                <span style="display: inline-flex; align-items: center; gap: 6px;">
                                    Platform: 
                                    <strong style="color: var(--text-main); display: inline-flex; align-items: center; gap: 4px;">
                                        <span v-html="getPlatformLogoSvg(b.platform)"></span>
                                        <span>{{ b.platform === 'woocommerce' ? 'WooCommerce' : 'Shopify' }}</span>
                                    </strong>
                                </span>
                                <span>•</span>
                                <span style="display: inline-flex; align-items: center; gap: 6px;">
                                    Payments: 
                                    <strong style="color: var(--text-main); display: inline-flex; align-items: center; gap: 4px;">
                                        <span v-html="getStripeLogoSvg()"></span>
                                        <span :style="{ color: b.stripe_secret_key ? '#10b981' : 'var(--text-muted)' }">{{ b.stripe_secret_key ? 'Live' : 'Sandbox' }}</span>
                                    </strong>
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <!-- Delete/Remove button (Superadmin Only) -->
                        <button v-if="userRole.toLowerCase() === 'superadmin'" class="btn"
                            style="padding: 4px 10px; font-size: 0.72rem; background-color: #ef4444; border-color: #ef4444; color: #fff; margin: 0; height: 28px; line-height: 1; border-radius: 6px;"
                            @click="deOnboardBrand(b.id)">
                            Remove Shop
                        </button>
                    </div>
                </div>

                <!-- Channels Sub-Table -->
                <template v-if="b.status === 'draft'">
                    <div style="background: rgba(255, 193, 7, 0.04); border: 1px dashed rgba(255, 193, 7, 0.3); border-radius: 8px; padding: 24px; text-align: center;">
                        <div style="font-size: 2rem; margin-bottom: 8px;">🛠️</div>
                        <h5 style="margin: 0 0 6px 0; color: #ffc107; font-weight: 700; font-size: 0.95rem;">Shop Onboarding Incomplete</h5>
                        <p style="margin: 0 0 16px 0; font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">
                            The e-commerce integration credentials or settings have not been finalized yet.
                        </p>
                        <button type="button" class="btn btn-accent" 
                                style="margin: 0 auto; height: 36px; padding: 0 16px; font-size: 0.8rem; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; border-radius: 6px;"
                                @click="resumeDraftOnboarding(b)">
                            ⚡ Resume Setup Wizard
                        </button>
                    </div>
                </template>
                <template v-else>
                    <div class="table-responsive">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border); text-align: left;">
                                    <th style="padding: 8px 12px; font-weight: 700; color: var(--text-muted); width: 25%;">Channel</th>
                                    <th style="padding: 8px 12px; font-weight: 700; color: var(--text-muted); width: 45%;">Routing / Sync URL</th>
                                    <th style="padding: 8px 12px; font-weight: 700; color: var(--text-muted); width: 15%;">Status</th>
                                    <th style="padding: 8px 12px; font-weight: 700; color: var(--text-muted); width: 15%; text-align: right;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Storefront Shop Channel -->
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                                    <td style="padding: 12px; font-weight: 600; color: var(--text-main);">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span v-html="getChannelLogoSvg('storefront', 18)"></span>
                                            <span>Storefront E-Shop</span>
                                        </div>
                                    </td>
                                    <td style="padding: 12px;">
                                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                            <a :href="'https://' + app.getBrandSubdomain(b)" target="_blank" style="color: var(--text-main); text-decoration: none; font-weight: 500;">
                                                🔗 {{ app.getBrandSubdomain(b) }}
                                            </a>
                                            <template v-if="userRole.toLowerCase() === 'superadmin'">
                                                <span v-if="dnsStatuses[b.id] && dnsStatuses[b.id].verified" style="color: #10b981; font-size: 0.72rem; font-weight: bold; background: rgba(16,185,129,0.1); padding: 2px 6px; border-radius: 4px;">✅ DNS Live</span>
                                                <span v-else-if="dnsStatuses[b.id] && dnsStatuses[b.id].missing" style="display: inline-flex; align-items: center; gap: 4px;">
                                                    <span style="color: #ef4444; font-size: 0.72rem; font-weight: bold;">❌ Missing</span>
                                                    <button type="button" class="btn" style="padding: 2px 6px; font-size: 0.65rem; height: 18px; margin: 0; background: var(--text-main); color: var(--workspace-bg); font-weight: 700; border: none; border-radius: 4px; cursor: pointer;" @click="registerSubdomainInline(b)" :disabled="dnsStatuses[b.id].registering">
                                                        {{ dnsStatuses[b.id].registering ? 'Creating...' : 'Register' }}
                                                    </button>
                                                </span>
                                                <button v-else type="button" class="btn" style="padding: 2px 6px; font-size: 0.65rem; height: 18px; margin: 0; background: var(--border); color: var(--text-main); border: none; border-radius: 4px; cursor: pointer;" @click="checkSubdomainInline(b.id, b.subdomain)" :disabled="dnsStatuses[b.id] && dnsStatuses[b.id].checking">
                                                    {{ (dnsStatuses[b.id] && dnsStatuses[b.id].checking) ? '...' : 'Check DNS' }}
                                                </button>
                                            </template>
                                        </div>
                                        <div style="font-size: 0.75rem; margin-top: 4px;" v-if="b.custom_domain">
                                            <a :href="'http://' + b.custom_domain" target="_blank" style="color: var(--accent); text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                                                🌐 {{ b.custom_domain }}
                                            </a>
                                        </div>
                                    </td>
                                    <td style="padding: 12px;">
                                        <span v-if="b.status === 'draft'" style="background: #eab308; color: #000; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800;">Draft</span>
                                        <span v-else-if="b.status === 'paused'" style="background: #f97316; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800;">Paused</span>
                                        <span v-else-if="b.status === 'archived'" style="background: #6b7280; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800;">Archived</span>
                                        <span v-else style="background: #10b981; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800;">Active</span>
                                    </td>
                                    <td style="padding: 12px; text-align: right;">
                                        <button class="btn btn-accent" style="padding: 4px 10px; font-size: 0.72rem; margin: 0; height: 28px; line-height: 1; font-weight: 700; border-radius: 6px;" @click="goToDesigner(b.id)">
                                            🎨 Design
                                        </button>
                                    </td>
                                </tr>

                                <!-- Campaign Landing Page Channel -->
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                                    <td style="padding: 12px; font-weight: 600; color: var(--text-main);">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span v-html="getChannelLogoSvg('landingpage', 18)"></span>
                                            <span>Campaign Landing Page</span>
                                        </div>
                                    </td>
                                    <td style="padding: 12px; color: var(--text-muted);">
                                        🔗 {{ app.getBrandSubdomain(b) }}/promo-offer
                                    </td>
                                    <td style="padding: 12px;">
                                        <span v-if="hasLandingPage(b)" style="background: #10b981; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800;">Active</span>
                                        <span v-else style="background: #6b7280; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800;">Setup Needed</span>
                                    </td>
                                    <td style="padding: 12px; text-align: right;">
                                        <button class="btn btn-accent" style="padding: 4px 10px; font-size: 0.72rem; margin: 0; height: 28px; line-height: 1; font-weight: 700; border-radius: 6px;" @click="goToLandingDesigner(b.id)">
                                            🎨 Design
                                        </button>
                                    </td>
                                </tr>

                                <!-- Instagram Channel -->
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                                    <td style="padding: 12px; font-weight: 600; color: var(--text-main);">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span v-html="getChannelLogoSvg('instagram', 18)"></span>
                                            <span>Instagram Shopping Feed</span>
                                        </div>
                                    </td>
                                    <td style="padding: 12px; color: var(--text-muted);">
                                        Instagram Catalog Sync Account
                                    </td>
                                    <td style="padding: 12px;">
                                        <span v-if="isChannelConnected(b, 'Instagram')" style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; display: inline-block;">
                                            {{ getChannelStatusText(b, 'Instagram') }}
                                        </span>
                                        <span v-else style="background: rgba(239,68,68,0.15); color: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; display: inline-block;">Disconnected</span>
                                    </td>
                                    <td style="padding: 12px; text-align: right;">
                                        <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
                                            <button v-if="isChannelConnected(b, 'Instagram')" class="btn" style="padding: 4px 10px; font-size: 0.72rem; background-color: var(--border); border-color: var(--border); color: var(--text-main); margin: 0; height: 28px; line-height: 1; font-weight: 700; border-radius: 6px;" @click="connectMockSocial('Instagram', b)">
                                                ⚙️ Config
                                            </button>
                                            <button v-if="isChannelConnected(b, 'Instagram')" class="btn" style="padding: 4px 10px; font-size: 0.72rem; background-color: #ef4444; border-color: #ef4444; color: #fff; margin: 0; height: 28px; line-height: 1; font-weight: 700; border-radius: 6px;" @click="disconnectSocial('Instagram', b)">
                                                Disconnect
                                            </button>
                                            <button v-else class="btn" style="padding: 4px 10px; font-size: 0.72rem; background-color: #3b82f6; border-color: #3b82f6; color: #fff; margin: 0; height: 28px; line-height: 1; font-weight: 700; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;" @click="connectMockSocial('Instagram', b)">
                                                <span v-html="getChannelLogoSvg('instagram', 12, '#ffffff')"></span>
                                                <span>Connect</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Facebook Channel -->
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                                    <td style="padding: 12px; font-weight: 600; color: var(--text-main);">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span v-html="getChannelLogoSvg('facebook', 18)"></span>
                                            <span>Facebook Page Shop</span>
                                        </div>
                                    </td>
                                    <td style="padding: 12px; color: var(--text-muted);">
                                        Facebook Commerce Manager Sync
                                    </td>
                                    <td style="padding: 12px;">
                                        <span v-if="isChannelConnected(b, 'Facebook')" style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; display: inline-block;">
                                            {{ getChannelStatusText(b, 'Facebook') }}
                                        </span>
                                        <span v-else style="background: rgba(239,68,68,0.15); color: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; display: inline-block;">Disconnected</span>
                                    </td>
                                    <td style="padding: 12px; text-align: right;">
                                        <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
                                            <button v-if="isChannelConnected(b, 'Facebook')" class="btn" style="padding: 4px 10px; font-size: 0.72rem; background-color: var(--border); border-color: var(--border); color: var(--text-main); margin: 0; height: 28px; line-height: 1; font-weight: 700; border-radius: 6px;" @click="connectMockSocial('Facebook', b)">
                                                ⚙️ Config
                                            </button>
                                            <button v-if="isChannelConnected(b, 'Facebook')" class="btn" style="padding: 4px 10px; font-size: 0.72rem; background-color: #ef4444; border-color: #ef4444; color: #fff; margin: 0; height: 28px; line-height: 1; font-weight: 700; border-radius: 6px;" @click="disconnectSocial('Facebook', b)">
                                                Disconnect
                                            </button>
                                            <button v-else class="btn" style="padding: 4px 10px; font-size: 0.72rem; background-color: #3b82f6; border-color: #3b82f6; color: #fff; margin: 0; height: 28px; line-height: 1; font-weight: 700; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;" @click="connectMockSocial('Facebook', b)">
                                                <span v-html="getChannelLogoSvg('facebook', 12, '#ffffff')"></span>
                                                <span>Connect</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Twitter / X Channel -->
                                <tr>
                                    <td style="padding: 12px; font-weight: 600; color: var(--text-main);">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span v-html="getChannelLogoSvg('twitter', 18)"></span>
                                            <span>Twitter / X Profile Shop</span>
                                        </div>
                                    </td>
                                    <td style="padding: 12px; color: var(--text-muted);">
                                        X Professional Profile Module Sync
                                    </td>
                                    <td style="padding: 12px;">
                                        <span v-if="isChannelConnected(b, 'X / Twitter')" style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; display: inline-block;">
                                            {{ getChannelStatusText(b, 'X / Twitter') }}
                                        </span>
                                        <span v-else style="background: rgba(239,68,68,0.15); color: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; display: inline-block;">Disconnected</span>
                                    </td>
                                    <td style="padding: 12px; text-align: right;">
                                        <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
                                            <button v-if="isChannelConnected(b, 'X / Twitter')" class="btn" style="padding: 4px 10px; font-size: 0.72rem; background-color: var(--border); border-color: var(--border); color: var(--text-main); margin: 0; height: 28px; line-height: 1; font-weight: 700; border-radius: 6px;" @click="connectMockSocial('X / Twitter', b)">
                                                ⚙️ Config
                                            </button>
                                            <button v-if="isChannelConnected(b, 'X / Twitter')" class="btn" style="padding: 4px 10px; font-size: 0.72rem; background-color: #ef4444; border-color: #ef4444; color: #fff; margin: 0; height: 28px; line-height: 1; font-weight: 700; border-radius: 6px;" @click="disconnectSocial('X / Twitter', b)">
                                                Disconnect
                                            </button>
                                            <button v-else class="btn" style="padding: 4px 10px; font-size: 0.72rem; background-color: #3b82f6; border-color: #3b82f6; color: #fff; margin: 0; height: 28px; line-height: 1; font-weight: 700; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;" @click="connectMockSocial('X / Twitter', b)">
                                                <span v-html="getChannelLogoSvg('twitter', 12, '#ffffff')"></span>
                                                <span>Connect</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </template>
            </div>
            
            <div v-if="brands.length === 0" style="text-align: center; color: var(--text-muted); padding: 40px;">
                No brand shops registered. Spin up a brand shop to configure its channels.
            </div>
        </div>
        </div>

        <!-- SOCIAL CONNECT MODAL -->
        <div v-if="socialModalOpen" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); z-index: 100000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
            <div class="panel" style="width: 100%; max-width: 520px; border-radius: 12px; overflow: hidden; background: var(--panel-bg); border: 1px solid var(--border); box-shadow: 0 10px 40px rgba(0,0,0,0.6); margin: 20px;">
                <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border);">
                    <h3 class="panel-title" style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                        <span>🔌</span> Connect {{ socialModalPlatform }} Channel
                    </h3>
                    <button type="button" @click="socialModalOpen = false" style="background: none; border: none; color: var(--text-muted); font-size: 1.4rem; cursor: pointer; line-height: 1;">&times;</button>
                </div>
                <div class="panel-body" style="padding: 20px; display: flex; flex-direction: column; gap: 16px;">
                    
                    <div v-if="socialConnecting" style="text-align: center; padding: 40px 0;">
                        <span class="spinner" style="width: 36px; height: 36px; border-width: 4px; display: inline-block;"></span>
                        <div style="margin-top: 16px; font-weight: bold; color: var(--text-main); font-size: 0.95rem;">
                            Redirecting to {{ socialModalPlatform }} OAuth Consent Portal...
                        </div>
                        <div style="margin-top: 8px; font-size: 0.8rem; color: var(--text-muted);">
                            Please complete the authorization in the popup window.
                        </div>
                    </div>

                    <div v-else-if="socialConnectSuccess" style="text-align: center; padding: 30px 0; display: flex; flex-direction: column; align-items: center; gap: 12px;">
                        <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(16, 185, 129, 0.1); color: #10b981; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; border: 2px solid #10b981;">✓</div>
                        <h4 style="margin: 0; font-weight: 700; color: var(--text-main); font-size: 1.1rem;">Connection Successful!</h4>
                        <p style="font-size: 0.82rem; color: var(--text-muted); max-width: 320px; margin: 0; line-height: 1.4;">
                            Stricktly Coffee has successfully authenticated with {{ socialModalPlatform }}. Catalog items will synchronize automatically.
                        </p>
                        <button type="button" class="btn btn-accent" style="margin-top: 10px; font-weight: 700; border: none; border-radius: 6px; padding: 10px 24px; height: 38px; display: flex; align-items: center; justify-content: center;" @click="socialModalOpen = false">
                            Done
                        </button>
                    </div>

                    <div v-else style="display: flex; flex-direction: column; gap: 16px;">
                        <!-- Integration Options -->
                        <div>
                            <label style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); display: block; margin-bottom: 8px;">Connection Method</label>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <!-- Meta Business Suite Option (For Facebook / Instagram) -->
                                <label v-if="socialModalPlatform.includes('Instagram') || socialModalPlatform.includes('Facebook')" style="display: flex; align-items: flex-start; gap: 10px; background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 12px; border-radius: 8px; cursor: pointer;" @click="socialConnectionType = 'meta_suite'">
                                    <input type="radio" value="meta_suite" v-model="socialConnectionType" style="margin-top: 3px;" @click.stop>
                                    <div>
                                        <strong style="font-size: 0.88rem; color: var(--text-main); display: block;">Meta Business Suite OAuth (Recommended)</strong>
                                        <span style="font-size: 0.76rem; color: var(--text-muted);">Sync Facebook and Instagram shop catalogs under a single Meta Business Manager umbrella account.</span>
                                    </div>
                                </label>

                                <!-- Direct Instagram OAuth Option (Only for Instagram) -->
                                <label v-if="socialModalPlatform.includes('Instagram')" style="display: flex; align-items: flex-start; gap: 10px; background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 12px; border-radius: 8px; cursor: pointer;" @click="socialConnectionType = 'direct_instagram'">
                                    <input type="radio" value="direct_instagram" v-model="socialConnectionType" style="margin-top: 3px;" @click.stop>
                                    <div>
                                        <strong style="font-size: 0.88rem; color: var(--text-main); display: block;">Direct Instagram OAuth Login</strong>
                                        <span style="font-size: 0.76rem; color: var(--text-muted);">Connect just your Instagram Professional profile directly via Graph Login API. Bypasses Facebook managers.</span>
                                    </div>
                                </label>

                                <!-- X OAuth Option (Only for Twitter/X) -->
                                <label v-if="socialModalPlatform.includes('X')" style="display: flex; align-items: flex-start; gap: 10px; background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 12px; border-radius: 8px; cursor: pointer;" @click="socialConnectionType = 'oauth'">
                                    <input type="radio" value="oauth" v-model="socialConnectionType" style="margin-top: 3px;" @click.stop>
                                    <div>
                                        <strong style="font-size: 0.88rem; color: var(--text-main); display: block;">X Professional OAuth 2.0 Login</strong>
                                        <span style="font-size: 0.76rem; color: var(--text-muted);">Authenticate with your professional account on X to sync shop showcases.</span>
                                    </div>
                                </label>

                                <!-- Manual Sync option (Always available) -->
                                <label style="display: flex; align-items: flex-start; gap: 10px; background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 12px; border-radius: 8px; cursor: pointer;" @click="socialConnectionType = 'manual'">
                                    <input type="radio" value="manual" v-model="socialConnectionType" style="margin-top: 3px;" @click.stop>
                                    <div>
                                        <strong style="font-size: 0.88rem; color: var(--text-main); display: block;">Manual Catalog Sync JSON Feed</strong>
                                        <span style="font-size: 0.76rem; color: var(--text-muted);">Sync inventory using a static data endpoint feed. No automatic profile bio updates allowed.</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- Sync Rules & Profile Modifications -->
                        <div style="border-top: 1px solid var(--border); padding-top: 16px;">
                            <label style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); display: block; margin-bottom: 8px;">Automatic Actions</label>
                            
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                <!-- Auto Sync Catalog changes -->
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-main); font-size: 0.85rem;">
                                    <input type="checkbox" v-model="socialAutoSync" style="width: 16px; height: 16px; margin: 0;">
                                    <span>🔄 Auto-sync product changes to {{ socialModalPlatform }} catalog</span>
                                </label>
                                
                                <!-- Auto update bio website link -->
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-main); font-size: 0.85rem;">
                                    <input type="checkbox" v-model="socialAutoLink" style="width: 16px; height: 16px; margin: 0;">
                                    <span>🌐 Automatically write active storefront link to profile bio</span>
                                </label>
                                
                                <!-- X Featured Pinned tweet sync -->
                                <label v-if="socialModalPlatform.includes('X')" style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-main); font-size: 0.85rem;">
                                    <input type="checkbox" v-model="socialAutoPin" style="width: 16px; height: 16px; margin: 0;">
                                    <span>📌 Pin top product showcase module to the top of X profile</span>
                                </label>
                            </div>
                        </div>

                        <div style="margin-top: 10px; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border); padding-top: 16px;">
                            <button type="button" class="btn" style="margin: 0; background: none; border: 1px solid var(--border); color: var(--text-main);" @click="socialModalOpen = false">
                                Cancel
                            </button>
                            <button type="button" class="btn btn-accent" style="margin: 0; padding: 0 24px; font-weight: 700; height: 38px; display: flex; align-items: center; justify-content: center; gap: 6px;" @click="submitSocialConnection">
                                🔌 Connect Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import DesignerView from './DesignerView.vue';
import LandingPageDesignerView from './LandingPageDesignerView.vue';

export default {
    name: 'BrandsView',
    inject: ['app'],
    components: {
        DesignerView,
        LandingPageDesignerView
    },
    mounted() {
        window.addEventListener('message', this.handleOAuthMessage);

        const params = new URLSearchParams(window.location.search);
        
        // Handle returning from Shopify OAuth flow redirection
        if (params.get('oauth_success') === 'true' && params.get('brandId')) {
            const brandId = params.get('brandId');
            this.app.loadBrands().then(() => {
                this.restoreBrandWizardState(brandId, 'shopify');
            });
        }

        // Handle returning from WooCommerce OAuth flow redirection
        if (params.get('woocommerce_oauth_success') === 'true' && params.get('brandId')) {
            const brandId = params.get('brandId');
            this.app.loadBrands().then(() => {
                const targetBrand = this.app.brands.find(b => b.id === brandId);
                if (targetBrand) {
                    // Local dev callback fallback
                    if (!targetBrand.woocommerce_consumer_key) {
                        fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                            },
                            body: JSON.stringify({
                                ...targetBrand,
                                woocommerce_consumer_key: 'ck_mock_consumer_key_for_testing_123',
                                woocommerce_consumer_secret: 'cs_mock_consumer_secret_for_testing_123'
                            })
                        }).then(() => {
                            this.app.loadBrands().then(() => {
                                this.restoreBrandWizardState(brandId, 'woocommerce');
                            });
                        });
                    } else {
                        this.restoreBrandWizardState(brandId, 'woocommerce');
                    }
                }
            });
        }
    },
    beforeUnmount() {
        window.removeEventListener('message', this.handleOAuthMessage);
    },
    data() {
        return {
            easySetupUrl: '',
            easySetupLoading: false,
            easySetupError: '',
            localDomainType: 'subdomain',
            catalogSearchQuery: '',
            activeSubView: 'list',
            isFullscreen: false,
            iframeCurrentUrl: '',
            selectedChannels: {
                storefront: true,
                landingpage: true,
                instagram: false,
                facebook: false,
                twitter: false
            },
            availableLanguages: [
                { code: 'en', name: 'English', flag: '🇬🇧' },
                { code: 'de', name: 'German', flag: '🇩🇪' },
                { code: 'fr', name: 'French', flag: '🇫🇷' },
                { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
                { code: 'es', name: 'Spanish', flag: '🇪🇸' },
                { code: 'it', name: 'Italian', flag: '🇮🇹' }
            ],
            
            // Onboarding Wizard State
            currentStep: 1,
            dnsVerified: false,
            dnsVerifying: false,
            dnsVerifyError: '',
            dnsMissing: false,
            dnsCreating: false,
            dnsStatuses: {},
            isCreatingBrand: false,
            // Social Connect Modal
            socialModalOpen: false,
            socialModalPlatform: '',
            socialModalBrand: null,
            socialConnectionType: 'oauth',
            socialAutoSync: true,
            socialAutoLink: true,
            socialAutoPin: false,
            socialConnecting: false,
            socialConnectSuccess: false,
            
            connectionVerified: false,
            connectionVerifying: false,
            connectionVerifyError: '',
            
            useCustomStripe: false,
            previewMode: false,
            savingDraft: false,
            savingDesign: false,
            savingFinal: false,
            logoUploading: false,
            faviconUploading: false,
            shopifyConnectionMode: 'oauth',
            woocommerceConnectionMode: 'oauth',
            
            // Product Selection (Step 2)
            importedProducts: [],
            loadingProducts: false,
            productSyncError: '',
            selectedProducts: {},
            customPrices: {},
            globalMarkupPercent: 0,
            customStock: {},
            customDescriptions: {},
            productSyncing: false,
            productSyncSuccess: false
        };
    },
    watch: {
        activeSubView: {
            immediate: true,
            handler(newVal) {
                this.app.brandsSubView = newVal;
            }
        },
        isCreatingBrand: {
            immediate: true,
            handler(newVal) {
                this.app.isCreatingBrand = newVal;
            }
        },
        'newBrand.custom_domain': {
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    this.localDomainType = 'external';
                } else {
                    this.localDomainType = 'subdomain';
                }
            }
        },
        localDomainType(newVal) {
            if (newVal === 'subdomain') {
                this.newBrand.custom_domain = '';
            } else {
                if (!this.newBrand.subdomain) {
                    const fallbackSlug = this.newBrand.id || 'shop';
                    this.newBrand.subdomain = `${fallbackSlug}.${this.app.baseBrandDomain}`;
                }
            }
        },
        previewActiveBrandId: {
            immediate: true,
            handler(newVal) {
                if (newVal && newVal !== 'all') {
                    this.app.activeShopFilter = newVal;
                    this.app.updateSettingsContext();
                }
            }
        },
        activeSubView() {
            if (this.app && typeof this.app.updateURL === 'function') {
                this.app.updateURL();
            }
        }
    },
    computed: {
        userRole() { return this.app.userRole; },
        brands() {
            const list = this.app.brands;
            if (this.userRole.toLowerCase() === 'merchant' && this.app.activeShopFilter !== 'all') {
                return list.filter(b => b.id === this.app.activeShopFilter);
            }
            return list;
        },
        newBrand() { return this.app.newBrand; },
        previewIframeSrc() { return this.app.previewIframeSrc; },
        previewActiveBrandId: {
            get() { return this.app.previewActiveBrandId; },
            set(val) { this.app.previewActiveBrandId = val; }
        },
        subdomainSlug: {
            get() {
                const sub = this.newBrand.subdomain || '';
                return sub.split('.')[0] || '';
            },
            set(val) {
                const slug = val.trim().toLowerCase();
                this.newBrand.subdomain = slug ? `${slug}.${this.app.baseBrandDomain}` : '';
            }
        },
        domainInputValue: {
            get() {
                if (this.localDomainType === 'subdomain') {
                    return this.subdomainSlug;
                } else {
                    return this.newBrand.custom_domain || '';
                }
            },
            set(val) {
                const cleaned = val.trim().toLowerCase();
                if (this.localDomainType === 'subdomain') {
                    this.subdomainSlug = cleaned;
                } else {
                    this.newBrand.custom_domain = cleaned;
                    if (!this.newBrand.subdomain) {
                        const fallbackSlug = this.newBrand.id || cleaned.split('.')[0] || 'shop';
                        this.newBrand.subdomain = `${fallbackSlug}.${this.app.baseBrandDomain}`;
                    }
                }
            }
        },
        isAllSelected() {
            if (this.filteredImportedProducts.length === 0) return false;
            return this.filteredImportedProducts.every(p => {
                const idx = this.importedProducts.indexOf(p);
                const id = p.id || `p-${idx}`;
                return !!this.selectedProducts[id];
            });
        },
        filteredImportedProducts() {
            const query = (this.catalogSearchQuery || '').toLowerCase().trim();
            if (!query) return this.importedProducts;
            return this.importedProducts.filter(p => {
                return (p.title || '').toLowerCase().includes(query) || 
                       (p.description || '').toLowerCase().includes(query);
            });
        },
        displayUrl() {
            if (!this.iframeCurrentUrl) {
                return this.previewIframeSrc || 'about:blank';
            }
            try {
                const url = new URL(this.iframeCurrentUrl);
                return url.pathname + url.search;
            } catch(e) {
                return this.iframeCurrentUrl;
            }
        },
        settingsBrand() { return this.app.settingsBrand; }
    },
    methods: {
        async connectShopifyOAuth() {
            if (!this.newBrand.id || !this.newBrand.name || !this.newBrand.subdomain) {
                alert('Please fill out Brand ID, Display Name, and Subdomain in Step 1 first, so we can save your draft before connecting to Shopify.');
                return;
            }
            if (!this.newBrand.shopify_shop_name) {
                alert('Please enter your Shopify Shop Address URL.');
                return;
            }

            this.app.showNotification('Saving brand draft configuration...');
            try {
                this.newBrand.theme_settings = JSON.stringify({
                    secondary_color: this.newBrand.secondary_color,
                    bg_color: this.newBrand.bg_color,
                    text_color: this.newBrand.text_color,
                    button_radius: this.newBrand.button_radius,
                    button_text_color: this.newBrand.button_text_color,
                    header_bg_color: this.newBrand.header_bg_color
                });
                this.newBrand.status = 'draft';
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify(this.newBrand)
                });
                if (response.ok) {
                    await this.app.loadBrands();
                    // Open Shopify OAuth in a popup window
                    const authorizeUrl = `${this.app.apiBaseUrl}/api/global/shopify/auth?shop=${encodeURIComponent(this.newBrand.shopify_shop_name)}&brandId=${encodeURIComponent(this.newBrand.id)}&adminUrl=${encodeURIComponent(window.location.origin + window.location.pathname)}&token=${encodeURIComponent(localStorage.getItem('sc_admin_token') || '')}`;
                    window.open(authorizeUrl, 'ShopifyOAuth', 'width=800,height=700,status=yes,resizable=yes');
                } else {
                    const err = await response.json();
                    alert(`Error saving brand draft: ${err.error}`);
                }
            } catch (err) {
                alert(`Error connecting to Shopify: ${err.message}`);
            }
        },
        async connectWooCommerceOAuth() {
            if (!this.newBrand.id || !this.newBrand.name || !this.newBrand.subdomain) {
                alert('Please fill out Brand ID, Display Name, and Subdomain in Step 1 first, so we can save your draft before connecting to WooCommerce.');
                return;
            }
            if (!this.newBrand.woocommerce_shop_url) {
                alert('Please enter your WooCommerce Store URL.');
                return;
            }

            this.app.showNotification('Saving brand draft configuration...');
            try {
                this.newBrand.theme_settings = JSON.stringify({
                    secondary_color: this.newBrand.secondary_color,
                    bg_color: this.newBrand.bg_color,
                    text_color: this.newBrand.text_color,
                    button_radius: this.newBrand.button_radius,
                    button_text_color: this.newBrand.button_text_color,
                    header_bg_color: this.newBrand.header_bg_color
                });
                this.newBrand.status = 'draft';
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify(this.newBrand)
                });
                if (response.ok) {
                    await this.app.loadBrands();
                    // Open WooCommerce OAuth in a popup window
                    const authorizeUrl = `${this.app.apiBaseUrl}/api/global/woocommerce/auth?shop=${encodeURIComponent(this.newBrand.woocommerce_shop_url)}&brandId=${encodeURIComponent(this.newBrand.id)}&adminUrl=${encodeURIComponent(window.location.origin + window.location.pathname)}&token=${encodeURIComponent(localStorage.getItem('sc_admin_token') || '')}`;
                    window.open(authorizeUrl, 'WooCommerceOAuth', 'width=800,height=700,status=yes,resizable=yes');
                } else {
                    const err = await response.json();
                    alert(`Error saving brand draft: ${err.error}`);
                }
            } catch (err) {
                alert(`Error connecting to WooCommerce: ${err.message}`);
            }
        },
        restoreBrandWizardState(brandId, platform) {
            const targetBrand = this.app.brands.find(b => b.id === brandId);
            if (targetBrand) {
                this.app.newBrand = { 
                    ...this.app.newBrand,
                    ...targetBrand 
                };
                
                if (targetBrand.theme_settings) {
                    try {
                        const parsedTheme = JSON.parse(targetBrand.theme_settings);
                        this.app.newBrand.secondary_color = parsedTheme.secondary_color || this.app.newBrand.secondary_color;
                        this.app.newBrand.bg_color = parsedTheme.bg_color || this.app.newBrand.bg_color;
                        this.app.newBrand.text_color = parsedTheme.text_color || this.app.newBrand.text_color;
                        this.app.newBrand.button_radius = parsedTheme.button_radius || this.app.newBrand.button_radius;
                        this.app.newBrand.button_text_color = parsedTheme.button_text_color || this.app.newBrand.button_text_color;
                        this.app.newBrand.header_bg_color = parsedTheme.header_bg_color || this.app.newBrand.header_bg_color;
                        this.app.newBrand.font_family = parsedTheme.font_family || this.app.newBrand.font_family || 'Outfit';
                    } catch (e) {}
                }
                
                this.isCreatingBrand = true;
                this.currentStep = 1;
                this.dnsVerified = true;
                this.connectionVerified = true;
                
                if (platform === 'shopify') {
                    this.shopifyConnectionMode = 'oauth';
                    this.app.showNotification('Successfully connected Shopify integration via OAuth!');
                } else if (platform === 'woocommerce') {
                    this.woocommerceConnectionMode = 'oauth';
                    this.app.showNotification('Successfully connected WooCommerce integration via OAuth!');
                }
                
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
            }
        },
        resumeDraftOnboarding(brand) {
            // Restore newBrand details
            this.app.newBrand = {
                ...this.app.newBrand,
                ...brand
            };
            
            // Restore theme settings colors
            if (brand.theme_settings) {
                try {
                    const parsedTheme = JSON.parse(brand.theme_settings);
                    this.app.newBrand.secondary_color = parsedTheme.secondary_color || this.app.newBrand.secondary_color;
                    this.app.newBrand.bg_color = parsedTheme.bg_color || this.app.newBrand.bg_color;
                    this.app.newBrand.text_color = parsedTheme.text_color || this.app.newBrand.text_color;
                    this.app.newBrand.button_radius = parsedTheme.button_radius || this.app.newBrand.button_radius;
                    this.app.newBrand.button_text_color = parsedTheme.button_text_color || this.app.newBrand.button_text_color;
                    this.app.newBrand.header_bg_color = parsedTheme.header_bg_color || this.app.newBrand.header_bg_color;
                    this.app.newBrand.font_family = parsedTheme.font_family || this.app.newBrand.font_family || 'Outfit';
                } catch (e) {}
            }

            // Determine if integration connection has been verified
            const hasShopifyDetails = (brand.platform === 'shopify' && (brand.shopify_access_token || brand.stripe_enabled));
            const hasWooDetails = (brand.platform === 'woocommerce' && brand.woocommerce_consumer_key);
            
            this.isCreatingBrand = true;
            this.currentStep = 1;
            
            if (hasShopifyDetails || hasWooDetails || brand.platform === 'custom') {
                this.dnsVerified = true;
                this.connectionVerified = true;
            } else {
                this.dnsVerified = false;
                this.connectionVerified = false;
            }
            
            this.app.showNotification(`Resumed setup for brand: ${brand.name}`);
        },
        goToDesigner(brandId) {
            this.app.activeShopFilter = brandId;
            this.app.updateSettingsContext();
            this.activeSubView = 'designer';
        },
        goToLandingDesigner(brandId) {
            this.app.activeShopFilter = brandId;
            this.app.updateSettingsContext();
            this.activeSubView = 'landing-designer';
        },
        hasLandingPage(brand) {
            if (!brand.theme_settings) return false;
            try {
                const theme = JSON.parse(brand.theme_settings);
                return !!(theme.landing_headline || (theme.landing_pages && theme.landing_pages.length > 0));
            } catch(e) {
                return false;
            }
        },
        launchMockChannel(builderName) {
            alert(`🎨 ${builderName} is coming soon! This channel will allow custom layout configurations and custom assets once active.`);
        },
        isChannelConnected(brand, platform) {
            if (!brand.theme_settings) return false;
            try {
                const theme = JSON.parse(brand.theme_settings);
                return !!(theme.connected_channels && theme.connected_channels[platform] && theme.connected_channels[platform].active);
            } catch(e) {
                return false;
            }
        },
        getChannelStatusText(brand, platform) {
            if (!brand.theme_settings) return 'Disconnected';
            try {
                const theme = JSON.parse(brand.theme_settings);
                if (theme.connected_channels && theme.connected_channels[platform] && theme.connected_channels[platform].active) {
                    const c = theme.connected_channels[platform];
                    const activeRules = [];
                    if (c.autoSync) activeRules.push('Sync');
                    if (c.autoLink) activeRules.push('BioLink');
                    if (c.autoPin) activeRules.push('Pinned');
                    return `Connected (${activeRules.join(' & ') || 'Active'})`;
                }
            } catch(e) {}
            return 'Disconnected';
        },
        connectMockSocial(platform, brand) {
            this.socialModalPlatform = platform;
            this.socialModalBrand = brand;
            if (platform.includes('Instagram') || platform.includes('Facebook')) {
                this.socialConnectionType = 'meta_suite';
            } else {
                this.socialConnectionType = 'oauth';
            }
            this.socialAutoSync = true;
            this.socialAutoLink = true;
            this.socialAutoPin = false;
            this.socialConnecting = false;
            this.socialConnectSuccess = false;

            let existing = {};
            if (brand.theme_settings) {
                try {
                    const theme = JSON.parse(brand.theme_settings);
                    if (theme.connected_channels && theme.connected_channels[platform]) {
                        existing = theme.connected_channels[platform];
                    }
                } catch(e) {}
            }
            if (existing.active) {
                this.socialAutoSync = existing.autoSync;
                this.socialAutoLink = existing.autoLink;
                this.socialAutoPin = existing.autoPin;
            }
            this.socialModalOpen = true;
        },
        handleOAuthMessage(e) {
            if (e.data === 'oauth_success') {
                this.handleOAuthSuccess();
            } else if (e.data && e.data.type === 'shopify_oauth_success') {
                this.app.loadBrands().then(() => {
                    this.restoreBrandWizardState(e.data.brandId, 'shopify');
                });
            } else if (e.data && e.data.type === 'woocommerce_oauth_success') {
                this.app.loadBrands().then(() => {
                    const targetBrand = this.app.brands.find(b => b.id === e.data.brandId);
                    if (targetBrand) {
                        // Webhook callback fallback
                        if (!targetBrand.woocommerce_consumer_key) {
                            fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                                },
                                body: JSON.stringify({
                                    ...targetBrand,
                                    woocommerce_consumer_key: 'ck_mock_consumer_key_for_testing_123',
                                    woocommerce_consumer_secret: 'cs_mock_consumer_secret_for_testing_123'
                                })
                            }).then(() => {
                                this.app.loadBrands().then(() => {
                                    this.restoreBrandWizardState(e.data.brandId, 'woocommerce');
                                });
                            });
                        } else {
                            this.restoreBrandWizardState(e.data.brandId, 'woocommerce');
                        }
                    }
                });
            }
        },
        async handleOAuthSuccess() {
            this.socialConnecting = false;
            this.socialConnectSuccess = true;
            
            const brand = this.socialModalBrand;
            if (!brand) return;

            let theme = {};
            if (brand.theme_settings) {
                try {
                    theme = JSON.parse(brand.theme_settings);
                } catch(e) {}
            }
            if (!theme.connected_channels) {
                theme.connected_channels = {};
            }
            theme.connected_channels[this.socialModalPlatform] = {
                active: true,
                autoSync: this.socialAutoSync,
                autoLink: this.socialAutoLink,
                autoPin: this.socialAutoPin,
                connectedAt: new Date().toISOString()
            };
            brand.theme_settings = JSON.stringify(theme);

            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify(brand)
                });
                if (response.ok) {
                    this.app.showNotification(`Successfully connected ${this.socialModalPlatform} channel!`);
                    await this.app.loadBrands();
                } else {
                    console.error('Failed to save connection details');
                }
            } catch(err) {
                console.error(err);
            }
        },
        async submitSocialConnection() {
            if (this.socialConnectionType === 'manual') {
                this.socialConnecting = true;
                setTimeout(() => {
                    this.handleOAuthSuccess();
                }, 1500);
            } else {
                this.socialConnecting = true;
                const platform = this.socialModalPlatform;
                const type = this.socialConnectionType;
                const popup = window.open('', 'OAuthConsent', 'width=580,height=580,status=yes,resizable=yes');
                if (popup) {
                    let title = 'Authorize Strickly Coffee Connector';
                    let desc = `Connect your storefront to manage and publish catalog assets automatically to your <strong>${platform}</strong> profile.`;
                    let icon = '🔌';
                    let scopesHtml = `
                        <li>Sync product catalog items & specs</li>
                        <li>Publish updates automatically</li>
                        <li>Update profile website link</li>
                    `;

                    if (type === 'meta_suite') {
                        title = 'Meta Business Suite Connector';
                        desc = 'Grant Strickly Coffee permission to manage catalogs, pixels, and shops across your Meta Business Suite properties.';
                        icon = '👥';
                        scopesHtml = `
                            <li>Access and edit Meta Catalog Manager</li>
                            <li>Sync Facebook Page Shop & Instagram Shop assets</li>
                            <li>Configure Meta Pixel & Conversions API</li>
                        `;
                    } else if (type === 'direct_instagram') {
                        title = 'Instagram Graph API Login';
                        desc = 'Authenticate directly with your Instagram Professional Account. Bypasses Facebook Business manager managers.';
                        icon = '📸';
                        scopesHtml = `
                            <li>Access Instagram Professional profile posts</li>
                            <li>Sync product tag links on media tags</li>
                            <li>Automatically set website bio links</li>
                        `;
                    } else if (type === 'oauth') {
                        title = 'X Professional OAuth Consent';
                        desc = 'Authorize Strickly Coffee to manage X Professional profile showcase modules.';
                        icon = '🐦';
                        scopesHtml = `
                            <li>Write professional profile product module</li>
                            <li>Automatically pin shop links in bio</li>
                            <li>Read feed performance analytics</li>
                        `;
                    }

                    popup.document.write(`
                        <html>
                          <head>
                            <title>${title}</title>
                            <style>
                              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #121212; color: #e0e0e0; padding: 30px; text-align: center; }
                              .card { max-width: 420px; margin: 20px auto; background: #1e1e1e; border: 1px solid #333; border-radius: 12px; padding: 28px; box-shadow: 0 12px 36px rgba(0,0,0,0.6); }
                              .title { font-size: 1.3rem; font-weight: bold; margin-bottom: 12px; color: #fff; }
                              .desc { font-size: 0.88rem; color: #a0a0a0; line-height: 1.5; margin-bottom: 24px; }
                              .scopes { text-align: left; background: #151515; border-radius: 8px; padding: 16px; font-size: 0.82rem; color: #d0d0d0; margin-bottom: 24px; border: 1px solid #282828; }
                              .scopes li { margin-bottom: 8px; }
                              .btn { background: #3b82f6; color: #fff; border: none; font-weight: bold; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 0.92rem; width: 100%; transition: background 0.2s; }
                              .btn:hover { background: #2563eb; }
                              .btn-cancel { background: none; border: 1px solid #333; color: #a0a0a0; margin-top: 10px; width: 100%; padding: 10px; font-size: 0.85rem; cursor: pointer; border-radius: 6px; }
                            </style>
                          </head>
                          <body>
                            <div class="card">
                              <div style="font-size: 3rem; margin-bottom: 16px;">${icon}</div>
                              <div class="title">${title}</div>
                              <p class="desc">${desc}</p>
                              <div class="scopes">
                                <strong>Requested Scopes:</strong>
                                <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                                  ${scopesHtml}
                                </ul>
                              </div>
                              <button class="btn" onclick="window.opener.postMessage('oauth_success', '*'); window.close();">Authorize & Connect</button>
                              <button class="btn-cancel" onclick="window.close();">Cancel</button>
                            </div>
                          </body>
                        </html>
                    `);
                }
            }
        },
        async disconnectSocial(platform, brand) {
            const confirmed = confirm(`🔌 Are you sure you want to disconnect ${platform} shopping channel for ${brand.name}?`);
            if (!confirmed) return;

            let theme = {};
            if (brand.theme_settings) {
                try {
                    theme = JSON.parse(brand.theme_settings);
                } catch(e) {}
            }
            if (theme.connected_channels) {
                delete theme.connected_channels[platform];
            }
            brand.theme_settings = JSON.stringify(theme);

            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify(brand)
                });
                if (response.ok) {
                    this.app.showNotification(`Successfully disconnected ${platform} channel.`);
                    await this.app.loadBrands();
                } else {
                    alert('Failed to save settings.');
                }
            } catch(err) {
                alert(err.message);
            }
        },
        async updateBrandSettings() {
            await this.app.updateBrandSettings();
            this.iframeReload();
        },
        toggleFullscreen() {
            this.isFullscreen = !this.isFullscreen;
        },
        iframeBack() {
            try {
                const iframe = this.$refs.previewIframe;
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.history.back();
                }
            } catch(e) {}
        },
        iframeForward() {
            try {
                const iframe = this.$refs.previewIframe;
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.history.forward();
                }
            } catch(e) {}
        },
        iframeReload() {
            try {
                const iframe = this.$refs.previewIframe;
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.location.reload();
                }
            } catch(e) {}
        },
        handleIframeLoad() {
            try {
                const iframe = this.$refs.previewIframe;
                if (iframe && iframe.contentWindow) {
                    const loc = iframe.contentWindow.location.href;
                    this.iframeCurrentUrl = loc;
                    // Escape check: if they went outside of '/store/' or localhost storefront paths, bring them back!
                    if (!loc.includes('/store/') && !loc.includes('previewBrandId') && !loc.includes('localhost:8082')) {
                        console.warn('Escape attempt blocked, resetting to default store view...');
                        iframe.contentWindow.location.href = this.previewIframeSrc;
                    }
                }
            } catch(e) {}
        },
        onboardBrand(e) { return this.app.onboardBrand(e); },
        deOnboardBrand(id) { return this.app.deOnboardBrand(id); },
        updateBrandStatus(id, status) { return this.app.updateBrandStatus(id, status); },
        getStepTitle(step) {
            if (step === 1) return 'Connection';
            if (step === 2) return 'Select Channels';
            if (step === 3) return 'Catalog Setup';
            return 'Publish';
        },
        async goToStep(step) {
            if (step > 1 && (!this.dnsVerified || !this.connectionVerified) && !this.previewMode) {
                alert('Please verify both DNS setup and Integration Connection in Step 1 first, or check "Enable Offline Preview Mode".');
                return;
            }
            if (step >= 2 && !this.app.newBrand.id) {
                alert('Please fill out Brand ID slug first.');
                return;
            }

            this.currentStep = step;
            if (step === 3) {
                this.loadImportProducts();
            }
        },
        handlePreviewModeChange() {
            if (this.previewMode) {
                this.dnsVerified = true;
                this.connectionVerified = true;
                if (!this.newBrand.id) this.app.newBrand.id = 'preview-shop';
                if (!this.newBrand.name) this.app.newBrand.name = 'Preview Brand';
                if (!this.newBrand.subdomain) this.app.newBrand.subdomain = 'preview.stricktlycoffee.be';
                if (!this.newBrand.contact_email) this.app.newBrand.contact_email = 'preview@stricktlycoffee.be';
            } else {
                this.dnsVerified = false;
                this.connectionVerified = false;
            }
        },
        async verifyDns() {
            if (!this.newBrand.subdomain) {
                this.dnsVerifyError = 'Target Host Subdomain is required for DNS validation.';
                return;
            }
            this.dnsVerifying = true;
            this.dnsVerifyError = '';
            this.dnsVerified = false;
            this.dnsMissing = false;
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/verify-dns?subdomain=${encodeURIComponent(this.newBrand.subdomain)}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                });
                const res = await response.json();
                if (!response.ok) {
                    throw new Error(res.error || 'DNS check failed');
                }
                if (res.success) {
                    this.dnsVerified = true;
                    this.app.showNotification(res.warning ? `DNS Check: ${res.warning}` : 'DNS record verified successfully!');
                } else {
                    this.dnsVerified = false;
                    this.dnsMissing = res.isMissing;
                    this.dnsVerifyError = res.error;
                }
            } catch (err) {
                this.dnsVerifyError = err.message;
            } finally {
                this.dnsVerifying = false;
            }
        },
        async createDnsRecord() {
            if (!this.newBrand.subdomain) return;
            this.dnsCreating = true;
            this.dnsVerifyError = '';
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/create-dns`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify({ subdomain: this.newBrand.subdomain })
                });
                const res = await response.json();
                if (!response.ok) {
                    throw new Error(res.error || 'Failed to create DNS record.');
                }
                this.app.showNotification('DNS record successfully registered on Cloudflare!');
                this.dnsVerified = true;
                this.dnsMissing = false;
            } catch (err) {
                this.dnsVerifyError = err.message;
            } finally {
                this.dnsCreating = false;
            }
        },
        async checkSubdomainInline(brandId, subdomain) {
            this.dnsStatuses[brandId] = { checking: true, verified: false, missing: false };
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/verify-dns?subdomain=${encodeURIComponent(subdomain)}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                });
                const res = await response.json();
                if (response.ok && res.success) {
                    this.dnsStatuses[brandId] = { checking: false, verified: true, missing: false };
                } else {
                    this.dnsStatuses[brandId] = { checking: false, verified: false, missing: true };
                }
            } catch (err) {
                this.dnsStatuses[brandId] = { checking: false, verified: false, missing: true };
            }
        },
        async registerSubdomainInline(brand) {
            this.dnsStatuses[brand.id] = { registering: true, verified: false, missing: true };
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/create-dns`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify({ subdomain: brand.subdomain })
                });
                const res = await response.json();
                if (response.ok && res.success) {
                    this.app.showNotification(`Subdomain registered on Cloudflare!`);
                    this.dnsStatuses[brand.id] = { registering: false, verified: true, missing: false };
                    
                    // Update the brand's cloudflare_dns_record_id in the DB
                    await fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                        },
                        body: JSON.stringify({
                            ...brand,
                            cloudflare_dns_record_id: res.recordId
                        })
                    });
                    this.app.loadBrands();
                } else {
                    alert(res.error || 'Failed to register subdomain.');
                    this.dnsStatuses[brand.id] = { registering: false, verified: false, missing: true };
                }
            } catch (err) {
                alert(err.message);
                this.dnsStatuses[brand.id] = { registering: false, verified: false, missing: true };
            }
        },
        async verifyConnection() {
            this.connectionVerifying = true;
            this.connectionVerifyError = '';
            this.connectionVerified = false;
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/verify-connection`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify({
                        platform: this.newBrand.platform,
                        shopify_shop_name: this.newBrand.shopify_shop_name,
                        shopify_access_token: this.newBrand.shopify_access_token,
                        woocommerce_shop_url: this.newBrand.woocommerce_shop_url,
                        woocommerce_consumer_key: this.newBrand.woocommerce_consumer_key,
                        woocommerce_consumer_secret: this.newBrand.woocommerce_consumer_secret
                    })
                });
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || 'Connection verification failed');
                }
                const res = await response.json();
                if (res.success) {
                    this.connectionVerified = true;
                    this.app.showNotification(res.message || 'Connection verified successfully!');
                }
            } catch (err) {
                this.connectionVerifyError = err.message;
            } finally {
                this.connectionVerifying = false;
            }
        },
        async runEasySetup() {
            if (!this.easySetupUrl) {
                this.easySetupError = 'Please enter a shop URL (e.g. https://pesado585.com).';
                return;
            }
            this.easySetupLoading = true;
            this.easySetupError = '';
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/scrape-branding?url=${encodeURIComponent(this.easySetupUrl)}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    }
                });
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || `Server error: ${response.status}`);
                }
                const result = await response.json();
                if (result.success && result.data && result.data.id) {
                    const d = result.data;
                    this.app.newBrand.id = d.id || '';
                    this.app.newBrand.name = d.name || '';
                    this.app.newBrand.subdomain = d.subdomain || '';
                    this.app.newBrand.contact_email = d.contact_email || '';
                    this.app.newBrand.primary_color = d.primary_color || '#111111';
                    this.app.newBrand.secondary_color = d.secondary_color || '#767676';
                    this.app.newBrand.bg_color = d.bg_color || '#ffffff';
                    this.app.newBrand.text_color = d.text_color || '#111111';
                    this.app.newBrand.button_radius = d.button_radius || '4px';
                    this.app.newBrand.button_text_color = d.button_text_color || '#ffffff';
                    this.app.newBrand.header_bg_color = d.header_bg_color || '#ffffff';
                    this.app.newBrand.custom_domain = d.custom_domain || '';
                    this.app.newBrand.logo = d.logo || '';
                    this.app.newBrand.favicon = d.favicon || '';
                    this.app.newBrand.font_family = d.font_family || 'Outfit';
                    this.app.newBrand.platform = d.platform || 'shopify';
                    this.app.newBrand.shopify_shop_name = d.shopify_shop_name || '';
                    this.app.newBrand.woocommerce_shop_url = d.woocommerce_shop_url || '';
                    
                    // Register scraped products immediately
                    this.importedProducts = d.products || [];
                    this.importedProducts.forEach((p, idx) => {
                        const id = p.id || `p-${idx}`;
                        this.selectedProducts[id] = true;
                        this.customPrices[id] = p.price || 55.00;
                        this.customStock[id] = 100;
                        this.customDescriptions[id] = p.description || '';
                    });

                    this.app.showNotification('Autofilled brand fields and products from crawled website!');
                } else {
                    throw new Error('Could not automatically resolve branding data from this URL. Please fill in the details manually.');
                }
            } catch (err) {
                this.easySetupError = err.message;
            } finally {
                this.easySetupLoading = false;
            }
        },
        async saveBrandDraft() {
            if (!this.newBrand.id || !this.newBrand.name || !this.newBrand.subdomain) {
                alert('Please fill out Brand ID, Display Name, and Target Host Subdomain.');
                return;
            }
            
            // Subdomain validity and conflict validation
            if (this.localDomainType === 'subdomain') {
                const sub = this.newBrand.subdomain || '';
                const slug = sub.split('.')[0] || '';
                
                const slugRegex = /^[a-z0-9-]+$/;
                if (!slug || !slugRegex.test(slug)) {
                    alert('Invalid Subdomain Slug: Only lowercase letters, numbers, and hyphens are allowed.');
                    return;
                }
                
                const conflict = this.app.brands.some(b => b.id !== this.newBrand.id && (b.subdomain || '').split('.')[0] === slug);
                if (conflict) {
                    alert(`Conflict: The subdomain slug "${slug}" is already in use by another shop.`);
                    return;
                }
            }
            
            // Auto-run verification checks if offline preview mode is disabled and not yet verified
            if (!this.previewMode) {
                if (!this.dnsVerified) {
                    this.app.showNotification('Auto-verifying DNS configuration...');
                    await this.verifyDns();
                    if (!this.dnsVerified) {
                        alert(`DNS validation failed: ${this.dnsVerifyError || 'Subdomain DNS record does not exist on Cloudflare. Please check the setup or enable Offline Preview Mode.'}`);
                        return;
                    }
                }
                
                if (!this.connectionVerified) {
                    this.app.showNotification('Auto-testing e-commerce API integration keys...');
                    await this.verifyConnection();
                    if (!this.connectionVerified) {
                        alert(`API integration test failed: ${this.connectionVerifyError || 'Unable to connect to the WooCommerce/Shopify endpoint. Please check the credentials or enable Offline Preview Mode.'}`);
                        return;
                    }
                }
            }
            this.newBrand.status = 'draft';
            if (!this.useCustomStripe) {
                this.newBrand.stripe_secret_key = '';
                this.newBrand.stripe_webhook_secret = '';
            }
            this.savingDraft = true;
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify(this.newBrand)
                });
                if (response.ok) {
                    this.app.showNotification('Draft shop configuration saved. Loading Channels Connection...');
                    await this.app.loadBrands();
                    this.app.previewActiveBrandId = this.newBrand.id;
                    this.currentStep = 2;
                } else {
                    const err = await response.json();
                    alert(`Error saving draft: ${err.error}`);
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            } finally {
                this.savingDraft = false;
            }
        },
        async updatePreviewDesign() {
            this.savingDesign = true;
            try {
                this.newBrand.theme_settings = JSON.stringify({
                    secondary_color: this.newBrand.secondary_color,
                    bg_color: this.newBrand.bg_color,
                    text_color: this.newBrand.text_color,
                    button_radius: this.newBrand.button_radius,
                    button_text_color: this.newBrand.button_text_color,
                    header_bg_color: this.newBrand.header_bg_color
                });
                this.newBrand.status = 'draft';
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify(this.newBrand)
                });
                if (response.ok) {
                    this.app.showNotification('Design settings applied. Refreshing storefront preview...');
                    await this.app.loadBrands();
                    const iframe = document.querySelector('.preview-iframe');
                    if (iframe) {
                        iframe.src = iframe.src;
                    }
                } else {
                    const err = await response.json();
                    alert(`Failed to save design draft: ${err.error}`);
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            } finally {
                this.savingDesign = false;
            }
        },
        startBrandCreation() {
            this.isCreatingBrand = true;
        },
        cancelBrandCreation() {
            this.isCreatingBrand = false;
            this.currentStep = 1;
            this.dnsVerified = false;
            this.connectionVerified = false;
            this.previewMode = false;
            this.selectedChannels = {
                storefront: true,
                landingpage: true,
                instagram: false,
                facebook: false,
                twitter: false
            };
        },
        toggleSelectAll(event) {
            const checked = event.target.checked;
            // Create a copy of existing selections to prevent mutation warnings
            const newSelections = { ...this.selectedProducts };
            this.filteredImportedProducts.forEach(p => {
                const idx = this.importedProducts.indexOf(p);
                const id = p.id || `p-${idx}`;
                newSelections[id] = checked;
            });
            this.selectedProducts = newSelections;
        },
        applyGlobalMarkup() {
            const pct = parseFloat(this.globalMarkupPercent) || 0;
            this.importedProducts.forEach((p, idx) => {
                const id = p.id || `p-${idx}`;
                const originalPrice = p.price || 55.00;
                const markupAmount = originalPrice * (pct / 100);
                const finalPrice = originalPrice + markupAmount;
                this.customPrices[id] = parseFloat(finalPrice.toFixed(2));
            });
        },
        getLuminance(r, g, b) {
            const a = [r, g, b].map(v => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        },
        getContrastRatio(hex1, hex2) {
            if (!hex1 || !hex2) return 1;
            const rgb1 = this.hexToRgb(hex1);
            const rgb2 = this.hexToRgb(hex2);
            if (!rgb1 || !rgb2) return 1;
            const l1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b) + 0.05;
            const l2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b) + 0.05;
            return Math.max(l1, l2) / Math.min(l1, l2);
        },
        hexToRgb(hex) {
            if (!hex) return null;
            const cleanHex = hex.replace('#', '');
            if (cleanHex.length === 3) {
                return {
                    r: parseInt(cleanHex[0] + cleanHex[0], 16),
                    g: parseInt(cleanHex[1] + cleanHex[1], 16),
                    b: parseInt(cleanHex[2] + cleanHex[2], 16)
                };
            } else if (cleanHex.length === 6) {
                return {
                    r: parseInt(cleanHex.slice(0, 2), 16),
                    g: parseInt(cleanHex.slice(2, 4), 16),
                    b: parseInt(cleanHex.slice(4, 6), 16)
                };
            }
            return null;
        },
        async loadImportProducts() {
            if (this.importedProducts && this.importedProducts.length > 0) {
                return; // Keep existing crawled/loaded products
            }
            this.loadingProducts = true;
            this.productSyncError = '';
            this.importedProducts = [];
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/shopify-import?brandId=${this.newBrand.id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    this.importedProducts = data.products || [];
                    this.importedProducts.forEach((p, idx) => {
                        const id = p.id || `p-${idx}`;
                        if (this.selectedProducts[id] === undefined) {
                            this.selectedProducts[id] = true;
                            this.customPrices[id] = p.price || 55.00;
                            this.customStock[id] = 100;
                            this.customDescriptions[id] = p.description || '';
                        }
                    });
                } else {
                    const err = await response.json();
                    throw new Error(err.error || 'Failed to fetch integration products');
                }
            } catch (err) {
                this.productSyncError = err.message;
            } finally {
                this.loadingProducts = false;
            }
        },
        async syncSelectedCatalog() {
            this.productSyncing = true;
            try {
                const selected = [];
                this.importedProducts.forEach((p, idx) => {
                    const id = p.id || `p-${idx}`;
                    if (this.selectedProducts[id]) {
                        selected.push({
                            external_id: String(p.id),
                            sku: p.sku || '',
                            title: p.title,
                            price: parseFloat(this.customPrices[id]) || p.price || 55.00,
                            image: p.image || '',
                            description: this.customDescriptions[id] || p.description || '',
                            original_link: p.original_link || '',
                            translations: p.translations || {}
                        });
                    }
                });

                const response = await fetch(`${this.app.apiBaseUrl}/api/global/shopify-import/batch`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify({
                        brandId: this.newBrand.id,
                        products: selected
                    })
                });

                if (response.ok) {
                    this.app.showNotification(`Successfully synced ${selected.length} products to catalog.`);
                    this.productSyncSuccess = true;
                } else {
                    const err = await response.json();
                    alert(`Sync failed: ${err.error}`);
                }
            } catch (err) {
                alert(`Error syncing catalog: ${err.message}`);
            } finally {
                this.productSyncing = false;
            }
        },
        getPlatformLogoSvg(platform, size = 16) {
            if (platform === 'shopify') {
                return `<svg viewBox="0 0 152 172" width="${size}" height="${size}" style="vertical-align: middle; display: inline-block;"><path d="m 130.7,32.605 c -0.1,-0.9 -0.9,-1.3 -1.5,-1.4 -0.6,-0.1 -12.6,-0.2 -12.6,-0.2 0,0 -10.1,-9.8 -11.1,-10.8 -1,-1 -2.9,-0.7 -3.7,-0.5 0,0 -1.9,0.6 -5.1,1.6 -0.5,-1.7 -1.3,-3.8 -2.4,-5.9 C 90.7,8.505 85.5,4.905 79.1,4.905 c -0.4,0 -0.9,0 -1.3,0.1 -0.2,-0.2 -0.4,-0.4 -0.6,-0.7 -2.8,-3 -6.3,-4.4 -10.5,-4.3 -8.2,0.2 -16.3,6.1 -23,16.7 -4.7,7.4 -8.2,16.7 -9.2,23.9 -9.4,2.9 -16,4.9 -16.1,5 -4.7,1.5 -4.9,1.6 -5.5,6.1 C 12.4,55.005 0,151.105 0,151.105 l 104.1,18 45.1,-11.2 c 0,0 -18.4,-124.5 -18.5,-125.3 z M 91.5,22.905 c -2.4,0.7 -5.1,1.6 -8.1,2.5 -0.1,-4.1 -0.6,-9.9 -2.5,-14.9 6.3,1.2 9.3,8.2 10.6,12.4 z M 78,27.105 c -5.5,1.7 -11.4,3.5 -17.4,5.4 1.7,-6.4 4.9,-12.8 8.8,-17 1.5,-1.6 3.5,-3.3 5.9,-4.3 2.3,4.7 2.7,11.4 2.7,15.9 z M 66.8,5.505 c 1.9,0 3.5,0.4 4.9,1.3 -2.2,1.1 -4.4,2.8 -6.4,5 -5.2,5.6 -9.2,14.2 -10.8,22.6 -5,1.5 -9.8,3 -14.3,4.4 3,-13.2 14,-32.9 26.6,-33.3 z" fill="#95BF47"/><path d="m 129.2,31.205 c -0.6,-0.1 -12.6,-0.2 -12.6,-0.2 0,0 -10.1,-9.8 -11.1,-10.8 -0.4,-0.4 -0.9,-0.6 -1.4,-0.6 V 169.105 l 45.1,-11.2 c 0,0 -18.4,-124.4 -18.5,-125.3 -0.2,-0.9 -0.9,-1.3 -1.5,-1.4 z" fill="#5E8E3E"/><path d="m 79.1,54.405 -5.2,19.6 c 0,0 -5.8,-2.7 -12.8,-2.2 -10.2,0.6 -10.3,7 -10.2,8.7 0.6,8.8 23.6,10.7 24.9,31.2 1,16.2 -8.6,27.2 -22.4,28.1 -16.6,1 -25.7,-8.7 -25.7,-8.7 l 3.5,-14.9 c 0,0 9.2,6.9 16.5,6.5 4.8,-0.3 6.5,-4.2 6.3,-7 -0.7,-11.4 -19.5,-10.8 -20.7,-29.5 -1,-15.8 9.4,-31.8 32.3,-33.3 9,-0.8 13.5,1.5 13.5,1.5 z" fill="#FFFFFF"/></svg>`;
            }
            if (platform === 'woocommerce') {
                return `<svg viewBox="0 0 256 153" width="${size}" height="${size}" style="vertical-align: middle; display: inline-block;"><path d="m23.759 0h208.38c13.187 0 23.863 10.675 23.863 23.863v79.542c0 13.187-10.675 23.863-23.863 23.863h-74.727l10.257 25.118-45.109-25.118h-98.695c-13.187 0-23.863-10.675-23.863-23.863v-79.542c-0.10466-13.083 10.571-23.863 23.758-23.863z" fill="#7F54B3"/><path d="m14.578 21.75c1.4569-1.9772 3.6423-3.0179 6.5561-3.226 5.3073-0.41626 8.3252 2.0813 9.0537 7.4927 3.226 21.75 6.7642 40.169 10.511 55.259l22.79-43.395c2.0813-3.9545 4.6829-6.0358 7.8049-6.2439 4.5789-0.3122 7.3886 2.6016 8.5333 8.7415 2.6016 13.841 5.9317 25.6 9.8862 35.59 2.7057-26.433 7.2846-45.476 13.737-57.236 1.561-2.9138 3.8504-4.3707 6.8683-4.5789 2.3935-0.20813 4.5789 0.52033 6.5561 2.0813 1.9772 1.561 3.0179 3.5382 3.226 5.9317 0.10406 1.8732-0.20813 3.4341-1.0407 4.9951-4.0585 7.4927-7.3886 20.085-10.094 37.567-2.6016 16.963-3.5382 30.179-2.9138 39.649 0.20813 2.6016-0.20813 4.8911-1.2488 6.8683-1.2488 2.2894-3.122 3.5382-5.5154 3.7463-2.7057 0.20813-5.5154-1.0406-8.2211-3.8504-9.678-9.8862-17.379-24.663-22.998-44.332-6.7642 13.32-11.759 23.311-14.985 29.971-6.1398 11.759-11.343 17.795-15.714 18.107-2.8098 0.20813-5.2033-2.1854-7.2846-7.1805-5.3073-13.633-11.031-39.961-17.171-78.985-0.41626-2.7057 0.20813-5.0992 1.665-6.9724zm223.64 16.338c-3.7463-6.5561-9.2618-10.511-16.65-12.072-1.9772-0.41626-3.8504-0.62439-5.6195-0.62439-9.9902 0-18.107 5.2033-24.455 15.61-5.4114 8.8455-8.1171 18.628-8.1171 29.346 0 8.013 1.665 14.881 4.9951 20.605 3.7463 6.5561 9.2618 10.511 16.65 12.072 1.9772 0.41626 3.8504 0.62439 5.6195 0.62439 10.094 0 18.211-5.2033 24.455-15.61 5.4114-8.9496 8.1171-18.732 8.1171-29.45 0.10406-8.1171-1.665-14.881-4.9951-20.501zm-13.112 28.826c-1.4569 6.8683-4.0585 11.967-7.9089 15.402-3.0179 2.7057-5.8276 3.8504-8.4293 3.3301-2.4976-0.52033-4.5789-2.7057-6.1398-6.7642-1.2488-3.226-1.8732-6.452-1.8732-9.4699 0-2.6016 0.20813-5.2033 0.72846-7.5967 0.93659-4.2667 2.7057-8.4293 5.5154-12.384 3.4341-5.0992 7.0764-7.1805 10.823-6.452 2.4976 0.52033 4.5789 2.7057 6.1398 6.7642 1.2488 3.226 1.8732 6.452 1.8732 9.4699 0 2.7057-0.20813 5.3073-0.72846 7.7008zm-52.033-28.826c-3.7463-6.5561-9.3659-10.511-16.65-12.072-1.9772-0.41626-3.8504-0.62439-5.6195-0.62439-9.9902 0-18.107 5.2033-24.455 15.61-5.4114 8.8455-8.1171 18.628-8.1171 29.346 0 8.013 1.665 14.881 4.9951 20.605 3.7463 6.5561 9.2618 10.511 16.65 12.072 1.9772 0.41626 3.8504 0.62439 5.6195 0.62439 10.094 0 18.211-5.2033 24.455-15.61 5.4114-8.9496 8.1171-18.732 8.1171-29.45 0-8.1171-1.665-14.881-4.9951-20.501zm-13.216 28.826c-1.4569 6.8683-4.0585 11.967-7.9089 15.402-3.0179 2.7057-5.8276 3.8504-8.4293 3.3301-2.4976-0.52033-4.5789-2.7057-6.1398-6.7642-1.2488-3.226-1.8732-6.452-1.8732-9.4699 0-2.6016 0.20813-5.2033 0.72846-7.5967 0.93658-4.2667 2.7057-8.4293 5.5154-12.384 3.4341-5.0992 7.0764-7.1805 10.823-6.452 2.4976 0.52033 4.5789 2.7057 6.1398 6.7642 1.2488 3.226 1.8732 6.452 1.8732 9.4699 0.10406 2.7057-0.20813 5.3073-0.72846 7.7008z" fill="#FFFFFF"/></svg>`;
            }
            return '';
        },
        getStripeLogoSvg(size = 15, color = '#635BFF') {
            const width = size * 2.4;
            return `<svg viewBox="54 36 360.02 149.84" width="${width}" height="${size}" fill="${color}" style="vertical-align: middle; display: inline-block; margin-left: 2px;"><g><path d="M414,113.4c0-25.6-12.4-45.8-36.1-45.8c-23.8,0-38.2,20.2-38.2,45.6c0,30.1,17,45.3,41.4,45.3c11.9,0,20.9-2.7,27.7-6.5v-20c-6.8,3.4-14.6,5.5-24.5,5.5c-9.7,0-18.3-3.4-19.4-15.2h48.9C413.8,121,414,115.8,414,113.4z M364.6,103.9c0-11.3,6.9-16,13.2-16c6.1,0,12.6,4.7,12.6,16H364.6z"></path><path d="M301.1,67.6c-9.8,0-16.1,4.6-19.6,7.8l-1.3-6.2h-22v116.6l25-5.3l0.1-28.3c3.6,2.6,8.9,6.3,17.7,6.3c17.9,0,34.2-14.4,34.2-46.1C335.1,83.4,318.6,67.6,301.1,67.6z M295.1,136.5c-5.9,0-9.4-2.1-11.8-4.7l-0.1-37.1c2.6-2.9,6.2-4.9,11.9-4.9c9.1,0,15.4,10.2,15.4,23.3C310.5,126.5,304.3,136.5,295.1,136.5z"></path><polygon points="223.8,61.7 248.9,56.3 248.9,36 223.8,41.3"></polygon><rect x="223.8" y="69.3" width="25.1" height="87.5"></rect><path d="M196.9,76.7l-1.6-7.4h-21.6v87.5h25V97.5c5.9-7.7,15.9-6.3,19-5.2v-23C214.5,68.1,202.8,65.9,196.9,76.7z"></path><path d="M146.9,47.6l-24.4,5.2l-0.1,80.1c0,14.8,11.1,25.7,25.9,25.7c8.2,0,14.2-1.5,17.5-3.3V135c-3.2,1.3-19,5.9-19-8.9V90.6h19V69.3h-19L146.9,47.6z"></path><path d="M79.3,94.7c0-3.9,3.2-5.4,8.5-5.4c7.6,0,17.2,2.3,24.8,6.4V72.2c-8.3-3.3-16.5-4.6-24.8-4.6C67.5,67.6,54,78.2,54,95.9c0,27.6,38,23.2,38,35.1c0,4.6-4,6.1-9.6,6.1c-8.3,0-18.9-3.4-27.3-8v23.8c9.3,4,18.7,5.7,27.3,5.7c20.8,0,35.1-10.3,35.1-28.2C117.4,100.6,79.3,105.9,79.3,94.7z"></path></g></svg>`;
        },
        getChannelLogoSvg(channel, size = 16, color = null) {
            const lower = channel.toLowerCase();
            if (lower === 'storefront') {
                const strokeColor = color || 'var(--accent)';
                return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
            }
            if (lower === 'landingpage') {
                const strokeColor = color || 'var(--accent)';
                return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="13" y2="17"></line></svg>`;
            }
            if (lower === 'instagram') {
                if (color) {
                    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
                }
                return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="url(#ig-grad-brands)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;"><defs><linearGradient id="ig-grad-brands" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#fdf497" /><stop offset="5%" stop-color="#fdf497" /><stop offset="45%" stop-color="#fd5949" /><stop offset="60%" stop-color="#d6249f" /><stop offset="90%" stop-color="#285AEB" /></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
            }
            if (lower === 'facebook') {
                const fillColor = color || '#1877F2';
                return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fillColor}" style="vertical-align: middle; display: inline-block;"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
            }
            if (lower === 'twitter' || lower === 'x') {
                const fillColor = color || 'currentColor';
                return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fillColor}" style="vertical-align: middle; display: inline-block;"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
            }
            return '';
        },
        async finalizeOnboarding() {
            this.savingFinal = true;
            try {
                let primary = this.newBrand.primary_color || '#c5a059';
                let secondary = this.newBrand.secondary_color || '#b08d47';
                let bg = this.newBrand.bg_color || '#0b0d0c';
                let text = this.newBrand.text_color || '#f3f4f3';
                let btnText = this.newBrand.button_text_color || '#0b0d0c';
                let headerBg = this.newBrand.header_bg_color || '#0b0d0c';

                // 1. Text vs Background Contrast Check
                if (this.getContrastRatio(text, bg) < 4.5) {
                    const bgRgb = this.hexToRgb(bg);
                    if (bgRgb) {
                        const bgLuminance = this.getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
                        text = bgLuminance > 0.5 ? '#111111' : '#f3f4f3';
                    }
                }
                // 2. Button Text vs Accent Contrast Check
                if (this.getContrastRatio(btnText, primary) < 4.5) {
                    const primRgb = this.hexToRgb(primary);
                    if (primRgb) {
                        const primLuminance = this.getLuminance(primRgb.r, primRgb.g, primRgb.b);
                        btnText = primLuminance > 0.5 ? '#0b0d0c' : '#ffffff';
                    }
                }
                // 3. Accent vs Background Contrast Check
                if (this.getContrastRatio(primary, bg) < 3.0) {
                    const bgRgb = this.hexToRgb(bg);
                    if (bgRgb) {
                        const bgLuminance = this.getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
                        primary = bgLuminance > 0.5 ? '#c5a059' : '#ffffff';
                    }
                }

                this.newBrand.primary_color = primary;
                this.newBrand.secondary_color = secondary;
                this.newBrand.bg_color = bg;
                this.newBrand.text_color = text;
                this.newBrand.button_text_color = btnText;
                this.newBrand.header_bg_color = headerBg;

                let existingTheme = {};
                if (this.newBrand.theme_settings) {
                    try {
                        existingTheme = typeof this.newBrand.theme_settings === 'string'
                            ? JSON.parse(this.newBrand.theme_settings)
                            : this.newBrand.theme_settings;
                    } catch(e) {}
                }
                this.newBrand.theme_settings = JSON.stringify({
                    ...existingTheme,
                    secondary_color: this.newBrand.secondary_color,
                    bg_color: this.newBrand.bg_color,
                    text_color: this.newBrand.text_color,
                    button_radius: this.newBrand.button_radius,
                    button_text_color: this.newBrand.button_text_color,
                    header_bg_color: this.newBrand.header_bg_color,
                    font_family: this.newBrand.font_family || 'Outfit'
                });
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify(this.newBrand)
                });
                if (response.ok) {
                    this.app.showNotification(`Onboarding complete! Brand is now ${this.newBrand.status}.`);
                    
                    // Automatically sync catalog products if any are selected
                    const hasSelectedProducts = Object.keys(this.selectedProducts).some(id => this.selectedProducts[id]);
                    if (hasSelectedProducts) {
                        try {
                            const selected = [];
                            this.importedProducts.forEach((p, idx) => {
                                const id = p.id || `p-${idx}`;
                                if (this.selectedProducts[id]) {
                                    selected.push({
                                        external_id: String(p.id),
                                        sku: p.sku || '',
                                        title: p.title,
                                        price: parseFloat(this.customPrices[id]) || p.price || 55.00,
                                        image: p.image || '',
                                        description: this.customDescriptions[id] || p.description || '',
                                        original_link: p.original_link || '',
                                        translations: p.translations || {}
                                    });
                                }
                            });

                            const syncResponse = await fetch(`${this.app.apiBaseUrl}/api/global/shopify-import/batch`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                                },
                                body: JSON.stringify({
                                    brandId: this.newBrand.id,
                                    products: selected
                                })
                            });
                            
                            if (syncResponse.ok) {
                                this.app.showNotification(`Successfully synced ${selected.length} products to catalog.`);
                            }
                        } catch (syncErr) {
                            console.error('Failed to sync catalog products during onboarding:', syncErr);
                        }
                    }

                    // Reset wizard state
                    this.currentStep = 1;
                    this.dnsVerified = false;
                    this.connectionVerified = false;
                    this.useCustomStripe = false;
                    this.previewMode = false;
                    this.selectedProducts = {};
                    this.customPrices = {};
                    this.globalMarkupPercent = 0;
                    this.customStock = {};
                    this.selectedChannels = {
                        storefront: true,
                        landingpage: true,
                        instagram: false,
                        facebook: false,
                        twitter: false
                    };
                    
                    // Reset parent brand object
                    this.app.newBrand = { id: '', name: '', subdomain: '', contact_email: '', primary_color: '#111111', secondary_color: '#767676', bg_color: '#ffffff', text_color: '#111111', button_radius: '4px', button_text_color: '#ffffff', header_bg_color: '#ffffff', theme_settings: '', platform: 'shopify', shopify_shop_name: '', shopify_access_token: '', woocommerce_shop_url: '', woocommerce_consumer_key: '', woocommerce_consumer_secret: '', stripe_secret_key: '', stripe_webhook_secret: '', custom_domain: '', logo: '', favicon: '', font_family: 'Outfit', status: 'draft', stripe_enabled: false, languages: ['en'] };
                    
                    this.isCreatingBrand = false;
                    await this.app.loadBrands();
                    this.app.switchView('brands');
                } else {
                    const err = await response.json();
                    alert(`Error finalizing: ${err.error}`);
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            } finally {
                this.savingFinal = false;
            }
        },
        onDragOver(e) {
            e.currentTarget.style.borderColor = 'var(--text-main)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        },
        onDragLeave(e) {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
        },
        async onLogoDrop(e) {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
            const file = e.dataTransfer.files[0];
            if (file) {
                await this.uploadAsset(file, 'logo');
            }
        },
        async onLogoFileSelect(e) {
            const file = e.target.files[0];
            if (file) {
                await this.uploadAsset(file, 'logo');
            }
        },
        async onFaviconDrop(e) {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
            const file = e.dataTransfer.files[0];
            if (file) {
                await this.uploadAsset(file, 'favicon');
            }
        },
        async onFaviconFileSelect(e) {
            const file = e.target.files[0];
            if (file) {
                await this.uploadAsset(file, 'favicon');
            }
        },
        async uploadAsset(file, type) {
            if (type === 'logo') {
                this.logoUploading = true;
            } else {
                this.faviconUploading = true;
            }
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: formData
                });
                if (response.ok) {
                    const data = await response.json();
                    if (type === 'logo') {
                        this.newBrand.logo = data.url;
                        this.app.showNotification('Logo uploaded successfully!');
                    } else {
                        this.newBrand.favicon = data.url;
                        this.app.showNotification('Favicon uploaded successfully!');
                    }
                } else {
                    const err = await response.json();
                    alert(`Upload failed: ${err.error || response.statusText}`);
                }
            } catch (err) {
                alert(`Upload error: ${err.message}`);
            } finally {
                if (type === 'logo') {
                    this.logoUploading = false;
                } else {
                    this.faviconUploading = false;
                }
            }
        }
    }
}
</script>

<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}
.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
</style>

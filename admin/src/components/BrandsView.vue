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
                                       style="width: 60px; height: 26px; padding: 4px 6px; font-size: 0.82rem; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); text-align: center; font-weight: bold; margin: 0;">
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
                                            <a :href="'http://' + b.subdomain" target="_blank" style="color: var(--text-main); text-decoration: none; font-weight: 500;">
                                                🔗 {{ b.subdomain }}
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
                                        🔗 {{ b.subdomain }}/promo-offer
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
                                                <span v-html="getChannelLogoSvg('instagram', 12)"></span>
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
                                                <span v-html="getChannelLogoSvg('facebook', 12)"></span>
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
                                                <span v-html="getChannelLogoSvg('twitter', 12)"></span>
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
                return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="#96BF48" style="vertical-align: middle; display: inline-block;"><path d="M19.43 6.94l-2.12-4.8A1.37 1.37 0 0 0 16.08 1.4H7.92a1.37 1.37 0 0 0-1.23.74L4.57 6.94A1.37 1.37 0 0 0 4.41 8L5.73 20A1.37 1.37 0 0 0 7.1 21.2H16.9a1.37 1.37 0 0 0 1.37-1.2l1.32-12a1.37 1.37 0 0 0-.16-1.06zm-7.43-3.6h2.24l.8 2.24H11.2l.8-2.24z"/></svg>`;
            }
            if (platform === 'woocommerce') {
                return `<svg viewBox="0 0 32 32" width="${size}" height="${size}" fill="#96588A" style="vertical-align: middle; display: inline-block;"><path d="M26.8 9.3c-.6-.7-1.4-1.1-2.3-1.1h-17c-.9 0-1.7.4-2.3 1.1-.6.7-.8 1.6-.6 2.5l2.4 11.2c.3 1.3 1.4 2.2 2.8 2.2h9.4c1.4 0 2.5-.9 2.8-2.2l2.4-11.2c.2-.9-.1-1.8-.7-2.5zM12.6 20.4l-2-5.4h4l1 3 1-3h4l-2 5.4h-6z"/></svg>`;
            }
            return '';
        },
        getStripeLogoSvg(size = 16) {
            return `<svg viewBox="0 0 60 25" width="36" height="15" fill="#635BFF" style="vertical-align: middle; display: inline-block; margin-left: 2px;"><path d="M59.64 14.28c0-2.6-1.6-3.9-4.2-3.9-1.4 0-2.5.3-3 .6v-1.6c0-1.3-.9-2.1-2.5-2.1-1.4 0-2.6.4-3.4.8l-1-2.3c1.2-.7 3-1.1 4.9-1.1 3.5 0 5.6 1.8 5.6 5.1v7.6c-1 .4-2.4.7-3.8.7-3.6.1-7.1-1.3-7.1-3.9 0-.8.6-1.3 1.6-1.3 1 0 1.8-.2 2.2-.5v-2.3c-.5-.2-1.3-.4-2-.4-1.1 0-1.8.6-1.8 1.9 0 .8.6 1.3 1.6 1.3 1 0 1.8-.2 2.2-.5v-2.3c-.5-.2-1.3-.4-2-.4-1.1 0-1.8.6-1.8 1.9 0 2.2 1.5 3.5 3.9 3.5 1 .4 2.4.7 3.8.7 3.5-.1 5.3-1.8 5.3-5.1zm-13.6-6.7h-3.4v6c0 .7.4 1 1 1h2.4v2.5h-2.9c-2.4 0-3.9-1.2-3.9-3.5v-6h-1.8v-2.7h1.8v-3l3.4-1v4h3.4zm-9.1 2.3c.3-.1.7-.1 1.1-.1v3.2c-.4 0-.8 0-1.1.1v6.7h-3.5v-10h3.5zm-5.7-3.5c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8-.8 1.8-1.8 1.8-1.8-.8-1.8-1.8zm-1.8 6.2h3.5v10.1h-3.5zm-9.3-6.2c1 .4 2.2.7 3.4.7 2.9 0 4.9-1.5 4.9-4.6s-2-4.6-4.9-4.6c-1.2 0-2.4.3-3.4.7zm1.1 6.3h-1.1v-12.7c.7-.3 1.8-.5 2.8-.5 2.9 0 4.3 1.4 4.3 3.9s-1.4 3.9-4.3 3.9c-.6 0-1.2-.1-1.7-.3zm-10.4 6.7c0-2.4-1.5-3.7-3.9-3.7-1.1 0-2.2.3-2.9.6V15c.6-.3 1.5-.5 2.4-.5 1.4 0 2 .5 2 1.3 0 .8-.8 1.1-2.2 1.5-2.2.6-3.9 1.4-3.9 3.9 0 2.4 1.8 3.7 4.1 3.7 1.3 0 2.5-.3 3.2-.8v.6h3.3v-9.5z"/></svg>`;
        },
        getChannelLogoSvg(channel, size = 16) {
            const lower = channel.toLowerCase();
            if (lower === 'storefront') {
                return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
            }
            if (lower === 'landingpage') {
                return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="13" y2="17"></line></svg>`;
            }
            if (lower === 'instagram') {
                return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="url(#ig-grad-brands)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;"><defs><linearGradient id="ig-grad-brands" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#fdf497" /><stop offset="5%" stop-color="#fdf497" /><stop offset="45%" stop-color="#fd5949" /><stop offset="60%" stop-color="#d6249f" /><stop offset="90%" stop-color="#285AEB" /></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
            }
            if (lower === 'facebook') {
                return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="#1877F2" style="vertical-align: middle; display: inline-block;"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
            }
            if (lower === 'twitter' || lower === 'x') {
                return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="#FFFFFF" style="vertical-align: middle; display: inline-block; background: #000; border-radius: 4px; padding: 2px;"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
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

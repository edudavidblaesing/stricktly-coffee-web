<template>
    <div id="view-settings" class="admin-view" :class="{ active: app.activeView === 'settings' }">
        <!-- Global configs -->
        <div class="panel" v-if="userRole.toLowerCase() === 'superadmin'">
            <div class="panel-header">
                <h3 class="panel-title">Global Stripe & API Settings</h3>
            </div>
            <form @submit.prevent style="margin-top: 15px;">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Stripe Integration Mode</label>
                        <select id="global-stripe-mode">
                            <option value="test">Sandbox / Testing (Custom Stripe checks)</option>
                            <option value="live">Live / Production (Direct Stripe redirection)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Max Upload Image Size (Resized width px)</label>
                        <input type="number" id="global-image-rules" value="800">
                    </div>
                    <div class="form-group form-full">
                        <label>Global API Webhook Logs Path</label>
                        <input type="text" id="global-webhook-logs" readonly
                            value="/var/log/sc-api-webhooks.log">
                    </div>
                </div>
                <div class="panel-footer">
                    <button type="button" class="btn btn-accent" style="margin: 0;"
                        @click="showNotification('Global integrations updated.')">Save Global Configurations</button>
                </div>
            </form>
        </div>

        <!-- Contextual settings for currently filtered shop -->
        <div class="panel" id="shop-settings-panel" v-if="activeShopFilter !== 'all'">
            <div class="panel-header">
                <h3 class="panel-title">Shop Settings for <span>{{ currentSelectedBrandName }}</span></h3>
            </div>
            <form @submit.prevent="updateBrandSettings" style="margin-top: 15px;">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Display Name</label>
                        <input type="text" v-model="settingsBrand.name" required placeholder="Brand/Store Name">
                    </div>
                    <div class="form-group">
                        <label>Contact Email</label>
                        <input type="email" v-model="settingsBrand.contact_email" required placeholder="contact@brand.com">
                    </div>

                    <!-- Unified storefront domain row with suffix dropdown -->
                    <div class="form-group form-full">
                        <label>Storefront Domain Routing Address</label>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input v-if="baseDomainOption === 'subdomain'"
                                   type="text"
                                   v-model="subdomainSlug"
                                   :readonly="userRole.toLowerCase() === 'merchant'"
                                   required
                                   pattern="^[a-z0-9-]+$"
                                   placeholder="brand-slug"
                                   style="flex: 1; margin: 0; background: var(--workspace-bg); height: 38px;">
                            <input v-else
                                   type="text"
                                   v-model="settingsBrand.custom_domain"
                                   :readonly="userRole.toLowerCase() === 'merchant'"
                                   required
                                   pattern="^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}$"
                                   placeholder="coffee-brandsite.com"
                                   style="flex: 1; margin: 0; background: var(--workspace-bg); height: 38px;">

                            <select v-model="baseDomainOption"
                                    :disabled="userRole.toLowerCase() === 'merchant'"
                                    style="cursor: pointer; width: 180px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; padding: 8px 12px; height: 38px; margin: 0;">
                                <option value="subdomain">.{{ app.baseBrandDomain }}</option>
                                <option value="custom">Custom Domain</option>
                            </select>
                        </div>
                    </div>



                    <!-- Master Brand Style Guidelines -->
                    <div class="form-group form-full" style="margin-top: 16px; margin-bottom: 8px;">
                        <h4 style="margin: 0; color: var(--accent); font-weight: 700; border-bottom: 1px solid var(--border); padding-bottom: 8px;">🎨 Default Brand Style Guidelines</h4>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 4px 0 0 0;">
                            These colors and assets serve as the default styling rules across your storefront and other channels. Individual channels can override these defaults in the Designer.
                        </p>
                    </div>

                    <div class="form-group">
                        <label>Custom Accent Color</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="color" v-model="settingsBrand.primary_color" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                            <input type="text" v-model="settingsBrand.primary_color" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#111111" style="flex: 1; margin: 0;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Secondary Color (Hover, details)</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="color" v-model="settingsBrand.secondary_color" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                            <input type="text" v-model="settingsBrand.secondary_color" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#767676" style="flex: 1; margin: 0;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Storefront Background Color</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="color" v-model="settingsBrand.bg_color" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                            <input type="text" v-model="settingsBrand.bg_color" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#ffffff" style="flex: 1; margin: 0;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Primary Text Color</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="color" v-model="settingsBrand.text_color" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                            <input type="text" v-model="settingsBrand.text_color" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#111111" style="flex: 1; margin: 0;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Header Background Color</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="color" v-model="settingsBrand.header_bg_color" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                            <input type="text" v-model="settingsBrand.header_bg_color" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#ffffff" style="flex: 1; margin: 0;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Button Text Color</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="color" v-model="settingsBrand.button_text_color" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                            <input type="text" v-model="settingsBrand.button_text_color" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#ffffff" style="flex: 1; margin: 0;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Button Shape (Border Radius)</label>
                        <select v-model="settingsBrand.button_radius" style="width: 100%; height: 40px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 10px;">
                            <option value="0px">Sharp Square (0px)</option>
                            <option value="4px">Slightly Rounded (4px)</option>
                            <option value="8px">Rounded Card (8px)</option>
                            <option value="12px">Extra Rounded (12px)</option>
                            <option value="9999px">Pill / Stadium (9999px)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Default Font Family</label>
                        <select v-model="settingsBrand.font_family" style="width: 100%; height: 40px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 10px;">
                            <option value="Outfit">Outfit (Clean Sans-Serif)</option>
                            <option value="Inter">Inter (Modern Grotesque)</option>
                            <option value="Roboto">Roboto (Neo-Grotesque)</option>
                            <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
                            <option value="Lora">Lora (Contemporary Serif)</option>
                            <option value="Merriweather">Merriweather (Classic Serif)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Favicon Icon URL (Optional)</label>
                        <input type="url" v-model="settingsBrand.favicon" placeholder="https://pesado585.com/favicon.ico">
                    </div>
                    <div class="form-group">
                        <label>Logo Image URL (Optional)</label>
                        <input type="url" v-model="settingsBrand.logo" placeholder="https://pesado585.com/logo.png">
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
                                       border: '1px solid ' + (settingsBrand.languages && settingsBrand.languages.includes(lang.code) ? 'var(--text-main)' : 'var(--border)'),
                                       background: settingsBrand.languages && settingsBrand.languages.includes(lang.code) ? 'var(--text-main)' : 'transparent',
                                       color: settingsBrand.languages && settingsBrand.languages.includes(lang.code) ? 'var(--workspace-bg)' : 'var(--text-main)',
                                       cursor: 'pointer',
                                       fontSize: '0.82rem',
                                       fontWeight: '600',
                                       userSelect: 'none',
                                       transition: 'all 0.2s ease'
                                   }">
                                <input type="checkbox" :value="lang.code" v-model="settingsBrand.languages" style="display: none;">
                                <span>{{ lang.flag }} {{ lang.name }}</span>
                            </label>
                        </div>
                    </div>

                    <div class="form-group form-full">
                        <label style="display: flex; align-items: center; gap: 6px;"><span v-html="getPlatformLogoSvg('shopify')"></span>Shopify Store URL (for asset scraping & sync)</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="text" v-model="settingsBrand.shopify_shop_name" placeholder="brand-shop.myshopify.com" style="flex: 1; margin: 0; height: 38px;">
                            <button type="button" class="btn btn-primary" style="margin: 0; padding: 0 16px; white-space: nowrap; height: 38px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; border-radius: 6px; border: none; cursor: pointer; transition: all 0.2s;" :disabled="isScraping" @click="fetchBrandStylesFromShopify">
                                <span v-if="isScraping">Scraping...</span>
                                <span v-else>🔄 Fetch Styles</span>
                            </button>
                        </div>
                    </div>
                    <div class="form-group form-full">
                        <label style="display: flex; align-items: center; gap: 6px;"><span v-html="getPlatformLogoSvg('shopify')"></span>Shopify Access Token</label>
                        <input type="password" v-model="settingsBrand.shopify_access_token"
                            placeholder="Shopify Access Token (shpat_...)">
                    </div>

                    <!-- Stripe Configuration checkbox (Superadmin Only) -->
                    <div class="form-group form-full" v-if="userRole.toLowerCase() === 'superadmin'">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 700; margin-top: 10px;">
                            <input type="checkbox" v-model="settingsBrand.stripe_enabled" style="width: 18px; height: 18px; margin: 0;">
                            Enable custom Stripe gateway configuration for this merchant
                        </label>
                    </div>

                    <!-- Stripe Credentials Config Fields -->
                    <template v-if="userRole.toLowerCase() === 'superadmin' || settingsBrand.stripe_enabled">
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 6px;"><span v-html="getStripeLogoSvg()"></span>Stripe Secret Key</label>
                            <input type="password" v-model="settingsBrand.stripe_secret_key"
                                placeholder="Stripe Secret Key (sk_live_...)" pattern="^sk_(?:live|test)_[a-zA-Z0-9]+$">
                        </div>
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 6px;"><span v-html="getStripeLogoSvg()"></span>Stripe Webhook Secret</label>
                            <input type="password" v-model="settingsBrand.stripe_webhook_secret"
                                placeholder="Stripe Webhook Secret (whsec_...)" pattern="^whsec_[a-zA-Z0-9]+$">
                        </div>
                    </template>
                    <!-- DNS Status Check and register button -->
                    <div class="form-group form-full" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 16px; border-radius: 8px; margin-top: 5px; margin-bottom: 10px;" v-if="userRole.toLowerCase() === 'superadmin'">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                            <div>
                                <strong style="font-size: 0.85rem; color: var(--text-main);">Cloudflare DNS Routing Check</strong>
                                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                                    Verify active Cloudflare CNAME record for: <strong style="color: var(--accent);">{{ settingsBrand.subdomain || 'Not configured' }}</strong>
                                </div>
                                <div v-if="dnsVerifyError" style="color: #ef4444; font-size: 0.74rem; margin-top: 4px; font-weight: 600;">
                                    ❌ {{ dnsVerifyError }}
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span v-if="dnsVerified" style="color: #10b981; font-weight: 700; font-size: 0.8rem; margin-right: 6px;">✅ Verified</span>
                                <button type="button" class="btn" style="margin: 0; padding: 4px 10px; font-size: 0.78rem; height: 30px;" @click="verifyDns" :disabled="dnsVerifying">
                                    {{ dnsVerifying ? 'Checking...' : (dnsVerified ? 'Re-Verify' : 'Verify DNS') }}
                                </button>
                                <button type="button" class="btn btn-accent" v-if="dnsMissing && !dnsVerified" style="margin: 0; padding: 4px 10px; font-size: 0.78rem; height: 30px; font-weight: 700;" @click="createDnsRecord" :disabled="dnsCreating">
                                    {{ dnsCreating ? 'Registering...' : 'Register on Cloudflare' }}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
                <div class="panel-footer">
                    <button type="submit" class="btn btn-accent" style="margin: 0;">Update Shop Integrations</button>
                </div>
            </form>

            <!-- Danger Zone / Store Management -->
            <div style="margin-top: 30px; border-top: 1px solid var(--border); padding-top: 20px;">
                <h4 style="color: #ef4444; margin-bottom: 12px; font-weight: 700; font-family: var(--font-display);">⚠️ Danger Zone / Store Management</h4>
                <div style="background: rgba(239, 68, 68, 0.03); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <strong style="color: var(--text-main); font-size: 0.9rem;">Pause Storefront</strong>
                            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                                Temporarily disable public browsing. The storefront will return a "Storefront Offline" status.
                            </div>
                        </div>
                        <button type="button" class="btn" 
                            :style="{ background: settingsBrand.status === 'paused' ? '#10b981' : '#f97316', borderColor: settingsBrand.status === 'paused' ? '#10b981' : '#f97316', color: '#fff', margin: 0, height: '32px', fontSize: '0.8rem' }"
                            @click="toggleStorePause">
                            {{ settingsBrand.status === 'paused' ? '▶️ Resume Store' : '⏸️ Pause Store' }}
                        </button>
                    </div>

                    <div v-if="userRole.toLowerCase() === 'superadmin'" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
                        <div>
                            <strong style="color: var(--text-main); font-size: 0.9rem;">Archive Storefront</strong>
                            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                                Move the storefront into archived status. Public access is permanently disabled. <span v-if="userRole.toLowerCase() !== 'superadmin'" style="color: #ef4444; font-weight: 600;">(Superadmin only)</span>
                            </div>
                        </div>
                        <button type="button" class="btn" 
                            :disabled="settingsBrand.status === 'archived' || userRole.toLowerCase() !== 'superadmin'"
                            :style="{ background: '#6b7280', borderColor: '#6b7280', color: '#fff', margin: 0, height: '32px', fontSize: '0.8rem', opacity: (settingsBrand.status === 'archived' || userRole.toLowerCase() !== 'superadmin') ? 0.5 : 1, cursor: (settingsBrand.status === 'archived' || userRole.toLowerCase() !== 'superadmin') ? 'not-allowed' : 'pointer' }"
                            @click="archiveStore">
                            📦 {{ settingsBrand.status === 'archived' ? 'Archived' : 'Archive Store' }}
                        </button>
                    </div>

                    <div v-if="userRole.toLowerCase() === 'superadmin'" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
                        <div>
                            <strong style="color: #ef4444; font-size: 0.9rem;">Delete Storefront</strong>
                            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                                Permanently delete this brand storefront, catalog configuration, and domain bindings. This action cannot be undone. <span v-if="userRole.toLowerCase() !== 'superadmin'" style="color: #ef4444; font-weight: 600;">(Superadmin only)</span>
                            </div>
                        </div>
                        <button type="button" class="btn" 
                            :disabled="userRole.toLowerCase() !== 'superadmin'"
                            :style="{ background: '#ef4444', borderColor: '#ef4444', color: '#fff', margin: 0, height: '32px', fontSize: '0.8rem', opacity: userRole.toLowerCase() !== 'superadmin' ? 0.5 : 1, cursor: userRole.toLowerCase() !== 'superadmin' ? 'not-allowed' : 'pointer' }"
                            @click="deleteStore">
                            🗑️ Delete Store
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Profile & Preferences Panel (Always Visible) -->
        <div class="panel">
            <div class="panel-header">
                <h3 class="panel-title">Operator Profile & Preferences</h3>
            </div>
            <form @submit.prevent style="margin-top: 15px;">
                <div class="form-grid">
                    <div class="form-group">
                        <label>First Name</label>
                        <input type="text" v-model="operatorFirstName" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" v-model="operatorLastName" required>
                    </div>
                    <div class="form-group">
                        <label>Portal Interface Theme</label>
                        <select v-model="appTheme" @change="applyTheme(appTheme)">
                            <option value="system">System Default Theme</option>
                            <option value="light">Light Mode Theme</option>
                            <option value="dark">Dark Mode Theme</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Profile Avatar Image</label>
                        <div style="display: flex; align-items: center; gap: 12px; margin-top: 6px;">
                            <div style="width: 44px; height: 44px; border-radius: 50%; overflow: hidden; background: var(--border); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border);">
                                <img v-if="operatorAvatarSrc" :src="operatorAvatarSrc" style="width: 100%; height: 100%; object-fit: cover;" />
                                <div v-else style="font-weight: 800; font-size: 0.95rem; color: var(--text-muted); text-transform: uppercase; user-select: none;">{{ operatorInitials }}</div>
                            </div>
                            <input type="file" ref="avatarInput" @change="onAvatarFileChange" style="display: none;" accept="image/*">
                            <button type="button" class="btn" @click="$refs.avatarInput.click()" style="padding: 6px 12px; font-size: 0.78rem;">Upload Photo</button>
                            <button type="button" class="btn" v-if="operatorAvatarSrc" @click="removeAvatar" style="padding: 6px 12px; font-size: 0.78rem; background: var(--border); color: var(--text-main); border-color: var(--border);">Remove</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Current Password</label>
                        <input type="password" placeholder="••••••••">
                    </div>
                    <div class="form-group">
                        <label>New Password</label>
                        <input type="password" placeholder="Min 8 characters">
                    </div>
                </div>
                <div class="panel-footer">
                    <button type="button" class="btn btn-accent" style="margin: 0;" @click="saveProfile">Update Profile Details</button>
                </div>
            </form>
        </div>

        <div class="panel" id="no-shop-selected-settings" v-if="activeShopFilter === 'all'"
            style="text-align: center; color: var(--text-muted); padding: 40px 20px;">
            <p>⚠️ Select a specific Shop Context in the top bar to configure individual integrations and
                Shopify parameters.</p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'SettingsView',
    inject: ['app'],
    data() {
        return {
            availableLanguages: [
                { code: 'en', name: 'English', flag: '🇬🇧' },
                { code: 'de', name: 'German', flag: '🇩🇪' },
                { code: 'fr', name: 'French', flag: '🇫🇷' },
                { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
                { code: 'es', name: 'Spanish', flag: '🇪🇸' },
                { code: 'it', name: 'Italian', flag: '🇮🇹' }
            ],
            dnsVerified: false,
            dnsVerifying: false,
            dnsVerifyError: '',
            dnsMissing: false,
            dnsCreating: false,
            isScraping: false
        }
    },
    watch: {
        activeShopFilter() {
            this.dnsVerified = false;
            this.dnsVerifying = false;
            this.dnsVerifyError = '';
            this.dnsMissing = false;
            this.dnsCreating = false;
        }
    },
    computed: {
        userRole() { return this.app.userRole; },
        activeShopFilter() { return this.app.activeShopFilter; },
        currentSelectedBrandName() { return this.app.currentSelectedBrandName; },
        settingsBrand() { return this.app.settingsBrand; },
        baseDomainOption: {
            get() {
                return this.settingsBrand.custom_domain ? 'custom' : 'subdomain';
            },
            set(val) {
                if (val === 'custom') {
                    this.settingsBrand.custom_domain = this.settingsBrand.custom_domain || 'my-custom-domain.com';
                } else {
                    this.settingsBrand.custom_domain = '';
                }
            }
        },
        operatorFirstName: {
            get() { return this.app.operatorFirstName; },
            set(val) { this.app.operatorFirstName = val; }
        },
        operatorLastName: {
            get() { return this.app.operatorLastName; },
            set(val) { this.app.operatorLastName = val; }
        },
        operatorInitials() { return this.app.operatorInitials; },
        operatorAvatarSrc() { return this.app.operatorAvatarSrc; },
        appTheme: {
            get() { return this.app.appTheme; },
            set(val) { this.app.appTheme = val; }
        },
        subdomainSlug: {
            get() {
                const sub = this.settingsBrand.subdomain || '';
                return sub.split('.')[0] || '';
            },
            set(val) {
                const slug = val.trim().toLowerCase();
                this.settingsBrand.subdomain = slug ? `${slug}.${this.app.baseBrandDomain}` : '';
            }
        }
    },
    methods: {
        showNotification(msg) { return this.app.showNotification(msg); },
        saveProfile() {
            localStorage.setItem('sc_operator_first_name', this.operatorFirstName);
            localStorage.setItem('sc_operator_last_name', this.operatorLastName);
            if (this.operatorAvatarSrc) {
                localStorage.setItem('sc_operator_avatar', this.operatorAvatarSrc);
            } else {
                localStorage.removeItem('sc_operator_avatar');
            }
            this.showNotification('Profile and preferences updated successfully.');
        },
        updateBrandSettings() { return this.app.updateBrandSettings(); },
        async verifyDns() {
            if (!this.settingsBrand.subdomain) {
                this.dnsVerifyError = 'Target Host Subdomain is required for DNS validation.';
                return;
            }
            this.dnsVerifying = true;
            this.dnsVerifyError = '';
            this.dnsVerified = false;
            this.dnsMissing = false;
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/verify-dns?subdomain=${encodeURIComponent(this.settingsBrand.subdomain)}`, {
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
            if (!this.settingsBrand.subdomain) return;
            this.dnsCreating = true;
            this.dnsVerifyError = '';
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/create-dns`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify({ subdomain: this.settingsBrand.subdomain })
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
        toggleStorePause() {
            const newStatus = this.settingsBrand.status === 'paused' ? 'active' : 'paused';
            this.app.updateBrandStatus(this.settingsBrand.id, newStatus);
        },
        archiveStore() {
            if (confirm(`Are you sure you want to archive the storefront "${this.settingsBrand.name}"? This will disable public routing.`)) {
                this.app.updateBrandStatus(this.settingsBrand.id, 'archived');
            }
        },
        deleteStore() {
            this.app.deOnboardBrand(this.settingsBrand.id);
        },
        onAvatarFileChange(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.app.operatorAvatarSrc = event.target.result;
                    this.showNotification('Avatar photo uploaded successfully.');
                };
                reader.readAsDataURL(file);
            }
        },
        removeAvatar() {
            this.app.operatorAvatarSrc = null;
            this.showNotification('Avatar photo removed.');
        },
        applyTheme(theme) {
            this.app.applyTheme(theme);
        },
        async fetchBrandStylesFromShopify() {
            let shopUrl = this.settingsBrand.shopify_shop_name || '';
            if (!shopUrl) {
                this.showNotification('Please enter a valid Shopify Store URL first.');
                return;
            }
            if (!shopUrl.startsWith('http') && !shopUrl.includes('.')) {
                shopUrl = `${shopUrl}.myshopify.com`;
            }
            
            this.isScraping = true;
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/scrape-branding?url=${encodeURIComponent(shopUrl)}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                });
                const res = await response.json();
                if (!response.ok) {
                    throw new Error(res.error || 'Scraping request failed');
                }
                
                if (res.success && res.data) {
                    const data = res.data;
                    // Autofill the fields in SettingsBrand:
                    if (data.primary_color) this.settingsBrand.primary_color = data.primary_color;
                    if (data.secondary_color) this.settingsBrand.secondary_color = data.secondary_color;
                    if (data.bg_color) this.settingsBrand.bg_color = data.bg_color;
                    if (data.text_color) this.settingsBrand.text_color = data.text_color;
                    if (data.button_radius) this.settingsBrand.button_radius = data.button_radius;
                    if (data.button_text_color) this.settingsBrand.button_text_color = data.button_text_color;
                    if (data.header_bg_color) this.settingsBrand.header_bg_color = data.header_bg_color;
                    if (data.font_family) this.settingsBrand.font_family = data.font_family;
                    if (data.logo) this.settingsBrand.logo = data.logo;
                    if (data.favicon) this.settingsBrand.favicon = data.favicon;
                    
                    this.showNotification('🎉 Successfully fetched and applied style settings for this brand!');
                } else {
                    this.showNotification('Could not extract active styles. Please enter values manually.');
                }
            } catch (err) {
                this.showNotification(`Error fetching styles: ${err.message}`);
            } finally {
                this.isScraping = false;
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
        getStripeLogoSvg(size = 16) {
            return `<svg viewBox="0 0 60 25" width="36" height="15" fill="#635BFF" style="vertical-align: middle; display: inline-block; margin-left: 2px;"><path d="M59.64 14.28c0-2.6-1.6-3.9-4.2-3.9-1.4 0-2.5.3-3 .6v-1.6c0-1.3-.9-2.1-2.5-2.1-1.4 0-2.6.4-3.4.8l-1-2.3c1.2-.7 3-1.1 4.9-1.1 3.5 0 5.6 1.8 5.6 5.1v7.6c-1 .4-2.4.7-3.8.7-3.6.1-7.1-1.3-7.1-3.9 0-.8.6-1.3 1.6-1.3 1 0 1.8-.2 2.2-.5v-2.3c-.5-.2-1.3-.4-2-.4-1.1 0-1.8.6-1.8 1.9 0 .8.6 1.3 1.6 1.3 1 0 1.8-.2 2.2-.5v-2.3c-.5-.2-1.3-.4-2-.4-1.1 0-1.8.6-1.8 1.9 0 2.2 1.5 3.5 3.9 3.5 1 .4 2.4.7 3.8.7 3.5-.1 5.3-1.8 5.3-5.1zm-13.6-6.7h-3.4v6c0 .7.4 1 1 1h2.4v2.5h-2.9c-2.4 0-3.9-1.2-3.9-3.5v-6h-1.8v-2.7h1.8v-3l3.4-1v4h3.4zm-9.1 2.3c.3-.1.7-.1 1.1-.1v3.2c-.4 0-.8 0-1.1.1v6.7h-3.5v-10h3.5zm-5.7-3.5c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8-.8 1.8-1.8 1.8-1.8-.8-1.8-1.8zm-1.8 6.2h3.5v10.1h-3.5zm-9.3-6.2c1 .4 2.2.7 3.4.7 2.9 0 4.9-1.5 4.9-4.6s-2-4.6-4.9-4.6c-1.2 0-2.4.3-3.4.7zm1.1 6.3h-1.1v-12.7c.7-.3 1.8-.5 2.8-.5 2.9 0 4.3 1.4 4.3 3.9s-1.4 3.9-4.3 3.9c-.6 0-1.2-.1-1.7-.3zm-10.4 6.7c0-2.4-1.5-3.7-3.9-3.7-1.1 0-2.2.3-2.9.6V15c.6-.3 1.5-.5 2.4-.5 1.4 0 2 .5 2 1.3 0 .8-.8 1.1-2.2 1.5-2.2.6-3.9 1.4-3.9 3.9 0 2.4 1.8 3.7 4.1 3.7 1.3 0 2.5-.3 3.2-.8v.6h3.3v-9.5z"/></svg>`;
        }
    }
}
</script>

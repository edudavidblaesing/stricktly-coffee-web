<template>
    <div id="view-settings" class="admin-view" :class="{ active: app.activeView === 'settings' }">
        <!-- Global configs -->
        <div class="panel" v-if="userRole.toLowerCase() === 'superadmin' && !isValidBrandSelected">
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

        <!-- AI Tier Feature Authorization Matrix (superadmin only, global context) -->
        <div class="panel" v-if="userRole.toLowerCase() === 'superadmin' && !isValidBrandSelected" style="margin-top: 20px;">
            <div class="panel-header">
                <h3 class="panel-title">🛡️ AI Tier Feature Authorization Matrix</h3>
            </div>
            <div style="padding: 15px;">
                <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 15px; line-height: 1.45;">
                    Configure which AI capabilities are authorized for each subscription tier. Standard merchants will have locked indicators on tools disabled for their active tier.
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.82rem;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); font-weight: 700;">
                                <th style="padding: 12px 10px; width: 40%;">AI Capability Feature</th>
                                <th style="padding: 12px 10px; text-align: center; width: 20%;">Standard</th>
                                <th style="padding: 12px 10px; text-align: center; width: 20%;">Professional</th>
                                <th style="padding: 12px 10px; text-align: center; width: 20%;">Enterprise</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid var(--border); color: var(--text-main);">
                                <td style="padding: 12px 10px;">
                                    <strong style="display: block;">Strategy Manuscript Crawler</strong>
                                    <span style="font-size: 0.72rem; color: var(--text-muted);">Scrapes site, builds playbooks & manuscripts</span>
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.standard.allow_manuscript" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.professional.allow_manuscript" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.enterprise.allow_manuscript" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border); color: var(--text-main);">
                                <td style="padding: 12px 10px;">
                                    <strong style="display: block;">AI Copywriter Studio</strong>
                                    <span style="font-size: 0.72rem; color: var(--text-muted);">Generates high-converting variant copy</span>
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.standard.allow_copywriter" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.professional.allow_copywriter" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.enterprise.allow_copywriter" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border); color: var(--text-main);">
                                <td style="padding: 12px 10px;">
                                    <strong style="display: block;">Multilingual AI Translator</strong>
                                    <span style="font-size: 0.72rem; color: var(--text-muted);">Translates storefront & campaigns instantly</span>
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.standard.allow_translator" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.professional.allow_translator" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.enterprise.allow_translator" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border); color: var(--text-main);">
                                <td style="padding: 12px 10px;">
                                    <strong style="display: block;">AI Catalog SEO Pitcher</strong>
                                    <span style="font-size: 0.72rem; color: var(--text-muted);">Auto-writes conversion-tuned descriptions</span>
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.standard.allow_seo" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.professional.allow_seo" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.enterprise.allow_seo" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border); color: var(--text-main);">
                                <td style="padding: 12px 10px;">
                                    <strong style="display: block;">AI Look-Alike Storefront Designer</strong>
                                    <span style="font-size: 0.72rem; color: var(--text-muted);">Matches visual theme/color presets to manuscript</span>
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.standard.allow_designer" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.professional.allow_designer" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.enterprise.allow_designer" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border); color: var(--text-main);">
                                <td style="padding: 12px 10px;">
                                    <strong style="display: block;">AI Campaign Landing Page Builder</strong>
                                    <span style="font-size: 0.72rem; color: var(--text-muted);">Generates page structures & full marketing copies</span>
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.standard.allow_page_builder" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.professional.allow_page_builder" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.enterprise.allow_page_builder" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border); color: var(--text-main);">
                                <td style="padding: 12px 10px;">
                                    <strong style="display: block;">Dynamic Funnel Swapping & Optimization</strong>
                                    <span style="font-size: 0.72rem; color: var(--text-muted);">Swaps headlines & images in real-time based on dropoffs</span>
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.standard.allow_dynamic_optimization" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.professional.allow_dynamic_optimization" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                                <td style="text-align: center; padding: 12px 10px;">
                                    <input type="checkbox" v-model="localFeatures.enterprise.allow_dynamic_optimization" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; cursor: pointer;" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="panel-footer">
                <button v-if="userRole.toLowerCase() === 'superadmin'" 
                        type="button" 
                        class="btn btn-accent" 
                        style="margin: 0;" 
                        :disabled="savingTierFeatures" 
                        @click="saveTierFeatures">
                    {{ savingTierFeatures ? 'Saving Matrix...' : 'Save Feature Matrix' }}
                </button>
            </div>
        </div>

        <!-- Contextual settings for currently filtered shop (General Tab) -->
        <div class="panel" id="shop-settings-panel" v-if="isValidBrandSelected && activeTab === 'general'">
            <div class="panel-header">
                <h3 class="panel-title">General Shop Settings for <span>{{ currentSelectedBrandName }}</span></h3>
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

                    <div class="form-group">
                        <label>AI Operation Tier (Limits & Capabilities)</label>
                        <select :value="settingsBrand.ai_tier" @change="onAiTierChange($event.target.value)" style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; padding: 8px 12px; height: 38px; margin: 0;">
                            <option value="none">No AI / Basic Tier (No AI Access)</option>
                            <option value="standard">Standard Tier (Gemini 2.5 Flash)</option>
                            <option value="professional">Professional Tier (Gemini 3.1 Pro)</option>
                            <option value="enterprise">Enterprise Tier (Deep Research Pro Preview)</option>
                        </select>
                        <div v-if="userRole.toLowerCase() === 'superadmin' || settingsBrand.ai_free_tier" style="display: flex; align-items: center; margin-top: 8px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; margin: 0;">
                                <input type="checkbox" v-model="settingsBrand.ai_free_tier" :disabled="userRole.toLowerCase() !== 'superadmin'" style="width: 16px; height: 16px; margin: 0; cursor: pointer;">
                                <span style="font-weight: 700; color: var(--text-main); font-size: 0.85rem;">🎁 Grant Free AI Access (Superadmin Toggle)</span>
                            </label>
                        </div>
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
                                   pattern="^[a-z0-9\-]+$"
                                   placeholder="brand-slug"
                                   style="flex: 1; margin: 0; background: var(--workspace-bg); height: 38px;">
                            <input v-else
                                   type="text"
                                   v-model="settingsBrand.custom_domain"
                                   :readonly="userRole.toLowerCase() === 'merchant'"
                                   required
                                   pattern="^(?!:\/\/)([a-zA-Z0-9\-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9\-_]+\.[a-zA-Z]{2,11}$"
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

                    <!-- Business Segment & Niche Learning Engine Configurations -->
                    <div style="grid-column: 1 / -1; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; background: rgba(139, 92, 246, 0.03); border: 1px solid rgba(139, 92, 246, 0.15); padding: 18px; border-radius: 8px; margin: 10px 0;">
                        <h4 style="grid-column: 1 / -1; margin: 0 0 4px 0; font-size: 0.95rem; color: #a78bfa; display: flex; align-items: center; gap: 6px; font-family: Outfit, sans-serif; font-weight: 700;">
                            <span>🧠 AI Learning Engine Settings</span>
                        </h4>
                        <p style="grid-column: 1 / -1; margin: 0 0 10px 0; font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">
                            Configure your brand vertical and niche. This allows the copywriter studio and optimization agents to pull successful anonymized campaign copy frameworks from the platform vertical learning pool.
                        </p>
                        
                        <div class="form-group" style="margin: 0;">
                            <label style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--text-main);">Industry Vertical</label>
                            <select v-model="settingsBrand.business_segment" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; padding: 0 12px; margin: 0; cursor: pointer;">
                                <option value="Food & Beverage">Food & Beverage</option>
                                <option value="Apparel & Fashion">Apparel & Fashion</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Health & Beauty">Health & Beauty</option>
                                <option value="Home & Living">Home & Living</option>
                                <option value="Fitness & Sports">Fitness & Sports</option>
                                <option value="Software & Tech">Software & Tech</option>
                            </select>
                        </div>

                        <div class="form-group" style="margin: 0;">
                            <label style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--text-main);">Specific Niche / Tags</label>
                            <input type="text" v-model="settingsBrand.business_niche" placeholder="e.g. Specialty Coffee, organic cosmetics" style="width: 100%; height: 38px; margin: 0; background: var(--workspace-bg);">
                        </div>

                        <div class="form-group form-full">
                            <label style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--text-main);">Meta Pixel ID</label>
                            <input type="text" v-model="settingsBrand.meta_pixel_id" placeholder="e.g. 15-digit ID or mock_pixel_brand_id" style="width: 100%; height: 38px; margin: 0; background: var(--workspace-bg);">
                            <span style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; display: block;">
                                Used to load Meta Pixel tracking scripts dynamically on your storefront for PageView, AddToCart, InitiateCheckout, and Purchase events.
                            </span>
                        </div>

                        <div class="form-group form-full">
                            <label style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--text-main);">Google Analytics 4 Measurement ID</label>
                            <input type="text" v-model="settingsBrand.google_analytics_id" placeholder="e.g. G-XXXXXXXXXX or mock_ga4_brand_id" style="width: 100%; height: 38px; margin: 0; background: var(--workspace-bg);">
                            <span style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; display: block;">
                                Used to load dynamic gtag.js tracking scripts on your storefront for view_item, add_to_cart, begin_checkout, and purchase events.
                            </span>
                        </div>

                        <div class="form-group form-full" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 6px; padding: 12px; margin-top: 10px;">
                            <label style="display: block; font-weight: 700; margin-bottom: 4px; color: var(--text-main); font-size: 0.85rem;">Google Shopping Product Feed</label>
                            <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 8px;">
                                Submit this URL to your Google Merchant Center to automatically list and sync your products on Google Shopping.
                            </span>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" readonly :value="'https://' + (settingsBrand.custom_domain || settingsBrand.subdomain || (settingsBrand.id + '.stricktlycoffee.be')) + '/api/google-feed.xml'" style="flex: 1; height: 34px; margin: 0; font-family: monospace; font-size: 0.75rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 0 8px; color: var(--primary);">
                                <button type="button" @click="copyFeedUrl" class="btn btn-sm" style="height: 34px; border: 1px solid var(--primary); color: var(--primary); background: transparent; padding: 0 12px; cursor: pointer; border-radius: 4px; font-weight: 600; font-size: 0.75rem;">Copy</button>
                            </div>
                        </div>

                        <div class="form-group form-full" style="margin-top: 10px; display: flex; align-items: center; gap: 8px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
                            <input type="checkbox" id="share_perf_cb" v-model="settingsBrand.share_performance_data" style="cursor: pointer; width: 16px; height: 16px; margin: 0;">
                            <label for="share_perf_cb" style="margin: 0; font-size: 0.82rem; color: var(--text-main); cursor: pointer; font-weight: 600; user-select: none;">
                                Share anonymized campaign performance data to improve AI recommendations globally
                            </label>
                        </div>
                    </div>

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
                    <button type="submit" class="btn btn-accent" style="margin: 0;">Update General Settings</button>
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

        <!-- Contextual settings for currently filtered shop (E-commerce Tab) -->
        <div class="panel" id="shop-ecommerce-panel" v-if="isValidBrandSelected && activeTab === 'ecommerce'">
            <div class="panel-header">
                <h3 class="panel-title">E-commerce Settings for <span>{{ currentSelectedBrandName }}</span></h3>
            </div>
            <form @submit.prevent="updateBrandSettings" style="margin-top: 15px;">
                <div class="form-grid">
                    <!-- Payout & Billing config (Superadmin Only settings) -->
                    <template v-if="userRole.toLowerCase() === 'superadmin'">
                        <div class="form-group">
                            <label>Merchant Billing Model <span class="info-tooltip-trigger" data-tooltip="Determines checkout routing: standard direct gateway, connect split billing, or free ledger model.">i</span></label>
                            <select v-model="settingsBrand.billing_type" style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; padding: 8px 12px; height: 38px; margin: 0;">
                                <option value="" disabled>Please select a billing model...</option>
                                <option value="standard">Standard (Direct Stripe gateway)</option>
                                <option value="external_split">External Split Billing (Platform Checkout split)</option>
                                <option value="free">Free Model (0% Platform Take Rate / Ledger-based)</option>
                            </select>
                        </div>
                        <div class="form-group" v-if="settingsBrand.billing_type === 'external_split'">
                            <label>Platform Take Rate (%) <span class="info-tooltip-trigger" data-tooltip="Platform commission percentage retained on checkouts.">i</span></label>
                            <input type="number" min="0" max="100" step="0.1" :value="settingsBrand.platform_take_rate * 100" @input="settingsBrand.platform_take_rate = parseFloat($event.target.value) / 100" style="margin: 0;" placeholder="15">
                        </div>
                        <div class="form-group" v-if="settingsBrand.stripe_connect_account_id">
                            <label>Stripe Connect Account ID <span class="info-tooltip-trigger" data-tooltip="The merchant Connected Account ID to route split funds programmatically.">i</span></label>
                            <input type="text" v-model="settingsBrand.stripe_connect_account_id" style="margin: 0;" placeholder="acct_1x2y3z...">
                        </div>
                    </template>

                    <!-- eCommerce Platform Type Card Picker -->
                    <div class="form-group form-full" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px; margin-bottom: 20px;">
                        <label style="margin-bottom: 8px; display: block; font-weight: bold; color: var(--text-main);">Platform Type</label>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 15px;">
                            <div @click="settingsBrand.platform = 'shopify'"
                                 :style="{
                                     border: '1px solid ' + (settingsBrand.platform === 'shopify' ? 'var(--accent)' : 'var(--border)'),
                                     background: settingsBrand.platform === 'shopify' ? 'rgba(197, 160, 89, 0.06)' : 'rgba(255,255,255,0.01)',
                                     cursor: 'pointer'
                                 }"
                                 style="border-radius: 10px; padding: 16px 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; transition: all 0.2s ease;">
                                <span v-html="getPlatformLogoSvg('shopify', 32)"></span>
                                <span style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); margin-top: 2px;">Shopify</span>
                            </div>
                            <div @click="settingsBrand.platform = 'woocommerce'"
                                 :style="{
                                     border: '1px solid ' + (settingsBrand.platform === 'woocommerce' ? 'var(--accent)' : 'var(--border)'),
                                     background: settingsBrand.platform === 'woocommerce' ? 'rgba(197, 160, 89, 0.06)' : 'rgba(255,255,255,0.01)',
                                     cursor: 'pointer'
                                 }"
                                 style="border-radius: 10px; padding: 16px 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; transition: all 0.2s ease;">
                                <span v-html="getPlatformLogoSvg('woocommerce', 32)"></span>
                                <span style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); margin-top: 2px;">WooCommerce</span>
                            </div>
                            <div @click="settingsBrand.platform = 'custom'"
                                 :style="{
                                     border: '1px solid ' + (settingsBrand.platform === 'custom' ? 'var(--accent)' : 'var(--border)'),
                                     background: settingsBrand.platform === 'custom' ? 'rgba(197, 160, 89, 0.06)' : 'rgba(255,255,255,0.01)',
                                     cursor: 'pointer'
                                 }"
                                 style="border-radius: 10px; padding: 16px 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; transition: all 0.2s ease;">
                                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; line-height: 1;">⚙️</div>
                                <span style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); margin-top: 2px;">Preview/Custom Mode</span>
                            </div>
                        </div>

                        <!-- Shopify Connection Card -->
                        <div v-if="settingsBrand.platform === 'shopify'" style="background: rgba(149, 191, 71, 0.04); border: 1px solid rgba(149, 191, 71, 0.15); border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap: 12px; width: 100%; box-sizing: border-box; text-align: left;">
                            <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--text-main); font-size: 0.88rem;">
                                <span v-html="getPlatformLogoSvg('shopify', 20)"></span>
                                <span>Shopify Storefront Integration</span>
                            </div>
                            <div style="display: flex; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 3px; gap: 4px;">
                                <button type="button" :style="{ flex: 1, border: 'none', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', background: shopifyConnectionMode === 'oauth' ? '#95BF47' : 'transparent', color: shopifyConnectionMode === 'oauth' ? '#000000' : 'var(--text-muted)' }" @click="shopifyConnectionMode = 'oauth'">
                                     ⚡ Single-Click Connect (OAuth)
                                </button>
                                <button type="button" :style="{ flex: 1, border: 'none', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', background: shopifyConnectionMode === 'manual' ? '#95BF47' : 'transparent', color: shopifyConnectionMode === 'manual' ? '#000000' : 'var(--text-muted)' }" @click="shopifyConnectionMode = 'manual'">
                                     ⚙️ Manual API Keys Setup
                                </button>
                            </div>
                            <div class="form-group form-full" style="margin: 0;">
                                <label style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; display: block; margin-bottom: 4px;">Shopify Shop Address (URL)</label>
                                <div style="display: flex; gap: 8px; width: 100%;">
                                    <input type="text" v-model="settingsBrand.shopify_shop_name" placeholder="pesado585.myshopify.com" style="flex: 1; height: 38px; margin: 0;">
                                    <button type="button" class="btn btn-primary" style="margin: 0; padding: 0 16px; white-space: nowrap; height: 38px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; border-radius: 6px;" :disabled="isScraping" @click="fetchBrandStylesFromShopify">
                                        <span v-if="isScraping">Scraping...</span>
                                        <span v-else>🔄 Fetch Styles</span>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group form-full" style="margin: 0;" v-if="shopifyConnectionMode === 'manual'">
                                <label style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; display: block; margin-bottom: 4px;">Shopify Admin API Access Token</label>
                                <input type="password" v-model="settingsBrand.shopify_access_token" placeholder="shpat_..." style="width: 100%; height: 38px; margin: 0;">
                            </div>
                            <div v-if="shopifyConnectionMode === 'oauth'" style="margin-top: 5px;">
                                <button type="button" class="btn" style="margin: 0; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; height: 38px; width: 100%; background: #95BF47; color: #000000; border: 1px solid #95BF47;" @click="connectShopifyOAuth" :disabled="!settingsBrand.shopify_shop_name">
                                    <span v-html="getPlatformLogoSvg('shopify', 18)"></span>
                                    <span>Link Shopify Account</span>
                                </button>
                            </div>
                        </div>

                        <!-- WooCommerce Connection Card -->
                        <div v-if="settingsBrand.platform === 'woocommerce'" style="background: rgba(127, 84, 179, 0.04); border: 1px solid rgba(127, 84, 179, 0.15); border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap: 12px; width: 100%; box-sizing: border-box; text-align: left;">
                            <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--text-main); font-size: 0.88rem;">
                                <span v-html="getPlatformLogoSvg('woocommerce', 20)"></span>
                                <span>WooCommerce Storefront Integration</span>
                            </div>
                            <div style="display: flex; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 3px; gap: 4px;">
                                <button type="button" :style="{ flex: 1, border: 'none', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', background: woocommerceConnectionMode === 'oauth' ? '#7F54B3' : 'transparent', color: woocommerceConnectionMode === 'oauth' ? '#ffffff' : 'var(--text-muted)' }" @click="woocommerceConnectionMode = 'oauth'">
                                     ⚡ Single-Click Connect (OAuth)
                                </button>
                                <button type="button" :style="{ flex: 1, border: 'none', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', background: woocommerceConnectionMode === 'manual' ? '#7F54B3' : 'transparent', color: woocommerceConnectionMode === 'manual' ? '#ffffff' : 'var(--text-muted)' }" @click="woocommerceConnectionMode = 'manual'">
                                     ⚙️ Manual API Keys Setup
                                </button>
                            </div>
                            <div class="form-group form-full" style="margin: 0;">
                                <label style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; display: block; margin-bottom: 4px;">WooCommerce Shop Address (URL)</label>
                                <input type="text" v-model="settingsBrand.woocommerce_shop_url" placeholder="example.com" style="width: 100%; height: 38px; margin: 0;">
                            </div>
                            <template v-if="woocommerceConnectionMode === 'manual'">
                                <div class="form-group form-full" style="margin: 0;">
                                    <label style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; display: block; margin-bottom: 4px;">WooCommerce Consumer Key</label>
                                    <input type="text" v-model="settingsBrand.woocommerce_consumer_key" placeholder="ck_..." style="width: 100%; height: 38px; margin: 0;">
                                </div>
                                <div class="form-group form-full" style="margin: 0;">
                                    <label style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; display: block; margin-bottom: 4px;">WooCommerce Consumer Secret</label>
                                    <input type="password" v-model="settingsBrand.woocommerce_consumer_secret" placeholder="cs_..." style="width: 100%; height: 38px; margin: 0;">
                                </div>
                            </template>
                            <div v-if="woocommerceConnectionMode === 'oauth'" style="margin-top: 5px;">
                                <button type="button" class="btn" style="margin: 0; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; height: 38px; width: 100%; background: #7F54B3; color: #ffffff; border: 1px solid #7F54B3;" @click="connectWooCommerceOAuth" :disabled="!settingsBrand.woocommerce_shop_url">
                                    <span v-html="getPlatformLogoSvg('woocommerce', 18)"></span>
                                    <span>Link WooCommerce Account</span>
                                </button>
                            </div>
                        </div>

                        <!-- Preview Mode Info Panel -->
                        <div v-if="settingsBrand.platform === 'custom'" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 14px; font-size: 0.8rem; line-height: 1.4; color: var(--text-muted);">
                            💡 Custom/Preview mode enables editing visual designs and layouts directly in Antigravity storefront designer, without syncing catalog updates to an external platform.
                        </div>
                    </div>

                    <!-- Subscription Billing Method visual cards -->
                    <div class="form-group form-full" style="margin-top: 10px;">
                        <label style="margin-bottom: 12px; display: block; font-weight: bold; color: var(--text-main);">Subscription Billing Method</label>
                        
                        <!-- Cards block for Superadmin -->
                        <div v-if="userRole.toLowerCase() === 'superadmin'" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 15px;">
                            <!-- Credit Card -->
                            <div @click="settingsBrand.subscription_billing_method = 'stripe_card'"
                                 :style="{
                                     border: settingsBrand.subscription_billing_method === 'stripe_card' ? '2px solid var(--accent)' : '1px solid var(--border)',
                                     background: settingsBrand.subscription_billing_method === 'stripe_card' ? 'rgba(197, 160, 89, 0.05)' : 'rgba(255,255,255,0.01)'
                                 }"
                                 style="padding: 16px; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 8px; transition: all 0.2s ease;">
                                 <div style="font-weight: 800; color: var(--text-main); font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                                     <span>💳 Credit Card</span>
                                 </div>
                                 <div style="font-size: 0.74rem; color: var(--text-muted); line-height: 1.4;">
                                     Fixed recurring billing processed via Stripe. Provide a card to securely authorize automatic monthly payments.
                                 </div>
                             </div>

                             <!-- Stripe Connect -->
                             <div @click="settingsBrand.subscription_billing_method = 'stripe_connect'"
                                  :style="{
                                      border: settingsBrand.subscription_billing_method === 'stripe_connect' ? '2px solid var(--accent)' : '1px solid var(--border)',
                                      background: settingsBrand.subscription_billing_method === 'stripe_connect' ? 'rgba(197, 160, 89, 0.05)' : 'rgba(255,255,255,0.01)'
                                  }"
                                  style="padding: 16px; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 8px; transition: all 0.2s ease;">
                                 <div style="font-weight: 800; color: var(--text-main); font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                                     <span>🔗 Stripe Connect</span>
                                 </div>
                                 <div style="font-size: 0.74rem; color: var(--text-muted); line-height: 1.4;">
                                     Split billing directly from storefront transaction proceeds. Link your Stripe account to authorize real-time payout splits.
                                 </div>
                             </div>

                             <!-- Ledger Payout Deduction -->
                             <div @click="settingsBrand.subscription_billing_method = 'ledger'"
                                  :style="{
                                      border: settingsBrand.subscription_billing_method === 'ledger' ? '2px solid var(--accent)' : '1px solid var(--border)',
                                      background: settingsBrand.subscription_billing_method === 'ledger' ? 'rgba(197, 160, 89, 0.05)' : 'rgba(255,255,255,0.01)'
                                  }"
                                  style="padding: 16px; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 8px; transition: all 0.2s ease;">
                                 <div style="font-weight: 800; color: var(--text-main); font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                                     <span>💡 Payout Ledger</span>
                                 </div>
                                 <div style="font-size: 0.74rem; color: var(--text-muted); line-height: 1.4;">
                                     Subscriptions are automatically deducted from the accumulated dropshipping payout ledger. No card required upfront.
                                 </div>
                             </div>
                        </div>

                        <!-- Read-only description panel for Merchants -->
                        <div v-else style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 15px; font-size: 0.8rem; line-height: 1.45; color: var(--text-muted);">
                            <span v-if="settingsBrand.subscription_billing_method === 'stripe_connect'" style="color: var(--accent); font-weight: 700; display: block; margin-bottom: 4px;">
                                💡 Payout Split Billing (Stripe Connect)
                            </span>
                            <span v-else-if="settingsBrand.subscription_billing_method === 'ledger'" style="color: var(--accent); font-weight: 700; display: block; margin-bottom: 4px;">
                                💡 Payout Ledger Deduction
                            </span>
                            <span v-else style="color: var(--accent); font-weight: 700; display: block; margin-bottom: 4px;">
                                💳 Credit Card Billing
                            </span>
                            
                            <span v-if="settingsBrand.subscription_billing_method === 'stripe_connect'">
                                Split billing from storefront proceeds is active for your brand. Please link your Stripe account below to authorize transaction splits.
                            </span>
                            <span v-else-if="settingsBrand.subscription_billing_method === 'ledger'">
                                Subscriptions are automatically deducted from your dropshipping payout ledger. No credit card required.
                            </span>
                            <span v-else>
                                Fixed recurring billing is active. Automatic subscription payments are securely processed via your linked credit card.
                            </span>
                        </div>

                    <!-- Status & Stripe Setup Actions -->
                    <div v-if="settingsBrand.subscription_billing_method === 'stripe_card'" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                            <span style="font-size: 0.8rem; color: var(--text-muted);">
                                Card Linking Status: 
                                <strong :style="{ color: cardLinked ? 'var(--success)' : '#ef4444' }">
                                    {{ cardLinked ? '✅ Linked' : '❌ Not Linked' }}
                                </strong>
                            </span>
                            <button type="button" @click="initiateStripeCardSetup" :disabled="loadingCardSetup" class="btn" style="background: var(--accent); color: #fff; font-size: 0.78rem; padding: 6px 14px; margin: 0; font-weight: 700; height: 32px; display: flex; align-items: center; justify-content: center;">
                                💳 {{ cardLinked ? 'Update Card via Stripe' : 'Link Credit Card via Stripe' }}
                            </button>
                             </div>
                         </div>

                         <div v-if="settingsBrand.subscription_billing_method === 'stripe_connect'" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px;">
                             <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                                 <span style="font-size: 0.8rem; color: var(--text-muted);">
                                     Stripe Connect Status: 
                                     <strong :style="{ color: stripeConnectStatus === 'active' ? 'var(--success)' : '#ef4444' }">
                                         {{ stripeConnectStatus === 'active' ? '✅ Active' : '❌ Incomplete / Unlinked' }}
                                     </strong>
                                 </span>
                                 <button type="button" @click="initiateStripeConnect" :disabled="loadingStripeConnect" class="btn" style="background: #635bff; color: #fff; font-size: 0.78rem; padding: 6px 14px; margin: 0; font-weight: 700; height: 32px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                     🔗 {{ stripeConnectStatus === 'active' ? 'Update Stripe Account' : 'Link Stripe Account' }}
                                 </button>
                             </div>
                         </div>

                         <div v-if="settingsBrand.subscription_billing_method === 'ledger'" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 14px; font-size: 0.8rem; line-height: 1.4; color: var(--text-muted); margin-bottom: 15px;">
                             💡 Ledger deduction is authorized. Subscriptions are automatically deducted from dropshipping payout balances.
                         </div>
                     </div>

                     <!-- Custom Stripe API Keys Onboarding Alternative (Hidden if officially connected via Stripe Connect) -->
                     <div v-if="stripeConnectStatus !== 'active'" class="form-group form-full" style="margin-top: 15px; border-top: 1px dashed var(--border); padding-top: 15px;">
                         <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
                             <span style="color: var(--text-muted); font-size: 0.8rem;">Alternative Custom API Keys:</span>
                             <span v-if="settingsBrand.stripe_secret_key || settingsBrand.stripe_webhook_secret" style="color: var(--success); font-weight: 700; font-size: 0.8rem;">
                                 ✓ Configured
                             </span>
                             <span v-else style="color: var(--text-muted); font-style: italic; font-size: 0.8rem;">
                                 Not Configured
                             </span>
                         </div>
                         <div style="margin-top: 8px;">
                             <button type="button" @click="showCustomStripeKeys = !showCustomStripeKeys" class="btn btn-secondary" style="width: 100%; font-weight: 600; background: transparent; border: 1px dashed var(--border); padding: 8px 12px; border-radius: 6px; font-size: 0.78rem; cursor: pointer; color: var(--text-main); margin: 0; display: flex; align-items: center; justify-content: center;">
                                 {{ showCustomStripeKeys ? '🙈 Hide Custom API Keys Configuration' : '🔑 Configure Custom Stripe API Keys (Alternative)' }}
                             </button>
                         </div>
                         <div v-if="showCustomStripeKeys" style="display: flex; flex-direction: column; gap: 10px; background: rgba(0, 0, 0, 0.2); border: 1px solid var(--border); padding: 12px; border-radius: 6px; margin-top: 8px;">
                             <div class="form-group" style="margin: 0; display: flex; flex-direction: column; text-align: left;">
                                 <label style="display: flex; align-items: center; gap: 6px; font-size: 0.76rem; color: var(--text-main); font-weight: 600; margin-bottom: 4px;"><span v-html="getStripeLogoSvg(12)"></span>Stripe Secret Key <span class="info-tooltip-trigger" data-tooltip="Stripe account API Secret key used to process customer card checkouts directly to your balance.">i</span></label>
                                 <input type="password" v-model="settingsBrand.stripe_secret_key"
                                     placeholder="Stripe Secret Key (sk_live_...)" pattern="^sk_(?:live|test)_[a-zA-Z0-9]+$" style="height: 32px; font-size: 0.8rem; margin: 0; padding: 6px 10px; border-radius: 4px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main);">
                             </div>
                             <div class="form-group" style="margin: 0; display: flex; flex-direction: column; text-align: left;">
                                 <label style="display: flex; align-items: center; gap: 6px; font-size: 0.76rem; color: var(--text-main); font-weight: 600; margin-bottom: 4px;"><span v-html="getStripeLogoSvg(12)"></span>Stripe Webhook Secret <span class="info-tooltip-trigger" data-tooltip="Webhook signing secret used to verify payment success notification events from Stripe.">i</span></label>
                                 <input type="password" v-model="settingsBrand.stripe_webhook_secret"
                                     placeholder="Stripe Webhook Secret (whsec_...)" pattern="^whsec_[a-zA-Z0-9]+$" style="height: 32px; font-size: 0.8rem; margin: 0; padding: 6px 10px; border-radius: 4px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main);">
                             </div>
                         </div>
                     </div>
                </div>
                <div class="panel-footer">
                    <button type="submit" class="btn btn-accent" style="margin: 0;">Update E-commerce Settings</button>
                </div>
            </form>
        </div>

        <!-- Contextual settings for currently filtered shop (Social Accounts Tab) -->
        <div class="panel" id="shop-social-panel" v-if="isValidBrandSelected && activeTab === 'social'">
            <div class="panel-header">
                <h3 class="panel-title">Social Accounts Connection for <span>{{ currentSelectedBrandName }}</span></h3>
            </div>
            <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.45; margin: 0 0 10px 0;">
                    Manage integration mappings, API authentications, and sync settings for your brand's social commerce storefronts.
                </p>

                <!-- Grid of social accounts connection cards -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                    
                    <!-- Meta / Facebook connection card -->
                    <div style="background: rgba(255, 255, 255, 0.015); border: 1px solid var(--border); border-radius: 10px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; min-height: 150px;">
                        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;">
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <span style="font-size: 1.5rem; display: flex; align-items: center; color: #1877f2;" v-html="app.getChannelIconSvg('facebook', 22)"></span>
                                <div style="display: flex; flex-direction: column; text-align: left;">
                                    <strong style="font-size: 0.88rem; color: var(--text-main);">Meta Business Suite</strong>
                                    <span style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Facebook Page Shop & Feed</span>
                                </div>
                            </div>
                            <span v-if="app.isChannelConnected('facebook')" style="font-size: 0.7rem; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 4px; font-weight: 700;">Connected</span>
                            <span v-else style="font-size: 0.7rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; font-weight: 700;">Off</span>
                        </div>
                        <div style="margin-top: auto;">
                            <button type="button" @click="app.selectChannel('facebook')" class="btn" style="width: 100%; height: 34px; font-size: 0.78rem; font-weight: 600; margin: 0; display: flex; align-items: center; justify-content: center; gap: 6px;" :class="app.isChannelConnected('facebook') ? 'btn-secondary' : 'btn-accent'">
                                {{ app.isChannelConnected('facebook') ? '⚙️ Manage Connection' : '🔌 Link Meta Account' }}
                            </button>
                        </div>
                    </div>

                    <!-- Instagram connection card -->
                    <div style="background: rgba(255, 255, 255, 0.015); border: 1px solid var(--border); border-radius: 10px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; min-height: 150px;">
                        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;">
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <span style="font-size: 1.5rem; display: flex; align-items: center; color: #e1306c;" v-html="app.getChannelIconSvg('instagram', 22)"></span>
                                <div style="display: flex; flex-direction: column; text-align: left;">
                                    <strong style="font-size: 0.88rem; color: var(--text-main);">Instagram Shopping</strong>
                                    <span style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Product Tagging & Feeds</span>
                                </div>
                            </div>
                            <span v-if="app.isChannelConnected('instagram')" style="font-size: 0.7rem; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 4px; font-weight: 700;">Connected</span>
                            <span v-else style="font-size: 0.7rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; font-weight: 700;">Off</span>
                        </div>
                        <div style="margin-top: auto;">
                            <button type="button" @click="app.selectChannel('instagram')" class="btn" style="width: 100%; height: 34px; font-size: 0.78rem; font-weight: 600; margin: 0; display: flex; align-items: center; justify-content: center; gap: 6px;" :class="app.isChannelConnected('instagram') ? 'btn-secondary' : 'btn-accent'">
                                {{ app.isChannelConnected('instagram') ? '⚙️ Manage Connection' : '🔌 Link Instagram Shop' }}
                            </button>
                        </div>
                    </div>

                    <!-- Twitter / X connection card -->
                    <div style="background: rgba(255, 255, 255, 0.015); border: 1px solid var(--border); border-radius: 10px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; min-height: 150px;">
                        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;">
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <span style="font-size: 1.5rem; display: flex; align-items: center;" v-html="app.getChannelIconSvg('twitter', 20)"></span>
                                <div style="display: flex; flex-direction: column; text-align: left;">
                                    <strong style="font-size: 0.88rem; color: var(--text-main);">Twitter / X Shop</strong>
                                    <span style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Profile Spotlight Products</span>
                                </div>
                            </div>
                            <span v-if="app.isChannelConnected('twitter')" style="font-size: 0.7rem; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 4px; font-weight: 700;">Connected</span>
                            <span v-else style="font-size: 0.7rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; font-weight: 700;">Off</span>
                        </div>
                        <div style="margin-top: auto;">
                            <button type="button" @click="app.selectChannel('twitter')" class="btn" style="width: 100%; height: 34px; font-size: 0.78rem; font-weight: 600; margin: 0; display: flex; align-items: center; justify-content: center; gap: 6px;" :class="app.isChannelConnected('twitter') ? 'btn-secondary' : 'btn-accent'">
                                {{ app.isChannelConnected('twitter') ? '⚙️ Manage Connection' : '🔌 Link X / Twitter Shop' }}
                            </button>
                        </div>
                    </div>

                    <!-- TikTok Shop connection card -->
                    <div style="background: rgba(255, 255, 255, 0.015); border: 1px solid var(--border); border-radius: 10px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; min-height: 150px;">
                        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;">
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <span style="font-size: 1.5rem; display: flex; align-items: center;">🎵</span>
                                <div style="display: flex; flex-direction: column; text-align: left;">
                                    <strong style="font-size: 0.88rem; color: var(--text-main);">TikTok Shop</strong>
                                    <span style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">In-app Checkout & Live Feeds</span>
                                </div>
                            </div>
                            <span style="font-size: 0.7rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; font-weight: 700;">Off</span>
                        </div>
                        <div style="margin-top: auto;">
                            <button type="button" @click="showNotification('TikTok Shop connection flow is available through customizer integration steps.')" class="btn btn-secondary" style="width: 100%; height: 34px; font-size: 0.78rem; font-weight: 600; margin: 0; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                🔌 Link TikTok Shop
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <div class="panel" id="no-shop-selected-settings" v-if="!isValidBrandSelected"
            style="text-align: center; color: var(--text-muted); padding: 40px 20px;">
            <p v-if="activeTab === 'general'">⚠️ Select a specific Shop Context in the top bar to configure individual integrations and Shopify parameters.</p>
            <p v-else-if="activeTab === 'ecommerce'">⚠️ Select a specific Shop Context in the top bar to configure individual E-commerce parameters and Stripe integrations.</p>
            <p v-else-if="activeTab === 'social'">⚠️ Select a specific Shop Context in the top bar to configure individual Social Account integrations.</p>
        </div>

        <!-- Upgrade/Downgrade Confirmation Modal -->
        <div v-if="subModalOpen" class="modal-overlay" @click.self="subModalOpen = false" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.75); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(10px);">
            <div class="panel" style="width: 100%; max-width: 500px; background: var(--panel-bg); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); overflow: hidden; display: flex; flex-direction: column;">
                <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid var(--border);">
                    <h3 class="panel-title" style="margin: 0; font-size: 1.05rem; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                        <span>⚙️ Confirm AI Operation Plan Change</span>
                    </h3>
                    <button @click="subModalOpen = false" style="background: none; border: none; color: var(--text-muted); font-size: 1.25rem; cursor: pointer; transition: color 0.2s; padding: 0;">&times;</button>
                </div>
                <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px; text-align: left;">
                    
                    <!-- Billing Interval selector toggle -->
                    <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 5px;">
                        <label style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Choose Billing Cycle</label>
                        <div style="display: flex; gap: 4px; background: rgba(255,255,255,0.03); padding: 3px; border-radius: 8px; border: 1px solid var(--border);">
                            <button type="button" @click="changeSubModalInterval('monthly')" :style="{ background: subModalInterval === 'monthly' ? 'var(--accent)' : 'transparent', color: subModalInterval === 'monthly' ? '#000000' : 'var(--text-muted)' }" class="btn btn-secondary" style="flex: 1; font-size: 0.76rem; font-weight: 700; height: 32px; margin: 0; border: none; transition: all 0.2s;">
                                Billed Monthly
                            </button>
                            <button type="button" @click="changeSubModalInterval('yearly')" :style="{ background: subModalInterval === 'yearly' ? 'var(--accent)' : 'transparent', color: subModalInterval === 'yearly' ? '#000000' : 'var(--text-muted)' }" class="btn btn-secondary" style="flex: 1; font-size: 0.76rem; font-weight: 700; height: 32px; margin: 0; border: none; transition: all 0.2s;">
                                Billed Annually (Save 20% 🎉)
                            </button>
                        </div>
                    </div>

                    <!-- Tier Price cards comparison -->
                    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); padding: 15px; border-radius: 8px; display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--border); padding-bottom: 8px;">
                            <span style="font-size: 0.8rem; color: var(--text-muted);">Current Active Tier:</span>
                            <span style="font-weight: 700; color: var(--text-main); font-size: 0.82rem; text-transform: capitalize;">{{ oldTierDisplay }}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
                            <span style="font-size: 0.8rem; color: var(--text-muted);">Target Selected Tier:</span>
                            <div style="text-align: right;">
                                <strong style="color: var(--accent); font-size: 1.05rem;">{{ targetTierDisplay }}</strong>
                                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                                    €{{ targetTierPrice }} / month
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Proration/Downgrade calculations details -->
                    <div v-if="calculatingSub" style="padding: 10px; text-align: center; color: var(--text-muted); font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span>⏳ Calculating proration & cycles...</span>
                    </div>
                    <div v-else-if="subCalcResult" style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); padding: 15px; border-radius: 8px; display: flex; flex-direction: column; gap: 8px;">
                        <div v-if="subCalcResult.is_upgrade || subCalcResult.current_tier === 'none'" style="font-size: 0.78rem; line-height: 1.4; color: var(--text-main);">
                            <span style="font-weight: 700; color: #10b981; display: block; margin-bottom: 4px; font-size: 0.82rem;">📈 Plan Upgrade Summary</span>
                            - Prorated charge due upfront today: <strong style="color: var(--accent); font-size: 0.88rem;">€{{ subCalcResult.upfront_charge.toFixed(2) }}</strong><br>
                            - Next billing rollover charge on <strong>{{ subCalcResult.next_charge_date }}</strong>: <strong>€{{ subCalcResult.rollover_charge.toFixed(2) }}</strong>
                        </div>
                        <div v-else-if="subCalcResult.is_downgrade" style="font-size: 0.78rem; line-height: 1.4; color: var(--text-main);">
                            <span style="font-weight: 700; color: #f59e0b; display: block; margin-bottom: 4px; font-size: 0.82rem;">📉 Plan Downgrade Scheduled</span>
                            - Upfront cost today: <strong style="color: #10b981;">€0.00</strong><br>
                            - Your current active plan/limits remain fully active until <strong>{{ subCalcResult.next_charge_date }}</strong>.<br>
                            - Next cycle rate starts on {{ subCalcResult.next_charge_date }} at <strong>€{{ subCalcResult.rollover_charge.toFixed(2) }}</strong>.
                        </div>
                        <div v-else style="font-size: 0.78rem; line-height: 1.4; color: var(--text-main);">
                            - Upfront charge today: <strong style="color: #10b981;">€0.00</strong><br>
                            - Plan rollover cycle cost remains at <strong>€{{ subCalcResult.rollover_charge.toFixed(2) }}</strong>.
                        </div>
                    </div>

                    <!-- Notice / Terms footer -->
                    <div style="font-size: 0.68rem; color: var(--text-muted); line-height: 1.4; border-top: 1px solid var(--border); padding-top: 10px;">
                        ⚠️ <strong>Billing Terms:</strong> Ledger balances or Stripe card payments are billed automatically. Upgrades charge instantly to adjust coverage. Downgrades apply at rollover so no refunds are issued for partial cycles.
                    </div>

                    <!-- Buttons Group -->
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
                        <button type="button" @click="subModalOpen = false" class="btn btn-secondary" style="height: 36px; padding: 0 15px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; background: transparent; border: 1px solid var(--border); color: var(--text-main); cursor: pointer;">Cancel</button>
                        <button type="button" @click="applySubModalChange" :disabled="calculatingSub || applyingSub" class="btn btn-accent" style="height: 36px; padding: 0 20px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; background: var(--accent); border: none; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                            <span v-if="applyingSub">⏳ Processing...</span>
                            <span v-else>💾 Confirm Plan Change</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'SettingsView',
    inject: ['app'],
    data() {
        return {
            settingsBrandNicheInput: '',
            availableLanguages: [
                { code: 'en', name: 'English', flag: '🇬🇧' },
                { code: 'de', name: 'German', flag: '🇩🇪' },
                { code: 'fr', name: 'French', flag: '🇫🇷' },
                { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
                { code: 'es', name: 'Spanish', flag: '🇪🇸' },
                { code: 'it', name: 'Italian', flag: '🇮🇹' },
                { code: 'ko', name: 'Korean', flag: '🇰🇷' }
            ],
            dnsVerified: false,
            dnsVerifying: false,
            dnsVerifyError: '',
            dnsMissing: false,
            dnsCreating: false,
            isScraping: false,
            isGeneratingProtocol: false,
            liveEstimatedTokens: 0,
            liveEstimatedCost: 0,
            liveTickerInterval: null,
            activeTab: 'general',
            isEditingProtocol: false,
            editedProtocolText: '',
            competitorInput: '',
            competitorTags: [],
            newCompetitorInput: '',
            autoFindCompetitors: true,
            aiUsageSummary: { total_calls: 0, total_prompt_tokens: 0, total_completion_tokens: 0, total_tokens: 0, total_cost_usd: 0.0 },
            aiUsageBreakdown: [],
            aiUsageLogs: [],
            globalPricing: [],
            superadminAiUsageSummary: [],
            isLoadingSuperadminAiUsage: false,
            realtimeLimits: [],
            isLoadingRealtimeLimits: false,
            realtimeLimitsBrandFilter: '',
            generationMethod: 'auto',
            compiledPrompt: '',
            savingTierFeatures: false,
            localFeatures: {
                standard: { allow_manuscript: true, allow_copywriter: true, allow_translator: false, allow_seo: true, allow_designer: false, allow_page_builder: false, allow_dynamic_optimization: false },
                professional: { allow_manuscript: true, allow_copywriter: true, allow_translator: true, allow_seo: true, allow_designer: true, allow_page_builder: true, allow_dynamic_optimization: false },
                enterprise: { allow_manuscript: true, allow_copywriter: true, allow_translator: true, allow_seo: true, allow_designer: true, allow_page_builder: true, allow_dynamic_optimization: true }
            },
            protocolPollInterval: null,
            subModalOpen: false,
            subModalInterval: 'monthly',
            subModalTargetTier: 'professional',
            subCalcResult: null,
            calculatingSub: false,
            applyingSub: false,
            stripeConnectStatus: 'unlinked',
            loadingStripeConnect: false,
            cardLinked: false,
            shopifyConnectionMode: 'oauth',
            woocommerceConnectionMode: 'oauth',
            showCustomStripeKeys: false,
            manuscripts: [],
            loadingManuscripts: false,
            activatingManuscriptId: null
        }
    },
    watch: {
        'app.tierFeaturesList': {
            immediate: true,
            deep: true,
            handler() {
                this.syncLocalFeatures();
            }
        },
        activeShopFilter() {
            this.dnsVerified = false;
            this.dnsVerifying = false;
            this.dnsVerifyError = '';
            this.dnsMissing = false;
            this.dnsCreating = false;
            this.loadAiUsage();
            this.loadRealtimeLimits();
            this.startProtocolPolling();
            this.loadStripeConnectStatus();
            this.loadManuscripts();
        },
        settingsBrand: {
            immediate: true,
            deep: true,
            handler(newVal) {
                if (newVal) {
                    if (newVal.competitors) {
                        this.competitorTags = newVal.competitors.split(',').map(s => s.trim()).filter(Boolean);
                    } else {
                        this.competitorTags = [];
                    }
                    this.autoFindCompetitors = newVal.auto_find_competitors !== false;
                }
            }
        },
        'app.activeView'(newView) {
            if (newView === 'settings') {
                this.loadAiUsage();
                this.loadGlobalPricing();
                this.loadSuperadminAiUsage();
                this.loadRealtimeLimits();
                this.startProtocolPolling();
                this.loadStripeConnectStatus();
                this.loadManuscripts();
            } else {
                this.stopProtocolPolling();
            }
        },
        realtimeLimitsBrandFilter() {
            this.loadRealtimeLimits();
        }
    },
    computed: {
        settingsBrandNicheTags: {
            get() {
                if (!this.settingsBrand || !this.settingsBrand.business_niche) return [];
                return this.settingsBrand.business_niche.split(',').map(s => s.trim()).filter(Boolean);
            },
            set(val) {
                if (this.settingsBrand) {
                    this.settingsBrand.business_niche = val.join(', ');
                }
            }
        },
        oldTierDisplay() {
            if (!this.settingsBrand) return 'None';
            const tier = this.settingsBrand.ai_tier || 'none';
            if (tier === 'standard') return 'Standard (Gemini 2.5 Flash)';
            if (tier === 'professional') return 'Professional (Gemini 3.1 Pro)';
            if (tier === 'enterprise') return 'Enterprise (Deep Research Pro)';
            return 'No AI / Basic';
        },
        targetTierDisplay() {
            const tier = this.subModalTargetTier;
            if (tier === 'standard') return 'Standard (Gemini 2.5 Flash)';
            if (tier === 'professional') return 'Professional (Gemini 3.1 Pro)';
            if (tier === 'enterprise') return 'Enterprise (Deep Research Pro)';
            return 'No AI / Basic';
        },
        targetTierPrice() {
            const tier = this.subModalTargetTier;
            const interval = this.subModalInterval;
            if (tier === 'none') return '0';
            if (interval === 'yearly') {
                if (tier === 'standard') return '39 (billed annually)';
                if (tier === 'professional') return '79 (billed annually)';
                if (tier === 'enterprise') return '159 (billed annually)';
            } else {
                if (tier === 'standard') return '49';
                if (tier === 'professional') return '99';
                if (tier === 'enterprise') return '199';
            }
            return '0';
        },
        userRole() { return this.app.userRole; },
        activeManuscriptModelName() {
            if (!this.settingsBrand) return 'Gemini 3.1 Pro';
            const tier = this.settingsBrand.ai_tier || 'professional';
            if (tier === 'standard') return 'Gemini 2.5 Flash';
            if (tier === 'enterprise') return 'Deep Research Pro';
            return 'Gemini 3.1 Pro';
        },
        protocolErrorSuggestion() {
            if (!this.settingsBrand) return '';
            const tier = this.settingsBrand.ai_tier || 'professional';
            if (tier === 'standard') {
                return 'The backend hit a throttle limit (Gemini 2.5 Flash has 15 RPM limit on standard key) or an error occurred. We suggest switching to <strong>Professional Tier (Gemini 3.1 Pro)</strong> or using the <strong>Manual Copy-Paste Builder</strong> to bypass limits!';
            } else if (tier === 'professional') {
                return 'The backend hit a throttle limit (Gemini 1.5 Pro has 360 RPM limit) or an error occurred. We suggest switching to <strong>Enterprise Tier (Deep Research Pro)</strong> or using the <strong>Manual Copy-Paste Builder</strong> to bypass limits!';
            } else {
                return 'The backend hit a throttle limit (Deep Research has just 1 RPM limit) or an error occurred. We suggest waiting a minute before retry, or using the <strong>Manual Copy-Paste Builder</strong> to bypass limits!';
            }
        },
        activeShopFilter() { return this.app.activeShopFilter; },
        isValidBrandSelected() {
            return this.activeShopFilter !== 'all' && this.app.brands.some(b => b.id === this.activeShopFilter);
        },
        currentSelectedBrandName() { return this.app.currentSelectedBrandName; },
        settingsBrand() { return this.app.settingsBrand; },
        manuscriptStats() {
            if (!this.aiUsageBreakdown) return { calls_count: 0, total_tokens: 0, cost_usd: 0 };
            return this.aiUsageBreakdown.find(b => b.operation === 'Brand Protocol & Strategy Generation') || { calls_count: 0, total_tokens: 0, cost_usd: 0 };
        },
        hasSettingsChanged() {
            if (!this.app.originalSettingsBrand || !this.settingsBrand) return false;
            const fields = [
                'name', 'contact_email', 'subdomain', 'custom_domain',
                'primary_color', 'secondary_color', 'bg_color', 'text_color',
                'button_radius', 'button_text_color', 'header_bg_color', 'font_family',
                'favicon', 'logo', 'shopify_shop_name', 'shopify_access_token',
                'stripe_secret_key', 'stripe_webhook_secret', 'pay_as_you_go_enabled',
                'competitors', 'auto_find_competitors'
            ];
            for (const f of fields) {
                const origVal = this.app.originalSettingsBrand[f];
                const curVal = this.settingsBrand[f];
                if ((origVal || '') !== (curVal || '')) return true;
            }
            const origLangs = Array.isArray(this.app.originalSettingsBrand.languages) ? [...this.app.originalSettingsBrand.languages].sort().join(',') : '';
            const curLangs = Array.isArray(this.settingsBrand.languages) ? [...this.settingsBrand.languages].sort().join(',') : '';
            if (origLangs !== curLangs) return true;
            return false;
        },
        getActiveTierSpendLimit() {
            if (!this.settingsBrand) return 50.00;
            const tier = this.settingsBrand.ai_tier || 'professional';
            if (tier === 'standard') return 10.00;
            if (tier === 'enterprise') return 200.00;
            return 50.00;
        },
        getSpendLimitProgressPercent() {
            const limit = this.getActiveTierSpendLimit;
            const spend = parseFloat(this.aiUsageSummary.total_cost_usd || 0);
            return Math.min(Math.round((spend / limit) * 100), 100);
        },
        getSpendLimitProgressColor() {
            const percent = this.getSpendLimitProgressPercent;
            if (percent >= 100) return '#ef4444';
            if (percent >= 80) return '#f59e0b';
            return '#10b981';
        },
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
        subdomainSlug: {
            get() {
                const sub = this.settingsBrand.subdomain || '';
                return sub.split('.')[0] || '';
            },
            set(val) {
                const slug = val.trim().toLowerCase();
                this.settingsBrand.subdomain = slug ? `${slug}.${this.app.baseBrandDomain}` : '';
            }
        },
        activeManuscriptModelEstCost() {
            if (!this.settingsBrand) return '$0.0288';
            const tier = this.settingsBrand.ai_tier || 'professional';
            if (tier === 'standard') return '$0.0017';
            if (tier === 'enterprise') return '$0.4100';
            return '$0.0288';
        }
    },
    created() {
        window.addEventListener('message', this.handleOAuthMessage);
        if (this.app.activeView === 'settings') {
            this.loadAiUsage();
            this.loadGlobalPricing();
            this.loadSuperadminAiUsage();
            this.loadRealtimeLimits();
            this.startProtocolPolling();
            this.loadStripeConnectStatus();
        }
    },
    beforeDestroy() {
        window.removeEventListener('message', this.handleOAuthMessage);
        this.stopProtocolPolling();
        this.stopLiveTicker();
    },
    methods: {
        async loadManuscripts() {
            if (!this.settingsBrand || !this.settingsBrand.id) return;
            this.loadingManuscripts = true;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/manuscripts`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    this.manuscripts = await response.json();
                }
            } catch (e) {
                console.error('Error loading manuscripts:', e);
            } finally {
                this.loadingManuscripts = false;
            }
        },
        async activateManuscript(manuscriptId) {
            if (!this.settingsBrand || !this.settingsBrand.id) return;
            this.activatingManuscriptId = manuscriptId;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/manuscripts/${manuscriptId}/activate`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    this.app.showNotification('✨ Manuscript version successfully activated!');
                    await this.app.loadBrands();
                    await this.loadManuscripts();
                } else {
                    const err = await response.json();
                    alert('Activation error: ' + (err.error || 'Unknown error'));
                }
            } catch (e) {
                alert('Activation network error: ' + e.message);
            } finally {
                this.activatingManuscriptId = null;
            }
        },
        async deleteManuscript(manuscriptId) {
            if (!confirm('Are you sure you want to delete this historical manuscript version? This cannot be undone.')) return;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/manuscripts/${manuscriptId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    this.app.showNotification('Manuscript version deleted.');
                    await this.loadManuscripts();
                } else {
                    const err = await response.json();
                    alert('Delete error: ' + (err.error || 'Unknown error'));
                }
            } catch (e) {
                alert('Delete network error: ' + e.message);
            }
        },
        async loadStripeConnectStatus() {
            if (!this.settingsBrand || !this.settingsBrand.id) {
                this.stripeConnectStatus = 'unlinked';
                this.cardLinked = false;
                return;
            }
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/billing/ledger/${this.settingsBrand.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    this.stripeConnectStatus = data.stripe_connect_status || 'unlinked';
                    this.cardLinked = data.card_linked || false;
                } else {
                    this.stripeConnectStatus = 'unlinked';
                    this.cardLinked = false;
                }
            } catch (e) {
                console.error(e);
                this.stripeConnectStatus = 'unlinked';
                this.cardLinked = false;
            }
        },
        async initiateStripeConnect() {
            try {
                this.loadingStripeConnect = true;
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/stripe-connect-link`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    alert('Failed to generate connection link: ' + (data.error || 'Unknown error'));
                }
            } catch (err) {
                alert('Connection error: ' + err.message);
            } finally {
                this.loadingStripeConnect = false;
            }
        },
        async initiateStripeCardSetup() {
            try {
                this.loadingCardSetup = true;
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/stripe-setup-session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    alert('Failed to generate card setup link: ' + (data.error || 'Unknown error'));
                }
            } catch (err) {
                alert('Connection error: ' + err.message);
            } finally {
                this.loadingCardSetup = false;
            }
        },
        onAiTierChange(newTier) {
            this.subModalTargetTier = newTier;
            this.subModalInterval = 'monthly';
            this.subModalOpen = true;
            this.calculateSubModalChange();
        },
        changeSubModalInterval(interval) {
            this.subModalInterval = interval;
            this.calculateSubModalChange();
        },
        async calculateSubModalChange() {
            this.calculatingSub = true;
            this.subCalcResult = null;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/subscription/calculate-change`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        target_tier: this.subModalTargetTier,
                        target_interval: this.subModalInterval
                    })
                });
                if (response.ok) {
                    this.subCalcResult = await response.json();
                } else {
                    const err = await response.json();
                    alert('Error calculating tier details: ' + err.error);
                }
            } catch (e) {
                console.error(e);
            } finally {
                this.calculatingSub = false;
            }
        },
        async applySubModalChange() {
            this.applyingSub = true;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/subscription/apply-change`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        target_tier: this.subModalTargetTier,
                        target_interval: this.subModalInterval
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    this.app.showNotification(data.message || 'Subscription updated successfully.');
                    this.subModalOpen = false;
                    this.app.loadBrands().then(() => {
                        this.app.selectBrand(this.settingsBrand.id);
                    });
                } else {
                    const err = await response.json();
                    alert('Error updating subscription: ' + err.error);
                }
            } catch (e) {
                console.error(e);
            } finally {
                this.applyingSub = false;
            }
        },
        handleOAuthMessage(e) {
            if (e.data && e.data.type === 'shopify_oauth_success') {
                this.app.showNotification('Shopify Connected Successfully via OAuth!');
                this.app.loadBrands().then(() => {
                    if (this.app.selectedBrandId === e.data.brandId) {
                        this.app.selectBrand(e.data.brandId);
                    }
                });
            }
        },
        async connectShopifyOAuth() {
            if (!this.settingsBrand.shopify_shop_name) {
                alert('Please enter your Shopify Store URL address first.');
                return;
            }
            // Open Shopify OAuth in a popup window
            const authorizeUrl = `${this.app.apiBaseUrl}/api/global/shopify/auth?shop=${encodeURIComponent(this.settingsBrand.shopify_shop_name)}&brandId=${encodeURIComponent(this.settingsBrand.id)}&adminUrl=${encodeURIComponent(window.location.origin + window.location.pathname)}&token=${encodeURIComponent(localStorage.getItem('sc_admin_token') || '')}`;
            window.open(authorizeUrl, 'ShopifyOAuth', 'width=800,height=700,status=yes,resizable=yes');
        },
        async connectWooCommerceOAuth() {
            if (!this.settingsBrand.woocommerce_shop_url) {
                alert('Please enter your WooCommerce Store URL address first.');
                return;
            }
            // Open WooCommerce OAuth in a popup window
            const authorizeUrl = `${this.app.apiBaseUrl}/api/global/woocommerce/auth?shop=${encodeURIComponent(this.settingsBrand.woocommerce_shop_url)}&brandId=${encodeURIComponent(this.settingsBrand.id)}&adminUrl=${encodeURIComponent(window.location.origin + window.location.pathname)}&token=${encodeURIComponent(localStorage.getItem('sc_admin_token') || '')}`;
            window.open(authorizeUrl, 'WooCommerceOAuth', 'width=800,height=700,status=yes,resizable=yes');
        },
        startLiveTicker() {
            this.stopLiveTicker();
            this.liveEstimatedTokens = 0;
            this.liveEstimatedCost = 0;
            this.liveTickerInterval = setInterval(() => {
                this.liveEstimatedTokens += Math.floor(Math.random() * 80) + 50;
                this.liveEstimatedCost = (this.liveEstimatedTokens * 0.000003) * 0.92;
            }, 300);
        },
        stopLiveTicker() {
            if (this.liveTickerInterval) {
                clearInterval(this.liveTickerInterval);
                this.liveTickerInterval = null;
            }
        },
        async cancelMarketingProtocol() {
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/cancel-protocol`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    }
                });
                if (response.ok) {
                    this.showNotification('AI strategy playbook generation cancelled.');
                    this.stopLiveTicker();
                    await this.app.loadBrands();
                }
            } catch (err) {
                console.error('Error cancelling protocol:', err);
                this.showNotification(`Error: ${err.message}`);
            }
        },
        startProtocolPolling() {
            this.stopProtocolPolling();
            this.protocolPollInterval = setInterval(async () => {
                if (this.settingsBrand && this.settingsBrand.protocol_status === 'generating') {
                    if (!this.liveTickerInterval) {
                        this.startLiveTicker();
                    }
                    if (!this.app.aiTicker.active) {
                        this.app.startAiTicker(this.activeManuscriptModelName);
                    }
                    console.log('[AI Settings View] Polling brand list to check generation progress...');
                    await this.app.loadBrands();
                    if (this.settingsBrand.protocol_status !== 'generating') {
                        // Status changed, reload usage metrics as well
                        this.loadAiUsage();
                        this.stopLiveTicker();
                        this.app.stopAiTicker();
                        if (this.settingsBrand.protocol_status === 'completed') {
                            this.showNotification('AI Brand Performance Marketing Manuscript successfully generated!');
                            this.loadManuscripts();
                        } else if (this.settingsBrand.protocol_status === 'failed') {
                            this.showNotification(`AI strategy playbook generation failed: ${this.settingsBrand.protocol_error || 'Unknown error'}`);
                        }
                    }
                } else {
                    this.stopLiveTicker();
                    this.app.stopAiTicker();
                }
            }, 5000);
        },
        formatTokens(num) {
            if (!num) return '0';
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
            return num;
        },
        stopProtocolPolling() {
            if (this.protocolPollInterval) {
                clearInterval(this.protocolPollInterval);
                this.protocolPollInterval = null;
            }
        },
        async compileManualPrompt() {
            this.isCompilingPrompt = true;
            this.compiledPrompt = '';
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/compile-prompt`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        competitors: this.competitorTags.join(', ')
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.compiledPrompt = data.prompt;
                        this.showNotification('Strategy prompt successfully compiled with store storefront context!');
                    }
                } else {
                    const err = await response.json();
                    this.showNotification(`Error compiling prompt: ${err.error}`);
                }
            } catch (err) {
                this.showNotification(`Error: ${err.message}`);
            } finally {
                this.isCompilingPrompt = false;
            }
        },
        copyCompiledPrompt() {
            if (!this.compiledPrompt) return;
            navigator.clipboard.writeText(this.compiledPrompt);
            this.showNotification('📋 Strategy prompt copied to clipboard!');
        },
        async generateMarketingProtocol() {
            this.isGeneratingProtocol = true;
            this.app.startAiTicker(this.activeManuscriptModelName);
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/generate-protocol`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        competitors: this.competitorTags.join(', '),
                        auto_find_competitors: this.autoFindCompetitors
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        // Immediately transition UI state to generating and trigger polling
                        this.settingsBrand.protocol_status = 'generating';
                        this.settingsBrand.protocol_error = null;
                        this.startLiveTicker();
                        this.startProtocolPolling();
                        this.showNotification('AI strategy playbook generation started in the background.');
                    } else {
                        this.app.stopAiTicker();
                        throw new Error(data.error || 'Failed to generate manuscript');
                    }
                } else {
                    this.app.stopAiTicker();
                    const errText = await response.text();
                    throw new Error(errText);
                }
            } catch (err) {
                this.app.stopAiTicker();
                console.error('Error generating protocol:', err);
                this.showNotification(`Error: ${err.message}`);
            } finally {
                this.isGeneratingProtocol = false;
            }
        },
        addCompetitorTag() {
            const val = (this.newCompetitorInput || '').trim();
            if (val) {
                const cleanVal = val.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
                const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
                if (!domainRegex.test(cleanVal)) {
                    alert('Please enter a valid competitor domain address (e.g., competitor.com or competitor.be) rather than a name.');
                    return;
                }
                if (cleanVal && !this.competitorTags.includes(cleanVal)) {
                    this.competitorTags.push(cleanVal);
                    this.syncCompetitorsToBrand();
                }
            }
            this.newCompetitorInput = '';
        },
        removeCompetitorTag(idx) {
            this.competitorTags.splice(idx, 1);
            this.syncCompetitorsToBrand();
        },
        handleCompetitorBackspace() {
            if (this.newCompetitorInput === '' && this.competitorTags.length > 0) {
                const popped = this.competitorTags.pop();
                this.newCompetitorInput = popped;
                this.syncCompetitorsToBrand();
            }
        },
        syncCompetitorsToBrand() {
            if (this.settingsBrand) {
                this.settingsBrand.competitors = this.competitorTags.join(', ');
                this.settingsBrand.auto_find_competitors = this.autoFindCompetitors;
            }
            if (this.generationMethod === 'manual' && this.compiledPrompt) {
                this.compileManualPrompt();
            }
        },
        async loadAiUsage() {
            if (!this.settingsBrand || !this.settingsBrand.id || this.settingsBrand.id === 'all') {
                return;
            }
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/ai-usage`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.aiUsageSummary = data.summary;
                        this.aiUsageBreakdown = data.breakdown;
                        this.aiUsageLogs = data.recent_logs;
                    }
                }
            } catch (err) {
                console.error('Error loading AI usage data:', err);
            }
        },
        syncLocalFeatures() {
            const defaults = {
                standard: { allow_manuscript: true, allow_copywriter: true, allow_translator: false, allow_seo: true, allow_designer: false, allow_page_builder: false, allow_dynamic_optimization: false },
                professional: { allow_manuscript: true, allow_copywriter: true, allow_translator: true, allow_seo: true, allow_designer: true, allow_page_builder: true, allow_dynamic_optimization: false },
                enterprise: { allow_manuscript: true, allow_copywriter: true, allow_translator: true, allow_seo: true, allow_designer: true, allow_page_builder: true, allow_dynamic_optimization: true }
            };
            if (this.app.tierFeaturesList && this.app.tierFeaturesList.length > 0) {
                this.app.tierFeaturesList.forEach(item => {
                    if (defaults[item.tier]) {
                        defaults[item.tier] = { ...item };
                    }
                });
            }
            this.localFeatures = defaults;
        },
        async saveTierFeatures() {
            if (this.userRole.toLowerCase() !== 'superadmin') return;
            this.savingTierFeatures = true;
            try {
                const payload = Object.keys(this.localFeatures).map(tier => ({
                    tier,
                    ...this.localFeatures[tier]
                }));
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/ai-tier-features`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ config: payload })
                });
                if (response.ok) {
                    this.app.showNotification('✨ AI Tier Features Matrix updated successfully!');
                    await this.app.loadTierFeatures();
                } else {
                    const err = await response.json();
                    alert('Error saving tier features: ' + (err.error || 'Unknown error'));
                }
            } catch (err) {
                alert('Network error saving features matrix: ' + err.message);
            } finally {
                this.savingTierFeatures = false;
            }
        },
        formatBillingCost(val) {
            if (val === undefined || val === null) return '0.00';
            return parseFloat(val).toFixed(2);
        },
        getTierSubscriptionCost() {
            if (!this.settingsBrand) return 45;
            const tier = this.settingsBrand.ai_tier || 'professional';
            if (tier === 'standard') return 15;
            if (tier === 'enterprise') return 150;
            return 45;
        },
        formatCost(val) {
            if (val === undefined || val === null) return '0.000000';
            return parseFloat(val).toFixed(6);
        },
        formatTokens(val) {
            if (!val) return '0';
            return Number(val).toLocaleString();
        },
        formatDate(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },
        getSpendPercentage(cost) {
            if (!this.aiUsageSummary.total_cost_usd || this.aiUsageSummary.total_cost_usd === 0) return 0;
            return (cost / this.aiUsageSummary.total_cost_usd) * 100;
        },
        async loadGlobalPricing() {
            if (this.userRole.toLowerCase() !== 'superadmin') return;
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/ai-pricing`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.globalPricing = data.pricing;
                    }
                }
            } catch (err) {
                console.error('Error loading global AI pricing rates:', err);
            }
        },
        async saveModelPricing(item) {
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/ai-pricing`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: item.model,
                        prompt_rate_per_million: parseFloat(item.prompt_rate_per_million),
                        completion_rate_per_million: parseFloat(item.completion_rate_per_million)
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.showNotification(`Successfully updated pricing for ${item.model}`);
                        this.loadGlobalPricing();
                        this.loadAiUsage(); // Refresh stats for active brand
                    }
                }
            } catch (err) {
                this.showNotification(`Failed to save pricing: ${err.message}`);
            }
        },
        toggleEditProtocol() {
            this.editedProtocolText = this.settingsBrand.marketing_protocol || '';
            this.isEditingProtocol = true;
        },
        cancelEditProtocol() {
            this.isEditingProtocol = false;
        },
        async saveManualProtocol() {
            this.settingsBrand.marketing_protocol = this.editedProtocolText;
            this.isEditingProtocol = false;
            
            // Call standard brand update route to save the updated protocol
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.settingsBrand)
                });
                if (response.ok) {
                    this.showNotification('Marketing manuscript updated and saved.');
                } else {
                    const err = await response.text();
                    throw new Error(err);
                }
            } catch (err) {
                console.error('Error saving protocol updates:', err);
                this.showNotification(`Error saving modifications: ${err.message}`);
            }
        },
        copyProtocolToClipboard() {
            if (this.settingsBrand.marketing_protocol) {
                navigator.clipboard.writeText(this.settingsBrand.marketing_protocol);
                this.showNotification('Plaintext manuscript copied to clipboard!');
            }
        },
        copyFeedUrl() {
            const url = 'https://' + (this.settingsBrand.custom_domain || this.settingsBrand.subdomain || (this.settingsBrand.id + '.stricktlycoffee.be')) + '/api/google-feed.xml';
            navigator.clipboard.writeText(url);
            this.showNotification('📋 Google Shopping Feed URL copied to clipboard!');
        },
        showNotification(msg) { return this.app.showNotification(msg); },
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
        async loadSuperadminAiUsage() {
            if (this.userRole.toLowerCase() !== 'superadmin') return;
            this.isLoadingSuperadminAiUsage = true;
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/superadmin/ai-usage`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.superadminAiUsageSummary = data.summary;
                    }
                }
            } catch (err) {
                console.error('Error loading superadmin global AI usage:', err);
            } finally {
                this.isLoadingSuperadminAiUsage = false;
            }
        },
        async loadRealtimeLimits() {
            if (this.userRole.toLowerCase() !== 'superadmin') return;
            this.isLoadingRealtimeLimits = true;
            try {
                let url = `${this.app.apiBaseUrl}/api/global/superadmin/realtime-limits`;
                if (this.realtimeLimitsBrandFilter) {
                    url += `?brandId=${this.realtimeLimitsBrandFilter}`;
                }
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.realtimeLimits = data.usage;
                    }
                }
            } catch (err) {
                console.error('Error loading realtime AI limits data:', err);
            } finally {
                this.isLoadingRealtimeLimits = false;
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
        }
    }
}
</script>

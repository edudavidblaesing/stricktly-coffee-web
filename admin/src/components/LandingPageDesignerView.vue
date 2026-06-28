<template>
    <div id="landing-designer-workspace-container" style="width: 100%;">
        <!-- Header -->
        <div class="panel-header" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <button type="button" class="btn" style="padding: 6px 12px; font-weight: 700; height: 32px; display: flex; align-items: center; justify-content: center; gap: 6px; margin: 0; background: var(--workspace-bg); color: var(--text-main); border: 1px solid var(--border);" @click="goBack">
                    ⬅ {{ editingPage ? 'Back to Campaigns List' : 'Back to Channels' }}
                </button>
                <h2 class="panel-title" style="margin: 0; font-size: 1.3rem; display: flex; align-items: center; gap: 8px;">
                    📄 Landing Page Campaign Designer
                </h2>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
                Active Brand: <strong style="color: var(--accent);">{{ activeBrandName }}</strong>
            </div>
        </div>

        <!-- No Store Selected Handler -->
        <div v-if="app.activeShopFilter === 'all'" class="panel" style="text-align: center; padding: 60px 20px;">
            <span style="font-size: 3rem;">🏬</span>
            <h3 style="margin-top: 15px; color: var(--text-main);">No Store Selected</h3>
            <p style="color: var(--text-muted); max-width: 450px; margin: 10px auto 20px auto; font-size: 0.9rem;">
                Please select a specific brand shop from the workspace switcher dropdown in the top navigation bar to design its landing page.
            </p>
        </div>

        <div v-else>
            <!-- SUBVIEW 1: Campaign Landing Pages List -->
            <div v-if="!editingPage" class="panel" style="display: flex; flex-direction: column; gap: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 14px;">
                    <div>
                        <h4 style="margin: 0; color: var(--text-main); font-size: 1.1rem; font-weight: 700;">Active Promotional Campaigns</h4>
                        <p style="margin: 4px 0 0 0; font-size: 0.82rem; color: var(--text-muted);">
                            Create multiple targeted landing pages to support coupon codes or showcase product discounts directly.
                        </p>
                    </div>
                    <button type="button" class="btn btn-accent" style="margin: 0; font-weight: 700; height: 38px; display: flex; align-items: center; gap: 8px;" @click="createNewPage">
                        ➕ Create Campaign Page
                    </button>
                </div>

                <div v-if="landingPages.length === 0" style="text-align: center; padding: 40px 20px;">
                    <span style="font-size: 2.5rem; display: block; margin-bottom: 8px;">📣</span>
                    <h5 style="color: var(--text-main); margin: 0 0 6px 0;">No Campaign Pages Configured</h5>
                    <p style="color: var(--text-muted); font-size: 0.82rem; max-width: 400px; margin: 0 auto 12px auto;">
                        Start by creating your first promotional offer or product showcase campaign.
                    </p>
                </div>

                <div v-else class="table-container" style="overflow-x: auto;">
                    <table class="table" style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                          <tr style="border-bottom: 2px solid var(--border);">
                            <th style="padding: 12px; font-size: 0.8rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Campaign Details</th>
                            <th style="padding: 12px; font-size: 0.8rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Type</th>
                            <th style="padding: 12px; font-size: 0.8rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Slug / URL</th>
                            <th style="padding: 12px; font-size: 0.8rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Reward Coupon</th>
                            <th style="padding: 12px; text-align: right; font-size: 0.8rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(page, idx) in landingPages" :key="page.id || idx" style="border-bottom: 1px solid var(--border);" onmouseover="this.style.background='rgba(255,255,255,0.015)'" onmouseout="this.style.background='none'">
                            <td style="padding: 14px 12px; vertical-align: middle;">
                              <div style="font-weight: 700; color: var(--text-main); font-size: 0.92rem;">{{ page.headline }}</div>
                              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ page.subheadline }}</div>
                            </td>
                            <td style="padding: 12px; vertical-align: middle;">
                              <span :style="page.type === 'product' ? { background: 'rgba(59,130,246,0.15)', color: '#3b82f6' } : { background: 'rgba(16,185,129,0.15)', color: '#10b981' }" style="font-size: 0.72rem; font-weight: bold; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; display: inline-block;">
                                {{ page.type === 'product' ? 'Product Showcase' : 'Coupon Reveal' }}
                              </span>
                            </td>
                            <td style="padding: 12px; vertical-align: middle; font-family: monospace; font-size: 0.82rem; color: var(--text-main);">
                              <a :href="getLandingPageUrl(page.id)" target="_blank" style="color: var(--accent); text-decoration: none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
                                /{{ page.id }} ↗
                              </a>
                            </td>
                            <td style="padding: 12px; vertical-align: middle;">
                              <code style="font-family: monospace; font-weight: bold; background: var(--workspace-bg); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); color: var(--primary);">{{ page.coupon_code }}</code>
                            </td>
                            <td style="padding: 12px; text-align: right; vertical-align: middle; white-space: nowrap;">
                              <button type="button" class="btn" style="padding: 4px 10px; font-size: 0.78rem; margin-right: 6px; background: var(--workspace-bg); color: var(--text-main); border: 1px solid var(--border); height: 28px;" @click="startEditingPage(page, idx)">
                                ✏️ Customize
                              </button>
                              <button type="button" class="btn" style="padding: 4px 10px; font-size: 0.78rem; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); height: 28px; margin: 0;" @click="deletePage(idx)">
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- SUBVIEW 2: Active Editor / Builder Layout -->
            <div v-else class="designer-workspace-layout" style="display: flex; gap: 24px; flex-wrap: wrap;">
                <!-- Left Side: Customizer Controls -->
                <div class="panel" style="flex: 1; min-width: 340px; display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
                        <h4 style="margin: 0; color: var(--accent); font-weight: 700;">
                            {{ isNewPage ? '➕ New Campaign' : '✏️ Edit Campaign' }}
                        </h4>
                        <button type="button" class="btn" style="padding: 4px 8px; font-size: 0.78rem; height: 28px; background: var(--workspace-bg); border: 1px solid var(--border); color: var(--text-muted); margin: 0;" @click="cancelEditing">
                            Cancel
                        </button>
                    </div>

                    <!-- Page Identity / Route Slug -->
                    <div class="form-group">
                        <label>URL Slug / Path Address</label>
                        <input type="text" v-model="edit_slug" :disabled="!isNewPage" placeholder="promo-offer" style="width: 100%; font-family: monospace;">
                        <span style="font-size: 0.7rem; color: var(--text-muted);">Matches <code>/store/:brandId/{{ edit_slug || '[slug]' }}</code>. Alphanumeric and hyphens only. Unique per store.</span>
                    </div>

                    <!-- Campaign Type Toggle -->
                    <div class="form-group">
                        <label>Campaign Action / Goal</label>
                        <select v-model="edit_type" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 10px; font-family: var(--font-body); font-size: 0.85rem; outline: none;">
                            <option value="coupon">Lead Capture (Award Discount Coupon on Signup)</option>
                            <option value="product">Direct Product Showcase (One-Click Buy with discount applied)</option>
                        </select>
                    </div>

                    <!-- Featured Product Selector (for Product Offer Type) -->
                    <div v-if="edit_type === 'product'" class="form-group" style="border-left: 2px solid var(--accent); padding-left: 12px; margin-top: 2px;">
                        <label>Featured Showcase Product</label>
                        <select v-model="edit_product_id" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 10px; font-family: var(--font-body); font-size: 0.85rem; outline: none;">
                            <option v-for="prod in brandProducts" :key="prod.id" :value="prod.id">
                                {{ prod.title }} - €{{ Number(prod.price).toFixed(2) }}
                            </option>
                        </select>
                        <span v-if="brandProducts.length === 0" style="font-size: 0.72rem; color: #ef4444; display: block; margin-top: 4px;">⚠️ No products found for this store. Please add products first.</span>
                    </div>

                    <!-- Language tabs for Landing Page copy -->
                    <div v-if="availableLocales && availableLocales.length > 1" style="margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                        <label style="display: block; margin-bottom: 6px; font-weight: 700; color: var(--text-main); font-size: 0.85rem;">Edit Copy for Language Variant:</label>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                            <button v-for="lang in availableLocales" :key="lang" type="button" @click="landingPageContentLang = lang"
                                    class="btn btn-secondary" style="font-size: 0.72rem; padding: 4px 10px; height: auto; font-weight: 700; border-radius: 6px; transition: 0.2s;"
                                    :style="landingPageContentLang === lang ? 'background: var(--text-main); color: var(--workspace-bg); border-color: var(--text-main);' : ''">
                                {{ lang.toUpperCase() }}
                            </button>
                        </div>
                    </div>

                    <div style="margin-bottom: 16px; border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: rgba(255,255,255,0.01);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">📝 Landing Page Copy ({{ landingPageContentLang.toUpperCase() }} variant)</span>
                            <!-- Translate button if not default 'en' -->
                            <button v-if="landingPageContentLang !== 'en'" type="button" class="btn btn-accent" style="font-size: 0.7rem; padding: 3px 8px; height: auto; display: flex; align-items: center; gap: 4px; margin: 0; border-radius: 6px;" @click="translateLandingPageWithAI(landingPageContentLang)" :disabled="translatingLandingPage">
                                <span v-if="translatingLandingPage" style="display: inline-block; width: 10px; height: 10px; border: 2px solid var(--text-muted); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></span>
                                <span v-else>✨ AI Translate from EN</span>
                            </button>
                        </div>

                        <!-- Copy Controls for the active tab -->
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label>Landing Page Headline</label>
                            <input v-if="landingPageContentLang === 'en'" type="text" v-model="edit_headline" placeholder="Exclusive Promo: Get 20% off all Precision Coffee Gear!" style="width: 100%;">
                            <input v-else type="text" v-model="edit_translations[landingPageContentLang].headline" :placeholder="'[AI Translation Pending] e.g. Exklusives Angebot: 20 % Rabatt auf alles!'" style="width: 100%;">
                        </div>

                        <div class="form-group" style="margin-bottom: 12px;">
                            <label>Subheadline / Description</label>
                            <input v-if="landingPageContentLang === 'en'" type="text" v-model="edit_subheadline" placeholder="Elevate your home barista journey with our award-winning tools." style="width: 100%;">
                            <input v-else type="text" v-model="edit_translations[landingPageContentLang].subheadline" :placeholder="'[AI Translation Pending] e.g. Heben Sie Ihre Kaffeezubereitung auf ein neues Level.'" style="width: 100%;">
                        </div>

                        <div class="form-group" style="margin-bottom: 12px;">
                            <label>CTA Button Text</label>
                            <input v-if="landingPageContentLang === 'en'" type="text" v-model="edit_cta" placeholder="Unlock 20% Off Now" style="width: 100%;">
                            <input v-else type="text" v-model="edit_translations[landingPageContentLang].cta" :placeholder="'[AI Translation Pending] e.g. Jetzt 20 % Rabatt sichern'" style="width: 100%;">
                        </div>

                        <!-- Feature list points -->
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Feature Highlights (one per line)</label>
                            <textarea v-if="landingPageContentLang === 'en'" v-model="edit_features" rows="3" style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 10px; background: var(--workspace-bg); color: var(--text-main); font-family: var(--font-body); font-size: 0.85rem; line-height: 1.4; resize: vertical;" placeholder="⚡ Free Worldwide Shipping&#10;🔒 100% Precision Guaranteed&#10;☕ Loved by 10,000+ Baristas"></textarea>
                            <textarea v-else v-model="edit_translations[landingPageContentLang].features" rows="3" style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 10px; background: var(--workspace-bg); color: var(--text-main); font-family: var(--font-body); font-size: 0.85rem; line-height: 1.4; resize: vertical;" :placeholder="'[AI Translation Pending] e.g. ⚡ Kostenloser weltweiter Versand\n🔒 100 % Garantie\n☕ Beliebt bei Baristas'"></textarea>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Promo Code to Award/Apply</label>
                        <input type="text" v-model="edit_coupon_code" placeholder="COFFEE20" style="width: 100%; text-transform: uppercase;">
                    </div>

                    <!-- Hero Image Dropzone / Input -->
                    <div class="form-group">
                        <label>Hero Campaign Image</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="text" v-model="edit_hero_img" placeholder="https://pesado585.com/banner.png" style="flex: 1; margin: 0;">
                        </div>
                        <div class="dropzone" 
                             style="margin-top: 8px; border: 2px dashed var(--border); border-radius: 8px; padding: 20px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; background: rgba(255,255,255,0.005);"
                             @dragover.prevent="onDragOver" 
                             @dragleave.prevent="onDragLeave" 
                             @drop.prevent="onHeroDrop"
                             @click="$refs.heroFile.click()"
                             onmouseover="this.style.borderColor='var(--accent)';"
                             onmouseout="this.style.borderColor='var(--border)';"
                        >
                            <span v-if="heroUploading" class="spinner"></span>
                            <div v-else>
                                <span style="font-size: 1.5rem; display: block; margin-bottom: 4px;">🖼️</span>
                                <span style="font-size: 0.78rem; color: var(--text-muted); display: block;">Drag & drop image or click to browse</span>
                            </div>
                            <input type="file" ref="heroFile" accept="image/*" style="display: none;" @change="onHeroFileSelect">
                        </div>
                    </div>

                    <!-- Inherit Styles Toggle -->
                    <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px; cursor: pointer; user-select: none; background: var(--workspace-bg); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border);">
                        <input type="checkbox" id="landing-inherit-toggle" v-model="edit_inherit" style="width: 18px; height: 18px; cursor: pointer; margin: 0; flex-shrink: 0;">
                        <label for="landing-inherit-toggle" style="font-weight: 700; color: var(--text-main); font-size: 0.82rem; cursor: pointer; margin: 0;">
                            Match Storefront Layout Styles
                        </label>
                    </div>

                    <div v-if="!edit_inherit" style="display: flex; flex-direction: column; gap: 12px; border-left: 2px solid var(--accent); padding-left: 12px; margin-top: 4px;">
                        <div class="form-group">
                            <label>Accent Promo Color</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="color" v-model="edit_primary_color" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                                <input type="text" v-model="edit_primary_color" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#111111" style="flex: 1; margin: 0;">
                            </div>
                        </div>
                    </div>

                    <button type="button" class="btn btn-accent" style="margin-top: 10px; font-weight: 700; width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px; height: 44px; border-radius: 8px;" @click="savePage" :disabled="saving">
                        <span v-if="saving" class="spinner"></span>
                        <span>{{ saving ? 'Applying & Saving...' : '💾 Apply & Save Landing Page' }}</span>
                    </button>
                </div>

                <!-- Right Side: Live Sandbox Preview -->
                <div style="flex: 1.5; min-width: 450px; transition: all 0.3s ease;"
                    :style="isFullscreen ? {
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        zIndex: 99999,
                        margin: 0,
                        borderRadius: 0,
                        background: 'var(--bg-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '24px'
                    } : {}">
                    <h4 style="margin: 0 0 10px 0; color: var(--accent); display: flex; align-items: center; justify-content: space-between;" v-if="!isFullscreen">
                        <span>🖥️ Landing Page Sandbox Preview</span>
                        <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted);">Campaign Promo Routing</span>
                    </h4>

                    <!-- Browser Toolbar -->
                    <div style="display: flex; align-items: center; justify-content: space-between; background: var(--border); border: 1px solid var(--border); border-bottom: none; border-top-left-radius: 8px; border-top-right-radius: 8px; padding: 8px 12px; gap: 12px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <button type="button" class="btn" style="padding: 4px 8px; margin: 0; height: 28px; width: 28px; display: flex; align-items: center; justify-content: center; background: var(--workspace-bg); color: var(--text-main); border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s;" @click="iframeReload" title="Reload" onmouseover="this.style.background='var(--border)'" onmouseout="this.style.background='var(--workspace-bg)'">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
                            </button>
                        </div>
                        <div style="flex: 1; font-family: monospace; font-size: 0.78rem; background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%; text-align: left; user-select: none;">
                            {{ displayUrl }}
                        </div>
                        <button type="button" class="btn" style="padding: 4px 12px; margin: 0; font-size: 0.78rem; height: 28px; font-weight: 700; background: var(--text-main); color: var(--workspace-bg); border: none; border-radius: 6px; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'" @click="toggleFullscreen">
                            {{ isFullscreen ? '🗖 Collapse View' : '🗖 Fullscreen Mode' }}
                        </button>
                    </div>

                    <div :style="isFullscreen ? { flex: 1, position: 'relative' } : { height: '620px', position: 'relative' }"
                        style="border: 1px solid var(--border); border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; overflow: hidden; background: var(--workspace-bg);">
                        <iframe ref="previewIframe" class="preview-iframe" :src="previewIframeSrc" @load="handleIframeLoad" sandbox="allow-scripts allow-same-origin allow-forms" style="width: 100%; height: 100%; border: none;"></iframe>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LandingPageDesignerView',
    inject: ['app'],
    data() {
        return {
            designerBrand: null,
            saving: false,
            isFullscreen: false,
            iframeCurrentUrl: '',
            heroUploading: false,
            
            // List / Subview control
            landingPages: [],
            editingPage: null,
            editingIndex: -1,
            isNewPage: false,
            
            // Editor states
            edit_slug: '',
            edit_type: 'coupon',
            edit_product_id: null,
            edit_headline: '',
            edit_subheadline: '',
            edit_cta: '',
            edit_hero_img: '',
            edit_features: '',
            edit_coupon_code: '',
            edit_inherit: true,
            edit_primary_color: '#111111',
            landingPageContentLang: 'en',
            translatingLandingPage: false,
            edit_translations: {}
        };
    },
    computed: {
        activeBrandName() {
            if (this.app.activeShopFilter === 'all') return 'None';
            const b = this.app.brands.find(x => x.id === this.app.activeShopFilter);
            return b ? b.name : 'Unknown';
        },
        availableLocales() {
            if (this.designerBrand && this.designerBrand.languages) {
                if (Array.isArray(this.designerBrand.languages)) {
                    return this.designerBrand.languages;
                }
                if (typeof this.designerBrand.languages === 'string') {
                    return this.designerBrand.languages.split(',').map(l => l.trim()).filter(Boolean);
                }
            }
            return ['en'];
        },
        brandProducts() {
            if (!this.app.products) return [];
            return this.app.products.filter(p => p.brand_id === this.app.activeShopFilter);
        },
        previewIframeSrc() {
            if (this.app.activeShopFilter === 'all' || !this.editingPage) return '';
            const slug = this.edit_slug || 'promo-offer';
            return `/store/${this.app.activeShopFilter}/${slug}?previewBrandId=${this.app.activeShopFilter}`;
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
        }
    },
    watch: {
        'app.activeShopFilter': {
            immediate: true,
            handler() {
                this.loadBrandContext();
            }
        },
        availableLocales: {
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    newVal.forEach(lang => {
                        if (!this.edit_translations[lang]) {
                            this.edit_translations[lang] = { headline: '', subheadline: '', cta: '', features: '' };
                        }
                    });
                }
            }
        }
    },
    methods: {
        goBack() {
            if (this.editingPage) {
                this.cancelEditing();
            } else {
                this.$emit('back');
            }
        },
        loadBrandContext() {
            if (this.app.activeShopFilter !== 'all') {
                const b = this.app.brands.find(x => x.id === this.app.activeShopFilter);
                if (b) {
                    let theme = {};
                    if (b.theme_settings) {
                        try {
                            theme = JSON.parse(b.theme_settings);
                        } catch(e) {}
                    }
                    
                    this.designerBrand = {
                        ...b,
                        theme_settings: b.theme_settings || ''
                    };
                    
                    // Parse multiple pages
                    if (theme.landing_pages && Array.isArray(theme.landing_pages)) {
                        this.landingPages = theme.landing_pages;
                    } else if (theme.landing_headline) {
                        // Import legacy settings as the first page
                        this.landingPages = [{
                            id: 'promo-offer',
                            type: theme.landing_type || 'coupon',
                            product_id: theme.landing_product_id || null,
                            headline: theme.landing_headline,
                            subheadline: theme.landing_subheadline || 'Elevate your home barista journey with our award-winning tools.',
                            cta: theme.landing_cta || 'Unlock 20% Off Now',
                            hero_img: theme.landing_hero_img || 'https://pesado585.com/cdn/shop/files/LMHD_a20fcda8-4b93-430c-ba92-da68aac7be98.jpg?v=1757481591',
                            features: theme.landing_features || '⚡ Free Worldwide Shipping\n🔒 100% Precision Guaranteed\n☕ Loved by 10,000+ Baristas',
                            coupon_code: theme.landing_coupon_code || 'COFFEE20',
                            inherit: theme.landing_inherit !== false,
                            primary_color: theme.primary_color || '#111111'
                        }];
                    } else {
                        this.landingPages = [];
                    }
                }
            }
        },
        getLandingPageUrl(slug) {
            if (this.app.activeShopFilter === 'all') return '#';
            return `/store/${this.app.activeShopFilter}/${slug}`;
        },
        createNewPage() {
            this.isNewPage = true;
            this.editingIndex = -1;
            
            // Set up clean defaults
            this.edit_slug = '';
            this.edit_type = 'coupon';
            this.edit_product_id = this.brandProducts[0] ? this.brandProducts[0].id : null;
            this.edit_headline = 'Special Offer: Get 20% Off!';
            this.edit_subheadline = 'Claim your precision brewing discount instantly.';
            this.edit_cta = 'Claim Offer Now';
            this.edit_hero_img = 'https://pesado585.com/cdn/shop/files/LMHD_a20fcda8-4b93-430c-ba92-da68aac7be98.jpg?v=1757481591';
            this.edit_features = '⚡ Free Worldwide Shipping\n🔒 100% Precision Guaranteed\n☕ Loved by 10,000+ Baristas';
            this.edit_coupon_code = 'COFFEE20';
            this.edit_inherit = true;
            this.edit_primary_color = this.designerBrand ? (this.designerBrand.primary_color || '#111111') : '#111111';
            
            this.edit_translations = {};
            this.availableLocales.forEach(lang => {
                this.edit_translations[lang] = { headline: '', subheadline: '', cta: '', features: '' };
            });
            this.landingPageContentLang = 'en';
            
            this.editingPage = { id: '' };
        },
        startEditingPage(page, index) {
            this.isNewPage = false;
            this.editingIndex = index;
            
            this.edit_slug = page.id;
            this.edit_type = page.type || 'coupon';
            this.edit_product_id = page.product_id || (this.brandProducts[0] ? this.brandProducts[0].id : null);
            this.edit_headline = page.headline;
            this.edit_subheadline = page.subheadline;
            this.edit_cta = page.cta;
            this.edit_hero_img = page.hero_img;
            this.edit_features = page.features;
            this.edit_coupon_code = page.coupon_code;
            this.edit_inherit = page.inherit !== false;
            this.edit_primary_color = page.primary_color || (this.designerBrand ? (this.designerBrand.primary_color || '#111111') : '#111111');
            
            this.edit_translations = {};
            this.availableLocales.forEach(lang => {
                const tr = page.translations && page.translations[lang] ? page.translations[lang] : {};
                this.edit_translations[lang] = {
                    headline: tr.headline || '',
                    subheadline: tr.subheadline || '',
                    cta: tr.cta || '',
                    features: tr.features || ''
                };
            });
            this.landingPageContentLang = 'en';
            
            this.editingPage = { ...page };
        },
        cancelEditing() {
            this.editingPage = null;
            this.editingIndex = -1;
            this.isNewPage = false;
            this.iframeCurrentUrl = '';
        },
        async deletePage(index) {
            if (!confirm('Are you sure you want to delete this campaign landing page?')) return;
            
            const updatedPages = [...this.landingPages];
            updatedPages.splice(index, 1);
            
            await this.persistLandingPages(updatedPages);
        },
        async savePage() {
            // Slug validation
            const slugPattern = /^[a-zA-Z0-9\-_]+$/;
            if (!this.edit_slug || !slugPattern.test(this.edit_slug)) {
                alert('Please enter a valid URL slug (alphanumeric, hyphens and underscores only).');
                return;
            }
            
            // Check for uniqueness if creating new
            if (this.isNewPage) {
                const exists = this.landingPages.some(p => p.id === this.edit_slug);
                if (exists) {
                    alert('A campaign landing page with this URL slug already exists. Please choose a unique slug.');
                    return;
                }
            }

            // Featured product validation for product offer type
            if (this.edit_type === 'product' && !this.edit_product_id) {
                alert('Please select a featured showcase product.');
                return;
            }

            this.saving = true;
            
            const pageData = {
                id: this.edit_slug,
                type: this.edit_type,
                product_id: this.edit_type === 'product' ? this.edit_product_id : null,
                headline: this.edit_headline,
                subheadline: this.edit_subheadline,
                cta: this.edit_cta,
                hero_img: this.edit_hero_img,
                features: this.edit_features,
                coupon_code: this.edit_coupon_code.toUpperCase(),
                inherit: this.edit_inherit,
                primary_color: this.edit_inherit ? null : this.edit_primary_color,
                translations: this.edit_translations
            };

            const updatedPages = [...this.landingPages];
            if (this.isNewPage) {
                updatedPages.push(pageData);
            } else {
                updatedPages[this.editingIndex] = pageData;
            }

            await this.persistLandingPages(updatedPages);
            this.editingPage = null;
        },
        async persistLandingPages(pagesList) {
            let theme = {};
            if (this.designerBrand.theme_settings) {
                try {
                    theme = JSON.parse(this.designerBrand.theme_settings);
                } catch(e) {}
            }
            
            theme.landing_pages = pagesList;
            
            // Set first page as the fallback main settings for backwards compatibility
            if (pagesList.length > 0) {
                const first = pagesList[0];
                theme.landing_inherit = first.inherit;
                theme.landing_type = first.type;
                theme.landing_product_id = first.product_id;
                theme.landing_headline = first.headline;
                theme.landing_subheadline = first.subheadline;
                theme.landing_cta = first.cta;
                theme.landing_hero_img = first.hero_img;
                theme.landing_features = first.features;
                theme.landing_coupon_code = first.coupon_code;
                if (!first.inherit && first.primary_color) {
                    theme.primary_color = first.primary_color;
                }
            }
            
            this.designerBrand.theme_settings = JSON.stringify(theme);
            
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify(this.designerBrand)
                });
                if (response.ok) {
                    this.app.showNotification('Campaign pages updated successfully.');
                    await this.app.loadBrands();
                    this.loadBrandContext();
                } else {
                    alert('Error saving brand landing configurations.');
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            } finally {
                this.saving = false;
            }
        },
        toggleFullscreen() {
            this.isFullscreen = !this.isFullscreen;
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
                    this.iframeCurrentUrl = iframe.contentWindow.location.href;
                }
            } catch(e) {}
        },
        onDragOver(e) {
            e.currentTarget.style.borderColor = 'var(--text-main)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        },
        onDragLeave(e) {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.005)';
        },
        async onHeroDrop(e) {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.005)';
            const file = e.dataTransfer.files[0];
            if (file) {
                await this.uploadAsset(file);
            }
        },
        async onHeroFileSelect(e) {
            const file = e.target.files[0];
            if (file) {
                await this.uploadAsset(file);
            }
        },
        async uploadAsset(file) {
            this.heroUploading = true;
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
                    this.edit_hero_img = data.url;
                    this.app.showNotification('Hero image uploaded successfully!');
                } else {
                    const err = await response.json();
                    alert(`Upload failed: ${err.error || response.statusText}`);
                }
            } catch (err) {
                alert(`Upload error: ${err.message}`);
            } finally {
                this.heroUploading = false;
            }
        },
        async translateLandingPageWithAI(targetLang) {
            if (!this.edit_headline && !this.edit_subheadline && !this.edit_cta && !this.edit_features) {
                alert('Please enter some text in English first to translate.');
                return;
            }
            
            this.translatingLandingPage = true;
            try {
                const fields = ['headline', 'subheadline', 'cta', 'features'];
                for (const field of fields) {
                    const val = this['edit_' + field];
                    if (val) {
                        const response = await fetch('/api/global/translate', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.app.adminToken}`
                            },
                            body: JSON.stringify({
                                text: val,
                                targetLang: targetLang,
                                sourceLang: 'en'
                            })
                        });
                        if (response.ok) {
                            const res = await response.json();
                            this.edit_translations[targetLang][field] = res.translatedText;
                        }
                    }
                }
                this.app.showNotification(`Successfully auto-translated landing page copy to ${targetLang.toUpperCase()}!`);
            } catch(e) {
                console.error(e);
                alert('AI translation error: ' + e.message);
            } finally {
                this.translatingLandingPage = false;
            }
        }
    }
};
</script>

<style scoped>
.designer-workspace-layout {
    width: 100%;
}
.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
}
.form-group label {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-main);
}
.form-group input[type="text"] {
    height: 38px;
    padding: 0 10px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--workspace-bg);
    color: var(--text-main);
}
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

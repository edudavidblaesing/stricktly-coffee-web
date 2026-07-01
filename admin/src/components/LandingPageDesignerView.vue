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
                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn btn-accent" style="margin: 0; font-weight: 700; height: 38px; display: flex; align-items: center; gap: 8px;" @click="triggerAIPageBuilder">
                            <span v-if="!app.isFeatureAllowed('allow_page_builder')">🔒 Generate Page with AI</span>
                            <span v-else>🤖 Generate Page with AI</span>
                        </button>
                        <button type="button" class="btn btn-accent" style="margin: 0; font-weight: 700; height: 38px; display: flex; align-items: center; gap: 8px; background: var(--workspace-bg); color: var(--text-main); border: 1px solid var(--border);" @click="createNewPage">
                            ➕ Create Campaign Page
                        </button>
                    </div>
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
            <div v-else class="designer-workspace-layout" style="display: grid; grid-template-columns: 320px 1fr; gap: 0px; align-items: stretch; min-height: calc(100vh - 120px); width: 100%;">
                <!-- Left Side: Customizer Controls (Consistent Sidebar Layout Tree) -->
                <div style="display: flex; flex-direction: column; gap: 16px; padding: 16px; background: var(--card-bg); border-right: 1px solid var(--border); box-sizing: border-box; overflow-y: auto;">
                    
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 10px; gap: 8px;">
                        <h4 style="margin: 0; color: var(--accent); font-weight: 700; font-size: 0.9rem; text-transform: uppercase;">
                            {{ isNewPage ? '➕ New Campaign' : '✏️ Edit Campaign' }}
                        </h4>
                        <button type="button" class="btn" style="padding: 4px 8px; font-size: 0.78rem; height: 28px; background: var(--workspace-bg); border: 1px solid var(--border); color: var(--text-muted); margin: 0;" @click="cancelEditing">
                            Cancel
                        </button>
                    </div>

                    <!-- Subview A: If a section is selected: Render its Settings Inspector -->
                    <div v-if="selectedSectionId" style="display: flex; flex-direction: column; gap: 14px;">
                        <div style="display: flex; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 8px; gap: 8px;">
                            <button type="button" class="btn" style="padding: 2px 6px; margin: 0; font-size: 0.9rem; height: 24px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main);" @click="selectedSectionId = ''" title="Back">
                                ←
                            </button>
                            <h4 style="margin: 0; color: var(--accent); font-weight: 700; font-size: 0.82rem; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
                                {{ getSelectedSectionTitle() }} Settings
                            </h4>
                        </div>

                        <!-- INSPECTOR: CAMPAIGN SETTINGS -->
                        <div v-if="selectedSectionId === 'campaign'" style="display: flex; flex-direction: column; gap: 12px;">
                            <div class="form-group">
                                <label>URL Slug / Path Address</label>
                                <input type="text" v-model="edit_slug" :disabled="!isNewPage" placeholder="promo-offer" style="width: 100%; font-family: monospace;">
                                <span style="font-size: 0.7rem; color: var(--text-muted);">Matches <code>/store/:brandId/{{ edit_slug || '[slug]' }}</code>. Alphanumeric and hyphens only. Unique.</span>
                            </div>

                            <div class="form-group">
                                <label>Campaign Action / Goal</label>
                                <select v-model="edit_type" style="width: 100%;">
                                    <option value="coupon">Lead Capture (Award Discount Coupon on Signup)</option>
                                    <option value="product">Direct Product Showcase (One-Click Buy with discount applied)</option>
                                </select>
                            </div>

                            <div v-if="edit_type === 'product'" class="form-group" style="border-left: 2px solid var(--accent); padding-left: 12px;">
                                <label>Featured Showcase Product</label>
                                <select v-model="edit_product_id" style="width: 100%;">
                                    <option v-for="prod in brandProducts" :key="prod.id" :value="prod.id">
                                        {{ prod.title }} - €{{ Number(prod.price).toFixed(2) }}
                                    </option>
                                </select>
                                <span v-if="brandProducts.length === 0" style="font-size: 0.72rem; color: #ef4444; display: block; margin-top: 4px;">⚠️ No products found for this store.</span>
                            </div>

                            <div class="form-group">
                                <label>Promo Code to Award/Apply</label>
                                <input type="text" v-model="edit_coupon_code" placeholder="COFFEE20" style="width: 100%; text-transform: uppercase;">
                            </div>
                        </div>

                        <!-- INSPECTOR: HERO CONTENT -->
                        <div v-if="selectedSectionId === 'hero'" style="display: flex; flex-direction: column; gap: 12px;">
                            <!-- Language tabs for Copy -->
                            <div v-if="availableLocales && availableLocales.length > 1" style="margin-bottom: 4px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                                <span style="display: block; margin-bottom: 6px; font-weight: 700; color: var(--text-muted); font-size: 0.75rem;">Language Variant:</span>
                                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                                    <button v-for="lang in availableLocales" :key="lang" type="button" @click="landingPageContentLang = lang"
                                            class="btn btn-secondary" style="font-size: 0.68rem; padding: 2px 6px; height: auto; font-weight: 700;"
                                            :style="landingPageContentLang === lang ? 'background: var(--text-main); color: var(--workspace-bg); border-color: var(--text-main);' : ''">
                                        {{ lang.toUpperCase() }}
                                    </button>
                                </div>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">Copy Editor</span>
                                <button v-if="landingPageContentLang !== 'en'" type="button" class="sc-ai-button" style="font-size: 0.65rem; padding: 2px 6px; height: 22px;" @click="toggleTranslateLandingPage(landingPageContentLang)">
                                    <span v-if="translatingLandingPage">⏳ Translating...</span>
                                    <span v-else>✨ AI Translate from EN</span>
                                </button>
                            </div>

                            <div class="form-group">
                                <label>Hero Headline</label>
                                <input v-if="landingPageContentLang === 'en'" type="text" v-model="edit_headline" placeholder="Exclusive Promo Offer" style="width: 100%;">
                                <input v-else type="text" v-model="edit_translations[landingPageContentLang].headline" placeholder="[AI Translation Pending]" style="width: 100%;">
                            </div>

                            <div class="form-group">
                                <label>Subheadline / Description</label>
                                <input v-if="landingPageContentLang === 'en'" type="text" v-model="edit_subheadline" placeholder="Claim this exclusive deal..." style="width: 100%;">
                                <input v-else type="text" v-model="edit_translations[landingPageContentLang].subheadline" placeholder="[AI Translation Pending]" style="width: 100%;">
                            </div>

                            <div class="form-group">
                                <label>CTA Button Text</label>
                                <input v-if="landingPageContentLang === 'en'" type="text" v-model="edit_cta" placeholder="Unlock Offer" style="width: 100%;">
                                <input v-else type="text" v-model="edit_translations[landingPageContentLang].cta" placeholder="[AI Translation Pending]" style="width: 100%;">
                            </div>

                            <!-- Hero Image Dropzone -->
                            <div class="form-group">
                                <label>Hero Campaign Image</label>
                                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                                    <input type="text" v-model="edit_hero_img" placeholder="https://..." style="flex: 1; margin: 0;">
                                </div>
                                <div class="dropzone" 
                                     style="border: 2px dashed var(--border); border-radius: 8px; padding: 12px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.005);"
                                     @dragover.prevent="onDragOver" 
                                     @dragleave.prevent="onDragLeave" 
                                     @drop.prevent="onHeroDrop"
                                     @click="$refs.heroFile.click()"
                                >
                                    <span v-if="heroUploading" class="spinner"></span>
                                    <div v-else style="font-size: 0.72rem; color: var(--text-muted);">
                                        🖼️ Drag image or click to browse
                                    </div>
                                    <input type="file" ref="heroFile" accept="image/*" style="display: none;" @change="onHeroFileSelect">
                                </div>
                            </div>
                        </div>

                        <!-- INSPECTOR: FEATURES highlights -->
                        <div v-if="selectedSectionId === 'features'" style="display: flex; flex-direction: column; gap: 12px;">
                            <!-- Language Variant -->
                            <div v-if="availableLocales && availableLocales.length > 1" style="margin-bottom: 4px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                                <span style="display: block; margin-bottom: 6px; font-weight: 700; color: var(--text-muted); font-size: 0.75rem;">Language Variant:</span>
                                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                                    <button v-for="lang in availableLocales" :key="lang" type="button" @click="landingPageContentLang = lang"
                                            class="btn btn-secondary" style="font-size: 0.68rem; padding: 2px 6px; height: auto; font-weight: 700;"
                                            :style="landingPageContentLang === lang ? 'background: var(--text-main); color: var(--workspace-bg); border-color: var(--text-main);' : ''">
                                        {{ lang.toUpperCase() }}
                                    </button>
                                </div>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">USPs List</span>
                                <button v-if="landingPageContentLang !== 'en'" type="button" class="sc-ai-button" style="font-size: 0.65rem; padding: 2px 6px; height: 22px;" @click="toggleTranslateLandingPage(landingPageContentLang)">
                                    <span v-if="translatingLandingPage">⏳ Translating...</span>
                                    <span v-else>✨ AI Translate from EN</span>
                                </button>
                            </div>

                            <div class="form-group">
                                <label>USPs Highlights (one per line)</label>
                                <textarea v-if="landingPageContentLang === 'en'" v-model="edit_features" rows="4" style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px; background: var(--workspace-bg); color: var(--text-main); font-size: 0.8rem; resize: vertical;" placeholder="⚡ Free Shipping&#10;☕ Precision Extraction&#10;🔒 Lifetime Guarantee"></textarea>
                                <textarea v-else v-model="edit_translations[landingPageContentLang].features" rows="4" style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px; background: var(--workspace-bg); color: var(--text-main); font-size: 0.8rem; resize: vertical;" placeholder="[AI Translation Pending]"></textarea>
                            </div>
                        </div>

                        <!-- INSPECTOR: STYLE OVERRIDES -->
                        <div v-if="selectedSectionId === 'style'" style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; background: var(--workspace-bg); padding: 10px; border-radius: 6px; border: 1px solid var(--border);">
                                <input type="checkbox" id="landing-inherit-toggle" v-model="edit_inherit" style="width: 16px; height: 16px; cursor: pointer; margin: 0;">
                                <label for="landing-inherit-toggle" style="font-weight: 700; color: var(--text-main); font-size: 0.78rem; cursor: pointer; margin: 0;">
                                    Match Storefront Theme Layout
                                </label>
                            </div>

                            <div v-if="!edit_inherit" class="form-group" style="border-left: 2px solid var(--accent); padding-left: 12px; margin-top: 2px;">
                                <label>Custom Accent Color</label>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <input type="color" v-model="edit_primary_color" style="width: 38px; height: 32px; padding: 2px; border-radius: 4px; border: 1px solid var(--border); background: none; cursor: pointer; margin: 0;">
                                    <input type="text" v-model="edit_primary_color" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#111111" style="flex: 1; margin: 0;">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Subview B: Otherwise: Render General Layout Sections List (Mirroring Storefront Designer) -->
                    <div v-else style="display: flex; flex-direction: column; gap: 10px; flex: 1;">
                        <h5 style="margin: 0; color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Campaign Page Blocks</h5>

                        <div class="section-tree-item" :class="{ active: selectedSectionId === 'campaign' }" @click="selectedSectionId = 'campaign'"
                             style="background: var(--workspace-bg); border: 1px solid var(--border); padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; border-left: 3px solid var(--accent);">
                            <span>🏷️</span>
                            <div style="flex: 1;">
                                <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block;">Campaign Settings</span>
                                <span style="font-size: 0.65rem; color: var(--text-muted);">Slug, Goal, Showcase Product</span>
                            </div>
                        </div>

                        <div class="section-tree-item" :class="{ active: selectedSectionId === 'hero' }" @click="selectedSectionId = 'hero'"
                             style="background: var(--workspace-bg); border: 1px solid var(--border); padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; border-left: 3px solid var(--accent);">
                            <span>🌄</span>
                            <div style="flex: 1;">
                                <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block;">Hero Content Block</span>
                                <span style="font-size: 0.65rem; color: var(--text-muted);">Headline, Subheadline, Button, Image</span>
                            </div>
                        </div>

                        <div class="section-tree-item" :class="{ active: selectedSectionId === 'features' }" @click="selectedSectionId = 'features'"
                             style="background: var(--workspace-bg); border: 1px solid var(--border); padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; border-left: 3px solid var(--accent);">
                            <span>⚡</span>
                            <div style="flex: 1;">
                                <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block;">USPs highlights Block</span>
                                <span style="font-size: 0.65rem; color: var(--text-muted);">Feature points, benefit hooks</span>
                            </div>
                        </div>

                        <div class="section-tree-item" :class="{ active: selectedSectionId === 'style' }" @click="selectedSectionId = 'style'"
                             style="background: var(--workspace-bg); border: 1px solid var(--border); padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; border-left: 3px solid var(--accent);">
                            <span>🎨</span>
                            <div style="flex: 1;">
                                <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block;">Visual Styles Override</span>
                                <span style="font-size: 0.65rem; color: var(--text-muted);">Match storefront toggle, Custom accent</span>
                            </div>
                        </div>
                    </div>

                    <!-- Bottom Actions (Publish / Reset Rebuild) -->
                    <div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--border); padding-top: 12px;">
                        <button type="button" class="btn btn-secondary" style="margin: 0; font-weight: 700; height: 36px; font-size: 0.78rem; display: flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid var(--accent); color: var(--accent); background: transparent;" @click="openRebuildModal">
                            <span>✨ Rebuild Page</span>
                        </button>
                        <button type="button" class="btn btn-accent" style="margin: 0; font-weight: 700; width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px; height: 40px; border-radius: 8px;" @click="savePage" :disabled="saving">
                            <span v-if="saving" class="spinner"></span>
                            <span>{{ saving ? 'Publishing Live...' : '🚀 Publish Live to Storefront' }}</span>
                        </button>
                    </div>
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
                        <span style="display: flex; align-items: center; gap: 8px;">
                            🖥️ Landing Page Sandbox Preview
                            <span v-if="hasUnsavedChanges" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
                                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #f59e0b;"></span>
                                Interactive Sandbox Draft
                            </span>
                            <span v-else style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
                                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
                                Published & Synced
                            </span>
                        </span>
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

            <!-- AI Campaign Page Generator Modal Dialog -->
            <div v-if="showAIModal" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100000; padding: 20px;">
                <div style="background: var(--bg-color, #181d1a); border: 1px solid var(--border); border-radius: 12px; width: 100%; max-width: 520px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
                        <h4 style="margin: 0; color: var(--accent); font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                            🤖 AI Landing Page Generator
                        </h4>
                        <button type="button" @click="showAIModal = false" style="background: none; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; padding: 0;">✕</button>
                    </div>

                    <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 15px; line-height: 1.4;">
                        Input a marketing angle or promotion concept. The AI reads your <strong>Brand Strategy Playbook</strong> and auto-crafts layout structure, headings, CTA actions, coupon hooks, and features list copy.
                    </div>

                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px; display: block;">Campaign Theme / Promotion Goal</label>
                        <textarea v-model="aiModalPrompt" rows="3" placeholder="e.g. Black Friday discount page offering 25% off our self-leveling espresso tampers..." style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; outline: none; resize: vertical; margin: 0;"></textarea>
                    </div>

                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px; display: block;">Associated Catalog Product (Optional)</label>
                        <select v-model="aiModalProductId" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 10px; outline: none;">
                            <option value="">-- No linked product --</option>
                            <option v-for="p in brandProducts" :key="p.id" :value="p.id">{{ p.title }}</option>
                        </select>
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: stretch; gap: 8px;">
                        <div style="display: flex; justify-content: flex-end; gap: 10px;">
                            <button type="button" class="btn" style="margin: 0; height: 36px; border: 1px solid var(--border);" @click="showAIModal = false" :disabled="generatingAIPage">Cancel</button>
                            <button type="button" class="sc-ai-button" style="margin: 0; height: 36px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;" :disabled="!aiModalPrompt" @click="toggleGenerateAIPage">
                                <template v-if="generatingAIPage">
                                    <span v-if="app.userRole && app.userRole.toLowerCase() === 'superadmin'">⏳ [€{{ (app.aiTicker.cost * 0.92).toFixed(4) }} | 🛑 Stop]</span>
                                    <span v-else>⏳ Generating page structure... | 🛑 Stop</span>
                                </template>
                                <template v-else-if="lastGeneratingAIPageCost">
                                    <span v-if="app.userRole && app.userRole.toLowerCase() === 'superadmin'">✨ Generate & Add Page [Gemini 2.5 Flash] [Last: €{{ lastGeneratingAIPageCost.toFixed(4) }}]</span>
                                    <span v-else>✨ Generate & Add Page</span>
                                </template>
                                <template v-else>
                                    <span v-if="app.userRole && app.userRole.toLowerCase() === 'superadmin'">✨ Generate & Add Page [Gemini 2.5 Flash] [~$0.0006]</span>
                                    <span v-else>✨ Generate & Add Page</span>
                                </template>
                            </button>
                        </div>
                        <div v-if="pageGenAiStats && pageGenAiStats.calls_count > 0 && app.userRole && app.userRole.toLowerCase() === 'superadmin'" style="text-align: right; font-size: 0.72rem; color: var(--text-muted);">
                            📊 Brand Page Generations: <strong>{{ pageGenAiStats.calls_count }}</strong> ({{ formatTokens(pageGenAiStats.total_tokens) }} tokens | €{{ (pageGenAiStats.cost_usd * 0.92).toFixed(4) }})
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- REBUILD WORKSPACE MODAL -->
        <div v-if="showRebuildModal" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); z-index: 100000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
            <div class="panel" style="width: 100%; max-width: 550px; border-radius: 12px; overflow: hidden; background: var(--panel-bg); border: 1px solid var(--border); box-shadow: 0 10px 40px rgba(0,0,0,0.6); margin: 20px;">
                <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border);">
                    <h3 class="panel-title" style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                        <span>✨</span> Rebuild Page Workspace
                    </h3>
                    <button type="button" @click="showRebuildModal = false" style="background: none; border: none; color: var(--text-muted); font-size: 1.4rem; cursor: pointer; line-height: 1;">&times;</button>
                </div>
                
                <div style="padding: 20px; display: flex; flex-direction: column; gap: 18px;">
                    <!-- Option 1: Static reset -->
                    <div style="padding: 16px; border: 1px solid var(--border); border-radius: 8px; background: rgba(255,255,255,0.01);">
                        <h4 style="margin: 0 0 6px 0; font-size: 0.9rem; font-weight: 700; color: var(--text-main);">Option A: Apply Static Brand-Consistent Design</h4>
                        <p style="margin: 0 0 12px 0; font-size: 0.76rem; color: var(--text-muted); line-height: 1.4;">
                            Resets the layout structure, typography, and sections to a clean default design tailored directly to your brand settings, primary color, and products. Completely static, no AI limits or prompt required.
                        </p>
                        <button type="button" class="btn btn-secondary" style="margin: 0; font-size: 0.8rem; font-weight: 700; height: 36px; padding: 0 16px; border-color: var(--accent); color: var(--accent);" @click="triggerStaticRebuild">
                            🔄 Apply Static Brand Design
                        </button>
                    </div>

                    <!-- Option 2: AI Customise -->
                    <div style="padding: 16px; border: 1px solid var(--border); border-radius: 8px; background: rgba(255,255,255,0.01); display: flex; flex-direction: column; gap: 10px; position: relative;">
                        <h4 style="margin: 0; font-size: 0.9rem; font-weight: 700; color: var(--text-main);">Option B: AI-Guided Customization & Rebuild</h4>
                        <p style="margin: 0; font-size: 0.76rem; color: var(--text-muted); line-height: 1.4;">
                            Prompt your AI Designer. Use <strong>@ tags</strong> to direct copywriting to target personas, prioritize categories, or showcase specific products.
                        </p>
                        
                        <div style="position: relative;">
                            <textarea ref="rebuildPromptInput" v-model="rebuildPrompt" @input="handleRebuildPromptInput" placeholder="Describe the look/feel or content... e.g. A dark slate slate targeting @barista showcasing @tamper products" style="width: 100%; height: 90px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 10px; font-size: 0.8rem; font-family: var(--font-body); resize: vertical; margin: 0; outline: none;"></textarea>
                            
                            <!-- Autocomplete list -->
                            <div v-if="showAutocomplete" style="position: absolute; bottom: 100%; left: 0; width: 100%; max-height: 180px; overflow-y: auto; background: var(--panel-bg); border: 1px solid var(--border); border-radius: 6px; box-shadow: 0 -4px 16px rgba(0,0,0,0.5); z-index: 100020; margin-bottom: 4px; display: flex; flex-direction: column;">
                                <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; padding: 6px 10px; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border);">Select suggestion tag</div>
                                <button v-for="tag in filteredAutocompleteTags" :key="tag.value" type="button" @click="insertAutocompleteTag(tag)" style="padding: 8px 12px; text-align: left; background: none; border: none; color: var(--text-main); font-size: 0.75rem; cursor: pointer; display: flex; flex-direction: column; width: 100%; border-bottom: 1px solid rgba(255,255,255,0.01);" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='none'">
                                    <span style="font-weight: 700; color: var(--accent);">{{ tag.label }}</span>
                                    <span style="font-size: 0.65rem; color: var(--text-muted);">{{ tag.description }}</span>
                                </button>
                            </div>
                        </div>

                        <!-- Tag Pills Helper -->
                        <div>
                            <span style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 6px; font-weight: 600;">Type <strong>@</strong> (personas/products), <strong>%</strong> (coupons), <strong>&amp;</strong> (audiences), <strong>#</strong> (channels), or <strong>/</strong> (commands) for suggestions, or click to insert:</span>
                            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                <span class="tag-pill" style="cursor: pointer; background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 4px; padding: 2px 8px; font-size: 0.7rem; font-weight: 700; color: var(--text-main);" @click="insertAutocompleteTag({value:'@barista'})">👤 @barista</span>
                                <span class="tag-pill" style="cursor: pointer; background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 4px; padding: 2px 8px; font-size: 0.7rem; font-weight: 700; color: var(--text-main);" @click="insertAutocompleteTag({value:'%SAVE20'})">🏷️ %SAVE20</span>
                                <span class="tag-pill" style="cursor: pointer; background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 4px; padding: 2px 8px; font-size: 0.7rem; font-weight: 700; color: var(--text-main);" @click="insertAutocompleteTag({value:'&amp;past-purchasers'})">👥 &amp;past-purchasers</span>
                                <span class="tag-pill" style="cursor: pointer; background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 4px; padding: 2px 8px; font-size: 0.7rem; font-weight: 700; color: var(--text-main);" @click="insertAutocompleteTag({value:'#meta'})">📢 #meta</span>
                                <span class="tag-pill" style="cursor: pointer; background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 4px; padding: 2px 8px; font-size: 0.7rem; font-weight: 700; color: var(--text-main);" @click="insertAutocompleteTag({value:'/rebuild'})">⚡ /rebuild</span>
                            </div>
                        </div>

                        <button type="button" class="btn btn-accent" style="margin: 6px 0 0 0; font-size: 0.8rem; font-weight: 700; height: 38px; display: flex; align-items: center; justify-content: center; gap: 8px;" @click="triggerAIRebuild" :disabled="isRebuildingAI">
                            <span v-if="isRebuildingAI" class="spinner"></span>
                            <span>{{ isRebuildingAI ? 'Generating Creative Layout...' : '✨ Generate Layout with AI' }}</span>
                        </button>
                    </div>

                    <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
                        <button type="button" class="btn" style="margin: 0; background: transparent; border: 1px solid var(--border); color: var(--text-main);" @click="showRebuildModal = false">Cancel</button>
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
            originalPageState: '',
            
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
            lastTranslatingLandingPageCost: null,
            edit_translations: {},
            showAIModal: false,
            aiModalPrompt: '',
            aiModalProductId: '',
            
            // Rebuild & Section Tree states
            selectedSectionId: '',
            showRebuildModal: false,
            rebuildPrompt: '',
            showAutocomplete: false,
            autocompleteSearch: '',
            activeTriggerSymbol: '',
            audiences: [],
            isRebuildingAI: false,
            generatingAIPage: false,
            lastGeneratingAIPageCost: null,
            autoUpdatePreview: true,
            aiUsageBreakdown: []
        };
    },
    computed: {
        autocompleteTags() {
            const list = [];
            const symbol = this.activeTriggerSymbol || '@';
            
            if (symbol === '@') {
                list.push(
                    { label: '@barista', value: '@barista', description: 'Technical Barista target audience' },
                    { label: '@curator', value: '@curator', description: 'Design Purist / Aesthetic Curator target' },
                    { label: '@home-brewer', value: '@home-brewer', description: 'Home Brewer target audience' },
                    { label: '@tamper', value: '@tamper', description: 'Filter by Tampers collection' },
                    { label: '@basket', value: '@basket', description: 'Filter by Precision Baskets collection' },
                    { label: '@milk', value: '@milk', description: 'Filter by Milk Jugs collection' },
                    { label: '@accessory', value: '@accessory', description: 'Filter by Accessories collection' },
                    { label: '@service-training', value: '@service-training', description: 'Technical Barista Training Session' },
                    { label: '@service-consultancy', value: '@service-consultancy', description: 'Café Layout & Flow Consulting' }
                );
                
                // Add products
                const prods = this.app.products ? this.app.products.filter(p => p.brand_id === this.app.activeShopFilter) : [];
                prods.forEach(p => {
                    list.push({
                        label: `@inventory-${p.id}`,
                        value: `@inventory-${p.id}`,
                        description: p.title
                    });
                });
            } else if (symbol === '%') {
                if (this.app.coupons && this.app.coupons.length > 0) {
                    this.app.coupons.forEach(c => {
                        list.push({
                            label: `%${c.code.toUpperCase()}`,
                            value: `%${c.code.toUpperCase()}`,
                            description: `Discount Coupon: ${c.code}`
                        });
                    });
                } else {
                    list.push(
                        { label: '%SAVE20', value: '%SAVE20', description: 'Fallback: 20% discount coupon' },
                        { label: '%WELCOME10', value: '%WELCOME10', description: 'Fallback: 10% welcome coupon' }
                    );
                }
            } else if (symbol === '&') {
                if (this.audiences && this.audiences.length > 0) {
                    this.audiences.forEach(aud => {
                        list.push({
                            label: `&${aud.id}`,
                            value: `&${aud.id}`,
                            description: `Audience Segment: ${aud.name}`
                        });
                    });
                } else {
                    list.push(
                        { label: '&past-purchasers', value: '&past-purchasers', description: 'Fallback: Customers who purchased previously' },
                        { label: '&lookalike-vips', value: '&lookalike-vips', description: 'Fallback: Lookalike 1% of high value spenders' }
                    );
                }
            } else if (symbol === '#') {
                list.push(
                    { label: '#meta', value: '#meta', description: 'Meta Facebook / Instagram Ad Traffic' },
                    { label: '#google', value: '#google', description: 'Google search and display traffic' },
                    { label: '#tiktok', value: '#tiktok', description: 'TikTok feed and post traffic' },
                    { label: '#email', value: '#email', description: 'Newsletter or automated email traffic' },
                    { label: '#instagram', value: '#instagram', description: 'Instagram bio or story traffic' }
                );
            } else if (symbol === '/') {
                list.push(
                    { label: '/rebuild', value: '/rebuild', description: 'Command: Rebuild sections layout strategy' },
                    { label: '/translate-de', value: '/translate-de', description: 'Command: Translate entire copywriting to German' },
                    { label: '/translate-fr', value: '/translate-fr', description: 'Command: Translate entire copywriting to French' },
                    { label: '/dark-mode', value: '/dark-mode', description: 'Command: Force deep carbon/slate dark themes' },
                    { label: '/light-mode', value: '/light-mode', description: 'Command: Force warm cream/beige minimal themes' }
                );
            }
            return list;
        },
        filteredAutocompleteTags() {
            if (!this.autocompleteSearch) return this.autocompleteTags;
            const searchVal = this.autocompleteSearch.toLowerCase();
            return this.autocompleteTags.filter(t => {
                const cleanTagVal = t.value.substring(1).toLowerCase();
                return cleanTagVal.includes(searchVal) || t.value.toLowerCase().includes(searchVal);
            });
        },
        currentPageState() {
            return JSON.stringify({
                edit_slug: this.edit_slug,
                edit_type: this.edit_type,
                edit_product_id: this.edit_product_id,
                edit_headline: this.edit_headline,
                edit_subheadline: this.edit_subheadline,
                edit_cta: this.edit_cta,
                edit_hero_img: this.edit_hero_img,
                edit_features: this.edit_features,
                edit_coupon_code: this.edit_coupon_code,
                edit_inherit: this.edit_inherit,
                edit_primary_color: this.edit_primary_color,
                edit_translations: this.edit_translations
            });
        },
        hasUnsavedChanges() {
            if (!this.originalPageState || !this.editingPage) return false;
            return this.currentPageState !== this.originalPageState;
        },
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
        translateAiStats() {
            if (!this.aiUsageBreakdown) return { calls_count: 0, total_tokens: 0, cost_usd: 0 };
            return this.aiUsageBreakdown.find(b => b.operation === 'AI Copy Translation') || { calls_count: 0, total_tokens: 0, cost_usd: 0 };
        },
        pageGenAiStats() {
            if (!this.aiUsageBreakdown) return { calls_count: 0, total_tokens: 0, cost_usd: 0 };
            return this.aiUsageBreakdown.find(b => b.operation === 'Campaign Page Structure Generation') || { calls_count: 0, total_tokens: 0, cost_usd: 0 };
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
        },
        editState() {
            return {
                id: this.edit_slug,
                type: this.edit_type,
                product_id: this.edit_product_id,
                headline: this.edit_headline,
                subheadline: this.edit_subheadline,
                cta: this.edit_cta,
                hero_img: this.edit_hero_img,
                features: this.edit_features,
                coupon_code: this.edit_coupon_code,
                inherit: this.edit_inherit,
                primary_color: this.edit_primary_color,
                translations: this.edit_translations
            };
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
        },
        editState: {
            deep: true,
            handler() {
                if (this.autoUpdatePreview) {
                    this.updatePreviewLandingPage();
                }
            }
        },
        autoUpdatePreview(newVal) {
            if (newVal) {
                this.updatePreviewLandingPage();
            }
        }
    },
    methods: {
        getSelectedSectionTitle() {
            if (this.selectedSectionId === 'campaign') return 'Campaign Settings';
            if (this.selectedSectionId === 'hero') return 'Hero Content';
            if (this.selectedSectionId === 'features') return 'Feature Highlights';
            if (this.selectedSectionId === 'style') return 'Style Overrides';
            return 'Block';
        },
        openRebuildModal() {
            this.rebuildPrompt = '';
            this.showAutocomplete = false;
            this.autocompleteSearch = '';
            this.showRebuildModal = true;
        },
        handleRebuildPromptInput(e) {
            const text = this.rebuildPrompt;
            const cursor = e.target.selectionStart;
            const beforeCursor = text.substring(0, cursor);
            const match = beforeCursor.match(/([@%&#\/])(\w*)$/);
            if (match) {
                this.activeTriggerSymbol = match[1];
                this.showAutocomplete = true;
                this.autocompleteSearch = match[2].toLowerCase();
            } else {
                this.showAutocomplete = false;
                this.activeTriggerSymbol = '';
            }
        },
        insertAutocompleteTag(tag) {
            const text = this.rebuildPrompt;
            const textarea = this.$refs.rebuildPromptInput;
            const cursor = textarea ? textarea.selectionStart : text.length;
            const beforeCursor = text.substring(0, cursor);
            const afterCursor = text.substring(cursor);
            const beforeTag = beforeCursor.replace(/([@%&#\/])(\w*)$/, '');
            this.rebuildPrompt = beforeTag + tag.value + ' ' + afterCursor;
            this.showAutocomplete = false;
            this.activeTriggerSymbol = '';
            this.$nextTick(() => {
                if (textarea) {
                    textarea.focus();
                    const newPos = beforeTag.length + tag.value.length + 1;
                    textarea.setSelectionRange(newPos, newPos);
                }
            });
        },
        triggerStaticRebuild() {
            const firstProduct = this.app.products ? this.app.products.find(p => p.brand_id === this.app.activeShopFilter) : null;
            this.edit_headline = `Exclusive ${this.activeBrandName} Promotion`;
            this.edit_subheadline = 'Experience state-of-the-art precision tools designed for absolute extraction consistency.';
            this.edit_cta = 'Get 20% Off Now';
            this.edit_coupon_code = `${this.activeBrandName.substring(0, 4).toUpperCase()}20`;
            this.edit_features = `⚡ Precision Engineering\n☕ Zero Channeling Guarantee\n📦 Worldwide Express Shipping`;
            this.edit_type = firstProduct ? 'product' : 'coupon';
            this.edit_product_id = firstProduct ? firstProduct.id : null;
            this.edit_inherit = true;
            this.updatePreviewLandingPage();
            this.app.showNotification('✨ Rebuilt page copy to static brand template!');
            this.showRebuildModal = false;
        },
        async triggerAIRebuild() {
            if (!this.rebuildPrompt.trim()) {
                alert('Please enter a description or prompt for the AI builder.');
                return;
            }
            this.isRebuildingAI = true;
            const tier = this.designerBrand ? this.designerBrand.ai_tier : 'professional';
            let modelName = 'gemini-3.1-pro';
            if (tier === 'standard') modelName = 'gemini-2.5-flash';
            else if (tier === 'enterprise') modelName = 'deep-research-pro-preview';
            this.app.startAiTicker(modelName);
            
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.designerBrand.id}/generate-ai-page`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ prompt: this.rebuildPrompt, productId: this.edit_product_id })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.page) {
                        this.edit_headline = data.page.headline || this.edit_headline;
                        this.edit_subheadline = data.page.subheadline || this.edit_subheadline;
                        this.edit_cta = data.page.cta || this.edit_cta;
                        this.edit_coupon_code = data.page.coupon_code || this.edit_coupon_code;
                        this.edit_features = data.page.features || this.edit_features;
                        this.edit_type = data.page.type || this.edit_type;
                        this.edit_product_id = data.page.product_id || this.edit_product_id;
                        
                        this.updatePreviewLandingPage();
                        this.app.showNotification('✨ AI Landing Page content rebuilt successfully!');
                        this.showRebuildModal = false;
                        
                        // Clean up duplicate page created in database
                        await this.app.loadBrands();
                        const currentBrand = this.app.brands.find(b => b.id === this.designerBrand.id);
                        if (currentBrand && currentBrand.theme_settings) {
                            try {
                                const theme = JSON.parse(currentBrand.theme_settings);
                                if (theme.landing_pages) {
                                    const cleanedPages = theme.landing_pages.filter(p => p.id !== data.page.id);
                                    await this.persistLandingPages(cleanedPages);
                                }
                            } catch(e) {
                                console.error('Error parsing brand theme settings during cleanup:', e);
                            }
                        }
                    }
                } else {
                    const err = await response.json();
                    alert('AI Landing Page Rebuild error: ' + (err.error || 'Unknown error'));
                }
            } catch (e) {
                alert('AI Rebuild network error: ' + e.message);
            } finally {
                this.isRebuildingAI = false;
                this.app.stopAiTicker();
            }
        },
        async loadAiUsage() {
            if (!this.designerBrand || !this.designerBrand.id || this.designerBrand.id === 'all') {
                return;
            }
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.designerBrand.id}/ai-usage`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.aiUsageBreakdown = data.breakdown;
                    }
                }
            } catch (e) {
                console.error('Error loading AI usage:', e);
            }
        },
        formatTokens(num) {
            if (!num) return '0';
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
            return num;
        },
        goBack() {
            if (this.editingPage) {
                this.cancelEditing();
            } else {
                this.$emit('back');
            }
        },
        async fetchBrandAudiences() {
            if (!this.designerBrand || !this.designerBrand.id || this.designerBrand.id === 'all') {
                this.audiences = [];
                return;
            }
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.designerBrand.id}/audiences`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    this.audiences = data.audiences || [];
                }
            } catch (err) {
                console.error('[LandingPageDesignerView] Error loading audiences:', err);
            }
        },
        loadBrandContext() {
            this.fetchBrandAudiences();
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
                    this.loadAiUsage();
                    
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
        toggleGenerateAIPage() {
            if (this.generatingAIPage) {
                if (this.pageAbortController) {
                    this.pageAbortController.abort();
                    this.pageAbortController = null;
                }
            } else {
                this.generateAIPage();
            }
        },
        async generateAIPage() {
            if (!this.designerBrand || !this.designerBrand.id) return;
            this.generatingAIPage = true;
            this.pageAbortController = new AbortController();
            const tier = this.designerBrand ? this.designerBrand.ai_tier : 'professional';
            let modelName = 'gemini-3.1-pro';
            if (tier === 'standard') modelName = 'gemini-2.5-flash';
            else if (tier === 'enterprise') modelName = 'deep-research-pro-preview';
            this.app.startAiTicker(modelName);
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.designerBrand.id}/generate-ai-page`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: this.aiModalPrompt,
                        productId: this.aiModalProductId
                    }),
                    signal: this.pageAbortController.signal
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.page) {
                        this.app.showNotification('✨ AI Landing Page generated and added successfully!');
                        this.showAIModal = false;
                        this.aiModalPrompt = '';
                        this.aiModalProductId = '';
                        await this.app.loadBrands();
                        this.loadAiUsage();
                        const updatedBrand = this.app.brands.find(b => b.id === this.designerBrand.id);
                        if (updatedBrand) {
                            this.designerBrand.theme_settings = updatedBrand.theme_settings;
                            if (updatedBrand.theme_settings) {
                                try {
                                    const parsed = JSON.parse(updatedBrand.theme_settings);
                                    this.landingPages = parsed.landing_pages || [];
                                } catch(e) {}
                            }
                        }
                    }
                } else {
                    const err = await response.json();
                    alert('AI landing page generation error: ' + (err.error || 'Unknown error'));
                }
            } catch (e) {
                if (e.name === 'AbortError') {
                    this.lastGeneratingAIPageCost = null;
                    this.app.showNotification('AI page generation stopped.');
                    return;
                }
                alert('AI landing page generation network error: ' + e.message);
            } finally {
                this.generatingAIPage = false;
                this.lastGeneratingAIPageCost = this.app.aiTicker.cost * 0.92;
                this.app.stopAiTicker();
                this.pageAbortController = null;
            }
        },
        triggerAIPageBuilder() {
            if (!this.app.isFeatureAllowed('allow_page_builder')) {
                alert('🔒 Feature Locked: Please upgrade your subscription to Professional or Enterprise Tier to unlock the AI Landing Page Generator.');
                return;
            }
            this.showAIModal = true;
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
            this.$nextTick(() => {
                this.originalPageState = this.currentPageState;
            });
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
            this.$nextTick(() => {
                this.originalPageState = this.currentPageState;
            });
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
                    this.app.showNotification('Campaign pages published live successfully!');
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
                    try {
                        iframe.contentWindow.location.reload();
                    } catch (secErr) {
                        iframe.src = iframe.src;
                    }
                }
            } catch(e) {}
        },
        handleIframeLoad() {
            try {
                const iframe = this.$refs.previewIframe;
                if (iframe) {
                    try {
                        if (iframe.contentWindow) {
                            this.iframeCurrentUrl = iframe.contentWindow.location.href;
                        }
                    } catch (secErr) {
                        console.warn('[LandingPageDesignerView] Cannot read iframe URL directly (cross-origin security restriction).');
                    }
                    this.updatePreviewLandingPage();
                }
            } catch(e) {}
        },
        updatePreviewLandingPage() {
            try {
                const iframe = this.$refs.previewIframe;
                if (iframe && iframe.contentWindow && this.editingPage) {
                    const styles = {
                        type: 'UPDATE_PREVIEW_LANDING_PAGE',
                        id: this.edit_slug,
                        type_mode: this.edit_type,
                        type: this.edit_type,
                        product_id: this.edit_product_id,
                        headline: this.edit_headline,
                        subheadline: this.edit_subheadline,
                        cta: this.edit_cta,
                        hero_img: this.edit_hero_img,
                        features: this.edit_features,
                        coupon_code: this.edit_coupon_code,
                        inherit: this.edit_inherit,
                        primary_color: this.edit_inherit ? null : this.edit_primary_color,
                        translations: this.edit_translations
                    };
                    iframe.contentWindow.postMessage(styles, '*');
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
        toggleTranslateLandingPage(targetLang) {
            if (this.translatingLandingPage) {
                if (this.translateAbortController) {
                    this.translateAbortController.abort();
                    this.translateAbortController = null;
                }
            } else {
                this.translateLandingPageWithAI(targetLang);
            }
        },
        async translateLandingPageWithAI(targetLang) {
            if (!this.edit_headline && !this.edit_subheadline && !this.edit_cta && !this.edit_features) {
                alert('Please enter some text in English first to translate.');
                return;
            }
            
            this.translatingLandingPage = true;
            this.translateAbortController = new AbortController();
            const tier = this.designerBrand ? this.designerBrand.ai_tier : 'professional';
            let modelName = 'gemini-3.1-pro';
            if (tier === 'standard') modelName = 'gemini-2.5-flash';
            else if (tier === 'enterprise') modelName = 'deep-research-pro-preview';
            this.app.startAiTicker(modelName);
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
                            }),
                            signal: this.translateAbortController.signal
                        });
                        if (response.ok) {
                            const res = await response.json();
                            this.edit_translations[targetLang][field] = res.translatedText;
                        }
                    }
                }
                this.app.showNotification(`Successfully auto-translated landing page copy to ${targetLang.toUpperCase()}!`);
                this.loadAiUsage();
            } catch(e) {
                if (e.name === 'AbortError') {
                    this.lastTranslatingLandingPageCost = null;
                    this.app.showNotification('AI Translation stopped.');
                    return;
                }
                console.error(e);
                alert('AI translation error: ' + e.message);
            } finally {
                this.translatingLandingPage = false;
                this.lastTranslatingLandingPageCost = this.app.aiTicker.cost * 0.92;
                this.app.stopAiTicker();
                this.translateAbortController = null;
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

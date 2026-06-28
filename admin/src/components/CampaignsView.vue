<template>
    <div id="view-campaigns" class="admin-view" :class="{ active: app.activeView === 'campaigns' }">
        <!-- Marketing Summary Cards -->
        <div class="metrics-grid" style="margin-bottom: 24px;">
            <div class="metric-card">
                <div class="metric-card-body">
                    <span class="metric-label">Active Ad Spend Budget</span>
                    <div class="metric-main-row">
                        <span class="metric-value">€{{ totalBudget.toFixed(2) }}</span>
                        <div class="metric-sparkline">
                            <div class="metric-sparkbar active" style="height: 14px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active" style="height: 24px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 18px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active" style="height: 28px; width: 4px; border-radius: 2px;"></div>
                        </div>
                    </div>
                </div>
                <div class="metric-card-footer">
                    <span class="info-tooltip-trigger" data-tooltip="Total campaign marketing ad budget limit across channels.">i</span>
                    <span class="metric-change" style="color: var(--success); font-weight: 700; display: flex; align-items: center; gap: 4px; margin-left: auto; white-space: nowrap; text-align: right;">
                        ● Omnichannel Campaign Manager
                    </span>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-card-body">
                    <span class="metric-label">Blended ROAS (Averages)</span>
                    <div class="metric-main-row">
                        <span class="metric-value">4.6x</span>
                        <div class="metric-sparkline">
                            <div class="metric-sparkbar" style="height: 10px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active" style="height: 22px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 14px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active" style="height: 26px; width: 4px; border-radius: 2px;"></div>
                        </div>
                    </div>
                </div>
                <div class="metric-card-footer">
                    <span class="info-tooltip-trigger" data-tooltip="Blended return on ad spend performance averages.">i</span>
                    <span class="metric-change" style="color: var(--success); font-weight: 700; display: flex; align-items: center; gap: 4px; margin-left: auto; white-space: nowrap; text-align: right;">
                        📈 +14.2% attribution lift
                    </span>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-card-body">
                    <span class="metric-label">Inbound Traffic Click-Through</span>
                    <div class="metric-main-row">
                        <span class="metric-value">3.8%</span>
                        <div class="metric-sparkline">
                            <div class="metric-sparkbar active" style="height: 8px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active" style="height: 16px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 12px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active" style="height: 22px; width: 4px; border-radius: 2px;"></div>
                        </div>
                    </div>
                </div>
                <div class="metric-card-footer">
                    <span class="info-tooltip-trigger" data-tooltip="Inbound traffic click-through conversion rates.">i</span>
                    <span class="metric-change" style="color: var(--success); font-weight: 700; display: flex; align-items: center; gap: 4px; margin-left: auto; white-space: nowrap; text-align: right;">
                        ⚡ Real-time attribution tracking
                    </span>
                </div>
            </div>
        </div>

        <!-- CREATE CAMPAIGN MODAL -->
        <div class="upcoming-modal" v-if="showCreateCampaignModal" @click.self="closeCreateCampaignModal">
            <div class="upcoming-card" @click.stop style="max-width: 1200px; width: 100%; height: 85vh; max-height: 780px; text-align: left; padding: 24px; display: flex; flex-direction: column; overflow: hidden; border-radius: 12px; box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4); border: 1px solid var(--border); background: var(--card-bg);">
                <h3 style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; color: var(--text-main); margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
                    <span>🚀 Launch New Marketing Campaign</span>
                    <span @click="closeCreateCampaignModal" style="cursor: pointer; font-size: 1.1rem; color: var(--text-muted);">&times;</span>
                </h3>

                <div class="dashboard-layout-grid" style="grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 0; flex: 1; min-height: 0; display: grid;">
            <!-- Left: Omnichannel Campaign Creator -->
            <div class="panel" style="display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden;">
                <div class="panel-header" style="border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px;">
                    <h3 class="panel-title" style="display: flex; align-items: center; gap: 8px;">
                        <span>✨ Launch Campaign</span>
                        <span class="badge-simulation" style="background: var(--text-main); color: var(--workspace-bg); font-size: 0.65rem;">OMNICHANNEL</span>
                    </h3>
                </div>

                <form @submit.prevent="saveCampaign" style="flex: 1; min-height: 0; overflow-y: auto; padding-right: 8px;">
                    <!-- Campaign Focus / Goal Selector -->
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 6px; font-weight: 700; color: var(--text-main); font-size: 0.85rem;">Campaign Focus / Goal</label>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="btn" style="flex: 1; margin: 0; padding: 8px; font-size: 0.76rem; font-weight: 700; border-radius: 6px; transition: 0.2s;" :style="newCampaign.campaign_type === 'manual' ? 'background: var(--primary); color: var(--bg-color); border-color: var(--primary);' : 'background: var(--card-bg); border: 1px solid var(--border); color: var(--text-main);'" @click="setCampaignType('manual')">
                                ✍️ Custom Promo
                            </button>
                            <button type="button" class="btn" style="flex: 1; margin: 0; padding: 8px; font-size: 0.76rem; font-weight: 700; border-radius: 6px; transition: 0.2s;" :style="newCampaign.campaign_type === 'product' ? 'background: var(--primary); color: var(--bg-color); border-color: var(--primary);' : 'background: var(--card-bg); border: 1px solid var(--border); color: var(--text-main);'" @click="setCampaignType('product')">
                                📦 Product Showcase
                            </button>
                            <button type="button" class="btn" style="flex: 1; margin: 0; padding: 8px; font-size: 0.76rem; font-weight: 700; border-radius: 6px; transition: 0.2s;" :style="newCampaign.campaign_type === 'page' ? 'background: var(--primary); color: var(--bg-color); border-color: var(--primary);' : 'background: var(--card-bg); border: 1px solid var(--border); color: var(--text-main);'" @click="setCampaignType('page')">
                                📄 Landing Page
                            </button>
                        </div>
                    </div>

                    <!-- Target Product Catalog Item select -->
                    <div v-if="newCampaign.campaign_type === 'product'" class="form-group" style="margin-bottom: 12px; background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 12px; border-radius: 8px;">
                        <label style="font-weight: 700; display: block; margin-bottom: 6px;">Select Product to Promote</label>
                        <select v-model="selectedProductId" @change="applyProductCatalogDetails" style="width: 100%; border-radius: 6px; padding: 8px; font-size: 0.85rem;" required>
                            <option value="">-- Choose a Product --</option>
                            <option v-for="p in app.products" :key="p.id" :value="p.id">
                                {{ p.title }} (Price: €{{ parseFloat(p.price).toFixed(2) }})
                            </option>
                        </select>
                    </div>

                    <!-- Target Campaign Landing Page select -->
                    <div v-if="newCampaign.campaign_type === 'page'" class="form-group" style="margin-bottom: 12px; background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 12px; border-radius: 8px;">
                        <label style="font-weight: 700; display: block; margin-bottom: 6px;">Select Target Landing Page</label>
                        <select v-model="selectedLandingPageId" @change="applyLandingPageDetails" style="width: 100%; border-radius: 6px; padding: 8px; font-size: 0.85rem;" required>
                            <option value="">-- Choose a Landing Page --</option>
                            <option v-for="page in availableLandingPages" :key="page.id" :value="page.id">
                                {{ page.title }} (Slug: /{{ page.id }})
                            </option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 12px;">
                        <label>Campaign Title</label>
                        <input type="text" v-model="newCampaign.name" placeholder="e.g. Summer Special Coffee Offer" required
                            style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                    </div>

                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 6px; font-weight: 700; color: var(--text-main); font-size: 0.85rem;">Ad Publishing Channels (Omnichannel Multi-Select)</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                            <!-- Meta Ads Option -->
                            <div style="background: var(--card-bg); border: 1px solid var(--border); padding: 8px; border-radius: 8px; display: flex; flex-direction: column; gap: 4px; justify-content: space-between; font-size: 0.76rem;">
                                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--text-main); margin: 0; font-weight: 600;">
                                    <input type="checkbox" value="meta" v-model="newCampaign.platforms" style="width: 14px; height: 14px; margin: 0;">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#0064E0" style="vertical-align: middle; display: inline-block;"><path d="M16.5 6C14.28 6 12.55 7.25 12 9.07 11.45 7.25 9.72 6 7.5 6 4.46 6 2 8.46 2 11.5S4.46 17 7.5 17c2.22 0 3.95-1.25 4.5-3.07.55 1.82 2.28 3.07 4.5 3.07 3.04 0 5.5-2.46 5.5-5.5S19.54 6 16.5 6zm-9 9c-1.93 0-3.5-1.57-3.5-3.5S5.57 8 7.5 8s3.5 1.57 3.5 3.5S9.43 15 7.5 15zm9 0c-1.93 0-3.5-1.57-3.5-3.5S14.57 8 16.5 8s3.5 1.57 3.5 3.5S18.43 15 16.5 15z"/></svg>
                                    <span>Meta Ads</span>
                                </label>
                                <span v-if="!isChannelConnected('meta')" style="font-size: 0.65rem; color: #eab308; font-weight: 700; background: rgba(234,179,8,0.1); padding: 1px 4px; border-radius: 4px; text-align: center;">
                                    ⚠️ <a href="#" @click.prevent="openOAuthConnector('meta')" style="color: #eab308; text-decoration: underline;">Disconnected</a>
                                </span>
                                <span v-else style="font-size: 0.65rem; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.1); padding: 1px 4px; border-radius: 4px; text-align: center;">
                                    ✓ Connected
                                </span>
                            </div>

                            <!-- Google Ads Option -->
                            <div style="background: var(--card-bg); border: 1px solid var(--border); padding: 8px; border-radius: 8px; display: flex; flex-direction: column; gap: 4px; justify-content: space-between; font-size: 0.76rem;">
                                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--text-main); margin: 0; font-weight: 600;">
                                    <input type="checkbox" value="google" v-model="newCampaign.platforms" style="width: 14px; height: 14px; margin: 0;">
                                    <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle; display: inline-block;"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.08-.2-.08-.43-.08-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                                    <span>Google Ads</span>
                                </label>
                                <span v-if="!isChannelConnected('google')" style="font-size: 0.65rem; color: #eab308; font-weight: 700; background: rgba(234,179,8,0.1); padding: 1px 4px; border-radius: 4px; text-align: center;">
                                    ⚠️ <a href="#" @click.prevent="openOAuthConnector('google')" style="color: #eab308; text-decoration: underline;">Disconnected</a>
                                </span>
                                <span v-else style="font-size: 0.65rem; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.1); padding: 1px 4px; border-radius: 4px; text-align: center;">
                                    ✓ Connected
                                </span>
                            </div>

                            <!-- Twitter / X Ads Option -->
                            <div style="background: var(--card-bg); border: 1px solid var(--border); padding: 8px; border-radius: 8px; display: flex; flex-direction: column; gap: 4px; justify-content: space-between; font-size: 0.76rem;">
                                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--text-main); margin: 0; font-weight: 600;">
                                    <input type="checkbox" value="x" v-model="newCampaign.platforms" style="width: 14px; height: 14px; margin: 0;">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="#FFFFFF" style="vertical-align: middle; display: inline-block; background: #000; border-radius: 4px; padding: 2px;"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                    <span>X / Twitter</span>
                                </label>
                                <span v-if="!isChannelConnected('x')" style="font-size: 0.65rem; color: #eab308; font-weight: 700; background: rgba(234,179,8,0.1); padding: 1px 4px; border-radius: 4px; text-align: center;">
                                    ⚠️ <a href="#" @click.prevent="openOAuthConnector('x')" style="color: #eab308; text-decoration: underline;">Disconnected</a>
                                </span>
                                <span v-else style="font-size: 0.65rem; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.1); padding: 1px 4px; border-radius: 4px; text-align: center;">
                                    ✓ Connected
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                        <div class="form-group">
                            <label>Monthly Budget Limit (€)</label>
                            <input type="number" v-model.number="newCampaign.budget" required min="10"
                                style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                        </div>
                        <div class="form-group">
                            <label>Audience Target Segment</label>
                            <select v-model="newCampaign.segmentation" style="width: 100%;">
                                <option value="All Customers">All Store Customers</option>
                                <option value="Repeat Customers">Repeat Customers (>= 2 orders)</option>
                                <option value="High Spenders">High-Value Spenders (CLV > €100)</option>
                                <option value="Dormant Shoppers">Dormant Shoppers (No purchases > 30 days)</option>
                                <option value="Prospects / Lookalike">Cold Traffic / Lookalike Audiences</option>
                            </select>
                        </div>
                    </div>



                    <div v-if="newCampaign.campaign_type === 'manual'" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                        <div class="form-group">
                            <label>Destination Target</label>
                            <select v-model="newCampaign.destination_type" style="width: 100%;">
                                <option value="homepage">Storefront Homepage</option>
                                <option value="landing_page">Campaign Landing Page</option>
                                <option value="custom_url">Custom Target URL</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <template v-if="newCampaign.destination_type === 'custom_url'">
                                <label>Custom Target URL</label>
                                <input type="text" v-model="newCampaign.custom_url" placeholder="e.g. https://instagram.com/my-page" required
                                    style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                            </template>
                            <template v-else>
                                <label>Select Landing Page</label>
                                <select v-model="newCampaign.landing_page_id" style="width: 100%;" :disabled="newCampaign.destination_type !== 'landing_page'">
                                    <option value="">-- Choose Landing Page --</option>
                                    <option v-for="page in availableLandingPages" :key="page.id" :value="page.id">
                                        {{ page.title }} ({{ page.id }})
                                    </option>
                                </select>
                            </template>
                        </div>
                    </div>

                    <!-- Target Languages based on active brand locales -->
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 6px;">Target Locales (Languages)</label>
                        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                            <label v-for="lang in availableLocales" :key="lang" style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; cursor: pointer; color: var(--text-main);">
                                <input type="checkbox" :value="lang" v-model="newCampaign.languages" style="margin: 0;">
                                <span>{{ lang.toUpperCase() }}</span>
                            </label>
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 12px;">
                        <label>Ad Format</label>
                        <select v-model="newCampaign.format" style="width: 100%;">
                            <option value="Image">Single Image Ad</option>
                            <option value="Video">Video Ad Variant</option>
                            <option value="Carousel">Dynamic Product Carousel</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <label style="margin: 0; font-weight: 700; font-size: 0.85rem;">Ad Creative Graphic (Media)</label>
                            <!-- Tab toggle pills -->
                            <div style="display: flex; gap: 4px; background: var(--border); padding: 2px; border-radius: 6px;">
                                <button type="button" @click="mediaTab = 'upload'" style="font-size: 0.7rem; padding: 3px 8px; border: none; cursor: pointer; border-radius: 4px; transition: 0.2s;" :style="mediaTab === 'upload' ? 'background: var(--card-bg); color: var(--text-main); font-weight: bold;' : 'background: none; color: var(--text-muted);'">📁 Upload</button>
                                <button type="button" @click="mediaTab = 'catalog'" style="font-size: 0.7rem; padding: 3px 8px; border: none; cursor: pointer; border-radius: 4px; transition: 0.2s;" :style="mediaTab === 'catalog' ? 'background: var(--card-bg); color: var(--text-main); font-weight: bold;' : 'background: none; color: var(--text-muted);'">🛍️ Catalog</button>
                                <button type="button" @click="mediaTab = 'library'" style="font-size: 0.7rem; padding: 3px 8px; border: none; cursor: pointer; border-radius: 4px; transition: 0.2s;" :style="mediaTab === 'library' ? 'background: var(--card-bg); color: var(--text-main); font-weight: bold;' : 'background: none; color: var(--text-muted);'">🗂️ Library</button>
                                <button type="button" @click="mediaTab = 'url'" style="font-size: 0.7rem; padding: 3px 8px; border: none; cursor: pointer; border-radius: 4px; transition: 0.2s;" :style="mediaTab === 'url' ? 'background: var(--card-bg); color: var(--text-main); font-weight: bold;' : 'background: none; color: var(--text-muted);'">🔗 URL</button>
                            </div>
                        </div>

                        <!-- Tab 1: Upload Image -->
                        <div v-if="mediaTab === 'upload'" style="border: 1px dashed var(--border); border-radius: 8px; padding: 20px; text-align: center; background: var(--card-bg); position: relative; cursor: pointer; transition: border-color 0.2s;">
                            <input type="file" @change="uploadAdMedia" accept="image/*" style="opacity: 0; position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: pointer;">
                            <div v-if="uploadingMedia">
                                <div style="inline-block; width: 24px; height: 24px; border: 2px solid var(--text-muted); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 8px;"></div>
                                <div style="font-size: 0.78rem; color: var(--text-muted);">Uploading asset to store storage...</div>
                            </div>
                            <div v-else>
                                <span style="font-size: 1.6rem; display: block; margin-bottom: 6px;">📤</span>
                                <span style="font-size: 0.78rem; color: var(--text-main); font-weight: 600;">Drag & drop or click to upload campaign graphic</span>
                                <span style="font-size: 0.65rem; color: var(--text-muted); display: block; margin-top: 4px;">Supports JPG, PNG, WebP up to 5MB</span>
                            </div>
                        </div>

                        <!-- Tab 2: Catalog Image Gallery -->
                        <div v-else-if="mediaTab === 'catalog'" style="border: 1px solid var(--border); border-radius: 8px; padding: 8px; max-height: 140px; overflow-y: auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: var(--bg-color);">
                            <div v-for="p in app.products" :key="p.id" @click="selectCatalogImage(p.image)" style="cursor: pointer; border: 2px solid var(--border); border-radius: 6px; overflow: hidden; height: 50px; position: relative;" :style="newCampaign.media_url === p.image ? 'border-color: var(--primary); font-weight: 700;' : ''" :title="p.title">
                                <img :src="p.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=120'" style="width: 100%; height: 100%; object-fit: cover;">
                                <div v-if="newCampaign.media_url === p.image" style="position: absolute; bottom: 2px; right: 2px; background: var(--primary); color: var(--bg-color); border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: bold;">✓</div>
                            </div>
                            <div v-if="!app.products || app.products.length === 0" style="grid-column: span 4; text-align: center; font-size: 0.75rem; color: var(--text-muted); padding: 16px;">
                                No products in catalog to select images from.
                            </div>
                        </div>

                        <!-- Tab 3: Media Library Picker -->
                        <div v-else-if="mediaTab === 'library'" style="border: 1px solid var(--border); border-radius: 8px; padding: 8px; max-height: 160px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; background: var(--bg-color);">
                            <input type="text" v-model="widgetSearchQuery" placeholder="Search Media Library..." 
                                style="font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); margin-bottom: 2px;">
                            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
                                <div v-for="item in filteredWidgetMedia" :key="item.id" @click="selectCatalogImage(item.url)" style="cursor: pointer; border: 2px solid var(--border); border-radius: 6px; overflow: hidden; height: 50px; position: relative;" :style="newCampaign.media_url === item.url ? 'border-color: var(--primary); font-weight: 700;' : ''" :title="item.title">
                                    <img :src="item.url" style="width: 100%; height: 100%; object-fit: cover;">
                                    <div v-if="newCampaign.media_url === item.url" style="position: absolute; bottom: 2px; right: 2px; background: var(--primary); color: var(--bg-color); border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: bold;">✓</div>
                                </div>
                                <div v-if="filteredWidgetMedia.length === 0" style="grid-column: span 4; text-align: center; font-size: 0.72rem; color: var(--text-muted); padding: 8px;">
                                    No matching media assets found.
                                </div>
                            </div>
                        </div>

                        <!-- Tab 4: Manual Media URL Input -->
                        <div v-else>
                            <input type="text" v-model="newCampaign.media_url" placeholder="Paste image/media asset URL"
                                style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                        </div>
                    </div>

                    <!-- Tab row for target language copy variants -->
                    <div v-if="newCampaign.languages && newCampaign.languages.length > 1" style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 6px; font-weight: 700; color: var(--text-main); font-size: 0.85rem;">Edit Ad Copy for Targeted Language:</label>
                        <div class="tab-track" style="display: inline-flex;">
                            <button v-for="lang in newCampaign.languages" :key="lang" type="button" @click="campaignContentLang = lang"
                                    class="tab-pill" :class="{ active: campaignContentLang === lang }" style="font-size: 0.72rem; padding: 6px 12px; font-weight: 700;">
                                {{ lang.toUpperCase() }}
                            </button>
                        </div>
                    </div>

                    <div style="margin-bottom: 16px; border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: rgba(255,255,255,0.01);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">📝 Ad Copy Details ({{ campaignContentLang.toUpperCase() }} variant)</span>
                            <!-- Translate button if not default 'en' -->
                            <button v-if="campaignContentLang !== 'en'" type="button" class="btn btn-accent" style="font-size: 0.7rem; padding: 3px 8px; height: auto; display: flex; align-items: center; gap: 4px; margin: 0; border-radius: 6px;" @click="translateCampaignWithAI(campaignContentLang)" :disabled="translatingCampaign">
                                <span v-if="translatingCampaign" style="display: inline-block; width: 10px; height: 10px; border: 2px solid var(--text-muted); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></span>
                                <span v-else>✨ AI Translate from EN</span>
                            </button>
                        </div>

                        <!-- Ad Headline Copy for the active tab -->
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">Ad Headline Copy</label>
                            <input v-if="campaignContentLang === 'en'" type="text" v-model="newCampaign.headline" placeholder="e.g. Try Our Premium Special Roasts Today!"
                                style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                            <input v-else type="text" v-model="newCampaign.translations[campaignContentLang].headline" :placeholder="'[AI Translation Pending] e.g. Probieren Sie noch heute unsere Premium-Röstungen!'"
                                style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                        </div>

                        <!-- Body Description for the active tab -->
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block;">Body Description Text</label>
                            <textarea v-if="campaignContentLang === 'en'" v-model="newCampaign.ad_copy" rows="3" placeholder="Write compelling marketing ad descriptions..."
                                style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                            <textarea v-else v-model="newCampaign.translations[campaignContentLang].ad_copy" rows="3" :placeholder="'[AI Translation Pending] e.g. Schreiben Sie hier ansprechende Werbebeschreibungen...'"
                                style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                        </div>
                    </div>

                    <!-- Carousel cards setup if Carousel format is active -->
                    <div v-if="newCampaign.format === 'Carousel'" class="form-group" style="margin-bottom: 16px; border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: var(--bg-color);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">🎠 Carousel Cards (Max 3)</span>
                            <button type="button" class="btn btn-secondary" style="font-size: 0.7rem; padding: 2px 6px; height: auto;" @click="autofillCarousel">
                                ⚡ Fill from Shop Catalog
                            </button>
                        </div>
                        <div v-for="(card, idx) in newCampaign.carousel_cards" :key="idx" style="margin-bottom: 12px; border-bottom: 1px dashed var(--border); padding-bottom: 12px; &:last-child { border: 0; padding: 0; margin: 0; }">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">Card #{{ idx+1 }}</span>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <!-- File upload trigger for this card -->
                                    <label :for="'card-upload-' + idx" style="font-size: 0.68rem; color: var(--primary); cursor: pointer; text-decoration: underline; margin: 0; font-weight: 600;">
                                        📁 Upload Image
                                    </label>
                                    <input type="file" :id="'card-upload-' + idx" style="display: none;" @change="uploadCarouselCardMedia(idx, $event)" accept="image/*">
                                </div>
                            </div>
                            
                            <!-- Inline Product Linker -->
                            <div style="margin-bottom: 6px;">
                                <select @change="onCarouselProductSelect(idx, $event)" style="width: 100%; font-size: 0.72rem; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main);">
                                    <option value="">-- Link to a Store Product --</option>
                                    <option v-for="p in app.products" :key="p.id" :value="p.id">
                                        🔗 {{ p.title }} (Price: €{{ parseFloat(p.price).toFixed(2) }})
                                    </option>
                                </select>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                <input type="text" v-model="card.image" placeholder="Card Image URL" style="font-size: 0.72rem; padding: 6px; width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main);">
                                <input type="text" v-model="card.title" placeholder="Card Headline" style="font-size: 0.72rem; padding: 6px; width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main);">
                            </div>
                        </div>
                    </div>

                    <button type="submit" class="btn" style="width: 100%; font-weight: 700;">🚀 Launch Marketing Campaign</button>
                </form>
            </div>

            <!-- Right: Real-Time Omnichannel Live Ad Previews -->
            <div class="panel" style="display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden;">
                <div class="panel-header" style="border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                    <h3 class="panel-title">📱 Live Creative Preview</h3>
                    <div style="display: flex; gap: 6px;">
                        <button v-if="newCampaign.platforms.includes('meta')" class="btn btn-secondary" :class="{ active: previewChannel === 'meta' }" @click="previewChannel = 'meta'" style="font-size: 0.75rem; padding: 4px 8px; height: auto;">Meta Ads</button>
                        <button v-if="newCampaign.platforms.includes('x')" class="btn btn-secondary" :class="{ active: previewChannel === 'x' }" @click="previewChannel = 'x'" style="font-size: 0.75rem; padding: 4px 8px; height: auto;">X Ads</button>
                        <button v-if="newCampaign.platforms.includes('google')" class="btn btn-secondary" :class="{ active: previewChannel === 'google' }" @click="previewChannel = 'google'" style="font-size: 0.75rem; padding: 4px 8px; height: auto;">Google Ads</button>
                    </div>
                </div>

                <div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; background: var(--bg-color); border-radius: 8px; padding: 24px; border: 1px dashed var(--border); overflow-y: auto; min-height: 0;">
                    <!-- NO PLATFORMS SELECTED STATE -->
                    <div v-if="!newCampaign.platforms || newCampaign.platforms.length === 0" style="text-align: center; color: var(--text-muted);">
                        <span style="font-size: 2.2rem; display: block; margin-bottom: 12px;">📣</span>
                        <span style="font-size: 0.85rem; font-weight: 600;">Select at least one omnichannel ad platform to preview your live creatives.</span>
                    </div>

                    <!-- META AD FEED PREVIEW -->
                    <div v-else-if="previewChannel === 'meta'" style="width: 100%; max-width: 340px; background: #ffffff; color: #1c1e21; border-radius: 8px; border: 1px solid #dddfe2; font-family: Helvetica, Arial, sans-serif; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); text-align: left;">
                        <!-- Header -->
                        <div style="display: flex; align-items: center; gap: 8px; padding: 12px;">
                            <img :src="activeBrand.logo || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=120'" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid #ddd; flex-shrink: 0;">
                            <div>
                                <strong style="font-size: 0.85rem; color: #1c1e21; display: block;">{{ activeBrand.name }}</strong>
                                <span style="font-size: 0.72rem; color: #606770; display: flex; align-items: center; gap: 3px;">
                                    Sponsored · 🌐
                                </span>
                            </div>
                        </div>
                        <!-- Ad Copy -->
                        <div style="padding: 0 12px 8px 12px; font-size: 0.85rem; line-height: 1.35; white-space: pre-line; color: #1c1e21;">{{ previewAdCopy }}</div>
                        
                        <!-- Media graphic -->
                        <div style="position: relative; background: #f2f3f5; width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-top: 1px solid #e5e5e5;">
                            <!-- Format: Image/Video -->
                            <template v-if="newCampaign.format !== 'Carousel'">
                                <img v-if="newCampaign.media_url" :src="newCampaign.media_url" style="width: 100%; height: 100%; object-fit: cover;">
                                <div v-else style="color: #8d949e; text-align: center; padding: 12px;">
                                    <span style="font-size: 2rem; display: block;">🖼️</span>
                                    <span style="font-size: 0.75rem;">Media Asset Preview</span>
                                </div>
                                <div v-if="newCampaign.format === 'Video'" style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.2rem; cursor: pointer;">▶</div>
                            </template>

                            <!-- Format: Carousel -->
                            <template v-else>
                                <div style="display: flex; width: 100%; height: 100%; overflow: hidden;">
                                    <div v-for="(card, i) in newCampaign.carousel_cards" :key="i" style="min-width: 50%; border-right: 1px solid #e5e5e5; display: flex; flex-direction: column; background: #fff;">
                                        <div style="flex-grow: 1; position: relative; background: #eee; overflow: hidden;">
                                            <img v-if="card.image" :src="card.image" style="width: 100%; height: 100%; object-fit: cover;">
                                            <div v-else style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 0.7rem;">Card {{i+1}} Image</div>
                                        </div>
                                        <div style="padding: 6px; border-top: 1px solid #e5e5e5;">
                                            <div style="font-size: 0.72rem; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #1c1e21;">{{ card.title || 'Dynamic Product' }}</div>
                                            <button type="button" style="border: 0; outline: 0; border-radius: 3px; font-size: 0.65rem; padding: 3px 6px; background: #e4e6eb; color: #050505; margin-top: 4px; font-weight: 600; width: 100%;">Shop Now</button>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>

                        <!-- CTA bar -->
                        <div v-if="newCampaign.format !== 'Carousel'" style="display: flex; justify-content: space-between; align-items: center; background: #f2f3f5; padding: 10px 12px; border-top: 1px solid #e5e5e5;">
                            <div style="max-width: 65%;">
                                <span style="font-size: 0.7rem; color: #606770; text-transform: uppercase;">{{ getDestinationDomain }}</span>
                                <strong style="font-size: 0.85rem; color: #1c1e21; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ previewHeadline }}</strong>
                            </div>
                            <button type="button" style="background: #e4e6eb; color: #050505; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer; text-transform: none;">Shop Now</button>
                        </div>
                    </div>

                    <!-- TWITTER / X POST CARD PREVIEW -->
                    <div v-else-if="previewChannel === 'x'" style="width: 100%; max-width: 360px; background: #000000; color: #e7e9ea; border-radius: 12px; border: 1px solid #2f3336; padding: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.3); text-align: left;">
                        <div style="display: flex; gap: 10px;">
                            <img :src="activeBrand.logo || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=120'" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">
                            <div style="flex-grow: 1; min-width: 0;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis;">
                                        <strong style="color: #e7e9ea; font-size: 0.9rem;">{{ activeBrand.name }}</strong>
                                        <span style="color: #71767b; font-size: 0.85rem;">@{{ activeBrand.id }} · ad</span>
                                    </div>
                                    <span style="color: #71767b; font-size: 1.1rem; line-height: 1;">···</span>
                                </div>
                                <div style="font-size: 0.9rem; line-height: 1.4; margin-top: 4px; white-space: pre-line; color: #e7e9ea;">{{ previewAdCopy }}</div>
                                
                                <!-- Card Attachment -->
                                <div style="border: 1px solid #2f3336; border-radius: 16px; overflow: hidden; margin-top: 10px; background: #000;">
                                    <div style="position: relative; height: 180px; display: flex; align-items: center; justify-content: center; background: #15181c;">
                                        <img v-if="newCampaign.media_url" :src="newCampaign.media_url" style="width: 100%; height: 100%; object-fit: cover;">
                                        <div v-else style="color: #71767b; text-align: center;">
                                            <span style="font-size: 1.8rem; display: block;">🐦</span>
                                            <span style="font-size: 0.72rem;">X Card Image Asset</span>
                                        </div>
                                    </div>
                                    <div style="padding: 10px; border-top: 1px solid #2f3336;">
                                        <span style="font-size: 0.72rem; color: #71767b;">{{ getDestinationDomain }}</span>
                                        <div style="font-size: 0.85rem; font-weight: 700; color: #e7e9ea; margin-top: 2px;">{{ previewHeadline }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- GOOGLE SEARCH NETWORK PREVIEW -->
                    <div v-else-if="previewChannel === 'google'" style="width: 100%; max-width: 440px; background: #ffffff; color: #202124; border-radius: 8px; border: 1px solid #dadce0; padding: 16px; font-family: Roboto, arial, sans-serif; text-align: left; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <div style="background: #f1f3f4; color: #202124; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">Ad</div>
                            <div>
                                <span style="font-size: 0.75rem; color: #202124; display: block; font-weight: 500;">Sponsor: {{ activeBrand.name }}</span>
                                <span style="font-size: 0.7rem; color: #5f6368; display: block;">https://{{ getDestinationDomain }}</span>
                            </div>
                        </div>
                        <h4 style="font-size: 1.15rem; color: #1a0dab; font-weight: 400; line-height: 1.3; margin: 4px 0; cursor: pointer; text-decoration: none;">
                            {{ previewHeadline }}
                        </h4>
                        <p style="font-size: 0.85rem; color: #4d5156; line-height: 1.4; margin: 0;">
                            {{ previewAdCopy }}
                        </p>
                    </div>
                </div>
            </div>
            </div>
            </div>
        </div>

        <!-- Active Marketing Campaigns Table -->
        <div class="panel">
            <div class="panel-header" style="border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px;">
                <h3 class="panel-title">Active Omnichannel Campaigns</h3>
            </div>
            
            <div v-if="campaigns.length === 0" style="padding: 40px; text-align: center; color: var(--text-muted); background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px;">
                <div style="font-size: 1.5rem; margin-bottom: 8px;">📢</div>
                <div style="font-weight: 600; color: var(--text-main); font-size: 0.9rem; margin-bottom: 4px;">No campaigns yet</div>
                <div style="font-size: 0.8rem;">Build one above to start promoting your store!</div>
            </div>
            
            <div v-else class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Campaign Name</th>
                            <th>Target Segment</th>
                            <th>Active Locales</th>
                            <th>Channel</th>
                            <th>Format</th>
                            <th style="text-align: center;">Monthly Budget</th>
                            <th style="text-align: right;">Status</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="c in campaigns" :key="c.id">
                            <td>
                                <strong style="color: var(--text-main); display: block;">{{ c.name }}</strong>
                                <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px; flex-wrap: wrap;">
                                    <span style="font-size: 0.72rem; color: var(--text-muted);">{{ c.headline || 'No headline' }}</span>
                                    <span v-if="c.destination_type === 'landing_page'" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; padding: 1px 4px; border-radius: 3px; font-size: 0.65rem; font-weight: 700;">
                                        🔗 Target: /{{ c.landing_page_id }}
                                    </span>
                                    <span v-else-if="c.destination_type === 'custom_url'" style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 1px 4px; border-radius: 3px; font-size: 0.65rem; font-weight: 700;">
                                        🔗 Custom: {{ c.custom_url || 'external-link.com' }}
                                    </span>
                                    <span v-else style="background: rgba(255, 255, 255, 0.05); color: var(--text-muted); padding: 1px 4px; border-radius: 3px; font-size: 0.65rem; font-weight: 700;">
                                        🏠 Homepage
                                    </span>
                                </div>
                            </td>
                            <td>
                                <span class="badge-simulation" style="font-size: 0.72rem; background: var(--border); color: var(--text-main);">
                                    {{ c.segmentation }}
                                </span>
                            </td>
                            <td>
                                <div style="display: flex; gap: 4px;">
                                    <span v-for="lang in parseLanguages(c.languages)" :key="lang" class="badge-simulation" style="font-size: 0.65rem; background: var(--border); color: var(--text-main); font-weight: 700; padding: 1px 4px;">
                                        {{ lang.toUpperCase() }}
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                                    <span v-for="plat in (c.platform || '').split(',')" :key="plat" class="badge-simulation" style="font-size: 0.72rem; text-transform: capitalize; font-weight: 600;" :style="getPlatformStyle(plat)">
                                        {{ plat === 'x' ? 'X / Twitter' : plat }}
                                    </span>
                                </div>
                            </td>
                            <td>{{ c.format }}</td>
                            <td style="text-align: center; font-weight: 600;">€{{ parseFloat(c.budget).toFixed(2) }}</td>
                            <td style="text-align: right;">
                                <span class="status-badge" :class="c.status === 'active' ? 'status-success' : 'status-warning'" style="font-size: 0.72rem;">
                                    {{ c.status === 'active' ? 'Active' : 'Paused' }}
                                </span>
                            </td>
                            <td style="text-align: right;">
                                <button type="button" class="btn btn-secondary" style="font-size: 0.72rem; padding: 4px 8px; color: var(--danger); height: auto;" @click="deleteCampaign(c.id)">
                                    Void
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CampaignsView',
    inject: ['app'],
    data() {
        return {
            campaigns: [],
            showCreateCampaignModal: false,
            previewChannel: 'meta',
            selectedLandingPageId: '',
            mediaTab: 'upload',
            uploadingMedia: false,
            widgetSearchQuery: '',
            mediaLibraryItems: [],
            campaignContentLang: 'en',
            translatingCampaign: false,
            newCampaign: {
                id: '',
                name: '',
                campaign_type: 'manual',
                platforms: ['meta'],
                budget: 150,
                segmentation: 'All Customers',
                languages: ['en'],
                translations: {
                    en: { headline: '', ad_copy: '' }
                },
                format: 'Image',
                ad_copy: '',
                headline: '',
                media_url: '',
                destination_type: 'homepage',
                landing_page_id: '',
                custom_url: '',
                carousel_cards: [
                    { image: '', title: '', link: '' },
                    { image: '', title: '', link: '' },
                    { image: '', title: '', link: '' }
                ]
            }
        };
    },
    computed: {
        activeBrand() {
            if (this.app && this.app.activeShopFilter && this.app.activeShopFilter !== 'all') {
                const brand = this.app.brands.find(b => b.id === this.app.activeShopFilter);
                if (brand) return brand;
            }
            if (this.app && this.app.brands && this.app.brands.length > 0) {
                return this.app.brands[0];
            }
            return { id: 'pesado', name: 'Pesado', logo: '', subdomain: 'pesado' };
        },
        availableLocales() {
            if (this.activeBrand && this.activeBrand.languages) {
                if (Array.isArray(this.activeBrand.languages)) {
                    return this.activeBrand.languages;
                }
                if (typeof this.activeBrand.languages === 'string') {
                    return this.activeBrand.languages.split(',').map(l => l.trim()).filter(Boolean);
                }
            }
            return ['en'];
        },
        totalBudget() {
            return this.campaigns.reduce((acc, c) => acc + parseFloat(c.budget || 0), 0);
        },
        availableLandingPages() {
            const brand = this.activeBrand;
            if (!brand || !brand.theme_settings) return [];
            try {
                const settings = typeof brand.theme_settings === 'string' ? JSON.parse(brand.theme_settings) : brand.theme_settings;
                if (settings.landing_pages && Array.isArray(settings.landing_pages)) {
                    return settings.landing_pages.map(p => ({
                        id: p.id,
                        title: p.headline || `Landing Page (${p.id})`,
                        url: `https://${brand.subdomain || 'shop'}.stricktlycoffee.be/${p.id}`
                    }));
                } else if (settings.landing_headline) {
                    return [{
                        id: 'promo-offer',
                        title: settings.landing_headline,
                        url: `https://${brand.subdomain || 'shop'}.stricktlycoffee.be/promo-offer`
                    }];
                }
            } catch(e) {}
            return [];
        },
        getDestinationDomain() {
            const brand = this.activeBrand;
            if (this.newCampaign.destination_type === 'custom_url') {
                return this.newCampaign.custom_url || 'external-link.com';
            }
            const domain = (brand.subdomain || 'pesado') + '.stricktlycoffee.be';
            
            let path = '';
            if (this.newCampaign.destination_type === 'landing_page' && this.newCampaign.landing_page_id) {
                path = `/${this.newCampaign.landing_page_id}`;
            }
            
            let query = '';
            if (this.campaignContentLang && this.campaignContentLang !== 'en') {
                query = `?lang=${this.campaignContentLang}`;
            }
            
            return `${domain}${path}${query}`;
        },
        previewHeadline() {
            const lang = this.campaignContentLang;
            if (lang && lang !== 'en' && this.newCampaign.translations && this.newCampaign.translations[lang] && this.newCampaign.translations[lang].headline) {
                return this.newCampaign.translations[lang].headline;
            }
            return this.newCampaign.headline || 'Product Headline';
        },
        previewAdCopy() {
            const lang = this.campaignContentLang;
            if (lang && lang !== 'en' && this.newCampaign.translations && this.newCampaign.translations[lang] && this.newCampaign.translations[lang].ad_copy) {
                return this.newCampaign.translations[lang].ad_copy;
            }
            return this.newCampaign.ad_copy || 'Write some compelling copy here for your audience to see in their social feeds...';
        },
        filteredWidgetMedia() {
            let list = this.mediaLibraryItems || [];
            if (this.widgetSearchQuery.trim()) {
                const query = this.widgetSearchQuery.toLowerCase();
                list = list.filter(i => (i.title || '').toLowerCase().includes(query));
            }
            return list;
        }
    },
    watch: {
        'app.activeShopFilter': {
            immediate: true,
            handler() {
                this.loadCampaigns();
                // Default target languages to first brand language
                if (this.availableLocales.length > 0) {
                    this.newCampaign.languages = [...this.availableLocales];
                }
            }
        },
        'newCampaign.languages': {
            deep: true,
            handler(newVal) {
                if (newVal) {
                    if (!this.newCampaign.translations) {
                        this.newCampaign.translations = {};
                    }
                    newVal.forEach(lang => {
                        if (!this.newCampaign.translations[lang]) {
                            this.newCampaign.translations[lang] = { headline: '', ad_copy: '' };
                        }
                    });
                    if (!newVal.includes(this.campaignContentLang)) {
                        this.campaignContentLang = newVal[0] || 'en';
                    }
                }
            }
        },
        'newCampaign.platforms': {
            handler(newVal) {
                if (newVal && newVal.length > 0) {
                    if (!newVal.includes(this.previewChannel)) {
                        this.previewChannel = newVal[0];
                    }
                } else {
                    this.previewChannel = '';
                }
            }
        },
        mediaTab(newVal) {
            if (newVal === 'library') {
                this.loadMediaLibrary();
            }
        }
    },
    methods: {
        async loadCampaigns() {
            try {
                const response = await fetch('/api/global/marketing-campaigns', {
                    headers: { 'Authorization': `Bearer ${this.app.adminToken}` }
                });
                if (response.ok) {
                    this.campaigns = await response.json();
                }
            } catch (err) {
                console.error('Error loading campaigns:', err);
            }
        },
        adjustPlatformDefault() {
            this.previewChannel = this.newCampaign.platform;
            if (this.newCampaign.platform === 'google') {
                this.newCampaign.format = 'Image';
            }
        },
        autofillWithProduct() {
            if (this.app.products && this.app.products.length > 0) {
                const p = this.app.products[0];
                this.newCampaign.media_url = p.image || '';
                this.newCampaign.headline = `Try the all-new ${p.title}!`;
                this.newCampaign.ad_copy = `Get premium ${p.title} starting from €${parseFloat(p.price).toFixed(2)}. ${p.description || ''}`;
                this.app.showNotification(`Autofilled ad using product catalog details for "${p.title}".`);
            } else {
                this.app.showNotification('Product catalog is currently empty. Add products first!');
            }
        },
        autofillCarousel() {
            if (this.app.products && this.app.products.length >= 2) {
                const count = Math.min(this.app.products.length, 3);
                for (let i = 0; i < count; i++) {
                    const p = this.app.products[i];
                    this.newCampaign.carousel_cards[i] = {
                        image: p.image || '',
                        title: p.title || '',
                        link: `/store/${this.activeBrand.id}?product=${p.id}`
                    };
                }
                this.app.showNotification('Autofilled Carousel cards from active product catalog listings.');
            } else {
                this.app.showNotification('Catalog needs at least 2 products to autofill a carousel.');
            }
        },
        parseLanguages(langs) {
            if (!langs) return ['en'];
            return langs.split(',');
        },
        getPlatformStyle(platform) {
            if (platform === 'meta') return 'background: #1877f2; color: #fff;';
            if (platform === 'x') return 'background: #000000; color: #e7e9ea; border: 1px solid #2f3336;';
            if (platform === 'google') return 'background: #4285f4; color: #fff;';
            return 'background: var(--border); color: var(--text-main);';
        },
        openCreateCampaignModal() {
            this.newCampaign = {
                id: '',
                name: '',
                campaign_type: 'manual',
                platforms: ['meta'],
                budget: 150,
                segmentation: 'All Customers',
                languages: this.availableLocales.length > 0 ? [...this.availableLocales] : ['en'],
                translations: {
                    en: { headline: '', ad_copy: '' }
                },
                format: 'Image',
                ad_copy: '',
                headline: '',
                media_url: '',
                destination_type: 'homepage',
                landing_page_id: '',
                custom_url: '',
                carousel_cards: [
                    { image: '', title: '', link: '' },
                    { image: '', title: '', link: '' },
                    { image: '', title: '', link: '' }
                ]
            };
            this.campaignContentLang = 'en';
            this.showCreateCampaignModal = true;
        },
        closeCreateCampaignModal() {
            this.showCreateCampaignModal = false;
        },
        async saveCampaign() {
            try {
                if (!this.newCampaign.platforms || this.newCampaign.platforms.length === 0) {
                    alert('Please select at least one target channel to launch the campaign.');
                    return;
                }
                const payload = { ...this.newCampaign };
                payload.platform = this.newCampaign.platforms.join(',');

                // Send brand_id implicitly
                const response = await fetch('/api/global/marketing-campaigns', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.app.adminToken}`
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    this.app.showNotification('Omnichannel ad campaign launched and synced successfully.');
                    this.loadCampaigns();
                    // Reset form
                    this.selectedProductId = '';
                    this.selectedLandingPageId = '';
                    this.newCampaign = {
                        id: '',
                        name: '',
                        campaign_type: 'manual',
                        platforms: ['meta'],
                        budget: 150,
                        segmentation: 'All Customers',
                        languages: [...this.availableLocales],
                        translations: {
                            en: { headline: '', ad_copy: '' }
                        },
                        format: 'Image',
                        ad_copy: '',
                        headline: '',
                        media_url: '',
                        destination_type: 'homepage',
                        landing_page_id: '',
                        custom_url: '',
                        carousel_cards: [
                            { image: '', title: '', link: '' },
                            { image: '', title: '', link: '' },
                            { image: '', title: '', link: '' }
                        ]
                    };
                    this.campaignContentLang = 'en';
                    this.showCreateCampaignModal = false;
                } else {
                    const data = await response.json();
                    alert(`Error launching campaign: ${data.error || 'Unknown error'}`);
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        },
        async deleteCampaign(id) {
            if (!confirm('Are you sure you want to void this marketing ad campaign?')) return;
            try {
                const response = await fetch(`/api/global/marketing-campaigns/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${this.app.adminToken}` }
                });
                if (response.ok) {
                    this.app.showNotification('Campaign voided.');
                    this.loadCampaigns();
                }
            } catch (err) {
                console.error(err);
            }
        },
        isChannelConnected(platform) {
            const brand = this.activeBrand;
            if (!brand || !brand.theme_settings) return false;
            try {
                const theme = typeof brand.theme_settings === 'string' ? JSON.parse(brand.theme_settings) : brand.theme_settings;
                if (!theme.connected_channels) return false;
                if (platform === 'meta') {
                    return !!(theme.connected_channels['Facebook']?.active || theme.connected_channels['Instagram']?.active);
                }
                if (platform === 'x') {
                    return !!theme.connected_channels['X / Twitter']?.active;
                }
                if (platform === 'google') {
                    return !!theme.connected_channels['Google']?.active;
                }
            } catch (e) {}
            return false;
        },
        openOAuthConnector(platform) {
            let title = 'Authorize Channel';
            let desc = 'Connect your account to allow automatic catalog synchronization.';
            let icon = '🔌';
            let scopesHtml = '<li>Sync catalog & product lists</li>';
            
            let dbPlatformName = '';
            if (platform === 'meta') {
                dbPlatformName = 'Facebook';
                title = 'Meta Business Suite Connector';
                desc = 'Connect your Meta Business Suite to publish storefront items to Facebook & Instagram Shops.';
                icon = '👥';
                scopesHtml = `
                    <li>Access and edit Meta Catalog Manager</li>
                    <li>Sync Facebook Page Shop & Instagram Shop assets</li>
                `;
            } else if (platform === 'x') {
                dbPlatformName = 'X / Twitter';
                title = 'X Professional OAuth Consent';
                desc = 'Authorize Strickly Coffee to manage X Professional profile showcase modules.';
                icon = '🐦';
                scopesHtml = `
                    <li>Write professional profile product module</li>
                    <li>Automatically pin shop links in bio</li>
                `;
            } else if (platform === 'google') {
                dbPlatformName = 'Google';
                title = 'Google Merchant Center OAuth';
                desc = 'Authorize access to Google Merchant Center to publish items on Google Shopping tab.';
                icon = '🔍';
                scopesHtml = `
                    <li>Manage Google Merchant Center inventories</li>
                    <li>Publish active products on Shopping tabs</li>
                `;
            }

            const popup = window.open('', 'OAuthConsent', 'width=580,height=580,status=yes,resizable=yes');
            if (popup) {
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
                          <button class="btn" onclick="window.opener.postMessage('oauth_success_campaigns_${platform}', '*'); window.close();">Authorize & Connect</button>
                          <button class="btn-cancel" onclick="window.close();">Cancel</button>
                        </div>
                      </body>
                    </html>
                `);

                const onMessage = async (event) => {
                    if (event.data === `oauth_success_campaigns_${platform}`) {
                        window.removeEventListener('message', onMessage);
                        await this.saveCampaignsSocialConnection(dbPlatformName);
                    }
                };
                window.addEventListener('message', onMessage);
            }
        },
        async saveCampaignsSocialConnection(platformName) {
            const brand = this.activeBrand;
            let theme = {};
            if (brand.theme_settings) {
                try {
                    theme = typeof brand.theme_settings === 'string' ? JSON.parse(brand.theme_settings) : brand.theme_settings;
                } catch(e) {}
            }
            if (!theme.connected_channels) theme.connected_channels = {};
            
            theme.connected_channels[platformName] = {
                active: true,
                connectedAt: new Date().toISOString(),
                autoSync: true,
                autoLink: true,
                autoPin: platformName === 'X / Twitter',
                accountName: `Mocked \${platformName} Account`
            };

            if (platformName === 'Facebook') {
                theme.connected_channels['Instagram'] = { ...theme.connected_channels['Facebook'] };
            }

            brand.theme_settings = JSON.stringify(theme);

            try {
                const response = await fetch('/api/global/brands/save-theme-settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.app.adminToken}`
                    },
                    body: JSON.stringify(brand)
                });
                if (response.ok) {
                    this.app.showNotification(`Successfully connected \${platformName} account!`);
                    await this.app.loadBrands();
                }
            } catch(err) {
                console.error(err);
            }
        },
        setCampaignType(type) {
            this.newCampaign.campaign_type = type;
            if (type === 'manual') {
                this.selectedProductId = '';
                this.selectedLandingPageId = '';
                this.newCampaign.destination_type = 'homepage';
                this.newCampaign.landing_page_id = '';
            }
        },
        applyProductCatalogDetails() {
            if (!this.selectedProductId) return;
            const product = this.app.products.find(p => p.id === Number(this.selectedProductId));
            if (product) {
                this.newCampaign.name = `Promo: ${product.title}`;
                this.newCampaign.headline = `Shop the all-new ${product.title}!`;
                this.newCampaign.ad_copy = `Get premium ${product.title} starting from €${parseFloat(product.price).toFixed(2)}. ${product.description || ''}`;
                this.newCampaign.media_url = product.image || '';
                this.newCampaign.destination_type = 'homepage';
                
                this.autofillCarousel();
            }
        },
        applyLandingPageDetails() {
            if (!this.selectedLandingPageId) return;
            const page = this.availableLandingPages.find(p => p.id === this.selectedLandingPageId);
            if (page) {
                this.newCampaign.name = `Campaign: ${page.title}`;
                this.newCampaign.headline = page.title;
                
                const brand = this.activeBrand;
                let sub = '';
                let img = '';
                if (brand.theme_settings) {
                    try {
                        const settings = typeof brand.theme_settings === 'string' ? JSON.parse(brand.theme_settings) : brand.theme_settings;
                        if (settings.landing_pages && Array.isArray(settings.landing_pages)) {
                            const matched = settings.landing_pages.find(p => p.id === page.id);
                            if (matched) {
                                sub = matched.subheadline || '';
                                img = matched.hero_img || '';
                            }
                        }
                    } catch(e) {}
                }
                
                this.newCampaign.ad_copy = sub || `Exclusive Equipment Promo. Click to view catalog offerings.`;
                this.newCampaign.media_url = img || '';
                this.newCampaign.destination_type = 'landing_page';
                this.newCampaign.landing_page_id = page.id;
            }
        },
        selectCatalogImage(url) {
            this.newCampaign.media_url = url;
            this.app.showNotification('Catalog image selected for ad creative.');
        },
        async uploadAdMedia(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            this.uploadingMedia = true;
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'Campaigns');
            formData.append('title', file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
            
            try {
                const response = await fetch('/api/global/media', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.app.adminToken}`
                    },
                    body: formData
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.newCampaign.media_url = data.item.url;
                    this.app.showNotification('Media asset uploaded and linked successfully.');
                } else {
                    alert('Failed to upload image. Please try again.');
                }
            } catch (err) {
                console.error(err);
                alert('Upload error: ' + err.message);
            } finally {
                this.uploadingMedia = false;
            }
        },
        onCarouselProductSelect(idx, event) {
            const productId = event.target.value;
            if (!productId) return;
            const product = this.app.products.find(p => p.id === Number(productId));
            if (product) {
                this.newCampaign.carousel_cards[idx] = {
                    image: product.image || '',
                    title: product.title || '',
                    link: `/store/${this.activeBrand.id}?product=${product.id}`
                };
                this.app.showNotification(`Linked Carousel Card #${idx+1} to product "${product.title}"`);
            }
        },
        async uploadCarouselCardMedia(idx, event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'Campaigns');
            formData.append('title', `Carousel Card #${idx+1} - ${file.name}`);
            
            try {
                this.app.showNotification(`Uploading image for Card #${idx+1}...`);
                const response = await fetch('/api/global/media', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.app.adminToken}`
                    },
                    body: formData
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.newCampaign.carousel_cards[idx].image = data.item.url;
                    this.app.showNotification(`Successfully uploaded image for Card #${idx+1}!`);
                } else {
                    alert('Failed to upload image. Please try again.');
                }
            } catch (err) {
                console.error(err);
                alert('Upload error: ' + err.message);
            }
        },
        async loadMediaLibrary() {
            try {
                const response = await fetch('/api/global/media', {
                    headers: { 'Authorization': `Bearer ${this.app.adminToken}` }
                });
                if (response.ok) {
                    this.mediaLibraryItems = await response.json();
                }
            } catch (err) {
                console.error('Error loading media library inside campaigns builder:', err);
            }
        },
        async translateCampaignWithAI(targetLang) {
            if (!this.newCampaign.headline && !this.newCampaign.ad_copy) {
                alert('Please enter a headline or description in English first to translate.');
                return;
            }
            
            this.translatingCampaign = true;
            try {
                if (this.newCampaign.headline) {
                    const response = await fetch('/api/global/translate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.app.adminToken}`
                        },
                        body: JSON.stringify({
                            text: this.newCampaign.headline,
                            targetLang: targetLang,
                            sourceLang: 'en'
                        })
                    });
                    if (response.ok) {
                        const res = await response.json();
                        this.newCampaign.translations[targetLang].headline = res.translatedText;
                    }
                }
                
                if (this.newCampaign.ad_copy) {
                    const response = await fetch('/api/global/translate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.app.adminToken}`
                        },
                        body: JSON.stringify({
                            text: this.newCampaign.ad_copy,
                            targetLang: targetLang,
                            sourceLang: 'en'
                        })
                    });
                    if (response.ok) {
                        const res = await response.json();
                        this.newCampaign.translations[targetLang].ad_copy = res.translatedText;
                    }
                }
                
                this.app.showNotification(`Successfully auto-translated text to ${targetLang.toUpperCase()}!`);
            } catch(e) {
                console.error(e);
                alert('AI translation error: ' + e.message);
            } finally {
                this.translatingCampaign = false;
            }
        }
    }
}
</script>

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
        <div class="upcoming-modal" v-if="showCreateCampaignModal" @click="handleCreateCampaignBackdropClick">
            <div class="upcoming-card" @click.stop style="max-width: 1200px; width: 100%; height: 85vh; max-height: 780px; text-align: left; padding: 24px; display: flex; flex-direction: column; overflow: hidden; border-radius: 12px; box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4); border: 1px solid var(--border); background: var(--card-bg);">
                <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
                    <!-- Top Left: Cancel Button -->
                    <button type="button" @click="closeCreateCampaignModal" class="btn btn-secondary" style="font-size: 0.76rem; padding: 6px 12px; height: 32px; border: 1px solid var(--border); margin: 0; display: flex; align-items: center; gap: 4px;">
                        ✕ Cancel
                    </button>
                    
                    <!-- Center: Title -->
                    <span style="font-size: 1.25rem;">🚀 Launch Omnichannel Campaign</span>
                    
                    <!-- Top Right: Actions -->
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button type="button" @click="saveCampaignAsDraft" class="btn btn-secondary" style="font-size: 0.76rem; padding: 6px 12px; height: 32px; border: 1px solid var(--border); margin: 0; display: flex; align-items: center; gap: 4px;">
                            💾 Save Draft
                        </button>
                        <button type="submit" form="campaign-creation-form" class="btn btn-accent" style="font-size: 0.76rem; padding: 6px 16px; height: 32px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 4px;">
                            🚀 Publish Campaign
                        </button>
                    </div>
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

                <form id="campaign-creation-form" @submit.prevent="saveCampaign" style="flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding-right: 8px;">
                    <!-- Campaign Focus / Goal Selector -->
                    <div style="margin-bottom: 16px;">
                        <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-weight: 700; color: var(--text-main); font-size: 0.85rem;">
                            <span>Campaign Focus / Goal</span>
                            <span class="info-tooltip-trigger" data-tooltip="Select the core goal of your campaign: custom copy promo, highlighting a specific catalog product, or driving traffic to a custom landing page.">i</span>
                        </label>
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
                        <label style="display: flex; align-items: center; gap: 6px; font-weight: 700; margin-bottom: 6px;">
                            <span>Select Product to Promote</span>
                            <span class="info-tooltip-trigger" data-tooltip="The target catalog product that the generated ads will link to and track conversions for.">i</span>
                        </label>
                        <select v-model="selectedProductId" @change="applyProductCatalogDetails" style="width: 100%; border-radius: 6px; padding: 8px; font-size: 0.85rem;" required>
                            <option value="">-- Choose a Product --</option>
                            <option v-for="p in app.products" :key="p.id" :value="p.id">
                                {{ p.title }} (Price: €{{ parseFloat(p.price).toFixed(2) }})
                            </option>
                        </select>
                    </div>

                    <!-- Target Campaign Landing Page select -->
                    <div v-if="newCampaign.campaign_type === 'page'" class="form-group" style="margin-bottom: 12px; background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 12px; border-radius: 8px;">
                        <label style="display: flex; align-items: center; gap: 6px; font-weight: 700; margin-bottom: 6px;">
                            <span>Select Target Landing Page</span>
                            <span class="info-tooltip-trigger" data-tooltip="The specific custom landing page destination where users will be redirected upon clicking your ad.">i</span>
                        </label>
                        <select v-model="selectedLandingPageId" @change="applyLandingPageDetails" style="width: 100%; border-radius: 6px; padding: 8px; font-size: 0.85rem;" required>
                            <option value="">-- Choose a Landing Page --</option>
                            <option v-for="page in availableLandingPages" :key="page.id" :value="page.id">
                                {{ page.title }} (Slug: /{{ page.id }})
                            </option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 12px;">
                        <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                            <span>Campaign Title</span>
                            <span class="info-tooltip-trigger" data-tooltip="A friendly internal label to identify this campaign in your dashboard reports.">i</span>
                        </label>
                        <input type="text" v-model="newCampaign.name" placeholder="e.g. Summer Special Coffee Offer" required
                            style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                    </div>

                    <div style="margin-bottom: 12px;">
                        <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-weight: 700; color: var(--text-main); font-size: 0.85rem;">
                            <span>Ad Publishing Channels (Omnichannel Multi-Select)</span>
                            <span class="info-tooltip-trigger" data-tooltip="Select the ad networks where our AI agent will automatically construct and publish your campaign creatives.">i</span>
                        </label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                            <!-- Meta Ads Option -->
                            <div :style="{
                                     background: newCampaign.platforms.includes('meta') ? '#ffffff' : 'var(--card-bg)',
                                     color: newCampaign.platforms.includes('meta') ? '#000000' : 'var(--text-main)',
                                     border: '1px solid ' + (newCampaign.platforms.includes('meta') ? '#ffffff' : 'var(--border)')
                                 }"
                                 style="padding: 8px; border-radius: 8px; display: flex; flex-direction: column; gap: 4px; justify-content: space-between; font-size: 0.76rem; transition: all 0.2s ease;">
                                <label :style="{ color: newCampaign.platforms.includes('meta') ? '#000000' : 'var(--text-main)' }"
                                       style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin: 0; font-weight: 600;">
                                    <input type="checkbox" value="meta" v-model="newCampaign.platforms" style="width: 14px; height: 14px; margin: 0; cursor: pointer;">
                                    <svg viewBox="0 0 24 24" width="16" height="16" :fill="newCampaign.platforms.includes('meta') ? '#0064E0' : '#ffffff'" style="vertical-align: middle; display: inline-block;"><path d="M16.5 6C14.28 6 12.55 7.25 12 9.07 11.45 7.25 9.72 6 7.5 6 4.46 6 2 8.46 2 11.5S4.46 17 7.5 17c2.22 0 3.95-1.25 4.5-3.07.55 1.82 2.28 3.07 4.5 3.07 3.04 0 5.5-2.46 5.5-5.5S19.54 6 16.5 6zm-9 9c-1.93 0-3.5-1.57-3.5-3.5S5.57 8 7.5 8s3.5 1.57 3.5 3.5S9.43 15 7.5 15zm9 0c-1.93 0-3.5-1.57-3.5-3.5S14.57 8 16.5 8s3.5 1.57 3.5 3.5S18.43 15 16.5 15z"/></svg>
                                    <span>Meta Ads</span>
                                </label>
                                <span v-if="!isChannelConnected('meta')"
                                      :style="{
                                          color: newCampaign.platforms.includes('meta') ? '#b25e00' : '#eab308',
                                          background: newCampaign.platforms.includes('meta') ? 'rgba(178,94,0,0.1)' : 'rgba(234,179,8,0.1)'
                                      }"
                                      style="font-size: 0.65rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-align: center; transition: all 0.2s ease;">
                                    ⚠️ <a href="#" @click.prevent="openOAuthConnector('meta')" :style="{ color: newCampaign.platforms.includes('meta') ? '#b25e00' : '#eab308' }" style="text-decoration: underline;">Disconnected</a>
                                </span>
                                <span v-else
                                      :style="{
                                          color: '#10b981',
                                          background: newCampaign.platforms.includes('meta') ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
                                      }"
                                      style="font-size: 0.65rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-align: center; transition: all 0.2s ease;">
                                    ✓ Connected
                                </span>
                            </div>

                            <!-- Google Ads Option -->
                            <div :style="{
                                     background: newCampaign.platforms.includes('google') ? '#ffffff' : 'var(--card-bg)',
                                     color: newCampaign.platforms.includes('google') ? '#000000' : 'var(--text-main)',
                                     border: '1px solid ' + (newCampaign.platforms.includes('google') ? '#ffffff' : 'var(--border)')
                                 }"
                                 style="padding: 8px; border-radius: 8px; display: flex; flex-direction: column; gap: 4px; justify-content: space-between; font-size: 0.76rem; transition: all 0.2s ease;">
                                <label :style="{ color: newCampaign.platforms.includes('google') ? '#000000' : 'var(--text-main)' }"
                                       style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin: 0; font-weight: 600;">
                                    <input type="checkbox" value="google" v-model="newCampaign.platforms" style="width: 14px; height: 14px; margin: 0; cursor: pointer;">
                                    <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle; display: inline-block;">
                                        <path :fill="newCampaign.platforms.includes('google') ? '#4285F4' : '#ffffff'" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path :fill="newCampaign.platforms.includes('google') ? '#34A853' : '#ffffff'" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path :fill="newCampaign.platforms.includes('google') ? '#FBBC05' : '#ffffff'" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.08-.2-.08-.43-.08-.63z"/>
                                        <path :fill="newCampaign.platforms.includes('google') ? '#EA4335' : '#ffffff'" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                    </svg>
                                    <span>Google Ads</span>
                                </label>
                                <span v-if="!isChannelConnected('google')"
                                      :style="{
                                          color: newCampaign.platforms.includes('google') ? '#b25e00' : '#eab308',
                                          background: newCampaign.platforms.includes('google') ? 'rgba(178,94,0,0.1)' : 'rgba(234,179,8,0.1)'
                                      }"
                                      style="font-size: 0.65rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-align: center; transition: all 0.2s ease;">
                                    ⚠️ <a href="#" @click.prevent="openOAuthConnector('google')" :style="{ color: newCampaign.platforms.includes('google') ? '#b25e00' : '#eab308' }" style="text-decoration: underline;">Disconnected</a>
                                </span>
                                <span v-else
                                      :style="{
                                          color: '#10b981',
                                          background: newCampaign.platforms.includes('google') ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
                                      }"
                                      style="font-size: 0.65rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-align: center; transition: all 0.2s ease;">
                                    ✓ Connected
                                </span>
                            </div>

                            <!-- Twitter / X Ads Option -->
                            <div :style="{
                                     background: newCampaign.platforms.includes('x') ? '#ffffff' : 'var(--card-bg)',
                                     color: newCampaign.platforms.includes('x') ? '#000000' : 'var(--text-main)',
                                     border: '1px solid ' + (newCampaign.platforms.includes('x') ? '#ffffff' : 'var(--border)')
                                 }"
                                 style="padding: 8px; border-radius: 8px; display: flex; flex-direction: column; gap: 4px; justify-content: space-between; font-size: 0.76rem; transition: all 0.2s ease;">
                                <label :style="{ color: newCampaign.platforms.includes('x') ? '#000000' : 'var(--text-main)' }"
                                       style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin: 0; font-weight: 600;">
                                    <input type="checkbox" value="x" v-model="newCampaign.platforms" style="width: 14px; height: 14px; margin: 0; cursor: pointer;">
                                    <svg viewBox="0 0 24 24" width="14" height="14" :fill="newCampaign.platforms.includes('x') ? '#000000' : '#ffffff'" style="vertical-align: middle; display: inline-block;"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                    <span>X / Twitter</span>
                                </label>
                                <span v-if="!isChannelConnected('x')"
                                      :style="{
                                          color: newCampaign.platforms.includes('x') ? '#b25e00' : '#eab308',
                                          background: newCampaign.platforms.includes('x') ? 'rgba(178,94,0,0.1)' : 'rgba(234,179,8,0.1)'
                                      }"
                                      style="font-size: 0.65rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-align: center; transition: all 0.2s ease;">
                                    ⚠️ <a href="#" @click.prevent="openOAuthConnector('x')" :style="{ color: newCampaign.platforms.includes('x') ? '#b25e00' : '#eab308' }" style="text-decoration: underline;">Disconnected</a>
                                </span>
                                <span v-else
                                      :style="{
                                          color: '#10b981',
                                          background: newCampaign.platforms.includes('x') ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
                                      }"
                                      style="font-size: 0.65rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-align: center; transition: all 0.2s ease;">
                                    ✓ Connected
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Date & Budget Row -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                <span>Budget Limit (€)</span>
                                <span class="info-tooltip-trigger" data-tooltip="The maximum total ad spend limit allocated to this campaign. Campaigns automatically pause once this limit is reached.">i</span>
                            </label>
                            <input type="number" v-model.number="newCampaign.budget" required min="10"
                                style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                        </div>
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                <span>Budget Type</span>
                                <span class="info-tooltip-trigger" data-tooltip="Lifetime Budget spends the limit evenly across the entire duration. Daily Budget Cap limits maximum spend per day.">i</span>
                            </label>
                            <select v-model="newCampaign.budget_type" style="width: 100%;">
                                <option value="lifetime">Lifetime Budget</option>
                                <option value="daily">Daily Budget Cap</option>
                            </select>
                        </div>
                    </div>

                    <!-- Scheduling Row -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                <span>Start Date</span>
                                <span class="info-tooltip-trigger" data-tooltip="The starting date when the campaign goes active and ad publishing begins.">i</span>
                            </label>
                            <input type="date" v-model="newCampaign.start_date" required
                                style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                        </div>
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                <span>End Date</span>
                                <span class="info-tooltip-trigger" data-tooltip="The ending date when the campaign automatically pauses.">i</span>
                            </label>
                            <input type="date" v-model="newCampaign.end_date" required
                                style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                        </div>
                    </div>

                    <!-- Bidding Strategy Row -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                <span>Bidding Strategy</span>
                                <span class="info-tooltip-trigger" data-tooltip="Manual Bidding: You set cost-per-click caps. Maximize Conversions: AI bids to get the most conversions. Target ROAS: AI bids to hit a specific return on ad spend.">i</span>
                            </label>
                            <select v-model="newCampaign.bidding_strategy" style="width: 100%;">
                                <option value="manual">Manual Bidding</option>
                                <option value="max_conversions">Maximize Conversions</option>
                                <option value="target_roas">Target ROAS (AI Bidding)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <template v-if="newCampaign.bidding_strategy === 'target_roas'">
                                <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                    <span>Target ROAS (x)</span>
                                    <span class="info-tooltip-trigger" data-tooltip="The Target Return on Ad Spend multiplier (e.g. 3.5 means €3.50 in sales generated per €1.00 spent on advertising).">i</span>
                                </label>
                                <input type="number" step="0.1" min="0.5" max="15.0" v-model.number="newCampaign.target_roas" required
                                    style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                            </template>
                            <template v-else>
                                <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                    <span>Audience Target Segment</span>
                                    <span class="info-tooltip-trigger" data-tooltip="Select the customer cohort targeted by this campaign. High Spenders (CLV > €100), Dormant (no purchases > 30 days), Repeat (>= 2 orders), Lookalike (cold traffic matches).">i</span>
                                </label>
                                <select v-model="newCampaign.segmentation" style="width: 100%;">
                                    <option value="All Customers">All Store Customers</option>
                                    <option value="Repeat Customers">Repeat Customers (>= 2 orders)</option>
                                    <option value="High Spenders">High-Value Spenders (CLV > €100)</option>
                                    <option value="Dormant Shoppers">Dormant Shoppers (No purchases > 30 days)</option>
                                    <option value="Prospects / Lookalike">Cold Traffic / Lookalike Audiences</option>
                                </select>
                            </template>
                        </div>
                    </div>

                    <!-- Additional targeting criteria segment option (rendered if target_roas is active) -->
                    <div v-if="newCampaign.bidding_strategy === 'target_roas'" style="margin-bottom: 12px;">
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                <span>Audience Target Segment</span>
                                <span class="info-tooltip-trigger" data-tooltip="Select the customer cohort targeted by this campaign. High Spenders (CLV > €100), Dormant (no purchases > 30 days), Repeat (>= 2 orders), Lookalike (cold traffic matches).">i</span>
                            </label>
                            <select v-model="newCampaign.segmentation" style="width: 100%;">
                                <option value="All Customers">All Store Customers</option>
                                <option value="Repeat Customers">Repeat Customers (>= 2 orders)</option>
                                <option value="High Spenders">High-Value Spenders (CLV > €100)</option>
                                <option value="Dormant Shoppers">Dormant Shoppers (No purchases > 30 days)</option>
                                <option value="Prospects / Lookalike">Cold Traffic / Lookalike Audiences</option>
                            </select>
                        </div>
                    </div>

                    <!-- AI Budget Advisor & Outcome Predictor Widget -->
                    <div style="background: rgba(96, 165, 250, 0.04); border: 1px solid rgba(96, 165, 250, 0.2); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
                        <h4 style="margin: 0 0 10px 0; color: #60a5fa; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
                            <span>🔮 AI Budget Advisor & Projections</span>
                        </h4>
                        
                        <div style="font-size: 0.78rem; color: var(--text-main); line-height: 1.4; display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.15); padding: 8px; border-radius: 6px; border: 1px solid var(--border);">
                                <span style="font-size: 1.1rem;">💡</span>
                                <div>
                                    <strong style="color: #60a5fa;">Advised Budget:</strong> We recommend setting your budget to at least <strong>€{{ advisedBudget.toFixed(2) }}</strong> based on target ROAS and the estimated reach of your chosen audience segment.
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 4px; text-align: center;">
                                <div style="background: rgba(0,0,0,0.15); padding: 8px; border-radius: 6px; border: 1px solid var(--border);">
                                    <div style="font-size: 0.6rem; color: var(--text-muted);">Est. Conversions</div>
                                    <strong style="font-size: 0.9rem; color: var(--text-main);">{{ outcomeProjections.conversions }}</strong>
                                </div>
                                <div style="background: rgba(0,0,0,0.15); padding: 8px; border-radius: 6px; border: 1px solid var(--border);">
                                    <div style="font-size: 0.6rem; color: var(--text-muted);">Est. Sales Volume</div>
                                    <strong style="font-size: 0.9rem; color: #10b981;">€{{ outcomeProjections.sales.toFixed(2) }}</strong>
                                </div>
                                <div style="background: rgba(0,0,0,0.15); padding: 8px; border-radius: 6px; border: 1px solid var(--border);">
                                    <div style="font-size: 0.6rem; color: var(--text-muted);">Projected ROAS</div>
                                    <strong style="font-size: 0.9rem; color: var(--text-main);">{{ outcomeProjections.roas }}x</strong>
                                </div>
                            </div>
                        </div>
                    </div>



                    <div v-if="newCampaign.campaign_type === 'manual'" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                <span>Destination Target</span>
                                <span class="info-tooltip-trigger" data-tooltip="Choose where users land after clicking your ad: Storefront Homepage, specific Campaign Landing Page, or a custom target URL.">i</span>
                            </label>
                            <select v-model="newCampaign.destination_type" style="width: 100%;">
                                <option value="homepage">Storefront Homepage</option>
                                <option value="landing_page">Campaign Landing Page</option>
                                <option value="custom_url">Custom Target URL</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <template v-if="newCampaign.destination_type === 'custom_url'">
                                <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                    <span>Custom Target URL</span>
                                    <span class="info-tooltip-trigger" data-tooltip="The absolute web URL where users will be redirected (e.g. an Instagram link, external shop, or custom page).">i</span>
                                </label>
                                <input type="text" v-model="newCampaign.custom_url" placeholder="e.g. https://instagram.com/my-page" required
                                    style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                            </template>
                            <template v-else>
                                <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                    <span>Select Landing Page</span>
                                    <span class="info-tooltip-trigger" data-tooltip="Choose one of your active built-in landing pages to redirect traffic to.">i</span>
                                </label>
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
                        <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                            <span>Target Locales (Languages)</span>
                            <span class="info-tooltip-trigger" data-tooltip="Select the languages to publish the ad copy in. The AI will automatically localize copywriting to match target user preferences.">i</span>
                        </label>
                        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                            <label v-for="lang in availableLocales" :key="lang" style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; cursor: pointer; color: var(--text-main);">
                                <input type="checkbox" :value="lang" v-model="newCampaign.languages" style="margin: 0;">
                                <span>{{ lang.toUpperCase() }}</span>
                            </label>
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 12px;">
                        <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                            <span>Ad Format</span>
                            <span class="info-tooltip-trigger" data-tooltip="The layout and style of the ad post: Single Image, Video Variant, or a multi-product swipeable Carousel.">i</span>
                        </label>
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
                            <button v-if="campaignContentLang !== 'en'" type="button" class="btn btn-accent" style="font-size: 0.7rem; padding: 3px 8px; height: auto; display: flex; align-items: center; gap: 4px; margin: 0; border-radius: 6px;" @click="triggerCampaignTranslation(campaignContentLang)" :disabled="translatingCampaign">
                                <span v-if="translatingCampaign" style="display: inline-block; width: 10px; height: 10px; border: 2px solid var(--text-muted); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></span>
                                <span v-else-if="!app.isFeatureAllowed('allow_translator')">🔒 AI Translate</span>
                                <span v-else>✨ AI Translate from EN [Gemini 2.5 Flash] [~$0.0003]</span>
                            </button>
                        </div>

                        <!-- AI Copywriter Studio Panel (Only visible on English variant) -->
                        <div v-if="campaignContentLang === 'en'" style="background: rgba(96,165,250,0.03); border: 1px solid rgba(96,165,250,0.15); border-radius: 8px; padding: 10px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 0.76rem; font-weight: 700; color: var(--text-main);">🤖 AI Tone:</span>
                                <select v-model="selectedTone" style="font-size: 0.72rem; padding: 4px 20px 4px 8px !important; border-radius: 6px; height: 28px; width: 120px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main);">
                                    <option value="friendly">☕ Friendly</option>
                                    <option value="bold">🔥 Bold & Urgent</option>
                                    <option value="creative">✨ Creative</option>
                                    <option value="professional">💼 Professional</option>
                                </select>
                            </div>
                            <button type="button" @click="generateAICopy" :disabled="generatingAICopy" class="btn btn-primary" style="font-size: 0.72rem; padding: 4px 10px; height: 28px; display: flex; align-items: center; gap: 4px; margin: 0;">
                                <span v-if="generatingAICopy" style="display: inline-block; width: 10px; height: 10px; border: 2px solid var(--text-muted); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></span>
                                <span v-else-if="!app.isFeatureAllowed('allow_copywriter')">🔒 Write Copy</span>
                                <span v-else>Write Copy [Gemini 2.5 Flash] [~$0.0004]</span>
                            </button>
                        </div>

                        <!-- Ad Headline Copy for the active tab -->
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">
                                <span>Ad Headline Copy</span>
                                <span class="info-tooltip-trigger" data-tooltip="The main bold title text displayed on the ad post (e.g. Try Our Premium Special Roasts Today!).">i</span>
                            </label>
                            <input v-if="campaignContentLang === 'en'" type="text" v-model="newCampaign.headline" placeholder="e.g. Try Our Premium Special Roasts Today!"
                                style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                            <input v-else type="text" v-model="newCampaign.translations[campaignContentLang].headline" :placeholder="'[AI Translation Pending] e.g. Probieren Sie noch heute unsere Premium-Röstungen!'"
                                style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                        </div>

                        <!-- Body Description for the active tab -->
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">
                                <span>Body Description Text</span>
                                <span class="info-tooltip-trigger" data-tooltip="The primary body text/copywriting that details the offer and convinces readers to click.">i</span>
                            </label>
                            <textarea v-if="campaignContentLang === 'en'" v-model="newCampaign.ad_copy" rows="3" placeholder="Write compelling marketing ad descriptions..."
                                style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                            <textarea v-else v-model="newCampaign.translations[campaignContentLang].ad_copy" rows="3" :placeholder="'[AI Translation Pending] e.g. Schreiben Sie hier ansprechende Werbebeschreibungen...'"
                                style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                        </div>

                        <!-- A/B Creative split testing -->
                        <div style="border-top: 1px dashed var(--border); margin-top: 12px; padding-top: 12px;">
                            <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--text-main); font-size: 0.8rem; cursor: pointer; margin-bottom: 8px;">
                                <input type="checkbox" id="enableABTesting" v-model="newCampaign.enable_ab_testing" style="width: 14px; height: 14px; margin: 0; cursor: pointer;">
                                <span>🏆 Enable Creative A/B split-testing Tournament</span>
                                <span class="info-tooltip-trigger" data-tooltip="Instructs the ad networks to distribute traffic between different headline variants to automatically discover the best performer.">i</span>
                            </label>
                            
                            <div v-if="newCampaign.enable_ab_testing" style="display: flex; flex-direction: column; gap: 10px; padding: 10px; background: rgba(0,0,0,0.15); border-radius: 8px; border: 1px solid var(--border); margin-top: 8px;">
                                <div class="form-group" style="margin: 0;">
                                    <label style="display: flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: bold; color: var(--text-muted); margin-bottom: 4px;">
                                        <span>Alternative Tournament Headline A</span>
                                        <span class="info-tooltip-trigger" data-tooltip="The first alternative headline variant to split test in the performance tournament.">i</span>
                                    </label>
                                    <input type="text" v-model="newCampaign.headlines[0]" placeholder="e.g. Sip Better Coffee Today ☕"
                                        style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.8rem; height: 32px;">
                                </div>
                                <div class="form-group" style="margin: 0;">
                                    <label style="display: flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: bold; color: var(--text-muted); margin-bottom: 4px;">
                                        <span>Alternative Tournament Headline B</span>
                                        <span class="info-tooltip-trigger" data-tooltip="The second alternative headline variant to split test in the performance tournament.">i</span>
                                    </label>
                                    <input type="text" v-model="newCampaign.headlines[1]" placeholder="e.g. Save 20% on Expert Coffee Gear!"
                                        style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.8rem; height: 32px;">
                                </div>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px;">
                                    <div class="form-group" style="margin: 0;">
                                        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.68rem; font-weight: bold; color: var(--text-muted); margin-bottom: 4px;">
                                            <span>Tournament Warm-up (Days)</span>
                                            <span class="info-tooltip-trigger" data-tooltip="The active warm-up duration to gather baseline variant performance data.">i</span>
                                        </label>
                                        <input type="number" v-model.number="newCampaign.warmup_days"
                                            style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 4px 8px; font-size: 0.8rem; height: 32px;">
                                    </div>
                                    <div class="form-group" style="margin: 0;">
                                        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.68rem; font-weight: bold; color: var(--text-muted); margin-bottom: 4px;">
                                            <span>Budget Split (% for testing)</span>
                                            <span class="info-tooltip-trigger" data-tooltip="The percentage of campaign budget dedicated to testing alternative variants.">i</span>
                                        </label>
                                        <input type="number" v-model.number="newCampaign.warmup_budget_percent"
                                            style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 4px 8px; font-size: 0.8rem; height: 32px;">
                                    </div>
                                </div>
                            </div>
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

                    <!-- AI Campaign Agent Optimizer (Optional Setup) -->
                    <div style="border-top: 1px dashed var(--border); margin-top: 16px; padding-top: 16px; margin-bottom: 16px;">
                        <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--accent); font-size: 0.82rem; cursor: pointer; margin-bottom: 8px;">
                            <input type="checkbox" v-model="newCampaign.autopilot_enabled" style="width: 14px; height: 14px; margin: 0; cursor: pointer;">
                            <span>🤖 Activate Campaign AI Agent Optimizer</span>
                        </label>
                        <p style="margin: 0 0 10px 0; font-size: 0.72rem; color: var(--text-muted); line-height: 1.4;">
                            Enable AI specialists to optimize copy variants, adjust budgets, and implement safety floors in real-time.
                        </p>

                        <div v-if="newCampaign.autopilot_enabled" style="display: flex; flex-direction: column; gap: 10px; padding: 12px; background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 8px;">
                            <div class="form-group" style="margin: 0;">
                                <label style="display: block; font-size: 0.72rem; font-weight: bold; color: var(--text-muted); margin-bottom: 4px;">Agent Execution Mode</label>
                                <select v-model="newCampaign.agent_mode" style="width: 100%; border-radius: 6px; padding: 6px; font-size: 0.78rem;">
                                    <option value="recommendation">Co-Pilot (Recommendation Mode)</option>
                                    <option value="autonomous">Autopilot (Autonomous Mode)</option>
                                </select>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div class="form-group" style="margin: 0;">
                                    <label style="display: block; font-size: 0.72rem; font-weight: bold; color: var(--text-muted); margin-bottom: 4px;">Max Budget Change (%)</label>
                                    <input type="number" v-model.number="newCampaign.autopilot_guardrails.max_budget_change_pct" style="width: 100%; border-radius: 6px; padding: 6px; font-size: 0.78rem; height: 32px;">
                                </div>
                                <div class="form-group" style="margin: 0;">
                                    <label style="display: block; font-size: 0.72rem; font-weight: bold; color: var(--text-muted); margin-bottom: 4px;">Min ROAS Floor</label>
                                    <input type="number" step="0.1" v-model.number="newCampaign.autopilot_guardrails.min_roas_floor" style="width: 100%; border-radius: 6px; padding: 6px; font-size: 0.78rem; height: 32px;">
                                </div>
                            </div>
                            
                            <div class="form-group" style="margin: 0;">
                                <label style="display: block; font-size: 0.72rem; font-weight: bold; color: var(--text-muted); margin-bottom: 4px;">Max Daily Spend Ceiling (€)</label>
                                <input type="number" v-model.number="newCampaign.autopilot_guardrails.max_spend_ceiling" style="width: 100%; border-radius: 6px; padding: 6px; font-size: 0.78rem; height: 32px;">
                            </div>
                        </div>
                    </div>

                    <!-- Removed bottom duplicate button -->
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
        <!-- Active Marketing Campaigns Grid -->
        <div class="panel">
            <div class="panel-header" style="border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                    <h3 class="panel-title" style="margin: 0; font-size: 1.1rem;">Omnichannel Performance Suite</h3>
                    <div style="display: flex; gap: 4px; border-bottom: 1px solid transparent; flex-wrap: wrap;">
                        <button type="button" @click="activeTab = 'campaigns'" :style="{ borderBottom: activeTab === 'campaigns' ? '2px solid var(--accent)' : 'none', color: activeTab === 'campaigns' ? 'var(--text-main)' : 'var(--text-muted)' }" style="background: transparent; border: none; font-size: 0.8rem; padding: 4px 8px; cursor: pointer; font-weight: 600; padding-bottom: 8px;">
                            📋 Campaigns
                        </button>
                        <button type="button" @click="activeTab = 'autopilot'" :style="{ borderBottom: activeTab === 'autopilot' ? '2px solid var(--accent)' : 'none', color: activeTab === 'autopilot' ? 'var(--text-main)' : 'var(--text-muted)' }" style="background: transparent; border: none; font-size: 0.8rem; padding: 4px 8px; cursor: pointer; font-weight: 600; padding-bottom: 8px;">
                            🤖 Auto-Pilot
                        </button>
                        <button type="button" @click="activeTab = 'attribution'" :style="{ borderBottom: activeTab === 'attribution' ? '2px solid var(--accent)' : 'none', color: activeTab === 'attribution' ? 'var(--text-main)' : 'var(--text-muted)' }" style="background: transparent; border: none; font-size: 0.8rem; padding: 4px 8px; cursor: pointer; font-weight: 600; padding-bottom: 8px;">
                            📐 Attribution Modeling
                        </button>
                        <button type="button" @click="activeTab = 'creative'" :style="{ borderBottom: activeTab === 'creative' ? '2px solid var(--accent)' : 'none', color: activeTab === 'creative' ? 'var(--text-main)' : 'var(--text-muted)' }" style="background: transparent; border: none; font-size: 0.8rem; padding: 4px 8px; cursor: pointer; font-weight: 600; padding-bottom: 8px;">
                            🎨 Creative Audits
                        </button>
                    </div>
                </div>

                <!-- List/Calendar Toggle (only visible when in Campaigns tab) -->
                <div v-if="activeTab === 'campaigns'" style="display: flex; gap: 4px; background: rgba(255,255,255,0.03); padding: 2px; border-radius: 6px; border: 1px solid var(--border);">
                    <button type="button" @click="viewMode = 'list'" :style="{ background: viewMode === 'list' ? 'var(--accent)' : 'transparent', color: viewMode === 'list' ? 'var(--workspace-bg)' : 'var(--text-muted)' }" style="border: none; font-size: 0.72rem; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                        📋 List View
                    </button>
                    <button type="button" @click="viewMode = 'calendar'" :style="{ background: viewMode === 'calendar' ? 'var(--accent)' : 'transparent', color: viewMode === 'calendar' ? 'var(--workspace-bg)' : 'var(--text-muted)' }" style="border: none; font-size: 0.72rem; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                        📅 Calendar Planner
                    </button>
                </div>
            </div>

            <!-- TAB 1: Campaigns view -->
            <template v-if="activeTab === 'campaigns'">
                <!-- List View -->
                <template v-if="viewMode === 'list'">
                    <div v-if="campaigns.length === 0" style="padding: 40px; text-align: center; color: var(--text-muted); background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px;">
                        <div style="font-size: 1.5rem; margin-bottom: 8px;">📢</div>
                        <div style="font-weight: 600; color: var(--text-main); font-size: 0.9rem; margin-bottom: 4px;">No campaigns yet</div>
                        <div style="font-size: 0.8rem;">Build one above to start promoting your store!</div>
                    </div>
                    
                    <div v-else class="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th class="checkbox-cell" style="width: 40px;">
                                        <div class="checkbox-custom" :class="{ checked: isAllCampaignsSelected }" @click="toggleSelectAllCampaigns"></div>
                                    </th>
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
                                <tr v-for="c in campaigns" :key="c.id" :class="{ selected: selectedCampaignIds.includes(c.id) }" style="cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                    <td class="checkbox-cell" @click.stop>
                                        <div class="checkbox-custom" :class="{ checked: selectedCampaignIds.includes(c.id) }" @click="toggleSelectCampaign(c.id)"></div>
                                    </td>
                                    <td @click="selectCampaign(c)">
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
                                            <span v-if="aiProposals[c.id] && aiProposals[c.id].length > 0" @click.stop="activeTab = 'creative'" class="badge-simulation" style="font-size: 0.65rem; background: rgba(96, 165, 250, 0.15); color: #60a5fa; font-weight: 700; padding: 1px 4px; display: inline-flex; align-items: center; gap: 3px; cursor: pointer;">
                                                🤖 Review Proposal
                                            </span>
                                        </div>
                                    </td>
                                    <td @click="selectCampaign(c)">
                                        <span class="badge-simulation" style="font-size: 0.72rem; background: var(--border); color: var(--text-main);">
                                            {{ c.segmentation }}
                                        </span>
                                    </td>
                                    <td @click="selectCampaign(c)">
                                        <div style="display: flex; gap: 4px;">
                                            <span v-for="lang in parseLanguages(c.languages)" :key="lang" class="badge-simulation" style="font-size: 0.65rem; background: var(--border); color: var(--text-main); font-weight: 700; padding: 1px 4px;">
                                                {{ lang.toUpperCase() }}
                                            </span>
                                        </div>
                                    </td>
                                    <td @click="selectCampaign(c)">
                                        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                                            <span v-for="plat in (c.platform || '').split(',')" :key="plat" class="badge-simulation" style="font-size: 0.72rem; text-transform: capitalize; font-weight: 600;" :style="getPlatformStyle(plat)">
                                                {{ plat === 'x' ? 'X / Twitter' : plat }}
                                            </span>
                                        </div>
                                    </td>
                                    <td @click="selectCampaign(c)">{{ c.format }}</td>
                                    <td @click="selectCampaign(c)" style="text-align: center; font-weight: 600;">
                                        <div>€{{ parseFloat(c.budget).toFixed(2) }}</div>
                                        <div style="font-size: 0.65rem; color: var(--accent); font-weight: 700; margin-top: 3px;">
                                            🤖 Cost: ${{ parseFloat(c.ai_cost || 0).toFixed(4) }}
                                        </div>
                                    </td>
                                    <td @click="selectCampaign(c)" style="text-align: right;">
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

                    <!-- Floating Bulk Actions Bar -->
                    <div v-if="selectedCampaignIds.length > 0" class="bulk-actions-bar">
                        <span><strong>{{ selectedCampaignIds.length }}</strong> campaigns selected</span>
                        <div class="btn-group">
                            <button class="bulk-btn btn-danger" @click="performBulkDeleteCampaigns">Delete Selected</button>
                        </div>
                    </div>
                </template>

                <!-- Calendar Planner View -->
                <template v-else>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border);">
                        <button type="button" class="btn btn-secondary" @click="prevMonth" style="padding: 4px 10px; font-size: 0.75rem; height: auto;">◀ Prev</button>
                        <strong style="color: var(--text-main); font-size: 0.9rem;">
                            {{ getMonthName(currentMonth) }} {{ currentYear }}
                        </strong>
                        <button type="button" class="btn btn-secondary" @click="nextMonth" style="padding: 4px 10px; font-size: 0.75rem; height: auto;">Next ▶</button>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: var(--workspace-bg);">
                        <div v-for="dLabel in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="dLabel" style="text-align: center; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); padding: 8px 4px; background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--border);">
                            {{ dLabel }}
                        </div>

                        <div v-for="(week, wIdx) in getMonthWeeks()" :key="wIdx" style="display: contents;">
                            <div v-for="(day, dIdx) in week" :key="dIdx" :style="{ opacity: day.isCurrentMonth ? 1 : 0.35 }" style="min-height: 95px; padding: 6px; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; background: var(--card-bg);">
                                <div style="font-weight: 700; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 2px;">
                                    {{ day.dayNum }}
                                </div>
                                
                                <div style="display: flex; flex-direction: column; gap: 4px; overflow-y: auto; max-height: 65px;">
                                    <div v-for="c in getCampaignsForDay(day.dateStr)" :key="c.id" @click="selectCampaign(c)" :style="getPlatformStyle((c.platform || '').split(',')[0])" style="font-size: 0.62rem; font-weight: bold; padding: 2px 4px; border-radius: 4px; cursor: pointer; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; transition: filter 0.2s;" onmouseover="this.style.filter='brightness(1.15)'" onmouseout="this.style.filter='none'">
                                        {{ c.name }} <span v-if="aiProposals[c.id] && aiProposals[c.id].length > 0" title="AI copy proposals pending" style="color: #60a5fa; font-weight: bold;">🤖</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </template>

            <!-- TAB 2: Auto-Pilot Content -->
            <template v-if="activeTab === 'autopilot'">
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- Run Strategy Check Banner -->
                    <div style="background: rgba(197, 160, 89, 0.05); border: 1px solid var(--accent); padding: 16px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
                        <div>
                            <h4 style="margin: 0; font-size: 0.95rem; color: var(--accent); font-weight: bold;">⚡ AI Campaign Strategist Console</h4>
                            <p style="margin: 4px 0 0 0; font-size: 0.76rem; color: var(--text-muted);">
                                Analyze ad CTRs, daily budget velocities, and conversion funnel dropoffs to trigger automated guardrails.
                            </p>
                        </div>
                        <button type="button" @click="triggerAgentRun" class="btn btn-primary" style="font-size: 0.78rem; padding: 8px 16px; height: auto;">
                            🤖 Run Strategy Analysis
                        </button>
                    </div>

                    <!-- AI Specialist Agent Health & Alignment Hub -->
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 16px;">
                        <h4 style="margin: 0; font-size: 0.9rem; color: var(--text-main); font-weight: bold; display: flex; align-items: center; gap: 8px;">
                            <span>🤖 AI Agent Health & Insights Panel</span>
                        </h4>
                        
                        <!-- Pulse States of cooperating specialist agents -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                            <div style="background: rgba(0,0,0,0.15); border: 1px solid var(--border); padding: 10px; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                                <div style="width: 10px; height: 10px; background-color: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981;"></div>
                                <div>
                                    <strong style="font-size: 0.78rem; color: var(--text-main); display: block;">Chief Coordinator Agent</strong>
                                    <span style="font-size: 0.65rem; color: var(--text-muted);">Consensus & Conflict Resolution</span>
                                </div>
                            </div>
                            <div style="background: rgba(0,0,0,0.15); border: 1px solid var(--border); padding: 10px; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                                <div style="width: 10px; height: 10px; background-color: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981;"></div>
                                <div>
                                    <strong style="font-size: 0.78rem; color: var(--text-main); display: block;">Budget Allocator Agent</strong>
                                    <span style="font-size: 0.65rem; color: var(--text-muted);">Spend Velocity & Scaling</span>
                                </div>
                            </div>
                            <div style="background: rgba(0,0,0,0.15); border: 1px solid var(--border); padding: 10px; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                                <div style="width: 10px; height: 10px; background-color: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981;"></div>
                                <div>
                                    <strong style="font-size: 0.78rem; color: var(--text-main); display: block;">Creative Critic Agent</strong>
                                    <span style="font-size: 0.65rem; color: var(--text-muted);">CTR Tournaments & Copy Swaps</span>
                                </div>
                            </div>
                            <div style="background: rgba(0,0,0,0.15); border: 1px solid var(--border); padding: 10px; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                                <div style="width: 10px; height: 10px; background-color: #3b82f6; border-radius: 50%; box-shadow: 0 0 8px #3b82f6;"></div>
                                <div>
                                    <strong style="font-size: 0.78rem; color: var(--text-main); display: block;">Safety Director Agent</strong>
                                    <span style="font-size: 0.65rem; color: var(--text-muted);">ROAS Floors & Clamping</span>
                                </div>
                            </div>
                        </div>

                        <!-- Real-time aggregate statistics -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; border-top: 1px dashed var(--border); padding-top: 16px;">
                            <div style="text-align: center;">
                                <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; display: block;">Alignment Rate</span>
                                <strong style="font-size: 1.15rem; color: var(--accent); margin-top: 4px; display: block;">{{ agentInsights.alignmentRate }}%</strong>
                            </div>
                            <div style="text-align: center;">
                                <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; display: block;">Average ROAS Lift</span>
                                <strong style="font-size: 1.15rem; color: #10b981; margin-top: 4px; display: block;">+{{ agentInsights.averageRoasLift }}x</strong>
                            </div>
                            <div style="text-align: center;">
                                <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; display: block;">Total Budget Saved</span>
                                <strong style="font-size: 1.15rem; color: var(--text-main); margin-top: 4px; display: block;">€{{ agentInsights.totalBudgetSaved }}</strong>
                            </div>
                            <div style="text-align: center;">
                                <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; display: block;">Decisions Managed</span>
                                <strong style="font-size: 1.15rem; color: var(--text-main); margin-top: 4px; display: block;">{{ agentInsights.totalDecisions }}</strong>
                            </div>
                        </div>
                    </div>

                    <div v-for="c in campaigns" :key="c.id" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                            <div>
                                <h4 style="margin: 0; color: var(--text-main); font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                                    <span>{{ c.name }}</span>
                                    <span v-if="c.autopilot_enabled" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">🤖 Autopilot Active</span>
                                    <span v-else style="background: rgba(255, 255, 255, 0.05); color: var(--text-muted); font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">Manual Only</span>
                                </h4>
                                <p style="margin: 4px 0 0 0; font-size: 0.75rem; color: var(--text-muted);">Configure automated triggers to scale or protect this campaign's budget automatically.</p>
                            </div>
                            <button type="button" @click="toggleAutopilot(c)" class="btn" :class="c.autopilot_enabled ? 'btn-secondary' : 'btn-primary'" style="font-size: 0.75rem; padding: 6px 12px; height: auto;">
                                {{ c.autopilot_enabled ? 'Deactivate Autopilot' : 'Activate Autopilot' }}
                            </button>
                        </div>

                        <!-- Mode & Guardrails Segment -->
                        <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 12px; border-radius: 8px; display: flex; flex-direction: column; gap: 10px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Agent Mode:</span>
                                    <select v-model="c.agent_mode" @change="saveCampaignSettings(c)" style="padding: 4px 24px 4px 8px !important; font-size: 0.75rem; border-radius: 6px; height: 30px; width: 190px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main);">
                                        <option value="recommendation">Co-Pilot (Recommendation)</option>
                                        <option value="autonomous">Autopilot (Autonomous)</option>
                                    </select>
                                </div>
                                <span style="font-size: 0.72rem; color: var(--text-muted);">
                                    {{ c.agent_mode === 'autonomous' ? '⚡ Will execute budget updates immediately and notify operator via email.' : '💡 Will queue proposals for your review before applying.' }}
                                </span>
                            </div>

                            <div v-if="c.autopilot_guardrails" style="border-top: 1px dashed var(--border); padding-top: 10px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                                <div>
                                    <label style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 4px;">Max Budget Change (%)</label>
                                    <div style="display: flex; align-items: center; gap: 4px;">
                                        <input type="number" v-model.number="c.autopilot_guardrails.max_budget_change_pct" @change="saveCampaignSettings(c)" style="width: 100%; height: 30px; padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main);">
                                        <span style="font-size: 0.75rem; color: var(--text-muted);">%</span>
                                    </div>
                                </div>
                                <div>
                                    <label style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 4px;">Minimum ROAS Safety Floor</label>
                                    <div style="display: flex; align-items: center; gap: 4px;">
                                        <input type="number" step="0.1" v-model.number="c.autopilot_guardrails.min_roas_floor" @change="saveCampaignSettings(c)" style="width: 100%; height: 30px; padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main);">
                                        <span style="font-size: 0.75rem; color: var(--text-muted);">x</span>
                                    </div>
                                </div>
                                <div>
                                    <label style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 4px;">Max Daily Budget Ceiling</label>
                                    <div style="display: flex; align-items: center; gap: 4px;">
                                        <input type="number" v-model.number="c.autopilot_guardrails.max_spend_ceiling" @change="saveCampaignSettings(c)" style="width: 100%; height: 30px; padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main);">
                                        <span style="font-size: 0.75rem; color: var(--text-muted);">€</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Rule Creator for Campaign -->
                        <div style="border-top: 1px dashed var(--border); padding-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; background: rgba(0,0,0,0.1); padding: 8px; border-radius: 8px;">
                            <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">If</span>
                            <select v-model="newRule.metric" style="padding: 4px 24px 4px 8px !important; font-size: 0.75rem; border-radius: 6px; height: 30px; width: 120px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main);">
                                <option value="roas">ROAS (x)</option>
                                <option value="spend">Daily Spend (€)</option>
                                <option value="conversions">Conversions</option>
                            </select>

                            <select v-model="newRule.operator" style="padding: 4px 24px 4px 8px !important; font-size: 0.75rem; border-radius: 6px; height: 30px; width: 100px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main);">
                                <option value="lt">Less Than</option>
                                <option value="gt">Greater Than</option>
                            </select>

                            <input type="number" step="0.1" v-model.number="newRule.value" style="width: 70px; height: 30px; padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main);">

                            <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Then</span>

                            <select v-model="newRule.action" style="padding: 4px 24px 4px 8px !important; font-size: 0.75rem; border-radius: 6px; height: 30px; width: 150px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main);">
                                <option value="reduce_budget">Decrease Budget by</option>
                                <option value="increase_budget">Increase Budget by</option>
                                <option value="pause">Pause Campaign</option>
                            </select>

                            <input v-if="newRule.action !== 'pause'" type="number" v-model.number="newRule.action_value" style="width: 60px; height: 30px; padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main);">
                            <span v-if="newRule.action !== 'pause'" style="font-size: 0.75rem; color: var(--text-muted);">%</span>

                            <button type="button" @click="addAutomationRule(c)" class="btn btn-primary" style="font-size: 0.72rem; height: 30px; padding: 0 12px; margin-left: auto;">
                                ＋ Add Rule
                            </button>
                        </div>

                        <!-- Active Rules List -->
                        <div v-if="c.automation_rules && c.automation_rules.length > 0" style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
                            <div v-for="rule in c.automation_rules" :key="rule.id" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 8px 12px; border-radius: 8px; font-size: 0.78rem; color: var(--text-main);">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: var(--accent);">⚙</span>
                                    <span>If campaign <strong>{{ rule.metric.toUpperCase() }}</strong> is <strong>{{ rule.operator === 'lt' ? '&lt;' : '&gt;' }} {{ rule.value }}</strong>, then <strong>{{ rule.action === 'pause' ? 'Pause Campaign' : (rule.action === 'increase_budget' ? 'Increase Budget by ' + rule.action_value + '%' : 'Decrease Budget by ' + rule.action_value + '%') }}</strong>.</span>
                                </div>
                                <button type="button" @click="removeAutomationRule(c, rule.id)" style="background: transparent; border: none; color: var(--danger); font-size: 0.75rem; cursor: pointer; font-weight: bold;">Remove</button>
                            </div>
                        </div>

                        <!-- AI Recommendations & Automated Log Section -->
                        <div v-if="agentRecommendations[c.id] && agentRecommendations[c.id].length > 0" style="margin-top: 12px; border-top: 1px dashed var(--border); padding-top: 12px;">
                            <h5 style="margin: 0 0 8px 0; font-size: 0.8rem; color: var(--accent); display: flex; align-items: center; gap: 6px;">
                                <span>📝 AI Strategy Recommendations & Action Logs</span>
                            </h5>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <div v-for="rec in agentRecommendations[c.id]" :key="rec.id" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 10px; border-radius: 8px; font-size: 0.78rem; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                                    <div style="flex: 1;">
                                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                                            <span v-if="rec.status === 'pending'" style="background: rgba(197, 160, 89, 0.15); color: var(--accent); font-size: 0.6rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-transform: uppercase;">Proposal</span>
                                            <span v-else-if="rec.status === 'applied'" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 0.6rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-transform: uppercase;">Applied</span>
                                            <span v-else-if="rec.status === 'auto_executed'" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; font-size: 0.6rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-transform: uppercase;">Auto-Executed</span>
                                            <span v-else style="background: rgba(255, 255, 255, 0.05); color: var(--text-muted); font-size: 0.6rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-transform: uppercase;">{{ rec.status }}</span>
                                            <span style="color: var(--text-muted); font-size: 0.65rem; background: rgba(255,255,255,0.04); padding: 1px 4px; border-radius: 3px; font-family: monospace;">{{ rec.agent_role }}</span>
                                            <span style="color: var(--text-muted); font-size: 0.72rem;">{{ new Date(rec.created_at).toLocaleTimeString() }}</span>
                                        </div>
                                        <p style="margin: 4px 0 0 0; color: var(--text-main); font-size: 0.78rem;">
                                            If campaign <strong>{{ rec.metric.toUpperCase() }}</strong> is <strong>{{ rec.operator === 'lt' ? 'less than' : 'greater than' }} {{ rec.trigger_value }}</strong> (Current: {{ rec.current_value }}), then <strong>{{ rec.action === 'pause' ? 'Pause Campaign' : (rec.action === 'increase_budget' ? 'Increase Budget by ' + rec.action_value + '%' : 'Decrease Budget by ' + rec.action_value + '%') }}</strong>.
                                        </p>
                                    </div>
                                    <div v-if="rec.status === 'pending'" style="display: flex; gap: 8px;">
                                        <button type="button" @click="applyAgentRecommendation(c.id, rec.id)" class="btn btn-primary" style="font-size: 0.7rem; padding: 4px 8px; height: auto;">Approve & Apply</button>
                                        <button type="button" @click="dismissAgentRecommendation(c.id, rec.id)" class="btn btn-secondary" style="font-size: 0.7rem; padding: 4px 8px; height: auto; border: 1px solid var(--border);">Dismiss</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- AI Coordinator Conflict Resolution Stream -->
                        <div style="border-top: 1px dashed var(--border); padding-top: 12px; margin-top: 8px;">
                            <h5 style="margin: 0 0 8px 0; font-size: 0.8rem; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                                <span>🛡️ Chief Coordinator Conflict Resolution Log</span>
                            </h5>
                            <div v-if="agentConflictLogs[c.id] && agentConflictLogs[c.id].length > 0" style="display: flex; flex-direction: column; gap: 6px;">
                                <div v-for="log in agentConflictLogs[c.id]" :key="log.id" style="background: rgba(239, 68, 68, 0.05); border: 1px dashed rgba(239, 68, 68, 0.2); padding: 8px 12px; border-radius: 8px; font-size: 0.76rem; color: var(--text-main); display: flex; align-items: flex-start; gap: 8px;">
                                    <span style="color: #ef4444; font-weight: bold; margin-top: 1px;">⚠️</span>
                                    <div>
                                        <span style="color: var(--text-muted); font-size: 0.7rem; display: block; margin-bottom: 2px;">Resolved Action: {{ log.resolution.toUpperCase() }} | {{ new Date(log.created_at).toLocaleTimeString() }}</span>
                                        <strong>{{ log.conflicting_agents.toUpperCase() }} Clash:</strong> {{ log.conflict_description }}
                                    </div>
                                </div>
                            </div>
                            <div v-else style="background: rgba(16, 185, 129, 0.05); border: 1px dashed rgba(16, 185, 129, 0.2); padding: 8px 12px; border-radius: 8px; font-size: 0.74rem; color: #10b981; display: flex; align-items: center; gap: 6px;">
                                <span>🛡️ No conflicts active. Specialized agents are executing in unified consensus.</span>
                            </div>
                        </div>

                        <!-- Dynamic Funnel Optimization Toggle -->
                        <div style="border-top: 1px dashed var(--border); padding-top: 12px; display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                                <div style="flex: 1;">
                                    <h5 style="margin: 0; font-size: 0.8rem; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                                        <span>🔄 Dynamic Funnel Swapping & Optimization</span>
                                        <span v-if="c.dynamic_optimization_enabled" style="background: rgba(197, 160, 89, 0.15); color: var(--accent); font-size: 0.62rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-transform: uppercase;">Active</span>
                                    </h5>
                                    <p style="margin: 4px 0 0 0; font-size: 0.72rem; color: var(--text-muted); line-height: 1.4;">
                                        Monitor dropoff rates. Swaps copy variants and visual landing assets automatically using top playbook permutations from the strategy manuscript when dropoffs exceed 40%.
                                    </p>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px; position: relative;">
                                    <span v-if="!app.isFeatureAllowed('allow_dynamic_optimization')" style="font-size: 0.75rem; color: var(--text-muted); background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--border);">
                                        🔒 Locked
                                    </span>
                                    <input v-else
                                           type="checkbox" 
                                           :checked="c.dynamic_optimization_enabled" 
                                           @change="toggleDynamicOptimization(c)" 
                                           style="width: 34px; height: 18px; cursor: pointer; accent-color: var(--accent);" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- TAB 3: Attribution Modeling Content -->
            <template v-if="activeTab === 'attribution'">
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 10px; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <strong style="color: var(--text-main); font-size: 0.9rem;">Multi-Touch Attribution Analyzer</strong>
                            <p style="margin: 2px 0 0 0; font-size: 0.72rem; color: var(--text-muted);">Compare how different modeling structures distribute credit to your marketing channels.</p>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span style="font-size: 0.75rem; color: var(--text-muted);">Attribution Model:</span>
                            <select v-model="selectedAttributionModel" style="padding: 4px 24px 4px 8px !important; font-size: 0.75rem; border-radius: 6px; height: 30px; width: 140px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main);">
                                <option value="last_click">Last-Click Model</option>
                                <option value="first_click">First-Click Model</option>
                                <option value="linear">Linear Model</option>
                            </select>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                        <div style="border: 1px solid var(--border); border-radius: 12px; background: var(--card-bg); padding: 16px;">
                            <h4 style="margin: 0 0 16px 0; font-size: 0.85rem; color: var(--text-main);">Credited Channel Value Comparison (€)</h4>
                            <div v-if="attributionData && attributionData[selectedAttributionModel]" style="display: flex; flex-direction: column; gap: 12px;">
                                <div v-for="(val, campaign) in attributionData[selectedAttributionModel]" :key="campaign" style="display: flex; flex-direction: column; gap: 4px;">
                                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                                        <span style="color: var(--text-muted); font-weight: bold;">{{ campaign }}</span>
                                        <span style="color: var(--text-main); font-weight: 700;">€{{ val.toFixed(2) }}</span>
                                    </div>
                                    <div style="height: 10px; background: rgba(255,255,255,0.03); border-radius: 4px; overflow: hidden; border: 1px solid var(--border);">
                                        <div :style="{ width: `${Math.min(100, (val / Math.max(1, Math.max(...Object.values(attributionData[selectedAttributionModel])))) * 100)}%` }" style="height: 100%; background: var(--accent); transition: width 0.4s; border-radius: 4px;"></div>
                                    </div>
                                </div>
                            </div>
                            <div v-else style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
                                No conversion path logs recorded yet.
                            </div>
                        </div>

                        <div style="border: 1px solid var(--border); border-radius: 12px; background: var(--card-bg); padding: 16px;">
                            <h4 style="margin: 0 0 16px 0; font-size: 0.85rem; color: var(--text-main);">🔮 Predictive LTV Cohort Performance (90-Day Trajectory)</h4>
                            <div v-if="cohortData && cohortData.length > 0" style="display: flex; flex-direction: column; gap: 16px;">
                                <div v-for="c in cohortData" :key="c.campaign_id" style="border-bottom: 1px dashed var(--border); padding-bottom: 12px; display: flex; flex-direction: column; gap: 8px;">
                                    <strong style="font-size: 0.78rem; color: var(--text-main);">{{ c.campaign_name }}</strong>
                                    <div style="display: flex; justify-content: space-between; text-align: center; gap: 8px;">
                                        <div style="flex: 1; background: rgba(255,255,255,0.02); padding: 4px; border-radius: 6px; border: 1px solid var(--border);">
                                            <div style="font-size: 0.58rem; color: var(--text-muted);">Day 30</div>
                                            <div style="font-size: 0.78rem; font-weight: bold; color: var(--text-main);">€{{ c.m30.toFixed(0) }}</div>
                                        </div>
                                        <div style="flex: 1; background: rgba(16, 185, 129, 0.03); padding: 4px; border-radius: 6px; border: 1px solid rgba(16,185,129,0.2);">
                                            <div style="font-size: 0.58rem; color: #10b981; font-weight: bold;">Day 60 (Est)</div>
                                            <div style="font-size: 0.78rem; font-weight: bold; color: var(--text-main);">€{{ c.m60.toFixed(0) }}</div>
                                        </div>
                                        <div style="flex: 1; background: rgba(59, 130, 246, 0.03); padding: 4px; border-radius: 6px; border: 1px solid rgba(59,130,246,0.2);">
                                            <div style="font-size: 0.58rem; color: #3b82f6; font-weight: bold;">Day 90 (Est)</div>
                                            <div style="font-size: 0.78rem; font-weight: bold; color: var(--text-main);">€{{ c.m90.toFixed(0) }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
                                Launch active campaigns to start projecting cohort curves.
                            </div>
                        </div>

                        <!-- Causal Lift Geotesting Analyzer -->
                        <div style="grid-column: span 2; border: 1px solid var(--border); border-radius: 12px; background: var(--card-bg); padding: 16px; margin-top: 10px;">
                            <h4 style="margin: 0 0 16px 0; font-size: 0.85rem; color: var(--text-main); display: flex; align-items: center; justify-content: space-between;">
                                <span>📊 Closed-Loop Causal Lift Geotesting (Organic vs. Exposed Incrementality)</span>
                                <span style="font-size: 0.65rem; background: rgba(59, 130, 246, 0.15); color: #3b82f6; font-weight: 700; padding: 2px 6px; border-radius: 4px;">Self-Testing Active</span>
                            </h4>
                            
                            <div v-if="campaigns.length > 0" style="display: flex; flex-direction: column; gap: 16px;">
                                <div v-for="c in campaigns" :key="c.id" style="border-bottom: 1px dashed var(--border); padding-bottom: 12px; display: flex; flex-direction: column; gap: 8px;">
                                    <strong style="font-size: 0.78rem; color: var(--text-main);">{{ c.name }}</strong>
                                    
                                    <div v-if="causalLiftData[c.id]" style="display: flex; flex-direction: column; gap: 6px;">
                                        <div style="display: flex; gap: 8px; font-size: 0.7rem; color: var(--text-muted); font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
                                            <span style="width: 100px;">Date</span>
                                            <span style="width: 120px; text-align: center;">Control Segment (Organic)</span>
                                            <span style="width: 120px; text-align: center;">Test Segment (Exposed)</span>
                                            <span style="width: 120px; text-align: right;">Causal Sales Lift</span>
                                        </div>
                                        
                                        <div v-for="day in causalLiftData[c.id]" :key="day.date" style="display: flex; gap: 8px; font-size: 0.75rem; align-items: center;">
                                            <span style="width: 100px; color: var(--text-muted);">{{ day.date }}</span>
                                            <span style="width: 120px; text-align: center;">{{ day.control_conversions }} orders</span>
                                            <span style="width: 120px; text-align: center; color: var(--text-main); font-weight: 600;">{{ day.test_conversions }} orders</span>
                                            <span style="width: 120px; text-align: right; color: #10b981; font-weight: bold;">+{{ day.incremental_lift }}% lift</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
                                No active campaigns to compute causal lift.
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- TAB 4: Creative Asset Intelligence Content -->
            <template v-if="activeTab === 'creative'">
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div v-for="c in campaigns" :key="c.id" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; padding: 16px;">
                        <h4 style="margin: 0 0 12px 0; font-size: 0.95rem; color: var(--text-main); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                            <span>{{ c.name }}</span>
                            <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">Format: {{ c.format }}</span>
                        </h4>

                        <!-- Creative Stats Grid -->
                        <div v-if="creativeStats[c.id]" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                            <div v-for="stat in creativeStats[c.id]" :key="stat.id" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; display: flex; gap: 12px; padding: 10px;">
                                <img :src="stat.asset_url || 'https://placehold.co/100'" style="width: 70px; height: 70px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border); flex-shrink: 0;">
                                <div style="display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1; min-width: 0;">
                                    <div>
                                        <strong style="display: block; font-size: 0.8rem; color: var(--text-main); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                                            {{ stat.headline }}
                                        </strong>
                                        <div style="display: flex; gap: 8px; margin-top: 4px; font-size: 0.68rem; color: var(--text-muted); flex-wrap: wrap;">
                                            <span>CTR: <strong :style="{ color: stat.ctr < 2.0 ? 'var(--warning)' : '#10b981' }">{{ stat.ctr }}%</strong></span>
                                            <span>CVR: <strong>{{ stat.cvr }}%</strong></span>
                                            <span>Conversions: <strong>{{ stat.conversions }}</strong></span>
                                        </div>
                                    </div>

                                    <!-- Fatigue check warning + optimization button -->
                                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; border-top: 1px dashed var(--border); padding-top: 8px;">
                                        <span v-if="stat.ctr < 2.0" style="font-size: 0.65rem; color: var(--warning); font-weight: 700; background: rgba(235,142,3,0.1); padding: 2px 6px; border-radius: 4px;">
                                            ⚠️ Creative Fatigue
                                        </span>
                                        <span v-else style="font-size: 0.65rem; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.1); padding: 2px 6px; border-radius: 4px;">
                                            ✓ Healthy CTR
                                        </span>

                                        <button type="button" @click="triggerCreativeOptimization(c.id, stat)" class="btn btn-secondary" style="font-size: 0.65rem; height: auto; padding: 4px 8px; font-weight: 700; color: var(--accent);">
                                            <span v-if="!app.isFeatureAllowed('allow_copywriter')">🔒 Optimize Copy</span>
                                            <span v-else>✨ Optimize Copy</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
                            Loading creative audits for campaign...
                        </div>

                        <!-- AI Generated Copy Proposals Queue -->
                        <div v-if="aiProposals[c.id] && aiProposals[c.id].length > 0" style="margin-top: 16px; border-top: 1px dashed var(--border); padding-top: 16px;">
                            <h5 style="margin: 0 0 10px 0; font-size: 0.8rem; color: var(--accent); display: flex; align-items: center; gap: 6px;">
                                <span>🤖 Pending AI Copy Proposals (Approval Queue)</span>
                            </h5>
                            
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <div v-for="prop in aiProposals[c.id]" :key="prop.id" style="background: rgba(255, 255, 255, 0.01); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.76rem;">
                                        <div style="padding: 8px; background: rgba(0,0,0,0.15); border-radius: 6px;">
                                            <span style="font-size: 0.65rem; color: var(--text-muted); display: block; font-weight: bold; margin-bottom: 2px;">Original Copy</span>
                                            <div style="color: var(--text-muted); text-decoration: line-through;">{{ prop.original_headline || c.headline }}</div>
                                            <div style="color: var(--text-muted); text-decoration: line-through; font-size: 0.7rem; margin-top: 4px;">{{ prop.original_ad_copy || c.ad_copy }}</div>
                                        </div>
                                        
                                        <div style="padding: 8px; background: rgba(16,185,129,0.05); border-radius: 6px; border: 1px solid rgba(16,185,129,0.15);">
                                            <span style="font-size: 0.65rem; color: #10b981; display: block; font-weight: bold; margin-bottom: 2px;">Proposed AI Variant</span>
                                            <div style="color: var(--text-main); font-weight: bold;">{{ prop.proposed_headline }}</div>
                                            <div style="color: var(--text-main); font-size: 0.7rem; margin-top: 4px;">{{ prop.proposed_ad_copy }}</div>
                                        </div>
                                    </div>
                                    
                                    <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;">
                                        <button type="button" @click="rejectAIProposal(prop)" class="btn btn-secondary" style="font-size: 0.68rem; padding: 4px 10px; height: auto;">
                                            Dismiss
                                        </button>
                                        <button type="button" @click="applyAIProposal(prop)" class="btn btn-primary" style="font-size: 0.68rem; padding: 4px 10px; height: auto;">
                                            ✓ Approve & Publish
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <!-- Campaign Detail & Performance Optimization Console Modal -->
        <div v-if="showCampaignDetailModal && selectedCampaign" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
            <div class="modal-content" style="background: var(--panel-bg, #1a1b26); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 680px; box-shadow: 0 24px 38px 3px rgba(0,0,0,0.5); display: flex; flex-direction: column; max-height: 90vh; overflow: hidden;">
                <!-- Header -->
                <div style="padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
                    <div>
                        <span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); font-weight: 700;">Performance & Bidding Console</span>
                        <h3 style="margin: 4px 0 0 0; color: var(--text-main); font-size: 1.2rem;">{{ selectedCampaign.name }}</h3>
                    </div>
                    <button type="button" @click="closeCampaignDetailModal" style="background: transparent; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
                </div>
                
                <!-- Body -->
                <div style="padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px;">
                    <!-- Status & Key Attributes Info -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; background: rgba(255,255,255,0.02); padding: 12px; border-radius: 10px; border: 1px solid var(--border);">
                        <div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Status</div>
                            <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                                <span :style="{ background: selectedCampaign.status === 'active' ? '#10b981' : '#f59e0b' }" style="width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
                                <strong style="color: var(--text-main); font-size: 0.85rem; text-transform: capitalize;">{{ selectedCampaign.status }}</strong>
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Channel(s)</div>
                            <div style="margin-top: 2px; font-weight: 700; color: var(--text-main); font-size: 0.85rem; text-transform: uppercase;">
                                {{ selectedCampaign.platform }}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Dates</div>
                            <div style="margin-top: 2px; font-weight: 600; color: var(--text-main); font-size: 0.8rem;">
                                {{ selectedCampaign.start_date || 'N/A' }} to {{ selectedCampaign.end_date || 'N/A' }}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Budget Policy</div>
                            <div style="margin-top: 2px; font-weight: 600; color: var(--text-main); font-size: 0.8rem; text-transform: capitalize;">
                                €{{ parseFloat(selectedCampaign.budget).toFixed(2) }} ({{ selectedCampaign.budget_type || 'lifetime' }})
                            </div>
                        </div>
                    </div>

                    <!-- Performance Chart -->
                    <div>
                        <h4 style="margin: 0 0 10px 0; color: var(--text-main); font-size: 0.9rem;">Daily Marketing Spend & Conversion Trend</h4>
                        <div v-if="selectedCampaign.performance_history && selectedCampaign.performance_history.length > 0" style="display: flex; align-items: flex-end; justify-content: space-between; height: 120px; padding: 12px 16px 24px 16px; border: 1px solid var(--border); border-radius: 8px; background: rgba(0,0,0,0.15); position: relative; gap: 8px;">
                            <div v-for="h in selectedCampaign.performance_history" :key="h.date" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%;">
                                <div :title="`Date: ${h.date}\nSpend: €${h.spend}\nSales: €${h.sales}\nROAS: ${h.roas}x`" :style="{ height: `${Math.max(10, Math.min(100, (h.spend / Math.max(1, selectedCampaign.budget / 7)) * 80))}%` }" style="width: 100%; background: var(--accent); border-radius: 4px 4px 0 0; transition: height 0.3s; cursor: pointer; min-height: 10px;" onmouseover="this.style.filter='brightness(1.2)'" onmouseout="this.style.filter='none'">
                                </div>
                                <div style="font-size: 0.6rem; color: var(--text-muted); margin-top: 4px; white-space: nowrap;">
                                    {{ h.date.split('-')[2] }}
                                </div>
                            </div>
                        </div>
                        <div v-else style="padding: 30px; text-align: center; border: 1px solid var(--border); border-radius: 8px; background: rgba(0,0,0,0.15); color: var(--text-muted); font-size: 0.8rem;">
                            No daily performance data recorded yet. Simulated metrics will begin tracking once the campaign starts running.
                        </div>
                    </div>

                    <!-- Modifiers / Slider Adjustments -->
                    <div style="display: flex; flex-direction: column; gap: 16px; border-top: 1px solid var(--border); padding-top: 16px;">
                        <h4 style="margin: 0; color: var(--text-main); font-size: 0.9rem;">Interactive Performance Adjuster</h4>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <!-- Target ROAS Aggressiveness -->
                            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 12px; border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                    <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">Target ROAS Target</label>
                                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--accent);">{{ roasSlider.toFixed(1) }}x</span>
                                </div>
                                <input type="range" min="1.0" max="8.0" step="0.1" v-model.number="roasSlider" style="width: 100%; cursor: pointer; accent-color: var(--accent);">
                                <div style="display: flex; justify-content: space-between; font-size: 0.6rem; color: var(--text-muted); margin-top: 4px;">
                                    <span>Scale Focus</span>
                                    <span>Balanced</span>
                                    <span>High Efficiency</span>
                                </div>
                            </div>

                            <!-- Budget Adjuster -->
                            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 12px; border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                    <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">Budget Adjuster</label>
                                    <span style="font-size: 0.85rem; font-weight: 700; color: #10b981;">{{ budgetSlider >= 0 ? '+' : '' }}{{ budgetSlider }}%</span>
                                </div>
                                <input type="range" min="-50" max="100" step="5" v-model.number="budgetSlider" style="width: 100%; cursor: pointer; accent-color: #10b981;">
                                <div style="display: flex; justify-content: space-between; font-size: 0.6rem; color: var(--text-muted); margin-top: 4px;">
                                    <span>-50% Spend</span>
                                    <span>Maintain</span>
                                    <span>+100% Scale</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Projections Simulator Output -->
                    <div style="background: rgba(16, 185, 129, 0.04); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px; padding: 16px;">
                        <h4 style="margin: 0 0 10px 0; color: #10b981; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
                            <span>🔮 Live Projected Lift Simulator</span>
                        </h4>
                        
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px;">
                            <div style="background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border);">
                                <div style="font-size: 0.6rem; color: var(--text-muted);">Spend Cap</div>
                                <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-top: 2px;">
                                    €{{ projectedMetrics.spend.toFixed(2) }}
                                </div>
                            </div>
                            <div style="background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border);">
                                <div style="font-size: 0.6rem; color: var(--text-muted);">Est. Conversions</div>
                                <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-top: 2px;">
                                    {{ projectedMetrics.conversions }}
                                    <span style="font-size: 0.65rem; color: #10b981; font-weight: bold; margin-left: 2px;">
                                        ({{ projectedMetrics.cvLiftPercent >= 0 ? '+' : '' }}{{ projectedMetrics.cvLiftPercent }}%)
                                    </span>
                                </div>
                            </div>
                            <div style="background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border);">
                                <div style="font-size: 0.6rem; color: var(--text-muted);">Est. Sales Volume</div>
                                <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-top: 2px;">
                                    €{{ projectedMetrics.sales.toFixed(2) }}
                                    <span style="font-size: 0.65rem; color: #10b981; font-weight: bold; margin-left: 2px;">
                                        ({{ projectedMetrics.salesLiftPercent >= 0 ? '+' : '' }}{{ projectedMetrics.salesLiftPercent }}%)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.4; display: flex; align-items: center; gap: 6px;">
                            <span>💡</span>
                            <span>Projected ROAS yields an optimized target of <strong>{{ projectedMetrics.roas }}x</strong> based on aggressiveness slider selection.</span>
                        </div>
                    </div>
                </div>
                
                <!-- Footer Buttons -->
                <div style="padding: 16px 20px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
                    <div>
                        <button type="button" class="btn btn-secondary" style="font-size: 0.75rem; color: var(--text-muted); height: auto; padding: 6px 12px;" @click="closeCampaignDetailModal">
                            Cancel
                        </button>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <!-- Status pause/activate toggle -->
                        <button type="button" class="btn btn-secondary" style="font-size: 0.75rem; height: auto; padding: 6px 12px;" @click="selectedCampaign.status = selectedCampaign.status === 'active' ? 'paused' : 'active'; saveCampaignAdjustments()">
                            {{ selectedCampaign.status === 'active' ? '⏸ Pause Campaign' : '▶ Activate Campaign' }}
                        </button>
                        
                        <button type="button" class="btn btn-primary" style="font-size: 0.75rem; height: auto; padding: 6px 16px;" :disabled="savingAdjustments" @click="saveCampaignAdjustments">
                            {{ savingAdjustments ? 'Applying...' : 'Apply Adjustments' }}
                        </button>
                    </div>
                </div>
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
            selectedCampaignIds: [],
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
            viewMode: 'list',
            currentYear: new Date().getFullYear(),
            currentMonth: new Date().getMonth(),
            selectedCampaign: null,
            showCampaignDetailModal: false,
            roasSlider: 1.0,
            budgetSlider: 0,
            savingAdjustments: false,
            activeTab: 'campaigns',
            selectedAttributionModel: 'last_click',
            attributionData: null,
            cohortData: [],
            creativeStats: {},
            newRule: { campaign_id: '', metric: 'roas', operator: 'lt', value: 2.0, action: 'reduce_budget', action_value: 15 },
            loadingAttribution: false,
            loadingCreative: false,
            aiProposals: {},
            agentRecommendations: {},
            agentInsights: { alignmentRate: 100, averageRoasLift: 0.0, totalBudgetSaved: 0.0, totalDecisions: 0 },
            agentConflictLogs: {},
            causalLiftData: {},
            selectedTone: 'friendly',
            generatingAICopy: false,
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
                ],
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
                budget_type: 'lifetime',
                bidding_strategy: 'manual',
                target_roas: 4.0,
                headlines: ['', ''],
                warmup_days: 3,
                warmup_budget_percent: 15,
                ai_cost: 0.0,
                autopilot_enabled: false,
                agent_mode: 'recommendation',
                status: 'active',
                autopilot_guardrails: {
                    max_budget_change_pct: 20,
                    min_roas_floor: 1.8,
                    max_spend_ceiling: 500
                }
            }
        };
    },
    computed: {
        authHeaders() {
            return {
                'Authorization': `Bearer ${this.app.adminToken}`,
                'X-Brand-Id': this.app.activeShopFilter
            };
        },
        isAllCampaignsSelected() {
            return this.campaigns.length > 0 && this.campaigns.every(c => this.selectedCampaignIds.includes(c.id));
        },
        advisedBudget() {
            let base = 200;
            const seg = this.newCampaign.segmentation;
            if (seg === 'Repeat Customers') base = 150;
            else if (seg === 'High Spenders') base = 180;
            else if (seg === 'Dormant Shoppers') base = 120;
            else if (seg === 'Prospects / Lookalike') base = 250;
            
            const roas = this.newCampaign.target_roas || 4.0;
            return base + Math.round(roas * 15);
        },
        outcomeProjections() {
            const budget = parseFloat(this.newCampaign.budget) || 150;
            const roas = this.newCampaign.target_roas || 4.0;
            
            const conversions = Math.round((budget / 4.5) * (1 + (4.0 / roas) * 0.08));
            const sales = conversions * 22.5;
            const calculatedRoas = (sales / budget).toFixed(1);
            
            return {
                conversions,
                sales,
                roas: calculatedRoas
            };
        },
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
                        url: `https://${this.app.getBrandSubdomain(brand)}/${p.id}`
                    }));
                } else if (settings.landing_headline) {
                    return [{
                        id: 'promo-offer',
                        title: settings.landing_headline,
                        url: `https://${this.app.getBrandSubdomain(brand)}/promo-offer`
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
            const domain = this.app.getBrandSubdomain(brand);
            
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
        projectedMetrics() {
            if (!this.selectedCampaign) return null;
            const budget = parseFloat(this.selectedCampaign.budget) || 150;
            const budgetFactor = 1 + (this.budgetSlider / 100);
            const roasFactor = this.roasSlider;
            
            const baseImpressions = budget * 80;
            const baseClicks = baseImpressions * 0.022;
            const baseConversions = baseClicks * 0.032;
            const baseSales = budget * 4.6; 
            
            const simulatedSpend = budget * budgetFactor;
            const scaleModifier = Math.max(0.4, 2 - (roasFactor / 4.0)); 
            
            const simulatedImpressions = Math.round(baseImpressions * budgetFactor * scaleModifier);
            const simulatedClicks = Math.round(baseClicks * budgetFactor * scaleModifier);
            
            const cvLift = Math.min(1.6, 0.75 + (roasFactor / 5.0));
            const simulatedConversions = Math.round(baseConversions * budgetFactor * cvLift);
            
            const simulatedROAS = parseFloat((4.6 * cvLift).toFixed(2));
            const simulatedSales = parseFloat((simulatedSpend * simulatedROAS).toFixed(2));
            
            const salesLiftPercent = parseFloat((((simulatedSales - baseSales) / baseSales) * 100).toFixed(1));
            const cvLiftPercent = parseFloat((((simulatedConversions - baseConversions) / baseConversions) * 100).toFixed(1));
            
            return {
                spend: parseFloat(simulatedSpend.toFixed(2)),
                impressions: simulatedImpressions,
                clicks: simulatedClicks,
                conversions: simulatedConversions,
                roas: simulatedROAS,
                sales: simulatedSales,
                salesLiftPercent,
                cvLiftPercent
            };
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
        toggleSelectCampaign(id) {
            const idx = this.selectedCampaignIds.indexOf(id);
            if (idx > -1) {
                this.selectedCampaignIds.splice(idx, 1);
            } else {
                this.selectedCampaignIds.push(id);
            }
        },
        toggleSelectAllCampaigns() {
            if (this.isAllCampaignsSelected) {
                this.selectedCampaignIds = [];
            } else {
                this.selectedCampaignIds = this.campaigns.map(c => c.id);
            }
        },
        async performBulkDeleteCampaigns() {
            const success = await this.app.bulkDeleteCampaigns(this.selectedCampaignIds);
            if (success) {
                this.selectedCampaignIds = [];
                await this.loadCampaigns();
            }
        },
        async loadCampaigns() {
            try {
                const response = await fetch('/api/global/marketing-campaigns', {
                    headers: this.authHeaders
                });
                if (response.ok) {
                    this.campaigns = await response.json();
                    this.app.campaigns = this.campaigns;
                    this.loadAttributionData();
                    this.loadCohortData();
                    this.loadAgentInsights();
                    if (this.campaigns.length > 0) {
                        this.campaigns.forEach(c => {
                            this.loadCreativeStats(c.id);
                            this.loadAIProposals(c.id);
                            this.loadCausalLiftData(c.id);
                            this.loadAgentRecommendations(c.id);
                            this.loadConflictLogs(c.id);
                        });
                    }
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
            if (this.app.brands.length === 0) {
                alert('You must onboard at least one coffee brand storefront under the "Shops" tab before you can launch campaigns.');
                return;
            }
            if (this.app.activeShopFilter === 'all') {
                alert('Please select a specific coffee brand from the top dropdown to manage and launch its campaigns.');
                return;
            }
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
                ],
                status: 'active',
                autopilot_enabled: false,
                agent_mode: 'recommendation',
                autopilot_guardrails: {
                    max_budget_change_pct: 20,
                    min_roas_floor: 1.8,
                    max_spend_ceiling: 500
                }
            };
            this.campaignContentLang = 'en';
            this.showCreateCampaignModal = true;
        },
        closeCreateCampaignModal() {
            this.showCreateCampaignModal = false;
        },
        handleCreateCampaignBackdropClick(e) {
            if (e.target !== e.currentTarget) return;
            this.closeCreateCampaignModal();
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
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
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
                        ],
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
                        budget_type: 'lifetime',
                        bidding_strategy: 'manual',
                        target_roas: 4.0,
                        ai_cost: 0.0,
                        status: 'active',
                        autopilot_enabled: false,
                        agent_mode: 'recommendation',
                        autopilot_guardrails: {
                            max_budget_change_pct: 20,
                            min_roas_floor: 1.8,
                            max_spend_ceiling: 500
                        }
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
        async saveCampaignAsDraft() {
            this.newCampaign.status = 'paused';
            await this.saveCampaign();
        },
        async deleteCampaign(id) {
            if (!confirm('Are you sure you want to void this marketing ad campaign?')) return;
            try {
                const response = await fetch(`/api/global/marketing-campaigns/${id}`, {
                    method: 'DELETE',
                    headers: this.authHeaders
                });
                if (response.ok) {
                    this.app.showNotification('Campaign voided.');
                    this.loadCampaigns();
                }
            } catch (err) {
                console.error(err);
            }
        },
        getMonthWeeks() {
            const year = this.currentYear;
            const month = this.currentMonth;
            const firstDayIndex = new Date(year, month, 1).getDay();
            const numDays = new Date(year, month + 1, 0).getDate();
            const prevMonthNumDays = new Date(year, month, 0).getDate();
            
            const days = [];
            for (let i = firstDayIndex - 1; i >= 0; i--) {
                days.push({
                    dayNum: prevMonthNumDays - i,
                    dateStr: new Date(year, month - 1, prevMonthNumDays - i).toISOString().split('T')[0],
                    isCurrentMonth: false
                });
            }
            
            for (let i = 1; i <= numDays; i++) {
                const d = new Date(year, month, i);
                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                days.push({
                    dayNum: i,
                    dateStr: d.toISOString().split('T')[0],
                    isCurrentMonth: true
                });
            }
            
            const totalCells = Math.ceil(days.length / 7) * 7;
            const remaining = totalCells - days.length;
            for (let i = 1; i <= remaining; i++) {
                days.push({
                    dayNum: i,
                    dateStr: new Date(year, month + 1, i).toISOString().split('T')[0],
                    isCurrentMonth: false
                });
            }
            
            const weeks = [];
            for (let i = 0; i < days.length; i += 7) {
                weeks.push(days.slice(i, i + 7));
            }
            return weeks;
        },
        prevMonth() {
            if (this.currentMonth === 0) {
                this.currentMonth = 11;
                this.currentYear--;
            } else {
                this.currentMonth--;
            }
        },
        nextMonth() {
            if (this.currentMonth === 11) {
                this.currentMonth = 0;
                this.currentYear++;
            } else {
                this.currentMonth++;
            }
        },
        getMonthName(idx) {
            const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            return names[idx];
        },
        selectCampaign(c) {
            this.selectedCampaign = c;
            this.roasSlider = parseFloat(c.target_roas || 4.00);
            this.budgetSlider = 0;
            this.showCampaignDetailModal = true;
        },
        closeCampaignDetailModal() {
            this.showCampaignDetailModal = false;
            this.selectedCampaign = null;
        },
        getCampaignsForDay(dateStr) {
            const d = new Date(dateStr);
            d.setHours(0,0,0,0);
            return this.campaigns.filter(c => {
                if (!c.start_date || !c.end_date) return false;
                const start = new Date(c.start_date);
                const end = new Date(c.end_date);
                start.setHours(0,0,0,0);
                end.setHours(0,0,0,0);
                return d >= start && d <= end;
            });
        },
        async saveCampaignAdjustments() {
            if (!this.selectedCampaign) return;
            this.savingAdjustments = true;
            
            const updatedCampaign = {
                ...this.selectedCampaign,
                budget: this.projectedMetrics.spend,
                target_roas: this.roasSlider,
                bidding_strategy: this.roasSlider > 1 ? 'target_roas' : 'manual'
            };
            
            try {
                const response = await fetch('/api/global/marketing-campaigns', {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedCampaign)
                });
                
                if (response.ok) {
                    this.app.showNotification('Campaign performance metrics successfully adjusted!');
                    this.showCampaignDetailModal = false;
                    this.loadCampaigns();
                } else {
                    const err = await response.json();
                    alert(`Error updating adjustments: ${err.error}`);
                }
            } catch(e) {
                alert(`Error: ${e.message}`);
            } finally {
                this.savingAdjustments = false;
            }
        },
        async loadAttributionData() {
            this.loadingAttribution = true;
            try {
                const response = await fetch('/api/global/marketing-campaigns/attribution-report', {
                    headers: this.authHeaders
                });
                if (response.ok) {
                    this.attributionData = await response.json();
                }
            } catch(e) {
                console.error(e);
            } finally {
                this.loadingAttribution = false;
            }
        },
        async loadCohortData() {
            try {
                const response = await fetch('/api/global/marketing-campaigns/ltv-projections', {
                    headers: this.authHeaders
                });
                if (response.ok) {
                    this.cohortData = await response.json();
                }
            } catch(e) {
                console.error(e);
            }
        },
        async loadCreativeStats(campaignId) {
            this.loadingCreative = true;
            try {
                const response = await fetch(`/api/global/marketing-campaigns/${campaignId}/creative-stats`, {
                    headers: this.authHeaders
                });
                if (response.ok) {
                    const data = await response.json();
                    this.creativeStats = { ...this.creativeStats, [campaignId]: data };
                }
            } catch(e) {
                console.error(e);
            } finally {
                this.loadingCreative = false;
            }
        },
        async addAutomationRule(campaign) {
            const rules = campaign.automation_rules ? [...campaign.automation_rules] : [];
            const ruleId = `RL_${Date.now()}`;
            rules.push({
                id: ruleId,
                metric: this.newRule.metric,
                operator: this.newRule.operator,
                value: parseFloat(this.newRule.value),
                action: this.newRule.action,
                action_value: parseFloat(this.newRule.action_value)
            });
            
            const updated = {
                ...campaign,
                automation_rules: rules
            };
            
            try {
                const response = await fetch('/api/global/marketing-campaigns', {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updated)
                });
                if (response.ok) {
                    this.app.showNotification('Automation rule added successfully!');
                    this.newRule = { campaign_id: '', metric: 'roas', operator: 'lt', value: 2.0, action: 'reduce_budget', action_value: 15 };
                    this.loadCampaigns();
                }
            } catch(e) {
                console.error(e);
            }
        },
        async removeAutomationRule(campaign, ruleId) {
            const rules = (campaign.automation_rules || []).filter(r => r.id !== ruleId);
            const updated = {
                ...campaign,
                automation_rules: rules
            };
            
            try {
                const response = await fetch('/api/global/marketing-campaigns', {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updated)
                });
                if (response.ok) {
                    this.app.showNotification('Automation rule removed.');
                    this.loadCampaigns();
                }
            } catch(e) {
                console.error(e);
            }
        },
        async toggleAutopilot(campaign) {
            const updated = {
                ...campaign,
                autopilot_enabled: !campaign.autopilot_enabled
            };
            
            try {
                const response = await fetch('/api/global/marketing-campaigns', {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updated)
                });
                if (response.ok) {
                    this.app.showNotification(updated.autopilot_enabled ? 'Portfolio Auto-Pilot activated!' : 'Auto-Pilot deactivated.');
                    this.loadCampaigns();
                }
            } catch(e) {
                console.error(e);
            }
        },
        async saveCampaignSettings(campaign) {
            try {
                const response = await fetch('/api/global/marketing-campaigns', {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(campaign)
                });
                if (response.ok) {
                    this.app.showNotification('Campaign settings updated.');
                    this.loadCampaigns();
                }
            } catch(e) {
                console.error(e);
            }
        },
        async loadAgentRecommendations(campaignId) {
            try {
                const response = await fetch(`/api/global/marketing-campaigns/${campaignId}/agent-recommendations`, {
                    headers: this.authHeaders
                });
                if (response.ok) {
                    const data = await response.json();
                    this.agentRecommendations = { ...this.agentRecommendations, [campaignId]: data.recommendations || [] };
                }
            } catch(e) {
                console.error(e);
            }
        },
        async applyAgentRecommendation(campaignId, recId) {
            try {
                const response = await fetch(`/api/global/marketing-campaigns/${campaignId}/recommendations/${recId}/apply`, {
                    method: 'POST',
                    headers: this.authHeaders
                });
                if (response.ok) {
                    this.app.showNotification('Recommendation applied successfully!');
                    await this.loadCampaigns();
                    await this.loadAgentRecommendations(campaignId);
                }
            } catch(e) {
                console.error(e);
            }
        },
        async dismissAgentRecommendation(campaignId, recId) {
            try {
                const response = await fetch(`/api/global/marketing-campaigns/${campaignId}/recommendations/${recId}/dismiss`, {
                    method: 'POST',
                    headers: this.authHeaders
                });
                if (response.ok) {
                    this.app.showNotification('Recommendation dismissed.');
                    await this.loadAgentRecommendations(campaignId);
                }
            } catch(e) {
                console.error(e);
            }
        },
        async loadAgentInsights() {
            try {
                const response = await fetch('/api/global/marketing-campaigns/agent-performance-insights', {
                    headers: this.authHeaders
                });
                if (response.ok) {
                    this.agentInsights = await response.json();
                }
            } catch(e) {
                console.error(e);
            }
        },
        async loadConflictLogs(campaignId) {
            try {
                const response = await fetch(`/api/global/marketing-campaigns/${campaignId}/agent-conflict-logs`, {
                    headers: this.authHeaders
                });
                if (response.ok) {
                    const data = await response.json();
                    this.agentConflictLogs = { ...this.agentConflictLogs, [campaignId]: data.logs || [] };
                }
            } catch(e) {
                console.error(e);
            }
        },
        async triggerAgentRun() {
            try {
                const response = await fetch('/api/global/marketing-campaigns/trigger-agent-run', {
                    method: 'POST',
                    headers: this.authHeaders
                });
                if (response.ok) {
                    this.app.showNotification('AI Agent Strategy analysis completed!');
                    await this.loadCampaigns();
                    if (this.campaigns.length > 0) {
                        for (const c of this.campaigns) {
                            await this.loadAgentRecommendations(c.id);
                            await this.loadConflictLogs(c.id);
                        }
                    }
                }
            } catch(e) {
                console.error(e);
            }
        },
        async autoOptimizeCreativeCopy(campaignId, stat) {
            const copies = [
                { headline: "Premium Espresso Gears: Save 20%", text: "Fresh arrivals for coffee aficionados!" },
                { headline: "Sip Better Coffee Today ☕", text: "Expertly curated beans and tools delivered to you." }
            ];
            const choice = copies[Math.floor(Math.random() * copies.length)];
            
            stat.headline = choice.headline;
            stat.ctr = parseFloat((stat.ctr * (1.15 + Math.random() * 0.1)).toFixed(2));
            stat.clicks = Math.round(stat.clicks * 1.15);
            
            this.app.showNotification('Ad creative copy optimized with high-CTR variants!');
        },
        async generateAICopy() {
            this.generatingAICopy = true;
            try {
                const response = await fetch('/api/global/marketing-campaigns/generate-copy', {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        productId: this.selectedProductId || null,
                        segmentation: this.newCampaign.segmentation,
                        tone: this.selectedTone,
                        campaignType: this.newCampaign.campaign_type
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.newCampaign.headline = data.headline;
                    this.newCampaign.ad_copy = data.ad_copy;
                    this.newCampaign.ai_cost = (parseFloat(this.newCampaign.ai_cost) || 0) + (parseFloat(data.estimated_cost) || 0);
                    
                    if (data.benefits && data.benefits.length > 0) {
                        this.newCampaign.carousel_cards = data.benefits.map((b, idx) => ({
                            title: b,
                            image: this.newCampaign.carousel_cards[idx]?.image || '',
                            link: this.newCampaign.carousel_cards[idx]?.link || ''
                        }));
                    }
                    
                    this.app.showNotification('High-converting copy generated by AI Copywriter Studio!');
                }
            } catch (err) {
                console.error(err);
                alert(`Error generating copy: ${err.message}`);
            } finally {
                this.generatingAICopy = false;
            }
        },
        async loadAIProposals(campaignId) {
            try {
                const response = await fetch(`/api/global/marketing-campaigns/${campaignId}/ai-proposals`, {
                    headers: this.authHeaders
                });
                if (response.ok) {
                    const data = await response.json();
                    this.aiProposals = { ...this.aiProposals, [campaignId]: data };
                }
            } catch(e) {
                console.error(e);
            }
        },
        async applyAIProposal(proposal) {
            try {
                const response = await fetch(`/api/global/marketing-campaigns/proposals/${proposal.id}/apply`, {
                    method: 'POST',
                    headers: this.authHeaders
                });
                if (response.ok) {
                    this.app.showNotification('AI-generated ad proposal applied successfully!');
                    this.loadCampaigns();
                }
            } catch(e) {
                console.error(e);
            }
        },
        async rejectAIProposal(proposal) {
            try {
                const response = await fetch(`/api/global/marketing-campaigns/proposals/${proposal.id}/reject`, {
                    method: 'POST',
                    headers: this.authHeaders
                });
                if (response.ok) {
                    this.app.showNotification('AI proposal rejected.');
                    this.loadCampaigns();
                }
            } catch(e) {
                console.error(e);
            }
        },
        async loadCausalLiftData(campaignId) {
            try {
                const response = await fetch(`/api/global/marketing-campaigns/${campaignId}/causal-lift`, {
                    headers: this.authHeaders
                });
                if (response.ok) {
                    const data = await response.json();
                    this.causalLiftData = { ...this.causalLiftData, [campaignId]: data };
                }
            } catch(e) {
                console.error(e);
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
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
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
                    headers: this.authHeaders,
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
                    headers: this.authHeaders,
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
                    headers: this.authHeaders
                });
                if (response.ok) {
                    this.mediaLibraryItems = await response.json();
                }
            } catch (err) {
                console.error('Error loading media library inside campaigns builder:', err);
            }
        },
        triggerCampaignTranslation(lang) {
            if (!this.app.isFeatureAllowed('allow_translator')) {
                alert('🔒 Feature Locked: Please upgrade your subscription to Professional or Enterprise Tier to unlock the Multilingual AI Translator.');
                return;
            }
            this.translateCampaignWithAI(lang);
        },
        triggerCreativeOptimization(campaignId, stat) {
            if (!this.app.isFeatureAllowed('allow_copywriter')) {
                alert('🔒 Feature Locked: Please upgrade your subscription to unlock the AI Copywriter Studio.');
                return;
            }
            this.autoOptimizeCreativeCopy(campaignId, stat);
        },
        async toggleDynamicOptimization(campaign) {
            if (!this.app.isFeatureAllowed('allow_dynamic_optimization')) {
                alert('🔒 Feature Locked: Please upgrade to Enterprise Tier to unlock Dynamic Funnel Swapping & Dropoff Optimization.');
                return;
            }
            const nextState = !campaign.dynamic_optimization_enabled;
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/marketing-campaigns/${campaign.id}/toggle-dynamic-optimization`, {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ enabled: nextState })
                });
                if (response.ok) {
                    campaign.dynamic_optimization_enabled = nextState;
                    this.app.showNotification(nextState ? '🔄 Dynamic Funnel Swapping enabled!' : 'Funnel optimization paused.');
                    this.loadCampaigns();
                } else {
                    const err = await response.json();
                    alert('Error toggling dynamic optimization: ' + (err.error || 'Unknown error'));
                }
            } catch (err) {
                alert('Network error: ' + err.message);
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
                            ...this.authHeaders,
                            'Content-Type': 'application/json'
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
                            ...this.authHeaders,
                            'Content-Type': 'application/json'
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

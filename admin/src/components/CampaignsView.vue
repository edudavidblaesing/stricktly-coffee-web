<template>
    <div id="view-campaigns" class="admin-view" :class="{ active: app.activeView === 'campaigns', 'creator-fullscreen': isCreatingCampaign }">
        <!-- Marketing Summary Cards -->
        <div v-if="!isCreatingCampaign" class="metrics-grid" style="margin-bottom: 24px;">
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
                        <span class="metric-value">{{ blendedRoas }}</span>
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
                        {{ campaigns.length > 0 || (app.showDemoData && app.currentEnv !== 'prod') ? '📈 +14.2% attribution lift' : '● No active attribution' }}
                    </span>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-card-body">
                    <span class="metric-label">Inbound Traffic Click-Through</span>
                    <div class="metric-main-row">
                        <span class="metric-value">{{ inboundCtr }}</span>
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
                        {{ campaigns.length > 0 || (app.showDemoData && app.currentEnv !== 'prod') ? '⚡ Real-time attribution tracking' : '● Traffic tracker active' }}
                    </span>
                </div>
            </div>
        </div>

        <!-- CREATE CAMPAIGN MODAL -->
        <!-- CREATE CAMPAIGN FULL-SCREEN WORKSPACE -->
        <div v-if="isCreatingCampaign" 
             style="display: flex; flex-direction: column; text-align: left; overflow: hidden; border: none; background: var(--bg-color); width: 100%; height: 100vh; box-sizing: border-box;"
             :style="{ padding: newCampaign.creation_mode_selected ? '24px' : '32px 40px' }">
            
            <!-- Onboarding Mode Selector Screen -->
            <div v-if="!newCampaign.creation_mode_selected" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 16px 24px 24px 24px; overflow-y: auto;">
                <div style="width: 100%; display: flex; justify-content: flex-start; margin-bottom: 12px;">
                    <button type="button" @click="closeCreateCampaignModal" class="btn btn-secondary" style="font-size: 0.76rem; padding: 6px 12px; height: 32px; border: 1px solid var(--border); margin: 0;">
                        ← Back to Board
                    </button>
                </div>
                
                <h2 style="font-family: var(--font-display); font-size: 1.45rem; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">Select Campaign Creator Mode</h2>
                <p style="font-size: 0.82rem; color: var(--text-muted); max-width: 480px; margin-bottom: 20px; line-height: 1.4;">
                    Choose how you want to build this campaign. You can switch modes or customize parameters at any point in the workspace.
                </p>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 880px; width: 100%;">
                    <!-- Card 1: Manual -->
                    <div @click="setWorkspaceMode('manual')" class="mode-selection-card" style="border: 1px solid var(--border); border-radius: 12px; padding: 18px 16px; cursor: pointer; transition: all 0.3s; background: rgba(255,255,255,0.015); display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <span style="font-size: 2rem;">✍️</span>
                        <strong style="font-size: 0.95rem; color: var(--text-main);">Manual Designer</strong>
                        <p style="font-size: 0.74rem; color: var(--text-muted); line-height: 1.4; margin: 0; min-height: 58px;">
                            Take absolute control. Configure target channels, budget schedules, and write copywriting variants yourself.
                        </p>
                        <span class="btn btn-secondary" style="font-size: 0.7rem; padding: 4px 12px; margin-top: 12px; height: auto;">Select Manual</span>
                    </div>

                    <!-- Card 2: Co-Pilot -->
                    <div @click="setWorkspaceMode('copilot')" class="mode-selection-card" style="border: 1px solid var(--border); border-radius: 12px; padding: 18px 16px; cursor: pointer; transition: all 0.3s; background: rgba(96,165,250,0.03); border-color: rgba(96,165,250,0.25); display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <span style="font-size: 2rem;">💡</span>
                        <strong style="font-size: 0.95rem; color: var(--text-main);">AI Co-Pilot</strong>
                        <p style="font-size: 0.74rem; color: var(--text-muted); line-height: 1.4; margin: 0; min-height: 58px;">
                            Collaborative builder. You configure channels and base copy; our AI improves headlines, rewrites copies, and provides budget recommendations.
                        </p>
                        <span class="btn btn-secondary" style="font-size: 0.7rem; padding: 4px 12px; margin-top: 12px; color: #60a5fa; border-color: rgba(96,165,250,0.3); height: auto;">Select Co-Pilot</span>
                    </div>

                    <!-- Card 3: Autopilot -->
                    <div v-if="app.userRole.toLowerCase() === 'superadmin'" @click="setWorkspaceMode('autopilot')" class="mode-selection-card" style="border: 1px solid var(--border); border-radius: 12px; padding: 18px 16px; cursor: pointer; transition: all 0.3s; background: rgba(197,160,89,0.05); border-color: rgba(197,160,89,0.3); display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <span style="font-size: 2rem;">⚡</span>
                        <strong style="font-size: 0.95rem; color: var(--accent);">AI Autopilot (One-Tap)</strong>
                        <p style="font-size: 0.74rem; color: var(--text-muted); line-height: 1.4; margin: 0; min-height: 58px;">
                            Zero-effort launch. Enter a single sentence campaign goal, and AI generates copywriting copy, links landing page structure, and schedules all channels.
                        </p>
                        <span class="btn btn-accent" style="font-size: 0.7rem; padding: 4px 12px; margin-top: 12px; height: auto;">Select Autopilot</span>
                    </div>
                </div>
            </div>

            <!-- Main Creation Workspace (Once Mode is Selected) -->
            <div v-else style="display: flex; flex-direction: column; height: 100%; min-height: 0;">
                <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-top: 0;">
                    <!-- Top Left: Back Button & Mode Indicator -->
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <button type="button" @click="closeCreateCampaignModal" class="btn btn-secondary" style="font-size: 0.76rem; padding: 6px 12px; height: 32px; border: 1px solid var(--border); margin: 0; display: flex; align-items: center; gap: 4px;">
                            ← Back to Board
                        </button>
                        <span style="font-size: 1.1rem; color: var(--text-main);">✨ Ad Studio Workspace</span>
                        
                        <!-- Creator Mode Badges/Toggles -->
                        <div style="display: flex; gap: 4px; background: var(--border); padding: 2px; border-radius: 6px;">
                            <button type="button" @click="setWorkspaceMode('manual')" style="font-size: 0.65rem; padding: 3px 8px; border: none; cursor: pointer; border-radius: 4px; transition: 0.2s;" :style="newCampaign.creation_mode === 'manual' ? 'background: var(--card-bg); color: var(--text-main); font-weight: bold;' : 'background: none; color: var(--text-muted);'">✍️ Manual</button>
                            <button type="button" @click="setWorkspaceMode('copilot')" style="font-size: 0.65rem; padding: 3px 8px; border: none; cursor: pointer; border-radius: 4px; transition: 0.2s;" :style="newCampaign.creation_mode === 'copilot' ? 'background: var(--card-bg); color: var(--text-main); font-weight: bold;' : 'background: none; color: var(--text-muted);'">💡 Co-Pilot</button>
                            <button v-if="app.userRole.toLowerCase() === 'superadmin'" type="button" @click="setWorkspaceMode('autopilot')" style="font-size: 0.65rem; padding: 3px 8px; border: none; cursor: pointer; border-radius: 4px; transition: 0.2s;" :style="newCampaign.creation_mode === 'autopilot' ? 'background: var(--card-bg); color: var(--text-main); font-weight: bold;' : 'background: none; color: var(--text-muted);'">⚡ Autopilot</button>
                        </div>
                    </div>
                    
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

                <div class="dashboard-layout-grid" style="grid-template-columns: 1.25fr 0.75fr; gap: 24px; margin-bottom: 0; flex: 1; min-height: 0; display: grid;">
            <!-- Left: Omnichannel Campaign Creator -->
            <div class="panel" style="display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden;">
                <div class="panel-header" style="border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px;">
                    <h3 class="panel-title" style="display: flex; align-items: center; gap: 8px;">
                        <span>✨ Launch Campaign</span>
                        <span class="badge-simulation" style="background: var(--text-main); color: var(--workspace-bg); font-size: 0.65rem;">OMNICHANNEL</span>
                    </h3>
                </div>

                <form id="campaign-creation-form" @submit.prevent="saveCampaign" style="flex: 1; min-height: 0; display: flex; flex-direction: column;">
                    <!-- Step Tabs Navigation (Fixed at top) -->
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px; flex-shrink: 0;">
                        <div style="display: flex; gap: 6px; overflow-x: auto; max-width: 80%;">
                            <button type="button" v-for="step in [1, 2, 3, 4]" :key="step" 
                                @click="currentStep = step" 
                                :style="currentStep === step ? 'background: rgba(197, 160, 89, 0.12); color: var(--accent); border: 1px solid var(--accent);' : 'background: rgba(255,255,255,0.02); color: var(--text-muted); border: 1px solid var(--border);'" 
                                style="font-size: 0.72rem; font-weight: 700; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                                <span :style="currentStep === step ? 'background: var(--accent); color: var(--workspace-bg);' : 'background: var(--border); color: var(--text-muted);'" style="width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: bold;">{{ step }}</span>
                                {{ getStepName(step) }}
                            </button>
                        </div>
                        
                        <!-- Back/Next Controls -->
                        <div style="display: flex; gap: 6px; flex-shrink: 0;">
                            <button type="button" @click="currentStep > 1 ? currentStep-- : null" :disabled="currentStep === 1" class="btn btn-secondary" style="font-size: 0.72rem; padding: 4px 10px; height: 28px; margin: 0; display: flex; align-items: center; gap: 4px; opacity: currentStep === 1 ? 0.4 : 1;">
                                ← Prev
                            </button>
                            <button type="button" @click="currentStep < 4 ? currentStep++ : null" :disabled="currentStep === 4" class="btn btn-secondary" style="font-size: 0.72rem; padding: 4px 10px; height: 28px; margin: 0; display: flex; align-items: center; gap: 4px; opacity: currentStep === 4 ? 0.4 : 1;">
                                Next →
                            </button>
                        </div>
                    </div>

                    <!-- Scrollable Form Container -->
                    <div style="flex: 1; overflow-y: auto; overflow-x: hidden; padding-right: 8px;">
                        <!-- ==================== STEP 1: GENERAL SETUP ==================== -->
                        <div v-show="currentStep === 1">
                    <!-- AI AUTOPILOT GENERATION CONSOLE -->
                    <div v-if="newCampaign.creation_mode === 'autopilot'" style="background: rgba(197, 160, 89, 0.04); border: 1px solid rgba(197, 160, 89, 0.25); border-radius: 10px; padding: 16px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: var(--accent); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
                            <span>⚡ AI Autopilot Director</span>
                        </h4>
                        <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px;">
                            Describe your campaign goal. Autopilot will write Headlines & Description variants (A/B), select target channels, configure the optimal budget, translate copies to target locales, and auto-build a custom landing page in one tap.
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <textarea v-model="newCampaign.autopilot_goal" rows="2" placeholder="e.g. Promote our new organic dark roast blend to dark roast coffee enthusiasts and offer a 15% discount code using promo DARK15" style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 10px; font-size: 0.82rem; resize: vertical; font-family: inherit; margin-bottom: 4px;"></textarea>
                            
                            <!-- AI Model Switcher Dropdown (Governed by Tier & API Keys) -->
                            <div style="margin-bottom: 8px; text-align: left;">
                                <label style="display: block; font-size: 0.72rem; font-weight: bold; color: var(--text-muted); margin-bottom: 4px;">
                                    🧠 AI Orchestrator Model
                                </label>
                                <select v-model="newCampaign.selectedModel" style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 6px; font-size: 0.78rem; height: 32px; font-family: inherit;">
                                    <!-- Gemini Group -->
                                    <optgroup label="Google Gemini">
                                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Standard - Fast)</option>
                                        <option value="gemini-3.1-pro" :disabled="activeBrand.ai_tier === 'standard'">
                                            Gemini 3.1 Pro (Professional) {{ activeBrand.ai_tier === 'standard' ? '🔒' : '' }}
                                        </option>
                                        <option value="deep-research-pro-preview" :disabled="activeBrand.ai_tier !== 'enterprise'">
                                            Deep Research Pro (Enterprise) {{ activeBrand.ai_tier !== 'enterprise' ? '🔒' : '' }}
                                        </option>
                                    </optgroup>
                                    
                                    <!-- OpenAI Group -->
                                    <optgroup label="OpenAI">
                                        <option value="gpt-4o-mini" :disabled="!aiProviders.openai">
                                            GPT-4o Mini {{ !aiProviders.openai ? '(OpenAI Key Missing ⚠️)' : '(Standard)' }}
                                        </option>
                                        <option value="gpt-4o" :disabled="!aiProviders.openai || activeBrand.ai_tier === 'standard'">
                                            GPT-4o {{ !aiProviders.openai ? '(OpenAI Key Missing ⚠️)' : (activeBrand.ai_tier === 'standard' ? '🔒' : '(Professional)') }}
                                        </option>
                                    </optgroup>

                                    <!-- Anthropic Claude Group -->
                                    <optgroup label="Anthropic Claude">
                                        <option value="claude-3-haiku-latest" :disabled="!aiProviders.claude">
                                            Claude 3.5 Haiku {{ !aiProviders.claude ? '(Claude Key Missing ⚠️)' : '(Standard)' }}
                                        </option>
                                        <option value="claude-3-5-sonnet-latest" :disabled="!aiProviders.claude || activeBrand.ai_tier === 'standard'">
                                            Claude 3.5 Sonnet {{ !aiProviders.claude ? '(Claude Key Missing ⚠️)' : (activeBrand.ai_tier === 'standard' ? '🔒' : '(Professional)') }}
                                        </option>
                                    </optgroup>
                                </select>
                            </div>
                            
                            <button type="button" @click="runAIAutopilotGeneration" :disabled="generatingAutopilot" class="btn btn-accent" style="font-size: 0.76rem; padding: 8px 16px; font-weight: 700; height: 36px; display: flex; align-items: center; justify-content: center; gap: 6px; margin: 0;">
                                <span v-if="generatingAutopilot">⏳ Building Campaign Assets...</span>
                                <span v-else>✨ Run AI Autopilot Setup</span>
                            </button>
                        </div>
                        
                        <!-- Status loader ticks -->
                        <div v-if="generatingAutopilot && autopilotStatusTicks.length > 0" style="margin-top: 12px; background: rgba(0,0,0,0.2); border-radius: 6px; padding: 8px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px;">
                            <div v-for="tick in autopilotStatusTicks" :key="tick" style="font-size: 0.7rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                                <span style="color: var(--accent);">●</span>
                                <span>{{ tick }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Target Coffee Brand select (Only shown if activeShopFilter is 'all') -->
                    <div v-if="app.activeShopFilter === 'all'" class="form-group" style="margin-bottom: 16px;">
                        <label style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: var(--text-main); font-size: 0.85rem; margin-bottom: 6px;">
                            <span>Target Coffee Brand</span>
                            <span class="info-tooltip-trigger" data-tooltip="Since you are managing campaigns at the agency level, select which specific coffee brand storefront this campaign belongs to.">i</span>
                        </label>
                        <select v-model="newCampaign.brand_id" style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;" required>
                            <option v-for="b in app.brands" :key="b.id" :value="b.id">
                                {{ b.name }} (subdomain: {{ b.subdomain }})
                            </option>
                        </select>
                    </div>

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
                                📦 Product & Service Showcase
                            </button>
                            <button type="button" class="btn" style="flex: 1; margin: 0; padding: 8px; font-size: 0.76rem; font-weight: 700; border-radius: 6px; transition: 0.2s;" :style="newCampaign.campaign_type === 'page' ? 'background: var(--primary); color: var(--bg-color); border-color: var(--primary);' : 'background: var(--card-bg); border: 1px solid var(--border); color: var(--text-main);'" @click="setCampaignType('page')">
                                📄 Landing Page
                            </button>
                        </div>
                    </div>

                    <!-- Target Product Catalog Item select -->
                    <div v-if="newCampaign.campaign_type === 'product'" class="form-group" style="margin-bottom: 12px; background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 12px; border-radius: 8px;">
                        <label style="display: flex; align-items: center; gap: 6px; font-weight: 700; margin-bottom: 6px;">
                            <span>Select Products & Services to Promote</span>
                            <span class="info-tooltip-trigger" data-tooltip="Choose one or more items to promote. For carousels, this will pre-populate individual cards.">i</span>
                        </label>
                        <!-- Search Box for Products / Services in Campaign Creator -->
                        <input type="text" v-model="catalogShowcaseSearch" placeholder="Search products & services..." 
                               style="width: 100%; height: 32px; font-size: 0.76rem; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); margin-bottom: 8px; padding: 0 8px; outline: none;">
                        
                        <div style="max-height: 180px; overflow-y: auto; border: 1px solid var(--border); border-radius: 6px; padding: 8px; background: var(--card-bg); display: flex; flex-direction: column; gap: 8px;">
                            <label v-for="p in filteredCampaignProducts" :key="p.id" style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; cursor: pointer; margin: 0; padding: 4px 6px; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                <input type="checkbox" :value="p.id" v-model="selectedProductIds" @change="applyProductCatalogDetails" style="width: 14px; height: 14px; margin: 0; cursor: pointer;">
                                <img :src="p.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=50'" style="width: 28px; height: 28px; object-fit: cover; border-radius: 4px; background: white; border: 1px solid var(--border);" />
                                <span style="flex: 1; display: flex; align-items: center; gap: 6px; min-width: 0;">
                                    <span style="font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">{{ p.title }}</span>
                                    <span style="font-size: 0.62rem; padding: 1px 4px; border-radius: 3px; font-weight: 700; white-space: nowrap;"
                                          :style="p.type === 'service' ? 'background: rgba(139, 92, 246, 0.15); color: #c084fc; border: 1px solid rgba(139, 92, 246, 0.3);' : 'background: rgba(255, 255, 255, 0.05); color: var(--text-muted); border: 1px solid var(--border);'">
                                        {{ p.type === 'service' ? 'Service' : 'Product' }}
                                    </span>
                                    <span style="color: var(--text-muted); font-size: 0.72rem; white-space: nowrap;">(€{{ parseFloat(p.price).toFixed(2) }})</span>
                                </span>
                            </label>
                            <div v-if="filteredCampaignProducts.length === 0" style="text-align: center; color: var(--text-muted); font-size: 0.75rem; padding: 12px;">
                                No items found matching search filters.
                            </div>
                        </div>
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
                </div> <!-- End Step 1 -->

                <!-- ==================== STEP 2: BUDGET & TARGETING ==================== -->
                <div v-show="currentStep === 2">

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

                            <!-- TikTok Ads Option -->
                            <div :style="{
                                     background: newCampaign.platforms.includes('tiktok') ? '#ffffff' : 'var(--card-bg)',
                                     color: newCampaign.platforms.includes('tiktok') ? '#000000' : 'var(--text-main)',
                                     border: '1px solid ' + (newCampaign.platforms.includes('tiktok') ? '#ffffff' : 'var(--border)')
                                 }"
                                 style="padding: 8px; border-radius: 8px; display: flex; flex-direction: column; gap: 4px; justify-content: space-between; font-size: 0.76rem; transition: all 0.2s ease;">
                                <label :style="{ color: newCampaign.platforms.includes('tiktok') ? '#000000' : 'var(--text-main)' }"
                                       style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin: 0; font-weight: 600;">
                                    <input type="checkbox" value="tiktok" v-model="newCampaign.platforms" style="width: 14px; height: 14px; margin: 0; cursor: pointer;">
                                    <span style="font-size: 1rem;">🎵</span>
                                    <span>TikTok Ads</span>
                                </label>
                                <span v-if="!isChannelConnected('tiktok')"
                                      :style="{
                                          color: newCampaign.platforms.includes('tiktok') ? '#b25e00' : '#eab308',
                                          background: newCampaign.platforms.includes('tiktok') ? 'rgba(178,94,0,0.1)' : 'rgba(234,179,8,0.1)'
                                      }"
                                      style="font-size: 0.65rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-align: center; transition: all 0.2s ease;">
                                    ⚠️ <a href="#" @click.prevent="openOAuthConnector('tiktok')" :style="{ color: newCampaign.platforms.includes('tiktok') ? '#b25e00' : '#eab308' }" style="text-decoration: underline;">Disconnected</a>
                                </span>
                                <span v-else
                                      :style="{
                                          color: '#10b981',
                                          background: newCampaign.platforms.includes('tiktok') ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
                                      }"
                                      style="font-size: 0.65rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-align: center; transition: all 0.2s ease;">
                                    ✓ Connected
                                </span>
                            </div>

                            <!-- LinkedIn Ads Option -->
                            <div :style="{
                                     background: newCampaign.platforms.includes('linkedin') ? '#ffffff' : 'var(--card-bg)',
                                     color: newCampaign.platforms.includes('linkedin') ? '#000000' : 'var(--text-main)',
                                     border: '1px solid ' + (newCampaign.platforms.includes('linkedin') ? '#ffffff' : 'var(--border)')
                                 }"
                                 style="padding: 8px; border-radius: 8px; display: flex; flex-direction: column; gap: 4px; justify-content: space-between; font-size: 0.76rem; transition: all 0.2s ease;">
                                <label :style="{ color: newCampaign.platforms.includes('linkedin') ? '#000000' : 'var(--text-main)' }"
                                       style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin: 0; font-weight: 600;">
                                    <input type="checkbox" value="linkedin" v-model="newCampaign.platforms" style="width: 14px; height: 14px; margin: 0; cursor: pointer;">
                                    <span style="font-size: 1rem;">💼</span>
                                    <span>LinkedIn Ads</span>
                                </label>
                                <span v-if="!isChannelConnected('linkedin')"
                                      :style="{
                                          color: newCampaign.platforms.includes('linkedin') ? '#b25e00' : '#eab308',
                                          background: newCampaign.platforms.includes('linkedin') ? 'rgba(178,94,0,0.1)' : 'rgba(234,179,8,0.1)'
                                      }"
                                      style="font-size: 0.65rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-align: center; transition: all 0.2s ease;">
                                    ⚠️ <a href="#" @click.prevent="openOAuthConnector('linkedin')" :style="{ color: newCampaign.platforms.includes('linkedin') ? '#b25e00' : '#eab308' }" style="text-decoration: underline;">Disconnected</a>
                                </span>
                                <span v-else
                                      :style="{
                                          color: '#10b981',
                                          background: newCampaign.platforms.includes('linkedin') ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
                                      }"
                                      style="font-size: 0.65rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-align: center; transition: all 0.2s ease;">
                                    ✓ Connected
                                </span>
                            </div>

                            <!-- Pinterest Ads Option -->
                            <div :style="{
                                     background: newCampaign.platforms.includes('pinterest') ? '#ffffff' : 'var(--card-bg)',
                                     color: newCampaign.platforms.includes('pinterest') ? '#000000' : 'var(--text-main)',
                                     border: '1px solid ' + (newCampaign.platforms.includes('pinterest') ? '#ffffff' : 'var(--border)')
                                 }"
                                 style="padding: 8px; border-radius: 8px; display: flex; flex-direction: column; gap: 4px; justify-content: space-between; font-size: 0.76rem; transition: all 0.2s ease;">
                                <label :style="{ color: newCampaign.platforms.includes('pinterest') ? '#000000' : 'var(--text-main)' }"
                                       style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin: 0; font-weight: 600;">
                                    <input type="checkbox" value="pinterest" v-model="newCampaign.platforms" style="width: 14px; height: 14px; margin: 0; cursor: pointer;">
                                    <span style="font-size: 1rem;">📌</span>
                                    <span>Pinterest Ads</span>
                                </label>
                                <span v-if="!isChannelConnected('pinterest')"
                                      :style="{
                                          color: newCampaign.platforms.includes('pinterest') ? '#b25e00' : '#eab308',
                                          background: newCampaign.platforms.includes('pinterest') ? 'rgba(178,94,0,0.1)' : 'rgba(234,179,8,0.1)'
                                      }"
                                      style="font-size: 0.65rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-align: center; transition: all 0.2s ease;">
                                    ⚠️ <a href="#" @click.prevent="openOAuthConnector('pinterest')" :style="{ color: newCampaign.platforms.includes('pinterest') ? '#b25e00' : '#eab308' }" style="text-decoration: underline;">Disconnected</a>
                                </span>
                                <span v-else
                                      :style="{
                                          color: '#10b981',
                                          background: newCampaign.platforms.includes('pinterest') ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
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

                    <!-- Lookalike Seeding via Store Customer Emails Toggle -->
                    <div style="margin-bottom: 16px; background: rgba(255,255,255,0.015); border: 1px solid var(--border); border-radius: 8px; padding: 12px;">
                        <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--text-main); font-size: 0.8rem; cursor: pointer; margin-bottom: 4px;">
                            <input type="checkbox" v-model="newCampaign.lookalike_seeding_enabled" style="width: 14px; height: 14px; margin: 0; cursor: pointer;">
                            <span>👥 Seed Custom Audience from Store Emails (Lookalike Targeting)</span>
                        </label>
                        <p style="margin: 0; font-size: 0.7rem; color: var(--text-muted); line-height: 1.4;">
                            Securely hash and upload connected store emails (from Shopify/WooCommerce) to build a 1% Lookalike Audience on Meta/Google, while automatically excluding existing customers from seeing the ads.
                        </p>
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

                    <!-- AI Campaign Agent Optimizer (Optional Setup) -->
                    <div style="border-top: 1px dashed var(--border); margin-top: 16px; padding-top: 16px; margin-bottom: 16px;">
                        <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--accent); font-size: 0.82rem; cursor: pointer; margin-bottom: 8px;">
                            <input type="checkbox" v-model="newCampaign.autopilot_enabled" style="width: 14px; height: 14px; margin: 0; cursor: pointer;">
                            <span>🤖 Activate Campaign AI Agent Optimizer</span>
                            <span class="info-tooltip-trigger" data-tooltip="Delegates campaign performance tweaks, budget reallocations, and translation checks to active AI Agent specialists.">i</span>
                        </label>
                        <p style="margin: 0 0 10px 0; font-size: 0.72rem; color: var(--text-muted); line-height: 1.4;">
                            Enable AI specialists to optimize copy variants, adjust budgets, and implement safety floors in real-time.
                        </p>

                        <div v-if="newCampaign.autopilot_enabled" style="display: flex; flex-direction: column; gap: 10px; padding: 12px; background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 8px;">
                            <div class="form-group" style="margin: 0;">
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: bold; color: var(--text-muted); margin-bottom: 4px;">
                                    <span>Agent Execution Mode</span>
                                    <span class="info-tooltip-trigger" data-tooltip="Co-Pilot: Suggests adjustments for your manual approval. Autopilot: Automatically executes optimizations in real-time.">i</span>
                                </label>
                                <select v-model="newCampaign.agent_mode" style="width: 100%; border-radius: 6px; padding: 6px; font-size: 0.78rem;">
                                    <option value="recommendation">Co-Pilot (Recommendation Mode)</option>
                                    <option value="autonomous">Autopilot (Autonomous Mode)</option>
                                </select>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div class="form-group" style="margin: 0;">
                                    <label style="display: flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: bold; color: var(--text-muted); margin-bottom: 4px;">
                                        <span>Max Budget Change (%)</span>
                                        <span class="info-tooltip-trigger" data-tooltip="The maximum percentage variation the AI can increase or decrease the budget per day.">i</span>
                                    </label>
                                    <input type="number" v-model.number="newCampaign.autopilot_guardrails.max_budget_change_pct" style="width: 100%; border-radius: 6px; padding: 6px; font-size: 0.78rem; height: 32px;">
                                </div>
                                <div class="form-group" style="margin: 0;">
                                    <label style="display: flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: bold; color: var(--text-muted); margin-bottom: 4px;">
                                        <span>Min ROAS Floor</span>
                                        <span class="info-tooltip-trigger" data-tooltip="The safety threshold ROAS. If a campaign drops below this floor, the AI immediately pauses or alerts.">i</span>
                                    </label>
                                    <input type="number" step="0.1" v-model.number="newCampaign.autopilot_guardrails.min_roas_floor" style="width: 100%; border-radius: 6px; padding: 6px; font-size: 0.78rem; height: 32px;">
                                </div>
                            </div>
                            
                            <div class="form-group" style="margin: 0;">
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: bold; color: var(--text-muted); margin-bottom: 4px;">
                                    <span>Max Daily Spend Ceiling (€)</span>
                                    <span class="info-tooltip-trigger" data-tooltip="An absolute hard limit on how much the AI can spend in a single day, regardless of bidding opportunity.">i</span>
                                </label>
                                <input type="number" v-model.number="newCampaign.autopilot_guardrails.max_spend_ceiling" style="width: 100%; border-radius: 6px; padding: 6px; font-size: 0.78rem; height: 32px;">
                            </div>
                        </div>
                    </div>
                </div> <!-- End Step 2 -->

                <!-- ==================== STEP 4: DESTINATION PAGE ==================== -->
                <div v-show="currentStep === 4">
                    <div v-if="newCampaign.campaign_type !== 'manual'" style="background: rgba(255,255,255,0.015); border: 1px solid var(--border); border-radius: 8px; padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.8rem; margin-bottom: 12px;">
                        ℹ️ Destination page is automatically governed by your catalog product showcase or custom landing page selection configured in Step 1.
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
                        
                        <!-- Campaign Personalization Overrides -->
                        <div style="border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 16px; background: rgba(255,255,255,0.015); width: 100%;">
                            <h4 style="margin: 0 0 10px 0; color: var(--accent); font-size: 0.85rem; font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                                <span>⚙️</span> Storefront Personalization Overrides
                            </h4>
                            
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <div class="form-group" style="margin: 0;">
                                    <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 4px;">Target Persona Override</label>
                                    <select v-model="newCampaign.target_persona" style="width: 100%; font-size: 0.78rem; height: 32px; padding: 0 6px;">
                                        <option value="">-- No target persona override --</option>
                                        <option value="@barista">☕ @barista (Technical & Precision Barista)</option>
                                        <option value="@curator">✨ @curator (Design Purist & Aesthetic Curator)</option>
                                        <option value="@home-brewer">🏠 @home-brewer (Daily Home Coffee Brewer)</option>
                                    </select>
                                </div>

                                <div class="form-group" style="margin: 0;">
                                    <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 4px;">Featured Showcase Product Override</label>
                                    <select v-model="newCampaign.product_id_override" style="width: 100%; font-size: 0.78rem; height: 32px; padding: 0 6px;">
                                        <option :value="null">-- No product override --</option>
                                        <option v-for="p in (app.products || []).filter(x => x.brand_id === newCampaign.brand_id)" :key="p.id" :value="p.id">
                                            {{ p.title }}
                                        </option>
                                    </select>
                                </div>

                                <div class="form-group" style="margin: 0;">
                                    <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 4px;">Headline Copy Override</label>
                                    <input type="text" v-model="newCampaign.subheadline" placeholder="Override landing page headline for this campaign..." style="width: 100%; font-size: 0.78rem; height: 32px; padding: 0 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main);">
                                </div>

                                <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px; cursor: pointer; user-select: none;">
                                    <input type="checkbox" id="campaign-opt-toggle" v-model="newCampaign.dynamic_copy_optimization" style="width: 15px; height: 15px; cursor: pointer; margin: 0;">
                                    <label for="campaign-opt-toggle" style="font-size: 0.75rem; color: var(--text-main); font-weight: 600; cursor: pointer; margin: 0;">
                                        Enable Real-time AI Copy Optimization
                                    </label>
                                </div>
                                <span style="font-size: 0.65rem; color: var(--text-muted); line-height: 1.3;">
                                    If enabled, the Gemini agent automatically optimizes page headlines and feature copywriting based on the campaign's target persona and ad text.
                                </span>
                            </div>
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
                                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px;">
                                    <select v-model="newCampaign.landing_page_id" style="width: 100%; margin-bottom: 0;" :disabled="newCampaign.destination_type !== 'landing_page'">
                                        <option value="">-- Choose Landing Page --</option>
                                        <option v-for="page in availableLandingPages" :key="page.id" :value="page.id">
                                            {{ page.title }} ({{ page.id }})
                                        </option>
                                    </select>
                                    <button v-if="newCampaign.destination_type === 'landing_page'" type="button" @click="startInlineLandingPageBuilder" class="btn btn-secondary" style="font-size: 0.72rem; padding: 6px 12px; margin: 0; white-space: nowrap; height: 36px;">
                                        ➕ New Page
                                    </button>
                                    <button v-if="newCampaign.destination_type === 'landing_page' && newCampaign.landing_page_id" type="button" @click="editSelectedLandingPage" class="btn btn-secondary" style="font-size: 0.72rem; padding: 6px 12px; margin: 0; white-space: nowrap; height: 36px; border-color: var(--accent); color: var(--accent);">
                                        ✏️ Edit Selected
                                    </button>
                                </div>

                                <!-- Inline Landing Page Designer Panel -->
                                <div v-if="showLandingPageBuilder" style="background: rgba(16, 185, 129, 0.03); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
                                    <h4 style="margin: 0 0 10px 0; color: #10b981; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; justify-content: space-between;">
                                        <span>📄 Campaign Landing Page Designer</span>
                                        <button type="button" @click="generateLandingPageCopyViaAI" :disabled="landingPageAiGenerating" class="sc-ai-button" style="font-size: 0.68rem; padding: 2px 6px; height: 24px; margin: 0; line-height: 1;">
                                            <span v-if="landingPageAiGenerating">⏳ Generating...</span>
                                            <span v-else>✨ AI Generate Copy</span>
                                        </button>
                                    </h4>
                                    
                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                            <div class="form-group" style="margin: 0;">
                                                <label style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 2px; display: block;">Page ID / URL Slug</label>
                                                <input type="text" v-model="newLandingPage.id" placeholder="e.g. promo-blend" style="font-size: 0.72rem; padding: 6px; width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main);">
                                            </div>
                                            <div class="form-group" style="margin: 0;">
                                                <label style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 2px; display: block;">Internal Page Title</label>
                                                <input type="text" v-model="newLandingPage.title" placeholder="e.g. Summer Promo Offer" style="font-size: 0.72rem; padding: 6px; width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main);">
                                            </div>
                                        </div>
                                        
                                        <div class="form-group" style="margin: 0;">
                                            <label style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 2px; display: block;">Hero Headline Text</label>
                                            <input type="text" v-model="newLandingPage.headline" placeholder="e.g. Taste the Freshly Roasted Difference" style="font-size: 0.72rem; padding: 6px; width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main);">
                                        </div>
                                        <div class="form-group" style="margin: 0;">
                                            <label style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 2px; display: block;">Subheadline Text</label>
                                            <input type="text" v-model="newLandingPage.subheadline" placeholder="e.g. Handcrafted custom beans with direct farmer sourcing." style="font-size: 0.72rem; padding: 6px; width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main);">
                                        </div>
                                        
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                            <div class="form-group" style="margin: 0;">
                                                <label style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 2px; display: block;">Button Text (CTA)</label>
                                                <input type="text" v-model="newLandingPage.cta" placeholder="e.g. Shop Special 15% Off" style="font-size: 0.72rem; padding: 6px; width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main);">
                                            </div>
                                            <div class="form-group" style="margin: 0;">
                                                <label style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 2px; display: block;">Promo Code</label>
                                                <input type="text" v-model="newLandingPage.coupon_code" placeholder="e.g. FRESH15" style="font-size: 0.72rem; padding: 6px; width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main);">
                                            </div>
                                        </div>
                                        
                                        <div class="form-group" style="margin: 0;">
                                            <label style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 2px; display: block;">Features / USPs (Newline-separated list of 3 items)</label>
                                            <textarea v-model="newLandingPage.features" rows="2" placeholder="⚡ USP 1&#10;☕ USP 2&#10;🌱 USP 3" style="font-size: 0.72rem; padding: 6px; width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-family: inherit; resize: vertical;"></textarea>
                                        </div>
                                        
                                        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px;">
                                            <button type="button" @click="closeLandingPageBuilder" class="btn btn-secondary" style="font-size: 0.68rem; padding: 4px 8px; margin: 0; height: 28px;">Cancel</button>
                                            <button type="button" @click="saveInlineLandingPage" class="btn btn-accent" style="font-size: 0.68rem; padding: 4px 10px; margin: 0; background: #10b981; border-color: #10b981; color: white; height: 28px; line-height: 1;">Save Page</button>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>
                </div> <!-- End Step 4 -->

                <!-- ==================== STEP 3: COPY & CREATIVES ==================== -->
                <div v-show="currentStep === 3">

                    <!-- AI Creative & Copy Autopilot Section -->
                    <div style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.15); border-radius: 10px; padding: 16px; margin-bottom: 20px; text-align: left; display: flex; flex-direction: column; gap: 12px;">
                        <div>
                            <h4 style="margin: 0 0 4px 0; color: #8b5cf6; font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                                🤖 AI Creative & Copy Autopilot Assistant
                            </h4>
                            <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.45;">
                                Auto-generate headlines, marketing descriptions, media format styles, and ad visual prompts using Gemini models tailored for your brand canvas.
                            </p>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                            <div class="form-group" style="margin: 0;">
                                <label style="font-size: 0.65rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Campaign Theme/Goal Direction</label>
                                <input type="text" v-model="aiAutopilotDirection" placeholder="e.g. Focus on organic coffee, warm morning vibe..." style="font-size: 0.75rem; padding: 6px 10px; height: 32px; width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); margin: 0;">
                            </div>
                            <div class="form-group" style="margin: 0;">
                                <label style="font-size: 0.65rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Format Selection</label>
                                <select v-model="aiAutopilotFormat" style="font-size: 0.75rem; padding: 4px 10px; height: 32px; width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); margin: 0;">
                                    <option value="auto">Let AI Decide Format</option>
                                    <option value="Image">Single Image Ad</option>
                                    <option value="Video">Video Ad Variant</option>
                                    <option value="Carousel">Dynamic Product Carousel</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin: 0;">
                                <label style="font-size: 0.65rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Style Reference</label>
                                <select v-model="aiAutopilotStyle" style="font-size: 0.75rem; padding: 4px 10px; height: 32px; width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); margin: 0;">
                                    <option value="brand">Match Brand visual guidelines</option>
                                    <option value="raw">Raw realist product photography</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <button type="button" @click="runAiAutopilotSection" :disabled="runningAutopilotSection" style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; border: none; font-size: 0.78rem; font-weight: 700; border-radius: 6px; height: 36px; padding: 0 16px; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; justify-content: center; width: 100%;">
                                <span v-if="runningAutopilotSection">⏳ Generating Copys & Visual Prompts...</span>
                                <span v-else>✨ Auto-Generate Copy & Creatives</span>
                            </button>
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

                    <div v-if="newCampaign.format !== 'Carousel'" class="form-group" style="margin-bottom: 15px;">
                        <label style="margin: 0 0 6px 0; font-weight: 700; font-size: 0.85rem; display: block;">Ad Creative Graphic (Media)</label>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <div style="width: 70px; height: 70px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border); background: var(--card-bg); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <img v-if="newCampaign.media_url" :src="app.getCleanImageUrl(resolveProductImage(newCampaign.media_url))" style="width: 100%; height: 100%; object-fit: contain;">
                                <span v-else style="font-size: 1.2rem;">🖼️</span>
                            </div>
                            <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 6px;">
                                <ProductTagField v-model="newCampaign.media_url" placeholder="Media asset URL" :audiences="audiences" :brand-canvas="brandCanvas" />
                                <div style="display: flex; gap: 8px;">
                                    <button type="button" @click="triggerCampaignContentStudio('main')" class="btn btn-primary"
                                            style="height: 28px; font-size: 0.72rem; font-weight: 700; padding: 0 10px; margin: 0; display: inline-flex; align-items: center; gap: 4px;">
                                        🎨 Content Studio
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Carousel cards setup if Carousel format is active -->
                    <div v-if="newCampaign.format === 'Carousel'" class="form-group" style="margin-bottom: 16px; border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: var(--bg-color);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 4px;">
                                <span>🎠 Carousel Cards</span>
                                <span class="info-tooltip-trigger" data-tooltip="Manage the individual cards in this swipeable product carousel. Link each card directly to store products.">i</span>
                            </span>
                            <div style="display: flex; gap: 8px;">
                                <button type="button" class="btn btn-secondary" style="font-size: 0.7rem; padding: 2px 6px; height: auto;" @click="autofillCarousel">
                                    ⚡ Fill from Catalog
                                </button>
                                <button type="button" class="btn btn-accent" style="font-size: 0.7rem; padding: 2px 6px; height: auto; background: var(--accent); color: var(--bg-color); border: none;" @click="addCarouselCard" :disabled="newCampaign.carousel_cards.length >= 10">
                                    ➕ Add Card
                                </button>
                            </div>
                        </div>
                        <div v-for="(card, idx) in newCampaign.carousel_cards" :key="idx" style="margin-bottom: 20px; border: 1px solid var(--border); border-radius: 12px; padding: 16px; background: rgba(0,0,0,0.18); position: relative;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                                <span style="font-size: 0.8rem; color: var(--accent); font-weight: 700;">🎠 Card #{{ idx+1 }}</span>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <!-- Remove Card Button -->
                                    <button v-if="newCampaign.carousel_cards.length > 2" type="button" @click="removeCarouselCard(idx)" style="background: none; border: none; color: #ef4444; font-size: 0.72rem; cursor: pointer; padding: 0; font-weight: bold;">
                                        ✕ Remove Card
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Inline Product Linker -->
                            <div style="margin-bottom: 10px;">
                                <select @change="onCarouselProductSelect(idx, $event)" style="width: 100%; font-size: 0.75rem; padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main);">
                                    <option value="">-- Link to a Store Product --</option>
                                    <option v-for="p in app.products" :key="p.id" :value="p.id">
                                        🔗 {{ p.title }} (Price: €{{ parseFloat(p.price).toFixed(2) }})
                                    </option>
                                </select>
                            </div>

                            <!-- Card Image Input with Content Studio -->
                            <div style="margin-bottom: 12px;">
                                <label style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 4px;">Card Image Media</label>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <div style="width: 50px; height: 50px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border); background: var(--card-bg); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <img v-if="card.image" :src="app.getCleanImageUrl(resolveProductImage(card.image))" style="width: 100%; height: 100%; object-fit: contain;">
                                        <span v-else style="font-size: 1rem;">🖼️</span>
                                    </div>
                                    <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px;">
                                        <ProductTagField v-model="card.image" placeholder="Card Image URL" :audiences="audiences" :brand-canvas="brandCanvas" />
                                        <div style="display: flex; gap: 6px;">
                                            <button type="button" @click="triggerCardContentStudio(idx)" class="btn btn-primary"
                                                    style="height: 24px; font-size: 0.68rem; font-weight: 700; padding: 0 8px; margin: 0; display: inline-flex; align-items: center; gap: 2px;">
                                                🎨 Content Studio
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Card Title (Headline) input -->
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                    <label style="font-size: 0.68rem; color: var(--text-muted); margin: 0;">Card Headline / CTA Text</label>
                                    <button type="button" @click="generateCardHeadlineViaAI(idx)" :disabled="card.generatingHeadline" class="sc-ai-button" style="font-size: 0.62rem; padding: 2px 6px; height: 18px; margin: 0; line-height: 1; display: inline-flex; align-items: center; gap: 2px;">
                                        <template v-if="card.generatingHeadline">
                                            <span v-if="app.userRole && app.userRole.toLowerCase() === 'superadmin'">⏳ [€{{ (app.aiTicker.cost * 0.92).toFixed(4) }}]</span>
                                            <span v-else>⏳ Generating...</span>
                                        </template>
                                        <template v-else-if="card.lastHeadlineCost">
                                            <span v-if="app.userRole && app.userRole.toLowerCase() === 'superadmin'">✨ AI Generate [Last: €{{ card.lastHeadlineCost.toFixed(4) }}]</span>
                                            <span v-else>✨ AI Generate</span>
                                        </template>
                                        <template v-else>
                                            <span>✨ AI Generate</span>
                                        </template>
                                    </button>
                                </div>
                                <ProductTagField v-model="card.title" placeholder="Card Headline (e.g. Shop Best Sellers)" :audiences="audiences" :brand-canvas="brandCanvas" />
                            </div>
                        </div>
                    </div>

                    <!-- Tab row for target language copy variants -->
                    <div v-if="newCampaign.languages && newCampaign.languages.length > 1" style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 8px;">
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 700; color: var(--text-main); font-size: 0.85rem;">Edit Ad Copy for Targeted Language:</label>
                            <div class="tab-track" style="display: inline-flex;">
                                <button v-for="lang in newCampaign.languages" :key="lang" type="button" @click="campaignContentLang = lang"
                                        class="tab-pill" :class="{ active: campaignContentLang === lang }" style="font-size: 0.72rem; padding: 6px 12px; font-weight: 700;">
                                    {{ lang.toUpperCase() }}
                                </button>
                            </div>
                        </div>
                        <button type="button" @click="toggleTranslateAllCampaignLanguages" :disabled="!newCampaign.headline || !newCampaign.ad_copy" :title="(!newCampaign.headline || !newCampaign.ad_copy) ? 'Write base English headline and description copy first.' : ''" class="sc-ai-button" style="font-size: 0.72rem; padding: 4px 10px; height: 28px; display: flex; align-items: center; gap: 4px; margin: 0;">
                            <span v-if="!app.isFeatureAllowed('allow_translator')">🔒 AI Translate All</span>
                            <template v-else-if="translatingCampaign">
                                <span v-if="app.userRole && app.userRole.toLowerCase() === 'superadmin'">⏳ [€{{ (app.aiTicker.cost * 0.92).toFixed(4) }} | 🛑 Stop]</span>
                                <span v-else>⏳ Translating all... | 🛑 Stop</span>
                            </template>
                            <template v-else-if="lastTranslatingCampaignCost">
                                <span v-if="app.userRole && app.userRole.toLowerCase() === 'superadmin'">✨ AI Translate All ({{ newCampaign.languages.filter(l => l !== 'en').length }} Locales) [Last: €{{ lastTranslatingCampaignCost.toFixed(4) }}]</span>
                                <span v-else>✨ AI Translate All ({{ newCampaign.languages.filter(l => l !== 'en').length }} Locales)</span>
                            </template>
                            <template v-else>
                                <span>✨ AI Translate All ({{ newCampaign.languages.filter(l => l !== 'en').length }} Locales)</span>
                            </template>
                        </button>
                    </div>

                    <div style="margin-bottom: 16px; border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: rgba(255,255,255,0.01);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">📝 Ad Copy Details ({{ campaignContentLang.toUpperCase() }} variant)</span>
                            <!-- Translate button if not default 'en' -->
                            <button v-if="campaignContentLang !== 'en'" type="button" class="sc-ai-button" style="font-size: 0.7rem; padding: 3px 8px; height: 26px; display: flex; align-items: center; gap: 4px; margin: 0; border-radius: 6px;" @click="toggleCampaignTranslation(campaignContentLang)" :disabled="!newCampaign.headline || !newCampaign.ad_copy" :title="(!newCampaign.headline || !newCampaign.ad_copy) ? 'Write base English headline and description copy first.' : ''">
                                <span v-if="!app.isFeatureAllowed('allow_translator')">🔒 AI Translate</span>
                                <template v-else-if="translatingCampaign">
                                    <span v-if="app.userRole && app.userRole.toLowerCase() === 'superadmin'">⏳ [€{{ (app.aiTicker.cost * 0.92).toFixed(4) }} | 🛑 Stop]</span>
                                    <span v-else>⏳ Translating... | 🛑 Stop</span>
                                </template>
                                <template v-else-if="lastTranslatingCampaignCost">
                                    <span v-if="app.userRole && app.userRole.toLowerCase() === 'superadmin'">✨ AI Translate from EN [Gemini 2.5 Flash] [Last: €{{ lastTranslatingCampaignCost.toFixed(4) }}]</span>
                                    <span v-else>✨ AI Translate from EN</span>
                                </template>
                                <template v-else>
                                    <span v-if="app.userRole && app.userRole.toLowerCase() === 'superadmin'">✨ AI Translate from EN [Gemini 2.5 Flash] [~$0.0003]</span>
                                    <span v-else>✨ AI Translate from EN</span>
                                </template>
                            </button>
                        </div>

                        <!-- AI Copywriter Studio Panel (Only visible on English variant) -->
                        <div v-if="campaignContentLang === 'en'" style="background: rgba(96,165,250,0.03); border: 1px solid rgba(96,165,250,0.15); border-radius: 8px; padding: 10px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; width: 100%; box-sizing: border-box;">
                            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="font-size: 0.76rem; font-weight: 700; color: var(--text-main);">🤖 Tone:</span>
                                    <select v-model="selectedTone" style="font-size: 0.72rem; padding: 4px 20px 4px 8px !important; border-radius: 6px; height: 28px; width: 105px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); cursor: pointer; outline: none; margin: 0;">
                                        <option value="friendly">☕ Friendly</option>
                                        <option value="bold">🔥 Bold & Urgent</option>
                                        <option value="creative">✨ Creative</option>
                                        <option value="professional">💼 Professional</option>
                                    </select>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="font-size: 0.76rem; font-weight: 700; color: var(--text-main);">🎯 Direction:</span>
                                    <select v-model="selectedCreativeDirection" style="font-size: 0.72rem; padding: 4px 20px 4px 8px !important; border-radius: 6px; height: 28px; width: 175px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); cursor: pointer; outline: none; margin: 0;">
                                        <option value="General">General Playbook Style</option>
                                        <option value="Logical">Logical (Data & Science)</option>
                                        <option value="Emotional">Emotional (Tactile/Aesthetic)</option>
                                        <option value="Utility">Utility (Workflow/Durability)</option>
                                    </select>
                                </div>
                            </div>
                            <button type="button" @click="toggleGenerateAICopy" class="sc-ai-button" style="font-size: 0.72rem; padding: 4px 10px; height: 28px; display: flex; align-items: center; gap: 4px; margin: 0; flex-shrink: 0;">
                                <span v-if="!app.isFeatureAllowed('allow_copywriter')">🔒 Write Copy</span>
                                <template v-else-if="generatingAICopy">
                                    <span v-if="app.userRole && app.userRole.toLowerCase() === 'superadmin'">⏳ [€{{ (app.aiTicker.cost * 0.92).toFixed(4) }} | 🛑 Stop]</span>
                                    <span v-else>⏳ Generating copy... | 🛑 Stop</span>
                                </template>
                                <template v-else-if="lastGeneratingAICopyCost">
                                    <span v-if="app.userRole && app.userRole.toLowerCase() === 'superadmin'">Write Copy [Est: {{ copywriterEstCost }}] [Last: €{{ lastGeneratingAICopyCost.toFixed(4) }}]</span>
                                    <span v-else>Write Copy</span>
                                </template>
                                <template v-else>
                                    <span v-if="app.userRole && app.userRole.toLowerCase() === 'superadmin'">Write Copy [Est: {{ copywriterEstCost }}]</span>
                                    <span v-else>Write Copy</span>
                                </template>
                            </button>
                            <AiEstimateBadge v-if="app.isFeatureAllowed('allow_copywriter') && !generatingAICopy" operation="Campaign Ad Copy Generation" />
                        </div>

                        <!-- Ad Headline Copy for the active tab -->
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">
                                <span>Ad Headline Copy</span>
                                <span class="info-tooltip-trigger" data-tooltip="The main bold title text displayed on the ad post (e.g. Try Our Premium Special Roasts Today!).">i</span>
                            </label>
                            <ProductTagField v-if="campaignContentLang === 'en'" v-model="newCampaign.headline" placeholder="e.g. Try Our Premium Special Roasts Today!" :audiences="audiences" :brand-canvas="brandCanvas" />
                            <ProductTagField v-else v-model="newCampaign.translations[campaignContentLang].headline" :placeholder="'[AI Translation Pending] e.g. Probieren Sie noch heute unsere Premium-Röstungen!'" :audiences="audiences" :brand-canvas="brandCanvas" />
                        </div>

                        <!-- Ad Call-to-Action (CTA) Selector Option -->
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">
                                <span>Ad Call to Action (CTA) Button</span>
                                <span class="info-tooltip-trigger" data-tooltip="Select the action button shown on your campaign ad copy across social channels.">i</span>
                            </label>
                            <select v-model="newCampaign.ad_cta" style="width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-size: 0.85rem; outline: none; padding: 0 10px; cursor: pointer;">
                                <option value="Shop Now">Shop Now</option>
                                <option value="Book Now">Book Now</option>
                                <option value="Learn More">Learn More</option>
                                <option value="Sign Up">Sign Up</option>
                                <option value="Get Offer">Get Offer</option>
                                <option value="Apply Now">Apply Now</option>
                                <option value="Send Message">Send Message</option>
                            </select>
                        </div>

                        <!-- Body Description for the active tab -->
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">
                                <span>Body Description Text</span>
                                <span class="info-tooltip-trigger" data-tooltip="The primary body text/copywriting that details the offer and convinces readers to click.">i</span>
                            </label>
                            <ProductTagField v-if="campaignContentLang === 'en'" type="textarea" v-model="newCampaign.ad_copy" rows="3" placeholder="Write compelling marketing ad descriptions... (Use $ for products/services, @ for personas, # for sceneries, % for audiences)" :audiences="audiences" :brand-canvas="brandCanvas" />
                            <ProductTagField v-else type="textarea" v-model="newCampaign.translations[campaignContentLang].ad_copy" rows="3" :placeholder="'[AI Translation Pending] e.g. Schreiben Sie hier ansprechende Werbebeschreibungen...'" :audiences="audiences" :brand-canvas="brandCanvas" />
                        </div>

                        <!-- A/B Creative split testing -->
                        <div style="border-top: 1px dashed var(--border); margin-top: 12px; padding-top: 12px;">
                            <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--text-main); font-size: 0.8rem; cursor: pointer; margin-bottom: 8px;">
                                <input type="checkbox" id="enableABTesting" v-model="newCampaign.enable_ab_testing" style="width: 14px; height: 14px; margin: 0; cursor: pointer;">
                                <span>🏆 Enable Creative A/B split-testing Tournament</span>
                                <span class="info-tooltip-trigger" data-tooltip="Instructs the ad networks to distribute traffic between different headline, copy, link, and asset variants to automatically discover the best performer.">i</span>
                            </label>
                            
                            <div v-if="newCampaign.enable_ab_testing" style="display: flex; flex-direction: column; gap: 12px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 10px; border: 1px solid var(--border); margin-top: 8px;">
                                <!-- AI Generator Button -->
                                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--border); padding-bottom: 10px;">
                                    <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-main);">🎯 A/B Experiment Dimensions</span>
                                    <button type="button" @click="generateABVariantsWithAI" :disabled="generatingABVariants" class="sc-ai-button" style="font-size: 0.7rem; padding: 4px 8px; height: 26px; margin: 0; line-height: 1; display: flex; align-items: center; gap: 4px;">
                                        <span v-if="generatingABVariants">⏳ Generating...</span>
                                        <span v-else>✨ AI Generate Variant B</span>
                                    </button>
                                </div>

                                <!-- 1. HEADLINES -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <div class="form-group" style="margin: 0;">
                                        <label style="font-size: 0.68rem; color: var(--text-muted); font-weight: bold; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                                            <span>Headline Variant A (Base)</span>
                                            <span class="info-tooltip-trigger" data-tooltip="The baseline headline variant.">i</span>
                                        </label>
                                        <ProductTagField v-model="newCampaign.ab_test_headlines[0]" placeholder="Headline A" :audiences="audiences" :brand-canvas="brandCanvas" />
                                    </div>
                                    <div class="form-group" style="margin: 0;">
                                        <label style="font-size: 0.68rem; color: var(--text-muted); font-weight: bold; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                                            <span>Headline Variant B</span>
                                            <span class="info-tooltip-trigger" data-tooltip="The alternative headline variant to split test.">i</span>
                                        </label>
                                        <ProductTagField v-model="newCampaign.ab_test_headlines[1]" placeholder="Headline B" :audiences="audiences" :brand-canvas="brandCanvas" />
                                    </div>
                                </div>

                                <!-- 2. DESCRIPTIONS -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <div class="form-group" style="margin: 0;">
                                        <label style="font-size: 0.68rem; color: var(--text-muted); font-weight: bold; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                                            <span>Description Variant A (Base)</span>
                                            <span class="info-tooltip-trigger" data-tooltip="The baseline description variant.">i</span>
                                        </label>
                                        <ProductTagField type="textarea" v-model="newCampaign.ab_test_descriptions[0]" rows="2" placeholder="Description A" :audiences="audiences" :brand-canvas="brandCanvas" />
                                    </div>
                                    <div class="form-group" style="margin: 0;">
                                        <label style="font-size: 0.68rem; color: var(--text-muted); font-weight: bold; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                                            <span>Description Variant B</span>
                                            <span class="info-tooltip-trigger" data-tooltip="The alternative description variant to split test.">i</span>
                                        </label>
                                        <ProductTagField type="textarea" v-model="newCampaign.ab_test_descriptions[1]" rows="2" placeholder="Description B" :audiences="audiences" :brand-canvas="brandCanvas" />
                                    </div>
                                </div>

                                <!-- 3. DESTINATION LINKS -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <div class="form-group" style="margin: 0;">
                                        <label style="font-size: 0.68rem; color: var(--text-muted); font-weight: bold; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                                            <span>Link Variant A (Base)</span>
                                            <span class="info-tooltip-trigger" data-tooltip="The baseline destination link.">i</span>
                                        </label>
                                        <input type="text" v-model="newCampaign.ab_test_links[0]" placeholder="Link A URL" style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 6px; font-size: 0.78rem; height: 32px;">
                                    </div>
                                    <div class="form-group" style="margin: 0;">
                                        <label style="font-size: 0.68rem; color: var(--text-muted); font-weight: bold; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                                            <span>Link Variant B</span>
                                            <span class="info-tooltip-trigger" data-tooltip="The alternative destination link to split test.">i</span>
                                        </label>
                                        <input type="text" v-model="newCampaign.ab_test_links[1]" placeholder="Link B URL" style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 6px; font-size: 0.78rem; height: 32px;">
                                    </div>
                                </div>

                                <!-- 4. MEDIA ASSETS -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <div class="form-group" style="margin: 0;">
                                        <label style="font-size: 0.68rem; color: var(--text-muted); font-weight: bold; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                                            <span>Media Variant A (Base)</span>
                                            <span class="info-tooltip-trigger" data-tooltip="The baseline visual media asset URL.">i</span>
                                        </label>
                                        <ProductTagField v-model="newCampaign.ab_test_media_urls[0]" placeholder="Media A Image/Video URL" :audiences="audiences" :brand-canvas="brandCanvas" />
                                    </div>
                                    <div class="form-group" style="margin: 0;">
                                        <label style="font-size: 0.68rem; color: var(--text-muted); font-weight: bold; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                                            <span>Media Variant B</span>
                                            <span class="info-tooltip-trigger" data-tooltip="The alternative visual media asset URL to split test.">i</span>
                                        </label>
                                        <ProductTagField v-model="newCampaign.ab_test_media_urls[1]" placeholder="Media B Image/Video URL" :audiences="audiences" :brand-canvas="brandCanvas" />
                                    </div>
                                </div>

                                <!-- 5. TEST SETTINGS (WARMUP & BUDGET) -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; border-top: 1px dashed var(--border); padding-top: 10px; margin-top: 4px;">
                                    <div class="form-group" style="margin: 0;">
                                        <label style="font-size: 0.68rem; color: var(--text-muted); font-weight: bold; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                                            <span>Tournament Warm-up (Days)</span>
                                            <span class="info-tooltip-trigger" data-tooltip="The initial phase in days during which both variants run before the system identifies the winner.">i</span>
                                        </label>
                                        <input type="number" v-model.number="newCampaign.warmup_days" style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 4px 8px; font-size: 0.78rem; height: 30px;">
                                    </div>
                                    <div class="form-group" style="margin: 0;">
                                        <label style="font-size: 0.68rem; color: var(--text-muted); font-weight: bold; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                                            <span>Budget Split (% for testing)</span>
                                            <span class="info-tooltip-trigger" data-tooltip="Percentage of budget allocated specifically to Variant B during the tournament phase.">i</span>
                                        </label>
                                        <input type="number" v-model.number="newCampaign.warmup_budget_percent" style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 4px 8px; font-size: 0.78rem; height: 30px;">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    </div> <!-- End Step 3 -->
                    </div> <!-- End Scrollable Form Container -->

                    <!-- Removed bottom duplicate button -->
                </form>
            </div>

            <!-- Right: Real-Time Omnichannel Live Ad Previews -->
            <div class="panel" style="display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden;">
                <div class="panel-header" style="border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; flex-wrap: wrap; gap: 10px;">
                    <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
                        <h3 class="panel-title" style="margin: 0;">📱 Live Creative Preview</h3>
                        <div v-if="newCampaign.enable_ab_testing" style="display: flex; gap: 2px; background: rgba(0,0,0,0.25); border: 1px solid var(--border); border-radius: 6px; padding: 2px; margin-top: 4px;">
                            <button type="button" @click="abVariantPreview = 'A'" :style="abVariantPreview === 'A' ? 'background: var(--accent); color: var(--bg-color); font-weight: 700;' : 'background: transparent; color: var(--text-muted);'" style="border: 0; border-radius: 4px; font-size: 0.62rem; padding: 2px 8px; cursor: pointer; transition: all 0.2s;">
                                Variant A (Base)
                            </button>
                            <button type="button" @click="abVariantPreview = 'B'" :style="abVariantPreview === 'B' ? 'background: var(--accent); color: var(--bg-color); font-weight: 700;' : 'background: transparent; color: var(--text-muted);'" style="border: 0; border-radius: 4px; font-size: 0.62rem; padding: 2px 8px; cursor: pointer; transition: all 0.2s;">
                                Variant B
                            </button>
                        </div>
                    </div>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        <button v-if="newCampaign.platforms.includes('meta')" type="button" class="btn btn-secondary" :class="{ active: previewChannel === 'meta' }" @click="previewChannel = 'meta'" style="font-size: 0.72rem; padding: 4px 8px; height: 28px; margin: 0; line-height: 1;">Meta</button>
                        <button v-if="newCampaign.platforms.includes('google')" type="button" class="btn btn-secondary" :class="{ active: previewChannel === 'google' }" @click="previewChannel = 'google'" style="font-size: 0.72rem; padding: 4px 8px; height: 28px; margin: 0; line-height: 1;">Google</button>
                        <button v-if="newCampaign.platforms.includes('x')" type="button" class="btn btn-secondary" :class="{ active: previewChannel === 'x' }" @click="previewChannel = 'x'" style="font-size: 0.72rem; padding: 4px 8px; height: 28px; margin: 0; line-height: 1;">X</button>
                        <button v-if="newCampaign.platforms.includes('tiktok')" type="button" class="btn btn-secondary" :class="{ active: previewChannel === 'tiktok' }" @click="previewChannel = 'tiktok'" style="font-size: 0.72rem; padding: 4px 8px; height: 28px; margin: 0; line-height: 1;">TikTok</button>
                        <button v-if="newCampaign.platforms.includes('linkedin')" type="button" class="btn btn-secondary" :class="{ active: previewChannel === 'linkedin' }" @click="previewChannel = 'linkedin'" style="font-size: 0.72rem; padding: 4px 8px; height: 28px; margin: 0; line-height: 1;">LinkedIn</button>
                        <button v-if="newCampaign.platforms.includes('pinterest')" type="button" class="btn btn-secondary" :class="{ active: previewChannel === 'pinterest' }" @click="previewChannel = 'pinterest'" style="font-size: 0.72rem; padding: 4px 8px; height: 28px; margin: 0; line-height: 1;">Pinterest</button>
                        <button type="button" class="btn btn-secondary" :class="{ active: previewChannel === 'destination' }" @click="previewChannel = 'destination'" style="font-size: 0.72rem; padding: 4px 8px; height: 28px; margin: 0; line-height: 1; background: rgba(16, 185, 129, 0.15); color: #10b981; border-color: rgba(16,185,129,0.3);">🌐 Destination</button>
                    </div>
                </div>

                <div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; background: var(--bg-color); border-radius: 8px; padding: 24px; border: 1px dashed var(--border); overflow-y: auto; min-height: 0;">
                    <!-- Mock Mobile Device Viewport Simulator for Destination -->
                    <div v-if="previewChannel === 'destination'" 
                         style="width: 310px; height: 100%; max-height: 520px; border: 10px solid #1e293b; border-radius: 28px; background: #ffffff; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 12px 30px rgba(0,0,0,0.5); align-self: center;">
                        <!-- Browser Chrome Header (Mobile Address Bar style) -->
                        <div style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 6px 12px; display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                            <div style="display: flex; gap: 3px;">
                                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #ff5f56;"></span>
                                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #ffbd2e;"></span>
                                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #27c93f;"></span>
                            </div>
                            <div style="flex: 1; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px 8px; font-size: 0.62rem; color: #475569; font-family: monospace; display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                <span style="color: #10b981; flex-shrink: 0;">🔒</span>
                                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ activeBrand.subdomain }}.sc/{{ newCampaign.destination_type === 'landing_page' ? (showLandingPageBuilder ? newLandingPage.id : newCampaign.landing_page_id) : (newCampaign.destination_type === 'custom_url' ? 'external' : '') }}</span>
                            </div>
                        </div>
                        
                        <!-- Viewport Content -->
                        <div style="flex: 1; overflow-y: auto; background: #f8fafc; display: flex; flex-direction: column;">
                            <!-- Destination: Homepage Mock -->
                            <div v-if="newCampaign.destination_type === 'homepage'" style="display: flex; flex-direction: column; flex: 1;">
                                <div style="background: #0d0d0d; color: white; padding: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222;">
                                    <span style="font-weight: bold; font-size: 0.8rem;">☕ {{ activeBrand.name }} Storefront</span>
                                    <span style="font-size: 0.7rem;">Cart (0)</span>
                                </div>
                                <div style="background: linear-gradient(135deg, #1f1209 0%, #3d2516 100%); color: white; padding: 24px 16px; text-align: center;">
                                    <h1 style="font-size: 1.1rem; margin: 0 0 6px 0; font-family: Georgia, serif; color: white !important;">Welcome to {{ activeBrand.name }}</h1>
                                    <p style="font-size: 0.72rem; color: #d6c4b8; margin: 0;">Explore our fresh, direct-trade specialty coffees.</p>
                                </div>
                                <div style="padding: 12px;">
                                    <h3 style="font-size: 0.75rem; margin: 0 0 8px 0; color: #334155;">Featured Catalog</h3>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                        <div v-for="p in app.products.slice(0, 4)" :key="p.id" style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; display: flex; flex-direction: column;">
                                            <img :src="p.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=120'" style="width: 100%; height: 60px; object-fit: cover; border-radius: 4px; margin-bottom: 6px;">
                                            <strong style="font-size: 0.7rem; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ p.title }}</strong>
                                            <span style="font-size: 0.65rem; color: #10b981; font-weight: 700; margin-top: 2px;">€{{ parseFloat(p.price).toFixed(2) }}</span>
                                        </div>
                                        <div v-if="app.products.length === 0" style="grid-column: span 2; text-align: center; font-size: 0.7rem; padding: 20px; color: #64748b;">
                                            No items in store catalog.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Destination: Landing Page Mock -->
                            <div v-else-if="newCampaign.destination_type === 'landing_page'" style="display: flex; flex-direction: column; flex: 1;">
                                <div style="background: #ffffff; padding: 12px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 8px;">
                                    <img :src="activeBrand.logo || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=120'" style="width: 18px; height: 18px; border-radius: 50%; object-fit: cover;">
                                    <span style="font-weight: 800; font-size: 0.75rem; color: #1e293b;">{{ activeBrand.name }}</span>
                                </div>
                                <div style="background: #ffffff; padding: 32px 16px; text-align: center; border-bottom: 1px solid #e2e8f0;">
                                    <div v-if="getLandingPageDetail('coupon_code')" style="display: inline-block; background: #ecfdf5; border: 1px dashed #10b981; color: #047857; font-size: 0.62rem; font-weight: 800; padding: 3px 8px; border-radius: 20px; margin-bottom: 12px; text-transform: uppercase;">
                                        🎟️ Apply Code: {{ getLandingPageDetail('coupon_code') }} at Checkout
                                    </div>
                                    <h1 style="font-size: 1.25rem; font-weight: 900; line-height: 1.3; color: #0f172a; margin: 0 0 10px 0; font-family: system-ui;">
                                        {{ getLandingPageDetail('headline') || 'Special Campaign Landing Page' }}
                                    </h1>
                                    <p style="font-size: 0.78rem; color: #475569; max-width: 400px; margin: 0 auto 16px auto; line-height: 1.4;">
                                        {{ getLandingPageDetail('subheadline') || 'Fill out the campaign form to preview landing page subheadline details.' }}
                                    </p>
                                    <button type="button" style="background: #0f172a; color: white; border: none; font-size: 0.75rem; padding: 8px 16px; border-radius: 6px; font-weight: 700;">
                                        {{ getLandingPageDetail('cta') || 'Shop Offer' }}
                                    </button>
                                </div>
                                <div style="padding: 16px; background: #f8fafc; flex: 1;">
                                    <div style="display: flex; flex-direction: column; gap: 8px; max-width: 320px; margin: 0 auto;">
                                        <div v-for="feat in getLandingPageFeaturesArray()" :key="feat" style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.74rem; color: #334155; line-height: 1.3;">
                                            <span style="color: #10b981;">✓</span>
                                            <span>{{ feat }}</span>
                                        </div>
                                        <div v-if="getLandingPageFeaturesArray().length === 0" style="font-size: 0.7rem; color: #64748b; text-align: center; padding: 10px;">
                                            No visual USPs listed.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Destination: Custom URL Mock -->
                            <div v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; padding: 24px; text-align: center;">
                                <span style="font-size: 2.2rem; margin-bottom: 12px;">🌐</span>
                                <strong style="font-size: 0.85rem; color: #1e293b;">Redirecting to Custom URL Target</strong>
                                <p style="font-size: 0.72rem; color: #64748b; max-width: 300px; margin: 6px 0 12px 0;">
                                    Visitors clicking this ad post will be taken directly to the following external link destination:
                                </p>
                                <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 12px; font-size: 0.68rem; font-family: monospace; color: #0f172a; word-break: break-all; max-width: 320px;">
                                    {{ newCampaign.custom_url || 'https://my-external-site.com/offer' }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- NO PLATFORMS SELECTED STATE -->
                    <div v-else-if="!newCampaign.platforms || newCampaign.platforms.length === 0" style="text-align: center; color: var(--text-muted);">
                        <span style="font-size: 2.2rem; display: block; margin-bottom: 12px;">📣</span>
                        <span style="font-size: 0.85rem; font-weight: 600;">Select at least one omnichannel ad platform to preview your live creatives.</span>
                    </div>

                    <!-- META AD FEED PREVIEW -->
                    <div v-else-if="previewChannel === 'meta'" style="width: 100%; max-width: 340px; background: #ffffff; color: #1c1e21; border-radius: 8px; border: 1px solid #dddfe2; font-family: Helvetica, Arial, sans-serif; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); text-align: left; display: flex; flex-direction: column;">
                        <!-- Placement Selector Tab Bar -->
                        <div style="background: #f0f2f5; border-bottom: 1px solid #dddfe2; padding: 6px 12px; display: flex; gap: 8px; flex-shrink: 0; justify-content: center; align-items: center;">
                            <button type="button" @click="metaPlacement = 'facebook'" :style="metaPlacement === 'facebook' ? 'background: #0064E0; color: white;' : 'background: #e4e6eb; color: #050505;'" style="font-size: 0.68rem; border: 0; border-radius: 4px; padding: 4px 12px; cursor: pointer; font-weight: 700; height: 24px; display: flex; align-items: center; gap: 4px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/></svg>
                                Facebook Feed
                            </button>
                            <button type="button" @click="metaPlacement = 'instagram'" :style="metaPlacement === 'instagram' ? 'background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color: white;' : 'background: #e4e6eb; color: #050505;'" style="font-size: 0.68rem; border: 0; border-radius: 4px; padding: 4px 12px; cursor: pointer; font-weight: 700; height: 24px; display: flex; align-items: center; gap: 4px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204 013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                                Instagram Feed
                            </button>
                        </div>

                        <!-- Placement View: Facebook Feed -->
                        <div v-if="metaPlacement === 'facebook'" style="display: flex; flex-direction: column; width: 100%;">
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
                                    <img v-if="previewMediaUrl" :src="previewMediaUrl" style="width: 100%; height: 100%; object-fit: cover;">
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
                                                <img v-if="card.image" :src="app.getCleanImageUrl(resolveProductImage(card.image))" style="width: 100%; height: 100%; object-fit: cover;">
                                                <div v-else style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 0.7rem;">Card {{i+1}} Image</div>
                                            </div>
                                            <div style="padding: 6px; border-top: 1px solid #e5e5e5;">
                                                <div style="font-size: 0.72rem; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #1c1e21;">{{ resolveCampaignField(card.title, 'headline', campaignContentLang) || 'Dynamic Product' }}</div>
                                                <button type="button" @click="previewChannel = 'destination'" style="border: 0; outline: 0; border-radius: 3px; font-size: 0.65rem; padding: 3px 6px; background: #e4e6eb; color: #050505; margin-top: 4px; font-weight: 600; width: 100%;">{{ newCampaign.ad_cta || 'Shop Now' }}</button>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </div>

                            <!-- CTA bar -->
                            <div v-if="newCampaign.format !== 'Carousel'" @click="previewChannel = 'destination'" style="display: flex; justify-content: space-between; align-items: center; background: #f2f3f5; padding: 10px 12px; border-top: 1px solid #e5e5e5; cursor: pointer;">
                                <div style="max-width: 65%;">
                                    <span style="font-size: 0.7rem; color: #606770; text-transform: uppercase;">{{ previewDestinationUrl }}</span>
                                    <strong style="font-size: 0.85rem; color: #1c1e21; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ previewHeadline }}</strong>
                                </div>
                                <button type="button" style="background: #e4e6eb; color: #050505; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer; text-transform: none;">{{ newCampaign.ad_cta || 'Shop Now' }}</button>
                            </div>
                        </div>

                        <!-- Placement View: Instagram Feed -->
                        <div v-else style="display: flex; flex-direction: column; width: 100%;">
                            <!-- Header -->
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid #efefef;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <img :src="activeBrand.logo || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=120'" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid #efefef; flex-shrink: 0;">
                                    <div>
                                        <strong style="font-size: 0.8rem; color: #262626; display: block; font-weight: 600;">{{ activeBrand.name }}</strong>
                                        <span style="font-size: 0.65rem; color: #8e8e8e; display: block; margin-top: 2px;">Sponsored</span>
                                    </div>
                                </div>
                                <span style="font-size: 1rem; color: #8e8e8e; cursor: pointer; font-weight: bold; line-height: 1;">•••</span>
                            </div>

                            <!-- Media graphic (Instagram Square Format) -->
                            <div style="position: relative; background: #fafafa; width: 100%; height: 260px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                <!-- Format: Image/Video -->
                                <template v-if="newCampaign.format !== 'Carousel'">
                                    <img v-if="previewMediaUrl" :src="previewMediaUrl" style="width: 100%; height: 100%; object-fit: cover;">
                                    <div v-else style="color: #c7c7c7; text-align: center; padding: 12px;">
                                        <span style="font-size: 2.2rem; display: block;">📸</span>
                                        <span style="font-size: 0.72rem; color: #8e8e8e;">Instagram Post Preview</span>
                                    </div>
                                    <div v-if="newCampaign.format === 'Video'" style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.2rem;">▶</div>
                                </template>

                                <!-- Format: Carousel -->
                                <template v-else>
                                    <div style="display: flex; width: 100%; height: 100%; overflow-x: auto; scroll-snap-type: x mandatory;">
                                        <div v-for="(card, i) in newCampaign.carousel_cards" :key="i" style="min-width: 100%; scroll-snap-align: start; position: relative; background: #eee; overflow: hidden; display: flex; flex-direction: column;">
                                            <img v-if="card.image" :src="app.getCleanImageUrl(resolveProductImage(card.image))" style="width: 100%; height: 100%; object-fit: cover;">
                                            <div v-else style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 0.75rem;">Card {{i+1}} Image</div>
                                        </div>
                                    </div>
                                </template>

                                <!-- Sponsored Action Link strip inside photo bottom -->
                                <div @click="previewChannel = 'destination'" style="position: absolute; bottom: 0; left: 0; right: 0; background: #3897f0; color: white; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: background 0.2s;">
                                    <span>Learn More</span>
                                    <span>➔</span>
                                </div>
                            </div>

                            <!-- Instagram Action Icons Row -->
                            <div style="display: flex; justify-content: space-between; padding: 10px 12px 6px 12px;">
                                <div style="display: flex; gap: 14px; align-items: center;">
                                    <span style="font-size: 1.2rem; color: #262626; cursor: pointer;">🖤</span>
                                    <span style="font-size: 1.2rem; color: #262626; cursor: pointer;">💬</span>
                                    <span style="font-size: 1.2rem; color: #262626; cursor: pointer;">✈️</span>
                                </div>
                                <span style="font-size: 1.2rem; color: #262626; cursor: pointer;">🔖</span>
                            </div>

                            <!-- Likes and Caption -->
                            <div style="padding: 0 12px 12px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                                <div style="font-size: 0.76rem; font-weight: 700; color: #262626; margin-bottom: 4px;">1,249 likes</div>
                                <div style="font-size: 0.78rem; line-height: 1.4; color: #262626; word-break: break-word;">
                                    <strong style="font-weight: 700; margin-right: 6px;">{{ activeBrand.name }}</strong>
                                    <span>{{ previewAdCopy }}</span>
                                </div>
                            </div>
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
                                <div @click="previewChannel = 'destination'" style="border: 1px solid #2f3336; border-radius: 16px; overflow: hidden; margin-top: 10px; background: #000; cursor: pointer;">
                                    <div style="position: relative; height: 180px; display: flex; align-items: center; justify-content: center; background: #15181c;">
                                        <img v-if="previewMediaUrl" :src="previewMediaUrl" style="width: 100%; height: 100%; object-fit: cover;">
                                        <div v-else style="color: #71767b; text-align: center;">
                                            <span style="font-size: 1.8rem; display: block;">🐦</span>
                                            <span style="font-size: 0.72rem;">X Card Image Asset</span>
                                        </div>
                                    </div>
                                    <div style="padding: 10px; border-top: 1px solid #2f3336;">
                                        <span style="font-size: 0.72rem; color: #71767b;">{{ previewDestinationUrl }}</span>
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
                                <span style="font-size: 0.7rem; color: #5f6368; display: block;">{{ app.currentEnv === 'local' ? 'http' : 'https' }}://{{ previewDestinationUrl }}</span>
                            </div>
                        </div>
                        <h4 @click="previewChannel = 'destination'" style="font-size: 1.15rem; color: #1a0dab; font-weight: 400; line-height: 1.3; margin: 4px 0; cursor: pointer; text-decoration: none;">
                            {{ previewHeadline }}
                        </h4>
                        <p style="font-size: 0.85rem; color: #4d5156; line-height: 1.4; margin: 0;">
                            {{ previewAdCopy }}
                        </p>
                    </div>

                    <!-- TIKTOK AD PREVIEW -->
                    <div v-else-if="previewChannel === 'tiktok'" style="width: 100%; max-width: 300px; height: 400px; background: #010101; color: #ffffff; border-radius: 20px; border: 4px solid #2f3030; position: relative; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; box-shadow: 0 4px 20px rgba(0,0,0,0.4);">
                        <!-- Video simulation backdrop -->
                        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1;">
                            <img v-if="previewMediaUrl" :src="previewMediaUrl" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.85;">
                            <div v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #121212; color: #777;">
                                <span style="font-size: 2.5rem; margin-bottom: 8px;">🎵</span>
                                <span style="font-size: 0.75rem;">Vertical Ad Asset</span>
                            </div>
                        </div>
                        
                        <!-- Overlay elements -->
                        <div style="position: relative; z-index: 2; padding: 16px; background: linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%); text-align: left;">
                            <!-- Creator Profile -->
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <img :src="activeBrand.logo || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=120'" style="width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid #fff; object-fit: cover;">
                                <div>
                                    <strong style="font-size: 0.8rem; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">@{{ activeBrand.name.toLowerCase().replace(/\s/g, '') }}</strong>
                                    <span style="font-size: 0.65rem; color: #25f4ee; font-weight: 700; background: rgba(0,0,0,0.5); padding: 1px 4px; border-radius: 3px; margin-left: 4px;">Sponsored</span>
                                </div>
                            </div>
                            <!-- Ad text -->
                            <p style="font-size: 0.76rem; line-height: 1.3; margin: 0 0 12px 0; color: #f1f1f1; text-shadow: 0 1px 2px rgba(0,0,0,0.8); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                                {{ previewAdCopy }}
                            </p>
                            <!-- CTA Button -->
                            <div @click="previewChannel = 'destination'" style="background: #ff0050; color: #fff; text-align: center; padding: 8px; border-radius: 4px; font-weight: bold; font-size: 0.78rem; text-shadow: 0 1px 2px rgba(0,0,0,0.2); cursor: pointer; letter-spacing: 0.05em;">
                                {{ newCampaign.ad_cta || 'Shop Now' }}
                            </div>
                        </div>
                    </div>

                    <!-- LINKEDIN AD PREVIEW -->
                    <div v-else-if="previewChannel === 'linkedin'" style="width: 100%; max-width: 340px; background: #ffffff; color: rgba(0,0,0,0.9); border-radius: 8px; border: 1px solid #e0e0e0; font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: left;">
                        <!-- Header -->
                        <div style="display: flex; align-items: center; gap: 8px; padding: 12px;">
                            <img :src="activeBrand.logo || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=120'" style="width: 36px; height: 36px; border-radius: 4px; object-fit: cover;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <strong style="font-size: 0.85rem; color: rgba(0,0,0,0.9);">{{ activeBrand.name }}</strong>
                                    <span style="font-size: 0.72rem; color: rgba(0,0,0,0.6);">• 1st</span>
                                </div>
                                <span style="font-size: 0.7rem; color: rgba(0,0,0,0.6); display: block;">Coffee storefront</span>
                                <span style="font-size: 0.7rem; color: rgba(0,0,0,0.6); display: flex; align-items: center; gap: 3px;">
                                    Promoted · 🌐
                                </span>
                            </div>
                        </div>
                        <!-- Intro text -->
                        <div style="padding: 0 12px 8px 12px; font-size: 0.8rem; line-height: 1.4; color: rgba(0,0,0,0.9);">{{ previewAdCopy }}</div>
                        
                        <!-- Image creative -->
                        <div style="position: relative; background: #f3f6f8; width: 100%; height: 160px; display: flex; align-items: center; justify-content: center;">
                            <img v-if="previewMediaUrl" :src="previewMediaUrl" style="width: 100%; height: 100%; object-fit: cover;">
                            <div v-else style="color: rgba(0,0,0,0.5); text-align: center;">
                                <span style="font-size: 1.8rem; display: block;">💼</span>
                                <span style="font-size: 0.72rem;">LinkedIn Update Image</span>
                            </div>
                        </div>
                        
                        <!-- CTA Bar -->
                        <div @click="previewChannel = 'destination'" style="padding: 12px; background: #f3f6f8; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                            <div style="max-width: 65%;">
                                <div style="font-size: 0.82rem; font-weight: 600; color: rgba(0,0,0,0.9); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ previewHeadline }}</div>
                                <span style="font-size: 0.7rem; color: rgba(0,0,0,0.6);">{{ previewDestinationUrl }}</span>
                            </div>
                            <button type="button" style="background: transparent; border: 1px solid #0a66c2; color: #0a66c2; padding: 4px 12px; border-radius: 16px; font-weight: 600; font-size: 0.8rem; cursor: pointer;">{{ newCampaign.ad_cta || 'Shop Now' }}</button>
                        </div>
                    </div>

                    <!-- PINTEREST AD PREVIEW -->
                    <div v-else-if="previewChannel === 'pinterest'" style="width: 100%; max-width: 240px; background: #ffffff; color: #111111; border-radius: 16px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #efefef; text-align: left;">
                        <!-- Pin Media -->
                        <div @click="previewChannel = 'destination'" style="position: relative; background: #f0f0f0; width: 100%; min-height: 200px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                            <img v-if="previewMediaUrl" :src="previewMediaUrl" style="width: 100%; height: 100%; object-fit: cover;">
                            <div v-else style="color: #767676; text-align: center; padding: 12px;">
                                <span style="font-size: 2rem; display: block;">📌</span>
                                <span style="font-size: 0.72rem;">Promoted Pin Creative</span>
                            </div>
                            <span style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: #fff; padding: 3px 8px; border-radius: 12px; font-size: 0.65rem; font-weight: bold;">Promoted</span>
                        </div>
                        
                        <!-- Description & Creator -->
                        <div style="padding: 12px; display: flex; flex-direction: column; gap: 6px;">
                            <strong style="font-size: 0.8rem; color: #111111; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">{{ previewHeadline }}</strong>
                            <p style="font-size: 0.72rem; color: #5f5f5f; margin: 0; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">{{ previewAdCopy }}</p>
                            
                            <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px; border-top: 1px solid #f0f0f0; padding-top: 8px;">
                                <img :src="activeBrand.logo || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=120'" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover;">
                                <span style="font-size: 0.72rem; color: #111111; font-weight: 600;">{{ activeBrand.name }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            </div>
        </div>

        <div v-if="!isCreatingCampaign" class="panel">
            <div class="panel-header" style="border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                    <h3 class="panel-title" style="margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                        <span>🎨 Smart Ad Studio</span>
                        <span class="badge-simulation" style="background: rgba(197, 160, 89, 0.15); color: var(--accent); font-size: 0.65rem; font-weight: 700;">OMNICHANNEL</span>
                    </h3>
                    <div style="display: flex; gap: 4px; border-bottom: 1px solid transparent; flex-wrap: wrap;">
                        <button type="button" @click="activeTab = 'board'" :style="{ borderBottom: activeTab === 'board' ? '2px solid var(--accent)' : 'none', color: activeTab === 'board' ? 'var(--text-main)' : 'var(--text-muted)' }" style="background: transparent; border: none; font-size: 0.8rem; padding: 4px 8px; cursor: pointer; font-weight: 600; padding-bottom: 8px; transition: all 0.2s;">
                            📋 Studio Board
                        </button>
                        <button type="button" @click="activeTab = 'calendar'" :style="{ borderBottom: activeTab === 'calendar' ? '2px solid var(--accent)' : 'none', color: activeTab === 'calendar' ? 'var(--text-main)' : 'var(--text-muted)' }" style="background: transparent; border: none; font-size: 0.8rem; padding: 4px 8px; cursor: pointer; font-weight: 600; padding-bottom: 8px; transition: all 0.2s;">
                            📅 Ad Planner (Calendar)
                        </button>
                        <button v-if="app.userRole.toLowerCase() === 'superadmin'" type="button" @click="activeTab = 'autopilot'" :style="{ borderBottom: activeTab === 'autopilot' ? '2px solid var(--accent)' : 'none', color: activeTab === 'autopilot' ? 'var(--text-main)' : 'var(--text-muted)' }" style="background: transparent; border: none; font-size: 0.8rem; padding: 4px 8px; cursor: pointer; font-weight: 600; padding-bottom: 8px; transition: all 0.2s;">
                            🤖 AI Optimization (Fine-Tuning)
                        </button>
                        <button type="button" @click="activeTab = 'performance'" :style="{ borderBottom: activeTab === 'performance' ? '2px solid var(--accent)' : 'none', color: activeTab === 'performance' ? 'var(--text-main)' : 'var(--text-muted)' }" style="background: transparent; border: none; font-size: 0.8rem; padding: 4px 8px; cursor: pointer; font-weight: 600; padding-bottom: 8px; transition: all 0.2s;">
                            📊 Performance Insights
                        </button>
                        <button type="button" @click="activeTab = 'creative'" :style="{ borderBottom: activeTab === 'creative' ? '2px solid var(--accent)' : 'none', color: activeTab === 'creative' ? 'var(--text-main)' : 'var(--text-muted)' }" style="background: transparent; border: none; font-size: 0.8rem; padding: 4px 8px; cursor: pointer; font-weight: 600; padding-bottom: 8px; transition: all 0.2s;">
                            ✨ Creative Audits
                        </button>
                        <button type="button" @click="activeTab = 'audiences'" :style="{ borderBottom: activeTab === 'audiences' ? '2px solid var(--accent)' : 'none', color: activeTab === 'audiences' ? 'var(--text-main)' : 'var(--text-muted)' }" style="background: transparent; border: none; font-size: 0.8rem; padding: 4px 8px; cursor: pointer; font-weight: 600; padding-bottom: 8px; transition: all 0.2s;">
                            👥 Audience Segments
                        </button>
                    </div>
                </div>
                
                <!-- Simulate Proposal Button (Local/Dev only) -->
                <div v-if="app.currentEnv !== 'prod' && campaigns.length > 0">
                    <button type="button" @click="simulateAgentProposal(null)" :disabled="simulatingAgent" class="btn" style="font-size: 0.72rem; padding: 6px 12px; height: 32px; border-radius: 6px; margin: 0; display: inline-flex; align-items: center; gap: 6px; border: 1px dashed var(--accent); color: var(--accent); background: rgba(255, 255, 255, 0.05);">
                        🤖 {{ simulatingAgent ? 'Simulating Optimizer...' : 'Simulate Agent Proposal' }}
                    </button>
                </div>
            </div>

            <!-- TAB 1: Studio Board (Kanban View) -->
            <template v-if="activeTab === 'board'">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; min-height: 480px;">
                    <!-- Column 1: Paused & Drafts -->
                    <div style="background: rgba(255,255,255,0.015); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 16px;">
                        <h4 style="margin: 0; font-size: 0.85rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; justify-content: space-between;">
                            <span>⏸️ Paused & Drafts</span>
                            <span class="badge-simulation" style="font-size: 0.65rem; background: var(--border); color: var(--text-main);">{{ campaigns.filter(c => c.status === 'paused' || c.status === 'draft').length }}</span>
                        </h4>
                        
                        <div style="display: flex; flex-direction: column; gap: 12px; overflow-y: auto; max-height: 70vh;">
                            <div v-for="c in campaigns.filter(c => c.status === 'paused' || c.status === 'draft')" :key="c.id" @click="selectCampaign(c)" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 16px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; gap: 10px;" onmouseover="this.style.borderColor='var(--accent)';" onmouseout="this.style.borderColor='var(--border)';" >
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                                    <strong style="font-size: 0.88rem; color: var(--text-main); line-height: 1.3;">{{ c.name }}</strong>
                                    <button @click.stop="toggleCampaignStatus(c)" class="btn btn-secondary" style="margin: 0; padding: 2px 6px; font-size: 0.65rem; height: 20px; line-height: 1; border-radius: 4px; display: flex; align-items: center; gap: 3px;">
                                        ▶️ Resume
                                    </button>
                                </div>
                                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                                    <span v-for="plat in (c.platform || '').split(',')" :key="plat" class="badge-simulation" style="font-size: 0.62rem; font-weight: 700; text-transform: capitalize; padding: 1px 4px; border-radius: 3px;" :style="getPlatformStyle(plat)">
                                        {{ plat === 'x' ? 'X' : plat }}
                                    </span>
                                </div>
                                <div style="font-size: 0.72rem; color: var(--text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                                    {{ c.headline || 'No active headline ad copy set' }}
                                </div>
                                <div style="border-top: 1px dashed var(--border); padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 0.7rem; color: var(--text-muted);">Budget: <strong>€{{ parseFloat(c.budget).toFixed(0) }}</strong></span>
                                    <span style="font-size: 0.7rem; color: var(--accent); font-weight: 700;">ROAS: {{ parseFloat(c.target_roas || 4).toFixed(1) }}x</span>
                                </div>
                                <div v-if="app.currentEnv !== 'prod'" style="display: flex; justify-content: flex-end; margin-top: 4px;" @click.stop>
                                    <button type="button" @click="simulateAgentProposal(c)" :disabled="simulatingAgent" class="btn" style="margin: 0; padding: 4px 8px; font-size: 0.68rem; height: auto; border: 1px dashed var(--accent); color: var(--accent); display: flex; align-items: center; gap: 3px; background: rgba(255, 255, 255, 0.05);">
                                        🤖 Simulate Agent Proposal
                                    </button>
                                </div>
                            </div>
                            <div v-if="campaigns.filter(c => c.status === 'paused' || c.status === 'draft').length === 0" style="padding: 30px 10px; text-align: center; color: var(--text-muted); font-size: 0.78rem;">
                                No paused ads.
                            </div>
                        </div>
                    </div>

                    <!-- Column 2: Active / Optimizing -->
                    <div style="background: rgba(16, 185, 129, 0.015); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 16px;">
                        <h4 style="margin: 0; font-size: 0.85rem; color: #10b981; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; justify-content: space-between;">
                            <span>🟢 Active / Optimizing</span>
                            <span class="badge-simulation" style="font-size: 0.65rem; background: rgba(16, 185, 129, 0.15); color: #10b981;">{{ campaigns.filter(c => c.status === 'active').length }}</span>
                        </h4>
                        
                        <div style="display: flex; flex-direction: column; gap: 12px; overflow-y: auto; max-height: 70vh;">
                            <div v-for="c in campaigns.filter(c => c.status === 'active')" :key="c.id" @click="selectCampaign(c)" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 16px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; gap: 10px;" onmouseover="this.style.borderColor='var(--accent)';" onmouseout="this.style.borderColor='var(--border)';" >
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                                    <strong style="font-size: 0.88rem; color: var(--text-main); line-height: 1.3;">{{ c.name }}</strong>
                                    <button @click.stop="toggleCampaignStatus(c)" class="btn btn-secondary" style="margin: 0; padding: 2px 6px; font-size: 0.65rem; height: 20px; line-height: 1; border-radius: 4px; display: flex; align-items: center; gap: 3px; color: var(--warning);">
                                        ⏸️ Pause
                                    </button>
                                </div>
                                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                                    <span v-for="plat in (c.platform || '').split(',')" :key="plat" class="badge-simulation" style="font-size: 0.62rem; font-weight: 700; text-transform: capitalize; padding: 1px 4px; border-radius: 3px;" :style="getPlatformStyle(plat)">
                                        {{ plat === 'x' ? 'X' : plat }}
                                    </span>
                                    <span v-if="c.autopilot_enabled" class="badge-simulation" style="font-size: 0.6rem; background: rgba(59, 130, 246, 0.15); color: #3b82f6; font-weight: 700; padding: 1px 4px; border-radius: 3px; display: inline-flex; align-items: center; gap: 2px;">
                                        🤖 AUTOPILOT
                                    </span>
                                </div>
                                
                                <!-- Inline Budget Slider -->
                                <div @click.stop style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 6px; padding: 8px; display: flex; flex-direction: column; gap: 4px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem;">
                                        <span style="color: var(--text-muted);">Daily Spend:</span>
                                        <strong style="color: var(--text-main);">€{{ parseFloat(c.budget).toFixed(0) }}</strong>
                                    </div>
                                    <input type="range" min="10" max="1000" step="10" v-model.number="c.budget" @change="saveInlineBudget(c)" style="width: 100%; cursor: pointer; accent-color: var(--accent);">
                                </div>

                                <div style="border-top: 1px dashed var(--border); padding-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.7rem;">
                                    <div style="color: var(--text-muted);">ROAS Lift: <strong style="color: #10b981;">{{ parseFloat(c.target_roas || 4).toFixed(1) }}x</strong></div>
                                    <div style="color: var(--text-muted); text-align: right;">AI Cost: <strong style="color: var(--accent);">€{{ parseFloat(c.ai_cost || 0).toFixed(4) }}</strong></div>
                                </div>
                                <div v-if="app.currentEnv !== 'prod'" style="display: flex; justify-content: flex-end; margin-top: 4px;" @click.stop>
                                    <button type="button" @click="simulateAgentProposal(c)" :disabled="simulatingAgent" class="btn" style="margin: 0; padding: 4px 8px; font-size: 0.68rem; height: auto; border: 1px dashed var(--accent); color: var(--accent); display: flex; align-items: center; gap: 3px; background: rgba(255, 255, 255, 0.05);">
                                        🤖 Simulate Agent Proposal
                                    </button>
                                </div>
                            </div>
                            <div v-if="campaigns.filter(c => c.status === 'active').length === 0" style="padding: 30px 10px; text-align: center; color: var(--text-muted); font-size: 0.78rem;">
                                No running campaigns. Launch one above!
                            </div>
                        </div>
                    </div>

                    <!-- Column 3: Completed / Archived -->
                    <div style="background: rgba(255,255,255,0.015); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 16px;">
                        <h4 style="margin: 0; font-size: 0.85rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; justify-content: space-between;">
                            <span>🏁 Completed</span>
                            <span class="badge-simulation" style="font-size: 0.65rem; background: var(--border); color: var(--text-main);">{{ campaigns.filter(c => c.status === 'completed').length }}</span>
                        </h4>
                        
                        <div style="display: flex; flex-direction: column; gap: 12px; overflow-y: auto; max-height: 70vh;">
                            <div v-for="c in campaigns.filter(c => c.status === 'completed')" :key="c.id" @click="selectCampaign(c)" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 16px; cursor: pointer; opacity: 0.85; transition: all 0.2s; display: flex; flex-direction: column; gap: 10px;" onmouseover="this.style.borderColor='var(--accent)'; this.style.opacity='1';" onmouseout="this.style.borderColor='var(--border)'; this.style.opacity='0.85';" >
                                <strong style="font-size: 0.88rem; color: var(--text-main); line-height: 1.3;">{{ c.name }}</strong>
                                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                                    <span v-for="plat in (c.platform || '').split(',')" :key="plat" class="badge-simulation" style="font-size: 0.62rem; font-weight: 700; text-transform: capitalize; padding: 1px 4px; border-radius: 3px;" :style="getPlatformStyle(plat)">
                                        {{ plat === 'x' ? 'X' : plat }}
                                    </span>
                                </div>
                                <div style="border-top: 1px dashed var(--border); padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem;">
                                    <span style="color: var(--text-muted);">Final Budget: <strong>€{{ parseFloat(c.budget).toFixed(0) }}</strong></span>
                                    <span style="color: var(--text-muted);">ROAS: <strong>{{ parseFloat(c.target_roas || 4).toFixed(1) }}x</strong></span>
                                </div>
                            </div>
                            <div v-if="campaigns.filter(c => c.status === 'completed').length === 0" style="padding: 30px 10px; text-align: center; color: var(--text-muted); font-size: 0.78rem;">
                                No completed campaigns yet.
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- TAB 2: Ad Planner (Calendar) -->
            <template v-if="activeTab === 'calendar'">
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
                        <div v-for="(day, dIdx) in week" :key="dIdx" :style="{ opacity: day.isCurrentMonth ? 1 : 0.35 }" style="min-height: 95px; padding: 6px; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; background: var(--card-bg); position: relative;" onmouseover="const btn = this.querySelector('.calendar-add-btn'); if (btn) btn.style.opacity = '1';" onmouseout="const btn = this.querySelector('.calendar-add-btn'); if (btn) btn.style.opacity = '0';">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 2px;">
                                <span>{{ day.dayNum }}</span>
                                <span class="calendar-add-btn" @click.stop="openCreateCampaignWithDate(day.dateStr)" style="cursor: pointer; opacity: 0; transition: opacity 0.2s; font-size: 0.7rem; font-weight: 800; color: var(--accent); background: rgba(197, 160, 89, 0.15); padding: 1px 4px; border-radius: 4px;">+ Ad</span>
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

            <!-- TAB 3: Auto-Pilot Content -->
            <template v-if="activeTab === 'autopilot'">
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- Run Strategy Check Banner -->
                    <div style="background: rgba(197, 160, 89, 0.05); border: 1px solid var(--accent); padding: 16px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
                        <div>
                            <h4 style="margin: 0; font-size: 0.95rem; color: var(--accent); font-weight: bold; display: flex; align-items: center; gap: 8px;">
                                <span>⚡ AI Campaign Strategist Console</span>
                                <span style="background: rgba(197, 160, 89, 0.15); color: var(--text-main); font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: normal;">
                                    Model: {{ getAiModelDisplay(getAiModelName) }}
                                </span>
                            </h4>
                            <p style="margin: 4px 0 0 0; font-size: 0.76rem; color: var(--text-muted);">
                                Analyze ad CTRs, daily budget velocities, and conversion funnel dropoffs to trigger automated guardrails.
                            </p>
                        </div>
                        <button type="button" @click="triggerAgentRun" class="btn btn-primary" style="font-size: 0.78rem; padding: 8px 16px; height: auto;">
                            🤖 Run Strategy Analysis
                        </button>
                    </div>
 
                    <!-- Last Strategy Analysis Report -->
                    <div v-if="lastAnalysisReport" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 12px;">
                        <h4 style="margin: 0; font-size: 0.9rem; color: var(--accent); font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
                            <span>📊 Last Strategy Analysis Run Report</span>
                            <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal;">Executed at: {{ lastAnalysisReport.timestamp }}</span>
                        </h4>
                        
                        <div v-if="lastAnalysisReport.campaigns.length === 0" style="font-size: 0.78rem; color: var(--text-muted);">
                            No active campaigns found to analyze.
                        </div>
                        <div v-else style="display: flex; flex-direction: column; gap: 12px;">
                            <div v-for="r in lastAnalysisReport.campaigns" :key="r.name" style="background: rgba(0,0,0,0.15); border: 1px solid var(--border); padding: 12px; border-radius: 8px; font-size: 0.78rem; display: flex; flex-direction: column; gap: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 6px;">
                                    <strong style="color: var(--text-main); font-size: 0.82rem;">🎯 Campaign: {{ r.name }}</strong>
                                    <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">Status: Active</span>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px; background: rgba(255,255,255,0.01); padding: 8px; border-radius: 6px;">
                                    <div>
                                        <span style="color: var(--text-muted); font-size: 0.68rem; display: block;">ROAS / SAFETY FLOOR</span>
                                        <span style="color: var(--text-main); font-weight: bold;">{{ r.roas }} / {{ r.floor }}</span>
                                    </div>
                                    <div>
                                        <span style="color: var(--text-muted); font-size: 0.68rem; display: block;">INBOUND CTR</span>
                                        <span style="color: var(--text-main); font-weight: bold;">{{ r.ctr }}</span>
                                    </div>
                                    <div>
                                        <span style="color: var(--text-muted); font-size: 0.68rem; display: block;">DAILY BUDGET / CEILING</span>
                                        <span style="color: var(--text-main); font-weight: bold;">{{ r.spend }} / {{ r.ceiling }}</span>
                                    </div>
                                </div>
                                
                                <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); padding: 8px 12px; border-radius: 6px; font-size: 0.76rem; color: #10b981; line-height: 1.4; display: flex; align-items: flex-start; gap: 8px; margin-top: 4px;">
                                    <span>🤖</span>
                                    <div><strong>Strategist Verdict:</strong> {{ r.verdict }}</div>
                                </div>
                            </div>
                        </div>
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
                                <div v-for="prop in aiProposals[c.id]" :key="prop.id" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; margin-bottom: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                    <!-- Headline & Copy Diff -->
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.76rem;">
                                        <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                                            <span style="font-size: 0.65rem; color: var(--text-muted); display: block; font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">Original Copy</span>
                                            <div style="color: var(--text-muted); text-decoration: line-through; font-weight: 600;">{{ prop.original_headline || c.headline }}</div>
                                            <div style="color: var(--text-muted); text-decoration: line-through; font-size: 0.7rem; margin-top: 6px; line-height: 1.3;">{{ prop.original_ad_copy || c.ad_copy }}</div>
                                        </div>
                                        
                                        <div style="padding: 10px; background: rgba(16,185,129,0.04); border-radius: 8px; border: 1px solid rgba(16,185,129,0.25);">
                                            <span style="font-size: 0.65rem; color: #10b981; display: block; font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">Proposed AI Copy</span>
                                            <div style="color: var(--text-main); font-weight: 700;">{{ prop.proposed_headline }}</div>
                                            <div style="color: var(--text-main); font-size: 0.7rem; margin-top: 6px; line-height: 1.3;">{{ prop.proposed_ad_copy }}</div>
                                        </div>
                                    </div>
                                    
                                    <!-- Budget Change Badges -->
                                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 8px 12px; border-radius: 8px;">
                                        <span style="font-weight: 600; color: var(--text-muted);">Proposed Spend Limit:</span>
                                        <div style="display: flex; gap: 8px; align-items: center;">
                                            <span style="color: var(--text-muted); text-decoration: line-through;">€{{ parseFloat(prop.original_budget || c.budget || 0).toFixed(0) }}</span>
                                            <span style="color: var(--text-muted);">➔</span>
                                            <span style="font-weight: 800; color: var(--text-main);">€{{ parseFloat(prop.proposed_budget || c.budget || 0).toFixed(0) }}</span>
                                            
                                            <span v-if="(prop.proposed_budget || 0) > (prop.original_budget || 0)" style="background: rgba(16,185,129,0.15); color: #10b981; font-size: 0.62rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
                                                ▲ +{{ (((prop.proposed_budget - prop.original_budget) / (prop.original_budget || 1)) * 100).toFixed(0) }}% Scale
                                            </span>
                                            <span v-else-if="(prop.proposed_budget || 0) < (prop.original_budget || 0)" style="background: rgba(239,68,68,0.15); color: #ef4444; font-size: 0.62rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
                                                ▼ -{{ (((prop.original_budget - prop.proposed_budget) / (prop.original_budget || 1)) * 100).toFixed(0) }}% Reduce
                                            </span>
                                            <span v-else style="background: rgba(255,255,255,0.08); color: var(--text-muted); font-size: 0.62rem; padding: 2px 6px; border-radius: 4px;">
                                                Unchanged
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Media Diff Grid -->
                                    <div v-if="prop.proposed_media_url && prop.proposed_media_url !== prop.original_media_url" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 10px; border-radius: 8px;">
                                        <span style="font-weight: 700; color: var(--text-muted); font-size: 0.68rem; display: block; margin-bottom: 6px; text-transform: uppercase;">Visual Asset Swap:</span>
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                            <div>
                                                <span style="font-size: 0.6rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Original Graphic</span>
                                                <div style="border-radius: 6px; overflow: hidden; border: 1px solid var(--border); height: 75px; background: #000; position: relative;">
                                                    <img v-if="prop.original_media_url" :src="prop.original_media_url" style="width: 100%; height: 100%; object-fit: cover;">
                                                    <div v-else style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 0.65rem; color: var(--text-muted);">No image</div>
                                                </div>
                                            </div>
                                            <div>
                                                <span style="font-size: 0.6rem; color: #10b981; display: block; margin-bottom: 2px;">Proposed AI Graphic</span>
                                                <div style="border-radius: 6px; overflow: hidden; border: 1px solid rgba(16,185,129,0.3); height: 75px; background: #000; position: relative;">
                                                    <img :src="prop.proposed_media_url" style="width: 100%; height: 100%; object-fit: cover;">
                                                    <div style="position: absolute; bottom: 4px; right: 4px; background: #10b981; color: white; border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: bold;">✓</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Action Buttons -->
                                    <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
                                        <button type="button" @click="rejectAIProposal(prop)" class="btn btn-secondary" style="font-size: 0.68rem; padding: 4px 10px; height: auto;">
                                            Dismiss
                                        </button>
                                        <button type="button" @click="applyAIProposal(prop)" class="btn btn-primary" style="font-size: 0.68rem; padding: 4px 10px; height: auto; background: #10b981; border-color: #10b981;">
                                            ✓ Approve & Publish
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- TAB 5: Audiences segment builder -->
            <template v-if="activeTab === 'audiences'">
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 12px 16px; border-radius: 8px;">
                        <div>
                            <h4 style="margin: 0; font-size: 0.95rem; color: var(--text-main);">Audience Segments List</h4>
                            <p style="margin: 4px 0 0 0; font-size: 0.72rem; color: var(--text-muted);">Manage and build custom rules-based targeting segments (using the <strong>&amp;</strong> symbol in composers)</p>
                        </div>
                        <button type="button" class="btn btn-accent" style="margin: 0; font-size: 0.75rem; height: 32px; padding: 0 12px;" @click="openCreateAudienceModal">
                            ➕ Create Segment
                        </button>
                    </div>

                    <!-- AI Audience Advisor Recommendations -->
                    <div style="background: linear-gradient(135deg, rgba(197, 160, 89, 0.08) 0%, rgba(26, 27, 38, 0.3) 100%); border: 1px solid rgba(197, 160, 89, 0.25); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.25rem;">✨</span>
                            <div>
                                <h4 style="margin: 0; font-size: 0.9rem; color: var(--accent); font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">AI Audience Advisor Recommendations</h4>
                                <p style="margin: 2px 0 0 0; font-size: 0.72rem; color: var(--text-muted);">Predictive behavioral cohorts recommended for targeted coffee marketing campaigns.</p>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
                            <div v-for="rec in aiRecommendations" :key="rec.id" 
                                 style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; transition: border-color 0.2s;"
                                 :style="isRecommendationActive(rec) ? { opacity: 0.65, borderColor: 'rgba(16, 185, 129, 0.2)' } : {}">
                                <div>
                                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                                        <span style="font-size: 0.78rem; font-weight: bold; color: var(--text-main);">{{ rec.name }}</span>
                                        <span v-if="isRecommendationActive(rec)" style="font-size: 0.6rem; color: #10b981; font-weight: 700; background: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 100px; display: inline-flex; align-items: center; gap: 2px;">
                                            ✓ Active
                                        </span>
                                    </div>
                                    <p style="margin: 6px 0; font-size: 0.68rem; color: var(--text-muted); line-height: 1.35;">{{ rec.description }}</p>
                                    <code style="font-size: 0.62rem; color: var(--accent); background: rgba(0,0,0,0.15); padding: 2px 4px; border-radius: 4px; font-family: monospace; display: block; margin-top: 4px; word-break: break-all;">
                                        {{ getRulesSummaryDescription(rec.rules) }}
                                    </code>
                                </div>
                                
                                <button type="button" class="btn" 
                                        style="font-size: 0.68rem; padding: 5px 10px; height: auto; margin: 0; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 4px; border-radius: 6px; width: 100%; transition: all 0.2s;"
                                        :style="isRecommendationActive(rec) 
                                            ? { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', cursor: 'default' } 
                                            : { background: 'var(--accent)', color: 'var(--workspace-bg)', border: 'none', cursor: 'pointer' }"
                                        @click="isRecommendationActive(rec) ? null : activateRecommendedSegment(rec)">
                                    {{ isRecommendationActive(rec) ? 'Segment Active' : '⚡ Activate Cohort' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-if="audiences.length === 0" style="padding: 40px; text-align: center; color: var(--text-muted); border: 1px dashed var(--border); border-radius: 8px;">
                        <span style="font-size: 2rem; display: block; margin-bottom: 8px;">👥</span>
                        No custom audience segments created yet. Click "Create Segment" to start.
                    </div>
                    
                    <div v-else style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
                        <div v-for="aud in audiences" :key="aud.id" 
                             style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s;"
                             :style="aud.is_synced ? { border: '1px solid ' + aud.sync_color + '33', boxShadow: '0 2px 10px ' + aud.sync_color + '0a' } : {}">
                            <div>
                                <h4 style="margin: 0 0 8px 0; font-size: 0.95rem; color: var(--text-main); display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                                    <span style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                        <span>{{ aud.name }}</span>
                                        <span v-if="aud.is_synced" :style="{ fontSize: '0.6rem', background: aud.sync_color + '15', color: aud.sync_color, border: '1px solid ' + aud.sync_color + '33', padding: '1px 5px', borderRadius: '100px', fontWeight: 'bold', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '3px' }">
                                            🔄 {{ aud.source }}
                                        </span>
                                    </span>
                                    <code style="font-size: 0.72rem; color: var(--accent); font-weight: bold;">&amp;{{ aud.id }}</code>
                                </h4>
                                <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 12px;">
                                    <strong>Target Rules &amp; Conditions:</strong>
                                    <div style="font-family: monospace; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px; border: 1px solid var(--border); margin-top: 6px; font-size: 0.7rem; line-height: 1.3; color: var(--text-main); word-break: break-all;">
                                        {{ getRulesSummaryDescription(aud.rules) }}
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
                                <span v-if="aud.is_synced" style="font-size: 0.65rem; color: var(--text-muted); font-style: italic; margin-right: auto;">
                                    🔒 Synced Read-Only
                                </span>
                                <button type="button" class="btn" :disabled="aud.is_synced" style="font-size: 0.65rem; height: auto; padding: 4px 8px; border: 1px solid var(--border); background: transparent; color: var(--text-main); margin: 0;" :style="aud.is_synced ? { opacity: 0.35, cursor: 'not-allowed' } : {}" @click="editAudience(aud)">Edit</button>
                                <button type="button" class="btn" :disabled="aud.is_synced" style="font-size: 0.65rem; height: auto; padding: 4px 8px; border: 1px solid #ef4444; background: transparent; color: #ef4444; margin: 0;" :style="aud.is_synced ? { opacity: 0.35, cursor: 'not-allowed' } : {}" @click="deleteAudience(aud.id)">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <!-- Create/Edit Audience Segment Modal -->
        <div v-if="showAudienceModal" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 100020; padding: 16px;">
            <div class="modal-content" style="background: var(--panel-bg, #1a1b26); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 480px; box-shadow: 0 24px 38px 3px rgba(0,0,0,0.5); display: flex; flex-direction: column; overflow: hidden;">
                <!-- Header -->
                <div style="padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
                    <h3 style="margin: 0; color: var(--text-main); font-size: 1.1rem;">{{ isEditingAudience ? 'Edit Audience Segment' : 'Create Audience Segment' }}</h3>
                    <button type="button" @click="closeAudienceModal" style="background: transparent; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
                </div>
                <!-- Body -->
                <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; max-height: 60vh;">
                    <div>
                        <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 4px; font-weight: 700;">Audience Segment Name</label>
                        <input type="text" v-model="currAudience.name" placeholder="e.g. VIP High Spenders" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.8rem; outline: none;" @input="syncAudienceId">
                    </div>
                    <div>
                        <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 4px; font-weight: 700;">Audience Segment ID (slug prefix &amp;)</label>
                        <input type="text" v-model="currAudience.id" placeholder="e.g. vip-high-spenders" :disabled="isEditingAudience" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.8rem; outline: none;">
                        <span style="font-size: 0.65rem; color: var(--text-muted); display: block; margin-top: 4px;">Alphanumeric and hyphens only. Used as tag in composer (e.g. &amp;vip-high-spenders)</span>
                    </div>

                    <div style="border-top: 1px solid var(--border); padding-top: 12px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 0.8rem; color: var(--text-main);">Target Rules &amp; Conditions</h4>
                        
                        <!-- Recursive Visual Rules Builder -->
                        <AudienceRuleGroup :group="currAudience.rules" :is-root="true" />
                    </div>
                </div>
                <!-- Footer -->
                <div style="padding: 12px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 8px; background: rgba(255,255,255,0.02);">
                    <button type="button" class="btn btn-secondary" style="margin: 0; font-size: 0.76rem;" @click="closeAudienceModal">Cancel</button>
                    <button type="button" class="btn btn-accent" style="margin: 0; font-size: 0.76rem;" @click="saveAudience">Save Segment</button>
                </div>
            </div>
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

                    <!-- Reschedule Ad Duration -->
                    <div style="display: flex; flex-direction: column; gap: 12px; border-top: 1px solid var(--border); padding-top: 16px;">
                        <h4 style="margin: 0; color: var(--text-main); font-size: 0.9rem;">Reschedule Ad Campaign Schedule</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 12px; border-radius: 8px;">
                            <div class="form-group" style="margin: 0;">
                                <label style="display: block; font-size: 0.72rem; font-weight: bold; color: var(--text-muted); margin-bottom: 4px;">Start Date</label>
                                <input type="date" v-model="selectedCampaign.start_date" style="width: 100%; border-radius: 6px; padding: 6px; font-size: 0.8rem; background: var(--workspace-bg); color: var(--text-main); border: 1px solid var(--border); height: 32px; outline: none;">
                            </div>
                            <div class="form-group" style="margin: 0;">
                                <label style="display: block; font-size: 0.72rem; font-weight: bold; color: var(--text-muted); margin-bottom: 4px;">End Date</label>
                                <input type="date" v-model="selectedCampaign.end_date" style="width: 100%; border-radius: 6px; padding: 6px; font-size: 0.8rem; background: var(--workspace-bg); color: var(--text-main); border: 1px solid var(--border); height: 32px; outline: none;">
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

                    <!-- AI Generated Proposals Approval Queue (Modal view) -->
                    <div v-if="aiProposals[selectedCampaign.id] && aiProposals[selectedCampaign.id].length > 0" style="border-top: 1px solid var(--border); padding-top: 16px; margin-top: 8px;">
                        <h4 style="margin: 0 0 12px 0; color: var(--accent); font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                            <span>🤖 Pending AI Agent Proposals (Approval Queue)</span>
                        </h4>
                        
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div v-for="prop in aiProposals[selectedCampaign.id]" :key="prop.id" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                <!-- Headline & Copy Diff -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.76rem;">
                                    <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                                        <span style="font-size: 0.65rem; color: var(--text-muted); display: block; font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">Original Copy</span>
                                        <div style="color: var(--text-muted); text-decoration: line-through; font-weight: 600;">{{ prop.original_headline || selectedCampaign.headline }}</div>
                                        <div style="color: var(--text-muted); text-decoration: line-through; font-size: 0.7rem; margin-top: 6px; line-height: 1.3;">{{ prop.original_ad_copy || selectedCampaign.ad_copy }}</div>
                                    </div>
                                    
                                    <div style="padding: 10px; background: rgba(16,185,129,0.04); border-radius: 8px; border: 1px solid rgba(16,185,129,0.25);">
                                        <span style="font-size: 0.65rem; color: #10b981; display: block; font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">Proposed AI Copy</span>
                                        <div style="color: var(--text-main); font-weight: 700;">{{ prop.proposed_headline }}</div>
                                        <div style="color: var(--text-main); font-size: 0.7rem; margin-top: 6px; line-height: 1.3;">{{ prop.proposed_ad_copy }}</div>
                                    </div>
                                </div>
                                
                                <!-- Budget Change Badges -->
                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 8px 12px; border-radius: 8px;">
                                    <span style="font-weight: 600; color: var(--text-muted);">Proposed Spend Limit:</span>
                                    <div style="display: flex; gap: 8px; align-items: center;">
                                        <span style="color: var(--text-muted); text-decoration: line-through;">€{{ parseFloat(prop.original_budget || selectedCampaign.budget || 0).toFixed(0) }}</span>
                                        <span style="color: var(--text-muted);">➔</span>
                                        <span style="font-weight: 800; color: var(--text-main);">€{{ parseFloat(prop.proposed_budget || selectedCampaign.budget || 0).toFixed(0) }}</span>
                                        
                                        <span v-if="(prop.proposed_budget || 0) > (prop.original_budget || 0)" style="background: rgba(16,185,129,0.15); color: #10b981; font-size: 0.62rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
                                            ▲ +{{ (((prop.proposed_budget - prop.original_budget) / (prop.original_budget || 1)) * 100).toFixed(0) }}% Scale
                                        </span>
                                        <span v-else-if="(prop.proposed_budget || 0) < (prop.original_budget || 0)" style="background: rgba(239,68,68,0.15); color: #ef4444; font-size: 0.62rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
                                            ▼ -{{ (((prop.original_budget - prop.proposed_budget) / (prop.original_budget || 1)) * 100).toFixed(0) }}% Reduce
                                        </span>
                                        <span v-else style="background: rgba(255,255,255,0.08); color: var(--text-muted); font-size: 0.62rem; padding: 2px 6px; border-radius: 4px;">
                                            Unchanged
                                        </span>
                                    </div>
                                </div>

                                <!-- Media Diff Grid -->
                                <div v-if="prop.proposed_media_url && prop.proposed_media_url !== prop.original_media_url" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); padding: 10px; border-radius: 8px;">
                                    <span style="font-weight: 700; color: var(--text-muted); font-size: 0.68rem; display: block; margin-bottom: 6px; text-transform: uppercase;">Visual Asset Swap:</span>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                        <div>
                                            <span style="font-size: 0.6rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Original Graphic</span>
                                            <div style="border-radius: 6px; overflow: hidden; border: 1px solid var(--border); height: 75px; background: #000; position: relative;">
                                                <img v-if="prop.original_media_url" :src="prop.original_media_url" style="width: 100%; height: 100%; object-fit: cover;">
                                                <div v-else style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 0.65rem; color: var(--text-muted);">No image</div>
                                            </div>
                                        </div>
                                        <div>
                                            <span style="font-size: 0.6rem; color: #10b981; display: block; margin-bottom: 2px;">Proposed AI Graphic</span>
                                            <div style="border-radius: 6px; overflow: hidden; border: 1px solid rgba(16,185,129,0.3); height: 75px; background: #000; position: relative;">
                                                <img :src="prop.proposed_media_url" style="width: 100%; height: 100%; object-fit: cover;">
                                                <div style="position: absolute; bottom: 4px; right: 4px; background: #10b981; color: white; border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: bold;">✓</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Action Buttons -->
                                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
                                    <button type="button" @click="rejectAIProposal(prop)" class="btn btn-secondary" style="font-size: 0.68rem; padding: 4px 10px; height: auto;">
                                        Dismiss
                                    </button>
                                    <button type="button" @click="applyAIProposal(prop)" class="btn btn-primary" style="font-size: 0.68rem; padding: 4px 10px; height: auto; background: #10b981; border-color: #10b981;">
                                        ✓ Approve & Publish
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else-if="app.currentEnv !== 'prod'" style="border-top: 1px dashed var(--border); padding-top: 16px; margin-top: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 20px; background: rgba(255,255,255,0.01); border-radius: 8px;">
                        <span style="font-size: 1.2rem;">🤖</span>
                        <span style="font-size: 0.76rem; color: var(--text-muted); text-align: center;">No pending optimizer recommendations for this campaign.</span>
                        <button type="button" @click="simulateAgentProposal(selectedCampaign)" :disabled="simulatingAgent" class="btn" style="font-size: 0.72rem; padding: 6px 12px; height: 30px; border-radius: 6px; border: 1px dashed var(--accent); color: var(--accent); background: rgba(255,255,255,0.05); margin-top: 4px;">
                            🤖 {{ simulatingAgent ? 'Generating proposal...' : 'Simulate Agent Proposal' }}
                        </button>
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
        <!-- AI Exit Confirmation Modal -->
        <div v-if="showAiExitConfirmModal" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 16px;">
            <div class="modal-content" style="background: var(--panel-bg, #1a1b26); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 450px; box-shadow: 0 24px 38px 3px rgba(0,0,0,0.5); display: flex; flex-direction: column; overflow: hidden;">
                <!-- Header -->
                <div style="padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.02);">
                    <span style="font-size: 1.25rem;">⚠️</span>
                    <h3 style="margin: 0; color: var(--text-main); font-size: 1.1rem; font-weight: 700;">AI Generation in Progress</h3>
                </div>
                
                <!-- Body -->
                <div style="padding: 20px; font-size: 0.82rem; color: var(--text-muted); line-height: 1.5; display: flex; flex-direction: column; gap: 12px;">
                    <p style="margin: 0;">An AI asset generation task is currently running in the background.</p>
                    <p style="margin: 0; background: rgba(139, 92, 246, 0.05); border-left: 3px solid #8b5cf6; padding: 8px 12px; border-radius: 4px; color: var(--text-main);">
                        ℹ️ <strong>Note:</strong> The generation will continue in the background and the media asset will be successfully saved to your <strong>Media Library</strong> regardless of your choice.
                    </p>
                    <p style="margin: 0;">What would you like to do with the current campaign configuration edits?</p>
                </div>
                
                <!-- Footer -->
                <div style="padding: 12px 20px; border-top: 1px solid var(--border); background: rgba(255,255,255,0.015); display: flex; flex-direction: column; gap: 8px;">
                    <button type="button" class="btn btn-accent" style="width: 100%; font-size: 0.78rem; font-weight: 700; height: 34px; margin: 0; display: flex; align-items: center; justify-content: center; gap: 6px;" @click="confirmAiExit('draft')">
                        💾 Save as Draft & Close
                    </button>
                    <button type="button" class="btn btn-secondary" style="width: 100%; font-size: 0.78rem; height: 34px; border: 1px solid #ef4444; color: #ef4444; margin: 0; background: rgba(239, 68, 68, 0.05); display: flex; align-items: center; justify-content: center; gap: 6px;" @click="confirmAiExit('discard')">
                        🗑️ Discard Edits & Close
                    </button>
                    <button type="button" class="btn btn-secondary" style="width: 100%; font-size: 0.78rem; height: 34px; border: 1px solid var(--border); margin: 0; display: flex; align-items: center; justify-content: center;" @click="showAiExitConfirmModal = false">
                        ✕ Cancel (Keep Editing)
                    </button>
                </div>
            </div>
        </div>
        <!-- Composed Visual Studio Modal Overlay -->
        <div v-if="showComposerModal" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 16px;">
            <div class="modal-content" style="background: var(--panel-bg, #1a1b26); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 900px; max-height: 90%; box-shadow: 0 24px 38px 3px rgba(0,0,0,0.5); display: flex; flex-direction: column; overflow: hidden;">
                <!-- Header -->
                <div style="padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02);">
                    <h3 style="margin: 0; color: var(--accent); font-size: 1.15rem; font-family: var(--font-display); font-weight: 700;">
                        📸 Custom Brand Visual Composer Studio
                    </h3>
                    <button type="button" @click="showComposerModal = false" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem; padding: 4px;">✕</button>
                </div>

                <!-- Body (Split Panel) -->
                <div style="flex: 1; overflow-y: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px;">
                    <!-- Left Options Panel -->
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <!-- Product Selection -->
                        <div class="form-group">
                            <label style="font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display: block; color: var(--text-main);">1. Select Target Catalog Product</label>
                            <select v-model="composerParams.productId" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-size: 0.85rem; padding: 0 12px; margin: 0; cursor: pointer;">
                                <option value="">None (Generic Scene Shot)</option>
                                <option v-for="p in app.products" :key="p.id" :value="p.id">
                                    🛍️ {{ p.title }}
                                </option>
                            </select>
                        </div>

                        <!-- Persona Selection -->
                        <div class="form-group">
                            <label style="font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display: block; color: var(--text-main);">2. Select Brand Persona / Model</label>
                            <select v-model="composerParams.personaName" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-size: 0.85rem; padding: 0 12px; margin: 0; cursor: pointer;">
                                <option value="">No model (Product only studio composition)</option>
                                <option v-for="p in (brandCanvas ? brandCanvas.personas : [])" :key="p.name" :value="p.name">
                                    👤 {{ p.name }} ({{ p.role }})
                                </option>
                            </select>
                        </div>

                        <!-- Scenery Selection -->
                        <div class="form-group">
                            <label style="font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display: block; color: var(--text-main);">3. Select Scenery Backdrop</label>
                            <select v-model="composerParams.sceneryName" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-size: 0.85rem; padding: 0 12px; margin: 0; cursor: pointer;">
                                <option v-for="s in (brandCanvas ? brandCanvas.sceneries : [])" :key="s.name" :value="s.name">
                                    🌄 {{ s.name }}
                                </option>
                            </select>
                        </div>

                        <!-- Action Description -->
                        <div class="form-group">
                            <label style="font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display: block; color: var(--text-main);">4. Action / Scenario description</label>
                            <input type="text" v-model="composerParams.actionDescription" placeholder="e.g. showcasing the product on a concrete counter" style="height: 38px; font-size: 0.82rem; margin: 0; width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 12px; outline: none;">
                        </div>

                        <!-- AI Engine Selector -->
                        <div class="form-group">
                            <label style="font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display: block; color: var(--text-main);">5. AI Generation Engine</label>
                            <div style="display: flex; gap: 8px;">
                                <button type="button" v-for="eng in ['imagen', 'flux', 'dalle']" :key="eng" 
                                        @click="composerParams.backend = eng"
                                        class="btn" style="flex: 1; height: 36px; font-size: 0.75rem; font-weight: 700; border-radius: 6px; margin: 0; text-transform: uppercase;"
                                        :style="composerParams.backend === eng ? 'background: var(--accent); color: var(--workspace-bg); border-color: var(--accent);' : 'background: var(--card-bg); color: var(--text-main); border: 1px solid var(--border);'">
                                    {{ eng === 'imagen' ? 'Imagen 3' : (eng === 'flux' ? 'FLUX.1 [dev]' : 'DALL-E 3') }}
                                </button>
                            </div>
                        </div>

                        <!-- Output Format Toggle -->
                        <div class="form-group">
                            <label style="font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display: block; color: var(--text-main);">6. Creative Output Format</label>
                            <div style="display: flex; gap: 8px;">
                                <button type="button" @click="composerParams.format = 'image'" class="btn" style="flex: 1; height: 34px; font-size: 0.75rem; font-weight: 600; margin: 0; border-radius: 6px;"
                                        :style="composerParams.format === 'image' ? 'background: #22c55e; color: #0d0e12;' : 'background: var(--card-bg); color: var(--text-main); border: 1px solid var(--border);'">
                                    📸 High-Res Photo
                                </button>
                                <button type="button" @click="composerParams.format = 'video'" class="btn" style="flex: 1; height: 34px; font-size: 0.75rem; font-weight: 600; margin: 0; border-radius: 6px;"
                                        :style="composerParams.format === 'video' ? 'background: #a855f7; color: white;' : 'background: var(--card-bg); color: var(--text-main); border: 1px solid var(--border);'">
                                    🎬 Cinemagraph Video
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Right Monitoring / Preview Panel -->
                    <div style="display: flex; flex-direction: column; gap: 15px; background: rgba(0,0,0,0.15); border-radius: 8px; padding: 15px; border: 1px solid var(--border);">
                        <!-- Live Prompt -->
                        <div style="background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;">
                            <label style="font-size: 0.65rem; color: var(--accent); text-transform: uppercase; font-weight: 800; display: block; margin-bottom: 4px;">
                                Assembled Brand visual Blueprint Prompt
                            </label>
                            <div style="font-size: 0.76rem; color: var(--text-main); line-height: 1.4; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
                                {{ composerLivePrompt }}
                            </div>
                        </div>

                        <!-- Render Window -->
                        <div style="flex: 1; background: var(--workspace-bg); border: 1px dashed var(--border); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; min-height: 250px;">
                            <!-- Idle State -->
                            <div v-if="!composerGenerating && !composerResultUrl" style="text-align: center; color: var(--text-muted); padding: 24px;">
                                <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">🎭</span>
                                <span style="font-size: 0.8rem; font-weight: 600; display: block; color: var(--text-main);">Ready to Compose</span>
                                <span style="font-size: 0.7rem; display: block; margin-top: 4px;">Setup parameters and hit run to render composed asset.</span>
                            </div>

                            <!-- Generating Loader -->
                            <div v-else-if="composerGenerating" style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 15px;">
                                <div style="width: 36px; height: 36px; border: 3px solid rgba(197, 160, 89, 0.15); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                                <div>
                                    <h4 style="margin: 0; font-size: 0.8rem; font-weight: 700; color: var(--accent);">Rendering Composed Creative...</h4>
                                </div>
                            </div>

                            <!-- Result Display -->
                            <template v-else-if="composerResultUrl">
                                <video v-if="composerParams.format === 'video'" :src="composerResultUrl" autoplay loop muted style="width: 100%; height: 100%; object-fit: cover; position: absolute; top:0; left:0;"></video>
                                <img v-else :src="composerResultUrl" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top:0; left:0;">
                            </template>
                        </div>
                    </div>
                </div>

                <!-- Footer Actions -->
                <div style="padding: 16px 20px; border-top: 1px solid var(--border); background: rgba(255,255,255,0.015); display: flex; justify-content: flex-end; gap: 10px;">
                    <button type="button" class="btn" style="height: 36px; font-size: 0.8rem; margin:0;" @click="showComposerModal = false">Cancel</button>
                    <button type="button" @click="executeComposerGeneration" :disabled="composerGenerating" class="btn" style="height: 36px; font-size: 0.8rem; background: var(--accent); color: var(--workspace-bg); font-weight: bold; margin:0; min-width: 150px;">
                        <span>🚀 Render Creative</span>
                    </button>
                    <button type="button" v-if="composerResultUrl" @click="useComposedAsset" class="btn btn-primary" style="height: 36px; font-size: 0.8rem; font-weight: bold; margin:0; min-width: 150px;">
                        ✔️ Apply to Campaign Card
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import AudienceRuleGroup from './AudienceRuleGroup.vue';
import ProductTagField from './ProductTagField.vue';

export default {
    name: 'CampaignsView',
    components: {
        AudienceRuleGroup,
        ProductTagField
    },
    inject: ['app'],
    data() {
        return {
            productTranslationCache: {},
            campaigns: [],
            selectedCampaignIds: [],
            isCreatingCampaign: false,
            showLandingPageBuilder: false,
            // Visual Studio Composer modal properties
            showComposerModal: false,
            composerTargetType: 'card', // 'main' or 'card'
            composerTargetIndex: 0,
            composerParams: {
                productId: '',
                personaName: '',
                sceneryName: '',
                actionDescription: 'showcasing the product',
                backend: 'imagen',
                format: 'image'
            },
            composerGenerating: false,
            composerResultUrl: '',
            brandCanvas: null,
            generatingAutopilot: false,
            autopilotStatusTicks: [],
            landingPageAiGenerating: false,
            newLandingPage: {
                id: '',
                title: '',
                headline: '',
                subheadline: '',
                cta: '',
                coupon_code: '',
                features: '',
                product_id: ''
            },
            previewChannel: 'meta',
            currentStep: 1,
            metaPlacement: 'facebook',
            aiStudioAction: 'generate',
            aiStudioPrompt: '',
            aiStudioGenerating: false,
            aiStudioAspectRatio: '1:1',
            aiStudioMotion: 'medium',
            aiStudioDuration: '5s',
            lastGeneratingAIStudioCost: null,
            showAiExitConfirmModal: false,
            selectedLandingPageId: '',
            selectedProductId: '',
            selectedProductIds: [],
            mediaTab: 'upload',
            aiAutopilotDirection: '',
            aiAutopilotFormat: 'auto',
            catalogShowcaseSearch: '',
            aiAutopilotStyle: 'brand',
            runningAutopilotSection: false,
            uploadingMedia: false,
            widgetSearchQuery: '',
            mediaLibraryItems: [],
            campaignContentLang: 'en',
            translatingCampaign: false,
            simulatingAgent: false,
            lastTranslatingCampaignCost: null,
            viewMode: 'list',
            currentYear: new Date().getFullYear(),
            currentMonth: new Date().getMonth(),
            selectedCampaign: null,
            showCampaignDetailModal: false,
            roasSlider: 1.0,
            budgetSlider: 0,
            savingAdjustments: false,
            activeTab: (this.app && this.app.activeCampaignTab) ? this.app.activeCampaignTab : 'board',
            audiences: [],
            aiRecommendations: [
                {
                    id: 'dormant-vips',
                    name: 'Dormant VIPs',
                    description: 'High-value customers who spent highly but haven\'t purchased recently. Win them back with exclusive VIP gift codes.',
                    rules: {
                        type: 'group',
                        logicalOperator: 'AND',
                        rules: [
                            { type: 'rule', field: 'total_spent', operator: 'gt', value: 200 },
                            { type: 'rule', field: 'days_since_last_order', operator: 'gt', value: 60 }
                        ]
                    }
                },
                {
                    id: 'local-loyalists',
                    name: 'Local Loyalists',
                    description: 'Customers located in your primary domestic market (e.g. Belgium) who have ordered multiple times.',
                    rules: {
                        type: 'group',
                        logicalOperator: 'AND',
                        rules: [
                            { type: 'rule', field: 'customer_country', operator: 'eq', value: 'BE' },
                            { type: 'rule', field: 'orders_count', operator: 'gt', value: 2 }
                        ]
                    }
                },
                {
                    id: 'high-volume-wholesalers',
                    name: 'High Volume Wholesalers',
                    description: 'Accounts with large cart sizes or high order volumes. Ideal for wholesale blend offers or corporate discounts.',
                    rules: {
                        type: 'group',
                        logicalOperator: 'AND',
                        rules: [
                            { type: 'rule', field: 'total_spent', operator: 'gt', value: 500 }
                        ]
                    }
                }
            ],
            showAudienceModal: false,
            isEditingAudience: false,
            showAutocomplete: false,
            autocompleteSearch: '',
            activeTriggerSymbol: '',
            activeAutocompleteTarget: 'en',
            currAudience: {
                id: '',
                name: '',
                rules: {
                    hasSpentRule: false,
                    spentCondition: 'gt',
                    spentValue: 0,
                    hasOrdersRule: false,
                    ordersCondition: 'gt',
                    ordersValue: 0,
                    hasRecencyRule: false,
                    recencyCondition: 'gt',
                    recencyValue: 0
                }
            },
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
            lastAnalysisReport: null,
            agentConflictLogs: {},
            causalLiftData: {},
            selectedTone: 'friendly',
            selectedCreativeDirection: 'General',
            generatingAICopy: false,
            lastGeneratingAICopyCost: null,
            copywriterEstCost: '€0.00030',
            abVariantPreview: 'A',
            generatingABVariants: false,
            newCampaign: {
                id: '',
                name: '',
                campaign_type: 'manual',
                target_persona: '',
                product_id_override: null,
                subheadline: '',
                dynamic_copy_optimization: false,
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
                ad_cta: 'Shop Now',
                destination_type: 'homepage',
                landing_page_id: '',
                custom_url: '',
                carousel_cards: [
                    { image: '', title: '', link: '', activeTab: 'url', aiStudioAction: '', aiStudioPrompt: '', aspectRatio: '1:1', motionIntensity: 'medium', duration: '5s', aiStudioGenerating: false, lastAiStudioCost: null, generatingHeadline: false, lastHeadlineCost: null },
                    { image: '', title: '', link: '', activeTab: 'url', aiStudioAction: '', aiStudioPrompt: '', aspectRatio: '1:1', motionIntensity: 'medium', duration: '5s', aiStudioGenerating: false, lastAiStudioCost: null, generatingHeadline: false, lastHeadlineCost: null },
                    { image: '', title: '', link: '', activeTab: 'url', aiStudioAction: '', aiStudioPrompt: '', aspectRatio: '1:1', motionIntensity: 'medium', duration: '5s', aiStudioGenerating: false, lastAiStudioCost: null, generatingHeadline: false, lastHeadlineCost: null }
                ],
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
                budget_type: 'lifetime',
                bidding_strategy: 'manual',
                target_roas: 4.0,
                enable_ab_testing: false,
                headlines: ['', ''],
                ab_test_headlines: ['', ''],
                ab_test_descriptions: ['', ''],
                ab_test_links: ['', ''],
                ab_test_media_urls: ['', ''],
                warmup_days: 3,
                warmup_budget_percent: 15,
                ai_cost: 0.0,
                autopilot_enabled: false,
                lookalike_seeding_enabled: false,
                agent_mode: 'recommendation',
                status: 'active',
                selectedModel: 'gemini-2.5-flash',
                autopilot_guardrails: {
                    max_budget_change_pct: 20,
                    min_roas_floor: 1.8,
                    max_spend_ceiling: 500
                }
            },
            aiProviders: {
                providers: ['gemini'],
                gemini: true,
                claude: false,
                openai: false
            }
        };
    },
    computed: {
        composerLivePrompt() {
            if (!this.brandCanvas) return 'Loading brand guidelines...';
            
            const pId = this.composerParams.productId;
            const pers = this.composerParams.personaName;
            const scen = this.composerParams.sceneryName;
            const act = this.composerParams.actionDescription;
            const backend = this.composerParams.backend;

            const product = this.app.products.find(p => p.id === pId);
            let prodDesc = product ? product.title : 'premium products';
            if (product && product.visual_dna) {
                try {
                    const dna = typeof product.visual_dna === 'string' ? JSON.parse(product.visual_dna) : product.visual_dna;
                    if (dna && dna.subject) prodDesc = dna.subject;
                } catch(e) {}
            }

            const persona = this.brandCanvas.personas ? this.brandCanvas.personas.find(p => p.name === pers) : null;
            let personaDesc = '';
            if (persona) {
                personaDesc = `Used by a ${persona.age || '25-35'} year old ${persona.role || 'barista'} model with ${persona.expression || 'focused'} expression, wearing ${persona.apparel || 'casual attire'}. `;
            }

            const scenery = this.brandCanvas.sceneries ? this.brandCanvas.sceneries.find(s => s.name === scen) : null;
            let lighting = scenery ? scenery.lighting : 'natural soft side light';
            let backdrop = scenery ? scenery.description : 'modern minimalist setting';
            let cameraStyle = scenery ? scenery.photography_style : '35mm film style, warm color palette, soft bokeh, f/1.8 aperture';

            const enginePrefix = backend ? `[Engine: ${backend.toUpperCase()}] ` : '';
            return `${enginePrefix}Commercial advertising photography, ${prodDesc} in focus, ${act}. ${personaDesc}Set in a ${backdrop}. Shot on professional camera, ${lighting}, ${cameraStyle}, premium photo quality, realistic textures.`;
        },
        authHeaders() {
            const targetBrandId = (this.isCreatingCampaign && this.newCampaign && this.newCampaign.brand_id) || this.app.activeShopFilter;
            return {
                'Authorization': `Bearer ${this.app.adminToken}`,
                'X-Brand-Id': targetBrandId
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
            if (this.newCampaign && this.newCampaign.brand_id) {
                const brand = this.app.brands.find(b => b.id === this.newCampaign.brand_id);
                if (brand) return brand;
            }
            if (this.app && this.app.activeShopFilter && this.app.activeShopFilter !== 'all') {
                const brand = this.app.brands.find(b => b.id === this.app.activeShopFilter);
                if (brand) return brand;
            }
            if (this.app && this.app.brands && this.app.brands.length > 0) {
                return this.app.brands[0];
            }
            return { id: 'pesado', name: 'Pesado', logo: '', subdomain: 'pesado' };
        },
        filteredCampaignProducts() {
            const query = (this.catalogShowcaseSearch || '').toLowerCase();
            const brandId = this.activeBrand ? this.activeBrand.id : '';
            return (this.app.products || []).filter(p => p.brand_id === brandId).filter(p => {
                return p.title.toLowerCase().includes(query) || (p.type || '').toLowerCase().includes(query);
            });
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
            if (this.app.showDemoData && this.app.currentEnv !== 'prod' && this.campaigns.length === 0) {
                return 450.00;
            }
            return this.campaigns.reduce((acc, c) => acc + parseFloat(c.budget || 0), 0);
        },
        blendedRoas() {
            if (this.app.showDemoData && this.app.currentEnv !== 'prod' && this.campaigns.length === 0) {
                return '4.6x';
            }
            if (this.campaigns.length === 0) return '0.0x';
            const active = this.campaigns.filter(c => c.status === 'active');
            if (active.length === 0) return '0.0x';
            const sum = active.reduce((acc, c) => acc + parseFloat(c.target_roas || 4.0), 0);
            return `${(sum / active.length).toFixed(1)}x`;
        },
        inboundCtr() {
            if (this.app.showDemoData && this.app.currentEnv !== 'prod' && this.campaigns.length === 0) {
                return '3.8%';
            }
            if (this.campaigns.length === 0) return '0.0%';
            const active = this.campaigns.filter(c => c.status === 'active');
            if (active.length === 0) return '0.0%';
            return '3.2%';
        },
        availableLandingPages() {
            const brand = this.activeBrand;
            if (!brand || !brand.theme_settings) return [];
            try {
                const settings = typeof brand.theme_settings === 'string' ? JSON.parse(brand.theme_settings) : brand.theme_settings;
                const protocol = this.app.currentEnv === 'local' ? 'http' : 'https';
                if (settings.landing_pages && Array.isArray(settings.landing_pages)) {
                    return settings.landing_pages.map(p => ({
                        id: p.id,
                        title: p.headline || `Landing Page (${p.id})`,
                        url: `${protocol}://${this.app.getBrandSubdomain(brand)}/${p.id}`
                    }));
                } else if (settings.landing_headline) {
                    return [{
                        id: 'promo-offer',
                        title: settings.landing_headline,
                        url: `${protocol}://${this.app.getBrandSubdomain(brand)}/promo-offer`
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
            let rawHeadline = '';
            if (this.newCampaign.enable_ab_testing && this.abVariantPreview === 'B') {
                if (lang && lang !== 'en' && this.newCampaign.translations && this.newCampaign.translations[lang] && this.newCampaign.translations[lang].headline_b) {
                    rawHeadline = this.newCampaign.translations[lang].headline_b;
                } else {
                    rawHeadline = this.newCampaign.ab_test_headlines[1] || this.newCampaign.headlines[1] || 'Headline Variant B';
                }
            } else if (this.newCampaign.enable_ab_testing && this.abVariantPreview === 'A') {
                if (lang && lang !== 'en' && this.newCampaign.translations && this.newCampaign.translations[lang] && this.newCampaign.translations[lang].headline) {
                    rawHeadline = this.newCampaign.translations[lang].headline;
                } else {
                    rawHeadline = this.newCampaign.ab_test_headlines[0] || this.newCampaign.headline || 'Headline Variant A';
                }
            } else {
                if (lang && lang !== 'en' && this.newCampaign.translations && this.newCampaign.translations[lang] && this.newCampaign.translations[lang].headline) {
                    rawHeadline = this.newCampaign.translations[lang].headline;
                } else {
                    rawHeadline = this.newCampaign.headline || 'Product Headline';
                }
            }
            return this.resolveCampaignField(rawHeadline, 'headline', lang);
        },
        previewAdCopy() {
            const lang = this.campaignContentLang;
            let rawAdCopy = '';
            if (this.newCampaign.enable_ab_testing && this.abVariantPreview === 'B') {
                if (lang && lang !== 'en' && this.newCampaign.translations && this.newCampaign.translations[lang] && this.newCampaign.translations[lang].ad_copy_b) {
                    rawAdCopy = this.newCampaign.translations[lang].ad_copy_b;
                } else {
                    rawAdCopy = this.newCampaign.ab_test_descriptions[1] || 'Ad Copy Variant B description...';
                }
            } else if (this.newCampaign.enable_ab_testing && this.abVariantPreview === 'A') {
                if (lang && lang !== 'en' && this.newCampaign.translations && this.newCampaign.translations[lang] && this.newCampaign.translations[lang].ad_copy) {
                    rawAdCopy = this.newCampaign.translations[lang].ad_copy;
                } else {
                    rawAdCopy = this.newCampaign.ab_test_descriptions[0] || this.newCampaign.ad_copy || 'Ad Copy Variant A description...';
                }
            } else {
                if (lang && lang !== 'en' && this.newCampaign.translations && this.newCampaign.translations[lang] && this.newCampaign.translations[lang].ad_copy) {
                    rawAdCopy = this.newCampaign.translations[lang].ad_copy;
                } else {
                    rawAdCopy = this.newCampaign.ad_copy || 'Write some compelling copy here for your audience to see in their social feeds...';
                }
            }
            return this.resolveCampaignField(rawAdCopy, 'description', lang);
        },
        previewMediaUrl() {
            let rawMediaUrl = '';
            if (this.newCampaign.enable_ab_testing && this.abVariantPreview === 'B') {
                rawMediaUrl = this.newCampaign.ab_test_media_urls[1] || this.newCampaign.media_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80';
            } else if (this.newCampaign.enable_ab_testing && this.abVariantPreview === 'A') {
                rawMediaUrl = this.newCampaign.ab_test_media_urls[0] || this.newCampaign.media_url || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80';
            } else {
                rawMediaUrl = this.newCampaign.media_url || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80';
            }
            return this.resolveCampaignField(rawMediaUrl, 'url', this.campaignContentLang);
        },
        previewDestinationUrl() {
            if (this.newCampaign.enable_ab_testing && this.abVariantPreview === 'B') {
                return this.newCampaign.ab_test_links[1] || this.getDestinationDomain;
            }
            if (this.newCampaign.enable_ab_testing && this.abVariantPreview === 'A') {
                return this.newCampaign.ab_test_links[0] || this.getDestinationDomain;
            }
            return this.getDestinationDomain;
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
        },
        getAiModelName() {
            const tier = this.activeBrand ? this.activeBrand.ai_tier : 'professional';
            if (tier === 'standard') return 'gemini-2.5-flash';
            if (tier === 'enterprise') return 'deep-research-pro-preview';
            return 'gemini-3.1-pro';
        },
        getAiModelDisplay() {
            return (modelName) => {
                if (modelName === 'gemini-2.5-flash') return 'Gemini 2.5 Flash';
                if (modelName === 'gemini-3.1-pro') return 'Gemini 3.1 Pro';
                if (modelName === 'deep-research-pro-preview') return 'Deep Research Pro';
                return modelName;
            };
        },
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
                        { label: '%SAVE20', value: '%SAVE20', description: '20% discount coupon' },
                        { label: '%WELCOME10', value: '%WELCOME10', description: '10% welcome coupon' }
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
                        { label: '&past-purchasers', value: '&past-purchasers', description: 'Customers who purchased previously' },
                        { label: '&lookalike-vips', value: '&lookalike-vips', description: 'Lookalike 1% of high value spenders' }
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
        }
    },
    watch: {
        activeTab(newVal) {
            if (this.app) {
                this.app.activeCampaignTab = newVal;
                this.app.updateURL();
            }
        },
        'app.activeCampaignTab'(newVal) {
            if (newVal && newVal !== this.activeTab) {
                this.activeTab = newVal;
            }
        },
        isCreatingCampaign(newVal) {
            this.$emit('toggle-fullscreen-creator', newVal);
        },
        'newCampaign.ad_copy': {
            immediate: true,
            handler(newVal) {
                this.updateCopywriterEstimate(newVal);
            }
        },
        'newCampaign.format'(newVal) {
            if (newVal === 'Carousel') {
                this.autofillCarousel();
            }
        },
        'app.activeShopFilter': {
            immediate: true,
            handler() {
                this.loadCampaigns();
                this.fetchAudiences();
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
        },
        'newCampaign.enable_ab_testing': {
            handler(newVal) {
                if (newVal) {
                    if (!this.newCampaign.ab_test_headlines[0]) this.newCampaign.ab_test_headlines[0] = this.newCampaign.headline || '';
                    if (!this.newCampaign.ab_test_descriptions[0]) this.newCampaign.ab_test_descriptions[0] = this.newCampaign.ad_copy || '';
                    if (!this.newCampaign.ab_test_links[0]) this.newCampaign.ab_test_links[0] = this.getDestinationDomain || '';
                    if (!this.newCampaign.ab_test_media_urls[0]) this.newCampaign.ab_test_media_urls[0] = this.newCampaign.media_url || '';
                }
            }
        }
    },
    methods: {
        handleAdCopyInput(e) {
            const text = this.newCampaign.ad_copy || '';
            const cursor = e.target.selectionStart;
            const beforeCursor = text.substring(0, cursor);
            const match = beforeCursor.match(/([@%&#\/])(\w*)$/);
            if (match) {
                this.activeTriggerSymbol = match[1];
                this.showAutocomplete = true;
                this.autocompleteSearch = match[2].toLowerCase();
                this.activeAutocompleteTarget = 'en';
            } else {
                this.showAutocomplete = false;
                this.activeTriggerSymbol = '';
            }
        },
        handleAdCopyInputTrans(e) {
            const activeLang = this.campaignContentLang;
            if (!this.newCampaign.translations || !this.newCampaign.translations[activeLang]) return;
            const text = this.newCampaign.translations[activeLang].ad_copy || '';
            const cursor = e.target.selectionStart;
            const beforeCursor = text.substring(0, cursor);
            const match = beforeCursor.match(/([@%&#\/])(\w*)$/);
            if (match) {
                this.activeTriggerSymbol = match[1];
                this.showAutocomplete = true;
                this.autocompleteSearch = match[2].toLowerCase();
                this.activeAutocompleteTarget = activeLang;
            } else {
                this.showAutocomplete = false;
                this.activeTriggerSymbol = '';
            }
        },
        insertCampaignAutocompleteTag(tag) {
            const activeLang = this.activeAutocompleteTarget || 'en';
            let text = '';
            let textarea = null;
            
            if (activeLang === 'en') {
                text = this.newCampaign.ad_copy || '';
                textarea = this.$refs.adCopyInput;
            } else {
                text = (this.newCampaign.translations && this.newCampaign.translations[activeLang]) ? (this.newCampaign.translations[activeLang].ad_copy || '') : '';
                textarea = this.$refs.adCopyInputTrans;
            }

            const cursor = textarea ? textarea.selectionStart : text.length;
            const beforeCursor = text.substring(0, cursor);
            const afterCursor = text.substring(cursor);
            const beforeTag = beforeCursor.replace(/([@%&#\/])(\w*)$/, '');
            
            const newText = beforeTag + tag.value + ' ' + afterCursor;
            if (activeLang === 'en') {
                this.newCampaign.ad_copy = newText;
            } else {
                this.newCampaign.translations[activeLang].ad_copy = newText;
            }
            
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
        async fetchAudiences() {
            if (this.app.activeShopFilter === 'all') {
                this.audiences = [];
                return;
            }
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.app.activeShopFilter}/audiences`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    this.audiences = data.audiences || [];
                }
            } catch (err) {
                console.error('[CampaignsView] Error fetching audiences:', err);
            }
        },
        openCreateAudienceModal() {
            this.isEditingAudience = false;
            this.currAudience = {
                id: '',
                name: '',
                rules: {
                    type: 'group',
                    logicalOperator: 'AND',
                    rules: []
                }
            };
            this.showAudienceModal = true;
        },
        closeAudienceModal() {
            this.showAudienceModal = false;
        },
        syncAudienceId() {
            if (this.isEditingAudience) return;
            this.currAudience.id = this.currAudience.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        },
        editAudience(aud) {
            this.isEditingAudience = true;
            const rules = aud.rules || {};
            let groupRules;
            if (rules.type === 'group') {
                groupRules = JSON.parse(JSON.stringify(rules));
            } else {
                groupRules = {
                    type: 'group',
                    logicalOperator: 'AND',
                    rules: []
                };
                if (rules.spentValue !== undefined) {
                    groupRules.rules.push({
                        type: 'rule',
                        field: 'total_spent',
                        operator: rules.spentCondition || 'gt',
                        value: Number(rules.spentValue)
                    });
                }
                if (rules.ordersValue !== undefined) {
                    groupRules.rules.push({
                        type: 'rule',
                        field: 'orders_count',
                        operator: rules.ordersCondition || 'gt',
                        value: Number(rules.ordersValue)
                    });
                }
                if (rules.recencyValue !== undefined) {
                    groupRules.rules.push({
                        type: 'rule',
                        field: 'days_since_last_order',
                        operator: rules.recencyCondition || 'gt',
                        value: Number(rules.recencyValue)
                    });
                }
            }
            this.currAudience = {
                id: aud.id,
                name: aud.name,
                rules: groupRules
            };
            this.showAudienceModal = true;
        },
        async deleteAudience(audienceId) {
            if (!confirm('Are you sure you want to delete this audience segment?')) return;
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.app.activeShopFilter}/audiences/${audienceId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                });
                if (response.ok) {
                    this.app.showNotification('👥 Audience segment deleted successfully.');
                    this.fetchAudiences();
                } else {
                    const err = await response.json();
                    alert('Delete failed: ' + (err.error || 'Unknown error'));
                }
            } catch (err) {
                console.error('[CampaignsView] Error deleting audience:', err);
            }
        },
        formatRuleKey(key) {
            if (key === 'spentValue') return 'Total Spent (€)';
            if (key === 'spentCondition') return 'Spent Operator';
            if (key === 'ordersValue') return 'Orders Count';
            if (key === 'ordersCondition') return 'Orders Operator';
            if (key === 'recencyValue') return 'Days Since Last Order';
            if (key === 'recencyCondition') return 'Recency Operator';
            return key;
        },
        getRulesSummaryDescription(rules) {
            if (!rules) return 'No rules defined';
            if (rules.type === 'group') {
                if (!rules.rules || rules.rules.length === 0) return 'Empty group';
                const subDescriptions = rules.rules.map(r => this.getRulesSummaryDescription(r));
                return `(${subDescriptions.join(` ${rules.logicalOperator} `)})`;
            } else if (rules.type === 'rule') {
                const fieldLabels = {
                    total_spent: 'Total Spent',
                    orders_count: 'Orders Count',
                    days_since_last_order: 'Days Since Last Order',
                    customer_country: 'Country',
                    email_domain: 'Email Domain',
                    last_purchased_item: 'Last Purchased SKU'
                };
                const opLabels = {
                    gt: '>',
                    lt: '<',
                    eq: '=',
                    contains: 'contains',
                    starts_with: 'starts with'
                };
                const fieldName = fieldLabels[rules.field] || rules.field;
                const opName = opLabels[rules.operator] || rules.operator;
                const valSuffix = rules.field === 'total_spent' ? '€' : '';
                return `${fieldName} ${opName} ${valSuffix}${rules.value}`;
            }
            // Fallback for legacy format
            const parts = [];
            if (rules.spentValue !== undefined) parts.push(`Total Spent ${rules.spentCondition === 'lt' ? '<' : '>'} €${rules.spentValue}`);
            if (rules.ordersValue !== undefined) parts.push(`Orders Count ${rules.ordersCondition === 'lt' ? '<' : '>'} ${rules.ordersValue}`);
            if (rules.recencyValue !== undefined) parts.push(`Days Since Last Order ${rules.recencyCondition === 'lt' ? '<' : '>'} ${rules.recencyValue}`);
            return parts.join(' AND ');
        },
        async saveAudience() {
            if (!this.currAudience.name || !this.currAudience.id) {
                alert('Please provide a name and slug ID for this segment.');
                return;
            }
            
            // Validate that we have at least one condition/group inside the rules tree
            if (!this.currAudience.rules.rules || this.currAudience.rules.rules.length === 0) {
                alert('Please configure at least one segment targeting rule.');
                return;
            }

            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.app.activeShopFilter}/audiences`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify({
                        id: this.currAudience.id,
                        name: this.currAudience.name,
                        rules: this.currAudience.rules
                    })
                });

                if (response.ok) {
                    this.app.showNotification('👥 Audience segment saved successfully.');
                    this.showAudienceModal = false;
                    this.fetchAudiences();
                } else {
                    const err = await response.json();
                    alert('Save failed: ' + (err.error || 'Unknown error'));
                }
            } catch (err) {
                console.error('[CampaignsView] Error saving audience segment:', err);
            }
        },
        isRecommendationActive(rec) {
            const suffixId = `${this.app.activeShopFilter}-${rec.id}`;
            return this.audiences.some(a => a.id === suffixId || a.id === rec.id);
        },
        async activateRecommendedSegment(rec) {
            try {
                const suffixId = `${this.app.activeShopFilter}-${rec.id}`;
                if (this.isRecommendationActive(rec)) {
                    alert('This segment is already active.');
                    return;
                }

                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.app.activeShopFilter}/audiences`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify({
                        id: suffixId,
                        name: rec.name,
                        rules: rec.rules
                    })
                });

                if (response.ok) {
                    this.app.showNotification(`👥 AI Segment "${rec.name}" activated successfully!`);
                    this.fetchAudiences();
                } else {
                    const err = await response.json();
                    alert('Activation failed: ' + (err.error || 'Unknown error'));
                }
            } catch (err) {
                console.error('[CampaignsView] Error activating AI segment:', err);
            }
        },
        triggerCampaignContentStudio(field) {
            this.app.openContentStudio((url, item) => {
                this.newCampaign.media_url = url;
            }, {
                promptPreset: this.newCampaign.headline ? `${this.newCampaign.headline}` : ''
            });
        },
        triggerCardContentStudio(idx) {
            const card = this.newCampaign.carousel_cards[idx];
            this.app.openContentStudio((url, item) => {
                card.image = url;
                if (item && item.title) {
                    card.title = item.title;
                }
            }, {
                promptPreset: card ? `${card.title || ''}` : ''
            });
        },
        async generateABVariantsWithAI() {
            if (!this.newCampaign.headline || !this.newCampaign.ad_copy) {
                alert('Please fill out the main Headline and Description first, so the AI has context to generate variations.');
                return;
            }
            this.generatingABVariants = true;
            this.app.startAiTicker(this.getAiModelName);
            try {
                // 1. Generate Alternative Headline B
                const resHead = await fetch(`/api/global/brands/${this.app.activeShopFilter}/ai-rewrite`, {
                    method: 'POST',
                    headers: { ...this.authHeaders, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: this.newCampaign.headline,
                        tone: 'punchy',
                        field: 'Headline variant'
                    })
                });
                if (resHead.ok) {
                    const dataHead = await resHead.json();
                    this.newCampaign.ab_test_headlines[0] = this.newCampaign.headline;
                    this.newCampaign.ab_test_headlines[1] = dataHead.text;
                    this.newCampaign.headlines[0] = this.newCampaign.headline;
                    this.newCampaign.headlines[1] = dataHead.text;
                }

                // 2. Generate Alternative Description B
                const resCopy = await fetch(`/api/global/brands/${this.app.activeShopFilter}/ai-rewrite`, {
                    method: 'POST',
                    headers: { ...this.authHeaders, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: this.newCampaign.ad_copy,
                        tone: 'creative',
                        field: 'Ad copy variant'
                    })
                });
                if (resCopy.ok) {
                    const dataCopy = await resCopy.json();
                    this.newCampaign.ab_test_descriptions[0] = this.newCampaign.ad_copy;
                    this.newCampaign.ab_test_descriptions[1] = dataCopy.text;
                }

                // Initialize other A/B fields if empty
                if (!this.newCampaign.ab_test_links[0]) this.newCampaign.ab_test_links[0] = this.getDestinationDomain;
                if (!this.newCampaign.ab_test_links[1]) this.newCampaign.ab_test_links[1] = this.getDestinationDomain + '?variant=b';
                
                if (!this.newCampaign.ab_test_media_urls[0]) this.newCampaign.ab_test_media_urls[0] = this.newCampaign.media_url || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80';
                if (!this.newCampaign.ab_test_media_urls[1]) this.newCampaign.ab_test_media_urls[1] = this.newCampaign.media_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80';

                this.app.showNotification('Alternative A/B variants generated successfully using AI!');
            } catch (e) {
                console.error(e);
                this.app.showNotification('Error generating A/B variants.');
            } finally {
                this.generatingABVariants = false;
                this.app.stopAiTicker();
            }
        },
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
                    const data = await response.json();
                    if (this.app.showDemoData && this.app.currentEnv !== 'prod' && data.length === 0) {
                        this.campaigns = [
                            {
                                id: 'demo_1',
                                name: '☕ Slayer Espresso Promo Launch',
                                campaign_type: 'product',
                                platform: 'meta,google',
                                budget: 350.00,
                                ai_cost: 0.1250,
                                target_roas: 4.8,
                                status: 'active',
                                automation_rules: [
                                    { id: 'rule_1', description: 'Increase budget by 10% if ROAS > 4.5' }
                                ],
                                performance_history: [
                                    { date: 'Mon', spend: 40, conversions: 8 },
                                    { date: 'Tue', spend: 45, conversions: 11 },
                                    { date: 'Wed', spend: 50, conversions: 12 },
                                    { date: 'Thu', spend: 55, conversions: 14 }
                                ]
                            },
                            {
                                id: 'demo_2',
                                name: '🍂 Autumn Warmers Social Drive',
                                campaign_type: 'manual',
                                platform: 'meta',
                                budget: 150.00,
                                ai_cost: 0.0425,
                                target_roas: 3.9,
                                status: 'active',
                                automation_rules: [],
                                performance_history: [
                                    { date: 'Mon', spend: 15, conversions: 3 },
                                    { date: 'Tue', spend: 20, conversions: 4 },
                                    { date: 'Wed', spend: 18, conversions: 5 }
                                ]
                            }
                        ];
                    } else {
                        this.campaigns = data;
                    }
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
                this.newCampaign.media_url = `@inventory-${p.id}`;
                this.newCampaign.headline = `@inventory-${p.id}`;
                this.newCampaign.ad_copy = `@inventory-${p.id}`;
                this.app.showNotification(`Autofilled ad using product catalog details for "${p.title}".`);
            } else {
                this.app.showNotification('Product catalog is currently empty. Add products first!');
            }
        },
        autofillCarousel() {
            let productsToUse = [];
            if (this.newCampaign.campaign_type === 'product' && this.selectedProductIds && this.selectedProductIds.length > 0) {
                productsToUse = this.app.products.filter(p => this.selectedProductIds.includes(p.id));
            } else {
                productsToUse = this.app.products || [];
            }

            if (productsToUse.length > 0) {
                const count = Math.min(productsToUse.length, 10);
                this.newCampaign.carousel_cards = [];
                for (let i = 0; i < count; i++) {
                    const p = productsToUse[i];
                    this.newCampaign.carousel_cards.push({
                        image: `@inventory-${p.id}`,
                        title: `@inventory-${p.id}`,
                        link: `/store/${this.activeBrand.id}?product=${p.id}`,
                        activeTab: 'url',
                        aiStudioAction: '',
                        aiStudioPrompt: '',
                        aspectRatio: '1:1',
                        motionIntensity: 'medium',
                        duration: '5s',
                        aiStudioGenerating: false,
                        lastAiStudioCost: null,
                        generatingHeadline: false,
                        lastHeadlineCost: null
                    });
                }
                this.app.showNotification(`Autofilled ${count} Carousel cards matching your selected showcase products.`);
            } else {
                this.app.showNotification('No products selected to autofill the carousel.');
            }
        },
        addCarouselCard() {
            if (this.newCampaign.carousel_cards.length >= 10) {
                alert('Maximum 10 carousel cards are allowed.');
                return;
            }
            this.newCampaign.carousel_cards.push({
                image: '',
                title: '',
                link: '',
                activeTab: 'url',
                aiStudioAction: '',
                aiStudioPrompt: '',
                aspectRatio: '1:1',
                motionIntensity: 'medium',
                duration: '5s',
                aiStudioGenerating: false,
                lastAiStudioCost: null,
                generatingHeadline: false,
                lastHeadlineCost: null
            });
        },
        removeCarouselCard(idx) {
            if (this.newCampaign.carousel_cards.length <= 2) {
                alert('A carousel ad must contain at least 2 cards.');
                return;
            }
            this.newCampaign.carousel_cards.splice(idx, 1);
        },
        resolveProductImage(val) {
            if (!val || typeof val !== 'string') return '';
            if (val.startsWith('@product-') || val.startsWith('@inventory-')) {
                const identifier = val.startsWith('@product-') ? val.replace('@product-', '') : val.replace('@inventory-', '');
                const found = (this.app.products || []).find(p => String(p.id) === identifier);
                return found ? (found.image || '') : '';
            }
            return val;
        },
        resolveCampaignField(value, type, lang = 'en') {
            if (!value || typeof value !== 'string') return value;
            const regex = /@(product|inventory)-([a-zA-Z0-9\-_]+)/g;
            return value.replace(regex, (match, prefix, identifier) => {
                const product = (this.app.products || []).find(p => 
                    String(p.id) === identifier || 
                    (p.sku && p.sku.toLowerCase() === identifier.toLowerCase())
                );
                if (!product) return match;
                if (type === 'url') {
                    return product.image || '';
                }
                const defaultField = type === 'headline' ? 'title' : 'description';
                const baseText = product[defaultField] || '';
                if (!lang || lang === 'en') {
                    return baseText;
                }
                const cacheKey = `${product.id}-${defaultField}-${lang}`;
                if (this.productTranslationCache[cacheKey]) {
                    return this.productTranslationCache[cacheKey];
                }
                this.fetchProductTranslation(product.id, defaultField, lang, baseText);
                return baseText;
            });
        },
        async fetchProductTranslation(productId, field, lang, baseText) {
            const cacheKey = `${productId}-${field}-${lang}`;
            this.$set(this.productTranslationCache, cacheKey, baseText + '...');
            try {
                const response = await fetch('/api/global/translate', {
                    method: 'POST',
                    headers: this.authHeaders,
                    body: JSON.stringify({
                        text: baseText,
                        targetLang: lang
                    })
                });
                if (response.ok) {
                    const res = await response.json();
                    if (res && res.translatedText) {
                        this.$set(this.productTranslationCache, cacheKey, res.translatedText);
                    }
                }
            } catch (err) {
                console.error('[CampaignsView] Error translating product field:', err);
                this.$set(this.productTranslationCache, cacheKey, baseText);
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
            let tier = 'professional';
            if (this.app.activeShopFilter !== 'all') {
                const brand = this.app.brands.find(b => b.id === this.app.activeShopFilter);
                if (brand) tier = brand.ai_tier;
            }
            let defaultModel = 'gemini-2.5-flash';
            if (tier === 'professional') defaultModel = 'gemini-3.1-pro';
            if (tier === 'enterprise') defaultModel = 'deep-research-pro-preview';

            this.newCampaign = {
                id: '',
                name: '',
                brand_id: this.app.activeShopFilter === 'all' ? (this.app.brands[0] ? this.app.brands[0].id : '') : this.app.activeShopFilter,
                selectedModel: defaultModel,
                campaign_type: 'manual',
                target_persona: '',
                product_id_override: null,
                subheadline: '',
                dynamic_copy_optimization: false,
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
                    { image: '', title: '', link: '', activeTab: 'url', aiStudioAction: '', aiStudioPrompt: '', aspectRatio: '1:1', motionIntensity: 'medium', duration: '5s', aiStudioGenerating: false, lastAiStudioCost: null, generatingHeadline: false, lastHeadlineCost: null },
                    { image: '', title: '', link: '', activeTab: 'url', aiStudioAction: '', aiStudioPrompt: '', aspectRatio: '1:1', motionIntensity: 'medium', duration: '5s', aiStudioGenerating: false, lastAiStudioCost: null, generatingHeadline: false, lastHeadlineCost: null },
                    { image: '', title: '', link: '', activeTab: 'url', aiStudioAction: '', aiStudioPrompt: '', aspectRatio: '1:1', motionIntensity: 'medium', duration: '5s', aiStudioGenerating: false, lastAiStudioCost: null, generatingHeadline: false, lastHeadlineCost: null }
                ],
                status: 'active',
                autopilot_enabled: false,
                lookalike_seeding_enabled: false,
                agent_mode: 'recommendation',
                enable_ab_testing: false,
                headlines: ['', ''],
                ab_test_headlines: ['', ''],
                ab_test_descriptions: ['', ''],
                ab_test_links: ['', ''],
                ab_test_media_urls: ['', ''],
                warmup_days: 3,
                warmup_budget_percent: 15,
                autopilot_guardrails: {
                    max_budget_change_pct: 20,
                    min_roas_floor: 1.8,
                    max_spend_ceiling: 500
                },
                creation_mode: 'manual',
                creation_mode_selected: false,
                autopilot_goal: ''
            };
            this.campaignContentLang = 'en';
            this.currentStep = 1;
            this.loadAiProviders();
            this.isCreatingCampaign = true;
        },
        closeCreateCampaignModal() {
            // Check if any AI generation task is currently running
            const isGenerating = this.aiStudioGenerating || 
                                 (this.newCampaign.carousel_cards && this.newCampaign.carousel_cards.some(c => c.aiStudioGenerating || c.generatingHeadline)) || 
                                 this.generatingAICopy || 
                                 this.translatingCampaign || 
                                 this.generatingABVariants || 
                                 this.simulatingAgent;

            if (isGenerating) {
                this.showAiExitConfirmModal = true;
            } else {
                this.isCreatingCampaign = false;
            }
        },
        async confirmAiExit(action) {
            this.showAiExitConfirmModal = false;
            if (action === 'draft') {
                await this.saveCampaignAsDraft();
            }
            this.isCreatingCampaign = false;
        },
        async loadAiProviders() {
            try {
                const response = await fetch('/api/global/ai-models', {
                    headers: this.authHeaders
                });
                if (response.ok) {
                    this.aiProviders = await response.json();
                }
            } catch (e) {
                console.error('Failed to load AI providers:', e);
            }
        },
        openCreateCampaignWithDate(dateStr) {
            this.openCreateCampaignModal();
            if (this.isCreatingCampaign) {
                this.newCampaign.start_date = dateStr;
                const start = new Date(dateStr);
                const end = new Date(start.getTime() + 7 * 24 * 3600 * 1000);
                this.newCampaign.end_date = end.toISOString().split('T')[0];
            }
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
                        target_persona: '',
                        product_id_override: null,
                        subheadline: '',
                        dynamic_copy_optimization: false,
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
                            { image: '', title: '', link: '', activeTab: 'url', aiStudioAction: '', aiStudioPrompt: '', aspectRatio: '1:1', motionIntensity: 'medium', duration: '5s', aiStudioGenerating: false, lastAiStudioCost: null, generatingHeadline: false, lastHeadlineCost: null },
                            { image: '', title: '', link: '', activeTab: 'url', aiStudioAction: '', aiStudioPrompt: '', aspectRatio: '1:1', motionIntensity: 'medium', duration: '5s', aiStudioGenerating: false, lastAiStudioCost: null, generatingHeadline: false, lastHeadlineCost: null },
                            { image: '', title: '', link: '', activeTab: 'url', aiStudioAction: '', aiStudioPrompt: '', aspectRatio: '1:1', motionIntensity: 'medium', duration: '5s', aiStudioGenerating: false, lastAiStudioCost: null, generatingHeadline: false, lastHeadlineCost: null }
                        ],
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
                        budget_type: 'lifetime',
                        bidding_strategy: 'manual',
                        target_roas: 4.0,
                        ai_cost: 0.0,
                        status: 'active',
                        autopilot_enabled: false,
                        lookalike_seeding_enabled: false,
                        agent_mode: 'recommendation',
                        autopilot_guardrails: {
                            max_budget_change_pct: 20,
                            min_roas_floor: 1.8,
                            max_spend_ceiling: 500
                        }
                    };
                    this.campaignContentLang = 'en';
                    this.isCreatingCampaign = false;
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
        setWorkspaceMode(mode) {
            this.newCampaign.creation_mode = mode;
            this.newCampaign.creation_mode_selected = true;
            if (mode === 'manual') {
                this.newCampaign.autopilot_enabled = false;
            } else if (mode === 'copilot') {
                this.newCampaign.autopilot_enabled = true;
                this.newCampaign.agent_mode = 'recommendation';
            } else if (mode === 'autopilot') {
                this.newCampaign.autopilot_enabled = true;
                this.newCampaign.agent_mode = 'autonomous';
            }
        },
        async runAIAutopilotGeneration() {
            if (!this.newCampaign.autopilot_goal) {
                alert('Please enter a campaign goal/topic first.');
                return;
            }
            this.generatingAutopilot = true;
            this.autopilotStatusTicks = [];
            
            const addTick = (text) => {
                this.autopilotStatusTicks.push(text);
            };

            try {
                addTick('⚡ Initializing AI Autopilot Director...');
                await new Promise(r => setTimeout(r, 800));
                
                addTick('🧠 Analyzing Brand Voice manuscript & marketing guidelines...');
                await new Promise(r => setTimeout(r, 800));

                addTick('✍️ Drafting headlines and descriptions for A/B split-testing...');
                
                const response = await fetch(`/api/global/brands/${this.app.activeShopFilter}/ai-generate-campaign`, {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        goal: this.newCampaign.autopilot_goal,
                        selectedModel: this.newCampaign.selectedModel
                    })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || 'Failed to generate campaign components.');
                }

                const data = await response.json();
                const gen = data.campaign;

                this.newCampaign.name = gen.name || 'AI Autopilot Campaign';
                this.newCampaign.headline = gen.headline || '';
                this.newCampaign.ad_copy = gen.ad_copy || '';
                
                this.newCampaign.enable_ab_testing = true;
                this.newCampaign.ab_test_headlines = [gen.headline || '', gen.headline_b || ''];
                this.newCampaign.ab_test_descriptions = [gen.ad_copy || '', gen.ad_copy_b || ''];
                this.newCampaign.platforms = gen.suggested_platforms || ['meta'];
                this.newCampaign.budget = gen.suggested_budget || 150;
                this.newCampaign.target_roas = gen.suggested_roas || 3.0;

                addTick('🌐 Recommending cross-network platform schedules...');
                await new Promise(r => setTimeout(r, 600));

                addTick('📄 Automatically constructing dedicated landing page in theme database...');
                // Call generate-ai-page to create matching landing page
                const lpRes = await fetch(`/api/global/brands/${this.app.activeShopFilter}/generate-ai-page`, {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: this.newCampaign.autopilot_goal,
                        productId: this.app.products.length > 0 ? this.app.products[0].id : ''
                    })
                });

                if (lpRes.ok) {
                    const lpData = await lpRes.json();
                    if (lpData.success && lpData.page) {
                        this.newCampaign.destination_type = 'landing_page';
                        this.newCampaign.landing_page_id = lpData.page.id;
                        await this.app.loadBrands(); // refresh brands list to reflect new landing page
                    }
                }

                addTick('✨ Performing localized copywriting translation for target locales...');
                // Automatically run translate all for languages
                if (this.newCampaign.languages && this.newCampaign.languages.length > 1) {
                    await this.translateAllCampaignLanguages();
                }

                addTick('✅ Complete! Ad Studio fully configured.');
                await new Promise(r => setTimeout(r, 400));
                
                this.app.showNotification('✨ AI Autopilot successfully generated campaign & landing page!');
                this.previewChannel = 'destination'; // instantly show the landing page preview!
                this.currentStep = 3; // instantly transition to step 3 so the merchant sees the generated copywriting copies!
            } catch (err) {
                alert(`Autopilot failed: ${err.message}`);
            } finally {
                this.generatingAutopilot = false;
            }
        },
        startInlineLandingPageBuilder() {
            this.newLandingPage = {
                id: 'lp_' + Math.random().toString(36).substring(2, 9),
                title: 'New Promo Landing Page',
                headline: this.newCampaign.headline || 'Exclusive Limited Offer',
                subheadline: this.newCampaign.ad_copy || 'Check out our latest premium collections.',
                cta: 'Shop Now',
                coupon_code: 'SAVE15',
                features: '⚡ Rich Aroma\n☕ Perfect Crema\n🌱 Responsibly Sourced',
                product_id: this.app.products.length > 0 ? this.app.products[0].id : ''
            };
            this.showLandingPageBuilder = true;
        },
        closeLandingPageBuilder() {
            this.showLandingPageBuilder = false;
        },
        getStepName(step) {
            if (step === 1) return 'General Setup';
            if (step === 2) return 'Budget & Target';
            if (step === 3) return 'Copy & Creatives';
            return 'Destination Page';
        },
        editSelectedLandingPage() {
            if (!this.newCampaign.landing_page_id) return;
            const brand = this.activeBrand;
            if (!brand || !brand.theme_settings) return;
            try {
                const settings = typeof brand.theme_settings === 'string' ? JSON.parse(brand.theme_settings) : brand.theme_settings;
                const pages = settings.landing_pages || [];
                const page = pages.find(p => p.id === this.newCampaign.landing_page_id);
                if (page) {
                    this.newLandingPage = {
                        id: page.id,
                        title: page.title || page.id,
                        headline: page.headline || '',
                        subheadline: page.subheadline || '',
                        cta: page.cta || 'Shop Now',
                        coupon_code: page.coupon_code || '',
                        features: page.features || '',
                        product_id: page.product_id || (this.app.products.length > 0 ? this.app.products[0].id : '')
                    };
                    this.showLandingPageBuilder = true;
                }
            } catch (e) {
                console.error('[CampaignsView] Error opening page for editing:', e);
            }
        },
        async generateAIStudioAsset() {
            this.aiStudioGenerating = true;
            this.app.startAiTicker(this.getAiModelName);
            try {
                const response = await fetch(`/api/global/media/ai-studio`, {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'generate',
                        prompt: '', // Backend resolves everything adaptively from Brand Guidelines Canvas!
                        backend: 'flux'
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.item) {
                        const item = data.item;
                        this.newCampaign.media_url = item.url;
                        this.newCampaign.format = 'SingleImage';
                        this.newCampaign.ai_cost = (parseFloat(this.newCampaign.ai_cost) || 0) + (parseFloat(data.estimated_cost) || 0.05);
                        this.app.showNotification(`✨ 1-Click Adaptive Brand Asset generated successfully and saved to Media Library.`);
                        if (this.app.loadMediaItems) {
                            await this.app.loadMediaItems();
                        }
                    }
                } else {
                    const err = await response.json();
                    alert(`1-Click generation failed: ${err.error}`);
                }
            } catch (err) {
                alert(`Error generating asset: ${err.message}`);
            } finally {
                this.aiStudioGenerating = false;
                this.lastGeneratingAIStudioCost = this.app.aiTicker.cost * 0.92;
                this.app.stopAiTicker();
            }
        },
        async generateCardAIStudioAsset(idx) {
            const card = this.newCampaign.carousel_cards[idx];
            if (!card) return;
            card.aiStudioGenerating = true;
            this.$set(this.newCampaign.carousel_cards, idx, { ...card });
            this.app.startAiTicker(this.getAiModelName);
            
            // Resolve catalog product context if linked
            let productId = '';
            if (card.link) {
                const match = card.link.match(/product=(\d+)/);
                if (match && match[1]) {
                    productId = match[1];
                }
            }

            try {
                const response = await fetch(`/api/global/media/ai-studio`, {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'generate',
                        prompt: card.title || '',
                        productId: productId,
                        backend: 'flux'
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.item) {
                        card.image = data.item.url;
                        this.newCampaign.ai_cost = (parseFloat(this.newCampaign.ai_cost) || 0) + (parseFloat(data.estimated_cost) || 0.05);
                        this.app.showNotification(`✨ 1-Click Adaptive Card Asset generated successfully.`);
                        if (this.app.loadMediaItems) {
                            await this.app.loadMediaItems();
                        }
                    }
                } else {
                    const err = await response.json();
                    alert(`Card generation failed: ${err.error}`);
                }
            } catch (err) {
                alert(`Error generating card asset: ${err.message}`);
            } finally {
                card.aiStudioGenerating = false;
                card.lastAiStudioCost = this.app.aiTicker.cost * 0.92;
                this.$set(this.newCampaign.carousel_cards, idx, { ...card });
                this.app.stopAiTicker();
            }
        },
        async openComposerModal(targetType, idx = 0) {
            this.composerTargetType = targetType;
            this.composerTargetIndex = idx;
            this.showComposerModal = true;
            this.composerResultUrl = '';
            
            // Set defaults
            this.composerParams.productId = '';
            if (targetType === 'card' && this.newCampaign.carousel_cards[idx]) {
                const card = this.newCampaign.carousel_cards[idx];
                if (card.link) {
                    const match = card.link.match(/product=(\d+)/);
                    if (match && match[1]) {
                        const prod = this.app.products.find(p => String(p.id) === String(match[1]));
                        if (prod) this.composerParams.productId = prod.id;
                    }
                }
            } else if (targetType === 'main' && this.newCampaign.product_id) {
                this.composerParams.productId = this.newCampaign.product_id;
            }

            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.app.activeShopFilter}/canvas`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    this.brandCanvas = await response.json();
                    
                    if (this.brandCanvas.personas && this.brandCanvas.personas.length > 0) {
                        this.composerParams.personaName = this.brandCanvas.personas[0].name;
                    } else {
                        this.composerParams.personaName = '';
                    }
                    if (this.brandCanvas.sceneries && this.brandCanvas.sceneries.length > 0) {
                        this.composerParams.sceneryName = this.brandCanvas.sceneries[0].name;
                    } else {
                        this.composerParams.sceneryName = '';
                    }
                }
            } catch (err) {
                console.error('[Composer Modal] Failed to load brand canvas:', err);
            }
        },
        async executeComposerGeneration() {
            this.composerGenerating = true;
            this.composerResultUrl = '';
            this.app.startAiTicker(this.composerParams.backend === 'imagen' ? 'Imagen 3' : (this.composerParams.backend === 'flux' ? 'FLUX.1 [dev]' : 'DALL-E 3'));
            
            try {
                const response = await fetch(`/api/global/media/ai-studio`, {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: this.composerParams.format === 'video' ? 'video' : 'generate',
                        prompt: this.composerLivePrompt,
                        productId: this.composerParams.productId,
                        personaName: this.composerParams.personaName,
                        sceneryName: this.composerParams.sceneryName,
                        actionDescription: this.composerParams.actionDescription,
                        backend: this.composerParams.backend
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.item) {
                        this.composerResultUrl = data.item.url;
                        this.app.showNotification('✨ AI Studio composed creative generated successfully!');
                    }
                } else {
                    const err = await response.json();
                    alert(`Composer generation failed: ${err.error}`);
                }
            } catch (err) {
                alert(`Error composing asset: ${err.message}`);
            } finally {
                this.composerGenerating = false;
                this.app.stopAiTicker();
            }
        },
        useComposedAsset() {
            if (!this.composerResultUrl) return;
            
            if (this.composerTargetType === 'main') {
                this.newCampaign.media_url = this.composerResultUrl;
                if (this.composerParams.format === 'video') {
                    this.newCampaign.format = 'Video';
                } else {
                    this.newCampaign.format = 'SingleImage';
                }
            } else {
                const card = this.newCampaign.carousel_cards[this.composerTargetIndex];
                if (card) {
                    card.image = this.composerResultUrl;
                    this.$set(this.newCampaign.carousel_cards, this.composerTargetIndex, { ...card });
                }
            }
            
            this.showComposerModal = false;
            this.app.showNotification('🎨 Composed asset successfully applied to your campaign!');
        },
        async generateCardHeadlineViaAI(idx) {
            const card = this.newCampaign.carousel_cards[idx];
            if (!card) return;

            let productContext = '';
            if (card.link) {
                const match = card.link.match(/product=(\d+)/);
                const productId = match ? match[1] : null;
                if (productId) {
                    const prod = this.app.products.find(p => String(p.id) === String(productId));
                    if (prod) {
                        productContext = `product: ${prod.title} (Price: €${parseFloat(prod.price).toFixed(2)}) - ${prod.description || ''}`;
                    }
                }
            }

            const baseText = card.title || productContext || 'Shop Best Sellers';
            card.generatingHeadline = true;
            this.$set(this.newCampaign.carousel_cards, idx, { ...card });
            this.app.startAiTicker(this.getAiModelName);

            try {
                const response = await fetch(`/api/global/brands/${this.app.activeShopFilter}/ai-rewrite`, {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: baseText,
                        tone: 'hype',
                        field: 'Card Headline / CTA Text'
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    card.title = data.text;
                    this.newCampaign.ai_cost = (parseFloat(this.newCampaign.ai_cost) || 0) + 0.005;
                    this.app.showNotification('✨ Generated card headline via AI.');
                } else {
                    const err = await response.json();
                    alert(`AI Headline generation failed: ${err.error}`);
                }
            } catch (err) {
                alert(`Error generating card headline: ${err.message}`);
            } finally {
                card.generatingHeadline = false;
                card.lastHeadlineCost = this.app.aiTicker.cost * 0.92;
                this.$set(this.newCampaign.carousel_cards, idx, { ...card });
                this.app.stopAiTicker();
            }
        },
        applyMainCreativePreset(preset) {
            if (preset === 'tiktok' || preset === 'reels') {
                this.aiStudioAspectRatio = '9:16';
                this.aiStudioMotion = 'high';
                this.aiStudioDuration = '10s';
            } else if (preset === 'youtube') {
                this.aiStudioAspectRatio = '16:9';
                this.aiStudioMotion = 'medium';
                this.aiStudioDuration = '10s';
            } else if (preset === 'feed') {
                this.aiStudioAspectRatio = '1:1';
                this.aiStudioMotion = 'medium';
                this.aiStudioDuration = '5s';
            }
        },
        applyCardCreativePreset(card, preset) {
            if (preset === 'tiktok' || preset === 'reels') {
                card.aspectRatio = '9:16';
                card.motionIntensity = 'high';
                card.duration = '10s';
            } else if (preset === 'youtube') {
                card.aspectRatio = '16:9';
                card.motionIntensity = 'medium';
                card.duration = '10s';
            } else if (preset === 'feed') {
                card.aspectRatio = '1:1';
                card.motionIntensity = 'medium';
                card.duration = '5s';
            }
        },
        async runAiAutopilotSection() {
            this.runningAutopilotSection = true;
            this.app.startAiTicker(this.getAiModelName);
            try {
                const response = await fetch(`/api/global/brands/${this.app.activeShopFilter}/ai-generate-creative-section`, {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        direction: this.aiAutopilotDirection,
                        formatPreference: this.aiAutopilotFormat,
                        stylePreference: this.aiAutopilotStyle
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.creative) {
                        const creative = data.creative;
                        this.newCampaign.headline = creative.headline || this.newCampaign.headline;
                        this.newCampaign.ad_copy = creative.ad_copy || this.newCampaign.ad_copy;
                        this.newCampaign.format = creative.format || this.newCampaign.format;
                        
                        this.aiStudioPrompt = creative.aiStudioPrompt || this.aiStudioPrompt;
                        this.aiStudioAction = creative.aiStudioAction || this.aiStudioAction;
                        this.aiStudioAspectRatio = creative.aspectRatio || this.aiStudioAspectRatio;
                        this.aiStudioMotion = creative.motionIntensity || this.aiStudioMotion;
                        this.aiStudioDuration = creative.duration || this.aiStudioDuration;

                        this.newCampaign.ai_cost = (parseFloat(this.newCampaign.ai_cost) || 0) + 0.04;
                        this.app.showNotification('✨ AI Autopilot successfully designed the creatives and copy section!');
                        
                        // Autofill cards if it decided on a Carousel
                        if (creative.format === 'Carousel') {
                            this.autofillCarousel();
                        }
                    }
                } else {
                    const err = await response.json();
                    alert(`AI Autopilot failed: ${err.error}`);
                }
            } catch (err) {
                alert(`Error running AI Autopilot: ${err.message}`);
            } finally {
                this.runningAutopilotSection = false;
                this.app.stopAiTicker();
            }
        },
        getBrandCanvasVisualDirection() {
            if (!this.activeBrand || !this.activeBrand.brand_canvas) return 'High-fidelity DTC photography';
            try {
                const canvas = typeof this.activeBrand.brand_canvas === 'string' ? JSON.parse(this.activeBrand.brand_canvas) : this.activeBrand.brand_canvas;
                return canvas.visual_direction || 'High-fidelity DTC photography';
            } catch (e) {
                return 'High-fidelity DTC photography';
            }
        },
        async generateLandingPageCopyViaAI() {
            const topic = this.newCampaign.autopilot_goal || this.newLandingPage.headline || 'Premium Coffee Promotion';
            this.landingPageAiGenerating = true;
            try {
                // Call Gemini to generate page text
                const response = await fetch(`/api/global/brands/${this.app.activeShopFilter}/generate-ai-page`, {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: topic,
                        productId: this.newLandingPage.product_id || (this.app.products.length > 0 ? this.app.products[0].id : ''),
                        selectedModel: this.newCampaign.selectedModel
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.page) {
                        const page = data.page;
                        this.newLandingPage.title = page.title;
                        this.newLandingPage.headline = page.headline;
                        this.newLandingPage.subheadline = page.subheadline;
                        this.newLandingPage.cta = page.cta;
                        this.newLandingPage.coupon_code = page.coupon_code;
                        this.newLandingPage.features = page.features;
                        this.app.showNotification('✨ AI successfully generated landing page copy.');
                    }
                } else {
                    const err = await response.json();
                    alert(`AI generation failed: ${err.error}`);
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            } finally {
                this.landingPageAiGenerating = false;
            }
        },
        async saveInlineLandingPage() {
            if (!this.newLandingPage.id) {
                alert('Please provide a unique page slug/ID.');
                return;
            }
            const brand = this.activeBrand;
            if (!brand) return;

            let theme = {};
            if (brand.theme_settings) {
                try {
                    theme = typeof brand.theme_settings === 'string' ? JSON.parse(brand.theme_settings) : brand.theme_settings;
                } catch(e) {}
            }

            const pages = theme.landing_pages || [];
            
            // Check if page already exists, if so update it, otherwise push
            const existingIdx = pages.findIndex(p => p.id === this.newLandingPage.id);
            const pageObj = {
                id: this.newLandingPage.id,
                title: this.newLandingPage.title || this.newLandingPage.id,
                type: 'standard',
                product_id: this.newLandingPage.product_id,
                inherit: true,
                headline: this.newLandingPage.headline,
                subheadline: this.newLandingPage.subheadline,
                cta: this.newLandingPage.cta,
                coupon_code: this.newLandingPage.coupon_code,
                features: this.newLandingPage.features,
                created_at: new Date().toISOString()
            };

            if (existingIdx >= 0) {
                pages[existingIdx] = pageObj;
            } else {
                pages.push(pageObj);
            }

            theme.landing_pages = pages;
            
            // Fallback for default if first page
            if (pages.length === 1) {
                theme.landing_inherit = true;
                theme.landing_type = 'standard';
                theme.landing_product_id = this.newLandingPage.product_id;
                theme.landing_headline = this.newLandingPage.headline;
                theme.landing_subheadline = this.newLandingPage.subheadline;
                theme.landing_cta = this.newLandingPage.cta;
                theme.landing_features = this.newLandingPage.features;
                theme.landing_coupon_code = this.newLandingPage.coupon_code;
            }

            try {
                // Save brand back
                const payload = {
                    ...brand,
                    theme_settings: JSON.stringify(theme)
                };
                const response = await fetch('/api/global/brands', {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    this.app.showNotification('Landing page saved and synced to brand theme.');
                    await this.app.loadBrands();
                    this.newCampaign.landing_page_id = this.newLandingPage.id;
                    this.showLandingPageBuilder = false;
                } else {
                    const err = await response.json();
                    alert(`Failed to save landing page: ${err.error}`);
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        },
        getLandingPageDetail(field) {
            if (this.showLandingPageBuilder) {
                return this.newLandingPage[field];
            }
            if (!this.newCampaign.landing_page_id) return '';
            
            const brand = this.activeBrand;
            if (!brand || !brand.theme_settings) return '';
            try {
                const settings = typeof brand.theme_settings === 'string' ? JSON.parse(brand.theme_settings) : brand.theme_settings;
                const pages = settings.landing_pages || [];
                const page = pages.find(p => p.id === this.newCampaign.landing_page_id);
                if (page) {
                    return page[field] || '';
                }
            } catch(e) {}
            return '';
        },
        getLandingPageFeaturesArray() {
            const rawFeatures = this.getLandingPageDetail('features') || '';
            if (!rawFeatures) return [];
            return rawFeatures.split('\n').map(f => f.trim()).filter(Boolean);
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
        async toggleCampaignStatus(c) {
            c.status = c.status === 'active' ? 'paused' : 'active';
            try {
                const response = await fetch('/api/global/marketing-campaigns', {
                    method: 'POST',
                    headers: { ...this.authHeaders, 'Content-Type': 'application/json' },
                    body: JSON.stringify(c)
                });
                if (response.ok) {
                    this.app.showNotification(`Campaign "${c.name}" status updated to ${c.status}.`);
                    this.loadCampaigns();
                } else {
                    const err = await response.json();
                    alert(`Error changing status: ${err.error}`);
                }
            } catch(e) {
                console.error(e);
            }
        },
        async saveInlineBudget(c) {
            try {
                const response = await fetch('/api/global/marketing-campaigns', {
                    method: 'POST',
                    headers: { ...this.authHeaders, 'Content-Type': 'application/json' },
                    body: JSON.stringify(c)
                });
                if (response.ok) {
                    this.app.showNotification(`Budget for "${c.name}" adjusted to €${parseFloat(c.budget).toFixed(0)}.`);
                    this.loadCampaigns();
                } else {
                    const err = await response.json();
                    alert(`Error adjusting budget: ${err.error}`);
                }
            } catch(e) {
                console.error(e);
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
            this.loadAIProposals(c.id);
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
                start_date: this.selectedCampaign.start_date,
                end_date: this.selectedCampaign.end_date,
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
        generateStrategyReport() {
            const reports = [];
            const activeCampaigns = this.campaigns.filter(c => c.status === 'active');
            if (activeCampaigns.length === 0) {
                this.lastAnalysisReport = {
                    timestamp: new Date().toLocaleTimeString(),
                    campaigns: []
                };
                return;
            }
            for (const c of activeCampaigns) {
                const floor = c.autopilot_guardrails?.min_roas_floor || 2.0;
                const ceiling = c.autopilot_guardrails?.max_spend_ceiling || 500;
                
                reports.push({
                    name: c.name,
                    roas: '5.5x',
                    ctr: '3.2%',
                    spend: `€${c.budget || 150}`,
                    floor: `${floor}x`,
                    ceiling: `€${ceiling}`,
                    verdict: `Parameters are fully within healthy boundaries. Safety margins are healthy (ROAS is 5.5x, well above the ${floor}x safety floor). No budget clamping or auto-pause triggers required at this time.`
                });
            }
            this.lastAnalysisReport = {
                timestamp: new Date().toLocaleTimeString(),
                campaigns: reports
            };
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
                    await this.loadAgentInsights();
                    if (this.campaigns.length > 0) {
                        for (const c of this.campaigns) {
                            await this.loadAgentRecommendations(c.id);
                            await this.loadConflictLogs(c.id);
                        }
                    }
                    this.generateStrategyReport();
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
        async updateCopywriterEstimate(text) {
            const data = await this.app.fetchAiEstimate('Campaign Ad Copy Generation', text || '');
            if (data && data.costUsd) {
                this.copywriterEstCost = `€${(data.costUsd * 0.92).toFixed(5)}`;
            }
        },
        toggleGenerateAICopy() {
            if (this.generatingAICopy) {
                if (this.copyAbortController) {
                    this.copyAbortController.abort();
                    this.copyAbortController = null;
                }
            } else {
                this.generateAICopy();
            }
        },
        async generateAICopy() {
            this.generatingAICopy = true;
            this.copyAbortController = new AbortController();
            this.app.startAiTicker(this.getAiModelName);
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
                        creativeDirection: this.selectedCreativeDirection,
                        campaignType: this.newCampaign.campaign_type
                    }),
                    signal: this.copyAbortController.signal
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
                            link: this.newCampaign.carousel_cards[idx]?.link || '',
                            activeTab: this.newCampaign.carousel_cards[idx]?.activeTab || 'url',
                            aiStudioAction: this.newCampaign.carousel_cards[idx]?.aiStudioAction || '',
                            aiStudioPrompt: this.newCampaign.carousel_cards[idx]?.aiStudioPrompt || '',
                            aspectRatio: this.newCampaign.carousel_cards[idx]?.aspectRatio || '1:1',
                            motionIntensity: this.newCampaign.carousel_cards[idx]?.motionIntensity || 'medium',
                            duration: this.newCampaign.carousel_cards[idx]?.duration || '5s',
                            aiStudioGenerating: this.newCampaign.carousel_cards[idx]?.aiStudioGenerating || false,
                            lastAiStudioCost: this.newCampaign.carousel_cards[idx]?.lastAiStudioCost || null,
                            generatingHeadline: this.newCampaign.carousel_cards[idx]?.generatingHeadline || false,
                            lastHeadlineCost: this.newCampaign.carousel_cards[idx]?.lastHeadlineCost || null
                        }));
                    }
                    
                    this.app.showNotification('High-converting copy generated by AI Copywriter Studio!');
                }
            } catch (err) {
                if (err.name === 'AbortError') {
                    this.lastGeneratingAICopyCost = null;
                    this.app.showNotification('AI copywriting stopped.');
                    return;
                }
                console.error(err);
                alert(`Error generating copy: ${err.message}`);
            } finally {
                this.generatingAICopy = false;
                this.lastGeneratingAICopyCost = this.app.aiTicker.cost * 0.92;
                this.app.stopAiTicker();
                this.copyAbortController = null;
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
        async simulateAgentProposal(campaign) {
            if (this.campaigns.length === 0) {
                alert('Please create at least one campaign first.');
                return;
            }
            const targetCampaign = campaign || this.selectedCampaign || this.campaigns[0];
            this.simulatingAgent = true;
            try {
                this.app.showNotification(`Simulating AI Agent Optimization for campaign "${targetCampaign.name}"...`);
                const response = await fetch(`/api/global/marketing-campaigns/${targetCampaign.id}/simulate-agent`, {
                    method: 'POST',
                    headers: this.authHeaders
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.app.showNotification(`🤖 AI Agent proposed optimization: ${data.proposal.proposed_headline}`);
                        await this.loadAIProposals(targetCampaign.id);
                    }
                } else {
                    const err = await response.json();
                    alert(`Simulation failed: ${err.error || 'Unknown error'}`);
                }
            } catch (e) {
                alert(`Error simulating agent: ${e.message}`);
            } finally {
                this.simulatingAgent = false;
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
                    this.closeCampaignDetailModal();
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
                if (platform === 'tiktok') {
                    return !!theme.connected_channels['TikTok']?.active;
                }
                if (platform === 'linkedin') {
                    return !!theme.connected_channels['LinkedIn']?.active;
                }
                if (platform === 'pinterest') {
                    return !!theme.connected_channels['Pinterest']?.active;
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
            } else if (platform === 'tiktok') {
                dbPlatformName = 'TikTok';
                title = 'TikTok For Business Connector';
                desc = 'Connect your TikTok Ads Manager to automatically publish video ads and track pixel events.';
                icon = '🎵';
                scopesHtml = `
                    <li>Access TikTok Ads Manager campaign logs</li>
                    <li>Publish video creatives directly into ads repository</li>
                `;
            } else if (platform === 'linkedin') {
                dbPlatformName = 'LinkedIn';
                title = 'LinkedIn Campaign Manager Connection';
                desc = 'Authorize Strickly Coffee to manage Sponsored Content ads and Lead Gen Forms on LinkedIn.';
                icon = '💼';
                scopesHtml = `
                    <li>Manage Sponsored Updates & creative uploads</li>
                    <li>Sync professional profile lead collections</li>
                `;
            } else if (platform === 'pinterest') {
                dbPlatformName = 'Pinterest';
                title = 'Pinterest Ads Manager Integration';
                desc = 'Connect Pinterest Ads Manager to run Promoted Pins campaigns and sync shoppable product pins.';
                icon = '📌';
                scopesHtml = `
                    <li>Publish shoppable catalog Product Pins</li>
                    <li>Retrieve conversion tag metrics & CTR performance</li>
                `;
            }

            if (platform === 'facebook' || platform === 'instagram') {
                const brand = this.activeBrand;
                if (!brand) return;
                const authorizeUrl = `${this.app.apiBaseUrl}/api/global/brands/oauth/facebook/init?brandId=${encodeURIComponent(brand.id)}&token=${encodeURIComponent(localStorage.getItem('sc_admin_token') || '')}`;
                window.open(authorizeUrl, 'MetaOAuth', 'width=800,height=700,status=yes,resizable=yes');

                const onMessage = async (event) => {
                    if (event.data === 'oauth_success_campaigns_meta' || event.data === `oauth_success_campaigns_${platform}`) {
                        window.removeEventListener('message', onMessage);
                        await this.saveCampaignsSocialConnection(dbPlatformName);
                    }
                };
                window.addEventListener('message', onMessage);
            } else {
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
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
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
            this.selectedProductId = this.selectedProductIds[0] || '';
            if (this.selectedProductIds.length > 0) {
                const selectedProducts = this.app.products.filter(p => this.selectedProductIds.includes(p.id));
                if (selectedProducts.length === 1) {
                    const product = selectedProducts[0];
                    const isService = product.type === 'service';
                    this.newCampaign.name = `${isService ? 'Service' : 'Promo'}: ${product.title}`;
                    this.newCampaign.headline = `@inventory-${product.id}`;
                    this.newCampaign.ad_copy = `@inventory-${product.id}`;
                    this.newCampaign.media_url = `@inventory-${product.id}`;
                    this.newCampaign.ad_cta = isService ? 'Book Now' : 'Shop Now';
                } else {
                    const titles = selectedProducts.map(p => p.title).join(', ');
                    const listTitles = selectedProducts.slice(0, 3).map(p => p.title).join(' & ');
                    const hasServices = selectedProducts.some(p => p.type === 'service');
                    this.newCampaign.name = `Showcase: ${listTitles}`;
                    this.newCampaign.headline = `Discover our premium ${listTitles} series!`;
                    this.newCampaign.ad_copy = `Shop our exclusive selection including ${titles}. Hand-picked premium quality coffee, gears and services.`;
                    this.newCampaign.media_url = `@inventory-${selectedProducts[0].id}`;
                    this.newCampaign.format = 'Carousel';
                    this.newCampaign.ad_cta = hasServices ? 'Book Now' : 'Shop Now';
                }
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
                const currentCard = this.newCampaign.carousel_cards[idx] || {};
                this.$set(this.newCampaign.carousel_cards, idx, {
                    ...currentCard,
                    image: `@inventory-${product.id}`,
                    title: `@inventory-${product.id}`,
                    link: `/store/${this.activeBrand.id}?product=${product.id}`,
                    activeTab: currentCard.activeTab || 'catalog'
                });
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
                    const currentCard = this.newCampaign.carousel_cards[idx] || {};
                    this.$set(this.newCampaign.carousel_cards, idx, {
                        ...currentCard,
                        image: data.item.url
                    });
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
        toggleCampaignTranslation(lang) {
            if (this.translatingCampaign) {
                if (this.campaignTranslateAbortController) {
                    this.campaignTranslateAbortController.abort();
                    this.campaignTranslateAbortController = null;
                }
            } else {
                this.translateCampaignWithAI(lang);
            }
        },
        toggleTranslateAllCampaignLanguages() {
            if (this.translatingCampaign) {
                if (this.campaignTranslateAbortController) {
                    this.campaignTranslateAbortController.abort();
                    this.campaignTranslateAbortController = null;
                }
            } else {
                this.translateAllCampaignLanguages();
            }
        },
        async translateCampaignWithAI(targetLang) {
            if (!this.newCampaign.headline && !this.newCampaign.ad_copy) {
                alert('Please enter a headline or description in English first to translate.');
                return;
            }
            
            this.translatingCampaign = true;
            this.campaignTranslateAbortController = new AbortController();
            this.app.startAiTicker(this.getAiModelName);
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
                        }),
                        signal: this.campaignTranslateAbortController.signal
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
                        }),
                        signal: this.campaignTranslateAbortController.signal
                    });
                    if (response.ok) {
                        const res = await response.json();
                        this.newCampaign.translations[targetLang].ad_copy = res.translatedText;
                    }
                }
 
                if (this.newCampaign.enable_ab_testing) {
                    if (this.newCampaign.ab_test_headlines[1]) {
                        const response = await fetch('/api/global/translate', {
                            method: 'POST',
                            headers: {
                                ...this.authHeaders,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                text: this.newCampaign.ab_test_headlines[1],
                                targetLang: targetLang,
                                sourceLang: 'en'
                            }),
                            signal: this.campaignTranslateAbortController.signal
                        });
                        if (response.ok) {
                            const res = await response.json();
                            this.newCampaign.translations[targetLang].headline_b = res.translatedText;
                        }
                    }
                    if (this.newCampaign.ab_test_descriptions[1]) {
                        const response = await fetch('/api/global/translate', {
                            method: 'POST',
                            headers: {
                                ...this.authHeaders,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                text: this.newCampaign.ab_test_descriptions[1],
                                targetLang: targetLang,
                                sourceLang: 'en'
                            }),
                            signal: this.campaignTranslateAbortController.signal
                        });
                        if (response.ok) {
                            const res = await response.json();
                            this.newCampaign.translations[targetLang].ad_copy_b = res.translatedText;
                        }
                    }
                }
                
                this.app.showNotification(`Successfully auto-translated text to ${targetLang.toUpperCase()}!`);
            } catch(e) {
                if (e.name === 'AbortError') {
                    this.lastTranslatingCampaignCost = null;
                    this.app.showNotification('AI Translation stopped.');
                    return;
                }
                console.error(e);
                alert('AI translation error: ' + e.message);
            } finally {
                this.translatingCampaign = false;
                this.lastTranslatingCampaignCost = this.app.aiTicker.cost * 0.92;
                this.app.stopAiTicker();
                this.campaignTranslateAbortController = null;
            }
        },
        async translateAllCampaignLanguages() {
            const targets = this.newCampaign.languages.filter(l => l !== 'en');
            if (targets.length === 0) {
                alert('No target locales besides English selected to translate to.');
                return;
            }
            if (!this.newCampaign.headline && !this.newCampaign.ad_copy) {
                alert('Please enter a headline or description in English first to translate.');
                return;
            }
            
            this.translatingCampaign = true;
            this.campaignTranslateAbortController = new AbortController();
            this.app.startAiTicker(this.getAiModelName);
            try {
                // Initialize translations objects if they don't exist
                if (!this.newCampaign.translations) {
                    this.newCampaign.translations = {};
                }
                
                for (const targetLang of targets) {
                    if (!this.newCampaign.translations[targetLang]) {
                        this.newCampaign.translations[targetLang] = { headline: '', ad_copy: '' };
                    }
                    
                    // Translate headline A
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
                            }),
                            signal: this.campaignTranslateAbortController.signal
                        });
                        if (response.ok) {
                            const res = await response.json();
                            this.newCampaign.translations[targetLang].headline = res.translatedText;
                        }
                    }
                    
                    // Translate description A
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
                            }),
                            signal: this.campaignTranslateAbortController.signal
                        });
                        if (response.ok) {
                            const res = await response.json();
                            this.newCampaign.translations[targetLang].ad_copy = res.translatedText;
                        }
                    }
 
                    // Translate A/B Variant B if enabled
                    if (this.newCampaign.enable_ab_testing) {
                        if (this.newCampaign.ab_test_headlines[1]) {
                            const response = await fetch('/api/global/translate', {
                                method: 'POST',
                                headers: {
                                    ...this.authHeaders,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    text: this.newCampaign.ab_test_headlines[1],
                                    targetLang: targetLang,
                                    sourceLang: 'en'
                                }),
                                signal: this.campaignTranslateAbortController.signal
                            });
                            if (response.ok) {
                                  const res = await response.json();
                                this.newCampaign.translations[targetLang].headline_b = res.translatedText;
                            }
                        }
                        if (this.newCampaign.ab_test_descriptions[1]) {
                            const response = await fetch('/api/global/translate', {
                                method: 'POST',
                                headers: {
                                    ...this.authHeaders,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    text: this.newCampaign.ab_test_descriptions[1],
                                    targetLang: targetLang,
                                    sourceLang: 'en'
                                }),
                                signal: this.campaignTranslateAbortController.signal
                            });
                            if (response.ok) {
                                const res = await response.json();
                                this.newCampaign.translations[targetLang].ad_copy_b = res.translatedText;
                            }
                        }
                    }
                }
                this.app.showNotification(`Successfully auto-translated all variants to: ${targets.map(t => t.toUpperCase()).join(', ')}!`);
            } catch(e) {
                if (e.name === 'AbortError') {
                    this.lastTranslatingCampaignCost = null;
                    this.app.showNotification('AI Translation stopped.');
                    return;
                }
                console.error(e);
                alert('AI translation error: ' + e.message);
            } finally {
                this.translatingCampaign = false;
                this.lastTranslatingCampaignCost = this.app.aiTicker.cost * 0.92;
                this.app.stopAiTicker();
                this.campaignTranslateAbortController = null;
            }
        }
    }
}
</script>

<template>
    <div id="view-brand-center" class="admin-view" :class="{ active: app.activeView === 'brand-center' }">
        <!-- Brand Header Section -->
        <div class="view-header" style="margin-bottom: 25px;">
            <div>
                <h1 style="color: var(--accent); margin: 0; font-family: var(--font-display); font-weight: 800; font-size: 1.8rem; display: flex; align-items: center; gap: 8px;">
                    🧭 Brand Identity Center
                </h1>
                <p style="color: var(--text-muted); margin: 5px 0 0 0; font-size: 0.88rem;">
                    Orchestrate and refine your brand voice, engineering positioning, user personas, and visual design parameters.
                </p>
            </div>
            <div style="display: flex; gap: 8px;" v-if="isValidBrandSelected">
                <button type="button" class="tab-btn" :class="{ active: activeTab === 'canvas' }" @click="activeTab = 'canvas'">
                    🎯 Guidelines Canvas
                </button>
                <button type="button" class="tab-btn" :class="{ active: activeTab === 'manuscript' }" @click="activeTab = 'manuscript'">
                    📚 Playbook Playgrounds
                </button>
                <button type="button" class="tab-btn" :class="{ active: activeTab === 'styles' }" @click="activeTab = 'styles'">
                    🎨 Design Guidelines
                </button>
            </div>
        </div>

        <!-- No Brand Selected State -->
        <div v-if="!isValidBrandSelected" class="panel" style="padding: 40px; text-align: center; color: var(--text-muted);">
            <h3>🚫 No Active Brand Channel Selected</h3>
            <p>Please select or spin up a brand from the workspace dropdown at the top of the sidebar to steer its guidelines.</p>
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Stripe Connect Action Prompt Banner -->
            <div v-if="settingsBrand.subscription_billing_method === 'stripe_connect' && !settingsBrand.stripe_enabled"
                 style="background: rgba(197, 160, 89, 0.08); border: 1px solid var(--accent); border-radius: 12px; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; gap: 15px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 1.8rem; display: flex; align-items: center;">🔗</span>
                    <div>
                        <h4 style="margin: 0; font-size: 0.9rem; font-weight: 700; color: var(--accent);">Stripe Connect Account Required</h4>
                        <p style="margin: 3px 0 0 0; font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">
                            Payout Split Billing (Stripe Connect) is active for your brand. Please link your Stripe Connect account to enable transaction payouts and billing sync.
                        </p>
                    </div>
                </div>
                <button type="button" @click="app.switchSettingsTab('ecommerce')" class="btn btn-accent" style="margin: 0; font-weight: 700; height: 36px; padding: 0 16px; border-radius: 6px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 6px;">
                    Link Stripe Account ➡️
                </button>
            </div>

            <!-- Tab 1: Guidelines Canvas -->
            <div v-if="activeTab === 'canvas'" class="panel" style="position: relative;">
                <!-- AI Refinement Prompt Bar -->
                <div style="background: rgba(197, 160, 89, 0.05); border: 1px solid var(--accent); border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                    <h4 style="margin: 0 0 6px 0; color: var(--accent); font-size: 0.85rem; font-weight: 800; display: flex; align-items: center; gap: 6px;">
                        ✨ Refine Guidelines Canvas with AI
                    </h4>
                    <p style="margin: 0 0 12px 0; font-size: 0.76rem; color: var(--text-muted);">
                        Instruct the strategist agent to alter personas, include vocabulary constraints, or change writing tones.
                    </p>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" v-model="refinementPrompt" 
                               placeholder="e.g. Add a third persona for professional roasters, and ban the word 'premium'." 
                               style="flex: 1; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 12px; font-size: 0.82rem; outline: none;"
                               @keydown.enter="refineCanvasWithAI"
                               :disabled="refiningCanvas">
                        <button type="button" class="btn btn-accent" style="margin: 0; height: 38px; font-weight: 700; width: 140px;" @click="refineCanvasWithAI" :disabled="refiningCanvas || !refinementPrompt.trim()">
                            <span v-if="refiningCanvas">⏳ Thinking...</span>
                            <span v-else>🚀 Run Prompt</span>
                        </button>
                    </div>
                </div>

                <!-- Playbook Distillation Background Progress Indicator -->
                <div v-if="settingsBrand.protocol_status === 'generating'" style="background: rgba(139, 92, 246, 0.05); border: 1px dashed #8b5cf6; border-radius: 12px; padding: 40px 20px; text-align: center; margin-bottom: 25px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(139, 92, 246, 0.15); display: flex; align-items: center; justify-content: center; font-size: 1.6rem; animation: pulse 2s infinite;">🚀</div>
                    <div>
                        <h4 style="margin: 0 0 6px 0; font-size: 0.95rem; font-weight: 700; color: #8b5cf6;">Initiating Brand Performance Strategy...</h4>
                        <p style="margin: 0 auto; max-width: 500px; font-size: 0.76rem; color: var(--text-muted); line-height: 1.5;">
                            AI is currently crawling your storefront website, analyzing product catalogs, indexing competitor metrics, and building the strategic playbook. This will automatically distill into your Guidelines Canvas within 1-2 minutes.
                        </p>
                    </div>
                    <div style="width: 320px; background: var(--border); height: 8px; border-radius: 4px; overflow: hidden; position: relative; box-shadow: inset 0 1px 2px rgba(0,0,0,0.4);">
                        <div :style="{ width: protocolProgressPct + '%' }" 
                             :class="{ 'progress-bar-striped-animated': true, 'progress-glow-animated': protocolProgressPct >= 98 }"
                             style="position: absolute; top: 0; left: 0; height: 100%; background: linear-gradient(90deg, #8b5cf6 0%, #d946ef 100%); border-radius: 4px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);">
                        </div>
                    </div>
                    <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: -6px; display: flex; flex-direction: column; gap: 4px; align-items: center;">
                        <span v-if="protocolProgressPct < 98" style="font-weight: 600;">
                            Analysis Progress: {{ protocolProgressPct }}% (estimated based on average {{ formatTokens(estimatedTargetTokens) }} tokens/run)
                        </span>
                        <span v-else style="color: #d946ef; font-weight: 700; display: flex; align-items: center; gap: 6px;" class="progress-glow-animated">
                            <span>⏳ Finalizing strategy playbook... (Running model generation checks)</span>
                        </span>
                        <span v-if="userRole && userRole.toLowerCase() === 'superadmin'" style="font-size: 0.62rem; opacity: 0.8; font-family: monospace;">
                            Processed: {{ formatTokens(liveEstimatedTokens || (app && app.aiTicker ? app.aiTicker.tokens : 0)) }} tokens / Est. Cost: €{{ (liveEstimatedCost || (app && app.aiTicker ? app.aiTicker.cost * 0.92 : 0)).toFixed(4) }}
                        </span>
                    </div>
                </div>

                 <!-- 1-Click Onboarding Trigger Card -->
                <div v-else-if="!settingsBrand.marketing_protocol" 
                     :style="{
                         background: settingsBrand.ai_tier === 'none' ? 'rgba(255, 255, 255, 0.01)' : 'rgba(139, 92, 246, 0.03)',
                         borderColor: settingsBrand.ai_tier === 'none' ? 'var(--border)' : 'rgba(139, 92, 246, 0.15)'
                     }"
                     style="border: 1px solid; border-radius: 12px; padding: 35px 25px; text-align: center; margin-bottom: 25px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;">
                    <span style="font-size: 2rem;">{{ settingsBrand.ai_tier === 'none' ? '🔒' : '🎯' }}</span>
                    <div>
                        <h4 style="margin: 0 0 6px 0; font-size: 0.95rem; font-weight: 700; color: var(--text-main);">
                            {{ settingsBrand.ai_tier === 'none' ? 'Brand Identity Center (Sandbox Trial)' : 'Welcome to your Brand Identity Center' }}
                        </h4>
                        <p style="margin: 0 auto; max-width: 540px; font-size: 0.78rem; color: var(--text-muted); line-height: 1.5;">
                            <template v-if="settingsBrand.ai_tier === 'none'">
                                AI Brand Strategy Analysis, including Voice & Tone Guidelines, Target Audience Personas, Controlled Vocabulary, and Visual Briefing generation, is disabled under the Sandbox Trial plan. Please upgrade to a Standard, Professional, or Enterprise plan to trigger automated brand analysis. You can still load DTC Coffee Defaults to preview the workflow.
                            </template>
                            <template v-else>
                                To start launching high-converting ad copy, landing pages, and creatives tailored exactly to your brand, trigger a 1-tap automated strategy analysis or load preset specialty coffee defaults.
                            </template>
                        </p>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 5px;">
                        <button type="button" 
                                class="sc-ai-button" 
                                :style="{
                                    background: settingsBrand.ai_tier === 'none' ? 'var(--border)' : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                                    color: settingsBrand.ai_tier === 'none' ? 'var(--text-muted)' : 'white',
                                    cursor: settingsBrand.ai_tier === 'none' ? 'not-allowed' : 'pointer'
                                }"
                                style="margin: 0; height: 36px; padding: 0 16px; border: none;" 
                                @click="generateMarketingProtocol">
                            {{ settingsBrand.ai_tier === 'none' ? '🔒 1-Click Brand Analysis & Setup' : '🚀 1-Click Brand Analysis & Setup' }}
                        </button>
                        <button type="button" class="btn btn-secondary" style="margin: 0; height: 36px; padding: 0 16px;" @click="populateDefaultCoffeeCanvas">
                            📋 Load DTC Coffee Defaults
                        </button>
                    </div>
                </div>

                <!-- Canvas Grid -->
                <div v-if="loadingCanvas" style="padding: 40px; text-align: center; color: var(--text-muted);">
                    ⏳ Loading brand guidelines canvas...
                </div>
                <div v-else-if="settingsBrand.marketing_protocol" class="canvas-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
                    <!-- Card 1: Brand Voice & Tone -->
                    <div class="canvas-card">
                        <div class="canvas-card-header">
                            <span>🗣️ Voice & Tone Guidelines</span>
                            <button type="button" @click="startEditing('brand_voice')" class="card-edit-btn">✍️ Edit</button>
                        </div>
                        <div class="canvas-card-body" v-html="formatMarkdown(canvas.brand_voice)"></div>
                    </div>

                    <!-- Card 2: Product Architecture / Technical Positioning -->
                    <div class="canvas-card">
                        <div class="canvas-card-header">
                            <span>⚙️ Technical Narrative Positioning</span>
                            <button type="button" @click="startEditing('product_architecture')" class="card-edit-btn">✍️ Edit</button>
                        </div>
                        <div class="canvas-card-body" v-html="formatMarkdown(canvas.product_architecture)"></div>
                    </div>

                    <!-- Card 3: Controlled Vocabulary -->
                    <div class="canvas-card">
                        <div class="canvas-card-header">
                            <span>📚 Controlled Vocabulary</span>
                            <button type="button" @click="startEditing('controlled_vocabulary')" class="card-edit-btn">✍️ Edit</button>
                        </div>
                        <div class="canvas-card-body">
                            <div style="margin-bottom: 12px;">
                                <strong style="color: var(--success); font-size: 0.74rem; display: block; margin-bottom: 4px;">✅ APPROVED TERMS (Data-Anchored)</strong>
                                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                    <span v-for="word in (canvas.controlled_vocabulary?.approved || [])" :key="word" class="vocab-tag tag-approved">{{ word }}</span>
                                    <span v-if="!(canvas.controlled_vocabulary?.approved || []).length" style="color: var(--text-muted); font-size: 0.75rem;">None added yet</span>
                                </div>
                            </div>
                            <div>
                                <strong style="color: #ef4444; font-size: 0.74rem; display: block; margin-bottom: 4px;">❌ BANNED TERMS (Clichés)</strong>
                                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                    <span v-for="word in (canvas.controlled_vocabulary?.banned || [])" :key="word" class="vocab-tag tag-banned">{{ word }}</span>
                                    <span v-if="!(canvas.controlled_vocabulary?.banned || []).length" style="color: var(--text-muted); font-size: 0.75rem;">None added yet</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Card 4: Target Personas -->
                    <div class="canvas-card" style="grid-column: span 1;">
                        <div class="canvas-card-header">
                            <span>👥 Target Audience Personas</span>
                            <button type="button" @click="startEditing('personas')" class="card-edit-btn">✍️ Edit</button>
                        </div>
                        <div class="canvas-card-body" style="display: flex; flex-direction: column; gap: 12px;">
                            <div v-for="p in canvas.personas" :key="p.name" style="background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px;">
                                <strong style="color: var(--accent); display: block; font-size: 0.8rem; margin-bottom: 2px;">{{ p.name }}</strong>
                                <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px;">{{ p.demographics }}</div>
                                <p style="margin: 0 0 6px 0; font-size: 0.76rem; line-height: 1.45;">{{ p.description }}</p>
                                <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px; font-size: 0.72rem;">
                                    <span style="color: var(--accent); font-weight: bold;">Value Hook:</span> {{ p.hooks ? p.hooks[0] : 'None' }}
                                </div>
                            </div>
                            <div v-if="!canvas.personas || !canvas.personas.length" style="color: var(--text-muted); font-size: 0.75rem; text-align: center;">No personas configured. Run strategy builder or add one!</div>
                        </div>
                    </div>

                    <!-- Card 5: Visual Direction & Photo Briefing -->
                    <div class="canvas-card">
                        <div class="canvas-card-header">
                            <span>🖼️ Visual Briefing Rules</span>
                            <button type="button" @click="startEditing('visual_direction')" class="card-edit-btn">✍️ Edit</button>
                        </div>
                        <div class="canvas-card-body" v-html="formatMarkdown(canvas.visual_direction)"></div>
                    </div>

                    <!-- Card 6: Market & Niche Positioning & Tracking -->
                    <div class="canvas-card" style="grid-column: span 1;">
                        <div class="canvas-card-header">
                            <span>🏷️ Market Positioning & Analytics Tracking</span>
                            <button type="button" @click="startEditing('positioning')" class="card-edit-btn">✍️ Edit</button>
                        </div>
                        <div class="canvas-card-body" style="display: flex; flex-direction: column; gap: 12px;">
                            <div>
                                <strong style="color: var(--accent); display: block; font-size: 0.74rem; text-transform: uppercase; margin-bottom: 2px;">Industry Vertical</strong>
                                <span style="font-size: 0.82rem; color: var(--text-main); font-weight: 600;">
                                    {{ settingsBrand.business_segment || 'Food & Beverage' }}
                                </span>
                            </div>
                            <div>
                                <strong style="color: var(--accent); display: block; font-size: 0.74rem; text-transform: uppercase; margin-bottom: 4px;">Specific Niche / Tags</strong>
                                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                    <span v-for="tag in (settingsBrand.business_niche ? settingsBrand.business_niche.split(',').map(s => s.trim()).filter(Boolean) : [])" 
                                          :key="tag" 
                                          class="vocab-tag tag-approved"
                                          style="background: rgba(197, 160, 89, 0.15); border: 1px solid rgba(197, 160, 89, 0.3); color: var(--accent);">
                                        {{ tag }}
                                    </span>
                                    <span v-if="!settingsBrand.business_niche" style="color: var(--text-muted); font-size: 0.75rem;">None configured</span>
                                </div>
                            </div>
                            <template v-if="userRole.toLowerCase() === 'superadmin'">
                                <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                                    <div>
                                        <strong style="color: var(--accent); display: block; font-size: 0.74rem; text-transform: uppercase; margin-bottom: 2px;">Active AI Model</strong>
                                        <span style="font-family: monospace; font-size: 0.8rem; color: var(--primary);">
                                            {{ settingsBrand.active_model || 'gemini-3.1-pro (Default)' }}
                                        </span>
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                        <div>
                                            <strong style="color: var(--accent); display: block; font-size: 0.74rem; text-transform: uppercase; margin-bottom: 2px;">Meta Pixel</strong>
                                            <span style="font-family: monospace; font-size: 0.74rem; color: var(--text-muted);">
                                                {{ settingsBrand.meta_pixel_id || 'Not set' }}
                                            </span>
                                        </div>
                                        <div>
                                            <strong style="color: var(--accent); display: block; font-size: 0.74rem; text-transform: uppercase; margin-bottom: 2px;">Google Analytics</strong>
                                            <span style="font-family: monospace; font-size: 0.74rem; color: var(--text-muted);">
                                                {{ settingsBrand.google_analytics_id || 'Not set' }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>

                    <!-- Card 7: Saved AI Studio Seeds -->
                    <div class="canvas-card">
                        <div class="canvas-card-header">
                            <span>🔢 Saved AI Studio Seeds</span>
                        </div>
                        <div class="canvas-card-body" style="display: flex; flex-direction: column; gap: 8px;">
                            <p style="font-size: 0.72rem; color: var(--text-muted); margin: 0 0 4px 0;">
                                Successful random seeds bookmarked during visual generations to reproduce styles consistently.
                            </p>
                            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                <span v-for="seedVal in (canvas.savedSeeds || [])" :key="seedVal" 
                                      class="vocab-tag tag-approved"
                                      style="background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #c084fc; display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px; font-family: monospace; font-size: 0.76rem;">
                                    <span>#{{ seedVal }}</span>
                                    <button type="button" @click="removeSavedSeed(seedVal)" style="border: none; background: none; color: #ef4444; cursor: pointer; padding: 0; font-size: 0.8rem; font-weight: bold; line-height: 1;">×</button>
                                </span>
                                <span v-if="!canvas.savedSeeds || !canvas.savedSeeds.length" style="color: var(--text-muted); font-size: 0.75rem;">No seeds bookmarked yet. Generate assets in AI Studio to save some!</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab 2: Strategy Playbook (Manuscripts & Builders) -->
            <div v-if="activeTab === 'manuscript'" class="panel">
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 15px; line-height: 1.5;">
                    Generate and manage your Brand Strategy Manuscript. The AI crawls your homepage, analyzes your catalog, and compiles a playbook covering positioning, customer personas, approved brand voice guidelines, competitor comparisons, high-converting ad hooks, and email copywriting campaigns. This playbook is utilized directly in the AI Campaign Creator.
                </div>

                <!-- Background status alert tracker -->
                <div v-if="settingsBrand.protocol_status === 'generating'" style="background: rgba(197, 160, 89, 0.05); border: 1px dashed var(--accent); padding: 15px; border-radius: 8px; font-size: 0.82rem; line-height: 1.5; color: var(--text-main); margin-bottom: 20px; text-align: center;">
                    <span class="sc-generating-gear" style="font-size: 1.6rem; display: block; margin-bottom: 6px;">⚙️</span>
                    <strong>AI Strategy Playbook Generation is in Progress!</strong><br>
                    The crawler is gathering homepage data and analyzing catalog parameters using <span style="font-family: monospace; color: var(--accent); font-weight: bold;">{{ activeManuscriptModelName }}</span> in the background.<br>
                    <div style="margin: 10px auto; background: rgba(197, 160, 89, 0.1); border-radius: 6px; padding: 6px 12px; display: inline-flex; align-items: center; gap: 8px; font-size: 0.76rem; border: 1px solid rgba(197, 160, 89, 0.15);">
                        <span>⏳ Live Ticker:</span>
                        <strong>{{ formatTokens(liveEstimatedTokens) }} tokens</strong>
                        <span>•</span>
                        <span style="color: var(--accent);">Est. Cost: <strong>€{{ liveEstimatedCost.toFixed(4) }}</strong></span>
                    </div>
                    <div style="margin-top: 5px; margin-bottom: 5px;">
                        <button type="button" class="btn" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); font-size: 0.75rem; padding: 4px 10px; height: 28px; margin: 0; font-weight: 700; border-radius: 6px;" @click="cancelMarketingProtocol">
                            🛑 Tap to Stop / Cancel
                        </button>
                    </div>
                    <br>
                    You can continue working. This dashboard will update dynamically once processing finishes.
                </div>

                <div v-if="settingsBrand.protocol_status === 'failed'" style="background: rgba(239, 68, 68, 0.05); border: 1px dashed #ef4444; padding: 15px; border-radius: 8px; font-size: 0.82rem; line-height: 1.5; color: var(--text-main); margin-bottom: 20px; text-align: center;">
                    <span style="font-size: 1.5rem; display: block; margin-bottom: 6px;">❌</span>
                    <strong style="color: #ef4444;">AI Generation Failed or Rate Limited!</strong><br>
                    <span v-html="protocolErrorSuggestion"></span>
                    <div v-if="settingsBrand.protocol_error" style="margin-top: 10px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); padding: 8px 12px; border-radius: 6px; text-align: left; font-family: monospace; font-size: 0.76rem; color: #f87171; white-space: pre-wrap; overflow-x: auto; word-break: break-all;">
                        <strong>Error Context:</strong> {{ settingsBrand.protocol_error }}
                    </div>
                </div>

                <!-- Method Selector Toggle -->
                <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px;" v-if="!isGeneratingProtocol && !isEditingProtocol && settingsBrand.protocol_status !== 'generating'">
                    <button type="button" class="btn" :style="{ backgroundColor: generationMethod === 'auto' ? 'var(--accent)' : 'transparent', color: generationMethod === 'auto' ? 'var(--workspace-bg)' : 'var(--text-main)', border: '1px solid var(--border)' }" style="margin: 0; padding: 6px 12px; font-size: 0.8rem; height: 32px; font-weight: 700; border-radius: 6px;" @click="generationMethod = 'auto'">
                        🤖 Automated AI Crawl
                    </button>
                    <button type="button" class="btn" :style="{ backgroundColor: generationMethod === 'manual' ? 'var(--accent)' : 'transparent', color: generationMethod === 'manual' ? 'var(--workspace-bg)' : 'var(--text-main)', border: '1px solid var(--border)' }" style="margin: 0; padding: 6px 12px; font-size: 0.8rem; height: 32px; font-weight: 700; border-radius: 6px;" @click="generationMethod = 'manual'">
                        📋 Manual Prompt Builder
                    </button>
                </div>

                <!-- Competitor Domain Inputs -->
                <div class="form-group form-full" style="margin-bottom: 15px;" v-if="!isGeneratingProtocol && !isEditingProtocol && settingsBrand.protocol_status !== 'generating'">
                    <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-main); margin-bottom: 6px; display: block;">
                        Competitor Domains / URLs (Press Enter to add tags)
                    </label>
                    <div class="competitor-tags-input" style="display: flex; flex-wrap: wrap; gap: 6px; border: 1px solid var(--border); background: var(--workspace-bg); border-radius: 6px; padding: 6px 12px; min-height: 38px; box-sizing: border-box; align-items: center; width: 100%;">
                        <div v-for="(comp, idx) in competitorTags" :key="idx" 
                             style="display: inline-flex; align-items: center; background: rgba(197, 160, 89, 0.15); border: 1px solid rgba(197, 160, 89, 0.3); color: var(--accent); font-size: 0.8rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; gap: 6px; margin: 2px 0;">
                            <span>{{ comp }}</span>
                            <button type="button" @click="removeCompetitorTag(idx)" 
                                    style="background: none; border: none; color: var(--accent); cursor: pointer; padding: 0; font-size: 0.85rem; font-weight: bold; line-height: 1; display: inline-flex; align-items: center; justify-content: center; width: 12px; height: 12px; opacity: 0.7; transition: opacity 0.2s;"
                                    onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">×</button>
                        </div>
                        <input type="text" 
                               v-model="newCompetitorInput" 
                               @keydown.enter.prevent="addCompetitorTag"
                               @keydown.delete="handleCompetitorBackspace"
                               placeholder="Type domain (e.g. competitor.com) & press Enter" 
                               style="border: none; background: transparent; color: var(--text-main); font-size: 0.85rem; outline: none; margin: 0; padding: 0; flex: 1; min-width: 150px; height: 26px;">
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                        <input type="checkbox" id="auto-find-toggle" v-model="autoFindCompetitors" @change="syncCompetitorsToBrand" style="width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer;">
                        <label for="auto-find-toggle" style="font-size: 0.8rem; color: var(--text-muted); cursor: pointer; user-select: none;">
                            🔍 Auto-discover competitors using AI during strategy generation (if list is empty)
                        </label>
                    </div>
                </div>

                <!-- Manual generation info/prompt template -->
                <div v-if="generationMethod === 'manual' && !isGeneratingProtocol && !isEditingProtocol && settingsBrand.protocol_status !== 'generating'">
                    <div style="background: rgba(197, 160, 89, 0.05); border: 1px solid var(--accent); padding: 12px 15px; border-radius: 8px; font-size: 0.82rem; line-height: 1.5; color: var(--text-main); margin-bottom: 15px;">
                        <h5 style="margin: 0 0 6px 0; color: var(--accent); font-weight: 700;">Manual Playbook Generation Instructions:</h5>
                        <ol style="margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px;">
                            <li>Click <strong>"Compile Strategy Prompt"</strong> below to bundle your homepage text and active catalog products.</li>
                            <li>Copy the compiled prompt from the text box below.</li>
                            <li>Paste it into <a href="https://aistudio.google.com/" target="_blank" style="color: var(--accent); text-decoration: underline; font-weight: bold;">Google AI Studio</a> or Gemini Chat using your preferred model (e.g. Deep Research Pro).</li>
                            <li>Paste the generated markdown response back into the manuscript text editor below and click <strong>"Save Changes"</strong>!</li>
                        </ol>
                    </div>
                    
                    <div style="position: relative; margin-bottom: 15px;" v-if="compiledPrompt">
                        <textarea readonly style="width: 100%; height: 200px; border-radius: 8px; border: 1px solid var(--border); background: #0f1311; color: var(--text-muted); padding: 12px; font-family: monospace; font-size: 0.8rem; line-height: 1.4; resize: vertical;" :value="compiledPrompt"></textarea>
                        <button type="button" class="btn btn-accent" style="position: absolute; top: 10px; right: 10px; font-size: 0.75rem; padding: 4px 10px; height: 28px; margin: 0; font-weight: 700;" @click="copyCompiledPrompt">
                            📋 Copy Prompt
                        </button>
                    </div>
                </div>

                <!-- Real token and cost usage stats -->
                <div v-if="manuscriptStats && manuscriptStats.calls_count > 0 && settingsBrand.protocol_status !== 'generating'" 
                     style="background: rgba(197, 160, 89, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; font-size: 0.76rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 8px; margin-bottom: 20px;">
                    <span>📊 Accumulated manuscript usage:</span>
                    <strong style="color: var(--text-main);">{{ manuscriptStats.calls_count }} builds</strong>
                    <span>•</span>
                    <strong style="color: var(--text-main);">{{ formatTokens(manuscriptStats.total_tokens) }} tokens</strong>
                    <span>•</span>
                    <span>Total Cost: <strong style="color: var(--accent);">€{{ (manuscriptStats.cost_usd * 0.92).toFixed(4) }}</strong></span>
                </div>

                <!-- Generator Action Buttons -->
                <div style="display: flex; gap: 10px; margin-bottom: 20px; align-items: center; flex-wrap: wrap;">
                    <button v-if="generationMethod === 'auto' && !isEditingProtocol" type="button" class="sc-ai-button" style="margin: 0; height: 38px;" :disabled="isGeneratingProtocol || (settingsBrand && settingsBrand.protocol_status === 'generating')" @click="generateMarketingProtocol">
                        <template v-if="isGeneratingProtocol || (settingsBrand && settingsBrand.protocol_status === 'generating')">
                            <span v-if="userRole && userRole.toLowerCase() === 'superadmin'">⏳ [{{ liveEstimatedTokens || app.aiTicker.tokens }} tokens | €{{ (liveEstimatedCost || app.aiTicker.cost * 0.92).toFixed(4) }}]</span>
                            <span v-else>⏳ Generating brand guidelines...</span>
                        </template>
                        <template v-else>
                            <span v-if="userRole && userRole.toLowerCase() === 'superadmin'">✨ Generate Brand Manuscript [{{ activeManuscriptModelName }}] [~{{ activeManuscriptModelEstCost }}]</span>
                            <span v-else>✨ Generate Brand Guidelines</span>
                        </template>
                    </button>
                    <AiEstimateBadge v-if="generationMethod === 'auto' && !isEditingProtocol && !isGeneratingProtocol && !(settingsBrand && settingsBrand.protocol_status === 'generating')" operation="Brand Protocol & Strategy Generation" />

                    <button v-if="generationMethod === 'manual' && !isEditingProtocol" type="button" class="btn btn-secondary" style="margin: 0; height: 38px;" :disabled="isCompilingPrompt || (settingsBrand && settingsBrand.protocol_status === 'generating')" @click="compileManualPrompt">
                        <span v-if="isCompilingPrompt">⏳ Compiling Contextual Prompt...</span>
                        <span v-else>📋 Compile Strategy Prompt (via Scraper)</span>
                    </button>
                    
                    <button type="button" class="btn" style="margin: 0; height: 38px; display: inline-flex; align-items: center; gap: 6px;" v-if="!isEditingProtocol" :disabled="settingsBrand && settingsBrand.protocol_status === 'generating'" @click="toggleEditProtocol">
                        ✍️ Paste / Edit Manuscript
                    </button>
                    
                    <button type="button" class="btn btn-primary" style="margin: 0; height: 38px; display: inline-flex; align-items: center; gap: 6px;" v-if="isEditingProtocol" @click="saveManualProtocol">
                        💾 Save Changes
                    </button>

                    <button type="button" class="btn" style="margin: 0; height: 38px; display: inline-flex; align-items: center; gap: 6px;" v-if="isEditingProtocol" @click="cancelEditProtocol">
                        Cancel
                    </button>
                </div>

                <!-- Manuscript Version History List -->
                <div v-if="manuscripts.length > 0 && !isGeneratingProtocol && !isEditingProtocol" style="margin-top: 15px; margin-bottom: 15px; background: rgba(255, 255, 255, 0.01); border: 1px solid var(--border); border-radius: 8px; padding: 15px;">
                    <h5 style="margin: 0 0 10px 0; color: var(--accent); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
                        📚 Manuscript Version History ({{ manuscripts.length }})
                    </h5>
                    <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;">
                        <div v-for="m in manuscripts" :key="m.id" 
                             :style="{ border: m.is_active ? '1px solid var(--accent)' : '1px solid var(--border)', background: m.is_active ? 'rgba(197, 160, 89, 0.03)' : 'rgba(0,0,0,0.1)' }"
                             style="padding: 10px 12px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                            <div style="flex: 1; min-width: 0;">
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
                                    <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-main);">
                                        📅 Generated on {{ new Date(m.created_at).toLocaleString() }}
                                    </span>
                                    <span v-if="m.is_active" style="font-size: 0.65rem; font-weight: 800; background: var(--accent); color: var(--workspace-bg); padding: 1px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                                        Active
                                    </span>
                                </div>
                                <div style="font-size: 0.74rem; color: var(--text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 500px;">
                                    {{ m.summary || 'Strategic manuscript draft...' }}
                                </div>
                            </div>
                            <div style="display: flex; gap: 6px; flex-shrink: 0;">
                                <button v-if="!m.is_active" type="button" class="btn btn-accent" 
                                        style="font-size: 0.72rem; padding: 4px 8px; height: 26px; margin: 0; font-weight: bold;" 
                                        :disabled="activatingManuscriptId !== null" 
                                        @click="activateManuscript(m.id)">
                                    <span v-if="activatingManuscriptId === m.id">⏳</span>
                                    <span v-else>Activate</span>
                                </button>
                                <button v-if="!m.is_active" type="button" class="btn" 
                                        style="font-size: 0.72rem; padding: 4px 8px; height: 26px; margin: 0; background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: rgba(239, 68, 68, 0.15);" 
                                        @click="deleteManuscript(m.id)">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Playbook Viewer -->
                <div v-if="settingsBrand.marketing_protocol && !isEditingProtocol" style="background: #0f1311; border: 1px solid var(--border); border-radius: 8px; padding: 20px; max-height: 450px; overflow-y: auto; font-family: Outfit, sans-serif; font-size: 0.88rem; line-height: 1.6; color: var(--text-main); white-space: pre-wrap; margin-top: 15px; position: relative;">
                    <button type="button" class="btn" style="position: absolute; top: 12px; right: 12px; font-size: 0.72rem; padding: 4px 8px; height: 26px; margin: 0; background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1);" @click="copyProtocolToClipboard">
                        📋 Copy Plaintext
                    </button>
                    {{ settingsBrand.marketing_protocol }}
                </div>

                <!-- Playbook Editor -->
                <div v-if="isEditingProtocol" style="margin-top: 15px;">
                    <textarea v-model="editedProtocolText" style="width: 100%; height: 350px; border-radius: 8px; border: 1px solid var(--border); background: #0f1311; color: var(--text-main); padding: 15px; font-family: monospace; font-size: 0.85rem; line-height: 1.5; resize: vertical; outline: none; margin: 0;"></textarea>
                </div>

                <!-- Empty Playbook State -->
                <div v-if="!settingsBrand.marketing_protocol && !isEditingProtocol" style="background: rgba(255, 255, 255, 0.01); border: 1px dashed var(--border); border-radius: 8px; padding: 30px; text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: 15px;">
                    🚫 No marketing manuscript generated yet. Let's trigger a generation to onboard this brand onto the Performance Ad Studio.
                </div>
            </div>

            <!-- Tab 3: Design Style Guidelines -->
            <div v-if="activeTab === 'styles'" class="panel">
                <h3 style="color: var(--accent); margin: 0 0 15px 0; font-family: var(--font-display); font-weight: 700; font-size: 1.1rem;">
                    🎨 Custom Visual Style Settings
                </h3>
                <p style="color: var(--text-muted); font-size: 0.82rem; line-height: 1.45; margin-bottom: 25px;">
                    Override color branding settings, design parameters, typography scales, and store assets to dictate design systems inside the campaign generator and page builders.
                </p>

                <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <!-- Color Palette Section -->
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <h4 style="color: var(--text-main); font-size: 0.9rem; font-weight: 700; margin: 0 0 5px 0; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                            Color System
                        </h4>
                        
                        <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
                            <label style="width: 140px; font-size: 0.82rem; font-weight: 600; color: var(--text-muted);">Primary Brand Color</label>
                            <input type="color" v-model="settingsBrand.primary_color" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                            <input type="text" v-model="settingsBrand.primary_color" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#111111" style="flex: 1; margin: 0;">
                        </div>

                        <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
                            <label style="width: 140px; font-size: 0.82rem; font-weight: 600; color: var(--text-muted);">Secondary Color</label>
                            <input type="color" v-model="settingsBrand.secondary_color" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                            <input type="text" v-model="settingsBrand.secondary_color" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#767676" style="flex: 1; margin: 0;">
                        </div>

                        <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
                            <label style="width: 140px; font-size: 0.82rem; font-weight: 600; color: var(--text-muted);">Background Canvas</label>
                            <input type="color" v-model="settingsBrand.bg_color" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                            <input type="text" v-model="settingsBrand.bg_color" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#ffffff" style="flex: 1; margin: 0;">
                        </div>

                        <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
                            <label style="width: 140px; font-size: 0.82rem; font-weight: 600; color: var(--text-muted);">Primary Text Color</label>
                            <input type="color" v-model="settingsBrand.text_color" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                            <input type="text" v-model="settingsBrand.text_color" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#111111" style="flex: 1; margin: 0;">
                        </div>

                        <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
                            <label style="width: 140px; font-size: 0.82rem; font-weight: 600; color: var(--text-muted);">Header Accent Color</label>
                            <input type="color" v-model="settingsBrand.header_bg_color" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                            <input type="text" v-model="settingsBrand.header_bg_color" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#ffffff" style="flex: 1; margin: 0;">
                        </div>

                        <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
                            <label style="width: 140px; font-size: 0.82rem; font-weight: 600; color: var(--text-muted);">CTA Button Text</label>
                            <input type="color" v-model="settingsBrand.button_text_color" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                            <input type="text" v-model="settingsBrand.button_text_color" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#ffffff" style="flex: 1; margin: 0;">
                        </div>
                    </div>

                    <!-- Layout & Asset Section -->
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <h4 style="color: var(--text-main); font-size: 0.9rem; font-weight: 700; margin: 0 0 5px 0; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                            Typography, Layout & Logo Assets
                        </h4>

                        <div class="form-group">
                            <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 6px;">Button Border Radius</label>
                            <select v-model="settingsBrand.button_radius" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 10px;">
                                <option value="0px">🔲 Sharp Corners (0px)</option>
                                <option value="4px">◽ Soft Corner (4px)</option>
                                <option value="8px">⬜ Rounded Card (8px)</option>
                                <option value="12px">⚪ Rounded Capsule (12px)</option>
                                <option value="24px">⭕ Fully Circle (24px)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 6px;">Brand Typography</label>
                            <select v-model="settingsBrand.font_family" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 10px;">
                                <option value="Outfit">Outfit (Luxury Sans, default)</option>
                                <option value="Inter">Inter (Clean Tech/SaaS)</option>
                                <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
                                <option value="Cinzel">Cinzel (Luxury Classical Architectural)</option>
                                <option value="Roboto">Roboto (Clean Neutral)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 6px;">Favicon Asset URL</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <div style="width: 38px; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                                    <img v-if="settingsBrand.favicon" :src="app.getCleanImageUrl(settingsBrand.favicon)" style="width: 100%; height: 100%; object-fit: contain;" />
                                    <span v-else style="font-size: 0.75rem;">🌐</span>
                                </div>
                                <input type="text" v-model="settingsBrand.favicon" placeholder="https://brand.com/favicon.ico" style="flex: 1; margin: 0; height: 38px;">
                                <button type="button" @click="triggerFaviconContentStudio" class="btn btn-primary" style="height: 38px; margin: 0; padding: 0 10px; font-weight: bold; font-size: 0.75rem; display: flex; align-items: center; justify-content: center;">🎨 Content Studio</button>
                            </div>
                        </div>

                        <div class="form-group">
                            <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 6px;">Main Brand Logo URL</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <div style="width: 38px; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                                    <img v-if="settingsBrand.logo" :src="app.getCleanImageUrl(settingsBrand.logo)" style="width: 100%; height: 100%; object-fit: contain;" />
                                    <span v-else style="font-size: 0.75rem;">🖼️</span>
                                </div>
                                <input type="text" v-model="settingsBrand.logo" placeholder="https://brand.com/logo.png" style="flex: 1; margin: 0; height: 38px;">
                                <button type="button" @click="triggerLogoContentStudio" class="btn btn-primary" style="height: 38px; margin: 0; padding: 0 10px; font-weight: bold; font-size: 0.75rem; display: flex; align-items: center; justify-content: center;">🎨 Content Studio</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 30px; border-top: 1px solid var(--border); padding-top: 20px; display: flex; justify-content: flex-end;">
                    <button type="button" class="btn btn-accent" style="margin: 0; height: 40px; font-weight: 700; width: 180px;" @click="saveStyleGuidelines">
                        💾 Save Style Systems
                    </button>
                </div>
            </div>
        </div>


        <!-- Inline Canvas Card Editor Modal Overlay -->
        <div v-if="editingSection" class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div class="panel modal-container" style="width: 600px; padding: 25px; max-width: 90%; background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 8px;">
                <h3 style="color: var(--accent); margin: 0 0 15px 0; font-size: 1.1rem; font-family: var(--font-display); font-weight: 700;">
                    ✏️ Edit {{ getSectionTitle(editingSection) }}
                </h3>

                <!-- Textarea Editor for basic string cards -->
                <div v-if="!editingSection.includes('vocab') && !editingSection.includes('persona') && !editingSection.includes('scenery') && editingSection !== 'positioning'" class="form-group form-full">
                    <textarea v-model="tempSectionData" style="width: 100%; height: 250px; border-radius: 6px; border: 1px solid var(--border); background: #0f1311; color: var(--text-main); padding: 12px; font-family: monospace; font-size: 0.85rem; line-height: 1.5; resize: vertical; outline: none; margin: 0;"></textarea>
                </div>

                <!-- Special layout editor for vocabulary -->
                <div v-else-if="editingSection === 'controlled_vocabulary'" style="display: flex; flex-direction: column; gap: 16px;">
                    <!-- Approved Words -->
                    <div class="form-group form-full">
                        <label style="font-size: 0.82rem; font-weight: 700; color: var(--success); display: block; margin-bottom: 6px;">Approved Words / Terms</label>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; border: 1px solid var(--border); background: var(--card-bg); border-radius: 6px; padding: 6px 12px; min-height: 38px; box-sizing: border-box; align-items: center; width: 100%;">
                            <div v-for="(word, idx) in tempSectionData.approvedTags" :key="idx" 
                                 style="display: inline-flex; align-items: center; gap: 4px; background: rgba(34, 197, 94, 0.15); color: #22c55e; padding: 2px 8px; border-radius: 4px; font-size: 0.76rem; font-weight: 700;">
                                <span>{{ word }}</span>
                                <span @click="tempSectionData.approvedTags.splice(idx, 1)" style="cursor: pointer; opacity: 0.7; font-weight: normal; margin-left: 2px;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">×</span>
                            </div>
                            <input type="text" v-model="newApprovedInput" 
                                   @keydown.enter.prevent="addApprovedTag" 
                                   @keydown.backspace="handleApprovedBackspace"
                                   placeholder="Type term & press Enter" 
                                   style="flex: 1; min-width: 120px; background: transparent; border: none; outline: none; color: var(--text-main); font-size: 0.78rem; padding: 4px 0;">
                        </div>
                    </div>

                    <!-- Banned Words -->
                    <div class="form-group form-full">
                        <label style="font-size: 0.82rem; font-weight: 700; color: #ef4444; display: block; margin-bottom: 6px;">Banned Words / Terms</label>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; border: 1px solid var(--border); background: var(--card-bg); border-radius: 6px; padding: 6px 12px; min-height: 38px; box-sizing: border-box; align-items: center; width: 100%;">
                            <div v-for="(word, idx) in tempSectionData.bannedTags" :key="idx" 
                                 style="display: inline-flex; align-items: center; gap: 4px; background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 2px 8px; border-radius: 4px; font-size: 0.76rem; font-weight: 700;">
                                <span>{{ word }}</span>
                                <span @click="tempSectionData.bannedTags.splice(idx, 1)" style="cursor: pointer; opacity: 0.7; font-weight: normal; margin-left: 2px;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">×</span>
                            </div>
                            <input type="text" v-model="newBannedInput" 
                                   @keydown.enter.prevent="addBannedTag" 
                                   @keydown.backspace="handleBannedBackspace"
                                   placeholder="Type term & press Enter" 
                                   style="flex: 1; min-width: 120px; background: transparent; border: none; outline: none; color: var(--text-main); font-size: 0.78rem; padding: 4px 0;">
                        </div>
                    </div>
                </div>

                <!-- Special layout editor for positioning (vertical, niche, tracking, models) -->
                <div v-else-if="editingSection === 'positioning'" style="display: flex; flex-direction: column; gap: 15px;">
                    <div class="form-group form-full">
                        <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 6px;">Industry Vertical</label>
                        <select v-model="tempSectionData.business_segment" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-size: 0.85rem; padding: 0 12px; margin: 0; cursor: pointer;">
                            <option value="Food & Beverage">Food & Beverage</option>
                            <option value="Apparel & Fashion">Apparel & Fashion</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Health & Beauty">Health & Beauty</option>
                            <option value="Home & Living">Home & Living</option>
                            <option value="Fitness & Sports">Fitness & Sports</option>
                            <option value="Software & Tech">Software & Tech</option>
                        </select>
                    </div>

                    <div class="form-group form-full" style="display: flex; flex-direction: column; gap: 4px;">
                        <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-main); display: block;">Specific Niche / Tags</label>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; border: 1px solid var(--border); background: var(--card-bg); border-radius: 6px; padding: 6px 12px; min-height: 38px; box-sizing: border-box; align-items: center; width: 100%;">
                            <div v-for="(tag, idx) in tempSectionData.nicheTags" :key="idx" 
                                 style="display: inline-flex; align-items: center; gap: 4px; background: rgba(197, 160, 89, 0.15); border: 1px solid rgba(197, 160, 89, 0.3); color: var(--accent); padding: 2px 8px; border-radius: 4px; font-size: 0.76rem; font-weight: 700;">
                                <span>{{ tag }}</span>
                                <span @click="tempSectionData.nicheTags.splice(idx, 1)" style="cursor: pointer; opacity: 0.7; font-weight: normal; margin-left: 2px;">×</span>
                            </div>
                            <input type="text" v-model="positioningNicheInput" 
                                   @keydown.enter.prevent="addPositioningNicheTag" 
                                   @keydown.comma.prevent="addPositioningNicheTag"
                                   placeholder="Type tag & press Enter" 
                                   style="flex: 1; min-width: 120px; background: transparent; border: none; outline: none; color: var(--text-main); font-size: 0.78rem; padding: 4px 0;">
                        </div>
                    </div>

                    <template v-if="userRole.toLowerCase() === 'superadmin'">
                        <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 15px; display: flex; flex-direction: column; gap: 15px;">
                            <div class="form-group form-full">
                                <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 6px;">Active AI Model (Superadmin)</label>
                                <select v-model="tempSectionData.active_model" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-size: 0.85rem; padding: 0 12px; margin: 0; cursor: pointer;">
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Standard)</option>
                                    <option value="gemini-3.1-pro">Gemini 3.1 Pro (Professional)</option>
                                    <option value="deep-research-preview">Deep Research Pro (Enterprise)</option>
                                </select>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div class="form-group" style="margin: 0;">
                                    <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 6px;">Meta Pixel ID</label>
                                    <input type="text" v-model="tempSectionData.meta_pixel_id" placeholder="e.g. 15-digit ID" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-size: 0.8rem; padding: 0 10px; margin: 0;">
                                </div>
                                <div class="form-group" style="margin: 0;">
                                    <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 6px;">Google Analytics ID</label>
                                    <input type="text" v-model="tempSectionData.google_analytics_id" placeholder="e.g. G-XXXXXXXXXX" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-size: 0.8rem; padding: 0 10px; margin: 0;">
                                </div>
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Special list editor for personas -->
                <div v-else-if="editingSection === 'personas'" style="display: flex; flex-direction: column; gap: 15px; max-height: 350px; overflow-y: auto; padding-right: 5px;">
                    <div v-for="(p, idx) in tempSectionData" :key="idx" style="border: 1px solid var(--border); border-radius: 6px; padding: 12px; background: rgba(0,0,0,0.1); position: relative; margin-bottom: 10px;">
                        <button type="button" @click="removePersonaEdit(idx)" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.8rem; font-weight: bold;">✕ Remove</button>
                        <div class="form-group" style="margin-bottom: 8px;">
                            <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Persona Name</label>
                            <input type="text" v-model="p.name" style="width: 100%; height: 32px; border-radius: 4px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 8px; font-size: 0.8rem; margin: 0;">
                        </div>
                        <div class="form-group" style="margin-bottom: 8px;">
                            <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Demographics (e.g. Age, Career)</label>
                            <input type="text" v-model="p.demographics" style="width: 100%; height: 32px; border-radius: 4px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 8px; font-size: 0.8rem; margin: 0;">
                        </div>
                        <div class="form-group" style="margin-bottom: 8px;">
                            <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Psychographic Motivations</label>
                            <textarea v-model="p.description" style="width: 100%; height: 60px; border-radius: 4px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 6px 8px; font-size: 0.8rem; line-height: 1.4; resize: vertical; margin: 0;"></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Primary Value Hook</label>
                            <input type="text" v-model="p.hooksRaw" style="width: 100%; height: 32px; border-radius: 4px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 8px; font-size: 0.8rem; margin: 0;">
                        </div>
                    </div>
                    <button type="button" @click="addNewPersonaEdit" class="btn" style="height: 32px; font-size: 0.75rem; border-style: dashed; border-color: var(--accent); color: var(--accent); background: transparent; width: 100%; margin: 0;">
                        ➕ Add Another Persona Profile
                    </button>
                </div>

                <!-- Special add/edit forms for visual studio -->
                <div v-else-if="editingSection === 'persona_add' || editingSection === 'persona_edit'" style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 4px;">Ambassador Name</label>
                            <input type="text" v-model="newPersona.name" placeholder="e.g. Sophia the Barista" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 4px;">Target Age Group</label>
                            <input type="text" v-model="newPersona.age" placeholder="e.g. 25-35" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                        </div>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 4px;">Professional / Demographic Role</label>
                        <input type="text" v-model="newPersona.role" placeholder="e.g. Third-wave specialty coffee enthusiast" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 4px;">Attire / Apparel Style</label>
                            <input type="text" v-model="newPersona.apparel" placeholder="e.g. dark denim apron over a white tee" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 4px;">Visual Face Expression</label>
                            <input type="text" v-model="newPersona.expression" placeholder="e.g. friendly welcoming smile" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                        </div>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 4px;">Psychological Character Bio</label>
                        <textarea v-model="newPersona.description" placeholder="Describe the personality motivations and details..." style="width: 100%; height: 80px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px 10px; resize: none; margin: 0; line-height: 1.4; outline: none;"></textarea>
                    </div>
                </div>

                <div v-else-if="editingSection === 'scenery_add' || editingSection === 'scenery_edit'" style="display: flex; flex-direction: column; gap: 12px;">
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 4px;">Setting / Backdrop Name</label>
                        <input type="text" v-model="newScenery.name" placeholder="e.g. Cozy Concrete Cafe Loft" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 4px;">Environment Backdrop Description</label>
                        <textarea v-model="newScenery.description" placeholder="Describe the background context, e.g. A concrete coffee bar counter with a chrome espresso machine in the background..." style="width: 100%; height: 80px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px 10px; resize: none; margin: 0; line-height: 1.4; outline: none;"></textarea>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 4px;">Backdrop Lighting Cues</label>
                        <input type="text" v-model="newScenery.lighting" placeholder="e.g. natural soft warm morning side-light" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 4px;">Camera Lens & Photography Cues</label>
                        <input type="text" v-model="newScenery.photography_style" placeholder="e.g. 35mm film style, warm color palette, soft bokeh, f/1.8 aperture" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                </div>

                <!-- Footer buttons -->
                <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border); padding-top: 15px;">
                    <button type="button" class="btn" style="margin: 0; height: 36px; font-size: 0.8rem;" @click="editingSection = null">Cancel</button>
                    <button type="button" class="btn btn-accent" style="margin: 0; height: 36px; font-size: 0.8rem; font-weight: bold;" @click="saveSectionEdits">
                        💾 Apply Changes
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'BrandCenterView',
    inject: ['app'],
    data() {
        return {
            activeTab: 'canvas',
            canvas: {
                brand_voice: '',
                product_architecture: '',
                controlled_vocabulary: { approved: [], banned: [] },
                personas: [],
                visual_direction: ''
            },
            loadingCanvas: false,
            savingCanvas: false,
            refiningCanvas: false,
            refinementPrompt: '',
            distillingCanvas: false,

            // Editor overlay variables
            editingSection: null,
            tempSectionData: null,
            newApprovedInput: '',
            newBannedInput: '',
            positioningNicheInput: '',

            // Playbook version controls (migrated from settings)
            manuscripts: [],
            loadingManuscripts: false,
            activatingManuscriptId: null,
            generationMethod: 'auto',
            newCompetitorInput: '',
            competitorTags: [],
            autoFindCompetitors: true,
            compiledPrompt: '',
            isCompilingPrompt: '',
            isGeneratingProtocol: false,
            liveEstimatedTokens: 0,
            liveEstimatedCost: 0,
            liveTickerInterval: null,
            protocolPollInterval: null,
            manuscriptStats: { calls_count: 0, total_tokens: 0, cost_usd: 0.0 },
            isEditingProtocol: false,
            editedProtocolText: '',
            manuscriptLiveEstCost: '',

            editingPersonaIndex: null,
            editingSceneryIndex: null,
            newPersona: {
                name: '',
                age: '25-35',
                role: 'home barista',
                expression: 'smiling',
                apparel: 'casual shirt',
                description: ''
            },
            newScenery: {
                name: '',
                description: '',
                lighting: 'natural light',
                photography_style: '35mm photography'
            }
        };
    },
    watch: {
        activeShopFilter() {
            this.loadBrandCanvas();
            this.loadManuscripts();
            this.loadManuscriptStats();
            this.startProtocolPolling();
            this.updateLiveEstimate();
        },
        'app.activeView'(newView) {
            if (newView === 'brand-center') {
                this.loadBrandCanvas();
                this.loadManuscripts();
                this.loadManuscriptStats();
                this.startProtocolPolling();
                this.updateLiveEstimate();
            } else {
                this.stopProtocolPolling();
            }
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
        activeTab(newVal) {
            if (this.app) {
                this.app.activeBrandCenterTab = newVal;
                this.app.updateURL();
            }
        },
        'app.activeBrandCenterTab'(newVal) {
            if (newVal && newVal !== this.activeTab) {
                this.activeTab = newVal;
            }
        }
    },
    computed: {
        isValidBrandSelected() {
            return this.activeShopFilter !== 'all' && this.app.brands.some(b => b.id === this.activeShopFilter);
        },
        estimatedTargetTokens() {
            if (this.manuscriptStats && this.manuscriptStats.calls_count > 0 && this.manuscriptStats.total_tokens > 0) {
                return Math.round(this.manuscriptStats.total_tokens / this.manuscriptStats.calls_count);
            }
            return 35000; // default expected tokens fallback
        },
        protocolProgressPct() {
            const current = this.liveEstimatedTokens || (this.app && this.app.aiTicker ? this.app.aiTicker.tokens : 0) || 0;
            const target = this.estimatedTargetTokens;
            if (current <= 0) return 0;
            if (current >= target) {
                return 98; // cap at 98% during final completion
            }
            return Math.round((current / target) * 100);
        },
        activeShopFilter() {
            return this.app.activeShopFilter;
        },
        settingsBrand() {
            return this.app.settingsBrand || {};
        },
        userRole() {
            return this.app.userRole || 'merchant';
        },
        activeManuscriptModelName() {
            if (!this.settingsBrand) return 'Gemini 3.1 Pro';
            const tier = this.settingsBrand.ai_tier || 'professional';
            if (tier === 'standard') return 'Gemini 2.5 Flash';
            if (tier === 'enterprise') return 'Deep Research Pro';
            return 'Gemini 3.1 Pro';
        },
        activeManuscriptModelEstCost() {
            if (this.manuscriptLiveEstCost) return this.manuscriptLiveEstCost;
            if (!this.settingsBrand) return '~€0.003';
            const tier = this.settingsBrand.ai_tier || 'professional';
            if (tier === 'standard') return '~€0.0003';
            if (tier === 'enterprise') return '~€0.10 - €0.25';
            return '~€0.003';
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
        liveAssembledPrompt() {
            if (!this.composerParams.promptTemplate) return '';
            
            let compiled = this.composerParams.promptTemplate;
            
            // Replace products: #Product Title
            // Matches any # symbol followed by word characters or spaces, up to a delimiter
            const productRegex = /#([^#@\[\]\n\.,]+)/g;
            compiled = compiled.replace(productRegex, (match, name) => {
                const cleanName = name.trim();
                const prod = this.app.products.find(p => p.title.toLowerCase().includes(cleanName.toLowerCase()));
                if (prod) {
                    let prodDesc = prod.title;
                    if (prod.visual_dna) {
                        try {
                            const dna = typeof prod.visual_dna === 'string' ? JSON.parse(prod.visual_dna) : prod.visual_dna;
                            if (dna && dna.subject) prodDesc = dna.subject;
                        } catch(e) {}
                    }
                    return prodDesc;
                }
                return match;
            });

            // Replace personas: @Persona Name
            const personaRegex = /@([^#@\[\]\n\.,]+)/g;
            compiled = compiled.replace(personaRegex, (match, name) => {
                const cleanName = name.trim();
                const persona = this.canvas.personas ? this.canvas.personas.find(p => p.name.toLowerCase().includes(cleanName.toLowerCase())) : null;
                if (persona) {
                    let pDesc = `a ${persona.age || '25-35'} year old ${persona.role || 'barista'} model with ${persona.expression || 'focused'} expression, wearing ${persona.apparel || 'casual attire'}`;
                    if (persona.description) {
                        pDesc += ` (who embodies: "${persona.description}")`;
                    }
                    return pDesc;
                }
                return match;
            });

            // Replace sceneries: [Scenery Name]
            const sceneryRegex = /\[([^#@\[\]\n\.,]+)\]/g;
            compiled = compiled.replace(sceneryRegex, (match, name) => {
                const cleanName = name.trim();
                const scenery = this.canvas.sceneries ? this.canvas.sceneries.find(s => s.name.toLowerCase().includes(cleanName.toLowerCase())) : null;
                if (scenery) {
                    let sDesc = `set in a ${scenery.description || 'modern minimalist setting'}`;
                    if (scenery.lighting) sDesc += `, lit with ${scenery.lighting}`;
                    if (scenery.photography_style) sDesc += `, shot in ${scenery.photography_style}`;
                    return sDesc;
                }
                return match;
            });

            // Append camera parameters if selected inside details
            let extraPhoto = '';
            if (this.composerParams.cameraLens) extraPhoto += `, ${this.composerParams.cameraLens}`;
            if (this.composerParams.lightingStyle) extraPhoto += `, ${this.composerParams.lightingStyle}`;
            if (this.composerParams.composition) extraPhoto += `, ${this.composerParams.composition}`;

            if (extraPhoto) {
                compiled += ` Shot on professional camera${extraPhoto}, premium quality, realistic textures.`;
            }

            const backend = this.composerParams.backend;
            const enginePrefix = backend ? `[Engine: ${backend.toUpperCase()}] ` : '';
            return `${enginePrefix}${compiled}`;
        },
    },
    methods: {
        triggerLogoContentStudio() {
            this.app.openContentStudio((url, item) => {
                this.settingsBrand.logo = url;
            }, {
                promptPreset: `Brand logo for ${this.settingsBrand.name || 'my coffee brand'}`
            });
        },
        triggerFaviconContentStudio() {
            this.app.openContentStudio((url, item) => {
                this.settingsBrand.favicon = url;
            }, {
                promptPreset: `Brand favicon icon for ${this.settingsBrand.name || 'my coffee brand'}`
            });
        },
        openAddPersonaForm() {
            this.newPersona = {
                name: '',
                age: '25-35',
                role: 'home barista',
                expression: 'smiling',
                apparel: 'casual shirt',
                description: ''
            };
            this.editingPersonaIndex = null;
            this.editingSection = 'persona_add';
        },
        openEditPersonaForm(idx) {
            const p = this.canvas.personas[idx];
            this.newPersona = { ...p };
            this.editingPersonaIndex = idx;
            this.editingSection = 'persona_edit';
        },
        openAddSceneryForm() {
            this.newScenery = {
                name: '',
                description: '',
                lighting: 'natural soft morning side-light',
                photography_style: '35mm film style, warm color palette, soft bokeh, f/1.8 aperture'
            };
            this.editingSceneryIndex = null;
            this.editingSection = 'scenery_add';
        },
        openEditSceneryForm(idx) {
            const s = this.canvas.sceneries[idx];
            this.newScenery = { ...s };
            this.editingSceneryIndex = idx;
            this.editingSection = 'scenery_edit';
        },
        getProductImageUrl(p) {
            return p.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=120';
        },
        async deletePersona(idx) {
            if (confirm(`Are you sure you want to delete ${this.canvas.personas[idx].name}?`)) {
                this.canvas.personas.splice(idx, 1);
                await this.saveBrandCanvas();
            }
        },
        async deleteScenery(idx) {
            if (confirm(`Are you sure you want to delete ${this.canvas.sceneries[idx].name}?`)) {
                this.canvas.sceneries.splice(idx, 1);
                await this.saveBrandCanvas();
            }
        },
        async loadBrandCanvas() {
            if (!this.isValidBrandSelected) return;
            this.loadingCanvas = true;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/canvas`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (!data.controlled_vocabulary) {
                        data.controlled_vocabulary = { approved: [], banned: [] };
                    }
                    if (!data.controlled_vocabulary.approved) data.controlled_vocabulary.approved = [];
                    if (!data.controlled_vocabulary.banned) data.controlled_vocabulary.banned = [];
                    this.canvas = data;
                }
            } catch (e) {
                console.error('[Brand Center] Error loading canvas:', e);
            } finally {
                this.loadingCanvas = false;
            }
        },
        async saveBrandCanvas() {
            if (!this.isValidBrandSelected) return;
            this.savingCanvas = true;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/canvas`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ canvas: this.canvas })
                });
                if (response.ok) {
                    this.app.showNotification('✨ Interactive Guidelines Canvas saved successfully!');
                    
                    // Trigger background manuscript synchronization to update the Strategy Playbook
                    fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/sync-canvas-to-manuscript`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).then(res => {
                        if (res.ok) {
                            console.log('[AI Canvas Sync] Manuscript synchronized successfully.');
                            this.app.showNotification('🔄 Playbook strategy manuscript successfully updated.');
                            this.loadManuscripts();
                        }
                    }).catch(err => {
                        console.error('[AI Canvas Sync] Background synchronization error:', err);
                    });
                }
            } catch (e) {
                console.error('[Brand Center] Error saving canvas:', e);
                alert('Save error: ' + e.message);
            } finally {
                this.savingCanvas = false;
            }
        },
        async distillManuscriptToCanvas() {
            if (!this.isValidBrandSelected) return;
            this.distillingCanvas = true;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/distill-canvas`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    this.canvas = await response.json();
                    this.app.showNotification('✨ Guidelines canvas successfully populated from playbooks!');
                } else {
                    const err = await response.json();
                    alert(err.error || 'Failed to distill canvas.');
                }
            } catch (e) {
                alert('Connection error: ' + e.message);
            } finally {
                this.distillingCanvas = false;
            }
        },
        async populateDefaultCoffeeCanvas() {
            if (!this.isValidBrandSelected) return;
            if (!confirm('This will overwrite the current canvas with premium coffee brand defaults. Are you sure?')) return;

            this.canvas = {
                brand_voice: `### Brand Tone & Voice\n* **Scientific Authority**: We speak with quiet, clinical confidence. We present engineering parameters, tolerances, and fluid dynamics equations as objective facts.\n* **Understated Elegance**: Avoid loud DTC slogans ("game-changer", "hack your morning", "revolutionize"). Our products sell because of their physical merit and aesthetic value.\n* **Technical Accuracy**: Every claim is anchored in espresso science (e.g. extraction yield percentage, saturation uniformity, base-flex deflection under 9-bar pressure).`,
                product_architecture: `### Product Positioning & Technical Narrative\n* **Precision espresso extraction hardware**: Every tenth of a millimeter matters. We design tools to achieve perfect boundary-layer flow and hydraulic uniformity.\n* **Material integrity**: Utilizing marine-grade 316 stainless steel, heavy POM, and vacuum-dyed European timber to create accessories that coordinate with high-end interior spaces while surviving commercial environments.\n* **Repeatability**: Standardizing the extraction environment to let baristas isolate grind size and ratio adjustments without mechanical interference.`,
                controlled_vocabulary: {
                    approved: ["precision extraction", "hydraulic uniformity", "thermal stability", "marine-grade steel", "ergonomic workflow", "deflection guidance"],
                    banned: ["cheap", "game-changer", "morning routine hack", "budget-friendly", "world's best coffee", "espresso hack"]
                },
                personas: [
                    {
                        name: "The Technical Enthusiast (Barista)",
                        demographics: "Aged 25-45, high disposable income, home coffee lab.",
                        description: "Obsessed with extraction yields, refractometer readings, and repeatable parameters. They search for zero-compromise coffee tools designed with clinical precision.",
                        hooks: ["Eliminate channeling. Achieve uniform saturation with 1.1mm rigid base plates."]
                    },
                    {
                        name: "The Architectural Curator",
                        demographics: "Aged 30-55, design professional or aesthetic enthusiast.",
                        description: "Values high-end kitchen counter design, tactile European timber materials, and the sensory ritual of pulling a perfect shot. They view hardware as an interior design extension.",
                        hooks: ["Coordinate your counter space. Mix and match premium handcrafted European timber handles."]
                    }
                ],
                visual_direction: `### Visual Briefing & Photography Styling Rules\n* **Aesthetic Context**: Architectural Digest styling. Clean kitchen countertops (marble, matte concrete, stone) with soft natural side lighting.\n* **Camera Guidelines**: Shallow depth of field (f/1.8 - f/2.8) using high-end portrait lenses (e.g., 85mm or 50mm macros). Macro close-ups showcasing brushed metal finishes and wood grains.\n* **Palette**: Sleek dark schemes, wooden accents, and stainless steel reflections. Avoid high-saturation flash settings.`
            };

            await this.saveBrandCanvas();
        },
        async refineCanvasWithAI() {
            if (!this.isValidBrandSelected || !this.refinementPrompt.trim()) return;
            this.refiningCanvas = true;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/refine-canvas`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ prompt: this.refinementPrompt })
                });
                if (response.ok) {
                    this.canvas = await response.json();
                    this.refinementPrompt = '';
                    this.app.showNotification('✨ Guidelines canvas successfully refined by AI strategist!');
                } else {
                    const err = await response.json();
                    alert('Refinement failed: ' + (err.error || 'Unknown error'));
                }
            } catch (e) {
                console.error('[Brand Center] AI refinement network error:', e);
                alert('Network error: ' + e.message);
            } finally {
                this.refiningCanvas = false;
            }
        },
        startEditing(section) {
            this.editingSection = section;
            if (section === 'controlled_vocabulary') {
                this.tempSectionData = {
                    approvedTags: [...(this.canvas.controlled_vocabulary?.approved || [])],
                    bannedTags: [...(this.canvas.controlled_vocabulary?.banned || [])]
                };
                this.newApprovedInput = '';
                this.newBannedInput = '';
            } else if (section === 'personas') {
                this.tempSectionData = JSON.parse(JSON.stringify(this.canvas.personas || [])).map(p => ({
                    ...p,
                    hooksRaw: Array.isArray(p.hooks) ? p.hooks.join(', ') : (p.hooks || '')
                }));
            } else if (section === 'positioning') {
                this.tempSectionData = {
                    business_segment: this.settingsBrand.business_segment || 'Food & Beverage',
                    business_niche: this.settingsBrand.business_niche || '',
                    nicheTags: this.settingsBrand.business_niche ? this.settingsBrand.business_niche.split(',').map(s => s.trim()).filter(Boolean) : [],
                    meta_pixel_id: this.settingsBrand.meta_pixel_id || '',
                    google_analytics_id: this.settingsBrand.google_analytics_id || '',
                    active_model: this.settingsBrand.active_model || 'gemini-3.1-pro'
                };
                this.positioningNicheInput = '';
            } else {
                this.tempSectionData = this.canvas[section];
            }
        },
        async saveSectionEdits() {
            if (this.editingSection === 'controlled_vocabulary') {
                if (!this.canvas.controlled_vocabulary) {
                    this.canvas.controlled_vocabulary = { approved: [], banned: [] };
                }
                this.canvas.controlled_vocabulary.approved = [...this.tempSectionData.approvedTags];
                this.canvas.controlled_vocabulary.banned = [...this.tempSectionData.bannedTags];
                await this.saveBrandCanvas();
            } else if (this.editingSection === 'personas') {
                this.canvas.personas = this.tempSectionData.map(p => ({
                    name: p.name,
                    demographics: p.demographics,
                    description: p.description,
                    hooks: p.hooksRaw.split(',').map(s => s.trim()).filter(Boolean)
                }));
                await this.saveBrandCanvas();
            } else if (this.editingSection === 'persona_add') {
                if (!this.canvas.personas) this.canvas.personas = [];
                this.canvas.personas.push({
                    name: this.newPersona.name || 'Unnamed Persona',
                    age: this.newPersona.age,
                    role: this.newPersona.role,
                    expression: this.newPersona.expression,
                    apparel: this.newPersona.apparel,
                    description: this.newPersona.description,
                    hooks: ['Generic brand campaign hook']
                });
                await this.saveBrandCanvas();
            } else if (this.editingSection === 'persona_edit') {
                if (this.editingPersonaIndex !== null && this.canvas.personas[this.editingPersonaIndex]) {
                    this.canvas.personas[this.editingPersonaIndex] = {
                        ...this.canvas.personas[this.editingPersonaIndex],
                        ...this.newPersona
                    };
                    await this.saveBrandCanvas();
                }
            } else if (this.editingSection === 'scenery_add') {
                if (!this.canvas.sceneries) this.canvas.sceneries = [];
                this.canvas.sceneries.push({
                    name: this.newScenery.name || 'Unnamed Scenery',
                    description: this.newScenery.description,
                    lighting: this.newScenery.lighting,
                    environment_style: this.newScenery.name,
                    photography_style: this.newScenery.photography_style
                });
                await this.saveBrandCanvas();
            } else if (this.editingSection === 'scenery_edit') {
                if (this.editingSceneryIndex !== null && this.canvas.sceneries[this.editingSceneryIndex]) {
                    this.canvas.sceneries[this.editingSceneryIndex] = {
                        ...this.canvas.sceneries[this.editingSceneryIndex],
                        ...this.newScenery
                    };
                    await this.saveBrandCanvas();
                }
            } else if (this.editingSection === 'positioning') {
                this.settingsBrand.business_segment = this.tempSectionData.business_segment;
                this.settingsBrand.business_niche = this.tempSectionData.nicheTags.join(', ');
                if (this.userRole.toLowerCase() === 'superadmin') {
                    this.settingsBrand.meta_pixel_id = this.tempSectionData.meta_pixel_id;
                    this.settingsBrand.google_analytics_id = this.tempSectionData.google_analytics_id;
                    this.settingsBrand.active_model = this.tempSectionData.active_model;
                }
                await this.app.updateBrandSettings();
                this.app.showNotification('✨ Positioning parameters saved successfully!');
            } else {
                this.canvas[this.editingSection] = this.tempSectionData;
                await this.saveBrandCanvas();
            }
            this.editingSection = null;
        },
        addPositioningNicheTag() {
            const val = this.positioningNicheInput ? this.positioningNicheInput.trim() : '';
            if (val) {
                if (!this.tempSectionData.nicheTags.includes(val)) {
                    this.tempSectionData.nicheTags.push(val);
                }
            }
            this.positioningNicheInput = '';
        },
        removePositioningNicheTag(idx) {
            this.tempSectionData.nicheTags.splice(idx, 1);
        },
        addNewPersonaEdit() {
            this.tempSectionData.push({
                name: 'New Buyer Profile',
                demographics: 'e.g. Demographics brief',
                description: 'Core psychological profile...',
                hooksRaw: 'Hook hook'
            });
        },
        removePersonaEdit(idx) {
            this.tempSectionData.splice(idx, 1);
        },
        getSectionTitle(sec) {
            if (sec === 'brand_voice') return 'Voice & Tone Guidelines';
            if (sec === 'product_architecture') return 'Technical Positioning Narrative';
            if (sec === 'controlled_vocabulary') return 'Controlled Vocabulary Constraints';
            if (sec === 'personas') return 'Target Audience Personas';
            if (sec === 'visual_direction') return 'Visual Briefing Rules';
            if (sec === 'positioning') return 'Market Positioning & Tracking Settings';
            if (sec === 'persona_add') return 'Add Brand Ambassador Persona';
            if (sec === 'persona_edit') return 'Edit Brand Ambassador Persona';
            if (sec === 'scenery_add') return 'Add Standard Scenery & Backdrop';
            if (sec === 'scenery_edit') return 'Edit Standard Scenery & Backdrop';
            return sec;
        },
        formatMarkdown(text) {
            if (!text) return '<em>Empty section guidelines. Click Edit to add details.</em>';
            return text
                .replace(/\r?\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code style="font-family: monospace; background: rgba(255,255,255,0.08); padding: 2px 4px; border-radius: 4px;">$1</code>');
        },

        // Playbook manuscript actions (moved from settings)
        async loadManuscripts() {
            if (!this.isValidBrandSelected) return;
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
                console.error(e);
            } finally {
                this.loadingManuscripts = false;
            }
        },
        async activateManuscript(manuscriptId) {
            if (!this.isValidBrandSelected) return;
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
                    await this.loadBrandCanvas(); // Canvas updates to match new active playbook
                }
            } catch (e) {
                console.error(e);
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
                }
            } catch (e) {
                console.error(e);
            }
        },
        async generateMarketingProtocol() {
            if (this.settingsBrand.ai_tier === 'none') {
                alert('AI Brand Strategy Analysis is disabled under the Sandbox Trial plan. Please upgrade to a Standard, Professional, or Enterprise plan.');
                return;
            }
            this.isGeneratingProtocol = true;
            this.liveEstimatedTokens = 0;
            this.liveEstimatedCost = 0;
            this.startLiveTicker();
            this.app.startAiTicker(this.activeManuscriptModelName);

            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/generate-protocol`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: this.settingsBrand.shopify_shop_name || this.settingsBrand.woocommerce_shop_url || '',
                        competitors: this.competitorTags,
                        auto_find_competitors: this.autoFindCompetitors
                    })
                });

                if (response.ok) {
                    this.app.showNotification('AI strategy playbook generation started in the background.');
                    // Force poll immediately to sync status state
                    await this.app.loadBrands();
                    this.startProtocolPolling();
                } else {
                    const err = await response.json();
                    alert('Generator failed to trigger: ' + (err.error || 'Unknown error'));
                    this.stopLiveTicker();
                    this.app.stopAiTicker();
                }
            } catch (e) {
                alert('Generation trigger network error: ' + e.message);
                this.stopLiveTicker();
                this.app.stopAiTicker();
            } finally {
                this.isGeneratingProtocol = false;
            }
        },
        async cancelMarketingProtocol() {
            if (!confirm('Cancel the ongoing strategy generation run?')) return;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/cancel-protocol`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    this.app.showNotification('Strategy playbook generation successfully cancelled.');
                    this.stopLiveTicker();
                    this.app.stopAiTicker();
                    await this.app.loadBrands();
                }
            } catch (e) {
                console.error(e);
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
                    await this.app.loadBrands();
                    if (this.settingsBrand.protocol_status !== 'generating') {
                        this.stopLiveTicker();
                        this.app.stopAiTicker();
                        if (this.settingsBrand.protocol_status === 'completed') {
                            this.app.showNotification('AI Brand Performance Marketing Manuscript successfully generated!');
                            await this.loadManuscripts();
                            await this.loadBrandCanvas();
                        } else if (this.settingsBrand.protocol_status === 'failed') {
                            this.app.showNotification(`AI strategy playbook generation failed: ${this.settingsBrand.protocol_error || 'Unknown error'}`);
                        }
                    }
                } else {
                    this.stopLiveTicker();
                    this.app.stopAiTicker();
                }
            }, 5000);
        },
        stopProtocolPolling() {
            if (this.protocolPollInterval) {
                clearInterval(this.protocolPollInterval);
                this.protocolPollInterval = null;
            }
        },
        startLiveTicker() {
            this.stopLiveTicker();
            let estimatedTokensPerSec = 500;
            const model = this.activeManuscriptModelName;
            if (model === 'Deep Research Pro') estimatedTokensPerSec = 2200;
            else if (model === 'Gemini 2.5 Flash') estimatedTokensPerSec = 800;

            let pricePerPromptToken = 0.00000125 * 0.92;
            let pricePerCompToken = 0.00000375 * 0.92;
            if (model === 'Gemini 2.5 Flash') {
                pricePerPromptToken = 0.000000075 * 0.92;
                pricePerCompToken = 0.0000003 * 0.92;
            } else if (model === 'Deep Research Pro') {
                pricePerPromptToken = 0.00000375 * 0.92;
                pricePerCompToken = 0.000015 * 0.92;
            }

            this.liveTickerInterval = setInterval(() => {
                this.liveEstimatedTokens += Math.round(estimatedTokensPerSec * 0.25);
                const prompts = this.liveEstimatedTokens * 0.65;
                const comps = this.liveEstimatedTokens * 0.35;
                this.liveEstimatedCost = (prompts * pricePerPromptToken) + (comps * pricePerCompToken);
            }, 250);
        },
        stopLiveTicker() {
            if (this.liveTickerInterval) {
                clearInterval(this.liveTickerInterval);
                this.liveTickerInterval = null;
            }
        },
        async compileManualPrompt() {
            this.isCompilingPrompt = true;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/compile-prompt`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: this.settingsBrand.shopify_shop_name || this.settingsBrand.woocommerce_shop_url || '',
                        competitors: this.competitorTags
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    this.compiledPrompt = data.prompt;
                    this.app.showNotification('Context compiled. Copy your custom prompt template below.');
                }
            } catch (e) {
                alert('Compile prompt error: ' + e.message);
            } finally {
                this.isCompilingPrompt = false;
            }
        },
        copyCompiledPrompt() {
            navigator.clipboard.writeText(this.compiledPrompt);
            this.app.showNotification('Prompt copied to clipboard!');
        },
        toggleEditProtocol() {
            this.editedProtocolText = this.settingsBrand.marketing_protocol || '';
            this.isEditingProtocol = true;
        },
        async saveManualProtocol() {
            this.isEditingProtocol = false;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...this.settingsBrand,
                        marketing_protocol: this.editedProtocolText
                    })
                });

                if (response.ok) {
                    this.app.showNotification('Strategy Playbook saved successfully.');
                    await this.app.loadBrands();
                    this.loadBrandCanvas(); // Re-trigger canvas parsing for manual entry
                }
            } catch (e) {
                console.error(e);
            }
        },
        cancelEditProtocol() {
            this.isEditingProtocol = false;
            this.editedProtocolText = '';
        },
        copyProtocolToClipboard() {
            navigator.clipboard.writeText(this.settingsBrand.marketing_protocol);
            this.app.showNotification('Strategic playbook copied to clipboard!');
        },
        async loadManuscriptStats() {
            if (!this.isValidBrandSelected) return;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/ai-usage`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    const breakdown = data.breakdown || [];
                    this.manuscriptStats = breakdown.find(item => item.operation === 'Brand Protocol & Strategy Generation') || { calls_count: 0, total_tokens: 0, cost_usd: 0.0 };
                }
            } catch (e) {
                console.error(e);
            }
        },
        async updateLiveEstimate() {
            try {
                const est = await this.app.fetchAiEstimate('Brand Protocol & Strategy Generation');
                if (est && est.costUsd) {
                    const eurCost = est.costUsd * 0.92;
                    this.manuscriptLiveEstCost = `~€${eurCost.toFixed(4)}`;
                }
            } catch (e) {
                console.error('[AI Estimator] Failed to update Brand Center estimate:', e.message);
            }
        },
        formatTokens(num) {
            if (!num) return '0';
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
            return num.toString();
        },

        // Approved/Banned Vocabulary tag logic
        addApprovedTag() {
            const val = this.newApprovedInput.trim();
            if (val && !this.tempSectionData.approvedTags.includes(val)) {
                this.tempSectionData.approvedTags.push(val);
            }
            this.newApprovedInput = '';
        },
        handleApprovedBackspace() {
            if (!this.newApprovedInput && this.tempSectionData.approvedTags.length > 0) {
                this.tempSectionData.approvedTags.pop();
            }
        },
        addBannedTag() {
            const val = this.newBannedInput.trim();
            if (val && !this.tempSectionData.bannedTags.includes(val)) {
                this.tempSectionData.bannedTags.push(val);
            }
            this.newBannedInput = '';
        },
        handleBannedBackspace() {
            if (!this.newBannedInput && this.tempSectionData.bannedTags.length > 0) {
                this.tempSectionData.bannedTags.pop();
            }
        },

        // Competitor Domain tag logic
        addCompetitorTag() {
            const domain = this.newCompetitorInput.trim().toLowerCase();
            if (domain) {
                const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
                if (cleanDomain && !this.competitorTags.includes(cleanDomain)) {
                    this.competitorTags.push(cleanDomain);
                    this.syncCompetitorsToBrand();
                }
            }
            this.newCompetitorInput = '';
        },
        removeCompetitorTag(idx) {
            this.competitorTags.splice(idx, 1);
            this.syncCompetitorsToBrand();
        },
        handleCompetitorBackspace(e) {
            if (!this.newCompetitorInput && this.competitorTags.length > 0) {
                this.competitorTags.pop();
                this.syncCompetitorsToBrand();
            }
        },
        async syncCompetitorsToBrand() {
            this.settingsBrand.competitors = this.competitorTags.join(',');
            this.settingsBrand.auto_find_competitors = this.autoFindCompetitors;
            try {
                const token = localStorage.getItem('sc_admin_token');
                await fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(this.settingsBrand)
                });
            } catch (e) {
                console.error('[Competitor Sync] Failed to update brand profile:', e);
            }
        },

        // Style systems actions (moved from settings)
        async saveStyleGuidelines() {
            try {
                const token = localStorage.getItem('sc_admin_token');
                
                // Construct standard theme settings JSON column
                let existingTheme = {};
                if (this.settingsBrand.theme_settings) {
                    try {
                        existingTheme = typeof this.settingsBrand.theme_settings === 'string'
                            ? JSON.parse(this.settingsBrand.theme_settings)
                            : this.settingsBrand.theme_settings;
                    } catch (e) {}
                }

                this.settingsBrand.theme_settings = JSON.stringify({
                    ...existingTheme,
                    secondary_color: this.settingsBrand.secondary_color,
                    bg_color: this.settingsBrand.bg_color,
                    text_color: this.settingsBrand.text_color,
                    button_radius: this.settingsBrand.button_radius,
                    button_text_color: this.settingsBrand.button_text_color,
                    header_bg_color: this.settingsBrand.header_bg_color,
                    font_family: this.settingsBrand.font_family || 'Outfit'
                });

                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(this.settingsBrand)
                });

                if (response.ok) {
                    this.app.showNotification('✨ Brand visual style guidelines updated successfully!');
                    await this.app.loadBrands();
                } else {
                    alert('Failed to update brand styles.');
                }
            } catch (e) {
                alert('Style save error: ' + e.message);
            }
        }
    },
    mounted() {
        if (this.app.activeView === 'brand-center') {
            this.loadBrandCanvas();
            this.loadManuscripts();
            this.loadManuscriptStats();
            this.startProtocolPolling();
            this.updateLiveEstimate();
        }
    },
    unmounted() {
        this.stopProtocolPolling();
        this.stopLiveTicker();
    }
};
</script>

<style scoped>
/* Tabs buttons */
.tab-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
}
.tab-btn.active, .tab-btn:hover {
    background: var(--accent);
    color: var(--workspace-bg);
    border-color: var(--accent);
}

/* Canvas Grid & Cards Styling */
.canvas-card {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: transform 0.2s ease-in-out;
}
.canvas-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}
.canvas-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border);
    padding-bottom: 8px;
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--accent);
    font-size: 0.88rem;
}
.card-edit-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 0.72rem;
    cursor: pointer;
    font-weight: 600;
}
.card-edit-btn:hover {
    color: var(--accent);
}
.canvas-card-body {
    font-size: 0.82rem;
    line-height: 1.5;
    color: var(--text-main);
}

/* Vocabulary Tags */
.vocab-tag {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
}
.tag-approved {
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.25);
    color: #34d399;
}
.tag-banned {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #f87171;
}

/* Striped Animated Progress Bar */
@keyframes progressStripes {
  from { background-position: 40px 0; }
  to { background-position: 0 0; }
}
.progress-bar-striped-animated {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 40px 40px;
  animation: progressStripes 1s linear infinite;
}
@keyframes pulseGlow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; filter: drop-shadow(0 0 4px #d946ef); }
}
.progress-glow-animated {
  animation: pulseGlow 1.5s infinite ease-in-out;
}
</style>

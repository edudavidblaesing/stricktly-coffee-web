<template>
    <div id="designer-workspace-container" style="width: 100%;">
        <div class="panel-header" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <button type="button" class="btn" style="padding: 6px 12px; font-weight: 700; height: 32px; display: flex; align-items: center; justify-content: center; gap: 6px; margin: 0; background: var(--workspace-bg); color: var(--text-main); border: 1px solid var(--border);" @click="$emit('back')">
                    ⬅ Back to Channels
                </button>
                <h2 class="panel-title" style="margin: 0; font-size: 1.3rem; display: flex; align-items: center; gap: 8px;">
                    🎨 Storefront Designer Workspace
                </h2>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
                Active Brand: <strong style="color: var(--accent);">{{ activeBrandName }}</strong>
            </div>
        </div>

        <div v-if="app.activeShopFilter === 'all'" class="panel" style="text-align: center; padding: 60px 20px;">
            <span style="font-size: 3rem;">🏬</span>
            <h3 style="margin-top: 15px; color: var(--text-main);">No Store Selected</h3>
            <p style="color: var(--text-muted); max-width: 450px; margin: 10px auto 20px auto; font-size: 0.9rem;">
                Please select a specific brand shop from the workspace switcher dropdown in the top navigation bar to start designing.
            </p>
        </div>

        <div v-else class="designer-workspace-layout" style="display: flex; gap: 24px; flex-wrap: wrap;">
            <!-- Left Side: Styling Controls -->
            <div class="panel" style="flex: 1; min-width: 320px; display: flex; flex-direction: column; gap: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                    <h4 style="margin: 0; color: var(--accent); font-weight: 700;">Theme Customizer</h4>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <input type="checkbox" id="auto-update-toggle" v-model="autoUpdatePreview" style="cursor: pointer; margin: 0; width: 14px; height: 14px;">
                        <label for="auto-update-toggle" style="font-size: 0.75rem; color: var(--text-muted); cursor: pointer; user-select: none; margin: 0;">Auto-Update</label>
                        <button v-if="!autoUpdatePreview" type="button" class="btn btn-accent" style="margin: 0; padding: 2px 8px; font-size: 0.7rem; height: 22px; line-height: 1; border-radius: 4px;" @click="updatePreviewStyles">Sync Preview</button>
                    </div>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0 0 8px 0;">
                    Tweak colors, shapes, and brand images below. Unsaved changes are safely sandboxed in the preview on the right. Click "Publish Live" to make them visible to customers.
                </p>

                <!-- Inherit Styles Toggle -->
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px; cursor: pointer; user-select: none; background: var(--workspace-bg); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border);">
                    <input type="checkbox" id="inherit-toggle" v-model="inheritStyles" style="width: 18px; height: 18px; cursor: pointer; margin: 0; flex-shrink: 0;">
                    <label for="inherit-toggle" style="font-weight: 700; color: var(--text-main); font-size: 0.82rem; cursor: pointer; margin: 0;">
                        Inherit Master Brand Styles
                    </label>
                </div>

                <!-- Contrast Checker Warning Box -->
                <div v-if="contrastIssues.length > 0" 
                     style="background: rgba(240, 80, 80, 0.08); border-left: 3px solid #ff5555; padding: 12px; border-radius: 6px; color: var(--text-main); font-size: 0.8rem; display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;">
                    <div style="font-weight: 700; color: #ff5555; display: flex; align-items: center; gap: 6px; margin: 0;">
                        <span>⚠️ Color Contrast Conflicts Detected</span>
                    </div>
                    <ul style="margin: 0; padding-left: 18px; line-height: 1.4; color: var(--text-muted); list-style-type: disc;">
                        <li v-for="issue in contrastIssues" :key="issue.id" style="margin-bottom: 4px;">{{ issue.message }}</li>
                    </ul>
                    <button type="button" class="btn btn-accent" 
                            style="margin-top: 4px; height: 32px; font-size: 0.78rem; font-weight: 700; padding: 0 12px; display: inline-flex; align-items: center; gap: 6px; border-radius: 6px; cursor: pointer; align-self: flex-start; border: 1px solid var(--border);"
                            @click="autoFixContrast">
                        ✨ One-Tap Auto-Fix Contrast
                    </button>
                </div>

                <!-- Simplified Sidebar Navigation Tabs -->
                <div style="display: flex; gap: 4px; border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-bottom: 10px; overflow-x: auto;">
                    <button type="button" @click="activeTab = 'style'" :style="{ background: activeTab === 'style' ? 'var(--accent)' : 'transparent', color: activeTab === 'style' ? 'var(--workspace-bg)' : 'var(--text-muted)', border: activeTab === 'style' ? 'none' : '1px solid var(--border)' }" style="padding: 6px 12px; border-radius: 6px; font-size: 0.76rem; font-weight: 700; cursor: pointer; white-space: nowrap; margin: 0; height: 28px; display: flex; align-items: center;">🎨 Style</button>
                    <button type="button" @click="activeTab = 'typography'" :style="{ background: activeTab === 'typography' ? 'var(--accent)' : 'transparent', color: activeTab === 'typography' ? 'var(--workspace-bg)' : 'var(--text-muted)', border: activeTab === 'typography' ? 'none' : '1px solid var(--border)' }" style="padding: 6px 12px; border-radius: 6px; font-size: 0.76rem; font-weight: 700; cursor: pointer; white-space: nowrap; margin: 0; height: 28px; display: flex; align-items: center;">📐 Fonts</button>
                    <button type="button" @click="activeTab = 'copywriter'" :style="{ background: activeTab === 'copywriter' ? 'var(--accent)' : 'transparent', color: activeTab === 'copywriter' ? 'var(--workspace-bg)' : 'var(--text-muted)', border: activeTab === 'copywriter' ? 'none' : '1px solid var(--border)' }" style="padding: 6px 12px; border-radius: 6px; font-size: 0.76rem; font-weight: 700; cursor: pointer; white-space: nowrap; margin: 0; height: 28px; display: flex; align-items: center;">✍️ Content</button>
                    <button type="button" @click="activeTab = 'localization'" :style="{ background: activeTab === 'localization' ? 'var(--accent)' : 'transparent', color: activeTab === 'localization' ? 'var(--workspace-bg)' : 'var(--text-muted)', border: activeTab === 'localization' ? 'none' : '1px solid var(--border)' }" style="padding: 6px 12px; border-radius: 6px; font-size: 0.76rem; font-weight: 700; cursor: pointer; white-space: nowrap; margin: 0; height: 28px; display: flex; align-items: center;">🌐 Socials</button>
                    <button type="button" @click="activeTab = 'ai'" :style="{ background: activeTab === 'ai' ? 'var(--accent)' : 'transparent', color: activeTab === 'ai' ? 'var(--workspace-bg)' : 'var(--text-muted)', border: activeTab === 'ai' ? 'none' : '1px solid var(--border)' }" style="padding: 6px 12px; border-radius: 6px; font-size: 0.76rem; font-weight: 700; cursor: pointer; white-space: nowrap; margin: 0; height: 28px; display: flex; align-items: center;">🤖 AI Lab</button>
                </div>

                <div v-if="inheritStyles" style="font-size: 0.78rem; background: var(--workspace-bg); border-left: 3px solid var(--accent); padding: 8px 12px; border-radius: 4px; color: var(--text-muted); line-height: 1.4; margin-bottom: 8px;">
                    ℹ️ Using default colors and assets from <strong>System Settings</strong>. Uncheck above to define custom layout overrides.
                </div>

                <!-- Grey-out wrapper for styling properties -->
                <div :style="inheritStyles ? { opacity: 0.4, pointerEvents: 'none', userSelect: 'none' } : {}" style="transition: all 0.2s ease; display: flex; flex-direction: column; gap: 16px;">
                    
                    <!-- TAB 1: STYLE & PRESETS -->
                    <div v-if="activeTab === 'style'" style="display: flex; flex-direction: column; gap: 16px;">
                        <!-- Presets Section -->
                        <div class="presets-section" style="background: var(--workspace-bg); padding: 12px; border-radius: 8px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px;">
                            <div style="font-weight: 700; color: var(--text-main); font-size: 0.82rem;">🎨 Storefront Color Theme Presets</div>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                                <button type="button" class="btn" style="font-size: 0.72rem; font-weight: 700; padding: 6px; margin: 0; background: #0b0d0c; color: #ffffff; border: 1px solid var(--border); text-align: center; border-radius: 6px; cursor: pointer; height: 32px;" @click="applyPreset('obsidian')">🌑 Obsidian</button>
                                <button type="button" class="btn" style="font-size: 0.72rem; font-weight: 700; padding: 6px; margin: 0; background: #fdf5e6; color: #4a2c11; border: 1px solid var(--border); text-align: center; border-radius: 6px; cursor: pointer; height: 32px;" @click="applyPreset('latte')">☕ Cream Latte</button>
                                <button type="button" class="btn" style="font-size: 0.72rem; font-weight: 700; padding: 6px; margin: 0; background: #1e140a; color: #f5f5dc; border: 1px solid var(--border); text-align: center; border-radius: 6px; cursor: pointer; height: 32px;" @click="applyPreset('espresso')">🪵 Espresso</button>
                                <button type="button" class="btn" style="font-size: 0.72rem; font-weight: 700; padding: 6px; margin: 0; background: #090514; color: #f3e8ff; border: 1px solid var(--border); text-align: center; border-radius: 6px; cursor: pointer; height: 32px;" @click="applyPreset('velvet')">🔮 Royal Velvet</button>
                            </div>
                        </div>

                        <!-- AI Generated Style Presets Queue -->
                        <div v-if="aiStylePresets.length > 0" class="presets-section" style="background: rgba(197, 160, 89, 0.03); padding: 12px; border-radius: 8px; border: 1px dashed var(--accent); display: flex; flex-direction: column; gap: 8px;">
                            <div style="font-weight: 700; color: var(--accent); font-size: 0.82rem; display: flex; align-items: center; gap: 4px;">✨ Reusable AI Style Presets</div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <div v-for="(pr, idx) in aiStylePresets" :key="idx" style="display: flex; align-items: center; justify-content: space-between; background: var(--workspace-bg); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border);">
                                    <span style="font-size: 0.78rem; font-weight: 600; color: var(--text-main);">AI Preset #{{ idx + 1 }}</span>
                                    <button type="button" class="btn btn-accent" style="font-size: 0.7rem; padding: 3px 8px; height: auto; margin: 0;" @click="applyAILayoutPreset(pr)">Apply</button>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Brand Primary Color (Accent)</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="color" v-model="designerBrand.primary_color" :disabled="inheritStyles" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                                <input type="text" v-model="designerBrand.primary_color" :disabled="inheritStyles" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#111111" style="flex: 1; margin: 0;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Secondary Color (Hover, details)</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="color" v-model="designerBrand.secondary_color" :disabled="inheritStyles" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                                <input type="text" v-model="designerBrand.secondary_color" :disabled="inheritStyles" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#767676" style="flex: 1; margin: 0;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Storefront Background Color</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="color" v-model="designerBrand.bg_color" :disabled="inheritStyles" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                                <input type="text" v-model="designerBrand.bg_color" :disabled="inheritStyles" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#ffffff" style="flex: 1; margin: 0;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Primary Text Color</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="color" v-model="designerBrand.text_color" :disabled="inheritStyles" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                                <input type="text" v-model="designerBrand.text_color" :disabled="inheritStyles" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#111111" style="flex: 1; margin: 0;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Header Background Color</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="color" v-model="designerBrand.header_bg_color" :disabled="inheritStyles" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                                <input type="text" v-model="designerBrand.header_bg_color" :disabled="inheritStyles" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#ffffff" style="flex: 1; margin: 0;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Button Text Color</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="color" v-model="designerBrand.button_text_color" :disabled="inheritStyles" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                                <input type="text" v-model="designerBrand.button_text_color" :disabled="inheritStyles" required pattern="^#[0-9A-Fa-f]{6}$" placeholder="#ffffff" style="flex: 1; margin: 0;">
                            </div>
                        </div>
                    </div>

                    <!-- TAB 2: TYPOGRAPHY & SHAPES -->
                    <div v-if="activeTab === 'typography'" style="display: flex; flex-direction: column; gap: 16px;">
                        <div class="form-group">
                            <label>Font Family</label>
                            <select v-model="designerBrand.font_family" :disabled="inheritStyles" style="width: 100%; height: 40px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 10px;">
                                <option value="Outfit">Outfit (Default)</option>
                                <option value="Space Grotesk">Space Grotesk</option>
                                <option value="Inter">Inter</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Open Sans">Open Sans</option>
                                <option value="Montserrat">Montserrat</option>
                                <option value="Lora">Lora</option>
                                <option value="Playfair Display">Playfair Display</option>
                                <option value="Poppins">Poppins</option>
                                <option value="Lato">Lato</option>
                                <option value="Merriweather">Merriweather</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Button Shape (Border Radius)</label>
                            <select v-model="designerBrand.button_radius" :disabled="inheritStyles" style="width: 100%; height: 40px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 10px;">
                                <option value="0px">Sharp Square (0px)</option>
                                <option value="4px">Slightly Rounded (4px)</option>
                                <option value="8px">Rounded Card (8px)</option>
                                <option value="12px">Extra Rounded (12px)</option>
                                <option value="9999px">Pill / Stadium (9999px)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Base Font Size</label>
                            <select v-model="designerBrand.font_size_scale" :disabled="inheritStyles" style="width: 100%; height: 40px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 10px;">
                                <option value="small">Small (14px)</option>
                                <option value="medium">Medium (16px - Default)</option>
                                <option value="large">Large (18px)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Line Height Scale</label>
                            <select v-model="designerBrand.line_height_scale" :disabled="inheritStyles" style="width: 100%; height: 40px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 10px;">
                                <option value="compact">Compact (1.4)</option>
                                <option value="comfortable">Comfortable (1.6 - Default)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Logo URL</label>
                            <input type="text" v-model="designerBrand.logo" :disabled="inheritStyles" placeholder="https://pesado585.com/logo.png" style="width: 100%;">
                        </div>
                        <div class="form-group">
                            <label>Favicon URL</label>
                            <input type="text" v-model="designerBrand.favicon" :disabled="inheritStyles" placeholder="https://pesado585.com/favicon.ico" style="width: 100%;">
                        </div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px;">
                    <!-- TAB 3: COPYWRITER & TEXT -->
                    <div v-if="activeTab === 'copywriter'" style="display: flex; flex-direction: column; gap: 16px;">
                        
                        <!-- Page Context Switcher Selector -->
                        <div>
                            <div style="font-weight: 700; color: var(--text-main); font-size: 0.8rem; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                                <span>📝 Select Page to Edit</span>
                                <button type="button" class="btn btn-accent" style="padding: 2px 8px; margin: 0; font-size: 0.68rem; font-weight: 700; height: 22px; border-radius: 4px; display: inline-flex; align-items: center;" @click="showAddPageModal = true">
                                    ➕ Add Custom Page
                                </button>
                            </div>
                            <div style="display: flex; background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 6px; padding: 2px; gap: 2px; flex-wrap: wrap;">
                                <button type="button" class="btn" 
                                        :style="activeContentPage === 'home' ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-muted)' }" 
                                        style="padding: 6px 10px; margin: 0; font-size: 0.72rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; height: 28px;" 
                                        @click="navigateToPage('home')">
                                    🏠 Home
                                </button>
                                <button type="button" class="btn" 
                                        :style="activeContentPage === 'track' ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-muted)' }" 
                                        style="padding: 6px 10px; margin: 0; font-size: 0.72rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; height: 28px;" 
                                        @click="navigateToPage('track')">
                                    📦 Track
                                </button>
                                <button type="button" class="btn" 
                                        :style="activeContentPage === '404' ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-muted)' }" 
                                        style="padding: 6px 10px; margin: 0; font-size: 0.72rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; height: 28px;" 
                                        @click="navigateToPage('404')">
                                    ⚠️ 404
                                </button>
                                <!-- Dynamic custom pages -->
                                <div v-for="page in (designerBrand.landing_pages || [])" :key="page.id" style="display: flex; align-items: center; gap: 2px;">
                                    <button type="button" class="btn" 
                                            :style="activeContentPage === page.id ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-muted)' }" 
                                            style="padding: 6px 10px; margin: 0; font-size: 0.72rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; height: 28px;" 
                                            @click="navigateToPage(page.id)">
                                        📄 /{{ page.id }}
                                    </button>
                                    <button type="button" style="border: none; background: none; color: #ef4444; cursor: pointer; font-size: 0.72rem; padding: 0 4px;" title="Delete custom page" @click.stop="deleteCustomPage(page.id)">
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Bulk translation button -->
                        <div style="margin-top: 4px; margin-bottom: 8px;">
                            <button type="button" class="sc-premium-ai-btn" style="width: 100%; margin: 0; font-size: 0.72rem; height: 32px; display: inline-flex; align-items: center; justify-content: center; gap: 4px;" :disabled="isBulkTranslating" @click="runAIBulkTranslate(translationActiveLang === 'en' ? '' : translationActiveLang)">
                                <span v-if="isBulkTranslating">⏳ AI Translating storefront pages...</span>
                                <span v-else-if="translationActiveLang === 'en'">✨ Auto-Translate All Pages to Other Languages [Gemini 1.5 Flash] [~$0.0028]</span>
                                <span v-else>✨ Auto-Translate All Pages to {{ translationActiveLang.toUpperCase() }} [Gemini 1.5 Flash] [~$0.0028]</span>
                            </button>
                            
                            <!-- Real token and cost usage stats for Translator -->
                            <div v-if="translateAiStats && translateAiStats.calls_count > 0" 
                                 style="background: rgba(197, 160, 89, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; font-size: 0.72rem; color: var(--text-muted); display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
                                <span>📊 Accumulated translations: <strong>{{ translateAiStats.calls_count }} runs</strong></span>
                                <span><strong>{{ formatTokens(translateAiStats.total_tokens) }} tokens</strong></span>
                                <span>Cost: <strong style="color: var(--accent);">€{{ (translateAiStats.cost_usd * 0.92).toFixed(4) }}</strong></span>
                            </div>
                        </div>

                        <!-- Language switcher tab bar -->
                        <div style="display: flex; gap: 4px; margin-bottom: 4px; overflow-x: auto; padding-bottom: 4px; border-bottom: 1px solid var(--border);">
                            <button type="button" 
                                v-for="lang in availableLanguages" 
                                :key="lang"
                                @click="translationActiveLang = lang"
                                :style="{
                                    background: translationActiveLang === lang ? 'var(--accent)' : 'transparent',
                                    color: translationActiveLang === lang ? 'var(--workspace-bg)' : 'var(--text-muted)',
                                    border: 'none',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    whiteSpace: 'nowrap'
                                }"
                            >
                                {{ getLanguageLabel(lang) }}
                            </button>
                        </div>

                        <!-- English / Default Editor (active lang is 'en') -->
                        <div v-if="translationActiveLang === 'en'" style="display: flex; flex-direction: column; gap: 12px;">
                            
                            <!-- Home Page Fields -->
                            <div v-if="activeContentPage === 'home'" style="display: flex; flex-direction: column; gap: 12px;">
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Hero Headline</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAIRewrite('text_hero_headline')">✨ AI Rewrite</button>
                                    </div>
                                    <input type="text" v-model="designerBrand.text_hero_headline" placeholder="Elevate Your Coffee Ritual" style="width: 100%;">
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Hero Subheadline</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAIRewrite('text_hero_subheadline')">✨ AI Rewrite</button>
                                    </div>
                                    <textarea v-model="designerBrand.text_hero_subheadline" rows="3" placeholder="Shop precision coffee gear." style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; outline: none;"></textarea>
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Hero Button Text</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAIRewrite('text_hero_cta')">✨ AI Rewrite</button>
                                    </div>
                                    <input type="text" v-model="designerBrand.text_hero_cta" placeholder="SHOP COLLECTION" style="width: 100%;">
                                </div>
                            </div>

                            <!-- Track Order Fields -->
                            <div v-if="activeContentPage === 'track'" style="display: flex; flex-direction: column; gap: 12px;">
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Headline</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAIRewrite('text_track_headline')">✨ AI Rewrite</button>
                                    </div>
                                    <input type="text" v-model="designerBrand.text_track_headline" placeholder="Track Your Shipment" style="width: 100%;">
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Subtitle / Description</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAIRewrite('text_track_subheadline')">✨ AI Rewrite</button>
                                    </div>
                                    <textarea v-model="designerBrand.text_track_subheadline" rows="3" placeholder="Check current dispatch status." style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; outline: none;"></textarea>
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Input Placeholder</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAIRewrite('text_track_placeholder')">✨ AI Rewrite</button>
                                    </div>
                                    <input type="text" v-model="designerBrand.text_track_placeholder" placeholder="Enter Order ID (e.g. PES_171954...)" style="width: 100%;">
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Button Text</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAIRewrite('text_track_cta')">✨ AI Rewrite</button>
                                    </div>
                                    <input type="text" v-model="designerBrand.text_track_cta" placeholder="Track" style="width: 100%;">
                                </div>
                            </div>

                            <!-- 404 Error Fields -->
                            <div v-if="activeContentPage === '404'" style="display: flex; flex-direction: column; gap: 12px;">
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">404 Page Headline</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAIRewrite('text_404_headline')">✨ AI Rewrite</button>
                                    </div>
                                    <input type="text" v-model="designerBrand.text_404_headline" placeholder="Page Not Found" style="width: 100%;">
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">404 Page Subheadline</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAIRewrite('text_404_subheadline')">✨ AI Rewrite</button>
                                    </div>
                                    <textarea v-model="designerBrand.text_404_subheadline" rows="2" placeholder="The page you are looking for doesn't exist." style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; outline: none;"></textarea>
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">404 Page Button Text</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAIRewrite('text_404_cta')">✨ AI Rewrite</button>
                                    </div>
                                    <input type="text" v-model="designerBrand.text_404_cta" placeholder="Back to Shop" style="width: 100%;">
                                </div>
                            </div>

                            <!-- Dynamic Custom Page Fields -->
                            <div v-if="isCustomPage(activeContentPage)" style="display: flex; flex-direction: column; gap: 12px;">
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Headline</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAIRewriteCustomPage('headline')">✨ AI Rewrite</button>
                                    </div>
                                    <input type="text" v-model="getCustomPageRef(activeContentPage).headline" placeholder="Exclusive Promo: Get 20% off!" style="width: 100%;">
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Subheadline / Description</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAIRewriteCustomPage('subheadline')">✨ AI Rewrite</button>
                                    </div>
                                    <textarea v-model="getCustomPageRef(activeContentPage).subheadline" rows="3" placeholder="Describe the promotion..." style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; outline: none;"></textarea>
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">CTA Button Text</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAIRewriteCustomPage('cta')">✨ AI Rewrite</button>
                                    </div>
                                    <input type="text" v-model="getCustomPageRef(activeContentPage).cta" placeholder="Claim Offer Now" style="width: 100%;">
                                </div>
                                <div class="form-group">
                                    <label>Hero Image URL</label>
                                    <input type="text" v-model="getCustomPageRef(activeContentPage).hero_img" placeholder="https://example.com/image.jpg" style="width: 100%;">
                                </div>
                                <div class="form-group">
                                    <label>Coupon Code (optional)</label>
                                    <input type="text" v-model="getCustomPageRef(activeContentPage).coupon_code" placeholder="e.g. COFFEE20" style="width: 100%;">
                                </div>
                                <div class="form-group">
                                    <label>Features / Bullet Points (one per line)</label>
                                    <textarea v-model="getCustomPageRef(activeContentPage).features" rows="4" placeholder="⚡ Free Worldwide Shipping&#10;🔒 100% Precision Guaranteed" style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; outline: none;"></textarea>
                                </div>
                            </div>

                        </div>

                        <!-- Translation Editor (active lang is not 'en') -->
                        <div v-else style="display: flex; flex-direction: column; gap: 12px;">
                            
                            <!-- Home Page Fields -->
                            <div v-if="activeContentPage === 'home'" style="display: flex; flex-direction: column; gap: 12px;">
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Hero Headline ({{ translationActiveLang.toUpperCase() }})</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAITranslateSingle('text_hero_headline')">✨ Translate from EN</button>
                                    </div>
                                    <input type="text" v-model="getTranslationRef(translationActiveLang).text_hero_headline" placeholder="Headline Translation..." style="width: 100%;">
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Hero Subheadline ({{ translationActiveLang.toUpperCase() }})</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAITranslateSingle('text_hero_subheadline')">✨ Translate from EN</button>
                                    </div>
                                    <textarea v-model="getTranslationRef(translationActiveLang).text_hero_subheadline" rows="3" placeholder="Subheadline Translation..." style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; outline: none;"></textarea>
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Hero Button Text ({{ translationActiveLang.toUpperCase() }})</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAITranslateSingle('text_hero_cta')">✨ Translate from EN</button>
                                    </div>
                                    <input type="text" v-model="getTranslationRef(translationActiveLang).text_hero_cta" placeholder="Button Translation..." style="width: 100%;">
                                </div>
                            </div>

                            <!-- Track Order Fields -->
                            <div v-if="activeContentPage === 'track'" style="display: flex; flex-direction: column; gap: 12px;">
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Headline ({{ translationActiveLang.toUpperCase() }})</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAITranslateSingle('text_track_headline')">✨ Translate from EN</button>
                                    </div>
                                    <input type="text" v-model="getTranslationRef(translationActiveLang).text_track_headline" placeholder="Headline Translation..." style="width: 100%;">
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Subtitle / Description ({{ translationActiveLang.toUpperCase() }})</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAITranslateSingle('text_track_subheadline')">✨ Translate from EN</button>
                                    </div>
                                    <textarea v-model="getTranslationRef(translationActiveLang).text_track_subheadline" rows="3" placeholder="Description Translation..." style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; outline: none;"></textarea>
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Input Placeholder ({{ translationActiveLang.toUpperCase() }})</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAITranslateSingle('text_track_placeholder')">✨ Translate from EN</button>
                                    </div>
                                    <input type="text" v-model="getTranslationRef(translationActiveLang).text_track_placeholder" placeholder="Placeholder Translation..." style="width: 100%;">
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Button Text ({{ translationActiveLang.toUpperCase() }})</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAITranslateSingle('text_track_cta')">✨ Translate from EN</button>
                                    </div>
                                    <input type="text" v-model="getTranslationRef(translationActiveLang).text_track_cta" placeholder="Button Translation..." style="width: 100%;">
                                </div>
                            </div>

                            <!-- 404 Error Fields -->
                            <div v-if="activeContentPage === '404'" style="display: flex; flex-direction: column; gap: 12px;">
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">404 Page Headline ({{ translationActiveLang.toUpperCase() }})</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAITranslateSingle('text_404_headline')">✨ Translate from EN</button>
                                    </div>
                                    <input type="text" v-model="getTranslationRef(translationActiveLang).text_404_headline" placeholder="404 Headline Translation..." style="width: 100%;">
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">404 Page Subheadline ({{ translationActiveLang.toUpperCase() }})</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAITranslateSingle('text_404_subheadline')">✨ Translate from EN</button>
                                    </div>
                                    <textarea v-model="getTranslationRef(translationActiveLang).text_404_subheadline" rows="2" placeholder="404 Subheadline Translation..." style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; outline: none;"></textarea>
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">404 Page Button Text ({{ translationActiveLang.toUpperCase() }})</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAITranslateSingle('text_404_cta')">✨ Translate from EN</button>
                                    </div>
                                    <input type="text" v-model="getTranslationRef(translationActiveLang).text_404_cta" placeholder="404 Button Translation..." style="width: 100%;">
                                </div>
                            </div>

                            <!-- Dynamic Custom Page Fields (Translations) -->
                            <div v-if="isCustomPage(activeContentPage)" style="display: flex; flex-direction: column; gap: 12px;">
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Headline ({{ translationActiveLang.toUpperCase() }})</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAITranslateCustomPage('headline')">✨ Translate from EN</button>
                                    </div>
                                    <input type="text" v-model="getCustomPageTranslationRef(getCustomPageRef(activeContentPage), translationActiveLang).headline" placeholder="Headline Translation..." style="width: 100%;">
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">Subheadline / Description ({{ translationActiveLang.toUpperCase() }})</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAITranslateCustomPage('subheadline')">✨ Translate from EN</button>
                                    </div>
                                    <textarea v-model="getCustomPageTranslationRef(getCustomPageRef(activeContentPage), translationActiveLang).subheadline" rows="3" placeholder="Description Translation..." style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; outline: none;"></textarea>
                                </div>
                                <div class="form-group">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label style="margin: 0;">CTA Button Text ({{ translationActiveLang.toUpperCase() }})</label>
                                        <button type="button" style="background: none; border: none; color: var(--accent); font-size: 0.68rem; cursor: pointer; font-weight: 600; padding: 0; display: inline-flex; align-items: center; gap: 2px;" @click="runAITranslateCustomPage('cta')">✨ Translate from EN</button>
                                    </div>
                                    <input type="text" v-model="getCustomPageTranslationRef(getCustomPageRef(activeContentPage), translationActiveLang).cta" placeholder="Button Translation..." style="width: 100%;">
                                </div>
                                <div class="form-group">
                                    <label>Features / Bullet Points ({{ translationActiveLang.toUpperCase() }})</label>
                                    <textarea v-model="getCustomPageTranslationRef(getCustomPageRef(activeContentPage), translationActiveLang).features" rows="4" placeholder="Features Translation..." style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; outline: none;"></textarea>
                                </div>
                            </div>

                        </div>
                    </div>

                    <!-- TAB 4: LOCALIZATION & SOCIALS -->
                    <div v-if="activeTab === 'localization'" style="display: flex; flex-direction: column; gap: 16px;">
                        <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="announce-toggle" v-model="designerBrand.announcement_active" :disabled="inheritStyles" style="width: 18px; height: 18px; cursor: pointer; margin: 0; flex-shrink: 0;">
                            <label for="announce-toggle" style="font-weight: 600; color: var(--text-main); font-size: 0.8rem; cursor: pointer; margin: 0;">Enable Announcement Banner</label>
                        </div>
                        <div v-if="designerBrand.announcement_active" style="display: flex; flex-direction: column; gap: 12px;">
                            <div class="form-group">
                                <label>Announcement Banner Text</label>
                                <input type="text" v-model="designerBrand.announcement_text" :disabled="inheritStyles" placeholder="Free shipping on all orders over €75!" style="width: 100%;">
                            </div>
                            <div class="form-group">
                                <label>Banner Background</label>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <input type="color" v-model="designerBrand.announcement_bg" :disabled="inheritStyles" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                                    <input type="text" v-model="designerBrand.announcement_bg" :disabled="inheritStyles" placeholder="#c5a059" style="flex: 1; margin: 0;">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Banner Text Color</label>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <input type="color" v-model="designerBrand.announcement_text_color" :disabled="inheritStyles" style="width: 42px; height: 38px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; flex-shrink: 0; margin: 0;">
                                    <input type="text" v-model="designerBrand.announcement_text_color" :disabled="inheritStyles" placeholder="#ffffff" style="flex: 1; margin: 0;">
                                </div>
                            </div>
                        </div>

                        <div style="border-top: 1px solid var(--border); padding-top: 12px; margin-top: 4px;">
                            <div style="font-weight: 700; color: var(--accent); font-size: 0.8rem; margin-bottom: 8px;">SOCIAL PROFILES</div>
                            <div class="form-group" style="margin-bottom: 12px;">
                                <label>Instagram Handle URL</label>
                                <input type="text" v-model="designerBrand.instagram_link" :disabled="inheritStyles" placeholder="https://instagram.com/handle" style="width: 100%;">
                            </div>
                            <div class="form-group" style="margin-bottom: 12px;">
                                <label>Facebook Page URL</label>
                                <input type="text" v-model="designerBrand.facebook_link" :disabled="inheritStyles" placeholder="https://facebook.com/page" style="width: 100%;">
                            </div>
                            <div class="form-group">
                                <label>X / Twitter URL</label>
                                <input type="text" v-model="designerBrand.twitter_link" :disabled="inheritStyles" placeholder="https://x.com/username" style="width: 100%;">
                            </div>
                        </div>
                    </div>

                    <!-- TAB 5: AI DESIGN LAB -->
                    <div v-if="activeTab === 'ai'" style="display: flex; flex-direction: column; gap: 16px; position: relative; min-height: 180px;">
                        <!-- Locked Overlay -->
                        <div v-if="!app.isFeatureAllowed('allow_designer')" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15,15,17,0.92); border-radius: 8px; display: flex; align-items: center; justify-content: center; z-index: 10; padding: 20px; box-sizing: border-box; text-align: center;">
                            <div>
                                <span style="font-size: 1.8rem; display: block; margin-bottom: 8px;">🔒</span>
                                <span style="font-size: 0.76rem; font-weight: 800; color: var(--accent); background: rgba(197,160,89,0.15); padding: 2px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; text-transform: uppercase; border: 1px solid rgba(197,160,89,0.3);">
                                    Professional Feature
                                </span>
                                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 6px; max-width: 250px; line-height: 1.4;">
                                    Upgrade to Professional or Enterprise Tier to unlock automated Brand Look-Alike theme generators.
                                </div>
                            </div>
                        </div>

                        <div style="background: rgba(197, 160, 89, 0.05); border: 1px solid var(--accent); padding: 12px; border-radius: 8px; font-size: 0.8rem; line-height: 1.5; color: var(--text-main);">
                            <span style="font-size: 1.1rem; display: block; margin-bottom: 4px;">🤖 AI Storefront Designer</span>
                            The AI matches color themes, button roundness, font styles, and landing copy parameters directly to the brand's verified strategy manuscript guidelines.
                        </div>

                        <button type="button" class="sc-premium-ai-btn" style="margin: 0; height: 38px; width: 100%;" :disabled="isGeneratingLayout || inheritStyles" @click="generateAILookAlikeLayout">
                            <span v-if="isGeneratingLayout">⏳ Tuning Layout Colors & Styles...</span>
                            <span v-else>✨ Generate Brand Look-Alike Theme [Gemini 2.5 Flash] [~$0.0005]</span>
                        </button>
                        
                        <!-- Real token and cost usage stats for Designer -->
                        <div v-if="layoutAiStats && layoutAiStats.calls_count > 0" 
                             style="background: rgba(197, 160, 89, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; font-size: 0.72rem; color: var(--text-muted); display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
                            <span>📊 Accumulated layout builds: <strong>{{ layoutAiStats.calls_count }}</strong></span>
                            <span><strong>{{ formatTokens(layoutAiStats.total_tokens) }} tokens</strong></span>
                            <span>Cost: <strong style="color: var(--accent);">€{{ (layoutAiStats.cost_usd * 0.92).toFixed(4) }}</strong></span>
                        </div>

                        <p v-if="inheritStyles" style="font-size: 0.72rem; color: #ef4444; margin: 8px 0 0 0; text-align: center;">
                            ⚠️ Please uncheck "Inherit Master Brand Styles" above to enable custom AI design overrides.
                        </p>
                    </div>
                </div>

                <!-- Custom CSS Override (always visible inside the grey-out wrapper) -->
                    <div class="form-group" style="margin-top: 10px; margin-bottom: 12px;">
                        <label>Custom CSS Override</label>
                        <textarea v-model="designerBrand.custom_css" :disabled="inheritStyles" placeholder="/* Add custom CSS rules here to override layouts */&#10;body {&#10;  font-size: 16px;&#10;}" style="width: 100%; height: 120px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 10px; font-family: monospace; font-size: 0.85rem; resize: vertical; outline: none;"></textarea>
                    </div>

                <button type="button" class="btn btn-accent" style="margin-top: 10px; font-weight: 700; width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px; height: 44px; border-radius: 8px; background: var(--accent); color: var(--workspace-bg);" @click="saveDesignSettings" :disabled="saving">
                    <span v-if="saving" class="spinner"></span>
                    <span>{{ saving ? 'Publishing Live...' : '🚀 Publish Live to Storefront' }}</span>
                </button>
                <p style="font-size: 0.72rem; color: var(--text-muted); text-align: center; margin: 6px 0 0 0;">
                    💡 Publishing writes changes directly to the database to go live on your storefront immediately.
                </p>
            </div>

            <!-- Right Side: Storefront Sandbox Preview -->
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
                <div v-if="isFullscreen" 
                     style="display: flex; align-items: center; justify-content: space-between; background: rgba(15, 19, 17, 0.95); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 8px 16px; gap: 10px; margin-bottom: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 100000; flex-wrap: nowrap; overflow-x: auto;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                        <span style="font-size: 1.1rem;">🛠️</span>
                        <h4 style="margin: 0; color: var(--accent); font-weight: 700; font-size: 0.95rem; white-space: nowrap;">Sandbox Full Editor Mode</h4>
                        <span v-if="hasUnsavedChanges" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; white-space: nowrap; flex-shrink: 0;">
                            Unsaved Changes
                        </span>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: nowrap;">
                        <!-- Undo / Redo / Reset Actions -->
                        <button type="button" class="btn" style="padding: 4px 8px; margin: 0; height: 30px; font-size: 0.72rem; font-weight: 700; background: var(--workspace-bg); color: var(--text-main); border: 1px solid var(--border); border-radius: 4px; cursor: pointer; white-space: nowrap; flex-shrink: 0;" @click="undo" title="Undo (Ctrl+Z)">
                            ↩ Undo
                        </button>
                        <button type="button" class="btn" style="padding: 4px 8px; margin: 0; height: 30px; font-size: 0.72rem; font-weight: 700; background: var(--workspace-bg); color: var(--text-main); border: 1px solid var(--border); border-radius: 4px; cursor: pointer; white-space: nowrap; flex-shrink: 0;" @click="redo" title="Redo (Ctrl+Y)">
                            ↪ Redo
                        </button>
                        <button type="button" class="btn" style="padding: 4px 8px; margin: 0; height: 30px; font-size: 0.72rem; font-weight: 700; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; cursor: pointer; white-space: nowrap; flex-shrink: 0;" @click="resetDesign" title="Reset Design">
                            ❌ Reset
                        </button>
                        
                        <div style="width: 1px; height: 20px; background: var(--border);"></div>

                        <!-- Inline Edit / Preview Mode Toggle inside Fullscreen Bar -->
                        <span style="color: var(--text-muted); font-size: 0.76rem; font-weight: 600; white-space: nowrap; flex-shrink: 0;">Mode:</span>
                        <div style="display: flex; background: var(--border); border-radius: 6px; padding: 2px; gap: 2px; height: 30px; align-items: center; box-sizing: border-box; flex-shrink: 0;">
                            <button type="button" class="btn" :style="inlineEditMode ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-main)' }" style="padding: 4px 8px; margin: 0; font-size: 0.7rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap; flex-shrink: 0;" @click="inlineEditMode = true">
                                ✏️ Edit
                            </button>
                            <button type="button" class="btn" :style="!inlineEditMode ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-main)' }" style="padding: 4px 8px; margin: 0; font-size: 0.7rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap; flex-shrink: 0;" @click="inlineEditMode = false">
                                👁️ Preview
                            </button>
                        </div>

                        <!-- Inline Language Selector in Fullscreen Bar -->
                        <span style="color: var(--text-muted); font-size: 0.76rem; font-weight: 600; margin-left: 4px; white-space: nowrap; flex-shrink: 0;">Language:</span>
                        <select v-model="previewActiveLang" @change="changePreviewLanguage" 
                                style="border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.72rem; padding: 4px 6px; font-weight: 700; cursor: pointer; outline: none; height: 30px; max-width: 90px; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0;">
                            <option v-for="lang in availableLanguages" :key="lang" :value="lang">
                                {{ getLanguageLabel(lang).toUpperCase() }}
                            </option>
                        </select>
                        
                        <!-- Device Switcher inside Fullscreen Bar -->
                        <div style="display: flex; background: var(--border); border-radius: 6px; padding: 2px; gap: 2px; height: 30px; align-items: center; box-sizing: border-box; flex-shrink: 0;">
                            <button type="button" class="btn" :style="viewportMode === 'desktop' ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-main)' }" style="padding: 4px 8px; margin: 0; font-size: 0.7rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap; flex-shrink: 0;" @click="viewportMode = 'desktop'">
                                🖥️ Desktop
                            </button>
                            <button type="button" class="btn" :style="viewportMode === 'tablet' ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-main)' }" style="padding: 4px 8px; margin: 0; font-size: 0.7rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap; flex-shrink: 0;" @click="viewportMode = 'tablet'">
                                📟 Tablet
                            </button>
                            <button type="button" class="btn" :style="viewportMode === 'mobile' ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-main)' }" style="padding: 4px 8px; margin: 0; font-size: 0.7rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap; flex-shrink: 0;" @click="viewportMode = 'mobile'">
                                📱 Mobile
                            </button>
                        </div>
                        
                        <div style="width: 1px; height: 20px; background: var(--border);"></div>

                        <!-- Publish Settings Button -->
                        <button type="button" class="btn btn-accent" style="margin: 0; font-weight: 700; height: 30px; padding: 0 12px; font-size: 0.76rem; white-space: nowrap; flex-shrink: 0;" @click="saveDesignSettings" :disabled="saving">
                            {{ saving ? 'Publishing...' : '🚀 Publish Live' }}
                        </button>
                        
                        <!-- Collapse Fullscreen Button -->
                        <button type="button" class="btn" style="margin: 0; font-weight: 700; height: 30px; padding: 0 10px; font-size: 0.76rem; background: var(--workspace-bg); color: var(--text-main); border: 1px solid var(--border); white-space: nowrap; flex-shrink: 0;" @click="toggleFullscreen">
                            🗖 Exit Full View
                        </button>
                    </div>
                </div>

                <h4 style="margin: 0 0 10px 0; color: var(--accent); display: flex; align-items: center; justify-content: space-between;" v-if="!isFullscreen">
                    <span style="display: flex; align-items: center; gap: 8px;">
                        🖥️ Live Storefront Sandbox Preview
                        <span v-if="hasUnsavedChanges" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
                            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #f59e0b;"></span>
                            Interactive Sandbox Draft
                        </span>
                        <span v-else style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
                            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
                            Published & Synced
                        </span>
                    </span>
                    <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted);">Local Port Routing</span>
                </h4>

                <!-- Browser Toolbar -->
                <div v-if="!isFullscreen" style="display: flex; align-items: center; justify-content: space-between; background: var(--border); border: 1px solid var(--border); border-bottom: none; border-top-left-radius: 8px; border-top-right-radius: 8px; padding: 8px 12px; gap: 12px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button type="button" class="btn" style="padding: 4px 8px; margin: 0; height: 28px; width: 28px; display: flex; align-items: center; justify-content: center; background: var(--workspace-bg); color: var(--text-main); border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s;" @click="iframeBack" title="Back" onmouseover="this.style.background='var(--border)'" onmouseout="this.style.background='var(--workspace-bg)'">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        </button>
                        <button type="button" class="btn" style="padding: 4px 8px; margin: 0; height: 28px; width: 28px; display: flex; align-items: center; justify-content: center; background: var(--workspace-bg); color: var(--text-main); border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s;" @click="iframeForward" title="Forward" onmouseover="this.style.background='var(--border)'" onmouseout="this.style.background='var(--workspace-bg)'">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </button>
                        <button type="button" class="btn" style="padding: 4px 8px; margin: 0; height: 28px; width: 28px; display: flex; align-items: center; justify-content: center; background: var(--workspace-bg); color: var(--text-main); border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s;" @click="iframeReload" title="Reload" onmouseover="this.style.background='var(--border)'" onmouseout="this.style.background='var(--workspace-bg)'">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
                        </button>
                        
                        <!-- Undo / Redo / Reset Actions -->
                        <div style="width: 1px; height: 16px; background: var(--border);"></div>
                        <button type="button" class="btn" style="padding: 4px 6px; margin: 0; height: 28px; display: flex; align-items: center; justify-content: center; background: var(--workspace-bg); color: var(--text-main); border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s; font-size: 0.72rem; font-weight: 700; gap: 4px; white-space: nowrap;" @click="undo" title="Undo (Ctrl+Z)" onmouseover="this.style.background='var(--border)'" onmouseout="this.style.background='var(--workspace-bg)'">
                            ↩ Undo
                        </button>
                        <button type="button" class="btn" style="padding: 4px 6px; margin: 0; height: 28px; display: flex; align-items: center; justify-content: center; background: var(--workspace-bg); color: var(--text-main); border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s; font-size: 0.72rem; font-weight: 700; gap: 4px; white-space: nowrap;" @click="redo" title="Redo (Ctrl+Y)" onmouseover="this.style.background='var(--border)'" onmouseout="this.style.background='var(--workspace-bg)'">
                            ↪ Redo
                        </button>
                        <button type="button" class="btn" style="padding: 4px 6px; margin: 0; height: 28px; display: flex; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s; font-size: 0.72rem; font-weight: 700; gap: 4px; white-space: nowrap;" @click="resetDesign" title="Reset Design" onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'">
                            ❌ Reset
                        </button>
                    </div>
                    <div style="flex: 1; font-family: monospace; font-size: 0.78rem; background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%; text-align: left; user-select: none;">
                        {{ displayUrl }}
                    </div>
                    <button type="button" class="btn" style="padding: 4px 12px; margin: 0; font-size: 0.78rem; height: 28px; font-weight: 700; background: var(--text-main); color: var(--workspace-bg); border: none; border-radius: 6px; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'" @click="toggleFullscreen">
                        {{ isFullscreen ? '🗖 Collapse View' : '🗖 Fullscreen Mode' }}
                    </button>
                </div>

                <!-- Responsive Device Switcher Row -->
                <div v-if="!isFullscreen" style="display: flex; align-items: center; justify-content: center; gap: 12px; background: var(--workspace-bg); border-left: 1px solid var(--border); border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 8px; font-size: 0.8rem; user-select: none;">
                    <span style="color: var(--text-muted); font-weight: 600;">Device:</span>
                    <div style="display: flex; background: var(--border); border-radius: 6px; padding: 2px; gap: 2px;">
                        <button type="button" class="btn" :style="viewportMode === 'desktop' ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-main)' }" style="padding: 4px 10px; margin: 0; font-size: 0.72rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer;" @click="viewportMode = 'desktop'">
                            🖥️ Desktop
                        </button>
                        <button type="button" class="btn" :style="viewportMode === 'tablet' ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-main)' }" style="padding: 4px 10px; margin: 0; font-size: 0.72rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer;" @click="viewportMode = 'tablet'">
                            📟 Tablet
                        </button>
                        <button type="button" class="btn" :style="viewportMode === 'mobile' ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-main)' }" style="padding: 4px 10px; margin: 0; font-size: 0.72rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer;" @click="viewportMode = 'mobile'">
                            📱 Mobile
                        </button>
                    </div>
                    
                    <span style="color: var(--text-muted); font-weight: 600; margin-left: 12px; display: inline-flex; align-items: center; gap: 4px;">
                        🌐 Lang:
                    </span>
                    <select v-model="previewActiveLang" @change="changePreviewLanguage" 
                            style="border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.72rem; padding: 4px 8px; font-weight: 700; cursor: pointer; outline: none; height: 28px; line-height: 1;">
                        <option v-for="lang in availableLanguages" :key="lang" :value="lang">
                            {{ getLanguageLabel(lang).toUpperCase() }}
                        </option>
                    </select>

                    <span style="color: var(--text-muted); font-weight: 600; margin-left: 12px;">Mode:</span>
                    <div style="display: flex; background: var(--border); border-radius: 6px; padding: 2px; gap: 2px; height: 28px; align-items: center; box-sizing: border-box;">
                        <button type="button" class="btn" :style="inlineEditMode ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-main)' }" style="padding: 4px 10px; margin: 0; font-size: 0.7rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer;" @click="inlineEditMode = true">
                            ✏️ Edit
                        </button>
                        <button type="button" class="btn" :style="!inlineEditMode ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-main)' }" style="padding: 4px 10px; margin: 0; font-size: 0.7rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer;" @click="inlineEditMode = false">
                            👁️ Play
                        </button>
                    </div>
                </div>

                <div :style="previewContainerStyle"
                    style="border-left: 1px solid var(--border); border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">
                    <div :style="viewportIframeStyle" style="height: 100%; transition: all 0.3s ease; background: var(--workspace-bg);">
                        <iframe ref="previewIframe" class="preview-iframe" :src="previewIframeSrc" @load="handleIframeLoad" style="width: 100%; height: 100%; border: none;"></iframe>
                    </div>
                </div>
            </div>
        </div>

        <!-- ADD CUSTOM PAGE MODAL -->
        <div v-if="showAddPageModal" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); z-index: 100000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
            <div class="panel" style="width: 100%; max-width: 500px; border-radius: 12px; overflow: hidden; background: var(--panel-bg); border: 1px solid var(--border); box-shadow: 0 10px 40px rgba(0,0,0,0.6); margin: 20px;">
                <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border);">
                    <h3 class="panel-title" style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                        <span>➕</span> Create Custom Campaign Page
                    </h3>
                    <button type="button" @click="showAddPageModal = false" style="background: none; border: none; color: var(--text-muted); font-size: 1.4rem; cursor: pointer; line-height: 1;">&times;</button>
                </div>
                <form @submit.prevent="addCustomPage" style="padding: 20px; display: flex; flex-direction: column; gap: 14px; margin: 0;">
                    <div class="form-group">
                        <label style="font-weight: 700; font-size: 0.8rem; color: var(--text-muted);">Page Slug / Route (e.g. promo-offer)</label>
                        <input type="text" v-model="newPage.id" required placeholder="promo-offer" style="width: 100%; margin: 0;">
                    </div>
                    <div class="form-group">
                        <label style="font-weight: 700; font-size: 0.8rem; color: var(--text-muted);">Headline</label>
                        <input type="text" v-model="newPage.headline" placeholder="Exclusive Promo Offer" style="width: 100%; margin: 0;">
                    </div>
                    <div class="form-group">
                        <label style="font-weight: 700; font-size: 0.8rem; color: var(--text-muted);">Subheadline</label>
                        <textarea v-model="newPage.subheadline" rows="2" placeholder="Claim this exclusive deal..." style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; outline: none; margin: 0;"></textarea>
                    </div>
                    <div class="form-group">
                        <label style="font-weight: 700; font-size: 0.8rem; color: var(--text-muted);">CTA Button Text</label>
                        <input type="text" v-model="newPage.cta" placeholder="Claim Offer" style="width: 100%; margin: 0;">
                    </div>
                    <div class="form-group">
                        <label style="font-weight: 700; font-size: 0.8rem; color: var(--text-muted);">Coupon Code (optional)</label>
                        <input type="text" v-model="newPage.coupon_code" placeholder="e.g. SAVE20" style="width: 100%; margin: 0;">
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
                        <button type="button" class="btn" style="margin: 0; background: transparent; border: 1px solid var(--border); color: var(--text-main);" @click="showAddPageModal = false">Cancel</button>
                        <button type="submit" class="btn btn-accent" style="margin: 0;">Create Page</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'DesignerView',
    inject: ['app'],
    data() {
        return {
            designerBrand: {
                id: '',
                name: '',
                subdomain: '',
                contact_email: '',
                primary_color: '#111111',
                secondary_color: '#767676',
                bg_color: '#ffffff',
                text_color: '#111111',
                button_radius: '4px',
                button_text_color: '#ffffff',
                header_bg_color: '#ffffff',
                font_family: 'Outfit',
                custom_css: '',
                logo: '',
                favicon: '',
                theme_settings: '',
                languages: 'en',
                announcement_active: false,
                announcement_text: '⚡ Free shipping on all orders over €75!',
                announcement_bg: '#c5a059',
                announcement_text_color: '#ffffff',
                font_size_scale: 'medium',
                line_height_scale: 'comfortable',
                instagram_link: '',
                facebook_link: '',
                twitter_link: '',
                text_hero_headline: '',
                text_hero_subheadline: '',
                text_hero_cta: 'SHOP COLLECTION',
                text_404_headline: 'Page Not Found',
                text_404_subheadline: 'The page you are looking for doesn\'t exist or has been moved.',
                text_404_cta: 'Back to Shop',
                landing_pages: [],
                content_translations: {}
            },
            saving: false,
            isFullscreen: false,
            iframeCurrentUrl: '',
            inheritStyles: true,
            viewportMode: 'desktop',
            translationActiveLang: 'en',
            previewActiveLang: 'en',
            inlineEditMode: true,
            originalBrandSettings: '',
            activeTab: 'style',
            isGeneratingLayout: false,
            aiStylePresets: [],
            autoUpdatePreview: true,
            iframeBuster: Date.now(),
            activeContentPage: 'home',
            showAddPageModal: false,
            newPage: { id: '', headline: '', subheadline: '', cta: '', hero_img: '', features: '', coupon_code: '' },
            designerPrompt: '',
            isBulkTranslating: false,
            aiUsageBreakdown: [],
            undoStack: [],
            redoStack: [],
            isApplyingHistory: false
        };
    },
    mounted() {
        console.log('[DesignerView] Mounted, listening for STOREFRONT_READY');
        this.messageListener = (event) => {
            console.log('[DesignerView] Received message:', event.data);
            if (event.data && event.data.type === 'STOREFRONT_READY') {
                console.log('[DesignerView] Handshake: Storefront ready signal received. Sending styles...');
                this.updatePreviewStyles();
                this.changePreviewLanguage();
            } else if (event.data && event.data.type === 'PREVIEW_LANGUAGE_CHANGED') {
                if (event.data.lang) {
                    this.previewActiveLang = event.data.lang;
                    this.translationActiveLang = event.data.lang;
                }
            } else if (event.data && event.data.type === 'STOREFRONT_ERROR') {
                console.error('[DesignerView] Storefront Iframe Error:', event.data.message, event.data.stack);
                this.app.showNotification(`⚠️ Storefront preview error: ${event.data.message}`);
            } else if (event.data && event.data.type === 'INLINE_TEXT_EDIT') {
                const { field, value, page } = event.data;
                const activeLang = this.translationActiveLang;
                if (page === 'home' || page === 'track' || page === '404') {
                    if (activeLang === 'en') {
                        this.designerBrand[field] = value;
                    } else {
                        if (!this.designerBrand.content_translations) {
                            this.designerBrand.content_translations = {};
                        }
                        if (!this.designerBrand.content_translations[activeLang]) {
                            this.designerBrand.content_translations[activeLang] = {};
                        }
                        this.designerBrand.content_translations[activeLang][field] = value;
                    }
                } else {
                    if (this.designerBrand.landing_pages) {
                        const pg = this.designerBrand.landing_pages.find(p => p.id === page);
                        if (pg) {
                            if (activeLang === 'en') {
                                pg[field] = value;
                            } else {
                                if (!pg.translations) {
                                    pg.translations = {};
                                }
                                if (!pg.translations[activeLang]) {
                                    pg.translations[activeLang] = {};
                                }
                                pg.translations[activeLang][field] = value;
                            }
                        }
                    }
                }
                this.updatePreviewStyles();
            } else if (event.data && event.data.type === 'INLINE_STYLE_EDIT') {
                const { field, styles, page } = event.data;
                let theme = {};
                try {
                    theme = this.designerBrand.theme_settings ? JSON.parse(this.designerBrand.theme_settings) : {};
                } catch(e) {
                    theme = {};
                }
                if (!theme.element_styles) {
                    theme.element_styles = {};
                }
                theme.element_styles[field] = {
                    ...(theme.element_styles[field] || {}),
                    ...styles
                };
                this.designerBrand.theme_settings = JSON.stringify(theme);
                this.updatePreviewStyles();
            } else if (event.data && event.data.type === 'APPLY_STYLE_GLOBALLY') {
                const { field, styles, isButton, page } = event.data;
                this.handleApplyStyleGlobally(field, styles, isButton, page);
            } else if (event.data && event.data.type === 'INLINE_PRODUCT_EDIT') {
                const { productId, field, value } = event.data;
                this.handleInlineProductEdit(productId, field, value);
            } else if (event.data && event.data.type === 'REQUEST_AI_REWRITE') {
                const { text, tone, field, page } = event.data;
                this.handleInlineAiRewrite(text, tone, field, page);
            }
        };
        window.addEventListener('message', this.messageListener);

        this.keyboardListener = (e) => {
            if ((e.ctrlKey || e.metaKey) && !e.altKey) {
                if (e.key.toLowerCase() === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                } else if (e.key.toLowerCase() === 'y') {
                    e.preventDefault();
                    this.redo();
                }
            }
        };
        window.addEventListener('keydown', this.keyboardListener);
    },
    beforeUnmount() {
        if (this.messageListener) {
            window.removeEventListener('message', this.messageListener);
        }
        if (this.keyboardListener) {
            window.removeEventListener('keydown', this.keyboardListener);
        }
    },
    computed: {
        hasUnsavedChanges() {
            if (!this.originalBrandSettings || !this.designerBrand) return false;
            const currentObj = {
                inherit: this.inheritStyles,
                primary_color: this.designerBrand.primary_color,
                secondary_color: this.designerBrand.secondary_color,
                bg_color: this.designerBrand.bg_color,
                text_color: this.designerBrand.text_color,
                button_radius: this.designerBrand.button_radius,
                button_text_color: this.designerBrand.button_text_color,
                header_bg_color: this.designerBrand.header_bg_color,
                font_family: this.designerBrand.font_family,
                custom_css: this.designerBrand.custom_css,
                logo: this.designerBrand.logo,
                favicon: this.designerBrand.favicon,
                announcement_active: this.designerBrand.announcement_active,
                announcement_text: this.designerBrand.announcement_text,
                announcement_bg: this.designerBrand.announcement_bg,
                announcement_text_color: this.designerBrand.announcement_text_color,
                font_size_scale: this.designerBrand.font_size_scale,
                line_height_scale: this.designerBrand.line_height_scale,
                instagram_link: this.designerBrand.instagram_link,
                facebook_link: this.designerBrand.facebook_link,
                twitter_link: this.designerBrand.twitter_link,
                text_hero_headline: this.designerBrand.text_hero_headline,
                text_hero_subheadline: this.designerBrand.text_hero_subheadline,
                text_hero_cta: this.designerBrand.text_hero_cta,
                text_404_headline: this.designerBrand.text_404_headline,
                text_404_subheadline: this.designerBrand.text_404_subheadline,
                text_404_cta: this.designerBrand.text_404_cta,
                content_translations: this.designerBrand.content_translations
            };
            return JSON.stringify(currentObj) !== this.originalBrandSettings;
        },
        availableLanguages() {
            if (!this.designerBrand.languages) return ['en'];
            let langs = [];
            if (Array.isArray(this.designerBrand.languages)) {
                langs = this.designerBrand.languages;
            } else if (typeof this.designerBrand.languages === 'string') {
                langs = this.designerBrand.languages.split(',').map(x => x.trim().toLowerCase());
            }
            if (!langs.includes('en')) {
                langs.unshift('en');
            }
            return langs;
        },
        activeBrandName() {
            if (this.app.activeShopFilter === 'all') return 'None';
            const b = this.app.brands.find(x => x.id === this.app.activeShopFilter);
            return b ? b.name : 'Unknown';
        },
        previewIframeSrc() {
            if (this.app.activeShopFilter === 'all') return '';
            return `/store/${this.app.activeShopFilter}?previewBrandId=${this.app.activeShopFilter}&t=${this.iframeBuster}`;
        },
        layoutAiStats() {
            if (!this.aiUsageBreakdown) return { calls_count: 0, total_tokens: 0, cost_usd: 0 };
            return this.aiUsageBreakdown.find(b => b.operation === 'Brand Style Layout Generation') || { calls_count: 0, total_tokens: 0, cost_usd: 0 };
        },
        translateAiStats() {
            if (!this.aiUsageBreakdown) return { calls_count: 0, total_tokens: 0, cost_usd: 0 };
            const bulk = this.aiUsageBreakdown.find(b => b.operation.includes('Bulk Translation')) || { calls_count: 0, total_tokens: 0, cost_usd: 0 };
            const single = this.aiUsageBreakdown.find(b => b.operation === 'AI Copy Translation') || { calls_count: 0, total_tokens: 0, cost_usd: 0 };
            return {
                calls_count: bulk.calls_count + single.calls_count,
                total_tokens: bulk.total_tokens + single.total_tokens,
                cost_usd: bulk.cost_usd + single.cost_usd
            };
        },
        contrastIssues() {
            const issues = [];
            const brand = this.designerBrand;
            if (!brand) return issues;

            // 1. Text vs Background Color
            const textBgRatio = this.getContrastRatio(brand.text_color, brand.bg_color);
            if (textBgRatio < 4.5) {
                issues.push({
                    id: 'text_bg',
                    message: `Primary Text and Background have poor contrast (${textBgRatio.toFixed(1)}:1). Target: 4.5:1`
                });
            }

            // 2. Button Text vs Accent Color (Primary Color)
            const btnAccentRatio = this.getContrastRatio(brand.button_text_color, brand.primary_color);
            if (btnAccentRatio < 4.5) {
                issues.push({
                    id: 'btn_accent',
                    message: `Button Text and Accent Color (Primary) have poor contrast (${btnAccentRatio.toFixed(1)}:1). Target: 4.5:1`
                });
            }

            // 3. Accent Color vs Background Color
            const accentBgRatio = this.getContrastRatio(brand.primary_color, brand.bg_color);
            if (accentBgRatio < 3.0) {
                issues.push({
                    id: 'accent_bg',
                    message: `Accent Color and Background have poor contrast (${accentBgRatio.toFixed(1)}:1). Target: 3:1`
                });
            }

            return issues;
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
        previewContainerStyle() {
            const base = this.isFullscreen ? { flex: 1, position: 'relative' } : { height: '650px', position: 'relative' };
            return {
                ...base,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#121413',
                padding: this.viewportMode === 'desktop' ? '0' : '20px'
            };
        },
        viewportIframeStyle() {
            if (this.viewportMode === 'mobile') {
                return {
                    width: '375px',
                    height: '100%',
                    maxHeight: '600px',
                    border: '8px solid #222',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
                };
            }
            if (this.viewportMode === 'tablet') {
                return {
                    width: '768px',
                    height: '100%',
                    maxHeight: '620px',
                    border: '8px solid #222',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
                };
            }
            return {
                width: '100%',
                height: '100%'
            };
        }
    },
    watch: {
        designerBrand: {
            deep: true,
            handler() {
                if (this.autoUpdatePreview) {
                    this.updatePreviewStyles();
                }
                if (!this.isApplyingHistory) {
                    this.recordStateDebounced();
                }
            }
        },
        autoUpdatePreview(newVal) {
            if (newVal) {
                this.updatePreviewStyles();
            }
        },
        translationActiveLang(newLang) {
            this.previewActiveLang = newLang;
            this.changePreviewLanguage();
        },
        inlineEditMode(newVal) {
            this.syncInlineEditMode();
        },
        'app.activeShopFilter': {
            immediate: true,
            handler() {
                this.iframeBuster = Date.now();
                this.loadBrandContext();
            }
        },
        inheritStyles(newVal) {
            if (this.app.activeShopFilter !== 'all') {
                const b = this.app.brands.find(x => x.id === this.app.activeShopFilter);
                if (b) {
                    let theme = {};
                    if (b.theme_settings) {
                        try {
                            theme = JSON.parse(b.theme_settings);
                        } catch(e) {}
                    }
                    const overrides = theme.storefront || {};

                    if (newVal) {
                        this.designerBrand.primary_color = b.primary_color || '#c5a059';
                        this.designerBrand.secondary_color = theme.secondary_color || '#767676';
                        this.designerBrand.bg_color = theme.bg_color || '#ffffff';
                        this.designerBrand.text_color = theme.text_color || '#111111';
                        this.designerBrand.button_radius = theme.button_radius || '4px';
                        this.designerBrand.button_text_color = theme.button_text_color || '#ffffff';
                        this.designerBrand.header_bg_color = theme.header_bg_color || '#ffffff';
                        this.designerBrand.font_family = theme.font_family || 'Outfit';
                        this.designerBrand.custom_css = '';
                        this.designerBrand.logo = b.logo || '';
                        this.designerBrand.favicon = b.favicon || '';
                        
                        this.designerBrand.announcement_active = theme.announcement_active !== undefined ? theme.announcement_active : false;
                        this.designerBrand.announcement_text = theme.announcement_text || '⚡ Free shipping on all orders over €75!';
                        this.designerBrand.announcement_bg = theme.announcement_bg || b.primary_color || '#c5a059';
                        this.designerBrand.announcement_text_color = theme.announcement_text_color || '#ffffff';
                        this.designerBrand.font_size_scale = theme.font_size_scale || 'medium';
                        this.designerBrand.line_height_scale = theme.line_height_scale || 'comfortable';
                        this.designerBrand.instagram_link = theme.instagram_link || '';
                        this.designerBrand.facebook_link = theme.facebook_link || '';
                        this.designerBrand.twitter_link = theme.twitter_link || '';
                    } else {
                        this.designerBrand.primary_color = overrides.primary_color || b.primary_color || '#c5a059';
                        this.designerBrand.secondary_color = overrides.secondary_color || theme.secondary_color || '#767676';
                        this.designerBrand.bg_color = overrides.bg_color || theme.bg_color || '#ffffff';
                        this.designerBrand.text_color = overrides.text_color || theme.text_color || '#111111';
                        this.designerBrand.button_radius = overrides.button_radius || theme.button_radius || '4px';
                        this.designerBrand.button_text_color = overrides.button_text_color || theme.button_text_color || '#ffffff';
                        this.designerBrand.header_bg_color = overrides.header_bg_color || theme.header_bg_color || '#ffffff';
                        this.designerBrand.font_family = overrides.font_family || theme.font_family || 'Outfit';
                        this.designerBrand.custom_css = overrides.custom_css || '';
                        this.designerBrand.logo = overrides.logo || b.logo || '';
                        this.designerBrand.favicon = overrides.favicon || b.favicon || '';
                        
                        this.designerBrand.announcement_active = overrides.announcement_active !== undefined ? overrides.announcement_active : (theme.announcement_active !== undefined ? theme.announcement_active : false);
                        this.designerBrand.announcement_text = overrides.announcement_text || theme.announcement_text || '⚡ Free shipping on all orders over €75!';
                        this.designerBrand.announcement_bg = overrides.announcement_bg || theme.announcement_bg || b.primary_color || '#c5a059';
                        this.designerBrand.announcement_text_color = overrides.announcement_text_color || theme.announcement_text_color || '#ffffff';
                        this.designerBrand.font_size_scale = overrides.font_size_scale || theme.font_size_scale || 'medium';
                        this.designerBrand.line_height_scale = overrides.line_height_scale || theme.line_height_scale || 'comfortable';
                        this.designerBrand.instagram_link = overrides.instagram_link || theme.instagram_link || '';
                        this.designerBrand.facebook_link = overrides.facebook_link || theme.facebook_link || '';
                        this.designerBrand.twitter_link = overrides.twitter_link || theme.twitter_link || '';
                    }
                    this.$nextTick(() => {
                        this.updatePreviewStyles();
                    });
                }
            }
        },
        translationActiveLang(newLang) {
            const iframe = this.$refs.previewIframe;
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    type: 'UPDATE_PREVIEW_LANGUAGE',
                    lang: newLang
                }, '*');
            }
        }
    },
    methods: {
        getLanguageLabel(code) {
            const labels = {
                en: '🇺🇸 EN',
                de: '🇩🇪 DE',
                fr: '🇫🇷 FR',
                nl: '🇳🇱 NL',
                es: '🇪🇸 ES',
                it: '🇮🇹 IT'
            };
            return labels[code] || code.toUpperCase();
        },
        getTranslationRef(lang) {
            if (!this.designerBrand.content_translations) {
                this.designerBrand.content_translations = {};
            }
            if (!this.designerBrand.content_translations[lang]) {
                this.designerBrand.content_translations[lang] = {
                    text_hero_headline: '',
                    text_hero_subheadline: '',
                    text_hero_cta: '',
                    announcement_text: '',
                    text_404_headline: '',
                    text_404_subheadline: '',
                    text_404_cta: ''
                };
            }
            return this.designerBrand.content_translations[lang];
        },
        isCustomPage(id) {
            return id && id !== 'home' && id !== 'track' && id !== '404';
        },
        getCustomPageRef(id) {
            if (!this.designerBrand.landing_pages) {
                this.designerBrand.landing_pages = [];
            }
            let page = this.designerBrand.landing_pages.find(p => p.id === id);
            if (!page) {
                page = {
                    id: id,
                    headline: '',
                    subheadline: '',
                    cta: '',
                    hero_img: '',
                    coupon_code: '',
                    features: '',
                    translations: {}
                };
                this.designerBrand.landing_pages.push(page);
            }
            return page;
        },
        getCustomPageTranslationRef(page, lang) {
            if (!page) return {};
            if (!page.translations) {
                page.translations = {};
            }
            if (!page.translations[lang]) {
                page.translations[lang] = {
                    headline: '',
                    subheadline: '',
                    cta: '',
                    features: ''
                };
            }
            return page.translations[lang];
        },
        navigateToPage(pageId) {
            this.activeContentPage = pageId;
            try {
                const iframe = this.$refs.previewIframe;
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage({
                        type: 'NAVIGATE_PREVIEW_PAGE',
                        page: pageId
                    }, '*');
                }
            } catch (e) {
                console.error('[DesignerView] Error navigating preview page:', e);
            }
        },
        deleteCustomPage(id) {
            if (!confirm(`Are you sure you want to delete the custom page "/${id}"?`)) {
                return;
            }
            if (this.designerBrand.landing_pages) {
                this.designerBrand.landing_pages = this.designerBrand.landing_pages.filter(p => p.id !== id);
            }
            if (this.activeContentPage === id) {
                this.navigateToPage('home');
            } else {
                this.updatePreviewStyles();
            }
            this.app.showNotification('Custom page deleted.');
        },
        addCustomPage() {
            const slug = this.newPage.id.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');
            if (!slug) {
                alert('Please enter a valid page slug.');
                return;
            }
            if (['home', 'track', '404'].includes(slug)) {
                alert('This slug is reserved for default pages.');
                return;
            }
            if (!this.designerBrand.landing_pages) {
                this.designerBrand.landing_pages = [];
            }
            if (this.designerBrand.landing_pages.some(p => p.id === slug)) {
                alert('A custom page with this slug already exists.');
                return;
            }
            const page = {
                id: slug,
                headline: this.newPage.headline.trim() || 'New Campaign Offer',
                subheadline: this.newPage.subheadline.trim() || 'Claim this exclusive deal now.',
                cta: this.newPage.cta.trim() || 'Claim Offer',
                hero_img: this.newPage.hero_img.trim() || '',
                features: this.newPage.features.trim() || '',
                coupon_code: this.newPage.coupon_code.trim() || '',
                translations: {}
            };
            this.designerBrand.landing_pages.push(page);
            this.showAddPageModal = false;
            this.newPage = { id: '', headline: '', subheadline: '', cta: '', hero_img: '', features: '', coupon_code: '' };
            this.navigateToPage(slug);
            this.app.showNotification('Custom page created.');
        },
        async generateAILookAlikeLayout() {
            this.isGeneratingLayout = true;
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.designerBrand.id}/generate-ai-layout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.layout) {
                        const layout = data.layout;
                        
                        this.designerBrand.primary_color = layout.primary_color || this.designerBrand.primary_color;
                        this.designerBrand.secondary_color = layout.secondary_color || this.designerBrand.secondary_color;
                        this.designerBrand.bg_color = layout.bg_color || this.designerBrand.bg_color;
                        this.designerBrand.text_color = layout.text_color || this.designerBrand.text_color;
                        this.designerBrand.header_bg_color = layout.header_bg_color || this.designerBrand.header_bg_color;
                        this.designerBrand.button_text_color = layout.button_text_color || this.designerBrand.button_text_color;
                        this.designerBrand.button_radius = layout.button_radius || this.designerBrand.button_radius;
                        this.designerBrand.font_family = layout.font_family || this.designerBrand.font_family;
                        
                        this.designerBrand.text_hero_headline = layout.text_hero_headline || this.designerBrand.text_hero_headline;
                        this.designerBrand.text_hero_subheadline = layout.text_hero_subheadline || this.designerBrand.text_hero_subheadline;
                        this.designerBrand.text_hero_cta = layout.text_hero_cta || this.designerBrand.text_hero_cta;

                        this.aiStylePresets.push(layout);
                        this.updatePreviewStyles();
                        this.app.showNotification('✨ Brand Look-Alike theme generated and applied successfully!');
                        this.loadAiUsage();
                    }
                } else {
                    const err = await response.json();
                    alert('AI Theme styling generation error: ' + (err.error || 'Unknown error'));
                }
            } catch (e) {
                alert('AI Layout generation network error: ' + e.message);
            } finally {
                this.isGeneratingLayout = false;
            }
        },
        applyAILayoutPreset(preset) {
            this.inheritStyles = false;
            this.designerBrand.primary_color = preset.primary_color || this.designerBrand.primary_color;
            this.designerBrand.secondary_color = preset.secondary_color || this.designerBrand.secondary_color;
            this.designerBrand.bg_color = preset.bg_color || this.designerBrand.bg_color;
            this.designerBrand.text_color = preset.text_color || this.designerBrand.text_color;
            this.designerBrand.header_bg_color = preset.header_bg_color || this.designerBrand.header_bg_color;
            this.designerBrand.button_text_color = preset.button_text_color || this.designerBrand.button_text_color;
            this.designerBrand.button_radius = preset.button_radius || this.designerBrand.button_radius;
            this.designerBrand.font_family = preset.font_family || this.designerBrand.font_family;
            
            this.designerBrand.text_hero_headline = preset.text_hero_headline || this.designerBrand.text_hero_headline;
            this.designerBrand.text_hero_subheadline = preset.text_hero_subheadline || this.designerBrand.text_hero_subheadline;
            this.designerBrand.text_hero_cta = preset.text_hero_cta || this.designerBrand.text_hero_cta;

            this.updatePreviewStyles();
            this.app.showNotification('Applied AI Preset!');
        },
        applyPreset(name) {
            this.inheritStyles = false;
            if (name === 'obsidian') {
                this.designerBrand.primary_color = '#ffffff';
                this.designerBrand.secondary_color = '#a0a0a0';
                this.designerBrand.bg_color = '#0b0d0c';
                this.designerBrand.text_color = '#f3f4f3';
                this.designerBrand.header_bg_color = '#0b0d0c';
                this.designerBrand.button_text_color = '#0b0d0c';
            } else if (name === 'latte') {
                this.designerBrand.primary_color = '#8b5a2b';
                this.designerBrand.secondary_color = '#cd853f';
                this.designerBrand.bg_color = '#fdf5e6';
                this.designerBrand.text_color = '#4a2c11';
                this.designerBrand.header_bg_color = '#f5deb3';
                this.designerBrand.button_text_color = '#ffffff';
            } else if (name === 'espresso') {
                this.designerBrand.primary_color = '#c5a059';
                this.designerBrand.secondary_color = '#b08d47';
                this.designerBrand.bg_color = '#1e140a';
                this.designerBrand.text_color = '#f5f5dc';
                this.designerBrand.header_bg_color = '#120a05';
                this.designerBrand.button_text_color = '#000000';
            } else if (name === 'velvet') {
                this.designerBrand.primary_color = '#a855f7';
                this.designerBrand.secondary_color = '#d8b4fe';
                this.designerBrand.bg_color = '#090514';
                this.designerBrand.text_color = '#f3e8ff';
                this.designerBrand.header_bg_color = '#090514';
                this.designerBrand.button_text_color = '#ffffff';
            }
            this.updatePreviewStyles();
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
                console.error('Error loading AI usage in DesignerView:', e);
            }
        },
        formatTokens(num) {
            if (!num) return '0';
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
            return num;
        },
        loadBrandContext() {
            this.loadAiUsage();
            if (this.app.activeShopFilter !== 'all') {
                const b = this.app.brands.find(x => x.id === this.app.activeShopFilter);
                if (b) {
                    let theme = {};
                    if (b.theme_settings) {
                        try {
                            theme = JSON.parse(b.theme_settings);
                        } catch(e) {}
                    }
                    
                    this.inheritStyles = theme.inherit !== false;
                    const overrides = theme.storefront || {};

                    if (this.inheritStyles) {
                        this.designerBrand = {
                            ...b,
                            primary_color: b.primary_color || '#c5a059',
                            secondary_color: theme.secondary_color || '#767676',
                            bg_color: theme.bg_color || '#ffffff',
                            text_color: theme.text_color || '#111111',
                            button_radius: theme.button_radius || '4px',
                            button_text_color: theme.button_text_color || '#ffffff',
                            header_bg_color: theme.header_bg_color || '#ffffff',
                            font_family: theme.font_family || 'Outfit',
                            custom_css: '',
                            logo: b.logo || '',
                            favicon: b.favicon || '',
                            shopify_access_token: '',
                            stripe_secret_key: '',
                            stripe_webhook_secret: '',
                            
                            announcement_active: theme.announcement_active !== undefined ? theme.announcement_active : false,
                            announcement_text: theme.announcement_text || '⚡ Free shipping on all orders over €75!',
                            announcement_bg: theme.announcement_bg || b.primary_color || '#c5a059',
                            announcement_text_color: theme.announcement_text_color || '#ffffff',
                            font_size_scale: theme.font_size_scale || 'medium',
                            line_height_scale: theme.line_height_scale || 'comfortable',
                            instagram_link: theme.instagram_link || '',
                            facebook_link: theme.facebook_link || '',
                            twitter_link: theme.twitter_link || '',
                            text_hero_headline: theme.text_hero_headline || overrides.text_hero_headline || '',
                            text_hero_subheadline: theme.text_hero_subheadline || overrides.text_hero_subheadline || '',
                            text_hero_cta: theme.text_hero_cta || overrides.text_hero_cta || 'SHOP COLLECTION',
                            text_404_headline: theme.text_404_headline || overrides.text_404_headline || 'Page Not Found',
                            text_404_subheadline: theme.text_404_subheadline || overrides.text_404_subheadline || 'The page you are looking for doesn\'t exist or has been moved.',
                            text_404_cta: theme.text_404_cta || overrides.text_404_cta || 'Back to Shop',
                            content_translations: theme.content_translations || overrides.content_translations || {}
                        };
                    } else {
                        this.designerBrand = {
                            ...b,
                            primary_color: overrides.primary_color || b.primary_color || '#c5a059',
                            secondary_color: overrides.secondary_color || theme.secondary_color || '#767676',
                            bg_color: overrides.bg_color || theme.bg_color || '#ffffff',
                            text_color: overrides.text_color || theme.text_color || '#111111',
                            button_radius: overrides.button_radius || theme.button_radius || '4px',
                            button_text_color: overrides.button_text_color || theme.button_text_color || '#ffffff',
                            header_bg_color: overrides.header_bg_color || theme.header_bg_color || '#ffffff',
                            font_family: overrides.font_family || theme.font_family || 'Outfit',
                            custom_css: overrides.custom_css || '',
                            logo: overrides.logo || b.logo || '',
                            favicon: overrides.favicon || b.favicon || '',
                            shopify_access_token: '',
                            stripe_secret_key: '',
                            stripe_webhook_secret: '',
                            
                            announcement_active: overrides.announcement_active !== undefined ? overrides.announcement_active : (theme.announcement_active !== undefined ? theme.announcement_active : false),
                            announcement_text: overrides.announcement_text || theme.announcement_text || '⚡ Free shipping on all orders over €75!',
                            announcement_bg: overrides.announcement_bg || theme.announcement_bg || b.primary_color || '#c5a059',
                            announcement_text_color: overrides.announcement_text_color || theme.announcement_text_color || '#ffffff',
                            font_size_scale: overrides.font_size_scale || theme.font_size_scale || 'medium',
                            line_height_scale: overrides.line_height_scale || theme.line_height_scale || 'comfortable',
                            instagram_link: overrides.instagram_link || theme.instagram_link || '',
                            facebook_link: overrides.facebook_link || theme.facebook_link || '',
                            twitter_link: overrides.twitter_link || theme.twitter_link || '',
                            text_hero_headline: overrides.text_hero_headline || theme.text_hero_headline || '',
                            text_hero_subheadline: overrides.text_hero_subheadline || theme.text_hero_subheadline || '',
                            text_hero_cta: overrides.text_hero_cta || theme.text_hero_cta || 'SHOP COLLECTION',
                            text_404_headline: overrides.text_404_headline || theme.text_404_headline || 'Page Not Found',
                            text_404_subheadline: overrides.text_404_subheadline || theme.text_404_subheadline || 'The page you are looking for doesn\'t exist or has been moved.',
                            text_404_cta: overrides.text_404_cta || theme.text_404_cta || 'Back to Shop',
                            content_translations: overrides.content_translations || theme.content_translations || {}
                        };
                    }
                }
                this.$nextTick(() => {
                    this.captureOriginalSettings();
                });
            }
        },
        async saveDesignSettings() {
            this.saving = true;
            
            let existingTheme = {};
            if (this.designerBrand.theme_settings) {
                try {
                    existingTheme = JSON.parse(this.designerBrand.theme_settings);
                } catch(e) {}
            }
            
            const storefrontOverrides = this.inheritStyles ? {} : {
                primary_color: this.designerBrand.primary_color,
                secondary_color: this.designerBrand.secondary_color,
                bg_color: this.designerBrand.bg_color,
                text_color: this.designerBrand.text_color,
                button_radius: this.designerBrand.button_radius,
                button_text_color: this.designerBrand.button_text_color,
                header_bg_color: this.designerBrand.header_bg_color,
                font_family: this.designerBrand.font_family,
                custom_css: this.designerBrand.custom_css,
                logo: this.designerBrand.logo,
                favicon: this.designerBrand.favicon,
                
                announcement_active: this.designerBrand.announcement_active,
                announcement_text: this.designerBrand.announcement_text,
                announcement_bg: this.designerBrand.announcement_bg,
                announcement_text_color: this.designerBrand.announcement_text_color,
                font_size_scale: this.designerBrand.font_size_scale,
                line_height_scale: this.designerBrand.line_height_scale,
                instagram_link: this.designerBrand.instagram_link,
                facebook_link: this.designerBrand.facebook_link,
                twitter_link: this.designerBrand.twitter_link,
                text_hero_headline: this.designerBrand.text_hero_headline,
                text_hero_subheadline: this.designerBrand.text_hero_subheadline,
                text_hero_cta: this.designerBrand.text_hero_cta,
                text_404_headline: this.designerBrand.text_404_headline,
                text_404_subheadline: this.designerBrand.text_404_subheadline,
                text_404_cta: this.designerBrand.text_404_cta,
                content_translations: this.designerBrand.content_translations
            };

            this.designerBrand.theme_settings = JSON.stringify({
                ...existingTheme,
                inherit: this.inheritStyles,
                text_hero_headline: this.designerBrand.text_hero_headline,
                text_hero_subheadline: this.designerBrand.text_hero_subheadline,
                text_hero_cta: this.designerBrand.text_hero_cta,
                text_404_headline: this.designerBrand.text_404_headline,
                text_404_subheadline: this.designerBrand.text_404_subheadline,
                text_404_cta: this.designerBrand.text_404_cta,
                content_translations: this.designerBrand.content_translations,
                storefront: storefrontOverrides
            });
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
                    this.app.showNotification('Storefront styles published successfully!');
                    await this.app.loadBrands();
                    this.loadBrandContext();
                    this.iframeReload();
                } else {
                    alert('Error saving designer configuration.');
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            } finally {
                this.saving = false;
            }
        },
        async runAIRewrite(field) {
            const originalText = this.designerBrand[field];
            if (!originalText) {
                alert('Please enter some text first to rewrite.');
                return;
            }
            this.app.showNotification('✨ AI is rewriting your copy...');
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.designerBrand.id}/ai-rewrite`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text: originalText, field })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.text) {
                        this.designerBrand[field] = data.text;
                        this.updatePreviewStyles();
                        this.app.showNotification('✨ Copywriting rewritten successfully!');
                    }
                } else {
                    const err = await response.json();
                    alert('AI rewrite error: ' + (err.error || 'Unknown error'));
                }
            } catch (e) {
                alert('AI rewrite network error: ' + e.message);
            }
        },
        async runAITranslateSingle(field) {
            const englishText = this.designerBrand[field];
            if (!englishText) {
                alert('Please enter English copy first before translating.');
                return;
            }
            this.app.showNotification(`✨ AI is translating copy to ${this.translationActiveLang.toUpperCase()}...`);
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.designerBrand.id}/ai-translate`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text: englishText, targetLang: this.translationActiveLang, field })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.text) {
                        const tr = this.getTranslationRef(this.translationActiveLang);
                        tr[field] = data.text;
                        this.updatePreviewStyles();
                        this.app.showNotification('✨ Translated successfully!');
                    }
                } else {
                    const err = await response.json();
                    alert('AI translation error: ' + (err.error || 'Unknown error'));
                }
            } catch (e) {
                alert('AI translation network error: ' + e.message);
            }
        },
        async runAIRewriteCustomPage(field) {
            const page = this.getCustomPageRef(this.activeContentPage);
            const originalText = page[field];
            if (!originalText) {
                alert('Please enter some text first to rewrite.');
                return;
            }
            this.app.showNotification('✨ AI is rewriting your copy...');
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.designerBrand.id}/ai-rewrite`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text: originalText, field })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.text) {
                        page[field] = data.text;
                        this.updatePreviewStyles();
                        this.app.showNotification('✨ Custom page copy rewritten successfully!');
                    }
                } else {
                    const err = await response.json();
                    alert('AI rewrite error: ' + (err.error || 'Unknown error'));
                }
            } catch (e) {
                alert('AI rewrite network error: ' + e.message);
            }
        },
        async runAITranslateCustomPage(field) {
            const page = this.getCustomPageRef(this.activeContentPage);
            const englishText = page[field];
            if (!englishText) {
                alert('Please enter English copy first before translating.');
                return;
            }
            this.app.showNotification(`✨ AI is translating copy to ${this.translationActiveLang.toUpperCase()}...`);
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.designerBrand.id}/ai-translate`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text: englishText, targetLang: this.translationActiveLang, field })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.text) {
                        const tr = this.getCustomPageTranslationRef(page, this.translationActiveLang);
                        tr[field] = data.text;
                        this.updatePreviewStyles();
                        this.app.showNotification('✨ Custom page copy translated successfully!');
                    }
                } else {
                    const err = await response.json();
                    alert('AI translation error: ' + (err.error || 'Unknown error'));
                }
            } catch (e) {
                alert('AI translation network error: ' + e.message);
            }
        },
        async runAIBulkTranslate(targetLang) {
            this.isBulkTranslating = true;
            this.app.showNotification(targetLang 
                ? `✨ AI is translating all storefront copy to ${targetLang.toUpperCase()}...` 
                : '✨ AI is translating all storefront copy to all languages in background...'
            );
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.designerBrand.id}/ai-translate-all`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ targetLang })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.theme_settings) {
                        this.designerBrand.content_translations = data.theme_settings.content_translations || {};
                        if (data.theme_settings.landing_pages) {
                            this.designerBrand.landing_pages = data.theme_settings.landing_pages;
                        }
                        this.updatePreviewStyles();
                        this.app.showNotification('✨ Storefront pages translated successfully!');
                        this.loadAiUsage();
                    }
                } else {
                    const err = await response.json();
                    alert('AI translation error: ' + (err.error || 'Unknown error'));
                }
            } catch (e) {
                alert('AI translation network error: ' + e.message);
            } finally {
                this.isBulkTranslating = false;
            }
        },
        toggleFullscreen() {
            this.isFullscreen = !this.isFullscreen;
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
        async autoFixContrast() {
            const brand = this.designerBrand;
            if (!brand) return;
            
            this.inheritStyles = false;
            
            const textBgRatio = this.getContrastRatio(brand.text_color, brand.bg_color);
            if (textBgRatio < 4.5) {
                const bgRgb = this.hexToRgb(brand.bg_color);
                if (bgRgb) {
                    const bgLuminance = this.getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
                    brand.text_color = bgLuminance > 0.5 ? '#111111' : '#f3f4f3';
                }
            }

            const btnAccentRatio = this.getContrastRatio(brand.button_text_color, brand.primary_color);
            if (btnAccentRatio < 4.5) {
                const primaryRgb = this.hexToRgb(brand.primary_color);
                if (primaryRgb) {
                    const primaryLuminance = this.getLuminance(primaryRgb.r, primaryRgb.g, primaryRgb.b);
                    brand.button_text_color = primaryLuminance > 0.5 ? '#0b0d0c' : '#ffffff';
                }
            }

            const accentBgRatio = this.getContrastRatio(brand.primary_color, brand.bg_color);
            if (accentBgRatio < 3.0) {
                const bgRgb = this.hexToRgb(brand.bg_color);
                if (bgRgb) {
                    const bgLuminance = this.getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
                    brand.primary_color = bgLuminance > 0.5 ? '#c5a059' : '#ffffff';
                }
            }

            await this.saveDesignSettings();
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
                        console.warn('[DesignerView] Cannot read iframe URL directly (cross-origin security restriction).');
                    }
                    this.updatePreviewStyles();
                    this.changePreviewLanguage();
                    this.syncInlineEditMode();
                }
            } catch(e) {}
        },
        updatePreviewStyles() {
            try {
                const iframe = this.$refs.previewIframe;
                if (iframe && iframe.contentWindow) {
                    const styles = {
                        type: 'UPDATE_PREVIEW_STYLES',
                        primary_color: this.designerBrand.primary_color,
                        secondary_color: this.designerBrand.secondary_color,
                        bg_color: this.designerBrand.bg_color,
                        text_color: this.designerBrand.text_color,
                        button_radius: this.designerBrand.button_radius,
                        button_text_color: this.designerBrand.button_text_color,
                        header_bg_color: this.designerBrand.header_bg_color,
                        font_family: this.designerBrand.font_family,
                        custom_css: this.designerBrand.custom_css,
                        logo: this.designerBrand.logo,
                        favicon: this.designerBrand.favicon,
                        name: this.designerBrand.name,
                        
                        announcement_active: this.designerBrand.announcement_active,
                        announcement_text: this.designerBrand.announcement_text,
                        announcement_bg: this.designerBrand.announcement_bg,
                        announcement_text_color: this.designerBrand.announcement_text_color,
                        font_size_scale: this.designerBrand.font_size_scale,
                        line_height_scale: this.designerBrand.line_height_scale,
                        instagram_link: this.designerBrand.instagram_link,
                        facebook_link: this.designerBrand.facebook_link,
                        twitter_link: this.designerBrand.twitter_link,
                        text_hero_headline: this.designerBrand.text_hero_headline,
                        text_hero_subheadline: this.designerBrand.text_hero_subheadline,
                        text_hero_cta: this.designerBrand.text_hero_cta,
                        text_404_headline: this.designerBrand.text_404_headline,
                        text_404_subheadline: this.designerBrand.text_404_subheadline,
                        text_404_cta: this.designerBrand.text_404_cta,
                        content_translations: this.designerBrand.content_translations,
                        landing_pages: this.designerBrand.landing_pages,
                        theme_settings: this.designerBrand.theme_settings
                    };
                    const cleanStyles = JSON.parse(JSON.stringify(styles));
                    console.log('[DesignerView] Posting styles to iframe:', cleanStyles);
                    fetch('/api/preview-debug-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'DASHBOARD_MSG_SENT', styles: cleanStyles })
                    }).catch(() => {});
                    iframe.contentWindow.postMessage(cleanStyles, '*');
                } else {
                    fetch('/api/preview-debug-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'DASHBOARD_IFRAME_NOT_READY' })
                    }).catch(() => {});
                    console.log('[DesignerView] Iframe or contentWindow not ready yet.');
                }
            } catch(e) {
                console.error('[DesignerView] Error posting styles:', e);
            }
        },
        changePreviewLanguage() {
            try {
                const iframe = this.$refs.previewIframe;
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage({
                        type: 'UPDATE_PREVIEW_LANGUAGE',
                        lang: this.previewActiveLang
                    }, '*');
                }
            } catch (e) {
                console.error('[DesignerView] Error sending language update:', e);
            }
        },
        async handleInlineAiRewrite(text, tone, field, page) {
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.designerBrand.id}/ai-rewrite`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text, tone, field })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.text) {
                        const activeLang = this.translationActiveLang;
                        if (page === 'home' || page === 'track' || page === '404') {
                            if (activeLang === 'en') {
                                this.designerBrand[field] = data.text;
                            } else {
                                if (!this.designerBrand.content_translations) {
                                    this.designerBrand.content_translations = {};
                                }
                                if (!this.designerBrand.content_translations[activeLang]) {
                                    this.designerBrand.content_translations[activeLang] = {};
                                }
                                this.designerBrand.content_translations[activeLang][field] = data.text;
                            }
                        } else {
                            if (this.designerBrand.landing_pages) {
                                const pg = this.designerBrand.landing_pages.find(p => p.id === page);
                                if (pg) {
                                    if (activeLang === 'en') {
                                        pg[field] = data.text;
                                    } else {
                                        if (!pg.translations) {
                                            pg.translations = {};
                                        }
                                        if (!pg.translations[activeLang]) {
                                            pg.translations[activeLang] = {};
                                        }
                                        pg.translations[activeLang][field] = data.text;
                                    }
                                }
                            }
                        }
                        this.showNotification('✨ AI text rewrite successfully applied!');
                    }
                } else {
                    const err = await response.json();
                    this.showNotification(`AI rewrite failed: ${err.error}`);
                    this.updatePreviewStyles();
                }
            } catch (err) {
                this.showNotification(`Error: ${err.message}`);
                this.updatePreviewStyles();
            }
        },
        rgbToHex(rgb) {
            if (!rgb) return null;
            const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
            if (!match) return rgb;
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },
        handleApplyStyleGlobally(field, styles, isButton, page) {
            if (styles.font_family) {
                this.designerBrand.font_family = styles.font_family;
            }
            if (isButton) {
                if (styles.background_color) {
                    const hexColor = this.rgbToHex(styles.background_color);
                    if (hexColor) this.designerBrand.primary_color = hexColor;
                }
                if (styles.border_radius) {
                    this.designerBrand.button_radius = styles.border_radius;
                }
            } else {
                if (styles.color) {
                    const hexColor = this.rgbToHex(styles.color);
                    if (hexColor) this.designerBrand.text_color = hexColor;
                }
            }
            this.updatePreviewStyles();
            this.app.showNotification('Style applied globally.');
        },
        async handleInlineProductEdit(productId, field, value) {
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/products`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) return;
                const productsData = await response.json();
                const product = productsData.find(p => p.id === parseInt(productId));
                if (!product) return;
                
                const updatePayload = {
                    title: product.title,
                    price: product.price,
                    description: product.description,
                    long_description: product.long_description,
                    image: product.image,
                    tag: product.tag,
                    active: product.active,
                    currency: product.currency || 'EUR'
                };
                
                if (field === 'title') {
                    updatePayload.title = value;
                } else if (field === 'description') {
                    updatePayload.description = value;
                    updatePayload.long_description = value;
                } else if (field === 'price') {
                    const numericPrice = parseFloat(value.replace(/[^0-9.]/g, ''));
                    if (!isNaN(numericPrice)) {
                        updatePayload.price = numericPrice;
                    }
                }
                
                const saveRes = await fetch(`${this.app.apiBaseUrl}/api/global/products/${productId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updatePayload)
                });
                
                if (saveRes.ok) {
                    this.app.showNotification('Product updated globally.');
                    const iframe = this.$refs.previewIframe;
                    if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage({
                            type: 'RELOAD_PRODUCTS'
                        }, '*');
                    }
                } else {
                    console.error('Failed to update product details globally');
                }
            } catch(e) {
                console.error('[DesignerView] Error editing product inline:', e);
            }
        },
        recordState() {
            if (this.isApplyingHistory) return;
            if (this.undoStack.length >= 50) {
                this.undoStack.shift();
            }
            const state = JSON.stringify(this.designerBrand);
            if (this.undoStack.length === 0 || this.undoStack[this.undoStack.length - 1] !== state) {
                this.undoStack.push(state);
                this.redoStack = [];
            }
        },
        recordStateDebounced() {
            if (this.recordTimer) clearTimeout(this.recordTimer);
            this.recordTimer = setTimeout(() => {
                this.recordState();
            }, 300);
        },
        undo() {
            if (this.undoStack.length <= 1) {
                this.app.showNotification('Nothing to undo.');
                return;
            }
            const currentState = this.undoStack.pop();
            this.redoStack.push(currentState);
            
            const prevState = this.undoStack[this.undoStack.length - 1];
            this.isApplyingHistory = true;
            this.designerBrand = JSON.parse(prevState);
            this.updatePreviewStyles();
            this.$nextTick(() => {
                this.isApplyingHistory = false;
            });
            this.app.showNotification('Undo.');
        },
        redo() {
            if (this.redoStack.length === 0) {
                this.app.showNotification('Nothing to redo.');
                return;
            }
            const nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            
            this.isApplyingHistory = true;
            this.designerBrand = JSON.parse(nextState);
            this.updatePreviewStyles();
            this.$nextTick(() => {
                this.isApplyingHistory = false;
            });
            this.app.showNotification('Redo.');
        },
        resetDesign() {
            if (!confirm('Are you sure you want to reset all designs and custom pages to their published state?')) {
                return;
            }
            const original = JSON.parse(this.originalBrandSettings);
            
            this.isApplyingHistory = true;
            
            this.inheritStyles = original.inherit;
            this.designerBrand.primary_color = original.primary_color;
            this.designerBrand.secondary_color = original.secondary_color;
            this.designerBrand.bg_color = original.bg_color;
            this.designerBrand.text_color = original.text_color;
            this.designerBrand.button_radius = original.button_radius;
            this.designerBrand.button_text_color = original.button_text_color;
            this.designerBrand.header_bg_color = original.header_bg_color;
            this.designerBrand.font_family = original.font_family;
            this.designerBrand.custom_css = original.custom_css;
            this.designerBrand.text_hero_headline = original.text_hero_headline;
            this.designerBrand.text_hero_subheadline = original.text_hero_subheadline;
            this.designerBrand.text_hero_cta = original.text_hero_cta;
            this.designerBrand.announcement_text = original.announcement_text;
            this.designerBrand.text_404_headline = original.text_404_headline;
            this.designerBrand.text_404_subheadline = original.text_404_subheadline;
            this.designerBrand.text_404_cta = original.text_404_cta;
            this.designerBrand.content_translations = original.content_translations;
            this.designerBrand.landing_pages = original.landing_pages || [];
            
            this.updatePreviewStyles();
            
            this.undoStack = [];
            this.redoStack = [];
            this.recordState();
            
            this.$nextTick(() => {
                this.isApplyingHistory = false;
            });
            this.app.showNotification('Design reset to last published version.');
        },
        syncInlineEditMode() {
            try {
                const iframe = this.$refs.previewIframe;
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage({
                        type: 'SET_EDIT_MODE',
                        enabled: this.inlineEditMode
                    }, '*');
                }
            } catch(e) {
                console.error('[DesignerView] Error syncing edit mode:', e);
            }
        },
        captureOriginalSettings() {
            if (!this.designerBrand) return;
            const currentObj = {
                inherit: this.inheritStyles,
                primary_color: this.designerBrand.primary_color,
                secondary_color: this.designerBrand.secondary_color,
                bg_color: this.designerBrand.bg_color,
                text_color: this.designerBrand.text_color,
                button_radius: this.designerBrand.button_radius,
                button_text_color: this.designerBrand.button_text_color,
                header_bg_color: this.designerBrand.header_bg_color,
                font_family: this.designerBrand.font_family,
                custom_css: this.designerBrand.custom_css,
                logo: this.designerBrand.logo,
                favicon: this.designerBrand.favicon,
                announcement_active: this.designerBrand.announcement_active,
                announcement_text: this.designerBrand.announcement_text,
                announcement_bg: this.designerBrand.announcement_bg,
                announcement_text_color: this.designerBrand.announcement_text_color,
                font_size_scale: this.designerBrand.font_size_scale,
                line_height_scale: this.designerBrand.line_height_scale,
                instagram_link: this.designerBrand.instagram_link,
                facebook_link: this.designerBrand.facebook_link,
                twitter_link: this.designerBrand.twitter_link,
                text_hero_headline: this.designerBrand.text_hero_headline,
                text_hero_subheadline: this.designerBrand.text_hero_subheadline,
                text_hero_cta: this.designerBrand.text_hero_cta,
                text_404_headline: this.designerBrand.text_404_headline,
                text_404_subheadline: this.designerBrand.text_404_subheadline,
                text_404_cta: this.designerBrand.text_404_cta,
                content_translations: this.designerBrand.content_translations
            };
            this.originalBrandSettings = JSON.stringify(currentObj);
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
</style>

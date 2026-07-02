<template>
    <div id="view-content-studio" class="admin-view" :class="{ active: app.activeView === 'content-studio' }">
        <div v-if="app.activeShopFilter === 'all'" class="panel" style="text-align: center; padding: 60px 20px;">
            <span style="font-size: 3rem;">🏬</span>
            <h3 style="margin-top: 15px; color: var(--text-main);">No Store Selected</h3>
            <p style="color: var(--text-muted); max-width: 450px; margin: 10px auto 20px auto; font-size: 0.9rem;">
                Please select a specific brand shop from the workspace switcher dropdown in the top navigation bar to start creating content.
            </p>
        </div>
        <div v-else style="display: flex; flex-direction: column; gap: 24px;">
            <!-- Workspace Row -->
            <div style="display: grid; grid-template-columns: 290px 1fr 1.1fr; gap: 24px; min-height: 500px;">
                <!-- Column 1: Quick-Insert Brand Assets panel -->
                <div class="panel" style="display: flex; flex-direction: column; gap: 16px; min-width: 0; background: rgba(0,0,0,0.1); border-right: 1px solid var(--border);">
                    <h3 style="color: var(--accent); margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; gap: 6px;">
                        ⚡ Brand Guidelines
                    </h3>
                    
                    <!-- Search bar -->
                    <div style="position: relative;">
                        <input type="text" v-model="quickInsertSearch" placeholder="Search guidelines..." 
                               style="width: 100%; height: 32px; font-size: 0.76rem; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 10px; outline: none; margin: 0;">
                    </div>
                    
                    <!-- Tabbar (Inventory, Personas, Sceneries, Audiences) -->
                    <div style="display: flex; border-bottom: 1px solid var(--border); padding-bottom: 4px; gap: 4px; overflow-x: auto; scrollbar-width: none;">
                        <button v-for="tab in ['inventory', 'personas', 'sceneries', 'audiences']" :key="tab"
                                @click="activeQuickTab = tab"
                                :style="activeQuickTab === tab ? 'color: var(--accent); border-bottom: 2px solid var(--accent); font-weight: 700;' : 'color: var(--text-muted);'"
                                style="background: none; border: none; padding: 6px 8px; font-size: 0.74rem; cursor: pointer; text-transform: capitalize; white-space: nowrap;">
                            {{ tab }}
                        </button>
                    </div>
                    
                    <!-- Add / AI Create actions row -->
                    <div style="display: flex; gap: 8px; justify-content: space-between;">
                        <button type="button" @click="openQuickCreateModal" class="btn btn-accent" style="height: 28px; font-size: 0.7rem; padding: 0 10px; font-weight: bold; margin: 0; display: flex; align-items: center; gap: 4px; background: rgba(197, 160, 89, 0.15); border: 1px dashed rgba(197, 160, 89, 0.4); color: var(--accent);">
                            <span>➕ Add New</span>
                        </button>
                        <button type="button" @click="triggerQuickAiCreate" class="btn btn-primary" :disabled="quickAiGenerating" style="height: 28px; font-size: 0.7rem; padding: 0 10px; font-weight: bold; margin: 0; display: flex; align-items: center; gap: 4px;">
                            <span v-if="quickAiGenerating" class="spinner" style="width: 10px; height: 10px; border-width: 2px;"></span>
                            <span>{{ quickAiGenerating ? 'Generating...' : '✨ AI Create' }}</span>
                        </button>
                    </div>
                    
                    <!-- Dynamic List items with Hover effects & Drag and drop -->
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; max-height: 480px; padding-right: 4px;">
                        <div v-for="item in filteredQuickInsertItems" :key="item.id || item.name"
                             draggable="true"
                             @dragstart="handleQuickDragStart($event, item)"
                             @click="insertQuickTag(item)"
                             style="display: flex; align-items: center; gap: 8px; background: var(--card-bg); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border); cursor: grab; transition: all 0.2s;"
                             class="quick-insert-item-hover">
                            <img v-if="item.image || (item._quickType === 'product' || item._quickType === 'service')"
                                 :src="resolveImageUrl(item.image || getProductImageUrl(item))"
                                 style="width: 24px; height: 24px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border);" />
                            <span v-else style="font-size: 1.1rem;">{{ getQuickItemIcon(item) }}</span>
                            <div style="flex: 1; min-width: 0; text-align: left;">
                                <div style="font-size: 0.76rem; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    {{ item.title || item.name }}
                                </div>
                                <div style="font-size: 0.65rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    {{ getQuickItemSubtitle(item) }}
                                </div>
                            </div>
                            <!-- Hover actions overlay -->
                            <div class="hover-actions-overlay" style="display: flex; gap: 4px; align-items: center;">
                                <button type="button" class="btn btn-accent" style="height: 20px; padding: 0 6px; font-size: 0.62rem; font-weight: 700; cursor: pointer; margin: 0; line-height: 1;">+ Insert</button>
                            </div>
                        </div>
                        <div v-if="filteredQuickInsertItems.length === 0" style="font-size: 0.72rem; color: var(--text-muted); text-align: center; padding: 20px;">
                            No items found.
                        </div>
                    </div>
                </div>

                <!-- Column 2: Creative Asset Composer -->
                <div class="panel" style="display: flex; flex-direction: column; gap: 20px;">
                    <h3 style="color: var(--accent); margin: 0 0 5px 0; font-family: var(--font-display); font-weight: 700; font-size: 1.15rem; display: flex; align-items: center; gap: 6px;">
                        🎨 Creative Asset Composer
                    </h3>
                    <p style="color: var(--text-muted); font-size: 0.78rem; margin: 0;">
                        Mix and match your visual DNA elements to design a premium e-commerce lifestyle graphic or animation.
                    </p>

                    <!-- Prompt Template Editor -->
                    <div class="form-group" style="position: relative;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
                            <label style="font-weight: 700; font-size: 0.82rem; margin: 0; display: block;">
                                ✍️ Creative Prompt Composer
                            </label>
                            <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500;">
                                💡 Tip: Type <strong style="color: var(--accent);">$</strong> for products & services, <strong style="color: var(--accent);">@</strong> for personas, <strong style="color: var(--accent);">#</strong> for sceneries, or <strong style="color: var(--accent);">%</strong> for audiences.
                            </span>
                        </div>
                        <!-- Rich contenteditable wrapper div -->
                        <div style="position: relative; width: 100%; margin-bottom: 12px;">
                            <div id="composerRichEditor"
                                 contenteditable="true"
                                 @input="handleEditorInput"
                                 @keydown="handleEditorKeydown"
                                 @keyup="handleEditorKeyup"
                                 @click="handleEditorClick"
                                 @mouseup="saveSelectionRange"
                                 @blur="handleEditorBlur"
                                 @focus="handleEditorFocus"
                                 @dragover="handleDragOver"
                                 @drop="handleDrop"
                                 ref="promptEditor"
                                 placeholder="Describe your scene here. Type $ for products, @ for personas/services/audiences, or # for sceneries."
                                 style="width: 100%; min-height: 120px; max-height: 220px; font-size: 0.85rem; line-height: 1.4; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 10px; outline: none; box-sizing: border-box; text-align: left; overflow-y: auto;">
                            </div>

                            <!-- Banned words warning banner -->
                            <div v-if="detectedBannedWords && detectedBannedWords.length > 0" 
                                 style="margin-top: 8px; margin-bottom: 8px; background: rgba(239, 68, 68, 0.08); border: 1px dashed rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 10px; display: flex; align-items: center; gap: 8px; color: #f87171; font-size: 0.74rem;">
                                <span>⚠️ <strong>Brand Safety Warning:</strong> Banned terms detected:</span>
                                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                                    <span v-for="word in detectedBannedWords" :key="word" style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; border-radius: 4px; padding: 1px 6px; font-weight: 700;">
                                        {{ word }}
                                    </span>
                                </div>
                            </div>
                            
                            <!-- Floating Autocomplete Popup Overlay -->
                            <div v-if="autocomplete.active" 
                                 @click.stop
                                 :style="{
                                     position: 'fixed',
                                     left: autocomplete.x + 'px',
                                     top: (autocomplete.y + 5) + 'px',
                                     zIndex: 10000
                                 }"
                                 style="background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 6px; width: 280px; max-height: 220px; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.5); padding: 8px; display: flex; flex-direction: column; gap: 4px;">
                                <div style="font-size: 0.7rem; color: var(--accent); font-weight: 700; margin-bottom: 4px; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center;">
                                    <span>🔍 Select {{ autocomplete.type }} {{ replacingTagElement ? '(Replace)' : '' }}</span>
                                    <span v-if="replacingTagElement" @click.stop="removeReplacingTag" style="cursor: pointer; color: #ef4444; font-size: 0.65rem; text-decoration: underline;">Remove Tag</span>
                                </div>

                                <!-- Tag Attribute / Property Selector -->
                                <div v-if="replacingTagElement" style="margin-bottom: 6px; display: flex; flex-direction: column; gap: 4px; border-bottom: 1px dashed var(--border); padding-bottom: 6px;">
                                    <label style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600;">Resolve Property/Field:</label>
                                    <select :value="replacingTagElement.getAttribute('data-property') || (autocomplete.type === 'persona' ? 'name' : 'title')" 
                                            @change="changeReplacingTagProperty($event.target.value)" 
                                            style="width: 100%; height: 26px; font-size: 0.74rem; border-radius: 4px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); outline: none; cursor: pointer; padding: 0 4px;">
                                        <template v-if="autocomplete.type === 'product'">
                                            <option value="title">Title (Default)</option>
                                            <option value="price">Price (e.g. 24.00 EUR)</option>
                                            <option value="sku">SKU Code</option>
                                            <option value="description">Description</option>
                                        </template>
                                        <template v-else-if="autocomplete.type === 'service'">
                                            <option value="title">Title (Default)</option>
                                            <option value="price">Price (e.g. 24.00 EUR)</option>
                                            <option value="sku">SKU Code</option>
                                            <option value="description">Description</option>
                                        </template>
                                        <template v-else-if="autocomplete.type === 'persona'">
                                            <option value="name">Name (Default)</option>
                                            <option value="role">Role / Occupation</option>
                                            <option value="age">Target Age Group</option>
                                            <option value="apparel">Apparel / Clothing Style</option>
                                            <option value="expression">Facial Expression</option>
                                            <option value="description">Biography Motivations</option>
                                        </template>
                                        <template v-else-if="autocomplete.type === 'audience'">
                                            <option value="name">Name (Default)</option>
                                            <option value="rules">Rules / Targets JSON</option>
                                        </template>
                                        <template v-else-if="autocomplete.type === 'scenery'">
                                            <option value="name">Name (Default)</option>
                                            <option value="description">Backdrop Description</option>
                                            <option value="lighting">Lighting Details</option>
                                            <option value="photography_style">Optics / Lens style</option>
                                        </template>
                                        <template v-else-if="autocomplete.type === 'object'">
                                            <option value="name">Name (Default)</option>
                                            <option value="description">Visual Properties / Materials</option>
                                            <option value="branding">Branding Style</option>
                                        </template>
                                    </select>
                                </div>

                                <input v-if="replacingTagElement" type="text" v-model="autocomplete.query" ref="autocompleteSearch" placeholder="Type to filter replacement..." 
                                       style="height: 28px; font-size: 0.76rem; border-radius: 4px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 8px; outline: none; margin: 0 0 6px 0;"
                                       @keydown.enter.prevent="selectAutocompleteFirst"
                                       @keydown.esc.prevent="closeAutocomplete">
                                
                                <div style="display: flex; flex-direction: column; gap: 4px; overflow-y: auto; max-height: 140px;">
                                    <div v-for="(item, idx) in filteredAutocompleteItems" :key="item.id || item.name" 
                                         @click.stop="insertAutocompleteTag(item)"
                                         :style="{
                                             background: autocomplete.selectedIndex === idx ? 'rgba(255,255,255,0.08)' : 'transparent',
                                             borderColor: autocomplete.selectedIndex === idx ? 'var(--accent)' : 'transparent'
                                         }"
                                         style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 4px; cursor: pointer; border: 1px solid transparent; transition: 0.2s;"
                                         @mouseover="autocomplete.selectedIndex = idx"
                                         onmouseout="this.style.background='transparent';">
                                        <img v-if="item._quickType === 'product' || autocomplete.type === 'product'" :src="getProductImageUrl(item)" style="width: 20px; height: 20px; object-fit: cover; border-radius: 2px;">
                                        <span v-else-if="item._quickType === 'service' || autocomplete.type === 'service'" style="font-size: 0.8rem;">💼</span>
                                        <span v-else-if="item._quickType === 'persona' || autocomplete.type === 'persona'" style="font-size: 0.8rem;">👥</span>
                                        <span v-else-if="item._quickType === 'audience' || autocomplete.type === 'audience'" style="font-size: 0.8rem;">🎯</span>
                                        <span v-else-if="item._quickType === 'object' || autocomplete.type === 'object'" style="font-size: 0.8rem;">⚙️</span>
                                        <span v-else style="font-size: 0.8rem;">🌄</span>
                                        
                                        <div style="flex: 1; min-width: 0; text-align: left; font-size: 0.76rem;">
                                            <div style="font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ item.title || item.name }}</div>
                                        </div>
                                        <span style="font-size: 0.65rem; color: var(--accent); font-weight: 700;">{{ replacingTagElement ? 'Replace' : '+ Insert' }}</span>
                                    </div>
                                    <div v-if="filteredAutocompleteItems.length === 0" style="font-size: 0.72rem; color: var(--text-muted); text-align: center; padding: 10px;">No items match.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Advanced Photographic Parameters (Camera, Lighting, Composition) -->
                    <details style="border: 1px solid var(--border); border-radius: 6px; padding: 10px; background: rgba(255,255,255,0.01); margin-bottom: 5px;">
                        <summary style="font-weight: 700; font-size: 0.8rem; color: var(--accent); cursor: pointer; user-select: none;">
                            ⚙️ Advanced Photographic Settings
                        </summary>
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border);">
                            <!-- Inherited Scenery Details Display -->
                            <div v-if="activeSceneries && activeSceneries.length > 0" style="margin-bottom: 4px;">
                                <!-- Warning for multiple sceneries -->
                                <div v-if="activeSceneries.length > 1" style="background: rgba(239, 68, 68, 0.08); border: 1px dashed rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 10px; margin-bottom: 12px; font-size: 0.74rem; color: #f87171; line-height: 1.4;">
                                    ⚠️ <strong>Multiple backdrops detected in prompt:</strong> {{ activeSceneries.map(s => s.name).join(', ') }}.
                                    Only the first backdrop (<strong>{{ activeSceneries[0].name }}</strong>) will be parsed to define the scenery settings. Please restrict to a single backdrop scenery for a clean physical shot.
                                </div>
                                <!-- Single scenery inherited config -->
                                <div style="background: rgba(197, 160, 89, 0.05); border: 1px solid rgba(197, 160, 89, 0.2); border-radius: 6px; padding: 10px; margin-bottom: 4px; font-size: 0.74rem;">
                                    <strong style="color: var(--accent); display: block; margin-bottom: 4px;">🌄 Inherited Backdrop: {{ activeSceneries[0].name }}</strong>
                                    <div style="color: var(--text-muted); line-height: 1.4;">
                                        <div><strong>Default Lens:</strong> {{ activeSceneries[0].photography_style || 'N/A' }}</div>
                                        <div><strong>Default Lighting:</strong> {{ activeSceneries[0].lighting || 'N/A' }}</div>
                                        <div style="margin-top: 4px; font-size: 0.7rem; font-style: italic; opacity: 0.85;">"{{ activeSceneries[0].description }}"</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Camera Lens Selection -->
                            <div class="form-group" style="margin: 0;">
                                <label style="font-weight: 600; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 4px; display: block;">Camera Lens & Optics</label>
                                <select v-model="composerParams.cameraLens" style="width: 100%; height: 34px; border-radius: 4px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.8rem; padding: 0 10px; cursor: pointer;">
                                    <option value="">Inherit from Scenery (Default)</option>
                                    <option value="35mm lens, f/1.8 aperture (Cinematic Medium)">35mm lens, f/1.8 (Cinematic Medium)</option>
                                    <option value="50mm lens, f/1.2 aperture (Sharp Details Portrait)">50mm lens, f/1.2 (Portrait & Details)</option>
                                    <option value="85mm lens, f/1.4 aperture (Shallow Depth Portrait)">85mm lens, f/1.4 (Shallow Depth)</option>
                                    <option value="Macro lens, f/2.8 (Extreme Close-up Detail)">Macro lens, f/2.8 (Macro Close-up)</option>
                                    <option value="Wide-angle prime lens (Spacious Scene Perspective)">Wide-angle lens (Spacious Scene)</option>
                                </select>
                            </div>

                            <!-- Lighting Selection -->
                            <div class="form-group" style="margin: 0;">
                                <label style="font-weight: 600; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 4px; display: block;">Lighting Style & Atmosphere</label>
                                <select v-model="composerParams.lightingStyle" style="width: 100%; height: 34px; border-radius: 4px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.8rem; padding: 0 10px; cursor: pointer;">
                                    <option value="">Inherit from Scenery (Default)</option>
                                    <option value="natural soft window side-light">Natural soft window side-light</option>
                                    <option value="cinematic golden hour warm sunset glow">Golden hour warm sunset glow</option>
                                    <option value="dramatic chiaroscuro lighting with deep shadows">Chiaroscuro studio contrast</option>
                                    <option value="cinematic rim lighting with soft halo contours">Cinematic rim contours highlight</option>
                                    <option value="bright diffused commercial studio softbox light">Diffused commercial softbox light</option>
                                </select>
                            </div>

                            <!-- Composition & Framing Selection -->
                            <div class="form-group" style="margin: 0;">
                                <label style="font-weight: 600; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 4px; display: block;">Composition & Framing Angle</label>
                                <select v-model="composerParams.composition" style="width: 100%; height: 34px; border-radius: 4px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.8rem; padding: 0 10px; cursor: pointer;">
                                    <option value="">Inherit from Scenery (Default)</option>
                                    <option value="eye-level straight-on medium shot">Eye-level straight-on medium shot</option>
                                    <option value="extreme close-up macro detail shot">Extreme close-up macro detail shot</option>
                                    <option value="top-down flat lay studio layout">Top-down flat lay layout</option>
                                    <option value="low-angle heroic look looking up at product">Low-angle heroic perspective</option>
                                    <option value="three-quarter product portrait composition">Three-quarter product portrait</option>
                                </select>
                            </div>
                        </div>
                    </details>

                    <!-- AI Model engine & Seed Management -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <!-- AI Model engine selector -->
                        <div class="form-group" style="margin: 0;">
                            <label style="font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display: block;">5. AI Generation Engine</label>
                            <select v-model="composerParams.backend" style="width: 100%; height: 36px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-size: 0.82rem; padding: 0 10px; cursor: pointer; text-transform: uppercase;">
                                <option value="auto">Auto-Select Best (Recommended)</option>
                                <option value="imagen">Imagen 3</option>
                                <option value="flux-schnell">FLUX.1 [schnell] (Draft Mode - $0.0003)</option>
                                <option value="flux">FLUX.1 [dev] (Balanced - $0.01)</option>
                                <option value="flux-2-flex">FLUX.2 [flex] (JSON Schema - $0.02)</option>
                                <option value="flux-pro">FLUX 1.1 [pro] (Premium - $0.04)</option>
                                <option value="flux-2-max">FLUX.2 [max] (Ultimate Photorealism - $0.08)</option>
                                <option value="dalle">DALL-E 3</option>
                            </select>
                            <div style="font-size: 0.68rem; color: var(--accent); margin-top: 4px; line-height: 1.3;">
                                ✨ Recommended: <strong style="text-transform: uppercase;">{{ recommendedEngine.name }}</strong> ({{ recommendedEngine.reason }})
                            </div>
                            <div style="font-size: 0.66rem; color: var(--text-muted); margin-top: 4px; line-height: 1.35; padding: 4px; border-left: 2px solid var(--accent); background: rgba(255,255,255,0.01);">
                                💡 <em>Note: Directory cards (personas, scenery, props) use ultra-low-cost <strong>FLUX [schnell]</strong> to save credits. Use the selector above to switch to premium engines for final composites!</em>
                            </div>
                        </div>

                        <!-- Style Consistency Anchor (Seed Configuration) -->
                        <div class="form-group" style="margin: 0; position: relative;">
                            <label style="font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display: block;">
                                🔢 Style Consistency Anchor (Seed)
                            </label>
                            <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 6px;">
                                <input type="number" v-model="composerParams.seed" placeholder="Random Style Seed" style="height: 36px; font-size: 0.82rem; flex: 1; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; outline: none; margin: 0;" :disabled="composerParams.lockSeed">
                                <button type="button" @click="composerParams.lockSeed = !composerParams.lockSeed" class="btn" style="height: 36px; width: 36px; display: flex; align-items: center; justify-content: center; margin: 0; padding: 0; border: 1px solid var(--border); cursor: pointer;" :style="composerParams.lockSeed ? 'background: rgba(139, 92, 246, 0.15); border-color: #8b5cf6; color: #8b5cf6;' : 'background: var(--card-bg); color: var(--text-muted);'" :title="composerParams.lockSeed ? 'Locked: Seed remains constant' : 'Unlocked: Seed randomizes every run'">
                                    <span>{{ composerParams.lockSeed ? '🔒' : '🔓' }}</span>
                                </button>
                            </div>
                            
                            <!-- Presets Dropdown & Add Option -->
                            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 6px; padding: 8px; display: flex; flex-direction: column; gap: 6px;">
                                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                                    <span v-for="preset in presetAnchors" :key="preset.seed" 
                                          @click="selectSeedPreset(preset)" 
                                          style="font-size: 0.65rem; padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border); cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"
                                          :style="composerParams.seed == preset.seed ? 'background: rgba(139, 92, 246, 0.15); border-color: #8b5cf6; color: #a78bfa;' : 'background: var(--card-bg); color: var(--text-muted);'">
                                        <img v-if="preset.image" :src="resolveImageUrl(preset.image)" style="width: 14px; height: 14px; object-fit: cover; border-radius: 2px;" />
                                        <span v-else>🎨</span>
                                        {{ preset.name }}
                                        <span @click.stop="deleteSeedPreset(preset)" style="color: #f87171; cursor: pointer; font-size: 0.75rem;">×</span>
                                    </span>
                                </div>
                                <div style="display: flex; gap: 4px; align-items: center; margin-top: 2px;">
                                    <input type="text" v-model="newAnchorPresetName" placeholder="Name current seed..." style="flex: 1; height: 24px; font-size: 0.72rem; border-radius: 4px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 6px;">
                                    <button type="button" @click="saveCurrentSeedAsPreset" class="btn" style="height: 24px; padding: 0 8px; font-size: 0.72rem; margin: 0; background: var(--accent); color: #0d0e12; font-weight: bold; border-radius: 4px; cursor: pointer;">
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Asset Format Toggle -->
                    <div class="form-group">
                        <label style="font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display: block;">6. Output Creative Format</label>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" @click="composerParams.format = 'image'" class="btn" style="flex: 1; height: 34px; font-size: 0.75rem; font-weight: 600; margin: 0; border-radius: 6px;"
                                    :style="composerParams.format === 'image' ? 'background: #22c55e; color: #0d0e12;' : 'background: var(--card-bg); color: var(--text-main); border: 1px solid var(--border);'">
                                📸 High-Res Photo (Static)
                            </button>
                            <button type="button" @click="composerParams.format = 'video'" class="btn" style="flex: 1; height: 34px; font-size: 0.75rem; font-weight: 600; margin: 0; border-radius: 6px;"
                                    :style="composerParams.format === 'video' ? 'background: #a855f7; color: white;' : 'background: var(--card-bg); color: var(--text-main); border: 1px solid var(--border);'">
                                🎬 4s Cinemagraph Loop (Video)
                            </button>
                        </div>
                    </div>

                    <!-- Aspect Ratio & Safety Tolerance Grid -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 12px; margin-bottom: 12px;">
                        <div class="form-group" style="margin: 0;">
                            <label style="font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display: block;">📐 Creative Aspect Ratio</label>
                            <select v-model="composerParams.aspectRatio" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-size: 0.82rem; padding: 0 10px; cursor: pointer;">
                                <option value="1:1">1:1 (Square Post)</option>
                                <option value="16:9">16:9 (Landscape Banner)</option>
                                <option value="9:16">9:16 (Portrait Story/TikTok)</option>
                                <option value="4:3">4:3 (Landscape Grid)</option>
                                <option value="3:4">3:4 (Portrait Grid)</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label style="font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display: block;">🛡️ Safety Filter Tolerance</label>
                            <select v-model="composerParams.safetyTolerance" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-size: 0.82rem; padding: 0 10px; cursor: pointer;">
                                <option value="strict">Strict (High Guardrails)</option>
                                <option value="moderate">Moderate (Standard Filters)</option>
                                <option value="bypass">Permissive (Bypass Safeguards)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Preview Translation Language Selector -->
                    <div class="form-group" v-if="settingsBrandLanguages && settingsBrandLanguages.length > 1" style="margin-top: 12px;">
                        <label style="font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display: block;">🌐 Preview Language Context</label>
                        <select v-model="composerParams.previewLanguage" style="width: 100%; height: 34px; border-radius: 4px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.8rem; padding: 0 10px; cursor: pointer;">
                            <option value="en">English (Primary / Default)</option>
                            <option v-for="lang in settingsBrandLanguages.filter(l => l !== 'en')" :key="lang" :value="lang">
                                {{ lang.toUpperCase() }} Translation Context
                            </option>
                        </select>
                    </div>
                </div>

                <!-- Composer Right Panel (Preview & Prompt) -->
                <div class="panel" style="display: flex; flex-direction: column; gap: 20px; background: rgba(0,0,0,0.15);">
                    <h3 style="color: var(--accent); margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 1.15rem; display: flex; align-items: center; gap: 6px;">
                        🔮 Real-time Generation Monitor
                    </h3>

                    <!-- Live Prompt Box -->
                    <div style="background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px;">
                        <label style="font-size: 0.7rem; color: var(--accent); text-transform: uppercase; font-weight: 800; display: block; margin-bottom: 6px;">
                            Assembled Brand visual Blueprint Prompt
                        </label>
                        <div style="font-size: 0.8rem; color: var(--text-main); line-height: 1.45; font-family: monospace; white-space: pre-wrap; word-break: break-word; min-height: 60px;">
                            {{ liveAssembledPrompt }}
                        </div>
                    </div>

                    <!-- Render Frame -->
                    <div style="flex: 1; background: var(--workspace-bg); border: 1px dashed var(--border); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; min-height: 250px;">
                        
                        <!-- Idle State -->
                        <div v-if="!composerGenerating && !composerResultUrl" style="text-align: center; color: var(--text-muted); padding: 24px;">
                            <span style="font-size: 2.5rem; display: block; margin-bottom: 12px;">🎭</span>
                            <span style="font-size: 0.82rem; font-weight: 600; display: block; color: var(--text-main);">Ready to Generate</span>
                            <span style="font-size: 0.72rem; display: block; margin-top: 4px;">Click the run button below to generate high-fidelity assets.</span>
                        </div>

                        <!-- Generating Loader -->
                        <div v-else-if="composerGenerating" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; z-index: 5; border-radius: 12px; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);">
                            <div style="width: 42px; height: 42px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                            <div style="text-align: center; width: 60%;">
                                <h4 style="margin: 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main);">Synthesizing Asset...</h4>
                                <div style="margin: 12px auto 8px auto; width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                                    <div :style="`height: 100%; width: ${composerEta.progress}%; background: var(--accent); transition: width 0.1s linear; box-shadow: 0 0 10px var(--accent);`"></div>
                                </div>
                                <p style="margin: 0; font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">
                                    ETA: {{ Math.round(composerEta.expectedDuration / 1000) }}s
                                </p>
                            </div>
                        </div>

                        <!-- Result Display -->
                        <template v-else-if="composerResultUrl">
                            <video v-if="composerParams.format === 'video'" :src="resolveImageUrl(composerResultUrl)" autoplay loop muted style="width: 100%; height: 100%; object-fit: cover; position: absolute; top:0; left:0;"></video>
                            <img v-else :src="resolveImageUrl(composerResultUrl)" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top:0; left:0;">
                            
                            <!-- Floating Format Badge -->
                            <span style="position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 4px; z-index: 10;">
                                {{ composerParams.format === 'video' ? '🎬 Cinemagraph Video' : '📸 High-Res Photo' }}
                            </span>

                            <!-- Floating Verified & SafeGuard-VL Policy Compliance Badge -->
                            <div v-if="complianceAudit" style="position: absolute; top: 12px; right: 12px; z-index: 10; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                                <span style="background: rgba(16, 185, 129, 0.9); border: 1px solid #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);">
                                    🛡️ Verified C2PA Origin Signed
                                </span>
                                <span :style="complianceAudit.passed ? 'background: rgba(139, 92, 246, 0.9); border-color: #8b5cf6;' : 'background: rgba(239, 68, 68, 0.9); border-color: #ef4444;'" 
                                      style="border: 1px solid; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(139, 92, 246, 0.25);"
                                      :title="complianceAudit.violations && complianceAudit.violations.length ? 'Violations: ' + complianceAudit.violations.join(', ') : 'All brand DNA parameters verified'">
                                    🧬 SafeGuard-VL Score: {{ Math.round(complianceAudit.complianceScore * 100) }}%
                                </span>
                            </div>
                        </template>
                    </div>

                    <!-- Active Seed Info & History -->
                    <div v-if="composerResultItem" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 0.76rem; margin-top: -10px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="color: var(--text-muted);">Active Seed:</span>
                            <strong style="color: var(--accent); font-family: monospace;">{{ composerResultItem.seed }}</strong>
                            <button type="button" @click="copySeed(composerResultItem.seed)" class="btn" style="height: 20px; font-size: 0.65rem; padding: 0 6px; margin: 0; border: none; background: none; color: var(--accent); text-decoration: underline; cursor: pointer;">
                                Copy
                            </button>
                        </div>
                        <button type="button" @click="saveSeedToGuidelines(composerResultItem.seed)" class="btn" style="height: 24px; font-size: 0.7rem; padding: 0 10px; margin: 0; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); color: #a78bfa; border-radius: 4px;">
                            💾 Save Seed to Guidelines
                        </button>
                    </div>

                    <!-- Session Drafts History Carousel -->
                    <div v-if="draftsHistory.length > 0" style="display: flex; flex-direction: column; gap: 6px; margin-top: -5px;">
                        <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; display: block;">
                            🕒 Recent Draft Variants (This Session)
                        </span>
                        <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; border-bottom: 1px solid var(--border);">
                            <div v-for="draft in draftsHistory" :key="draft.url" 
                                 @click="composerResultUrl = draft.url; composerResultItem = draft.item; composerParams.seed = draft.seed; complianceAudit = draft.complianceAudit || null;"
                                 style="flex-shrink: 0; width: 64px; height: 64px; border-radius: 6px; border: 2px solid var(--border); overflow: hidden; cursor: pointer; transition: 0.2s; position: relative;"
                                 :style="composerResultUrl === draft.url ? 'border-color: var(--accent); transform: scale(1.05); box-shadow: 0 0 8px rgba(197, 160, 89, 0.3);' : ''">
                                <video v-if="draft.item.folder === 'video' || draft.url.endsWith('mp4')" :src="draft.url" muted style="width: 100%; height: 100%; object-fit: cover;"></video>
                                <img v-else :src="optimizeImageUrl(draft.url, 150, 150)" style="width: 100%; height: 100%; object-fit: cover;">
                                <span style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.65); color: white; font-size: 0.55rem; padding: 1px 4px; border-radius: 3px; font-family: monospace;">
                                    #{{ draft.seed }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- AI Prompt Optimization Switch -->
                    <div style="margin: 10px 0 15px 0; background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 6px; padding: 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                        <div style="display: flex; flex-direction: column; gap: 2px; flex: 1;">
                            <span style="font-size: 0.76rem; font-weight: 700; color: #a78bfa; display: flex; align-items: center; gap: 4px;">
                                ✨ AI Prompt Optimizer
                            </span>
                            <span style="font-size: 0.66rem; color: var(--text-muted); line-height: 1.3;">
                                Rewrites and expands compiled guidelines text using Gemini into a high-fidelity cinematic rendering prompt.
                            </span>
                        </div>
                        <label style="position: relative; display: inline-block; width: 44px; height: 22px; cursor: pointer; user-select: none;">
                            <input type="checkbox" v-model="composerParams.optimizePrompt" style="opacity: 0; width: 0; height: 0;">
                            <span :style="composerParams.optimizePrompt ? 'background-color: #8b5cf6;' : 'background-color: var(--border);'" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; transition: .3s; border-radius: 34px; display: flex; align-items: center; padding: 2px;">
                                <span :style="composerParams.optimizePrompt ? 'transform: translateX(22px);' : 'transform: translateX(0);'" style="height: 18px; width: 18px; background-color: white; border-radius: 50%; transition: .3s; display: inline-block;"></span>
                            </span>
                        </label>
                    </div>

                    <div style="margin: 0 0 15px 0; background: rgba(212, 178, 111, 0.05); border: 1px solid rgba(212, 178, 111, 0.25); border-radius: 6px; padding: 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                        <div style="display: flex; flex-direction: column; gap: 2px; flex: 1;">
                            <span style="font-size: 0.76rem; font-weight: 700; color: var(--accent); display: flex; align-items: center; gap: 4px;">
                                🏆 Best-of-2 Quality Duel
                            </span>
                            <span style="font-size: 0.66rem; color: var(--text-muted); line-height: 1.3;">
                                Renders 2 candidates with different seeds and an AI art director keeps the more realistic one. Doubles the generation cost.
                            </span>
                        </div>
                        <label style="position: relative; display: inline-block; width: 44px; height: 22px; cursor: pointer; user-select: none;">
                            <input type="checkbox" v-model="composerParams.bestOfTwo" style="opacity: 0; width: 0; height: 0;">
                            <span :style="composerParams.bestOfTwo ? 'background-color: var(--accent);' : 'background-color: var(--border);'" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; transition: .3s; border-radius: 34px; display: flex; align-items: center; padding: 2px;">
                                <span :style="composerParams.bestOfTwo ? 'transform: translateX(22px);' : 'transform: translateX(0);'" style="height: 18px; width: 18px; background-color: white; border-radius: 50%; transition: .3s; display: inline-block;"></span>
                            </span>
                        </label>
                    </div>

                    <!-- Generation Controls -->
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button type="button" @click="generateComposerAsset" :disabled="composerGenerating" class="btn btn-accent" 
                                style="flex: 1; height: 40px; margin: 0; font-weight: bold; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, var(--accent) 0%, #d4b26f 100%); min-width: 180px;">
                            <span>🚀 Run Creative Engine</span>
                        </button>

                        <button type="button" v-if="composerResultUrl" @click="refineComposerAsset" :disabled="composerGenerating" class="btn" 
                                style="flex: 1; height: 40px; margin: 0; font-weight: bold; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 8px; background: #8b5cf6; border: 1px solid #7c3aed; color: white; min-width: 180px;">
                            <span>🪄 Refine Asset (Img2Img)</span>
                        </button>
                        
                        <button type="button" @click="randomizeComposerScene" :disabled="composerGenerating" class="btn" 
                                style="height: 40px; margin: 0; font-weight: bold; font-size: 0.82rem; display: flex; align-items: center; justify-content: center; gap: 6px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border); color: var(--text-main); cursor: pointer;">
                            <span>🎲 Random Scene</span>
                        </button>

                        <button type="button" v-if="composerResultUrl" @click="saveComposerAssetToLibrary" :disabled="savingComposerAsset || (composerResultItem && composerResultItem.id)" class="btn"
                                style="height: 40px; margin: 0; font-weight: bold; font-size: 0.85rem; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.2); color: #22c55e; min-width: 160px;"
                                :style="(composerResultItem && composerResultItem.id) ? 'background: rgba(34, 197, 94, 0.05); color: #87e8a4; border-color: rgba(34, 197, 94, 0.1);' : ''">
                            <span v-if="savingComposerAsset">⏳ Saving...</span>
                            <span v-else-if="composerResultItem && composerResultItem.id">✅ Added to Media Library</span>
                            <span v-else>📥 Add to Media Library</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Brand DNA Harvesting Dashboard -->
            <div class="panel" style="margin-bottom: 20px; border: 1px solid rgba(139, 92, 246, 0.25); background: linear-gradient(135deg, rgba(20, 16, 32, 0.6) 0%, rgba(13, 14, 18, 0.9) 100%);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <h3 style="color: var(--text-main); margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 1.05rem; display: flex; align-items: center; gap: 8px;">
                            🧬 Brand DNA Intelligence Harvester
                        </h3>
                        <p style="font-size: 0.76rem; color: var(--text-muted); margin: 4px 0 0 0; line-height: 1.4;">
                            Programmatically crawl corporate digital properties to extract design tokens (colors, typography) and customer demographic archetypes into the guidelines canvas.
                        </p>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center; flex: 1; min-width: 280px; justify-content: flex-end;">
                        <input type="text" v-model="harvesterUrl" placeholder="Enter corporate domain (e.g. https://brand.com)..." 
                               style="flex: 1; max-width: 400px; height: 36px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.8rem; padding: 0 10px;">
                        <button type="button" @click="harvestBrandDna" :disabled="harvestingDna" class="btn btn-accent" 
                                style="height: 36px; font-weight: 700; padding: 0 16px; margin: 0; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; display: flex; align-items: center; gap: 6px; border-radius: 6px; cursor: pointer;">
                            <span v-if="harvestingDna">⏳ Crawling...</span>
                            <span v-else>🔍 Extract DNA</span>
                        </button>
                    </div>
                </div>
                
                <!-- Expanded Brand DNA Details View -->
                <div v-if="canvas.brand_dna" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border); display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 0.76rem;">
                    <div style="background: rgba(255,255,255,0.02); padding: 10px; border-radius: 6px; border: 1px solid var(--border);">
                        <strong style="color: var(--accent); display: block; margin-bottom: 4px;">🏢 Corporate Name</strong>
                        <span style="color: var(--text-main); font-weight: 600;">{{ canvas.brand_dna.corporateName }}</span>
                        <span style="display: block; color: var(--text-muted); margin-top: 4px; font-size: 0.68rem;">Sector: {{ canvas.brand_dna.industrySector }}</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.02); padding: 10px; border-radius: 6px; border: 1px solid var(--border);">
                        <strong style="color: var(--accent); display: block; margin-bottom: 4px;">🎨 Design Palette</strong>
                        <div style="display: flex; gap: 6px; margin-top: 4px; align-items: center;">
                            <span v-if="canvas.brand_dna.palette && canvas.brand_dna.palette.primaryHex" :style="'background:' + canvas.brand_dna.palette.primaryHex" style="width: 14px; height: 14px; border-radius: 3px; display: inline-block; border: 1px solid rgba(255,255,255,0.15);" :title="'Primary: ' + canvas.brand_dna.palette.primaryHex"></span>
                            <span v-if="canvas.brand_dna.palette && canvas.brand_dna.palette.secondaryHex" :style="'background:' + canvas.brand_dna.palette.secondaryHex" style="width: 14px; height: 14px; border-radius: 3px; display: inline-block; border: 1px solid rgba(255,255,255,0.15);" :title="'Secondary: ' + canvas.brand_dna.palette.secondaryHex"></span>
                            <span v-if="canvas.brand_dna.palette && canvas.brand_dna.palette.accentHex" :style="'background:' + canvas.brand_dna.palette.accentHex" style="width: 14px; height: 14px; border-radius: 3px; display: inline-block; border: 1px solid rgba(255,255,255,0.15);" :title="'Accent: ' + canvas.brand_dna.palette.accentHex"></span>
                        </div>
                        <span style="display: block; color: var(--text-muted); margin-top: 4px; font-size: 0.68rem;">Font: {{ canvas.brand_dna.typography?.primaryFamily || 'Default' }}</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.02); padding: 10px; border-radius: 6px; border: 1px solid var(--border);">
                        <strong style="color: var(--accent); display: block; margin-bottom: 4px;">🛡️ Safe Zone & Angles</strong>
                        <span style="color: var(--text-main);">Safe Zone Ratio: {{ canvas.brand_dna.visualConstraintMatrix?.logoSafeZoneRatio }}</span>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                            <span v-for="angle in canvas.brand_dna.visualConstraintMatrix?.allowedCameraAngles || []" :key="angle" style="background: rgba(255,255,255,0.05); padding: 2px 5px; border-radius: 3px; font-size: 0.65rem; color: var(--text-muted);">
                                {{ angle }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Brand Directory Panels -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
                
                <!-- Main Brand People Directory -->
                <div class="panel">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="color: var(--text-main); margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 1.05rem; display: flex; align-items: center; gap: 6px;">
                            👥 Main Brand People (Personas)
                        </h3>
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <button type="button" @click="openAddPersonaForm" class="btn btn-secondary" style="height: 26px; padding: 0 10px; font-size: 0.72rem; margin: 0; font-weight: 700; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                                ➕ Add Persona
                            </button>
                            <button type="button" @click="generateGuidelineAssetAi('persona')" class="btn" style="height: 26px; padding: 0 10px; font-size: 0.72rem; margin: 0; font-weight: 700; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #a78bfa; cursor: pointer;">
                                <span>✨ Generate with AI</span>
                            </button>
                        </div>
                    </div>

                    <!-- Persona Cards List -->
                    <div style="display: flex; flex-direction: column; gap: 12px; max-height: 380px; overflow-y: auto; padding-right: 4px;">
                        <div v-for="(p, idx) in canvas.personas" :key="p.name" 
                             style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; gap: 12px; position: relative;">
                            <div style="display: flex; gap: 12px; align-items: flex-start; flex: 1; min-width: 0;">
                                <!-- Persona Image Thumbnail / Placeholder -->
                                <div style="position: relative; width: 64px; height: 64px; border-radius: 8px; border: 1px solid var(--border); background: var(--workspace-bg); overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                                    <div v-if="generatingVisuals.personas[idx]" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.8); z-index: 10; padding: 20px;">
                                        <span class="spinner" style="margin-bottom: 12px; border-color: var(--accent); border-right-color: transparent;"></span>
                                        <div style="width: 80%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; margin-bottom: 8px;">
                                            <div :style="`height: 100%; width: ${generationEta.personas[idx]?.progress || 0}%; background: var(--accent); transition: width 0.1s linear;`"></div>
                                        </div>
                                        <div style="font-size: 0.65rem; color: var(--text-muted); font-family: monospace;">
                                            ETA: {{ Math.round((generationEta.personas[idx]?.expectedDuration || 8500) / 1000) }}s
                                        </div>
                                    </div>
                                    <img v-else-if="p.image" :src="resolveImageUrl(p.image)" style="width: 100%; height: 100%; object-fit: cover;" />
                                    <template v-else>
                                        <span style="font-size: 1.5rem; opacity: 0.4;">👥</span>
                                        <button type="button" @click="generateGuidelineImage('persona', idx)" 
                                                style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.65); border: none; color: white; font-size: 0.58rem; padding: 3px 0; cursor: pointer; text-align: center; font-weight: bold; border-radius: 0 0 7px 7px;" 
                                                title="Generate image for this persona">
                                            🎨 AI Pic
                                        </button>
                                    </template>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0;">
                                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                        <strong style="color: var(--accent); font-size: 0.85rem;">{{ p.name }}</strong>
                                        <span style="font-size: 0.7rem; color: var(--text-muted); background: var(--workspace-bg); padding: 1px 6px; border-radius: 4px;">Age: {{ p.age }}</span>
                                    </div>
                                    <span style="font-size: 0.76rem; color: var(--text-main); font-weight: 600;">{{ p.role }}</span>
                                    <p style="font-size: 0.74rem; color: var(--text-muted); margin: 0; line-height: 1.4; word-break: break-word;">{{ p.description }}</p>
                                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
                                        <span v-if="p.gender" style="font-size: 0.68rem; color: var(--text-muted); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; text-transform: capitalize;">👤 {{ p.gender }}</span>
                                        <span style="font-size: 0.68rem; color: var(--text-muted); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px;">👗 {{ p.apparel }}</span>
                                        <span style="font-size: 0.68rem; color: var(--text-muted); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px;">😊 {{ p.expression }}</span>
                                        <span v-if="p.seed" style="font-size: 0.68rem; color: var(--text-muted); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px;">🔢 Seed: {{ p.seed }}</span>
                                    </div>
                                    <div v-if="p.image || (p.variants && p.variants.length > 0)" style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
                                        <span style="font-size: 0.62rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; display: block;">Visual Variants:</span>
                                        <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                                            <div v-for="(v, vIdx) in (p.variants || [])" :key="v.seed" 
                                                 style="position: relative; width: 32px; height: 32px; border-radius: 4px; border: 1px solid var(--border); background: var(--workspace-bg); overflow: hidden; cursor: pointer; transition: transform 0.2s;"
                                                 :style="p.image === v.url ? 'border-color: var(--accent); transform: scale(1.08); box-shadow: 0 0 4px var(--accent);' : 'opacity: 0.6;'"
                                                 @click="selectGuidelineVariant('persona', idx, v)"
                                                 :title="v.name || 'Variant #' + (vIdx + 1) + ' (Seed: ' + v.seed + ')'">
                                                <img :src="resolveImageUrl(v.url)" style="width: 100%; height: 100%; object-fit: cover;" />
                                                <span v-if="p.image === v.url" style="position: absolute; bottom: 0; right: 0; background: rgba(0,0,0,0.6); font-size: 0.55rem; padding: 1px;">⭐</span>
                                                <span @click.stop="deleteGuidelineVariant('persona', idx, vIdx)" 
                                                      style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; background: rgba(0,0,0,0.7); color: #f87171; font-size: 0.55rem; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer;"
                                                      title="Delete variant">×</span>
                                            </div>
                                            <!-- New variant placeholder button -->
                                            <div @click="generateGuidelineVariant('persona', idx)"
                                                 :class="{ 'skeleton-loader': generatingVisuals.personas[idx] }"
                                                 :style="generatingVisuals.personas[idx] ? 'pointer-events: none;' : ''"
                                                 style="width: 32px; height: 32px; border-radius: 4px; border: 1px dashed var(--accent); background: rgba(197, 160, 89, 0.05); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: var(--accent); font-size: 0.74rem; font-weight: bold; transition: all 0.2s;"
                                                 title="Generate new variant with a new random seed"
                                                 onmouseover="this.style.background='rgba(197, 160, 89, 0.15)'"
                                                 onmouseout="this.style.background='rgba(197, 160, 89, 0.05)'">
                                                <span v-if="generatingVisuals.personas[idx]" class="spinner" style="width: 12px; height: 12px; border-width: 2px;"></span>
                                                <span v-else>➕⭐</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px; align-self: flex-start;">
                                <button type="button" @click="openEditPersonaForm(idx)" style="background: none; border: none; cursor: pointer; color: var(--accent); font-size: 0.9rem; padding: 4px;" title="Edit Persona">
                                    ✏️
                                </button>
                                <button type="button" @click="deletePersona(idx)" style="background: none; border: none; cursor: pointer; color: #f87171; font-size: 0.9rem; padding: 4px;" title="Delete Persona">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
 
                <!-- Standard Sceneries Directory -->
                <div class="panel">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="color: var(--text-main); margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 1.05rem; display: flex; align-items: center; gap: 6px;">
                            🌄 Standard Sceneries & Backdrops
                        </h3>
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <button type="button" @click="openAddSceneryForm" class="btn btn-secondary" style="height: 26px; padding: 0 10px; font-size: 0.72rem; margin: 0; font-weight: 700; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                                ➕ Add Scenery
                            </button>
                            <button type="button" @click="generateGuidelineAssetAi('scenery')" class="btn" style="height: 26px; padding: 0 10px; font-size: 0.72rem; margin: 0; font-weight: 700; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #a78bfa; cursor: pointer;">
                                <span>✨ Generate with AI</span>
                            </button>
                        </div>
                    </div>
 
                    <!-- Scenery Cards List -->
                    <div style="display: flex; flex-direction: column; gap: 12px; max-height: 380px; overflow-y: auto; padding-right: 4px;">
                        <div v-for="(s, idx) in canvas.sceneries" :key="s.name" 
                             style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; gap: 12px; position: relative;">
                            <div style="display: flex; gap: 12px; align-items: flex-start; flex: 1; min-width: 0;">
                                <!-- Scenery Image Thumbnail / Placeholder -->
                                <div style="position: relative; width: 64px; height: 64px; border-radius: 8px; border: 1px solid var(--border); background: var(--workspace-bg); overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                                    <div v-if="generatingVisuals.sceneries[idx]" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.8); z-index: 10; padding: 20px;">
                                        <span class="spinner" style="margin-bottom: 12px; border-color: var(--accent); border-right-color: transparent;"></span>
                                        <div style="width: 80%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; margin-bottom: 8px;">
                                            <div :style="`height: 100%; width: ${generationEta.sceneries[idx]?.progress || 0}%; background: var(--accent); transition: width 0.1s linear;`"></div>
                                        </div>
                                        <div style="font-size: 0.65rem; color: var(--text-muted); font-family: monospace;">
                                            ETA: {{ Math.round((generationEta.sceneries[idx]?.expectedDuration || 8500) / 1000) }}s
                                        </div>
                                    </div>
                                    <img v-else-if="s.image" :src="resolveImageUrl(s.image)" style="width: 100%; height: 100%; object-fit: cover;" />
                                    <template v-else>
                                        <span style="font-size: 1.5rem; opacity: 0.4;">🌄</span>
                                        <button type="button" @click="generateGuidelineImage('scenery', idx)" 
                                                style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.65); border: none; color: white; font-size: 0.58rem; padding: 3px 0; cursor: pointer; text-align: center; font-weight: bold; border-radius: 0 0 7px 7px;" 
                                                title="Generate image for this scenery">
                                            🎨 AI Pic
                                        </button>
                                    </template>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0;">
                                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                        <strong style="color: var(--accent); font-size: 0.85rem;">{{ s.name }}</strong>
                                    </div>
                                    <p style="font-size: 0.74rem; color: var(--text-main); margin: 0; line-height: 1.4; word-break: break-word;">{{ s.description }}</p>
                                    <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px; border-left: 2px solid var(--accent); padding-left: 8px;">
                                        <span style="font-size: 0.68rem; color: var(--text-muted);"><strong style="color:var(--text-main)">Lighting:</strong> {{ s.lighting }}</span>
                                        <span style="font-size: 0.68rem; color: var(--text-muted);"><strong style="color:var(--text-main)">Lens Style:</strong> {{ s.photography_style }}</span>
                                        <span v-if="s.seed" style="font-size: 0.68rem; color: var(--text-muted);"><strong style="color:var(--text-main)">Seed:</strong> {{ s.seed }}</span>
                                    </div>
                                    <div v-if="s.image || (s.variants && s.variants.length > 0)" style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
                                        <span style="font-size: 0.62rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; display: block;">Visual Variants:</span>
                                        <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                                            <div v-for="(v, vIdx) in (s.variants || [])" :key="v.seed" 
                                                 style="position: relative; width: 32px; height: 32px; border-radius: 4px; border: 1px solid var(--border); background: var(--workspace-bg); overflow: hidden; cursor: pointer; transition: transform 0.2s;"
                                                 :style="s.image === v.url ? 'border-color: var(--accent); transform: scale(1.08); box-shadow: 0 0 4px var(--accent);' : 'opacity: 0.6;'"
                                                 @click="selectGuidelineVariant('scenery', idx, v)"
                                                 :title="v.name || 'Variant #' + (vIdx + 1) + ' (Seed: ' + v.seed + ')'">
                                                <img :src="resolveImageUrl(v.url)" style="width: 100%; height: 100%; object-fit: cover;" />
                                                <span v-if="s.image === v.url" style="position: absolute; bottom: 0; right: 0; background: rgba(0,0,0,0.6); font-size: 0.55rem; padding: 1px;">⭐</span>
                                                <span @click.stop="deleteGuidelineVariant('scenery', idx, vIdx)" 
                                                      style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; background: rgba(0,0,0,0.7); color: #f87171; font-size: 0.55rem; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer;"
                                                      title="Delete variant">×</span>
                                            </div>
                                            <!-- New variant placeholder button -->
                                            <div @click="generateGuidelineVariant('scenery', idx)"
                                                 :class="{ 'skeleton-loader': generatingVisuals.sceneries[idx] }"
                                                 :style="generatingVisuals.sceneries[idx] ? 'pointer-events: none;' : ''"
                                                 style="width: 32px; height: 32px; border-radius: 4px; border: 1px dashed var(--accent); background: rgba(197, 160, 89, 0.05); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: var(--accent); font-size: 0.74rem; font-weight: bold; transition: all 0.2s;"
                                                 title="Generate new variant with a new random seed"
                                                 onmouseover="this.style.background='rgba(197, 160, 89, 0.15)'"
                                                 onmouseout="this.style.background='rgba(197, 160, 89, 0.05)'">
                                                <span v-if="generatingVisuals.sceneries[idx]" class="spinner" style="width: 12px; height: 12px; border-width: 2px;"></span>
                                                <span v-else>➕⭐</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px; align-self: flex-start;">
                                <button type="button" @click="openEditSceneryForm(idx)" style="background: none; border: none; cursor: pointer; color: var(--accent); font-size: 0.9rem; padding: 4px;" title="Edit Scenery">
                                    ✏️
                                </button>
                                <button type="button" @click="deleteScenery(idx)" style="background: none; border: none; cursor: pointer; color: #f87171; font-size: 0.9rem; padding: 4px;" title="Delete Scenery">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Brand Scenes & Actions Directory -->
                <div class="panel">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="color: var(--text-main); margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 1.05rem; display: flex; align-items: center; gap: 6px;">
                            🎬 Brand Scenes & Actions
                        </h3>
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <button type="button" @click="openAddSceneForm" class="btn btn-secondary" style="height: 26px; padding: 0 10px; font-size: 0.72rem; margin: 0; font-weight: 700; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                                ➕ Add Scene
                            </button>
                            <button type="button" @click="generateGuidelineAssetAi('scene')" class="btn" style="height: 26px; padding: 0 10px; font-size: 0.72rem; margin: 0; font-weight: 700; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #a78bfa; cursor: pointer;">
                                <span>✨ Generate with AI</span>
                            </button>
                        </div>
                    </div>

                    <!-- Scenes Cards List -->
                    <div style="display: flex; flex-direction: column; gap: 12px; max-height: 380px; overflow-y: auto; padding-right: 4px;">
                        <div v-if="!canvas.scenes || canvas.scenes.length === 0" style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 0.8rem; background: var(--workspace-bg); border-radius: 8px; border: 1px dashed var(--border);">
                            No custom scenes or composition rules defined yet. Add scenes or generate them using AI to describe the "doing" in your visual prompts.
                        </div>
                        <div v-else v-for="(sc, idx) in canvas.scenes" :key="sc.name" 
                             style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; gap: 12px; position: relative;">
                            <div style="display: flex; gap: 12px; align-items: flex-start; flex: 1; min-width: 0;">
                                <!-- Scene Icon / Action Indicator -->
                                <div style="position: relative; width: 64px; height: 64px; border-radius: 8px; border: 1px solid var(--border); background: var(--workspace-bg); overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                                    <span style="font-size: 1.5rem; opacity: 0.4;">🎬</span>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0;">
                                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                        <strong style="color: #f87171; font-size: 0.85rem;">{{ sc.name }}</strong>
                                    </div>
                                    <p style="margin: 0; font-size: 0.76rem; color: var(--text-main); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;" :title="sc.description">
                                        {{ sc.description }}
                                    </p>
                                    <div style="display: flex; flex-direction: column; gap: 3px; font-size: 0.68rem; margin-top: 4px; padding-top: 6px; border-top: 1px dashed var(--border);">
                                        <span style="color: var(--text-muted);"><b style="color: var(--text-main);">Composition:</b> {{ sc.composition }}</span>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px; align-self: flex-start;">
                                <button type="button" @click="openEditSceneForm(idx)" style="background: none; border: none; cursor: pointer; color: var(--accent); font-size: 0.9rem; padding: 4px;" title="Edit Scene">
                                    ✏️
                                </button>
                                <button type="button" @click="deleteScene(idx)" style="background: none; border: none; cursor: pointer; color: #f87171; font-size: 0.9rem; padding: 4px;" title="Delete Scene">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Brand Equipment & Props Directory -->
                <div class="panel">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="color: var(--text-main); margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 1.05rem; display: flex; align-items: center; gap: 6px;">
                            ⚙️ Brand Equipment & Props
                        </h3>
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <button type="button" @click="openAddObjectForm" class="btn btn-secondary" style="height: 26px; padding: 0 10px; font-size: 0.72rem; margin: 0; font-weight: 700; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                                ➕ Add Object
                            </button>
                            <button type="button" @click="generateGuidelineAssetAi('object')" class="btn" style="height: 26px; padding: 0 10px; font-size: 0.72rem; margin: 0; font-weight: 700; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #a78bfa; cursor: pointer;">
                                <span>✨ Generate with AI</span>
                            </button>
                        </div>
                    </div>

                    <!-- Objects Cards List -->
                    <div style="display: flex; flex-direction: column; gap: 12px; max-height: 380px; overflow-y: auto; padding-right: 4px;">
                        <div v-if="!canvas.objects || canvas.objects.length === 0" style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 0.8rem; background: var(--workspace-bg); border-radius: 8px; border: 1px dashed var(--border);">
                            No custom branded equipment or props defined yet. Add assets or generate them using AI.
                        </div>
                        <div v-else v-for="(obj, idx) in canvas.objects" :key="obj.name" 
                             style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; gap: 12px; position: relative;">
                            <div style="display: flex; gap: 12px; align-items: flex-start; flex: 1; min-width: 0;">
                                <!-- Object Image Thumbnail / Placeholder -->
                                <div style="position: relative; width: 64px; height: 64px; border-radius: 8px; border: 1px solid var(--border); background: var(--workspace-bg); overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                                    <div v-if="generatingVisuals.objects[idx]" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.8); z-index: 10; padding: 20px;">
                                        <span class="spinner" style="margin-bottom: 12px; border-color: var(--accent); border-right-color: transparent;"></span>
                                        <div style="width: 80%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; margin-bottom: 8px;">
                                            <div :style="`height: 100%; width: ${generationEta.objects[idx]?.progress || 0}%; background: var(--accent); transition: width 0.1s linear;`"></div>
                                        </div>
                                        <div style="font-size: 0.65rem; color: var(--text-muted); font-family: monospace;">
                                            ETA: {{ Math.round((generationEta.objects[idx]?.expectedDuration || 8500) / 1000) }}s
                                        </div>
                                    </div>
                                    <img v-else-if="obj.image" :src="resolveImageUrl(obj.image)" style="width: 100%; height: 100%; object-fit: cover;" />
                                    <template v-else>
                                        <span style="font-size: 1.5rem; opacity: 0.4;">⚙️</span>
                                        <button type="button" @click="generateGuidelineImage('object', idx)" 
                                                style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.65); border: none; color: white; font-size: 0.58rem; padding: 3px 0; cursor: pointer; text-align: center; font-weight: bold; border-radius: 0 0 7px 7px;" 
                                                title="Generate image for this object">
                                            🎨 AI Pic
                                        </button>
                                    </template>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0;">
                                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                        <strong style="color: var(--accent); font-size: 0.85rem;">{{ obj.name }}</strong>
                                    </div>
                                    <p style="font-size: 0.74rem; color: var(--text-main); margin: 0; line-height: 1.4; word-break: break-word;">{{ obj.description }}</p>
                                    <div v-if="obj.branding" style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px; border-left: 2px solid var(--accent); padding-left: 8px;">
                                        <span style="font-size: 0.68rem; color: var(--text-muted);"><strong style="color:var(--text-main)">Branding Style:</strong> {{ obj.branding }}</span>
                                        <span v-if="obj.seed" style="font-size: 0.68rem; color: var(--text-muted);"><strong style="color:var(--text-main)">Seed:</strong> {{ obj.seed }}</span>
                                    </div>
                                    <div v-if="obj.image || (obj.variants && obj.variants.length > 0)" style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
                                        <span style="font-size: 0.62rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; display: block;">Visual Variants:</span>
                                        <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                                            <div v-for="(v, vIdx) in (obj.variants || [])" :key="v.seed" 
                                                 style="position: relative; width: 32px; height: 32px; border-radius: 4px; border: 1px solid var(--border); background: var(--workspace-bg); overflow: hidden; cursor: pointer; transition: transform 0.2s;"
                                                 :style="obj.image === v.url ? 'border-color: var(--accent); transform: scale(1.08); box-shadow: 0 0 4px var(--accent);' : 'opacity: 0.6;'"
                                                 @click="selectGuidelineVariant('object', idx, v)"
                                                 :title="v.name || 'Variant #' + (vIdx + 1) + ' (Seed: ' + v.seed + ')'">
                                                <img :src="resolveImageUrl(v.url)" style="width: 100%; height: 100%; object-fit: cover;" />
                                                <span v-if="obj.image === v.url" style="position: absolute; bottom: 0; right: 0; background: rgba(0,0,0,0.6); font-size: 0.55rem; padding: 1px;">⭐</span>
                                                <span @click.stop="deleteGuidelineVariant('object', idx, vIdx)" 
                                                      style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; background: rgba(0,0,0,0.7); color: #f87171; font-size: 0.55rem; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer;"
                                                      title="Delete variant">×</span>
                                            </div>
                                            <!-- New variant placeholder button -->
                                            <div @click="generateGuidelineVariant('object', idx)"
                                                 :class="{ 'skeleton-loader': generatingVisuals.objects[idx] }"
                                                 :style="generatingVisuals.objects[idx] ? 'pointer-events: none;' : ''"
                                                 style="width: 32px; height: 32px; border-radius: 4px; border: 1px dashed var(--accent); background: rgba(197, 160, 89, 0.05); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: var(--accent); font-size: 0.74rem; font-weight: bold; transition: all 0.2s;"
                                                 title="Generate new variant with a new random seed"
                                                 onmouseover="this.style.background='rgba(197, 160, 89, 0.15)'"
                                                 onmouseout="this.style.background='rgba(197, 160, 89, 0.05)'">
                                                <span v-if="generatingVisuals.objects[idx]" class="spinner" style="width: 12px; height: 12px; border-width: 2px;"></span>
                                                <span v-else>➕⭐</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px; align-self: flex-start;">
                                <button type="button" @click="openEditObjectForm(idx)" style="background: none; border: none; cursor: pointer; color: var(--accent); font-size: 0.9rem; padding: 4px;" title="Edit Object">
                                    ✏️
                                </button>
                                <button type="button" @click="deleteObject(idx)" style="background: none; border: none; cursor: pointer; color: #f87171; font-size: 0.9rem; padding: 4px;" title="Delete Object">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Target Audiences Directory -->
                <div class="panel">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="color: var(--text-main); margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 1.05rem; display: flex; align-items: center; gap: 6px;">
                            🎯 Target Audiences (Segments)
                        </h3>
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <button type="button" @click="openAddAudienceForm" class="btn btn-secondary" style="height: 26px; padding: 0 10px; font-size: 0.72rem; margin: 0; font-weight: 700; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                                ➕ Add Audience
                            </button>
                            <button type="button" @click="generateGuidelineAssetAi('audience')" class="btn" style="height: 26px; padding: 0 10px; font-size: 0.72rem; margin: 0; font-weight: 700; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #a78bfa; cursor: pointer;">
                                <span>✨ Generate with AI</span>
                            </button>
                        </div>
                    </div>
 
                    <!-- Audiences Cards List -->
                    <div style="display: flex; flex-direction: column; gap: 12px; max-height: 380px; overflow-y: auto; padding-right: 4px;">
                        <div v-for="(a, idx) in audiences" :key="a.id || a.name" 
                             style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; gap: 12px; position: relative;">
                            <div style="display: flex; gap: 12px; align-items: flex-start; flex: 1; min-width: 0;">
                                <!-- Audience Icon/Placeholder -->
                                <div style="position: relative; width: 64px; height: 64px; border-radius: 8px; border: 1px solid var(--border); background: var(--workspace-bg); overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                                    <span style="font-size: 1.5rem; opacity: 0.4;">🎯</span>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0;">
                                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                        <strong style="color: var(--accent); font-size: 0.85rem;">{{ a.name }}</strong>
                                    </div>
                                    <p style="font-size: 0.74rem; color: var(--text-main); margin: 0; line-height: 1.4; word-break: break-word;">{{ a.description }}</p>
                                    <div v-if="a.rules && Object.keys(a.rules).length > 0" style="margin-top: 4px;">
                                        <span style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 2px;">Behavioral Rules:</span>
                                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                            <span v-for="(val, key) in a.rules" :key="key" style="font-size: 0.65rem; color: var(--text-muted); background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px;">
                                                <strong>{{ key }}:</strong> {{ val }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px; align-self: flex-start;">
                                <button type="button" @click="openEditAudienceForm(idx)" style="background: none; border: none; cursor: pointer; color: var(--accent); font-size: 0.9rem; padding: 4px;" title="Edit Audience">
                                    ✏️
                                </button>
                                <button type="button" @click="deleteAudience(a.id)" style="background: none; border: none; cursor: pointer; color: #f87171; font-size: 0.9rem; padding: 4px;" title="Delete Audience">
                                    🗑️
                                </button>
                            </div>
                        </div>
                        <div v-if="audiences.length === 0" style="font-size: 0.72rem; color: var(--text-muted); text-align: center; padding: 20px;">
                            No audience segments created.
                        </div>
                    </div>
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
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 4px;">Ambassador Name</label>
                            <input type="text" v-model="newPersona.name" placeholder="e.g. Sophia the Barista" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 4px;">Target Age Group</label>
                            <input type="text" v-model="newPersona.age" placeholder="e.g. 25-35" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 4px;">Gender</label>
                            <select v-model="newPersona.gender" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0; cursor: pointer;">
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                                <option value="non-binary">Non-Binary</option>
                            </select>
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

        <!-- Quick Create / AI Modal Overlay -->
        <div v-if="showQuickCreateModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 11000; padding: 20px;">
            <div style="background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 12px; width: 100%; max-width: 480px; padding: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 16px; position: relative;">
                <h4 style="margin: 0; color: var(--accent); font-weight: 700; font-size: 1.05rem;">
                    📝 Add New Brand Asset ({{ quickCreateForm.type }})
                </h4>
                
                <!-- If Persona -->
                <template v-if="quickCreateForm.type === 'persona'">
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Model / Persona Name</label>
                        <input type="text" v-model="quickCreateForm.name" placeholder="e.g. Technical Enthusiast" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Occupation / Role</label>
                        <input type="text" v-model="quickCreateForm.role" placeholder="e.g. coffee professional" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Age Range</label>
                            <input type="text" v-model="quickCreateForm.age" placeholder="e.g. 25-35" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Gender</label>
                            <select v-model="quickCreateForm.gender" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0; cursor: pointer;">
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                                <option value="non-binary">Non-Binary</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Expression</label>
                            <input type="text" v-model="quickCreateForm.expression" placeholder="e.g. focused" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                        </div>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Apparel Style</label>
                        <input type="text" v-model="quickCreateForm.apparel" placeholder="e.g. casual shirt" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Bio / Description</label>
                        <textarea v-model="quickCreateForm.description" placeholder="Additional guidelines..." style="width: 100%; min-height: 50px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; margin: 0; outline: none; resize: vertical; font-size: 0.78rem;"></textarea>
                    </div>
                </template>

                <!-- If Scenery -->
                <template v-else-if="quickCreateForm.type === 'scenery'">
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Backdrop Name</label>
                        <input type="text" v-model="quickCreateForm.name" placeholder="e.g. Minimalist Cafe" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Scene Description</label>
                        <input type="text" v-model="quickCreateForm.description" placeholder="e.g. clean marble countertops, soft background blur" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Lighting Cues</label>
                        <input type="text" v-model="quickCreateForm.lighting" placeholder="e.g. soft natural side-light" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Photography / Lens style</label>
                        <input type="text" v-model="quickCreateForm.photography_style" placeholder="e.g. 35mm lens, f/1.8" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                </template>
                
                <!-- If Scene & Action -->
                <template v-else-if="quickCreateForm.type === 'scene'">
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Scene Name</label>
                        <input type="text" v-model="quickCreateForm.name" placeholder="e.g. Crema Flow" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Action / Doing Description</label>
                        <input type="text" v-model="quickCreateForm.description" placeholder="e.g. pouring thick, rich espresso crema into a ceramic cup" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Composition / Focus Cues</label>
                        <input type="text" v-model="quickCreateForm.composition" placeholder="e.g. Extreme close-up macro, shallow depth of field" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                </template>

                <!-- If Object / Equipment -->
                <template v-else-if="quickCreateForm.type === 'object'">
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Object / Equipment Name</label>
                        <input type="text" v-model="quickCreateForm.name" placeholder="e.g. Matte-Black Espresso Machine" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Visual Properties / Materials</label>
                        <input type="text" v-model="quickCreateForm.description" placeholder="e.g. double-boiler commercial espresso machine, wood paddles, brass dials" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Branding Style</label>
                        <input type="text" v-model="quickCreateForm.branding" placeholder="e.g. debossed minimalist brand logo on the side panel" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                </template>

                <!-- If Product / Service -->
                <template v-else-if="quickCreateForm.type === 'product' || quickCreateForm.type === 'service'">
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Asset Title</label>
                        <input type="text" v-model="quickCreateForm.title" placeholder="e.g. Espresso Machine cleaning" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Type</label>
                        <select v-model="quickCreateForm.type" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                            <option value="product">Product (Inventory item)</option>
                            <option value="service">Service (Workshop/Brewing service)</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Description</label>
                        <textarea v-model="quickCreateForm.description" placeholder="Visual description or copy write text..." style="width: 100%; min-height: 60px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; margin: 0; outline: none; resize: vertical; font-size: 0.78rem;"></textarea>
                    </div>
                </template>

                <!-- If Audience -->
                <template v-else-if="quickCreateForm.type === 'audience'">
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Audience Name</label>
                        <input type="text" v-model="quickCreateForm.name" placeholder="e.g. Espresso Aficionados" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Description</label>
                        <input type="text" v-model="quickCreateForm.description" placeholder="e.g. high-intent espresso machine owners" style="width: 100%; height: 34px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 0 10px; margin: 0;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.76rem; font-weight: bold; margin-bottom: 4px; display: block;">Rules Segment JSON</label>
                        <textarea v-model="quickCreateForm.rules" placeholder='e.g. { "interest": "coffee", "age_min": 25 }' style="width: 100%; min-height: 80px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; margin: 0; outline: none; font-family: monospace; font-size: 0.74rem;"></textarea>
                    </div>
                </template>

                <!-- Footer -->
                <div style="display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid var(--border); padding-top: 14px; margin-top: 6px;">
                    <button type="button" class="btn" style="margin: 0; height: 34px; font-size: 0.8rem;" @click="showQuickCreateModal = false">Cancel</button>
                    <button type="button" class="btn btn-accent" style="margin: 0; height: 34px; font-size: 0.8rem; font-weight: bold;" @click="saveQuickCreateItem">
                        Save Asset
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
export default {
    name: 'ContentStudioView',
    inject: ['app'],
    data() {
        return {
            composerParams: {
                promptTemplate: 'Commercial advertising photography showcasing $Dusk & Haze Clump Crusher (WDT tool) in focus. Used by a @The Technical Enthusiast / Extraction Scientist. Set in a #The Logical Aesthetic.',
                promptHtml: '',
                backend: 'auto',
                format: 'image',
                seed: '',
                lockSeed: false,
                cameraLens: '',
                lightingStyle: '',
                composition: '',
                aspectRatio: '1:1',
                safetyTolerance: 'moderate',
                previewLanguage: 'en',
                optimizePrompt: true,
                bestOfTwo: true
            },
            presetAnchors: [
                { name: 'Warm Sunlit Wood', seed: 489218 },
                { name: 'Sleek Chrome Lab', seed: 902842 },
                { name: 'Moody Sunset Cafe', seed: 153094 }
            ],
            newAnchorPresetName: '',
            detectedBannedWords: [],
            autocomplete: {
                active: false,
                type: '',
                query: '',
                activeSymbol: '',
                x: 0,
                y: 0,
                selectedIndex: 0
            },
            replacingTagElement: null,
            savedRange: null,
            composerTab: 'products',
            searchProductQuery: '',
            searchServiceQuery: '',
            composerGenerating: false,
            composerResultUrl: '',
            composerResultItem: null,
            savingComposerAsset: false,
            draftsHistory: [],
            harvesterUrl: '',
            harvestingDna: false,
            complianceAudit: null,
            
            canvas: {
                brand_voice: '',
                archetype: 'creator',
                personas: [],
                sceneries: [],
                scenes: [],
                objects: [],
                savedSeeds: []
            },
            generatingVisuals: {
                personas: {},
                sceneries: {},
                objects: {}
            },
            generationEta: {
                personas: {},
                sceneries: {},
                objects: {}
            },
            composerEta: {
                start: 0,
                expectedDuration: 11000,
                progress: 0
            },
            loadingCanvas: false,
            savingCanvas: false,
            quickInsertSearch: '',
            activeQuickTab: 'inventory',
            audiences: [],
            quickAiGenerating: false,
            showQuickCreateModal: false,
            quickCreateEditingIndex: null,
            quickCreateEditingId: null,
            editingSection: null,
            tempSectionData: null,
            newApprovedInput: '',
            newBannedInput: '',
            positioningNicheInput: '',
            newPersona: {
                name: '',
                description: '',
                role: '',
                age: '25-35',
                gender: 'female',
                apparel: 'casual',
                expression: 'focused'
            },
            newScenery: {
                name: '',
                description: '',
                lighting: 'soft natural side-light',
                photography_style: '35mm film style, warm color palette, soft bokeh, f/1.8 aperture'
            },
            newObject: {
                name: '',
                description: '',
                branding: 'minimalist debossed brand logo'
            },
            quickCreateForm: {
                type: 'persona',
                name: '',
                title: '',
                description: '',
                role: '',
                age: '25-35',
                gender: 'female',
                apparel: 'casual',
                expression: 'focused',
                lighting: '',
                photography_style: '',
                branding: '',
                composition: '',
                rules: '{}'
            }
        };
    },
    watch: {
        'app.activeShopFilter': {
            immediate: true,
            handler(newVal) {
                if (newVal && newVal !== 'all') {
                    this.loadBrandCanvas();
                    this.loadDraftsHistory();
                }
            }
        }
    },
    mounted() {
        window.triggerPromptUpdate = () => {
            this.syncEditorText();
        };
        this.parseUrlQueryParams();
    },
    beforeUnmount() {
        if (window.triggerPromptUpdate) {
            delete window.triggerPromptUpdate;
        }
    },
    computed: {
        isValidBrandSelected() {
            return this.app.activeShopFilter !== 'all' && this.app.brands.some(b => b.id === this.app.activeShopFilter);
        },
        settingsBrand() {
            return this.app.settingsBrand || {};
        },
        settingsBrandLanguages() {
            const langs = this.settingsBrand.languages;
            if (!langs) return [];
            if (Array.isArray(langs)) return langs;
            if (typeof langs === 'string') {
                return langs.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
            }
            return [];
        },
        activeBrand() {
            return this.app.brands.find(b => b.id === this.app.activeShopFilter) || {};
        },
        authHeaders() {
            return {
                'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
            };
        },
        recommendedEngine() {
            const format = this.composerParams.format || 'image';
            const template = (this.composerParams.promptTemplate || '').toLowerCase();
            if (format === 'video') {
                return { name: 'luma', reason: 'Best for motion fluid dynamics and 4s cinemagraph video loops' };
            }
            // Multi-reference composites (product + persona or scenery)
            if (template.includes('$') && (template.includes('@') || template.includes('#'))) {
                return { name: 'flux-2-max', reason: 'FLUX.2 [max] provides native multi-reference composition fusing products, personas and environments' };
            }
            if (template.includes('@')) {
                return { name: 'flux', reason: 'Flux excels at human anatomy, detailed expressions & model clothing styling accuracy' };
            }
            if (template.includes('$')) {
                return { name: 'flux-pro', reason: 'Flux 1.1 [pro] offers premium micro-textures and precise product shape reproduction' };
            }
            return { name: 'imagen', reason: 'Imagen 3 is optimized for high-speed standard coffee layouts' };
        },
        liveAssembledPrompt() {
            if (!this.composerParams.promptTemplate) return '';
            
            let compiled = this.composerParams.promptTemplate;
            
            // Helper function to compile a product
            const compileProduct = (prod, prop) => {
                const propVal = prop || 'title';
                let resolvedSource = prod;
                const previewLang = this.composerParams.previewLanguage || 'en';
                if (previewLang !== 'en' && prod.translations) {
                    try {
                        const trans = typeof prod.translations === 'string' ? JSON.parse(prod.translations) : prod.translations;
                        if (trans && trans[previewLang]) {
                            resolvedSource = { ...prod, ...trans[previewLang] };
                        }
                    } catch (e) {}
                }
                if (propVal === 'price') {
                    return `${resolvedSource.price} ${resolvedSource.currency || 'EUR'}`;
                }
                if (propVal === 'sku') {
                    return `SKU ${resolvedSource.sku || 'N/A'}`;
                }
                if (propVal === 'description') {
                    return resolvedSource.description || '';
                }
                let prodDesc = resolvedSource.title;
                if (resolvedSource.visual_dna) {
                    try {
                        const dna = typeof resolvedSource.visual_dna === 'string' ? JSON.parse(resolvedSource.visual_dna) : resolvedSource.visual_dna;
                        if (dna && dna.subject) prodDesc = dna.subject;
                    } catch (e) {}
                }
                return prodDesc;
            };

            // Helper function to compile a persona
            const compilePersona = (persona, prop) => {
                const propVal = prop || 'name';
                if (propVal === 'role') return persona.role || '';
                if (propVal === 'age') return persona.age || '';
                if (propVal === 'apparel') return persona.apparel || '';
                if (propVal === 'expression') return persona.expression || '';
                if (propVal === 'description') return persona.description || '';
                
                let pDesc = `Used by a ${persona.age || '25-35'} year old ${persona.role || 'customer'} model with ${persona.expression || 'natural relaxed'} expression, wearing ${persona.apparel || 'brand-appropriate attire'}`;
                if (persona.description) {
                    pDesc += ` (who embodies: "${persona.description}")`;
                }
                return pDesc;
            };

            // Helper function to compile a scenery
            const compileScenery = (scenery, prop) => {
                const propVal = prop || 'name';
                if (propVal === 'description') return scenery.description || '';
                if (propVal === 'lighting') return scenery.lighting || '';
                if (propVal === 'photography_style') return scenery.photography_style || '';
                
                let sDesc = `set in a ${scenery.description || 'modern minimalist setting'}`;
                if (scenery.lighting) sDesc += `, lit with ${scenery.lighting}`;
                if (scenery.photography_style) sDesc += `, shot in ${scenery.photography_style}`;
                return sDesc;
            };

            compiled = compiled.replace(/\$\[([^\]\n:]+)(?::([a-zA-Z_]+))?\]/g, (match, name, prop) => {
                const cleanName = name.trim();
                const prod = (this.app.products || []).find(p => p && (p.type === 'product' || !p.type) && p.title && p.title.toLowerCase().includes(cleanName.toLowerCase()));
                if (prod) return compileProduct(prod, prop);
                return cleanName;
            });

            compiled = compiled.replace(/%\[([^\]\n:]+)(?::([a-zA-Z_]+))?\]/g, (match, name, prop) => {
                const cleanName = name.trim();
                const service = (this.app.products || []).find(p => p && p.type === 'service' && p.title && p.title.toLowerCase().includes(cleanName.toLowerCase()));
                if (service) return compileProduct(service, prop);
                return cleanName;
            });

            compiled = compiled.replace(/@\[([^\]\n:]+)(?::([a-zA-Z_]+))?\]/g, (match, name, prop) => {
                const cleanName = name.trim();
                const persona = this.canvas.personas ? this.canvas.personas.find(p => p && p.name && p.name.toLowerCase().includes(cleanName.toLowerCase())) : null;
                if (persona) return compilePersona(persona, prop);
                return cleanName;
            });

            compiled = compiled.replace(/#\[([^\]\n:]+)(?::([a-zA-Z_]+))?\]/g, (match, name, prop) => {
                const cleanName = name.trim();
                const scenery = this.canvas.sceneries ? this.canvas.sceneries.find(s => s && s.name && s.name.toLowerCase().includes(cleanName.toLowerCase())) : null;
                if (scenery) return compileScenery(scenery, prop);
                return cleanName;
            });

            // 2. Process legacy non-bracketed tokens by exact db-name replacement (longest names first)
            if (this.app.products && this.app.products.length > 0) {
                const sortedProds = this.app.products.filter(p => p && (p.type === 'product' || !p.type) && p.title).sort((a, b) => (b.title || '').length - (a.title || '').length);
                sortedProds.forEach(prod => {
                    const titleEscaped = this.escapeRegExp(prod.title);
                    const regex = new RegExp(`\\$${titleEscaped}(?::([a-zA-Z_]+))?`, 'gi');
                    compiled = compiled.replace(regex, (match, prop) => {
                        return compileProduct(prod, prop);
                    });
                });

                const sortedServices = this.app.products.filter(p => p && p.type === 'service' && p.title).sort((a, b) => (b.title || '').length - (a.title || '').length);
                sortedServices.forEach(service => {
                    const titleEscaped = this.escapeRegExp(service.title);
                    const regex = new RegExp(`%${titleEscaped}(?::([a-zA-Z_]+))?`, 'gi');
                    compiled = compiled.replace(regex, (match, prop) => {
                        return compileProduct(service, prop);
                    });
                });
            }

            if (this.canvas.personas && this.canvas.personas.length > 0) {
                const sortedPersonas = [...this.canvas.personas].filter(p => p && p.name).sort((a, b) => (b.name || '').length - (a.name || '').length);
                sortedPersonas.forEach(persona => {
                    const nameEscaped = this.escapeRegExp(persona.name);
                    const regex = new RegExp(`@${nameEscaped}(?::([a-zA-Z_]+))?`, 'gi');
                    compiled = compiled.replace(regex, (match, prop) => {
                        return compilePersona(persona, prop);
                    });
                });
            }

            if (this.canvas.sceneries && this.canvas.sceneries.length > 0) {
                const sortedSceneries = [...this.canvas.sceneries].filter(s => s && s.name).sort((a, b) => (b.name || '').length - (a.name || '').length);
                sortedSceneries.forEach(scenery => {
                    const nameEscaped = this.escapeRegExp(scenery.name);
                    const regex = new RegExp(`#${nameEscaped}(?::([a-zA-Z_]+))?`, 'gi');
                    compiled = compiled.replace(regex, (match, prop) => {
                        return compileScenery(scenery, prop);
                    });
                });
            }

            compiled = compiled.replace(/\$([a-zA-Z0-9_-]+)(?::([a-zA-Z_]+))?/g, (match, name, prop) => {
                const cleanName = name.trim();
                const prod = (this.app.products || []).find(p => p && (p.type === 'product' || !p.type) && p.title && p.title.toLowerCase().includes(cleanName.toLowerCase()));
                if (prod) return compileProduct(prod, prop);
                return cleanName;
            });

            compiled = compiled.replace(/%([a-zA-Z0-9_-]+)(?::([a-zA-Z_]+))?/g, (match, name, prop) => {
                const cleanName = name.trim();
                const service = (this.app.products || []).find(p => p && p.type === 'service' && p.title && p.title.toLowerCase().includes(cleanName.toLowerCase()));
                if (service) return compileProduct(service, prop);
                return cleanName;
            });

            compiled = compiled.replace(/@([a-zA-Z0-9_-]+)(?::([a-zA-Z_]+))?/g, (match, name, prop) => {
                const cleanName = name.trim();
                const persona = this.canvas.personas ? this.canvas.personas.find(p => p && p.name && p.name.toLowerCase().includes(cleanName.toLowerCase())) : null;
                if (persona) return compilePersona(persona, prop);
                return cleanName;
            });

            compiled = compiled.replace(/#([a-zA-Z0-9_-]+)(?::([a-zA-Z_]+))?/g, (match, name, prop) => {
                const cleanName = name.trim();
                const scenery = this.canvas.sceneries ? this.canvas.sceneries.find(s => s && s.name && s.name.toLowerCase().includes(cleanName.toLowerCase())) : null;
                if (scenery) return compileScenery(scenery, prop);
                return cleanName;
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
        activeSceneries() {
            if (!this.composerParams.promptTemplate || !this.canvas.sceneries) return [];
            
            const sceneryRegex = /#([^$@#\n\.,\[\]]+)/g;
            const matches = [];
            let match;
            sceneryRegex.lastIndex = 0;
            while ((match = sceneryRegex.exec(this.composerParams.promptTemplate)) !== null) {
                const cleanName = match[1].trim().toLowerCase();
                if (!cleanName) continue;
                const found = this.canvas.sceneries.find(s => s && s.name && s.name.toLowerCase().includes(cleanName));
                if (found && !matches.some(m => m && found && m.name === found.name)) {
                    matches.push(found);
                }
            }
            return matches;
        },
        filteredAutocompleteItems() {
            const query = (this.autocomplete.query || '').toLowerCase().trim();
            const editorText = (this.composerParams.promptTemplate || '').toLowerCase();
            
            const rank = (items, type) => {
                return items.map(item => {
                    let score = 0;
                    const name = (item && (item.title || item.name) || '').toLowerCase();
                    const desc = (item && (item.description || item.role) || '').toLowerCase();
                    
                    if (query) {
                        if (name.includes(query)) {
                            score += 100 - name.indexOf(query);
                        } else if (desc.includes(query)) {
                            score += 50;
                        } else {
                            return { item, score: -1 };
                        }
                    }
                    
                    if (editorText) {
                        const words = editorText.split(/\s+/).filter(w => w.length > 2);
                        words.forEach(word => {
                            if (name.includes(word)) score += 20;
                            if (desc.includes(word)) score += 10;
                        });
                    }
                    
                    return { item, score };
                })
                .filter(r => r && r.score >= 0)
                .sort((a, b) => b.score - a.score)
                .map(r => r.item);
            };

            if (this.autocomplete.type === 'product') {
                if (!this.app.products) return [];
                // Group both products and services under $
                const prods = this.app.products.filter(p => p && (p.type === 'product' || !p.type || p.type === 'service'));
                return rank(prods, 'product').slice(0, 15);
            } else if (this.autocomplete.type === 'audience') {
                const auds = (this.audiences || []).map(a => ({ ...a, _quickType: 'audience' }));
                return rank(auds, 'audience').slice(0, 10);
            } else if (this.autocomplete.type === 'persona') {
                const pers = (this.canvas.personas || []).map(p => ({ ...p, _quickType: 'persona' }));
                return rank(pers, 'persona').slice(0, 10);
            } else if (this.autocomplete.type === 'scenery') {
                if (!this.canvas.sceneries) return [];
                const scen = this.canvas.sceneries.filter(s => s);
                return rank(scen, 'scenery').slice(0, 10);
            } else if (this.autocomplete.type === 'scene') {
                if (!this.canvas.scenes) return [];
                const scs = this.canvas.scenes.filter(s => s).map(s => ({ ...s, _quickType: 'scene' }));
                return rank(scs, 'scene').slice(0, 10);
            } else if (this.autocomplete.type === 'object') {
                if (!this.canvas.objects) return [];
                const objs = this.canvas.objects.filter(o => o).map(o => ({ ...o, _quickType: 'object' }));
                return rank(objs, 'object').slice(0, 10);
            }
            return [];
        },
        filteredProducts() {
            if (!this.app.products) return [];
            const query = (this.searchProductQuery || '').toLowerCase().trim();
            const prods = this.app.products.filter(p => p && (p.type === 'product' || !p.type));
            if (!query) return prods;
            return prods.filter(p => 
                (p.title && p.title.toLowerCase().includes(query)) ||
                (p.sku && p.sku.toLowerCase().includes(query))
            );
        },
        filteredServices() {
            if (!this.app.products) return [];
            const query = (this.searchServiceQuery || '').toLowerCase().trim();
            const svcs = this.app.products.filter(p => p && p.type === 'service');
            if (!query) return svcs;
            return svcs.filter(s => 
                (s.title && s.title.toLowerCase().includes(query)) ||
                (s.sku && s.sku.toLowerCase().includes(query))
            );
        },
        filteredQuickInsertItems() {
            let list = [];
            if (this.activeQuickTab === 'inventory') {
                if (this.app.products) {
                    list = this.app.products.map(p => ({
                        ...p,
                        _quickType: p.type === 'service' ? 'service' : 'product'
                    }));
                }
            } else if (this.activeQuickTab === 'personas') {
                if (this.canvas && this.canvas.personas) {
                    list = this.canvas.personas.map(p => ({
                        ...p,
                        _quickType: 'persona'
                    }));
                }
            } else if (this.activeQuickTab === 'sceneries') {
                if (this.canvas && this.canvas.sceneries) {
                    list = this.canvas.sceneries.map(s => ({
                        ...s,
                        _quickType: 'scenery'
                    }));
                }
            } else if (this.activeQuickTab === 'audiences') {
                if (this.audiences) {
                    list = this.audiences.map(a => ({
                        ...a,
                        _quickType: 'audience'
                    }));
                }
            }
            
            // Apply search filter if query is present
            const query = (this.quickInsertSearch || '').trim().toLowerCase();
            if (!query) return list;
            return list.filter(item => {
                const name = (item.title || item.name || '').toLowerCase();
                const desc = (item.description || item.role || item.sku || '').toLowerCase();
                return name.includes(query) || desc.includes(query);
            });
        }

    },
    methods: {
        parseUrlQueryParams() {
            try {
                const params = new URLSearchParams(window.location.search);
                const aspect = params.get('aspectRatio');
                if (aspect) {
                    this.composerParams.aspectRatio = aspect;
                }
                const format = params.get('format');
                if (format && (format === 'image' || format === 'video')) {
                    this.composerParams.format = format;
                }
                const safety = params.get('safetyTolerance');
                if (safety) {
                    this.composerParams.safetyTolerance = safety;
                }
                const backend = params.get('backend');
                if (backend) {
                    this.composerParams.backend = backend;
                }
                const template = params.get('promptTemplate');
                if (template) {
                    this.composerParams.promptTemplate = decodeURIComponent(template);
                }
            } catch (e) {
                console.error('Failed to parse URL query parameters:', e);
            }
        },
        resolveImageUrl(url) {
            if (!url) return '';
            const clean = this.app.getCleanImageUrl(url);
            if (clean.startsWith('/uploads/')) {
                return this.app.apiBaseUrl + clean;
            }
            return clean;
        },
        optimizeImageUrl(url, w, h) {
            if (!url) return '';
            const cleanUrl = this.resolveImageUrl(url);
            if (cleanUrl.includes('/uploads/')) {
                const separator = cleanUrl.includes('?') ? '&' : '?';
                const params = [];
                if (w) params.push(`w=${w}`);
                if (h) params.push(`h=${h}`);
                return `${cleanUrl}${separator}${params.join('&')}`;
            }
            return cleanUrl;
        },
        getProductImageUrl(p) {
            return p.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=120';
        },
        handleEditorInput(e) {
            this.syncEditorText();
            this.updateAutocompleteState();
        },
        handleEditorKeydown(e) {
            if (this.autocomplete.active) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (this.filteredAutocompleteItems.length > 0) {
                        this.autocomplete.selectedIndex = (this.autocomplete.selectedIndex + 1) % this.filteredAutocompleteItems.length;
                    }
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (this.filteredAutocompleteItems.length > 0) {
                        this.autocomplete.selectedIndex = (this.autocomplete.selectedIndex - 1 + this.filteredAutocompleteItems.length) % this.filteredAutocompleteItems.length;
                    }
                } else if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    const item = this.filteredAutocompleteItems[this.autocomplete.selectedIndex];
                    if (item) {
                        this.insertAutocompleteTag(item);
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.closeAutocomplete();
                }
            }
        },
        handleEditorKeyup(e) {
            if (['ArrowLeft', 'ArrowRight', 'Backspace', 'Delete'].includes(e.key)) {
                this.updateAutocompleteState();
            }
        },
        handleEditorClick(e) {
            if (e.target.closest('.tag-remove-btn')) {
                e.stopPropagation();
                this.closeAutocomplete();
                return;
            }
            const tagEl = e.target.closest('.prompt-rich-tag');
            if (tagEl) {
                e.preventDefault();
                e.stopPropagation();
                
                this.replacingTagElement = tagEl;
                this.autocomplete.active = true;
                this.autocomplete.type = tagEl.getAttribute('data-type');
                this.autocomplete.query = '';
                                this.autocomplete.activeSymbol = this.autocomplete.type === 'persona' ? '@' : ((this.autocomplete.type === 'product' || this.autocomplete.type === 'service') ? '$' : (this.autocomplete.type === 'audience' ? '%' : (this.autocomplete.type === 'scene' ? '!' : '#')));
                this.autocomplete.selectedIndex = 0;
                
                const rect = tagEl.getBoundingClientRect();
                this.autocomplete.x = rect.left;
                this.autocomplete.y = rect.bottom;
                
                setTimeout(() => {
                    if (this.$refs.autocompleteSearch) {
                        this.$refs.autocompleteSearch.focus();
                    }
                }, 50);
                return;
            }
            
            this.replacingTagElement = null;
            this.updateAutocompleteState();
        },
        updateAutocompleteState() {
            if (this.autocomplete.active && this.replacingTagElement) {
                return;
            }
            
            const selection = window.getSelection();
            if (!selection.rangeCount) {
                this.autocomplete.active = false;
                return;
            }
            const range = selection.getRangeAt(0);
            const container = range.startContainer;
            
            if (container.nodeType !== Node.TEXT_NODE) {
                this.autocomplete.active = false;
                return;
            }
            
            const text = container.textContent || '';
            const caretPos = range.startOffset;
            
            let triggerIndex = -1;
            let activeSymbol = '';
            for (let i = caretPos - 1; i >= 0; i--) {
                const char = text[i];
                if (char === ' ') break;
                if (char === '@' || char === '$' || char === '#' || char === '%' || char === '!' || char === '^') {
                    triggerIndex = i;
                    activeSymbol = char;
                    break;
                }
            }
            
            if (triggerIndex !== -1) {
                const query = text.substring(triggerIndex + 1, caretPos);
                this.autocomplete.active = true;
                this.autocomplete.type = activeSymbol === '@' ? 'persona' : (activeSymbol === '$' ? 'product' : (activeSymbol === '%' ? 'audience' : (activeSymbol === '!' ? 'scene' : (activeSymbol === '^' ? 'object' : 'scenery'))));
                this.autocomplete.query = query;
                this.autocomplete.activeSymbol = activeSymbol;
                this.autocomplete.selectedIndex = 0;
                
                // Save selection range
                this.savedRange = range.cloneRange();
                
                const tempRange = range.cloneRange();
                tempRange.setStart(container, triggerIndex);
                tempRange.setEnd(container, caretPos);
                const rects = tempRange.getClientRects();
                if (rects.length > 0) {
                    const rect = rects[0];
                    this.autocomplete.x = rect.left;
                    this.autocomplete.y = rect.bottom;
                } else {
                    const rect = range.getBoundingClientRect();
                    this.autocomplete.x = rect.left;
                    this.autocomplete.y = rect.bottom;
                }
            } else {
                this.autocomplete.active = false;
            }
        },
        handleOutsideClick(e) {
            const editor = this.$refs.promptEditor;
            const popover = e.target.closest('[style*="position: fixed"]');
            if (this.autocomplete.active && editor && !editor.contains(e.target) && !popover) {
                this.closeAutocomplete();
            }
        },
        syncEditorText() {
            const editor = this.$refs.promptEditor;
            if (!editor) return;
            
            this.composerParams.promptHtml = editor.innerHTML;
            
            const clone = editor.cloneNode(true);
            const tags = clone.querySelectorAll('.prompt-rich-tag');
            tags.forEach(tag => {
                const type = tag.getAttribute('data-type');
                const prop = tag.getAttribute('data-property') || '';
                const suffix = prop && prop !== 'title' && prop !== 'name' ? `:${prop}` : '';
                if (type === 'product') {
                    tag.outerHTML = `$[${tag.getAttribute('data-title')}${suffix}]`;
                } else if (type === 'service') {
                    tag.outerHTML = `$[${tag.getAttribute('data-title')}${suffix}]`;
                } else if (type === 'persona') {
                    tag.outerHTML = `@[${tag.getAttribute('data-name')}${suffix}]`;
                } else if (type === 'audience') {
                    tag.outerHTML = `%[${tag.getAttribute('data-name')}${suffix}]`;
                } else if (type === 'scenery') {
                    tag.outerHTML = `#[${tag.getAttribute('data-name')}${suffix}]`;
                } else if (type === 'scene') {
                    tag.outerHTML = `![${tag.getAttribute('data-name')}${suffix}]`;
                } else if (type === 'object') {
                    tag.outerHTML = `^[${tag.getAttribute('data-name')}${suffix}]`;
                }
            });
            this.composerParams.promptTemplate = clone.innerText || '';
            this.checkBannedWords();
        },
        insertRichTag(type, item) {
            const label = item.title || item.name;
            let tagHtml = '';
            
            let existingProp = '';
            if (this.replacingTagElement) {
                existingProp = this.replacingTagElement.getAttribute('data-property') || '';
            }
            
            if (type === 'product') {
                const imgUrl = this.getProductImageUrl(item);
                const propVal = existingProp || 'title';
                const propLabel = propVal !== 'title' ? ` [${propVal}]` : '';
                tagHtml = `<span contenteditable="false" class="prompt-rich-tag tag-product" data-type="product" data-id="${item.id}" data-title="${item.title}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ade80; user-select: all;">
                    <img src="${imgUrl}" style="width: 16px; height: 16px; object-fit: cover; border-radius: 2px; display: inline-block; vertical-align: middle; margin-right: 2px;">
                    <span>${label}${propLabel}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;`;
            } else if (type === 'service') {
                const propVal = existingProp || 'title';
                const propLabel = propVal !== 'title' ? ` [${propVal}]` : '';
                tagHtml = `<span contenteditable="false" class="prompt-rich-tag tag-service" data-type="service" data-title="${item.title}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b; user-select: all;">
                    <span style="font-size: 0.8rem; display: inline-block; vertical-align: middle; margin-right: 2px;">💼</span>
                    <span>${label}${propLabel}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;`;
            } else if (type === 'persona') {
                const propVal = existingProp || 'name';
                const propLabel = propVal !== 'name' ? ` [${propVal}]` : '';
                const imgHtml = item.image ? `<img src="${this.resolveImageUrl(item.image)}" style="width: 16px; height: 16px; object-fit: cover; border-radius: 2px; display: inline-block; vertical-align: middle; margin-right: 4px;">` : `<span style="font-size: 0.8rem; margin-right: 2px;">👥</span>`;
                tagHtml = `<span contenteditable="false" class="prompt-rich-tag tag-persona" data-type="persona" data-name="${item.name}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); color: #c084fc; user-select: all;">
                    ${imgHtml}
                    <span>${label}${propLabel}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;`;
            } else if (type === 'audience') {
                const propVal = existingProp || 'name';
                const propLabel = propVal !== 'name' ? ` [${propVal}]` : '';
                tagHtml = `<span contenteditable="false" class="prompt-rich-tag tag-audience" data-type="audience" data-name="${item.name}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(236, 72, 153, 0.15); border: 1px solid rgba(236, 72, 153, 0.3); color: #f472b6; user-select: all;">
                    <span style="font-size: 0.8rem; display: inline-block; vertical-align: middle; margin-right: 2px;">🎯</span>
                    <span>${label}${propLabel}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;`;
            } else if (type === 'scenery') {
                const propVal = existingProp || 'name';
                const propLabel = propVal !== 'name' ? ` [${propVal}]` : '';
                const imgHtml = item.image ? `<img src="${this.resolveImageUrl(item.image)}" style="width: 16px; height: 16px; object-fit: cover; border-radius: 2px; display: inline-block; vertical-align: middle; margin-right: 4px;">` : `<span style="font-size: 0.8rem; margin-right: 2px;">🌄</span>`;
                tagHtml = `<span contenteditable="false" class="prompt-rich-tag tag-scenery" data-type="scenery" data-name="${item.name}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; user-select: all;">
                    ${imgHtml}
                    <span>${label}${propLabel}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;`;
            } else if (type === 'scene') {
                const propVal = existingProp || 'description';
                const propLabel = propVal !== 'description' ? ` [${propVal}]` : '';
                tagHtml = `<span contenteditable="false" class="prompt-rich-tag tag-scene" data-type="scene" data-name="${item.name}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; user-select: all;">
                    <span style="font-size: 0.8rem; display: inline-block; vertical-align: middle; margin-right: 2px;">🎬</span>
                    <span>${label}${propLabel}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;`;
            } else if (type === 'object') {
                const propVal = existingProp || 'name';
                const propLabel = propVal !== 'name' ? ` [${propVal}]` : '';
                const imgHtml = item.image ? `<img src="${this.resolveImageUrl(item.image)}" style="width: 16px; height: 16px; object-fit: cover; border-radius: 2px; display: inline-block; vertical-align: middle; margin-right: 4px;">` : `<span style="font-size: 0.8rem; margin-right: 2px;">⚙️</span>`;
                tagHtml = `<span contenteditable="false" class="prompt-rich-tag tag-object" data-type="object" data-name="${item.name}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(20, 184, 166, 0.15); border: 1px solid rgba(20, 184, 166, 0.3); color: #2dd4bf; user-select: all;">
                    ${imgHtml}
                    <span>${label}${propLabel}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;`;
            }
            
            if (this.replacingTagElement) {
                const div = document.createElement('div');
                div.innerHTML = tagHtml;
                const newTagEl = div.firstChild;
                this.replacingTagElement.parentNode.replaceChild(newTagEl, this.replacingTagElement);
                this.replacingTagElement = null;
                this.syncEditorText();
                this.autocomplete.active = false;
                return;
            }
            
            const editor = this.$refs.promptEditor;
            if (!editor) return;
            editor.focus();
            
            if (this.savedRange) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(this.savedRange);
            }
            
            const tempId = `temp-tag-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            tagHtml = tagHtml.replace('<span contenteditable="false"', `<span id="${tempId}" contenteditable="false"`);

            document.execCommand('insertHTML', false, tagHtml);
            
            const newTag = document.getElementById(tempId);
            if (newTag) {
                newTag.removeAttribute('id');
                const selection = window.getSelection();
                const range = document.createRange();
                range.setStartAfter(newTag);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                this.savedRange = range.cloneRange();
            } else {
                // Fallback
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    this.savedRange = selection.getRangeAt(0).cloneRange();
                }
            }
            
            this.syncEditorText();
            this.autocomplete.active = false;
        },
        insertAutocompleteTag(item) {
            const editor = this.$refs.promptEditor;
            if (!editor) return;
            editor.focus();
            
            if (this.replacingTagElement) {
                this.insertRichTag(item._quickType || this.autocomplete.type, item);
                return;
            }
            
            // Restore selection range first to ensure we delete from correct editor state
            const selection = window.getSelection();
            if (this.savedRange) {
                selection.removeAllRanges();
                selection.addRange(this.savedRange);
            }
            
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const container = range.startContainer;
                const caretPos = range.startOffset;
                
                let triggerIndex = -1;
                const text = container.textContent || '';
                for (let i = caretPos - 1; i >= 0; i--) {
                    const char = text[i];
                    if (char === ' ') break;
                    if (char === '@' || char === '$' || char === '#' || char === '%' || char === '!' || char === '^') {
                        triggerIndex = i;
                        break;
                    }
                }
                
                if (triggerIndex !== -1) {
                    range.setStart(container, triggerIndex);
                    range.setEnd(container, caretPos);
                    range.deleteContents();
                    
                    // Update savedRange to the collapsed index post-deletion
                    this.savedRange = range.cloneRange();
                }
            }
            
            this.insertRichTag(item._quickType || this.autocomplete.type, item);
        },
        loadSharedStudioParams() {
            if (!this.app.loadedStudioParams) return;
            const params = this.app.loadedStudioParams;
            this.composerParams.promptTemplate = params.promptTemplate;
            this.composerParams.seed = params.seed;
            this.composerParams.lockSeed = params.lockSeed;
            this.composerParams.cameraLens = params.cameraLens;
            this.composerParams.lightingStyle = params.lightingStyle;
            this.composerParams.composition = params.composition;
            this.composerParams.backend = params.backend;
            this.composerParams.format = params.format;
            this.composerParams.productId = params.productId;
            this.composerParams.personaName = params.personaName;
            this.composerParams.sceneryName = params.sceneryName;
            
            this.app.loadedStudioParams = null;
            
            this.$nextTick(() => {
                this.initializeRichEditor();
            });
        },
        randomizeComposerScene() {
            const editor = this.$refs.promptEditor;
            if (!editor) return;
            
            const productsList = this.app.products || [];
            
            let personasList = (this.canvas.personas || []).filter(p => !!p.image);
            if (personasList.length === 0) {
                personasList = this.canvas.personas || [];
            }
            
            let sceneriesList = (this.canvas.sceneries || []).filter(s => !!s.image);
            if (sceneriesList.length === 0) {
                sceneriesList = this.canvas.sceneries || [];
            }
            
            const scenesList = this.canvas.scenes || [];
            
            let objectsList = (this.canvas.objects || []).filter(o => !!o.image);
            if (objectsList.length === 0) {
                objectsList = this.canvas.objects || [];
            }
            
            const randomProd = productsList.length > 0 && Math.random() > 0.3 ? productsList[Math.floor(Math.random() * productsList.length)] : null;
            const randomPersona = personasList.length > 0 && Math.random() > 0.3 ? personasList[Math.floor(Math.random() * personasList.length)] : null;
            const randomScenery = sceneriesList.length > 0 && Math.random() > 0.3 ? sceneriesList[Math.floor(Math.random() * sceneriesList.length)] : null;
            const randomScene = scenesList.length > 0 && Math.random() > 0.3 ? scenesList[Math.floor(Math.random() * scenesList.length)] : null;
            const randomObject = objectsList.length > 0 && Math.random() > 0.3 ? objectsList[Math.floor(Math.random() * objectsList.length)] : null;
            
            let builderHtml = "Commercial advertising photography ";
            if (randomProd) {
                const imgUrl = this.getProductImageUrl(randomProd);
                builderHtml += `showcasing <span contenteditable="false" class="prompt-rich-tag tag-product" data-type="product" data-id="${randomProd.id}" data-title="${randomProd.title}" data-property="title" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ade80; user-select: all;">
                    <img src="${imgUrl}" style="width: 16px; height: 16px; object-fit: cover; border-radius: 2px; display: inline-block; vertical-align: middle; margin-right: 2px;">
                    <span>$${randomProd.title}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp; in focus. `;
            } else {
                builderHtml += "showcasing premium coffee hardware details. ";
            }
            
            if (randomPersona) {
                builderHtml += `Used by a <span contenteditable="false" class="prompt-rich-tag tag-persona" data-type="persona" data-name="${randomPersona.name}" data-property="name" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); color: #c084fc; user-select: all;">
                    <span>👥 @${randomPersona.name}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp; barista. `;
            }

            if (randomScene) {
                builderHtml += `doing <span contenteditable="false" class="prompt-rich-tag tag-scene" data-type="scene" data-name="${randomScene.name}" data-property="description" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; user-select: all;">
                    <span>🎬 !${randomScene.name}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;. `;
            }
            
            if (randomScenery) {
                builderHtml += `Set in a <span contenteditable="false" class="prompt-rich-tag tag-scenery" data-type="scenery" data-name="${randomScenery.name}" data-property="name" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; user-select: all;">
                    <span>🌄 #${randomScenery.name}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;. `;
            }

            if (randomObject) {
                builderHtml += `featuring the <span contenteditable="false" class="prompt-rich-tag tag-object" data-type="object" data-name="${randomObject.name}" data-property="name" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(20, 184, 166, 0.15); border: 1px solid rgba(20, 184, 166, 0.3); color: #2dd4bf; user-select: all;">
                    <span>⚙️ ^${randomObject.name}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;.`;
            }
            
            editor.innerHTML = builderHtml;
            this.syncEditorText();
            
            const lenses = [
                "",
                "35mm lens, f/1.8 aperture (Cinematic Medium)",
                "50mm lens, f/1.2 aperture (Sharp Details Portrait)",
                "85mm lens, f/1.4 aperture (Shallow Depth Portrait)",
                "Macro lens, f/2.8 (Extreme Close-up Detail)"
            ];
            const lightings = [
                "",
                "natural soft window side-light",
                "cinematic golden hour warm sunset glow",
                "dramatic chiaroscuro lighting with deep shadows",
                "bright diffused commercial studio softbox light"
            ];
            const compositions = [
                "",
                "medium shot photography framing",
                "extreme close-up macro detail shot",
                "top-down flat lay studio layout"
            ];
            
            this.composerParams.cameraLens = lenses[Math.floor(Math.random() * lenses.length)];
            this.composerParams.lightingStyle = lightings[Math.floor(Math.random() * lightings.length)];
            this.composerParams.composition = compositions[Math.floor(Math.random() * compositions.length)];
            this.composerParams.backend = 'auto';
            this.composerParams.seed = Math.floor(Math.random() * 1000000);
            
            this.app.showNotification("🎲 Random combination compiled successfully!");
        },
        selectSeedPreset(preset) {
            this.composerParams.seed = preset.seed;
            this.composerParams.lockSeed = true;
            this.app.showNotification(`🎯 Consistency anchor set to: "${preset.name}"`);
        },
        async deleteSeedPreset(preset) {
            this.presetAnchors = this.presetAnchors.filter(p => p.seed !== preset.seed);
            if (this.canvas.savedSeeds) {
                this.canvas.savedSeeds = this.canvas.savedSeeds.filter(s => {
                    if (typeof s === 'object' && s !== null) {
                        return s.seed !== preset.seed;
                    }
                    return s !== preset.seed;
                });
                await this.saveBrandCanvas();
            }
            this.app.showNotification(`🗑️ Anchor preset "${preset.name}" removed.`);
        },
        async saveCurrentSeedAsPreset() {
            const name = this.newAnchorPresetName.trim();
            if (!name) {
                alert('Please enter a name for the anchor preset.');
                return;
            }
            if (!this.composerParams.seed) {
                this.composerParams.seed = Math.floor(Math.random() * 1000000);
            }
            const seed = parseInt(this.composerParams.seed);
            if (this.presetAnchors.some(p => p.seed === seed)) {
                alert('An anchor preset with this seed already exists.');
                return;
            }
            const image = this.composerResultUrl || '';
            this.presetAnchors.push({ name, seed, image });
            this.newAnchorPresetName = '';
            this.composerParams.lockSeed = true;

            if (!this.canvas.savedSeeds) {
                this.canvas.savedSeeds = [];
            }
            this.canvas.savedSeeds.push({ name, seed, image });
            await this.saveBrandCanvas();

            this.app.showNotification(`💾 Saved "${name}" consistency anchor!`);
        },
        changeReplacingTagProperty(propVal) {
            if (this.replacingTagElement) {
                this.replacingTagElement.setAttribute('data-property', propVal);
                
                const type = this.replacingTagElement.getAttribute('data-type');
                const label = type === 'product' ? this.replacingTagElement.getAttribute('data-title') : this.replacingTagElement.getAttribute('data-name');
                
                this.updateTagBadgeVisuals(this.replacingTagElement, label, propVal);
                this.syncEditorText();
            }
        },
        updateTagBadgeVisuals(tagEl, label, prop) {
            const propLabel = prop && prop !== 'title' && prop !== 'name' ? ` [${prop}]` : '';
            const textSpan = tagEl.querySelector('span');
            if (textSpan) {
                const prefix = tagEl.classList.contains('tag-persona') ? '👥 @' : (tagEl.classList.contains('tag-scenery') ? '🌄 #' : '$');
                textSpan.innerText = `${prefix}${label}${propLabel}`;
            }
        },
        saveSelectionRange() {
            if (this.autocomplete.active) return;
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const editor = this.$refs.promptEditor;
                if (editor && editor.contains(range.commonAncestorContainer)) {
                    this.savedRange = range.cloneRange();
                }
            }
        },
        handleEditorBlur(e) {
            this.saveSelectionRange(e);
            this.highlightBannedWordsInEditor();
        },
        handleEditorFocus(e) {
            this.clearBannedHighlights();
        },
        checkBannedWords() {
            const text = (this.composerParams.promptTemplate || '').toLowerCase();
            const bannedList = (this.canvas.controlled_vocabulary && this.canvas.controlled_vocabulary.banned) || [];
            const detected = [];
            bannedList.forEach(word => {
                if (!word) return;
                const cleanWord = word.trim().toLowerCase();
                if (!cleanWord) return;
                const regex = new RegExp(`\\b${this.escapeRegExp(cleanWord)}\\b`, 'gi');
                if (regex.test(text)) {
                    detected.push(word);
                }
            });
            this.detectedBannedWords = detected;
        },
        highlightBannedWordsInEditor() {
            const editor = this.$refs.promptEditor;
            if (!editor) return;
            
            const bannedList = (this.canvas.controlled_vocabulary && this.canvas.controlled_vocabulary.banned) || [];
            if (bannedList.length === 0) return;
            
            const walkAndHighlight = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    let text = node.nodeValue;
                    let modified = false;
                    
                    bannedList.forEach(word => {
                        if (!word) return;
                        const cleanWord = word.trim().toLowerCase();
                        if (!cleanWord) return;
                        const regex = new RegExp(`\\b(${this.escapeRegExp(cleanWord)})\\b`, 'gi');
                        if (regex.test(text)) {
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = text.replace(regex, `<span class="banned-word-highlight" style="color: #f87171; text-decoration: underline wavy #ef4444; cursor: help; font-weight: 600;" title="Banned term: $1">$1</span>`);
                            
                            const parent = node.parentNode;
                            while (tempDiv.firstChild) {
                                parent.insertBefore(tempDiv.firstChild, node);
                            }
                            parent.removeChild(node);
                            modified = true;
                        }
                    });
                    if (modified) return;
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList.contains('prompt-rich-tag') || node.classList.contains('banned-word-highlight')) {
                        return;
                    }
                    const children = Array.from(node.childNodes);
                    children.forEach(child => walkAndHighlight(child));
                }
            };
            
            this.clearBannedHighlights();
            const children = Array.from(editor.childNodes);
            children.forEach(child => walkAndHighlight(child));
        },
        clearBannedHighlights() {
            const editor = this.$refs.promptEditor;
            if (!editor) return;
            const highlights = editor.querySelectorAll('.banned-word-highlight');
            highlights.forEach(span => {
                const textNode = document.createTextNode(span.textContent);
                span.parentNode.replaceChild(textNode, span);
            });
            editor.normalize();
        },
        escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },
        selectAutocompleteFirst() {
            const items = this.filteredAutocompleteItems;
            if (items && items.length > 0) {
                this.insertAutocompleteTag(items[0]);
            }
        },
        removeReplacingTag() {
            if (this.replacingTagElement) {
                this.replacingTagElement.remove();
                this.syncEditorText();
                this.replacingTagElement = null;
                this.autocomplete.active = false;
            }
        },
        closeAutocomplete() {
            this.replacingTagElement = null;
            this.autocomplete.active = false;
            if (this.$refs.promptEditor) {
                this.$refs.promptEditor.focus();
            }
        },
        initializeRichEditor() {
            const editor = this.$refs.promptEditor;
            if (!editor) return;
            
            let text = this.composerParams.promptTemplate || '';
            let html = text;
            
            // 1. Bracketed Products
            html = html.replace(/\$\[([^\]\n:]+)(?::([a-zA-Z_]+))?\]/g, (match, name, prop) => {
                const cleanName = name.trim();
                const p = this.app.products.find(prod => (prod.type === 'product' || !prod.type) && (prod.title.toLowerCase() === cleanName.toLowerCase() || prod.title.toLowerCase().includes(cleanName.toLowerCase())));
                const propVal = prop || 'title';
                const propLabel = propVal !== 'title' ? ` [${propVal}]` : '';
                if (p) {
                    const imgUrl = this.getProductImageUrl(p);
                    return `<span contenteditable="false" class="prompt-rich-tag tag-product" data-type="product" data-id="${p.id}" data-title="${p.title}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ade80; user-select: all;">
                        <img src="${imgUrl}" style="width: 16px; height: 16px; object-fit: cover; border-radius: 2px; display: inline-block; vertical-align: middle; margin-right: 2px;">
                        <span>$${p.title}${propLabel}</span>
                        <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                    </span>&nbsp;`;
                }
                return `<span contenteditable="false" class="prompt-rich-tag tag-product" data-type="product" data-id="" data-title="${cleanName}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(34, 197, 94, 0.08); border: 1px dashed rgba(34, 197, 94, 0.25); color: #86efac; user-select: all;">
                    <span>$${cleanName}${propLabel}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;`;
            });

            // 1.2 Bracketed Services
            html = html.replace(/%\[([^\]\n:]+)(?::([a-zA-Z_]+))?\]/g, (match, name, prop) => {
                const cleanName = name.trim();
                const s = this.app.products.find(prod => prod.type === 'service' && (prod.title.toLowerCase() === cleanName.toLowerCase() || prod.title.toLowerCase().includes(cleanName.toLowerCase())));
                const propVal = prop || 'title';
                const propLabel = propVal !== 'title' ? ` [${propVal}]` : '';
                if (s) {
                    return `<span contenteditable="false" class="prompt-rich-tag tag-service" data-type="service" data-title="${s.title}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b; user-select: all;">
                        <span style="font-size: 0.8rem; display: inline-block; vertical-align: middle; margin-right: 2px;">💼</span>
                        <span>%${s.title}${propLabel}</span>
                        <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                    </span>&nbsp;`;
                }
                return `<span contenteditable="false" class="prompt-rich-tag tag-service" data-type="service" data-title="${cleanName}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(245, 158, 11, 0.08); border: 1px dashed rgba(245, 158, 11, 0.25); color: #fcc26c; user-select: all;">
                    <span style="font-size: 0.8rem; display: inline-block; vertical-align: middle; margin-right: 2px;">💼</span>
                    <span>%${cleanName}${propLabel}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;`;
            });

            // 2. Bracketed Personas
            html = html.replace(/@\[([^\]\n:]+)(?::([a-zA-Z_]+))?\]/g, (match, name, prop) => {
                const cleanName = name.trim();
                const persona = this.canvas.personas ? this.canvas.personas.find(per => per.name.toLowerCase() === cleanName.toLowerCase() || per.name.toLowerCase().includes(cleanName.toLowerCase())) : null;
                const propVal = prop || 'name';
                const propLabel = propVal !== 'name' ? ` [${propVal}]` : '';
                if (persona) {
                    return `<span contenteditable="false" class="prompt-rich-tag tag-persona" data-type="persona" data-name="${persona.name}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); color: #c084fc; user-select: all;">
                        <span>👥 @${persona.name}${propLabel}</span>
                        <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                    </span>&nbsp;`;
                }
                return `<span contenteditable="false" class="prompt-rich-tag tag-persona" data-type="persona" data-name="${cleanName}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(168, 85, 247, 0.08); border: 1px dashed rgba(168, 85, 247, 0.25); color: #d8b4fe; user-select: all;">
                    <span>👥 @${cleanName}${propLabel}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;`;
            });

            // 3. Bracketed Sceneries
            html = html.replace(/#\[([^\]\n:]+)(?::([a-zA-Z_]+))?\]/g, (match, name, prop) => {
                const cleanName = name.trim();
                const scenery = this.canvas.sceneries ? this.canvas.sceneries.find(sc => sc.name.toLowerCase() === cleanName.toLowerCase() || sc.name.toLowerCase().includes(cleanName.toLowerCase())) : null;
                const propVal = prop || 'name';
                const propLabel = propVal !== 'name' ? ` [${propVal}]` : '';
                if (scenery) {
                    return `<span contenteditable="false" class="prompt-rich-tag tag-scenery" data-type="scenery" data-name="${scenery.name}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; user-select: all;">
                        <span>🌄 #${scenery.name}${propLabel}</span>
                        <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                    </span>&nbsp;`;
                }
                return `<span contenteditable="false" class="prompt-rich-tag tag-scenery" data-type="scenery" data-name="${cleanName}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(59, 130, 246, 0.08); border: 1px dashed rgba(59, 130, 246, 0.25); color: #93c5fd; user-select: all;">
                    <span>🌄 #${cleanName}${propLabel}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;`;
            });

            // 3.5 Bracketed Objects
            html = html.replace(/\^\[([^\]\n:]+)(?::([a-zA-Z_]+))?\]/g, (match, name, prop) => {
                const cleanName = name.trim();
                const obj = this.canvas.objects ? this.canvas.objects.find(o => o.name.toLowerCase() === cleanName.toLowerCase() || o.name.toLowerCase().includes(cleanName.toLowerCase())) : null;
                const propVal = prop || 'name';
                const propLabel = propVal !== 'name' ? ` [${propVal}]` : '';
                if (obj) {
                    const imgHtml = obj.image ? `<img src="${this.resolveImageUrl(obj.image)}" style="width: 16px; height: 16px; object-fit: cover; border-radius: 2px; display: inline-block; vertical-align: middle; margin-right: 4px;">` : `<span style="font-size: 0.8rem; margin-right: 2px;">⚙️</span>`;
                    return `<span contenteditable="false" class="prompt-rich-tag tag-object" data-type="object" data-name="${obj.name}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(20, 184, 166, 0.15); border: 1px solid rgba(20, 184, 166, 0.3); color: #2dd4bf; user-select: all;">
                        ${imgHtml}
                        <span>^${obj.name}${propLabel}</span>
                        <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                    </span>&nbsp;`;
                }
                return `<span contenteditable="false" class="prompt-rich-tag tag-object" data-type="object" data-name="${cleanName}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(20, 184, 166, 0.08); border: 1px dashed rgba(20, 184, 166, 0.25); color: #99f6e4; user-select: all;">
                    <span>⚙️ ^${cleanName}${propLabel}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;`;
            });

            // 4. Legacy non-bracketed name replacements (existing list)
            if (this.app.products && this.app.products.length > 0) {
                const prods = this.app.products.filter(p => p.type === 'product' || !p.type);
                const sorted = [...prods].sort((a, b) => b.title.length - a.title.length);
                sorted.forEach(p => {
                    const titleEscaped = this.escapeRegExp(p.title);
                    const regex = new RegExp(`\\$${titleEscaped}(?::([a-zA-Z_]+))?`, 'gi');
                    html = html.replace(regex, (match, prop) => {
                        const imgUrl = this.getProductImageUrl(p);
                        const propVal = prop || 'title';
                        const propLabel = propVal !== 'title' ? ` [${propVal}]` : '';
                        return `<span contenteditable="false" class="prompt-rich-tag tag-product" data-type="product" data-id="${p.id}" data-title="${p.title}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ade80; user-select: all;">
                            <img src="${imgUrl}" style="width: 16px; height: 16px; object-fit: cover; border-radius: 2px; display: inline-block; vertical-align: middle; margin-right: 2px;">
                            <span>$${p.title}${propLabel}</span>
                            <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                        </span>&nbsp;`;
                    });
                });

                const svcs = this.app.products.filter(p => p.type === 'service');
                const sortedSvcs = [...svcs].sort((a, b) => b.title.length - a.title.length);
                sortedSvcs.forEach(s => {
                    const titleEscaped = this.escapeRegExp(s.title);
                    const regex = new RegExp(`%${titleEscaped}(?::([a-zA-Z_]+))?`, 'gi');
                    html = html.replace(regex, (match, prop) => {
                        const propVal = prop || 'title';
                        const propLabel = propVal !== 'title' ? ` [${propVal}]` : '';
                        return `<span contenteditable="false" class="prompt-rich-tag tag-service" data-type="service" data-title="${s.title}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b; user-select: all;">
                            <span style="font-size: 0.8rem; display: inline-block; vertical-align: middle; margin-right: 2px;">💼</span>
                            <span>%${s.title}${propLabel}</span>
                            <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                        </span>&nbsp;`;
                    });
                });
            }

            if (this.canvas.personas && this.canvas.personas.length > 0) {
                const sorted = [...this.canvas.personas].sort((a, b) => b.name.length - a.name.length);
                sorted.forEach(persona => {
                    const nameEscaped = this.escapeRegExp(persona.name);
                    const regex = new RegExp(`@${nameEscaped}(?::([a-zA-Z_]+))?`, 'gi');
                    html = html.replace(regex, (match, prop) => {
                        const propVal = prop || 'name';
                        const propLabel = propVal !== 'name' ? ` [${propVal}]` : '';
                        return `<span contenteditable="false" class="prompt-rich-tag tag-persona" data-type="persona" data-name="${persona.name}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); color: #c084fc; user-select: all;">
                            <span>👥 @${persona.name}${propLabel}</span>
                            <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                        </span>&nbsp;`;
                    });
                });
            }

            if (this.canvas.sceneries && this.canvas.sceneries.length > 0) {
                const sorted = [...this.canvas.sceneries].sort((a, b) => b.name.length - a.name.length);
                sorted.forEach(scenery => {
                    const nameEscaped = this.escapeRegExp(scenery.name);
                    const regex = new RegExp(`#${nameEscaped}(?::([a-zA-Z_]+))?`, 'gi');
                    html = html.replace(regex, (match, prop) => {
                        const propVal = prop || 'name';
                        const propLabel = propVal !== 'name' ? ` [${propVal}]` : '';
                        return `<span contenteditable="false" class="prompt-rich-tag tag-scenery" data-type="scenery" data-name="${scenery.name}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; user-select: all;">
                            <span>🌄 #${scenery.name}${propLabel}</span>
                            <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                        </span>&nbsp;`;
                    });
                });
            }

            if (this.canvas.objects && this.canvas.objects.length > 0) {
                const sorted = [...this.canvas.objects].sort((a, b) => b.name.length - a.name.length);
                sorted.forEach(obj => {
                    const nameEscaped = this.escapeRegExp(obj.name);
                    const regex = new RegExp(`\\^${nameEscaped}(?::([a-zA-Z_]+))?`, 'gi');
                    html = html.replace(regex, (match, prop) => {
                        const propVal = prop || 'name';
                        const propLabel = propVal !== 'name' ? ` [${propVal}]` : '';
                        const imgHtml = obj.image ? `<img src="${this.resolveImageUrl(obj.image)}" style="width: 16px; height: 16px; object-fit: cover; border-radius: 2px; display: inline-block; vertical-align: middle; margin-right: 4px;">` : `<span style="font-size: 0.8rem; margin-right: 2px;">⚙️</span>`;
                        return `<span contenteditable="false" class="prompt-rich-tag tag-object" data-type="object" data-name="${obj.name}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(20, 184, 166, 0.15); border: 1px solid rgba(20, 184, 166, 0.3); color: #2dd4bf; user-select: all;">
                            ${imgHtml}
                            <span>^${obj.name}${propLabel}</span>
                            <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                        </span>&nbsp;`;
                    });
                });
            }

            // 5. Legacy single-word fallback
            // 5. Legacy single-word fallback
            html = html.replace(/\$([a-zA-Z0-9_-]+)(?::([a-zA-Z_]+))?/g, (match, name, prop) => {
                const cleanName = name.trim();
                if (!this.app.products) return match;
                const p = this.app.products.find(prod => prod && (prod.title.toLowerCase() === cleanName.toLowerCase() || prod.title.toLowerCase().includes(cleanName.toLowerCase())));
                const propVal = prop || 'title';
                const propLabel = propVal !== 'title' ? ` [${propVal}]` : '';
                if (p) {
                    if (p.type === 'service') {
                        return `<span contenteditable="false" class="prompt-rich-tag tag-service" data-type="service" data-title="${p.title}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b; user-select: all;">
                            <span style="font-size: 0.8rem; display: inline-block; vertical-align: middle; margin-right: 2px;">💼</span>
                            <span>$${p.title}${propLabel}</span>
                            <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                        </span>&nbsp;`;
                    } else {
                        const imgUrl = this.getProductImageUrl(p);
                        return `<span contenteditable="false" class="prompt-rich-tag tag-product" data-type="product" data-id="${p.id}" data-title="${p.title}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ade80; user-select: all;">
                            <img src="${imgUrl}" style="width: 16px; height: 16px; object-fit: cover; border-radius: 2px; display: inline-block; vertical-align: middle; margin-right: 2px;">
                            <span>$${p.title}${propLabel}</span>
                            <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                        </span>&nbsp;`;
                    }
                }
                return `<span contenteditable="false" class="prompt-rich-tag tag-product" data-type="product" data-id="" data-title="${cleanName}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(34, 197, 94, 0.08); border: 1px dashed rgba(34, 197, 94, 0.25); color: #86efac; user-select: all;">
                    <span>$${cleanName}${propLabel}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;`;
            });

            html = html.replace(/%([a-zA-Z0-9_-]+)(?::([a-zA-Z_]+))?/g, (match, name, prop) => {
                const cleanName = name.trim();
                const a = (this.audiences || []).find(aud => aud && (aud.name.toLowerCase() === cleanName.toLowerCase() || aud.name.toLowerCase().includes(cleanName.toLowerCase())));
                const propVal = prop || 'name';
                const propLabel = propVal !== 'name' ? ` [${propVal}]` : '';
                if (a) {
                    return `<span contenteditable="false" class="prompt-rich-tag tag-audience" data-type="audience" data-name="${a.name}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(236, 72, 153, 0.15); border: 1px solid rgba(236, 72, 153, 0.3); color: #f472b6; user-select: all;">
                        <span style="font-size: 0.8rem; display: inline-block; vertical-align: middle; margin-right: 2px;">🎯</span>
                        <span>%${a.name}${propLabel}</span>
                        <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                    </span>&nbsp;`;
                }
                return `<span contenteditable="false" class="prompt-rich-tag tag-audience" data-type="audience" data-name="${cleanName}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(236, 72, 153, 0.08); border: 1px dashed rgba(236, 72, 153, 0.25); color: #f9a8d4; user-select: all;">
                    <span style="font-size: 0.8rem; display: inline-block; vertical-align: middle; margin-right: 2px;">🎯</span>
                    <span>%${cleanName}${propLabel}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;`;
            });

            html = html.replace(/\^([a-zA-Z0-9_-]+)(?::([a-zA-Z_]+))?/g, (match, name, prop) => {
                const cleanName = name.trim();
                const obj = (this.canvas.objects || []).find(o => o && (o.name.toLowerCase() === cleanName.toLowerCase() || o.name.toLowerCase().includes(cleanName.toLowerCase())));
                const propVal = prop || 'name';
                const propLabel = propVal !== 'name' ? ` [${propVal}]` : '';
                if (obj) {
                    const imgHtml = obj.image ? `<img src="${this.resolveImageUrl(obj.image)}" style="width: 16px; height: 16px; object-fit: cover; border-radius: 2px; display: inline-block; vertical-align: middle; margin-right: 4px;">` : `<span style="font-size: 0.8rem; margin-right: 2px;">⚙️</span>`;
                    return `<span contenteditable="false" class="prompt-rich-tag tag-object" data-type="object" data-name="${obj.name}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(20, 184, 166, 0.15); border: 1px solid rgba(20, 184, 166, 0.3); color: #2dd4bf; user-select: all;">
                        ${imgHtml}
                        <span>^${obj.name}${propLabel}</span>
                        <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                    </span>&nbsp;`;
                }
                return `<span contenteditable="false" class="prompt-rich-tag tag-object" data-type="object" data-name="${cleanName}" data-property="${propVal}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; line-height: 1; vertical-align: middle; margin: 2px 2px; background: rgba(20, 184, 166, 0.08); border: 1px dashed rgba(20, 184, 166, 0.25); color: #99f6e4; user-select: all;">
                    <span>⚙️ ^${cleanName}${propLabel}</span>
                    <button class="tag-remove-btn" onclick="this.parentNode.remove(); window.triggerPromptUpdate();" style="background: transparent; border: none; color: currentColor; opacity: 0.6; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 2px; line-height: 1; font-weight: bold; display: inline-flex; align-items: center; justify-content: center;">×</button>
                </span>&nbsp;`;
            });

            editor.innerHTML = html;
            this.syncEditorText();
        },
        async generateGuidelineAssetAi(type) {
            const token = localStorage.getItem('sc_admin_token');
            const brandId = this.app.activeShopFilter;
            if (!brandId) return;

            this.app.showNotification(`✨ Synthesizing new brand ${type} using Gemini...`);
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${brandId}/generate-guideline-asset`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'X-Brand-Id': brandId
                    },
                    body: JSON.stringify({ type })
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.item) {
                        if (type === 'persona') {
                            this.canvas.personas.push(result.item);
                            await this.saveBrandCanvas();
                        } else if (type === 'scenery') {
                            this.canvas.sceneries.push(result.item);
                            await this.saveBrandCanvas();
                        } else if (type === 'scene') {
                            this.canvas.scenes.push(result.item);
                            await this.saveBrandCanvas();
                        } else if (type === 'object') {
                            this.canvas.objects.push(result.item);
                            await this.saveBrandCanvas();
                        } else if (type === 'audience') {
                            const audId = `aud_${result.item.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
                            const payload = {
                                id: audId,
                                name: result.item.name,
                                rules: {
                                    ...result.item.rules,
                                    description: result.item.description
                                }
                            };
                            const audResponse = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${brandId}/audiences`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(payload)
                            });
                            if (!audResponse.ok) {
                                const errData = await audResponse.json();
                                throw new Error(errData.error || 'Failed to save generated audience segment');
                            }
                            await this.loadBrandCanvas();
                        }
                        this.app.showNotification(`✅ New brand ${type} generated and saved successfully!`);
                    }
                } else {
                    const err = await response.json();
                    throw new Error(err.error || 'Server error generating asset');
                }
            } catch (err) {
                console.error(err);
                alert(`AI Generation failed: ${err.message}`);
            }
        },
        async generateGuidelineImage(type, idx) {
            const token = localStorage.getItem('sc_admin_token');
            const brandId = this.app.activeShopFilter;
            if (!brandId) return;

            const category = type === 'persona' ? 'personas' : (type === 'object' ? 'objects' : 'sceneries');
            this.generatingVisuals[category][idx] = true;
            this.generatingVisuals = { ...this.generatingVisuals };
            this.app.showNotification(`🎨 Generating base visual image for ${type}...`);
            
            let progressInterval = null;
            try {
                let opName = type === 'persona' ? 'Persona Generation' : (type === 'scenery' ? 'Scenery Generation' : 'Object Generation');
                let etaMs = 8500;
                try {
                    const est = await this.app.fetchAiEstimate(opName);
                    if (est && est.estimated_duration_ms) etaMs = est.estimated_duration_ms;
                    const latency = await this.app.measureNetworkLatency();
                    etaMs += latency;
                } catch(e) {}
                
                this.generationEta[category][idx] = { start: Date.now(), expectedDuration: etaMs, progress: 0 };
                progressInterval = setInterval(() => {
                    const etaData = this.generationEta[category][idx];
                    if (!etaData) { clearInterval(progressInterval); return; }
                    const elapsed = Date.now() - etaData.start;
                    const p = Math.min((elapsed / etaData.expectedDuration) * 100, 95);
                    this.generationEta[category][idx].progress = p;
                    this.generationEta = { ...this.generationEta };
                }, 100);

                const activeSeed = Math.floor(Math.random() * 1000000);
                let payload = {
                    action: type === 'persona' ? 'generate-persona' : (type === 'object' ? 'generate-object' : 'generate-scenery'),
                    seed: activeSeed,
                    draft: true
                };

                if (type === 'persona') {
                    const p = this.canvas.personas[idx];
                    payload.personaName = p.name;
                    payload.prompt = `Candid photo of a ${p.gender || 'female'} ${p.age || '25-35'} year old ${p.role || 'barista'} with ${p.expression || 'focused'} expression, wearing ${p.apparel || 'casual attire'}. ${p.description || ''}. Background: minimalist modern kitchen bar or sleek coffee counter, holding a cup of coffee or operating coffee equipment, natural ambient lighting.`;
                } else if (type === 'object') {
                    const o = this.canvas.objects[idx];
                    payload.objectName = o.name;
                    payload.prompt = `Industrial product shot of brand asset / equipment / prop: "${o.name}". Material/details: "${o.description}". Visual branding features: "${o.branding || 'minimalist debossed brand logo'}". Clean studio background, studio soft lighting, commercial product catalog photography, shot on professional camera, crisp details, realistic textures, high dynamic range`;
                } else {
                    const s = this.canvas.sceneries[idx];
                    payload.sceneryName = s.name;
                    payload.prompt = `Empty architectural and environmental scenery backdrop: ${s.description || 'modern minimalist setting'}. Lit with ${s.lighting || 'soft light'}, shot in ${s.photography_style || 'professional photography style'}. Wide angle room shot, no people, empty environment waiting for subjects.`;
                }

                const response = await fetch(`${this.app.apiBaseUrl}/api/global/media/ai-studio`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'X-Brand-Id': brandId
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.item && result.item.url) {
                        if (type === 'persona') {
                            const p = this.canvas.personas[idx];
                            p.image = result.item.url;
                            p.seed = activeSeed;
                            if (!p.variants) p.variants = [];
                            p.variants.push({
                                name: `Variant #${p.variants.length + 1} (${p.expression || 'Standard'})`,
                                url: result.item.url,
                                seed: activeSeed
                            });
                            this.canvas.personas.splice(idx, 1, { ...p });
                        } else if (type === 'object') {
                            const o = this.canvas.objects[idx];
                            o.image = result.item.url;
                            o.seed = activeSeed;
                            if (!o.variants) o.variants = [];
                            o.variants.push({
                                name: `Variant #${o.variants.length + 1} (${o.branding || 'Standard'})`,
                                url: result.item.url,
                                seed: activeSeed
                            });
                            this.canvas.objects.splice(idx, 1, { ...o });
                        } else {
                            const s = this.canvas.sceneries[idx];
                            s.image = result.item.url;
                            s.seed = activeSeed;
                            if (!s.variants) s.variants = [];
                            s.variants.push({
                                name: `Variant #${s.variants.length + 1} (${s.lighting || 'Standard'})`,
                                url: result.item.url,
                                seed: activeSeed
                            });
                            this.canvas.sceneries.splice(idx, 1, { ...s });
                        }
                        await this.saveBrandCanvas();
                        this.app.showNotification(`✅ Base image for ${type} updated and saved successfully!`);
                    }
                } else {
                    const err = await response.json();
                    throw new Error(err.error || 'Server error generating guideline image');
                }
            } catch (err) {
                console.error(err);
                alert(`Guideline visual generation failed: ${err.message}`);
            } finally {
                const category = type === 'persona' ? 'personas' : (type === 'object' ? 'objects' : 'sceneries');
                delete this.generatingVisuals[category][idx];
                this.generatingVisuals = { ...this.generatingVisuals };
                if (progressInterval) clearInterval(progressInterval);
                delete this.generationEta[category][idx];
                this.generationEta = { ...this.generationEta };
            }
        },
        async generateGuidelineVariant(type, idx) {
            const token = localStorage.getItem('sc_admin_token');
            const brandId = this.app.activeShopFilter;
            if (!brandId) return;

            const category = type === 'persona' ? 'personas' : (type === 'object' ? 'objects' : 'sceneries');
            this.generatingVisuals[category][idx] = true;
            this.generatingVisuals = { ...this.generatingVisuals };
            this.app.showNotification(`🎨 Generating a new variation for ${type}...`);
            
            let progressInterval = null;
            try {
                let opName = type === 'persona' ? 'Persona Generation' : (type === 'scenery' ? 'Scenery Generation' : 'Object Generation');
                let etaMs = 8500;
                try {
                    const est = await this.app.fetchAiEstimate(opName);
                    if (est && est.estimated_duration_ms) etaMs = est.estimated_duration_ms;
                    const latency = await this.app.measureNetworkLatency();
                    etaMs += latency;
                } catch(e) {}
                
                this.generationEta[category][idx] = { start: Date.now(), expectedDuration: etaMs, progress: 0 };
                progressInterval = setInterval(() => {
                    const etaData = this.generationEta[category][idx];
                    if (!etaData) { clearInterval(progressInterval); return; }
                    const elapsed = Date.now() - etaData.start;
                    const p = Math.min((elapsed / etaData.expectedDuration) * 100, 95);
                    this.generationEta[category][idx].progress = p;
                    this.generationEta = { ...this.generationEta };
                }, 100);

                const activeSeed = Math.floor(Math.random() * 1000000);
                let payload = {
                    action: type === 'persona' ? 'generate-persona' : (type === 'object' ? 'generate-object' : 'generate-scenery'),
                    seed: activeSeed,
                    draft: true
                };

                if (type === 'persona') {
                    const p = this.canvas.personas[idx];
                    payload.personaName = p.name;
                    const expressions = ['smiling', 'thoughtful', 'focused', 'joyful', 'neutral', 'friendly welcoming smile'];
                    const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
                    payload.prompt = `Candid photo of a ${p.gender || 'female'} ${p.age || '25-35'} year old ${p.role || 'barista'} with ${randomExpression} expression, wearing ${p.apparel || 'casual attire'}. ${p.description || ''}. Background: minimalist modern kitchen bar or sleek coffee counter, holding a cup of coffee or operating coffee equipment, natural ambient lighting.`;
                } else if (type === 'object') {
                    const o = this.canvas.objects[idx];
                    payload.objectName = o.name;
                    const angles = ['studio three-quarters product shot view', 'hero product angle view', 'macro detail close-up shot view', 'studio flat-lay presentation view'];
                    const randomAngle = angles[Math.floor(Math.random() * angles.length)];
                    payload.prompt = `Industrial product shot of brand asset / equipment / prop: "${o.name}" from a ${randomAngle}. Material/details: "${o.description}". Visual branding features: "${o.branding || 'minimalist debossed brand logo'}". Clean studio background, studio soft lighting, commercial product catalog photography, shot on professional camera, crisp details, realistic textures, high dynamic range`;
                } else {
                    const s = this.canvas.sceneries[idx];
                    payload.sceneryName = s.name;
                    const lightings = ['warm morning sunlight', 'cinematic dark lighting', 'dramatic side-light', 'ambient soft studio glow'];
                    const randomLighting = lightings[Math.floor(Math.random() * lightings.length)];
                    payload.prompt = `Empty architectural and environmental scenery backdrop: ${s.description || 'modern minimalist setting'}. Lit with ${randomLighting}, shot in ${s.photography_style || 'professional photography style'}. Wide angle room shot, no people, empty environment waiting for subjects.`;
                }

                const response = await fetch(`${this.app.apiBaseUrl}/api/global/media/ai-studio`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'X-Brand-Id': brandId
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.item && result.item.url) {
                        if (type === 'persona') {
                            const p = this.canvas.personas[idx];
                            if (!p.variants) p.variants = [];
                            
                            // Initialize with original image as the first variant if not already tracked
                            if (p.image && !p.variants.some(v => v.url === p.image)) {
                                p.variants.unshift({
                                    name: `Variant #1 (Original)`,
                                    url: p.image,
                                    seed: p.seed || Math.floor(Math.random() * 1000000)
                                });
                            }
                            
                            p.variants.push({
                                name: `Variant #${p.variants.length + 1}`,
                                url: result.item.url,
                                seed: activeSeed
                            });
                            
                            if (!p.image) {
                                p.image = result.item.url;
                                p.seed = activeSeed;
                            }
                            this.canvas.personas.splice(idx, 1, { ...p });
                        } else if (type === 'object') {
                            const o = this.canvas.objects[idx];
                            if (!o.variants) o.variants = [];
                            
                            if (o.image && !o.variants.some(v => v.url === o.image)) {
                                o.variants.unshift({
                                    name: `Variant #1 (Original)`,
                                    url: o.image,
                                    seed: o.seed || Math.floor(Math.random() * 1000000)
                                });
                            }
                            
                            o.variants.push({
                                name: `Variant #${o.variants.length + 1}`,
                                url: result.item.url,
                                seed: activeSeed
                            });
                            
                            if (!o.image) {
                                o.image = result.item.url;
                                o.seed = activeSeed;
                            }
                            this.canvas.objects.splice(idx, 1, { ...o });
                        } else {
                            const s = this.canvas.sceneries[idx];
                            if (!s.variants) s.variants = [];
                            
                            // Initialize with original image as the first variant if not already tracked
                            if (s.image && !s.variants.some(v => v.url === s.image)) {
                                s.variants.unshift({
                                    name: `Variant #1 (Original)`,
                                    url: s.image,
                                    seed: s.seed || Math.floor(Math.random() * 1000000)
                                });
                            }
                            
                            s.variants.push({
                                name: `Variant #${s.variants.length + 1}`,
                                url: result.item.url,
                                seed: activeSeed
                            });
                            
                            if (!s.image) {
                                s.image = result.item.url;
                                s.seed = activeSeed;
                            }
                            this.canvas.sceneries.splice(idx, 1, { ...s });
                        }
                        await this.saveBrandCanvas();
                        this.app.showNotification(`✅ New variation for ${type} generated and saved!`);
                    }
                } else {
                    const err = await response.json();
                    throw new Error(err.error || 'Server error generating variant image');
                }
            } catch (err) {
                console.error(err);
                alert(`Variant generation failed: ${err.message}`);
            } finally {
                const category = type === 'persona' ? 'personas' : (type === 'object' ? 'objects' : 'sceneries');
                delete this.generatingVisuals[category][idx];
                this.generatingVisuals = { ...this.generatingVisuals };
                if (progressInterval) clearInterval(progressInterval);
                delete this.generationEta[category][idx];
                this.generationEta = { ...this.generationEta };
            }
        },
        selectGuidelineVariant(type, idx, variant) {
            if (type === 'persona') {
                const p = this.canvas.personas[idx];
                p.image = variant.url;
                p.seed = variant.seed;
                this.canvas.personas.splice(idx, 1, { ...p });
            } else if (type === 'object') {
                const o = this.canvas.objects[idx];
                o.image = variant.url;
                o.seed = variant.seed;
                this.canvas.objects.splice(idx, 1, { ...o });
            } else {
                const s = this.canvas.sceneries[idx];
                s.image = variant.url;
                s.seed = variant.seed;
                this.canvas.sceneries.splice(idx, 1, { ...s });
            }
            this.saveBrandCanvas();
            this.app.showNotification(`Activated visual variant with seed: ${variant.seed}`);
        },
        deleteGuidelineVariant(type, idx, vIdx) {
            if (type === 'persona') {
                const p = this.canvas.personas[idx];
                if (p.variants && p.variants.length > 0) {
                    const deletedUrl = p.variants[vIdx]?.url;
                    p.variants.splice(vIdx, 1);
                    if (p.variants.length === 0) {
                        p.image = '';
                        p.seed = null;
                    } else if (p.image === deletedUrl) {
                        p.image = p.variants[0]?.url || '';
                        p.seed = p.variants[0]?.seed || null;
                    }
                }
            } else if (type === 'object') {
                const o = this.canvas.objects[idx];
                if (o.variants && o.variants.length > 0) {
                    const deletedUrl = o.variants[vIdx]?.url;
                    o.variants.splice(vIdx, 1);
                    if (o.variants.length === 0) {
                        o.image = '';
                        o.seed = null;
                    } else if (o.image === deletedUrl) {
                        o.image = o.variants[0]?.url || '';
                        o.seed = o.variants[0]?.seed || null;
                    }
                }
            } else {
                const s = this.canvas.sceneries[idx];
                if (s.variants && s.variants.length > 0) {
                    const deletedUrl = s.variants[vIdx]?.url;
                    s.variants.splice(vIdx, 1);
                    if (s.variants.length === 0) {
                        s.image = '';
                        s.seed = null;
                    } else if (s.image === deletedUrl) {
                        s.image = s.variants[0]?.url || '';
                        s.seed = s.variants[0]?.seed || null;
                    }
                }
            }
            this.saveBrandCanvas();
            this.app.showNotification('Deleted visual variant.');
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
        async deleteScene(idx) {
            if (confirm(`Are you sure you want to delete scene ${this.canvas.scenes[idx].name}?`)) {
                this.canvas.scenes.splice(idx, 1);
                await this.saveBrandCanvas();
            }
        },
        async deleteObject(idx) {
            if (confirm(`Are you sure you want to delete equipment/object ${this.canvas.objects[idx].name}?`)) {
                this.canvas.objects.splice(idx, 1);
                await this.saveBrandCanvas();
            }
        },
        async generateComposerAsset() {
            this.composerGenerating = true;
            this.composerResultUrl = '';
            this.composerResultItem = null;
            
            let etaMs = 12000;
            try {
                const est = await this.app.fetchAiEstimate('Image Composition');
                if (est && est.estimated_duration_ms) etaMs = est.estimated_duration_ms;
                const latency = await this.app.measureNetworkLatency();
                etaMs += latency;
            } catch(e) {}
            this.composerEta = { start: Date.now(), expectedDuration: etaMs, progress: 0 };
            
            const progressInterval = setInterval(() => {
                if (!this.composerGenerating) { clearInterval(progressInterval); return; }
                const elapsed = Date.now() - this.composerEta.start;
                this.composerEta.progress = Math.min((elapsed / this.composerEta.expectedDuration) * 100, 95);
            }, 100);

            // Handle seed logic: if lockSeed is false, generate a new random seed
            if (!this.composerParams.lockSeed || !this.composerParams.seed) {
                this.composerParams.seed = Math.floor(Math.random() * 1000000);
            }

            // Extract reference image URLs as arrays
            let productImageUrls = [];
            let personaImageUrls = [];
            let sceneryImageUrls = [];

            if (this.composerParams.productId) {
                const prod = (this.app.products || []).find(p => p && p.id === this.composerParams.productId);
                if (prod && prod.image) productImageUrls.push(prod.image);
            }
            if (this.composerParams.personaName) {
                const pers = (this.canvas.personas || []).find(p => p && p.name === this.composerParams.personaName);
                if (pers && pers.image) personaImageUrls.push(pers.image);
            }
            if (this.composerParams.sceneryName) {
                const scen = (this.canvas.sceneries || []).find(s => s && s.name === this.composerParams.sceneryName);
                if (scen && scen.image) sceneryImageUrls.push(scen.image);
            }

            // Fallback tags matching in prompt template (case-insensitive)
            const templateText = (this.composerParams.promptTemplate || '').toLowerCase();
            const prodMatches = (this.app.products || []).filter(p => p && p.title && templateText.includes(p.title.toLowerCase()) && p.image);
            prodMatches.forEach(p => { if (!productImageUrls.includes(p.image)) productImageUrls.push(p.image) });

            const persMatches = (this.canvas.personas || []).filter(p => p && p.name && templateText.includes(p.name.toLowerCase()) && p.image);
            persMatches.forEach(p => { if (!personaImageUrls.includes(p.image)) personaImageUrls.push(p.image) });

            const scenMatches = (this.canvas.sceneries || []).filter(s => s && s.name && templateText.includes(s.name.toLowerCase()) && s.image);
            scenMatches.forEach(s => { if (!sceneryImageUrls.includes(s.image)) sceneryImageUrls.push(s.image) });

            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/media/ai-studio`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'X-Brand-Id': this.app.activeShopFilter || ''
                    },
                    body: JSON.stringify({
                        action: this.composerParams.format === 'video' ? 'video' : 'generate',
                        prompt: this.liveAssembledPrompt,
                        productId: this.composerParams.productId,
                        personaName: this.composerParams.personaName,
                        sceneryName: this.composerParams.sceneryName,
                        actionDescription: this.composerParams.actionDescription,
                        backend: this.composerParams.backend === 'auto' ? this.recommendedEngine.name : this.composerParams.backend,
                        seed: this.composerParams.seed,
                        cameraLens: this.composerParams.cameraLens,
                        lightingStyle: this.composerParams.lightingStyle,
                        composition: this.composerParams.composition,
                        optimizePrompt: this.composerParams.optimizePrompt,
                        bestOf: this.composerParams.bestOfTwo ? 2 : 1,
                        productImageUrls,
                        personaImageUrls,
                        sceneryImageUrls,
                        aspectRatio: this.composerParams.aspectRatio,
                        safetyTolerance: this.composerParams.safetyTolerance,
                        draft: true // generate as draft
                    })
                });
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || `Server error: ${response.status}`);
                }
                const result = await response.json();
                if (result.success && result.item) {
                    this.composerResultUrl = result.item.url;
                    this.composerResultItem = result.item;
                    this.complianceAudit = result.complianceAudit || null;

                    // Append to session draftsHistory if not already present
                    if (!this.draftsHistory.some(d => d.url === result.item.url)) {
                        this.draftsHistory.unshift({
                            url: result.item.url,
                            seed: result.item.seed,
                            prompt: result.item.prompt,
                            item: result.item,
                            complianceAudit: result.complianceAudit || null
                        });
                    }
                    this.app.showNotification('✨ Creative asset draft generated successfully!');
                }
            } catch (err) {
                console.error(err);
                alert('Generation failed: ' + err.message);
            } finally {
                this.composerGenerating = false;
            }
        },
        async refineComposerAsset() {
            if (!this.composerResultUrl) return;
            this.composerGenerating = true;
            
            let etaMs = 12000;
            try {
                const est = await this.app.fetchAiEstimate('Image Composition');
                if (est && est.estimated_duration_ms) etaMs = est.estimated_duration_ms;
                const latency = await this.app.measureNetworkLatency();
                etaMs += latency;
            } catch(e) {}
            this.composerEta = { start: Date.now(), expectedDuration: etaMs, progress: 0 };
            
            const progressInterval = setInterval(() => {
                if (!this.composerGenerating) { clearInterval(progressInterval); return; }
                const elapsed = Date.now() - this.composerEta.start;
                this.composerEta.progress = Math.min((elapsed / this.composerEta.expectedDuration) * 100, 95);
            }, 100);
            
            // Extract reference image URLs as arrays
            let productImageUrls = [];
            let personaImageUrls = [];
            let sceneryImageUrls = [];

            if (this.composerParams.productId) {
                const prod = (this.app.products || []).find(p => p && p.id === this.composerParams.productId);
                if (prod && prod.image) productImageUrls.push(prod.image);
            }
            if (this.composerParams.personaName) {
                const pers = (this.canvas.personas || []).find(p => p && p.name === this.composerParams.personaName);
                if (pers && pers.image) personaImageUrls.push(pers.image);
            }
            if (this.composerParams.sceneryName) {
                const scen = (this.canvas.sceneries || []).find(s => s && s.name === this.composerParams.sceneryName);
                if (scen && scen.image) sceneryImageUrls.push(scen.image);
            }

            // Fallback tags matching in prompt template (case-insensitive)
            const templateText = (this.composerParams.promptTemplate || '').toLowerCase();
            const prodMatches = (this.app.products || []).filter(p => p && p.title && templateText.includes(p.title.toLowerCase()) && p.image);
            prodMatches.forEach(p => { if (!productImageUrls.includes(p.image)) productImageUrls.push(p.image) });

            const persMatches = (this.canvas.personas || []).filter(p => p && p.name && templateText.includes(p.name.toLowerCase()) && p.image);
            persMatches.forEach(p => { if (!personaImageUrls.includes(p.image)) personaImageUrls.push(p.image) });

            const scenMatches = (this.canvas.sceneries || []).filter(s => s && s.name && templateText.includes(s.name.toLowerCase()) && s.image);
            scenMatches.forEach(s => { if (!sceneryImageUrls.includes(s.image)) sceneryImageUrls.push(s.image) });

            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/media/ai-studio`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'X-Brand-Id': this.app.activeShopFilter || ''
                    },
                    body: JSON.stringify({
                        action: 'generate',
                        prompt: this.liveAssembledPrompt,
                        productId: this.composerParams.productId,
                        personaName: this.composerParams.personaName,
                        sceneryName: this.composerParams.sceneryName,
                        actionDescription: this.composerParams.actionDescription,
                        backend: this.composerParams.backend === 'auto' ? this.recommendedEngine.name : this.composerParams.backend,
                        seed: this.composerParams.seed,
                        cameraLens: this.composerParams.cameraLens,
                        lightingStyle: this.composerParams.lightingStyle,
                        composition: this.composerParams.composition,
                        optimizePrompt: this.composerParams.optimizePrompt,
                        bestOf: this.composerParams.bestOfTwo ? 2 : 1,
                        productImageUrls,
                        personaImageUrls,
                        sceneryImageUrls,
                        imageUrl: this.composerResultUrl,
                        aspectRatio: this.composerParams.aspectRatio,
                        safetyTolerance: this.composerParams.safetyTolerance,
                        draft: true
                    })
                });
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || `Server error: ${response.status}`);
                }
                const result = await response.json();
                if (result.success && result.item) {
                    this.composerResultUrl = result.item.url;
                    this.composerResultItem = result.item;
                    this.complianceAudit = result.complianceAudit || null;

                    if (!this.draftsHistory.some(d => d.url === result.item.url)) {
                        this.draftsHistory.unshift({
                            url: result.item.url,
                            seed: result.item.seed,
                            prompt: result.item.prompt,
                            item: result.item,
                            complianceAudit: result.complianceAudit || null
                        });
                    }
                    this.app.showNotification('✨ Creative asset refined successfully using base image!');
                }
            } catch (err) {
                console.error(err);
                alert('Refinement failed: ' + err.message);
            } finally {
                this.composerGenerating = false;
            }
        },
        async saveComposerAssetToLibrary() {
            if (!this.composerResultItem) return;
            this.savingComposerAsset = true;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/media/ai-studio/save`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'X-Brand-Id': this.app.activeShopFilter || ''
                    },
                    body: JSON.stringify({
                        title: this.composerResultItem.title,
                        url: this.composerResultItem.url,
                        folder: this.composerResultItem.folder || 'AI Studio',
                        metadata: {
                            ...(this.composerResultItem.metadata || {}),
                            ai_studio: {
                                prompt_template: this.composerParams.promptTemplate,
                                seed: this.composerResultItem.seed,
                                camera_lens: this.composerParams.cameraLens,
                                lighting_style: this.composerParams.lightingStyle,
                                composition: this.composerParams.composition,
                                backend: this.composerParams.backend,
                                format: this.composerParams.format,
                                product_id: this.composerParams.productId,
                                persona_name: this.composerParams.personaName,
                                scenery_name: this.composerParams.sceneryName
                            }
                        }
                    })
                });
                if (response.ok) {
                    const result = await response.json();
                    // Set saved ID so frontend knows it's saved
                    if (result.item && result.item.id) {
                        this.composerResultItem.id = result.item.id;
                    }
                    this.app.showNotification('📥 Creative asset persistently saved to your Media Library.');
                } else {
                    const err = await response.json();
                    throw new Error(err.error || 'Server error saving asset');
                }
            } catch (err) {
                console.error(err);
                alert('Failed to save to library: ' + err.message);
            } finally {
                this.savingComposerAsset = false;
            }
        },
        copySeed(seed) {
            navigator.clipboard.writeText(seed.toString());
            this.app.showNotification('📋 Seed copied to clipboard!');
        },
        generateSmartSeedName() {
            const p = (this.composerParams.promptTemplate || '').trim();
            if (!p) return 'Style Consistency';
            
            let nameParts = [];
            const keywords = ['sunlight', 'warm', 'studio', 'cafe', 'minimalist', 'neon', 'vintage', 'rustic', 'cyberpunk', 'editorial', 'noir', 'bokeh', 'aesthetic', 'retro', 'industrial', 'modern'];
            const foundKeywords = keywords.filter(kw => p.toLowerCase().includes(kw));
            if (foundKeywords.length > 0) {
                nameParts.push(foundKeywords.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
            }
            if (this.composerParams.cameraLens) {
                nameParts.push(this.composerParams.cameraLens.replace('lens', '').replace('style', '').trim());
            }
            if (nameParts.length === 0) {
                return `Style Preset ${Math.floor(Math.random() * 1000)}`;
            }
            return nameParts.join(' - ');
        },
        async saveSeedToGuidelines(seedVal) {
            if (!seedVal) return;
            const suggestedName = this.generateSmartSeedName();
            const customName = prompt("Save Style Consistency Anchor\n\nEnter a name for this style consistency preset:", suggestedName);
            if (customName === null) return;
            
            const finalName = customName.trim() || suggestedName;
            
            if (!this.canvas.savedSeeds) {
                this.canvas.savedSeeds = [];
            }
            const alreadyExists = this.canvas.savedSeeds.some(s => {
                if (typeof s === 'object' && s !== null) {
                    return s.seed === seedVal;
                }
                return s === seedVal;
            });
            if (alreadyExists) {
                this.app.showNotification('ℹ️ Seed is already saved in guidelines.');
                return;
            }
            this.canvas.savedSeeds.push({ name: finalName, seed: seedVal, image: this.composerResultUrl || '' });
            await this.saveBrandCanvas();
            await this.loadBrandCanvas();
            this.app.showNotification(`💾 Saved "${finalName}" style consistency anchor!`);
        },
        async removeSavedSeed(seedVal) {
            if (this.canvas.savedSeeds) {
                this.canvas.savedSeeds = this.canvas.savedSeeds.filter(s => {
                    if (typeof s === 'object' && s !== null) {
                        return s.seed !== seedVal;
                    }
                    return s !== seedVal;
                });
                await this.saveBrandCanvas();
                await this.loadBrandCanvas();
                this.app.showNotification('🗑️ Seed removed from Brand Guidelines.');
            }
        },

        async loadBrandCanvas() {
            if (!this.isValidBrandSelected) return;
            this.loadingCanvas = true;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.app.activeShopFilter}/canvas`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    this.canvas = {
                        brand_voice: data.brand_voice || '',
                        archetype: data.archetype || 'creator',
                        personas: data.personas || [],
                        sceneries: data.sceneries || [],
                        scenes: data.scenes || [],
                        objects: data.objects || [],
                        savedSeeds: data.savedSeeds || [],
                        brand_dna: data.brand_dna || null
                    };
                    const dbSeeds = this.canvas.savedSeeds || [];
                    const formattedDbSeeds = dbSeeds.map(item => {
                        if (typeof item === 'object' && item !== null) {
                            return item;
                        }
                        return { name: `Consistency Seed ${item}`, seed: parseInt(item) };
                    });
                    const defaultPresets = [
                        { name: 'Warm Sunlit Wood', seed: 489218 },
                        { name: 'Sleek Chrome Lab', seed: 902842 },
                        { name: 'Moody Sunset Cafe', seed: 153094 }
                    ];
                    this.presetAnchors = [
                        ...defaultPresets,
                        ...formattedDbSeeds.filter(dbItem => !defaultPresets.some(def => def.seed === dbItem.seed))
                    ];
                }
                const audResp = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.app.activeShopFilter}/audiences`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (audResp.ok) {
                    const audData = await audResp.json();
                    this.audiences = (audData.audiences || []).map(a => {
                        const parsedRules = typeof a.rules === 'string' ? JSON.parse(a.rules) : (a.rules || {});
                        return {
                            ...a,
                            rules: parsedRules,
                            description: parsedRules.description || a.description || 'Target Segment'
                        };
                    });
                }
            } catch (err) {
                console.error('[ContentStudioView] Error loading brand canvas/audiences:', err);
            } finally {
                this.loadingCanvas = false;
            }
        },
        async saveBrandCanvas() {
            if (!this.isValidBrandSelected) return;
            this.savingCanvas = true;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.app.activeShopFilter}/canvas`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ canvas: this.canvas })
                });
                if (response.ok) {
                    this.app.showNotification('✨ Interactive Guidelines Canvas saved successfully!');
                }
            } catch (e) {
                console.error('[ContentStudioView] Error saving canvas:', e);
            } finally {
                this.savingCanvas = false;
            }
        },
        async harvestBrandDna() {
            if (!this.harvesterUrl) {
                alert('Please enter a valid corporate web address to harvest design specifications.');
                return;
            }
            this.harvestingDna = true;
            this.app.showNotification('🧬 Scraping digital property layouts and distilling corporate Brand DNA...');
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.app.activeShopFilter}/harvest-dna`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ url: this.harvesterUrl })
                });

                if (response.ok) {
                    const data = await response.json();
                    this.app.showNotification('✅ Brand DNA harvested, verified, and canvas guidelines updated!');
                    await this.loadBrandCanvas();
                } else {
                    const err = await response.json();
                    throw new Error(err.error || 'Server error during scraping.');
                }
            } catch (e) {
                console.error('[ContentStudioView] Brand DNA Harvester failed:', e);
                alert(`DNA Extraction failed: ${e.message}`);
            } finally {
                this.harvestingDna = false;
            }
        },
        async loadDraftsHistory() {
            if (!this.isValidBrandSelected) return;
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/media?brand_id=${this.app.activeShopFilter}&limit=30`, {
                    headers: this.authHeaders
                });
                if (response.ok) {
                    const data = await response.json();
                    // Filter down to item generated by visual studio / AI models
                    this.draftsHistory = data.filter(i => (i.meta && i.meta.generated_via === 'visual_studio') || i.url.includes('imagen') || i.url.includes('flux'));
                }
            } catch (e) {
                console.error(e);
            }
        },
        getQuickItemIcon(item) {
            if (item._quickType === 'product') return '📸';
            if (item._quickType === 'service') return '💼';
            if (item._quickType === 'persona') return '👥';
            if (item._quickType === 'scenery') return '🌄';
            if (item._quickType === 'audience') return '🎯';
            return '📁';
        },
        getQuickItemSubtitle(item) {
            if (item._quickType === 'product' || item._quickType === 'service') return item.sku || 'No SKU';
            if (item._quickType === 'persona') return `${item.role || 'Model'} (${item.age || '25-35'})`;
            if (item._quickType === 'scenery') return item.photography_style || item.description || 'Custom backdrop';
            if (item._quickType === 'audience') return item.description || 'Target Segment';
            return '';
        },
        handleQuickDragStart(e, item) {
            const payload = {
                type: item._quickType,
                item: item
            };
            e.dataTransfer.setData('text/plain', JSON.stringify(payload));
            e.dataTransfer.effectAllowed = 'copy';
        },
        insertQuickTag(item) {
            this.insertRichTag(item._quickType, item);
        },
        handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        },
        handleDrop(e) {
            e.preventDefault();
            const data = e.dataTransfer.getData('text/plain');
            if (!data) return;
            try {
                const payload = JSON.parse(data);
                if (payload && payload.type && payload.item) {
                    let range;
                    if (document.caretRangeFromPoint) {
                        range = document.caretRangeFromPoint(e.clientX, e.clientY);
                    } else if (e.rangeParent) {
                        range = document.createRange();
                        range.setStart(e.rangeParent, e.rangeOffset);
                    }
                    if (range) {
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    this.insertRichTag(payload.type, payload.item);
                }
            } catch(err) {
                console.error('[ContentStudioView] Drop parsing failed:', err);
            }
        },
        openQuickCreateModal() {
            this.quickCreateEditingIndex = null;
            this.quickCreateEditingId = null;
            this.quickCreateForm = {
                type: this.activeQuickTab === 'inventory' ? 'product' : (this.activeQuickTab === 'personas' ? 'persona' : (this.activeQuickTab === 'sceneries' ? 'scenery' : 'audience')),
                name: '',
                title: '',
                description: '',
                role: '',
                age: '25-35',
                apparel: 'casual',
                expression: 'focused',
                lighting: 'soft natural side-light',
                photography_style: '35mm film style, warm color palette, soft bokeh, f/1.8 aperture',
                rules: '{}'
            };
            this.showQuickCreateModal = true;
        },
        openAddPersonaForm() {
            this.quickCreateEditingIndex = null;
            this.quickCreateEditingId = null;
            this.quickCreateForm = {
                type: 'persona',
                name: '',
                description: '',
                role: '',
                age: '25-35',
                gender: 'female',
                apparel: 'casual',
                expression: 'focused',
                rules: '{}'
            };
            this.showQuickCreateModal = true;
        },
        openAddSceneryForm() {
            this.quickCreateEditingIndex = null;
            this.quickCreateEditingId = null;
            this.quickCreateForm = {
                type: 'scenery',
                name: '',
                description: '',
                lighting: 'soft natural side-light',
                photography_style: '35mm film style, warm color palette, soft bokeh, f/1.8 aperture',
                rules: '{}'
            };
            this.showQuickCreateModal = true;
        },
        openAddSceneForm() {
            this.quickCreateEditingIndex = null;
            this.quickCreateEditingId = null;
            this.quickCreateForm = {
                type: 'scene',
                name: '',
                description: '',
                composition: 'Close-up macro, shallow depth of field',
                rules: '{}'
            };
            this.showQuickCreateModal = true;
        },
        openAddObjectForm() {
            this.quickCreateEditingIndex = null;
            this.quickCreateEditingId = null;
            this.quickCreateForm = {
                type: 'object',
                name: '',
                description: '',
                branding: 'minimalist debossed brand logo',
                rules: '{}'
            };
            this.showQuickCreateModal = true;
        },
        openEditObjectForm(idx) {
            const o = this.canvas.objects[idx];
            this.quickCreateEditingIndex = idx;
            this.quickCreateEditingId = null;
            this.quickCreateForm = {
                type: 'object',
                name: o.name,
                description: o.description,
                branding: o.branding || 'minimalist debossed brand logo',
                rules: '{}'
            };
            this.showQuickCreateModal = true;
        },
        openAddAudienceForm() {
            this.quickCreateEditingIndex = null;
            this.quickCreateEditingId = null;
            this.quickCreateForm = {
                type: 'audience',
                name: '',
                description: '',
                rules: '{}'
            };
            this.showQuickCreateModal = true;
        },
        openEditPersonaForm(idx) {
            const p = this.canvas.personas[idx];
            this.quickCreateEditingIndex = idx;
            this.quickCreateEditingId = null;
            this.quickCreateForm = {
                type: 'persona',
                name: p.name,
                description: p.description,
                role: p.role,
                age: p.age,
                gender: p.gender || 'female',
                apparel: p.apparel,
                expression: p.expression,
                rules: '{}'
            };
            this.showQuickCreateModal = true;
        },
        openEditSceneryForm(idx) {
            const s = this.canvas.sceneries[idx];
            this.quickCreateEditingIndex = idx;
            this.quickCreateEditingId = null;
            this.quickCreateForm = {
                type: 'scenery',
                name: s.name,
                description: s.description,
                lighting: s.lighting,
                photography_style: s.photography_style,
                rules: '{}'
            };
            this.showQuickCreateModal = true;
        },
        openEditSceneForm(idx) {
            const s = this.canvas.scenes[idx];
            this.quickCreateEditingIndex = idx;
            this.quickCreateEditingId = null;
            this.quickCreateForm = {
                type: 'scene',
                name: s.name,
                description: s.description,
                composition: s.composition,
                rules: '{}'
            };
            this.showQuickCreateModal = true;
        },
        openEditAudienceForm(idx) {
            const a = this.audiences[idx];
            this.quickCreateEditingIndex = null;
            this.quickCreateEditingId = a.id;
            this.quickCreateForm = {
                type: 'audience',
                name: a.name,
                description: a.description,
                rules: JSON.stringify(a.rules || {}, null, 2)
            };
            this.showQuickCreateModal = true;
        },
        async deleteAudience(id) {
            if (confirm('Are you sure you want to delete this audience segment?')) {
                const token = localStorage.getItem('sc_admin_token');
                try {
                    const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.app.activeShopFilter}/audiences/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        this.app.showNotification('Successfully deleted audience segment');
                        await this.loadBrandCanvas();
                    } else {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to delete audience');
                    }
                } catch (err) {
                    alert('Error deleting audience: ' + err.message);
                }
            }
        },
        async saveQuickCreateItem() {
            if (!this.isValidBrandSelected) return;
            const form = this.quickCreateForm;
            const token = localStorage.getItem('sc_admin_token');
            try {
                if (form.type === 'product' || form.type === 'service') {
                    const payload = {
                        title: form.title,
                        type: form.type,
                        sku: `quick-${Date.now()}`,
                        price: 0,
                        description: form.description
                    };
                    const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.app.activeShopFilter}/products`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });
                    if (response.ok) {
                        this.app.showNotification(`Successfully added ${form.type}`);
                        if (this.app.fetchProducts) await this.app.fetchProducts();
                    } else {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to save product');
                    }
                } else if (form.type === 'audience') {
                    const generatedId = this.quickCreateEditingId || `aud_${form.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
                    const rulesObj = form.rules ? JSON.parse(form.rules) : {};
                    rulesObj.description = form.description;
                    const payload = {
                        id: generatedId,
                        name: form.name,
                        rules: rulesObj
                    };
                    const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.app.activeShopFilter}/audiences`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });
                    if (response.ok) {
                        this.app.showNotification(this.quickCreateEditingId ? 'Successfully updated audience segment' : 'Successfully added audience segment');
                        await this.loadBrandCanvas();
                    } else {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to save audience');
                    }
                } else {
                    const canvasCopy = { ...this.canvas };
                    const itemData = {
                        name: form.name,
                        description: form.description
                    };
                    if (form.type === 'persona') {
                        itemData.role = form.role;
                        itemData.age = form.age;
                        itemData.gender = form.gender;
                        itemData.apparel = form.apparel;
                        itemData.expression = form.expression;
                    } else if (form.type === 'scenery') {
                        itemData.lighting = form.lighting;
                        itemData.photography_style = form.photography_style;
                    } else if (form.type === 'scene') {
                        itemData.composition = form.composition;
                    } else if (form.type === 'object') {
                        itemData.branding = form.branding;
                    }

                    if (this.quickCreateEditingIndex !== null) {
                        // Editing existing canvas index
                        if (form.type === 'persona') {
                            const existing = canvasCopy.personas[this.quickCreateEditingIndex];
                            let keepImages = true;
                            if (existing.image) {
                                keepImages = confirm(`You are saving edits to "${form.name}".\n\nWould you like to KEEP the existing persona images and variants?\n\nClick OK to keep the current images.\nClick Cancel to delete the current images so you can generate new ones matching your new details.`);
                            }
                            if (keepImages) {
                                itemData.image = existing.image;
                                itemData.seed = existing.seed;
                                itemData.variants = existing.variants || [];
                            } else {
                                itemData.image = null;
                                itemData.seed = null;
                                itemData.variants = [];
                            }
                            canvasCopy.personas[this.quickCreateEditingIndex] = itemData;
                        } else if (form.type === 'scenery') {
                            const existing = canvasCopy.sceneries[this.quickCreateEditingIndex];
                            let keepImages = true;
                            if (existing.image) {
                                keepImages = confirm(`You are saving edits to "${form.name}".\n\nWould you like to KEEP the existing scenery images and variants?\n\nClick OK to keep the current images.\nClick Cancel to delete the current images so you can generate new ones matching your new details.`);
                            }
                            if (keepImages) {
                                itemData.image = existing.image;
                                itemData.seed = existing.seed;
                                itemData.variants = existing.variants || [];
                            } else {
                                itemData.image = null;
                                itemData.seed = null;
                                itemData.variants = [];
                            }
                            canvasCopy.sceneries[this.quickCreateEditingIndex] = itemData;
                        } else if (form.type === 'scene') {
                            canvasCopy.scenes[this.quickCreateEditingIndex] = itemData;
                        } else if (form.type === 'object') {
                            const existing = canvasCopy.objects[this.quickCreateEditingIndex] || {};
                            let keepImages = true;
                            if (existing.image) {
                                keepImages = confirm(`You are saving edits to "${form.name}".\n\nWould you like to KEEP the existing object images and variants?\n\nClick OK to keep the current images.\nClick Cancel to delete the current images so you can generate new ones matching your new details.`);
                            }
                            if (keepImages) {
                                itemData.image = existing.image;
                                itemData.seed = existing.seed;
                                itemData.variants = existing.variants || [];
                            } else {
                                itemData.image = null;
                                itemData.seed = null;
                                itemData.variants = [];
                            }
                            canvasCopy.objects[this.quickCreateEditingIndex] = itemData;
                        }
                    } else {
                        // Creating new canvas item
                        if (form.type === 'persona') {
                            canvasCopy.personas.push(itemData);
                        } else if (form.type === 'scenery') {
                            canvasCopy.sceneries.push(itemData);
                        } else if (form.type === 'scene') {
                            if (!canvasCopy.scenes) canvasCopy.scenes = [];
                            canvasCopy.scenes.push(itemData);
                        } else if (form.type === 'object') {
                            if (!canvasCopy.objects) canvasCopy.objects = [];
                            canvasCopy.objects.push(itemData);
                        }
                    }
                    
                    const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.app.activeShopFilter}/canvas`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(canvasCopy)
                    });
                    if (response.ok) {
                        this.app.showNotification(this.quickCreateEditingIndex !== null ? `Successfully updated ${form.type}` : `Successfully added ${form.type}`);
                        await this.loadBrandCanvas();
                    } else {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to save canvas guidelines');
                    }
                }
                this.showQuickCreateModal = false;
            } catch(e) {
                alert('Save failed: ' + e.message);
            }
        },
        async triggerQuickAiCreate() {
            if (!this.isValidBrandSelected) return;
            const targetType = this.activeQuickTab === 'inventory' ? 'product' : (this.activeQuickTab === 'personas' ? 'persona' : (this.activeQuickTab === 'sceneries' ? 'scenery' : 'audience'));
            this.quickAiGenerating = true;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/media/ai-studio`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'X-Brand-Id': this.app.activeShopFilter
                    },
                    body: JSON.stringify({
                        action: 'generate_text',
                        prompt: `Generate a new structured ${targetType} for a coffee brand. Respond strictly with a JSON object. No markdown code blocks, no other text.
Fields based on type:
- If persona: { name, role, age (e.g. 25-35), apparel, expression, description }
- If scenery: { name, description, lighting, photography_style }
- If audience: { name, description, rules: {} }
- If product: { title, type: 'product', description }`
                    })
                });
                if (response.ok) {
                    const result = await response.json();
                    let parsed;
                    try {
                        const cleanText = result.output || result.text || '';
                        const jsonStr = cleanText.substring(cleanText.indexOf('{'), cleanText.lastIndexOf('}') + 1);
                        parsed = JSON.parse(jsonStr);
                    } catch(err) {
                        throw new Error('AI returned invalid format. Please try again.');
                    }
                    this.quickCreateForm = {
                        type: targetType === 'inventory' ? 'product' : targetType,
                        name: parsed.name || parsed.title || '',
                        title: parsed.title || parsed.name || '',
                        description: parsed.description || '',
                        role: parsed.role || '',
                        age: parsed.age || '25-35',
                        apparel: parsed.apparel || 'casual',
                        expression: parsed.expression || 'focused',
                        lighting: parsed.lighting || 'soft natural side-light',
                        photography_style: parsed.photography_style || '35mm film style',
                        rules: parsed.rules ? JSON.stringify(parsed.rules, null, 2) : '{}'
                    };
                    this.showQuickCreateModal = true;
                } else {
                    const err = await response.json();
                    throw new Error(err.error || 'Server error generating text');
                }
            } catch(e) {
                alert('AI generation failed: ' + e.message);
            } finally {
                this.quickAiGenerating = false;
            }
        }
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

.quick-insert-item-hover {
    position: relative;
}
.quick-insert-item-hover .hover-actions-overlay {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease-in-out;
}
.quick-insert-item-hover:hover {
    border-color: var(--accent) !important;
}
.quick-insert-item-hover:hover .hover-actions-overlay {
    opacity: 1;
    pointer-events: auto;
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

@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}
.skeleton-loader {
    background: linear-gradient(90deg, var(--border) 25%, var(--workspace-bg) 50%, var(--border) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite linear;
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

/* Rich Prompt Composer Tags */
.prompt-rich-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1;
    vertical-align: middle;
    margin: 2px 2px;
    user-select: all;
}
.tag-product {
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #4ade80;
}
.tag-service {
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #f59e0b;
}
.tag-persona {
    background: rgba(168, 85, 247, 0.15);
    border: 1px solid rgba(168, 85, 247, 0.3);
    color: #c084fc;
}
.tag-scenery {
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #60a5fa;
}
.tag-thumb {
    width: 14px;
    height: 14px;
    object-fit: cover;
    border-radius: 2px;
}
.tag-remove-btn {
    background: transparent;
    border: none;
    color: currentColor;
    opacity: 0.6;
    font-size: 0.85rem;
    cursor: pointer;
    padding: 0 0 0 2px;
    line-height: 1;
    font-weight: bold;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.tag-remove-btn:hover {
    opacity: 1;
}

#composerRichEditor:empty:before {
    content: attr(placeholder);
    color: var(--text-muted);
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
.spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid var(--accent);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}
</style>

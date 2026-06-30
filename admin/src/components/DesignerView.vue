<template>
    <div id="designer-workspace-container" style="width: 100%; display: flex; flex-direction: column;">
        <!-- Top Toolbar -->
        <div class="panel-header" style="margin-bottom: 0px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: var(--card-bg); padding: 12px 20px; border-radius: 0px; border: none; border-bottom: 1px solid var(--border);">
            <div style="display: flex; align-items: center; gap: 12px;">
                <button type="button" class="btn" style="padding: 6px 12px; font-weight: 700; height: 32px; display: flex; align-items: center; justify-content: center; gap: 6px; margin: 0; background: var(--workspace-bg); color: var(--text-main); border: 1px solid var(--border);" @click="$emit('back')">
                    ⬅ Back to Channels
                </button>
                <h2 class="panel-title" style="margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                    🎨 Storefront Designer Workspace
                </h2>
            </div>
            
            <!-- Page Selector Dropdown -->
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Page:</span>
                <select v-model="activeContentPage" @change="navigateToPage(activeContentPage)" style="border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; padding: 6px 12px; font-weight: 700; cursor: pointer; outline: none;">
                    <option value="home">🏠 Home page</option>
                    <option value="track">📦 Track order page</option>
                    <option value="404">⚠️ 404 error page</option>
                    <option v-for="page in (designerBrand.landing_pages || [])" :key="page.id" :value="page.id">
                        📄 /{{ page.id }} (Custom Page)
                    </option>
                </select>
                <button type="button" class="btn btn-accent" style="margin: 0; font-size: 0.8rem; height: 34px; padding: 0 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;" @click="showAddPageModal = true">
                    ➕ Add Page
                </button>
            </div>

            <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500; display: flex; align-items: center; gap: 16px;">
                <div>Active Brand: <strong style="color: var(--accent);">{{ activeBrandName }}</strong></div>
                <button type="button" class="btn btn-accent" style="margin: 0; font-weight: 700; height: 34px; padding: 0 16px; font-size: 0.82rem; display: flex; align-items: center; gap: 6px;" @click="saveDesignSettings" :disabled="saving">
                    <span v-if="saving" class="spinner"></span>
                    <span>{{ saving ? 'Publishing...' : '🚀 Publish Live' }}</span>
                </button>
            </div>
        </div>

        <div v-if="app.activeShopFilter === 'all'" class="panel" style="text-align: center; padding: 60px 20px;">
            <span style="font-size: 3rem;">🏬</span>
            <h3 style="margin-top: 15px; color: var(--text-main);">No Store Selected</h3>
            <p style="color: var(--text-muted); max-width: 450px; margin: 10px auto 20px auto; font-size: 0.9rem;">
                Please select a specific brand shop from the workspace switcher dropdown in the top navigation bar to start designing.
            </p>
        </div>

        <!-- 2-Column Layout Container -->
        <div v-else class="designer-workspace-layout" style="display: grid; grid-template-columns: 320px 1fr; gap: 0px; align-items: stretch; min-height: calc(100vh - 120px);">
            
            <!-- Column 1: Storefront Layout Tree / Inspector Settings (Left Sidebar) -->
            <div style="display: flex; flex-direction: column; gap: 16px; padding: 16px; background: var(--card-bg); border-right: 1px solid var(--border); box-sizing: border-box; overflow-y: auto;">
                
                <!-- Subview A: If a section is selected: Render its Settings Inspector -->
                <div v-if="selectedSectionId" style="display: flex; flex-direction: column; gap: 14px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                        <h4 style="margin: 0; color: var(--accent); font-weight: 700; font-size: 0.85rem; text-transform: uppercase;">
                            {{ getSelectedSectionTitle() }} Settings
                        </h4>
                        <button type="button" class="btn" style="padding: 2px 8px; margin: 0; font-size: 0.7rem; height: 22px;" @click="selectedSectionId = ''">
                            ← Back
                        </button>
                    </div>

                    <!-- General Block Reordering Actions -->
                    <div v-if="isDynamicSection(selectedSectionId)" style="display: flex; gap: 6px;">
                        <button type="button" class="btn" style="flex: 1; font-size: 0.72rem; padding: 6px 0; margin: 0; height: 28px;" @click="moveSelectedSection(-1)">▲ Move Up</button>
                        <button type="button" class="btn" style="flex: 1; font-size: 0.72rem; padding: 6px 0; margin: 0; height: 28px;" @click="moveSelectedSection(1)">▼ Move Down</button>
                        <button type="button" class="btn" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; font-size: 0.72rem; padding: 6px 0; margin: 0; height: 28px; flex: 1.2;" @click="deleteSelectedSection">🗑️ Delete</button>
                    </div>

                    <!-- INSPECTOR FIELDS: ANNOUNCEMENT BAR -->
                    <div v-if="selectedSectionId === 'announcement'" style="display: flex; flex-direction: column; gap: 12px;">
                        <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="announce-act" v-model="designerBrand.announcement_active" style="width: 16px; height: 16px; cursor: pointer; margin: 0;">
                            <label for="announce-act" style="font-weight: 700; font-size: 0.8rem; cursor: pointer; margin: 0;">Enable Banner</label>
                        </div>
                        <div class="form-group">
                            <label>Banner Text</label>
                            <input type="text" v-model="designerBrand.announcement_text" placeholder="Free shipping on orders over €75!" style="width: 100%;">
                        </div>
                        <div class="form-group">
                            <label>Banner Background</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="color" v-model="designerBrand.announcement_bg" style="width: 38px; height: 32px; padding: 2px; border-radius: 4px; border: 1px solid var(--border); background: none; cursor: pointer; margin: 0;">
                                <input type="text" v-model="designerBrand.announcement_bg" style="flex: 1; margin: 0;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Banner Text Color</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="color" v-model="designerBrand.announcement_text_color" style="width: 38px; height: 32px; padding: 2px; border-radius: 4px; border: 1px solid var(--border); background: none; cursor: pointer; margin: 0;">
                                <input type="text" v-model="designerBrand.announcement_text_color" style="flex: 1; margin: 0;">
                            </div>
                        </div>
                    </div>

                    <!-- INSPECTOR FIELDS: HEADER -->
                    <div v-if="selectedSectionId === 'header'" style="display: flex; flex-direction: column; gap: 12px;">
                        <!-- Logo Upload -->
                        <div class="form-group">
                            <label>Logo Asset</label>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <div style="display: flex; gap: 6px;">
                                    <input type="text" v-model="designerBrand.logo" placeholder="https://..." style="flex: 1; margin: 0;">
                                    <button type="button" class="btn" style="margin: 0; padding: 0 10px; font-size: 0.72rem; display: flex; align-items: center; justify-content: center;" @click="triggerFileUpload('header_logo')">📁</button>
                                </div>
                                <input type="file" ref="header_logo_file" style="display: none;" @change="handleSectionFileUpload($event, 'header', 'logo')">
                                <!-- Drag & Drop Dropzone Box -->
                                <div class="dropzone-box" @dragover.prevent @drop.prevent="handleSectionFileDrop($event, 'header', 'logo')" 
                                     style="border: 2px dashed var(--border); border-radius: 8px; padding: 12px; text-align: center; font-size: 0.72rem; color: var(--text-muted); cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='none'" @click="triggerFileUpload('header_logo')">
                                    <span v-if="uploadingField === 'header_logo'">Uploading file... ⏳</span>
                                    <span v-else>Drag logo here or click to upload</span>
                                </div>
                                <img v-if="designerBrand.logo" :src="designerBrand.logo" style="max-height: 40px; object-fit: contain; margin: 0 auto; display: block; border-radius: 4px; border: 1px solid var(--border); padding: 4px; background: white;" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Header Background Color</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="color" v-model="designerBrand.header_bg_color" style="width: 38px; height: 32px; padding: 2px; border-radius: 4px; border: 1px solid var(--border); background: none; cursor: pointer; margin: 0;" />
                                <input type="text" v-model="designerBrand.header_bg_color" style="flex: 1; margin: 0;" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Subview B: Otherwise: Render General Layout Sections List -->
                <div v-else style="display: flex; flex-direction: column; height: 100%;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <h4 style="margin: 0; color: var(--accent); font-weight: 700; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">Layout Sections</h4>
                    </div>
                    
                    <!-- General Section Hierarchy Tree -->
                    <div class="sections-tree-list" style="display: flex; flex-direction: column; gap: 10px; flex: 1; overflow-y: auto;">
                        
                        <!-- Announcement Bar Card -->
                        <div class="section-tree-item" :class="{ active: selectedSectionId === 'announcement' }" @click="selectSection('announcement')" 
                             style="background: var(--workspace-bg); border: 1px solid var(--border); padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 0.9rem;">📢</span>
                                <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-main);">Announcement Bar</span>
                            </div>
                            <input type="checkbox" v-model="designerBrand.announcement_active" @click.stop style="cursor: pointer;">
                        </div>

                        <!-- Header Card -->
                        <div class="section-tree-item" :class="{ active: selectedSectionId === 'header' }" @click="selectSection('header')" 
                             style="background: var(--workspace-bg); border: 1px solid var(--border); padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 0.9rem;">🧱</span>
                                <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-main);">Header</span>
                            </div>
                        </div>

                        <div style="margin: 6px 0; border-top: 1px dashed var(--border);"></div>

                        <!-- Dynamic Layout Sections Tree -->
                        <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Main Template Sections</div>
                        
                        <div v-for="(sec, idx) in designerBrand.sections" :key="sec.id" 
                             class="section-tree-item" :class="{ active: selectedSectionId === sec.id }" @click="selectSection(sec.id)" 
                             style="background: var(--workspace-bg); border: 1px solid var(--border); padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 6px; transition: all 0.2s; position: relative;">
                            
                            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                                <div style="display: flex; align-items: center; gap: 8px; width: 60%; overflow: hidden;">
                                    <span style="font-size: 0.95rem;">{{ getSectionIcon(sec.type) }}</span>
                                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">{{ sec.title }}</span>
                                </div>
                                
                                <!-- Move / Toggle / Delete Actions -->
                                <div style="display: flex; align-items: center; gap: 6px;" @click.stop>
                                    <button type="button" style="border: none; background: none; color: var(--text-muted); font-size: 0.75rem; cursor: pointer; padding: 2px;" title="Move Up" @click="moveSection(idx, -1)">▲</button>
                                    <button type="button" style="border: none; background: none; color: var(--text-muted); font-size: 0.75rem; cursor: pointer; padding: 2px;" title="Move Down" @click="moveSection(idx, 1)">▼</button>
                                    <button type="button" style="border: none; background: none; color: var(--text-muted); font-size: 0.8rem; cursor: pointer; padding: 2px;" title="Toggle Active" @click="toggleSectionActive(sec)">
                                        {{ sec.active !== false ? '👁️' : '🙈' }}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Add Section Block -->
                        <div style="margin-top: 10px; position: relative;">
                            <button type="button" class="btn" style="width: 100%; border: 1px dashed var(--border); font-size: 0.78rem; font-weight: 700; height: 36px; display: flex; align-items: center; justify-content: center; gap: 6px; margin: 0; background: rgba(255,255,255,0.02); color: var(--accent);" @click="showAddSectionMenu = !showAddSectionMenu">
                                ➕ Add Section
                            </button>
                            
                            <!-- Add Section Dropdown Options -->
                            <div v-if="showAddSectionMenu" style="position: absolute; bottom: 42px; left: 0; width: 100%; background: var(--panel-bg); border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); z-index: 100; overflow: hidden; display: flex; flex-direction: column;">
                                <button type="button" class="btn-option" style="padding: 10px 14px; font-size: 0.76rem; text-align: left; background: none; border: none; color: var(--text-main); cursor: pointer; display: flex; align-items: center; gap: 8px;" @click="addSection('hero')">🌄 Image Banner (Hero)</button>
                                <button type="button" class="btn-option" style="padding: 10px 14px; font-size: 0.76rem; text-align: left; background: none; border: none; color: var(--text-main); cursor: pointer; display: flex; align-items: center; gap: 8px;" @click="addSection('featured_collection')">🛍️ Featured Collection</button>
                                <button type="button" class="btn-option" style="padding: 10px 14px; font-size: 0.76rem; text-align: left; background: none; border: none; color: var(--text-main); cursor: pointer; display: flex; align-items: center; gap: 8px;" @click="addSection('rich_text')">📝 Rich Text</button>
                                <button type="button" class="btn-option" style="padding: 10px 14px; font-size: 0.76rem; text-align: left; background: none; border: none; color: var(--text-main); cursor: pointer; display: flex; align-items: center; gap: 8px;" @click="addSection('collection_list')">🗂️ Collection List</button>
                                <button type="button" class="btn-option" style="padding: 10px 14px; font-size: 0.76rem; text-align: left; background: none; border: none; color: var(--text-main); cursor: pointer; display: flex; align-items: center; gap: 8px;" @click="addSection('video')">🎥 Video Banner</button>
                            </div>
                        </div>

                        <div style="margin: 6px 0; border-top: 1px dashed var(--border);"></div>

                        <!-- Footer Card -->
                        <div class="section-tree-item" :class="{ active: selectedSectionId === 'footer' }" @click="selectSection('footer')" 
                             style="background: var(--workspace-bg); border: 1px solid var(--border); padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 0.9rem;">🧱</span>
                                <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-main);">Footer</span>
                            </div>
                        </div>

                    </div>

                    <!-- Collapsible Custom CSS Override section at the bottom of left sidebar -->
                    <div style="margin-top: auto; padding-top: 16px; border-top: 1px dashed var(--border);">
                        <button type="button" class="btn" style="width: 100%; margin: 0; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-weight: 700; height: 36px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main);" @click="showCustomCss = !showCustomCss">
                            💻 {{ showCustomCss ? 'Hide Custom CSS' : 'Show Custom CSS Override' }}
                        </button>
                        <div v-if="showCustomCss" class="form-group" style="margin-top: 10px; margin-bottom: 0;">
                            <textarea v-model="designerBrand.custom_css" :disabled="inheritStyles" placeholder="/* Add custom CSS rules here to override layouts */&#10;body {&#10;  font-size: 16px;&#10;}" style="width: 100%; height: 120px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 10px; font-family: monospace; font-size: 0.85rem; resize: vertical; outline: none;"></textarea>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Column 2: Sandbox Canvas Preview (Right Sidebar/Main View) -->
            <div style="display: flex; flex-direction: column; gap: 0px; transition: all 0.3s ease; background: var(--bg-color); box-sizing: border-box;">
                <!-- Browser Bar Controls -->
                <div style="display: flex; align-items: center; justify-content: space-between; background: var(--card-bg); border-bottom: 1px solid var(--border); padding: 8px 16px; gap: 12px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button type="button" class="btn btn-secondary" style="padding: 4px 8px; margin: 0; height: 28px; width: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;" @click="iframeBack" title="Back">
                            ⬅
                        </button>
                        <button type="button" class="btn btn-secondary" style="padding: 4px 8px; margin: 0; height: 28px; width: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;" @click="iframeForward" title="Forward">
                            ➡
                        </button>
                        <button type="button" class="btn btn-secondary" style="padding: 4px 8px; margin: 0; height: 28px; width: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;" @click="iframeReload" title="Reload">
                            🔄
                        </button>
                        
                        <div style="width: 1px; height: 16px; background: var(--border);"></div>
                        <button type="button" class="btn btn-secondary" style="padding: 4px 8px; margin: 0; height: 28px; font-size: 0.72rem; font-weight: 700;" @click="undo" title="Undo (Ctrl+Z)">↩ Undo</button>
                        <button type="button" class="btn btn-secondary" style="padding: 4px 8px; margin: 0; height: 28px; font-size: 0.72rem; font-weight: 700;" @click="redo" title="Redo (Ctrl+Y)">↪ Redo</button>
                        <button type="button" class="btn btn-secondary" style="padding: 4px 8px; margin: 0; height: 28px; font-size: 0.72rem; font-weight: 700; color: #ef4444;" @click="resetDesign" title="Reset Design">❌ Reset</button>
                    </div>
                    <div style="flex: 1; font-family: monospace; font-size: 0.78rem; background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 4px; padding: 4px 10px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 30%; text-align: left;">
                        {{ displayUrl }}
                    </div>
                    
                    <!-- Mode switch Edit/Play -->
                    <div style="display: flex; background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 4px; padding: 2px; height: 28px; align-items: center;">
                        <button type="button" class="btn" :style="inlineEditMode ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-main)' }" style="padding: 2px 8px; margin: 0; font-size: 0.7rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer;" @click="inlineEditMode = true">✏️ Edit</button>
                        <button type="button" class="btn" :style="!inlineEditMode ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-main)' }" style="padding: 2px 8px; margin: 0; font-size: 0.7rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer;" @click="inlineEditMode = false">👁️ Play</button>
                    </div>
 
                    <!-- Device sizes -->
                    <div style="display: flex; background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 4px; padding: 2px; height: 28px;">
                        <button type="button" class="btn" :style="viewportMode === 'desktop' ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-main)' }" style="padding: 2px 6px; margin: 0; font-size: 0.7rem; border: none; border-radius: 4px;" @click="viewportMode = 'desktop'">🖥️</button>
                        <button type="button" class="btn" :style="viewportMode === 'tablet' ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-main)' }" style="padding: 2px 6px; margin: 0; font-size: 0.7rem; border: none; border-radius: 4px;" @click="viewportMode = 'tablet'">📟</button>
                        <button type="button" class="btn" :style="viewportMode === 'mobile' ? { background: 'var(--accent)', color: 'var(--workspace-bg)' } : { background: 'transparent', color: 'var(--text-main)' }" style="padding: 2px 6px; margin: 0; font-size: 0.7rem; border: none; border-radius: 4px;" @click="viewportMode = 'mobile'">📱</button>
                    </div>

                    <!-- Language Selector (copied from the duplicate block for full functionality) -->
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">🌐</span>
                        <select v-model="previewActiveLang" @change="changePreviewLanguage" 
                                style="border-radius: 4px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.72rem; padding: 2px 4px; font-weight: 700; cursor: pointer; outline: none; height: 28px; line-height: 1;">
                            <option v-for="lang in availableLanguages" :key="lang" :value="lang">
                                {{ getLanguageLabel(lang).toUpperCase() }}
                            </option>
                        </select>
                    </div>
                </div>
 
                <div :style="previewContainerStyle" style="border: none; border-radius: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; background: var(--bg-color); flex: 1; padding: 16px; box-sizing: border-box;">
                    <div :style="viewportIframeStyle" style="height: 100%; background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 4px; overflow: hidden;">
                        <iframe ref="previewIframe" class="preview-iframe" :src="previewIframeSrc" @load="handleIframeLoad" style="width: 100%; height: 100%; border: none;"></iframe>
                    </div>
                </div>
            </div>
        </div>\n
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
                content_translations: {},
                sections: []
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
            showCustomCss: false,
            isGeneratingLayout: false,
            lastLayoutCost: null,
            aiStylePresets: [],
            autoUpdatePreview: true,
            iframeBuster: Date.now(),
            activeContentPage: 'home',
            showAddPageModal: false,
            newPage: { id: '', headline: '', subheadline: '', cta: '', hero_img: '', features: '', coupon_code: '' },
            designerPrompt: '',
            isBulkTranslating: false,
            lastBulkTranslateCost: null,
            aiUsageBreakdown: [],
            undoStack: [],
            redoStack: [],
            isApplyingHistory: false,
            
            // Visual website builder states
            selectedSectionId: '',
            selectedBlockId: '',
            showAddSectionMenu: false,
            uploadingField: '',
            defaultSections: [
                {
                  id: 'hero_1',
                  type: 'hero',
                  title: 'Image Banner (Hero)',
                  active: true,
                  settings: {
                    headline: 'Crafting the perfect extraction with Pesado',
                    subheadline: 'Designed in Melbourne, engineered for absolute consistency. Elevate your espresso ritual.',
                    cta: 'Shop Collection',
                    cta_link: '#products',
                    hero_img: ''
                  }
                },
                {
                  id: 'featured_1',
                  type: 'featured_collection',
                  title: 'Featured Collection',
                  active: true,
                  settings: {
                    title: 'The Precision Collection',
                    subtitle: 'Meticulously engineered tools for the discerning barista.',
                    collection_id: 'all',
                    limit: 4
                  }
                },
                {
                  id: 'rich_1',
                  type: 'rich_text',
                  title: 'Rich Text',
                  active: true,
                  settings: {
                    title: 'Obsessive Attention. Intelligent Effort.',
                    content: 'Functional coffee gear made of premium materials to improve people\'s lives in small but mighty ways.',
                    align: 'center'
                  }
                },
                {
                  id: 'video_1',
                  type: 'video',
                  title: 'Video Banner',
                  active: true,
                  settings: {
                    title: 'Crafted to Perfection',
                    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-hot-coffee-into-a-cup-42283-large.mp4',
                    autoplay: true,
                    loop: true
                  }
                }
            ]
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
            } else if (event.data && event.data.type === 'SELECT_SECTION') {
                this.selectedSectionId = event.data.sectionId;
                if (event.data.blockId) {
                    this.selectedBlockId = event.data.blockId;
                }
            } else if (event.data && event.data.type === 'SECTION_SETTING_EDIT') {
                const { sectionId, field, value } = event.data;
                const sec = this.designerBrand.sections.find(s => s.id === sectionId);
                if (sec) {
                    sec.settings[field] = value;
                }
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
        toggleAILookAlikeLayout() {
            if (this.isGeneratingLayout) {
                if (this.layoutAbortController) {
                    this.layoutAbortController.abort();
                    this.layoutAbortController = null;
                }
            } else {
                this.generateAILookAlikeLayout();
            }
        },
        async generateAILookAlikeLayout() {
            this.isGeneratingLayout = true;
            this.layoutAbortController = new AbortController();
            const tier = this.designerBrand ? this.designerBrand.ai_tier : 'professional';
            let modelName = 'gemini-3.1-pro';
            if (tier === 'standard') modelName = 'gemini-2.5-flash';
            else if (tier === 'enterprise') modelName = 'deep-research-pro-preview';
            this.app.startAiTicker(modelName);
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.designerBrand.id}/generate-ai-layout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                        'Content-Type': 'application/json'
                    },
                    signal: this.layoutAbortController.signal
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
                if (e.name === 'AbortError') {
                    this.lastLayoutCost = null;
                    this.app.showNotification('AI Theme generation stopped.');
                    return;
                }
                alert('AI Layout generation network error: ' + e.message);
            } finally {
                this.isGeneratingLayout = false;
                this.lastLayoutCost = this.app.aiTicker.cost * 0.92;
                this.app.stopAiTicker();
                this.layoutAbortController = null;
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
                            content_translations: theme.content_translations || overrides.content_translations || {},
                            sections: []
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
                            content_translations: overrides.content_translations || theme.content_translations || {},
                            sections: []
                        };
                    }
                    
                    let sections = [];
                    if (theme.sections && Array.isArray(theme.sections)) {
                        sections = theme.sections;
                    } else if (overrides.sections && Array.isArray(overrides.sections)) {
                        sections = overrides.sections;
                    } else {
                        sections = JSON.parse(JSON.stringify(this.defaultSections));
                    }
                    this.designerBrand.sections = sections;
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
                content_translations: this.designerBrand.content_translations,
                sections: this.designerBrand.sections
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
                sections: this.designerBrand.sections,
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
        toggleAIBulkTranslate(targetLang) {
            if (this.isBulkTranslating) {
                if (this.bulkTranslateAbortController) {
                    this.bulkTranslateAbortController.abort();
                    this.bulkTranslateAbortController = null;
                }
            } else {
                this.runAIBulkTranslate(targetLang);
            }
        },
        async runAIBulkTranslate(targetLang) {
            this.isBulkTranslating = true;
            this.bulkTranslateAbortController = new AbortController();
            const tier = this.designerBrand ? this.designerBrand.ai_tier : 'professional';
            let modelName = 'gemini-3.1-pro';
            if (tier === 'standard') modelName = 'gemini-2.5-flash';
            else if (tier === 'enterprise') modelName = 'deep-research-pro-preview';
            this.app.startAiTicker(modelName);
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
                    body: JSON.stringify({ targetLang }),
                    signal: this.bulkTranslateAbortController.signal
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
                if (e.name === 'AbortError') {
                    this.lastBulkTranslateCost = null;
                    this.app.showNotification('AI Translation stopped.');
                    return;
                }
                alert('AI translation network error: ' + e.message);
            } finally {
                this.isBulkTranslating = false;
                this.lastBulkTranslateCost = this.app.aiTicker.cost * 0.92;
                this.app.stopAiTicker();
                this.bulkTranslateAbortController = null;
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
                        sections: this.designerBrand.sections,
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
            this.designerBrand.sections = original.sections || [];
            
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
                content_translations: this.designerBrand.content_translations,
                sections: this.designerBrand.sections
            };
            this.originalBrandSettings = JSON.stringify(currentObj);
        },
        
        // --- VISUAL WEBSITE BUILDER HELPER METHODS ---
        selectSection(id) {
            this.selectedSectionId = id;
            this.selectedBlockId = '';
            const iframe = this.$refs.previewIframe;
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'HIGHLIGHT_SECTION', sectionId: id }, '*');
            }
        },
        getSelectedSection() {
            if (!this.selectedSectionId) return null;
            return this.designerBrand.sections.find(s => s.id === this.selectedSectionId);
        },
        getSelectedSectionTitle() {
            if (this.selectedSectionId === 'announcement') return 'Announcement Bar';
            if (this.selectedSectionId === 'header') return 'Header';
            if (this.selectedSectionId === 'footer') return 'Footer';
            const sec = this.getSelectedSection();
            return sec ? sec.title : 'Block';
        },
        isDynamicSection(id) {
            return id && !['announcement', 'header', 'footer'].includes(id);
        },
        isSectionType(id, type) {
            const sec = this.getSelectedSection();
            return sec && sec.type === type;
        },
        getSectionIcon(type) {
            const icons = { hero: '🌄', featured_collection: '🛍️', rich_text: '📝', collection_list: '🗂️', video: '🎥' };
            return icons[type] || '🧱';
        },
        addSection(type) {
            this.showAddSectionMenu = false;
            const secId = `sec_${Date.now()}`;
            let title = '';
            let settings = {};
            let blocks = [];
            
            if (type === 'hero') {
                title = 'Image Banner';
                settings = {
                    headline: 'Elevate Your Coffee Ritual',
                    subheadline: 'Shop precision espresso gear engineered for consistency.',
                    cta: 'Shop Now',
                    cta_link: '#products',
                    hero_img: ''
                };
            } else if (type === 'featured_collection') {
                title = 'Featured Collection';
                settings = {
                    title: 'The Precision Collection',
                    subtitle: 'Meticulously engineered tools for the discerning barista.',
                    collection_id: 'all',
                    limit: 4
                };
            } else if (type === 'rich_text') {
                title = 'Rich Text';
                settings = {
                    title: 'Obsessive Attention. Intelligent Effort.',
                    content: 'Functional products made of premium materials to improve people\'s lives in small but mighty ways.',
                    align: 'center'
                };
            } else if (type === 'collection_list') {
                title = 'Collection List';
                settings = {
                    title: 'Shop Categories'
                };
                blocks = [
                    { id: `blk_${Date.now()}_1`, type: 'collection', settings: { title: 'Wood Handles', image: '', link: '#products' } },
                    { id: `blk_${Date.now()}_2`, type: 'collection', settings: { title: 'Precision Baskets', image: '', link: '#products' } }
                ];
            } else if (type === 'video') {
                title = 'Video Section';
                settings = {
                    title: 'How we engineer consistency',
                    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-hot-coffee-into-a-cup-42283-large.mp4',
                    autoplay: true,
                    loop: true
                };
            }
            
            this.designerBrand.sections.push({
                id: secId,
                type,
                title,
                active: true,
                settings,
                blocks
            });
            
            this.selectedSectionId = secId;
            this.updatePreviewStyles();
        },
        moveSection(idx, direction) {
            const targetIdx = idx + direction;
            if (targetIdx < 0 || targetIdx >= this.designerBrand.sections.length) return;
            const temp = this.designerBrand.sections[idx];
            this.designerBrand.sections.splice(idx, 1);
            this.designerBrand.sections.splice(targetIdx, 0, temp);
            this.updatePreviewStyles();
        },
        moveSelectedSection(direction) {
            const idx = this.designerBrand.sections.findIndex(s => s.id === this.selectedSectionId);
            if (idx !== -1) {
                this.moveSection(idx, direction);
            }
        },
        toggleSectionActive(section) {
            section.active = section.active === false ? true : false;
            this.updatePreviewStyles();
        },
        deleteSelectedSection() {
            const idx = this.designerBrand.sections.findIndex(s => s.id === this.selectedSectionId);
            if (idx !== -1) {
                this.designerBrand.sections.splice(idx, 1);
                this.selectedSectionId = '';
                this.updatePreviewStyles();
            }
        },
        addCollectionBlock(section) {
            if (!section.blocks) section.blocks = [];
            section.blocks.push({
                id: `blk_${Date.now()}_${section.blocks.length + 1}`,
                type: 'collection',
                settings: {
                    title: 'New Collection',
                    image: '',
                    link: '#products'
                }
            });
            this.updatePreviewStyles();
        },
        deleteCollectionBlock(section, bIdx) {
            section.blocks.splice(bIdx, 1);
            this.updatePreviewStyles();
        },
        triggerFileUpload(fieldName) {
            const refName = `${fieldName}_file`;
            const el = this.$refs[refName];
            if (el) el.click();
        },
        async handleSectionFileUpload(event, target, fieldName) {
            const file = event.target.files[0];
            if (!file) return;
            await this.uploadSectionFile(file, target, fieldName);
        },
        handleSectionFileDrop(event, target, fieldName) {
            const file = event.dataTransfer.files[0];
            if (file) {
                this.uploadSectionFile(file, target, fieldName);
            }
        },
        triggerBlockFileUpload(blockId) {
            const refName = `block_file_${blockId}`;
            const el = this.$refs[refName];
            if (el && el[0]) el[0].click();
        },
        async handleBlockFileUpload(event, block) {
            const file = event.target.files[0];
            if (!file) return;
            
            this.app.showNotification('Uploading collection asset...');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'Storefront Designer');
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/media`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` },
                    body: formData
                });
                if (response.ok) {
                    const data = await response.json();
                    block.settings.image = data.item.url;
                    this.updatePreviewStyles();
                    this.app.showNotification('Collection image updated successfully!');
                } else {
                    alert('Upload failed.');
                }
            } catch (e) {
                alert('Upload error: ' + e.message);
            }
        },
        async uploadSectionFile(file, target, fieldName) {
            const key = `${target.id || target}_${fieldName}`;
            this.uploadingField = key;
            this.app.showNotification('Uploading asset to server storage...');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'Storefront Designer');
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/media`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` },
                    body: formData
                });
                if (response.ok) {
                    const data = await response.json();
                    const url = data.item.url;
                    if (typeof target === 'string') {
                        this.designerBrand[fieldName] = url;
                    } else {
                        target.settings[fieldName] = url;
                    }
                    this.updatePreviewStyles();
                    this.app.showNotification('Asset uploaded and linked successfully!');
                } else {
                    alert('Upload failed.');
                }
            } catch (e) {
                alert('Upload error: ' + e.message);
            } finally {
                this.uploadingField = '';
            }
        },
        async runAISectionRewrite(field) {
            const sec = this.getSelectedSection();
            if (!sec) return;
            const originalText = sec.settings[field] || '';
            this.app.showNotification('AI is optimizing headline copy...');
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.designerBrand.id}/ai-rewrite`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify({
                        text: originalText,
                        tone: 'premium',
                        field: field,
                        page: 'home'
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    sec.settings[field] = data.rewrite;
                    this.updatePreviewStyles();
                    this.app.showNotification('AI optimization complete!');
                }
            } catch (e) {
                console.error(e);
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
</style>

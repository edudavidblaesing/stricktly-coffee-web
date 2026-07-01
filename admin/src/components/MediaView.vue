<template>
    <div id="view-media" class="admin-view inset-view" :class="{ active: app.activeView === 'media' }"
        style="position: relative;"
        @dragover="handleDragOverPage"
        @dragenter="handleDragEnterPage"
        @dragleave="handleDragLeavePage"
        @drop="handleDropPage">
        
        <!-- File Drag and Drop Overlay Indicator -->
        <div v-if="isDraggingFilesOverPage" 
             style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 15, 17, 0.92); border: 3px dashed var(--accent); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1000; pointer-events: none; transition: all 0.25s ease-in-out;">
            <div style="font-size: 3.5rem; margin-bottom: 12px; animation: bounce 1.5s infinite;">📥</div>
            <h3 style="color: var(--accent); font-weight: bold; font-size: 1.3rem; margin-bottom: 4px;">Drop files to upload instantly</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem;">Uploading directly to folder "{{ activeFolder === 'All Medias' ? 'General' : activeFolder }}"</p>
        </div>

        <div style="display: grid; grid-template-columns: 240px 1fr; gap: 20px; flex: 1; min-height: 0;">
            <!-- Left Panel: Folders Navigation -->
            <div class="panel" style="height: 100%; overflow-y: auto; margin-bottom: 0;">
                <div class="panel-header">
                    <h3 class="panel-title">Folders</h3>
                    <button type="button" @click="createFolder" 
                            style="background: none; border: none; color: var(--accent); font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 0;">
                        ➕ New
                    </button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px; padding: 16px;">
                    <div v-for="folder in folders" :key="folder" style="position: relative; display: flex; align-items: center; width: 100%;">
                        <button class="btn" style="text-align: left; width: 100%; margin: 0; padding: 10px 12px; font-size: 0.85rem; font-weight: 600; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; padding-right: 32px;"
                            :style="[
                                activeFolder === folder ? 'background: var(--primary); color: var(--bg-color); border-color: var(--primary);' : 'background: none; border: none; color: var(--text-muted);',
                                dragOverFolder === folder ? 'border: 1.5px dashed var(--accent) !important; background: rgba(197, 160, 89, 0.12) !important; color: var(--accent) !important;' : ''
                            ]"
                            @dragover.prevent
                            @dragenter="dragOverFolder = folder"
                            @dragleave="dragOverFolder = null"
                            @drop="dropAssetOnFolder($event, folder)"
                            @click="activeFolder = folder">
                            <span>{{ folder }}</span>
                            <span style="font-size: 0.72rem; opacity: 0.8;">({{ getFolderCount(folder) }})</span>
                        </button>
                        <!-- Delete button for custom folders only -->
                        <button v-if="!systemFolders.includes(folder)" type="button" @click.stop="deleteFolder(folder)"
                                style="position: absolute; right: 8px; background: none; border: none; color: var(--danger); font-size: 0.75rem; cursor: pointer; opacity: 0.6; hover: opacity: 1; padding: 4px;"
                                title="Delete Folder">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>

            <!-- Right Panel: Assets Search and Grid -->
            <div class="panel" style="display: flex; flex-direction: column; height: 100%; overflow: hidden; margin-bottom: 0;">
                <div class="panel-header">
                    <h3 class="panel-title">
                        Assets Library
                        <span style="font-size: 0.72rem; background: var(--bg-color); color: var(--text-main); padding: 2px 8px; border-radius: 4px; font-weight: 700; margin-left: 6px;">
                            {{ filteredMedia.length }} assets
                        </span>
                    </h3>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-muted);">
                            <div class="checkbox-custom" :class="{ checked: isAllMediaSelected }" @click="toggleSelectAllMedia" style="width: 16px; height: 16px; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; display: inline-block;"></div>
                            <span style="user-select: none; cursor: pointer; font-weight: 600;" @click="toggleSelectAllMedia">Select All</span>
                        </div>
                        <div style="position: relative; width: 220px;">
                            <input type="text" v-model="searchQuery" placeholder="Search assets..." 
                                style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 6px 12px 6px 30px; font-size: 0.82rem; height: 32px;">
                            <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.82rem;">🔍</span>
                        </div>
                    </div>
                </div>

                <!-- Bulk Actions Toolbar -->
                <div v-if="selectedItems.length > 0" 
                     style="background: rgba(197, 160, 89, 0.08); border: 1px solid var(--accent); padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; transition: all 0.2s ease;">
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent);">
                        💼 {{ selectedItems.length }} assets selected
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <!-- Bulk Move dropdown selector -->
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Move to:</span>
                        <select @change="bulkMoveAssets($event.target.value); $event.target.value = ''" 
                                style="height: 32px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.8rem; cursor: pointer; font-weight: 600;">
                            <option value="">-- Select Folder --</option>
                            <option v-for="f in folders.slice(1)" :key="f" :value="f">{{ f }}</option>
                        </select>
                        <button type="button" @click="bulkDeleteAssets" class="btn btn-secondary" style="height: 32px; font-size: 0.8rem; font-weight: 700; color: var(--danger); border-color: rgba(239, 68, 68, 0.2); padding: 0 12px; margin: 0;">
                            🗑️ Bulk Delete
                        </button>
                        <button type="button" @click="selectedItems = []" class="btn btn-secondary" style="height: 32px; font-size: 0.8rem; font-weight: 700; padding: 0 12px; margin: 0;">
                            Cancel
                        </button>
                    </div>
                </div>

                <!-- Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; overflow-y: auto; height: calc(100vh - 290px);">
                    <div v-for="(item, idx) in filteredMedia" :key="item.id" 
                        class="panel"
                        draggable="true"
                        @dragstart="dragStartAsset($event, item, idx)"
                        @dragend="dragEndAsset"
                        @dragover.prevent
                        @drop="dropAsset($event, item, idx)"
                        @click="openAssetDetails(item)"
                        style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; transition: 0.2s; cursor: grab; position: relative; padding: 0 !important; margin-bottom: 0 !important; height: 235px;"
                        :style="draggedAsset && draggedAsset.id === item.id ? 'opacity: 0.45; border: 1.5px dashed var(--accent);' : ''"
                        @mouseenter="hoveredItem = item.id" @mouseleave="hoveredItem = null">
                        
                        <!-- Checkbox for multiselect -->
                        <div style="position: absolute; top: 8px; right: 8px; z-index: 10; display: flex; align-items: center; justify-content: center;" @click.stop>
                            <input type="checkbox" :value="item.id" v-model="selectedItems" 
                                style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--accent); margin: 0; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.3); border-radius: 4px;">
                        </div>

                        <!-- Preview compartment -->
                        <div style="height: 120px; background: var(--bg-color); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; border-bottom: 1px solid var(--border); pointer-events: none;">
                            <video v-if="isVideo(item.url)" :src="item.url" style="width: 100%; height: 100%; object-fit: cover;" muted playsinline></video>
                            <img v-else :src="optimizeImageUrl(item.url, 300)" style="width: 100%; height: 100%; object-fit: contain; background: rgba(0,0,0,0.15);">
                            
                            <!-- Overlay badge -->
                            <span style="position: absolute; top: 8px; left: 8px; font-size: 0.62rem; font-weight: 700; background: rgba(0,0,0,0.7); color: #fff; padding: 2px 6px; border-radius: 4px;">
                                {{ item.folder }}
                            </span>

                            <!-- Video Indicator Badge -->
                            <span v-if="isVideo(item.url)" style="position: absolute; bottom: 8px; right: 8px; font-size: 0.62rem; font-weight: 700; background: rgba(0,0,0,0.75); color: #fff; padding: 2px 6px; border-radius: 4px; display: flex; align-items: center; gap: 4px;">
                                <span>▶️</span> Video
                            </span>
                        </div>

                        <!-- Info Compartment -->
                        <div style="padding: 10px; display: flex; flex-direction: column; gap: 4px; flex-grow: 1; pointer-events: none;">
                            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="item.title">
                                {{ item.title }}
                            </div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
                                <span>{{ item.source_type.toUpperCase() }}</span>
                                <span>{{ formatDate(item.created_at) }}</span>
                            </div>
                            <!-- AI Linked Badges -->
                            <div v-if="item.metadata && item.metadata.ai_studio" 
                                 style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
                                <span v-if="item.metadata.ai_studio.product_id" 
                                      style="font-size: 0.58rem; font-weight: 700; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.25); color: #4ade80; padding: 1px 4px; border-radius: 3px; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                                      :title="`Product: ${item.metadata.ai_studio.product_id}`">
                                    📦 {{ item.metadata.ai_studio.product_id }}
                                </span>
                                <span v-if="item.metadata.ai_studio.persona_name" 
                                      style="font-size: 0.58rem; font-weight: 700; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.25); color: #c084fc; padding: 1px 4px; border-radius: 3px; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                                      :title="`Persona: ${item.metadata.ai_studio.persona_name}`">
                                    👥 {{ item.metadata.ai_studio.persona_name }}
                                </span>
                                <span v-if="item.metadata.ai_studio.scenery_name" 
                                      style="font-size: 0.58rem; font-weight: 700; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.25); color: #60a5fa; padding: 1px 4px; border-radius: 3px; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                                      :title="`Scenery: ${item.metadata.ai_studio.scenery_name}`">
                                    🌄 {{ item.metadata.ai_studio.scenery_name }}
                                </span>
                            </div>
                        </div>

                        <!-- Actions compartment -->
                        <div style="padding: 8px 10px; border-top: 1px solid var(--border); display: flex; gap: 6px; background: rgba(255,255,255,0.01);" @click.stop>
                            <button type="button" @click="copyUrl(item.url)" class="btn btn-secondary" style="flex: 1; font-size: 0.7rem; padding: 4px; height: auto;" title="Copy absolute link to clipboard">
                                🔗 Copy Link
                            </button>
                            <button v-if="item.source_type === 'upload'" type="button" @click="renameItem(item)" class="btn btn-secondary" style="font-size: 0.7rem; padding: 4px 6px; height: auto;" title="Rename asset">
                                ✏️
                            </button>
                            <button v-if="item.source_type === 'upload'" type="button" @click="deleteItem(item.id)" class="btn btn-secondary" style="font-size: 0.7rem; padding: 4px 6px; height: auto; color: var(--danger);" title="Delete asset">
                                🗑️
                            </button>
                        </div>
                    </div>

                    <!-- Empty state -->
                    <div v-if="filteredMedia.length === 0" style="grid-column: span 5; text-align: center; color: var(--text-muted); padding: 60px 10px;">
                        <span style="font-size: 2.5rem; display: block; margin-bottom: 12px;">📁</span>
                        <span style="font-size: 0.9rem; font-weight: 600; display: block;">No media assets found in this folder.</span>
                        <span style="font-size: 0.75rem; display: block; margin-top: 4px;">Upload custom graphics or drag-and-drop system files here!</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- UPLOAD NEW ASSET MODAL -->
        <div class="search-modal" v-if="uploadModalOpen" @click.self="uploadModalOpen = false" style="display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.6);">
            <div class="panel" @click.stop style="max-width: 420px; width: 100%; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border-radius: 12px; background: var(--workspace-bg);">
                <h3 style="font-size: 1.1rem; font-weight: bold; color: var(--text-main); margin-bottom: 16px;">📤 Upload Media Asset</h3>
                <form @submit.prevent="submitUpload">
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label>Asset Title</label>
                        <input type="text" v-model="uploadTitle" placeholder="e.g. Hero Sale Banner" required
                            style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label>Destination Folder</label>
                        <select v-model="uploadFolder" style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                            <option v-for="f in folders.slice(1)" :key="f" :value="f">{{ f }}</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 18px; border: 1.5px dashed var(--border); border-radius: 8px; padding: 20px; text-align: center; position: relative;">
                        <input type="file" @change="onFileSelected" accept="image/*,video/*" required style="opacity: 0; position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: pointer;">
                        <div v-if="selectedFile">
                            <span style="font-size: 1.5rem; display: block; margin-bottom: 4px;">
                                {{ selectedFile.type && selectedFile.type.startsWith('video/') ? '🎥' : '📄' }}
                            </span>
                            <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-main);">{{ selectedFile.name }}</span>
                            <span style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 2px;">Size: {{ formatSize(selectedFile.size) }}</span>
                        </div>
                        <div v-else>
                            <span style="font-size: 1.5rem; display: block; margin-bottom: 4px;">📁</span>
                            <span style="font-size: 0.82rem; font-weight: 600; color: var(--text-main);">Click or drag file here to select</span>
                            <span style="font-size: 0.68rem; color: var(--text-muted); display: block; margin-top: 2px;">Images or Videos up to 50MB</span>
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <button type="button" @click="uploadModalOpen = false" class="btn btn-secondary" style="flex: 1;">Cancel</button>
                        <button type="submit" class="btn" style="flex: 1; font-weight: 700;" :disabled="uploading">
                            {{ uploading ? 'Uploading...' : 'Confirm Upload' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- VIEW & EDIT ASSET DETAILS MODAL -->
        <div class="search-modal" v-if="detailsModalOpen" @click.self="closeDetailsModal" style="display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.6); z-index: 1100;">
            <div class="panel" @click.stop style="max-width: 550px; width: 100%; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border-radius: 12px; background: var(--workspace-bg); display: flex; flex-direction: column; max-height: 90vh; margin-bottom: 0;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px;">
                    <h3 style="font-size: 1.1rem; font-weight: bold; color: var(--text-main); margin: 0;">
                        {{ isProductSource ? '🛍️ Product Details & SEO Pitch' : '🗂️ Media Asset Details' }}
                    </h3>
                    <button type="button" @click="closeDetailsModal" style="background: none; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer;">✕</button>
                </div>

                <div v-if="selectedAsset" style="flex-grow: 1; overflow-y: auto; min-height: 0; padding-right: 4px; display: flex; flex-direction: column; gap: 16px;">
                    
                    <!-- Top Preview Section -->
                    <div style="display: flex; gap: 16px; align-items: flex-start; background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 8px; padding: 12px;">
                        <div style="width: 120px; height: 120px; border-radius: 6px; overflow: hidden; background: var(--bg-color); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                            <video v-if="isVideo(selectedAsset.url)" :src="selectedAsset.url" style="width: 100%; height: 100%; object-fit: cover;" controls muted></video>
                            <img v-else :src="optimizeImageUrl(selectedAsset.url, 300)" style="width: 100%; height: 100%; object-fit: contain; background: rgba(0,0,0,0.15);">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem; overflow: hidden;">
                            <span style="font-weight: 700; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ selectedAsset.title }}</span>
                            <span style="color: var(--text-muted);">Folder: <strong style="color: var(--accent);">{{ selectedAsset.folder }}</strong></span>
                            <span style="color: var(--text-muted);">Source Type: <strong>{{ selectedAsset.source_type.toUpperCase() }}</strong></span>
                            <span style="color: var(--text-muted); font-size: 0.72rem; word-break: break-all;">URL: <a :href="selectedAsset.url" target="_blank" style="color: var(--primary); text-decoration: underline;">{{ selectedAsset.url }}</a></span>
                        </div>
                    </div>

                    <!-- IF IT IS A PRODUCT SOURCE: Show Product summary & redirect button -->
                    <div v-if="isProductSource && editProduct" style="display: flex; flex-direction: column; gap: 14px; background: rgba(197, 160, 89, 0.03); border: 1px solid rgba(197, 160, 89, 0.15); border-radius: 8px; padding: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h4 style="margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 700; color: var(--text-main);">{{ editProduct.title }}</h4>
                                <span style="font-size: 0.72rem; color: var(--text-muted);">SKU: <strong>{{ editProduct.sku || 'N/A' }}</strong></span>
                            </div>
                            <span style="font-size: 1rem; font-weight: bold; color: var(--accent);">€{{ parseFloat(editProduct.price || 0).toFixed(2) }}</span>
                        </div>
                        
                        <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; border-top: 1px dashed var(--border); padding-top: 10px;">
                            <strong>Description:</strong> {{ editProduct.description || 'No description available.' }}
                        </div>

                        <!-- Features & Compatibility tags -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.75rem; border-top: 1px dashed var(--border); padding-top: 10px;">
                            <div>
                                <span style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 4px;">🏷️ Key Features</span>
                                <div style="display: flex; flex-direction: column; gap: 2px; color: var(--text-muted);">
                                    <span v-for="f in (editProductFeaturesText || '').split('\n').filter(Boolean)" :key="f">• {{ f }}</span>
                                    <span v-if="!(editProductFeaturesText || '').trim()">None</span>
                                </div>
                            </div>
                            <div>
                                <span style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 4px;">🔌 Compatibility</span>
                                <div style="display: flex; flex-direction: column; gap: 2px; color: var(--text-muted);">
                                    <span v-for="c in (editProductCompatibilityText || '').split('\n').filter(Boolean)" :key="c">• {{ c }}</span>
                                    <span v-if="!(editProductCompatibilityText || '').trim()">None</span>
                                </div>
                            </div>
                        </div>

                        <!-- AI Visual DNA & Tagging (Gemini Vision Analysis) -->
                        <div v-if="editMetadata" style="font-size: 0.75rem; border-top: 1px dashed var(--border); padding-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                            <span style="font-weight: 700; color: #8b5cf6; display: flex; align-items: center; gap: 4px;">
                                <span>✨</span> AI Visual DNA & Tagging
                            </span>
                            <div style="color: var(--text-muted); display: flex; flex-direction: column; gap: 4px; line-height: 1.4;">
                                <div v-if="editMetadata.subject"><strong>Isolated Subject:</strong> {{ editMetadata.subject }}</div>
                                <div v-if="editMetadata.setting"><strong>Setting / Backdrop:</strong> {{ editMetadata.setting }}</div>
                                <div v-if="editMetadataTags.length > 0" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                                    <span v-for="tag in editMetadataTags" :key="tag" 
                                          style="font-size: 0.65rem; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #c084fc; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
                                        #{{ tag }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style="margin-top: 8px; border-top: 1px solid var(--border); padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">
                            <button type="button" @click="editProductInCatalog(editProduct.id)" class="btn btn-primary" style="width: 100%; font-weight: 700; height: 38px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                ✏️ Open Full Catalog Editor
                            </button>
                            <span style="font-size: 0.7rem; color: var(--text-muted); text-align: center;">
                                Opens the complete catalog editor with sync, active status, tag managers, and translation contexts.
                            </span>
                        </div>
                    </div>

                    <!-- IF IT IS A MANUAL UPLOAD SOURCE: Edit title, folder, and AI analyzed metadata -->
                    <div v-else-if="editUpload && editMetadata" style="display: flex; flex-direction: column; gap: 12px;">
                        <div class="form-group">
                            <label style="font-weight: 700; font-size: 0.8rem; color: var(--text-main); display: block; margin-bottom: 4px;">Asset Title</label>
                            <input type="text" v-model="editUpload.title" style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                        </div>

                        <div class="form-group">
                            <label style="font-weight: 700; font-size: 0.8rem; color: var(--text-main); display: block; margin-bottom: 4px;">Folder</label>
                            <select v-model="editUpload.folder" style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                                <option v-for="f in folders.slice(1)" :key="f" :value="f">{{ f }}</option>
                            </select>
                        </div>

                        <!-- AI metadata details accordion/section -->
                        <div style="background: rgba(139, 92, 246, 0.04); border: 1px solid rgba(139, 92, 246, 0.15); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                            <span style="font-size: 0.72rem; font-weight: 700; color: #8b5cf6; display: flex; align-items: center; gap: 4px;">
                                <span>✨</span> AI Visual Analysis & Metadata
                            </span>
                            
                            <div class="form-group">
                                <label style="font-size: 0.65rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Visual Description</label>
                                <textarea v-model="editMetadata.description" rows="3" placeholder="No description available." style="width: 100%; border-radius: 4px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 6px; font-size: 0.78rem; font-family: inherit; resize: vertical;"></textarea>
                            </div>

                            <div class="form-group">
                                <label style="font-size: 0.65rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Tags (Press Enter to add)</label>
                                <div style="display: flex; flex-wrap: wrap; gap: 4px; border: 1px solid var(--border); background: var(--card-bg); border-radius: 4px; padding: 4px 8px; min-height: 32px; box-sizing: border-box; align-items: center; width: 100%;">
                                    <div v-for="(tag, idx) in editMetadataTags" :key="idx" 
                                         style="display: inline-flex; align-items: center; gap: 4px; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #a78bfa; padding: 1px 6px; border-radius: 3px; font-size: 0.72rem; font-weight: 700;">
                                        <span>{{ tag }}</span>
                                        <span @click="removeMediaTag(idx)" style="cursor: pointer; opacity: 0.7; font-weight: normal; margin-left: 2px;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">×</span>
                                    </div>
                                    <input type="text" v-model="newMediaTagInput" 
                                           @keydown.enter.prevent="addMediaTag" 
                                           @keydown.comma.prevent="addMediaTag"
                                           @keydown.backspace="handleMediaTagBackspace"
                                           placeholder="Type tag & press Enter" 
                                           style="flex: 1; min-width: 100px; background: transparent; border: none; outline: none; color: var(--text-main); font-size: 0.76rem; padding: 2px 0; margin: 0; height: auto;">
                                </div>
                            </div>

                            <div class="form-group">
                                <label style="font-size: 0.65rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Text Overlay (OCR)</label>
                                <input type="text" v-model="editMetadata.ocr" placeholder="No text overlays detected." style="width: 100%; border-radius: 4px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 6px; font-size: 0.78rem;">
                            </div>
                            
                            <!-- Visual Studio Session Parameters Loader -->
                            <div v-if="editMetadata && editMetadata.ai_studio" 
                                 style="background: rgba(139, 92, 246, 0.08); border: 1px dashed rgba(139, 92, 246, 0.3); border-radius: 6px; padding: 12px; margin-top: 15px;">
                                <div style="font-size: 0.72rem; color: #a78bfa; font-weight: 700; margin-bottom: 6px; text-transform: uppercase;">
                                    🎨 Visual Studio Parameters
                                </div>
                                <div style="font-size: 0.7rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px; line-height: 1.4;">
                                    <div style="word-break: break-all;"><strong>Prompt Template:</strong> {{ editMetadata.ai_studio.prompt_template }}</div>
                                    <div><strong>Model Seed:</strong> <code style="color: var(--accent);">{{ editMetadata.ai_studio.seed }}</code></div>
                                    <div><strong>AI Engine:</strong> <span style="text-transform: uppercase;">{{ editMetadata.ai_studio.backend }}</span></div>
                                </div>
                                <button type="button" @click="loadAssetInStudio" 
                                        class="btn" 
                                        style="width: 100%; height: 30px; font-size: 0.74rem; font-weight: 700; margin-top: 10px; background: #8b5cf6; color: white; border: none; border-radius: 4px; display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer;">
                                    <span>🎨 Resume in Prompt Composer</span>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                <div style="display: flex; gap: 10px; margin-top: 20px; border-top: 1px solid var(--border); padding-top: 16px;">
                    <button type="button" @click="closeDetailsModal" class="btn btn-secondary" style="flex: 1; margin: 0; height: 38px;">
                        {{ isProductSource ? 'Close' : 'Cancel' }}
                    </button>
                    <button v-if="!isProductSource" type="button" @click="saveDetailsEdits" class="btn btn-primary" style="flex: 1; margin: 0; height: 38px; font-weight: 700;" :disabled="savingEdits">
                        {{ savingEdits ? 'Saving...' : 'Save & Close' }}
                    </button>
                </div>

            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'MediaView',
    inject: ['app'],
    data() {
        return {
            mediaItems: [],
            systemFolders: ['All Medias', 'Products', 'Brand Assets', 'Campaigns', 'General'],
            customFolders: [],
            activeFolder: 'All Medias',
            searchQuery: '',
            hoveredItem: null,

            // Upload states
            uploadModalOpen: false,
            uploadTitle: '',
            uploadFolder: 'General',
            selectedFile: null,
            uploading: false,

            // Drag and Drop states
            draggedAsset: null,
            draggedIndex: null,
            dragOverFolder: null,
            isDraggingFilesOverPage: false,

            // Multiselect states
            selectedItems: [],

            // Details Modal states
            detailsModalOpen: false,
            selectedAsset: null,
            isProductSource: false,
            editProduct: null,
            editProductFeaturesText: '',
            editProductCompatibilityText: '',
            editUpload: null,
            editMetadata: null,
            editMetadataTags: [],
            newMediaTagInput: '',
            savingEdits: false
        };
    },
    computed: {
        authHeaders() {
            return {
                'Authorization': `Bearer ${this.app.adminToken}`,
                'X-Brand-Id': this.app.activeShopFilter
            };
        },
        folders() {
            return [...this.systemFolders, ...this.customFolders];
        },
        filteredMedia() {
            let items = this.mediaItems;
            if (this.activeFolder !== 'All Medias') {
                items = items.filter(i => i.folder.toLowerCase() === this.activeFolder.toLowerCase());
            }
            if (this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase();
                items = items.filter(i => {
                    const titleMatch = (i.title || '').toLowerCase().includes(query);
                    const folderMatch = (i.folder || '').toLowerCase().includes(query);
                    let metadataMatch = false;
                    if (i.metadata) {
                        const studio = i.metadata.ai_studio || {};
                        const pName = (studio.persona_name || '').toLowerCase();
                        const sName = (studio.scenery_name || '').toLowerCase();
                        const pId = (studio.product_id || '').toLowerCase();
                        if (pName.includes(query) || sName.includes(query) || pId.includes(query)) {
                            metadataMatch = true;
                        }
                        const tagsStr = (i.metadata.tags || []).join(' ').toLowerCase();
                        const ocrStr = (i.metadata.ocr || '').toLowerCase();
                        if (tagsStr.includes(query) || ocrStr.includes(query)) {
                            metadataMatch = true;
                        }
                    }
                    return titleMatch || folderMatch || metadataMatch;
                });
            }
            return items;
        },
        isAllMediaSelected() {
            return this.filteredMedia.length > 0 && this.filteredMedia.every(item => this.selectedItems.includes(item.id));
        }
    },
    watch: {
        'app.activeShopFilter': {
            immediate: true,
            handler() {
                this.loadCustomFolders();
                this.loadMedia();
                this.selectedItems = [];
            }
        },
        'app.activeView'(newView) {
            if (newView === 'media') {
                this.loadCustomFolders();
                this.loadMedia();
            }
        }
    },
    methods: {
        optimizeImageUrl(url, w, h) {
            if (!url) return '';
            if (url.includes('/uploads/')) {
                const separator = url.includes('?') ? '&' : '?';
                const params = [];
                if (w) params.push(`w=${w}`);
                if (h) params.push(`h=${h}`);
                return `${url}${separator}${params.join('&')}`;
            }
            return url;
        },
        toggleSelectAllMedia() {
            if (this.isAllMediaSelected) {
                this.selectedItems = [];
            } else {
                this.selectedItems = this.filteredMedia.map(item => item.id);
            }
        },
        isVideo(url) {
            if (!url) return false;
            const ext = url.split('.').pop().toLowerCase();
            return ['mp4', 'mov', 'webm', 'ogg', 'avi', 'mkv'].includes(ext);
        },
        loadCustomFolders() {
            const brandId = this.app.activeShopFilter || 'all';
            try {
                const saved = localStorage.getItem(`sc_custom_folders_${brandId}`);
                if (saved) {
                    this.customFolders = JSON.parse(saved);
                } else {
                    this.customFolders = [];
                }
            } catch(e) {
                this.customFolders = [];
            }
        },
        saveCustomFolders() {
            const brandId = this.app.activeShopFilter || 'all';
            localStorage.setItem(`sc_custom_folders_${brandId}`, JSON.stringify(this.customFolders));
        },
        createFolder() {
            const name = prompt('Enter a name for the new folder:');
            if (!name || !name.trim()) return;
            const cleanName = name.trim();
            // Prevent duplicates
            if (this.folders.map(f => f.toLowerCase()).includes(cleanName.toLowerCase())) {
                alert('A folder with this name already exists.');
                return;
            }
            this.customFolders.push(cleanName);
            this.saveCustomFolders();
            this.app.showNotification(`Created folder "${cleanName}"`);
        },
        async deleteFolder(folderName) {
            if (this.systemFolders.includes(folderName)) return; // System folders locked!
            
            if (!confirm(`Are you sure you want to delete the folder "${folderName}"? All assets currently inside will be moved to "General".`)) return;

            // Find all assets in this custom folder and update them to "General"
            const itemsToMove = this.mediaItems.filter(i => i.folder.toLowerCase() === folderName.toLowerCase());
            if (itemsToMove.length > 0) {
                this.app.showNotification(`Moving ${itemsToMove.length} items to General...`);
                try {
                    for (const item of itemsToMove) {
                        await fetch(`/api/global/media/${item.id}`, {
                            method: 'PUT',
                            headers: {
                                ...this.authHeaders,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ title: item.title, folder: 'General' })
                        });
                    }
                } catch(e) {
                    console.error(e);
                }
            }

            // Remove from customFolders
            this.customFolders = this.customFolders.filter(f => f !== folderName);
            this.saveCustomFolders();
            if (this.activeFolder === folderName) {
                this.activeFolder = 'All Medias';
            }
            this.app.showNotification(`Folder "${folderName}" deleted.`);
            this.loadMedia();
        },
        async loadMedia() {
            try {
                const response = await fetch('/api/global/media', {
                    headers: this.authHeaders
                });
                if (response.ok) {
                    this.mediaItems = await response.json();
                }
            } catch (err) {
                console.error('Error loading media library:', err);
            }
        },
        getFolderCount(folder) {
            if (folder === 'All Medias') return this.mediaItems.length;
            return this.mediaItems.filter(i => i.folder.toLowerCase() === folder.toLowerCase()).length;
        },
        formatDate(dateStr) {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            } catch(e) {
                return dateStr;
            }
        },
        formatSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        },
        copyUrl(url) {
            const absoluteUrl = window.location.origin + url;
            navigator.clipboard.writeText(absoluteUrl).then(() => {
                this.app.showNotification('Public asset link copied to clipboard!');
            }).catch(err => {
                alert('Could not copy link: ' + err.message);
            });
        },
        renameItem(item) {
            const newTitle = prompt('Rename Asset Title:', item.title);
            if (newTitle === null || !newTitle.trim()) return;

            fetch(`/api/global/media/${item.id}`, {
                method: 'PUT',
                headers: {
                    ...this.authHeaders,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: newTitle.trim(), folder: item.folder })
            }).then(async response => {
                if (response.ok) {
                    this.app.showNotification('Asset renamed successfully!');
                    this.loadMedia();
                } else {
                    alert('Failed to rename asset.');
                }
            }).catch(err => {
                console.error(err);
            });
        },
        deleteItem(id) {
            if (!confirm('Are you sure you want to permanently delete this uploaded asset?')) return;

            fetch(`/api/global/media/${id}`, {
                method: 'DELETE',
                headers: this.authHeaders
            }).then(async response => {
                if (response.ok) {
                    this.app.showNotification('Asset deleted.');
                    this.loadMedia();
                } else {
                    alert('Failed to delete asset.');
                }
            }).catch(err => {
                console.error(err);
            });
        },
        openUploadModal() {
            this.uploadTitle = '';
            this.uploadFolder = this.activeFolder === 'All Medias' ? 'General' : this.activeFolder;
            this.selectedFile = null;
            this.uploadModalOpen = true;
        },
        onFileSelected(e) {
            const file = e.target.files[0];
            if (file) {
                this.selectedFile = file;
                if (!this.uploadTitle) {
                    this.uploadTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                }
            }
        },
        async submitUpload() {
            if (!this.selectedFile) return;
            this.uploading = true;

            const formData = new FormData();
            formData.append('file', this.selectedFile);
            formData.append('title', this.uploadTitle);
            formData.append('folder', this.uploadFolder);

            try {
                const response = await fetch('/api/global/media', {
                    method: 'POST',
                    headers: this.authHeaders,
                    body: formData
                });
                if (response.ok) {
                    this.app.showNotification('Asset uploaded to media library.');
                    this.uploadModalOpen = false;
                    this.loadMedia();
                } else {
                    alert('Upload failed.');
                }
            } catch (err) {
                console.error(err);
                alert('Error uploading file: ' + err.message);
            } finally {
                this.uploading = false;
            }
        },

        // DRAG AND DROP ASSETS METHODS
        dragStartAsset(event, item, index) {
            this.draggedAsset = item;
            this.draggedIndex = index;
            event.dataTransfer.setData('text/plain', item.id);
            event.dataTransfer.effectAllowed = 'move';
        },
        dragEndAsset() {
            this.draggedAsset = null;
            this.draggedIndex = null;
        },
        dropAsset(event, targetItem, targetIndex) {
            event.preventDefault();
            if (this.draggedAsset && this.draggedAsset.id !== targetItem.id) {
                const srcIdx = this.mediaItems.findIndex(i => i.id === this.draggedAsset.id);
                const destIdx = this.mediaItems.findIndex(i => i.id === targetItem.id);
                
                if (srcIdx !== -1 && destIdx !== -1) {
                    const [removed] = this.mediaItems.splice(srcIdx, 1);
                    this.mediaItems.splice(destIdx, 0, removed);
                    this.app.showNotification('Reordered assets in folder view.');
                }
            }
        },
        async dropAssetOnFolder(event, targetFolder) {
            event.preventDefault();
            this.dragOverFolder = null;
            this.isDraggingFilesOverPage = false;

            if (event.dataTransfer.types.includes('Files')) {
                const files = event.dataTransfer.files;
                if (files && files.length > 0) {
                    let folder = targetFolder;
                    if (folder === 'All Medias') {
                        folder = 'General';
                    }
                    this.app.showNotification(`Uploading ${files.length} dropped files to folder "${folder}"...`);
                    for (let i = 0; i < files.length; i++) {
                        await this.uploadFileDirectly(files[i], folder);
                    }
                }
            } else {
                const mediaId = event.dataTransfer.getData('text/plain');
                if (mediaId) {
                    const matched = this.mediaItems.find(i => String(i.id) === String(mediaId));
                    if (matched) {
                        if (targetFolder === 'All Medias') return;
                        try {
                            const response = await fetch(`/api/global/media/${matched.id}`, {
                                method: 'PUT',
                                headers: {
                                    ...this.authHeaders,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ title: matched.title, folder: targetFolder })
                            });
                            
                            if (response.ok) {
                                matched.folder = targetFolder;
                                this.app.showNotification(`Moved "${matched.title}" to ${targetFolder}`);
                                this.loadMedia();
                            } else {
                                this.app.showNotification('Could not move asset to target folder.');
                            }
                        } catch(e) {
                            console.error(e);
                        }
                    }
                }
            }
        },
        handleDragOverPage(event) {
            if (event.dataTransfer.types.includes('Files')) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
                this.isDraggingFilesOverPage = true;
            }
        },
        handleDragEnterPage(event) {
            if (event.dataTransfer.types.includes('Files')) {
                event.preventDefault();
                this.isDraggingFilesOverPage = true;
            }
        },
        handleDragLeavePage(event) {
            const rect = this.$el.getBoundingClientRect();
            if (
                event.clientX < rect.left ||
                event.clientX >= rect.right ||
                event.clientY < rect.top ||
                event.clientY >= rect.bottom
            ) {
                this.isDraggingFilesOverPage = false;
            }
        },
        async handleDropPage(event) {
            if (event.dataTransfer.types.includes('Files')) {
                event.preventDefault();
                this.isDraggingFilesOverPage = false;
                const files = event.dataTransfer.files;
                if (files && files.length > 0) {
                    let targetFolder = this.activeFolder;
                    if (targetFolder === 'All Medias') {
                        targetFolder = 'General';
                    }
                    this.app.showNotification(`Uploading ${files.length} dropped files to folder "${targetFolder}"...`);
                    for (let i = 0; i < files.length; i++) {
                        await this.uploadFileDirectly(files[i], targetFolder);
                    }
                }
            }
        },
        async uploadFileDirectly(file, folder) {
            const title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', title);
            formData.append('folder', folder);

            try {
                const response = await fetch('/api/global/media', {
                    method: 'POST',
                    headers: this.authHeaders,
                    body: formData
                });
                if (response.ok) {
                    this.app.showNotification(`Uploaded "${title}" to folder ${folder}`);
                    this.loadMedia();
                } else {
                    this.app.showNotification(`Failed uploading "${title}"`);
                }
            } catch(e) {
                console.error(e);
            }
        },

        // MULTISELECT BATCH ACTIONS
        async bulkMoveAssets(targetFolder) {
            if (!targetFolder) return;
            const itemsToMove = this.selectedItems.filter(id => {
                const item = this.mediaItems.find(i => i.id === id);
                return item && item.source_type === 'upload';
            });
            if (itemsToMove.length === 0) {
                this.app.showNotification('Only manual uploaded assets can be batch moved.');
                return;
            }

            this.app.showNotification(`Moving ${itemsToMove.length} items to "${targetFolder}"...`);
            try {
                for (const id of itemsToMove) {
                    const matched = this.mediaItems.find(i => i.id === id);
                    if (matched) {
                        await fetch(`/api/global/media/${id}`, {
                            method: 'PUT',
                            headers: {
                                ...this.authHeaders,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ title: matched.title, folder: targetFolder })
                        });
                    }
                }
                this.selectedItems = [];
                this.app.showNotification('Batch folder move complete.');
                this.loadMedia();
            } catch(e) {
                console.error(e);
            }
        },
        async bulkDeleteAssets() {
            const uploadsToDelete = this.selectedItems.filter(id => {
                const item = this.mediaItems.find(i => i.id === id);
                return item && item.source_type === 'upload';
            });
            if (uploadsToDelete.length === 0) {
                this.app.showNotification('Only manual uploaded assets can be batch deleted.');
                return;
            }

            if (!confirm(`Are you sure you want to permanently delete these ${uploadsToDelete.length} assets?`)) return;

            this.app.showNotification(`Deleting ${uploadsToDelete.length} assets...`);
            try {
                for (const id of uploadsToDelete) {
                    await fetch(`/api/global/media/${id}`, {
                        method: 'DELETE',
                        headers: this.authHeaders
                    });
                }
                this.selectedItems = [];
                this.app.showNotification('Batch files deletion complete.');
                this.loadMedia();
            } catch(e) {
                console.error(e);
            }
        },
        openAssetDetails(item) {
            this.selectedAsset = item;
            const isProd = String(item.id).startsWith('prod_') || String(item.id).startsWith('prod-img-') || item.source_type === 'product';
            this.isProductSource = isProd;

            if (isProd) {
                const prodId = Number(String(item.id).replace(/[^0-9]/g, ''));
                const foundProd = this.app.products.find(p => p.id === prodId);
                if (foundProd) {
                    this.editProduct = { ...foundProd };
                    // Parse features and compatibility arrays
                    let featuresArr = [];
                    if (foundProd.features) {
                        try {
                            featuresArr = typeof foundProd.features === 'string' ? JSON.parse(foundProd.features) : foundProd.features;
                        } catch(e) {
                            featuresArr = [foundProd.features];
                        }
                    }
                    this.editProductFeaturesText = Array.isArray(featuresArr) ? featuresArr.join('\n') : '';

                    let compatibilityArr = [];
                    if (foundProd.compatibility) {
                        try {
                            compatibilityArr = typeof foundProd.compatibility === 'string' ? JSON.parse(foundProd.compatibility) : foundProd.compatibility;
                        } catch(e) {
                            compatibilityArr = [foundProd.compatibility];
                        }
                    }
                    this.editProductCompatibilityText = Array.isArray(compatibilityArr) ? compatibilityArr.join('\n') : '';
                } else {
                    this.editProduct = {
                        id: prodId,
                        title: item.title,
                        description: 'SEO pitch content.',
                        long_description: 'Detailed description.',
                        price: 55.00,
                        sku: ''
                    };
                    this.editProductFeaturesText = '';
                    this.editProductCompatibilityText = '';
                }
                this.editMetadata = item.metadata ? { ...item.metadata } : null;
                const tagsArr = this.editMetadata ? (this.editMetadata.keywords || this.editMetadata.tags || []) : [];
                this.editMetadataTags = Array.isArray(tagsArr) ? [...tagsArr] : [];
            } else {
                this.editUpload = {
                    id: item.id,
                    title: item.title,
                    folder: item.folder
                };
                this.editMetadata = item.metadata ? { ...item.metadata } : { description: '', tags: [], ocr: '' };
                const tagsArr = this.editMetadata.tags || [];
                this.editMetadataTags = Array.isArray(tagsArr) ? [...tagsArr] : [];
                this.newMediaTagInput = '';
            }
            this.detailsModalOpen = true;
        },
        closeDetailsModal() {
            this.detailsModalOpen = false;
            this.selectedAsset = null;
            this.editProduct = null;
            this.editUpload = null;
            this.editMetadata = null;
        },
        async saveDetailsEdits() {
            this.savingEdits = true;
            try {
                if (this.newMediaTagInput.trim()) {
                    const newTag = this.newMediaTagInput.trim();
                    if (!this.editMetadataTags.includes(newTag)) {
                        this.editMetadataTags.push(newTag);
                    }
                    this.newMediaTagInput = '';
                }
                this.editMetadata.tags = [...this.editMetadataTags];

                const response = await fetch(`/api/global/media/${this.editUpload.id}`, {
                    method: 'PUT',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title: this.editUpload.title,
                        folder: this.editUpload.folder,
                        metadata: this.editMetadata
                    })
                });

                if (response.ok) {
                    this.app.showNotification('Media asset updated successfully.');
                    this.closeDetailsModal();
                    await this.loadMedia();
                } else {
                    const err = await response.json();
                    alert(`Error saving edits: ${err.error || 'Unknown error'}`);
                }
            } catch(e) {
                alert(`Error saving edits: ${e.message}`);
            } finally {
                this.savingEdits = false;
            }
        },
        editProductInCatalog(id) {
            this.closeDetailsModal();
            this.app.editProductById(id);
        },
        addMediaTag() {
            const clean = this.newMediaTagInput.trim();
            if (clean && !this.editMetadataTags.includes(clean)) {
                this.editMetadataTags.push(clean);
            }
            this.newMediaTagInput = '';
        },
        removeMediaTag(idx) {
            this.editMetadataTags.splice(idx, 1);
        },
        handleMediaTagBackspace() {
            if (!this.newMediaTagInput && this.editMetadataTags.length > 0) {
                this.editMetadataTags.pop();
            }
        },
        loadAssetInStudio() {
            if (!this.editMetadata || !this.editMetadata.ai_studio) return;
            const studio = this.editMetadata.ai_studio;
            if (this.selectedAsset && this.selectedAsset.brand_id) {
                this.app.activeShopFilter = this.selectedAsset.brand_id;
            }
            this.app.loadedStudioParams = {
                promptTemplate: studio.prompt_template,
                seed: studio.seed,
                lockSeed: true,
                cameraLens: studio.camera_lens || '',
                lightingStyle: studio.lighting_style || '',
                composition: studio.composition || '',
                backend: studio.backend || 'imagen',
                format: studio.format || 'image',
                productId: studio.product_id || '',
                personaName: studio.persona_name || '',
                sceneryName: studio.scenery_name || ''
            };
            this.closeDetailsModal();
            this.app.switchView('brand-center');
        }
    }
}
</script>

<style scoped>
@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}
</style>

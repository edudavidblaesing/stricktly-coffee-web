<template>
    <div id="view-products" class="admin-view inset-view" :class="{ active: app.activeView === 'products' }">

        <!-- ADD PRODUCT MODAL -->
        <div class="upcoming-modal" v-if="showAddProductModal" @click.self="closeAddProductModal">
            <div class="upcoming-card" @click.stop style="max-width: 600px; width: 100%; text-align: left; padding: 24px; max-height: 90vh; overflow-y: auto; border-radius: 12px;">
                <h3 style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; color: var(--text-main); margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
                    <span>Add Product to Catalog</span>
                    <span @click="closeAddProductModal" style="cursor: pointer; font-size: 1.1rem; color: var(--text-muted);">&times;</span>
                </h3>
                
                <form @submit.prevent="submitNewProduct">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group" style="grid-column: span 2;">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Select Target Brand Shop</label>
                            <select v-model="newProduct.brand_id" :disabled="activeShopFilter !== 'all'" required @change="handleBrandChange" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; cursor: pointer;">
                                <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
                            </select>
                        </div>

                        <!-- Connected store Quick Import selector -->
                        <div class="form-group style-group" style="grid-column: span 2; border: 1px solid var(--accent); padding: 12px; border-radius: 8px; background: rgba(197, 160, 89, 0.02);" v-if="apiProducts.length > 0 || loadingApiProducts">
                            <label style="font-weight: 700; font-size: 0.8rem; color: var(--accent); display: block; margin-bottom: 6px;">🔌 Quick Import from connected store (Shopify/WooCommerce)</label>
                            <div v-if="loadingApiProducts" style="font-size: 0.82rem; color: var(--text-muted); padding: 8px 0;">
                                <span class="spinner" style="width: 14px; height: 14px; border-width: 2px; display: inline-block; vertical-align: middle; margin-right: 6px;"></span>
                                Scanning connected store catalog...
                            </div>
                            <div v-else>
                                <!-- Custom searchable product list with thumbnails -->
                                <div style="position: relative; margin-bottom: 8px;">
                                    <input type="text" v-model="importSearchQuery" placeholder="🔍 Search connected store products..."
                                        style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 8px 12px; font-size: 0.85rem; margin-bottom: 8px;">
                                </div>
                                <div style="border: 1px solid var(--border); border-radius: 6px; max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; background: var(--workspace-bg);">
                                    <div v-for="p in filteredApiProducts" :key="p.id" 
                                        @click="selectImportProduct(p)" 
                                        class="import-product-row"
                                        style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid var(--border); cursor: pointer; transition: 0.2s;"
                                        :style="String(selectedApiProductId) === String(p.id) ? 'background: rgba(197, 160, 89, 0.1); border-left: 3px solid var(--accent); padding-left: 9px;' : 'hover: background: rgba(255,255,255,0.02);'">
                                        <div style="width: 32px; height: 32px; border-radius: 4px; overflow: hidden; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid var(--border);">
                                            <img :src="p.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=60'" style="width: 100%; height: 100%; object-fit: contain;">
                                        </div>
                                        <div style="flex-grow: 1; min-width: 0;">
                                            <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ p.title }}</div>
                                            <div style="font-size: 0.68rem; color: var(--text-muted);">ID: {{ p.id }}</div>
                                        </div>
                                        <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent); flex-shrink: 0;">
                                            €{{ parseFloat(p.price || 55).toFixed(2) }}
                                        </div>
                                    </div>
                                    <div v-if="filteredApiProducts.length === 0" style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
                                        No matching connected products.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Language selector tabs if multi-language -->
                        <div class="lang-tabs" style="display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px; grid-column: span 2;" v-if="activeLanguages.length > 1">
                            <button type="button" 
                                    v-for="lang in activeLanguages" 
                                    :key="lang" 
                                    @click="activeLangTab = lang"
                                    class="tab-pill" 
                                    :style="activeLangTab === lang ? 'background: var(--accent); color: var(--bg-color); border: 1px solid var(--accent);' : 'background: none; border: 1px solid var(--border); color: var(--text-muted);'"
                                    style="padding: 6px 12px; font-size: 0.78rem; text-transform: uppercase; font-weight: 700; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; outline: none; transition: all 0.2s ease;">
                                {{ getLangFlag(lang) }}
                            </button>
                        </div>

                        <div class="form-group" style="grid-column: span 2;" v-if="activeLangTab === 'en'">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Product Name / Title</label>
                            <input type="text" v-model="newProduct.title" required placeholder="Self-Leveling Spring Tamper" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>
                        <div class="form-group" style="grid-column: span 2;" v-else>
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Product Name / Title ({{ activeLangTab.toUpperCase() }})</label>
                            <input type="text" v-model="getTranslationRef('new', activeLangTab).title" placeholder="Translated title..." style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>

                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Retail Price (EUR)</label>
                            <input type="number" step="0.01" min="0.01" v-model="newProduct.price" required placeholder="132.00" style="width: 100%; height: 38px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; line-height: 38px;">
                        </div>

                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Catalog Tag Badge (Optional)</label>
                            <input type="text" v-model="newProduct.tag" placeholder="Best Seller" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>

                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Product SKU (Stock Code)</label>
                            <input type="text" v-model="newProduct.sku" placeholder="ESP-BASKET-18" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>

                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">External Integration ID</label>
                            <input type="text" v-model="newProduct.external_id" placeholder="shopify-variant-9812" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>

                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">E-Commerce Stock Quantity</label>
                            <input type="number" v-model="newProduct.inventory_quantity" placeholder="e.g. 50 (blank for unlimited)" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>

                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Strictly Coffee Sales Limit Allocation</label>
                            <input type="number" v-model="newProduct.sales_limit" placeholder="e.g. 100 (blank for unlimited)" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>

                        <div class="form-group" style="grid-column: span 2;">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Product Image (URL or Drag & Drop / Click to Upload)</label>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <input type="url" v-model="newProduct.image" placeholder="https://pesado585.com/.../img.png" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; margin: 0;">
                                <div 
                                    class="uploader-box"
                                    style="border: 2px dashed var(--border); border-radius: 8px; padding: 18px; text-align: center; cursor: pointer; transition: all 0.2s ease; position: relative; background: rgba(255,255,255,0.01);"
                                    @click="$refs.addProductImageInput.click()"
                                    @dragover.prevent="onDragOver"
                                    @dragleave.prevent="onDragLeave"
                                    @drop.prevent="onAddProductDrop"
                                >
                                    <input type="file" ref="addProductImageInput" accept="image/*" style="display: none;" @change="onAddProductFileSelect">
                                    
                                    <div v-if="productUploading" style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                                        <span class="spinner" style="width: 24px; height: 24px; border-width: 3px;"></span>
                                        <span style="font-size: 0.85rem; color: var(--text-muted);">Uploading image...</span>
                                    </div>
                                    <div v-else-if="newProduct.image" style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                                        <img :src="newProduct.image" style="max-height: 100px; max-width: 100%; object-fit: contain; border-radius: 6px;">
                                        <span style="font-size: 0.78rem; color: var(--text-muted);">Drop new image or click to replace</span>
                                    </div>
                                    <div v-else style="display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 0;">
                                        <span style="font-size: 1.5rem;">🖼️</span>
                                        <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">Drop product image here</span>
                                        <span style="font-size: 0.75rem; color: var(--text-muted);">or click to select file</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group" style="grid-column: span 2;">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Original Product Manufacturer Link</label>
                            <input type="url" v-model="newProduct.original_link" placeholder="https://pesado585.com/products/self-leveling-tamper" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>

                        <template v-if="activeLangTab === 'en'">
                            <div class="form-group" style="grid-column: span 2;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                    <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); margin: 0;">Short Description</label>
                                    <button type="button" @click="toggleAiSeo('new')" class="sc-ai-button" style="padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; height: 26px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; margin: 0;">
                                        <span v-if="!app.isFeatureAllowed('allow_seo')">🔒 Write AI SEO Pitch</span>
                                        <span v-else-if="generatingSeo">⏳ [€{{ (app.aiTicker.cost * 0.92).toFixed(4) }} | 🛑 Stop]</span>
                                        <span v-else-if="lastSeoCost">✨ Write AI SEO Pitch [Gemini 2.5 Flash] [Last: €{{ lastSeoCost.toFixed(4) }}]</span>
                                        <span v-else>✨ Write AI SEO Pitch [Gemini 2.5 Flash] [Est: {{ seoEstCost }}]</span>
                                    </button>
                                    <AiEstimateBadge v-if="app.isFeatureAllowed('allow_seo') && !generatingSeo" operation="Product SEO Content Generation" :inputText="newProduct.long_description || newProduct.title" />
                                </div>
                                <textarea v-model="newProduct.description" rows="2" placeholder="Brief summary of the precision tool..." style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                            </div>

                            <div class="form-group" style="grid-column: span 2;">
                                <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Detailed Description (Optional)</label>
                                <textarea v-model="newProduct.long_description" rows="4" placeholder="Full marketing copywriting..." style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                            </div>
                        </template>
                        <template v-else>
                            <div class="form-group" style="grid-column: span 2;">
                                <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Short Description ({{ activeLangTab.toUpperCase() }})</label>
                                <textarea v-model="getTranslationRef('new', activeLangTab).description" rows="2" placeholder="Brief summary in other language..." style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                            </div>

                            <div class="form-group" style="grid-column: span 2;">
                                <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Detailed Description ({{ activeLangTab.toUpperCase() }})</label>
                                <textarea v-model="getTranslationRef('new', activeLangTab).long_description" rows="4" placeholder="Full marketing copy in other language..." style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                            </div>
                        </template>

                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Key Features (One per line)</label>
                            <textarea v-model="newProduct.features" rows="4" placeholder="Feature 1&#10;Feature 2" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                        </div>

                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Machine Compatibility (One per line)</label>
                            <textarea v-model="newProduct.compatibility" rows="4" placeholder="Breville 54mm&#10;E61 Group Heads" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                        </div>

                        <div class="form-group form-full" style="grid-column: span 2; margin-top: 16px;">
                            <button type="submit" class="btn" style="width: 100%; height: 42px; font-weight: 700;">Add Product to Catalog</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- EDIT PRODUCT MODAL -->
        <div class="upcoming-modal" v-if="showEditProductModal" @click.self="closeEditProductModal">
            <div class="upcoming-card" @click.stop style="max-width: 600px; width: 100%; text-align: left; padding: 24px; max-height: 90vh; overflow-y: auto; border-radius: 12px;">
                <h3 style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; color: var(--text-main); margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
                    <span>Edit Product Details</span>
                    <span @click="closeEditProductModal" style="cursor: pointer; font-size: 1.1rem; color: var(--text-muted);">&times;</span>
                </h3>
                
                <form @submit.prevent="submitUpdatedProduct">
                    <!-- Sync Configuration options (only visible if external_id is present) -->
                    <div v-if="editingProduct.external_id" style="background: rgba(59, 130, 246, 0.05); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 12px 0; font-size: 0.9rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                            <span>🔌 Integration Sync Settings</span>
                            <span style="font-size: 0.72rem; background: var(--border); padding: 2px 6px; border-radius: 4px; font-weight: 600;">External Shop Product</span>
                        </h4>
                        
                        <!-- Price sync toggle -->
                        <div style="margin-bottom: 12px;">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Retail Price Sync</label>
                            <div style="display: flex; gap: 16px;">
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; color: var(--text-main);">
                                    <input type="radio" v-model="editingProduct.price_source" value="external">
                                    <span>Sync with External Shop</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; color: var(--text-main);">
                                    <input type="radio" v-model="editingProduct.price_source" value="manual">
                                    <span>Override Price Manually</span>
                                </label>
                            </div>
                        </div>

                        <!-- Details sync toggle -->
                        <div>
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Product Content Sync (Title, Description, Image, features, compatibility)</label>
                            <div style="display: flex; gap: 16px;">
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; color: var(--text-main);">
                                    <input type="radio" v-model="editingProduct.details_source" value="external">
                                    <span>Sync with External Shop</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; color: var(--text-main);">
                                    <input type="radio" v-model="editingProduct.details_source" value="manual">
                                    <span>Override Content Manually</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <!-- Language selector tabs if multi-language -->
                        <div class="lang-tabs" style="display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px; grid-column: span 2;" v-if="activeLanguages.length > 1">
                            <button type="button" 
                                    v-for="lang in activeLanguages" 
                                    :key="lang" 
                                    @click="activeLangTab = lang"
                                    class="tab-pill" 
                                    :style="activeLangTab === lang ? 'background: var(--accent); color: var(--bg-color); border: 1px solid var(--accent);' : 'background: none; border: 1px solid var(--border); color: var(--text-muted);'"
                                    style="padding: 6px 12px; font-size: 0.78rem; text-transform: uppercase; font-weight: 700; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; outline: none; transition: all 0.2s ease;">
                                {{ getLangFlag(lang) }}
                            </button>
                        </div>

                        <div class="form-group" style="grid-column: span 2;" v-if="activeLangTab === 'en'">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Product Name / Title</label>
                            <input type="text" v-model="editingProduct.title" required :disabled="editingProduct.details_source === 'external'" placeholder="Self-Leveling Spring Tamper" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>
                        <div class="form-group" style="grid-column: span 2;" v-else>
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Product Name / Title ({{ activeLangTab.toUpperCase() }})</label>
                            <input type="text" v-model="getTranslationRef('edit', activeLangTab).title" :disabled="editingProduct.details_source === 'external'" placeholder="Translated title..." style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>

                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Retail Price (EUR)</label>
                            <input type="number" step="0.01" min="0.01" v-model="editingProduct.price" required :disabled="editingProduct.price_source === 'external'" placeholder="132.00" style="width: 100%; height: 38px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; line-height: 38px;">
                        </div>

                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Catalog Tag Badge (Optional)</label>
                            <input type="text" v-model="editingProduct.tag" placeholder="Best Seller" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>

                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Product SKU (Stock Code)</label>
                            <input type="text" v-model="editingProduct.sku" placeholder="ESP-BASKET-18" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>

                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">External Integration ID</label>
                            <input type="text" v-model="editingProduct.external_id" placeholder="shopify-variant-9812" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>

                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">E-Commerce Stock Quantity</label>
                            <input type="number" v-model="editingProduct.inventory_quantity" placeholder="e.g. 50 (blank for unlimited)" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>

                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Strictly Coffee Sales Limit Allocation</label>
                            <input type="number" v-model="editingProduct.sales_limit" placeholder="e.g. 100 (blank for unlimited)" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>

                        <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
                            <input type="checkbox" id="edit-prod-active" v-model="editingProduct.active" :true-value="1" :false-value="0" style="width: 18px; height: 18px; cursor: pointer; margin: 0;">
                            <label for="edit-prod-active" style="font-weight: 600; font-size: 0.82rem; color: var(--text-main); cursor: pointer; margin: 0;">Active in Catalog</label>
                        </div>

                        <div class="form-group" style="grid-column: span 2;">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Product Image (URL or Drag & Drop / Click to Upload)</label>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <input type="url" v-model="editingProduct.image" :disabled="editingProduct.details_source === 'external'" placeholder="https://pesado585.com/.../img.png" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; margin: 0;">
                                <div 
                                    v-if="editingProduct.details_source !== 'external'"
                                    class="uploader-box"
                                    style="border: 2px dashed var(--border); border-radius: 8px; padding: 18px; text-align: center; cursor: pointer; transition: all 0.2s ease; position: relative; background: rgba(255,255,255,0.01);"
                                    @click="$refs.editProductImageInput.click()"
                                    @dragover.prevent="onDragOver"
                                    @dragleave.prevent="onDragLeave"
                                    @drop.prevent="onEditProductDrop"
                                >
                                    <input type="file" ref="editProductImageInput" accept="image/*" style="display: none;" @change="onEditProductFileSelect">
                                    
                                    <div v-if="productUploading" style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                                        <span class="spinner" style="width: 24px; height: 24px; border-width: 3px;"></span>
                                        <span style="font-size: 0.85rem; color: var(--text-muted);">Uploading image...</span>
                                    </div>
                                    <div v-else-if="editingProduct.image" style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                                        <img :src="editingProduct.image" style="max-height: 100px; max-width: 100%; object-fit: contain; border-radius: 6px;">
                                        <span style="font-size: 0.78rem; color: var(--text-muted);">Drop new image or click to replace</span>
                                    </div>
                                    <div v-else style="display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 0;">
                                        <span style="font-size: 1.5rem;">🖼️</span>
                                        <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">Drop product image here</span>
                                        <span style="font-size: 0.75rem; color: var(--text-muted);">or click to select file</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group" style="grid-column: span 2;">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Original Product Manufacturer Link</label>
                            <input type="url" v-model="editingProduct.original_link" placeholder="https://pesado585.com/products/self-leveling-tamper" style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>

                        <template v-if="activeLangTab === 'en'">
                            <div class="form-group" style="grid-column: span 2;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                    <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); margin: 0;">Short Description</label>
                                    <button type="button" @click="toggleAiSeo('edit')" :disabled="editingProduct.details_source === 'external'" class="sc-ai-button" style="padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; height: 26px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; margin: 0;">
                                        <span v-if="!app.isFeatureAllowed('allow_seo')">🔒 Write AI SEO Pitch</span>
                                        <span v-else-if="generatingSeo">⏳ [€{{ (app.aiTicker.cost * 0.92).toFixed(4) }} | 🛑 Stop]</span>
                                        <span v-else-if="lastSeoCost">✨ Write AI SEO Pitch [Gemini 2.5 Flash] [Last: €{{ lastSeoCost.toFixed(4) }}]</span>
                                        <span v-else>✨ Write AI SEO Pitch [Gemini 2.5 Flash] [Est: {{ seoEditEstCost }}]</span>
                                    </button>
                                    <AiEstimateBadge v-if="app.isFeatureAllowed('allow_seo') && !generatingSeo && editingProduct.details_source !== 'external'" operation="Product SEO Content Generation" :inputText="editingProduct.long_description || editingProduct.title" />
                                </div>
                                <textarea v-model="editingProduct.description" :disabled="editingProduct.details_source === 'external'" rows="2" placeholder="Brief summary of the precision tool..." style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                            </div>

                            <div class="form-group" style="grid-column: span 2;">
                                <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Detailed Description (Optional)</label>
                                <textarea v-model="editingProduct.long_description" :disabled="editingProduct.details_source === 'external'" rows="4" placeholder="Full marketing copywriting..." style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                            </div>
                        </template>
                        <template v-else>
                            <div class="form-group" style="grid-column: span 2;">
                                <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Short Description ({{ activeLangTab.toUpperCase() }})</label>
                                <textarea v-model="getTranslationRef('edit', activeLangTab).description" :disabled="editingProduct.details_source === 'external'" rows="2" placeholder="Brief summary in other language..." style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                            </div>

                            <div class="form-group" style="grid-column: span 2;">
                                <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Detailed Description ({{ activeLangTab.toUpperCase() }})</label>
                                <textarea v-model="getTranslationRef('edit', activeLangTab).long_description" :disabled="editingProduct.details_source === 'external'" rows="4" placeholder="Full marketing copy in other language..." style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                            </div>
                        </template>

                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Key Features (One per line)</label>
                            <textarea v-model="editingProduct.features" :disabled="editingProduct.details_source === 'external'" rows="4" placeholder="Feature 1&#10;Feature 2" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                        </div>

                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Machine Compatibility (One per line)</label>
                            <textarea v-model="editingProduct.compatibility" :disabled="editingProduct.details_source === 'external'" rows="4" placeholder="Breville 54mm&#10;E61 Group Heads" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                        </div>

                        <div class="form-group form-full" style="grid-column: span 2; margin-top: 16px;">
                            <button type="submit" class="btn" style="width: 100%; height: 42px; font-weight: 700;">Save Changes</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- Current Product Catalog Management Table -->
        <div class="panel" style="margin-top: 24px;">
            <div class="panel-header">
                <h3 class="panel-title">
                    Current Product Catalog
                    <span
                        style="font-size: 0.72rem; background: var(--bg-color); color: var(--text-main); padding: 2px 8px; border-radius: 4px; font-weight: 700; margin-left: 6px;">
                        {{ filteredProducts.length }} items
                    </span>
                </h3>
                <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                    <div class="header-search-container" style="width: 220px;">
                        <svg class="header-search-icon" width="12" height="12" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2.5">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input type="text" class="header-search-input" placeholder="Search catalog..."
                            v-model="productsSearchQuery"
                            style="padding: 6px 12px 6px 32px; height: 32px; line-height: 32px;">
                    </div>
                </div>
            </div>
            <div v-if="filteredProducts.length === 0" style="padding: 50px 30px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; border-top: 1px dashed var(--border); margin-top: 12px; background: rgba(255,255,255,0.005); border-radius: 8px;">
                <div style="font-size: 3rem; animation: pulse 2s infinite;">📦</div>
                <div style="max-width: 500px;">
                    <h4 style="color: var(--text-main); font-size: 1rem; font-weight: 700; margin: 0 0 8px 0;">Your Product Catalog is Empty</h4>
                    <p style="color: var(--text-muted); font-size: 0.8rem; line-height: 1.5; margin: 0;">
                        To launch high-converting omnichannel marketing campaigns, you need products in your catalog. Connect your Shopify or WooCommerce store to automatically sync products in one click, or add products manually.
                    </p>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 10px;">
                    <button v-if="isStoreConnected" type="button" class="btn btn-accent" style="margin: 0; height: 38px; padding: 0 20px; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); border: none; color: white;" 
                            @click="triggerStoreWideProductImport" :disabled="importingStoreWide">
                        <span v-if="importingStoreWide">⏳ Importing store...</span>
                        <span v-else>🔌 1-Click eCommerce Import</span>
                    </button>
                    <button v-else type="button" class="btn btn-accent" style="margin: 0; height: 38px; padding: 0 20px; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border: none; color: white;" 
                            @click="app.switchView('brands')">
                        🔌 Connect Store
                    </button>
                    <button type="button" class="btn btn-secondary" style="margin: 0; height: 38px; padding: 0 20px; font-weight: 700; font-size: 0.8rem;" 
                            @click="openAddProductModal">
                        ➕ Add Manual Product
                    </button>
                </div>
            </div>
            <div v-else class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th class="checkbox-cell" style="width: 40px;">
                                <div class="checkbox-custom" :class="{ checked: isAllProductsSelected }" @click="toggleSelectAllProducts"></div>
                            </th>
                            <th>Product Info</th>
                            <th>Brand Shop</th>
                            <th>Retail Price</th>
                            <th>Impressions</th>
                            <th>Sales (Qty)</th>
                            <th>Revenue</th>
                            <th>Conv. Rate</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="prod in searchedProducts" :key="prod.id" :class="{ selected: selectedProductIds.includes(prod.id) }">
                            <td class="checkbox-cell" @click.stop>
                                <div class="checkbox-custom" :class="{ checked: selectedProductIds.includes(prod.id) }" @click="toggleSelectProduct(prod.id)"></div>
                            </td>
                            <td>
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <img :src="prod.image || 'https://placehold.co/100'"
                                        style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border);"
                                        alt="Product Image">
                                    <div>
                                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                                            <strong style="color: var(--text-main); cursor: pointer;" @click="openEditProductModal(prod)">{{ prod.title }} ✏️</strong>
                                            <a v-if="prod.original_link" :href="prod.original_link" target="_blank" style="text-decoration: none; color: var(--text-muted); opacity: 0.6; transition: opacity 0.2s; display: inline-flex; align-items: center;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6" title="View original product page">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                    <polyline points="15 3 21 3 21 9"></polyline>
                                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                                </svg>
                                            </a>
                                            <span v-if="prod.active === 0" style="background: #ef4444; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; line-height: 1;">Inactive</span>
                                            <span v-else style="background: #10b981; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; line-height: 1;">Active</span>
                                        </div>
                                        <div style="display: flex; gap: 8px; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 4px;" v-if="prod.sku || prod.external_id">
                                            <span v-if="prod.sku">SKU: <strong style="color: var(--text-main);">{{ prod.sku }}</strong></span>
                                            <span v-if="prod.external_id">Ext ID: <strong style="color: var(--text-main);">{{ prod.external_id }}</strong></span>
                                        </div>
                                        <div style="display: flex; gap: 8px; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 4px;">
                                            <span>Stock: <strong :style="prod.inventory_quantity === 0 ? 'color: #ef4444;' : 'color: var(--accent);'">{{ prod.inventory_quantity !== null && prod.inventory_quantity !== undefined ? prod.inventory_quantity : 'Unlimited' }}</strong></span>
                                            <span>Limit: <strong style="color: var(--text-main);">{{ prod.sales_limit !== null && prod.sales_limit !== undefined ? (prod.total_sold || 0) + '/' + prod.sales_limit : 'None' }}</strong></span>
                                        </div>
                                        <div
                                            style="font-size: 0.75rem; color: var(--text-muted); max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                            {{ prod.description || 'No description provided.' }}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="status-pill"
                                    style="background: var(--bg-color); color: var(--text-main); font-weight: 600;">
                                    {{ getBrandName(prod.brand_id) }}
                                </span>
                            </td>
                            <td><strong>€{{ parseFloat(prod.price).toFixed(2) }}</strong></td>
                            
                            <!-- Stats values -->
                            <td><strong>{{ getProductStats(prod.id).impressions }}</strong></td>
                            <td><strong>{{ getProductStats(prod.id).salesCount }}</strong></td>
                            <td><strong style="color: var(--success);">€{{ getProductStats(prod.id).revenue }}</strong></td>
                            <td>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <span style="font-weight: 700; color: var(--text-main);">{{ getProductStats(prod.id).conversionRate }}%</span>
                                </div>
                            </td>

                            <!-- Action button triggers -->
                            <td>
                                <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                                    <button type="button" class="btn"
                                        style="background: #3b82f6; border-color: #3b82f6; color: #ffffff; padding: 4px 8px; font-size: 0.75rem; height: 28px; font-weight: 700; margin: 0; line-height: 1;"
                                        @click="openEditProductModal(prod)">
                                        ✏️ Edit
                                    </button>
                                    <button type="button" class="btn"
                                        :style="{ background: prod.active === 0 ? '#10b981' : '#f97316', borderColor: prod.active === 0 ? '#10b981' : '#f97316', color: '#ffffff', padding: '4px 8px', fontSize: '0.75rem', height: '28px', fontWeight: '700', margin: 0, lineLine: '1' }"
                                        @click="toggleProductActive(prod.id, prod.active)">
                                        {{ prod.active === 0 ? 'Activate' : 'Deactivate' }}
                                    </button>
                                    <button type="button" class="btn"
                                        style="background: #ef4444; border-color: #ef4444; color: #ffffff; padding: 4px 8px; font-size: 0.75rem; height: 28px; font-weight: 700; margin: 0; line-height: 1;"
                                        @click="deleteProduct(prod.id)">
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="searchedProducts.length === 0">
                            <td colspan="9"
                                style="text-align: center; color: var(--text-muted); padding: 30px;">
                                No products match the selected filters or search parameters.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Floating Bulk Actions Bar -->
        <div v-if="selectedProductIds.length > 0" class="bulk-actions-bar">
            <span><strong>{{ selectedProductIds.length }}</strong> products selected</span>
            <div class="btn-group">
                <button class="bulk-btn btn-primary" @click="performBulkUpdateProductsActive(1)">Activate Selected</button>
                <button class="bulk-btn btn-secondary" @click="performBulkUpdateProductsActive(0)">Deactivate Selected</button>
                <button class="bulk-btn btn-danger" @click="performBulkDeleteProducts">Delete Selected</button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ProductsView',
    inject: ['app'],
    data() {
        return {
            selectedProductIds: [],
            showAddProductModal: false,
            selectedApiProductId: '',
            apiProducts: [],
            loadingApiProducts: false,
            importSearchQuery: '',
            showEditProductModal: false,
            productUploading: false,
            generatingSeo: false,
            lastSeoCost: null,
            activeLangTab: 'en',
            importingStoreWide: false,
            seoEstCost: '€0.00020',
            seoEditEstCost: '€0.00020',
            editingProduct: {
                id: null,
                brand_id: '',
                external_id: null,
                title: '',
                price: 0.00,
                tag: '',
                image: '',
                original_link: '',
                description: '',
                long_description: '',
                features: '',
                compatibility: '',
                sku: '',
                price_source: 'manual',
                details_source: 'manual',
                translations: {},
                inventory_quantity: null,
                sales_limit: null
            }
        };
    },
    computed: {
        authHeaders() {
            return {
                'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                'X-Brand-Id': this.app.activeShopFilter
            };
        },
        isAllProductsSelected() {
            return this.searchedProducts.length > 0 && this.searchedProducts.every(p => this.selectedProductIds.includes(p.id));
        },
        brands() { return this.app.brands; },
        activeBrand() {
            return this.brands.find(b => b.id === this.activeShopFilter) || null;
        },
        isStoreConnected() {
            return !!(this.activeBrand && (this.activeBrand.shopify_shop_name || this.activeBrand.woocommerce_shop_url));
        },
        newProduct() { return this.app.newProduct; },
        uploadingMedia() { return this.app.uploadingMedia; },
        shopifyProducts() { return this.app.shopifyProducts; },
        shopifyScanStatus() { return this.app.shopifyScanStatus; },
        filteredProducts() { return this.app.filteredProducts; },
        searchedProducts() { return this.app.searchedProducts; },
        shopifyImportBrandId: {
            get() { return this.app.shopifyImportBrandId; },
            set(val) { this.app.shopifyImportBrandId = val; }
        },
        productsSearchQuery: {
            get() { return this.app.productsSearchQuery; },
            set(val) { this.app.productsSearchQuery = val; }
        },
        activeShopFilter() { return this.app.activeShopFilter; },
        activeBrand() {
            const brandId = this.newProduct && this.newProduct.brand_id ? this.newProduct.brand_id : this.app.activeShopFilter;
            const targetId = brandId === 'all' && this.brands.length > 0 ? this.brands[0].id : brandId;
            return this.brands.find(b => b.id === targetId) || null;
        },
        activeLanguages() {
            const brand = this.activeBrand;
            if (brand && brand.languages) {
                if (Array.isArray(brand.languages)) return brand.languages;
                return brand.languages.split(',').map(l => l.trim()).filter(Boolean);
            }
            return ['en'];
        },
        filteredApiProducts() {
            let list = this.apiProducts || [];
            if (this.importSearchQuery.trim()) {
                const query = this.importSearchQuery.toLowerCase();
                list = list.filter(p => (p.title || '').toLowerCase().includes(query));
            }
            return list;
        }
    },
    watch: {
        'newProduct.long_description': {
            immediate: true,
            handler(newVal) {
                this.updateNewSeoEstimate(newVal);
            }
        },
        'editingProduct.long_description': {
            immediate: true,
            handler(newVal) {
                this.updateEditSeoEstimate(newVal);
            }
        }
    },
    methods: {
        async updateNewSeoEstimate(text) {
            const data = await this.app.fetchAiEstimate('Product SEO Content Generation', text || '');
            if (data && data.costUsd) {
                this.seoEstCost = `€${(data.costUsd * 0.92).toFixed(5)}`;
            }
        },
        async updateEditSeoEstimate(text) {
            const data = await this.app.fetchAiEstimate('Product SEO Content Generation', text || '');
            if (data && data.costUsd) {
                this.seoEditEstCost = `€${(data.costUsd * 0.92).toFixed(5)}`;
            }
        },
        toggleSelectProduct(id) {
            const idx = this.selectedProductIds.indexOf(id);
            if (idx > -1) {
                this.selectedProductIds.splice(idx, 1);
            } else {
                this.selectedProductIds.push(id);
            }
        },
        toggleSelectAllProducts() {
            if (this.isAllProductsSelected) {
                this.selectedProductIds = [];
            } else {
                this.selectedProductIds = this.searchedProducts.map(p => p.id);
            }
        },
        async performBulkUpdateProductsActive(active) {
            const success = await this.app.bulkUpdateProductsActive(this.selectedProductIds, active);
            if (success) {
                this.selectedProductIds = [];
            }
        },
        async performBulkDeleteProducts() {
            const success = await this.app.bulkDeleteProducts(this.selectedProductIds);
            if (success) {
                this.selectedProductIds = [];
            }
        },
        openAddProductModal() {
            if (this.brands.length === 0) {
                alert('You must onboard at least one coffee brand storefront under the "Shops" tab before you can add products.');
                return;
            }
            this.showAddProductModal = true;
            if (this.activeShopFilter !== 'all') {
                this.newProduct.brand_id = this.activeShopFilter;
            } else if (!this.newProduct.brand_id && this.brands.length > 0) {
                this.newProduct.brand_id = this.brands[0].id;
            }
            this.activeLangTab = this.activeLanguages[0] || 'en';
            this.handleBrandChange();
        },
        async triggerStoreWideProductImport() {
            let brandId = this.activeShopFilter;
            if (!brandId || brandId === 'all') {
                if (this.brands.length > 0) {
                    brandId = this.brands[0].id;
                } else {
                    alert('Please connect a shop under the "Shops" tab first.');
                    return;
                }
            }
            this.importingStoreWide = true;
            try {
                this.app.showNotification('🔌 Connecting to eCommerce store & syncing products...');
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/shopify-import?brandId=${brandId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    const products = data.products || [];
                    if (products.length === 0) {
                        this.app.showNotification('⚠️ No products found in connected storefront to import.');
                        return;
                    }
                    
                    const batchResponse = await fetch(`${this.app.apiBaseUrl}/api/global/shopify-import/batch`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                        },
                        body: JSON.stringify({ brandId, products })
                    });
                    if (batchResponse.ok) {
                        this.app.showNotification(`🎉 Successfully synced & imported ${products.length} products!`);
                        await this.app.loadBrands();
                        await this.app.loadProducts(); // reload products lists to update view instantly
                    } else {
                        const err = await batchResponse.json();
                        alert('Import failed: ' + (err.error || 'Unknown error'));
                    }
                } else {
                    alert('Failed to connect to storefront catalog integration.');
                }
            } catch (e) {
                alert('Import error: ' + e.message);
            } finally {
                this.importingStoreWide = false;
            }
        },
        closeAddProductModal() {
            this.showAddProductModal = false;
            this.selectedApiProductId = '';
            this.importSearchQuery = '';
            this.apiProducts = [];
        },
        handleBrandChange() {
            if (this.newProduct.brand_id) {
                this.fetchApiProducts(this.newProduct.brand_id);
            }
        },
        async fetchApiProducts(brandId) {
            this.loadingApiProducts = true;
            this.apiProducts = [];
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/shopify-import?brandId=${brandId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    this.apiProducts = data.products || [];
                }
            } catch(e) {
                console.error(e);
            } finally {
                this.loadingApiProducts = false;
            }
        },
        autofillFromApi() {
            if (!this.selectedApiProductId) return;
            const matched = this.apiProducts.find(p => String(p.id) === String(this.selectedApiProductId));
            if (matched) {
                this.newProduct.title = matched.title || '';
                this.newProduct.price = matched.price || 0.00;
                this.newProduct.image = matched.image || '';
                this.newProduct.description = matched.description ? matched.description.replace(/<[^>]*>/g, '') : '';
                this.newProduct.long_description = matched.description || '';
                this.newProduct.original_link = matched.url || matched.original_link || '';
                this.newProduct.sku = matched.sku || '';
                this.newProduct.external_id = matched.external_id || '';
                this.newProduct.meta_details = matched.meta_details || {};
                this.newProduct.translations = matched.translations || {};
            }
        },
        selectImportProduct(p) {
            this.selectedApiProductId = p.id;
            this.newProduct.title = p.title || '';
            this.newProduct.price = p.price || 0.00;
            this.newProduct.image = p.image || '';
            this.newProduct.description = p.description ? p.description.replace(/<[^>]*>/g, '') : '';
            this.newProduct.long_description = p.description || '';
            this.newProduct.original_link = p.url || p.original_link || '';
            this.newProduct.sku = p.sku || '';
            this.newProduct.external_id = p.external_id || '';
            this.newProduct.meta_details = p.meta_details || {};
            this.newProduct.translations = p.translations || {};
            this.app.showNotification(`Linked details to "${p.title}"`);
        },
        async submitNewProduct() {
            await this.app.addProduct();
            this.closeAddProductModal();
        },
        addProduct(e) { return this.app.addProduct(e); },
        handleFileSelect(e) { return this.app.handleFileSelect(e); },
        scanShopifyProducts() { return this.app.scanShopifyProducts(); },
        importShopifyProduct(e, p) { return this.app.importShopifyProduct(e, p); },
        getBrandName(brandId) { return this.app.getBrandName(brandId); },
        getCompatibility(prod) { return this.app.getCompatibility(prod); },
        deleteProduct(id) { return this.app.deleteProduct(id); },
        toggleProductActive(id, active) { return this.app.toggleProductActive(id, active); },
        parseFloat(val) { return parseFloat(val); },
        
        onDragOver(e) {
            e.currentTarget.style.borderColor = 'var(--text-main)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        },
        onDragLeave(e) {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
        },
        async onAddProductDrop(e) {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
            const file = e.dataTransfer.files[0];
            if (file) {
                await this.uploadProductAsset(file, 'new');
            }
        },
        async onAddProductFileSelect(e) {
            const file = e.target.files[0];
            if (file) {
                await this.uploadProductAsset(file, 'new');
            }
        },
        async onEditProductDrop(e) {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
            const file = e.dataTransfer.files[0];
            if (file) {
                await this.uploadProductAsset(file, 'edit');
            }
        },
        async onEditProductFileSelect(e) {
            const file = e.target.files[0];
            if (file) {
                await this.uploadProductAsset(file, 'edit');
            }
        },
        async uploadProductAsset(file, type) {
            this.productUploading = true;
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` },
                    body: formData
                });
                if (response.ok) {
                    const result = await response.json();
                    const url = this.app.apiBaseUrl + result.url;
                    if (type === 'new') {
                        this.newProduct.image = url;
                    } else {
                        this.editingProduct.image = url;
                    }
                    this.app.showNotification(`Asset uploaded successfully!`);
                } else {
                    alert('Upload failed.');
                }
            } catch (err) {
                alert(`Upload error: ${err.message}`);
            } finally {
                this.productUploading = false;
            }
        },

        openEditProductModal(prod) {
            let featuresStr = '';
            let compatibilityStr = '';
            if (prod.features) {
                try {
                    const parsed = typeof prod.features === 'string' ? JSON.parse(prod.features) : prod.features;
                    if (Array.isArray(parsed)) {
                        featuresStr = parsed.join('\n');
                    } else {
                        featuresStr = String(parsed);
                    }
                } catch(e) {
                    featuresStr = String(prod.features);
                }
            }
            if (prod.compatibility) {
                try {
                    const parsed = typeof prod.compatibility === 'string' ? JSON.parse(prod.compatibility) : prod.compatibility;
                    if (Array.isArray(parsed)) {
                        compatibilityStr = parsed.join('\n');
                    } else {
                        compatibilityStr = String(parsed);
                    }
                } catch(e) {
                    compatibilityStr = String(prod.compatibility);
                }
            }

            this.editingProduct = {
                id: prod.id,
                brand_id: prod.brand_id,
                external_id: prod.external_id || null,
                sku: prod.sku || '',
                title: prod.title,
                price: prod.price,
                tag: prod.tag || '',
                image: prod.image || '',
                original_link: prod.original_link || '',
                description: prod.description || '',
                long_description: prod.long_description || '',
                features: featuresStr,
                compatibility: compatibilityStr,
                price_source: prod.price_source || (prod.external_id ? 'external' : 'manual'),
                details_source: prod.details_source || (prod.external_id ? 'external' : 'manual'),
                active: prod.active !== undefined ? prod.active : 1,
                translations: prod.translations ? (typeof prod.translations === 'string' ? JSON.parse(prod.translations) : prod.translations) : {},
                meta_details: prod.meta_details || {},
                original_price: prod.original_price || prod.price
            };
            this.activeLangTab = this.activeLanguages[0] || 'en';
            this.showEditProductModal = true;
        },
        closeEditProductModal() {
            this.showEditProductModal = false;
        },
        async submitUpdatedProduct() {
            const features = (this.editingProduct.features || '').split('\n').filter(l => l.trim() !== '');
            const compatibility = (this.editingProduct.compatibility || '').split('\n').filter(l => l.trim() !== '');

            const payload = {
                ...this.editingProduct,
                price: parseFloat(this.editingProduct.price),
                features,
                compatibility
            };

            const success = await this.app.updateProduct(payload);
            if (success) {
                this.closeEditProductModal();
            }
        },

        getProductStats(productId) {
            let salesCount = 0;
            let revenue = 0;
            if (Array.isArray(this.app.orders)) {
                this.app.orders.forEach(order => {
                    if (order.status === 'paid') {
                        try {
                            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                            if (Array.isArray(items)) {
                                items.forEach(item => {
                                    if (String(item.id) === String(productId)) {
                                        const qty = parseInt(item.quantity) || 0;
                                        const price = parseFloat(item.price) || 0;
                                        salesCount += qty;
                                        revenue += qty * price;
                                    }
                                });
                            }
                        } catch(e) {}
                    }
                });
            }
            const prod = this.app.products.find(p => p.id === productId);
            const impressions = (prod && prod.impressions) ? prod.impressions : (salesCount * 12 + 45);
            const conversionRate = impressions > 0 ? ((salesCount / impressions) * 100).toFixed(1) : '0.0';
            return {
                impressions,
                salesCount,
                revenue: parseFloat(revenue).toFixed(2),
                conversionRate
            };
        },
        toggleAiSeo(mode) {
            if (this.generatingSeo) {
                if (this.seoAbortController) {
                    this.seoAbortController.abort();
                    this.seoAbortController = null;
                }
            } else {
                this.generateAiSeo(mode);
            }
        },
        async generateAiSeo(mode) {
            if (!this.app.isFeatureAllowed('allow_seo')) {
                alert('🔒 Feature Locked: Please upgrade your subscription to Professional or Enterprise Tier to unlock the AI Catalog SEO Pitcher.');
                return;
            }
            const prod = mode === 'new' ? this.newProduct : this.editingProduct;
            if (!prod.title) {
                alert('Please enter a product title first to generate SEO content.');
                return;
            }
            
            this.generatingSeo = true;
            this.seoAbortController = new AbortController();
            const brandId = prod.brand_id || this.app.activeShopFilter;
            const brand = this.app.brands.find(b => b.id === brandId);
            const tier = brand ? brand.ai_tier : 'professional';
            let modelName = 'gemini-3.1-pro';
            if (tier === 'standard') modelName = 'gemini-2.5-flash';
            else if (tier === 'enterprise') modelName = 'deep-research-pro-preview';
            this.app.startAiTicker(modelName);
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/products/generate-seo`, {
                    method: 'POST',
                    headers: {
                        ...this.authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title: prod.title,
                        description: prod.long_description || prod.description
                    }),
                    signal: this.seoAbortController.signal
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        prod.description = result.short_description || prod.description;
                        prod.long_description = result.detailed_description || result.long_description;
                        if (result.features && Array.isArray(result.features)) {
                            prod.features = result.features.join('\n');
                        }
                        if (result.compatibility && Array.isArray(result.compatibility)) {
                            prod.compatibility = result.compatibility.join('\n');
                        }
                        this.app.showNotification('AI SEO copy generated successfully!');
                    }
                } else {
                    const err = await response.json();
                    alert(`AI generation failed: ${err.error}`);
                }
            } catch (err) {
                if (err.name === 'AbortError') {
                    this.lastSeoCost = null;
                    this.app.showNotification('AI Generation stopped.');
                    return;
                }
                alert(`Error generating AI content: ${err.message}`);
            } finally {
                this.generatingSeo = false;
                this.lastSeoCost = this.app.aiTicker.cost * 0.92;
                this.app.stopAiTicker();
                this.seoAbortController = null;
            }
        },
        getTranslationRef(mode, lang) {
            const prod = mode === 'new' ? this.newProduct : this.editingProduct;
            if (!prod.translations) {
                prod.translations = {};
            }
            if (!prod.translations[lang]) {
                prod.translations[lang] = {
                    title: '',
                    description: '',
                    long_description: ''
                };
            }
            return prod.translations[lang];
        },
        getLangFlag(lang) {
            const flags = {
                en: '🇬🇧 EN',
                nl: '🇳🇱 NL',
                fr: '🇫🇷 FR',
                de: '🇩🇪 DE',
                es: '🇪🇸 ES',
                it: '🇮🇹 IT'
            };
            return flags[lang.toLowerCase()] || `🌐 ${lang.toUpperCase()}`;
        }
    }
}
</script>

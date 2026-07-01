<template>
    <div id="view-coupons" class="admin-view" :class="{ active: app.activeView === 'coupons' }">

        <div v-if="app.activeShopFilter === 'all'" class="panel" style="text-align: center; padding: 60px 20px;">
            <span style="font-size: 3rem;">🏬</span>
            <h3 style="margin-top: 15px; color: var(--text-main);">No Store Selected</h3>
            <p style="color: var(--text-muted); max-width: 450px; margin: 10px auto 20px auto; font-size: 0.9rem;">
                Please select a specific brand shop from the workspace switcher dropdown in the top navigation bar to manage campaigns and coupons.
            </p>
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 24px;">
            <!-- Tab Navigation Header -->
            <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border); padding-bottom: 2px;">
                <button v-for="tab in tabs" :key="tab.id" class="btn" 
                        style="margin: 0; height: 38px; padding: 0 16px; border-radius: 6px 6px 0 0; font-size: 0.85rem; border: none; font-weight: 600;"
                        :style="activeTab === tab.id ? { background: 'var(--primary)', color: 'var(--workspace-bg)' } : { background: 'none', color: 'var(--text-muted)' }"
                        @click="activeTab = tab.id">
                    {{ tab.label }}
                </button>
            </div>

            <!-- Tab 1: Analytics -->
            <div v-if="activeTab === 'analytics'" style="display: flex; flex-direction: column; gap: 24px;">
                <!-- Key Metrics Cards -->
                <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
                    <div class="metric-card">
                        <div class="metric-card-label">Total Coupon Redemptions</div>
                        <div class="metric-card-value">{{ metrics.totalRedemptions }}</div>
                        <div class="metric-card-desc">Total codes used at checkout</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-card-label">Referral Revenue</div>
                        <div class="metric-card-value">€{{ metrics.referralRevenue.toFixed(2) }}</div>
                        <div class="metric-card-desc">Total checkout income from referrals</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-card-label">Avg. Referral Order</div>
                        <div class="metric-card-value">€{{ metrics.avgReferralOrder.toFixed(2) }}</div>
                        <div class="metric-card-desc">Average cart value of referral conversions</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-card-label">Pending E-mails in Queue</div>
                        <div class="metric-card-value">{{ metrics.pendingEmails }}</div>
                        <div class="metric-card-desc">Scheduled referrals awaiting send</div>
                    </div>
                </div>

                <!-- UTM Campaign Performance Table -->
                <div class="panel">
                    <div class="panel-header">
                        <div>
                            <h3 class="panel-title" style="margin: 0;">📈 UTM Campaign Performance</h3>
                            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 4px 0 0 0;">
                                Tracks inbound traffic sources, channels, and orders containing UTM tags.
                            </p>
                        </div>
                    </div>
                    <div class="table-container" style="overflow-x: auto;">
                        <table class="data-table" style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 2px solid var(--border); font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">
                                    <th style="padding: 10px;">Source</th>
                                    <th style="padding: 10px;">Medium</th>
                                    <th style="padding: 10px;">Campaign</th>
                                    <th style="padding: 10px;">Orders</th>
                                    <th style="padding: 10px;">Conversion Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(utm, idx) in utmStats" :key="idx" style="border-bottom: 1px solid var(--border); font-size: 0.85rem;">
                                    <td style="padding: 10px; font-weight: 600;">{{ utm.utm_source || '(Direct)' }}</td>
                                    <td style="padding: 10px;">{{ utm.utm_medium || '-' }}</td>
                                    <td style="padding: 10px; color: var(--accent); font-weight: 600;">{{ utm.utm_campaign || '-' }}</td>
                                    <td style="padding: 10px; font-weight: 700;">{{ utm.order_count }}</td>
                                    <td style="padding: 10px; font-weight: 700;">€{{ parseFloat(utm.total_revenue).toFixed(2) }}</td>
                                </tr>
                                <tr v-if="utmStats.length === 0">
                                    <td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">No UTM campaign traffic recorded yet.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Tab 2: Referral Campaign Rules -->
            <div v-if="activeTab === 'rules'" class="panel" style="display: flex; flex-direction: column; gap: 20px;">
                <div class="panel-header">
                    <div>
                        <h3 class="panel-title" style="margin: 0;">✉️ Automated Post-Delivery Referrals</h3>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 4px 0 0 0;">
                            Configure automated referral coupon delivery emails sent to customers specific days after their order is shipped/delivered.
                        </p>
                    </div>
                </div>

                <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" id="campaign-enabled" v-model="ruleset.enabled" style="width: 18px; height: 18px; cursor: pointer;">
                    <label for="campaign-enabled" style="font-weight: 700; cursor: pointer; user-select: none;">Enable Automated Email Campaign</label>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
                    <div class="form-group">
                        <label>Delivery Delay (Days after fulfillment)</label>
                        <input type="number" v-model="ruleset.days_after_delivery" min="0" max="30" placeholder="3" style="width: 100%;">
                    </div>
                    <div class="form-group">
                        <label>Referral Coupon Discount Value</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="number" v-model="ruleset.discount_value" min="1" placeholder="10" style="flex: 1;">
                            <select v-model="ruleset.discount_type" style="width: 120px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 10px;">
                                <option value="percentage">% Off</option>
                                <option value="fixed">€ Fixed Amount</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Coupon Expiry (Days valid)</label>
                        <input type="number" v-model="ruleset.expire_days" min="1" max="90" placeholder="14" style="width: 100%;">
                    </div>
                </div>

                <!-- Custom rules for the generated referral coupon code -->
                <div style="border: 1px solid var(--border); border-radius: 8px; padding: 15px;">
                    <h5 style="margin: 0 0 10px 0; font-weight: 700; color: var(--text-main);">🛒 Target Referral Ruleset Restrictions</h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                        <div class="form-group">
                            <label>Minimum Cart Subtotal (Optional)</label>
                            <input type="number" v-model="ruleset.rules.min_subtotal" min="0" placeholder="e.g. 50.00" style="width: 100%;">
                        </div>
                        <div class="form-group">
                            <label>Restricted Products (Optional)</label>
                            <div class="custom-multiselect-container" style="position: relative;">
                                <!-- Tag container displaying selected products -->
                                <div @click.stop="toggleProductDropdown" style="min-height: 38px; border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; background: var(--workspace-bg); cursor: pointer; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; justify-content: space-between;">
                                    <div style="display: flex; flex-wrap: wrap; gap: 6px; flex: 1; min-width: 0;">
                                        <span v-if="selectedProducts.length === 0" style="color: var(--text-muted); font-size: 0.85rem;">Select restricted products...</span>
                                        <span v-for="p in selectedProducts" :key="p.id" class="badge" style="background: rgba(197, 160, 89, 0.15); color: var(--accent); border: 1px solid rgba(197, 160, 89, 0.3); font-size: 0.78rem; padding: 2px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px;">
                                            {{ p.title }}
                                            <span @click.stop="removeProductSelection(p.id)" style="cursor: pointer; font-weight: bold; font-size: 0.85rem; color: var(--accent);">×</span>
                                        </span>
                                    </div>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--text-muted); transition: transform 0.2s;" :style="productDropdownOpen ? 'transform: rotate(180deg);' : ''">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                                
                                <!-- Dropdown checklists -->
                                <div v-if="productDropdownOpen" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); z-index: 1000; max-height: 200px; overflow-y: auto; padding: 6px 0;">
                                    <div v-if="app.products.length === 0" style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No products available.</div>
                                    <div v-for="p in app.products" :key="p.id" @click.stop="toggleProductSelection(p.id)" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                                        <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                                            <img v-if="p.image" :src="p.image" style="width: 24px; height: 24px; border-radius: 4px; object-fit: cover; flex-shrink: 0;" />
                                            <span style="font-size: 0.85rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main);">{{ p.title }}</span>
                                        </div>
                                        <div style="width: 16px; height: 16px; border: 1px solid var(--border); border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: var(--transition);" :style="isProductSelected(p.id) ? 'background: var(--accent); border-color: var(--accent);' : ''">
                                            <svg v-if="isProductSelected(p.id)" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-group" style="margin-top: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold; color: var(--text-main);">Language-Specific Email Content</label>
                    <!-- Language Selector Tabs -->
                    <div style="display: flex; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 6px; flex-wrap: wrap;">
                        <button v-for="lang in availableLocales" :key="lang" type="button" 
                            class="btn btn-secondary" :class="{ active: activeTemplateLang === lang }" 
                            style="font-size: 0.75rem; padding: 4px 10px; height: auto;" 
                            @click="activeTemplateLang = lang">
                            {{ lang.toUpperCase() }}
                        </button>
                    </div>

                    <div v-if="ruleset.templates && ruleset.templates[activeTemplateLang]">
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label>Email Subject Template ({{ activeTemplateLang.toUpperCase() }})</label>
                            <input type="text" v-model="ruleset.templates[activeTemplateLang].subject" style="width: 100%;">
                        </div>

                        <div class="form-group">
                            <label>Email Body Template ({{ activeTemplateLang.toUpperCase() }})</label>
                            <textarea v-model="ruleset.templates[activeTemplateLang].body" rows="6" style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 10px; background: var(--workspace-bg); color: var(--text-main); font-family: monospace; font-size: 0.85rem; line-height: 1.4; resize: vertical;"></textarea>
                            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 5px;">
                                Supported Tokens: <code>{customer_name}</code>, <code>{coupon_code}</code>, <code>{discount_value}</code>, <code>{expire_date}</code>
                            </div>
                        </div>
                    </div>
                </div>

                <button class="btn" style="background: var(--primary); color: var(--workspace-bg); font-weight: 700; width: fit-content;" @click="saveReferralRules" :disabled="savingRules">
                    <span v-if="savingRules" class="spinner"></span>
                    <span>💾 Save Campaign Configuration</span>
                </button>
            </div>

            <!-- Tab 3: Promotional Coupons -->
            <div v-if="activeTab === 'coupons'" style="display: flex; gap: 24px; flex-wrap: wrap;">
                <div class="panel" style="flex: 1; min-width: 320px; display: flex; flex-direction: column; gap: 15px; height: fit-content;">
                    <div class="panel-header">
                        <h3 class="panel-title" style="margin: 0;">🎟️ Create Promo Coupon</h3>
                    </div>
                    
                    <div class="form-group">
                        <label>Promo Code (Uppercase alphanumeric)</label>
                        <input type="text" v-model="newCoupon.code" placeholder="WELCOME20" style="width: 100%; text-transform: uppercase;">
                    </div>

                    <div class="form-group">
                        <label>Discount Value</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="number" v-model="newCoupon.discount_value" min="1" placeholder="20" style="flex: 1;">
                            <select v-model="newCoupon.discount_type" style="width: 120px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 10px;">
                                <option value="percentage">% Off</option>
                                <option value="fixed">€ Fixed</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Minimum Cart Subtotal (Optional)</label>
                        <input type="number" v-model="newCoupon.min_subtotal" min="0" placeholder="e.g. 30.00" style="width: 100%;">
                    </div>

                    <div class="form-group">
                        <label>Expiration Date (Optional)</label>
                        <input type="datetime-local" v-model="newCoupon.expire_at" style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 10px; background: var(--workspace-bg); color: var(--text-main);">
                    </div>

                    <button class="btn" style="background: var(--primary); color: var(--workspace-bg); font-weight: 700; width: 100%; margin-top: 10px;" @click="createPromoCoupon" :disabled="creatingCoupon">
                        <span v-if="creatingCoupon" class="spinner"></span>
                        <span>➕ Generate Promo Code</span>
                    </button>
                </div>

                <!-- Existing Coupons List -->
                <div class="panel" style="flex: 1.8; min-width: 450px;">
                    <div class="panel-header">
                        <h3 class="panel-title" style="margin: 0;">📋 Active Coupon Registry</h3>
                    </div>
                    <div class="table-container" style="overflow-x: auto;">
                        <table class="data-table" style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 2px solid var(--border); font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">
                                    <th class="checkbox-cell" style="padding: 10px; width: 40px;">
                                        <div class="checkbox-custom" :class="{ checked: isAllCouponsSelected }" @click="toggleSelectAllCoupons"></div>
                                    </th>
                                    <th style="padding: 10px;">Code</th>
                                    <th style="padding: 10px;">Discount</th>
                                    <th style="padding: 10px;">Rules</th>
                                    <th style="padding: 10px;">Expires</th>
                                    <th style="padding: 10px;">Status</th>
                                    <th style="padding: 10px; text-align: right;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="coupon in coupons" :key="coupon.id" :class="{ selected: selectedCouponIds.includes(coupon.id) }" style="border-bottom: 1px solid var(--border); font-size: 0.82rem;">
                                    <td class="checkbox-cell" @click.stop style="padding: 10px;">
                                        <div class="checkbox-custom" :class="{ checked: selectedCouponIds.includes(coupon.id) }" @click="toggleSelectCoupon(coupon.id)"></div>
                                    </td>
                                    <td style="padding: 10px; font-weight: 700; color: var(--text-main);">
                                        {{ coupon.code }}
                                    </td>
                                    <td style="padding: 10px;">
                                        {{ coupon.discount_type === 'percentage' ? `${parseFloat(coupon.discount_value)}% Off` : `€${parseFloat(coupon.discount_value).toFixed(2)} Fixed` }}
                                    </td>
                                    <td style="padding: 10px; font-size: 0.75rem; color: var(--text-muted);">
                                        {{ getRulesSummary(coupon.rules) }}
                                    </td>
                                    <td style="padding: 10px;">
                                        {{ coupon.expire_at ? formatDate(coupon.expire_at) : 'Never' }}
                                    </td>
                                    <td style="padding: 10px;">
                                        <span :style="getStatusStyle(coupon.status)">
                                            {{ coupon.status.toUpperCase() }}
                                        </span>
                                    </td>
                                    <td style="padding: 10px; text-align: right;">
                                        <button v-if="coupon.status === 'active'" class="btn" style="margin: 0; padding: 4px 8px; font-size: 0.72rem; font-weight: 700; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--red);" @click="voidCoupon(coupon.id)">
                                            Void
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="coupons.length === 0">
                                    <td colspan="7" style="text-align: center; padding: 20px; color: var(--text-muted);">No coupon codes registered.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Floating Bulk Actions Bar -->
                <div v-if="selectedCouponIds.length > 0" class="bulk-actions-bar">
                    <span><strong>{{ selectedCouponIds.length }}</strong> coupons selected</span>
                    <div class="btn-group">
                        <button class="bulk-btn btn-danger" @click="performBulkVoidCoupons">Void Selected</button>
                    </div>
                </div>
            </div>

            <!-- Tab 4: Delivery Queue Logs -->
            <div v-if="activeTab === 'logs'" class="panel">
                <div class="panel-header">
                    <div>
                        <h3 class="panel-title" style="margin: 0;">📋 Scheduled E-mail Referral Log</h3>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 4px 0 0 0;">
                            Audit records of queued and delivered discount code referral emails.
                        </p>
                    </div>
                    <button class="btn btn-accent" style="font-weight: 700; height: 38px; display: flex; align-items: center; gap: 8px; margin: 0;" @click="sendPendingEmails" :disabled="sendingPending">
                        <span v-if="sendingPending" class="spinner"></span>
                        <span>⚡ Force Send Pending Queue Now</span>
                    </button>
                </div>

                <div class="table-container" style="overflow-x: auto;">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--border); font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">
                                <th style="padding: 10px;">Customer Email</th>
                                <th style="padding: 10px;">Order ID</th>
                                <th style="padding: 10px;">Coupon Code</th>
                                <th style="padding: 10px;">Scheduled For</th>
                                <th style="padding: 10px;">Delivered At</th>
                                <th style="padding: 10px;">Delivery Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="log in emailLogs" :key="log.id" style="border-bottom: 1px solid var(--border); font-size: 0.82rem;">
                                <td style="padding: 10px; font-weight: 600;">
                                    {{ log.customer_email }}
                                    <div v-if="log.email_subject" style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal; margin-top: 2px;">
                                        Subject: {{ log.email_subject }}
                                    </div>
                                </td>
                                <td style="padding: 10px; font-family: monospace;">{{ log.order_id }}</td>
                                <td style="padding: 10px; font-weight: 700; color: var(--accent);">{{ log.coupon_code }}</td>
                                <td style="padding: 10px;">{{ formatDate(log.scheduled_for) }}</td>
                                <td style="padding: 10px;">{{ log.sent_at ? formatDate(log.sent_at) : '-' }}</td>
                                <td style="padding: 10px;">
                                    <span :style="log.sent_at ? { color: '#10b981', fontWeight: '700' } : { color: '#f59e0b', fontWeight: '700' }">
                                        {{ log.sent_at ? 'Delivered' : 'Scheduled / Pending' }}
                                    </span>
                                </td>
                            </tr>
                            <tr v-if="emailLogs.length === 0">
                                <td colspan="6" style="text-align: center; padding: 20px; color: var(--text-muted);">No referral emails scheduled in log database.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CouponsView',
    inject: ['app'],
    data() {
        return {
            tabs: [
                { id: 'analytics', label: '📊 Campaign Performance' },
                { id: 'rules', label: '✉️ Referral Settings' },
                { id: 'coupons', label: '🎟️ Promo Codes' },
                { id: 'logs', label: '📋 Delivery Queue' }
            ],
            activeTab: 'analytics',
            coupons: [],
            emailLogs: [],
            utmStats: [],
            activeTemplateLang: 'en',
            ruleset: {
                enabled: true,
                days_after_delivery: 3,
                discount_type: 'percentage',
                discount_value: 10,
                expire_days: 14,
                email_subject: 'Thank you for your order! Here is a discount code for your friends.',
                email_body: '',
                rules: {
                    min_subtotal: '',
                    product_ids: ''
                },
                templates: {}
            },
            newCoupon: {
                code: '',
                discount_type: 'percentage',
                discount_value: '',
                min_subtotal: '',
                expire_at: ''
            },
            metrics: {
                totalRedemptions: 0,
                referralRevenue: 0,
                avgReferralOrder: 0,
                pendingEmails: 0
            },
            savingRules: false,
            creatingCoupon: false,
            sendingPending: false,
            productDropdownOpen: false,
            selectedCouponIds: []
        };
    },
    computed: {
        isAllCouponsSelected() {
            return this.coupons.length > 0 && this.coupons.every(c => this.selectedCouponIds.includes(c.id));
        },
        activeBrandName() {
            if (this.app.activeShopFilter === 'all') return 'None';
            const b = this.app.brands.find(x => x.id === this.app.activeShopFilter);
            return b ? b.name : 'Unknown';
        },
        activeBrand() {
            if (this.app.activeShopFilter === 'all') return null;
            return this.app.brands.find(x => x.id === this.app.activeShopFilter);
        },
        availableLocales() {
            const b = this.activeBrand;
            if (b && b.languages) {
                return b.languages.split(',');
            }
            return ['en'];
        },
        selectedProducts() {
            if (!this.ruleset.rules || !this.ruleset.rules.product_ids) return [];
            const ids = this.ruleset.rules.product_ids.split(',').map(id => id.trim()).filter(id => id !== '');
            return this.app.products.filter(p => ids.includes(String(p.id)));
        }
    },
    watch: {
        'app.activeShopFilter': {
            immediate: true,
            handler() {
                this.loadCampaignData();
            }
        },
        'app.activeView': {
            handler(newVal) {
                if (newVal === 'coupons') {
                    this.loadCampaignData();
                }
            }
        },
        activeTab(newVal) {
            if (this.app) {
                this.app.activeCouponsTab = newVal;
                this.app.updateURL();
            }
        },
        'app.activeCouponsTab'(newVal) {
            if (newVal && newVal !== this.activeTab) {
                this.activeTab = newVal;
            }
        }
    },
    mounted() {
        window.addEventListener('click', this.handleOutsideClick);
    },
    beforeUnmount() {
        window.removeEventListener('click', this.handleOutsideClick);
    },
    methods: {
        toggleSelectCoupon(id) {
            const idx = this.selectedCouponIds.indexOf(id);
            if (idx > -1) {
                this.selectedCouponIds.splice(idx, 1);
            } else {
                this.selectedCouponIds.push(id);
            }
        },
        toggleSelectAllCoupons() {
            if (this.isAllCouponsSelected) {
                this.selectedCouponIds = [];
            } else {
                this.selectedCouponIds = this.coupons.map(c => c.id);
            }
        },
        async performBulkVoidCoupons() {
            if (!confirm(`Are you sure you want to void these ${this.selectedCouponIds.length} coupon(s)? This action cannot be undone.`)) {
                return;
            }
            const success = await this.app.bulkVoidCoupons(this.selectedCouponIds);
            if (success) {
                this.selectedCouponIds = [];
                await this.loadCampaignData();
            }
        },
        handleOutsideClick(e) {
            if (!this.$el.querySelector('.custom-multiselect-container')?.contains(e.target)) {
                this.productDropdownOpen = false;
            }
        },
        isProductSelected(productId) {
            if (!this.ruleset.rules || !this.ruleset.rules.product_ids) return false;
            const ids = this.ruleset.rules.product_ids.split(',').map(id => id.trim()).filter(id => id !== '');
            return ids.includes(String(productId));
        },
        toggleProductSelection(productId) {
            if (!this.ruleset.rules) {
                this.ruleset.rules = { min_subtotal: '', product_ids: '' };
            }
            let ids = this.ruleset.rules.product_ids ? this.ruleset.rules.product_ids.split(',').map(id => id.trim()).filter(id => id !== '') : [];
            const idStr = String(productId);
            if (ids.includes(idStr)) {
                ids = ids.filter(id => id !== idStr);
            } else {
                ids.push(idStr);
            }
            this.ruleset.rules.product_ids = ids.join(', ');
        },
        removeProductSelection(productId) {
            this.toggleProductSelection(productId);
        },
        toggleProductDropdown() {
            this.productDropdownOpen = !this.productDropdownOpen;
        },
        async loadCampaignData() {
            if (this.app.activeShopFilter === 'all') return;
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` };

            try {
                // 1. Fetch Coupons List
                const cRes = await fetch(`${this.app.apiBaseUrl}/api/global/coupons?brandId=${this.app.activeShopFilter}`, { headers });
                if (cRes.ok) this.coupons = await cRes.json();

                // 2. Fetch Referral Rules
                const rRes = await fetch(`${this.app.apiBaseUrl}/api/global/referral-rules?brandId=${this.app.activeShopFilter}`, { headers });
                if (rRes.ok) {
                    const data = await rRes.json();
                    let customRules = { min_subtotal: '', product_ids: '' };
                    if (data.rules) {
                        try {
                            customRules = JSON.parse(data.rules);
                        } catch(e) {}
                    }
                    let templates = {};
                    if (data.templates) {
                        try {
                            templates = JSON.parse(data.templates);
                        } catch(e) {}
                    }
                    const locales = this.availableLocales;
                    locales.forEach(lang => {
                        if (!templates[lang]) {
                            templates[lang] = {
                                subject: lang === 'en' ? data.email_subject || 'Thank you for your order! Here is a discount code for your friends.' : '',
                                body: lang === 'en' ? data.email_body || '' : ''
                            };
                        }
                    });
                    this.ruleset = {
                        ...data,
                        rules: customRules,
                        templates
                    };
                }

                // 3. Fetch Email logs
                const lRes = await fetch(`${this.app.apiBaseUrl}/api/global/coupon-emails?brandId=${this.app.activeShopFilter}`, { headers });
                if (lRes.ok) this.emailLogs = await lRes.json();

                // 4. Load Orders for analytics and UTM performance metrics
                const oRes = await fetch(`${this.app.apiBaseUrl}/api/global/orders?brandId=${this.app.activeShopFilter}`, { headers });
                if (oRes.ok) {
                    const orders = await oRes.json();
                    this.computeMetrics(orders);
                }
            } catch (err) {
                console.error('Error fetching campaign data:', err);
            }
        },
        computeMetrics(orders) {
            let totalRedemptions = 0;
            let referralRevenue = 0;
            let referralOrderCount = 0;
            
            // Map to aggregate UTM campaign orders and values
            const utmMap = {};

            orders.forEach(o => {
                const subtotal = parseFloat(o.subtotal) || 0;
                const total = parseFloat(o.total) || 0;
                const discount = parseFloat(o.discount_amount) || 0;

                // Coupon metrics
                if (o.coupon_code && o.status === 'paid') {
                    totalRedemptions++;
                    referralRevenue += total;
                    referralOrderCount++;
                }

                // UTM performance mapping
                if (o.status === 'paid' && (o.utm_source || o.utm_campaign)) {
                    const key = `${o.utm_source || ''}_${o.utm_medium || ''}_${o.utm_campaign || ''}`;
                    if (!utmMap[key]) {
                        utmMap[key] = {
                            utm_source: o.utm_source || '',
                            utm_medium: o.utm_medium || '',
                            utm_campaign: o.utm_campaign || '',
                            order_count: 0,
                            total_revenue: 0
                        };
                    }
                    utmMap[key].order_count++;
                    utmMap[key].total_revenue += total;
                }
            });

            this.metrics.totalRedemptions = totalRedemptions;
            this.metrics.referralRevenue = referralRevenue;
            this.metrics.avgReferralOrder = referralOrderCount > 0 ? referralRevenue / referralOrderCount : 0;
            this.metrics.pendingEmails = this.emailLogs.filter(log => !log.sent_at).length;
            
            this.utmStats = Object.values(utmMap).sort((a,b) => b.total_revenue - a.total_revenue);
        },
        async saveReferralRules() {
            this.savingRules = true;
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
            };

            const payload = {
                ...this.ruleset,
                rules: {
                    min_subtotal: this.ruleset.rules.min_subtotal || '',
                    product_ids: this.ruleset.rules.product_ids ? this.ruleset.rules.product_ids.split(',').map(s => s.trim()) : []
                }
            };

            try {
                const res = await fetch(`${this.app.apiBaseUrl}/api/global/referral-rules?brandId=${this.app.activeShopFilter}`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    this.app.showNotification('Referral campaign settings saved.');
                    await this.loadCampaignData();
                } else {
                    alert('Failed to save ruleset.');
                }
            } catch(e) {
                alert(`Error: ${e.message}`);
            } finally {
                this.savingRules = false;
            }
        },
        async createPromoCoupon() {
            if (!this.newCoupon.code || !this.newCoupon.discount_value) {
                alert('Please fill out Code and Discount value.');
                return;
            }

            this.creatingCoupon = true;
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
            };

            const customRules = {};
            if (this.newCoupon.min_subtotal) {
                customRules.min_subtotal = parseFloat(this.newCoupon.min_subtotal);
            }

            const payload = {
                code: this.newCoupon.code.trim().toUpperCase(),
                discount_type: this.newCoupon.discount_type,
                discount_value: parseFloat(this.newCoupon.discount_value),
                expire_at: this.newCoupon.expire_at || null,
                rules: Object.keys(customRules).length > 0 ? customRules : null
            };

            try {
                const res = await fetch(`${this.app.apiBaseUrl}/api/global/coupons?brandId=${this.app.activeShopFilter}`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    this.app.showNotification('Promo code registered.');
                    this.newCoupon = { code: '', discount_type: 'percentage', discount_value: '', min_subtotal: '', expire_at: '' };
                    await this.loadCampaignData();
                } else {
                    const err = await res.json();
                    alert(`Sync failed: ${err.error}`);
                }
            } catch(e) {
                alert(`Error: ${e.message}`);
            } finally {
                this.creatingCoupon = false;
            }
        },
        async voidCoupon(id) {
            if (!confirm('Are you sure you want to void this coupon code? It cannot be used again.')) return;
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` };
            try {
                const res = await fetch(`${this.app.apiBaseUrl}/api/global/coupons/${id}?brandId=${this.app.activeShopFilter}`, {
                    method: 'DELETE',
                    headers
                });
                if (res.ok) {
                    this.app.showNotification('Coupon voided successfully.');
                    await this.loadCampaignData();
                }
            } catch(e) {
                alert(`Error voiding: ${e.message}`);
            }
        },
        async sendPendingEmails() {
            this.sendingPending = true;
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` };
            try {
                const res = await fetch(`${this.app.apiBaseUrl}/api/global/coupon-emails/send-pending?brandId=${this.app.activeShopFilter}`, {
                    method: 'POST',
                    headers
                });
                if (res.ok) {
                    const data = await res.json();
                    this.app.showNotification(`⚡ Simulation complete! Delivered ${data.sent_count} pending referral emails.`);
                    await this.loadCampaignData();
                }
            } catch(e) {
                alert(`Error: ${e.message}`);
            } finally {
                this.sendingPending = false;
            }
        },
        getRulesSummary(rulesJson) {
            if (!rulesJson) return 'None';
            try {
                const r = JSON.parse(rulesJson);
                const summaries = [];
                if (r.min_subtotal) summaries.push(`Min: €${parseFloat(r.min_subtotal).toFixed(2)}`);
                if (r.product_ids && r.product_ids.length > 0) summaries.push(`Restricted products`);
                return summaries.join(', ') || 'None';
            } catch(e) {
                return 'None';
            }
        },
        getStatusStyle(status) {
            if (status === 'active') return { color: '#10b981', fontWeight: '700' };
            if (status === 'used') return { color: '#3b82f6', fontWeight: '700' };
            if (status === 'expired') return { color: '#ef4444', fontWeight: '700' };
            return { color: '#767676', textDecoration: 'line-through' };
        },
        formatDate(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
    }
};
</script>

<style scoped>
.metrics-grid {
    margin-top: 10px;
}
.metric-card {
    display: flex;
    flex-direction: column;
    padding: 20px;
}
.metric-card-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.metric-card-value {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--text-main);
    margin: 8px 0 4px 0;
}
.metric-card-desc {
    font-size: 0.72rem;
    color: var(--text-muted);
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
.form-group input[type="text"],
.form-group input[type="number"] {
    height: 38px;
    padding: 0 10px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--workspace-bg);
    color: var(--text-main);
}
.data-table th, .data-table td {
    border-bottom: 1px solid var(--border);
}
</style>

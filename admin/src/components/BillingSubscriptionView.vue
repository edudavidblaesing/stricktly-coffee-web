<template>
    <div id="view-billing-subscription" class="admin-view inset-view" :class="{ active: app.activeView === 'billing-subscription' }">
        
        <!-- No Brand Selected Guard -->
        <div v-if="app.activeShopFilter === 'all'" class="panel" style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 3rem; margin-bottom: 20px;">💳</div>
            <h3 style="color: var(--text-main); margin-bottom: 8px;">No Coffee Shop Selected</h3>
            <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto;">
                Please select a specific brand from the filter at the top of the screen to inspect subscription status, AI gateway quotas, and payouts.
            </p>
        </div>

        <!-- Loading Indicator -->
        <div v-else-if="loading" class="panel" style="text-align: center; padding: 60px 20px;">
            <div class="loading-spinner" style="margin: 0 auto 15px auto;"></div>
            <p style="color: var(--text-muted); margin: 0;">Loading billing records and ledger stats...</p>
        </div>

        <!-- Dynamic Billing Views -->
        <div v-else>
            <!-- Billing Meters Grid -->
            <div class="metrics-grid" style="margin-bottom: 24px;">
                <!-- Card 1: Active Subscription Plan -->
                <div class="metric-card">
                    <div class="metric-card-body">
                        <span class="metric-label">Current Subscription Plan</span>
                        <div class="metric-main-row">
                            <span class="metric-value">{{ planName }}</span>
                            <div class="metric-sparkline">
                                <div class="metric-sparkbar" style="height: 10px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 16px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar active" style="height: 24px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 12px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 8px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar active" style="height: 20px; width: 4px; border-radius: 2px;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="metric-card-footer">
                        <span style="color: var(--text-muted); font-size: 0.65rem; display: flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border); font-weight: 700; line-height: 1; user-select: none;">i</span>
                        <span class="metric-change"
                            style="color: var(--success); font-weight: 700; display: flex; align-items: center; gap: 4px;">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="7" y1="17" x2="17" y2="7"></line>
                                <polyline points="7 7 17 7 17 17"></polyline>
                            </svg>
                            €{{ planRecurringFee }} <span style="color: var(--text-muted); font-weight: 500;">/ month</span>
                        </span>
                    </div>
                </div>

                <!-- Card 2: AI Quota Usage -->
                <div class="metric-card">
                    <div class="metric-card-body">
                        <span class="metric-label">AI Cost Gateway Quota</span>
                        <div class="metric-main-row">
                            <span class="metric-value">
                                {{ currentBrand.ai_free_tier ? 'Free' : (currentBrand.pay_as_you_go_enabled ? 'Pay As Go' : aiQuotaPercentage + '%') }}
                            </span>
                            <div class="metric-sparkline">
                                <div class="metric-sparkbar active" style="height: 14px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 8px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 18px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar active" style="height: 24px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 10px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 16px; width: 4px; border-radius: 2px;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="metric-card-footer">
                        <span style="color: var(--text-muted); font-size: 0.65rem; display: flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border); font-weight: 700; line-height: 1; user-select: none;">i</span>
                        <span class="metric-change"
                            style="color: var(--success); font-weight: 700; display: flex; align-items: center; gap: 4px;">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="7" y1="17" x2="17" y2="7"></line>
                                <polyline points="7 7 17 7 17 17"></polyline>
                            </svg>
                            <span v-if="currentBrand.ai_free_tier" style="color: var(--success);">Unlimited Free Tier</span>
                            <span v-else-if="currentBrand.pay_as_you_go_enabled" style="color: var(--success);">${{ aiUsage.total_cost_usd.toFixed(2) }} USD</span>
                            <span v-else>${{ aiUsage.total_cost_usd.toFixed(2) }} <span style="color: var(--text-muted); font-weight: 500;">/ ${{ aiLimit.toFixed(2) }} USD limit</span></span>
                        </span>
                    </div>
                </div>

                <!-- Card 3: Ledger Payout Balance -->
                <div class="metric-card">
                    <div class="metric-card-body">
                        <span class="metric-label">Ledger Payout Balance</span>
                        <div class="metric-main-row">
                            <span class="metric-value">€{{ balance.toFixed(2) }}</span>
                            <div class="metric-sparkline">
                                <div class="metric-sparkbar" style="height: 12px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar active" style="height: 22px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 14px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 8px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar active" style="height: 18px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 10px; width: 4px; border-radius: 2px;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="metric-card-footer">
                        <span style="color: var(--text-muted); font-size: 0.65rem; display: flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border); font-weight: 700; line-height: 1; user-select: none;">i</span>
                        <span class="metric-change"
                            style="color: var(--success); font-weight: 700; display: flex; align-items: center; gap: 4px;">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="7" y1="17" x2="17" y2="7"></line>
                                <polyline points="7 7 17 7 17 17"></polyline>
                            </svg>
                            Take Rate: <span style="color: var(--text-main); font-weight: 700;">{{ (currentBrand.platform_take_rate * 100).toFixed(1) }}%</span>
                        </span>
                    </div>
                </div>
            </div>

            <!-- Ledger History and Payout Controls -->
            <div class="dashboard-layout-grid">
                <!-- Left: Transactions Ledger Table -->
                <div class="panel">
                    <div class="panel-header">
                        <h3 class="panel-title">Transactions Ledger</h3>
                    </div>
                    <div class="table-responsive">
                        <table v-if="ledgerEntries.length > 0">
                            <thead>
                                <tr>
                                    <th>Transaction ID</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Gross Amount</th>
                                    <th>Platform Fee</th>
                                    <th style="text-align: right;">Net Balance Effect</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="entry in ledgerEntries" :key="entry.id">
                                    <td>
                                        <div style="font-weight: 700; color: var(--text-main);">TX-{{ String(entry.id).padStart(4, '0') }}</div>
                                    </td>
                                    <td>{{ formatDate(entry.created_at) }}</td>
                                    <td>
                                        <span v-if="entry.type === 'sale'" class="status-badge status-success" style="font-size: 0.72rem; padding: 2px 6px;">Sale</span>
                                        <span v-else-if="entry.type === 'subscription_fee'" class="status-badge status-warning" style="font-size: 0.72rem; padding: 2px 6px; background: rgba(245, 158, 11, 0.15); color: #f59e0b; border-color: rgba(245, 158, 11, 0.3);">Subscription</span>
                                        <span v-else-if="entry.type === 'payout'" class="status-badge status-info" style="font-size: 0.72rem; padding: 2px 6px; background: rgba(59, 130, 246, 0.15); color: #3b82f6; border-color: rgba(59, 130, 246, 0.3);">Disbursement</span>
                                        <span v-else class="status-badge" style="font-size: 0.72rem; padding: 2px 6px;">{{ entry.type }}</span>
                                    </td>
                                    <td>
                                        <div style="font-size: 0.8rem; color: var(--text-main);">{{ entry.description }}</div>
                                    </td>
                                    <td>{{ entry.amount !== null && entry.amount !== undefined ? '€' + parseFloat(entry.amount).toFixed(2) : '—' }}</td>
                                    <td>{{ entry.platform_margin !== null && entry.platform_margin !== undefined && parseFloat(entry.platform_margin) !== 0 ? '€' + parseFloat(entry.platform_margin).toFixed(2) : '—' }}</td>
                                    <td style="text-align: right; font-weight: 700;" :style="{ color: parseFloat(entry.net_amount) >= 0 ? 'var(--success)' : '#ef4444' }">
                                        {{ parseFloat(entry.net_amount) >= 0 ? '+' : '' }}€{{ parseFloat(entry.net_amount).toFixed(2) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div v-else style="text-align: center; padding: 40px 10px; color: var(--text-muted);">
                            No ledger transactions recorded yet for this brand.
                        </div>
                    </div>
                </div>

                <!-- Right: Billing Settings & Quick Actions -->
                <div class="panel" style="height: fit-content;">
                    <div class="panel-header">
                        <h3 class="panel-title">Billing Quick Controls</h3>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <!-- Settlement & Connect Status Details -->
                        <div style="background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 6px; border: 1px solid var(--border); font-size: 0.8rem; line-height: 1.4;">
                            <div style="font-weight: bold; margin-bottom: 6px; color: var(--text-main);">Payout Model Details</div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span>Billing Model:</span>
                                <span style="font-weight: 600;">{{ getBillingModelLabel(currentBrand.billing_type) }}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;" v-if="currentBrand.stripe_connect_account_id">
                                <span>Stripe Account ID:</span>
                                <span style="font-weight: 600; font-family: monospace;">{{ currentBrand.stripe_connect_account_id }}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span>Stripe Link Status:</span>
                                <span v-if="stripeConnectStatus === 'active'" style="font-weight: 700; color: var(--success);">Active (Direct split)</span>
                                <span v-else-if="stripeConnectStatus === 'incomplete'" style="font-weight: 700; color: #f59e0b;">Incomplete Onboarding</span>
                                <span v-else style="font-style: italic; color: var(--text-muted);">Unlinked</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 4px; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 4px;">
                                <span>Fee Billing Method:</span>
                                <span style="font-weight: 600; color: var(--accent);">{{ subscriptionBillingMethod === 'stripe_card' ? 'Credit Card' : 'Payout Ledger' }}</span>
                            </div>
                        </div>

                        <!-- Stripe Connect Link Button triggers for external_split models -->
                        <template v-if="currentBrand.billing_type === 'external_split'">
                            <button v-if="stripeConnectStatus === 'unlinked'" class="btn" @click="initiateStripeConnect" style="width: 100%; font-weight: bold; background: #635bff; color: #fff; border-color: #635bff;">
                                🔗 Link Stripe Account (Frictionless)
                            </button>
                            <button v-else-if="stripeConnectStatus === 'incomplete'" class="btn" @click="initiateStripeConnect" style="width: 100%; font-weight: bold; background: #f59e0b; color: #fff; border-color: #f59e0b;">
                                ⚠️ Complete Stripe Onboarding
                            </button>
                            <div v-else-if="stripeConnectStatus === 'active'" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 12px; border-radius: 6px; color: #10b981; font-size: 0.8rem; font-weight: 600; text-align: center; border-color: rgba(16,185,129,0.3)">
                                ✓ Stripe Connect Active & Split Ready
                            </div>
                        </template>

                        <!-- Card Billing Setup buttons when subscriptionBillingMethod is 'stripe_card' -->
                        <template v-if="subscriptionBillingMethod === 'stripe_card'">
                            <button v-if="!cardLinked" class="btn" @click="initiateStripeCardSetup" style="width: 100%; font-weight: bold; background: #635bff; color: #fff; border-color: #635bff;">
                                💳 Link Credit Card on File
                            </button>
                            <div v-else style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 12px; border-radius: 6px; color: #10b981; font-size: 0.8rem; font-weight: 600; text-align: center; border-color: rgba(16,185,129,0.3)">
                                ✓ Credit Card on File Active
                            </div>
                        </template>

                        <!-- Disburse Payout Button (Visible on positive ledger balance when using ledger-based systems or prior splits) -->
                        <button v-if="balance > 0" class="btn" @click="disbursePayout" style="width: 100%; font-weight: bold; background: var(--success); color: #fff; border-color: var(--success);">
                            💸 Process Ledger Payout Settlement
                        </button>

                        <button class="btn" @click="app.showNotification('Redirecting to Stripe Billing Portal...')" style="width: 100%;">
                            💳 Open Stripe Customer Portal
                        </button>
                        <button class="btn" @click="app.showNotification('Upgrade/downgrade must be initiated by contacting support.')" style="width: 100%; background: var(--border); color: var(--text-main); border-color: var(--border);">
                            ✨ Manage Subscription Plan
                        </button>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
export default {
    name: 'BillingSubscriptionView',
    inject: ['app'],
    data() {
        return {
            loading: false,
            balance: 0.00,
            ledgerEntries: [],
            aiUsage: { total_cost_usd: 0.00 },
            aiLimit: 0.00,
            aiQuotaPercentage: 0.0,
            currentBrand: {},
            planName: 'Free',
            planRecurringFee: '0.00',
            stripeConnectStatus: 'unlinked',
            subscriptionBillingMethod: 'ledger',
            cardLinked: false
        };
    },
    methods: {
        async fetchBillingData() {
            const brandId = this.app.activeShopFilter;
            if (!brandId || brandId === 'all') return;
            
            const brand = this.app.brands.find(b => b.id === brandId);
            if (!brand) return;
            
            this.currentBrand = brand;
            this.loading = true;
            
            // Map Plan Details
            if (brand.ai_tier === 'enterprise') {
                this.planName = 'Enterprise';
                this.planRecurringFee = '199.00';
            } else if (brand.ai_tier === 'professional') {
                this.planName = 'Professional';
                this.planRecurringFee = '99.00';
            } else if (brand.ai_tier === 'standard') {
                this.planName = 'Standard';
                this.planRecurringFee = '49.00';
            } else {
                this.planName = 'Free';
                this.planRecurringFee = '0.00';
            }
            
            try {
                const headers = { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` };
                
                // 1. Fetch Ledger entries, balance & billing settings
                const ledgerRes = await fetch(`${this.app.apiBaseUrl}/api/global/billing/ledger/${brandId}`, { headers });
                if (ledgerRes.ok) {
                    const ledgerData = await ledgerRes.json();
                    this.balance = parseFloat(ledgerData.balance) || 0.00;
                    this.ledgerEntries = ledgerData.ledger || [];
                    this.stripeConnectStatus = ledgerData.stripe_connect_status || 'unlinked';
                    this.subscriptionBillingMethod = ledgerData.subscription_billing_method || 'ledger';
                    this.cardLinked = !!ledgerData.card_linked;
                }
                
                // 2. Fetch AI Usage Summary
                const aiRes = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${brandId}/ai-usage`, { headers });
                if (aiRes.ok) {
                    const aiData = await aiRes.json();
                    this.aiUsage = aiData.summary || { total_cost_usd: 0.00 };
                }
                
                // 3. Calculate Limits & Quota
                const limits = { standard: 10.00, professional: 50.00, enterprise: 200.00, none: 0.00 };
                this.aiLimit = limits[brand.ai_tier] || 0.00;
                
                if (brand.ai_free_tier || brand.pay_as_you_go_enabled) {
                    this.aiQuotaPercentage = 0.0;
                } else if (this.aiLimit > 0) {
                    this.aiQuotaPercentage = Math.min(100.0, Math.round((this.aiUsage.total_cost_usd / this.aiLimit) * 1000) / 10);
                } else {
                    this.aiQuotaPercentage = 0.0;
                }
            } catch (err) {
                console.error('[BillingSubscriptionView] Error loading billing data:', err);
            } finally {
                this.loading = false;
            }
        },
        async initiateStripeConnect() {
            try {
                this.loading = true;
                const res = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.app.activeShopFilter}/stripe-connect-link`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    }
                });
                const data = await res.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    alert('Failed to generate connection link: ' + (data.error || 'Unknown error'));
                }
            } catch (err) {
                alert('Connection error: ' + err.message);
            } finally {
                this.loading = false;
            }
        },
        async initiateStripeCardSetup() {
            try {
                this.loading = true;
                const res = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.app.activeShopFilter}/stripe-setup-session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    }
                });
                const data = await res.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    alert('Failed to generate card link session: ' + (data.error || 'Unknown error'));
                }
            } catch (err) {
                alert('Card link session error: ' + err.message);
            } finally {
                this.loading = false;
            }
        },
        async disbursePayout() {
            const confirmPayout = confirm(`Are you sure you want to disburse a payout of €${this.balance.toFixed(2)} to the merchant? This will reduce the ledger balance in the database.`);
            if (!confirmPayout) return;
            
            try {
                const res = await fetch(`${this.app.apiBaseUrl}/api/global/billing/payout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    },
                    body: JSON.stringify({
                        brandId: this.app.activeShopFilter,
                        amount: this.balance,
                        description: `Disbursement payout of €${this.balance.toFixed(2)}`
                    })
                });
                
                if (res.ok) {
                    this.app.showNotification('Payout processed and ledger updated!');
                    await this.fetchBillingData();
                } else {
                    const err = await res.json();
                    alert(`Payout failed: ${err.error || 'Unknown error'}`);
                }
            } catch (err) {
                alert(`Error processing payout: ${err.message}`);
            }
        },
        getBillingModelLabel(type) {
            if (type === 'external_split') return 'Stripe Connect Split';
            if (type === 'free') return 'Ledger Free Model';
            return 'Standard Stripe Gateway';
        },
        formatDate(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }
    },
    watch: {
        'app.activeShopFilter': {
            handler(newVal) {
                if (newVal && newVal !== 'all') {
                    this.fetchBillingData();
                } else {
                    this.balance = 0.00;
                    this.ledgerEntries = [];
                    this.aiUsage = { total_cost_usd: 0.00 };
                    this.aiLimit = 0.00;
                    this.aiQuotaPercentage = 0.0;
                    this.currentBrand = {};
                    this.stripeConnectStatus = 'unlinked';
                    this.subscriptionBillingMethod = 'ledger';
                    this.cardLinked = false;
                }
            },
            immediate: true
        }
    }
}
</script>

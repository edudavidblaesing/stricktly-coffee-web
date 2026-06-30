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
                        <h3 class="panel-title">Manage Subscription & Billing Settings</h3>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 20px; margin-top: 15px;">
                        
                        <!-- Plan / AI Tier selector -->
                        <div>
                            <label style="margin-bottom: 8px; display: block; font-weight: bold; color: var(--text-main); font-size: 0.82rem;">💳 Select Subscription Plan Tier</label>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <!-- None/Sandbox -->
                                <div @click="currentBrand.ai_tier = 'none'" 
                                     :style="{
                                         border: currentBrand.ai_tier === 'none' ? '2px solid var(--accent)' : '1px solid var(--border)',
                                         background: currentBrand.ai_tier === 'none' ? 'rgba(197, 160, 89, 0.05)' : 'rgba(255,255,255,0.01)'
                                     }" 
                                     style="padding: 12px; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; transition: all 0.2s ease;">
                                     <div style="font-weight: 800; color: var(--text-main); font-size: 0.85rem; display: flex; justify-content: space-between;">
                                         <span>None (Sandbox Trial)</span>
                                         <span style="color: var(--accent);">€0.00 / mo</span>
                                     </div>
                                     <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.3;">
                                         Sandbox preview model. AI operations are locked or simulation-only. (2% Transaction fee)
                                     </div>
                                </div>
                                <!-- Entry Plan (Standard) -->
                                <div @click="currentBrand.ai_tier = 'standard'" 
                                     :style="{
                                         border: currentBrand.ai_tier === 'standard' ? '2px solid var(--accent)' : '1px solid var(--border)',
                                         background: currentBrand.ai_tier === 'standard' ? 'rgba(197, 160, 89, 0.05)' : 'rgba(255,255,255,0.01)'
                                     }" 
                                     style="padding: 12px; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; transition: all 0.2s ease;">
                                     <div style="font-weight: 800; color: var(--text-main); font-size: 0.85rem; display: flex; justify-content: space-between;">
                                         <span>Entry Plan</span>
                                         <span style="color: var(--accent);">€49.00 / mo</span>
                                     </div>
                                     <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.3;">
                                         Includes entry AI content creation & ad templates. (2% Transaction fee)
                                     </div>
                                </div>
                                <!-- Growth Plan (Professional) -->
                                <div @click="currentBrand.ai_tier = 'professional'" 
                                     :style="{
                                         border: currentBrand.ai_tier === 'professional' ? '2px solid var(--accent)' : '1px solid var(--border)',
                                         background: currentBrand.ai_tier === 'professional' ? 'rgba(197, 160, 89, 0.05)' : 'rgba(255,255,255,0.01)'
                                     }" 
                                     style="padding: 12px; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; transition: all 0.2s ease;">
                                     <div style="font-weight: 800; color: var(--text-main); font-size: 0.85rem; display: flex; justify-content: space-between;">
                                         <span>Growth Plan</span>
                                         <span style="color: var(--accent);">€149.00 / mo</span>
                                     </div>
                                     <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.3;">
                                         Includes AI Storefront Designer & custom page builder. (1% Transaction fee)
                                     </div>
                                </div>
                                <!-- Enterprise Plan (Enterprise) -->
                                <div @click="currentBrand.ai_tier = 'enterprise'" 
                                     :style="{
                                         border: currentBrand.ai_tier === 'enterprise' ? '2px solid var(--accent)' : '1px solid var(--border)',
                                         background: currentBrand.ai_tier === 'enterprise' ? 'rgba(197, 160, 89, 0.05)' : 'rgba(255,255,255,0.01)'
                                     }" 
                                     style="padding: 12px; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; transition: all 0.2s ease;">
                                     <div style="font-weight: 800; color: var(--text-main); font-size: 0.85rem; display: flex; justify-content: space-between;">
                                         <span>Enterprise Plan</span>
                                         <span style="color: var(--accent);">€499.00 / mo</span>
                                     </div>
                                     <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.3;">
                                         Includes autopilot dynamic ad campaigns and automation rules. (0% Transaction fee)
                                     </div>
                                </div>
                            </div>
                        </div>

                        <!-- Billing Method choice -->
                        <div v-if="currentBrand.ai_tier !== 'none'">
                            <label style="margin-bottom: 8px; display: block; font-weight: bold; color: var(--text-main); font-size: 0.82rem;">💳 Select Subscription Billing Method</label>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <!-- Credit Card -->
                                <div @click="currentBrand.subscription_billing_method = 'stripe_card'"
                                     :style="{
                                         border: currentBrand.subscription_billing_method === 'stripe_card' ? '2px solid var(--accent)' : '1px solid var(--border)',
                                         background: currentBrand.subscription_billing_method === 'stripe_card' ? 'rgba(197, 160, 89, 0.05)' : 'rgba(255,255,255,0.01)'
                                     }"
                                     style="padding: 12px; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; transition: all 0.2s ease;">
                                     <div style="font-weight: 800; color: var(--text-main); font-size: 0.85rem;">💳 Credit Card</div>
                                     <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.3;">
                                         Fixed recurring billing processed via Stripe.
                                     </div>
                                 </div>
                                 <!-- Stripe Connect -->
                                 <div @click="currentBrand.subscription_billing_method = 'stripe_connect'"
                                      :style="{
                                          border: currentBrand.subscription_billing_method === 'stripe_connect' ? '2px solid var(--accent)' : '1px solid var(--border)',
                                          background: currentBrand.subscription_billing_method === 'stripe_connect' ? 'rgba(197, 160, 89, 0.05)' : 'rgba(255,255,255,0.01)'
                                      }"
                                      style="padding: 12px; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; transition: all 0.2s ease;">
                                      <div style="font-weight: 800; color: var(--text-main); font-size: 0.85rem;">🔗 Stripe Connect</div>
                                      <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.3;">
                                          Split billing directly from transaction proceeds.
                                      </div>
                                 </div>
                                 <!-- Payout Ledger (Superadmin only) -->
                                 <div v-if="userRole.toLowerCase() === 'superadmin'"
                                      @click="currentBrand.subscription_billing_method = 'ledger'"
                                      :style="{
                                          border: currentBrand.subscription_billing_method === 'ledger' ? '2px solid var(--accent)' : '1px solid var(--border)',
                                          background: currentBrand.subscription_billing_method === 'ledger' ? 'rgba(197, 160, 89, 0.05)' : 'rgba(255,255,255,0.01)'
                                      }"
                                      style="padding: 12px; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; transition: all 0.2s ease;">
                                      <div style="font-weight: 800; color: var(--text-main); font-size: 0.85rem;">💡 Payout Ledger</div>
                                      <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.3;">
                                          Deductions processed directly from dropshipping payout balances.
                                      </div>
                                 </div>
                            </div>
                        </div>

                        <!-- Link status and action buttons -->
                        <div v-if="currentBrand.subscription_billing_method === 'stripe_card' && currentBrand.ai_tier !== 'none'" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem;">
                                <span style="color: var(--text-muted);">Card Status: <strong :style="{ color: cardLinked ? 'var(--success)' : '#ef4444' }">{{ cardLinked ? '✅ Linked' : '❌ Not Linked' }}</strong></span>
                                <button type="button" @click="initiateStripeCardSetup" class="btn" style="background: var(--accent); color: #fff; font-size: 0.75rem; padding: 4px 10px; margin: 0; font-weight: 700; height: 28px;">
                                    💳 {{ cardLinked ? 'Update Card' : 'Link Card' }}
                                </button>
                            </div>
                        </div>

                        <div v-if="currentBrand.subscription_billing_method === 'stripe_connect' && currentBrand.ai_tier !== 'none'" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem;">
                                <span style="color: var(--text-muted);">Stripe Connect: <strong :style="{ color: stripeConnectStatus === 'active' ? 'var(--success)' : '#ef4444' }">{{ stripeConnectStatus === 'active' ? '✅ Active' : '❌ Unlinked' }}</strong></span>
                                <button type="button" @click="initiateStripeConnect" class="btn" style="background: #635bff; color: #fff; font-size: 0.75rem; padding: 4px 10px; margin: 0; font-weight: 700; height: 28px;">
                                    🔗 Link Stripe Account
                                </button>
                            </div>
                        </div>

                        <!-- Update Button -->
                        <button type="button" class="btn btn-accent" @click="updateSubscriptionSettings" style="width: 100%; font-weight: 700; height: 38px; display: flex; align-items: center; justify-content: center; gap: 6px; margin: 10px 0 0 0;">
                            💾 Update Subscription Settings
                        </button>

                        <!-- Stripe Payout settlement button -->
                        <button v-if="balance > 0" class="btn" @click="disbursePayout" style="width: 100%; font-weight: bold; background: var(--success); color: #fff; border-color: var(--success); height: 38px; margin: 0;">
                            💸 Process Ledger Payout Settlement
                        </button>
                    </div>
                </div>
            </div>

            <!-- Invoices & Billing Statements Section -->
            <div class="panel" style="margin-top: 24px;">
                <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 15px;">
                    <h3 class="panel-title" style="margin: 0; display: flex; align-items: center; gap: 8px; color: var(--text-main); font-weight: 800; font-family: var(--font-display);">
                        📄 Invoices & Billing Statements
                    </h3>
                    <button v-if="userRole.toLowerCase() === 'superadmin'" 
                            @click="openManualInvoiceModal" 
                            class="btn btn-accent" 
                            style="padding: 6px 12px; font-size: 0.78rem; font-weight: 700; margin: 0;">
                        ✨ Create Manual Invoice
                    </button>
                </div>
                
                <div class="table-responsive">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--border); text-align: left;">
                                <th style="padding: 12px; color: var(--text-muted); font-weight: 700;">Invoice ID</th>
                                <th style="padding: 12px; color: var(--text-muted); font-weight: 700;">Date</th>
                                <th style="padding: 12px; color: var(--text-muted); font-weight: 700;">Description</th>
                                <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: right;">Amount</th>
                                <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: right;">VAT</th>
                                <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: center;">Status</th>
                                <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="inv in invoicesList" :key="inv.id" style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 12px; font-weight: bold; color: var(--text-main);">
                                    {{ inv.id }}
                                </td>
                                <td style="padding: 12px; color: var(--text-muted);">
                                    {{ formatDate(inv.created_at) }}
                                </td>
                                <td style="padding: 12px; color: var(--text-main);">
                                    {{ inv.description }}
                                </td>
                                <td style="padding: 12px; text-align: right; color: var(--text-main); font-weight: 700;">
                                    €{{ parseFloat(inv.amount).toFixed(2) }}
                                </td>
                                <td style="padding: 12px; text-align: right; color: var(--text-muted);">
                                    €{{ parseFloat(inv.vat_amount || 0).toFixed(2) }}
                                </td>
                                <td style="padding: 12px; text-align: center;">
                                    <span v-if="inv.status === 'paid'" class="status-badge status-success" style="font-size: 0.72rem; padding: 2px 6px;">Paid</span>
                                    <span v-else class="status-badge status-warning" style="font-size: 0.72rem; padding: 2px 6px; background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">Unpaid</span>
                                </td>
                                <td style="padding: 12px; text-align: right;">
                                    <button @click="viewInvoicePdf(inv)" 
                                            class="btn btn-secondary" 
                                            style="padding: 5px 10px; font-size: 0.75rem; font-weight: 700; margin: 0;">
                                        👁️ View PDF
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="invoicesList.length === 0">
                                <td colspan="7" style="padding: 40px; text-align: center; color: var(--text-muted);">
                                    No billing invoices available yet.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Embedded PDF Viewer Modal -->
        <div v-if="pdfViewerOpen" style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px;">
            <div class="panel" style="width: 100%; max-width: 900px; height: 90vh; padding: 20px; border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 15px; background: var(--bg-panel) !important;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
                    <h3 style="font-family: var(--font-display); font-weight: 800; font-size: 1.15rem; color: var(--text-main); margin: 0;">
                        📄 PDF Invoice Viewer
                    </h3>
                    <button class="btn btn-secondary" @click="closePdfViewer" style="margin: 0; padding: 6px 12px; font-weight: bold;">
                        ✕ Close
                    </button>
                </div>
                <div style="flex: 1; border-radius: 8px; overflow: hidden; background: #2e2e2e; border: 1px solid var(--border);">
                    <iframe :src="selectedPdfUrl" style="width: 100%; height: 100%; border: none;"></iframe>
                </div>
            </div>
        </div>

        <!-- Create Manual Invoice Modal (Superadmin Only) -->
        <div v-if="showManualInvoiceModal" style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px;">
            <div class="panel" style="width: 100%; max-width: 440px; padding: 25px; border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 15px; background: var(--bg-panel) !important;">
                <h3 style="font-family: var(--font-display); font-weight: 800; font-size: 1.2rem; color: var(--text-main); margin: 0;">
                    ✨ Create Manual PDF Invoice
                </h3>
                <form @submit.prevent="submitManualInvoice" style="display: flex; flex-direction: column; gap: 15px;">
                    <div class="form-group">
                        <label>Total Invoice Amount (€)</label>
                        <input type="number" step="0.01" v-model="manualInvoiceForm.amount" required placeholder="149.00" style="margin: 0;">
                    </div>
                    <div class="form-group">
                        <label>Estimated VAT Amount (€)</label>
                        <input type="number" step="0.01" v-model="manualInvoiceForm.vat_amount" required placeholder="31.29" style="margin: 0;">
                    </div>
                    <div class="form-group">
                        <label>Invoice Payment Status</label>
                        <select v-model="manualInvoiceForm.status" required style="margin: 0; width: 100%; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main); border-radius: 8px; padding: 10px;">
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Invoice Statement Description</label>
                        <input type="text" v-model="manualInvoiceForm.description" required placeholder="Manual Platform Setup Adjustment" style="margin: 0;">
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                        <button type="button" class="btn btn-secondary" @click="closeManualInvoiceModal" style="margin: 0;">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-accent" style="margin: 0;">
                            Generate Invoice PDF
                        </button>
                    </div>
                </form>
            </div>
        </div>

    </div>
</template>

<script>
export default {
    name: 'BillingSubscriptionView',
    inject: ['app'],
    computed: {
        userRole() {
            return this.app.userRole;
        }
    },
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
            cardLinked: false,
            invoicesList: [],
            pdfViewerOpen: false,
            selectedPdfUrl: '',
            showManualInvoiceModal: false,
            manualInvoiceForm: { amount: '', vat_amount: '', status: 'paid', description: '' }
        };
    },
    methods: {
        async fetchBillingData() {
            const brandId = this.app.activeShopFilter;
            if (!brandId || brandId === 'all') return;
            
            const brand = this.app.brands.find(b => b.id === brandId);
            if (!brand) return;
            
            this.currentBrand = { ...brand };
            this.loading = true;
            
            // Map Plan Details
            if (brand.ai_tier === 'enterprise') {
                this.planName = 'Enterprise';
                this.planRecurringFee = '499.00';
            } else if (brand.ai_tier === 'professional') {
                this.planName = 'Growth';
                this.planRecurringFee = '149.00';
            } else if (brand.ai_tier === 'standard') {
                this.planName = 'Entry';
                this.planRecurringFee = '49.00';
            } else {
                this.planName = 'Sandbox Trial';
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

                    // If active subscription amount override is set in db, display it directly
                    if (ledgerData.active_subscription_amount !== null && ledgerData.active_subscription_amount !== undefined) {
                        this.planRecurringFee = parseFloat(ledgerData.active_subscription_amount).toFixed(2);
                    }
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
            await this.fetchInvoices();
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
        },
        async updateSubscriptionSettings() {
            try {
                this.loading = true;
                const token = localStorage.getItem('sc_admin_token');
                
                const payload = {
                    ...this.currentBrand,
                    ai_tier: this.currentBrand.ai_tier,
                    subscription_billing_method: this.currentBrand.subscription_billing_method
                };

                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    this.app.showNotification('✨ Subscription settings successfully updated!');
                    await this.app.loadBrands();
                    await this.fetchBillingData();
                } else {
                    const err = await response.json();
                    alert('Update failed: ' + (err.error || 'Unknown error'));
                }
            } catch (e) {
                alert('Update network error: ' + e.message);
            } finally {
                this.loading = false;
            }
        },
        async fetchInvoices() {
            const brandId = this.app.activeShopFilter;
            if (!brandId || brandId === 'all') return;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const res = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${brandId}/invoices`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    this.invoicesList = await res.json();
                }
            } catch (err) {
                console.error('Failed to load invoices list:', err);
            }
        },
        viewInvoicePdf(inv) {
            this.selectedPdfUrl = `${this.app.apiBaseUrl}${inv.pdf_url}`;
            this.pdfViewerOpen = true;
        },
        closePdfViewer() {
            this.pdfViewerOpen = false;
            this.selectedPdfUrl = '';
        },
        openManualInvoiceModal() {
            this.manualInvoiceForm = { amount: '', vat_amount: '', status: 'paid', description: '' };
            this.showManualInvoiceModal = true;
        },
        closeManualInvoiceModal() {
            this.showManualInvoiceModal = false;
        },
        async submitManualInvoice() {
            const brandId = this.app.activeShopFilter;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const res = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${brandId}/invoices/create-manual`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(this.manualInvoiceForm)
                });
                if (res.ok) {
                    this.closeManualInvoiceModal();
                    await this.fetchInvoices();
                } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to create manual invoice.');
                }
            } catch (err) {
                console.error('Failed to save manual invoice:', err);
            }
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
                    this.invoicesList = [];
                }
            },
            immediate: true
        }
    }
}
</script>

<template>
    <div id="view-billing-subscription" class="admin-view inset-view" :class="{ active: app.activeView === 'billing-subscription' }">
        
        <!-- Billing Meters Grid -->
        <div class="metrics-grid" style="margin-bottom: 24px;">
            <div class="metric-card">
                <div class="metric-card-body">
                    <span class="metric-label">Current Subscription Plan</span>
                    <div class="metric-main-row">
                        <span class="metric-value">Enterprise</span>
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
                        €149.00 <span style="color: var(--text-muted); font-weight: 500;">/ month recurring</span>
                    </span>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-card-body">
                    <span class="metric-label">API Quota Usage</span>
                    <div class="metric-main-row">
                        <span class="metric-value">4.2%</span>
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
                        4.2k <span style="color: var(--text-muted); font-weight: 500;">/ 100k requests</span>
                    </span>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-card-body">
                    <span class="metric-label">S3 Media Storage Meter</span>
                    <div class="metric-main-row">
                        <span class="metric-value">128 MB</span>
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
                        0.25% <span style="color: var(--text-muted); font-weight: 500;">of 50 GB storage</span>
                    </span>
                </div>
            </div>
        </div>

        <div class="dashboard-layout-grid">
            <!-- Left: Invoices History -->
            <div class="panel">
                <div class="panel-header">
                    <h3 class="panel-title">Billing Invoices Ledger</h3>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Invoice ID</th>
                                <th>Billing Interval Period</th>
                                <th>Tier Charge Amount</th>
                                <th style="text-align: right;">Payment Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div style="font-weight: 700; color: var(--text-main);">INV-2026-0043</div>
                                    <span style="font-size: 0.75rem; color: var(--text-muted);">Charged via Stripe Card *4242</span>
                                </td>
                                <td>Jun 1, 2026 - Jun 30, 2026</td>
                                <td style="font-weight: 600;">€149.00</td>
                                <td style="text-align: right;"><span class="status-badge status-success" style="font-size: 0.72rem; padding: 2px 6px;">Paid</span></td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="font-weight: 700; color: var(--text-main);">INV-2026-0021</div>
                                    <span style="font-size: 0.75rem; color: var(--text-muted);">Charged via Stripe Card *4242</span>
                                </td>
                                <td>May 1, 2026 - May 31, 2026</td>
                                <td style="font-weight: 600;">€149.00</td>
                                <td style="text-align: right;"><span class="status-badge status-success" style="font-size: 0.72rem; padding: 2px 6px;">Paid</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Right: Billing Settings -->
            <div class="panel" style="height: fit-content;">
                <div class="panel-header">
                    <h3 class="panel-title">Billing Quick Controls</h3>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn" @click="app.showNotification('Redirecting to Stripe Billing Portal...')" style="width: 100%;">
                        💳 Open Stripe Customer Portal
                    </button>
                    <button class="btn" @click="app.showNotification('Upgrade tier is currently disabled.')" style="width: 100%; background: var(--border); color: var(--text-main); border-color: var(--border);">
                        ✨ Upgrade Subscriptions Tier
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
export default {
    name: 'BillingSubscriptionView',
    inject: ['app']
}
</script>

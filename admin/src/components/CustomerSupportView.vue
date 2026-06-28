<template>
    <div id="view-customer-support" class="admin-view inset-view" :class="{ active: app.activeView === 'customer-support' }">
        
        <div class="dashboard-layout-grid">
            <!-- Left: Support Ticket Inbox -->
            <div class="panel">
                <div class="panel-header">
                    <h3 class="panel-title">Direct Customer Support Inbox</h3>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Ticket Customer</th>
                                <th>Subject issue</th>
                                <th>Channel Context</th>
                                <th style="text-align: right;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div style="font-weight: 700; color: var(--text-main);">Sarah Connor</div>
                                    <span style="font-size: 0.75rem; color: var(--text-muted);">sarah.connor@cyberdyne.com</span>
                                </td>
                                <td>
                                    <div style="font-weight: 600;">Requesting E61 screen installation guide</div>
                                    <span style="font-size: 0.75rem; color: var(--text-muted);">Can you send the step by step layout pdf?</span>
                                </td>
                                <td><span class="status-pill" style="background: var(--bg-color); color: var(--text-main);">pesado</span></td>
                                <td style="text-align: right;"><span class="status-badge status-warning" style="font-size: 0.72rem; padding: 2px 6px;">Open</span></td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="font-weight: 700; color: var(--text-main);">Marcus Wright</div>
                                    <span style="font-size: 0.75rem; color: var(--text-muted);">marcus.wright@projectangel.org</span>
                                </td>
                                <td>
                                    <div style="font-weight: 600;">Tracking link redirection error</div>
                                    <span style="font-size: 0.75rem; color: var(--text-muted);">The tracking page throws a 404 on load.</span>
                                </td>
                                <td><span class="status-pill" style="background: var(--bg-color); color: var(--text-main);">pesado</span></td>
                                <td style="text-align: right;"><span class="status-badge status-success" style="font-size: 0.72rem; padding: 2px 6px;">Resolved</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Right: Support Controls -->
            <div class="panel" style="height: fit-content;">
                <div class="panel-header">
                    <h3 class="panel-title">Support Integrations</h3>
                </div>
                <p style="color: var(--text-muted); font-size: 0.82rem; margin-bottom: 16px; line-height: 1.5;">
                    Wire up external customer support CRM systems to centralize ticketing logs.
                </p>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn" @click="app.showNotification('Zendesk Integration configuration synced.')" style="width: 100%; background: var(--border); color: var(--text-main); border-color: var(--border);">
                        🎧 Sync Zendesk API ↗
                    </button>
                    <button class="btn" @click="app.showNotification('Intercom Live Chat widget loaded.')" style="width: 100%; background: var(--border); color: var(--text-main); border-color: var(--border);">
                        💬 Embed Intercom Chat Widget
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
export default {
    name: 'CustomerSupportView',
    inject: ['app']
}
</script>

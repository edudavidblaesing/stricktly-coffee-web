<template>
    <div id="view-team-performance" class="admin-view inset-view" :class="{ active: app.activeView === 'team-performance' }">
        
        <!-- Team Performance Metrics Cards -->
        <div class="metrics-grid" style="margin-bottom: 24px;">
            <div class="metric-card">
                <div class="metric-card-body">
                    <span class="metric-label">Staff Active Duty</span>
                    <div class="metric-main-row">
                        <span class="metric-value">6 Operators</span>
                        <div class="metric-sparkline">
                            <div class="metric-sparkbar" style="height: 12px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active" style="height: 24px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 10px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 16px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active" style="height: 20px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 8px; width: 4px; border-radius: 2px;"></div>
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
                        active <span style="color: var(--text-muted); font-weight: 500;">shift roster</span>
                    </span>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-card-body">
                    <span class="metric-label">Avg Packing Speed</span>
                    <div class="metric-main-row">
                        <span class="metric-value">3.4 min</span>
                        <div class="metric-sparkline">
                            <div class="metric-sparkbar active" style="height: 16px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 10px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active" style="height: 24px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 12px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active" style="height: 20px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 8px; width: 4px; border-radius: 2px;"></div>
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
                        average <span style="color: var(--text-muted); font-weight: 500;">per order</span>
                    </span>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-card-body">
                    <span class="metric-label">Fulfillment Accuracy</span>
                    <div class="metric-main-row">
                        <span class="metric-value">99.8%</span>
                        <div class="metric-sparkline">
                            <div class="metric-sparkbar" style="height: 10px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active" style="height: 18px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 14px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 8px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active" style="height: 24px; width: 4px; border-radius: 2px;"></div>
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
                        accurate <span style="color: var(--text-muted); font-weight: 500;">packaging rate</span>
                    </span>
                </div>
            </div>
        </div>

        <div class="dashboard-layout-grid">
            <!-- Left: Roster -->
            <div class="panel">
                <div class="panel-header">
                    <h3 class="panel-title">Warehouse Roster & Performance Indicators</h3>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Operator</th>
                                <th>Shift Role</th>
                                <th style="text-align: center;">Orders Handled</th>
                                <th style="text-align: right;">Speed Indicator</th>
                                <th style="text-align: right;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div style="font-weight: 700; color: var(--text-main);">John Doe</div>
                                    <span style="font-size: 0.75rem; color: var(--text-muted);">john.doe@stricktlycoffee.be</span>
                                </td>
                                <td><span class="status-pill" style="background: var(--bg-color); color: var(--text-main);">Fulfillment Lead</span></td>
                                <td style="text-align: center; font-weight: 600;">142</td>
                                <td style="text-align: right; color: var(--success); font-weight: 700;">2.8 min</td>
                                <td style="text-align: right;"><span class="status-badge status-success" style="font-size: 0.72rem; padding: 2px 6px;">On Duty</span></td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="font-weight: 700; color: var(--text-main);">Emma Smith</div>
                                    <span style="font-size: 0.75rem; color: var(--text-muted);">emma.smith@stricktlycoffee.be</span>
                                </td>
                                <td><span class="status-pill" style="background: var(--bg-color); color: var(--text-main);">Picker/Packer</span></td>
                                <td style="text-align: center; font-weight: 600;">98</td>
                                <td style="text-align: right; color: var(--success); font-weight: 700;">3.2 min</td>
                                <td style="text-align: right;"><span class="status-badge status-success" style="font-size: 0.72rem; padding: 2px 6px;">On Duty</span></td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="font-weight: 700; color: var(--text-main);">Robert Johnson</div>
                                    <span style="font-size: 0.75rem; color: var(--text-muted);">robert.j@stricktlycoffee.be</span>
                                </td>
                                <td><span class="status-pill" style="background: var(--bg-color); color: var(--text-main);">Inventory Auditor</span></td>
                                <td style="text-align: center; font-weight: 600;">64</td>
                                <td style="text-align: right; color: var(--warning); font-weight: 700;">4.1 min</td>
                                <td style="text-align: right;"><span class="status-badge status-warning" style="font-size: 0.72rem; padding: 2px 6px;">On Break</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Right: Warehouse Actions -->
            <div class="panel" style="height: fit-content;">
                <div class="panel-header">
                    <h3 class="panel-title">Staff Quick Controls</h3>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn" @click="app.showNotification('Triggered staff schedule audit.')" style="width: 100%;">
                        📅 Export Shift Logs
                    </button>
                    <button class="btn" @click="app.showNotification('Recalibrated packing speed sensor values.')" style="width: 100%; background: var(--border); color: var(--text-main); border-color: var(--border);">
                        ⚙️ Recalibrate Metrics
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
export default {
    name: 'TeamPerformanceView',
    inject: ['app']
}
</script>

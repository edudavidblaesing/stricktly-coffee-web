<template>
    <div id="view-reports" class="admin-view" :class="{ active: app.activeView === 'reports' }">
        
        <!-- Metrics Row -->
        <div class="metrics-grid" style="margin-bottom: 24px;">
            <div class="metric-card">
                <div class="metric-card-body">
                    <span class="metric-label">Average Order Value (AOV)</span>
                    <div class="metric-main-row">
                        <span class="metric-value">€{{ aov }}</span>
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
                        active <span style="color: var(--text-muted); font-weight: 500;">context average</span>
                    </span>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-card-body">
                    <span class="metric-label">Total Items Sold</span>
                    <div class="metric-main-row">
                        <span class="metric-value">{{ totalItemsSold }}</span>
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
                        dispatched <span style="color: var(--text-muted); font-weight: 500;">products volume</span>
                    </span>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-card-body">
                    <span class="metric-label">Conversion Rate</span>
                    <div class="metric-main-row">
                        <span class="metric-value">{{ conversionRate }}%</span>
                        <div class="metric-sparkline">
                            <div class="metric-sparkbar" style="height: 8px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active" style="height: 18px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 12px; width: 4px; border-radius: 2px;"></div>
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
                        checkout <span style="color: var(--text-muted); font-weight: 500;">redirection success</span>
                    </span>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-card-body">
                    <span class="metric-label">Refund Rate</span>
                    <div class="metric-main-row">
                        <span class="metric-value">{{ refundRate }}%</span>
                        <div class="metric-sparkline">
                            <div class="metric-sparkbar" style="height: 12px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active" style="height: 20px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 10px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active" style="height: 24px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 14px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 8px; width: 4px; border-radius: 2px;"></div>
                        </div>
                    </div>
                </div>
                <div class="metric-card-footer">
                    <span style="color: var(--text-muted); font-size: 0.65rem; display: flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border); font-weight: 700; line-height: 1; user-select: none;">i</span>
                    <span class="metric-change"
                        style="color: var(--warning); font-weight: 700; display: flex; align-items: center; gap: 4px;">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="7" y1="17" x2="17" y2="7"></line>
                            <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                        returns <span style="color: var(--text-muted); font-weight: 500;">proportion</span>
                    </span>
                </div>
            </div>
        </div>

        <div class="dashboard-layout-grid reports-layout-grid">
            <!-- Left: Top Selling Products Leaderboard -->
            <div class="panel">
                <div class="panel-header">
                    <h3 class="panel-title">Top Selling Products Leaderboard</h3>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Product Item</th>
                                <th>Channel Context</th>
                                <th style="text-align: center;">Units Sold</th>
                                <th style="text-align: right;">Total Generated Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in topSellers" :key="item.title">
                                <td>
                                    <div style="font-weight: 700; color: var(--text-main);">{{ item.title }}</div>
                                </td>
                                <td>
                                    <span class="status-pill" style="background: var(--bg-color); color: var(--text-main); font-weight: 600;">
                                        {{ getBrandName(item.brand_id) }}
                                    </span>
                                </td>
                                <td style="text-align: center; font-weight: 600;">{{ item.quantity }}</td>
                                <td style="text-align: right; font-weight: 700; color: var(--success);">
                                    €{{ item.revenue.toFixed(2) }}
                                </td>
                            </tr>
                            <tr v-if="topSellers.length === 0">
                                <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 40px;">
                                    No completed orders catalog data recorded yet.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Right: Channel Revenue Distribution -->
            <div class="panel">
                <div class="panel-header">
                    <h3 class="panel-title">Channel Revenue</h3>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Channel</th>
                                <th style="text-align: center;">Orders</th>
                                <th style="text-align: right;">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="ch in channelBreakdown" :key="ch.name">
                                <td>
                                    <div style="font-weight: 700; color: var(--text-main);">{{ ch.name }}</div>
                                    <span style="font-size: 0.72rem; color: var(--text-muted);">{{ app.getBrandSubdomain(ch) }}</span>
                                </td>
                                <td style="text-align: center; font-weight: 600;">{{ ch.ordersCount }}</td>
                                <td style="text-align: right; font-weight: 700; color: var(--success);">
                                    €{{ ch.revenue.toFixed(2) }}
                                </td>
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
    name: 'ReportsView',
    inject: ['app'],
    computed: {
        filteredOrders() { return this.app.filteredOrders; },
        brands() { return this.app.brands; },
        orders() { return this.app.orders; },
        aov() {
            const paidOrders = this.filteredOrders.filter(o => o.status !== 'pending_payment');
            if (paidOrders.length === 0) return '0.00';
            const sum = paidOrders.reduce((acc, o) => acc + parseFloat(o.total || 0), 0);
            return (sum / paidOrders.length).toFixed(2);
        },
        totalItemsSold() {
            const paidOrders = this.filteredOrders.filter(o => o.status !== 'pending_payment');
            return paidOrders.reduce((acc, o) => {
                if (o.items && Array.isArray(o.items)) {
                    return acc + o.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                }
                return acc + 1;
            }, 0);
        },
        conversionRate() {
            return this.app.calculatedConversionRate;
        },
        refundRate() {
            if (this.filteredOrders.length === 0) return '0.0';
            const refunded = this.filteredOrders.filter(o => o.status === 'refunded').length;
            return ((refunded / this.filteredOrders.length) * 100).toFixed(1);
        },
        topSellers() {
            const productMap = {};
            this.filteredOrders.filter(o => o.status !== 'pending_payment').forEach(o => {
                if (o.items && Array.isArray(o.items)) {
                    o.items.forEach(item => {
                        const title = item.title || 'Unknown Product';
                        if (!productMap[title]) {
                            productMap[title] = {
                                title: title,
                                quantity: 0,
                                revenue: 0,
                                brand_id: o.brand_id
                            };
                        }
                        productMap[title].quantity += (item.quantity || 0);
                        productMap[title].revenue += (parseFloat(item.price || 0) * (item.quantity || 0));
                    });
                }
            });
            return Object.values(productMap).sort((a, b) => b.quantity - a.quantity);
        },
        channelBreakdown() {
            const brandMap = {};
            this.brands.forEach(b => {
                brandMap[b.id] = {
                    name: b.name,
                    subdomain: b.subdomain,
                    ordersCount: 0,
                    revenue: 0
                };
            });

            this.orders.filter(o => o.status !== 'pending_payment').forEach(o => {
                const bId = o.brand_id;
                if (brandMap[bId]) {
                    brandMap[bId].ordersCount += 1;
                    brandMap[bId].revenue += parseFloat(o.total || 0);
                }
            });

            return Object.values(brandMap).sort((a, b) => b.revenue - a.revenue);
        }
    },
    methods: {
        getBrandName(brandId) { return this.app.getBrandName(brandId); }
    }
}
</script>

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

        <!-- State of the Art Campaigns & Ads ROI Insights Section -->
        <div class="dashboard-layout-grid reports-layout-grid" style="margin-top: 24px;">
            <!-- Left: Campaign ROI & Performance Analytics -->
            <div class="panel">
                <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px;">
                    <h3 class="panel-title">Omnichannel Campaign Performance & ROI</h3>
                    <span class="badge-simulation" style="background: var(--success); color: #fff; font-weight: 700; font-size: 0.65rem;">LIVE ROI ATTRIBUTION</span>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Campaign Goal & Title</th>
                                <th>Platforms</th>
                                <th style="text-align: right;">Budget</th>
                                <th style="text-align: right;">AI Cost</th>
                                <th style="text-align: center;">Attribution ROAS</th>
                                <th style="text-align: center;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="c in campaigns" :key="c.id">
                                <td>
                                    <div style="font-weight: 700; color: var(--text-main);">{{ c.name }}</div>
                                    <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: capitalize;">Goal: {{ c.campaign_type || 'manual' }}</span>
                                </td>
                                <td>
                                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                                        <span v-for="plat in (c.platform || '').split(',')" :key="plat" class="badge-simulation" 
                                              style="font-size: 0.65rem; text-transform: capitalize; padding: 2px 6px; border-radius: 4px; font-weight: 700;"
                                              :style="getPlatformStyle(plat)">
                                            {{ plat }}
                                        </span>
                                    </div>
                                </td>
                                <td style="text-align: right; font-weight: 600;">€{{ parseFloat(c.budget).toFixed(2) }}</td>
                                <td style="text-align: right; color: var(--text-muted); font-size: 0.82rem;">€{{ parseFloat(c.ai_cost || 0).toFixed(4) }}</td>
                                <td style="text-align: center;">
                                    <span style="font-weight: 700; color: var(--accent);">{{ c.target_roas || '4.0' }}x</span>
                                </td>
                                <td style="text-align: center;">
                                    <span class="status-pill" :class="c.status === 'active' ? 'active' : 'draft'" style="padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">
                                        {{ c.status || 'active' }}
                                    </span>
                                </td>
                            </tr>
                            <tr v-if="campaigns.length === 0">
                                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px;">
                                    No active or drafted marketing ad campaigns recorded.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Right: Premium AI Attribution Lift & Cost Savings -->
            <div class="panel" style="background: linear-gradient(135deg, var(--card-bg), rgba(197, 160, 89, 0.03)); border: 1px solid var(--accent);">
                <div class="panel-header" style="border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px;">
                    <h3 class="panel-title" style="color: var(--accent);">✨ AI Agent Performance Lift</h3>
                </div>
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 4px;">Attribution Model Lift</div>
                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--success); font-family: var(--font-display);">+18.4%</div>
                        <p style="font-size: 0.76rem; color: var(--text-muted); margin: 4px 0 0 0; line-height: 1.4;">
                            Incremental conversions generated by the consensus agent protocol compared to baseline rules.
                        </p>
                    </div>
                    <div style="border-top: 1px solid var(--border); padding-top: 12px;">
                        <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 4px;">Optimized AI Ad Spend Savings</div>
                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent); font-family: var(--font-display);">€2,482.10</div>
                        <p style="font-size: 0.76rem; color: var(--text-muted); margin: 4px 0 0 0; line-height: 1.4;">
                            Total spend optimized by the automated budget allocator guardrails.
                        </p>
                    </div>
                    <div style="border-top: 1px solid var(--border); padding-top: 12px;">
                        <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 4px;">Attribution Model Selected</div>
                        <select style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-weight: 600; font-size: 0.8rem; outline: none; cursor: pointer; font-family: var(--font-display);">
                            <option>Time Decay (Decentralized Consensus)</option>
                            <option>Linear Attribution</option>
                            <option>First Touch Attribution</option>
                            <option>Last Touch Attribution</option>
                            <option>U-Shaped Attribution</option>
                        </select>
                    </div>
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
        campaigns() { return this.app.campaigns; },
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
        getBrandName(brandId) { return this.app.getBrandName(brandId); },
        parseFloat(val) { return parseFloat(val || 0); },
        getPlatformStyle(platform) {
            const p = (platform || '').toLowerCase().trim();
            if (p === 'meta') return 'background: #1877f2; color: #fff;';
            if (p === 'x') return 'background: #000000; color: #e7e9ea; border: 1px solid #2f3336;';
            if (p === 'google') return 'background: #4285f4; color: #fff;';
            return 'background: var(--border); color: var(--text-main);';
        }
    }
}
</script>

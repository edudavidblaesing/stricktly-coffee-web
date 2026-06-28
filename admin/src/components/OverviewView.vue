<template>
    <div id="view-overview" class="admin-view" :class="{ active: app.activeView === 'overview' }">
        <!-- Click away overlay for active dropdowns -->
        <div v-if="activeDropdown" @click="activeDropdown = null" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 998; background: transparent;"></div>

        <!-- Four Metrics Cards with mini bar sparklines -->
        <div class="metrics-grid">
            <!-- CARD 1: REVENUE -->
            <div class="metric-card">
                <div class="metric-card-body">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span class="metric-label" style="margin-bottom: 0;">Total Revenue</span>
                    </div>
                    <div class="metric-main-row">
                        <span class="metric-value">{{ formattedSalesTotal }}</span>
                        <div class="metric-sparkline">
                            <div class="metric-sparkbar" style="height: 10px; width: 4px; border-radius: 2px;">
                            </div>
                            <div class="metric-sparkbar" style="height: 16px; width: 4px; border-radius: 2px;">
                            </div>
                            <div class="metric-sparkbar active"
                                style="height: 24px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 12px; width: 4px; border-radius: 2px;">
                            </div>
                            <div class="metric-sparkbar" style="height: 8px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active"
                                style="height: 20px; width: 4px; border-radius: 2px;"></div>
                        </div>
                    </div>
                </div>
                <div class="metric-card-footer">
                    <span class="info-tooltip-trigger" data-tooltip="Total accumulated revenue from all completed transactions.">i</span>
                    <span class="metric-change"
                        style="color: var(--success); font-weight: 700; display: flex; align-items: center; gap: 4px;">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="7" y1="17" x2="17" y2="7"></line>
                            <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                        +0,94 <span style="color: var(--text-muted); font-weight: 500;">last year</span>
                    </span>
                </div>
            </div>
            <!-- CARD 2: ORDERS -->
            <div class="metric-card">
                <div class="metric-card-body">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span class="metric-label" style="margin-bottom: 0;">Total Orders</span>
                    </div>
                    <div class="metric-main-row">
                        <span class="metric-value">{{ filteredOrders.length }}</span>
                        <div class="metric-sparkline">
                            <div class="metric-sparkbar active"
                                style="height: 14px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 8px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 18px; width: 4px; border-radius: 2px;">
                            </div>
                            <div class="metric-sparkbar active"
                                style="height: 24px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 10px; width: 4px; border-radius: 2px;">
                            </div>
                            <div class="metric-sparkbar" style="height: 16px; width: 4px; border-radius: 2px;">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="metric-card-footer">
                    <span class="info-tooltip-trigger" data-tooltip="The total count of orders placed across all storefronts.">i</span>
                    <span class="metric-change"
                        style="color: var(--success); font-weight: 700; display: flex; align-items: center; gap: 4px;">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="7" y1="17" x2="17" y2="7"></line>
                            <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                        +0,94 <span style="color: var(--text-muted); font-weight: 500;">last year</span>
                    </span>
                </div>
            </div>
            <!-- CARD 3: CUSTOMERS -->
            <div class="metric-card">
                <div class="metric-card-body">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span class="metric-label" style="margin-bottom: 0;">New Customers</span>
                    </div>
                    <div class="metric-main-row">
                        <span class="metric-value">{{ uniqueCustomersCount }}</span>
                        <div class="metric-sparkline">
                            <div class="metric-sparkbar" style="height: 8px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active"
                                style="height: 18px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 12px; width: 4px; border-radius: 2px;">
                            </div>
                            <div class="metric-sparkbar active"
                                style="height: 24px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 6px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 14px; width: 4px; border-radius: 2px;">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="metric-card-footer">
                    <span class="info-tooltip-trigger" data-tooltip="Number of unique customer email addresses resolved in transactions.">i</span>
                    <span class="metric-change"
                        style="color: var(--success); font-weight: 700; display: flex; align-items: center; gap: 4px;">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="7" y1="17" x2="17" y2="7"></line>
                            <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                        +0,94 <span style="color: var(--text-muted); font-weight: 500;">last year</span>
                    </span>
                </div>
            </div>
            <!-- CARD 4: CONVERSION -->
            <div class="metric-card">
                <div class="metric-card-body">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span class="metric-label" style="margin-bottom: 0;">Conversion Rate</span>
                    </div>
                    <div class="metric-main-row">
                        <span class="metric-value">{{ calculatedConversionRate }}%</span>
                        <div class="metric-sparkline">
                            <div class="metric-sparkbar active"
                                style="height: 10px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 22px; width: 4px; border-radius: 2px;">
                            </div>
                            <div class="metric-sparkbar" style="height: 14px; width: 4px; border-radius: 2px;">
                            </div>
                            <div class="metric-sparkbar" style="height: 8px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar active"
                                style="height: 24px; width: 4px; border-radius: 2px;"></div>
                            <div class="metric-sparkbar" style="height: 12px; width: 4px; border-radius: 2px;">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="metric-card-footer">
                    <span class="info-tooltip-trigger" data-tooltip="Ratio of product page impressions converted into paid orders.">i</span>
                    <span class="metric-change"
                        style="color: var(--success); font-weight: 700; display: flex; align-items: center; gap: 4px;">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="7" y1="17" x2="17" y2="7"></line>
                            <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                        +0,94 <span style="color: var(--text-muted); font-weight: 500;">last year</span>
                    </span>
                </div>
            </div>
        </div>

        <!-- Charts Trend panels -->
        <div class="charts-grid">
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title" style="text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.05em; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                        Sales Trend
                        <span class="info-tooltip-trigger" data-tooltip="Gross sales revenue plotted over time segments (Daily, Weekly, Monthly, Yearly), split by customer segment.">i</span>
                    </div>
                    <div class="dots-dropdown-container">
                        <div @click="toggleDropdown('sales')" style="color: var(--text-muted); font-size: 0.85rem; cursor: pointer; letter-spacing: 0.05em; padding: 4px 8px; user-select: none;">•••</div>
                        <div v-if="activeDropdown === 'sales'" class="dots-dropdown-menu">
                            <div class="dots-dropdown-item" @click="toggleChartType('sales')">
                                {{ app.salesChartType === 'line' ? '📊 Switch to Bar Chart' : '📈 Switch to Line Chart' }}
                            </div>
                            <div class="dots-dropdown-item" @click="exportChartCSV('sales')">📥 Export Chart Data (CSV)</div>
                            <div class="dots-dropdown-item" @click="refreshChart">🔄 Refresh Analytics</div>
                        </div>
                    </div>
                </div>
                
                <!-- Chart content body -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
                    <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">
                        Total Revenue: <span
                            style="font-size: 1.3rem; color: var(--text-main); font-weight: 800; margin-left: 4px;">{{
                            formattedSalesTotal }}</span>
                    </div>
                    <div class="chart-legends" style="display: flex; gap: 16px; font-size: 0.78rem;">
                        <div class="chart-legend-item" style="display: flex; align-items: center; gap: 6px;">
                            <div class="chart-legend-dot" style="background: #e6e8ec; width: 8px; height: 8px; border-radius: 50%;"></div>
                            New User
                        </div>
                        <div class="chart-legend-item" style="display: flex; align-items: center; gap: 6px;">
                            <div class="chart-legend-dot" style="background: #1a1d1f; width: 8px; height: 8px; border-radius: 50%;"></div>
                            Existing User
                        </div>
                    </div>
                    <div class="tab-track" style="margin-left: auto;">
                        <button class="tab-pill" :class="{ active: app.analyticsTimeframe === 'Weekly' }" @click="setAnalyticsTimeframe('Weekly')">Weekly</button>
                        <button class="tab-pill" :class="{ active: app.analyticsTimeframe === 'Monthly' || !app.analyticsTimeframe }" @click="setAnalyticsTimeframe('Monthly')">Monthly</button>
                        <button class="tab-pill" :class="{ active: app.analyticsTimeframe === 'Yearly' }" @click="setAnalyticsTimeframe('Yearly')">Yearly</button>
                    </div>
                </div>
                
                <div class="chart-container">
                    <canvas id="salesChart"></canvas>
                </div>
            </div>

            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title" style="text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.05em; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                        Revenue Breakdown
                        <span class="info-tooltip-trigger" data-tooltip="Contribution of each coffee shop brand to the total sales.">i</span>
                    </div>
                    <div class="dots-dropdown-container">
                        <div @click="toggleDropdown('revenue')" style="color: var(--text-muted); font-size: 0.85rem; cursor: pointer; letter-spacing: 0.05em; padding: 4px 8px; user-select: none;">•••</div>
                        <div v-if="activeDropdown === 'revenue'" class="dots-dropdown-menu">
                            <div class="dots-dropdown-item" @click="toggleChartType('revenue')">
                                {{ app.funnelChartType === 'line' ? '📊 Switch to Bar Chart' : '📈 Switch to Line Chart' }}
                            </div>
                            <div class="dots-dropdown-item" @click="exportChartCSV('revenue')">📥 Export Chart Data (CSV)</div>
                            <div class="dots-dropdown-item" @click="refreshChart">🔄 Refresh Analytics</div>
                        </div>
                    </div>
                </div>
                
                <!-- Content body -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 12px;">
                    <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">
                        Revenue by Category
                        <div style="font-size: 1.3rem; color: var(--text-main); font-weight: 800; margin-top: 2px;">
                            {{ formattedSalesTotal }}</div>
                    </div>
                    <select v-model="app.analyticsStartDate" @change="app.renderAnalyticsCharts" class="pill-btn" style="padding: 4px 8px; font-size: 0.75rem; height: 32px; margin-left: auto; outline: none; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-weight: 600; cursor: pointer;">
                        <option value="">All Time</option>
                        <option value="2025-08-30">Since Aug 30, 2025</option>
                        <option value="2025-06-01">Since Jun 1, 2025</option>
                        <option value="2025-01-01">Since Jan 1, 2025</option>
                    </select>
                </div>

                <div class="ai-banner"
                    @click="triggerUpcoming('AI Business Insights', 'Launches deep neural analytics analysis targeting dropshipping conversions.')"
                    style="margin-bottom: 16px;">
                    <span>✨ Get AI insight for better analysis</span>
                    <span style="color: var(--text-muted);">→</span>
                </div>

                <div class="chart-container" style="height: 180px;">
                    <canvas id="funnelChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Recent Transactions Card matching mockup layout exactly -->
        <div class="panel" style="margin-top: 24px;">
            <div class="panel-header">
                <h3 class="panel-title">
                    Recent Transactions
                    <span class="info-tooltip-trigger" data-tooltip="Audit log of the latest customer purchases, order totals, and fulfillment statuses.">i</span>
                </h3>
                <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                    <div class="header-search-container" style="width: 220px; position: relative;">
                        <svg class="header-search-icon" width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2.5"
                            style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none;">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input type="text" class="header-search-input" placeholder="Search transactions..."
                            v-model="ordersSearchQuery"
                            style="padding: 6px 12px 6px 30px; height: 36px; line-height: 36px; border: 1px solid var(--border); border-radius: 8px; width: 100%; background: var(--card-bg); color: var(--text-main); font-size: 0.82rem;">
                    </div>
                    <button class="pill-btn"
                        @click="app.openNewTransactionModal"
                        style="height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-weight: 600; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px; margin: 0;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5" style="margin-right: 2px;">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Transaction
                    </button>
                    <div class="dots-dropdown-container">
                        <button class="action-dots-btn"
                            @click="toggleDropdown('transactions_bulk')"
                            style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-muted); font-size: 1.1rem; cursor: pointer; margin: 0;">···</button>
                        <div v-if="activeDropdown === 'transactions_bulk'" class="dots-dropdown-menu">
                            <div class="dots-dropdown-item" @click="exportTransactionsCSV">📥 Export Transactions CSV</div>
                            <div class="dots-dropdown-item" @click="markAllPaid">🔔 Mark All Pending Paid</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th class="checkbox-cell" style="width: 40px; text-align: center;">
                                <div class="checkbox-custom" :class="{ checked: isAllOrdersSelected }" @click="toggleSelectAllOrders"
                                    style="width: 16px; height: 16px; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; display: inline-block;">
                                </div>
                            </th>
                            <th
                                style="font-weight: 600; font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted);">
                                ID</th>
                            <th
                                style="font-weight: 600; font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted);">
                                Customer</th>
                            <th
                                style="font-weight: 600; font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted);">
                                Product</th>
                            <th
                                style="font-weight: 600; font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted);">
                                Status</th>
                            <th
                                style="font-weight: 600; font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted);">
                                Qty</th>
                            <th
                                style="font-weight: 600; font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted);">
                                Unit Price</th>
                            <th
                                style="font-weight: 600; font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted);">
                                Total Revenue</th>
                            <th
                                style="font-weight: 600; font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); text-align: center;">
                                Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="order in searchedOrders" :key="order.id" :class="{ selected: selectedOrderIds.includes(order.id) }">
                            <td class="checkbox-cell" style="text-align: center;" @click.stop>
                                <div class="checkbox-custom" :class="{ checked: selectedOrderIds.includes(order.id) }" @click="toggleSelectOrder(order.id)"
                                    style="width: 16px; height: 16px; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; display: inline-block;">
                                </div>
                            </td>
                            <td><strong style="color: var(--text-muted);">#{{ order.id.slice(0, 5) }}</strong>
                            </td>
                            <td>
                                <div><strong>{{ order.customer_name }}</strong></div>
                            </td>
                            <td>{{ getOrderProductTitle(order) }}</td>
                            <td>
                                <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 0.85rem;"
                                    :style="{ color: order.status === 'pending_payment' ? '#f59e0b' : (order.status === 'refunded' ? '#9a9fa5' : '#10b981') }">
                                    <span
                                        style="width: 8px; height: 8px; border-radius: 50%; display: inline-block;"
                                        :style="{ background: order.status === 'pending_payment' ? '#f59e0b' : (order.status === 'refunded' ? '#9a9fa5' : '#10b981') }"></span>
                                    {{ getStatusLabel(order.status) }}
                                </div>
                            </td>
                            <td>{{ getOrderQty(order) }}</td>
                            <td>€{{ getOrderUnitPrice(order) }}</td>
                            <td><strong>€{{ parseFloat(order.total).toFixed(2) }}</strong></td>
                            <td style="text-align: center;">
                                <div class="dots-dropdown-container">
                                    <button class="action-dots-btn"
                                        @click="toggleDropdown(order.id)"
                                        style="width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-muted); cursor: pointer; font-size: 0.9rem; margin: 0;">···</button>
                                    <div v-if="activeDropdown === order.id" class="dots-dropdown-menu" style="right: 0; left: auto; top: 100%;">
                                        <div class="dots-dropdown-item" @click="printReceipt(order)">🧾 View Receipt / Invoice</div>
                                        <div class="dots-dropdown-item" @click="trackShipment(order)">🚚 Track Shipment</div>
                                        <div v-if="order.status !== 'refunded'" class="dots-dropdown-item" @click="refundOrder(order)" style="color: #ef4444;">🔄 Refund Order</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="searchedOrders.length === 0">
                            <td colspan="9"
                                style="text-align: center; color: var(--text-muted); padding: 30px;">No recent
                                transactions matches found.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Floating Bulk Actions Bar -->
        <div v-if="selectedOrderIds.length > 0" class="bulk-actions-bar">
            <span><strong>{{ selectedOrderIds.length }}</strong> transactions selected</span>
            <div class="btn-group">
                <button class="bulk-btn" @click="performBulkStatus('paid')">Mark Paid</button>
                <button class="bulk-btn" @click="performBulkStatus('refunded')">Mark Refunded</button>
                <button class="bulk-btn btn-danger" @click="performBulkDelete">Delete</button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'OverviewView',
    inject: ['app'],
    data() {
        return {
            selectedOrderIds: [],
            activeDropdown: null
        };
    },
    computed: {
        formattedSalesTotal() { return this.app.formattedSalesTotal; },
        filteredOrders() { return this.app.filteredOrders; },
        uniqueCustomersCount() { return this.app.uniqueCustomersCount; },
        calculatedConversionRate() { return this.app.calculatedConversionRate; },
        searchedOrders() { return this.app.searchedOrders; },
        ordersSearchQuery: {
            get() { return this.app.ordersSearchQuery; },
            set(val) { this.app.ordersSearchQuery = val; }
        },
        isAllOrdersSelected() {
            return this.searchedOrders.length > 0 && this.searchedOrders.every(o => this.selectedOrderIds.includes(o.id));
        }
    },
    methods: {
        triggerUpcoming(title, desc) { return this.app.triggerUpcoming(title, desc); },
        getOrderProductTitle(order) { return this.app.getOrderProductTitle(order); },
        getStatusLabel(status) { return this.app.getStatusLabel(status); },
        getOrderQty(order) { return this.app.getOrderQty(order); },
        getOrderUnitPrice(order) { return this.app.getOrderUnitPrice(order); },
        parseFloat(val) { return parseFloat(val); },
        toggleSelectOrder(id) {
            const idx = this.selectedOrderIds.indexOf(id);
            if (idx > -1) {
                this.selectedOrderIds.splice(idx, 1);
            } else {
                this.selectedOrderIds.push(id);
            }
        },
        toggleSelectAllOrders() {
            if (this.isAllOrdersSelected) {
                this.selectedOrderIds = [];
            } else {
                this.selectedOrderIds = this.searchedOrders.map(o => o.id);
            }
        },
        async performBulkStatus(status) {
            const success = await this.app.bulkUpdateOrderStatus(this.selectedOrderIds, status);
            if (success) {
                this.selectedOrderIds = [];
            }
        },
        async performBulkDelete() {
            const success = await this.app.bulkDeleteOrders(this.selectedOrderIds);
            if (success) {
                this.selectedOrderIds = [];
            }
        },

        setAnalyticsTimeframe(val) {
            this.app.analyticsTimeframe = val;
            this.app.renderAnalyticsCharts();
        },
        toggleDropdown(dropdownName) {
            if (this.activeDropdown === dropdownName) {
                this.activeDropdown = null;
            } else {
                this.activeDropdown = dropdownName;
            }
        },
        toggleChartType(chartName) {
            if (chartName === 'sales') {
                this.app.salesChartType = this.app.salesChartType === 'line' ? 'bar' : 'line';
            } else {
                this.app.funnelChartType = this.app.funnelChartType === 'line' ? 'bar' : 'line';
            }
            this.app.renderAnalyticsCharts();
            this.activeDropdown = null;
        },
        refreshChart() {
            this.app.showNotification("Refreshing analytics data...");
            this.app.renderAnalyticsCharts();
            this.activeDropdown = null;
        },
        exportChartCSV(chartName) {
            let csvContent = "data:text/csv;charset=utf-8,";
            if (chartName === 'sales') {
                csvContent += "Timeframe,New User Revenue,Existing User Revenue\n";
                if (window.salesChartInstance) {
                    const labels = window.salesChartInstance.data.labels;
                    const dsNew = window.salesChartInstance.data.datasets[0].data;
                    const dsExist = window.salesChartInstance.data.datasets[1].data;
                    labels.forEach((label, idx) => {
                        csvContent += `"${label}",${dsNew[idx]},${dsExist[idx]}\n`;
                    });
                }
            } else {
                csvContent += "Brand Category,Total Revenue (EUR)\n";
                if (window.funnelChartInstance) {
                    const labels = window.funnelChartInstance.data.labels;
                    const ds = window.funnelChartInstance.data.datasets[0].data;
                    labels.forEach((label, idx) => {
                        csvContent += `"${label}",${ds[idx]}\n`;
                    });
                }
            }
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${chartName}_analytics_export.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.app.showNotification("CSV downloaded successfully!");
            this.activeDropdown = null;
        },
        exportTransactionsCSV() {
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Order ID,Customer Name,Customer Email,Product,Status,Qty,Price,Total\n";
            this.searchedOrders.forEach(o => {
                const prodTitle = this.getOrderProductTitle(o);
                const qty = this.getOrderQty(o);
                const price = this.getOrderUnitPrice(o);
                csvContent += `"${o.id}","${o.customer_name}","${o.customer_email}","${prodTitle}","${o.status}",${qty},${price},${o.total}\n`;
            });
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `transactions_export.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.app.showNotification("Transactions CSV exported!");
            this.activeDropdown = null;
        },
        async markAllPaid() {
            let count = 0;
            const pendings = this.searchedOrders.filter(o => o.status === 'pending_payment');
            for (const o of pendings) {
                try {
                    const response = await fetch(`${this.app.apiBaseUrl}/api/global/orders/${o.id}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                        },
                        body: JSON.stringify({ status: 'paid' })
                    });
                    if (response.ok) count++;
                } catch(e) {}
            }
            this.app.showNotification(`Marked ${count} pending orders as paid!`);
            this.app.loadOrders();
            this.activeDropdown = null;
        },
        printReceipt(order) {
            alert(`Receipt for Order #${order.id.slice(0, 5)}\nCustomer: ${order.customer_name}\nTotal: €${parseFloat(order.total).toFixed(2)}\n\n(Printing mock invoice PDF...)`);
            this.activeDropdown = null;
        },
        trackShipment(order) {
            alert(`Tracking info for Order #${order.id.slice(0, 5)}\nCarrier: DHL Express\nTracking Number: JD014600003461\nStatus: In Transit`);
            this.activeDropdown = null;
        },
        async refundOrder(order) {
            if (confirm(`Are you sure you want to refund and cancel Order #${order.id.slice(0, 5)}?`)) {
                try {
                    const response = await fetch(`${this.app.apiBaseUrl}/api/global/orders/${order.id}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                        },
                        body: JSON.stringify({ status: 'refunded' })
                    });
                    if (response.ok) {
                        this.app.showNotification(`Order #${order.id.slice(0, 5)} refunded.`);
                        this.app.loadOrders();
                    } else {
                        alert('Failed to update status.');
                    }
                } catch(e) {
                    alert(e.message);
                }
            }
            this.activeDropdown = null;
        }
    }
}
</script>

<template>
    <div id="view-orders" class="admin-view inset-view" :class="{ active: app.activeView === 'orders' }">
        <div class="panel">
            <div class="panel-header">
                <h3 class="panel-title">
                    Recent Transactions
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5" style="color: var(--text-muted);">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </h3>
                <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                    <div class="header-search-container" style="width: 220px;">
                        <svg class="header-search-icon" width="12" height="12" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2.5">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input type="text" class="header-search-input" placeholder="Search transactions..."
                            v-model="ordersSearchQuery"
                            style="padding: 6px 12px 6px 32px; height: 32px; line-height: 32px;">
                    </div>
                    <button class="pill-btn"
                        @click="triggerUpcoming('Transactions Ledger Creator', 'Manually inject transactions.')"
                        style="height: 32px; padding: 0 12px;">+ Add Transaction</button>
                    <button class="action-dots-btn">···</button>
                </div>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th class="checkbox-cell">
                                <div class="checkbox-custom" :class="{ checked: isAllOrdersSelected }" @click="toggleSelectAllOrders"></div>
                            </th>
                            <th><span class="sort-header">ID ↕</span></th>
                            <th><span class="sort-header">Customer ↕</span></th>
                            <th>Product</th>
                            <th>Status</th>
                            <th><span class="sort-header">Qty ↕</span></th>
                            <th><span class="sort-header">Unit Price ↕</span></th>
                            <th><span class="sort-header">Total Revenue ↕</span></th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="order in searchedOrders" :key="order.id" :class="{ selected: selectedOrderIds.includes(order.id) }">
                            <td class="checkbox-cell" @click.stop>
                                <div class="checkbox-custom" :class="{ checked: selectedOrderIds.includes(order.id) }" @click="toggleSelectOrder(order.id)"></div>
                            </td>
                            <td><strong>#{{ order.id.slice(0, 5) }}</strong>
                                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
                                    {{ formatDate(order.created_at) }}</div>
                            </td>
                            <td>
                                <div><strong>{{ order.customer_name }}</strong></div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">{{
                                    order.customer_email }}</div>
                            </td>
                            <td>{{ getOrderProductTitle(order) }}</td>
                            <td>
                                <span class="status-pill" :class="getStatusClass(order.status)">{{
                                    getStatusLabel(order.status) }}</span>
                            </td>
                            <td>{{ getOrderQty(order) }}</td>
                            <td>€{{ getOrderUnitPrice(order) }}</td>
                            <td><strong>€{{ parseFloat(order.total).toFixed(2) }}</strong></td>
                            <td>
                                <button class="action-dots-btn">···</button>
                            </td>
                        </tr>
                        <tr v-if="searchedOrders.length === 0">
                            <td colspan="9"
                                style="text-align: center; color: var(--text-muted); padding: 30px;">No
                                transactions logged.</td>
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
    name: 'OrdersView',
    inject: ['app'],
    data() {
        return {
            selectedOrderIds: []
        };
    },
    computed: {
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
        formatDate(date) { return this.app.formatDate(date); },
        getOrderProductTitle(order) { return this.app.getOrderProductTitle(order); },
        getStatusClass(status) { return this.app.getStatusClass(status); },
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
        }
    }
}
</script>

<template>
    <div id="view-customers" class="admin-view inset-view" :class="{ active: app.activeView === 'customers' }">
        <div class="panel">
            <div class="panel-header">
                <h3 class="panel-title">
                    Customer Directory
                    <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500; margin-left: 8px;">
                        {{ searchedCustomers.length }} customers recorded
                    </span>
                </h3>
                <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                    <div class="header-search-container" style="width: 220px; position: relative;">
                        <svg class="header-search-icon" width="12" height="12" viewBox="0 0 24 24"
                             fill="none" stroke="currentColor" stroke-width="2.5"
                             style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted);">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input type="text" class="header-search-input" placeholder="Search customers..."
                            v-model="customerSearchQuery"
                            style="padding: 6px 12px 6px 30px; height: 36px; line-height: 36px; border: 1px solid var(--border); border-radius: 8px; width: 100%; background: var(--card-bg); color: var(--text-main); font-size: 0.82rem;">
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th class="checkbox-cell" style="width: 40px;">
                                <div class="checkbox-custom" :class="{ checked: isAllCustomersSelected }" @click="toggleSelectAllCustomers"></div>
                            </th>
                            <th>Customer</th>
                            <th>Brand Channel</th>
                            <th>Attribution Channel</th>
                            <th style="text-align: center;">Preferred Lang</th>
                            <th style="text-align: center;">Orders Count</th>
                            <th style="text-align: right;">Total Spent (CLV)</th>
                            <th style="text-align: right;">Latest Activity</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="c in searchedCustomers" :key="c.email" :class="{ selected: selectedCustomerEmails.includes(c.email) }" @click="app.viewCustomerOrders(c.email)" style="cursor: pointer;">
                            <td class="checkbox-cell" @click.stop>
                                <div class="checkbox-custom" :class="{ checked: selectedCustomerEmails.includes(c.email) }" @click="toggleSelectCustomer(c.email)"></div>
                            </td>
                            <td>
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div class="workspace-dropdown-avatar" style="width: 32px; height: 32px; font-weight: 700; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--border); color: var(--text-main);">
                                        {{ c.name.charAt(0).toUpperCase() }}
                                    </div>
                                    <div>
                                        <strong style="color: var(--text-main); font-size: 0.88rem; display: block;">{{ c.name }}</strong>
                                        <span style="color: var(--text-muted); font-size: 0.78rem;">{{ c.email }}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="badge-simulation" style="font-size: 0.72rem; padding: 3px 8px; background: var(--border); color: var(--text-main); border-radius: 4px; text-transform: uppercase;">
                                    {{ c.brand_id }}
                                </span>
                            </td>
                            <td>
                                <span class="badge-simulation" style="font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; font-weight: 600;" :style="getAttributionStyle(c.attribution_channel)">
                                    {{ c.attribution_channel || 'Direct' }}
                                </span>
                            </td>
                            <td style="text-align: center; text-transform: uppercase; font-weight: 700; font-size: 0.8rem; color: var(--text-main);">
                                {{ c.language || 'en' }}
                            </td>
                            <td style="text-align: center; font-weight: 600;">{{ c.ordersCount }}</td>
                            <td style="text-align: right; font-weight: 700; color: var(--success);">
                                €{{ c.totalSpent.toFixed(2) }}
                            </td>
                            <td style="text-align: right; color: var(--text-muted); font-size: 0.82rem;">
                                {{ formatDate(c.lastOrderDate) }}
                            </td>
                        </tr>
                        <tr v-if="searchedCustomers.length === 0">
                            <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 40px;">
                                No customers found matching search parameters.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Floating Bulk Actions Bar -->
        <div v-if="selectedCustomerEmails.length > 0" class="bulk-actions-bar">
            <span><strong>{{ selectedCustomerEmails.length }}</strong> customers selected</span>
            <div class="btn-group">
                <button class="bulk-btn btn-danger" @click="performBulkDeleteCustomers">Delete Selected</button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CustomersView',
    inject: ['app'],
    data() {
        return {
            selectedCustomerEmails: []
        };
    },
    computed: {
        searchedCustomers() { return this.app.searchedCustomers; },
        customerSearchQuery: {
            get() { return this.app.customerSearchQuery; },
            set(val) { this.app.customerSearchQuery = val; }
        },
        isAllCustomersSelected() {
            return this.searchedCustomers.length > 0 && this.searchedCustomers.every(c => this.selectedCustomerEmails.includes(c.email));
        }
    },
    methods: {
        formatDate(date) { return this.app.formatDate(date); },
        getAttributionStyle(channel) {
            const ch = (channel || '').toLowerCase();
            if (ch.includes('paid')) return 'background: #10b981; color: #fff;';
            if (ch.includes('organic')) return 'background: #3b82f6; color: #fff;';
            if (ch.includes('social')) return 'background: #8b5cf6; color: #fff;';
            if (ch.includes('referral')) return 'background: #f59e0b; color: #fff;';
            return 'background: var(--border); color: var(--text-main);';
        },
        toggleSelectCustomer(email) {
            const idx = this.selectedCustomerEmails.indexOf(email);
            if (idx > -1) {
                this.selectedCustomerEmails.splice(idx, 1);
            } else {
                this.selectedCustomerEmails.push(email);
            }
        },
        toggleSelectAllCustomers() {
            if (this.isAllCustomersSelected) {
                this.selectedCustomerEmails = [];
            } else {
                this.selectedCustomerEmails = this.searchedCustomers.map(c => c.email);
            }
        },
        async performBulkDeleteCustomers() {
            const orderIdsToDelete = [];
            this.app.orders.forEach(o => {
                if (o.customer_email && this.selectedCustomerEmails.includes(o.customer_email.trim().toLowerCase())) {
                    orderIdsToDelete.push(o.id);
                }
            });

            if (orderIdsToDelete.length === 0) {
                this.selectedCustomerEmails = [];
                return;
            }

            if (confirm(`Are you sure you want to permanently delete the selected ${this.selectedCustomerEmails.length} customer(s)? This will delete all of their ${orderIdsToDelete.length} associated transactions from the audit database.`)) {
                const success = await this.app.bulkDeleteOrders(orderIdsToDelete);
                if (success) {
                    this.selectedCustomerEmails = [];
                }
            }
        }
    }
}
</script>

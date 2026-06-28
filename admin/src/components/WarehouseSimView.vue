<template>
    <div id="view-warehouse-sim" class="admin-view" :class="{ active: app.activeView === 'warehouse-sim' }">
        <div class="panel" style="max-width: 600px;">
            <div class="panel-header">
                <h3 class="panel-title">Fulfillment Warehouse Simulator</h3>
            </div>
            <p
                style="color: var(--text-muted); font-size: 0.88rem; margin: 8px 0 20px 0; line-height: 1.5;">
                Select an onboarded brand store below to launch its dedicated Shopify simulated fulfillment
                warehouse.
            </p>
            <div class="form-grid" style="grid-template-columns: 1fr;">
                <div class="form-group">
                    <label>Select Brand Store</label>
                    <select v-model="simBrandId" required>
                        <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
                    </select>
                </div>
                <div class="form-group" style="margin-top: 10px;">
                    <button type="button" class="btn" @click="launchWarehouseSimulator">
                        Launch Warehouse Simulator ↗
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'WarehouseSimView',
    inject: ['app'],
    computed: {
        brands() { return this.app.brands; },
        simBrandId: {
            get() { return this.app.simBrandId; },
            set(val) { this.app.simBrandId = val; }
        }
    },
    methods: {
        launchWarehouseSimulator() { return this.app.launchWarehouseSimulator(); }
    }
}
</script>

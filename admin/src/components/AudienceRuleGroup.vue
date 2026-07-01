<template>
  <div class="audience-rule-group" style="border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: rgba(255, 255, 255, 0.015); margin-bottom: 12px; position: relative;">
    <!-- Group Header: Connector Select & Actions -->
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Match Mode:</span>
        <select v-model="group.logicalOperator" 
                style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.75rem; font-weight: bold; cursor: pointer; outline: none;">
          <option value="AND">AND (All match)</option>
          <option value="OR">OR (Any match)</option>
          <option value="XOR">XOR (Exactly one matches)</option>
          <option value="NAND">NAND (Not all match)</option>
          <option value="NOR">NOR (None match)</option>
        </select>
      </div>

      <div style="display: flex; gap: 6px;">
        <button type="button" @click="addRule" class="btn btn-secondary" 
                style="font-size: 0.68rem; padding: 4px 8px; height: 26px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; border: 1px dashed var(--border); background: transparent; margin: 0;">
          ➕ Rule
        </button>
        <button type="button" @click="addGroup" class="btn btn-secondary" 
                style="font-size: 0.68rem; padding: 4px 8px; height: 26px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; border: 1px dashed var(--border); background: transparent; margin: 0;">
          ➕ Group
        </button>
        <button v-if="!isRoot" type="button" @click="$emit('delete')" class="btn" 
                style="font-size: 0.68rem; padding: 4px 8px; height: 26px; border-radius: 4px; display: inline-flex; align-items: center; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); margin: 0; cursor: pointer;">
          🗑️ Delete Group
        </button>
      </div>
    </div>

    <!-- Group Children Items -->
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div v-for="(item, idx) in group.rules" :key="idx" style="display: flex; flex-direction: column;">
        
        <!-- Case 1: Rule Item -->
        <div v-if="item.type === 'rule'" 
             style="display: flex; align-items: center; gap: 6px; padding: 8px; border-radius: 6px; background: rgba(255, 255, 255, 0.005); border: 1px solid rgba(255, 255, 255, 0.03); flex-wrap: wrap;">
          
          <!-- Field Selector -->
          <select v-model="item.field" @change="onFieldChange(item)"
                  style="padding: 6px; border-radius: 4px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.72rem; outline: none; min-width: 120px;">
            <option value="total_spent">Total Spent (€)</option>
            <option value="orders_count">Orders Count</option>
            <option value="days_since_last_order">Days Since Last Order</option>
            <option value="customer_country">Country Code</option>
            <option value="email_domain">Email Domain</option>
            <option value="last_purchased_item">Last Purchased SKU</option>
          </select>

          <!-- Operator Selector -->
          <select v-model="item.operator"
                  style="padding: 6px; border-radius: 4px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.72rem; outline: none;">
            <option value="gt">Greater than (&gt;)</option>
            <option value="lt">Less than (&lt;)</option>
            <option value="eq">Equals (=)</option>
            <option value="contains">Contains</option>
            <option value="starts_with">Starts with</option>
          </select>

          <!-- Value Field -->
          <input :type="getValueType(item.field)" 
                 v-model="item.value" 
                 placeholder="Value"
                 style="flex-grow: 1; min-width: 80px; padding: 6px; border-radius: 4px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.72rem; outline: none;">

          <!-- Delete Rule Button -->
          <button type="button" @click="removeRule(idx)"
                  style="background: transparent; border: none; font-size: 1.1rem; color: #ef4444; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px;">
            🗑️
          </button>
        </div>

        <!-- Case 2: Group Item (Recursive) -->
        <div v-else-if="item.type === 'group'" style="margin-left: 12px; border-left: 2px dashed rgba(255, 255, 255, 0.08); padding-left: 8px;">
          <AudienceRuleGroup :group="item" :is-root="false" @delete="removeGroup(idx)" />
        </div>

      </div>

      <!-- Empty State inside Group -->
      <div v-if="!group.rules || group.rules.length === 0" 
           style="text-align: center; color: var(--text-muted); font-size: 0.7rem; padding: 12px; border: 1px dashed var(--border); border-radius: 6px;">
        No conditions defined. Click "+ Rule" or "+ Group" to begin targeting.
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AudienceRuleGroup',
  props: {
    group: {
      type: Object,
      required: true
    },
    isRoot: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    addRule() {
      if (!this.group.rules) {
        this.$set(this.group, 'rules', []);
      }
      this.group.rules.push({
        type: 'rule',
        field: 'total_spent',
        operator: 'gt',
        value: 0
      });
    },
    addGroup() {
      if (!this.group.rules) {
        this.$set(this.group, 'rules', []);
      }
      this.group.rules.push({
        type: 'group',
        logicalOperator: 'AND',
        rules: []
      });
    },
    removeRule(idx) {
      this.group.rules.splice(idx, 1);
    },
    removeGroup(idx) {
      this.group.rules.splice(idx, 1);
    },
    getValueType(field) {
      if (['total_spent', 'orders_count', 'days_since_last_order'].includes(field)) {
        return 'number';
      }
      return 'text';
    },
    onFieldChange(item) {
      // Set logical defaults based on field types
      if (['total_spent', 'orders_count', 'days_since_last_order'].includes(item.field)) {
        item.operator = 'gt';
        item.value = 0;
      } else {
        item.operator = 'eq';
        item.value = '';
      }
    }
  }
}
</script>

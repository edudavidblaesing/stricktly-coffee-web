<template>
    <div id="view-roles-permissions" class="admin-view inset-view" :class="{ active: app.activeView === 'roles-permissions' }">
        
        <div class="dashboard-layout-grid">
            <!-- Left: Roster -->
            <div class="panel">
                <div class="panel-header">
                    <h3 class="panel-title">Platform Managers & Scopes</h3>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Portal User</th>
                                <th>Role Classification</th>
                                <th>Scoped Brand Shop Boundaries</th>
                                <th style="text-align: right;">System Log Permissions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="u in app.users" :key="u.id">
                                <td>
                                    <div style="font-weight: 700; color: var(--text-main);">
                                        {{ u.email === app.userEmail ? 'You (' + u.email + ')' : u.email }}
                                    </div>
                                    <span style="font-size: 0.75rem; color: var(--text-muted);">Joined {{ new Date(u.created_at).toLocaleDateString() }}</span>
                                </td>
                                <td>
                                    <span class="status-badge" 
                                          :class="{ 
                                              'status-success': u.role === 'superadmin', 
                                              'status-warning': u.role === 'merchant',
                                              'status-info': u.role === 'marketing'
                                          }"
                                          style="font-size: 0.72rem; padding: 2px 6px; text-transform: capitalize;">
                                        {{ u.role }}
                                    </span>
                                </td>
                                <td>
                                    <span class="status-pill" style="background: var(--bg-color); color: var(--text-main);">
                                        {{ u.brand_id ? getBrandName(u.brand_id) + ' Only' : 'All Brand Shops' }}
                                    </span>
                                </td>
                                <td style="text-align: right;">
                                    <button v-if="u.email !== app.userEmail" 
                                            class="btn" 
                                            style="padding: 2px 8px; font-size: 0.72rem; background-color: #ef4444; border-color: #ef4444; color: #fff; margin: 0; height: 28px; line-height: 1;"
                                            @click="app.removeUser(u.id)">
                                        Remove
                                    </button>
                                    <span v-else style="color: var(--text-muted); font-size: 0.72rem; font-style: italic;">Active Account</span>
                                </td>
                            </tr>
                            <tr v-if="app.users.length === 0">
                                <td colspan="4" style="text-align: center; color: var(--text-muted);">No managers registered.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Right: Invite Operator -->
            <div class="panel" style="height: fit-content;">
                <div class="panel-header">
                    <h3 class="panel-title">Provision Operator</h3>
                </div>
                <form @submit.prevent="submitInvite">
                    <div class="form-group" style="margin-bottom: 10px;">
                        <label>Operator Email</label>
                        <input type="email" v-model="inviteEmail" placeholder="manager@stricktlycoffee.be" required
                            style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 10px;">
                        <label>Workspace Role</label>
                        <select v-model="inviteRole" style="width: 100%; height: 42px; border-radius: 8px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 12px; font-size: 0.9rem;">
                            <option value="merchant">Merchant (Scoped to single brand)</option>
                            <option value="marketing">Marketing Specialist (Scoped to single brand)</option>
                            <option v-if="app.userRole.toLowerCase() === 'superadmin'" value="superadmin">Agency Administrator (Full Privileges)</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 14px;">
                        <label>Scope Tenant Shop Mapping</label>
                        <select v-model="inviteBrandId" :disabled="app.userRole.toLowerCase() !== 'superadmin'" style="width: 100%; height: 42px; border-radius: 8px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); padding: 0 12px; font-size: 0.9rem;">
                            <option v-if="app.userRole.toLowerCase() === 'superadmin'" value="">All Brands Portfolio</option>
                            <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
                        </select>
                    </div>
                    <button type="submit" class="btn" style="width: 100%;">Invite Manager Operator</button>
                </form>
            </div>
        </div>

    </div>
</template>

<script>
export default {
    name: 'RolesPermissionsView',
    inject: ['app'],
    data() {
        return {
            inviteEmail: '',
            inviteRole: 'merchant',
            inviteBrandId: ''
        };
    },
    computed: {
        brands() { return this.app.brands || []; }
    },
    mounted() {
        this.resetForm();
    },
    watch: {
        'app.activeShopFilter': {
            handler() {
                this.resetForm();
            },
            immediate: true
        }
    },
    methods: {
        getBrandName(brandId) {
            const b = this.brands.find(x => x.id === brandId);
            return b ? b.name : brandId;
        },
        resetForm() {
            this.inviteEmail = '';
            this.inviteRole = 'merchant';
            if (this.app.userRole.toLowerCase() !== 'superadmin') {
                this.inviteBrandId = this.app.activeShopFilter;
            } else {
                this.inviteBrandId = '';
            }
        },
        async submitInvite() {
            const success = await this.app.inviteUser(this.inviteEmail, this.inviteRole, this.inviteBrandId);
            if (success) {
                this.resetForm();
            }
        }
    }
}
</script>

<template>
    <div id="view-messages" class="admin-view" :class="{ active: app.activeView === 'messages' }">
        <div class="dashboard-layout-grid messages-layout-grid">
            
            <!-- Left: Messages Timeline -->
            <div class="panel">
                <div class="panel-header">
                    <h3 class="panel-title">
                        Activity Log & Notifications
                        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500; margin-left: 8px;">
                            {{ activityLogs.length }} events logged
                        </span>
                    </h3>
                    <button class="pill-btn" @click="refreshActivity" style="height: 32px; font-size: 0.8rem; padding: 0 12px;">
                        🔄 Refresh
                    </button>
                </div>

                <div class="timeline-container" style="margin-top: 20px; max-height: 600px; overflow-y: auto; padding-right: 8px;">
                    <div v-for="log in activityLogs" :key="log.id" class="timeline-item" 
                        style="display: flex; gap: 16px; margin-bottom: 20px; position: relative;">
                        <!-- Timeline Line connector -->
                        <div class="timeline-badge" :style="{ background: getBadgeBg(log.type) }"
                            style="width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; color: #ffffff;">
                            {{ getEventIcon(log.type) }}
                        </div>
                        <div class="timeline-content" style="background: var(--card-bg); border: 1px solid var(--border); padding: 14px 18px; border-radius: 12px; flex-grow: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
                                <strong style="color: var(--text-main); font-size: 0.95rem;">{{ log.title }}</strong>
                                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">
                                    {{ formatDate(log.timestamp) }}
                                </span>
                            </div>
                            <p style="color: var(--text-muted); font-size: 0.86rem; margin: 4px 0 10px 0; line-height: 1.5;">
                                {{ log.description }}
                            </p>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span class="status-pill" style="font-size: 0.7rem; background: var(--bg-color); color: var(--text-main); font-weight: 700; text-transform: uppercase;">
                                    Channel: {{ log.brand_id }}
                                </span>
                                <span style="font-size: 0.75rem; font-weight: 700;" :style="{ color: getBadgeBg(log.type) }">
                                    {{ log.type.toUpperCase() }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div v-if="activityLogs.length === 0" style="text-align: center; color: var(--text-muted); padding: 50px 20px;">
                        📭 No active events or notification logs available.
                    </div>
                </div>
            </div>

            <!-- Right: Support Inquiries Simulator -->
            <div class="panel" style="height: fit-content;">
                <h3 class="panel-title">Simulation Dispatcher</h3>
                <p style="color: var(--text-muted); font-size: 0.82rem; margin: 8px 0 16px 0; line-height: 1.5;">
                    Simulate customer inquiry ticket or logistics alerts to verify multi-tenant messaging streams.
                </p>
                <form @submit.prevent="submitSimulation">
                    <div class="form-group" style="margin-bottom: 14px;">
                        <label>Alert / Inquiry Title</label>
                        <input type="text" v-model="simTitle" placeholder="e.g. Broken portafilter handle" required
                            style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 18px;">
                        <label>Description Details</label>
                        <textarea v-model="simDescription" rows="4" placeholder="Customer reported cracks in wood handle upon delivery..." required
                            style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; font-family: var(--font-body);"></textarea>
                    </div>
                    <button type="submit" class="btn" style="width: 100%;">
                        Submit Ticket Simulation
                    </button>
                </form>
            </div>

        </div>
    </div>
</template>

<script>
export default {
    name: 'MessagesView',
    inject: ['app'],
    data() {
        return {
            simTitle: '',
            simDescription: ''
        };
    },
    computed: {
        activityLogs() { return this.app.activityLogs || []; }
    },
    methods: {
        formatDate(date) { return this.app.formatDate(date); },
        refreshActivity() { return this.app.loadActivity(); },
        getEventIcon(type) {
            switch (type) {
                case 'backup': return '💾';
                case 'order': return '📦';
                case 'product': return '🏷️';
                case 'message': return '💬';
                default: return '🔔';
            }
        },
        getBadgeBg(type) {
            switch (type) {
                case 'backup': return 'rgba(59, 130, 246, 0.2)'; // Blue
                case 'order': return 'rgba(16, 185, 129, 0.2)'; // Green
                case 'product': return 'rgba(245, 158, 11, 0.2)'; // Amber
                case 'message': return 'rgba(139, 92, 246, 0.2)'; // Violet
                default: return 'var(--border)';
            }
        },
        async submitSimulation() {
            await this.app.sendSimulatedMessage(this.simTitle, this.simDescription);
            this.simTitle = '';
            this.simDescription = '';
        }
    }
}
</script>

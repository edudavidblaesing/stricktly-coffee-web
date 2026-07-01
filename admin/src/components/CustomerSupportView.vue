<template>
    <div id="view-customer-support" class="admin-view inset-view" :class="{ active: app.activeView === 'customer-support' }">
        <div class="dashboard-layout-grid" style="grid-template-columns: 320px 1fr 300px; gap: 20px; align-items: stretch; min-height: 70vh;">
            
            <!-- Left: Ticket List -->
            <div class="panel" style="display: flex; flex-direction: column; overflow: hidden; padding: 20px;">
                <div class="panel-header" style="flex-shrink: 0; padding-bottom: 12px; border-bottom: 1px solid var(--border); margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="panel-title">Tickets Queue</h3>
                    <button class="pill-btn" @click="loadTickets" style="font-size: 0.75rem; padding: 4px 8px; border: 1px solid var(--border); background: transparent; color: var(--text-main); border-radius: 4px; cursor: pointer;">
                        🔄
                    </button>
                </div>
                
                <div style="flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                    <div v-for="ticket in tickets" :key="ticket.id" 
                        class="ticket-item" 
                        :class="{ active: selectedTicket && selectedTicket.id === ticket.id }"
                        @click="selectTicket(ticket)"
                        style="padding: 12px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s;"
                        onmouseover="this.style.borderColor='var(--accent)'" 
                        onmouseout="this.style.borderColor='var(--border)'">
                        <div style="font-weight: 600; color: var(--text-main); font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            {{ ticket.subject }}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 0.75rem; color: var(--text-muted);">
                            <span>{{ ticket.customer_email }}</span>
                            <span class="status-pill" :style="getStatusStyle(ticket.status)">{{ ticket.status }}</span>
                        </div>
                    </div>

                    <div v-if="tickets.length === 0" style="text-align: center; color: var(--text-muted); padding-top: 40px; font-size: 0.85rem;">
                        No tickets active.
                    </div>
                </div>
            </div>

            <!-- Center: Active Chat Workspace -->
            <div class="panel" style="display: flex; flex-direction: column; overflow: hidden; padding: 20px;">
                <div v-if="selectedTicket" style="display: flex; flex-direction: column; height: 100%;">
                    <div style="padding-bottom: 12px; border-bottom: 1px solid var(--border); margin-bottom: 16px; flex-shrink: 0;">
                        <h3 class="panel-title" style="font-size: 1.1rem; color: var(--text-main);">{{ selectedTicket.subject }}</h3>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">
                            Customer: {{ selectedTicket.customer_email }} | Status: {{ selectedTicket.status.toUpperCase() }}
                        </span>
                    </div>

                    <!-- Chat box -->
                    <div ref="chatBox" style="flex-grow: 1; overflow-y: auto; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 12px; max-height: 450px;">
                        <div v-for="msg in messages" :key="msg.id" 
                            style="max-width: 80%; padding: 10px 14px; border-radius: 8px; font-size: 0.9rem; line-height: 1.4;"
                            :style="msg.sender === 'agent' ? agentMsgStyle : customerMsgStyle">
                            <div>{{ msg.message_body }}</div>
                        </div>
                    </div>

                    <!-- Reply Input -->
                    <form @submit.prevent="sendReply" style="display: flex; gap: 10px; flex-shrink: 0;">
                        <input type="text" v-model="replyText" placeholder="Type response here..." required
                            style="flex-grow: 1; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 10px 14px; font-size: 0.9rem;">
                        <button type="submit" class="btn btn-accent" style="margin: 0; padding: 10px 20px; background: var(--accent); color: var(--bg-color); border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Send</button>
                    </form>
                </div>

                <div v-else style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-size: 0.95rem; text-align: center;">
                    Select a ticket from the queue to start chat workspace
                </div>
            </div>

            <!-- Right: Support Email Simulator -->
            <div class="panel" style="display: flex; flex-direction: column; overflow: hidden; padding: 20px;">
                <h3 class="panel-title" style="margin-bottom: 6px;">Email Simulator</h3>
                <p style="color: var(--text-muted); font-size: 0.8rem; margin: 0 0 16px 0; line-height: 1.4;">
                    Simulate customer emails entering the routing system to test inbox pipelines.
                </p>

                <div style="display: flex; flex-direction: column; gap: 12px; overflow-y: auto; flex-grow: 1; padding-right: 4px;">
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 4px;">
                        <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold;">From (Customer Email)</label>
                        <input type="email" v-model="simFrom" style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px 10px; font-size: 0.85rem;" required>
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 4px;">
                        <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold;">To (System Address)</label>
                        <input type="text" v-model="simTo" style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px 10px; font-size: 0.85rem;" required>
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 4px;">
                        <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold;">Subject</label>
                        <input type="text" v-model="simSubject" style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px 10px; font-size: 0.85rem;" required>
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 4px;">
                        <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold;">Email Message Body</label>
                        <textarea v-model="simText" rows="4" style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px 10px; font-size: 0.85rem; font-family: var(--font-body);" required></textarea>
                    </div>
                    <button class="btn btn-secondary" @click="simulateIncomingEmail" style="width: 100%; margin: 10px 0 0 0; background: var(--border); color: var(--text-main); border-color: var(--border); border: 1px solid var(--border); padding: 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        Fire Email Webhook
                    </button>
                </div>
            </div>

        </div>
    </div>
</template>

<script>
export default {
    name: 'CustomerSupportView',
    inject: ['app'],
    data() {
        return {
            tickets: [],
            selectedTicket: null,
            messages: [],
            replyText: '',
            ws: null,
            simFrom: 'client@example.com',
            simTo: 'support@stricktlycoffee.be',
            simSubject: 'Question about espresso baskets',
            simText: 'Hi, does the spring loaded tamper fit my standard E61 group basket?',
            agentMsgStyle: {
                alignSelf: 'flex-end',
                background: 'var(--accent)',
                color: 'var(--bg-color)',
                fontWeight: '600'
            },
            customerMsgStyle: {
                alignSelf: 'flex-start',
                background: 'var(--border)',
                color: 'var(--text-main)'
            }
        };
    },
    computed: {
        activeBrandId() {
            // Resolve the current brand context from the dashboard
            return this.app.selectedBrandId || 'pesado';
        }
    },
    watch: {
        activeBrandId() {
            this.loadTickets();
            this.selectedTicket = null;
            this.messages = [];
            if (this.ws) this.ws.close();
        },
        'app.activeView'(newView) {
            if (newView === 'customer-support') {
                this.loadTickets();
            }
        }
    },
    mounted() {
        if (this.app.activeView === 'customer-support') {
            this.loadTickets();
        }
    },
    beforeUnmount() {
        if (this.ws) this.ws.close();
    },
    methods: {
        async loadTickets() {
            try {
                const token = localStorage.getItem('sc_admin_token') || '';
                const brandParam = this.activeBrandId ? `?brandId=${this.activeBrandId}` : '';
                const res = await fetch(`${this.app.apiBaseUrl}/api/admin/support/tickets${brandParam}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    this.tickets = await res.json();
                }
            } catch (err) {
                console.error('Failed to load support tickets:', err);
            }
        },
        async selectTicket(ticket) {
            this.selectedTicket = ticket;
            this.replyText = '';
            
            // Set up simulator values
            this.simTo = `reply+${ticket.id}@stricktlycoffee.be`;
            this.simSubject = `Re: [#${ticket.id.substring(0,8)}] ${ticket.subject}`;

            // Connect WebSockets
            this.connectWebSocket(ticket.id);

            // Load messages
            try {
                const res = await fetch(`${this.app.apiBaseUrl}/api/support/tickets/${ticket.id}/messages`);
                if (res.ok) {
                    const data = await res.json();
                    this.messages = data.messages;
                    this.scrollChat();
                }
            } catch (err) {
                console.error(err);
            }
        },
        connectWebSocket(ticketId) {
            if (this.ws) this.ws.close();
            
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            let wsUrl;
            if (window.location.hostname === 'localhost' || window.location.hostname.includes('local')) {
                wsUrl = `${wsProtocol}//${window.location.hostname}:3000`;
            } else {
                wsUrl = `${wsProtocol}//${window.location.host}/api/ws`;
            }

            this.ws = new WebSocket(`${wsUrl}?ticketId=${ticketId}`);
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.sender !== 'agent') {
                    this.messages.push({
                        id: Date.now(),
                        sender: data.sender,
                        message_body: data.messageBody
                    });
                    this.scrollChat();
                }
            };
        },
        async sendReply() {
            if (!this.replyText || !this.selectedTicket) return;
            const text = this.replyText;
            this.replyText = '';

            this.messages.push({
                id: Date.now(),
                sender: 'agent',
                message_body: text
            });
            this.scrollChat();

            try {
                await fetch(`${this.app.apiBaseUrl}/api/support/tickets/${this.selectedTicket.id}/reply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sender: 'agent', messageBody: text })
                });
            } catch (err) {
                console.error('Failed to send reply:', err);
            }
        },
        async simulateIncomingEmail() {
            const token = localStorage.getItem('sc_admin_token') || '';
            try {
                const res = await fetch(`${this.app.apiBaseUrl}/api/admin/simulate-incoming-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        from: this.simFrom,
                        to: this.simTo,
                        subject: this.simSubject,
                        text: this.simText
                    })
                });
                if (res.ok) {
                    this.app.showNotification('Simulator triggered email webhook successfully.');
                    await this.loadTickets();
                    if (this.selectedTicket) {
                        this.selectTicket(this.selectedTicket);
                    }
                }
            } catch (err) {
                console.error('Failed simulation:', err);
            }
        },
        scrollChat() {
            this.$nextTick(() => {
                const chat = this.$refs.chatBox;
                if (chat) {
                    chat.scrollTop = chat.scrollHeight;
                }
            });
        },
        getStatusStyle(status) {
            if (status === 'resolved') {
                return 'background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; font-size: 0.7rem;';
            }
            return 'background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; font-size: 0.7rem;';
        }
    }
}
</script>

<style scoped>
.ticket-item.active {
    border-color: var(--accent) !important;
    background: rgba(197, 160, 89, 0.08) !important;
}
</style>

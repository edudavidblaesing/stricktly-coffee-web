<template>
    <div id="view-agency-center" class="admin-view" :class="{ active: app.activeView === 'agency-center' }" style="display: flex; flex-direction: column; gap: 20px; padding: 30px;">
        
        <!-- Header Section -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 20px;">
            <div>
                <h1 style="font-family: var(--font-display); font-weight: 800; font-size: 1.8rem; color: var(--text-main); margin: 0 0 5px 0;">
                    🏢 {{ renderAgencyView ? `Agency Workspace: ${currentAgencyName}` : 'Agency Management Center' }}
                </h1>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">
                    {{ renderAgencyView ? 'Manage coffee brands storefronts linked to your agency, adjust splits, copy registration invite link.' : 'Manage partner agencies, adjust checkout revenue splits, log manual payments, and audit commission ledgers.' }}
                </p>
            </div>
            
            <div style="display: flex; gap: 10px;" v-if="!renderAgencyView && isSuperadmin">
                <button class="btn btn-secondary" @click="triggerMonthlyReports" :disabled="loadingReports">
                    📧 {{ loadingReports ? 'Sending...' : 'Trigger Monthly Reports' }}
                </button>
                <button class="btn btn-accent" @click="openCreateModal">
                    ✨ Create Partner Agency
                </button>
            </div>
        </div>

        <!-- Superadmin Main View -->
        <template v-if="!renderAgencyView">
            <!-- Tabs -->
            <div style="display: flex; gap: 15px; border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-bottom: 10px;">
                <button 
                    @click="activeTab = 'agencies'" 
                    class="btn-tab" 
                    :style="{ borderBottom: activeTab === 'agencies' ? '2px solid var(--accent)' : 'none', color: activeTab === 'agencies' ? 'var(--text-main)' : 'var(--text-muted)', background: 'transparent', padding: '8px 16px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }"
                >
                    🏢 Partner Agencies
                </button>
                <button 
                    @click="activeTab = 'ledger'" 
                    class="btn-tab" 
                    :style="{ borderBottom: activeTab === 'ledger' ? '2px solid var(--accent)' : 'none', color: activeTab === 'ledger' ? 'var(--text-main)' : 'var(--text-muted)', background: 'transparent', padding: '8px 16px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }"
                >
                    📋 Consolidated Split Ledger
                </button>
            </div>

            <!-- Tab 1: Agencies Grid -->
            <div v-if="activeTab === 'agencies'" style="display: flex; flex-direction: column; gap: 20px;">
                <div class="panel" style="padding: 20px;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                            <thead>
                                <tr style="border-bottom: 2px solid var(--border); text-align: left;">
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700;">Agency ID / Name</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700;">Contact Email</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: center;">Margin Split Ratio</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: right;">Accrued Unpaid</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: right;">Pending Invoice</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: right;">Total Paid</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="agency in agencies" :key="agency.id" style="border-bottom: 1px solid var(--border);">
                                    <td style="padding: 16px 12px;">
                                        <div style="font-weight: 800; color: var(--text-main); font-size: 0.9rem;">{{ agency.name }}</div>
                                        <div style="font-size: 0.72rem; color: var(--text-muted);">ID: {{ agency.id }}</div>
                                    </td>
                                    <td style="padding: 16px 12px; color: var(--text-main);">{{ agency.contact_email }}</td>
                                    <td style="padding: 16px 12px; text-align: center;">
                                        <span style="background: rgba(197, 160, 89, 0.1); color: var(--accent); font-weight: 800; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">
                                            {{ (parseFloat(agency.margin_share_ratio) * 100).toFixed(1) }}% Split
                                        </span>
                                    </td>
                                    <td style="padding: 16px 12px; text-align: right; color: var(--success); font-weight: 800; font-size: 0.9rem;">
                                        €{{ formatPrice(agency.unpaid_balance) }}
                                    </td>
                                    <td style="padding: 16px 12px; text-align: right; color: var(--warning); font-weight: 800; font-size: 0.9rem;">
                                        €{{ formatPrice(agency.pending_balance) }}
                                    </td>
                                    <td style="padding: 16px 12px; text-align: right; color: var(--text-muted);">
                                        €{{ formatPrice(agency.paid_balance) }}
                                    </td>
                                    <td style="padding: 16px 12px; text-align: right;">
                                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                            <button @click="viewAgencyLedger(agency.id)" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; height: 28px;">
                                                📋 Audit Ledger
                                            </button>
                                            <button @click="markPayoutPaid(agency.id, agency.unpaid_balance)" :disabled="parseFloat(agency.unpaid_balance) <= 0" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; height: 28px; background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2);">
                                                💸 Mark Paid
                                            </button>
                                            <button @click="manuallyUnlockSplits(agency)" :disabled="parseFloat(agency.pending_balance) <= 0" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; height: 28px; background: rgba(245, 158, 11, 0.1); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.2);">
                                                🔓 Unlock Splits
                                            </button>
                                            <button @click="editAgency(agency)" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; height: 28px;">
                                                ✏️ Edit
                                            </button>
                                            <button @click="deleteAgency(agency.id)" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; height: 28px; color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);">
                                                ❌ Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="agencies.length === 0">
                                    <td colspan="7" style="padding: 40px; text-align: center; color: var(--text-muted);">
                                        No partner agencies configured in the system.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Tab 2: Consolidated Ledger -->
            <div v-if="activeTab === 'ledger'" style="display: flex; flex-direction: column; gap: 15px;">
                <div style="display: flex; gap: 10px; margin-bottom: 5px;">
                    <input 
                        type="text" 
                        v-model="ledgerSearch" 
                        placeholder="🔍 Search ledger by Agency ID or Brand Name..." 
                        style="width: 100%; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; padding: 8px 12px; height: 38px; margin: 0;"
                    >
                </div>
                <div class="panel" style="padding: 20px;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                            <thead>
                                <tr style="border-bottom: 2px solid var(--border); text-align: left;">
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700;">Date</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700;">Agency ID</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700;">Store / Order</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: right;">Gross Sales</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: right;">Total Margin</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: right;">Agency Share</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: right;">Platform Share</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: center;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="entry in filteredLedger" :key="entry.id" style="border-bottom: 1px solid var(--border);">
                                    <td style="padding: 12px; color: var(--text-main);">
                                        {{ formatDate(entry.created_at) }}
                                    </td>
                                    <td style="padding: 12px; font-weight: 700; color: var(--text-main);">
                                        {{ entry.agency_id }}
                                    </td>
                                    <td style="padding: 12px;">
                                        <div style="color: var(--text-main); font-weight: bold;">{{ entry.brand_name }}</div>
                                        <div style="font-size: 0.72rem; color: var(--text-muted);">Order ID: {{ entry.order_id }}</div>
                                    </td>
                                    <td style="padding: 12px; text-align: right; color: var(--text-main);">
                                        €{{ formatPrice(entry.gross_amount) }}
                                    </td>
                                    <td style="padding: 12px; text-align: right; color: var(--text-main);">
                                        €{{ formatPrice(entry.margin_amount) }}
                                    </td>
                                    <td style="padding: 12px; text-align: right; color: var(--success); font-weight: 800;">
                                        €{{ formatPrice(entry.agency_share) }}
                                    </td>
                                    <td style="padding: 12px; text-align: right; color: var(--accent);">
                                        €{{ formatPrice(entry.platform_share) }}
                                    </td>
                                    <td style="padding: 12px; text-align: center;">
                                        <span v-if="entry.status === 'unpaid'" style="background: rgba(16, 185, 129, 0.1); color: var(--success); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">
                                            Unpaid (Cleared)
                                        </span>
                                        <span v-else-if="entry.status === 'pending_invoice'" style="background: rgba(245, 158, 11, 0.1); color: var(--warning); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">
                                            Pending Invoice
                                        </span>
                                        <span v-else style="background: rgba(255, 255, 255, 0.1); color: var(--text-muted); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;" :title="'Tx: ' + entry.payout_transaction_id">
                                            Paid
                                        </span>
                                    </td>
                                </tr>
                                <tr v-if="filteredLedger.length === 0">
                                    <td colspan="8" style="padding: 40px; text-align: center; color: var(--text-muted);">
                                        No matching ledger transactions found.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </template>

        <!-- Agency Dashboard View (For Agency users or when switching workspace to agency) -->
        <template v-else>
            <!-- KPI Blocks (Minimalist outlines + bottom dark panel) -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
                <!-- Unpaid Accrued Balance -->
                <div class="metric-card" style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: transparent;">
                    <div style="padding: 20px;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 5px; font-weight: 700;">Accrued Unpaid Split</div>
                        <div style="font-size: 1.8rem; font-weight: 800; color: var(--success);">€{{ formatPrice(agencyUnpaid) }}</div>
                    </div>
                    <div style="padding: 10px 20px; background: rgba(0,0,0,0.15); border-top: 1px solid var(--border); font-size: 0.72rem; color: var(--text-muted);">
                        Cleared & owed by platform for payouts
                    </div>
                </div>

                <!-- Pending Invoice Balance -->
                <div class="metric-card" style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: transparent;">
                    <div style="padding: 20px;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 5px; font-weight: 700;">Pending Invoice Split</div>
                        <div style="font-size: 1.8rem; font-weight: 800; color: var(--warning);">€{{ formatPrice(agencyPending) }}</div>
                    </div>
                    <div style="padding: 10px 20px; background: rgba(0,0,0,0.15); border-top: 1px solid var(--border); font-size: 0.72rem; color: var(--text-muted);">
                        Unlocks once brand pays platform invoice
                    </div>
                </div>

                <!-- Total Paid Balance -->
                <div class="metric-card" style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: transparent;">
                    <div style="padding: 20px;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 5px; font-weight: 700;">Cumulative Paid Splits</div>
                        <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-main);">€{{ formatPrice(agencyPaid) }}</div>
                    </div>
                    <div style="padding: 10px 20px; background: rgba(0,0,0,0.15); border-top: 1px solid var(--border); font-size: 0.72rem; color: var(--text-muted);">
                        Manually paid by platform superadmin
                    </div>
                </div>

                <!-- Confirmed Ratio Card -->
                <div class="metric-card" style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: transparent;">
                    <div style="padding: 20px;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 5px; font-weight: 700;">Margin Split Ratio</div>
                        <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent);">{{ (parseFloat(agencyRatio) * 100).toFixed(1) }}%</div>
                    </div>
                    <div style="padding: 10px 20px; background: rgba(0,0,0,0.15); border-top: 1px solid var(--border); font-size: 0.72rem; color: var(--text-muted);">
                        Your percentage cut of storefront margins
                    </div>
                </div>
            </div>

            <!-- Invite Link & Actions -->
            <div class="panel" style="padding: 20px; border: 1px solid var(--border); border-radius: 12px; background: var(--card-bg);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 280px;">
                        <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin: 0 0 5px 0; display: flex; align-items: center; gap: 8px;">
                            🔗 Onboard a Brand via Invite Link
                        </h3>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0 0 15px 0;">
                            Share this onboarding link with a new merchant. When they register their storefront, it will be automatically associated with your agency.
                        </p>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input 
                                type="text" 
                                readonly 
                                :value="inviteUrl" 
                                style="flex: 1; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.82rem; padding: 0 12px; height: 38px; font-family: monospace; box-sizing: border-box;"
                            >
                            <button class="btn btn-accent" @click="copyInviteUrl" style="height: 38px; padding: 0 15px; display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 0.82rem;">
                                📋 Copy Link
                            </button>
                        </div>
                    </div>
                    
                    <div style="border-left: 1px solid var(--border); padding-left: 20px; display: flex; flex-direction: column; justify-content: center; min-height: 100px;">
                        <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin: 0 0 5px 0;">Register directly:</h4>
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0 0 12px 0;">Provision a new client brand pre-configured with your agency terms.</p>
                        <button class="btn btn-accent" @click="registerAgencyBrand" style="height: 36px; padding: 0 15px; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; gap: 6px; width: fit-content;">
                            ➕ Register Brand (Agency Terms)
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tabs for Agency User -->
            <div style="display: flex; gap: 15px; border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-top: 20px; margin-bottom: 10px;">
                <button 
                    @click="activeTab = 'brands'" 
                    class="btn-tab" 
                    :style="{ borderBottom: activeTab === 'brands' ? '2px solid var(--accent)' : 'none', color: activeTab === 'brands' ? 'var(--text-main)' : 'var(--text-muted)', background: 'transparent', padding: '8px 16px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }"
                >
                    ☕ Assigned Coffee Brands
                </button>
                <button 
                    @click="activeTab = 'ledger'" 
                    class="btn-tab" 
                    :style="{ borderBottom: activeTab === 'ledger' ? '2px solid var(--accent)' : 'none', color: activeTab === 'ledger' ? 'var(--text-main)' : 'var(--text-muted)', background: 'transparent', padding: '8px 16px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }"
                >
                    📋 My Split ledger
                </button>
            </div>

            <!-- Tab A: Assigned Brands -->
            <div v-if="activeTab === 'brands'" style="display: flex; flex-direction: column; gap: 15px;">
                <div class="panel" style="padding: 20px;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                            <thead>
                                <tr style="border-bottom: 2px solid var(--border); text-align: left;">
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700;">Brand ID / Name</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700;">Storefront Address</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: right;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="b in agencyBrands" :key="b.id" style="border-bottom: 1px solid var(--border);">
                                    <td style="padding: 16px 12px; font-weight: 800; color: var(--text-main); font-size: 0.9rem;">
                                        {{ b.name }}
                                    </td>
                                    <td style="padding: 16px 12px; color: var(--text-muted);">
                                        https://{{ b.subdomain }}
                                    </td>
                                    <td style="padding: 16px 12px; text-align: right;">
                                        <button @click="selectBrandToManage(b.id)" class="btn btn-secondary" style="padding: 6px 12px; font-weight: 700; font-size: 0.78rem;">
                                            ⚙️ Manage Store
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="agencyBrands.length === 0">
                                    <td colspan="3" style="padding: 40px; text-align: center; color: var(--text-muted);">
                                        No brands assigned to your agency yet. Please onboard a brand using your invite link, or ask a platform superadmin to link your agency.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Tab B: Split Ledger for Agency User -->
            <div v-if="activeTab === 'ledger'" style="display: flex; flex-direction: column; gap: 15px;">
                <div class="panel" style="padding: 20px;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                            <thead>
                                <tr style="border-bottom: 2px solid var(--border); text-align: left;">
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700;">Date</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700;">Store</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: right;">Gross Sales</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: right;">Total Margin</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: right;">My Split Share</th>
                                    <th style="padding: 12px; color: var(--text-muted); font-weight: 700; text-align: center;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="entry in agencyLedger" :key="entry.id" style="border-bottom: 1px solid var(--border);">
                                    <td style="padding: 12px; color: var(--text-main);">
                                        {{ formatDate(entry.created_at) }}
                                    </td>
                                    <td style="padding: 12px; font-weight: bold; color: var(--text-main);">
                                        {{ entry.brand_name }}
                                    </td>
                                    <td style="padding: 12px; text-align: right; color: var(--text-main);">
                                        €{{ formatPrice(entry.gross_amount) }}
                                    </td>
                                    <td style="padding: 12px; text-align: right; color: var(--text-main);">
                                        €{{ formatPrice(entry.platform_margin) }}
                                    </td>
                                    <td style="padding: 12px; text-align: right; color: var(--success); font-weight: 800;">
                                        €{{ formatPrice(entry.agency_share) }}
                                    </td>
                                    <td style="padding: 12px; text-align: center;">
                                        <span v-if="entry.status === 'unpaid'" style="background: rgba(245, 158, 11, 0.1); color: var(--warning); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">
                                            Pending
                                        </span>
                                        <span v-else style="background: rgba(16, 185, 129, 0.1); color: var(--success); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;" :title="'Tx: ' + entry.payout_transaction_id">
                                            Paid
                                        </span>
                                    </td>
                                </tr>
                                <tr v-if="agencyLedger.length === 0">
                                    <td colspan="6" style="padding: 40px; text-align: center; color: var(--text-muted);">
                                        No sales commission activities recorded.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </template>

        <!-- Agency Form Modal (Superadmin Only) -->
        <div v-if="modalOpen" style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;">
            <div class="panel" style="width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; padding: 25px; border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 15px;">
                <h3 style="font-family: var(--font-display); font-weight: 800; font-size: 1.25rem; color: var(--text-main); margin: 0;">
                    {{ isEditing ? '✏️ Edit Partner Agency' : '✨ Create Partner Agency' }}
                </h3>
                
                <form @submit.prevent="saveAgency" style="display: flex; flex-direction: column; gap: 15px;">
                    <div class="form-group">
                        <label>Agency Name <span class="info-tooltip-trigger" data-tooltip="The user-facing title or organization name of the partner agency.">i</span></label>
                        <input type="text" v-model="form.name" required placeholder="Roasted Growth Media" style="margin: 0;">
                    </div>
                    <div class="form-group">
                        <label>Agency ID (Slug) <span class="info-tooltip-trigger" data-tooltip="A unique URL-safe identifier for routing and API calls. Must be lowercase alphanumeric and hyphens.">i</span></label>
                        <input type="text" v-model="form.id" :disabled="isEditing" required placeholder="roasted-growth" style="margin: 0;">
                    </div>
                    <div class="form-group">
                        <label>Contact Email <span class="info-tooltip-trigger" data-tooltip="Primary administrative email address for commission payouts, support queries, and invoicing.">i</span></label>
                        <input type="email" v-model="form.contact_email" required placeholder="billing@roastedgrowth.com" style="margin: 0;">
                    </div>
                    <div class="form-group">
                        <label>Agency Margin Share (Percentage Agency Receives, 0.0 to 1.0) <span class="info-tooltip-trigger" data-tooltip="The share ratio (e.g. 0.60 = 60%) of platform commission routed to the agency. The remaining 40% goes to the platform.">i</span></label>
                        <input type="number" step="0.01" min="0" max="1" v-model="form.margin_share_ratio" required placeholder="0.60" style="margin: 0;">
                        <p style="font-size: 0.72rem; color: var(--text-muted); margin: 4px 0 0 0;">
                            Specifies the percentage of the platform take-rate commission routed to the Agency. The remaining percentage goes to the platform.
                        </p>
                    </div>
                    <div class="form-group">
                        <label>Stripe Connected Account ID (Optional) <span class="info-tooltip-trigger" data-tooltip="Stripe Connect Account reference to automate real-time split payouts of transaction commissions.">i</span></label>
                        <input type="text" v-model="form.stripe_connect_account_id" placeholder="acct_1x2y3z..." style="margin: 0;">
                    </div>
                    
                    <div style="border-top: 1px solid var(--border); padding-top: 15px; margin-top: 5px;">
                        <label style="display: flex; align-items: center; gap: 8px; font-weight: bold; cursor: pointer; color: var(--accent);">
                            <input type="checkbox" v-model="form.is_platform_biller" style="margin: 0;">
                            ⚙️ Act as Platform Biller for Brands <span class="info-tooltip-trigger" data-tooltip="Delegates all brand billing responsibilities to this agency, allowing them to collect platform transaction/subscription fees directly.">i</span>
                        </label>
                        <p style="font-size: 0.72rem; color: var(--text-muted); margin: 4px 0 12px 0;">
                            Enable to collect platform transaction/subscription fees directly into this agency's Stripe key.
                        </p>
                    </div>

                    <template v-if="form.is_platform_biller">
                        <div class="form-group">
                            <label>White-Label Brand Display Name <span class="info-tooltip-trigger" data-tooltip="The custom invoice builder brand name displayed to merchants on checkout invoices and billing panels.">i</span></label>
                            <input type="text" v-model="form.billing_display_name" placeholder="Roasted Growth Invoicing" style="margin: 0;">
                        </div>
                        <div class="form-group">
                            <label>White-Label Billing Support Email <span class="info-tooltip-trigger" data-tooltip="Email address shown to merchants for any billing questions, chargebacks, or support queries.">i</span></label>
                            <input type="email" v-model="form.billing_support_email" placeholder="support@roastedgrowth.com" style="margin: 0;">
                        </div>
                        <div class="form-group">
                            <label>Official Registered Billing Name <span class="info-tooltip-trigger" data-tooltip="Legally registered corporate entity name that will be displayed on official PDF invoice receipts.">i</span></label>
                            <input type="text" v-model="form.billing_name" placeholder="Roasted Growth Media LTD" style="margin: 0;">
                        </div>
                        <div class="form-group">
                            <label>Registered Billing Address <span class="info-tooltip-trigger" data-tooltip="Corporate mailing address printed on billing statements and tax records.">i</span></label>
                            <textarea v-model="form.billing_address" placeholder="123 Growth Way, Suite 400, London, UK" style="margin: 0; min-height: 60px; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 8px; color: var(--text-main); font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Registered VAT Number / Tax ID <span class="info-tooltip-trigger" data-tooltip="Tax registration number (e.g. VAT, EIN) printed on merchant invoicing statements.">i</span></label>
                            <input type="text" v-model="form.billing_vat" placeholder="GB123456789" style="margin: 0;">
                        </div>
                        <div class="form-group">
                            <label>Agency Stripe Secret Key <span class="info-tooltip-trigger" data-tooltip="The agency's own Stripe secret key (sk_live_...) used to directly capture custom subscription and transactions revenue.">i</span></label>
                            <input type="password" v-model="form.stripe_secret_key" placeholder="sk_live_..." style="margin: 0;">
                        </div>
                        <div class="form-group">
                            <label>Agency Stripe Webhook Secret <span class="info-tooltip-trigger" data-tooltip="Webhook signature signing secret to safely verify transaction webhook notifications from Stripe to the platform.">i</span></label>
                            <input type="password" v-model="form.stripe_webhook_secret" placeholder="whsec_..." style="margin: 0;">
                        </div>
                    </template>
                    
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                        <button type="button" class="btn btn-secondary" @click="closeModal" style="margin: 0;">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-accent" style="margin: 0;">
                            {{ isEditing ? 'Save Changes' : 'Create Agency' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

    </div>
</template>

<script>
export default {
    name: 'AgencyCenterView',
    props: {
        app: { type: Object, required: true }
    },
    data() {
        return {
            activeTab: 'agencies',
            agencies: [],
            consolidatedLedger: [],
            ledgerSearch: '',
            
            // Agency specific states
            agencyBrands: [],
            agencyLedger: [],
            agencyUnpaid: 0.00,
            agencyPending: 0.00,
            agencyPaid: 0.00,
            agencyRatio: 0.5000,
            
            // Form / Modal states
            modalOpen: false,
            isEditing: false,
            loadingReports: false,
            form: {
                id: '',
                name: '',
                contact_email: '',
                margin_share_ratio: 0.5000,
                stripe_connect_account_id: '',
                is_platform_biller: false,
                stripe_secret_key: '',
                stripe_webhook_secret: '',
                billing_display_name: '',
                billing_support_email: '',
                billing_name: '',
                billing_address: '',
                billing_vat: ''
            }
        };
    },
    watch: {
        'form.name'(newVal) {
            if (this.isEditing) return;
            if (!newVal) {
                this.form.id = '';
                return;
            }
            let slug = newVal
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            
            let finalSlug = slug;
            let counter = 1;
            while (this.agencies.some(a => a.id === finalSlug)) {
                finalSlug = `${slug}-${counter}`;
                counter++;
            }
            this.form.id = finalSlug;
        },
        'app.activeShopFilter': {
            handler() {
                this.loadData();
            },
            immediate: true
        },
        activeTab(newVal) {
            if (this.app) {
                this.app.activeAgencyTab = newVal;
                this.app.updateURL();
            }
        },
        'app.activeAgencyTab'(newVal) {
            if (newVal && newVal !== this.activeTab) {
                this.activeTab = newVal;
            }
        }
    },
    computed: {
        isSuperadmin() {
            return this.app.userRole && this.app.userRole.toLowerCase() === 'superadmin';
        },
        currentAgencyId() {
            if (this.app.userRole && this.app.userRole.toLowerCase() === 'agency') {
                return this.app.userAgencyId;
            }
            if (String(this.app.activeShopFilter).startsWith('agency:')) {
                return this.app.activeShopFilter.split(':')[1];
            }
            return null;
        },
        renderAgencyView() {
            return this.currentAgencyId !== null;
        },
        currentAgencyName() {
            const agencyId = this.currentAgencyId;
            if (!agencyId) return '';
            const agency = this.agencies.find(a => String(a.id) === String(agencyId));
            if (agency) return agency.name;
            return 'Partner Agency';
        },
        inviteUrl() {
            const agencyId = this.currentAgencyId;
            if (!agencyId) return '';
            return `${window.location.origin}/?invite_agency=${agencyId}`;
        },
        filteredLedger() {
            if (!this.ledgerSearch) return this.consolidatedLedger;
            const search = this.ledgerSearch.toLowerCase().trim();
            return this.consolidatedLedger.filter(l => 
                (l.agency_id || '').toLowerCase().includes(search) || 
                (l.brand_name || '').toLowerCase().includes(search)
            );
        }
    },
    mounted() {
        // Handled by immediate watch
    },
    methods: {
        async loadData() {
            if (this.renderAgencyView) {
                this.activeTab = 'brands';
                await this.loadAgencyLedger(this.currentAgencyId);
            } else {
                this.activeTab = 'agencies';
                await this.loadAgencies();
                await this.loadConsolidatedLedger();
            }
        },
        async loadAgencies() {
            try {
                const token = localStorage.getItem('sc_admin_token');
                const res = await fetch(`${this.app.apiBaseUrl}/api/global/agencies`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    this.agencies = await res.json();
                }
            } catch (err) {
                console.error('Error fetching agencies:', err);
            }
        },
        async loadConsolidatedLedger() {
            try {
                const token = localStorage.getItem('sc_admin_token');
                // We'll aggregate ledger rows by querying payouts for each agency or querying ledger with custom join
                // Let's iterate over agencies and merge their payouts for consolidation
                let allLedger = [];
                for (const agy of this.agencies) {
                    const res = await fetch(`${this.app.apiBaseUrl}/api/global/agencies/${agy.id}/ledger`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        allLedger = allLedger.concat(data.ledger || []);
                    }
                }
                allLedger.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                this.consolidatedLedger = allLedger;
            } catch (err) {
                console.error('Error fetching consolidated ledger:', err);
            }
        },
        async loadAgencyLedger(agencyId) {
            if (!agencyId) return;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const res = await fetch(`${this.app.apiBaseUrl}/api/global/agencies/${agencyId}/ledger`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    this.agencyBrands = data.brands || [];
                    this.agencyLedger = data.ledger || [];
                    this.agencyUnpaid = data.unpaid_balance || 0.00;
                    this.agencyPending = data.pending_balance || 0.00;
                    this.agencyPaid = data.paid_balance || 0.00;
                    this.agencyRatio = data.agency?.margin_share_ratio || 0.5000;
                }
            } catch (err) {
                console.error('Error fetching agency ledger:', err);
            }
        },
        openCreateModal() {
            this.form = {
                id: '',
                name: '',
                contact_email: '',
                margin_share_ratio: 0.5000,
                stripe_connect_account_id: '',
                is_platform_biller: false,
                stripe_secret_key: '',
                stripe_webhook_secret: '',
                billing_display_name: '',
                billing_support_email: '',
                billing_name: '',
                billing_address: '',
                billing_vat: ''
            };
            this.isEditing = false;
            this.modalOpen = true;
        },
        editAgency(agency) {
            this.form = {
                id: agency.id,
                name: agency.name,
                contact_email: agency.contact_email,
                margin_share_ratio: parseFloat(agency.margin_share_ratio),
                stripe_connect_account_id: agency.stripe_connect_account_id || '',
                is_platform_biller: !!agency.is_platform_biller,
                stripe_secret_key: agency.stripe_secret_key || '',
                stripe_webhook_secret: agency.stripe_webhook_secret || '',
                billing_display_name: agency.billing_display_name || '',
                billing_support_email: agency.billing_support_email || '',
                billing_name: agency.billing_name || '',
                billing_address: agency.billing_address || '',
                billing_vat: agency.billing_vat || ''
            };
            this.isEditing = true;
            this.modalOpen = true;
        },
        async saveAgency() {
            try {
                const token = localStorage.getItem('sc_admin_token');
                const res = await fetch(`${this.app.apiBaseUrl}/api/global/agencies`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(this.form)
                });
                if (res.ok) {
                    this.app.showNotification(this.isEditing ? 'Agency updated successfully.' : 'Partner agency registered successfully.');
                    this.closeModal();
                    await this.loadData();
                } else {
                    const err = await res.json();
                    alert('Save error: ' + (err.error || 'Unknown error'));
                }
            } catch (err) {
                alert('Connection error: ' + err.message);
            }
        },
        async deleteAgency(id) {
            if (!confirm('Are you sure you want to delete this agency? This will unlink all its assigned brands.')) return;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const res = await fetch(`${this.app.apiBaseUrl}/api/global/agencies/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    this.app.showNotification('Agency deleted.');
                    await this.loadData();
                } else {
                    const err = await res.json();
                    alert('Delete error: ' + (err.error || 'Unknown error'));
                }
            } catch (err) {
                alert('Connection error: ' + err.message);
            }
        },
        async markPayoutPaid(id, unpaidAmount) {
            if (!confirm(`Mark outstanding €${this.formatPrice(unpaidAmount)} commission split balance for this agency as paid manually?`)) return;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const res = await fetch(`${this.app.apiBaseUrl}/api/global/agencies/${id}/payouts/mark-paid`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({})
                });
                if (res.ok) {
                    const result = await res.json();
                    this.app.showNotification(`💸 Payout recorded! Receipt ID: ${result.payoutTransactionId}`);
                    await this.loadData();
                } else {
                    const err = await res.json();
                    alert('Payout logging error: ' + (err.error || 'Unknown error'));
                }
            } catch (err) {
                alert('Connection error: ' + err.message);
            }
        },
        async triggerMonthlyReports() {
            try {
                this.loadingReports = true;
                const token = localStorage.getItem('sc_admin_token');
                const res = await fetch(`${this.app.apiBaseUrl}/api/global/agencies/trigger-monthly-reports`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    this.app.showNotification('📧 Simulated email report delivery checks successfully logged!');
                }
            } catch (err) {
                alert('Trigger failed: ' + err.message);
            } finally {
                this.loadingReports = false;
            }
        },
        async manuallyUnlockSplits(agency) {
            if (!confirm(`Are you sure you want to mark all pending invoice splits for ${agency.name} as cleared manually? This will unlock them for payout.`)) return;
            try {
                const token = localStorage.getItem('sc_admin_token');
                const res = await fetch(`${this.app.apiBaseUrl}/api/global/agencies/${agency.id}/unlock-all-splits`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    this.app.showNotification(`🔓 Splits unlocked successfully!`);
                    await this.loadData();
                } else {
                    const err = await res.json();
                    alert('Unlock error: ' + (err.error || 'Unknown error'));
                }
            } catch (err) {
                alert('Connection error: ' + err.message);
            }
        },
        async viewAgencyLedger(id) {
            this.activeTab = 'ledger';
            this.ledgerSearch = id;
        },
        selectBrandToManage(brandId) {
            this.app.activeShopFilter = brandId;
            this.app.switchView('overview');
            this.app.showNotification(`Store management switched to: ${brandId}`);
        },
        closeModal() {
            this.modalOpen = false;
        },
        copyInviteUrl() {
            if (!this.inviteUrl) return;
            navigator.clipboard.writeText(this.inviteUrl);
            this.app.showNotification('✨ Agency registration invite link copied to clipboard!');
        },
        registerAgencyBrand() {
            this.app.selectWorkspace('create-brand-agency');
        },
        formatPrice(val) {
            const num = parseFloat(val);
            return isNaN(num) ? '0.00' : num.toFixed(2);
        },
        formatDate(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return d.toISOString().split('T')[0] + ' ' + d.toTimeString().split(' ')[0].substring(0, 5);
        }
    }
};
</script>

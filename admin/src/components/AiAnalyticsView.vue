<template>
    <div id="view-ai-analytics" class="admin-view" :class="{ active: app.activeView === 'ai-analytics' }">
        <!-- GLOBAL CONTEXT (SUPERADMIN ONLY & NO STORE SELECTED) -->
        <div v-if="userRole.toLowerCase() === 'superadmin' && !isValidBrandSelected">
            
            <!-- AI Model Token Cost Tuning (superadmin only) -->
            <div class="panel">
                <div class="panel-header">
                    <h3 class="panel-title">🤖 AI Model Token Cost Tuning (USD per 1M tokens)</h3>
                </div>
                <div style="padding: 15px;">
                    <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 15px;">
                        Estimated cost tracking metrics shown to merchants. These rates are defined on the server/database.
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div v-for="item in globalPricing" :key="item.model" style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; align-items: center; background: rgba(0,0,0,0.1); border-radius: 6px; padding: 10px 12px; border: 1px solid var(--border);">
                            <strong style="font-size: 0.85rem; font-family: monospace; color: var(--text-main);">{{ item.model }}</strong>
                            <div>
                                <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Prompt / 1M</label>
                                <span style="font-size: 0.85rem; font-family: monospace; color: var(--text-main); font-weight: 700;">${{ parseFloat(item.prompt_rate_per_million).toFixed(4) }}</span>
                            </div>
                            <div>
                                <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Completion / 1M</label>
                                <span style="font-size: 0.85rem; font-family: monospace; color: var(--text-main); font-weight: 700;">${{ parseFloat(item.completion_rate_per_million).toFixed(4) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Global Brand AI Cost & Spend Overview (superadmin only) -->
            <div class="panel" style="margin-top: 20px;">
                <div class="panel-header">
                    <h3 class="panel-title">📊 Global Brand AI Cost & Spend Overview</h3>
                </div>
                <div style="padding: 15px;">
                    <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 15px;">
                        Summary of AI compute resource consumption and projected pricing costs aggregated across all brand shops.
                    </div>
                    <div v-if="isLoadingSuperadminAiUsage" style="text-align: center; padding: 20px; color: var(--text-muted);">
                        ⏳ Loading global AI usage data...
                    </div>
                    <div v-else-if="superadminAiUsageSummary.length === 0" style="text-align: center; padding: 20px; color: var(--text-muted);">
                        No AI usage records found.
                    </div>
                    <div v-else style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.82rem;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); font-weight: 700;">
                                    <th style="padding: 10px 8px;">Brand Shop</th>
                                    <th style="padding: 10px 8px;">AI Tier</th>
                                    <th style="padding: 10px 8px; text-align: center;">Billing Mode</th>
                                    <th style="padding: 10px 8px; text-align: right;">API Calls</th>
                                    <th style="padding: 10px 8px; text-align: right;">Total Tokens</th>
                                    <th style="padding: 10px 8px; text-align: right; color: var(--accent);">Est. Spend</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="row in superadminAiUsageSummary" :key="row.brand_id" style="border-bottom: 1px solid var(--border); color: var(--text-main);">
                                    <td style="padding: 10px 8px; font-weight: 700;">{{ row.brand_name }} <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal; font-family: monospace;">({{ row.brand_id }})</span></td>
                                    <td style="padding: 10px 8px;">
                                        <span style="font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: rgba(197, 160, 89, 0.15); color: var(--accent); text-transform: uppercase;">
                                            {{ row.ai_tier }}
                                        </span>
                                    </td>
                                    <td style="padding: 10px 8px; text-align: center;">
                                        <span v-if="row.ai_free_tier" style="font-size: 0.68rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: rgba(16, 185, 129, 0.15); color: #10b981;">
                                            FREE
                                        </span>
                                        <span v-else style="font-size: 0.68rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.05); color: var(--text-muted);">
                                            PAID / METERED
                                        </span>
                                    </td>
                                    <td style="padding: 10px 8px; text-align: right; font-family: monospace;">{{ row.total_calls }}</td>
                                    <td style="padding: 10px 8px; text-align: right; font-family: monospace;">{{ formatTokens(row.total_tokens) }}</td>
                                    <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: var(--accent); font-weight: 700;">${{ formatCost(row.total_cost_usd) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Google AI Studio Rate Limits & Usage Monitor (superadmin only) -->
            <div class="panel" style="margin-top: 20px;">
                <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="panel-title">🛡️ Google AI Studio Real-time Rate Limits Monitor</h3>
                    <span style="font-size: 0.65rem; font-weight: 800; background: rgba(96, 165, 250, 0.15); color: #60a5fa; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.05em; text-transform: uppercase;">
                        Live API Analytics
                    </span>
                </div>
                <div style="padding: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                        <div style="font-size: 0.82rem; color: var(--text-muted); max-width: 70%;">
                            Peak usage tracking metrics compared directly against AI Studio limits. Select a scope to view global account-wide metrics or filter down to a single brand.
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted);">Scope:</span>
                            <select v-model="realtimeLimitsBrandFilter" @change="loadRealtimeLimits" style="height: 32px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.78rem; padding: 0 10px; cursor: pointer;">
                                <option value="">🌎 All Brands (Global)</option>
                                <option v-for="b in app.brands" :key="b.id" :value="b.id">🏢 {{ b.name }}</option>
                            </select>
                        </div>
                    </div>

                    <div v-if="isLoadingRealtimeLimits" style="text-align: center; padding: 30px; color: var(--text-muted);">
                        ⏳ Analyzing request traffic logs...
                    </div>
                    <div v-else style="display: grid; grid-template-columns: 1fr; gap: 20px;">
                        <div v-for="m in realtimeLimits" :key="m.model" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 10px; padding: 15px; display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                                <strong style="font-family: monospace; font-size: 0.9rem; color: var(--accent);">{{ m.model }}</strong>
                                <span style="font-size: 0.72rem; color: var(--text-muted);">Quota Limits</span>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
                                <!-- RPM Progress -->
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px;">
                                        <span style="color: var(--text-muted);">Requests / Min (RPM)</span>
                                        <strong style="color: var(--text-main);">{{ m.rpm }} / {{ m.limit_rpm }}</strong>
                                    </div>
                                    <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                                        <div :style="{ width: Math.min((m.rpm / m.limit_rpm) * 100, 100) + '%', backgroundColor: (m.rpm / m.limit_rpm) >= 0.85 ? '#ef4444' : ((m.rpm / m.limit_rpm) >= 0.60 ? '#f59e0b' : '#10b981') }" 
                                             style="height: 100%; border-radius: 3px; transition: width 0.4s ease;">
                                        </div>
                                    </div>
                                </div>

                                <!-- TPM Progress -->
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px;">
                                        <span style="color: var(--text-muted);">Tokens / Min (TPM)</span>
                                        <strong style="color: var(--text-main);">{{ formatTokens(m.tpm) }} / {{ formatTokens(m.limit_tpm) }}</strong>
                                    </div>
                                    <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                                        <div :style="{ width: Math.min((m.tpm / m.limit_tpm) * 100, 100) + '%', backgroundColor: (m.tpm / m.limit_tpm) >= 0.85 ? '#ef4444' : ((m.tpm / m.limit_tpm) >= 0.60 ? '#f59e0b' : '#10b981') }" 
                                             style="height: 100%; border-radius: 3px; transition: width 0.4s ease;">
                                        </div>
                                    </div>
                                </div>

                                <!-- RPD Progress -->
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px;">
                                        <span style="color: var(--text-muted);">Requests / Day (RPD)</span>
                                        <strong style="color: var(--text-main);">{{ m.rpd }} / {{ m.limit_rpd }}</strong>
                                    </div>
                                    <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                                        <div :style="{ width: Math.min((m.rpd / m.limit_rpd) * 100, 100) + '%', backgroundColor: (m.rpd / m.limit_rpd) >= 0.85 ? '#ef4444' : ((m.rpd / m.limit_rpd) >= 0.60 ? '#f59e0b' : '#10b981') }" 
                                             style="height: 100%; border-radius: 3px; transition: width 0.4s ease;">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- CONTEXT FOR INDIVIDUAL BRAND SHOP -->
        <div v-else-if="isValidBrandSelected" class="panel">
            <div class="panel-header">
                <h3 class="panel-title">📊 AI Usage & Cost Analytics</h3>
            </div>
            <div style="padding: 20px;">
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px; line-height: 1.5; text-align: left;">
                    Track real-time token usage, API call frequencies, and estimated platform API expenses for this brand across all AI systems.
                </div>

                <!-- AI Billing & Invoicing Summary Card -->
                <div style="background: rgba(197, 160, 89, 0.03); border: 1px solid rgba(197, 160, 89, 0.15); border-radius: 8px; padding: 18px; margin-bottom: 25px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
                    <div style="flex: 1; min-width: 250px; text-align: left;">
                        <h5 style="margin: 0 0 6px 0; font-size: 0.9rem; font-weight: 700; color: var(--accent); display: flex; align-items: center; gap: 6px;">
                            💳 AI Billing & Invoicing Summary
                        </h5>
                        <div style="font-size: 0.76rem; color: var(--text-muted); line-height: 1.45; margin: 0;">
                            AI costs are calculated as a combination of your subscription tier and actual platform token consumption. This total is consolidated and deducted from your monthly payouts or added to your end-of-month invoice.
                        </div>
                    </div>
                    <div style="background: var(--workspace-bg); border: 1px solid var(--border); border-radius: 6px; padding: 12px 18px; text-align: right; min-width: 200px; box-sizing: border-box;">
                        <div v-if="settingsBrand.ai_free_tier" style="text-align: center;">
                            <div style="font-size: 0.65rem; text-transform: uppercase; color: #10b981; font-weight: 800; margin-bottom: 2px;">🎁 Free AI Access Plan</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: #10b981;">€0.00</div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">Superadmin waiver applied</div>
                        </div>
                        <div v-else>
                            <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; justify-content: space-between; gap: 15px; margin-bottom: 4px;">
                                <span>Flat Subscription:</span>
                                <strong style="color: var(--text-main); font-family: monospace;">€{{ formatBillingCost(getTierSubscriptionCost()) }}</strong>
                            </div>
                            <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; justify-content: space-between; gap: 15px; margin-bottom: 8px; border-bottom: 1px solid var(--border); padding-bottom: 4px;">
                                <span>Usage Expense:</span>
                                <strong style="color: var(--text-main); font-family: monospace;">€{{ formatBillingCost(aiUsageSummary.total_cost_usd * 0.92) }}</strong>
                            </div>
                            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-main); display: flex; justify-content: space-between; gap: 15px;">
                                <span>Est. Invoice:</span>
                                <strong style="color: var(--accent); font-family: monospace; font-size: 0.95rem;">€{{ formatBillingCost(getTierSubscriptionCost() + (aiUsageSummary.total_cost_usd * 0.92)) }}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- AI Spend Limits & Overage Controls -->
                <div v-if="settingsBrand && !settingsBrand.ai_free_tier" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 8px; padding: 18px; margin-bottom: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
                        <div>
                            <h5 style="margin: 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; text-align: left;">
                                <span>📊 AI Monthly Spend Limit Usage</span>
                                <span v-if="settingsBrand.pay_as_you_go_enabled" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 0.62rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-transform: uppercase;">Pay-As-You-Go Enabled</span>
                                <span v-else style="background: rgba(255, 255, 255, 0.05); color: var(--text-muted); font-size: 0.62rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; text-transform: uppercase;">Hard Cap Limit</span>
                            </h5>
                            <p style="margin: 4px 0 0 0; font-size: 0.72rem; color: var(--text-muted); line-height: 1.4; text-align: left;">
                                Your plan includes a monthly budget ceiling to prevent runaway costs. Track actual consumption below.
                            </p>
                        </div>
                        <!-- Interactive Toggle Switch -->
                        <div style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.1); padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border);">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 0.76rem; font-weight: 700; margin: 0; color: var(--text-main);">
                                <input type="checkbox" v-model="settingsBrand.pay_as_you_go_enabled" @change="updateBrandSettings" style="width: 16px; height: 16px; margin: 0; cursor: pointer; accent-color: var(--accent);" />
                                Enable Pay-As-You-Go Overages
                            </label>
                        </div>
                    </div>

                    <!-- Progress Bar Component -->
                    <div style="margin-bottom: 12px; text-align: left;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.76rem; margin-bottom: 6px;">
                            <span style="color: var(--text-muted);">Current Billing Cycle AI Costs</span>
                            <strong style="color: var(--text-main); font-family: monospace;">
                                ${{ parseFloat(aiUsageSummary.total_cost_usd || 0).toFixed(2) }} / ${{ getActiveTierSpendLimit.toFixed(2) }} USD
                            </strong>
                        </div>
                        <div style="height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,0.02);">
                            <div :style="{ width: getSpendLimitProgressPercent + '%', backgroundColor: getSpendLimitProgressColor }" 
                                 style="height: 100%; border-radius: 4px; transition: width 0.4s ease-out;">
                            </div>
                        </div>
                    </div>

                    <!-- Warnings & Alerts Banners -->
                    <div v-if="!settingsBrand.pay_as_you_go_enabled && getSpendLimitProgressPercent >= 80" 
                         :style="{ 
                             background: getSpendLimitProgressPercent >= 100 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                             borderColor: getSpendLimitProgressPercent >= 100 ? '#ef4444' : '#f59e0b'
                         }"
                         style="border: 1px dashed; padding: 12px; border-radius: 6px; font-size: 0.78rem; line-height: 1.45; text-align: left; margin-top: 12px; display: flex; align-items: flex-start; gap: 8px;">
                        <span style="font-size: 1.1rem; line-height: 1;">{{ getSpendLimitProgressPercent >= 100 ? '❌' : '⚠️' }}</span>
                        <div style="flex: 1; color: var(--text-main);">
                            <strong v-if="getSpendLimitProgressPercent >= 100" style="color: #ef4444;">Suspension Limit Reached (100% used)</strong>
                            <strong v-else style="color: #f59e0b;">Usage Warning ({{ getSpendLimitProgressPercent }}% used)</strong>
                            <p style="margin: 4px 0 0 0; font-size: 0.72rem; color: var(--text-muted);">
                                <span v-if="getSpendLimitProgressPercent >= 100">
                                    All automated AI writers, crawlers, and translators have been suspended for this cycle. Enable **Pay-As-You-Go Overages** above to immediately restore features.
                                </span>
                                <span v-else>
                                    Your brand is approaching its monthly AI budget cap. To prevent service disruptions once the cap is met, enable **Pay-As-You-Go Overages** or contact support to upgrade plans.
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- KPI Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 15px; text-align: center;">
                        <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 4px;">Total Spend (USD)</div>
                        <div style="font-size: 1.35rem; font-weight: 800; color: var(--accent); font-family: monospace;">${{ formatCost(aiUsageSummary.total_cost_usd) }}</div>
                        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">{{ formatTokens(aiUsageSummary.total_tokens) }} total tokens</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 15px; text-align: center;">
                        <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 4px;">Total AI Calls</div>
                        <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">{{ aiUsageSummary.total_calls }}</div>
                        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Across all integrations</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 15px; text-align: center;">
                        <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 4px;">Avg Cost / Call</div>
                        <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-main); font-family: monospace;">${{ formatCost(aiUsageSummary.total_calls > 0 ? aiUsageSummary.total_cost_usd / aiUsageSummary.total_calls : 0) }}</div>
                        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Input & output combined</div>
                    </div>
                </div>

                <!-- Breakdown & Details -->
                <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-top: 15px; text-align: left;">
                    <!-- Breakdown by Operation -->
                    <div v-if="aiUsageBreakdown.length > 0">
                        <h5 style="margin: 0 0 12px 0; font-size: 0.88rem; font-weight: 700; color: var(--text-main);">Cost & Calls by Feature</h5>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div v-for="item in aiUsageBreakdown" :key="item.operation" style="background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.02); border-radius: 6px; padding: 10px 12px;">
                                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 6px;">
                                    <span style="font-weight: 600; color: var(--text-main);">{{ item.operation }}</span>
                                    <span style="font-family: monospace; color: var(--accent); font-weight: 600;">${{ formatCost(item.cost_usd) }} ({{ item.calls_count }} calls)</span>
                                </div>
                                <div style="background: rgba(255,255,255,0.05); height: 4px; border-radius: 2px; overflow: hidden; width: 100%;">
                                    <div :style="{ width: getSpendPercentage(item.cost_usd) + '%', background: 'var(--accent)' }" style="height: 100%; transition: width 0.3s ease;"></div>
                                </div>
                                <div style="font-size: 0.68rem; color: var(--text-muted); text-align: right; margin-top: 4px;">{{ formatTokens(item.total_tokens) }} tokens generated</div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity Logs -->
                    <div>
                        <h5 style="margin: 20px 0 12px 0; font-size: 0.88rem; font-weight: 700; color: var(--text-main);">Recent Activity Logs</h5>
                        <div v-if="aiUsageLogs.length > 0" style="overflow-x: auto; border: 1px solid var(--border); border-radius: 6px; background: rgba(0,0,0,0.15);">
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: left;">
                                <thead>
                                    <tr style="background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border);">
                                        <th style="padding: 10px 12px; color: var(--text-muted);">Timestamp</th>
                                        <th style="padding: 10px 12px; color: var(--text-muted);">Operation</th>
                                        <th style="padding: 10px 12px; color: var(--text-muted);">Model</th>
                                        <th style="padding: 10px 12px; color: var(--text-muted); text-align: right;">Tokens (In/Out)</th>
                                        <th style="padding: 10px 12px; color: var(--text-muted); text-align: right;">Est. Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="log in aiUsageLogs" :key="log.id" style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                                        <td style="padding: 10px 12px; color: var(--text-muted); white-space: nowrap;">{{ formatDate(log.created_at) }}</td>
                                        <td style="padding: 10px 12px; font-weight: 600; color: var(--text-main);">{{ log.operation }}</td>
                                        <td style="padding: 10px 12px; font-family: monospace; color: var(--text-muted);">{{ log.model }}</td>
                                        <td style="padding: 10px 12px; text-align: right; font-family: monospace; color: var(--text-muted);">{{ log.prompt_tokens }} / {{ log.completion_tokens }}</td>
                                        <td style="padding: 10px 12px; text-align: right; font-family: monospace; color: var(--accent); font-weight: 600;">${{ formatCost(log.estimated_cost_usd) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-else style="background: rgba(255,255,255,0.01); border: 1px dashed var(--border); border-radius: 6px; padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.78rem;">
                            No recent AI operations recorded for this brand.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- FALLBACK NO STORE SELECTED & NOT SUPERADMIN -->
        <div v-else class="panel" style="text-align: center; padding: 40px; color: var(--text-muted);">
            <div style="font-size: 3rem; margin-bottom: 12px;">🏢</div>
            <h4>Please Select a Brand Shop</h4>
            <p style="font-size: 0.8rem; margin: 6px 0 0 0;">
                Select a specific storefront from the filter dropdown at the top to audit token spending and invoice breakdowns.
            </p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'AiAnalyticsView',
    inject: ['app'],
    data() {
        return {
            aiUsageSummary: { total_calls: 0, total_prompt_tokens: 0, total_completion_tokens: 0, total_tokens: 0, total_cost_usd: 0.0 },
            aiUsageBreakdown: [],
            aiUsageLogs: [],
            superadminAiUsageSummary: [],
            realtimeLimits: [],
            globalPricing: [],
            realtimeLimitsBrandFilter: '',
            isLoadingSuperadminAiUsage: false,
            isLoadingRealtimeLimits: false
        };
    },
    computed: {
        userRole() {
            return this.app.adminUser ? this.app.adminUser.role || 'editor' : 'editor';
        },
        isValidBrandSelected() {
            return this.app.activeShopFilter && this.app.activeShopFilter !== 'all';
        },
        settingsBrand() {
            return this.app.settingsBrand;
        },
        getActiveTierSpendLimit() {
            if (!this.settingsBrand) return 50.00;
            const tier = this.settingsBrand.ai_tier || 'professional';
            if (tier === 'standard') return 10.00;
            if (tier === 'enterprise') return 200.00;
            return 50.00;
        },
        getSpendLimitProgressPercent() {
            const limit = this.getActiveTierSpendLimit;
            const spend = parseFloat(this.aiUsageSummary.total_cost_usd || 0);
            return Math.min(Math.round((spend / limit) * 100), 100);
        },
        getSpendLimitProgressColor() {
            const percent = this.getSpendLimitProgressPercent;
            if (percent >= 100) return '#ef4444';
            if (percent >= 80) return '#f59e0b';
            return '#10b981';
        }
    },
    watch: {
        'app.activeView'(newVal) {
            if (newVal === 'ai-analytics') {
                this.loadAllData();
            }
        },
        'app.activeShopFilter'() {
            if (this.app.activeView === 'ai-analytics') {
                this.loadAllData();
            }
        }
    },
    mounted() {
        if (this.app.activeView === 'ai-analytics') {
            this.loadAllData();
        }
    },
    methods: {
        loadAllData() {
            if (this.isValidBrandSelected) {
                this.loadAiUsage();
            } else if (this.userRole.toLowerCase() === 'superadmin') {
                this.loadSuperadminAiUsage();
                this.loadRealtimeLimits();
                this.loadGlobalPricing();
            }
        },
        async loadAiUsage() {
            if (!this.settingsBrand || !this.settingsBrand.id) return;
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/ai-usage`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.aiUsageSummary = data.summary;
                        this.aiUsageBreakdown = data.breakdown;
                        this.aiUsageLogs = data.recent_logs;
                    }
                }
            } catch (err) {
                console.error('Error loading AI usage data:', err);
            }
        },
        async loadSuperadminAiUsage() {
            if (this.userRole.toLowerCase() !== 'superadmin') return;
            this.isLoadingSuperadminAiUsage = true;
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/superadmin/ai-usage`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.superadminAiUsageSummary = data.summary;
                    }
                }
            } catch (err) {
                console.error('Error loading superadmin global AI usage:', err);
            } finally {
                this.isLoadingSuperadminAiUsage = false;
            }
        },
        async loadRealtimeLimits() {
            if (this.userRole.toLowerCase() !== 'superadmin') return;
            this.isLoadingRealtimeLimits = true;
            try {
                let url = `${this.app.apiBaseUrl}/api/global/superadmin/realtime-limits`;
                if (this.realtimeLimitsBrandFilter) {
                    url += `?brandId=${this.realtimeLimitsBrandFilter}`;
                }
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.realtimeLimits = data.usage;
                    }
                }
            } catch (err) {
                console.error('Error loading realtime AI limits data:', err);
            } finally {
                this.isLoadingRealtimeLimits = false;
            }
        },
        async loadGlobalPricing() {
            if (this.userRole.toLowerCase() !== 'superadmin') return;
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/ai-pricing`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.globalPricing = data.pricing;
                    }
                }
            } catch (err) {
                console.error('Error loading global AI pricing rates:', err);
            }
        },
        formatBillingCost(val) {
            if (val === undefined || val === null) return '0.00';
            return parseFloat(val).toFixed(2);
        },
        formatCost(val) {
            if (val === undefined || val === null) return '0.000000';
            return parseFloat(val).toFixed(6);
        },
        formatTokens(val) {
            if (!val) return '0';
            return Number(val).toLocaleString();
        },
        formatDate(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },
        getSpendPercentage(cost) {
            if (!this.aiUsageSummary.total_cost_usd || this.aiUsageSummary.total_cost_usd === 0) return 0;
            return (cost / this.aiUsageSummary.total_cost_usd) * 100;
        },
        getTierSubscriptionCost() {
            if (!this.settingsBrand) return 45;
            const tier = this.settingsBrand.ai_tier || 'professional';
            if (tier === 'standard') return 15;
            if (tier === 'enterprise') return 150;
            return 45;
        },
        updateBrandSettings() {
            return this.app.updateBrandSettings();
        }
    }
};
</script>

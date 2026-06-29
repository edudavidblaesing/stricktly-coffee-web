<template>
    <div id="view-learning" class="admin-view" :class="{ active: app.activeView === 'learning' }" style="font-family: Outfit, sans-serif; padding: 24px; color: var(--text-main); max-width: 1200px; margin: 0 auto;">
        
        <!-- Header Section -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
            <div>
                <h1 style="margin: 0; font-size: 1.8rem; font-weight: 800; font-family: var(--font-display); background: linear-gradient(135deg, #c5a059 0%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                    🧠 Platform Learning Center
                </h1>
                <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--text-muted);">
                    Aggregating platform performance statistics to improve AI campaign generations and optimizing models.
                </p>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-primary" style="margin:0; height: 38px; display: inline-flex; align-items: center; gap: 6px; font-weight: 700; cursor: pointer;" @click="loadLearningData">
                    🔄 Refresh Insights
                </button>
            </div>
        </div>

        <div class="canvas-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 24px;">
            <!-- Brand Performance Profile -->
            <div class="panel" style="background: rgba(255, 255, 255, 0.01); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 1rem; font-weight: 700; color: #a78bfa; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
                    🎯 Your Vertical Context
                </h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-muted);">Industry Vertical:</span>
                        <strong style="color: var(--text-main);">{{ brandContext.business_segment || 'Food & Beverage' }}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-muted);">Niche Category:</span>
                        <strong style="color: var(--text-main);">{{ brandContext.business_niche || 'Specialty Coffee' }}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-muted);">Global Data Pool Opt-in:</span>
                        <span :style="{ color: brandContext.share_performance_data ? '#10b981' : '#f97316', fontWeight: 'bold' }">
                            {{ brandContext.share_performance_data ? 'Active' : 'Disabled' }}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 8px; margin-top: 4px;">
                        <span style="color: var(--text-muted);">Active Fine-Tuned Model:</span>
                        <strong style="color: var(--accent); font-family: monospace;">
                            {{ brandContext.active_model ? brandContext.active_model : 'None (Default Tier Model)' }}
                        </strong>
                    </div>
                </div>

                <div style="margin-top: 20px; padding: 12px; background: rgba(139, 92, 246, 0.04); border: 1px solid rgba(139, 92, 246, 0.15); border-radius: 8px; font-size: 0.78rem; line-height: 1.5; color: var(--text-muted);">
                    💡 <strong>Smart Tip:</strong> Campaigns categorized as <strong>{{ brandContext.business_niche || 'Specialty Coffee' }}</strong> observe a <strong>+24% conversions increase</strong> when applying copy structures using <strong>Utility & Quality</strong> copywriting angles rather than simple discounts.
                </div>
            </div>

            <!-- Global Optimization Metrics -->
            <div class="panel" style="background: rgba(255, 255, 255, 0.01); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 1rem; font-weight: 700; color: #c5a059; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
                    📈 Platform Benchmarks
                </h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div v-for="bench in benchmarks" :key="bench.id" style="font-size: 0.82rem; border-bottom: 1px dashed rgba(255,255,255,0.03); padding-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <strong style="color: var(--text-main);">{{ bench.business_segment }}</strong>
                            <span style="color: var(--text-muted);">{{ bench.active_campaigns_count }} active ads</span>
                        </div>
                        <div style="display: flex; gap: 12px; color: var(--text-muted); font-size: 0.76rem;">
                            <span>ROAS: <strong style="color: var(--accent);">{{ bench.avg_roas }}x</strong></span>
                            <span>CTR: <strong>{{ bench.avg_ctr }}%</strong></span>
                            <span>CVR: <strong>{{ bench.avg_cvr }}%</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Custom Fine-Tuning Console -->
        <div class="panel" style="background: rgba(255, 255, 255, 0.01); border: 1px solid var(--border); border-radius: 12px; padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border); padding-bottom: 15px; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
                <div>
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                        🔧 Custom LLM Fine-Tuning Pipeline
                    </h3>
                    <p style="margin: 4px 0 0 0; font-size: 0.78rem; color: var(--text-muted);">
                        Superadmin controller to export platform performance dataset and submit deep learning tuning adapter jobs.
                    </p>
                </div>
                <div v-if="userRole.toLowerCase() === 'superadmin'">
                    <button class="btn btn-accent" style="margin:0; height: 34px; font-size: 0.78rem; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; cursor: pointer;" @click="downloadDataset">
                        💾 Export Tuning Dataset (JSONL)
                    </button>
                </div>
            </div>

            <!-- Form parameters -->
            <div v-if="userRole.toLowerCase() === 'superadmin'" style="background: rgba(255, 255, 255, 0.01); border: 1px solid var(--border); padding: 18px; border-radius: 8px; margin-bottom: 12px;">
                <h4 style="margin-top:0; margin-bottom: 15px; font-size: 0.88rem; font-weight: 700; color: var(--text-main);">Create Custom Adapter Model</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
                    <div class="form-group" style="margin: 0;">
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 6px; color: var(--text-muted);">Base Model to Fine-Tune</label>
                        <select v-model="newTuningJob.baseModel" style="width: 100%; height: 36px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.8rem; padding: 0 10px; margin: 0; cursor: pointer;">
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                            <option value="gemini-3.1-pro">Gemini 3.1 Pro</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 6px; color: var(--text-muted);">Custom Niche Suffix</label>
                        <input type="text" v-model="newTuningJob.suffix" placeholder="e.g. coffee-specialist" style="width: 100%; height: 36px; margin: 0; font-size: 0.8rem; background: var(--workspace-bg);">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 6px; color: var(--text-muted);">Training Epochs</label>
                        <select v-model="newTuningJob.epochs" style="width: 100%; height: 36px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.8rem; padding: 0 10px; margin: 0; cursor: pointer;">
                            <option :value="3">3 (Recommended)</option>
                            <option :value="5">5</option>
                            <option :value="10">10</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 6px; color: var(--text-muted);">Learning Rate</label>
                        <select v-model="newTuningJob.learningRate" style="width: 100%; height: 36px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.8rem; padding: 0 10px; margin: 0; cursor: pointer;">
                            <option :value="0.0001">1e-4</option>
                            <option :value="0.00005">5e-5</option>
                            <option :value="0.0002">2e-4</option>
                        </select>
                    </div>
                    <div style="display: flex; align-items: flex-end;">
                        <button class="btn btn-primary" style="margin: 0; width: 100%; height: 36px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; cursor: pointer;" :disabled="submittingJob || !newTuningJob.suffix" @click="submitTuningJob">
                            🚀 Start Tuning Run
                        </button>
                    </div>
                </div>
            </div>

            <!-- Model Name Preview -->
            <div v-if="userRole.toLowerCase() === 'superadmin'" style="margin-top: 0px; margin-bottom: 20px; font-size: 0.78rem; color: var(--text-muted); background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; border: 1px solid rgba(255,255,255,0.03); max-width: 100%;">
                <span>Target Model Identifier:</span>
                <strong style="color: var(--accent); font-family: monospace;">{{ computedModelName }}</strong>
            </div>

            <!-- Access restriction for non-superadmins -->
            <div v-else style="background: rgba(239, 68, 68, 0.03); border: 1px dashed rgba(239, 68, 68, 0.2); padding: 20px; border-radius: 8px; text-align: center; color: #ef4444; font-size: 0.85rem; font-weight: 600; margin-bottom: 20px;">
                🔒 Deep model fine-tuning adapter configurations require platform Superadmin privileges.
            </div>

            <!-- Training Jobs List -->
            <div>
                <h4 style="margin-top: 0; margin-bottom: 12px; font-size: 0.88rem; font-weight: 700; color: var(--text-main);">Tuning Jobs History</h4>
                <div v-if="jobs.length === 0" style="background: rgba(255,255,255,0.01); border: 1px dashed var(--border); padding: 30px; text-align: center; border-radius: 8px; color: var(--text-muted); font-size: 0.8rem;">
                    No active model adapters are currently training.
                </div>
                <div v-else style="display: flex; flex-direction: column; gap: 12px;">
                    <div v-for="job in jobs" :key="job.id" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                            <div>
                                <strong style="font-size: 0.85rem; color: var(--text-main);">{{ job.modelName }}</strong>
                                <span style="font-size: 0.72rem; color: var(--text-muted); margin-left: 8px;">({{ job.id }})</span>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span :style="getStatusBadgeStyle(job.status)" style="font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 20px;">
                                    {{ job.status.toUpperCase() }}
                                </span>
                                <span style="font-size: 0.72rem; color: var(--text-muted);">Epochs: {{ job.epochs }}</span>
                            </div>
                        </div>

                        <!-- Progress Bar -->
                        <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; position: relative;">
                            <div :style="{ width: job.progress + '%', background: job.status === 'completed' ? '#10b981' : (job.status === 'failed' ? '#ef4444' : 'linear-gradient(90deg, #c5a059 0%, #a78bfa 100%)') }" style="height: 100%; border-radius: 10px; transition: width 0.4s ease;"></div>
                        </div>

                        <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted);">
                            <span>Started: {{ formatDate(job.startedAt) }}</span>
                            <span v-if="job.completedAt">Completed: {{ formatDate(job.completedAt) }}</span>
                            <span v-else>Progress: {{ job.progress }}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
export default {
    name: 'AiLearningCenterView',
    props: {
        app: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            benchmarks: [],
            jobs: [],
            brandContext: {
                business_segment: '',
                business_niche: '',
                share_performance_data: true,
                active_model: ''
            },
            newTuningJob: {
                baseModel: 'gemini-1.5-flash',
                suffix: '',
                epochs: 3,
                learningRate: 0.0001
            },
            submittingJob: false,
            pollingInterval: null
        };
    },
    computed: {
        userRole() {
            return this.app.userRole || 'merchant';
        },
        computedModelName() {
            const cleanSuffix = (this.newTuningJob.suffix || '').trim()
                .toLowerCase()
                .replace(/[^a-z0-9\-]/g, '-')
                .replace(/-+/g, '-');
            return cleanSuffix ? `${this.newTuningJob.baseModel}-${cleanSuffix}` : this.newTuningJob.baseModel;
        }
    },
    mounted() {
        this.loadLearningData();
        // Poll active jobs every 5 seconds to show progress
        this.pollingInterval = setInterval(this.loadTuningJobs, 5000);
    },
    beforeUnmount() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
    },
    methods: {
        async loadLearningData() {
            try {
                // Fetch segment benchmarks
                const resBench = await fetch(`${this.app.apiBaseUrl}/api/global/learning/benchmarks`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                });
                if (resBench.ok) {
                    const data = await resBench.json();
                    this.benchmarks = data.benchmarks || [];
                }

                // Resolve brand context settings locally/remotely
                if (this.app.activeShopFilter !== 'all') {
                    const resBrand = await fetch(`${this.app.apiBaseUrl}/api/global/brands/${this.app.activeShopFilter}`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                    });
                    if (resBrand.ok) {
                        const brandData = await resBrand.json();
                        const b = brandData.brand || brandData;
                        this.brandContext = {
                            business_segment: b.business_segment || 'Food & Beverage',
                            business_niche: b.business_niche || 'Specialty Coffee',
                            share_performance_data: b.share_performance_data !== false,
                            active_model: b.active_model || ''
                        };
                    } else {
                        // Fallback local search
                        const brand = this.app.brands.find(b => b.id === this.app.activeShopFilter);
                        if (brand) {
                            this.brandContext = {
                                business_segment: brand.business_segment || 'Food & Beverage',
                                business_niche: brand.business_niche || 'Specialty Coffee',
                                share_performance_data: brand.share_performance_data !== false,
                                active_model: brand.active_model || ''
                            };
                        }
                    }
                }

                await this.loadTuningJobs();
            } catch (err) {
                console.error('[AI Learning Center] Error loading data:', err.message);
            }
        },
        async loadTuningJobs() {
            try {
                const resJobs = await fetch(`${this.app.apiBaseUrl}/api/global/learning/tuning-jobs`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                });
                if (resJobs.ok) {
                    const data = await resJobs.json();
                    this.jobs = data.jobs || [];
                }
            } catch (err) {
                console.error('[AI Learning Center] Error loading training jobs:', err.message);
            }
        },
        async submitTuningJob() {
            const finalModelName = this.computedModelName;
            if (!finalModelName || !this.newTuningJob.suffix) return;
            this.submittingJob = true;
            try {
                const response = await fetch(`${this.app.apiBaseUrl}/api/global/learning/trigger-tuning`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        modelName: finalModelName,
                        epochs: this.newTuningJob.epochs,
                        learningRate: this.newTuningJob.learningRate
                    })
                });
                if (response.ok) {
                    this.app.showNotification('Tuning run started successfully!');
                    this.newTuningJob.suffix = '';
                    await this.loadTuningJobs();
                } else {
                    const err = await response.text();
                    alert(`Tuning error: ${err}`);
                }
            } catch (err) {
                alert(`Error submitting job: ${err.message}`);
            } finally {
                this.submittingJob = false;
            }
        },
        downloadDataset() {
            const link = document.createElement('a');
            link.href = `${this.app.apiBaseUrl}/api/global/learning/export-tuning-data?token=${localStorage.getItem('sc_admin_token')}`;
            link.setAttribute('download', 'marketing_fine_tuning.jsonl');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        getStatusBadgeStyle(status) {
            if (status === 'completed') return { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' };
            if (status === 'failed') return { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' };
            return { background: 'rgba(197, 160, 89, 0.1)', color: '#c5a059', border: '1px solid rgba(197, 160, 89, 0.2)' };
        },
        formatDate(isoString) {
            if (!isoString) return '';
            const d = new Date(isoString);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString();
        }
    }
};
</script>

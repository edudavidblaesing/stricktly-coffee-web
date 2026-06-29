<template>
    <div v-if="estimate" style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.7rem; color: var(--text-muted); background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); padding: 4px 10px; border-radius: 20px; font-family: Outfit, sans-serif; margin-top: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); max-width: max-content;">
        <span style="color: var(--accent); font-size: 0.78rem; line-height: 1;">🔮</span>
        <span>Est. Cost: <strong style="color: var(--text-main); font-family: monospace;">€{{ formattedCost }}</strong></span>
        <span style="color: rgba(255,255,255,0.12);">|</span>
        <span>Tokens: <strong style="color: var(--text-main); font-family: monospace;">{{ (estimate.totalTokens || 0).toLocaleString() }}</strong></span>
    </div>
</template>

<script>
export default {
    name: 'AiEstimateBadge',
    inject: ['app'],
    props: {
        operation: {
            type: String,
            required: true
        },
        inputText: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            estimate: null,
            debounceTimer: null
        };
    },
    computed: {
        formattedCost() {
            if (!this.estimate || !this.estimate.costUsd) return '0.0000';
            // Convert USD to EUR (using a fixed 0.92 conversion rate)
            const eurCost = this.estimate.costUsd * 0.92;
            return eurCost.toFixed(5);
        }
    },
    watch: {
        inputText: {
            immediate: true,
            handler() {
                if (this.debounceTimer) clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(this.loadEstimate, 500);
            }
        },
        operation: {
            handler() {
                this.loadEstimate();
            }
        }
    },
    mounted() {
        this.loadEstimate();
    },
    beforeUnmount() {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
    },
    methods: {
        async loadEstimate() {
            const data = await this.app.fetchAiEstimate(this.operation, this.inputText);
            if (data) {
                this.estimate = data;
            }
        }
    }
}
</script>

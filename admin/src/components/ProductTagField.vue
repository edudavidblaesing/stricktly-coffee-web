<template>
  <div style="position: relative; width: 100%;">
    <!-- Visual Tag Mode -->
    <div v-if="isProductTag" 
         class="product-tag-card" 
         style="display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; background: rgba(255,255,255,0.025); gap: 10px; width: 100%; box-sizing: border-box;">
      <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
        <img :src="productInfo.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=50'" 
             style="width: 34px; height: 34px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border); background: white; flex-shrink: 0;" />
        <div style="min-width: 0; flex: 1;">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span style="font-weight: 700; font-size: 0.8rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ productInfo.title }}</span>
            <span style="font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; white-space: nowrap; flex-shrink: 0;"
                  :style="productInfo.type === 'service' ? 'background: rgba(139, 92, 246, 0.15); color: #c084fc; border: 1px solid rgba(139, 92, 246, 0.3);' : 'background: rgba(255, 255, 255, 0.05); color: var(--text-muted); border: 1px solid var(--border);'">
              {{ productInfo.type === 'service' ? '🛎️ Service' : '📦 Product' }}
            </span>
          </div>
          <div style="font-size: 0.65rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 1px;">
            <span>Dynamic URL reference:</span>
            <span style="color: var(--accent); font-weight: 700;">@inventory-{{ productInfo.id }}</span>
          </div>
        </div>
      </div>
      <button type="button" @click="clearField" 
              style="background: transparent; border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; cursor: pointer; font-size: 0.7rem; font-weight: bold; padding: 4px 8px; border-radius: 4px; margin: 0; transition: background 0.2s;"
              onmouseover="this.style.background='rgba(239, 68, 68, 0.1)'"
              onmouseout="this.style.background='transparent'">
        ✕ Remove Link
      </button>
    </div>

    <!-- Text Editing Mode -->
    <div v-else style="position: relative; width: 100%;">
      <textarea v-if="type === 'textarea'"
                ref="inputRef"
                v-model="inputValue"
                :placeholder="placeholder"
                :rows="rows"
                @input="handleInput"
                style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; font-family: inherit; resize: vertical; box-sizing: border-box; outline: none;"></textarea>
      
      <input v-else
             ref="inputRef"
             type="text"
             v-model="inputValue"
             :placeholder="placeholder"
             @input="handleInput"
             style="width: 100%; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); padding: 8px; font-size: 0.85rem; box-sizing: border-box; outline: none;" />

      <!-- Autocomplete dropdown nested locally inside each textfield wrapper -->
      <div v-if="showAutocomplete" 
           style="position: absolute; bottom: 100%; left: 0; width: 100%; max-height: 185px; overflow-y: auto; background: var(--panel-bg, #1a1b26); border: 1px solid var(--border); border-radius: 6px; box-shadow: 0 -4px 16px rgba(0,0,0,0.5); z-index: 100020; margin-bottom: 4px; display: flex; flex-direction: column;">
        <div style="font-size: 0.62rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; padding: 6px 10px; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border);">Select suggestion tag</div>
        <button v-for="tag in filteredAutocompleteTags" 
                :key="tag.value" 
                type="button" 
                @click="insertAutocompleteTag(tag)" 
                style="padding: 8px 12px; text-align: left; background: none; border: none; color: var(--text-main); font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 10px; width: 100%; border-bottom: 1px solid rgba(255,255,255,0.01);" 
                onmouseover="this.style.background='rgba(255,255,255,0.05)'" 
                onmouseout="this.style.background='none'">
          <!-- Image thumbnail (if available) -->
          <img v-if="tag.image" :src="resolveImageUrl(tag.image)" style="width: 24px; height: 24px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border); flex-shrink: 0;" />
          <span v-else style="font-size: 1.1rem; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            {{ tag.icon || '🏷️' }}
          </span>
          <div style="display: flex; flex-direction: column; min-width: 0; flex: 1;">
            <span style="font-weight: 700; color: var(--accent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ tag.label }}</span>
            <span style="font-size: 0.65rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ tag.description }}</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductTagField',
  inject: ['app'],
  props: {
    value: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'input'
    },
    placeholder: {
      type: String,
      default: ''
    },
    rows: {
      type: [Number, String],
      default: 3
    },
    audiences: {
      type: Array,
      default: () => []
    },
    brandCanvas: {
      type: Object,
      default: () => null
    }
  },
  data() {
    return {
      inputValue: this.value || '',
      showAutocomplete: false,
      autocompleteSearch: '',
      activeTriggerSymbol: ''
    };
  },
  watch: {
    value(newVal) {
      if (this.inputValue !== newVal) {
        this.inputValue = newVal || '';
      }
    }
  },
  computed: {
    isProductTag() {
      const val = (this.value || '').trim();
      return (val.startsWith('@product-') || val.startsWith('@inventory-') || val.startsWith('$product-') || val.startsWith('$inventory-')) && !val.includes(' ');
    },
    productInfo() {
      if (!this.isProductTag) return {};
      const identifier = this.value.trim().startsWith('@product-') || this.value.trim().startsWith('$product-') 
        ? this.value.trim().replace(/^[@$]product-/, '') 
        : this.value.trim().replace(/^[@$]inventory-/, '');
      const products = this.app.products || [];
      const found = products.find(p => 
        String(p.id) === identifier || 
        (p.sku && p.sku.toLowerCase() === identifier.toLowerCase())
      );
      return found || { id: identifier, title: `Product #${identifier}`, image: '', type: 'product' };
    },
    autocompleteTags() {
      const list = [];
      const symbol = this.activeTriggerSymbol || '@';
      const brandId = this.app.activeShopFilter !== 'all' ? this.app.activeShopFilter : '';
      
      if (symbol === '$') {
        // Add brand-specific products and services
        const prods = this.app.products ? this.app.products.filter(p => !brandId || p.brand_id === brandId) : [];
        prods.forEach(p => {
          list.push({
            label: `$inventory-${p.id}`,
            value: `$inventory-${p.id}`,
            image: p.image,
            icon: p.type === 'service' ? '💼' : '📦',
            description: `${p.type === 'service' ? '🛎️ Service' : '📦 Product'}: ${p.title}`
          });
        });
      } else if (symbol === '@') {
        // Ambassadors / Personas
        if (this.brandCanvas && this.brandCanvas.personas && this.brandCanvas.personas.length > 0) {
          this.brandCanvas.personas.forEach(p => {
            list.push({
              label: `@${p.name.toLowerCase().replace(/\s+/g, '-')}`,
              value: `@${p.name.toLowerCase().replace(/\s+/g, '-')}`,
              image: p.image,
              icon: '👥',
              description: `Persona: ${p.role}`
            });
          });
        } else {
          list.push(
            { label: '@barista', value: '@barista', description: 'Technical Barista target audience persona', icon: '👥' },
            { label: '@curator', value: '@curator', description: 'Design Purist / Aesthetic Curator target persona', icon: '👥' },
            { label: '@home-brewer', value: '@home-brewer', description: 'Home Brewer target audience persona', icon: '👥' }
          );
        }
      } else if (symbol === '%') {
        // Target Audiences
        if (this.audiences && this.audiences.length > 0) {
          this.audiences.forEach(aud => {
            list.push({
              label: `%${aud.id || aud.name.toLowerCase().replace(/\s+/g, '-')}`,
              value: `%${aud.id || aud.name.toLowerCase().replace(/\s+/g, '-')}`,
              icon: '🎯',
              description: `Audience Segment: ${aud.name}`
            });
          });
        } else {
          list.push(
            { label: '%barista', value: '%barista', description: 'Technical Barista target audience segment', icon: '🎯' },
            { label: '%curator', value: '%curator', description: 'Design Purist / Aesthetic Curator target segment', icon: '🎯' },
            { label: '%home-brewer', value: '%home-brewer', description: 'Home Brewer target audience segment', icon: '🎯' }
          );
        }
      } else if (symbol === '#') {
        // Sceneries / Backdrops
        if (this.brandCanvas && this.brandCanvas.sceneries && this.brandCanvas.sceneries.length > 0) {
          this.brandCanvas.sceneries.forEach(s => {
            list.push({
              label: `#${s.name.toLowerCase().replace(/\s+/g, '-')}`,
              value: `#${s.name.toLowerCase().replace(/\s+/g, '-')}`,
              image: s.image,
              icon: '🌄',
              description: `Scenery: ${s.description}`
            });
          });
        }
        // Channels / Traffic Platforms
        list.push(
          { label: '#meta', value: '#meta', description: 'Meta Facebook / Instagram Ad Traffic', icon: '📱' },
          { label: '#google', value: '#google', description: 'Google search and display traffic', icon: '🔍' },
          { label: '#tiktok', value: '#tiktok', description: 'TikTok feed and post traffic', icon: '🎵' },
          { label: '#email', value: '#email', description: 'Newsletter or automated email traffic', icon: '✉️' },
          { label: '#instagram', value: '#instagram', description: 'Instagram bio or story traffic', icon: '📸' }
        );
      } else if (symbol === '/') {
        list.push(
          { label: '/rebuild', value: '/rebuild', description: 'Command: Rebuild sections layout strategy', icon: '⚙️' },
          { label: '/translate-de', value: '/translate-de', description: 'Command: Translate entire copywriting to German', icon: '🇩🇪' },
          { label: '/translate-fr', value: '/translate-fr', description: 'Command: Translate entire copywriting to French', icon: '🇫🇷' },
          { label: '/dark-mode', value: '/dark-mode', description: 'Command: Force deep carbon/slate dark themes', icon: '🌙' },
          { label: '/light-mode', value: '/light-mode', description: 'Command: Force warm cream/beige minimal themes', icon: '☀️' }
        );
      }
      return list;
    },
    filteredAutocompleteTags() {
      if (!this.autocompleteSearch) return this.autocompleteTags;
      const searchVal = this.autocompleteSearch.toLowerCase();
      return this.autocompleteTags.filter(t => {
        const cleanTagVal = t.value.substring(1).toLowerCase();
        return cleanTagVal.includes(searchVal) || t.value.toLowerCase().includes(searchVal);
      });
    }
  },
  methods: {
    resolveImageUrl(url) {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url;
      }
      return `${this.app.apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    },
    handleInput(e) {
      this.$emit('input', this.inputValue);
      
      const cursor = e.target.selectionStart;
      const beforeCursor = this.inputValue.substring(0, cursor);
      const match = beforeCursor.match(/([@%$#\/])(\w*)$/);
      if (match) {
        this.activeTriggerSymbol = match[1];
        this.showAutocomplete = true;
        this.autocompleteSearch = match[2].toLowerCase();
      } else {
        this.showAutocomplete = false;
        this.activeTriggerSymbol = '';
      }
    },
    insertAutocompleteTag(tag) {
      const textarea = this.$refs.inputRef;
      const cursor = textarea ? textarea.selectionStart : this.inputValue.length;
      const beforeCursor = this.inputValue.substring(0, cursor);
      const afterCursor = this.inputValue.substring(cursor);
      const beforeTag = beforeCursor.replace(/([@%$#\/])(\w*)$/, '');
      
      this.inputValue = beforeTag + tag.value + ' ' + afterCursor;
      this.$emit('input', this.inputValue);
      
      this.showAutocomplete = false;
      this.activeTriggerSymbol = '';
      
      this.$nextTick(() => {
        if (textarea) {
          textarea.focus();
          const newPos = beforeTag.length + tag.value.length + 1;
          textarea.setSelectionRange(newPos, newPos);
        }
      });
    },
    clearField() {
      this.inputValue = '';
      this.$emit('input', '');
      this.showAutocomplete = false;
      this.activeTriggerSymbol = '';
    }
  }
};
</script>

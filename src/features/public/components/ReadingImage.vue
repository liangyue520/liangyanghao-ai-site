<script setup lang="ts">
import { ref, watch } from 'vue';
const props = defineProps<{ src?: string; alt: string; width?: number | null; height?: number | null; eager?: boolean }>();
const loaded = ref(false), failed = ref(false), attempt = ref(0);
watch(() => props.src, () => { loaded.value = false; failed.value = false; });
function retry() { failed.value = false; loaded.value = false; attempt.value++; }
</script>
<template>
  <div class="image-wrap">
    <p v-if="!src || failed" class="image-state" role="status">{{ alt }}暂时无法显示。<button v-if="src" type="button" @click="retry">重试图片</button></p>
    <template v-else>
      <p v-if="!loaded" class="image-state" role="status">{{ alt }}正在加载……</p>
      <img :key="`${src}-${attempt}`" :src="src" :alt="alt" :width="width || undefined" :height="height || undefined" :loading="eager ? 'eager' : 'lazy'" decoding="async" @load="loaded = true" @error="failed = true" />
    </template>
  </div>
</template>
<style scoped>
.image-wrap{min-width:0}img{display:block;width:100%;height:auto;object-fit:contain;border-radius:8px}.image-state{padding:16px;background:var(--bg);color:var(--muted);font-size:14px}button{display:block;margin-top:12px;min-height:44px}
</style>

<script setup lang="ts">
import { errorMessage } from '../api';
defineProps<{ loading?: boolean; error?: unknown; empty?: boolean; emptyText?: string }>();
defineEmits<{ retry: [] }>();
</script>
<template>
  <div v-if="loading" class="state" role="status" aria-live="polite"><span class="dot" />正在加载内容……</div>
  <div v-else-if="error" class="state failure" role="alert"><p>{{ errorMessage(error) }}</p><button type="button" @click="$emit('retry')">重试</button></div>
  <div v-else-if="empty" class="state" role="status"><p>{{ emptyText ?? '暂时没有公开内容。' }}</p><slot name="empty" /></div>
  <slot v-else />
</template>
<style scoped>
.state{padding:var(--space);background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);color:var(--muted);margin:16px 0;overflow-wrap:anywhere}.state p{margin:0 0 12px}.state p:last-child{margin:0}.failure{border-left:3px solid var(--accent)}.dot{display:inline-block;width:7px;height:7px;background:var(--accent);border-radius:50%;margin-right:12px}button{min-height:44px}
</style>

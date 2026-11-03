<script setup lang="ts">
import type { PublicSummary } from '../../../../shared/contracts';
import { formatDate, toolboxPath } from '../api';
defineProps<{ item: PublicSummary; returnTo?: string }>();
</script>
<template>
  <article class="tool">
    <div>
      <span v-if="item.isDemo" class="demo">演示数据</span>
      <p class="meta">{{ item.category }}<span v-if="item.featured"> · 精选</span><span> · {{ formatDate(item.recordDate) }}</span></p>
      <h3><RouterLink :to="{path:toolboxPath(item),query:returnTo ? {from:returnTo} : {}}">{{ item.title }}</RouterLink></h3>
      <p v-if="item.summary" class="summary">{{ item.summary }}</p>
    </div>
    <RouterLink class="read" :to="{path:toolboxPath(item),query:returnTo ? {from:returnTo} : {}}">查看用法与来源 <span aria-hidden="true">↗</span></RouterLink>
  </article>
</template>
<style scoped>
.tool{padding:22px 0;border-bottom:1px solid var(--line);display:grid;gap:10px}.meta{font-size:13px;color:var(--muted);margin:0 0 8px}h3{font-size:21px;line-height:1.5;margin:0 0 8px;overflow-wrap:anywhere}.summary{margin:0;color:var(--ink);white-space:pre-wrap;line-height:1.75}.read{justify-self:start;color:var(--accent);min-height:44px;padding:8px 0}.demo{display:inline-block;background:var(--accent-soft);padding:2px 8px;font-size:12px;margin-bottom:10px}@media(max-width:540px){h3{font-size:20px}}
</style>

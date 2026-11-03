<script setup lang="ts">
import type { PublicSummary } from '../../../../shared/contracts';
import { contentPath, formatDate, mediaUrl } from '../api';
import ReadingImage from './ReadingImage.vue';
defineProps<{ item: PublicSummary; returnTo?: string }>();
</script>
<template>
  <article class="entry">
    <ReadingImage v-if="item.cover" class="cover" :src="mediaUrl(item.cover, 'thumbnail')" :alt="item.cover.alt || `${item.title}封面`" :width="item.cover.width" :height="item.cover.height" />
    <div class="copy"><span v-if="item.isDemo" class="demo">演示数据</span>
      <p class="meta">{{ formatDate(item.recordDate) }}<span v-if="item.category"> · {{ item.category }}</span></p>
      <h3><RouterLink :to="{path:contentPath(item), query:returnTo ? {from:returnTo} : {}}">{{ item.title }}</RouterLink></h3>
      <p v-if="item.kind === 'diary' && item.excerpt" class="excerpt">{{ item.excerpt }}</p>
      <p v-if="item.summary" class="summary">{{ item.summary }}</p>
      <RouterLink class="read" :to="{path:contentPath(item), query:returnTo ? {from:returnTo} : {}}">{{ item.kind === 'video' ? '查看视频' : item.kind === 'resource' ? '查看资源与使用说明' : item.kind === 'story' ? '开始阅读' : '阅读这篇' }} <span aria-hidden="true">↗</span></RouterLink>
    </div>
  </article>
</template>
<style scoped>
.entry{display:flex;gap:var(--space);padding:24px 0;border-bottom:1px solid var(--line);align-items:flex-start;min-width:0}.cover{width:140px;flex-shrink:0}.copy{min-width:0;flex:1}.meta{font-size:13px;color:var(--muted);margin:0 0 8px}h3{font-size:21px;line-height:1.5;margin:0 0 10px;overflow-wrap:anywhere}.summary{margin:0 0 12px;white-space:pre-wrap}.read{display:inline-block;color:var(--accent);padding:8px 0;min-height:44px;font-size:14px}.demo{display:inline-block;background:var(--accent-soft);padding:2px 8px;font-size:12px;margin-bottom:10px}@media(max-width:540px){.entry{flex-direction:column}.cover{width:100%;max-width:220px}h3{font-size:20px}}
.excerpt{margin:0 0 12px;line-height:1.75;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;overflow-wrap:anywhere}
</style>

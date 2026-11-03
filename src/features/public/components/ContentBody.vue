<script setup lang="ts">
import { computed } from 'vue';
import type { PublicDetail } from '../../../../shared/contracts';
import { diaryPages, externalUrl, mediaUrl } from '../api';
import ReadingImage from './ReadingImage.vue';
import VideoPlayer from './VideoPlayer.vue';
import ResourceInfo from './ResourceInfo.vue';
const props = defineProps<{ content: PublicDetail }>();
const pages = computed(() => diaryPages(props.content.media));
</script>
<template><div class="body">
  <ReadingImage v-if="content.cover && content.kind !== 'diary' && content.kind !== 'video'" :src="mediaUrl(content.cover,'display')" :alt="content.cover.alt || `${content.title}封面`" :width="content.cover.width" :height="content.cover.height" eager />
  <p v-if="content.recordDate.note" class="date-note">{{ content.recordDate.note }}</p>
  <p v-if="content.bodyText" class="text">{{ content.bodyText }}</p>
  <template v-if="content.kind === 'diary'">
    <template v-if="pages.length">
      <h2>手写页</h2><p class="hint">按页向下阅读，可用双指放大查看字迹。</p>
      <figure v-for="(page,index) in pages" :key="page.assetId"><figcaption>第 {{ index + 1 }} 页 / 共 {{ pages.length }} 页</figcaption><ReadingImage :src="mediaUrl(page,'display')" :alt="page.alt || `第${index + 1}页手写日记`" :width="page.width" :height="page.height" :eager="index === 0" /></figure>
    </template>
    <section v-if="content.transcription" class="words"><h2>整理文字</h2><p class="text">{{ content.transcription }}</p></section>
    <section v-if="content.reflection" class="words reflection"><h2>现在的旁白</h2><p class="text">{{ content.reflection }}</p></section>
  </template>
  <VideoPlayer v-else-if="content.kind === 'video'" :key="content.id" :content="content" />
  <ResourceInfo v-else-if="content.kind === 'resource'" :key="content.id" :content="content" />
  <section v-else-if="content.kind === 'game'" class="words"><h3>使用说明</h3><p class="text">{{ content.game?.usageInstructions || '使用说明暂未提供。' }}</p><a v-if="externalUrl(content.game?.launchUrl)" :href="externalUrl(content.game?.launchUrl)" target="_blank" rel="noopener noreferrer">打开作品链接（新窗口） ↗</a><p v-else>作品入口暂不可用。</p><p class="hint">作品在外部页面打开；若链接失效，请稍后再试。</p></section>
</div></template>
<style scoped>.body{overflow-wrap:anywhere}.text{white-space:pre-wrap;line-height:1.95}.date-note,.hint{color:var(--muted);font-size:14px}figure{margin:24px 0 36px}figcaption{font-size:13px;color:var(--muted);padding:8px 0}.words{padding-top:20px;margin-top:32px;border-top:1px solid var(--line)}.reflection{background:var(--accent-soft);padding:20px;border-radius:var(--radius)}a{color:var(--accent);display:inline-block;min-height:44px;padding:8px 0;text-decoration:underline}</style>

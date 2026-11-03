<script setup lang="ts">
import { computed } from 'vue';
import { getKindContent, listContents, mediaUrl, usePublicLoad } from '../api';
import ReadState from './ReadState.vue';
import ReadingImage from './ReadingImage.vue';
const props = defineProps<{ home?: boolean }>();
const {data, loading, error, reload} = usePublicLoad(() => 'profile', async signal => {
  const list = await listContents({kind:'profile',pageSize:1}, signal);
  return list.items[0] ? getKindContent(list.items[0].id, 'profile', signal) : null;
});
const introduction = computed(() => {
  const text = props.home ? (data.value?.summary || data.value?.bodyText || '') : (data.value?.bodyText || '');
  const letters = Array.from(text);
  return props.home && letters.length > 180 ? letters.slice(0,180).join('') + '…' : text;
});
</script>
<template>
  <section class="profile" aria-label="个人介绍">
    <h1 v-if="home && !data">日记与作品</h1>
    <ReadState :loading="loading" :error="error" :empty="data === null" empty-text="个人介绍暂未公开。你可以先看看已公开的日记与作品。" @retry="reload">
      <template v-if="data"><span v-if="data.isDemo" class="demo">演示数据</span><component :is="home ? 'h1' : 'h2'">{{ data.title }}</component><ReadingImage v-if="data.cover" class="portrait" :src="mediaUrl(data.cover,'display')" :alt="data.cover.alt || '个人介绍配图'" :width="data.cover.width" :height="data.cover.height" eager /><p class="text">{{ introduction }}</p></template>
    </ReadState>
  </section>
</template>
<style scoped>.profile{margin-bottom:24px}.portrait{max-width:320px;margin:20px 0}.text{white-space:pre-wrap;line-height:1.95;overflow-wrap:anywhere}.demo{font-size:12px;background:var(--accent-soft);padding:4px 8px}h2{font-size:25px;overflow-wrap:anywhere}h1{overflow-wrap:anywhere}</style>

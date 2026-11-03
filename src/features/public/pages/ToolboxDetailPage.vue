<script setup lang="ts">
import { computed, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { formatDate, getToolboxContent, usePublicLoad } from '../api';
import ReadState from '../components/ReadState.vue';
import ContentBody from '../components/ContentBody.vue';
import ToolboxCopy from '../components/ToolboxCopy.vue';
const route = useRoute();
const back = computed(() => {
  const from = route.query.from;
  return typeof from === 'string' && (from === '/toolbox' || from.startsWith('/toolbox?')) ? from : '/toolbox';
});
const { data, loading, error, reload } = usePublicLoad(() => route.params.id, signal => getToolboxContent(String(route.params.id ?? ''), signal));
watch(data, async value => { if (value) { await nextTick(); window.scrollTo({top:0}); } });
</script>
<template>
  <article class="reader">
    <RouterLink class="back" :to="back">← 返回 AI 工具箱</RouterLink>
    <ReadState :loading="loading" :error="error" @retry="reload">
      <template v-if="data">
        <header><span v-if="data.isDemo" class="demo">演示数据</span><p class="eyebrow">{{ data.category }}</p><h1>{{ data.title }}</h1><p class="meta">{{ formatDate(data.recordDate) }}</p><p v-if="data.summary" class="summary">{{ data.summary }}</p></header>
        <ContentBody :key="data.id" :content="data" />
        <ToolboxCopy :content="data" />
        <div class="end"><RouterLink :to="back">← 返回 AI 工具箱</RouterLink><button class="quiet" @click="reload">重新加载内容</button></div>
      </template>
    </ReadState>
  </article>
</template>
<style scoped>
.reader{max-width:760px;margin:auto}.back{display:inline-block;min-height:44px;color:var(--accent);margin-bottom:20px}header{padding-bottom:16px;border-bottom:1px solid var(--line);margin-bottom:24px}h1{font-size:clamp(26px,4vw,36px);overflow-wrap:anywhere}.meta,.summary{color:var(--muted);line-height:1.8}.demo{font-size:12px;background:var(--accent-soft);padding:4px 8px}.end{margin-top:44px;padding-top:24px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px}.end a{color:var(--accent);padding:8px 0}.end button{min-height:44px}
</style>

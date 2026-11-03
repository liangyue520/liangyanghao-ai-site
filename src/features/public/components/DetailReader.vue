<script setup lang="ts">
import { computed, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { Kind } from '../../../../shared/contracts';
import { formatDate, getKindContent, usePublicLoad } from '../api';
import ReadState from './ReadState.vue';
import ContentBody from './ContentBody.vue';
const props = defineProps<{ kind: Kind; backPath: string; backLabel: string }>();
const route = useRoute();
const back = computed(() => {
  const from = route.query.from;
  return typeof from === 'string' && (from === props.backPath || from.startsWith(`${props.backPath}?`)) ? from : props.backPath;
});
const {data,loading,error,reload} = usePublicLoad(() => [props.kind,route.params.id], signal => getKindContent(String(route.params.id ?? ''), props.kind, signal));
watch(data, async value => { if(value) { await nextTick(); window.scrollTo({top:0}); } });
</script>
<template><article class="reader"><RouterLink class="back" :to="back">← {{ backLabel }}</RouterLink><ReadState :loading="loading" :error="error" @retry="reload"><template v-if="data"><header><span v-if="data.isDemo" class="demo">演示数据</span><h1>{{ data.title }}</h1><p class="meta">{{ formatDate(data.recordDate) }}<span v-if="data.category"> · {{ data.category }}</span></p></header><ContentBody :key="data.id" :content="data" /><div class="end"><RouterLink :to="back">← {{ backLabel }}</RouterLink><button class="quiet" @click="reload">重新加载内容</button></div></template></ReadState></article></template>
<style scoped>.reader{max-width:760px;margin:auto}.back{display:inline-block;min-height:44px;color:var(--accent);margin-bottom:20px}header{padding-bottom:16px;border-bottom:1px solid var(--line);margin-bottom:24px}h1{font-size:clamp(26px,4vw,36px);overflow-wrap:anywhere}.meta{font-size:14px;color:var(--muted)}.demo{font-size:12px;background:var(--accent-soft);padding:4px 8px}.end{margin-top:44px;padding-top:24px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px}.end a{color:var(--accent);padding:8px 0}.end button{min-height:44px}</style>

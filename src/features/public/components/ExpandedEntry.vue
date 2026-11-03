<script setup lang="ts">
import { ref } from 'vue';
import type { PublicSummary } from '../../../../shared/contracts';
import { formatDate, getKindContent, usePublicLoad } from '../api';
import ReadState from './ReadState.vue';
import ContentBody from './ContentBody.vue';
const props = defineProps<{ item: PublicSummary }>();
const open = ref(false);
const {data,loading,error,reload} = usePublicLoad(() => [open.value,props.item.id], signal => open.value ? getKindContent(props.item.id, props.item.kind, signal) : Promise.resolve(null));
</script>
<template><article class="entry"><span v-if="item.isDemo" class="demo">演示数据</span><p class="meta">{{ formatDate(item.recordDate) }}<span v-if="item.category"> · {{ item.category }}</span></p><h2>{{ item.title }}</h2><p v-if="item.summary">{{ item.summary }}</p><button class="toggle" :aria-expanded="open" :aria-controls="`body-${item.id}`" @click="open = !open">{{ open ? '收起' : item.kind === 'game' ? '查看作品与使用说明' : '展开故事' }}</button><div v-if="open" :id="`body-${item.id}`"><ReadState :loading="loading" :error="error" @retry="reload"><ContentBody v-if="data" :content="data" /></ReadState></div></article></template>
<style scoped>.entry{padding:24px 0;border-bottom:1px solid var(--line);overflow-wrap:anywhere}.meta{font-size:13px;color:var(--muted)}h2{font-size:22px}.toggle{background:var(--accent-soft);color:var(--accent);min-height:44px}.demo{font-size:12px;background:var(--accent-soft);padding:4px 8px}</style>

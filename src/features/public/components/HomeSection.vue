<script setup lang="ts">
import type { Kind } from '../../../../shared/contracts';
import { listContents, usePublicLoad } from '../api';
import ContentCard from './ContentCard.vue';
import ReadState from './ReadState.vue';
const props = defineProps<{ kind: Kind; title: string; to: string; emptyText: string }>();
const {data,loading,error,reload} = usePublicLoad(() => props.kind, signal => listContents({kind:props.kind,featured:true,pageSize:2},signal));
</script>
<template><section class="section"><div class="heading"><h2>{{ title }}</h2><RouterLink :to="to">查看全部 <span aria-hidden="true">↗</span></RouterLink></div><ReadState :loading="loading" :error="error" :empty="data?.items.length === 0" :empty-text="emptyText" @retry="reload"><ContentCard v-for="item in data?.items" :key="item.id" :item="item" /></ReadState></section></template>
<style scoped>
.section{min-height:100%;padding:22px;border:1px solid var(--line);border-radius:18px;background:rgb(255 255 255 / 72%);box-shadow:0 16px 44px rgb(25 39 52 / 7%)}.heading{display:flex;justify-content:space-between;gap:16px;align-items:center;border-bottom:1px solid var(--line);padding-bottom:8px}.heading h2{font-size:23px;margin:0}.heading a{color:var(--accent);font-size:14px;white-space:nowrap;min-height:44px;display:flex;align-items:center}
</style>

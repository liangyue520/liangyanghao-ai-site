<script setup lang="ts">
import { computed, nextTick, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import type { Kind } from '../../../../shared/contracts';
import { getDiaryFacets, listContents, positivePage, readingPositions, usePublicLoad, yearLabel } from '../api';
import ReadState from './ReadState.vue';
import ContentCard from './ContentCard.vue';
import Pagination from './Pagination.vue';
import ExpandedEntry from './ExpandedEntry.vue';
const props = defineProps<{ kind: Kind; title: string; description: string; emptyText: string }>();
const route = useRoute(), router = useRouter();
const page = computed(() => positivePage(route.query.page));
const year = computed(() => typeof route.query.year === 'string' ? route.query.year : '');
const category = computed(() => typeof route.query.category === 'string' ? route.query.category : '');
const { data, loading, error, reload } = usePublicLoad(() => [props.kind, page.value, year.value, category.value], signal => listContents({kind:props.kind, page:page.value, pageSize:12, ...(props.kind === 'diary' ? {year:year.value, category:category.value} : {})}, signal));
const facets = usePublicLoad(() => props.kind, signal => props.kind === 'diary' ? getDiaryFacets(signal) : Promise.resolve({years:[],categories:[]}));
function filter(key: 'year'|'category', event: Event) {
  void router.push({path:route.path,query:{...route.query,[key]:(event.target as HTMLSelectElement).value || undefined,page:undefined}});
}
function changePage(value: number) { void router.push({path:route.path,query:{...route.query,page:value === 1 ? undefined : String(value)}}); }
onBeforeRouteLeave(() => { readingPositions.set(route.fullPath, window.scrollY); });
watch(data, async value => {
  if (!value) return;
  await nextTick();
  window.scrollTo({top:readingPositions.get(route.fullPath) ?? 0});
});
</script>
<template>
  <section class="collection"><header><p class="eyebrow">公开记录</p><h1>{{ title }}</h1><p class="intro">{{ description }}</p></header>
    <slot />
    <div v-if="kind === 'diary'" class="filters">
      <label>年份<select :value="year" :disabled="facets.loading.value || !!facets.error.value" @change="filter('year', $event)"><option value="">全部年份</option><option v-if="year && !facets.data.value?.years.some(x => x.key === year)" :value="year">{{ yearLabel(year) }}</option><option v-for="option in facets.data.value?.years" :key="option.key" :value="option.key">{{ yearLabel(option.key) }}（{{ option.count }}）</option></select></label>
      <label>分类<select :value="category" :disabled="facets.loading.value || !!facets.error.value" @change="filter('category', $event)"><option value="">全部分类</option><option v-if="category && !facets.data.value?.categories.some(x => x.name === category)" :value="category">{{ category }}</option><option v-for="option in facets.data.value?.categories" :key="option.name" :value="option.name">{{ option.name }}（{{ option.count }}）</option></select></label>
      <RouterLink v-if="year || category" class="clear" to="/diary">清除筛选</RouterLink>
    </div>
    <ReadState v-if="kind === 'diary' && (facets.loading.value || facets.error.value)" :loading="facets.loading.value" :error="facets.error.value" @retry="facets.reload" />
    <ReadState :loading="loading" :error="error" :empty="data?.items.length === 0" :empty-text="year || category ? '这个年份或分类下暂时没有公开日记。' : emptyText" @retry="reload">
      <template #empty><RouterLink v-if="page > 1" :to="{path:route.path,query:{...route.query,page:undefined}}">返回第一页</RouterLink></template>
      <template v-if="data">
        <template v-for="item in data.items" :key="item.id">
          <ExpandedEntry v-if="kind === 'story' || kind === 'game'" :item="item" />
          <ContentCard v-else :item="item" :return-to="route.fullPath" />
        </template>
      </template>
    </ReadState>
    <Pagination v-if="data" :page="page" :page-size="data.pageSize" :total="data.total" :busy="loading" @change="changePage" />
  </section>
</template>
<style scoped>
.collection{max-width:760px;margin:auto}.intro{color:var(--muted);margin-bottom:28px}.filters{display:flex;gap:16px;flex-wrap:wrap;padding:20px 0;border-block:1px solid var(--line);align-items:end}.filters label{display:grid;gap:6px;flex:1;min-width:120px;font-size:14px}.filters select{width:100%;min-height:44px}.clear{color:var(--accent);padding:10px 0}.collection header h1{margin-bottom:12px}
</style>

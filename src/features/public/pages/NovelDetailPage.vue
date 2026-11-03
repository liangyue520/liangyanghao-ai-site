<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { formatDate, getKindContent, usePublicLoad } from '../api';
import ReadState from '../components/ReadState.vue';
import NovelReader from '../components/NovelReader.vue';
const route=useRoute();
const id=computed(()=>String(route.params.id||''));
const {data,loading,error,reload}=usePublicLoad(id,signal=>getKindContent(id.value,'story',signal));
</script>
<template>
  <ReadState :loading="loading" :error="error" :empty="!data" empty-text="这篇小说暂时无法查看。" @retry="reload">
    <article v-if="data" class="novel-detail" id="novel-contents">
      <header><RouterLink class="back" to="/novel">← 返回小说专栏</RouterLink><p class="meta">{{ formatDate(data.recordDate) }}<span v-if="data.category"> · {{ data.category }}</span></p><h1>{{ data.title }}</h1><p v-if="data.summary" class="summary">{{ data.summary }}</p></header>
      <NovelReader :body-text="data.bodyText" />
    </article>
  </ReadState>
</template>
<style scoped>
.novel-detail{max-width:900px;margin:0 auto}.novel-detail>header{max-width:760px;margin:0 auto 34px;padding-bottom:24px;border-bottom:1px solid var(--line)}.back{display:inline-block;min-height:44px;padding:8px 0;color:var(--accent)}.meta{margin:8px 0;color:var(--muted);font-size:13px}.novel-detail h1{margin:10px 0 12px;font-size:clamp(28px,5vw,40px);line-height:1.4}.summary{color:var(--muted);line-height:1.8}
</style>

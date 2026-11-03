<script setup lang="ts">
import { listToolboxContents, usePublicLoad } from '../api';
import ReadState from './ReadState.vue';
import ToolboxCard from './ToolboxCard.vue';
const { data, loading, error, reload } = usePublicLoad(() => 'toolbox-home', signal => listToolboxContents({featured:true,pageSize:3}, signal));
</script>
<template>
  <section class="section">
    <div class="heading"><h2>AI 工具箱</h2><RouterLink to="/toolbox">查看全部 <span aria-hidden="true">↗</span></RouterLink></div>
    <p class="intro">整理公开的 Skill、提示词和工作流，只展示来源与使用边界清楚的内容。</p>
    <ReadState :loading="loading" :error="error" :empty="data?.items.length === 0" empty-text="暂时没有精选工具。" @retry="reload">
      <ToolboxCard v-for="item in data?.items" :key="item.id" :item="item" />
    </ReadState>
  </section>
</template>
<style scoped>
.section{min-height:100%;padding:22px;border:1px solid var(--line);border-radius:18px;background:rgb(255 255 255 / 72%);box-shadow:0 16px 44px rgb(25 39 52 / 7%)}.heading{display:flex;justify-content:space-between;gap:16px;align-items:center;border-bottom:1px solid var(--line);padding-bottom:8px}.heading h2{font-size:23px;margin:0}.heading a{color:var(--accent);font-size:14px;white-space:nowrap;min-height:44px;display:flex;align-items:center}.intro{color:var(--muted);line-height:1.8}
</style>

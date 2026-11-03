<script setup lang="ts">
import { toolboxCategories } from '../api';
defineProps<{ current?: string; basePath?: string }>();
</script>
<template>
  <nav class="filters" aria-label="AI工具箱分类">
    <RouterLink :to="basePath || '/toolbox'" :class="{active:!current}">全部</RouterLink>
    <RouterLink v-for="name in toolboxCategories" :key="name" :to="{path:basePath || '/toolbox',query:{category:name}}" :class="{active:current===name}">{{ name }}</RouterLink>
  </nav>
</template>
<style scoped>
.filters{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0 24px}.filters a{min-height:40px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;color:var(--ink);background:var(--paper);font-size:14px}.filters a.active{border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}@media(max-width:520px){.filters{overflow:auto;flex-wrap:nowrap;padding-bottom:4px}.filters a{white-space:nowrap;flex:0 0 auto}}
</style>

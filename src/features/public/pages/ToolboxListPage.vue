<script setup lang="ts">
import CodexSkillsCatalog from '../components/CodexSkillsCatalog.vue';
</script>
<template>
  <section class="toolbox">
    <header><p class="eyebrow">AI 工具箱</p><h1>公开的 Skill 与工作流</h1><p class="intro">这里放经过公开确认的提示词、SOP 和小工具。每条内容都说明来源、版本和使用边界。</p></header>
    <CodexSkillsCatalog />
  </section>
</template>
<style scoped>
.toolbox{max-width:760px;margin:auto}.intro{color:var(--muted);line-height:1.8;margin-bottom:18px}.toolbox header h1{margin-bottom:12px}
</style>

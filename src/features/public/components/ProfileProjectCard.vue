<script setup lang="ts">
import type { ResumeProjectCard } from '../profile-resume-data';

defineProps<{ project: ResumeProjectCard }>();
</script>

<template>
  <article class="project-card">
    <header class="project-meta"><span class="status">{{ project.status }}</span><span v-if="project.period" class="project-period">{{ project.period }}</span></header>
    <h3>{{ project.title }}</h3>
    <p>{{ project.description }}</p>
    <p v-if="project.outcome" class="project-outcome">{{ project.outcome }}</p>
    <p v-if="project.caveat" class="project-caveat">{{ project.caveat }}</p>
    <div>
      <span v-for="tag in project.tags" :key="tag">{{ tag }}</span>
    </div>
  </article>
</template>

<style scoped>
.project-card{display:flex;min-width:0;min-height:210px;flex-direction:column;gap:12px;padding:20px;border:1px solid var(--course-line);border-radius:18px;background:var(--course-panel);color:var(--course-text);box-shadow:inset 0 1px 0 rgba(235,248,231,.035)}
.project-meta{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.project-period{font-size:11px;color:var(--course-muted)}
.status{align-self:flex-start;max-width:100%;padding:5px 9px;border:1px solid var(--course-line);border-radius:999px;background:var(--course-panel-strong);color:var(--course-link);font-size:12px;font-weight:600;overflow-wrap:anywhere}
h3{margin:0;font-size:20px;color:var(--course-text);overflow-wrap:anywhere}
p{margin:0;color:var(--course-copy);line-height:1.8;overflow-wrap:anywhere}
.project-outcome{padding-top:12px;border-top:1px solid var(--course-line);font-size:13px;color:var(--course-muted)}
.project-caveat{padding:10px 12px;border-left:2px solid var(--course-accent);background:var(--course-panel-strong);font-size:12px;color:var(--course-copy);line-height:1.85}
.project-card div{display:flex;flex-wrap:wrap;gap:8px;min-width:0;margin-top:auto}
.project-card div span{max-width:100%;padding:5px 8px;border:1px solid var(--course-line);border-radius:999px;background:var(--course-panel);color:var(--course-muted);font-size:12px;line-height:1.5;overflow-wrap:anywhere}
</style>

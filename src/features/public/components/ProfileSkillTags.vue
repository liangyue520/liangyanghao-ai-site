<script setup lang="ts">
import type { ResumeSkillGroup } from '../profile-resume-data';

defineProps<{ groups: ResumeSkillGroup[] }>();
</script>

<template>
  <section class="skills" aria-label="技能与工具">
    <div class="section-head">
      <p class="eyebrow">把想法做出来的工具</p>
      <h2>技能与工具</h2>
      <p>日常开发中使用的技术，以及我正在持续探索的方向。</p>
    </div>
    <div class="skill-grid">
      <article v-for="group in groups" :key="group.title" class="skill-card">
        <h3>{{ group.title }}</h3>
        <p v-if="group.description" class="skill-description">{{ group.description }}</p>
        <div>
          <span v-for="tag in group.tags" :key="tag">{{ tag }}</span>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.skills{min-width:0;padding:24px;border:1px solid var(--course-line);border-radius:20px;background:var(--course-panel);color:var(--course-text);box-shadow:inset 0 1px 0 rgba(235,248,231,.035)}
.section-head{margin-bottom:18px}
.section-head h2{margin:4px 0 8px;font-size:clamp(22px,3vw,28px);color:var(--course-text);overflow-wrap:anywhere}
.section-head p:last-child{margin:0;color:var(--course-copy);line-height:1.8}
.skill-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.skill-card{min-width:0;padding:18px;border:1px solid var(--course-line);border-radius:16px;background:var(--course-panel)}
h3{margin:0 0 12px;font-size:17px;color:var(--course-text);overflow-wrap:anywhere}
.skill-description{margin:0 0 16px;font-size:13px;line-height:1.85;color:var(--course-copy);overflow-wrap:anywhere}
.skill-card div{display:flex;flex-wrap:wrap;gap:8px;min-width:0}
span{max-width:100%;padding:6px 10px;border:1px solid var(--course-line);border-radius:999px;background:var(--course-panel-strong);color:var(--course-link);font-size:13px;line-height:1.5;overflow-wrap:anywhere}
.eyebrow{margin:0;color:var(--course-accent);font-size:13px;font-weight:600}
@media(max-width:860px){.skill-grid{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.skills{padding:20px}.skill-grid{grid-template-columns:1fr}}
</style>

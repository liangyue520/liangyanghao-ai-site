<script setup lang="ts">
import type { ResumeTimelineSection } from '../profile-resume-data';

defineProps<{ sections: ResumeTimelineSection[] }>();
</script>

<template>
  <section class="timeline-wrap" aria-label="学习经历与公开经历">
    <article v-for="section in sections" :key="section.title" class="timeline-card">
      <header>
        <p class="eyebrow">走过的路</p>
        <h2>{{ section.title.replace('公开', '') }}</h2>
        <p>{{ section.title.includes('学习') ? '从工科学习开始，持续探索软件开发与 AI。' : '从视觉检测、仿真软件到个人项目，积累开发与交付经验。' }}</p>
      </header>
      <ol>
        <li v-for="item in section.items" :key="`${section.title}-${item.title}-${item.period}`">
          <div class="marker" aria-hidden="true" />
          <div>
            <p class="period">{{ item.period }}</p>
            <h3>{{ item.title }}</h3>
            <strong>{{ item.subtitle }}</strong>
            <p>{{ item.description }}</p>
          </div>
        </li>
      </ol>
    </article>
  </section>
</template>

<style scoped>
.timeline-wrap{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;color:var(--course-text)}
.timeline-card{min-width:0;padding:24px;border:1px solid var(--course-line);border-radius:20px;background:var(--course-panel);box-shadow:inset 0 1px 0 rgba(235,248,231,.035)}
header{margin-bottom:20px}
h2{margin:4px 0 8px;font-size:clamp(22px,3vw,28px);color:var(--course-text);overflow-wrap:anywhere}
header p:last-child{margin:0;color:var(--course-copy);line-height:1.8}
ol{list-style:none;margin:0;padding:0}
li{position:relative;display:grid;grid-template-columns:22px minmax(0,1fr);gap:12px;padding-bottom:24px}
li:last-child{padding-bottom:0}
li:not(:last-child)::before{content:"";position:absolute;left:10px;top:20px;bottom:0;width:1px;background:var(--course-line)}
.marker{position:relative;z-index:1;width:22px;height:22px;border:6px solid var(--course-bg-deep);border-radius:999px;background:var(--course-accent);box-shadow:0 0 0 1px var(--course-line)}
.period{display:inline-flex;max-width:100%;margin:0 0 8px;padding:4px 9px;border:1px solid var(--course-line);border-radius:999px;background:var(--course-panel-strong);color:var(--course-link);font-size:13px;font-weight:600;overflow-wrap:anywhere}
h3{margin:0 0 6px;font-size:18px;color:var(--course-text);overflow-wrap:anywhere}
strong{display:block;color:var(--course-copy);font-size:14px;overflow-wrap:anywhere}
li p:last-child{margin:8px 0 0;color:var(--course-muted);line-height:1.85;overflow-wrap:anywhere}
.eyebrow{margin:0;color:var(--course-accent);font-size:13px;font-weight:600}
@media(max-width:760px){.timeline-wrap{grid-template-columns:1fr}.timeline-card{padding:20px}}
</style>

<script setup lang="ts">
import { resumeIntroduction } from '../profile-resume-data';
</script>

<template>
  <section class="profile-hero" aria-labelledby="profile-heading">
    <p class="eyebrow"><span aria-hidden="true" />关于我</p>
    <h1 id="profile-heading">你好，我是梁养浩。<br><span>{{ resumeIntroduction.role }}</span></h1>
    <p class="lead">{{ resumeIntroduction.lead }}</p>
    <p class="introduction">{{ resumeIntroduction.description }}</p>
    <div class="profile-directions" aria-label="主要技术方向">
      <span v-for="direction in resumeIntroduction.directions" :key="direction">{{ direction }}</span>
    </div>
    <dl class="profile-highlights" aria-label="工程经验概览">
      <div v-for="highlight in resumeIntroduction.highlights" :key="highlight.label"><dt>{{ highlight.label }}</dt><dd>{{ highlight.value }}</dd></div>
    </dl>
    <a class="profile-more" href="#profile-experience">向下了解我的经历 <span aria-hidden="true">↓</span></a>
  </section>
</template>

<style scoped>
.profile-hero{position:relative;max-width:880px;padding:14px 0 36px;color:var(--course-text)}
.eyebrow{display:flex;align-items:center;gap:10px;margin:0 0 28px;color:var(--course-muted);font-size:13px;letter-spacing:.08em}
.eyebrow span{width:6px;height:6px;border-radius:50%;background:var(--course-accent)}
h1{margin:0 0 26px;font-size:clamp(32px,4.6vw,52px);line-height:1.4;letter-spacing:-.035em;font-weight:650;overflow-wrap:anywhere}
h1 span{color:var(--course-accent);font-size:.78em;font-weight:500}
.lead,.introduction{max-width:720px;margin:0 0 16px;font-size:17px;line-height:1.95;color:var(--course-copy)}
.introduction{font-size:15px;color:var(--course-muted)}
.profile-directions{display:flex;flex-wrap:wrap;gap:10px;margin:28px 0 32px}
.profile-directions>span{padding:7px 13px;border:1px solid var(--course-line);border-radius:30px;background:var(--course-panel);font-size:12px;color:var(--course-link);overflow-wrap:anywhere}
.profile-more{display:inline-flex;align-items:center;gap:22px;font-size:13px;color:var(--course-muted);text-underline-offset:5px}
.profile-highlights{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;max-width:720px;margin:0 0 30px;padding:24px 0;border-block:1px solid var(--course-line)}
.profile-highlights>div{min-width:0;display:flex;flex-direction:column-reverse;gap:7px}
.profile-highlights dt{font-size:12px;color:var(--course-muted);overflow-wrap:anywhere}
.profile-highlights dd{margin:0;color:var(--course-accent);font-size:clamp(24px,3vw,34px);font-family:Georgia,serif;line-height:1.4}
@media(max-width:480px){.profile-highlights{gap:12px;padding:20px 0}.profile-highlights dt{font-size:10px}.profile-highlights dd{font-size:24px}}
@media(max-width:720px){.profile-hero{padding:0 0 16px}.eyebrow{margin-bottom:22px}h1{font-size:clamp(28px,6.2vw,38px)}h1 span{font-size:.72em}.lead{font-size:16px}.introduction{font-size:14px}.profile-directions{gap:8px;margin:24px 0}.profile-directions>span{font-size:11px;padding:6px 10px}}
</style>

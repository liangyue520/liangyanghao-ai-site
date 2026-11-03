<script setup lang="ts">
import { resumeSocialLinks } from '../profile-resume-data';
</script>

<template>
  <section class="social" aria-labelledby="social-heading">
    <div class="section-head">
      <p class="eyebrow">在别处，继续交流</p>
      <h2 id="social-heading">你也可以在这里找到我</h2>
      <p>欢迎从这里继续阅读我的文章、分享和创作动态。</p>
    </div>
    <div class="social-grid">
      <a v-for="link in resumeSocialLinks" :key="link.href" class="social-card" :href="link.href" target="_blank" rel="noopener noreferrer" :aria-label="link.name + '：' + (link.action || '前往主页') + '（新窗口）'">
        <span class="social-name">{{ link.name }}</span>
        <span v-if="(link.followerCount ?? 0) >= 100" class="social-followers">{{ link.followers || link.followerCount?.toLocaleString('zh-CN') + ' 位粉丝' }}</span>
        <span class="social-description">{{ link.description }}</span>
        <span class="social-action">{{ link.action || '前往主页' }} ↗</span>
      </a>
    </div>
    <p class="followers-note">粉丝数为资料记录，非实时更新。</p>
  </section>
</template>

<style scoped>
.social{color:var(--course-text)}
.section-head{margin-bottom:24px}
.section-head h2{margin:8px 0 12px;font-size:clamp(24px,3.2vw,34px);line-height:1.5;font-weight:600;letter-spacing:-.02em}
.section-head p:last-child{margin:0;color:var(--course-muted);font-size:14px;line-height:1.9}
.eyebrow{margin:0;color:var(--course-link);font-size:12px;letter-spacing:.06em}
.social-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.social-card{display:flex;min-width:0;min-height:175px;flex-direction:column;align-items:flex-start;gap:14px;padding:22px 20px;border:1px solid var(--course-line);border-radius:18px;background:var(--course-panel);color:var(--course-text);text-decoration:none;box-shadow:inset 0 1px 0 rgba(235,248,231,.035);transition:background .2s,border-color .2s}
.social-card:hover{background:var(--course-panel-strong);border-color:var(--course-link);text-decoration:none}
.social-name{font-size:20px;font-weight:600;overflow-wrap:anywhere}
.social-followers{padding:4px 10px;border:1px solid var(--course-line);border-radius:20px;background:var(--course-panel-strong);color:var(--course-link);font-size:12px;line-height:1.6}
.followers-note{margin:16px 0 0;color:var(--course-muted);font-size:11px;line-height:1.8}
.social-description{color:var(--course-muted);font-size:13px;line-height:1.8;overflow-wrap:anywhere}
.social-action{margin-top:auto;color:var(--course-link);font-size:12px}
@media(max-width:1060px){.social-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:720px){.social-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.social-card{padding:20px;min-height:160px}}
@media(max-width:480px){.social-grid{grid-template-columns:1fr}.social-card{min-height:145px}}
@media(prefers-reduced-motion:reduce){.social-card{transition:none}}
</style>

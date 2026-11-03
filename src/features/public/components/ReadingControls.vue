<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
const progress = ref(0);
let frame = 0;
let resizeObserver: ResizeObserver | undefined;
function updateProgress() {
  frame = 0;
  const root = document.documentElement;
  const height = Math.max(root.scrollHeight, document.body.scrollHeight) - window.innerHeight;
  progress.value = height <= 0 ? 100 : Math.round(Math.min(1, Math.max(0, window.scrollY / height)) * 100);
}
function scheduleUpdate() { if (!frame) frame = requestAnimationFrame(updateProgress); }
function toTop() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'instant' : 'smooth' });
}
watch(() => route.fullPath, () => { void nextTick(scheduleUpdate); });
onMounted(() => { window.addEventListener('scroll', scheduleUpdate, { passive: true }); window.addEventListener('resize', scheduleUpdate); resizeObserver = new ResizeObserver(scheduleUpdate); resizeObserver.observe(document.body); scheduleUpdate(); });
onBeforeUnmount(() => { window.removeEventListener('scroll', scheduleUpdate); window.removeEventListener('resize', scheduleUpdate); resizeObserver?.disconnect(); if (frame) cancelAnimationFrame(frame); });
</script>

<template>
  <aside class="reading-controls" aria-label="阅读工具">
    <div class="progress" role="progressbar" aria-label="页面阅读进度" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100" :style="{ '--progress': progress + '%' }"><span>{{ progress }}<small>%</small></span></div>
    <button class="back-top" type="button" aria-label="返回页面顶部" title="返回顶部" @click="toTop"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="m5 15 7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
  </aside>
</template>

<style scoped>
.reading-controls{position:fixed;z-index:25;right:clamp(12px,2vw,28px);bottom:28px;display:flex;flex-direction:column;gap:9px;align-items:center}
.progress,.back-top{width:48px;height:48px;border:1px solid var(--course-line);border-radius:16px;box-shadow:0 6px 22px rgba(4,22,17,.18);color:var(--course-link)}
.progress{display:grid;place-items:center;background:conic-gradient(var(--course-link) var(--progress),rgba(192,228,197,.16) 0);padding:3px;font-size:11px;font-variant-numeric:tabular-nums}
.progress span{display:grid;place-items:center;width:100%;height:100%;border-radius:13px;background:#1c443c;font-weight:600}.progress small{font-size:9px}.progress span{display:flex;align-items:center;justify-content:center}
.back-top{display:grid;place-items:center;padding:0;background:#1c443c;transition:background .2s,transform .2s}.back-top:hover{background:#28594c;transform:translateY(-2px)}
@media(max-width:720px){.reading-controls{right:12px;bottom:16px}.progress,.back-top{width:43px;height:43px;border-radius:14px}.progress span{border-radius:11px}}
@media(prefers-reduced-motion:reduce){.back-top{transition:none}}
@media print{.reading-controls{display:none}}
</style>

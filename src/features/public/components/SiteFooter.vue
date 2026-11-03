<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import FlowingBorder from './FlowingBorder.vue';
import { resumeSocialLinks } from '../profile-resume-data';
import { formatUptime, readSiteStats, type SiteStats } from './site-footer';

const startedAt = (import.meta.env.VITE_SITE_STARTED_AT as string | undefined) || '2026-11-02';
const statsUrl = (import.meta.env.VITE_PUBLIC_SITE_STATS_URL as string | undefined) || '/api/v1/public/analytics/summary';
const clock = ref(Date.now());
const uptime = computed(() => formatUptime(startedAt, clock.value));
const stats = ref<SiteStats | null>(null);
const socialLinks = resumeSocialLinks.filter(link => ['GitHub', '哔哩哔哩'].includes(link.name));
const year = new Date().getFullYear();
let timer: ReturnType<typeof setInterval> | undefined;
let abort: AbortController | undefined;
function refreshStats() {
  abort?.abort();
  abort = new AbortController();
  fetch(statsUrl, { signal: abort.signal, credentials: 'omit', headers: { Accept: 'application/json' } })
    .then(response => response.ok ? response.json() : null)
    .then(value => { stats.value = readSiteStats(value?.data ?? value); })
    .catch(error => { if (error?.name !== 'AbortError') stats.value = null; });
}

onMounted(() => {
  if (startedAt) timer = setInterval(() => { clock.value = Date.now(); }, 1000);
  refreshStats();
  window.addEventListener('site-analytics-updated', refreshStats);
});
onBeforeUnmount(() => { if (timer) clearInterval(timer); abort?.abort(); window.removeEventListener('site-analytics-updated', refreshStats); });
const number = (value: number | undefined) => value === undefined ? '—' : value.toLocaleString('zh-CN');
</script>

<template>
  <footer class="site-footer" aria-label="网站页脚">
    <div class="footer-inner">
      <FlowingBorder :duration="20" />
      <span class="sparkle sparkle-one" aria-hidden="true">✳</span><span class="sparkle sparkle-two" aria-hidden="true">✦</span>
      <nav class="footer-links" aria-label="更多链接">
        <RouterLink to="/insights"><span aria-hidden="true">⌂</span> 开发经验</RouterLink>
        <a v-for="link in socialLinks" :key="link.name" :href="link.href" target="_blank" rel="noopener noreferrer">{{ link.name }} <span aria-hidden="true">↗</span></a>
      </nav>
      <div class="uptime-pill">
        <span class="planet" aria-hidden="true"><svg viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="20" fill="currentColor" fill-opacity=".13" stroke="currentColor" stroke-opacity=".75"/><path d="M9 28h38M28 8c-6 6-9 13-9 20s3 14 9 20M28 8c6 6 9 13 9 20s-3 14-9 20M12 18c5 3 10 4 16 4s11-1 16-4M12 38c5-3 10-4 16-4s11 1 16 4" stroke="currentColor" stroke-opacity=".55"/><ellipse cx="28" cy="28" rx="26" ry="11" transform="rotate(-23 28 28)" stroke="currentColor" stroke-opacity=".5"/></svg></span>
        <div><span class="uptime-label">在这里，慢慢探索 AI</span><p v-if="uptime">网站已陪伴你 <strong>{{ uptime }}</strong></p><p v-else>网站上线时间待设置</p></div>
        <span class="pill-star" aria-hidden="true">✳</span>
      </div>
      <div class="site-stats" aria-label="网站访问统计">
        <span>今日访客 <strong>{{ number(stats?.todayVisitors) }}</strong></span>
        <span>今日访问 <strong>{{ number(stats?.todayPageviews) }}</strong></span>
        <span>本站访客 <strong>{{ number(stats?.totalVisitors) }}</strong></span>
        <span>本站访问 <strong>{{ number(stats?.totalPageviews) }}</strong></span>
      </div>
      <p v-if="!stats" class="stats-note">访客数据暂未接入</p>
      <div class="divider" aria-hidden="true"><span>✳</span></div>
      <div class="footer-bottom"><p>© {{ year }} 梁养浩 · 用生活中的例子，讲清楚复杂的 AI</p><RouterLink to="/learning">继续探索课程 ↗</RouterLink></div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer{width:min(1156px,calc(100% - 64px));max-width:none;margin:80px auto 26px;padding:0;color:var(--course-muted);font-size:13px}
.footer-inner{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;padding:34px 32px 27px;border:1px solid var(--course-line);border-radius:24px;background:linear-gradient(145deg,rgba(195,227,209,.075),rgba(195,227,209,.025));box-shadow:inset 0 1px 0 rgba(235,248,231,.05)}
.footer-links{display:flex;justify-content:center;gap:28px;flex-wrap:wrap;font-size:13px}.footer-links a{color:var(--course-copy);transition:color .2s}.footer-links a:hover{color:var(--course-accent);text-decoration:none}.footer-links span{color:var(--course-accent)}
.uptime-pill{display:flex;align-items:center;gap:16px;margin:26px auto 22px;padding:10px 22px 10px 12px;border:1px solid rgba(192,228,197,.3);border-radius:999px;background:rgba(192,228,197,.055);color:var(--course-copy)}
.planet{display:grid;place-items:center;width:51px;height:51px;color:var(--course-link);flex:none}.planet svg{width:100%;height:100%;animation:orbit 18s ease-in-out infinite}.uptime-label{display:block;font-size:11px;color:var(--course-muted);letter-spacing:.04em}.uptime-pill p{font-size:13px;margin:3px 0 0}.uptime-pill strong{font-variant-numeric:tabular-nums;font-weight:600;color:var(--course-accent)}.pill-star{color:var(--course-accent);font-size:20px;margin-left:8px}
.site-stats{display:flex;justify-content:center;flex-wrap:wrap;gap:10px 0;line-height:1.5}.site-stats span{padding:0 20px}.site-stats span+span{border-left:1px solid var(--course-line)}.site-stats strong{margin-left:6px;color:var(--course-link);font-weight:600;font-variant-numeric:tabular-nums}.stats-note{margin:8px 0 0;font-size:11px;color:var(--course-muted)}
.divider{width:min(580px,100%);height:1px;margin:28px 0 18px;background:linear-gradient(90deg,transparent,var(--course-line),transparent);position:relative}.divider span{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:var(--course-accent);background:#1a423a;padding:0 10px;font-size:17px}
.footer-bottom{text-align:center;font-size:12px}.footer-bottom p{margin:0 0 7px}.footer-bottom a{color:var(--course-link)}
.sparkle{position:absolute;color:var(--course-accent);opacity:.25;pointer-events:none;animation:float 6s ease-in-out infinite}.sparkle-one{left:9%;top:40%;font-size:14px}.sparkle-two{right:10%;top:23%;font-size:19px;animation-delay:-3s}
@keyframes orbit{50%{transform:rotate(12deg)}}@keyframes float{50%{transform:translateY(-7px);opacity:.65}}
@media(max-width:720px){.site-footer{width:calc(100% - 44px);margin:48px auto 22px}.footer-inner{padding:27px 16px 22px}.footer-links{gap:20px}.uptime-pill{gap:10px;padding-right:15px}.planet{width:43px;height:43px}.site-stats{display:grid;grid-template-columns:repeat(2,1fr);width:min(340px,100%);text-align:center;gap:12px 0}.site-stats span{padding:0 8px}.site-stats span+span{border-left:0}.site-stats span:nth-child(even){border-left:1px solid var(--course-line)}.footer-bottom{line-height:1.8}}
@media(prefers-reduced-motion:reduce){.planet svg,.sparkle{animation:none}.footer-links a{transition:none}}
@media print{.sparkle{display:none}.footer-inner{box-shadow:none}.divider span{background:#fff}}
</style>

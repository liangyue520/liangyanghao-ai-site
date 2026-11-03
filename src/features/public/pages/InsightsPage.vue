<script setup lang="ts">
import { computed, ref } from 'vue';
import LearningStage from '../components/LearningStage.vue';
import { developmentInsights } from '../insights/catalog';
import { useScrollReveal } from '../../../lib/useScrollReveal';

const page = ref<HTMLElement>();
const selectedSeries = ref<'all' | 'practice' | 'fullstack'>('all');
const fullstackCount = developmentInsights.filter(insight => insight.articleType === 'scenario').length;
const practiceCount = developmentInsights.length - fullstackCount;
const visibleInsights = computed(() => developmentInsights.filter(insight => selectedSeries.value === 'all' || (selectedSeries.value === 'fullstack' ? insight.articleType === 'scenario' : insight.articleType !== 'scenario')));
useScrollReveal(page);
</script>

<template>
  <LearningStage>
    <div ref="page" class="insights-page">
      <div class="reveal-anchor" data-reveal>
        <header class="insights-intro" data-reveal-content>
          <p class="eyebrow">在实践中理解 AI</p>
          <h1>AI 开发经验分享</h1>
          <p class="intro-copy">项目实践、个人思考，以及用情景展开的全栈 AI 开发讨论。<br>从一个具体的问题出发，记录思路、尝试，以及做完之后的思考。</p>
          <p class="published-count">已发布 <strong>{{ developmentInsights.length }}</strong> 篇分享</p>
        </header>
      </div>

      <div class="insight-filters" role="group" aria-label="按分享系列筛选">
        <button type="button" :aria-pressed="selectedSeries === 'all'" @click="selectedSeries = 'all'">全部分享 <span>{{ developmentInsights.length }}</span></button>
        <button type="button" :aria-pressed="selectedSeries === 'fullstack'" @click="selectedSeries = 'fullstack'">全栈 AI 开发手记 <span>{{ fullstackCount }}</span></button>
        <button type="button" :aria-pressed="selectedSeries === 'practice'" @click="selectedSeries = 'practice'">项目实践与复盘 <span>{{ practiceCount }}</span></button>
      </div>

      <section v-if="visibleInsights.length" class="insights-list" aria-label="已发布的开发经验分享">
        <div v-for="(insight, index) in visibleInsights" :key="insight.slug" class="reveal-anchor insight-reveal" data-reveal :style="{ '--reveal-delay': `${index % 2 * 90}ms` }">
          <RouterLink :to="'/insights/' + insight.slug" class="insight-card" data-reveal-content>
            <p v-if="insight.series" class="insight-series">{{ insight.series.name }} · {{ String(insight.series.order).padStart(2, '0') }}</p>
            <div class="insight-meta"><span>{{ insight.category }}<span v-if="insight.articleType === 'scenario'" class="insight-kind"> · 情景讨论</span></span><time :datetime="insight.publishedAt">{{ insight.publishedAt }}</time></div>
            <h2>{{ insight.title }}</h2>
            <p>{{ insight.summary }}</p>
            <span class="read-link">阅读分享 <span aria-hidden="true">↗</span></span>
          </RouterLink>
        </div>
      </section>

      <div v-else class="reveal-anchor" data-reveal>
        <section class="empty-insights" aria-labelledby="empty-insights-title" data-reveal-content>
          <svg class="empty-mark" viewBox="0 0 48 56" fill="none" aria-hidden="true"><rect x="8" y="4" width="32" height="46" rx="6" stroke="currentColor" stroke-width="1.4"/><path d="M17 17H31M17 25H31M17 33H26M5 12H11M5 22H11M5 32H11M5 42H11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          <p class="empty-eyebrow">先认真做，再慢慢写</p>
          <h2 id="empty-insights-title">还没有发布分享</h2>
          <p>有值得记录的实践时，我会把过程和思考整理在这里。<br>现在，可以先看看我的项目经历。</p>
          <RouterLink to="/about#projects-heading">看看项目经历 <span aria-hidden="true">↗</span></RouterLink>
        </section>
      </div>
    </div>
  </LearningStage>
</template>

<style scoped>
.insights-page{max-width:1180px;margin:0 auto;padding:48px 32px 80px;color:var(--course-text)}
.reveal-anchor{display:flow-root;min-width:0}
.insights-intro{margin-bottom:38px}
.eyebrow{margin:0 0 14px;color:var(--course-accent);font-size:12px;letter-spacing:.06em}
.insights-intro h1{margin:0 0 18px;font-size:clamp(32px,4vw,48px);line-height:1.4;letter-spacing:-.035em;overflow-wrap:anywhere}
.intro-copy{max-width:760px;margin:0;color:var(--course-copy);font-size:15px;line-height:2}
.published-count{margin:23px 0 0;color:var(--course-muted);font-size:12px}
.published-count strong{color:var(--course-link);font-weight:500}
.insight-filters{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 28px}
.insight-filters button{display:inline-flex;gap:12px;align-items:center;padding:10px 15px;border:1px solid var(--course-line);border-radius:999px;background:var(--course-panel);color:var(--course-copy);font:inherit;font-size:12px;cursor:pointer}
.insight-filters button[aria-pressed="true"]{background:var(--course-accent);border-color:var(--course-accent);color:#183e35}
.insight-filters button:focus-visible{outline:2px solid var(--course-link);outline-offset:3px}
.insight-filters button span{opacity:.8;font-variant-numeric:tabular-nums}
.insight-kind{font-size:10px;color:var(--course-muted)}
.insights-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
.insight-reveal{display:grid}
.insight-card{display:flex;flex-direction:column;min-width:0;height:100%;padding:28px;border:1px solid var(--course-line);border-radius:18px;background:var(--course-panel);color:var(--course-text);box-shadow:inset 0 1px 0 rgba(235,248,231,.035)}
.insight-card:hover{text-decoration:none;border-color:rgba(218,239,222,.4);background:var(--course-panel-strong)}
.insight-meta{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;color:var(--course-faint);font-size:11px}
.insight-meta>span{max-width:100%;color:var(--course-link);overflow-wrap:anywhere}
.insight-meta time{white-space:nowrap}
.insight-card h2{margin:23px 0 12px;color:var(--course-text);font-size:23px;line-height:1.6;letter-spacing:-.02em;overflow-wrap:anywhere}
.insight-card>p{flex:1;margin:0 0 26px;color:var(--course-copy);font-size:14px;line-height:1.95;overflow-wrap:anywhere}
.insight-card>.insight-series{flex:0;margin:0 0 16px;color:var(--course-link);font-size:11px;letter-spacing:.04em}
.read-link{display:flex;justify-content:space-between;align-items:center;gap:14px;padding-top:16px;border-top:1px solid var(--course-line);color:var(--course-link);font-size:12px}
.read-link>span{font-size:19px}
.empty-insights{padding:48px 30px 50px;border:1px solid var(--course-line);border-radius:20px;background:var(--course-panel);text-align:center;box-shadow:inset 0 1px 0 rgba(235,248,231,.035)}
.empty-mark{display:block;width:48px;height:56px;margin:0 auto 21px;color:var(--course-link)}
.empty-eyebrow{margin:0 0 10px;color:var(--course-faint);font-size:11px;letter-spacing:.06em}
.empty-insights h2{margin:0 0 16px;color:var(--course-text);font-size:27px;font-weight:600;line-height:1.5}
.empty-insights>p:not(.empty-eyebrow){margin:0;color:var(--course-copy);font-size:14px;line-height:1.95}
.empty-insights>a{display:inline-flex;align-items:center;gap:24px;margin-top:26px;padding:11px 18px;border:1px solid var(--course-line);border-radius:30px;background:var(--course-panel-strong);color:var(--course-link);font-size:13px}
.empty-insights>a:hover{color:var(--course-accent);border-color:rgba(218,239,222,.4);text-decoration:none}
@media(max-width:720px){.insights-page{padding:32px 22px 48px}.insights-intro{margin-bottom:28px}.insights-intro h1{font-size:32px}.intro-copy{font-size:14px}.intro-copy br{display:none}.insights-list{grid-template-columns:1fr;gap:16px}.insight-card{padding:24px 22px}.insight-card h2{font-size:22px}.empty-insights{padding:36px 22px 38px}.empty-insights h2{font-size:25px}.empty-insights>p:not(.empty-eyebrow){font-size:13px}}
</style>

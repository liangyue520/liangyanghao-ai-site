<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AdminNav from '../components/AdminNav.vue';
import { adminApi, errorMessage, timeLabel, type AnalyticsDimension, type AnalyticsRange, type AnalyticsRecentVisit, type AnalyticsSummary } from '../api';

const ranges: { key: AnalyticsRange; label: string; help: string }[] = [
  { key: '1d', label: '今日', help: '站主今天需要先看的访问变化' },
  { key: '7d', label: '7 天', help: '最近一周的访问趋势判断' },
  { key: '30d', label: '30 天', help: '近一个月内容表现参考' }
];
const selected = ref<AnalyticsRange>('7d');
const busy = ref(false);
const error = ref('');
const summaries = ref<Partial<Record<AnalyticsRange, AnalyticsSummary>>>({});
const current = computed(() => summaries.value[selected.value] ?? null);

function numberValue(...values: unknown[]): number {
  for (const value of values) if (typeof value === 'number' && Number.isFinite(value)) return value;
  return 0;
}
function metric(summary: AnalyticsSummary | null | undefined, name: 'views'|'visitors'|'visits') {
  const totals = summary?.totals;
  if (name === 'views') return numberValue(summary?.overview?.pageviews, summary?.pageViews, totals?.pageviews, totals?.views);
  if (name === 'visitors') return numberValue(summary?.overview?.visitors, summary?.visitors, totals?.visitors);
  return numberValue(summary?.overview?.visits, summary?.visits, totals?.visits, totals?.sessions);
}
function rows(summary: AnalyticsSummary | null, name: 'topPages'|'referrers'|'devices'|'browsers'): AnalyticsDimension[] {
  if (!summary) return [];
  if (name === 'topPages') return summary.topPages ?? summary.pages ?? [];
  if (name === 'referrers') return summary.referrers ?? summary.sources ?? [];
  return summary[name] ?? [];
}
function recent(summary: AnalyticsSummary | null): AnalyticsRecentVisit[] {
  return summary?.recent ?? summary?.recentVisits ?? [];
}
function label(row: AnalyticsDimension): string {
  return row.title || row.label || row.name || row.path || row.domain || row.source || row.device || row.browser || row.value || '未标明';
}
function rowViews(row: AnalyticsDimension | AnalyticsRecentVisit): number {
  return numberValue(row.pageviews, row.views, 'count' in row ? row.count : undefined);
}
function dateText(value?: string) {
  if (!value) return '时间未返回';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : timeLabel(value);
}
async function load() {
  busy.value = true;
  error.value = '';
  try {
    const result = await Promise.all(ranges.map(async item => [item.key, await adminApi.analyticsSummary(item.key)] as const));
    summaries.value = Object.fromEntries(result) as Record<AnalyticsRange, AnalyticsSummary>;
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}
onMounted(load);
</script>

<template>
  <AdminNav />
  <header>
    <span class="eyebrow">站主管理 · 访客统计</span>
    <h1>看清哪些页面正在被访问</h1>
    <p class="muted">这里只读取 03 提供的后台统计接口。后台页面本身不做采集，接口未接通时不会显示假数据。</p>
  </header>

  <section class="card status-card">
    <div>
      <h2>统计接口状态</h2>
      <p class="muted">已登录站主才能读取；如果登录过期，请重新登录后再打开本页。</p>
    </div>
    <button :disabled="busy" @click="load">{{ busy ? '正在读取…' : '刷新统计' }}</button>
  </section>

  <p v-if="busy" role="status">正在读取访客统计…</p>
  <div v-if="error" class="card" role="alert">
    <p class="error">{{ error }}</p>
    <p class="muted">未取得真实接口结果，因此本页不展示占位成功数据。</p>
    <RouterLink to="/admin/login">重新登录</RouterLink>
  </div>

  <template v-if="!error && Object.keys(summaries).length">
    <section class="summary-grid" aria-label="统计概览">
      <button v-for="item in ranges" :key="item.key" class="metric-card" :class="{ active: selected === item.key }" @click="selected = item.key">
        <span class="eyebrow">{{ item.label }}</span>
        <strong>{{ metric(summaries[item.key], 'views').toLocaleString() }}</strong>
        <small>浏览量 · {{ metric(summaries[item.key], 'visitors').toLocaleString() }} 位访客 · {{ metric(summaries[item.key], 'visits').toLocaleString() }} 次访问</small>
        <small class="muted">{{ item.help }}</small>
      </button>
    </section>

    <section class="card">
      <div class="toolbar">
        <div>
          <span class="eyebrow">当前查看</span>
          <h2>{{ ranges.find(item => item.key === selected)?.label }} 详情</h2>
          <p class="muted" v-if="current?.since || current?.from || current?.to">从 {{ current?.since || current?.from || '未返回开始时间' }} 起统计<span v-if="current?.to"> — {{ current.to }}</span></p>
        </div>
        <label>切换范围
          <select v-model="selected">
            <option v-for="item in ranges" :key="item.key" :value="item.key">{{ item.label }}</option>
          </select>
        </label>
      </div>
      <div class="totals">
        <span><small>浏览量</small><strong>{{ metric(current, 'views').toLocaleString() }}</strong></span>
        <span><small>访客数</small><strong>{{ metric(current, 'visitors').toLocaleString() }}</strong></span>
        <span><small>访问次数</small><strong>{{ metric(current, 'visits').toLocaleString() }}</strong></span>
      </div>
    </section>

    <div class="panel-grid">
      <section class="card">
        <h2>热门页面</h2>
        <p v-if="!rows(current, 'topPages').length" class="muted">暂无页面统计。</p>
        <ol v-else>
          <li v-for="row in rows(current, 'topPages')" :key="`${label(row)}-${rowViews(row)}`">
            <span>{{ label(row) }}</span><strong>{{ rowViews(row).toLocaleString() }}</strong>
          </li>
        </ol>
      </section>

      <section class="card">
        <h2>来源</h2>
        <p v-if="!rows(current, 'referrers').length" class="muted">暂无来源统计。</p>
        <ol v-else>
          <li v-for="row in rows(current, 'referrers')" :key="`${label(row)}-${rowViews(row)}`">
            <span>{{ label(row) }}</span><strong>{{ rowViews(row).toLocaleString() }}</strong>
          </li>
        </ol>
      </section>

      <section class="card">
        <h2>设备</h2>
        <p v-if="!rows(current, 'devices').length" class="muted">暂无设备统计。</p>
        <ol v-else>
          <li v-for="row in rows(current, 'devices')" :key="`${label(row)}-${rowViews(row)}`">
            <span>{{ label(row) }}</span><strong>{{ rowViews(row).toLocaleString() }}</strong>
          </li>
        </ol>
      </section>

      <section class="card">
        <h2>浏览器</h2>
        <p v-if="!rows(current, 'browsers').length" class="muted">暂无浏览器统计。</p>
        <ol v-else>
          <li v-for="row in rows(current, 'browsers')" :key="`${label(row)}-${rowViews(row)}`">
            <span>{{ label(row) }}</span><strong>{{ rowViews(row).toLocaleString() }}</strong>
          </li>
        </ol>
      </section>
    </div>

    <section class="card">
      <h2>最近访问</h2>
      <p v-if="!recent(current).length" class="muted">暂无最近访问记录。</p>
      <div v-else class="recent-list">
        <article v-for="item in recent(current)" :key="`${item.path}-${item.createdAt || item.occurredAt}`">
          <div>
            <strong>{{ item.title || item.path }}</strong>
            <p class="muted">{{ item.path }} · {{ item.source || item.referrerDomain || item.referrer || '直接访问/未返回来源' }}</p>
          </div>
          <small>{{ dateText(item.at || item.createdAt || item.occurredAt) }} · {{ item.device || '设备未返回' }} · {{ item.browser || '浏览器未返回' }}</small>
        </article>
      </div>
    </section>
  </template>
</template>

<style scoped>
header{margin-bottom:24px}.status-card,.toolbar{display:flex;justify-content:space-between;gap:20px;align-items:center}.summary-grid,.panel-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:20px 0}.panel-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.metric-card{display:flex;flex-direction:column;gap:8px;text-align:left;background:var(--paper);color:var(--ink);border:1px solid var(--line);border-radius:var(--radius);padding:22px}.metric-card.active{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}.metric-card strong{font-size:32px}.totals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.totals span{border:1px solid var(--line);border-radius:12px;padding:16px;background:white}.totals small{display:block;color:var(--muted)}.totals strong{font-size:24px}ol{list-style:none;padding:0;margin:0;display:grid;gap:10px}li{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid var(--line);padding-bottom:10px}.recent-list{display:grid;gap:14px}.recent-list article{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid var(--line);padding-bottom:14px}@media(max-width:760px){.status-card,.toolbar,.recent-list article{align-items:flex-start;flex-direction:column}.summary-grid,.panel-grid,.totals{grid-template-columns:1fr}}
</style>

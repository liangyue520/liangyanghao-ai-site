<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import LearningStage from '../components/LearningStage.vue';
import InsightInlineText from '../components/InsightInlineText.vue';
import { developmentInsights, findDevelopmentInsight } from '../insights/catalog';
import { useScrollReveal } from '../../../lib/useScrollReveal';

const route = useRoute();
const insight = computed(() => findDevelopmentInsight(String(route.params.slug || '')));
const articleIndex = computed(() => developmentInsights.findIndex(article => article.slug === insight.value?.slug));
const previousInsight = computed(() => articleIndex.value > 0 ? developmentInsights[articleIndex.value - 1] : undefined);
const nextInsight = computed(() => articleIndex.value >= 0 ? developmentInsights[articleIndex.value + 1] : undefined);
const page = ref<HTMLElement>();
useScrollReveal(page);
</script>

<template>
  <LearningStage>
    <div ref="page" class="insight-detail-page">
      <nav class="insight-breadcrumb" aria-label="当前位置"><RouterLink to="/insights">AI 开发经验分享</RouterLink><span aria-hidden="true">/</span><span>{{ insight ? '正文' : '尚未发布' }}</span></nav>

      <article v-if="insight" :key="insight.slug" class="insight-article">
        <div class="reveal-anchor" data-reveal>
          <header class="article-header" data-reveal-content>
            <div class="article-meta"><span v-if="insight.series">{{ insight.series.name }} · {{ String(insight.series.order).padStart(2, '0') }}</span><span>{{ insight.category }}</span><time :datetime="insight.publishedAt">{{ insight.publishedAt }}</time></div>
            <h1>{{ insight.title }}</h1>
            <p v-if="!insight.introduction?.length" class="article-summary">{{ insight.summary }}</p>
          </header>
        </div>
        <div v-if="insight.introduction?.length" class="article-introduction"><p v-for="(paragraph, index) in insight.introduction" :key="index"><InsightInlineText :text="paragraph" /></p></div>
        <section v-for="(section, index) in insight.sections" :key="index + '-' + section.heading" class="article-section">
          <h2>{{ section.heading }}</h2>
          <p v-for="(paragraph, paragraphIndex) in section.paragraphs" :key="paragraphIndex"><InsightInlineText :text="paragraph" /></p>
          <ul v-if="section.items?.length" class="article-points"><li v-for="item in section.items" :key="item.title"><strong>{{ item.title }}</strong> {{ item.text }}</li></ul>
          <p v-for="(paragraph, paragraphIndex) in section.closingParagraphs" :key="'closing-' + paragraphIndex"><InsightInlineText :text="paragraph" /></p>
        </section>
        <footer class="article-footer">
          <RouterLink to="/insights">← 返回分享列表</RouterLink>
          <nav v-if="previousInsight || nextInsight" class="article-pagination" aria-label="继续阅读经验分享">
            <RouterLink v-if="previousInsight" :to="'/insights/' + previousInsight.slug"><span>上一篇</span><strong>{{ previousInsight.title }}</strong></RouterLink>
            <RouterLink v-if="nextInsight" :to="'/insights/' + nextInsight.slug" class="next-insight"><span>下一篇</span><strong>{{ nextInsight.title }}</strong></RouterLink>
          </nav>
        </footer>
      </article>

      <div v-else class="reveal-anchor missing-reveal" data-reveal>
        <section class="missing-insight" aria-labelledby="missing-insight-title" data-reveal-content>
          <p class="eyebrow">暂时还没有内容</p>
          <h1 id="missing-insight-title">这篇分享还没有发布</h1>
          <p>这个地址暂时没有可阅读的内容。<br>你可以返回分享列表，查看已经发布的文章。</p>
          <RouterLink to="/insights">← 返回分享列表</RouterLink>
        </section>
      </div>
    </div>
  </LearningStage>
</template>

<style scoped>
.insight-detail-page{max-width:1180px;margin:0 auto;padding:48px 32px 80px;color:var(--course-text)}
.reveal-anchor{display:flow-root;min-width:0}
.insight-breadcrumb{display:flex;flex-wrap:wrap;gap:10px;max-width:760px;margin:0 auto 34px;color:var(--course-faint);font-size:11px}
.insight-breadcrumb>a{color:var(--course-link)}
.insight-article{max-width:760px;margin:0 auto;min-width:0}
.article-header{margin-bottom:36px;padding-bottom:30px;border-bottom:1px solid var(--course-line)}
.article-meta{display:flex;flex-wrap:wrap;gap:18px;color:var(--course-faint);font-size:12px}
.article-meta>span{color:var(--course-link);overflow-wrap:anywhere}
.article-meta time{white-space:nowrap}
.article-header h1{margin:17px 0 18px;font-size:clamp(31px,4vw,43px);line-height:1.5;letter-spacing:-.035em;overflow-wrap:anywhere;color:var(--course-text)}
.article-summary{margin:0;color:var(--course-copy);font-size:17px;line-height:1.95;overflow-wrap:anywhere}
.article-section{margin:34px 0;scroll-margin-top:32px}
.article-section h2{margin:0 0 18px;color:var(--course-text);font-size:24px;line-height:1.7;font-weight:600;overflow-wrap:anywhere}
.article-section p,.article-introduction p{margin:15px 0;color:var(--course-copy);font-size:16px;line-height:2.15;overflow-wrap:anywhere;white-space:pre-line}
.article-points{margin:22px 0;padding-left:24px;color:var(--course-copy);font-size:16px;line-height:2}
.article-points li{padding-left:5px;margin:15px 0;overflow-wrap:anywhere}
.article-points li::marker{color:var(--course-link)}
.article-points strong{color:var(--course-text);font-weight:650}
.article-footer{max-width:none;margin:42px 0 0;padding:25px 0 0;border-top:1px solid var(--course-line);color:var(--course-link);font-size:13px}
.article-footer>a:hover,.insight-breadcrumb>a:hover{color:var(--course-accent)}
.article-pagination{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:24px;align-items:stretch}
.article-pagination>a{min-width:0;display:flex;flex-direction:column;gap:10px;padding:20px;border:1px solid var(--course-line);border-radius:16px;background:var(--course-panel);text-decoration:none}
.article-pagination>a:hover{background:var(--course-panel-strong);border-color:var(--course-link)}
.article-pagination span{font-size:11px;color:var(--course-muted)}
.article-pagination strong{font-size:14px;font-weight:500;line-height:1.8;color:var(--course-copy);overflow-wrap:anywhere}
.article-pagination .next-insight{grid-column:2;text-align:right}
@media(max-width:720px){.article-pagination{grid-template-columns:1fr;gap:12px}.article-pagination .next-insight{grid-column:auto;text-align:left}}
.missing-reveal{max-width:760px;margin:0 auto}
.missing-insight{padding:42px 34px;border:1px solid var(--course-line);border-radius:20px;background:var(--course-panel);box-shadow:inset 0 1px 0 rgba(235,248,231,.035)}
.eyebrow{margin:0 0 14px;color:var(--course-accent);font-size:12px;letter-spacing:.06em}
.missing-insight h1{margin:0 0 18px;color:var(--course-text);font-size:clamp(27px,4vw,35px);line-height:1.6;overflow-wrap:anywhere}
.missing-insight>p:not(.eyebrow){margin:0;color:var(--course-copy);font-size:14px;line-height:1.95}
.missing-insight>a{display:inline-flex;margin-top:26px;padding:10px 17px;border:1px solid var(--course-line);border-radius:30px;background:var(--course-panel-strong);color:var(--course-link);font-size:13px}
.missing-insight>a:hover{color:var(--course-accent);border-color:rgba(218,239,222,.4);text-decoration:none}
@media(max-width:720px){.insight-detail-page{padding:32px 22px 48px}.insight-breadcrumb{margin-bottom:27px;font-size:10px}.article-header{margin-bottom:28px;padding-bottom:26px}.article-header h1{font-size:32px}.article-summary{font-size:16px}.article-section{margin:28px 0}.article-section h2{font-size:22px}.article-section p{line-height:2.1}.missing-insight{padding:30px 22px}.missing-insight>p:not(.eyebrow){font-size:13px}}
</style>

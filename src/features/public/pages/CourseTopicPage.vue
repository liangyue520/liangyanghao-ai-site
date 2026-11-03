<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { courses, findCourse, courseHref, displayTitle } from '../courses/catalog';
const route = useRoute();
const course = computed(() => findCourse(String(route.params.slug || '')));
const previous = computed(() => course.value ? courses[course.value.number-2] : undefined);
const next = computed(() => course.value ? courses[course.value.number] : undefined);
const related = computed(() => course.value?.related.map(findCourse).filter((c): c is NonNullable<typeof c> => Boolean(c && c.slug!==course.value?.slug)).slice(0,3) || []);
const progress = ref(0);
const article = ref<HTMLElement>();
function updateProgress() {
  if (!article.value) return;
  const rect = article.value.getBoundingClientRect();
  const range = rect.height - window.innerHeight;
  progress.value = range <= 0 ? 100 : Math.round(Math.max(0, Math.min(1, -rect.top / range)) * 100);
}
watch(() => route.fullPath, () => { progress.value = 0; });
onMounted(() => { window.addEventListener('scroll', updateProgress, {passive:true}); window.addEventListener('resize', updateProgress); updateProgress(); });
onBeforeUnmount(() => { window.removeEventListener('scroll',updateProgress); window.removeEventListener('resize',updateProgress); });
</script>
<template>
<div v-if="course" :key="course.slug" class="lesson-layout">
  <div class="reading-progress" role="progressbar" aria-label="阅读位置" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100"><span :style="{width:progress+'%'}" /></div>
  <article ref="article" class="course-article">
    <nav class="breadcrumb" aria-label="当前位置"><RouterLink to="/learning">课程目录</RouterLink><span aria-hidden="true">/</span><RouterLink :to="{path:'/learning',query:{group:course.groupId}}">{{ course.group }}</RouterLink></nav>
    <header class="article-header"><p class="lesson-kicker">第 {{ course.number }} 课 <span>·</span> 约 {{ course.minutes }} 分钟</p><h1>{{ displayTitle(course) }}</h1><p class="article-deck">{{ course.summary }}</p></header>
    <aside class="learning-goal"><span aria-hidden="true">✳</span><div><strong>读完这一课，你会知道</strong><p>{{ course.goal }}</p></div></aside>
    <div class="story"><p v-for="paragraph in course.story" :key="paragraph">{{ paragraph }}</p></div>
    <figure v-if="course.number===1" class="reminder-sketch" aria-label="手机助手把一句提醒指令转为文字、时间和任务的示意图"><div class="speech-line"><span class="person-sketch" aria-hidden="true">☺</span><p>“提醒我明天上午九点开会。”</p><span class="phone-sketch" aria-hidden="true">▯</span></div><p class="assistant-reply">手机助手：“好的，已为你设置明天上午九点的提醒。”</p><div class="sketch-steps"><div><b>01</b><strong>先听清说了什么</strong><span>把声音转成文字</span></div><span class="sketch-arrow" aria-hidden="true">→</span><div><b>02</b><strong>找出重要信息</strong><span>明天九点 · 开会</span></div><span class="sketch-arrow" aria-hidden="true">→</span><div><b>03</b><strong>知道你想做什么</strong><span>创建一条提醒</span></div></div><figcaption>把过程拆开看，只是为了方便理解。实际系统可以合并完成其中一些步骤。</figcaption></figure>
    <section v-for="(section,index) in course.sections" :id="'part-'+(index+1)" :key="section.heading" class="article-section"><h2><span class="section-ordinal">{{ String(index+1).padStart(2,'0') }}</span>{{ section.heading }}</h2><p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p></section>
    <section id="example" class="example-note"><p class="note-label">放进一个具体例子</p><h2>{{ course.example.title }}</h2><p>{{ course.example.text }}</p></section>
    <section id="pitfalls" class="article-section"><h2>别被这些地方绊住</h2><ul><li v-for="pitfall in course.pitfalls" :key="pitfall">{{ pitfall }}</li></ul></section>
    <section id="question" class="thinking-question"><span class="note-label">停一下，想一想</span><h2>{{ course.question.prompt }}</h2><details><summary>展开参考答案</summary><p>{{ course.question.answer }}</p></details></section>
    <section id="glossary" class="glossary"><h2>术语小抄</h2><p class="glossary-note">先看懂意思，不用急着背英文。</p><dl><template v-for="term in course.glossary" :key="term.term"><dt>{{ term.term }}</dt><dd>{{ term.meaning }}</dd></template></dl></section>
    <aside class="takeaway"><strong>带走一句话</strong><p>{{ course.takeaway }}</p></aside>
    <section class="source-notes"><h2>资料从哪里来</h2><p>本文用生活场景重新讲解，以下原始资料可供继续查阅。</p><ol><li v-for="source in course.sources" :key="source.url"><a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }} <span aria-hidden="true">↗</span></a></li></ol></section>
    <section v-if="related.length" class="related-lessons"><h2>沿着这个问题，再看看</h2><RouterLink v-for="c in related" :key="c.slug" :to="courseHref(c)">{{ displayTitle(c) }} <span aria-hidden="true">↗</span></RouterLink></section>
    <nav class="lesson-pagination" aria-label="课程翻页"><RouterLink v-if="previous" :to="courseHref(previous)"><small>← 上一课 · 第 {{ previous.number }} 课</small><strong>{{ displayTitle(previous) }}</strong></RouterLink><RouterLink v-else to="/learning"><small>返回学习地图</small><strong>查看全部课程</strong></RouterLink><RouterLink v-if="next" class="next-lesson" :to="courseHref(next)"><small>下一课 · 第 {{ next.number }} 课 →</small><strong>{{ displayTitle(next) }}</strong></RouterLink><RouterLink v-else class="next-lesson" to="/learning"><small>你走完了这条路线</small><strong>再挑一个感兴趣的问题 ↗</strong></RouterLink></nav>
  </article>
  <aside class="lesson-sidebar"><div><p>这一课里</p><a v-for="(section,index) in course.sections" :key="section.heading" :href="'#part-'+(index+1)">{{ section.heading }}</a><a href="#example">一个具体例子</a><a href="#question">想一想</a><a href="#glossary">术语小抄</a><RouterLink class="sidebar-back" to="/learning">← 课程目录</RouterLink><span class="sidebar-count">{{ course.number }} / {{ courses.length }} 课</span></div></aside>
</div>
<div v-else class="course-not-found"><p class="lesson-kicker">还没找到这节课</p><h1>换个入口，继续学习。</h1><p>这条链接可能已经更新，课程目录里可以按标题搜索。</p><RouterLink to="/learning">前往课程目录 →</RouterLink></div>
</template>
<style scoped>
.lesson-layout{display:grid;grid-template-columns:minmax(0,720px) 210px;gap:66px;justify-content:center;padding:34px 0 10px;color:var(--course-text)}
.course-article{min-width:0}
.reading-progress{position:fixed;top:0;left:0;right:0;height:3px;z-index:20;background:var(--course-bg-deep)}
.reading-progress>span{display:block;height:100%;background:var(--course-accent)}
.breadcrumb{font-size:11px;display:flex;gap:10px;color:var(--course-faint);margin-bottom:34px}
.breadcrumb a{color:var(--course-muted)}
.breadcrumb a:hover{color:var(--course-link)}
.article-header h1{font-family:'Songti SC','Noto Serif SC',Georgia,serif;font-size:clamp(31px,4vw,46px);line-height:1.45;margin:14px 0 16px;letter-spacing:-.03em;overflow-wrap:anywhere;color:var(--course-text)}
.lesson-kicker{font-size:12px;color:var(--course-accent)}
.lesson-kicker>span{margin:0 9px;color:var(--course-faint)}
.article-deck{font-size:17px;line-height:1.9;color:var(--course-muted);margin:0 0 28px}
.learning-goal{display:flex;gap:15px;padding:20px 22px;background:var(--course-panel-strong);border:1px solid var(--course-line);border-radius:14px;margin-bottom:30px;box-shadow:inset 0 1px 0 rgba(235,248,231,.035)}
.learning-goal>span{font-size:28px;color:var(--course-accent)}
.learning-goal strong{font-size:12px;font-weight:500;color:var(--course-accent)}
.learning-goal p{font-size:14px;line-height:1.9;margin:6px 0 0;color:var(--course-copy)}
.story p,.article-section p,.example-note>p:not(.note-label),.thinking-question p,.takeaway p{font-size:16px;line-height:2.15;color:var(--course-copy);margin:15px 0;text-align:justify}
.story{margin-bottom:28px}
.article-section{scroll-margin-top:28px;margin:38px 0}
.article-section h2{font-size:23px;line-height:1.7;font-weight:600;margin:0 0 18px;color:var(--course-text)}
.section-ordinal{font:italic 19px Georgia,serif;color:var(--course-accent);margin-right:12px}
.article-section ul{padding:0 0 0 19px}
.article-section li{padding-left:5px;margin:12px 0;font-size:15px;line-height:2;color:var(--course-copy)}
.article-section li::marker{color:var(--course-accent)}
.example-note{padding:23px 27px;background:var(--course-panel);border:1px solid var(--course-line);border-left:3px solid var(--course-accent);border-radius:0 14px 14px 0;margin:34px 0;scroll-margin-top:24px}
.note-label{font-size:11px!important;color:var(--course-accent);letter-spacing:.07em;margin:0 0 9px!important}
.example-note h2{font-size:19px;margin:0;color:var(--course-text)}
.example-note>p:last-child{font-size:15px;margin-bottom:0}
.thinking-question{padding:25px;background:var(--course-panel);border:1px dashed var(--course-line);border-radius:14px;margin:34px 0;scroll-margin-top:24px}
.thinking-question h2{font-size:18px;line-height:1.9;margin:12px 0 18px;color:var(--course-text)}
.thinking-question summary{color:var(--course-link);cursor:pointer;font-size:13px;text-underline-offset:5px}
.thinking-question summary:hover{color:var(--course-accent)}
.thinking-question summary:focus-visible{outline:2px solid var(--course-accent);outline-offset:6px;border-radius:2px}
.thinking-question details[open] summary{margin-bottom:14px}
.thinking-question p{font-size:15px;margin-bottom:0}
.glossary{scroll-margin-top:24px;margin:38px 0}
.glossary h2{font-size:22px;margin:0;color:var(--course-text)}
.glossary-note{font-size:12px;color:var(--course-muted);margin:6px 0 20px}
.glossary dl{display:grid;grid-template-columns:minmax(90px,140px) 1fr;gap:0;margin:0;border-top:1px solid var(--course-line)}
.glossary dt,.glossary dd{padding:14px 8px;border-bottom:1px solid var(--course-line);margin:0;font-size:13px;line-height:1.9}
.glossary dt{font-weight:600;color:var(--course-link);overflow-wrap:anywhere}
.glossary dd{color:var(--course-copy)}
.takeaway{padding:24px 26px;background:var(--course-panel-strong);border-radius:14px;border:1px solid var(--course-line);box-shadow:inset 0 1px 0 rgba(235,248,231,.035)}
.takeaway strong{font-size:12px;color:var(--course-accent)}
.takeaway p{font-size:16px;margin-bottom:0}
.source-notes{margin:32px 0;padding-top:24px;border-top:1px solid var(--course-line)}
.source-notes h2{font-size:14px;font-weight:600;margin:0;color:var(--course-text)}
.source-notes p{font-size:11px;color:var(--course-muted)}
.source-notes ol{padding-left:18px}
.source-notes li{font-size:12px;color:var(--course-faint);margin:8px 0;line-height:1.8;overflow-wrap:anywhere}
.source-notes a{color:var(--course-link)}
.related-lessons{margin:30px 0}
.related-lessons h2{font-size:13px;color:var(--course-muted);font-weight:400}
.related-lessons a{display:inline-flex;gap:14px;margin:5px 15px 5px 0;color:var(--course-link);font-size:13px;border-bottom:1px solid var(--course-line);padding:6px 0}
.related-lessons a:hover{border-color:var(--course-accent)}
.lesson-pagination{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:40px 0 0}
.lesson-pagination>a{padding:20px;background:var(--course-panel);border:1px solid var(--course-line);border-radius:14px;display:flex;flex-direction:column;gap:8px;align-items:flex-start;min-width:0;color:var(--course-text);transition:background .2s ease,border-color .2s ease}
.lesson-pagination>a:hover{text-decoration:none;border-color:var(--course-accent);background:var(--course-panel-strong)}
.lesson-pagination small{font-size:11px;color:var(--course-muted)}
.lesson-pagination strong{font-size:14px;font-weight:500;line-height:1.8}
.lesson-pagination .next-lesson{background:var(--course-panel-strong);align-items:flex-end;text-align:right}
.lesson-sidebar{padding-top:53px}
.lesson-sidebar>div{position:sticky;top:35px;border-left:1px solid var(--course-line);padding-left:23px}
.lesson-sidebar p{font-size:11px;color:var(--course-faint);margin:0 0 15px}
.lesson-sidebar a{display:block;font-size:12px;color:var(--course-muted);line-height:1.8;margin:12px 0}
.lesson-sidebar a:hover{color:var(--course-accent)}
.lesson-sidebar .sidebar-back{padding-top:20px;color:var(--course-link)}
.sidebar-count{display:block;font:italic 14px Georgia,serif;color:var(--course-faint);margin-top:22px}
.course-not-found{padding:100px 0;max-width:700px;margin:auto;color:var(--course-text)}
.course-not-found p{color:var(--course-muted)}
.course-not-found a{color:var(--course-link)}
.reminder-sketch{margin:30px 0;padding:22px;background:var(--course-panel);border:1px solid var(--course-line);border-radius:14px;transform:rotate(-.4deg);color:var(--course-text)}
.speech-line{display:flex;align-items:center;gap:12px}
.speech-line p{font-size:14px;margin:0;padding:12px 17px;border:1px solid var(--course-line);border-radius:15px 15px 15px 0;background:var(--course-panel-strong);color:var(--course-text)}
.person-sketch{font-size:42px;color:var(--course-accent)}
.phone-sketch{font:64px/1 Georgia,serif;color:var(--course-link);margin-left:auto}
.assistant-reply{margin:12px 0 0 auto;padding:11px 14px;background:var(--course-panel-strong);border:1px solid var(--course-line);border-radius:12px 0 12px 12px;max-width:88%;font-size:12px;line-height:1.8;color:var(--course-copy)}
.sketch-steps{display:flex;align-items:center;justify-content:space-between;gap:7px;padding-top:16px}
.sketch-steps>div{flex:1;display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center}
.sketch-steps b{font:italic 18px Georgia,serif;color:var(--course-accent)}
.sketch-steps strong{font-size:12px;font-weight:500;color:var(--course-text)}
.sketch-steps div>span{font-size:10px;color:var(--course-muted)}
.sketch-arrow{color:var(--course-accent)}
.reminder-sketch figcaption{font-size:10px;line-height:1.9;color:var(--course-muted);margin-top:20px;border-top:1px dashed var(--course-line);padding-top:12px}
@media(max-width:1000px){.lesson-layout{grid-template-columns:minmax(0,720px)}.lesson-sidebar{display:none}}
@media(max-width:720px){.lesson-layout{padding-top:24px}.breadcrumb{margin-bottom:27px;font-size:10px}.article-header h1{font-size:33px}.article-deck{font-size:16px}.story p,.article-section p{font-size:16px;line-height:2.1;text-align:start}.article-section h2{font-size:21px}.learning-goal{padding:18px 16px;gap:11px}.example-note,.thinking-question{padding:20px}.glossary dl{grid-template-columns:105px 1fr}.lesson-pagination{gap:10px}.lesson-pagination>a{padding:16px 12px}.lesson-pagination strong{font-size:13px}.reminder-sketch{padding:18px 13px}.speech-line{gap:6px}.speech-line p{font-size:12px;padding:10px}.person-sketch{font-size:30px}.phone-sketch{font-size:45px}.sketch-steps strong{font-size:11px}.sketch-steps div>span{font-size:9px}.sketch-arrow{font-size:12px}}
@media(prefers-reduced-motion:reduce){.lesson-pagination>a{transition:none}}
</style>

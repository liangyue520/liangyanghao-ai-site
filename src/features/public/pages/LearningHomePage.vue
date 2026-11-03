<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { courseGroups, courses, courseHref, displayTitle, searchCourses } from '../courses/catalog';
import LearningStage from '../components/LearningStage.vue';
const route = useRoute();
const router = useRouter();
const query = ref(String(route.query.q || ''));
const groupId = ref(String(route.query.group || 'all'));
const results = computed(() => searchCourses(query.value, groupId.value));
const shownGroups = computed(() => courseGroups.map(g => ({ ...g, lessons: results.value.filter(c => c.groupId === g.id) })).filter(g => g.lessons.length));
watch(() => [route.query.q, route.query.group], () => { query.value = String(route.query.q || ''); groupId.value = String(route.query.group || 'all'); });
function updateUrl() {
  void router.replace({ path: '/learning', query: { ...(query.value.trim() ? {q:query.value.trim()}:{}), ...(groupId.value !== 'all' ? {group:groupId.value}:{}) } });
}
function selectGroup(id: string) { groupId.value = id; updateUrl(); }
function clearSearch() { query.value = ''; groupId.value = 'all'; updateUrl(); }
</script>
<template><LearningStage><div class="learning-page"><header class="directory-intro"><p class="margin-note">一张可以慢慢走的学习地图</p><h1>今天，你想弄懂什么？</h1><p>从手机助手开始，沿着技术发展的脉络认识 AI。<br>共 {{ courses.length }} 课，可以从头读，也可以跳到你感兴趣的问题。</p><RouterLink class="directory-start" to="/learning/ai-is-not-mysterious">零基础？从第一课开始 →</RouterLink></header>
  <div class="directory-controls"><form class="search-form" role="search" @submit.prevent="updateUrl"><label for="course-search">搜索课程</label><div class="search-input-wrap"><span aria-hidden="true">⌕</span><input id="course-search" v-model="query" name="q" type="search" placeholder="试试：NLP、Transformer、Agent…" @change="updateUrl"><button type="submit">查找</button></div></form><div class="group-filters" role="group" aria-label="按学习阶段筛选"><button :aria-pressed="groupId==='all'" @click="selectGroup('all')">全部课程</button><button v-for="g in courseGroups" :key="g.id" :aria-pressed="groupId===g.id" @click="selectGroup(g.id)">{{ g.name }}</button></div></div>
  <p class="result-count" aria-live="polite">{{ query.trim() ? `“${query.trim()}”的相关课程` : '当前课程' }} · {{ results.length }} 课 <button v-if="query || groupId!=='all'" class="clear-search" @click="clearSearch">清除筛选</button></p>
  <section v-for="g in shownGroups" :id="g.id" :key="g.id" class="course-group"><div class="group-heading"><span>{{ String(courseGroups.findIndex(i=>i.id===g.id)+1).padStart(2,'0') }}</span><div><h2>{{ g.name }}</h2><p>{{ g.note }}</p></div><small>{{ g.lessons.length }} 课</small></div><div class="lesson-list"><RouterLink v-for="c in g.lessons" :key="c.slug" :to="courseHref(c)" class="lesson-row"><span class="lesson-number">{{ String(c.number).padStart(2,'0') }}</span><div><h3>{{ displayTitle(c) }}</h3><p>{{ c.summary }}</p></div><span class="lesson-time">约 {{ c.minutes }} 分钟 <span aria-hidden="true">↗</span></span></RouterLink></div></section>
  <div v-if="!results.length" class="empty-search"><h2>暂时没有找到这个关键词</h2><p>换一个词试试，比如“语言模型”“提示词”或“AI”。</p><button @click="clearSearch">查看全部课程</button></div>
</div></LearningStage></template>
<style scoped>
.learning-page{padding:55px 32px 20px;max-width:1040px;margin:auto;color:var(--course-text);color-scheme:dark}
.margin-note{font-size:12px;letter-spacing:.06em;color:var(--course-accent);margin:0 0 16px}
.directory-intro{padding-bottom:32px}
.directory-intro h1{font:700 clamp(32px,4vw,48px)/1.5 system-ui,'PingFang SC','Microsoft YaHei',sans-serif;letter-spacing:-.035em;margin:0 0 12px;color:var(--course-text)}
.directory-intro>p:not(.margin-note){color:var(--course-copy);line-height:1.95;font-size:15px}
.directory-start{color:var(--course-link);font-size:14px;border-bottom:1px solid rgba(192,228,197,.55);padding-bottom:5px;display:inline-block;margin-top:10px}
.directory-start:hover{color:var(--course-accent)}
.directory-controls{border-top:1px solid var(--course-line);padding:27px 0 16px}
.search-form label{display:block;font-size:12px;color:var(--course-muted);margin-bottom:10px}
.search-input-wrap{display:flex;align-items:center;gap:12px;background:var(--course-panel);border:1px solid var(--course-line);border-radius:12px;max-width:620px;padding:5px 6px 5px 16px;box-shadow:inset 0 1px 0 rgba(236,250,236,.035)}
.search-input-wrap:focus-within{border-color:rgba(192,228,197,.6);background:var(--course-panel-strong)}
.search-input-wrap>span{font-size:25px;color:var(--course-link);line-height:1}
.search-input-wrap input{border:0;background:transparent;color:var(--course-text);caret-color:var(--course-accent);flex:1;min-width:0;padding:9px 0;font-size:14px}
.search-input-wrap input::placeholder{color:var(--course-faint);opacity:1}
.search-input-wrap button{padding:10px 20px;background:var(--course-accent);color:var(--course-bg-deep);border:1px solid transparent;border-radius:8px;font-size:12px;font-weight:600;white-space:nowrap;transition:background .2s}
.search-input-wrap button:hover{background:var(--course-link)}
.group-filters{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}
.group-filters button{padding:8px 12px;font-size:12px;border:1px solid var(--course-line);background:transparent;color:var(--course-muted);border-radius:7px;transition:background .2s,border-color .2s,color .2s}
.group-filters button:hover{background:var(--course-panel-strong);border-color:rgba(192,228,197,.4);color:var(--course-text)}
.group-filters button[aria-pressed=true]{background:var(--course-accent);border-color:var(--course-accent);color:var(--course-bg-deep)}
.result-count{font-size:12px;color:var(--course-muted);display:flex;align-items:center;gap:16px}
.clear-search{background:transparent;color:var(--course-link);font-size:12px;padding:4px 0;text-decoration:underline;text-underline-offset:4px}
.clear-search:hover{color:var(--course-accent)}
.course-group{margin-top:38px}
.group-heading{display:flex;align-items:center;gap:16px;padding-bottom:17px;border-bottom:1px solid var(--course-line)}
.group-heading>span{font:italic 30px Georgia,serif;color:var(--course-accent)}
.group-heading h2{font-size:21px;margin:0 0 2px;font-weight:600;color:var(--course-text)}
.group-heading p{font-size:12px;color:var(--course-muted);margin:0}
.group-heading>small{margin-left:auto;color:var(--course-faint);font-size:12px;white-space:nowrap}
.lesson-list{display:grid;grid-template-columns:1fr 1fr;column-gap:34px}
.lesson-row{display:flex;gap:14px;padding:22px 2px;border-bottom:1px solid var(--course-line);align-items:start;min-width:0;transition:background .2s}
.lesson-row:hover{text-decoration:none;background:var(--course-panel)}
.lesson-number{font:18px Georgia,serif;color:var(--course-faint);padding-top:2px}
.lesson-row>div{flex:1;min-width:0}
.lesson-row h3{margin:0 0 7px;font-size:16px;font-weight:600;overflow-wrap:anywhere;color:var(--course-text)}
.lesson-row:hover h3{color:var(--course-accent)}
.lesson-row p{margin:0;color:var(--course-copy);font-size:12px;line-height:1.8}
.lesson-time{color:var(--course-faint);white-space:nowrap;font-size:10px;margin-top:5px}
.lesson-time>span{display:block;text-align:right;margin-top:18px;color:var(--course-link);font-size:16px}
.empty-search{text-align:center;padding:60px 10px}
.empty-search h2{font-size:22px;color:var(--course-text)}
.empty-search p{color:var(--course-copy);font-size:14px}
.empty-search button{font-size:13px;background:var(--course-accent);color:var(--course-bg-deep)}
.empty-search button:hover{background:var(--course-link)}
@media(max-width:720px){.learning-page{padding:32px 22px 20px}.lesson-list{grid-template-columns:1fr}.directory-intro h1{font-size:32px}.group-filters{gap:7px}.group-filters button{font-size:11px;padding:7px 9px}.group-heading{gap:13px}.group-heading h2{font-size:19px}.lesson-row{padding:20px 0}.search-input-wrap input{font-size:13px}.search-input-wrap button{padding:9px 14px}}
@media(prefers-reduced-motion:reduce){.search-input-wrap button,.group-filters button,.lesson-row{transition:none}}
</style>

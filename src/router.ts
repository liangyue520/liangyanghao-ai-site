import { nextTick } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { findCourse, courseHref, displayTitle } from './features/public/courses/catalog';
import { loadSession } from './lib/session';
import { findDevelopmentInsight } from './features/public/insights/catalog';
export const router = createRouter({
 history: createWebHistory(),
 scrollBehavior(to, _from, saved) { if (saved) return saved; if (to.hash) return { el:to.hash, top:24 }; return {top:0}; },
 routes: [
  { path:'/', component:()=>import('./features/public/pages/HomePage.vue') },
  { path:'/learning', component:()=>import('./features/public/pages/LearningHomePage.vue') },
  { path:'/about', component:()=>import('./features/public/pages/StoryPage.vue') },
  { path:'/insights', component:()=>import('./features/public/pages/InsightsPage.vue') },
  { path:'/insights/:slug', component:()=>import('./features/public/pages/InsightDetailPage.vue') },
  { path:'/story', redirect:'/about' },
  { path:'/resume', redirect:'/about' },
  { path:'/learning/topic', redirect: to => { const c=findCourse(String(to.query.title||'')); return c ? {path:courseHref(c),query:{},hash:to.hash} : {path:'/learning',query:{q:String(to.query.title||'')}}; } },
  { path:'/learning/:slug', component:()=>import('./features/public/pages/CourseTopicPage.vue') },
  // Keep the personal introduction accessible while other legacy sections remain hidden.
  { path:'/:section(story|resume|diary|novel|videos|toolbox|resources|games)/:rest(.*)*', redirect:'/learning' },
  { path:'/admin/login', component:()=>import('./features/admin/pages/LoginPage.vue') },
  { path:'/admin/contents', component:()=>import('./features/admin/pages/ContentListPage.vue') },
  { path:'/admin/contents/new', component:()=>import('./features/admin/pages/ContentEditorPage.vue') },
  { path:'/admin/contents/:id/edit', component:()=>import('./features/admin/pages/ContentEditorPage.vue') },
  { path:'/admin/contents/:id/preview', component:()=>import('./features/admin/pages/ContentPreviewPage.vue') },
  { path:'/admin/analytics', component:()=>import('./features/admin/pages/AnalyticsPage.vue') },
  { path:'/admin/exports', component:()=>import('./features/admin/pages/ExportPage.vue') },
  { path:'/:pathMatch(.*)*', component:()=>import('./features/public/pages/CourseTopicPage.vue') }
 ]
});
router.beforeEach(async to => { if (to.path.startsWith('/admin') && to.path!=='/admin/login') { const s=await loadSession(); if(!s)return '/admin/login'; } });
router.afterEach((to, from) => {
 const course=to.path.startsWith('/learning/') ? findCourse(String(to.params.slug||'')) : undefined;
 const insight=to.path.startsWith('/insights/') ? findDevelopmentInsight(String(to.params.slug||'')) : undefined;
 const sectionTitle = to.path==='/learning' ? '课程目录｜' : to.path==='/about' ? '关于我｜' : to.path.startsWith('/insights') ? 'AI 开发经验分享｜' : '';
 document.title = insight ? `${insight.title}｜AI 开发经验分享｜梁养浩的 AI 入门课` : course ? `第${course.number}课 · ${displayTitle(course)}｜梁养浩的 AI 入门课` : `${sectionTitle}梁养浩的 AI 入门课`;
 if (to.path !== from.path) void nextTick(() => document.getElementById('main-content')?.focus({preventScroll:true}));
});

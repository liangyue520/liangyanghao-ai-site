<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AiProductBackdrop from '../features/public/components/AiProductBackdrop.vue';
import SiteFooter from '../features/public/components/SiteFooter.vue';
import ReadingControls from '../features/public/components/ReadingControls.vue';
import FallingLeaves from '../features/public/components/FallingLeaves.vue';
const route = useRoute();
const inLesson = computed(() => route.path.startsWith('/learning/'));
const isHome = computed(() => route.path === '/');
const isDirectory = computed(() => route.path === '/learning');
const isAbout = computed(() => route.path === '/about');
const inInsights = computed(() => route.path === '/insights' || route.path.startsWith('/insights/'));
const hasStage = computed(() => isHome.value || isDirectory.value || isAbout.value || inInsights.value);
const isPublic = computed(() => !route.path.startsWith('/admin'));
</script>
<template>
  <div class="layout-shell" :class="{ 'public-course-shell': isPublic, 'homepage-shell': isHome }">
  <AiProductBackdrop v-if="isPublic && !hasStage" />
  <FallingLeaves v-if="isPublic" />
  <a class="skip-link" href="#main-content">跳到正文</a>
  <header class="site-header course-header" :class="{ 'glass-header': isHome, 'directory-header': hasStage && !isHome }">
    <RouterLink class="brand" to="/" aria-label="梁养浩的 AI 入门课首页"><span class="brand-mark" aria-hidden="true">ai<span>✳</span></span><span class="brand-copy">梁养浩的 AI 入门课<small>用生活中的例子，讲清楚复杂的 AI</small></span></RouterLink>
    <nav aria-label="主要导航">
      <RouterLink to="/" active-class="nav-active">首页</RouterLink>
      <RouterLink to="/learning" :class="{ 'nav-active': inLesson }">课程目录</RouterLink>
      <RouterLink to="/about">关于我</RouterLink>
      <RouterLink to="/insights" :class="{ 'nav-active': inInsights }">AI 开发经验分享</RouterLink>
      <RouterLink class="nav-start" to="/learning/ai-is-not-mysterious">从第一课开始 <span aria-hidden="true">↗</span></RouterLink>
    </nav>
  </header>
  <main id="main-content" class="site-main" :class="{ 'home-main': hasStage }" tabindex="-1"><slot /></main>
  <SiteFooter v-if="isHome" />
  <footer v-else class="course-footer"><div><strong>梁养浩的 AI 入门课</strong><p>从日常的一句提问，开始理解 AI。</p></div><div><span>免费阅读 · 无需注册</span><RouterLink to="/learning">查看全部课程 ↗</RouterLink></div></footer>
  <ReadingControls v-if="isPublic" />
  </div>
</template>
<style scoped>
.course-header{max-width:1220px;padding:24px 32px;border-bottom:1px solid var(--course-line,#e2ddd1);gap:24px}.brand{display:flex;align-items:center;gap:14px}.brand-mark{position:relative;display:flex;align-items:center;justify-content:center;flex-shrink:0;width:46px;height:46px;border:1.5px solid var(--course-line,#385a44);border-radius:15px 18px 13px 17px;background:var(--course-panel-strong,#edf1e4);color:var(--course-accent,#335c40);font-family:Georgia,serif;font-size:26px;transform:rotate(-5deg)}.brand-mark span{position:absolute;top:-9px;right:-7px;font-size:20px;color:var(--course-accent,#b46b40)}.brand-copy{font-size:19px;line-height:1.5;color:var(--course-text,#263d2c);display:block!important}.brand-copy small{display:block;font-size:11px;color:var(--course-muted,#747668);font-weight:400}.brand:hover{text-decoration:none}nav{gap:26px}nav a{padding:7px 0;color:var(--course-muted,#62695d)}.nav-active,nav a.router-link-exact-active{color:var(--course-text,#2b573c);text-decoration:underline;text-underline-offset:7px;text-decoration-thickness:1.5px}.nav-start{padding:10px 16px!important;background:var(--course-accent,#31563d);border-radius:40px;color:var(--course-button-ink,#fff)!important;text-decoration:none!important}.nav-start span{margin-left:12px}.skip-link{position:fixed;left:16px;top:-60px;z-index:30;background:var(--course-accent,#31563d);color:var(--course-button-ink,white);padding:8px 18px;border-radius:8px}.skip-link:focus{top:10px}.course-footer{max-width:1156px;border-top:1px solid var(--course-line,#d9d5c7);margin:80px auto 0;padding:32px 0 28px;display:flex;justify-content:space-between;font-size:13px}.course-footer strong{font-size:15px;color:var(--course-text,#354b37)}.course-footer p{margin:8px 0}.course-footer>div:last-child{display:flex;gap:14px;align-items:flex-end;flex-direction:column}.course-footer a{color:var(--course-link,#31563d)}@media(max-width:720px){.course-header{padding:18px 22px;align-items:flex-start;flex-direction:column;gap:16px}nav{width:100%;gap:20px;font-size:13px}.nav-start{margin-left:auto}.brand-copy{font-size:18px}.course-footer{margin:48px 22px 0;padding-top:24px;gap:20px;flex-direction:column}.course-footer>div:last-child{align-items:flex-start;gap:10px}.brand-copy small{font-size:11px}}
</style>
<style scoped>
@media(max-width:900px){.course-header{flex-direction:column;align-items:stretch;gap:16px}.course-header nav{width:100%;column-gap:22px;row-gap:10px}.course-header nav a{white-space:nowrap}.course-header .nav-start{margin-left:auto}}
</style>
<style scoped>
.directory-header{border-bottom-color:transparent}
.home-main{max-width:none;padding:0;margin:0;width:100%}.glass-header{position:absolute;inset:0 0 auto;max-width:1360px;width:100%;z-index:10;border-bottom:1px solid rgba(225,245,237,.14);padding:22px 48px;color:#eef6f0}.glass-header .brand-copy{color:#f1f7f1}.glass-header .brand-copy small{color:#b5c5bd}.glass-header .brand-mark{background:rgba(181,227,194,.09);border-color:rgba(205,238,204,.4);color:#d8efcf;backdrop-filter:blur(12px)}.glass-header .brand-mark span{color:#e7b87c}.glass-header nav a{color:#c9d9d0}.glass-header nav a.router-link-exact-active{color:#e3f4dc}.glass-header .nav-start{background:rgba(212,236,203,.12);border:1px solid rgba(214,236,205,.36);color:#e0f2d7!important;border-radius:40px}.glass-header .nav-start:hover{background:rgba(212,236,203,.23)}@media(max-width:720px){.glass-header{padding:20px 24px;gap:16px;align-items:stretch}.glass-header .brand-copy{font-size:17px}.glass-header .brand-copy small{font-size:10px}.glass-header .brand-mark{width:39px;height:39px;font-size:24px}.glass-header nav{font-size:12px;gap:22px}.glass-header .nav-start{padding:6px 12px!important}.glass-header .nav-start span{margin-left:7px}}
</style>

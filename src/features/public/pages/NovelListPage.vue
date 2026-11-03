<script setup lang="ts">
import novelText from '../novel-volume-one.md?raw';
import NovelReader from '../components/NovelReader.vue';
</script>
<template>
  <section class="novel-page" id="novel-contents">
    <header class="page-head"><p class="eyebrow">NOVEL</p><h1>小说专栏</h1><p>第一卷开篇 · 引子至第五章</p></header>
    <article class="book"><p class="book-label">第一卷</p><h2>开篇连读稿</h2><p class="book-note">共六节，可从目录选择章节阅读。</p><NovelReader :body-text="novelText" /></article>
  </section>
</template>
<style scoped>
.novel-page{max-width:900px;margin:0 auto}.page-head{max-width:760px;margin:0 auto 30px;padding:8px 0 22px;border-bottom:1px solid var(--line)}.eyebrow,.book-label{margin:0 0 8px;color:var(--accent);font-size:13px;font-weight:700;letter-spacing:.08em}.page-head h1{margin:0 0 10px}.page-head>p:last-child,.book-note{color:var(--muted);line-height:1.75}.book{max-width:760px;margin:auto}.book-label{margin:0}.book h2{margin:0;font-size:26px;line-height:1.5}.book-note{margin:4px 0 0}
</style>

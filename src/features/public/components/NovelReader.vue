<script setup lang="ts">
import { computed } from 'vue';
const props=defineProps<{bodyText:string|null}>();
const chapters=computed(()=>{
  const sections:{title:string;body:string}[]=[];
  let current:{title:string;lines:string[]}|undefined;
  for(const line of (props.bodyText||'').replace(/\r\n?/g,'\n').split('\n')){
    const heading=line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if(heading){if(current)sections.push({title:current.title,body:current.lines.join('\n').trim()});current={title:heading[1].trim(),lines:[]};}
    else if(current)current.lines.push(line);
    else if(line.trim()){current={title:'正文',lines:[line]};}
  }
  if(current)sections.push({title:current.title,body:current.lines.join('\n').trim()});
  return sections.map(section=>({...section,paragraphs:section.body.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)}));
});
</script>
<template>
  <section v-if="chapters.length" class="reader" aria-label="小说正文">
    <nav class="contents" aria-label="章节目录"><h2>目录</h2><ol><li v-for="(chapter,index) in chapters" :key="index"><a :href="`#chapter-${index+1}`">{{ chapter.title }}</a></li></ol></nav>
    <article v-for="(chapter,index) in chapters" :id="`chapter-${index+1}`" :key="index" class="chapter"><h2>{{ chapter.title }}</h2><p v-for="(paragraph,pIndex) in chapter.paragraphs" :key="pIndex">{{ paragraph }}</p><a class="back" href="#novel-contents">回到目录</a></article>
  </section>
  <p v-else class="empty-body">正文暂未整理。</p>
</template>
<style scoped>
.reader{max-width:760px;margin:0 auto}.contents{padding:22px 26px;margin:28px 0 44px;border:1px solid var(--line);border-radius:var(--radius);background:var(--paper)}.contents h2{margin:0 0 12px;font-size:20px}.contents ol{margin:0;padding-left:24px;display:grid;gap:8px}.contents a,.back{color:var(--accent);line-height:1.7}.chapter{scroll-margin-top:24px;padding:20px 0 28px;border-bottom:1px solid var(--line)}.chapter h2{margin:0 0 22px;font-size:24px;line-height:1.5}.chapter p{margin:0 0 1.1em;white-space:pre-wrap;overflow-wrap:anywhere;line-height:2;font-size:17px}.back{display:inline-block;min-height:44px;padding:8px 0;margin-top:8px}.empty-body{color:var(--muted)}
</style>

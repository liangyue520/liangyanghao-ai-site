<script setup lang="ts">
import { computed } from 'vue';
import { parseMarkdown } from '../insights/markdown';
import InsightInlineText from './InsightInlineText.vue';
const props = defineProps<{ markdown: string }>();
const blocks = computed(() => parseMarkdown(props.markdown));
</script>

<template>
  <div class="insight-markdown">
    <template v-for="(block, index) in blocks" :key="index">
      <component :is="`h${block.level}`" v-if="block.kind === 'heading'"><InsightInlineText :text="block.text" /></component>
      <p v-else-if="block.kind === 'paragraph'"><InsightInlineText :text="block.text" /></p>
      <blockquote v-else-if="block.kind === 'quote'"><InsightMarkdown :markdown="block.text" /></blockquote>
      <pre v-else-if="block.kind === 'code'"><code :data-language="block.language || undefined">{{ block.text }}</code></pre>
      <hr v-else-if="block.kind === 'rule'" />
      <component :is="block.ordered ? 'ol' : 'ul'" v-else-if="block.kind === 'list'" :start="block.ordered ? block.start : undefined">
        <li v-for="(item, itemIndex) in block.items" :key="itemIndex"><InsightMarkdown :markdown="item" /></li>
      </component>
      <div v-else-if="block.kind === 'table'" class="markdown-table-scroll" tabindex="0" role="region" aria-label="文章表格">
        <table>
          <thead><tr><th v-for="(cell, cellIndex) in block.header" :key="cellIndex" scope="col"><InsightInlineText :text="cell" /></th></tr></thead>
          <tbody><tr v-for="(row, rowIndex) in block.rows" :key="rowIndex"><td v-for="(cell, cellIndex) in row" :key="cellIndex"><InsightInlineText :text="cell" /></td></tr></tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.insight-markdown{color:var(--course-copy);line-height:1.95;overflow-wrap:anywhere}
.insight-markdown>:first-child{margin-top:0}
.insight-markdown>:last-child{margin-bottom:0}
h1,h2,h3,h4,h5,h6{color:var(--course-text);line-height:1.45;font-weight:650;scroll-margin-top:100px}
h1,h2{font-size:1.4em;margin:2.1em 0 .85em}
h3{font-size:1.16em;margin:1.8em 0 .7em}
h4,h5,h6{font-size:1.05em;margin:1.5em 0 .6em}
p{margin:0 0 1.2em;white-space:pre-line}
ul,ol{padding-left:1.65em;margin:1em 0 1.4em}
li{padding-left:.3em;margin:.5em 0}
li :deep(p){margin-bottom:.55em}
blockquote{border-left:3px solid var(--course-accent);margin:1.4em 0;padding:.8em 1.1em;background:var(--course-panel-strong);border-radius:0 8px 8px 0}
pre{max-width:100%;overflow-x:auto;padding:1.1em 1.2em;margin:1.4em 0;border:1px solid var(--course-line);border-radius:10px;background:var(--course-panel-strong);color:var(--course-text);line-height:1.7;white-space:pre;overflow-wrap:normal}
pre code{font: .88em/1.7 ui-monospace,SFMono-Regular,Consolas,monospace}
hr{margin:2em 0;border:0;border-top:1px solid var(--course-line)}
.markdown-table-scroll{overflow-x:auto;margin:1.4em 0;border:1px solid var(--course-line);border-radius:8px}
table{width:100%;border-collapse:collapse;text-align:left;font-size:.92em}
th,td{padding:.7em 1em;border-bottom:1px solid var(--course-line);min-width:8em;vertical-align:top}
th{color:var(--course-text);font-weight:650;background:var(--course-panel-strong)}
tr:last-child td{border-bottom:0}
</style>

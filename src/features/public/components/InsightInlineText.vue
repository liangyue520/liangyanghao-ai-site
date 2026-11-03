<script setup lang="ts">
import { computed } from 'vue';
import { parseInlineMarkdown } from '../insights/markdown';
const props = defineProps<{ text: string }>();
const parts = computed(() => parseInlineMarkdown(props.text));
</script>

<template>
  <template v-for="(part, index) in parts" :key="index">
    <strong v-if="part.kind === 'strong'">{{ part.text }}</strong>
    <code v-else-if="part.kind === 'code'">{{ part.text }}</code>
    <em v-else-if="part.kind === 'em'">{{ part.text }}</em>
    <a v-else-if="part.kind === 'link'" :href="part.href" target="_blank" rel="noopener noreferrer">{{ part.text }}</a>
    <template v-else>{{ part.text }}</template>
  </template>
</template>

<style scoped>
strong{color:var(--course-text);font-weight:650}
code{padding:2px 5px;border:1px solid var(--course-line);border-radius:5px;background:var(--course-panel-strong);color:var(--course-accent);font-size:.88em;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}
a{color:var(--course-accent);text-decoration:underline;text-underline-offset:3px;overflow-wrap:anywhere}
a:hover{opacity:.8}
a:focus-visible{outline:2px solid var(--course-accent);outline-offset:3px}
</style>

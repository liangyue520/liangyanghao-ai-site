<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ text: string }>();
const parts = computed(() => {
  const result: { kind: 'text' | 'strong' | 'code'; text: string }[] = [];
  let position = 0;
  for (const match of props.text.matchAll(/`([^`\n]+)`|\*\*([^*\n]+)\*\*/g)) {
    const start = match.index!;
    if (start > position) result.push({ kind: 'text', text: props.text.slice(position, start) });
    result.push(match[1] !== undefined ? { kind: 'code', text: match[1] } : { kind: 'strong', text: match[2]! });
    position = start + match[0].length;
  }
  if (position < props.text.length) result.push({ kind: 'text', text: props.text.slice(position) });
  return result;
});
</script>

<template><template v-for="(part, index) in parts" :key="index"><strong v-if="part.kind === 'strong'">{{ part.text }}</strong><code v-else-if="part.kind === 'code'">{{ part.text }}</code><template v-else>{{ part.text }}</template></template></template>

<style scoped>
strong{color:var(--course-text);font-weight:650}
code{padding:2px 5px;border:1px solid var(--course-line);border-radius:5px;background:var(--course-panel-strong);color:var(--course-accent);font-size:.88em;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}
</style>

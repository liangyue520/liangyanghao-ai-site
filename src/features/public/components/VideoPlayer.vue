<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PublicDetail } from '../../../../shared/contracts';
import { mediaUrl } from '../api';
const props = defineProps<{ content: PublicDetail }>();
const url = computed(() => mediaUrl(props.content.media.find(item => item.role === 'video'), 'playback'));
const failed = ref(false), waiting = ref(false), attempt = ref(0);
function retry() { failed.value = false; waiting.value = false; attempt.value++; }
</script>
<template><section aria-label="视频播放器"><video v-if="url && !failed" :key="attempt" :src="url" :poster="mediaUrl(content.cover, 'display')" controls playsinline preload="metadata" :aria-label="content.title" @error="failed = true" @waiting="waiting = true" @stalled="waiting = true" @playing="waiting = false" @canplay="waiting = false" @loadedmetadata="waiting = false">浏览器暂不支持此视频。</video><p v-if="waiting && !failed" role="status">正在缓冲视频……<button @click="retry">重新加载视频</button></p><p v-if="!url || failed" role="alert">视频暂时无法播放，请稍后重试。<button v-if="url" @click="retry">重试视频</button></p><p class="hint">点击播放后观看，可暂停或拖动进度。</p></section></template>
<style scoped>video{display:block;width:100%;max-height:75vh;background:var(--ink);border-radius:var(--radius)}.hint{font-size:14px;color:var(--muted)}button{margin:12px 0;display:block;min-height:44px}</style>

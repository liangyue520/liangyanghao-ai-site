<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import LearningAtmosphere from './LearningAtmosphere.vue';

withDefaults(defineProps<{ seamless?: boolean }>(), { seamless: false });
const paused = ref(false);
const reduced = ref(false);
let motionPreference: MediaQueryList | undefined;

function updateMotionPreference(event: MediaQueryListEvent) {
  reduced.value = event.matches;
}

onMounted(() => {
  if (typeof window.matchMedia !== 'function') return;
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduced.value = motionPreference.matches;
  if (typeof motionPreference.addEventListener === 'function') {
    motionPreference.addEventListener('change', updateMotionPreference);
  } else {
    motionPreference.addListener(updateMotionPreference);
  }
});

onBeforeUnmount(() => {
  if (!motionPreference) return;
  if (typeof motionPreference.removeEventListener === 'function') {
    motionPreference.removeEventListener('change', updateMotionPreference);
  } else {
    motionPreference.removeListener(updateMotionPreference);
  }
});
</script>

<template>
  <div class="learning-stage" :class="{ 'is-seamless': seamless, 'is-motion-paused': paused || reduced }">
    <LearningAtmosphere :paused="paused || reduced" />
    <div class="stage-content">
      <div class="atmosphere-tools">
        <button
          class="atmosphere-toggle"
          type="button"
          :disabled="reduced"
          :aria-pressed="paused || reduced"
          :aria-label="reduced ? '已按系统设置减少动态效果' : paused ? '播放背景线条' : '暂停背景线条'"
          @click="paused = !paused"
        ><span aria-hidden="true">{{ paused || reduced ? '▷' : 'Ⅱ' }}</span>{{ reduced ? '已减少动态' : paused ? '播放线条' : '暂停线条' }}</button>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.learning-stage{--stage-entry:var(--course-bg);position:relative;width:100%;isolation:isolate;overflow:clip;color:var(--course-text);background:linear-gradient(180deg,var(--stage-entry) 0,var(--stage-entry) 24px,#1d4942 360px,#1a433d 75%,var(--course-bg) 100%)}
.learning-stage.is-seamless{--stage-entry:#102e2b}
.learning-stage.is-motion-paused{--border-flow-play-state:paused}
.learning-stage>.learning-atmosphere{-webkit-mask-image:linear-gradient(180deg,transparent 0,rgba(0,0,0,.15) 90px,black 360px);mask-image:linear-gradient(180deg,transparent 0,rgba(0,0,0,.15) 90px,black 360px)}
.learning-stage.is-seamless>.learning-atmosphere{-webkit-mask-image:linear-gradient(180deg,transparent 0,rgba(0,0,0,.15) 90px,black 360px,black 75%,transparent 100%);mask-image:linear-gradient(180deg,transparent 0,rgba(0,0,0,.15) 90px,black 360px,black 75%,transparent 100%)}
.stage-content{position:relative;z-index:1}
.atmosphere-tools{display:flex;justify-content:flex-end;max-width:1180px;box-sizing:border-box;padding:32px 32px 0;margin:0 auto}
.atmosphere-toggle{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--course-line);border-radius:30px;background:var(--course-panel);color:var(--course-muted);padding:6px 12px;font-size:10px;cursor:pointer;transition:background .2s,color .2s}
.atmosphere-toggle:hover{background:var(--course-panel-strong);color:var(--course-text)}
.atmosphere-toggle:focus-visible{outline:2px solid var(--course-accent);outline-offset:4px}
.atmosphere-toggle:disabled{opacity:1;color:var(--course-faint);cursor:default}
@media(max-width:720px){.atmosphere-tools{padding:24px 22px 0}}
@media(prefers-reduced-motion:reduce){.atmosphere-toggle{transition:none}}
</style>

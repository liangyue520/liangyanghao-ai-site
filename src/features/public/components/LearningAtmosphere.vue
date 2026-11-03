<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import AiProductBackdrop from './AiProductBackdrop.vue';

const props = defineProps<{ paused: boolean }>();
const surface = ref<HTMLElement>();
const inViewport = ref(false);
const pageVisible = ref(true);
const running = computed(() => !props.paused && inViewport.value && pageVisible.value);
let observer: IntersectionObserver | undefined;

function updateVisibility() {
  pageVisible.value = !document.hidden;
}

onMounted(() => {
  updateVisibility();
  document.addEventListener('visibilitychange', updateVisibility);
  if (typeof window.IntersectionObserver === 'function' && surface.value) {
    try {
      observer = new IntersectionObserver(([entry]) => {
        inViewport.value = Boolean(entry?.isIntersecting);
      });
      observer.observe(surface.value);
    } catch {
      observer?.disconnect();
      inViewport.value = true;
    }
  } else {
    inViewport.value = true;
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
  document.removeEventListener('visibilitychange', updateVisibility);
});
</script>

<template>
  <div ref="surface" class="learning-atmosphere" :class="{ 'is-running': running }" aria-hidden="true">
    <AiProductBackdrop />
    <div class="atmosphere-light light-mint" />
    <div class="atmosphere-light light-teal" />
    <div class="atmosphere-light light-warm" />
    <div class="glass-outline glass-outline-one" />
    <div class="glass-outline glass-outline-two" />
    <div class="glass-outline glass-outline-three" />
    <svg class="atmosphere-paths" viewBox="0 0 1440 960" fill="none" preserveAspectRatio="xMidYMid slice">
      <g class="path-structure">
        <path d="M-160 560C180 150 395 735 720 420S1250 80 1580 345" />
        <path d="M-120 710C235 300 475 920 815 560S1320 245 1590 480" />
        <ellipse cx="1120" cy="460" rx="330" ry="220" transform="rotate(-28 1120 460)" />
      </g>
      <g class="path-trace">
        <path d="M-160 560C180 150 395 735 720 420S1250 80 1580 345" />
        <path d="M-120 710C235 300 475 920 815 560S1320 245 1590 480" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.learning-atmosphere{position:absolute;inset:0;overflow:hidden;pointer-events:none;border-radius:inherit;isolation:isolate}
.atmosphere-light{position:absolute;width:880px;height:760px;max-width:130vw;border-radius:50%;opacity:.85}
.light-mint{top:-230px;left:-290px;background:radial-gradient(ellipse,rgba(164,228,197,.09),rgba(164,228,197,0) 68%)}
.light-teal{top:38%;right:-310px;background:radial-gradient(ellipse,rgba(96,220,198,.085),rgba(96,220,198,0) 68%);}
.light-warm{bottom:-280px;left:10%;background:radial-gradient(ellipse,rgba(229,217,154,.07),rgba(229,217,154,0) 66%);}
.glass-outline{position:absolute;width:clamp(240px,30vw,440px);height:300px;border:1px solid rgba(221,245,227,.065);border-radius:40px;background:linear-gradient(145deg,rgba(218,240,224,.025),rgba(218,240,224,0) 70%);box-shadow:inset 0 1px 0 rgba(230,248,233,.035);transform:rotate(var(--glass-angle));opacity:.8}
.glass-outline-one{left:-180px;top:17%;--glass-angle:-14deg}
.glass-outline-two{right:-190px;top:49%;--glass-angle:13deg;}
.glass-outline-three{left:25%;bottom:-210px;--glass-angle:-6deg;}
.atmosphere-paths{position:absolute;top:0;left:0;width:100%;height:960px;min-width:800px;overflow:visible}
.path-structure{stroke:rgba(194,235,214,.055);stroke-width:1}
.path-trace{stroke:rgba(204,244,218,.1);stroke-width:1.5;stroke-linecap:round;stroke-dasharray:45 560;animation:path-flow 18s linear infinite}
.path-trace path:nth-child(2){stroke:rgba(231,227,171,.075)}
.learning-atmosphere:not(.is-running) *{animation-play-state:paused!important}


@keyframes path-flow{from{stroke-dashoffset:605}to{stroke-dashoffset:0}}
@media(max-width:720px){.atmosphere-light{width:640px;height:690px}.light-mint{left:-360px;top:-180px}.light-teal{right:-390px}.glass-outline{height:250px;border-radius:30px}.glass-outline-one{left:-195px}.glass-outline-two{right:-205px}.atmosphere-paths{left:-220px;top:0;width:1000px;height:800px}}
@media(prefers-reduced-motion:reduce){.learning-atmosphere *{animation:none!important}.glass-outline{transform:rotate(var(--glass-angle))}.path-trace{opacity:.65}}
</style>

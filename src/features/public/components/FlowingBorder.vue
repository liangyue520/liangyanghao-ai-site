<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const props = withDefaults(defineProps<{ duration?: number; paused?: boolean }>(), {
  duration: 5,
  paused: false
});

const outline = ref<SVGSVGElement>();
const width = ref(0);
const height = ref(0);
const radius = ref(0);
const inView = ref(false);
const tabHidden = ref(false);
const stopped = computed(() => props.paused || !inView.value || tabHidden.value);
let resizeObserver: ResizeObserver | undefined;
let visibilityObserver: IntersectionObserver | undefined;

function measure() {
  const svg = outline.value;
  const surface = svg?.parentElement;
  if (!svg || !surface) return;
  // Layout dimensions stay accurate while the surrounding scroll reveal scales.
  width.value = svg.clientWidth;
  height.value = svg.clientHeight;
  const corner = Number.parseFloat(getComputedStyle(surface).borderTopLeftRadius) || 0;
  radius.value = Math.max(0, Math.min(corner, width.value / 2, height.value / 2) - .8);
}

function followVisibility() {
  tabHidden.value = document.hidden;
}

onMounted(() => {
  measure();
  followVisibility();
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(measure);
    if (outline.value) resizeObserver.observe(outline.value);
  } else window.addEventListener('resize', measure);

  if (typeof IntersectionObserver !== 'undefined') {
    visibilityObserver = new IntersectionObserver(([entry]) => {
      inView.value = !!entry?.isIntersecting;
    });
    if (outline.value) visibilityObserver.observe(outline.value);
  } else inView.value = true;
  document.addEventListener('visibilitychange', followVisibility);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  visibilityObserver?.disconnect();
  window.removeEventListener('resize', measure);
  document.removeEventListener('visibilitychange', followVisibility);
});
</script>

<template>
  <svg
    ref="outline"
    class="flowing-border"
    :class="{ 'is-paused': stopped }"
    :style="{ '--border-flow-duration': `${duration}s` }"
    :viewBox="`0 0 ${width || 1} ${height || 1}`"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="width > 2 && height > 2">
      <g v-for="side in [0, 1]" :key="side" :style="{ '--border-flow-phase': side * -.5 }">
        <rect
          v-for="layer in ['tail', 'trail', 'glow', 'tip']"
          :key="layer"
          :class="['border-runner', `border-${layer}`]"
          x=".8" y=".8"
          :width="width - 1.6" :height="height - 1.6" :rx="radius"
          pathLength="100"
          vector-effect="non-scaling-stroke"
        />
      </g>
    </template>
  </svg>
</template>

<style scoped>
.flowing-border{position:absolute;inset:-1px;width:calc(100% + 2px);height:calc(100% + 2px);overflow:visible;pointer-events:none;z-index:1}
.border-runner{stroke-linecap:round;animation:border-travel var(--border-flow-duration) linear infinite;animation-delay:calc(var(--border-flow-duration) * var(--border-flow-phase));animation-play-state:var(--border-flow-play-state,running)}
.border-tail{stroke:#c9e5a7;stroke-width:1.3;stroke-dasharray:18 82;opacity:.28}
.border-trail{stroke:#e1efb9;stroke-width:1.5;stroke-dasharray:10 90;opacity:.6;animation-delay:calc(var(--border-flow-duration) * (var(--border-flow-phase) - .08))}
.border-glow{stroke:#d8f0b3;stroke-width:3;stroke-dasharray:5 95;opacity:.52;filter:blur(2.5px);animation-delay:calc(var(--border-flow-duration) * (var(--border-flow-phase) - .13))}
.border-tip{stroke:#f5ffdc;stroke-width:1.8;stroke-dasharray:3.5 96.5;opacity:.98;filter:drop-shadow(0 0 3px #e1f7b68c);animation-delay:calc(var(--border-flow-duration) * (var(--border-flow-phase) - .145))}
.is-paused .border-runner{animation-play-state:paused}
@keyframes border-travel{from{stroke-dashoffset:0}to{stroke-dashoffset:-100}}
@media(prefers-reduced-motion:reduce){.border-runner{animation:none!important}.border-glow{display:none}.border-tail,.border-trail{opacity:.12}.border-tip{opacity:.4;filter:none}}
@media print{.flowing-border{display:none}}
</style>

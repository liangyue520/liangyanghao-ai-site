<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
const props = withDefaults(defineProps<{ subtle?: boolean }>(), { subtle: false });

const canvas = ref<HTMLCanvasElement>();
let dispose = () => {};
onMounted(() => {
  const el = canvas.value;
  const host = el?.parentElement;
  const ctx = el?.getContext('2d');
  if (!el || !host || !ctx) return;
  const panel = host.querySelector<HTMLElement>('.hero-panel');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  let width = 1, height = 1, frame = 0, last = 0, time = 0, visible = true;
  let mx = -1000, my = -1000, tx = 0, ty = 0, rx = 0, ry = 0, vx = 0, vy = 0;
  let dots: { x: number; y: number; phase: number; size: number; ox: number; oy: number; vx: number; vy: number; gold: boolean }[] = [];
  function resize() {
    width = host!.clientWidth; height = host!.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    el!.width = Math.round(width * dpr); el!.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = Array.from({ length: props.subtle ? (width < 600 ? 12 : 30) : (width < 600 ? 44 : 120) }, (_, i) => ({
      x: Math.random() * width, y: Math.random() * height,
      phase: Math.random() * Math.PI * 2, size: 1.3 + Math.random() * 1.8,
      ox: 0, oy: 0, vx: 0, vy: 0, gold: i % 4 === 0,
    }));
    draw(0); resume();
  }
  function draw(dt: number) {
    ctx!.clearRect(0, 0, width, height);
    for (const p of dots) {
      const x = p.x + Math.sin(time * .72 + p.phase) * 16;
      const y = p.y + Math.cos(time * .57 + p.phase) * 12;
      const dx = x + p.ox - mx, dy = y + p.oy - my;
      const distance = Math.hypot(dx, dy);
      const force = Math.max(0, 1 - distance / 125) * 180;
      p.vx += (-p.ox * 12 + dx / Math.max(distance, 1) * force - p.vx * 5) * dt;
      p.vy += (-p.oy * 12 + dy / Math.max(distance, 1) * force - p.vy * 5) * dt;
      p.ox += p.vx * dt; p.oy += p.vy * dt;
      const alpha = .42 + .18 * Math.sin(time * .8 + p.phase);
      const color = p.gold ? '167,132,58' : '55,117,82';
      const glow = ctx!.createRadialGradient(x+p.ox,y+p.oy,0,x+p.ox,y+p.oy,p.size*5);
      glow.addColorStop(0, `rgba(${color},${alpha * .45})`);
      glow.addColorStop(1, `rgba(${color},0)`);
      ctx!.fillStyle = glow;
      ctx!.beginPath(); ctx!.arc(x+p.ox,y+p.oy,p.size*5,0,Math.PI*2); ctx!.fill();
      ctx!.fillStyle = `rgba(${color},${alpha})`;
      ctx!.beginPath(); ctx!.arc(x+p.ox,y+p.oy,p.size,0,Math.PI*2); ctx!.fill();
    }
  }
  function tick(now: number) {
    const dt = last ? Math.min((now-last)/1000, .033) : 0;
    last = now; time += dt;
    vx += ((tx-rx)*100-vx*18)*dt; vy += ((ty-ry)*100-vy*18)*dt;
    rx += vx*dt; ry += vy*dt;
    if (panel) panel.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    draw(dt); frame = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame); last = 0;
    if (!reduced.matches && visible && !document.hidden) frame = requestAnimationFrame(tick);
    else { if (panel) panel.style.transform = ''; draw(0); }
  }
  function move(e: PointerEvent) {
    if (coarse.matches || reduced.matches) return;
    const r = host!.getBoundingClientRect();
    mx = e.clientX-r.left; my = e.clientY-r.top;
    tx = -(my/height-.5)*3; ty = (mx/width-.5)*3;
  }
  function leave() { mx = my = -1000; tx = ty = 0; }
  const ro = new ResizeObserver(resize); ro.observe(host);
  const io = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; resume(); }); io.observe(host);
  host.addEventListener('pointermove', move); host.addEventListener('pointerleave', leave);
  document.addEventListener('visibilitychange', resume); reduced.addEventListener('change', resume);
  dispose = () => {
    cancelAnimationFrame(frame); ro.disconnect(); io.disconnect();
    host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave);
    document.removeEventListener('visibilitychange', resume); reduced.removeEventListener('change', resume);
    if (panel) panel.style.transform = '';
  };
});
onUnmounted(() => dispose());
</script>

<template><canvas ref="canvas" class="hero-fireflies" aria-hidden="true" /></template>

<style scoped>
.hero-fireflies{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
</style>

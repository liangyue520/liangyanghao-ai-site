<script setup lang="ts">
const leaves = [
  { left: '5%', delay: '-3s', duration: '19s', size: '15px', drift: '44px', angle: '38deg' },
  { left: '15%', delay: '-13s', duration: '25s', size: '11px', drift: '-34px', angle: '-30deg' },
  { left: '26%', delay: '-8s', duration: '22s', size: '17px', drift: '51px', angle: '22deg' },
  { left: '38%', delay: '-19s', duration: '29s', size: '12px', drift: '-43px', angle: '48deg' },
  { left: '48%', delay: '-11s', duration: '24s', size: '14px', drift: '38px', angle: '-15deg' },
  { left: '59%', delay: '-5s', duration: '27s', size: '11px', drift: '-53px', angle: '44deg' },
  { left: '70%', delay: '-17s', duration: '21s', size: '16px', drift: '40px', angle: '-35deg' },
  { left: '81%', delay: '-9s', duration: '26s', size: '13px', drift: '-45px', angle: '29deg' },
  { left: '91%', delay: '-21s', duration: '30s', size: '18px', drift: '35px', angle: '-25deg' },
];
</script>
<template>
  <div class="leaves" aria-hidden="true">
    <span v-for="(leaf, index) in leaves" :key="index" class="leaf-path" :style="{ '--left': leaf.left, '--delay': leaf.delay, '--duration': leaf.duration, '--size': leaf.size, '--drift': leaf.drift, '--angle': leaf.angle }"><span class="leaf" /></span>
  </div>
</template>
<style scoped>
.leaves{position:fixed;inset:0;z-index:2;pointer-events:none;overflow:hidden;contain:strict}
.leaf-path{position:absolute;top:-30px;left:var(--left);display:block;animation:fall var(--duration) linear var(--delay) infinite;will-change:transform}
.leaf{display:block;width:var(--size);height:calc(var(--size) * .65);border-radius:85% 5% 85% 5%;border:1px solid rgba(220,237,191,.25);background:linear-gradient(135deg,rgba(210,230,164,.3),rgba(144,189,143,.09));box-shadow:0 0 8px rgba(223,229,164,.07);transform:rotate(var(--angle));animation:sway 4.8s ease-in-out var(--delay) infinite alternate}
@keyframes fall{from{transform:translate3d(0,-25px,0)}to{transform:translate3d(var(--drift),calc(100vh + 55px),0)}}
@keyframes sway{from{transform:rotate(var(--angle)) rotateY(0)}to{transform:rotate(calc(var(--angle) + 120deg)) rotateY(55deg)}}
@media(max-width:720px){.leaf-path:nth-child(even){display:none}.leaves{opacity:.7}}
@media(prefers-reduced-motion:reduce){.leaves{display:none}}
@media print{.leaves{display:none}}
</style>

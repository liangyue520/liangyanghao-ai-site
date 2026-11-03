<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import FlowingBorder from './FlowingBorder.vue';

const hero = ref<HTMLElement>();
const video = ref<HTMLVideoElement>();
const paused = ref(false);
const unavailable = ref(false);
let reducedMotion: MediaQueryList | undefined;
let observer: IntersectionObserver | undefined;
let inView = true;

function syncVideo() {
  const player = video.value;
  if (!player) return;
  if (paused.value || !inView || document.hidden) player.pause();
  else player.play().then(() => { unavailable.value = false; }).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    if (!paused.value && inView && !document.hidden && player === video.value) unavailable.value = true;
  });
}
function toggleMotion() {
  if (unavailable.value) { unavailable.value = false; paused.value = false; }
  else paused.value = !paused.value;
  syncVideo();
}
function followPreference(event: MediaQueryListEvent) {
  paused.value = event.matches;
  syncVideo();
}
onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  paused.value = reducedMotion.matches;
  reducedMotion.addEventListener('change', followPreference);
  document.addEventListener('visibilitychange', syncVideo);
  observer = new IntersectionObserver(([entry]) => { inView = !!entry?.isIntersecting; syncVideo(); }, { threshold: .05 });
  if (hero.value) observer.observe(hero.value);
  syncVideo();
});
onUnmounted(() => {
  observer?.disconnect();
  reducedMotion?.removeEventListener('change', followPreference);
  document.removeEventListener('visibilitychange', syncVideo);
});
</script>

<template>
  <section ref="hero" class="glass-hero" :class="{ 'motion-paused': paused || unavailable }" aria-labelledby="welcome-title">
    <div class="scene" aria-hidden="true">
      <video ref="video" class="scene-video" src="/assets/ai-study-stable-loop.mp4" poster="/assets/ai-study-stable-poster.jpg" muted loop playsinline preload="metadata" @error="unavailable = true"></video>
      <div class="scene-shade"></div>
      <div class="ambient-light"></div>
      <div class="ambient-light light-amber"></div>
    </div>

    <div class="hero-frame">
      <div class="frame-top"><span><i></i> 给每一个对 AI 好奇的人</span><span class="frame-index">A LITTLE CURIOSITY. A NEW BEGINNING.</span></div>
      <div class="glass-window">
        <div class="hero-copy">
          <p class="hero-eyebrow">梁养浩的 AI 入门课 <span>· 从零开始</span></p>
          <h1 id="welcome-title">AI 并不神秘。<br><span>从生活开始理解。</span></h1>
          <p class="hero-description">用生活中的例子，讲清楚复杂的 AI。<br>从手机听懂的一句话，到能帮你做事的智能体，<br class="desktop-break">我们一起慢慢弄明白。</p>
          <div class="hero-actions">
            <RouterLink class="hero-primary" to="/learning/ai-is-not-mysterious"><FlowingBorder :duration="4.8" :paused="paused || unavailable" />开始第一课 <span aria-hidden="true">↗</span></RouterLink>
            <RouterLink class="hero-secondary" to="/learning">浏览全部课程 <span aria-hidden="true">→</span></RouterLink>
          </div>
          <p class="hero-facts"><span>零基础友好</span><span>免费阅读</span><span>无需注册</span></p>
        </div>

        <div class="demo-scene" aria-label="示意动画：对手机说出提醒请求，手机生成明天九点开会的提醒">
          <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
          <div class="glass-phone">
            <div class="phone-top"><span>09:00</span><span class="phone-camera"></span><svg width="27" height="12" viewBox="0 0 27 12" fill="none" aria-hidden="true"><path d="M2 9V7M6 9V5M10 9V3" stroke="currentColor" stroke-width="2"/><rect x="15" y="3" width="9" height="6" rx="1.5" stroke="currentColor"/><path d="M26 5v2" stroke="currentColor"/></svg></div>
            <div class="assistant-mark" aria-hidden="true"><svg viewBox="0 0 52 52" fill="none"><path d="M26 5c0 13-8 21-21 21 13 0 21 8 21 21 0-13 8-21 21-21C34 26 26 18 26 5Z" fill="url(#sparkle)"/><defs><linearGradient id="sparkle" x1="4" y1="9" x2="46" y2="46" gradientUnits="userSpaceOnUse"><stop stop-color="#f4eac3"/><stop offset="1" stop-color="#8cdebd"/></linearGradient></defs></svg></div>
            <p class="phone-question">“明天九点，<br>提醒我开会。”</p>
            <div class="voice-wave" aria-hidden="true"><i v-for="n in 17" :key="n" :style="{ '--n': n, height: `${6 + (n * 7) % 19}px` }"></i></div>
            <div class="reminder">
              <div class="reminder-icon" aria-hidden="true">✓</div>
              <div><small>已添加提醒</small><strong>明天 09:00</strong><span>开会</span></div>
              <span class="reminder-dot" aria-hidden="true"></span>
            </div>
            <div class="phone-bottom" aria-hidden="true"></div>
          </div>
          <div class="floating-caption"><span class="caption-mark" aria-hidden="true">↳</span><p>一句日常对话，<br>就是理解 AI 的起点。</p></div>
          <span class="demo-label">生活场景示意</span>
        </div>
      </div>
      <div class="hero-bottom"><a href="#first-lessons" class="scroll-link"><span class="scroll-line" aria-hidden="true"></span> 向下探索，从一个小问题开始</a><button class="motion-toggle" type="button" :aria-label="paused || unavailable ? '播放背景动画' : '暂停背景动画'" :aria-pressed="paused || unavailable" @click="toggleMotion"><span aria-hidden="true">{{ paused || unavailable ? '▷' : 'Ⅱ' }}</span>{{ paused || unavailable ? '播放动态' : '暂停动态' }}</button></div>
    </div>
  </section>
</template>

<style scoped>
.hero-primary{position:relative}
.glass-hero{position:relative;isolation:isolate;display:flex;align-items:center;min-height:800px;min-height:max(800px,100svh);overflow:hidden;background:#092b29;color:#f2f6ed}.scene,.scene-video,.scene-shade{position:absolute;inset:0;width:100%;height:100%}.scene{z-index:-2;overflow:hidden}.scene-video{object-fit:cover}.scene-shade{background:linear-gradient(90deg,rgba(3,20,19,.35),rgba(4,23,24,.08) 58%,rgba(3,20,19,.2)),linear-gradient(180deg,rgba(1,20,21,.55),transparent 28%,rgba(3,22,21,.08) 70%,#102e2b 100%)}.ambient-light{position:absolute;top:12%;left:5%;width:45%;height:55%;background:radial-gradient(ellipse,rgba(95,216,174,.14),transparent 67%);filter:blur(30px);animation:none}.light-amber{top:50%;left:60%;width:30%;height:30%;background:radial-gradient(ellipse,rgba(244,191,102,.12),transparent 70%);}.hero-frame{width:min(1180px,calc(100% - 96px));margin:140px auto 44px}.frame-top,.hero-bottom{display:flex;align-items:center;justify-content:space-between;gap:24px}.frame-top{padding:0 6px;margin-bottom:18px;font-size:11px;letter-spacing:.1em;color:#d3e0d6}.frame-top>span:first-child{display:flex;align-items:center;gap:9px}.frame-top i{display:block;width:5px;height:5px;border-radius:50%;background:#c7e9b5;box-shadow:0 0 12px #99d1aa}.frame-index{font-size:9px;letter-spacing:.18em;color:#acc3b7}.glass-window{position:relative;display:grid;grid-template-columns:1.45fr 1fr;align-items:center;gap:30px;padding:58px 62px 52px;border:1px solid rgba(216,239,222,.29);border-radius:28px;background:linear-gradient(120deg,rgba(53,82,75,.47),rgba(17,47,43,.18) 60%,rgba(150,191,166,.12));backdrop-filter:blur(18px) saturate(115%);-webkit-backdrop-filter:blur(18px) saturate(115%);box-shadow:inset 0 1px 0 rgba(243,255,239,.18),0 24px 100px rgba(0,12,11,.2)}.glass-window:before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(125deg,rgba(247,255,243,.05),transparent 35%,transparent 70%,rgba(241,255,242,.035))}.hero-copy{position:relative;z-index:2}.hero-eyebrow{font-size:12px;letter-spacing:.08em;color:#e0ebdf;margin:0 0 24px}.hero-eyebrow span{color:#acc5b5}.hero-copy h1{font-family:system-ui,'PingFang SC','Microsoft YaHei',sans-serif;font-size:clamp(43px,4.45vw,67px);line-height:1.3;letter-spacing:-.045em;font-weight:750;margin:0 0 24px;white-space:nowrap}.hero-copy h1>span{background:linear-gradient(100deg,#f4eccf,#d2edbd 65%,#a9dece);-webkit-background-clip:text;background-clip:text;color:transparent}.hero-description{font-size:14px;line-height:2;color:#c8d7cf;margin:0 0 32px;letter-spacing:.025em}.hero-actions{display:flex;gap:14px;flex-wrap:wrap}.hero-actions a{display:inline-flex;align-items:center;justify-content:space-between;gap:30px;padding:13px 23px;border:1px solid transparent;border-radius:40px;font-size:13px;font-weight:600;transition:background .2s}.hero-actions a:hover{text-decoration:none}.hero-primary{background:linear-gradient(110deg,#ddebab,#9fdec5);color:#173d30;box-shadow:0 6px 24px #061e1826}.hero-primary:hover{background:#e2f1c0}.hero-secondary{background:rgba(229,248,231,.04);border-color:rgba(218,238,219,.35)!important;color:#ebf3e6}.hero-secondary:hover{background:rgba(229,248,231,.12)}.hero-actions a>span{font-size:17px;font-weight:400}.hero-facts{display:flex;gap:19px;color:#aac2b4;font-size:10px;letter-spacing:.04em;margin:22px 0 0}.hero-facts span+span:before{content:'·';margin-right:19px;color:#6f9786}.demo-scene{position:relative;min-width:0;height:415px;display:flex;align-items:center;justify-content:center;perspective:1100px}.glass-phone{position:relative;width:235px;height:373px;border:1px solid rgba(232,255,233,.47);border-radius:34px;background:linear-gradient(135deg,rgba(219,243,222,.17),rgba(91,157,131,.08) 50%,rgba(18,50,42,.34));box-shadow:inset 1px 1px 0 rgba(242,255,243,.25),inset -1px -1px 0 rgba(221,249,230,.1),0 20px 38px #031c2242;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding:19px 21px;transform:rotateY(-10deg) rotateZ(5deg);animation:none}.phone-top{display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#c8e2d1}.phone-camera{position:absolute;top:14px;left:50%;transform:translateX(-50%);width:62px;height:16px;border:1px solid #d6f1da20;border-radius:20px;background:#153c3240}.assistant-mark{width:43px;height:43px;margin:29px auto 15px;filter:drop-shadow(0 0 16px #b5e6c755)}.phone-question{text-align:center;font-size:19px;font-weight:500;letter-spacing:.04em;line-height:1.75;color:#edf7e8;margin:0}.voice-wave{display:flex;align-items:center;justify-content:center;gap:4px;height:34px;margin:14px 0 17px}.voice-wave i{width:2px;height:12px;min-height:6px;border-radius:4px;background:#b6e1b7;animation:voice 1.6s ease-in-out infinite;animation-delay:calc(var(--n) * -.13s)}.reminder{display:flex;align-items:flex-start;gap:11px;padding:13px 12px;background:rgba(209,238,218,.14);border:1px solid rgba(233,251,235,.25);border-radius:14px;box-shadow:inset 0 1px 0 #edffed12;animation:reminder-glow 8s ease-in-out infinite}.reminder-icon{background:#d0e7b6;color:#264e37;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;margin-top:3px}.reminder>div:nth-child(2){display:flex;flex-direction:column}.reminder small{font-size:9px;color:#b4cfbd}.reminder strong{font-weight:500;font-size:17px;line-height:1.6;color:#f1f5e5}.reminder span{font-size:10px;color:#c4d8c9}.reminder-dot{width:4px;height:4px;border-radius:50%;background:#b9d995;margin-left:auto;margin-top:7px}.phone-bottom{position:absolute;bottom:10px;left:50%;width:57px;height:3px;background:#c9e3cd55;border-radius:20px;transform:translateX(-50%)}.floating-caption{position:absolute;bottom:17px;left:-10px;display:flex;align-items:center;gap:12px;border:1px solid #e3f4dd3b;border-radius:14px;padding:13px 20px;background:rgba(63,94,74,.45);backdrop-filter:blur(22px);box-shadow:0 12px 30px #05201a2b;transform:rotate(-5deg);animation:none}.floating-caption p{font-size:11px;line-height:1.8;color:#e7f0dc;margin:0;letter-spacing:.03em}.caption-mark{font-family:Georgia,serif;font-size:28px;color:#d8e4ac}.demo-label{position:absolute;right:5px;top:8px;font-size:9px;letter-spacing:.1em;color:#bdd0bf;writing-mode:vertical-rl}.orbit{position:absolute;top:7%;left:0;width:100%;height:85%;border:1px solid #d7e7ca13;border-radius:50%;transform:rotate(-28deg)}.orbit-two{transform:rotate(26deg);width:78%;left:11%;border-style:dashed}.hero-bottom{padding:22px 6px 0}.scroll-link{display:flex;align-items:center;gap:12px;color:#bed1c4;font-size:10px;letter-spacing:.06em}.scroll-link:hover{color:#f1f5e9;text-decoration:none}.scroll-line{display:block;width:30px;height:1px;background:#9fc6ad}.motion-toggle{display:flex;align-items:center;gap:8px;border:1px solid #c9e1ce25;border-radius:30px;padding:6px 11px;background:#224e3d30;color:#bcd1be;font-size:10px}.motion-toggle:hover{background:#dceacc14}.motion-toggle>span{font-size:12px;line-height:1}.motion-paused *{animation-play-state:paused!important}@keyframes voice{0%,100%{transform:scaleY(.45);opacity:.45}50%{transform:scaleY(1);opacity:1}}@keyframes reminder-glow{0%,100%{background:rgba(209,238,218,.1)}50%{background:rgba(209,238,218,.2)}}
@media(min-width:1600px){.hero-frame{width:min(1280px,calc(100% - 140px))}.glass-window{padding:66px 76px}.hero-copy h1{font-size:72px}}
@media(max-width:1100px){.hero-frame{width:calc(100% - 64px)}.glass-window{padding:44px 36px;gap:12px;grid-template-columns:1.5fr 1fr}.hero-copy h1{font-size:clamp(36px,4.6vw,52px)}.hero-actions a{padding:12px 18px;gap:18px}.glass-phone{width:215px}.floating-caption{left:-8px;bottom:15px;padding:10px 14px}.hero-description{font-size:13px}.frame-index{font-size:8px}}
@media(max-width:760px){.glass-hero{min-height:auto}.hero-frame{width:calc(100% - 40px);margin:169px auto 28px}.frame-top{font-size:10px;margin-bottom:13px;padding-left:9px}.frame-index{display:none}.glass-window{grid-template-columns:1fr;padding:32px 27px 22px;border-radius:24px;gap:20px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}.hero-eyebrow{font-size:10px;margin-bottom:20px}.hero-copy h1{font-size:clamp(26px,7.8vw,54px);line-height:1.38;letter-spacing:-.04em;margin-bottom:19px}.hero-description{font-size:12px;line-height:1.95;margin-bottom:24px}.desktop-break{display:none}.hero-actions{gap:10px}.hero-actions a{font-size:11px;padding:11px 15px;gap:15px}.hero-facts{font-size:9px;margin-top:18px;gap:12px}.hero-facts span+span:before{margin-right:12px}.demo-scene{height:320px;margin:5px -5px 0}.glass-phone{height:300px;width:195px;padding:15px 18px;border-radius:28px;transform:rotate(5deg)}.assistant-mark{width:32px;height:32px;margin:22px auto 10px}.phone-question{font-size:16px;line-height:1.65}.voice-wave{height:23px;margin:12px 0}.reminder{padding:9px 10px;gap:9px;border-radius:12px}.reminder strong{font-size:14px}.reminder-icon{width:17px;height:17px;font-size:10px}.reminder small{font-size:8px}.reminder span{font-size:9px}.floating-caption{bottom:13px;left:0;padding:10px 14px;gap:9px}.floating-caption p{font-size:10px}.caption-mark{font-size:24px}.demo-label{right:8px;top:28px;font-size:8px}.hero-bottom{padding:17px 7px 0;gap:10px}.scroll-link{font-size:9px;gap:8px}.scroll-line{width:17px}.motion-toggle{font-size:9px;white-space:nowrap}.scene-video{object-position:56% center}.scene-shade{background:linear-gradient(180deg,#03252380,transparent 25%,#092c2940 60%,#102e2b)}.orbit{width:78%;left:11%;height:90%;top:3%}.orbit-two{width:66%;left:17%}}
@media(prefers-reduced-motion:reduce){.glass-hero *{animation:none!important;transition:none!important}}
@media(min-width:761px) and (max-width:900px){.hero-frame{margin-top:190px}}
@media(max-width:760px){.hero-frame{margin-top:210px}}
</style>

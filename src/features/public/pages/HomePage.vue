<script setup lang="ts">
import { ref } from 'vue';
import GlassHero from '../components/GlassHero.vue';
import LearningStage from '../components/LearningStage.vue';
import { courses, courseGroups, courseHref, displayTitle } from '../courses/catalog';
import { useScrollReveal } from '../../../lib/useScrollReveal';

const home = ref<HTMLElement>();
useScrollReveal(home);

const firstLessons = courses.slice(0, 3);
const firstQuestions = [
  '手机为什么能听懂“明天九点提醒我开会”？',
  '一句普通的话，怎么变成机器能处理的信息？',
  '聊天时的下一句话，AI 是怎么接出来的？'
];
const stages = courseGroups.map(group => ({
  ...group,
  lessons: courses.filter(course => course.groupId === group.id)
}));
</script>

<template>
  <div ref="home" class="course-home">
    <GlassHero />

    <LearningStage seamless>
    <div class="home-reading">
      <section id="first-lessons" class="first-section" aria-labelledby="first-title">
        <div class="reveal-anchor" data-reveal><div class="section-heading" data-reveal-content>
          <div>
            <p class="section-eyebrow"><span aria-hidden="true"></span> 从一件熟悉的小事开始</p>
            <h2 id="first-title">学 AI，先从这三课开始。</h2>
          </div>
          <RouterLink class="text-link" to="/learning">浏览全部 {{ courses.length }} 课 <span aria-hidden="true">↗</span></RouterLink>
        </div></div>

        <div class="first-grid">
          <div
            v-for="(lesson, index) in firstLessons"
            :key="lesson.slug"
            class="first-reveal"
            data-reveal
            :style="{ '--reveal-delay': `${index * 100}ms` }"
          >
          <RouterLink :to="courseHref(lesson)" class="first-card" data-reveal-content>
            <div class="lesson-top">
              <span class="lesson-number">0{{ lesson.number }}</span>
              <span class="lesson-label">第 {{ lesson.number }} 课 <i aria-hidden="true">·</i> 约 {{ lesson.minutes }} 分钟</span>
            </div>
            <h3>{{ displayTitle(lesson) }}</h3>
            <p>{{ firstQuestions[index] }}</p>
            <span class="read-link">开始阅读 <span class="read-arrow" aria-hidden="true">↗</span></span>
          </RouterLink>
          </div>
        </div>
      </section>

      <section id="learning-map" class="route-section" aria-labelledby="route-title">
        <div class="reveal-anchor" data-reveal><div class="section-heading" data-reveal-content>
          <div>
            <p class="section-eyebrow">一条从入门到动手的路线</p>
            <h2 id="route-title">理解一点，再往前一步。</h2>
          </div>
          <p class="route-note">按顺序慢慢学，<br>也可以从你感兴趣的地方开始。</p>
        </div></div>

        <div class="route-grid">
          <div
            v-for="(stage, index) in stages"
            :key="stage.id"
            class="route-reveal"
            data-reveal
            :style="{ '--reveal-delay': `${index % 2 * 90}ms` }"
          >
          <RouterLink :to="{ path: '/learning', query: { group: stage.id } }" class="route-row" data-reveal-content>
            <span class="route-number">{{ String(index + 1).padStart(2, '0') }}</span>
            <div class="route-copy">
              <div class="route-title-row"><h3>{{ stage.name }}</h3><span>{{ stage.lessons.length }} 课</span></div>
              <p>{{ stage.note }}</p>
            </div>
            <span class="route-arrow" aria-hidden="true">↗</span>
          </RouterLink>
          </div>
        </div>
      </section>

      <div class="reveal-anchor" data-reveal><aside class="course-note" aria-labelledby="note-title" data-reveal-content>
        <div class="note-mark" aria-hidden="true">a<span>i</span><svg viewBox="0 0 60 10" fill="none"><path d="M2 7C17 1 39 1 58 5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" /></svg></div>
        <div class="note-copy">
          <p class="note-eyebrow">写给每一个对 AI 好奇的人</p>
          <h2 id="note-title">不用先懂技术，也能读懂 AI。</h2>
          <p>用生活中的例子，讲清楚复杂的概念。每课有故事、有解释，也留一个问题给你想一想。</p>
          <span class="free-note"><span aria-hidden="true">✓</span> 全部课程免费阅读，无需注册。</span>
        </div>
        <RouterLink class="note-link" to="/learning/ai-is-not-mysterious">从第一课出发 <span aria-hidden="true">→</span></RouterLink>
      </aside></div>
    </div>
    </LearningStage>
  </div>
</template>

<style scoped>
.course-home{width:100%;background:transparent;color:var(--course-text)}
.home-reading{position:relative;z-index:1;max-width:1180px;margin:0 auto;padding:48px 32px 72px}
.reveal-anchor{display:flow-root}.first-reveal,.route-reveal{display:grid;min-width:0}
.section-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:28px;margin-bottom:30px}
.section-eyebrow{display:flex;align-items:center;gap:9px;color:var(--course-muted);font-size:12px;line-height:1.6;letter-spacing:.04em;margin:0 0 12px}
.section-eyebrow>span{width:6px;height:6px;flex-shrink:0;border-radius:50%;background:var(--course-accent)}
.section-heading h2{font-family:system-ui,'PingFang SC','Microsoft YaHei',sans-serif;font-size:clamp(27px,3vw,35px);font-weight:700;letter-spacing:-.04em;line-height:1.4;margin:0}
.text-link{display:inline-flex;align-items:center;gap:18px;flex-shrink:0;padding-bottom:6px;font-size:13px;color:var(--course-link);text-decoration:none}
.text-link:hover{color:var(--course-accent);text-decoration:underline;text-underline-offset:5px}
.first-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.first-card{display:flex;flex-direction:column;min-height:273px;padding:28px 28px 22px;background:var(--course-panel);border:1px solid var(--course-line);border-radius:10px;color:inherit;text-decoration:none;box-shadow:inset 0 1px 0 rgba(236,250,236,.035);transition:background .2s,border-color .2s}
.first-card:hover{background:var(--course-panel-strong);border-color:rgba(218,239,222,.4);text-decoration:none}
.lesson-top{display:flex;align-items:center;justify-content:space-between;gap:12px}
.lesson-number{font:400 35px/1 Georgia,serif;letter-spacing:-.05em;color:var(--course-accent)}
.lesson-label{font-size:11px;color:var(--course-muted);white-space:nowrap}
.lesson-label i{font-style:normal;margin:0 6px;color:var(--course-faint)}
.first-card h3{font-size:21px;line-height:1.5;font-weight:600;letter-spacing:-.03em;margin:26px 0 10px}
.first-card p{color:var(--course-copy);font-size:14px;line-height:1.9;margin:0 0 26px;max-width:250px}
.read-link{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:14px;border-top:1px solid var(--course-line);color:var(--course-link);font-size:12px}
.read-arrow{font-size:20px;line-height:1;color:var(--course-link)}
.route-section{padding-top:78px;scroll-margin-top:100px}
.route-note{font-size:12px;line-height:1.9;color:var(--course-muted);margin:0 0 4px}
.route-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:64px;border-bottom:1px solid var(--course-line)}
.route-row{display:flex;align-items:center;gap:22px;padding:25px 0;border-top:1px solid var(--course-line);color:inherit;text-decoration:none;min-width:0}
.route-row:hover{text-decoration:none}
.route-number{font:italic 24px/1 Georgia,serif;color:var(--course-faint);flex-shrink:0;min-width:29px}
.route-copy{flex:1;min-width:0}
.route-title-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.route-title-row h3{font-size:16px;font-weight:600;line-height:1.6;margin:0;transition:color .2s}
.route-title-row>span{font-size:11px;white-space:nowrap;color:var(--course-faint)}
.route-copy p{color:var(--course-muted);font-size:12px;line-height:1.8;margin:5px 0 0}
.route-arrow{color:var(--course-link);font-size:18px;flex-shrink:0;margin-left:4px;transition:transform .2s}
.route-row:hover h3{color:var(--course-accent)}
.route-row:hover .route-arrow{transform:translate(2px,-2px)}
.course-note{position:relative;display:flex;align-items:center;gap:30px;padding:35px 38px;margin-top:64px;background:var(--course-panel-strong);border:1px solid var(--course-line);border-radius:10px}
.note-mark{position:relative;font:italic 64px/.95 Georgia,serif;color:var(--course-accent);letter-spacing:-7px;width:70px;flex-shrink:0;transform:rotate(-8deg);padding-bottom:15px}
.note-mark>span{color:var(--course-link)}
.note-mark svg{position:absolute;width:60px;height:10px;bottom:0;left:-3px}
.note-copy{flex:1;min-width:0}
.note-eyebrow{font-size:11px;color:var(--course-muted);margin:0 0 7px}
.note-copy h2{font-family:system-ui,'PingFang SC','Microsoft YaHei',sans-serif;font-size:24px;line-height:1.5;letter-spacing:-.03em;margin:0 0 9px}
.note-copy>p:not(.note-eyebrow){font-size:13px;line-height:1.9;color:var(--course-copy);margin:0;max-width:580px}
.free-note{display:block;color:var(--course-link);font-size:11px;line-height:1.8;margin-top:12px}
.free-note>span{margin-right:5px}
.note-link{display:inline-flex;align-items:center;gap:22px;white-space:nowrap;font-size:12px;color:var(--course-link);padding:12px 0;text-decoration:none}
.note-link:hover{text-decoration:underline;text-underline-offset:5px}
@media(max-width:960px){.home-reading{padding:60px 28px}.first-grid{gap:15px}.first-card{padding:24px 22px;min-height:280px}.lesson-top{align-items:flex-start;gap:10px}.lesson-label{font-size:10px}.lesson-number{font-size:31px}.route-grid{column-gap:32px}.route-row{gap:16px}.course-note{padding:30px 28px;gap:24px}.note-link{gap:12px}}
@media(max-width:720px){.home-reading{padding:43px 22px 44px}.section-heading{align-items:flex-start;gap:18px;margin-bottom:24px}.section-heading h2{font-size:27px}.section-eyebrow{font-size:11px;margin-bottom:10px}.text-link{font-size:11px;gap:6px;align-self:flex-end;padding-bottom:3px}.first-grid{grid-template-columns:1fr;gap:14px}.first-card{min-height:0;padding:22px 24px 20px}.lesson-number{font-size:31px}.lesson-label{font-size:11px}.first-card h3{font-size:22px;margin:19px 0 8px}.first-card p{max-width:none;margin-bottom:20px}.read-link{padding-top:13px}.route-section{padding-top:48px}.route-section .section-heading{display:block}.route-note{font-size:11px;margin-top:13px}.route-note br{display:none}.route-grid{grid-template-columns:1fr}.route-row{padding:21px 0;gap:19px}.route-title-row h3{font-size:16px}.route-copy p{font-size:12px}.course-note{position:relative;margin-top:40px;display:block;padding:29px 25px}.note-mark{font-size:45px;width:54px;position:absolute;right:22px;top:27px;opacity:.55}.note-mark svg{width:44px}.note-copy{position:relative}.note-eyebrow{padding-right:45px}.note-copy h2{font-size:24px;max-width:250px;line-height:1.6}.note-copy>p:not(.note-eyebrow){max-width:none}.note-link{margin-top:17px;gap:25px;padding:0}.free-note{font-size:11px}}
@media(prefers-reduced-motion:reduce){.first-card,.route-arrow,.route-title-row h3{transition:none}.first-card:hover{transform:none}.route-row:hover .route-arrow{transform:none}}
</style>

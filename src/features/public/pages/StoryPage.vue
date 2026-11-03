<script setup lang="ts">
import { ref } from 'vue';
import ProfileHero from '../components/ProfileHero.vue';
import ProfileProjectCard from '../components/ProfileProjectCard.vue';
import ProfileSkillTags from '../components/ProfileSkillTags.vue';
import ProfileTimeline from '../components/ProfileTimeline.vue';
import LearningStage from '../components/LearningStage.vue';
import SocialLinks from '../components/SocialLinks.vue';
import { resumeCertificates, resumeProjectCards, resumeQualifications, resumeSkillGroups, resumeTimelineSections } from '../profile-resume-data';
import { useScrollReveal } from '../../../lib/useScrollReveal';

const page = ref<HTMLElement>();
useScrollReveal(page);
</script>

<template>
  <LearningStage>
    <div ref="page" class="resume-page">
      <ProfileHero />

      <div id="profile-experience" class="reveal-anchor" data-reveal>
        <div data-reveal-content><ProfileTimeline :sections="resumeTimelineSections" /></div>
      </div>

      <div class="reveal-anchor" data-reveal>
        <div data-reveal-content><ProfileSkillTags :groups="resumeSkillGroups" /></div>
      </div>

      <div class="reveal-anchor" data-reveal>
        <section class="projects" aria-labelledby="projects-heading" data-reveal-content>
          <div class="section-head">
            <p class="eyebrow">做过的事，正在做的事</p>
            <h2 id="projects-heading">项目与作品</h2>
            <p>从需求梳理到功能验收，记录我参与的应用开发、仿真与工业软件项目。</p>
          </div>
          <div class="project-grid">
            <ProfileProjectCard v-for="project in resumeProjectCards" :key="project.title" :project="project" />
          </div>
        </section>
      </div>

      <div class="reveal-anchor" data-reveal>
        <section class="certificate" aria-labelledby="certificates-heading" data-reveal-content>
          <div class="section-head">
            <p class="eyebrow">工作中的一些肯定</p>
            <h2 id="certificates-heading">证书与荣誉</h2>
            <p>几段工作经历中留下的荣誉，也提醒我认真对待每一件具体的事。</p>
          </div>
          <div class="qualifications" aria-label="资格证书"><span v-for="qualification in resumeQualifications" :key="qualification">{{ qualification }}</span></div>
          <div class="certificate-grid">
            <article v-for="certificate in resumeCertificates" :key="certificate.image" class="certificate-card">
              <a :href="certificate.image" target="_blank" rel="noreferrer" :aria-label="'查看' + certificate.alt + '原图（新窗口）'">
                <img :src="certificate.image" :alt="certificate.alt" loading="lazy" decoding="async" />
                <span class="image-action" aria-hidden="true">查看原图 ↗</span>
              </a>
              <div class="certificate-copy">
                <span class="certificate-year">{{ certificate.year }}</span>
                <h3>{{ certificate.title }}</h3>
                <strong>{{ certificate.issuer }}</strong>
                <p>{{ certificate.description }}</p>
              </div>
            </article>
          </div>
        </section>
      </div>

      <div class="reveal-anchor" data-reveal>
        <section class="profile-invitation" aria-labelledby="invitation-heading" data-reveal-content>
          <div><p class="eyebrow">一起，从一个小问题开始</p><h2 id="invitation-heading">如果你也对 AI 感兴趣。</h2><p>从生活里熟悉的例子入门，慢慢理解它，再用它做出自己的东西。</p></div>
          <RouterLink to="/learning">去课程目录看看 <span aria-hidden="true">↗</span></RouterLink>
        </section>
      </div>

      <div id="find-me" class="reveal-anchor" data-reveal>
        <div data-reveal-content><SocialLinks /></div>
      </div>
    </div>
  </LearningStage>
</template>

<style scoped>
.resume-page{max-width:1180px;margin:0 auto;padding:48px 32px 72px;color:var(--course-text)}
.resume-page>.reveal-anchor{margin-top:40px;display:flow-root;scroll-margin-top:32px}
.section-head{margin-bottom:24px}
.section-head h2,.profile-invitation h2{margin:8px 0 12px;font-size:clamp(24px,3.2vw,34px);line-height:1.5;font-weight:600;letter-spacing:-.02em}
.section-head p:last-child,.profile-invitation p:last-child{max-width:720px;margin:0;color:var(--course-muted);font-size:14px;line-height:1.9}
.eyebrow{margin:0;color:var(--course-link);font-size:12px;letter-spacing:.06em}
.project-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.certificate{padding:30px;border:1px solid var(--course-line);border-radius:24px;background:var(--course-panel)}
.certificate-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}
.qualifications{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 24px}
.qualifications>span{padding:7px 12px;border:1px solid var(--course-line);border-radius:24px;background:var(--course-panel-strong);color:var(--course-link);font-size:12px}
.certificate-card{min-width:0;overflow:hidden;border:1px solid var(--course-line);border-radius:18px;background:var(--course-panel)}
.certificate-card>a{position:relative;display:block;padding:20px;background:var(--course-panel-strong)}
.certificate-card img{display:block;width:100%;aspect-ratio:4/3;object-fit:contain;border-radius:6px}
.image-action{position:absolute;bottom:10px;right:12px;padding:4px 9px;border:1px solid var(--course-line);border-radius:20px;background:var(--course-bg-deep);color:var(--course-muted);font-size:10px}
.certificate-copy{padding:22px}
.certificate-year{display:inline-flex;margin:0 0 12px;color:var(--course-link);font-size:12px}
.certificate-card h3{margin:0 0 8px;font-size:21px;font-weight:600}
.certificate-card strong{display:block;margin-bottom:10px;color:var(--course-copy);font-size:13px;font-weight:500;overflow-wrap:anywhere}
.certificate-card p{margin:0;color:var(--course-muted);font-size:13px;line-height:1.9}
.profile-invitation{display:flex;align-items:center;justify-content:space-between;gap:28px;padding:36px 0 0;border-top:1px solid var(--course-line)}
.profile-invitation>a{display:inline-flex;align-items:center;flex-shrink:0;gap:26px;padding:11px 18px;border:1px solid var(--course-line);border-radius:30px;background:var(--course-panel);color:var(--course-link);font-size:13px}
@media(max-width:920px){.project-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:720px){.resume-page{padding:32px 22px 48px}.resume-page>.reveal-anchor{margin-top:30px}.certificate{padding:22px}.certificate-grid{grid-template-columns:1fr}.profile-invitation{align-items:flex-start;flex-direction:column;padding-top:28px}}
@media(max-width:480px){.project-grid{grid-template-columns:1fr}.certificate{padding:18px}.certificate-card>a{padding:14px}.certificate-copy{padding:18px}.profile-invitation>a{width:100%;justify-content:space-between}}
</style>

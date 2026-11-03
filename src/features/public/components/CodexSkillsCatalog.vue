<script setup lang="ts">
import { codexSkillCount, codexSkillGroups } from '../codex-skills-catalog';

function skillDownloadPath(skill: string) {
  return `/downloads/ai-skills/singles/${skill}.zip`;
}
</script>

<template>
  <section class="skills-catalog" aria-label="Codex Skills 清单">
    <header class="catalog-head">
      <p class="eyebrow">AI Skills</p>
      <h2>Codex Skills 清单</h2>
      <p>共 {{ codexSkillCount }} 个个人 Skills，可单独下载，也可以下载整组压缩包。</p>
    </header>
    <div class="catalog-grid">
      <article v-for="group in codexSkillGroups" :key="group.title" class="catalog-card">
        <div class="card-top">
          <h3>{{ group.title }}</h3>
          <span class="count">{{ group.skills.length }}</span>
        </div>
        <p class="description">{{ group.description }}</p>
        <ul class="skill-list">
          <li v-for="skill in group.skills" :key="skill">
            <a class="skill-download" :href="skillDownloadPath(skill)" :download="skill + '.zip'" :aria-label="'下载 ' + skill + ' Skill'">
              <code>{{ skill }}</code><span aria-hidden="true">↓</span>
            </a>
          </li>
        </ul>
        <a class="download-button" :href="group.download" :download="group.filename">下载本组 ZIP <span aria-hidden="true">↓</span></a>
      </article>
    </div>
    <p class="inventory-note">清单根据 2026 年 10 月 7 日本机文件夹盘点整理。</p>
  </section>
</template>

<style scoped>
.skills-catalog{margin:26px 0 34px;padding:24px;border:1px solid var(--line);border-radius:20px;background:rgb(255 255 255 / 65%)}.catalog-head{margin-bottom:20px}.eyebrow{margin:0;color:var(--accent);font-size:13px;font-weight:700}.catalog-head h2{margin:4px 0 8px;font-size:clamp(24px,3vw,32px)}.catalog-head>p:last-child,.description{color:var(--muted);line-height:1.7}.catalog-head>p:last-child{margin:0}.catalog-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.catalog-card{display:flex;min-width:0;flex-direction:column;padding:18px;border:1px solid var(--line);border-radius:16px;background:var(--paper)}.card-top{display:flex;align-items:center;justify-content:space-between;gap:12px}.card-top h3{margin:0;font-size:17px}.count{display:inline-flex;min-width:28px;height:28px;align-items:center;justify-content:center;border-radius:999px;background:var(--accent-soft);color:var(--accent);font-size:13px;font-weight:700}.description{margin:10px 0 12px;font-size:13px}.skill-list{display:flex;flex-wrap:wrap;gap:7px;margin:0;padding:0;list-style:none}.skill-download{display:inline-flex;max-width:100%;align-items:center;gap:5px;padding:5px 8px;border-radius:8px;background:color-mix(in srgb,var(--accent-soft) 62%,white);color:var(--ink);text-decoration:none}.skill-download code{max-width:100%;overflow-wrap:anywhere;font-size:12px}.skill-download span{flex:0 0 auto;color:var(--accent);font-size:12px;font-weight:700}.skill-download:hover{background:var(--accent-soft);outline:1px solid color-mix(in srgb,var(--accent) 35%,transparent)}.download-button{display:inline-flex;min-height:42px;align-items:center;justify-content:center;gap:8px;align-self:flex-start;margin-top:18px;padding:9px 14px;border-radius:10px;background:var(--accent);color:white;font-weight:700;text-decoration:none}.download-button:hover{filter:brightness(.94)}@media(max-width:640px){.skills-catalog{padding:18px}.catalog-grid{grid-template-columns:1fr}}
</style>

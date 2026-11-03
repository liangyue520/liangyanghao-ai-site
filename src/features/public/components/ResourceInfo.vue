<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue';
import type { PublicDetail } from '../../../../shared/contracts';
import { externalUrl, resourceDownload } from '../api';
const props = defineProps<{ content: PublicDetail }>();
const resource = computed(() => props.content.resource);
const url = computed(() => resourceDownload(props.content));
const busy = ref(false), message = ref('');
let controller: AbortController | undefined;
onScopeDispose(() => controller?.abort());
async function download() {
  if (!url.value || busy.value) return;
  busy.value = true; message.value = '';
  controller = new AbortController();
  const timeout = setTimeout(() => controller?.abort(), 120000);
  try {
    const response = await fetch(url.value, {credentials:'same-origin',cache:'no-store',signal:controller.signal});
    if (!response.ok) { message.value = response.status === 404 ? '文件暂时无法下载，可能已不再公开。' : '下载未完成，请稍后重试。'; return; }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const plain = disposition.match(/filename="([^"]+)"/i)?.[1];
    let name = plain || '资源文件';
    if (encoded) { try { name = decodeURIComponent(encoded); } catch { /* Use safe fallback. */ } }
    link.download = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_');
    link.href = objectUrl; link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    message.value = '文件已交给浏览器，请查看下载记录。';
  } catch { message.value = '下载中断，请检查网络后重试。'; }
  finally { clearTimeout(timeout); busy.value = false; }
}
</script>
<template>
  <section v-if="resource" class="resource" aria-label="资源来源与使用说明">
    <h2>来源与使用</h2><dl>
      <dt>作者</dt><dd>{{ resource.author || '作者信息暂未提供' }}</dd>
      <dt>来源</dt><dd><a v-if="externalUrl(resource.sourceUrl)" :href="externalUrl(resource.sourceUrl)" target="_blank" rel="noopener noreferrer">{{ resource.sourceUrl }} <span>（新窗口）</span></a><span v-else>来源信息暂未提供</span></dd>
      <dt>许可</dt><dd>{{ resource.licenseName || '未提供许可证名称，具体使用范围请查阅授权说明与来源页面。' }}</dd>
      <dt>再分发</dt><dd>{{ resource.redistribution === 'allowed' ? '允许（以授权说明为准）' : resource.redistribution === 'forbidden' ? '不允许再分发' : '尚未明确' }}</dd>
      <template v-if="resource.permissionNote"><dt>授权说明</dt><dd>{{ resource.permissionNote }}</dd></template>
      <template v-if="resource.versionLabel"><dt>版本</dt><dd>{{ resource.versionLabel }}</dd></template>
      <template v-if="resource.modificationNote"><dt>修改说明</dt><dd>{{ resource.modificationNote }}</dd></template>
    </dl>
    <h3>使用说明</h3><p class="text">{{ resource.usageInstructions || '使用说明暂未提供。' }}</p><p class="hint">免费使用不代表允许商用或再次分发，请遵循作者的许可说明。</p>
    <template v-if="resource.mode === 'external'"><a v-if="externalUrl(resource.sourceUrl)" class="action" :href="externalUrl(resource.sourceUrl)" target="_blank" rel="noopener noreferrer">前往来源页面（新窗口） ↗</a><p class="hint">本站仅提供来源入口。若链接失效，请稍后再试。</p></template>
    <template v-else><button v-if="url" :disabled="busy" @click="download">{{ busy ? '正在下载……' : '下载资源' }}</button><p v-else class="hint">资源文件暂时无法下载。</p></template>
    <p v-if="message" role="status">{{ message }}</p>
  </section><p v-else role="status">资源说明暂时无法显示。</p>
</template>
<style scoped>.resource{border-top:1px solid var(--line);margin-top:28px;padding-top:16px}dl{display:grid;grid-template-columns:5em 1fr;gap:12px 16px}dt{color:var(--muted)}dd{margin:0;overflow-wrap:anywhere;white-space:pre-wrap}a{color:var(--accent);text-decoration:underline}.text{white-space:pre-wrap}.hint{color:var(--muted);font-size:14px}.action{display:inline-block;padding:12px 0;min-height:44px}button{min-height:44px}@media(max-width:400px){dl{grid-template-columns:1fr;gap:4px}dd{margin-bottom:12px}}</style>

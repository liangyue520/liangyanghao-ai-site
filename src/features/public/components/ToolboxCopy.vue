<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PublicDetail } from '../../../../shared/contracts';
import { toolboxCopyText } from '../api';
const props = defineProps<{ content: PublicDetail }>();
const text = computed(() => toolboxCopyText(props.content));
const message = ref('');
async function copy() {
  message.value = '';
  if (!text.value) { message.value = '这段正文暂不提供复制，请直接阅读页面内容。'; return; }
  try { await navigator.clipboard.writeText(text.value); message.value = '已复制公开正文片段。'; }
  catch { message.value = '复制未完成，请手动选择页面中的公开正文。'; }
}
</script>
<template>
  <section class="copy" aria-label="复制公开正文">
    <h2>复制提示</h2>
    <p>只复制本页公开正文，不包含后台字段、附件内部路径、原件地址或错误日志。</p>
    <button type="button" :disabled="!text" @click="copy">复制公开正文</button>
    <p v-if="message" role="status">{{ message }}</p>
  </section>
</template>
<style scoped>
.copy{border-top:1px solid var(--line);margin-top:28px;padding-top:16px}.copy p{color:var(--muted);line-height:1.8}button{min-height:44px}
</style>

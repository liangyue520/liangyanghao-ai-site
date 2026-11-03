<script setup lang="ts">
import {ref} from 'vue';import {request} from '../../lib/request';
defineProps<{title:string;owner:string}>();const status=ref('尚未检查');async function check(){try{const r=await request<{status:string;contractVersion:string}>('/api/v1/health');status.value=`基础接口可用 · ${r.contractVersion}`;}catch(e){status.value=e instanceof Error?e.message:'请求失败';}}
</script>
<template><section class="card"><span class="eyebrow">E01 · 工程骨架</span><h1>{{ title }}</h1><p class="notice">本页是 {{ owner }} 的开发占位，尚未实现业务内容。</p><p class="muted">当前结论：基础工程已接入。下一步：由对应任务开发此页面。这里没有模拟日记或虚构个人资料。</p><button @click="check">检查基础连接</button><p role="status">{{ status }}</p></section></template>

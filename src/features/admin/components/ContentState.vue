<script setup lang="ts">
import type {AdminDetail,AdminSummary} from '../../../../shared/contracts';
import {statusLabels} from '../api';
defineProps<{content:AdminDetail|AdminSummary|null;dirty?:boolean;busy?:boolean;uncertain?:boolean}>();
</script>
<template><div class="states" aria-live="polite"><span><small>保存</small><strong>{{busy?'处理中…':uncertain?'结果待核实':dirty?'有未保存修改':content?'已保存':'尚未保存'}}</strong></span><span><small>目前谁能看</small><strong>{{uncertain?'操作结果待核实':content&&!content.deletedAt&&content.status==='published'&&content.visibility==='public'?'所有访客':'仅站主'}}</strong></span><span><small>发布</small><strong>{{uncertain?'操作结果待核实':content?.deletedAt?'已软删除':content?statusLabels[content.status]:'未发布'}}</strong></span><span><small>保存的可见性</small><strong>{{content?.visibility==='public'?'公开（发布后生效）':'私密'}}</strong></span></div></template>
<style scoped>.states{display:flex;flex-wrap:wrap;gap:12px;margin:20px 0}.states>span{flex:1;min-width:130px;background:var(--accent-soft);border-radius:10px;padding:12px 16px}small,strong{display:block}small{color:var(--muted);font-size:12px}strong{font-size:15px}</style>

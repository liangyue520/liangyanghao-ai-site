<script setup lang="ts">
import {computed,ref,watch} from 'vue';
import type {ContentEdit} from '../../../../shared/contracts';
import {analyzeToolboxRelease,applySkillTemplate,toolboxCategories} from '../api';
const props=defineProps<{modelValue:ContentEdit;disabled?:boolean}>();
const emit=defineEmits<{'update:modelValue':[ContentEdit]}>();
const warningAccepted=defineModel<boolean>('warningAccepted',{default:false});
const scan=computed(()=>analyzeToolboxRelease(props.modelValue));
const active=computed(()=>toolboxCategories.includes(props.modelValue.category as typeof toolboxCategories[number]));
const lastScan=ref('');
watch(()=>[props.modelValue.bodyText,props.modelValue.title,props.modelValue.summary,props.modelValue.category,props.modelValue.resource,props.modelValue.media],()=>{const next=JSON.stringify(scan.value);if(next!==lastScan.value){warningAccepted.value=false;lastScan.value=next;}},{deep:true});
function patch(next:Partial<ContentEdit>){emit('update:modelValue',{...props.modelValue,...next});}
function category(value:string){patch({category:value||null});}
function template(){const next={...props.modelValue,resource:props.modelValue.resource?{...props.modelValue.resource}:null,media:[...props.modelValue.media]};emit('update:modelValue',applySkillTemplate(next));}
</script>
<template><section class="toolbox"><h2>AI 工具箱</h2><label>工具箱固定分类<select :disabled="disabled" :value="modelValue.category||''" @change="category(($event.target as HTMLSelectElement).value)"><option value="">普通资源，不进入工具箱</option><option v-for="item in toolboxCategories" :key="item" :value="item">{{item}}</option></select></label><p class="muted">只有固定分类内的公开资源会进入 /toolbox。标签写在 Markdown 正文里，本轮不做真实标签筛选。</p><button type="button" class="quiet" :disabled="disabled" @click="template">套用 Skill Markdown 结构</button><div v-if="active" class="checks"><h3>发布前检查</h3><p class="notice">阻止项不能公开发布。WARNING 需要你明确确认后再发布；自动扫描不能替代人工判断。</p><div v-if="scan.blockers.length" role="alert" class="block"><strong>阻止公开发布</strong><ul><li v-for="item in scan.blockers" :key="item">{{item}}</li></ul></div><div v-if="scan.warnings.length" class="warn"><strong>需要确认</strong><ul><li v-for="item in scan.warnings" :key="item">{{item}}</li></ul><label class="check"><input v-model="warningAccepted" :disabled="disabled" type="checkbox">我已核对 WARNING，确认可按当前范围公开</label></div><p v-if="!scan.blockers.length&&!scan.warnings.length" class="notice">当前未发现阻止项或 WARNING，发布前仍请人工核对。</p></div></section></template>
<style scoped>.toolbox{border:1px solid var(--line);border-radius:8px;padding:16px;margin:20px 0}label{display:grid;gap:6px;margin:12px 0}.checks{margin-top:16px}.block,.warn{border-left:4px solid var(--danger);padding:10px 12px;margin:12px 0;background:rgba(176,58,46,.08)}.warn{border-left-color:var(--accent);background:rgba(75,110,135,.08)}ul{margin:8px 0 0;padding-left:20px}.check{display:flex;align-items:center;gap:8px}button{margin-top:8px}</style>

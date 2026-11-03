<script setup lang="ts">
import { computed } from 'vue';
const props=defineProps<{ page: number; pageSize: number; total: number; busy?: boolean }>();
defineEmits<{ change: [page: number] }>();
const pageCount=computed(()=>Math.ceil(props.total/props.pageSize));
const pageNumbers=computed(()=>Array.from({length:pageCount.value},(_,index)=>index+1));
</script>
<template>
  <nav v-if="total > pageSize || page > 1" class="pages" aria-label="内容分页">
    <div class="page-controls">
      <button :disabled="busy || page <= 1" @click="$emit('change', page - 1)">上一页</button>
      <span aria-live="polite">第 {{ page }} / {{ pageCount }} 页</span>
      <button :disabled="busy || page >= pageCount" @click="$emit('change', page + 1)">下一页</button>
    </div>
    <div class="page-numbers" aria-label="跳转到指定页">
      <button v-for="number in pageNumbers" :key="number" :aria-label="`第 ${number} 页`" :aria-current="number === page ? 'page' : undefined" :disabled="busy || number === page" @click="$emit('change', number)">{{ number }}</button>
    </div>
  </nav>
</template>
<style scoped>
.pages{display:grid;gap:12px;margin:28px 0;font-size:14px}
.page-controls{display:flex;justify-content:space-between;align-items:center;gap:8px}
.page-controls button{padding:10px 14px;min-height:44px}
.page-controls span{white-space:nowrap}
.page-numbers{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
.page-numbers button{min-width:40px;min-height:40px;padding:8px}
.page-numbers button[aria-current="page"]{background:var(--accent);color:var(--surface);font-weight:700}
button:disabled{cursor:default}
</style>

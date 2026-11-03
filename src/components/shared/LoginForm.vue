<script setup lang="ts">
import {ref} from 'vue';import {useRouter} from 'vue-router';import {login} from '../../lib/session';
const username=ref(''),password=ref(''),error=ref(''),busy=ref(false),router=useRouter();async function submit(){busy.value=true;error.value='';try{await login(username.value,password.value);password.value='';await router.push('/admin/contents');}catch(e){error.value=e instanceof Error?e.message:'登录失败';}finally{busy.value=false;}}
</script>
<template><section class="card login"><span class="eyebrow">站主管理 · 本地测试</span><h1>登录管理区</h1><p class="muted">仅使用本环境的隔离测试身份。内容管理由 04 后续开发。</p><form @submit.prevent="submit"><label>用户名<input v-model="username" name="username" autocomplete="username" required maxlength="64"></label><label>密码<input v-model="password" name="password" type="password" autocomplete="current-password" required minlength="12" maxlength="128"></label><p v-if="error" role="alert" class="error">{{ error }}</p><button :disabled="busy">{{ busy?'正在登录…':'登录' }}</button></form></section></template>
<style scoped>.login{max-width:560px;margin:auto}label{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}form{margin-top:24px}</style>

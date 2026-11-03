<script setup lang="ts">
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import {login} from '../../../lib/session';
import {errorMessage} from '../api';
const username=ref(''),password=ref(''),error=ref(''),busy=ref(false),router=useRouter();
const passwordVisible=ref(false);
async function submit(){if(busy.value)return;busy.value=true;error.value='';try{await login(username.value,password.value);password.value='';await router.push('/admin/contents');}catch(e){error.value=errorMessage(e);}finally{busy.value=false;}}
</script>
<template><section class="card login"><span class="eyebrow">站主管理</span><h1>回到你的记录</h1><p class="muted">登录后整理日记、视频和作品。新内容先保存为私密草稿，由你决定何时公开。</p><form @submit.prevent="submit"><label>用户名<input v-model="username" autocomplete="username" required maxlength="64"></label><div class="password-field"><label for="login-password">密码</label><div class="password-control"><input id="login-password" v-model="password" :type="passwordVisible?'text':'password'" autocomplete="current-password" required minlength="12" maxlength="128"><button type="button" class="password-toggle" :aria-label="passwordVisible?'隐藏密码':'显示密码'" :aria-pressed="passwordVisible" aria-controls="login-password" @click="passwordVisible=!passwordVisible">{{passwordVisible?'隐藏':'显示'}}</button></div></div><p v-if="error" role="alert" class="error">{{error}}</p><button :disabled="busy">{{busy?'正在登录…':'登录管理区'}}</button></form></section></template>
<style scoped>.login{max-width:560px;margin:auto}form{display:grid;gap:20px;margin-top:28px}label,.password-field{display:grid;gap:8px}.password-control{position:relative;min-width:0}.password-control input{width:100%;padding-right:72px}.password-toggle{position:absolute;right:4px;top:50%;transform:translateY(-50%);min-width:60px;min-height:40px;padding:6px 10px;background:transparent;color:var(--accent);font-size:14px}.password-toggle:hover{background:var(--accent-soft)}</style>

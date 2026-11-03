import {ref} from 'vue';import type {SessionData} from '../../shared/contracts';import {request,setCsrfToken,ApiError} from './request';
export const session=ref<SessionData|null>(null);
window.addEventListener('session-expired',()=>{session.value=null;});
export async function loadSession(){try{session.value=await request<SessionData>('/api/v1/auth/session');setCsrfToken(session.value.csrfToken);return session.value;}catch(e){if(e instanceof ApiError&&e.status===401){session.value=null;setCsrfToken(null);return null;}throw e;}}
export async function login(username:string,password:string){const result=await request<SessionData>('/api/v1/auth/login',{method:'POST',body:{username,password},skipCsrf:true});session.value=result;setCsrfToken(result.csrfToken);return result;}
export async function logout(){await request('/api/v1/auth/logout',{method:'POST',body:{}});session.value=null;setCsrfToken(null);}

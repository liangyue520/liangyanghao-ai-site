import type {ApiSuccess,ApiFailure} from '../../shared/contracts';
let csrfToken:string|null=null;
export function setCsrfToken(token:string|null){csrfToken=token;}
export class ApiError extends Error{constructor(public status:number,public code:string,message:string,public fields:{path:string;message:string}[]=[],public requestId=''){super(message);}}
export interface RequestOptions extends Omit<RequestInit,'body'>{body?:unknown;revision?:number;idempotencyKey?:string;skipCsrf?:boolean}

// A transient connection drop should not force the user to repeat an action.
// Five retries are bounded and use full jitter so multiple clients do not retry
// at the same instant. Writes are retried only when an idempotency key is present.
const envInteger=(value:unknown,fallback:number,min:number,max:number)=>{
 const parsed=typeof value==='string'&&/^\d+$/.test(value)?Number(value):NaN;
 return Number.isSafeInteger(parsed)?Math.max(min,Math.min(max,parsed)):fallback;
};
export const MAX_RETRIES=envInteger(import.meta.env.VITE_REQUEST_MAX_RETRIES,5,0,10);
const RETRY_BASE_MS=envInteger(import.meta.env.VITE_REQUEST_RETRY_BASE_MS,250,50,5000);
const RETRY_MAX_MS=envInteger(import.meta.env.VITE_REQUEST_RETRY_MAX_MS,4000,RETRY_BASE_MS,30000);
const sleep=(ms:number,signal?:AbortSignal|null)=>new Promise<void>((resolve,reject)=>{
 if(!signal){setTimeout(resolve,ms);return;}
 let timer:ReturnType<typeof setTimeout>;
 const cleanup=()=>signal.removeEventListener('abort',abort);
 const abort=()=>{clearTimeout(timer);cleanup();reject(signal.reason instanceof Error?signal.reason:Error('请求已取消'));};
 if(signal.aborted){abort();return;}
 timer=setTimeout(()=>{cleanup();resolve();},ms);signal.addEventListener('abort',abort,{once:true});
});
const retryableStatus=(status:number)=>status===408||status===425||status===429||status===500||status===502||status===503||status===504;
const retryableMethod=(method:string,idempotencyKey?:string)=>['GET','HEAD','OPTIONS'].includes(method)||!!idempotencyKey;
const retryDelay=(retry:number,retryAfter?:string|null)=>{
 const serverDelay=retryAfter?Number(retryAfter)*1000:NaN;
 const cap=Math.min(RETRY_MAX_MS,RETRY_BASE_MS*2**retry);
 return Number.isFinite(serverDelay)?Math.min(RETRY_MAX_MS,Math.max(0,serverDelay)):Math.floor(Math.random()*(cap+1));
};
const isAbort=(error:unknown,signal?:AbortSignal|null)=>signal?.aborted||error instanceof DOMException&&error.name==='AbortError';
export async function request<T>(path:string,options:RequestOptions={}):Promise<T>{
 if(!path.startsWith('/api/v1/'))throw Error('Only local API paths are allowed');
 const {body,revision,idempotencyKey,skipCsrf,...rest}=options;const method=(rest.method||'GET').toUpperCase();const headers=new Headers(rest.headers);
 if(body!==undefined&&!(body instanceof FormData))headers.set('Content-Type','application/json');
 if(revision!==undefined)headers.set('If-Match',`"${revision}"`);if(idempotencyKey)headers.set('Idempotency-Key',idempotencyKey);
 if(!['GET','HEAD'].includes(method)&&!skipCsrf&&csrfToken)headers.set('X-CSRF-Token',csrfToken);
 const canRetry=retryableMethod(method,idempotencyKey);let response:Response|undefined;let lastError:unknown;
 for(let retry=0;retry<=MAX_RETRIES;retry++){
  try {
   response=await fetch(path,{...rest,method,headers,credentials:'same-origin',body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body)});
   if(!canRetry||!retryableStatus(response.status)||retry===MAX_RETRIES)break;
   await sleep(retryDelay(retry,response.headers.get('Retry-After')),rest.signal);
  } catch(error) {
   lastError=error;if(isAbort(error,rest.signal)||!canRetry||retry===MAX_RETRIES)throw error;
   await sleep(retryDelay(retry),rest.signal);
  }
 }
 if(!response){throw lastError instanceof Error?lastError:Error('网络连接失败，请稍后重试');}
 let payload:ApiSuccess<T>|ApiFailure;
 try {payload=await response.json() as ApiSuccess<T>|ApiFailure;}
 catch {throw Error('服务响应无法解析');}
 if(!response.ok){if(response.status===401){setCsrfToken(null);window.dispatchEvent(new Event('session-expired'));}const e=(payload as ApiFailure).error;throw new ApiError(response.status,e.code,e.message,e.fields,payload.requestId);}
 return (payload as ApiSuccess<T>).data;
}
export function upload<T>(path:string,body:FormData,idempotencyKey:string,onProgress?:(percent:number)=>void):Promise<T>{
 if(!path.startsWith('/api/v1/'))return Promise.reject(Error('Only local API paths are allowed'));
 return new Promise((resolve,reject)=>{let retry=0;
  const send=()=>{const xhr=new XMLHttpRequest();xhr.open('POST',path);xhr.withCredentials=true;xhr.timeout=300000;xhr.setRequestHeader('Idempotency-Key',idempotencyKey);if(csrfToken)xhr.setRequestHeader('X-CSRF-Token',csrfToken);
   xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress?.(Math.round(e.loaded/e.total*100));};
   const reconnect=()=>{if(retry>=MAX_RETRIES){reject(Error('网络连接失败，请保留原请求键重试'));return;}const delay=retryDelay(retry);retry++;setTimeout(send,delay);};
   xhr.onerror=reconnect;xhr.ontimeout=()=>{if(retry>=MAX_RETRIES)reject(Error('上传超时，请保留原请求键重试'));else{const delay=retryDelay(retry);retry++;setTimeout(send,delay);}};
   xhr.onload=()=>{try{const p=JSON.parse(xhr.responseText);if(xhr.status>=200&&xhr.status<300){resolve(p.data);return;}if(retryableStatus(xhr.status)&&retry<MAX_RETRIES){const delay=retryDelay(retry,xhr.getResponseHeader('Retry-After'));retry++;setTimeout(send,delay);return;}if(xhr.status===401){setCsrfToken(null);window.dispatchEvent(new Event('session-expired'));}reject(new ApiError(xhr.status,p.error.code,p.error.message,p.error.fields,p.requestId));}catch{reject(Error('服务响应无法解析'));}};xhr.send(body);};send();});
}

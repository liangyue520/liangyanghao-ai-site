// Test-only transport. Never imported by the application; no production fallback.
import type {AdminDetail,AdminMediaAsset,ContentEdit,ContentInput,ExportJob} from '../../../shared/contracts';
import {ApiError,type RequestOptions} from '../../lib/request';
import {blankEdit,copy,type Transport} from './api';
export function createMockTransport(){
 const contents=new Map<string,AdminDetail>(),assets=new Map<string,AdminMediaAsset>(),replays=new Map<string,unknown>();
 const calls:{path:string;options:RequestOptions}[]=[];let failure:Error|null=null,loseReply=false;
 const transport:Transport={
  async request<T>(path:string,options:RequestOptions={}){
   calls.push({path,options:copy(options)});if(failure){const e=failure;failure=null;throw e;}const key=options.idempotencyKey;if(key&&replays.has(key))return copy(replays.get(key)) as T;
   const parts=path.split('?')[0].split('/');const id=parts[5];const action=parts[6];let result:unknown;
   if(path.includes('/exports')){const exportId=id||crypto.randomUUID();result=id?{id:exportId,state:'ready',createdAt:new Date().toISOString(),finishedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString(),byteSize:100,sha256:'mock',error:null,downloadUrl:`/api/v1/admin/exports/${exportId}/file`} satisfies ExportJob:{id:exportId,state:'pending'};}
   else if(!id&&options.method==='POST'){const input=options.body as ContentInput;const now=new Date().toISOString();const c:AdminDetail={...blankEdit(),...input,id:crypto.randomUUID(),kind:input.kind,isDemo:!!input.isDemo,status:'draft',visibility:'private',revision:1,media:[],mediaAssets:[],createdAt:now,updatedAt:now,publishedAt:null,withdrawnAt:null,deletedAt:null};contents.set(c.id,c);result=c;}
   else if(!id){result={items:[...contents.values()],page:1,pageSize:20,total:contents.size};}
   else {const c=contents.get(id);if(!c)throw new ApiError(404,'NOT_FOUND','不存在');
    if(action==='media')result={items:[...assets.values()].filter(a=>a.contentId===id),page:1,pageSize:50,total:assets.size};
    else if(!options.method||options.method==='GET')result=c;
    else {if(options.revision!==c.revision)throw new ApiError(409,'REVISION_CONFLICT','版本冲突');
     if(options.method==='PUT'){if(c.status==='published')throw new ApiError(409,'EDIT_REQUIRES_WITHDRAW','先撤回');Object.assign(c,copy(options.body as ContentEdit));c.mediaAssets=c.media.map(m=>assets.get(m.assetId)!);}
     else if(action==='publish'){c.status='published';c.publishedAt=new Date().toISOString();}
     else if(action==='withdraw'){c.status='withdrawn';c.withdrawnAt=new Date().toISOString();}
     else if(action==='visibility')c.visibility=(options.body as {visibility:'private'}).visibility;
     else if(options.method==='DELETE')c.deletedAt=new Date().toISOString();c.revision++;result=c;
    }
   }
   if(key)replays.set(key,copy(result));if(loseReply){loseReply=false;throw Error('模拟响应丢失');}return copy(result) as T;
  },
  async upload<T>(path:string,body:FormData,key:string,onProgress?:(percent:number)=>void){calls.push({path,options:{method:'POST',idempotencyKey:key}});if(failure){const e=failure;failure=null;throw e;}if(replays.has(key))return copy(replays.get(key)) as T;const contentId=path.split('/')[5];const file=body.get('file') as File;const assetId=crypto.randomUUID();const a:AdminMediaAsset={assetId,contentId,purpose:body.get('purpose') as AdminMediaAsset['purpose'],originalName:file.name,detectedMime:file.type,byteSize:file.size,sha256:'mock',width:20,height:20,durationMs:null,createdAt:new Date().toISOString(),variants:[]};assets.set(assetId,a);onProgress?.(100);const result={asset:a,contentRevision:contents.get(contentId)!.revision};replays.set(key,result);return copy(result) as T;},
 };
 return {transport,contents,assets,calls,failNext(error:Error){failure=error;},loseNextReply(){loseReply=true;}};
}

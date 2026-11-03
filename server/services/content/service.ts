import type {Content,AdminDetail} from '../../../shared/contracts';
import type {ContentService,ServiceContext,Actor} from '../../../shared/service-ports';
import {compareContents,contentInputSchema,editSchemaFor,visibilitySchema,uuidSchema} from '../../../shared/schemas';
import {AppError,parse} from '../../core/errors';
import {requireActor,isPublic} from '../../core/permissions';
import {contentRepository} from './repository';
import {mediaRepository} from '../media/repository';
import {adminDetail,publicDetail,summary,paginate,yearKey,checkRevision,editable,validateLinks,validatePublish} from './policy';

export function createContentService(ctx:ServiceContext):ContentService {
  const repo=contentRepository(ctx),media=mediaRepository(ctx),now=()=>new Date(ctx.clock()).toISOString();
  const detail=(c:Content)=>adminDetail(c,media.all(c.id));
  function mutate<T>(actor:Actor,key:string|undefined,method:string,path:string,input:unknown,work:()=>T,status=200):T {
    requireActor(actor);if(key)parse(uuidSchema,key,400);const release=key?ctx.idempotency.acquire(actor.id,key):()=>{};
    try {const hash=ctx.idempotency.digest(input);return ctx.db.transaction(()=>{if(key){const hit=ctx.idempotency.lookup<T>(actor.id,key,method,path,hash);if(hit)return hit.data;}const value=work();if(key)ctx.idempotency.record(actor.id,key,method,path,hash,status,value);return value;});}finally{release();}
  }
  function change(actor:Actor,id:string,revision:number,key:string|undefined,action:string,input:unknown,work:(c:Content)=>boolean):AdminDetail {
    return mutate(actor,key,action==='replace'?'PUT':'POST',`/api/v1/admin/contents/${id}${action==='replace'?'':'/'+action}`,{revision,input},()=>{const c=repo.get(id);checkRevision(c,revision);if(c.deletedAt)throw new AppError(410,'CONTENT_DELETED','内容已删除');if(work(c)){c.revision++;c.updatedAt=now();repo.save(c);}return detail(c);});
  }
  return {
    async listPublic(q){const items=repo.all().filter(c=>isPublic(c)&&(!q.kind||c.kind===q.kind)&&(!q.year||yearKey(c)===q.year)&&(!q.category||c.category===q.category)&&(q.featured===undefined||c.featured===q.featured)).sort(compareContents);const page=paginate(items,q);return {...page,items:page.items.map(c=>summary(c,media.all(c.id)))};},
    async getPublic(id){const c=repo.find(id);if(!c||!isPublic(c))throw new AppError(404,'NOT_FOUND','未找到内容');return publicDetail(c,media.all(c.id));},
    async diaryFacets(){const years=new Map<string,number>(),categories=new Map<string,number>();for(const c of repo.all().filter(c=>c.kind==='diary'&&isPublic(c))){const y=yearKey(c);years.set(y,(years.get(y)||0)+1);if(c.category)categories.set(c.category,(categories.get(c.category)||0)+1);}const rank=(s:string)=>s==='unknown'?-2:s==='uncertain'?-1:Number(s);return {years:[...years].sort((a,b)=>rank(b[0])-rank(a[0])).map(([key,count])=>({key,count})),categories:[...categories].sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0).map(([name,count])=>({name,count}))};},
    async listAdmin(actor,q){requireActor(actor);const items=repo.all().filter(c=>(q.includeDeleted||!c.deletedAt)&&(!q.kind||c.kind===q.kind)&&(!q.status||c.status===q.status)&&(!q.visibility||c.visibility===q.visibility)).sort(compareContents);const page=paginate(items,q);return {...page,items:page.items.map(c=>({...summary(c,media.all(c.id),true),revision:c.revision,status:c.status,visibility:c.visibility,deletedAt:c.deletedAt,updatedAt:c.updatedAt}))};},
    async getAdmin(actor,id){requireActor(actor);return detail(repo.get(id));},
    async create(actor,input,key){requireActor(actor);parse(uuidSchema,key,400);const data=parse(contentInputSchema,input);return mutate(actor,key,'POST','/api/v1/admin/contents',data,()=>{const time=now();const c:Content={...data,id:ctx.uuid(),revision:1,status:'draft',visibility:'private',media:[],createdAt:time,updatedAt:time,publishedAt:null,withdrawnAt:null,deletedAt:null};repo.save(c);return detail(c);},201);},
    async replace(actor,id,input,revision,key){return change(actor,id,revision,key,'replace',input,c=>{editable(c);Object.assign(c,parse(editSchemaFor(c.kind),input));validateLinks(c,media.all(c.id));return true;});},
    async publish(actor,id,visibility,revision,key){return change(actor,id,revision,key,'publish',{confirmVisibility:visibility},c=>{parse(visibilitySchema,visibility);if(c.status==='published')throw new AppError(409,'ALREADY_PUBLISHED','内容已经发布');if(c.visibility!==visibility)throw new AppError(409,'STATE_CONFLICT','请确认当前可见性');validatePublish(c,media.all(c.id));c.status='published';c.publishedAt=now();return true;});},
    async setVisibility(actor,id,visibility,revision,key){return change(actor,id,revision,key,'visibility',{visibility},c=>{parse(visibilitySchema,visibility);if(c.visibility===visibility)return false;if(c.status==='published'&&visibility==='public')throw new AppError(409,'STATE_CONFLICT','请先撤回再公开发布');c.visibility=visibility;return true;});},
    async withdraw(actor,id,revision,key){return change(actor,id,revision,key,'withdraw',{},c=>{if(c.status!=='published')return false;c.status='withdrawn';c.withdrawnAt=now();return true;});},
    async softDelete(actor,id,revision,key){return mutate(actor,key,'DELETE',`/api/v1/admin/contents/${id}`,{revision},()=>{const c=repo.get(id);checkRevision(c,revision);if(!c.deletedAt){editable(c);c.deletedAt=now();c.updatedAt=c.deletedAt;c.revision++;repo.save(c);}return {id:c.id,deletedAt:c.deletedAt!,revision:c.revision};});}
  };
}

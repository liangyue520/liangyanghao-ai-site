import fs from 'node:fs/promises';
import type {MediaAsset,MediaVariant} from '../../../shared/contracts';
import type {MediaService,ServiceContext} from '../../../shared/service-ports';
import {purposeSchema,uuidSchema} from '../../../shared/schemas';
import {AppError,parse} from '../../core/errors';
import {requireActor,canReadMedia} from '../../core/permissions';
import {contentRepository} from '../content/repository';
import {paginate} from '../content/policy';
import {mediaRepository,adminAsset,cleanupStaleUploads} from './repository';
import {uploadAllowed,safeFilename,byteRange,binaryHeaders} from './validation';

export function createMediaService(ctx:ServiceContext):MediaService {
  const contents=contentRepository(ctx),repo=mediaRepository(ctx);
  const startup=cleanupStaleUploads(ctx);
  return {
    async upload(actor,contentId,purpose,file,key){
      requireActor(actor);parse(uuidSchema,key,400);parse(purposeSchema,purpose);
      await startup;
      const release=ctx.idempotency.acquire(actor.id,key),temps=new Set<string>(),objects=new Set<string>();let committed=false;
      const path=`/api/v1/admin/contents/${contentId}/media`;
      try {
        // Read a bounded stream before replay comparison: upload identity is purpose + bytes.
        await ctx.storage.requireSpace(ctx.media.limits[purpose]*3+1024**3);
        const temp=await ctx.storage.writeTemp(file.stream,ctx.media.limits[purpose]);temps.add(temp.key);
        const hash=ctx.idempotency.digest({purpose,sha256:temp.sha256});
        const replay=ctx.idempotency.lookup<Awaited<ReturnType<MediaService['upload']>>>(actor.id,key,'POST',path,hash);if(replay)return replay.data;
        uploadAllowed(contents.get(contentId),purpose);
        const name=safeFilename(file.originalName),inspection=await ctx.media.inspect(temp.key,purpose,name,file.declaredMime);
        for(const d of inspection.derived)temps.add(d.key);
        const duplicate=repo.duplicate(contentId,purpose,temp.sha256);
        if(duplicate)return ctx.db.transaction(()=>{const c=contents.get(contentId);uploadAllowed(c,purpose);const result={asset:adminAsset(duplicate),contentRevision:c.revision};ctx.idempotency.record(actor.id,key,'POST',path,hash,201,result);return result;});
        const assetId=ctx.uuid(),variants:MediaVariant[]=[];
        const prepared:{name:MediaVariant['name'];key:string;mime:string}[]=[{name:'original',key:temp.key,mime:inspection.mime},...inspection.derived];
        if(purpose==='video'||purpose==='resourceFile'){
          const copy=await ctx.storage.writeTemp(ctx.storage.read(temp.key),ctx.media.limits[purpose]);temps.add(copy.key);prepared.push({name:purpose==='video'?'playback':'download',key:copy.key,mime:inspection.mime});
        }
        for(const v of prepared){const integrity=await ctx.storage.hash(v.key),objectKey=`objects/${assetId}/${v.name}`;await ctx.storage.commit(v.key,objectKey);temps.delete(v.key);objects.add(objectKey);variants.push({name:v.name,storageKey:objectKey,mime:v.mime,...integrity});}
        const asset:MediaAsset={id:assetId,contentId,purpose,state:'ready',originalName:name,detectedMime:inspection.mime,byteSize:temp.byteSize,sha256:temp.sha256,width:inspection.width,height:inspection.height,durationMs:inspection.durationMs,createdAt:new Date(ctx.clock()).toISOString(),variants};
        const result=ctx.db.transaction(()=>{
          const c=contents.get(contentId);uploadAllowed(c,purpose);
          // A different key may have finished the same bytes while this request did file IO.
          const existing=repo.duplicate(contentId,purpose,temp.sha256);if(!existing)repo.insert(asset);
          const result={asset:adminAsset(existing||asset),contentRevision:c.revision};ctx.idempotency.record(actor.id,key,'POST',path,hash,201,result);return result;
        });committed=result.asset.assetId===assetId;return result;
      } catch(e){if(e instanceof AppError)throw e;ctx.logger.error('media_upload_failed');if((e as NodeJS.ErrnoException).code==='ENOSPC')throw new AppError(507,'INSUFFICIENT_STORAGE','磁盘空间不足');throw new AppError(500,'INTERNAL_ERROR','上传失败，请使用原请求键重试');}
      finally {
        for(const key of temps)await ctx.storage.removeTemp(key).catch(()=>ctx.logger.error('media_temp_cleanup_failed'));
        // Only keys created by this request, never existing ready assets, can be removed here.
        if(!committed)for(const key of objects)await fs.unlink(ctx.storage.resolve(key)).catch(()=>ctx.logger.error('media_orphan_cleanup_failed'));
        release();
      }
    },
    async listAdmin(actor,contentId,query){requireActor(actor);contents.get(contentId);return paginate(repo.all(contentId).map(adminAsset),query);},
    async open(actor,assetId,variant,range,head=false){
      const denied=()=>new AppError(404,'NOT_FOUND','未找到文件');
      const a=repo.find(assetId),c=a?contents.find(a.contentId):undefined;
      if(!a||!c||!canReadMedia(actor,c,a,variant,repo.all(c.id)))throw denied();
      const v=a.variants.find(v=>v.name===variant)!;
      try {const stat=await fs.stat(ctx.storage.resolve(v.storageKey));if(!stat.isFile()||stat.size!==v.byteSize)throw Error('Missing or incomplete object');} catch {if(actor?.role==='admin'){ctx.logger.error('media_object_unavailable');throw new AppError(503,'SERVICE_UNAVAILABLE','文件暂不可用');}throw denied();}
      // File IO above yields: re-check the current database state before creating any stream.
      const current=contents.find(a.contentId);if(!current||!canReadMedia(actor,current,a,variant,repo.all(a.contentId)))throw denied();
      const selected=variant==='playback'?byteRange(range,v.byteSize):undefined;
      const headers:Record<string,string>=binaryHeaders(v.mime,selected?selected.end-selected.start+1:v.byteSize);
      headers['Content-Disposition']=variant==='original'||variant==='download'?`attachment; filename="file"; filename*=UTF-8''${encodeURIComponent(a.originalName).replace(/['()*]/g,ch=>'%'+ch.charCodeAt(0).toString(16).toUpperCase())}`:'inline';
      if(variant==='playback')headers['Accept-Ranges']='bytes';
      if(selected)headers['Content-Range']=`bytes ${selected.start}-${selected.end}/${v.byteSize}`;
      return {status:selected?206:200,headers,...(head?{}:{stream:ctx.storage.read(v.storageKey,selected?.start,selected?.end)})};
    }
  };
}

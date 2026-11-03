import type {MediaAsset,AdminMediaAsset} from '../../../shared/contracts';
import type {ServiceContext} from '../../../shared/service-ports';
import fs from 'node:fs/promises';

export const mediaUrl=(id:string,name:string)=>`/api/v1/media/${id}/${name}`;
export function adminAsset(a:MediaAsset):AdminMediaAsset {
  return {assetId:a.id,contentId:a.contentId,purpose:a.purpose,originalName:a.originalName,detectedMime:a.detectedMime,byteSize:a.byteSize,sha256:a.sha256,width:a.width,height:a.height,durationMs:a.durationMs,createdAt:a.createdAt,variants:a.variants.map(v=>({name:v.name,mime:v.mime,byteSize:v.byteSize,sha256:v.sha256,url:mediaUrl(a.id,v.name)}))};
}
export function mediaRepository(ctx:ServiceContext) {
  return {
    all(contentId?:string):MediaAsset[] {return (contentId ? ctx.db.all<{data_json:string}>('SELECT data_json FROM media_assets WHERE content_id=? ORDER BY created_at,id',contentId) : ctx.db.all<{data_json:string}>('SELECT data_json FROM media_assets ORDER BY created_at,id')).map(r=>JSON.parse(r.data_json));},
    find(id:string):MediaAsset|undefined {const r=ctx.db.get<{data_json:string}>('SELECT data_json FROM media_assets WHERE id=?',id);return r?JSON.parse(r.data_json):undefined;},
    duplicate(contentId:string,purpose:string,hash:string):MediaAsset|undefined {const r=ctx.db.get<{data_json:string}>('SELECT data_json FROM media_assets WHERE content_id=? AND purpose=? AND sha256=?',contentId,purpose,hash);return r?JSON.parse(r.data_json):undefined;},
    insert(a:MediaAsset){ctx.db.run('INSERT INTO media_assets(id,content_id,purpose,state,sha256,created_at,data_json) VALUES(?,?,?,?,?,?,?)',a.id,a.contentId,a.purpose,a.state,a.sha256,a.createdAt,JSON.stringify(a));}
  };
}

// Called once per service context at startup. Never remove a referenced immutable object.
const cleanups=new WeakMap<ServiceContext,Promise<void>>();
export function cleanupStaleUploads(ctx:ServiceContext):Promise<void>{
  let result=cleanups.get(ctx);if(result)return result;
  result=(async()=>{
    const cutoff=ctx.clock()-86400000;
    async function scan(key:string){
      for(const entry of await fs.readdir(ctx.storage.resolve(key),{withFileTypes:true})){
        if(entry.isSymbolicLink())continue;const child=key+'/'+entry.name;
        if(entry.isDirectory()){await scan(child);continue;}if(!entry.isFile())continue;
        const stat=await fs.stat(ctx.storage.resolve(child));if(stat.mtimeMs>=cutoff)continue;
        if(child.startsWith('objects/')&&mediaRepository(ctx).all().some(a=>a.variants.some(v=>v.storageKey===child)))continue;
        await fs.unlink(ctx.storage.resolve(child));
      }
    }
    await scan('tmp');await scan('objects');
  })().catch(()=>ctx.logger.error('media_startup_cleanup_failed'));
  cleanups.set(ctx,result);return result;
}

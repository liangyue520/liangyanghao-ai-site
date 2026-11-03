import archiver from 'archiver';
import {createHash} from 'node:crypto';
import {CONTRACT_VERSION} from '../../../shared/contracts';
import type {ServiceContext} from '../../../shared/service-ports';
import {contentRepository} from '../content/repository';
import {mediaRepository} from '../media/repository';
import {AppError} from '../../core/errors';

const extension:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','application/zip':'zip','application/pdf':'pdf','text/plain':'txt'};
export async function buildSnapshot(ctx:ServiceContext,exportId:string,createdAt:string){
  const snapshot=ctx.db.transaction(()=>({contents:contentRepository(ctx).all(),media:mediaRepository(ctx).all(),snapshotAt:new Date(ctx.clock()).toISOString()}));
  const sources=snapshot.media.flatMap(a=>a.variants.map(v=>({key:v.storageKey,path:`files/${a.id}/${v.name}.${extension[v.mime]||'bin'}`,byteSize:v.byteSize,sha256:v.sha256})));
  const total=sources.reduce((n,v)=>n+v.byteSize,0);await ctx.storage.requireSpace(total*2+1024**3);
  const media=snapshot.media.map(a=>({...a,variants:a.variants.map(v=>({...v,storageKey:`files/${a.id}/${v.name}.${extension[v.mime]||'bin'}`}))}));
  const jsons=[{path:'contents.json',data:Buffer.from(JSON.stringify(snapshot.contents))},{path:'media.json',data:Buffer.from(JSON.stringify(media))}];
  const files=[...jsons.map(j=>({path:j.path,byteSize:j.data.length,sha256:createHash('sha256').update(j.data).digest('hex')})),...sources.map(({path,byteSize,sha256})=>({path,byteSize,sha256}))];
  const schema=ctx.db.all<{name:string}>('SELECT name FROM schema_migrations ORDER BY name').map(s=>s.name);
  const supported=['001_initial.sql','002_analytics.sql'];
  if(!schema.includes('001_initial.sql')||schema.some(name=>!supported.includes(name)))throw new AppError(503,'SERVICE_UNAVAILABLE','当前导出尚不支持此数据版本');
  const manifest={formatVersion:'1',contractVersion:CONTRACT_VERSION,schemaVersion:schema.includes('002_analytics.sql')?2:1,exportId,createdAt,snapshotAt:snapshot.snapshotAt,counts:{contents:snapshot.contents.length,mediaAssets:media.length,files:files.length},files};
  const copies:string[]=[];const zip=archiver('zip',{zlib:{level:6}});
  // Copy immutable bytes with the storage adapter; validate what is actually packaged.
  try {
    for(const source of sources){const copy=await ctx.storage.writeTemp(ctx.storage.read(source.key),source.byteSize);copies.push(copy.key);if(copy.sha256!==source.sha256||copy.byteSize!==source.byteSize)throw new AppError(500,'INTERNAL_ERROR','导出文件校验失败');}
    const writing=ctx.storage.writeTemp(zip,total+jsons.reduce((n,j)=>n+j.data.length,0)+Buffer.byteLength(JSON.stringify(manifest))+sources.length*2048+1024**2);
    // Attach rejection handlers immediately so an IO failure cannot become unhandled.
    const observed=writing.catch(e=>{zip.abort();throw e;});observed.catch(()=>{});
    zip.append(JSON.stringify(manifest),{name:'manifest.json'});for(const j of jsons)zip.append(j.data,{name:j.path});
    for(let i=0;i<sources.length;i++)zip.file(ctx.storage.resolve(copies[i]),{name:sources[i].path});
    try {await zip.finalize();return await observed;}catch(e){zip.abort();zip.destroy(e instanceof Error?e:new Error('Export failed'));await observed.catch(()=>{});throw e;}
  }finally{for(const key of copies)await ctx.storage.removeTemp(key).catch(()=>ctx.logger.error('export_temp_cleanup_failed'));}
}

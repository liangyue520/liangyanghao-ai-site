import fs from 'node:fs/promises';
import type {ExportJob} from '../../../shared/contracts';
import type {ExportService,ServiceContext} from '../../../shared/service-ports';
import {uuidSchema} from '../../../shared/schemas';
import {AppError,parse} from '../../core/errors';
import {requireActor} from '../../core/permissions';
import {binaryHeaders} from '../media/validation';
import {buildSnapshot} from './snapshot';

export function createExportService(ctx:ServiceContext):ExportService {
  const now=()=>new Date(ctx.clock()).toISOString(),fileKey=(id:string)=>`exports/${id}.zip`;
  const all=()=>ctx.db.all<{data_json:string}>('SELECT data_json FROM export_jobs').map(r=>JSON.parse(r.data_json) as ExportJob);
  function get(id:string){const row=ctx.db.get<{data_json:string}>('SELECT data_json FROM export_jobs WHERE id=?',id);if(!row)throw new AppError(404,'NOT_FOUND','未找到导出');return JSON.parse(row.data_json) as ExportJob;}
  function save(j:ExportJob){ctx.db.run('INSERT INTO export_jobs(id,state,created_at,expires_at,data_json) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state,expires_at=excluded.expires_at,data_json=excluded.data_json',j.id,j.state,j.createdAt,j.expiresAt,JSON.stringify(j));}
  async function run(id:string){
    let temp:string|undefined,moved=false;
    try {
      const job=ctx.db.transaction(()=>{const j=get(id);if(j.state!=='pending')return null;j.state='running';save(j);return j;});if(!job)return;
      const packed=await buildSnapshot(ctx,id,job.createdAt);temp=packed.key;
      const target=ctx.storage.resolve(fileKey(id));await fs.rename(ctx.storage.resolve(temp),target);temp=undefined;moved=true;
      ctx.db.transaction(()=>{const current=get(id);if(current.state!=='running')throw new AppError(409,'STATE_CONFLICT','导出状态已变化');save({...current,state:'ready',finishedAt:now(),expiresAt:new Date(ctx.clock()+86400000).toISOString(),byteSize:packed.byteSize,sha256:packed.sha256,downloadUrl:`/api/v1/admin/exports/${id}/file`});});
    }catch(e){
      if(temp)await ctx.storage.removeTemp(temp).catch(()=>{});if(moved)await fs.unlink(ctx.storage.resolve(fileKey(id))).catch(()=>{});
      ctx.logger.error('export_failed');ctx.db.transaction(()=>{const j=get(id);save({...j,state:'failed',finishedAt:now(),error:{code:e instanceof AppError?e.code:(e as NodeJS.ErrnoException).code==='ENOSPC'?'INSUFFICIENT_STORAGE':'INTERNAL_ERROR',message:'导出失败，未生成可下载完整包'},downloadUrl:null,byteSize:null,sha256:null,expiresAt:null});});
    }
  }
  async function expire(time:number){for(const j of all())if(j.state==='ready'&&j.expiresAt&&Date.parse(j.expiresAt)<=time){ctx.db.transaction(()=>save({...j,state:'expired',downloadUrl:null}));await fs.unlink(ctx.storage.resolve(fileKey(j.id))).catch(e=>{if(e.code!=='ENOENT')ctx.logger.error('export_expiry_cleanup_failed');});}}
  return {
    async create(actor,key){requireActor(actor);parse(uuidSchema,key,400);const release=ctx.idempotency.acquire(actor.id,key);let start:string|undefined;
      try {const result=ctx.db.transaction(()=>{const hash=ctx.idempotency.digest({}),hit=ctx.idempotency.lookup<{id:string;state:'pending'}>(actor.id,key,'POST','/api/v1/admin/exports',hash);if(hit)return hit.data;if(ctx.db.get("SELECT id FROM export_jobs WHERE state IN ('pending','running')"))throw new AppError(409,'EXPORT_BUSY','已有导出正在进行');const j:ExportJob={id:ctx.uuid(),state:'pending',createdAt:now(),finishedAt:null,expiresAt:null,byteSize:null,sha256:null,error:null,downloadUrl:null};save(j);const result={id:j.id,state:'pending' as const};ctx.idempotency.record(actor.id,key,'POST','/api/v1/admin/exports',hash,201,result);start=j.id;return result;});
        // One bounded job, no independent process or recurring scheduler. Expiry is driven by 00.
        if(start)setImmediate(()=>{void run(start!).catch(()=>ctx.logger.error('export_job_unhandled'));});return result;
      }finally{release();}
    },
    async get(actor,id){requireActor(actor);await expire(ctx.clock());return get(id);},
    async open(actor,id){requireActor(actor);await expire(ctx.clock());const j=get(id);if(j.state==='expired')throw new AppError(410,'EXPORT_EXPIRED','导出已过期');if(j.state!=='ready')throw new AppError(409,'EXPORT_NOT_READY','导出尚未完成');try{const s=await fs.stat(ctx.storage.resolve(fileKey(id)));if(s.size!==j.byteSize)throw Error();}catch{throw new AppError(503,'SERVICE_UNAVAILABLE','导出文件暂不可用');}if(Date.parse(j.expiresAt!)<=ctx.clock()){await expire(ctx.clock());throw new AppError(410,'EXPORT_EXPIRED','导出已过期');}return {status:200,headers:{...binaryHeaders('application/zip',j.byteSize!), 'Content-Disposition':`attachment; filename="export-${j.id}.zip"`},stream:ctx.storage.read(fileKey(id))};},
    async resumeAfterRestart(){for(const j of all())if(j.state==='pending'||j.state==='running'){ctx.db.transaction(()=>save({...j,state:'failed',finishedAt:now(),error:{code:'INTERNAL_ERROR',message:'进程重启，未完成导出已终止'},downloadUrl:null,byteSize:null,sha256:null,expiresAt:null}));await fs.unlink(ctx.storage.resolve(fileKey(j.id))).catch(()=>{});}await expire(ctx.clock());},
    expire
  };
}

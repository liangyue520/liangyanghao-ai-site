import {createHash} from 'node:crypto';import type {Database} from './database';import {AppError} from './errors';
function stable(v:unknown):unknown{if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).sort(([a],[b])=>a<b?-1:1).map(([k,x])=>[k,stable(x)]));return v;}
export const digest=(v:unknown)=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
export function createIdempotency(db:Database,clock:()=>number){
 const pending=new Set<string>();
 return {
  acquire(adminId:string,key:string){const k=adminId+':'+key;if(pending.has(k))throw new AppError(409,'REQUEST_IN_PROGRESS','请求正在处理',[],{'Retry-After':'1'});pending.add(k);return ()=>pending.delete(k);},
  lookup<T>(adminId:string,key:string,method:string,path:string,hash:string):{status:number;data:T}|null{
   const row=db.get<{method:string;path:string;digest:string;status:number;response_json:string;expires_at:number}>('SELECT * FROM idempotency WHERE admin_id=? AND key=?',adminId,key);
   if(!row||row.expires_at<=clock())return null;if(row.method!==method||row.path!==path||row.digest!==hash)throw new AppError(409,'IDEMPOTENCY_CONFLICT','重复请求键已用于不同输入');return {status:row.status,data:JSON.parse(row.response_json)};
  },
  record(adminId:string,key:string,method:string,path:string,hash:string,status:number,data:unknown){if(!db.raw.isTransaction)throw Error('Idempotency result must share business transaction');db.run('INSERT OR REPLACE INTO idempotency VALUES(?,?,?,?,?,?,?,?)',adminId,key,method,path,hash,status,JSON.stringify(data),clock()+86400000);},
  digest
 };
}

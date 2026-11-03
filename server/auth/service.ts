import {randomBytes,randomUUID,createHash,createHmac,scrypt,timingSafeEqual} from 'node:crypto';
import type {Database} from '../core/database';import type {Config} from '../core/config';import {AppError} from '../core/errors';import type {SessionData} from '../../shared/contracts';
export interface Actor {id:string;username:string;role:'admin'}
const hashToken=(s:string)=>createHash('sha256').update(s).digest('hex');
export const passwordHash=(password:string,salt:string)=>new Promise<string>((resolve,reject)=>scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024},(e,key)=>e?reject(e):resolve(key.toString('hex'))));
const equal=(a:string,b:string)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);};
export function createAuth(db:Database,config:Config,clock=Date.now){
 function csrf(id:string){return createHmac('sha256',config.csrfSecret).update(id).digest('base64url');}
 function resolve(token:string|undefined,required=true){
  if(!token){if(required)throw new AppError(401,'AUTH_REQUIRED','请先登录');return null;}
  const row=db.get<{id:string;admin_id:string;username:string;last_seen_at:number;expires_at:number}>('SELECT s.*,a.username FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE token_hash=?',hashToken(token));
  if(!row||row.expires_at<=clock()||row.last_seen_at+1800000<=clock()){if(row)db.run('DELETE FROM sessions WHERE id=?',row.id);if(required)throw new AppError(401,'SESSION_EXPIRED','登录已失效');return null;}
  db.run('UPDATE sessions SET last_seen_at=? WHERE id=?',clock(),row.id);
  return {sessionId:row.id,actor:{id:row.admin_id,username:row.username,role:'admin' as const},data:{admin:{id:row.admin_id,username:row.username},csrfToken:csrf(row.id),expiresAt:new Date(row.expires_at).toISOString()} satisfies SessionData};
 }
 return {resolve,
  async initialize(username:string,password:string,reset=false){const salt=randomBytes(16).toString('hex');const hash=await passwordHash(password,salt);db.transaction(()=>{const old=db.get<{id:string}>('SELECT id FROM admins');if(old&&!reset)throw new AppError(409,'STATE_CONFLICT','管理员已存在');if(old){db.run('DELETE FROM sessions');db.run('UPDATE admins SET username=?,salt=?,password_hash=? WHERE id=?',username,salt,hash,old.id);}else db.run('INSERT INTO admins VALUES(?,?,?,?,?)',randomUUID(),username,salt,hash,new Date(clock()).toISOString());});},
  async login(username:string,password:string,ip:string,oldToken?:string){
   const now=clock(),buckets=['ip:'+ip,'user:'+username];const reservations:string[]=[];
   db.transaction(()=>{db.run('DELETE FROM login_attempts WHERE attempted_at<?',now-900000);for(const bucket of buckets){const row=db.get<{n:number}>('SELECT count(*) n FROM login_attempts WHERE bucket=?',bucket)!;if(row.n>=10)throw new AppError(429,'RATE_LIMITED','登录尝试过多，请稍后重试',[],{'Retry-After':'900'});}for(const bucket of buckets){const id=randomUUID();reservations.push(id);db.run('INSERT INTO login_attempts VALUES(?,?,?)',id,bucket,now);}});
   const admin=db.get<{id:string;username:string;salt:string;password_hash:string}>('SELECT * FROM admins WHERE username=?',username);
   const hash=await passwordHash(password,admin?.salt||'00000000000000000000000000000000');
   if(!admin||!equal(hash,admin.password_hash))throw new AppError(401,'INVALID_CREDENTIALS','用户名或密码错误');
   const token=randomBytes(32).toString('base64url'),id=randomUUID(),expires=clock()+43200000;
   db.transaction(()=>{for(const r of reservations)db.run('DELETE FROM login_attempts WHERE id=?',r);if(oldToken)db.run('DELETE FROM sessions WHERE token_hash=?',hashToken(oldToken));db.run('INSERT INTO sessions VALUES(?,?,?,?,?,?)',id,admin.id,hashToken(token),clock(),clock(),expires);});
   return {token,data:{admin:{id:admin.id,username:admin.username},csrfToken:csrf(id),expiresAt:new Date(expires).toISOString()} satisfies SessionData};
  },
  checkCsrf(sessionId:string,token:unknown){if(typeof token!=='string'||!equal(csrf(sessionId),token))throw new AppError(403,'CSRF_INVALID','请求校验失败，请刷新后重试');},
  logout(id:string){db.run('DELETE FROM sessions WHERE id=?',id);},
  revokeAll(){db.run('DELETE FROM sessions');}
 };
}

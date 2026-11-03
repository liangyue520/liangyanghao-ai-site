import Fastify from 'fastify';import cookie from '@fastify/cookie';import multipart from '@fastify/multipart';import staticPlugin from '@fastify/static';import {randomUUID,createHash} from 'node:crypto';import fs from 'node:fs';import path from 'node:path';
import {CONTRACT_VERSION} from '../shared/contracts';import {loginSchema,emptySchema} from '../shared/schemas';import type {ServiceContext,Services} from '../shared/service-ports';import {createAuth} from './auth/service';import {AppError,parse} from './core/errors';import {businessRoutes} from './routes/business';import {isAnalyticsOriginAllowed} from './core/analytics-origin';
export async function buildApp(ctx:ServiceContext,services:Services){
 const app=Fastify({logger:false,bodyLimit:1024**2,requestTimeout:300000,genReqId:()=>randomUUID(),trustProxy:false,exposeHeadRoutes:false});
 const auth=createAuth(ctx.db,ctx.config,ctx.clock);await app.register(cookie);await app.register(multipart);
 app.decorateRequest('actor',null);app.decorateRequest('sessionId',null);
 const cookieOpts={httpOnly:true,sameSite:'strict' as const,path:'/',secure:ctx.config.secureCookie};
 // A changed CSRF secret revokes all sessions on startup.
 const secretHash=createHash('sha256').update(ctx.config.csrfSecret).digest('hex');const old=ctx.db.get<{value:string}>('SELECT value FROM auth_meta WHERE name=?','csrf_hash');
 if(old&&old.value!==secretHash)auth.revokeAll();ctx.db.run('INSERT OR REPLACE INTO auth_meta VALUES(?,?)','csrf_hash',secretHash);
 app.addHook('onRequest',async(q,r)=>{
  if(!q.url.startsWith('/api/'))return;r.header('Cache-Control','no-store').header('X-Request-Id',q.id).header('Cross-Origin-Resource-Policy','same-origin').header('X-Content-Type-Options','nosniff');
  const admin=q.url.startsWith('/api/v1/admin/');const sessionRequired=admin||q.url.split('?')[0]==='/api/v1/auth/session'||q.url.split('?')[0]==='/api/v1/auth/logout';
  const session=auth.resolve(q.cookies.site_session,sessionRequired);q.actor=session?.actor||null;q.sessionId=session?.sessionId||null;
  const pathname=q.url.split('?')[0];
  if(!['GET','HEAD','OPTIONS'].includes(q.method)){
   if(q.headers.origin!==ctx.config.origin && !(pathname==='/api/v1/analytics/collect' && isAnalyticsOriginAllowed(q.headers.origin,ctx.config.origin)))throw new AppError(403,'ORIGIN_REJECTED','请求来源不允许');
   if(pathname!=='/api/v1/auth/login'&&pathname!=='/api/v1/analytics/collect')auth.checkCsrf(q.sessionId||'',q.headers['x-csrf-token']);
  }
  if(q.url.startsWith('/api/v1/auth/session')&&q.headers.origin&&q.headers.origin!==ctx.config.origin)throw new AppError(403,'ORIGIN_REJECTED','请求来源不允许');
 });
 app.setErrorHandler((err,q,r)=>{const e=err as Error&{statusCode?:number;code?:string};const mapped=e instanceof AppError?e:new AppError(e.statusCode===413?413:e.statusCode===415?415:e.statusCode===400?400:500,e.statusCode===413?'PAYLOAD_TOO_LARGE':e.statusCode===415?'UNSUPPORTED_MEDIA_TYPE':e.statusCode===400?'BAD_REQUEST':'INTERNAL_ERROR',e.statusCode&&e.statusCode<500?'请求格式或容量不合法':'服务暂时不可用');if(mapped.status>=500)ctx.logger.error('request_failed:'+q.id);r.code(mapped.status).headers(mapped.headers).header('Cache-Control','no-store').header('X-Request-Id',q.id).send(q.method==='HEAD'?undefined:{error:{code:mapped.code,message:mapped.message,fields:mapped.fields},requestId:q.id});});
 app.get('/api/v1/health',async q=>({data:{status:'ok',contractVersion:CONTRACT_VERSION},requestId:q.id}));
 app.post('/api/v1/auth/login',async(q,r)=>{if(!q.headers['content-type']?.startsWith('application/json'))throw new AppError(415,'UNSUPPORTED_MEDIA_TYPE','登录仅支持JSON');const v=parse(loginSchema,q.body);const result=await auth.login(v.username,v.password,q.ip,q.cookies.site_session);r.setCookie('site_session',result.token,{...cookieOpts,maxAge:43200});return {data:result.data,requestId:q.id};});
 app.get('/api/v1/auth/session',async q=>({data:auth.resolve(q.cookies.site_session)!.data,requestId:q.id}));
 app.post('/api/v1/auth/logout',async(q,r)=>{parse(emptySchema,q.body);auth.logout(q.sessionId!);r.clearCookie('site_session',cookieOpts);return {data:{loggedOut:true},requestId:q.id};});
 await businessRoutes(app,services,ctx);
 const dist=path.join(ctx.config.root,'dist');if(fs.existsSync(dist))await app.register(staticPlugin,{root:dist,prefix:'/',index:false});
 app.setNotFoundHandler((q,r)=>{if(!q.url.startsWith('/api/')&&q.method==='GET'&&fs.existsSync(path.join(dist,'index.html')))return r.type('text/html').send(fs.readFileSync(path.join(dist,'index.html')));return r.code(404).header('Cache-Control','no-store').send({error:{code:'NOT_FOUND',message:'未找到内容',fields:[]},requestId:q.id});});
 app.addHook('onClose',async()=>ctx.db.close());return {app,auth};
}

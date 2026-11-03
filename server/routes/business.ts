import type {FastifyInstance,FastifyRequest,FastifyReply} from 'fastify';
import {isIP} from 'node:net';
import {isAnalyticsOriginAllowed} from '../core/analytics-origin';
import type {Services,Actor,BinaryResponse,ServiceContext} from '../../shared/service-ports';import type {VariantName,ContentInput,ContentEdit,Purpose} from '../../shared/contracts';
import {uuidSchema,purposeSchema,contentInputSchema,contentEditSchema,publicQuerySchema,adminQuerySchema,pageQuerySchema,publishSchema,visibilityInputSchema,emptySchema,analyticsCollectSchema,analyticsSummaryQuerySchema} from '../../shared/schemas';import {AppError,parse} from '../core/errors';
declare module 'fastify' {interface FastifyRequest {actor:Actor|null;sessionId:string|null}}
const params=(q:FastifyRequest)=>q.params as Record<string,string>;
const id=(q:FastifyRequest,key='id')=>parse(uuidSchema,params(q)[key],400);
function key(q:FastifyRequest,required=false){const k=q.headers['idempotency-key'];if(k===undefined&&!required)return undefined;return parse(uuidSchema,k,400);}
function rev(q:FastifyRequest){const h=q.headers['if-match'];if(!h)throw new AppError(428,'PRECONDITION_REQUIRED','需要内容版本');if(typeof h!=='string'||!/^"[1-9]\d*"$/.test(h)||!Number.isSafeInteger(Number(h.slice(1,-1))))throw new AppError(400,'BAD_REQUEST','内容版本格式错误');return Number(h.slice(1,-1));}
const ok=(q:FastifyRequest,data:unknown)=>({data,requestId:q.id});
async function binary(reply:FastifyReply,result:BinaryResponse){return reply.code(result.status).headers(result.headers).send(result.stream);}
export async function businessRoutes(app:FastifyInstance,s:Services,ctx:ServiceContext){
 const base='/api/v1';
 app.post(base+'/analytics/collect',{bodyLimit:4096},async q=>{
  if(!q.headers['content-type']?.startsWith('application/json'))throw new AppError(415,'UNSUPPORTED_MEDIA_TYPE','统计采集仅支持JSON');
  const dnt=typeof q.headers.dnt==='string'?q.headers.dnt:typeof q.headers['sec-gpc']==='string'?q.headers['sec-gpc']:null;
  const userAgent=typeof q.headers['user-agent']==='string'?q.headers['user-agent']:'';
  const requestOrigin=typeof q.headers.origin==='string'?q.headers.origin:undefined;
  const origin=isAnalyticsOriginAllowed(requestOrigin,ctx.config.origin) ? ctx.config.origin : requestOrigin;
  // Nginx overwrites X-Real-IP with the client address; only accept it from the loopback proxy.
  const realIp=q.headers['x-real-ip'];
  const loopback=q.ip==='127.0.0.1'||q.ip==='::1'||q.ip==='::ffff:127.0.0.1';
  const ip=loopback && typeof realIp==='string' && isIP(realIp) ? realIp : q.ip;
  return ok(q,await s.analytics.collect(parse(analyticsCollectSchema,q.body,400),{ip,userAgent,origin,dnt}));
 });
 app.get(base+'/public/analytics/summary',async q=>{parse(emptySchema,q.query,400);return ok(q,await s.analytics.publicSummary());});
 app.get(base+'/public/contents',async q=>ok(q,await s.content.listPublic(parse(publicQuerySchema,q.query,400))));
 app.get(base+'/public/contents/:id',async q=>ok(q,await s.content.getPublic(id(q))));
 app.get(base+'/public/diary-facets',async q=>{parse(emptySchema,q.query,400);return ok(q,await s.content.diaryFacets());});
 app.get(base+'/admin/contents',async q=>ok(q,await s.content.listAdmin(q.actor!,parse(adminQuerySchema,q.query,400))));
 app.get(base+'/admin/contents/:id',async q=>ok(q,await s.content.getAdmin(q.actor!,id(q))));
 app.post(base+'/admin/contents',async(q,r)=>r.code(201).send(ok(q,await s.content.create(q.actor!,parse(contentInputSchema,q.body) as ContentInput,key(q,true)!))));
 app.put(base+'/admin/contents/:id',async q=>ok(q,await s.content.replace(q.actor!,id(q),parse(contentEditSchema,q.body) as ContentEdit,rev(q),key(q))));
 app.post(base+'/admin/contents/:id/publish',async q=>ok(q,await s.content.publish(q.actor!,id(q),parse(publishSchema,q.body).confirmVisibility,rev(q),key(q))));
 app.post(base+'/admin/contents/:id/visibility',async q=>ok(q,await s.content.setVisibility(q.actor!,id(q),parse(visibilityInputSchema,q.body).visibility,rev(q),key(q))));
 app.post(base+'/admin/contents/:id/withdraw',async q=>{parse(emptySchema,q.body);return ok(q,await s.content.withdraw(q.actor!,id(q),rev(q),key(q)));});
 app.delete(base+'/admin/contents/:id',async q=>{if(q.body!==undefined)throw new AppError(400,'BAD_REQUEST','删除请求不接受正文');return ok(q,await s.content.softDelete(q.actor!,id(q),rev(q),key(q)));});
 app.get(base+'/admin/contents/:id/media',async q=>ok(q,await s.media.listAdmin(q.actor!,id(q),parse(pageQuerySchema,q.query,400))));
 let activeUploads=0;
 app.post(base+'/admin/contents/:id/media',{bodyLimit:301*1024**2},async(q,r)=>{
  const contentId=id(q),requestKey=key(q,true)!;if(activeUploads>=2)throw new AppError(503,'SERVICE_UNAVAILABLE','上传繁忙',[],{'Retry-After':'1'});activeUploads++;
  let tmpKey:string|undefined;
  try{
   // Bounded private spooling supports either multipart field order; E03 owns durable registration.
   let purpose:Purpose|undefined,originalName='',declaredMime='',bytes=0;
   await ctx.storage.requireSpace(300*1024**2*3+1024**3);
   for await(const part of q.parts({limits:{fileSize:300*1024**2,files:1,fields:1,parts:2,fieldSize:40}})){
    if(part.type==='file'){if(part.fieldname!=='file')throw new AppError(400,'BAD_REQUEST','文件字段必须为file');const tmp=await ctx.storage.writeTemp(part.file,300*1024**2);tmpKey=tmp.key;bytes=tmp.byteSize;originalName=part.filename;declaredMime=part.mimetype;if(part.file.truncated)throw new AppError(413,'PAYLOAD_TOO_LARGE','文件超限');}
    else{if(part.fieldname!=='purpose')throw new AppError(400,'BAD_REQUEST','未知上传字段');purpose=parse(purposeSchema,part.value);}
   }
   if(!tmpKey||!purpose)throw new AppError(400,'BAD_REQUEST','需要purpose和单个file');if(bytes>ctx.media.limits[purpose])throw new AppError(413,'PAYLOAD_TOO_LARGE','文件超限');
   const stream=ctx.storage.read(tmpKey);try{return r.code(201).send(ok(q,await s.media.upload(q.actor!,contentId,purpose,{stream,originalName,declaredMime},requestKey)));}finally{stream.destroy();}
  }finally{if(tmpKey)await ctx.storage.removeTemp(tmpKey);activeUploads--;}
 });
 app.route({method:['GET','HEAD'],url:base+'/media/:assetId/:variant',handler:async(q,r)=>{
  const variant=params(q).variant as VariantName;if(!['original','display','thumbnail','playback','download'].includes(variant))throw new AppError(404,'NOT_FOUND','未找到文件');
  return binary(r,await s.media.open(q.actor,id(q,'assetId'),variant,q.headers.range,q.method==='HEAD'));
 }});
 app.post(base+'/admin/exports',async(q,r)=>{parse(emptySchema,q.body);return r.code(201).send(ok(q,await s.exports.create(q.actor!,key(q,true)!)));});
 app.get(base+'/admin/exports/:id',async q=>ok(q,await s.exports.get(q.actor!,id(q))));
 app.get(base+'/admin/exports/:id/file',async(q,r)=>binary(r,await s.exports.open(q.actor!,id(q))));
 app.get(base+'/admin/analytics/summary',async q=>ok(q,await s.analytics.summary(q.actor!,parse(analyticsSummaryQuerySchema,q.query,400).range)));
}

import {createHash} from 'node:crypto';
import type {AnalyticsCollectInput,AnalyticsCollectResult,AnalyticsRange,AnalyticsSummary} from '../../../shared/contracts';
import type {Actor,AnalyticsMeta,AnalyticsService,ServiceContext} from '../../../shared/service-ports';
import {AppError} from '../../core/errors';
import {requireActor} from '../../core/permissions';

const VISIT_TIMEOUT_MS=30*60*1000;
const RATE_WINDOW_MS=60*1000;
const RATE_LIMIT=30;
const RECENT_LIMIT=20;

function sha256(value:string){return createHash('sha256').update(value).digest('hex');}
function cleanOptional(value:string|undefined,max:number){const v=value?.trim();return v?Array.from(v).slice(0,max).join(''):null;}
function normalizePath(value:string){try{const url=new URL(value,'https://site.local');return url.pathname.replace(/\/{2,}/g,'/').slice(0,300)||'/';}catch{return value.split('?')[0].split('#')[0].slice(0,300)||'/';}}
function referrerDomain(value:string|undefined,origin:string){if(!value)return null;try{const ref=new URL(value,origin);const own=new URL(origin);const host=ref.hostname.toLowerCase().replace(/^www\./,'');return host===own.hostname.toLowerCase().replace(/^www\./,'')?null:host.slice(0,200);}catch{return null;}}
function clientInfo(userAgent:string){const ua=userAgent||'';const lower=ua.toLowerCase();
 const browser=lower.includes('edg/')?'Edge':lower.includes('firefox/')?'Firefox':lower.includes('chrome/')||lower.includes('crios/')?'Chrome':lower.includes('safari/')?'Safari':'Other';
 const os=lower.includes('windows')?'Windows':lower.includes('android')?'Android':lower.includes('iphone')||lower.includes('ipad')?'iOS':lower.includes('mac os')?'macOS':lower.includes('linux')?'Linux':'Other';
 const device=lower.includes('ipad')||lower.includes('tablet')?'tablet':lower.includes('mobile')||lower.includes('iphone')||lower.includes('android')?'mobile':'desktop';
 const bot=/bot|crawl|spider|slurp|bingpreview|headless/i.test(ua);
 return {browser,os,device,bot};
}
function rangeStart(now:number,range:AnalyticsRange){const days=range==='1d'?1:range==='7d'?7:30;return new Date(now-days*24*60*60*1000).toISOString();}
function bucket(list:Map<string,number>,key:string|null|undefined){const k=key?.trim()||'direct';list.set(k,(list.get(k)||0)+1);}

export function createAnalyticsService(ctx:ServiceContext):AnalyticsService {
 const hits=new Map<string,number[]>();
 function checkRate(visitorHash:string,now:number){
  const recent=(hits.get(visitorHash)||[]).filter(t=>now-t<RATE_WINDOW_MS);
  if(recent.length>=RATE_LIMIT)throw new AppError(429,'RATE_LIMITED','访问统计请求过于频繁',[],{'Retry-After':'60'});
  recent.push(now);hits.set(visitorHash,recent);
 }
 return {
  async collect(input:AnalyticsCollectInput,meta:AnalyticsMeta):Promise<AnalyticsCollectResult>{
   if(meta.origin!==ctx.config.origin)throw new AppError(403,'ORIGIN_REJECTED','请求来源不允许');
   if(meta.dnt==='1')throw new AppError(403,'DNT_DISABLED','浏览器要求不采集');
   const path=normalizePath(input.path);
   if(path.startsWith('/admin')||path.startsWith('/api')||path.startsWith('/__')||path.includes('..'))throw new AppError(403,'PATH_IGNORED','此路径不采集');
   const info=clientInfo(meta.userAgent);if(info.bot)return {ok:true};
   const nowMs=ctx.clock(),now=new Date(nowMs).toISOString();
   const visitorHash=sha256(`analytics:v1:${ctx.config.csrfSecret}:${meta.ip}:${meta.userAgent}`);
   checkRate(visitorHash,nowMs);
   const language=cleanOptional(input.language,35),screen=cleanOptional(input.screen,20);
   const title=cleanOptional(input.title,120),refDomain=referrerDomain(input.referrer,ctx.config.origin);
   ctx.db.transaction(()=>{
    let session=ctx.db.get<{id:string}>('SELECT id FROM analytics_sessions WHERE visitor_hash=?',visitorHash);
    if(!session){session={id:ctx.uuid()};ctx.db.run('INSERT INTO analytics_sessions(id,visitor_hash,browser,os,device,language,screen,created_at,last_seen_at) VALUES(?,?,?,?,?,?,?,?,?)',session.id,visitorHash,info.browser,info.os,info.device,language,screen,now,now);}
    else ctx.db.run('UPDATE analytics_sessions SET browser=?,os=?,device=?,language=?,screen=?,last_seen_at=? WHERE id=?',info.browser,info.os,info.device,language,screen,now,session.id);
    const cutoff=new Date(nowMs-VISIT_TIMEOUT_MS).toISOString();
    let visit=ctx.db.get<{id:string}>('SELECT id FROM analytics_visits WHERE session_id=? AND last_seen_at>=? ORDER BY last_seen_at DESC LIMIT 1',session.id,cutoff);
    if(!visit){visit={id:ctx.uuid()};ctx.db.run('INSERT INTO analytics_visits(id,session_id,started_at,last_seen_at,pageviews) VALUES(?,?,?,?,0)',visit.id,session.id,now,now);}
    ctx.db.run('UPDATE analytics_visits SET last_seen_at=?,pageviews=pageviews+1 WHERE id=?',now,visit.id);
    ctx.db.run('INSERT INTO analytics_events(id,session_id,visit_id,event_name,path,title,referrer_domain,created_at) VALUES(?,?,?,?,?,?,?,?)',ctx.uuid(),session.id,visit.id,'pageview',path,title,refDomain,now);
   });
   return {ok:true};
  },
  async publicSummary(){
   const now=ctx.clock(), dayMs=24*60*60*1000, offset=8*60*60*1000;
   const since=new Date(Math.floor((now+offset)/dayMs)*dayMs-offset).toISOString();
   const until=new Date(now).toISOString();
   const total=ctx.db.get<{views:number;visitors:number}>(`SELECT COUNT(*) views,COUNT(DISTINCT session_id) visitors FROM analytics_events WHERE created_at<=?`,until);
   const today=ctx.db.get<{views:number;visitors:number}>(`SELECT COUNT(*) views,COUNT(DISTINCT session_id) visitors FROM analytics_events WHERE created_at>=? AND created_at<=?`,since,until);
   return {todayVisitors:today?.visitors??0,todayPageviews:today?.views??0,totalVisitors:total?.visitors??0,totalPageviews:total?.views??0};
  },
  async summary(actor:Actor,range:AnalyticsRange):Promise<AnalyticsSummary>{
   requireActor(actor);
   const since=rangeStart(ctx.clock(),range);
   const pageviews=ctx.db.get<{n:number}>('SELECT COUNT(*) n FROM analytics_events WHERE created_at>=?',since)?.n||0;
   const visits=ctx.db.get<{n:number}>('SELECT COUNT(DISTINCT visit_id) n FROM analytics_events WHERE created_at>=?',since)?.n||0;
   const visitors=ctx.db.get<{n:number}>('SELECT COUNT(DISTINCT s.visitor_hash) n FROM analytics_events e JOIN analytics_sessions s ON s.id=e.session_id WHERE e.created_at>=?',since)?.n||0;
   const topPages=ctx.db.all<{path:string;title:string|null;pageviews:number;visitors:number}>('SELECT e.path path,MAX(e.title) title,COUNT(*) pageviews,COUNT(DISTINCT s.visitor_hash) visitors FROM analytics_events e JOIN analytics_sessions s ON s.id=e.session_id WHERE e.created_at>=? GROUP BY e.path ORDER BY pageviews DESC,path ASC LIMIT ?',since,10);
   const referrers=ctx.db.all<{source:string;pageviews:number}>("SELECT COALESCE(referrer_domain,'direct') source,COUNT(*) pageviews FROM analytics_events WHERE created_at>=? GROUP BY COALESCE(referrer_domain,'direct') ORDER BY pageviews DESC,source ASC LIMIT ?",since,10);
   const devices=ctx.db.all<{device:string|null;pageviews:number}>('SELECT s.device device,COUNT(*) pageviews FROM analytics_events e JOIN analytics_sessions s ON s.id=e.session_id WHERE e.created_at>=? GROUP BY s.device ORDER BY pageviews DESC,device ASC LIMIT 10',since).map(r=>({device:r.device||'Other',pageviews:r.pageviews}));
   const browsers=ctx.db.all<{browser:string|null;pageviews:number}>('SELECT s.browser browser,COUNT(*) pageviews FROM analytics_events e JOIN analytics_sessions s ON s.id=e.session_id WHERE e.created_at>=? GROUP BY s.browser ORDER BY pageviews DESC,browser ASC LIMIT 10',since).map(r=>({browser:r.browser||'Other',pageviews:r.pageviews}));
   const recent=ctx.db.all<{at:string;path:string;title:string|null;source:string|null;browser:string|null;device:string|null}>("SELECT e.created_at at,e.path,e.title,COALESCE(e.referrer_domain,'direct') source,s.browser,s.device FROM analytics_events e JOIN analytics_sessions s ON s.id=e.session_id WHERE e.created_at>=? ORDER BY e.created_at DESC LIMIT ?",since,RECENT_LIMIT);
   return {range,since,overview:{pageviews,visits,visitors},topPages,referrers,devices,browsers,recent:recent.map(r=>({...r,source:r.source||'direct'}))};
  }
 };
}

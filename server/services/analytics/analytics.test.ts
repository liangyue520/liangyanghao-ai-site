import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readConfig} from '../../core/config';
import {createContext} from '../../core/context';
import {pendingServices} from '../../core/services';
import {buildApp} from '../../app';
import {createAnalyticsService} from './service';

test('analytics collect enforces privacy, origin, DNT, payload limits and persists summary',async()=>{
  const config=readConfig('test-'+randomUUID());
  const ctx=createContext(config);
  const services=pendingServices();
  services.analytics=createAnalyticsService(ctx);
  const {app,auth}=await buildApp(ctx,services);
  const username='analytics-owner',password='Synthetic-'+randomUUID();
  const ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 SyntheticFullUA';
  await auth.initialize(username,password);

  const jsonHeaders={origin:config.origin,'content-type':'application/json','user-agent':ua};
  const collect=await app.inject({method:'POST',url:'/api/v1/analytics/collect',headers:jsonHeaders,payload:{type:'pageview',path:'/story/a?draft=1',title:'合成公开页',referrer:'https://external.example/path?q=1',screen:'390x844',language:'zh-CN'}});
  assert.equal(collect.statusCode,200);
  assert.deepEqual(collect.json().data,{ok:true});

  await services.analytics.collect({type:'pageview',path:'/diary/direct',title:'直接服务合成',referrer:'https://another.example/from'}, {ip:'203.0.113.9',userAgent:ua,origin:config.origin,dnt:null});
  const events=ctx.db.all<{path:string;referrer_domain:string|null}>('SELECT path,referrer_domain FROM analytics_events ORDER BY created_at ASC');
  assert.deepEqual(events.map(e=>e.path),['/story/a','/diary/direct']);
  assert.deepEqual(events.map(e=>e.referrer_domain),['external.example','another.example']);

  const sessionColumns=ctx.db.all<{name:string}>('PRAGMA table_info(analytics_sessions)').map(c=>c.name);
  assert(!sessionColumns.includes('ip'));
  assert(!sessionColumns.includes('user_agent'));
  const stored=JSON.stringify(ctx.db.all('SELECT * FROM analytics_sessions'));
  assert(!stored.includes('203.0.113.9'));
  assert(!stored.includes(ua));
  assert.match(stored,/Chrome/);

  const dnt=await app.inject({method:'POST',url:'/api/v1/analytics/collect',headers:{...jsonHeaders,dnt:'1'},payload:{type:'pageview',path:'/story/dnt'}});
  assert.equal(dnt.statusCode,403);
  assert.equal(dnt.json().error.code,'DNT_DISABLED');
  assert.equal(ctx.db.get<{n:number}>('SELECT COUNT(*) n FROM analytics_events WHERE path=?','/story/dnt')?.n,0);

  const ignored=await app.inject({method:'POST',url:'/api/v1/analytics/collect',headers:jsonHeaders,payload:{type:'pageview',path:'/admin/dashboard'}});
  assert.equal(ignored.statusCode,403);
  assert.equal(ignored.json().error.code,'PATH_IGNORED');
  assert.equal(ctx.db.get<{n:number}>('SELECT COUNT(*) n FROM analytics_events WHERE path=?','/admin/dashboard')?.n,0);

  assert.equal((await app.inject({method:'POST',url:'/api/v1/analytics/collect',headers:{...jsonHeaders,origin:'http://evil.example'},payload:{type:'pageview',path:'/story/a'}})).statusCode,403);
  assert.equal((await app.inject({method:'POST',url:'/api/v1/analytics/collect',headers:jsonHeaders,payload:{type:'pageview',path:'/story/a',extra:true}})).statusCode,400);
  assert.equal((await app.inject({method:'POST',url:'/api/v1/analytics/collect',headers:{origin:config.origin,'content-type':'text/plain'},payload:'path=/story/a'})).statusCode,415);
  assert.equal((await app.inject({method:'POST',url:'/api/v1/analytics/collect',headers:jsonHeaders,payload:{type:'pageview',path:'/story/a',title:'x'.repeat(5000)}})).statusCode,413);
  assert.equal((await app.inject({method:'GET',url:'/api/v1/admin/analytics/summary?range=7d'})).statusCode,401);

  const login=await app.inject({method:'POST',url:'/api/v1/auth/login',headers:{origin:config.origin},payload:{username,password}});
  assert.equal(login.statusCode,200);
  const cookie=String(login.headers['set-cookie']).split(';')[0];
  const summary=await app.inject({method:'GET',url:'/api/v1/admin/analytics/summary?range=7d',headers:{cookie}});
  assert.equal(summary.statusCode,200);
  assert.equal(summary.json().data.overview.pageviews,2);
  assert.equal(summary.json().data.overview.visits,2);
  assert.equal(summary.json().data.overview.visitors,2);
  assert.deepEqual(summary.json().data.topPages.map((p:{path:string})=>p.path),['/diary/direct','/story/a']);

  await app.close();
  const reopened=createContext(config);
  const nextServices=pendingServices();
  nextServices.analytics=createAnalyticsService(reopened);
  const next=await buildApp(reopened,nextServices);
  const persisted=await next.app.inject({method:'GET',url:'/api/v1/admin/analytics/summary?range=7d',headers:{cookie}});
  assert.equal(persisted.statusCode,200);
  assert.equal(persisted.json().data.overview.pageviews,2);
  await next.app.close();
});

test('analytics collect applies per-visitor rate limit',async()=>{
  const config=readConfig('test-'+randomUUID());
  const ctx=createContext(config);
  const services=pendingServices();
  services.analytics=createAnalyticsService(ctx);
  const {app}=await buildApp(ctx,services);
  const headers={origin:config.origin,'content-type':'application/json','user-agent':'Mozilla/5.0 SyntheticRateLimit Chrome/120.0'};
  let blocked=0;
  for(let i=0;i<31;i++){
    const r=await app.inject({method:'POST',url:'/api/v1/analytics/collect',headers,payload:{type:'pageview',path:`/story/rate-${i}`}});
    if(r.statusCode===429)blocked++;
  }
  assert.equal(blocked,1);
  assert.equal(ctx.db.get<{n:number}>('SELECT COUNT(*) n FROM analytics_events')?.n,30);
  await app.close();
});

test('public statistics expose only aggregate counts using Beijing calendar days',async()=>{
  const config=readConfig('test-'+randomUUID());
  const ctx=createContext(config);
  let now=Date.parse('2026-11-02T15:59:00.000Z');
  ctx.clock=()=>now;
  const services=pendingServices();
  services.analytics=createAnalyticsService(ctx);
  const {app}=await buildApp(ctx,services);
  await services.analytics.collect({type:'pageview',path:'/learning'}, {ip:'203.0.113.1',userAgent:'Browser A',origin:config.origin});
  now=Date.parse('2026-11-02T16:01:00.000Z');
  await services.analytics.collect({type:'pageview',path:'/insights'}, {ip:'203.0.113.1',userAgent:'Browser A',origin:config.origin});
  await services.analytics.collect({type:'pageview',path:'/'}, {ip:'203.0.113.2',userAgent:'Browser B',origin:config.origin});
  const response=await app.inject({method:'GET',url:'/api/v1/public/analytics/summary'});
  assert.equal(response.statusCode,200);
  assert.deepEqual(response.json().data,{todayVisitors:2,todayPageviews:2,totalVisitors:2,totalPageviews:3});
  await app.close();
});

test('analytics accepts nginx real client addresses only from the local reverse proxy',async()=>{
  const config=readConfig('test-'+randomUUID());
  const ctx=createContext(config);const services=pendingServices();
  services.analytics=createAnalyticsService(ctx);
  const {app}=await buildApp(ctx,services);
  const headers={origin:config.origin,'content-type':'application/json','user-agent':'Same Browser'};
  for(const ip of ['203.0.113.1','203.0.113.2']){
    const response=await app.inject({method:'POST',url:'/api/v1/analytics/collect',remoteAddress:'127.0.0.1',headers:{...headers,'x-real-ip':ip},payload:{type:'pageview',path:'/'}});
    assert.equal(response.statusCode,200);
  }
  const response=await app.inject({method:'GET',url:'/api/v1/public/analytics/summary'});
  assert.equal(response.json().data.totalVisitors,2);
  await app.close();
});

test('analytics accepts the HTTPS upgrade and www alias of the configured site but rejects foreign origins',async()=>{
  const config=readConfig('test-'+randomUUID());config.origin='http://example.test';
  const ctx=createContext(config);const services=pendingServices();services.analytics=createAnalyticsService(ctx);
  const {app}=await buildApp(ctx,services);
  for(const origin of ['https://example.test','https://www.example.test']){
    const response=await app.inject({method:'POST',url:'/api/v1/analytics/collect',headers:{origin,'content-type':'application/json','user-agent':'Allowed Browser'},payload:{type:'pageview',path:'/'}});
    assert.equal(response.statusCode,200);
  }
  const foreign=await app.inject({method:'POST',url:'/api/v1/analytics/collect',headers:{origin:'https://example.test.evil.example','content-type':'application/json'},payload:{type:'pageview',path:'/'}});
  assert.equal(foreign.statusCode,403);
  await app.close();
});

test('analytics ignores forwarded addresses from non-loopback clients',async()=>{
  const config=readConfig('test-'+randomUUID());const ctx=createContext(config);const services=pendingServices();services.analytics=createAnalyticsService(ctx);
  const {app}=await buildApp(ctx,services);
  for(const claimed of ['203.0.113.1','203.0.113.2']){
    const result=await app.inject({method:'POST',url:'/api/v1/analytics/collect',remoteAddress:'203.0.113.100',headers:{origin:config.origin,'content-type':'application/json','user-agent':'Same Browser','x-real-ip':claimed},payload:{type:'pageview',path:'/'}});
    assert.equal(result.statusCode,200);
  }
  const summary=await app.inject({method:'GET',url:'/api/v1/public/analytics/summary'});
  assert.equal(summary.json().data.totalVisitors,1);
  await app.close();
});

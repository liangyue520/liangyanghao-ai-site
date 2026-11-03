import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {readConfig} from '../../../core/config';
import {createContext} from '../../../core/context';
import {buildApp} from '../../../app';
import {createContentService} from '../../content/service';
import {createMediaService} from '../../media/service';
import {createExportService} from '../../export/service';
import {createAnalyticsService} from '../../analytics/service';
import type {ContentEdit,AdminDetail} from '../../../../shared/contracts';
import type {Actor} from '../../../../shared/service-ports';

export const key=randomUUID;
export const evidenceRoot=path.resolve('协作管理/验证证据/E03');
export function edit(c:AdminDetail,patch:Partial<ContentEdit>={}):ContentEdit {const {title,summary,bodyText,transcription,reflection,category,recordDate,featured,resource,game,visibility,media}=c;return {title,summary,bodyText,transcription,reflection,category,recordDate,featured,resource,game,visibility,media,...patch};}
export async function harness(label:string){
  const ctx=createContext(readConfig('e03'));
  const services={content:createContentService(ctx),media:createMediaService(ctx),exports:createExportService(ctx),analytics:createAnalyticsService(ctx)};
  const {app}=await buildApp(ctx,services);
  const identity=JSON.parse((await fs.readFile(path.join(ctx.config.dataRoot,'test-identity.json'),'utf8')).replace(/^\uFEFF/,''));
  const login=await app.inject({method:'POST',url:'/api/v1/auth/login',headers:{origin:ctx.config.origin},payload:{username:identity.username,password:identity.password}});
  assert.equal(login.statusCode,200,'isolated login');const data=login.json().data;
  const actor:Actor={...data.admin,role:'admin'};
  const cookie=String(login.headers['set-cookie']).split(';')[0];
  const headers={cookie,origin:ctx.config.origin,'x-csrf-token':data.csrfToken};
  const runId=`E03-${label}-${Date.now()}-${key().slice(0,8)}`;
  const records:unknown[]=[];
  async function request(method:'GET'|'HEAD'|'POST'|'PUT'|'DELETE',url:string,payload?:unknown,extra:Record<string,string>={},anonymous=false){
    const r=await app.inject({method,url,headers:{...(anonymous?{}:headers),...extra},...(payload===undefined?{}:{payload:payload as any})});
    let body:any;try{body=r.json();}catch{}
    records.push({method,url,status:r.statusCode,code:body?.error?.code,requestId:r.headers['x-request-id'],anonymous});return r;
  }
  async function finish(subdir?:string){const root=subdir?path.join(evidenceRoot,subdir):evidenceRoot;await fs.mkdir(root,{recursive:true});await fs.writeFile(path.join(root,`${runId}.json`),JSON.stringify({runId,environment:'e03',contractVersion:'C01-v0.1.0-review.3',mode:'synthetic',transport:'Fastify inject with real auth/routes/services/adapters',records},null,2));await app.close();}
  return {ctx,services,app,actor,headers,request,runId,records,finish};
}

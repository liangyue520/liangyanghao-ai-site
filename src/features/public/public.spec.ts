import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { effectScope, nextTick, ref } from 'vue';
import type { DateInfo, PublicDetail, PublicMedia } from '../../../shared/contracts';
import { ApiError } from '../../lib/request';
import { contentPath, diaryPages, errorMessage, externalUrl, formatDate, getKindContent, getToolboxContent, isToolboxCategory, listContents, listToolboxContents, mediaUrl, positivePage, resourceDownload, toolboxCopyText, toolboxPath, usePublicLoad, yearLabel } from './api';
import { resumeCertificateEmpty, resumeCertificates, resumeProjectCards, resumeSkillGroups, resumeTimelineSections } from './profile-resume-data';

const unknown: DateInfo = {precision:'unknown',value:null,fromYear:null,toYear:null,approximate:false,note:null};
const asset: PublicMedia = {assetId:'00000000-0000-4000-8000-000000000001',role:'diaryPage',position:0,alt:null,width:600,height:800,durationMs:null,urls:{display:'/api/v1/media/00000000-0000-4000-8000-000000000001/display'}};
test('unknown, year-only, approximate and range dates never acquire fabricated precision', () => {
  assert.equal(formatDate(unknown),'日期待确认');
  assert.equal(formatDate({...unknown,precision:'year',value:'2001'}),'2001年');
  assert.equal(formatDate({...unknown,precision:'month',value:'2001-02',approximate:true}),'约 2001年02月');
  assert.equal(formatDate({...unknown,precision:'range',fromYear:2001,toYear:2002}),'2001—2002 年（年份不确定）');
  assert.equal(yearLabel('uncertain'),'年份不确定'); assert.equal(yearLabel('unknown'),'日期未知');
});
test('media accepts only same-asset authorized variant; no original or remote fallback', () => {
  assert.equal(mediaUrl(asset,'display'),asset.urls.display);
  for(const value of ['https://example.com/a.png','/api/v1/media/00000000-0000-4000-8000-000000000001/original','/api/v1/media/00000000-0000-4000-8000-000000000002/display','//example.com/x']) {
    assert.equal(mediaUrl({...asset,urls:{display:value}},'display'),undefined);
  }
  assert.equal(mediaUrl(null,'display'),undefined);
});
test('handwritten pages are sorted without mutating DTO and exclude cover', () => {
  const rows = [{...asset,position:1},{...asset,role:'cover' as const,position:0},asset];
  assert.deepEqual(diaryPages(rows).map(x=>x.position),[0,1]); assert.equal(rows[0].position,1);
});
test('external resource never offers hosted download, including inconsistent DTO', () => {
  const content = {kind:'resource',media:[{...asset,role:'resourceFile',urls:{download:`/api/v1/media/${asset.assetId}/download`}}],resource:{mode:'download',redistribution:'allowed',permissionNote:'测试许可',author:'合成样本',sourceUrl:'https://example.com',usageInstructions:'仅测试'}} as PublicDetail;
  assert.ok(resourceDownload(content));
  assert.equal(resourceDownload({...content,resource:{...content.resource!,mode:'external'}}),undefined);
  assert.equal(resourceDownload({...content,resource:{...content.resource!,permissionNote:' '}}),undefined);
  assert.equal(resourceDownload({...content,media:[...content.media,...content.media]}),undefined);
  assert.equal(resourceDownload({...content,resource:{...content.resource!,redistribution:'unknown'}}),undefined);
});
test('external links reject executable protocols and credentials', () => {
  for(const value of ['javascript:alert(1)','data:text/html,hi','https://user:pass@example.com','http://127.0.0.1','http://192.168.1.1','http://localhost','not a url']) assert.equal(externalUrl(value),undefined);
  assert.equal(externalUrl('https://example.com/path'),'https://example.com/path');
});
test('all non-readable status messages agree; no existence or private status disclosure', () => {
  for(const code of [401,403,404,410]) assert.equal(errorMessage(new ApiError(code,'X','private information')),'这篇内容暂时无法查看。');
  assert.match(errorMessage(new ApiError(503,'SERVICE_UNAVAILABLE','internal')),/尚未就绪/);
  assert.match(errorMessage(new Error('offline')),/检查网络/);
});
test('page parser and public paths do not accept arbitrary targets', () => {
  for(const input of ['-1','0','NaN','1.5','9999999999999999999999',undefined,[]]) assert.equal(positivePage(input),1);
  assert.equal(positivePage('2'),2);
  assert.equal(contentPath({kind:'diary',id:'a/b'}),'/diary/a%2Fb');
});
test('public list encodes filters, preserves response order and does not request admin', async () => {
  const original = globalThis.fetch;
  let actual = '';
  globalThis.fetch = async (input,options) => { actual=String(input); assert.equal(options?.cache,'no-store'); return Response.json({data:{items:[{id:'B'},{id:'A'}],page:2,pageSize:12,total:20},requestId:'test'}); };
  try {
    const result = await listContents({kind:'diary',page:2,year:'uncertain',category:'演示 & 分类'});
    const url=new URL(actual,'http://127.0.0.1:5175');
    assert.equal(url.pathname,'/api/v1/public/contents'); assert.equal(url.searchParams.get('category'),'演示 & 分类'); assert.equal(url.searchParams.get('year'),'uncertain');
    assert.deepEqual(result.items.map(x=>x.id),['B','A']);
  } finally {globalThis.fetch=original;}
});
test('real 503 is surfaced and never substituted by demonstration items', async () => {
  const original=globalThis.fetch; let calls=0;
  globalThis.fetch=async ()=> {calls++; return Response.json({error:{code:'SERVICE_UNAVAILABLE',message:'not ready',fields:[]},requestId:'test'},{status:503});};
  try {await assert.rejects(()=>listContents({kind:'diary'}), (error:unknown)=>error instanceof ApiError && error.status===503);assert.equal(calls,1);}
  finally {globalThis.fetch=original;}
});
test('detail checks content kind rather than rendering an unrelated object', async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>Response.json({data:{kind:'resource'},requestId:'test'});
  try {await assert.rejects(()=>getKindContent('test','diary'),(error:unknown)=>error instanceof ApiError && error.status===404);}
  finally {globalThis.fetch=original;}
});
test('toolbox category gate only accepts the frozen public categories', () => {
  assert.equal(isToolboxCategory('写作工具'), true);
  assert.equal(isToolboxCategory('AI资源'), false);
  assert.equal(isToolboxCategory('写作工具 '), false);
  assert.equal(toolboxPath({id:'a/b'}),'/toolbox/a%2Fb');
});
test('toolbox listing trims resource results to fixed categories without requesting admin fields', async () => {
  const original=globalThis.fetch;
  const rows = [
    {id:'tool-1',kind:'resource',category:'写作工具',title:'公开工具'},
    {id:'ordinary',kind:'resource',category:'普通资源',title:'普通资源'},
    {id:'tool-2',kind:'resource',category:'开发协作',title:'协作工具'}
  ];
  globalThis.fetch=async (input) => {
    const url = new URL(String(input),'http://127.0.0.1:5175');
    assert.equal(url.pathname,'/api/v1/public/contents');
    assert.equal(url.searchParams.get('kind'),'resource');
    return Response.json({data:{items:rows,page:1,pageSize:50,total:3},requestId:'test'});
  };
  try {
    const result = await listToolboxContents({page:1,pageSize:12});
    assert.deepEqual(result.items.map(x=>x.id),['tool-1','tool-2']);
    assert.equal(result.total,2);
  } finally {globalThis.fetch=original;}
});
test('toolbox detail rejects non-toolbox resource just like a missing public object', async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>Response.json({data:{kind:'resource',category:'普通资源'},requestId:'test'});
  try {await assert.rejects(()=>getToolboxContent('ordinary'),(error:unknown)=>error instanceof ApiError && error.status===404);}
  finally {globalThis.fetch=original;}
});
test('toolbox copy text uses rendered public body only and blocks obvious sensitive fragments', () => {
  const content: PublicDetail = {id:'tool',kind:'resource',category:'写作工具',title:'提示词模板',summary:'',recordDate:unknown,featured:false,isDemo:true,publishedAt:'2026-10-06T00:00:00.000Z',cover:null,bodyText:'公开步骤\n1. 准备材料',transcription:null,reflection:null,resource:{mode:'external',sourceUrl:'https://example.com',author:'合成作者',licenseName:'合成许可',redistribution:'unknown',permissionNote:null,usageInstructions:'公开使用说明',modificationNote:null,versionLabel:'v1'},game:null,media:[]};
  assert.equal(toolboxCopyText(content),'提示词模板\n\n公开步骤\n1. 准备材料');
  assert.equal(toolboxCopyText({...content,bodyText:'storageKey: abc'}),undefined);
  assert.equal(toolboxCopyText({...content,bodyText:'/api/v1/media/00000000-0000-4000-8000-000000000001/original'}),undefined);
  assert.equal(toolboxCopyText({...content,category:'普通资源'}),undefined);
});


test('site header uses Liang Yanghao branding', () => {
  const source = readFileSync(new URL('../../layouts/SiteLayout.vue', import.meta.url), 'utf8');
  assert.match(source, /梁养浩小站/);
  assert.doesNotMatch(source, /我的记录|本地集成候选/);
});
test('homepage work cards cover user requested shortcut entries', () => {
  const source = readFileSync(new URL('./pages/HomePage.vue', import.meta.url), 'utf8');
  for (const value of ['我做过和想做的东西','日记','AI 工具箱','Skills','小游戏','小说创作 SOP','项目记录','小说创作','AI 学习','科比专题','表情包制作','求职找工作方法']) {
    assert.ok(source.includes(value), value);
  }
  assert.doesNotMatch(source, /音乐|天气|外部 API|禁用右键/);
});
test('public resume page exposes technical profile without private contact details', () => {
  const dataText = JSON.stringify({resumeTimelineSections,resumeSkillGroups,resumeProjectCards,resumeCertificateEmpty,resumeCertificates});
  const storySource = readFileSync(new URL('./pages/StoryPage.vue', import.meta.url), 'utf8');
  const routerSource = readFileSync(new URL('../../router.ts', import.meta.url), 'utf8');
  const layoutSource = readFileSync(new URL('../../layouts/SiteLayout.vue', import.meta.url), 'utf8');
  const homeSource = readFileSync(new URL('./pages/HomePage.vue', import.meta.url), 'utf8');
  const heroSource = readFileSync(new URL('./components/ProfileHero.vue', import.meta.url), 'utf8');
  const text = [dataText, storySource, routerSource, layoutSource, homeSource, heroSource].join('\n');
  for (const value of ['关于我','C/C++','Qt','工业视觉','AI 辅助开发','求职找工作方法','证书与荣誉','优秀员工','质量先进集体','excellent-employee-2021.webp','quality-team-2023.webp']) {
    assert.ok(text.includes(value), value);
  }
  assert.match(routerSource, /path:"\/resume",redirect:"\/story"/);
  assert.doesNotMatch(layoutSource, /to="\/resume"/);
  assert.doesNotMatch(storySource, /公开故事|暂时没有公开故事/);
  for (const project of resumeProjectCards) assert.match(project.href, new RegExp('^/[a-z]'));
  assert.equal(resumeCertificateEmpty.status, '公开展示');
  assert.equal(resumeCertificates.length, 4);
  assert.equal(resumeCertificates.filter(item => item.title === '优秀员工').length, 3);
  assert.ok(resumeCertificates.some(item => item.title === '质量先进集体'));
  for (const certificate of resumeCertificates) assert.match(certificate.image, /\.webp$/);
  assert.doesNotMatch(text, /1[3-9]\d{9}/);
  assert.doesNotMatch(text, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  assert.doesNotMatch(text, /期望薪资|15-18K|2644452468|17328220067|身份证/);
});
test('route changes discard late responses, clear stale content and abort on disposal', async () => {
  const scope=effectScope(); const key=ref('first');
  const pending: {signal:AbortSignal;resolve:(v:string)=>void}[]=[];
  const state=scope.run(()=>usePublicLoad(key, signal=>new Promise<string>(resolve=>pending.push({signal,resolve}))))!;
  key.value='second'; await nextTick(); assert.equal(pending[0].signal.aborted,true);
  pending[1].resolve('second data'); await Promise.resolve(); await nextTick();
  pending[0].resolve('stale first data'); await Promise.resolve(); await nextTick();
  assert.equal(state.data.value,'second data');
  key.value='third'; await nextTick(); assert.equal(state.data.value,undefined);assert.equal(state.loading.value,true);
  scope.stop(); assert.equal(pending[2].signal.aborted,true);pending[2].resolve('after unmount');await Promise.resolve();
  assert.equal(state.data.value,undefined);
});

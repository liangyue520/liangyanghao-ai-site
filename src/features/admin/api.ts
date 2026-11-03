import { request, upload, ApiError } from '../../lib/request';
import type { AdminDetail, AdminMediaAsset, AdminSummary, ContentEdit, ContentInput, DateInfo, DeleteResult, ExportJob, Kind, ListQuery, MediaLink, Page, Purpose, ResourceData, Visibility } from '../../../shared/contracts';
import { editSchemaFor, unknownDate } from '../../../shared/schemas';

export const kindLabels: Record<Kind,string> = { profile:'个人介绍',story:'小说 / 故事',diary:'日记',video:'视频',resource:'资源',game:'作品入口' };
export const statusLabels = { draft:'草稿',published:'已发布',withdrawn:'已撤回' };
export const purposeLabels: Record<Purpose,string> = {diaryPage:'日记页',cover:'封面',video:'视频',resourceFile:'资源文件'};
export const toolboxCategories = ['写作工具','开发协作','知识整理','网站运营','通用提示词'] as const;
export type ToolboxCategory = typeof toolboxCategories[number];
export const skillMarkdownTemplate = `# 工具名称

## 标签
- 标签：

## 适用场景
-

## 输入
\`\`\`text

\`\`\`

## 输出
\`\`\`text

\`\`\`

## 使用步骤
1.
2.
3.

## 示例
\`\`\`text

\`\`\`

## 注意事项
- 已脱敏：否
- 不包含本地路径、账号密钥、服务器 IP、真实日记、客户信息或未授权项目材料。

## 版本与许可
- 作者：
- 来源：
- 许可：
- 再分发说明：
`;
export const copy = <T>(value:T):T => JSON.parse(JSON.stringify(value));
export const blankEdit = ():ContentEdit => ({title:'',summary:'',bodyText:null,transcription:null,reflection:null,category:null,recordDate:unknownDate(),featured:false,resource:null,game:null,visibility:'private',media:[]});
export const blankResource = ():ResourceData => ({mode:'external',sourceUrl:null,author:null,licenseName:null,redistribution:'unknown',permissionNote:null,usageInstructions:'',modificationNote:null,versionLabel:null});
export function normalizeMedia(links:MediaLink[]) { const counts:Partial<Record<Purpose,number>>={};return links.map(l=>({...l,position:(counts[l.role]=(counts[l.role]??-1)+1)})); }
export function isToolboxCategory(value:string|null|undefined):value is ToolboxCategory { return toolboxCategories.includes(value as ToolboxCategory); }
export function isToolboxResource(value:Pick<ContentEdit,'category'>|null|undefined) { return isToolboxCategory(value?.category); }
export function applySkillTemplate(edit:ContentEdit) {
 edit.bodyText=edit.bodyText?.trim()?edit.bodyText:skillMarkdownTemplate;
 edit.resource??=blankResource();
 edit.resource.usageInstructions=edit.resource.usageInstructions||'按正文中的适用场景、输入和使用步骤使用。';
 return edit;
}
export function analyzeToolboxRelease(edit:ContentEdit) {
 const resource=edit.resource;
 const linkedDownload=edit.media.some(m=>m.role==='resourceFile');
 const text=[edit.title,edit.summary,edit.bodyText,edit.category,resource?.sourceUrl,resource?.author,resource?.licenseName,resource?.permissionNote,resource?.usageInstructions,resource?.modificationNote,resource?.versionLabel,...edit.media.map(m=>m.alt)].filter(Boolean).join('\n');
 const blockers:string[]=[];const warnings:string[]=[];
 const checks:[RegExp,string][]=[
  [/(?:^|[\s("'`])(?:[A-Z]:[\\/][^\s"'`<>]+|\\\\[^\\\s]+\\[^\s]+|\/(?:home|Users|var|etc)\/[^\s"'`<>]+)|storageKey/i,'含本地路径、内部存储路径或 storageKey'],
  [/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{2,5})?\b|localhost|ssh:\/\/|postgres:\/\/|mysql:\/\//i,'含服务器、内网地址、管理端口或数据库地址'],
  [/(api[_-]?key|token|secret|password|passwd|cookie|csrf|private[_ -]?key|BEGIN [A-Z ]*PRIVATE KEY|sk-[A-Za-z0-9_-]{8,})/i,'含账号密码、Token、Cookie、CSRF、API Key、Secret 或私钥'],
  [/(真实日记|手写日记|私密媒体|未授权个人照片|未授权视频|原始日记)/,'含真实日记、私密媒体或未授权个人材料'],
  [/(客户|项目方|合同|报价|同事姓名|会议纪要|内部资料|未脱敏项目)/,'含客户、公司、项目方或未脱敏项目资料'],
  [/(完整任务日志|审查原文|内部协作原文|未脱敏\s*Prompt)/i,'含未脱敏 Prompt、任务日志或内部协作原文'],
  [/(未授权第三方全文|付费资料|内部资料搬运|破解|绕过付费)/,'含未确认授权第三方全文、付费资料或内部资料搬运'],
  [/(漏洞利用|攻击步骤|绕过步骤|完整\s*(nginx|ssh|systemd|iptables|firewall|防火墙)\s*配置)/i,'含可复用攻击细节或完整服务器防护配置'],
 ];
 for(const [pattern,message] of checks)if(pattern.test(text))blockers.push(message);
 if(!/已脱敏\s*[:：]\s*(是|已确认|确认)/.test(edit.bodyText||''))blockers.push('Markdown 正文未标记“已脱敏：是”');
 if(!resource)blockers.push('资源信息未填写');
 else {
  if(!resource.sourceUrl?.trim()||!resource.author?.trim()||!resource.usageInstructions?.trim())blockers.push('来源网址、作者/署名和使用说明必须填写');
  if(resource.mode==='download'&&(!linkedDownload||resource.redistribution!=='allowed'||!resource.permissionNote?.trim()))blockers.push('本站下载必须有关联附件、允许再分发和许可依据说明');
  if(resource.mode==='external'&&linkedDownload)blockers.push('链接原出处时不能公开关联本站下载附件');
  if(resource.mode==='external'&&resource.redistribution!=='allowed')warnings.push('当前为外链模式，许可不完整时只能引导访客打开原出处');
  if(resource.mode==='download')warnings.push('请确认附件为自制或已获得再分发授权');
 }
 if(/<[^>\n]+>|example\.com|示例路径|占位/.test(text))warnings.push('正文含占位符或示例地址，请确认不是待替换内容');
 if(/部署|故障复盘|项目经验/.test(text))warnings.push('正文包含项目经验或部署复盘，请确认已经抽象脱敏');
 return {blockers:[...new Set(blockers)],warnings:[...new Set(warnings)]};
}
export function editPayload(kind:Kind, source:ContentEdit):ContentEdit {
 const result:ContentEdit={title:source.title,summary:source.summary,bodyText:source.bodyText,transcription:kind==='diary'?source.transcription:null,reflection:kind==='diary'?source.reflection:null,category:source.category||null,recordDate:copy(source.recordDate),featured:source.featured,resource:kind==='resource'?copy(source.resource):null,game:kind==='game'?copy(source.game):null,visibility:source.visibility,media:normalizeMedia(source.media)};
 if(kind==='resource'&&result.resource?.mode!=='download')result.media=result.media.filter(m=>m.role!=='resourceFile');
 return result;
}
export function dateLabel(d:DateInfo) { const value=d.precision==='unknown'?'日期待确认':d.precision==='range'?`${d.fromYear}—${d.toYear} 年`:d.value;return `${d.approximate?'约 ':''}${value}${d.note?` · ${d.note}`:''}`; }
export const timeLabel=(value:string)=>new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
export function errorMessage(error:unknown) {
 if(error instanceof ApiError){const lead=error.status===401?'登录已失效，请重新登录。':error.code==='REVISION_CONFLICT'?'内容已在别处修改。请核对最新版本；当前编辑仍保留。':error.status===503?'服务暂未接通或不可用，请稍后重试。':error.message;return `${lead}${error.fields.length?' '+error.fields.map(f=>`${f.path}：${f.message}`).join('；'):''}${error.requestId?`（请求 ${error.requestId}）`:''}`;}
 return error instanceof Error?error.message:'操作失败，请重试';
}
export function safeMediaUrl(value:string|undefined) { return value&&/^\/api\/v1\/media\/[a-f0-9-]+\/(original|display|thumbnail|playback|download)$/.test(value)?value:undefined; }
export type AnalyticsRange = '1d'|'7d'|'30d';
export interface AnalyticsTotals { pageviews?:number; views?:number; visitors?:number; visits?:number; sessions?:number; bounceRate?:number|null; avgDurationSeconds?:number|null }
export interface AnalyticsDimension { label?:string; name?:string; value?:string; path?:string; title?:string|null; domain?:string; source?:string; device?:string; browser?:string; views?:number; pageviews?:number; visitors?:number; visits?:number; count?:number; percent?:number|null }
export interface AnalyticsRecentVisit { path:string; title?:string|null; source?:string|null; referrer?:string|null; referrerDomain?:string|null; device?:string|null; browser?:string|null; language?:string|null; at?:string; createdAt?:string; occurredAt?:string; views?:number; pageviews?:number }
export interface AnalyticsSummary { range?:AnalyticsRange; since?:string; from?:string; to?:string; pageViews?:number; visits?:number; visitors?:number; overview?:{pageviews?:number;visits?:number;visitors?:number}; totals?:AnalyticsTotals; topPages?:AnalyticsDimension[]; pages?:AnalyticsDimension[]; referrers?:AnalyticsDimension[]; sources?:AnalyticsDimension[]; devices?:AnalyticsDimension[]; browsers?:AnalyticsDimension[]; recent?:AnalyticsRecentVisit[]; recentVisits?:AnalyticsRecentVisit[] }
export type Transport = {request:typeof request;upload:typeof upload};
export function createAdminApi(transport:Transport={request,upload}) {
 const base='/api/v1/admin/contents';
 return {
  list(query:Partial<ListQuery>={}) { const params=new URLSearchParams();for(const [key,value] of Object.entries(query))if(value!==undefined&&value!=='')params.set(key,String(value));return transport.request<Page<AdminSummary>>(`${base}?${params}`); },
  get:(id:string)=>transport.request<AdminDetail>(`${base}/${encodeURIComponent(id)}`),
  create:(body:ContentInput,key:string)=>transport.request<AdminDetail>(base,{method:'POST',body,idempotencyKey:key}),
  save:(id:string,body:ContentEdit,revision:number,key:string)=>transport.request<AdminDetail>(`${base}/${id}`,{method:'PUT',body,revision,idempotencyKey:key}),
  action:(id:string,action:'publish'|'visibility'|'withdraw',body:unknown,revision:number,key:string)=>transport.request<AdminDetail>(`${base}/${id}/${action}`,{method:'POST',body,revision,idempotencyKey:key}),
  remove:(id:string,revision:number,key:string)=>transport.request<DeleteResult>(`${base}/${id}`,{method:'DELETE',revision,idempotencyKey:key}),
  assets:(id:string,page=1)=>transport.request<Page<AdminMediaAsset>>(`${base}/${id}/media?page=${page}&pageSize=50`),
  upload:(id:string,purpose:Purpose,file:File,key:string,progress?:(value:number)=>void)=>{const data=new FormData();data.append('purpose',purpose);data.append('file',file);return transport.upload<{asset:AdminMediaAsset;contentRevision:number}>(`${base}/${id}/media`,data,key,progress);},
  exportCreate:(key:string)=>transport.request<Pick<ExportJob,'id'|'state'>>('/api/v1/admin/exports',{method:'POST',body:{},idempotencyKey:key}),
  exportGet:(id:string)=>transport.request<ExportJob>(`/api/v1/admin/exports/${encodeURIComponent(id)}`),
  analyticsSummary:(range:AnalyticsRange)=>transport.request<AnalyticsSummary>(`/api/v1/admin/analytics/summary?range=${range}`),
 };
}
export const adminApi=createAdminApi();

// Keep an uncertain write's exact payload and key until its result is resolved.
export class EditorModel {
 kind:Kind='diary';isDemo=false;form=blankEdit();saved:AdminDetail|null=null;assets:AdminMediaAsset[]=[];
 busy=false;error='';notice='';pending:null|{label:string;run:()=>Promise<void>}=null;
 constructor(public api=adminApi){}
 get dirty(){return !this.saved||JSON.stringify(editPayload(this.kind,this.form))!==JSON.stringify(editPayload(this.kind,this.saved));}
 get locked(){return this.busy||!!this.pending||!!this.saved?.deletedAt||this.saved?.status==='published';}
 accept(detail:AdminDetail){this.saved=copy(detail);this.form=editPayload(detail.kind,detail);this.kind=detail.kind;this.isDemo=detail.isDemo;for(const a of detail.mediaAssets)this.keepAsset(a);}
 keepAsset(asset:AdminMediaAsset){this.assets=[...this.assets.filter(a=>a.assetId!==asset.assetId),asset];}
 async load(id:string){this.busy=true;this.error='';try{this.accept(await this.api.get(id));}catch(e){this.error=errorMessage(e);}finally{this.busy=false;}}
 async attempt(label:string,run:()=>Promise<void>){if(this.busy)return;this.busy=true;this.error='';this.notice='';this.pending={label,run};try{await run();this.pending=null;}catch(e){this.error=errorMessage(e);if(e instanceof ApiError&&e.status<500&&e.code!=='REQUEST_IN_PROGRESS')this.pending=null;}finally{this.busy=false;}}
 async retry(){const p=this.pending;if(p)await this.attempt(p.label,p.run);}
 async save(){
  if(this.locked)return;
  const payload=editPayload(this.kind,this.form);const parsed=editSchemaFor(this.kind).safeParse(payload);
  if(!parsed.success){this.notice='';this.error=parsed.error.issues.map(i=>`${i.path.join('.')}：${i.message}`).join('；');return;}
  const key=crypto.randomUUID();const existing=this.saved;
  if(existing){await this.attempt('保存',async()=>{this.accept(await this.api.save(existing.id,payload,existing.revision,key));this.notice='已保存';});}
  else {const {visibility,media,...fields}=payload;const input:ContentInput={...fields,kind:this.kind,isDemo:this.isDemo};await this.attempt('创建草稿',async()=>{this.accept(await this.api.create(input,key));this.notice='私密草稿已保存，可以上传文件';});}
 }
 async refreshAssets(){if(!this.saved)return;let page=1;while(true){const result=await this.api.assets(this.saved.id,page);for(const asset of result.items)this.keepAsset(asset);if(page*result.pageSize>=result.total)break;page++;}}
 link(asset:AdminMediaAsset){if(this.form.media.some(m=>m.assetId===asset.assetId))return;if(asset.purpose==='resourceFile'&&this.form.resource?.mode!=='download')return;
  if(asset.purpose!=='diaryPage'&&this.form.media.some(m=>m.role===asset.purpose))throw Error('请先移除已有的同类关联，再选择此文件。原件会保留。');
  if(this.form.media.length>=100)throw Error('每篇内容最多关联 100 项媒体');
  this.form.media=normalizeMedia([...this.form.media,{assetId:asset.assetId,role:asset.purpose,position:0,alt:null}]);this.notice='文件已加入编辑区，尚未保存关联';
 }
 async action(action:'publish'|'visibility'|'withdraw',visibility?:Visibility){if(!this.saved||this.busy||this.pending||this.dirty)return;const current=copy(this.saved);const body=action==='publish'?{confirmVisibility:current.visibility}:action==='visibility'?{visibility}:{};const key=crypto.randomUUID();await this.attempt(action,async()=>{this.accept(await this.api.action(current.id,action,body,current.revision,key));this.notice=action==='publish'?'发布成功':action==='withdraw'?'已撤回，原件保留':'已改为私密';});}
 async remove(){if(!this.saved||this.busy||this.pending||this.dirty)return;const current=copy(this.saved);const key=crypto.randomUUID();await this.attempt('软删除',async()=>{const result=await this.api.remove(current.id,current.revision,key);this.accept({...current,...result});this.notice='已软删除，原件仍保留在完整导出中';});}
}

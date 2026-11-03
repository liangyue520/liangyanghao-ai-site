import type {Content,MediaAsset,PublicMedia,PublicSummary,PublicDetail,AdminDetail,ListQuery,Page} from '../../../shared/contracts';
import {editSchemaFor,resourceDownloadAllowed,validExternalUrl} from '../../../shared/schemas';
import {AppError,parse} from '../../core/errors';
import {canReadMedia} from '../../core/permissions';
import {adminAsset,mediaUrl} from '../media/repository';

export const TOOLBOX_CATEGORIES = ['写作工具','开发协作','知识整理','网站运营','通用提示词'] as const;
export type ToolboxCategory = typeof TOOLBOX_CATEGORIES[number];
const toolboxCategories = new Set<string>(TOOLBOX_CATEGORIES);

export interface ToolboxSafetyCheck {blockers:string[];warnings:string[]}

export function checkRevision(c:Content,revision:number){if(c.revision!==revision)throw new AppError(409,'REVISION_CONFLICT','内容已变更，请刷新');}
export function editable(c:Content){if(c.deletedAt)throw new AppError(410,'CONTENT_DELETED','内容已删除');if(c.status==='published')throw new AppError(409,'EDIT_REQUIRES_WITHDRAW','请先撤回内容');}
export function isToolboxCategory(value:string|null|undefined):value is ToolboxCategory {return !!value&&toolboxCategories.has(value);}
export function isToolboxContent(c:Content){return c.kind==='resource'&&isToolboxCategory(c.category);}
export function toolboxReleaseCheck(c:Content,assets:MediaAsset[]=[]):ToolboxSafetyCheck {
  const r=c.resource;
  const text=[c.title,c.summary,c.bodyText,c.category,r?.sourceUrl,r?.author,r?.licenseName,r?.permissionNote,r?.usageInstructions,r?.modificationNote,r?.versionLabel,...assets.map(a=>a.originalName)].filter((v):v is string=>typeof v==='string').join('\n');
  const blockers:{label:string;re:RegExp}[]=[
    {label:'本地绝对路径或内部存储路径',re:/\b[A-Za-z]:[\\/][^\s`'"<>]+|\/(?:home|root|var|etc)\/[^\s`'"<>]+|\bstorageKey\b|\bobjects\//i},
    {label:'服务器或内网地址',re:/(?:ssh|postgres|mysql|redis):\/\/|(?:\b\d{1,3}\.){3}\d{1,3}\b|(?:管理端口|数据库地址|内网地址|公网 IP|公网IP|服务器 IP|服务器IP)/i},
    {label:'账号密码或会话凭据',re:/(?:api[_-]?key|token|cookie|csrf|secret|private[_ -]?key|BEGIN [A-Z ]*PRIVATE KEY|password\s*[=:]|密码\s*[:：]|环境变量密钥)/i},
    {label:'真实日记或私密媒体',re:/(?:真实日记|手写照片|未授权个人照片|未授权个人视频|私密媒体|日记原文)/},
    {label:'客户、公司或项目方资料',re:/(?:客户资料|客户名称|同事姓名|合同|报价|项目内部资料|会议原文|协作原文)/},
    {label:'内部任务原文或未脱敏 Prompt',re:/(?:完整任务日志|审查原文|内部协作上下文|未脱敏\s*Prompt|历史助手原始\s*Prompt)/i},
    {label:'未确认授权第三方内容',re:/(?:未授权第三方|付费资料|内部资料搬运|第三方全文)/},
    {label:'可复用攻击或服务器防护细节',re:/(?:完整\s*(?:Nginx|SSH|systemd|防火墙)配置|服务器防护策略|攻击步骤|绕过步骤)/i}
  ];
  const warnings:{label:string;re:RegExp}[]=[
    {label:'从真实项目提炼但已声明脱敏',re:/(?:已脱敏|脱敏后|真实项目提炼|项目复盘)/},
    {label:'抽象部署经验或故障复盘',re:/(?:抽象部署经验|故障复盘|部署经验)/},
    {label:'external 外链许可需人工确认',re:/(?:仅跳转来源|许可不完整|外链许可)/},
    {label:'模板占位符需确认不是可用真实值',re:/(?:<示例路径>|<测试账号文件>|example\.com|示例账号|示例路径)/i},
    {label:'自制附件需确认作者、许可和再分发说明',re:/(?:自制模板|自制说明|自制附件)/}
  ];
  const result:ToolboxSafetyCheck={blockers:blockers.filter(x=>x.re.test(text)).map(x=>x.label),warnings:warnings.filter(x=>x.re.test(text)).map(x=>x.label)};
  return result;
}
export function validateLinks(c:Content,assets:MediaAsset[]){
  const {title,summary,bodyText,transcription,reflection,category,recordDate,featured,resource,game,visibility,media}=c;
  parse(editSchemaFor(c.kind),{title,summary,bodyText,transcription,reflection,category,recordDate,featured,resource,game,visibility,media});
  for(const m of c.media)if(!assets.some(a=>a.id===m.assetId&&a.contentId===c.id&&a.state==='ready'&&a.purpose===m.role))throw new AppError(422,'MEDIA_NOT_READY','附件不存在或不属于此内容',[{path:'media',message:'请重新选择有效附件'}]);
}
export function validatePublish(c:Content,assets:MediaAsset[]){
  try {validateLinks(c,assets);} catch(e){if(e instanceof AppError&&e.status===422)throw new AppError(422,'PUBLISH_VALIDATION_FAILED','发布内容或附件无效',e.fields);throw e;}
  let valid=true;
  if(c.kind==='profile'||c.kind==='story')valid=!!c.bodyText?.trim();
  if(c.kind==='diary')valid=!!(c.bodyText?.trim()||c.transcription?.trim())||c.media.some(m=>m.role==='diaryPage');
  if(c.kind==='video')valid=c.media.filter(m=>m.role==='video').length===1;
  if(c.kind==='resource'){const r=c.resource;valid=!!r&&!!r.author?.trim()&&!!r.sourceUrl&&validExternalUrl(r.sourceUrl)&&!!r.usageInstructions.trim()&&(r.mode==='external'||resourceDownloadAllowed(c,assets));}
  if(c.kind==='game')valid=!!c.game&&validExternalUrl(c.game.launchUrl);
  if(!valid)throw new AppError(422,'PUBLISH_VALIDATION_FAILED','请补齐发布所需正文、附件或来源许可');
  if(c.visibility==='public'&&isToolboxContent(c)){const safety=toolboxReleaseCheck(c,assets);if(safety.blockers.length)throw new AppError(422,'PUBLISH_VALIDATION_FAILED','AI工具箱内容包含不可公开信息',[{path:'bodyText',message:safety.blockers.join('；')}]);}
}
export function publicMedia(c:Content,assets:MediaAsset[]):PublicMedia[]{
  return c.media.flatMap(m=>{const a=assets.find(a=>a.id===m.assetId);if(!a)return [];const urls:PublicMedia['urls']={};for(const v of a.variants)if(v.name!=='original'&&canReadMedia(null,c,a,v.name,assets))urls[v.name]=mediaUrl(a.id,v.name);return Object.keys(urls).length?[{assetId:m.assetId,role:m.role,position:m.position,alt:m.alt,width:a.width,height:a.height,durationMs:a.durationMs,urls}]:[];});
}
export function summary(c:Content,assets:MediaAsset[],admin=false):PublicSummary {
  let cover=publicMedia(c,assets).find(m=>m.role==='cover')||null;
  if(admin){const link=c.media.find(m=>m.role==='cover'),a=assets.find(a=>a.id===link?.assetId&&a.contentId===c.id&&a.purpose==='cover');if(link&&a)cover={...link,width:a.width,height:a.height,durationMs:a.durationMs,urls:Object.fromEntries(a.variants.filter(v=>v.name==='display'||v.name==='thumbnail').map(v=>[v.name,mediaUrl(a.id,v.name)]))};}
  const {id,kind,title,summary,category,recordDate,featured,isDemo,publishedAt}=c;
  const excerpt=kind==='diary'?diaryExcerpt(c.bodyText||c.transcription):null;
  return {id,kind,title,summary,category,recordDate,featured,isDemo,publishedAt,cover,excerpt};
}
function diaryExcerpt(value:string|null|undefined):string|null {
  const text=value?.replace(/\s+/g,' ').trim();
  if(!text)return null;
  const chars=Array.from(text);
  return chars.length>180?`${chars.slice(0,180).join('')}…`:text;
}
export function publicDetail(c:Content,a:MediaAsset[]):PublicDetail {return {...summary(c,a),bodyText:c.bodyText,transcription:c.transcription,reflection:c.reflection,resource:c.resource,game:c.game,media:publicMedia(c,a)};}
export function adminDetail(c:Content,a:MediaAsset[]):AdminDetail {return {...c,mediaAssets:a.filter(a=>c.media.some(m=>m.assetId===a.id)).map(adminAsset)};}
export function paginate<T>(items:T[],q:ListQuery):Page<T>{if(!Number.isSafeInteger(q.page)||q.page<1||!Number.isInteger(q.pageSize)||q.pageSize<1||q.pageSize>50)throw new AppError(400,'BAD_REQUEST','分页参数无效');return {items:items.slice((q.page-1)*q.pageSize,q.page*q.pageSize),page:q.page,pageSize:q.pageSize,total:items.length};}
export function yearKey(c:Content){return c.recordDate.precision==='unknown'?'unknown':c.recordDate.precision==='range'?'uncertain':c.recordDate.value!.slice(0,4);}

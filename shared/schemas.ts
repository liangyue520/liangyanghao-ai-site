import {z} from 'zod';
import {kinds,type Kind,type Content,type ContentEdit,type MediaAsset} from './contracts';
const text=(n:number,min=0)=>z.string().refine(s=>Array.from(s).length>=min&&Array.from(s).length<=n,`长度必须为${min}—${n}个字符`);
const nullableText=(n:number)=>text(n).nullable();
export const uuidSchema=z.uuid();
export const visibilitySchema=z.enum(['private','public']);
export const purposeSchema=z.enum(['diaryPage','cover','video','resourceFile']);
export function validExternalUrl(value:string):boolean {
 try {const u=new URL(value);const h=u.hostname.toLowerCase().replace(/^\[|\]$/g,'');
 if(!['http:','https:'].includes(u.protocol)||u.username||u.password||h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local'))return false;
 if(h.includes(':')){
  const halves=h.split('::');const left=halves[0].split(':').filter(Boolean);const right=(halves[1]||'').split(':').filter(Boolean);
  const words=(halves.length===2?[...left,...Array(8-left.length-right.length).fill('0'),...right]:left).map(x=>parseInt(x,16));
  if(words.length!==8||words.every(x=>x===0)||words.slice(0,7).every(x=>x===0)&&words[7]===1||(words[0]&0xfe00)===0xfc00||(words[0]&0xffc0)===0xfe80||words[0]>=0xff00)return false;
  if(words.slice(0,5).every(x=>x===0)&&words[5]===0xffff){const a=words[6]>>8,b=words[6]&255;if(a===0||a===10||a===127||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a>=224)return false;}
 }
 if(/^\d+\.\d+\.\d+\.\d+$/.test(h)){const [a,b]=h.split('.').map(Number);if(a===0||a===10||a===127||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a>=224)return false;}
 return true;}catch{return false;}
}
const url=text(2048,1).refine(validExternalUrl,'仅允许公开HTTP/HTTPS来源地址');
export const dateSchema=z.strictObject({precision:z.enum(['unknown','year','month','day','range']),value:z.string().nullable(),fromYear:z.number().int().min(1).max(9999).nullable(),toYear:z.number().int().min(1).max(9999).nullable(),approximate:z.boolean(),note:nullableText(200)}).superRefine((d,c)=>{
 let ok=true;
 if(d.precision==='unknown')ok=d.value===null&&d.fromYear===null&&d.toYear===null&&!d.approximate;
 else if(d.precision==='range')ok=d.value===null&&d.fromYear!==null&&d.toYear!==null&&d.fromYear<=d.toYear;
 else {const re={year:/^\d{4}$/,month:/^\d{4}-\d{2}$/,day:/^\d{4}-\d{2}-\d{2}$/}[d.precision];const v=d.value||'';const [y,m=1,day=1]=v.split('-').map(Number);const leap=y%4===0&&(y%100!==0||y%400===0);const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];ok=re.test(v)&&y>=1&&y<=9999&&m>=1&&m<=12&&day>=1&&day<=days[m-1]&&d.fromYear===null&&d.toYear===null;}
 if(!ok)c.addIssue({code:'custom',message:'日期精度或值不合法'});
});
export const unknownDate=()=>({precision:'unknown' as const,value:null,fromYear:null,toYear:null,approximate:false,note:null});
export const resourceSchema=z.strictObject({mode:z.enum(['external','download']),sourceUrl:url.nullable(),author:nullableText(200),licenseName:nullableText(200),redistribution:z.enum(['unknown','allowed','forbidden']),permissionNote:nullableText(2000),usageInstructions:text(2000),modificationNote:nullableText(2000),versionLabel:nullableText(80)});
export const gameSchema=z.strictObject({launchUrl:url,usageInstructions:text(2000)});
export const mediaLinkSchema=z.strictObject({assetId:uuidSchema,role:purposeSchema,position:z.number().int().nonnegative(),alt:nullableText(300)});
const fields={title:text(120,1).transform(s=>s.trim()).pipe(text(120,1)),summary:text(500),bodyText:nullableText(100000),transcription:nullableText(100000),reflection:nullableText(100000),category:text(40,1).nullable(),recordDate:dateSchema,featured:z.boolean(),resource:resourceSchema.nullable(),game:gameSchema.nullable()};
function applicability(k:Kind,v:{transcription:string|null;reflection:string|null;resource:unknown;game:unknown},c:z.RefinementCtx){
 if(k!=='diary')for(const p of ['transcription','reflection'] as const)if(v[p]!==null)c.addIssue({code:'custom',path:[p],message:'此类型必须为null'});
 if(k!=='resource'&&v.resource!==null)c.addIssue({code:'custom',path:['resource'],message:'此类型必须为null'});
 if(k!=='game'&&v.game!==null)c.addIssue({code:'custom',path:['game'],message:'此类型必须为null'});
}
export const contentInputSchema=z.strictObject({kind:z.enum(kinds),title:fields.title,summary:fields.summary.default(''),bodyText:fields.bodyText.default(null),transcription:fields.transcription.default(null),reflection:fields.reflection.default(null),category:fields.category.default(null),recordDate:fields.recordDate.default(unknownDate),featured:fields.featured.default(false),resource:fields.resource.default(null),game:fields.game.default(null),isDemo:z.boolean().default(false)}).superRefine((v,c)=>applicability(v.kind,v,c));
export const contentEditSchema=z.strictObject({...fields,visibility:visibilitySchema,media:z.array(mediaLinkSchema).max(100)});
export function editSchemaFor(kind:Kind){return contentEditSchema.superRefine((v,c)=>{
 applicability(kind,v,c);const ids=new Set<string>();const counts:Record<string,number>={};
 for(const m of v.media){if(ids.has(m.assetId))c.addIssue({code:'custom',path:['media'],message:'不能重复关联资产'});ids.add(m.assetId);const n=counts[m.role]||0;if(m.position!==n)c.addIssue({code:'custom',path:['media'],message:'各角色位置必须从0连续排列'});counts[m.role]=n+1;
 const allowed=m.role==='cover'||kind==='diary'&&m.role==='diaryPage'||kind==='video'&&m.role==='video'||kind==='resource'&&v.resource?.mode==='download'&&m.role==='resourceFile';if(!allowed)c.addIssue({code:'custom',path:['media'],message:'此类型或模式不允许此附件'});}
 for(const r of ['cover','video','resourceFile'])if((counts[r]||0)>1)c.addIssue({code:'custom',path:['media'],message:'该角色最多一个附件'});
});}
export const loginSchema=z.strictObject({username:text(64,1),password:text(128,12)});
export const emptySchema=z.strictObject({});
export const publishSchema=z.strictObject({confirmVisibility:visibilitySchema});
export const visibilityInputSchema=z.strictObject({visibility:visibilitySchema});
const pageNum=z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().safe());
const bool=z.enum(['true','false']).transform(v=>v==='true');
export const publicQuerySchema=z.strictObject({page:pageNum.default(1),pageSize:pageNum.pipe(z.number().max(50)).default(20),kind:z.enum(kinds).optional(),year:z.string().regex(/^(?!0000)\d{4}$|^(unknown|uncertain)$/).optional(),category:text(40,1).optional(),featured:bool.optional()});
export const adminQuerySchema=z.strictObject({page:pageNum.default(1),pageSize:pageNum.pipe(z.number().max(50)).default(20),kind:z.enum(kinds).optional(),status:z.enum(['draft','published','withdrawn']).optional(),visibility:visibilitySchema.optional(),includeDeleted:bool.default(false)});
export const pageQuerySchema=z.strictObject({page:pageNum.default(1),pageSize:pageNum.pipe(z.number().max(50)).default(20)});
const analyticsPath=z.string().min(1).max(300).regex(/^\/(?!\/)/,'必须是站内路径');
export const analyticsCollectSchema=z.strictObject({
 type:z.literal('pageview'),
 path:analyticsPath,
 title:text(120).optional(),
 referrer:text(300).optional(),
 screen:z.string().max(20).regex(/^\d{2,5}x\d{2,5}$/).optional(),
 language:z.string().max(35).regex(/^[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*$/).optional()
});
export const analyticsSummaryQuerySchema=z.strictObject({range:z.enum(['1d','7d','30d']).default('7d')});
export function resourceDownloadAllowed(c:Content,assets:MediaAsset[]):boolean{
 const r=c.resource;const links=c.media.filter(m=>m.role==='resourceFile');
 return c.kind==='resource'&&r?.mode==='download'&&r.redistribution==='allowed'&&!!r.permissionNote?.trim()&&!!r.author?.trim()&&!!r.sourceUrl&&validExternalUrl(r.sourceUrl)&&!!r.usageInstructions.trim()&&links.length===1&&assets.some(a=>a.id===links[0].assetId&&a.contentId===c.id&&a.purpose==='resourceFile'&&a.state==='ready');
}
export function compareContents(a:Pick<Content,'recordDate'|'createdAt'|'id'>,b:Pick<Content,'recordDate'|'createdAt'|'id'>):number{
 const rank={day:0,month:1,year:2,range:3,unknown:4};const x=a.recordDate,y=b.recordDate;
 const group=(p:keyof typeof rank)=>p==='range'?1:p==='unknown'?2:0;
 const str=(l:string,r:string)=>l<r?-1:l>r?1:0;
 let n=group(x.precision)-group(y.precision);if(n)return n;
 if(group(x.precision)===0){n=Number(y.value!.slice(0,4))-Number(x.value!.slice(0,4))||rank[x.precision]-rank[y.precision]||str(y.value!,x.value!);}
 if(x.precision==='range')n=y.toYear!-x.toYear!||y.fromYear!-x.fromYear!;
 return n||Date.parse(b.createdAt)-Date.parse(a.createdAt)||str(a.id,b.id);
}

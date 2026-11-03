export const CONTRACT_VERSION = 'C01-v0.1.0-review.3' as const;
export const kinds = ['profile','story','diary','video','resource','game'] as const;
export type Kind = typeof kinds[number];
export type Visibility = 'private'|'public';
export type Status = 'draft'|'published'|'withdrawn';
export type Purpose = 'diaryPage'|'cover'|'video'|'resourceFile';
export type VariantName = 'original'|'display'|'thumbnail'|'playback'|'download';
export interface DateInfo { precision:'unknown'|'year'|'month'|'day'|'range'; value:string|null; fromYear:number|null; toYear:number|null; approximate:boolean; note:string|null }
export interface ResourceData { mode:'external'|'download'; sourceUrl:string|null; author:string|null; licenseName:string|null; redistribution:'unknown'|'allowed'|'forbidden'; permissionNote:string|null; usageInstructions:string; modificationNote:string|null; versionLabel:string|null }
export interface GameData {launchUrl:string;usageInstructions:string}
export interface MediaLink {assetId:string;role:Purpose;position:number;alt:string|null}
export interface ContentEdit {title:string;summary:string;bodyText:string|null;transcription:string|null;reflection:string|null;category:string|null;recordDate:DateInfo;featured:boolean;resource:ResourceData|null;game:GameData|null;visibility:Visibility;media:MediaLink[]}
export type ContentInput = {kind:Kind;title:string} & Partial<Omit<ContentEdit,'visibility'|'media'|'title'>> & {isDemo?:boolean};
export interface Content extends ContentEdit {id:string;kind:Kind;isDemo:boolean;status:Status;revision:number;createdAt:string;updatedAt:string;publishedAt:string|null;withdrawnAt:string|null;deletedAt:string|null}
export interface MediaVariant {name:VariantName;storageKey:string;mime:string;byteSize:number;sha256:string}
export interface MediaAsset {id:string;contentId:string;purpose:Purpose;state:'ready';originalName:string;detectedMime:string;byteSize:number;sha256:string;width:number|null;height:number|null;durationMs:number|null;createdAt:string;variants:MediaVariant[]}
export interface AdminMediaAsset extends Omit<MediaAsset,'id'|'state'|'variants'> {assetId:string;variants:(Omit<MediaVariant,'storageKey'>&{url:string})[]}
export interface PublicMedia extends MediaLink {width:number|null;height:number|null;durationMs:number|null;urls:Partial<Record<Exclude<VariantName,'original'>,string>>}
export type PublicSummary = Pick<Content,'id'|'kind'|'title'|'summary'|'category'|'recordDate'|'featured'|'isDemo'|'publishedAt'> & {cover:PublicMedia|null;excerpt?:string|null};
export type PublicDetail = PublicSummary & Pick<Content,'bodyText'|'transcription'|'reflection'|'resource'|'game'> & {media:PublicMedia[]};
export type AdminDetail = Content & {mediaAssets:AdminMediaAsset[]};
export type AdminSummary = PublicSummary & Pick<Content,'revision'|'status'|'visibility'|'deletedAt'|'updatedAt'>;
export interface Page<T>{items:T[];page:number;pageSize:number;total:number}
export interface ListQuery {page:number;pageSize:number;kind?:Kind;year?:string;category?:string;featured?:boolean;status?:Status;visibility?:Visibility;includeDeleted?:boolean}
export interface DiaryFacets {years:{key:string;count:number}[];categories:{name:string;count:number}[]}
export interface ExportJob {id:string;state:'pending'|'running'|'ready'|'failed'|'expired';createdAt:string;finishedAt:string|null;expiresAt:string|null;byteSize:number|null;sha256:string|null;error:{code:string;message:string}|null;downloadUrl:string|null}
export interface AnalyticsCollectInput {type:'pageview';path:string;title?:string;referrer?:string;screen?:string;language?:string}
export interface AnalyticsCollectResult {ok:true}
export interface PublicAnalyticsSummary {todayVisitors:number;todayPageviews:number;totalVisitors:number;totalPageviews:number}
export type AnalyticsRange = '1d'|'7d'|'30d';
export interface AnalyticsSummary {
 range:AnalyticsRange;
 since:string;
 overview:{pageviews:number;visits:number;visitors:number};
 topPages:{path:string;title:string|null;pageviews:number;visitors:number}[];
 referrers:{source:string;pageviews:number}[];
 devices:{device:string;pageviews:number}[];
 browsers:{browser:string;pageviews:number}[];
 recent:{at:string;path:string;title:string|null;source:string;browser:string|null;device:string|null}[];
}
export interface SessionData {admin:{id:string;username:string};csrfToken:string;expiresAt:string}
export interface ApiSuccess<T>{data:T;requestId:string}
export interface ApiFailure {error:{code:string;message:string;fields:{path:string;message:string}[]};requestId:string}
export interface DeleteResult {id:string;deletedAt:string;revision:number}

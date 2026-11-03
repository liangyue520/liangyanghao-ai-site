import type {Readable} from 'node:stream';
import type {Actor} from '../server/auth/service';
import type {Database} from '../server/core/database';
import type {Config} from '../server/core/config';
import type {createStorage} from '../server/core/storage';
import type {createMediaTools} from '../server/core/media-tools';
import type {createIdempotency} from '../server/core/idempotency';
import type {ContentInput,ContentEdit,Visibility,ListQuery,Page,PublicSummary,PublicDetail,AdminSummary,AdminDetail,DiaryFacets,DeleteResult,Purpose,VariantName,AdminMediaAsset,ExportJob,AnalyticsCollectInput,AnalyticsCollectResult,AnalyticsSummary,AnalyticsRange,PublicAnalyticsSummary} from './contracts';
export type {Actor};
export interface ServiceContext {db:Database;config:Config;storage:ReturnType<typeof createStorage>;media:ReturnType<typeof createMediaTools>;idempotency:ReturnType<typeof createIdempotency>;clock:()=>number;uuid:()=>string;logger:{info:(event:string)=>void;error:(event:string)=>void}}
export interface ContentService {
 listPublic(query:ListQuery):Promise<Page<PublicSummary>>;getPublic(id:string):Promise<PublicDetail>;diaryFacets():Promise<DiaryFacets>;
 listAdmin(actor:Actor,query:ListQuery):Promise<Page<AdminSummary>>;getAdmin(actor:Actor,id:string):Promise<AdminDetail>;
 create(actor:Actor,input:ContentInput,key:string):Promise<AdminDetail>;
 replace(actor:Actor,id:string,input:ContentEdit,revision:number,key?:string):Promise<AdminDetail>;
 publish(actor:Actor,id:string,visibility:Visibility,revision:number,key?:string):Promise<AdminDetail>;
 setVisibility(actor:Actor,id:string,visibility:Visibility,revision:number,key?:string):Promise<AdminDetail>;
 withdraw(actor:Actor,id:string,revision:number,key?:string):Promise<AdminDetail>;
 softDelete(actor:Actor,id:string,revision:number,key?:string):Promise<DeleteResult>;
}
export interface FileInput {stream:AsyncIterable<Uint8Array>;originalName:string;declaredMime:string}
export interface BinaryResponse {stream?:Readable;status:number;headers:Record<string,string>}
export interface MediaService {
 upload(actor:Actor,contentId:string,purpose:Purpose,file:FileInput,key:string):Promise<{asset:AdminMediaAsset;contentRevision:number}>;
 listAdmin(actor:Actor,contentId:string,query:ListQuery):Promise<Page<AdminMediaAsset>>;
 open(actor:Actor|null,assetId:string,variant:VariantName,range?:string,head?:boolean):Promise<BinaryResponse>;
}
export interface ExportService {create(actor:Actor,key:string):Promise<{id:string;state:'pending'}>;get(actor:Actor,id:string):Promise<ExportJob>;open(actor:Actor,id:string):Promise<BinaryResponse>;resumeAfterRestart():Promise<void>;expire(now:number):Promise<void>}
export interface AnalyticsMeta {ip:string;userAgent:string;origin?:string;dnt?:string|null}
export interface AnalyticsService {collect(input:AnalyticsCollectInput,meta:AnalyticsMeta):Promise<AnalyticsCollectResult>;summary(actor:Actor,range:AnalyticsRange):Promise<AnalyticsSummary>;publicSummary():Promise<PublicAnalyticsSummary>}
export interface Services {content:ContentService;media:MediaService;exports:ExportService;analytics:AnalyticsService}

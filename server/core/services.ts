import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import type {ServiceContext,Services,ContentService,MediaService,ExportService,AnalyticsService} from '../../shared/service-ports';import {unavailable} from './errors';
export function pendingServices():Services{
 const no=async()=>unavailable();
 const content:ContentService={listPublic:no,getPublic:no,diaryFacets:no,listAdmin:no,getAdmin:no,create:no,replace:no,publish:no,setVisibility:no,withdraw:no,softDelete:no};
 const media:MediaService={upload:no,listAdmin:no,open:no};
 const exports:ExportService={create:no,get:no,open:no,resumeAfterRestart:async()=>{},expire:async()=>{}};
 const analytics:AnalyticsService={collect:no,summary:no,publicSummary:no};
 return {content,media,exports,analytics};
}
export async function loadServices(ctx:ServiceContext):Promise<Services>{const s=pendingServices();for(const [folder,key,factory] of [['content','content','createContentService'],['media','media','createMediaService'],['export','exports','createExportService'],['analytics','analytics','createAnalyticsService']] as const){const file=path.join(ctx.config.root,'server/services',folder,'service.ts');if(fs.existsSync(file)){const module=await import(pathToFileURL(file).href);if(typeof module[factory]!=='function')throw Error(`Missing ${factory}`);(s as any)[key]=module[factory](ctx);}}return s;}

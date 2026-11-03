import type {Actor} from '../auth/service';import type {Content,MediaAsset,VariantName} from '../../shared/contracts';import {resourceDownloadAllowed} from '../../shared/schemas';import {AppError} from './errors';
export function requireActor(actor:Actor|null):asserts actor is Actor {if(!actor||actor.role!=='admin')throw new AppError(401,'AUTH_REQUIRED','请先登录');}
export const isPublic=(c:Content)=>c.status==='published'&&c.visibility==='public'&&c.deletedAt===null;
export function canReadMedia(actor:Actor|null,c:Content,a:MediaAsset,variant:VariantName,allAssets:MediaAsset[]):boolean{
 if(a.state!=='ready'||a.contentId!==c.id||!a.variants.some(v=>v.name===variant))return false;
 if(a.purpose==='resourceFile'&&!['original','download'].includes(variant))return false;
 if(actor?.role==='admin')return true;
 if(variant==='original'||!isPublic(c)||!c.media.some(m=>m.assetId===a.id&&m.role===a.purpose))return false;
 if(variant==='download')return a.purpose==='resourceFile'&&resourceDownloadAllowed(c,allAssets);
 return true;
}

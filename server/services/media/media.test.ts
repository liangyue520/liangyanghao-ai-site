import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {Readable} from 'node:stream';
import {harness,key,edit} from '../fixtures/e03/harness';
import {publicDetail} from '../content/policy';
import {mediaRepository} from './repository';
import {createMediaService} from './service';
import {AppError} from '../../core/errors';
import type {ResourceData} from '../../../shared/contracts';

test('media: external boundary, HTTP HEAD, duplicate upload, failures, private/withdrawn links and originals',async()=>{
 const h=await harness('media');
 try{
  let c=await h.services.content.create(h.actor,{kind:'resource',title:h.runId,isDemo:true},key());
  const bytes=Buffer.from('SYNTHETIC resource only\n'),uploadKey=key();
  const upload=()=>h.services.media.upload(h.actor,c.id,'resourceFile',{stream:Readable.from([bytes]),originalName:'synthetic.txt',declaredMime:'text/plain'},uploadKey);
  const uploaded=await upload(),a=uploaded.asset;assert.deepEqual(await upload(),uploaded);
  assert.equal((await h.services.media.upload(h.actor,c.id,'resourceFile',{stream:Readable.from([bytes]),originalName:'synthetic.txt',declaredMime:'text/plain'},key())).asset.assetId,a.assetId);
  h.records.push({contentId:c.id,assetId:a.assetId});
  const resource:ResourceData={mode:'external',sourceUrl:'https://example.com/synthetic',author:'SYNTHETIC',licenseName:null,redistribution:'unknown',permissionNote:null,usageInstructions:'合成资源测试',modificationNote:null,versionLabel:null};
  const link={assetId:a.assetId,role:'resourceFile' as const,position:0,alt:null};
  for(const redistribution of ['unknown','forbidden','allowed'] as const){const r=await h.request('PUT',`/api/v1/admin/contents/${c.id}`,edit(c,{resource:{...resource,redistribution},media:[link]}),{'if-match':`"${c.revision}"`});assert.equal(r.statusCode,422);assert.equal((await h.services.content.getAdmin(h.actor,c.id)).revision,c.revision);}
  c=await h.services.content.replace(h.actor,c.id,edit(c,{resource,visibility:'public'}),c.revision);c=await h.services.content.publish(h.actor,c.id,'public',c.revision);
  const download=a.variants.find(v=>v.name==='download')!.url,original=a.variants.find(v=>v.name==='original')!.url;
  assert.equal((await h.request('GET',`/api/v1/public/contents/${c.id}`,undefined,{},true)).json().data.media.length,0);
  for(const method of ['GET','HEAD'] as const){const r=await h.request(method,download,undefined,{range:'bytes=0-1'},true);assert.equal(r.statusCode,404);if(method==='HEAD')assert.equal(r.body,'');}
  // Malformed historic association is modeled in memory, never injected into the persistent database.
  const abnormal={...c,media:[link]};assert.equal(publicDetail(abnormal,mediaRepository(h.ctx).all(c.id)).media.length,0);
  const isolated=createMediaService({...h.ctx,db:{...h.ctx.db,get:(sql:string,...args:any[])=>sql.includes('FROM contents')?{data_json:JSON.stringify(abnormal)}:h.ctx.db.get(sql,...args),all:h.ctx.db.all.bind(h.ctx.db)} as any});
  await assert.rejects(isolated.open(null,a.assetId,'download',undefined,true),{status:404});
  assert.equal((await h.request('GET',original,undefined,{},true)).statusCode,404);assert.equal((await h.request('GET',original)).statusCode,200);
  c=await h.services.content.withdraw(h.actor,c.id,c.revision);c=await h.services.content.replace(h.actor,c.id,edit(c,{resource:{...resource,mode:'download',redistribution:'allowed',permissionNote:'SYNTHETIC permission'},media:[link]}),c.revision);c=await h.services.content.publish(h.actor,c.id,'public',c.revision);
  assert.equal((await h.request('GET',download,undefined,{},true)).body,bytes.toString());assert.equal((await h.request('HEAD',download,undefined,{},true)).statusCode,200);
  c=await h.services.content.setVisibility(h.actor,c.id,'private',c.revision);assert.equal((await h.request('GET',download,undefined,{},true)).statusCode,404);
  c=await h.services.content.withdraw(h.actor,c.id,c.revision);c=await h.services.content.replace(h.actor,c.id,edit(c,{visibility:'public'}),c.revision);c=await h.services.content.publish(h.actor,c.id,'public',c.revision);assert.equal((await h.request('GET',download,undefined,{},true)).statusCode,200);
  c=await h.services.content.withdraw(h.actor,c.id,c.revision);assert.equal((await h.request('HEAD',download,undefined,{},true)).statusCode,404);
  await h.services.content.softDelete(h.actor,c.id,c.revision);assert.equal((await h.request('GET',original)).statusCode,200);
  let diary=await h.services.content.create(h.actor,{kind:'diary',title:h.runId+'-diary',isDemo:true},key());
  const image=await sharp({create:{width:30,height:20,channels:3,background:'#336699'}}).withExif({IFD0:{Artist:'SYNTHETIC'}}).jpeg().toBuffer();
  const boundary='e03-'+key();const multipart=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="purpose"\r\n\r\ndiaryPage\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="synthetic.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),image,Buffer.from(`\r\n--${boundary}--\r\n`)]);
  const uploadedImage=await h.request('POST',`/api/v1/admin/contents/${diary.id}/media`,multipart,{'content-type':`multipart/form-data; boundary=${boundary}`,'idempotency-key':key()});assert.equal(uploadedImage.statusCode,201);const img=uploadedImage.json().data.asset;
  diary=await h.services.content.replace(h.actor,diary.id,edit(diary,{visibility:'public',media:[{assetId:img.assetId,role:'diaryPage',position:0,alt:'合成图'}]}),diary.revision);diary=await h.services.content.publish(h.actor,diary.id,'public',diary.revision);
  for(const v of img.variants){const r=await h.request('GET',v.url,undefined,{},true);assert.equal(r.statusCode,v.name==='original'?404:200);if(v.name==='display'){const metadata=await sharp(r.rawPayload).metadata();assert.equal(metadata.exif,undefined);}}
  diary=await h.services.content.withdraw(h.actor,diary.id,diary.revision);for(const v of img.variants)assert.equal((await h.request('HEAD',v.url,undefined,{},true)).statusCode,404);
  const before=await fs.readdir(h.ctx.storage.resolve('tmp'));
  const count=mediaRepository(h.ctx).all(diary.id).length;
  await assert.rejects(h.services.media.upload(h.actor,diary.id,'diaryPage',{stream:Readable.from([Buffer.from('broken')]),originalName:'bad.jpg',declaredMime:'image/jpeg'},key()),{status:415});
  const brokenKey=key();await assert.rejects(h.services.media.upload(h.actor,diary.id,'diaryPage',{stream:(async function*(){yield image;throw Error('synthetic disconnect');})(),originalName:'test.jpg',declaredMime:'image/jpeg'},brokenKey));
  await assert.rejects(h.services.media.upload(h.actor,diary.id,'diaryPage',{stream:(async function*(){for(let i=0;i<21;i++)yield Buffer.alloc(1024**2);})(),originalName:'big.jpg',declaredMime:'image/jpeg'},key()),{status:413});
  assert.equal(mediaRepository(h.ctx).all(diary.id).length,count);assert.deepEqual(await fs.readdir(h.ctx.storage.resolve('tmp')),before);
  const retried=await h.services.media.upload(h.actor,diary.id,'diaryPage',{stream:Readable.from([image]),originalName:'test.jpg',declaredMime:'image/jpeg'},brokenKey);assert.equal(retried.asset.assetId,img.assetId);
  const concurrent=await h.services.content.create(h.actor,{kind:'diary',title:h.runId+'-concurrent',isDemo:true},key());
  const sameFile=()=>({stream:Readable.from([image]),originalName:'test.jpg',declaredMime:'image/jpeg'});
  const results=await Promise.all([h.services.media.upload(h.actor,concurrent.id,'diaryPage',sameFile(),key()),h.services.media.upload(h.actor,concurrent.id,'diaryPage',sameFile(),key())]);
  assert.equal(results[0].asset.assetId,results[1].asset.assetId);assert.equal(mediaRepository(h.ctx).all(concurrent.id).length,1);
  const conflictKey=key();let unblock!:()=>void;const gate=new Promise<void>(r=>unblock=r);
  const first=h.services.media.upload(h.actor,concurrent.id,'diaryPage',{...sameFile(),stream:(async function*(){await gate;yield image;})()},conflictKey);
  await new Promise(r=>setImmediate(r));await assert.rejects(h.services.media.upload(h.actor,concurrent.id,'diaryPage',sameFile(),conflictKey),{code:'REQUEST_IN_PROGRESS'});unblock();await first;
  const failedContent=await h.services.content.create(h.actor,{kind:'diary',title:h.runId+'-atomic-failure',isDemo:true},key());
  let commits=0;const badStorage=createMediaService({...h.ctx,storage:{...h.ctx.storage,async commit(from,to){if(++commits===2)throw new AppError(507,'INSUFFICIENT_STORAGE','合成故障');return h.ctx.storage.commit(from,to);}}});
  await assert.rejects(badStorage.upload(h.actor,failedContent.id,'diaryPage',sameFile(),key()),{status:507});assert.equal(mediaRepository(h.ctx).all(failedContent.id).length,0);
  const race=await h.services.content.create(h.actor,{kind:'diary',title:h.runId+'-state-race',isDemo:true},key());
  const racing=createMediaService({...h.ctx,media:{...h.ctx.media,async inspect(...args){const result=await h.ctx.media.inspect(...args);await h.services.content.softDelete(h.actor,race.id,race.revision);return result;}}});
  await assert.rejects(racing.upload(h.actor,race.id,'diaryPage',sameFile(),key()),{code:'CONTENT_DELETED'});assert.equal(mediaRepository(h.ctx).all(race.id).length,0);
  const referenced=new Set(mediaRepository(h.ctx).all().flatMap(a=>a.variants.map(v=>v.storageKey)));
  async function objectFiles(prefix:string):Promise<string[]>{const entries=await fs.readdir(h.ctx.storage.resolve(prefix),{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?objectFiles(prefix+'/'+e.name):Promise.resolve([prefix+'/'+e.name])))).flat();}
  const objects=await objectFiles('objects');assert.ok(objects.every(k=>referenced.has(k)),'failed and duplicate uploads leave no object files');
  assert.deepEqual(await fs.readdir(h.ctx.storage.resolve('tmp')),before);
  h.records.push({failures:'wrong type 415, interrupted upload, oversize 413',noReadyRowsOrTempLeaks:true,metadataRemoved:true,abnormalAssociation:'in-memory read adapter only'});
  h.records.push({concurrentSameHash:'one asset',sameKeyInProgress:409,partialCommitFailure:507,deletedDuringInspection:410,noOrphanObjects:true});
 }finally{await h.finish();}
});

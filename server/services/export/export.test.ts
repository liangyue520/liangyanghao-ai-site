import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import yauzl from 'yauzl';
import {createHash} from 'node:crypto';
import {Readable} from 'node:stream';
import {harness,key,evidenceRoot} from '../fixtures/e03/harness';
import {contentRepository} from '../content/repository';
import {mediaRepository} from '../media/repository';
import {createExportService} from './service';

async function unzip(bytes:Buffer){return new Promise<Map<string,Buffer>>((resolve,reject)=>{yauzl.fromBuffer(bytes,{lazyEntries:true},(err,zip)=>{if(err||!zip)return reject(err);const entries=new Map<string,Buffer>();zip.on('error',reject);zip.on('entry',entry=>zip.openReadStream(entry,(err,stream)=>{if(err||!stream)return reject(err);const chunks:Buffer[]=[];stream.on('error',reject);stream.on('data',b=>chunks.push(b));stream.on('end',()=>{assert.equal(entries.has(entry.fileName),false);entries.set(entry.fileName,Buffer.concat(chunks));zip.readEntry();});}));zip.on('end',()=>resolve(entries));zip.readEntry();});});}
test('export: full snapshot, hashes, private/orphan originals, replay, failure, expiry and restart',async()=>{
 const h=await harness('export');
 try {
  // Avoid overriding any job owned by an active API process: this suite requires the stopped e03 environment.
  assert.equal(h.ctx.db.get("SELECT id FROM export_jobs WHERE state IN ('pending','running')"),undefined);
  const archive=await h.services.content.create(h.actor,{kind:'resource',title:h.runId+'-unassociated',isDemo:true},key());
  await h.services.media.upload(h.actor,archive.id,'resourceFile',{stream:Readable.from([Buffer.from('SYNTHETIC unassociated export fixture')]),originalName:'archive.txt',declaredMime:'text/plain'},key());
  const deleted=await h.services.content.create(h.actor,{kind:'story',title:h.runId+'-deleted',isDemo:true},key());await h.services.content.softDelete(h.actor,deleted.id,deleted.revision);
  const requestKey=key();const response=await h.request('POST','/api/v1/admin/exports',{}, {'idempotency-key':requestKey});assert.equal(response.statusCode,201);const job=response.json().data;
  assert.deepEqual((await h.request('POST','/api/v1/admin/exports',{}, {'idempotency-key':requestKey})).json().data,job);
  assert.equal((await h.request('POST','/api/v1/admin/exports',{}, {'idempotency-key':key()})).statusCode,409);
  assert.equal((await h.request('GET',`/api/v1/admin/exports/${job.id}/file`,undefined,{},true)).statusCode,401);
  let ready=await h.services.exports.get(h.actor,job.id);for(let i=0;i<300&&['pending','running'].includes(ready.state);i++){await new Promise(r=>setTimeout(r,20));ready=await h.services.exports.get(h.actor,job.id);}assert.equal(ready.state,'ready',JSON.stringify(ready.error));
  const downloaded=await h.request('GET',`/api/v1/admin/exports/${job.id}/file`);assert.equal(downloaded.statusCode,200);assert.equal(createHash('sha256').update(downloaded.rawPayload).digest('hex'),ready.sha256);
  const files=await unzip(downloaded.rawPayload),manifest=JSON.parse(files.get('manifest.json')!.toString()),contents=JSON.parse(files.get('contents.json')!.toString()),media=JSON.parse(files.get('media.json')!.toString());
  assert.equal(contents.length,contentRepository(h.ctx).all().length);assert.equal(media.length,mediaRepository(h.ctx).all().length);assert.equal(manifest.counts.files,files.size-1);
  assert.ok(contents.some((c:any)=>c.deletedAt));assert.ok(contents.some((c:any)=>c.status==='draft'&&c.visibility==='private'));
  assert.ok(media.some((a:any)=>!contents.find((c:any)=>c.id===a.contentId).media.some((m:any)=>m.assetId===a.id)),'unassociated archive included');
  for(const item of manifest.files){const bytes=files.get(item.path)!;assert.ok(bytes);assert.equal(bytes.length,item.byteSize);assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256);}
  assert.equal(/storageKey":"(?:[A-Z]:|objects\/)/.test(files.get('media.json')!.toString()),false);
  assert.equal(files.has('admins.json'),false);assert.equal(files.has('sessions.json'),false);
  for(const c of contents)assert.deepEqual(c,contentRepository(h.ctx).get(c.id));
  h.records.push({exportId:job.id,sha256:ready.sha256,counts:manifest.counts,manifestEntriesVerified:manifest.files.length});
  await fs.writeFile(path.join(evidenceRoot,`${h.runId}-manifest.json`),JSON.stringify(manifest,null,2));
  // Synthetic storage read failure; source objects remain untouched.
  const faulty=createExportService({...h.ctx,storage:{...h.ctx.storage,read(){throw Error('synthetic unreadable source');}}});const failed=await faulty.create(h.actor,key());let failure=await faulty.get(h.actor,failed.id);for(let i=0;i<100&&['pending','running'].includes(failure.state);i++){await new Promise(r=>setTimeout(r,20));failure=await faulty.get(h.actor,failed.id);}assert.equal(failure.state,'failed');await assert.rejects(faulty.open(h.actor,failed.id),{code:'EXPORT_NOT_READY'});
  const future=Date.parse(ready.expiresAt!)+1;await h.services.exports.expire(future);assert.equal((await h.services.exports.get(h.actor,job.id)).state,'expired');await assert.rejects(h.services.exports.open(h.actor,job.id),{code:'EXPORT_EXPIRED'});
  for(const a of mediaRepository(h.ctx).all())for(const v of a.variants)assert.equal((await h.ctx.storage.hash(v.storageKey)).sha256,v.sha256);
  // Restart hook can be checked before the queued setImmediate starts, using an actual service-created job.
  const interrupted=await h.services.exports.create(h.actor,key());await h.services.exports.resumeAfterRestart();assert.equal((await h.services.exports.get(h.actor,interrupted.id)).state,'failed');await new Promise(r=>setImmediate(r));
  h.records.push({failedExportId:failed.id,interruptedExportId:interrupted.id,expiryPreservedSources:true,restartRecovery:'service hook with pending service-created job'});
 }finally{await h.finish();}
});

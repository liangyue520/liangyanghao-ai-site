import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {Readable} from 'node:stream';
import {harness,key,edit} from './harness';

test('synthetic MP4: real probe, immutable copies, playback Range and withdrawal',async()=>{
 const h=await harness('video');
 try {
  const sample=path.resolve('server/services/fixtures/e03/synthetic.mp4');
  await promisify(execFile)(path.join(path.dirname(h.ctx.config.ffprobePath),'ffmpeg.exe'),['-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=blue:s=64x48:r=10','-t','0.3','-c:v','libx264','-pix_fmt','yuv420p','-y',sample],{windowsHide:true,timeout:30000});
  const bytes=await fs.readFile(sample);let c=await h.services.content.create(h.actor,{kind:'video',title:h.runId,isDemo:true},key());const {asset:a}=await h.services.media.upload(h.actor,c.id,'video',{stream:Readable.from([bytes]),originalName:'synthetic.mp4',declaredMime:'video/mp4'},key());
  assert.ok(a.durationMs!>0);assert.equal(a.variants.length,2);c=await h.services.content.replace(h.actor,c.id,edit(c,{visibility:'public',media:[{assetId:a.assetId,role:'video',position:0,alt:null}]}),c.revision);c=await h.services.content.publish(h.actor,c.id,'public',c.revision);
  const url=a.variants.find(v=>v.name==='playback')!.url;
  const partial=await h.request('GET',url,undefined,{range:'bytes=0-9'},true);assert.equal(partial.statusCode,206);assert.equal(partial.rawPayload.length,10);assert.deepEqual(partial.rawPayload,bytes.subarray(0,10));
  assert.equal((await h.request('HEAD',url,undefined,{range:'bytes=-10'},true)).statusCode,206);
  assert.equal((await h.request('GET',url,undefined,{range:'bytes=0-1,3-4'},true)).statusCode,416);
  assert.equal((await h.request('GET',url,undefined,{range:`bytes=${bytes.length}-`},true)).statusCode,416);
  assert.equal((await h.request('GET',a.variants.find(v=>v.name==='original')!.url,undefined,{},true)).statusCode,404);
  await h.services.content.withdraw(h.actor,c.id,c.revision);
  const denied=await h.request('HEAD',url,undefined,{range:'bytes=999999-'},true);assert.equal(denied.statusCode,404);assert.equal(denied.headers['content-range'],undefined);
  h.records.push({contentId:c.id,assetId:a.assetId,probe:'actual ffprobe',playback:'HTTP bytes verified; browser playback not tested'});
 }finally{await h.finish();}
});

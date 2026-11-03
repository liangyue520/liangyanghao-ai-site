import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {randomUUID} from 'node:crypto';import sharp from 'sharp';import {readConfig} from '../../server/core/config';import {createContext} from '../../server/core/context';import {generateSamples} from '../fixtures/shared/synthetic';
test('media decoding, metadata removal, PDF/ZIP validation and immutable private storage',async()=>{
 const config=readConfig('test-media-'+randomUUID()),ctx=createContext(config);try{
 await generateSamples(config);const image=await ctx.media.inspect('tmp/metadata.jpg','diaryPage','metadata.jpg','image/jpeg');assert.equal(image.derived.length,2);for(const d of image.derived){const m=await sharp(ctx.storage.resolve(d.key)).metadata();assert.equal(m.exif,undefined);assert.equal(m.format,'webp');}
 await assert.rejects(()=>ctx.media.inspect('tmp/sample.jpg','diaryPage','sample.png','image/png'));
 const video=await ctx.media.inspect('tmp/sample.mp4','video','sample.mp4','video/mp4');assert.equal(video.width,64);assert(video.durationMs!>0);
 await ctx.media.inspect('tmp/sample.pdf','resourceFile','sample.pdf','application/pdf');await assert.rejects(()=>ctx.media.inspect('tmp/broken.pdf','resourceFile','broken.pdf','application/pdf'));
 assert.equal((await ctx.media.inspectZip(ctx.storage.resolve('tmp/sample.zip'))).entries,1);
 const zip=await fs.readFile(ctx.storage.resolve('tmp/sample.zip'));const invalid=Buffer.from(zip);let at=0;while((at=invalid.indexOf(Buffer.from('readme.txt'),at))>=0){invalid.write('../bad.txt',at,'ascii');at+=10;}await fs.writeFile(ctx.storage.resolve('tmp/path.zip'),invalid);await assert.rejects(()=>ctx.media.inspectZip(ctx.storage.resolve('tmp/path.zip')));
 async function* stream(){yield Buffer.from('synthetic bytes');}const before=await fs.readdir(path.join(config.dataRoot,'tmp'));await assert.rejects(()=>ctx.storage.writeTemp(stream(),2));assert.deepEqual(await fs.readdir(path.join(config.dataRoot,'tmp')),before);
 const temp=await ctx.storage.writeTemp(stream(),100);const key='objects/'+randomUUID()+'/original.txt';await ctx.storage.commit(temp.key,key);assert.equal((await ctx.storage.hash(key)).sha256,temp.sha256);const retry=await ctx.storage.writeTemp(stream(),100);await assert.rejects(()=>ctx.storage.commit(retry.key,key));assert.throws(()=>ctx.storage.resolve('../outside'));assert.throws(()=>ctx.storage.resolve('objects/C:/outside'));assert.equal((await fs.readFile(ctx.storage.resolve(key),'utf8')),'synthetic bytes');
 }finally{ctx.db.close();}
});

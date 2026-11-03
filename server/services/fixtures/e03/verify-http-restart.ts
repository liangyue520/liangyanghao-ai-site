import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn,type ChildProcess} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {edit,evidenceRoot} from './harness';

const base='http://127.0.0.1:3103',origin='http://127.0.0.1:5177';
const runId=`E03-http-restart-${Date.now()}`;
const records:unknown[]=[];let child:ChildProcess|undefined,cookie='',csrf='';
const identity=JSON.parse((await fs.readFile('.local/e03/test-identity.json','utf8')).replace(/^\uFEFF/,''));
async function request(method:string,url:string,body?:unknown,headers:Record<string,string>={},anonymous=false){
 const response=await fetch(base+url,{method,headers:{...(anonymous?{}:{cookie,origin,'x-csrf-token':csrf}),...(body===undefined||body instanceof FormData?{}:{'content-type':'application/json'}),...headers},body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body)});
 const bytes=Buffer.from(await response.arrayBuffer());let json:any;try{json=JSON.parse(bytes.toString());}catch{}
 records.push({method,url,status:response.status,requestId:response.headers.get('x-request-id'),anonymous,code:json?.error?.code});return {response,bytes,json};
}
async function start(){
 const already=await fetch(base+'/api/v1/health').catch(()=>null);if(already)throw Error('e03 already running; refusing to manage another process');
 child=spawn(process.execPath,['--import','tsx','server/main.ts','--env','e03'],{cwd:process.cwd(),windowsHide:true,stdio:['ignore','pipe','pipe']});
 // Deliberately do not persist process output, which is unnecessary for API evidence.
 child.stdout?.resume();child.stderr?.resume();
 for(let i=0;i<150;i++){if(child.exitCode!==null)throw Error('e03 exited before ready');await new Promise(r=>setTimeout(r,100));const health=await fetch(base+'/api/v1/health').catch(()=>null);if(health?.ok){records.push({event:'process_started',pid:child.pid});return;}}
 throw Error('e03 startup timeout');
}
async function stop(){if(!child||child.exitCode!==null)return;const own=child;await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('owned process stop timeout')),10000);own.once('exit',()=>{clearTimeout(timer);records.push({event:'process_stopped',pid:own.pid});resolve();});own.kill();});child=undefined;}
try {
 await start();
 const login=await request('POST','/api/v1/auth/login',{username:identity.username,password:identity.password});assert.equal(login.response.status,200);cookie=login.response.headers.get('set-cookie')!.split(';')[0];csrf=login.json.data.csrfToken;
 const idem=randomUUID(),input={kind:'diary',title:runId,isDemo:true,transcription:'合成持久化样本'};
 const created=await request('POST','/api/v1/admin/contents',input,{'idempotency-key':idem});assert.equal(created.response.status,201);let c=created.json.data;
 const image=await sharp({create:{width:32,height:24,channels:3,background:'#abcdef'}}).png().toBuffer();
 const form=new FormData();form.set('purpose','diaryPage');form.set('file',new Blob([new Uint8Array(image)],{type:'image/png'}),'synthetic.png');
 const uploaded=await request('POST',`/api/v1/admin/contents/${c.id}/media`,form,{'idempotency-key':randomUUID()});assert.equal(uploaded.response.status,201);const asset=uploaded.json.data.asset;
 const display=asset.variants.find((v:any)=>v.name==='display').url,original=asset.variants.find((v:any)=>v.name==='original').url;
 assert.equal((await request('GET',display,undefined,{},true)).response.status,404);
 c=(await request('PUT',`/api/v1/admin/contents/${c.id}`,edit(c,{visibility:'public',media:[{assetId:asset.assetId,role:'diaryPage',position:0,alt:'合成页'}]}),{'if-match':`"${c.revision}"`})).json.data;
 c=(await request('POST',`/api/v1/admin/contents/${c.id}/publish`,{confirmVisibility:'public'},{'if-match':`"${c.revision}"`})).json.data;
 const before=await request('GET',`/api/v1/admin/contents/${c.id}`);assert.equal(before.response.status,200);
 const displayBefore=await request('GET',display,undefined,{},true);assert.equal(displayBefore.response.status,200);assert.equal((await request('GET',original,undefined,{},true)).response.status,404);
 await stop();await start();
 assert.equal((await request('GET','/api/v1/auth/session')).response.status,200);
 const after=await request('GET',`/api/v1/admin/contents/${c.id}`);assert.deepEqual(after.json.data,before.json.data);assert.equal(after.json.data.recordDate.value,null);
 assert.equal((await request('GET',`/api/v1/public/contents/${c.id}`,undefined,{},true)).response.status,200);
 assert.deepEqual((await request('GET',display,undefined,{},true)).bytes,displayBefore.bytes);
 assert.deepEqual((await request('POST','/api/v1/admin/contents',input,{'idempotency-key':idem})).json.data,created.json.data);
 const withdrawn=await request('POST',`/api/v1/admin/contents/${c.id}/withdraw`,{}, {'if-match':`"${c.revision}"`});assert.equal(withdrawn.response.status,200);
 assert.equal((await request('GET',`/api/v1/public/contents/${c.id}`,undefined,{},true)).response.status,404);
 assert.equal((await request('HEAD',display,undefined,{range:'bytes=0-9'},true)).response.status,404);
 const job=(await request('POST','/api/v1/admin/exports',{}, {'idempotency-key':randomUUID()})).json.data;let result:any;
 for(let i=0;i<300;i++){result=(await request('GET',`/api/v1/admin/exports/${job.id}`)).json.data;if(!['pending','running'].includes(result.state))break;await new Promise(r=>setTimeout(r,30));}assert.equal(result.state,'ready');
 const download=await request('GET',`/api/v1/admin/exports/${job.id}/file`);assert.equal(download.response.status,200);assert.equal(createHash('sha256').update(download.bytes).digest('hex'),result.sha256);
 await fs.mkdir(evidenceRoot,{recursive:true});const artifact=`${runId}-synthetic-export.zip`;await fs.writeFile(path.join(evidenceRoot,artifact),download.bytes);
 records.push({contentId:c.id,assetId:asset.assetId,exportId:job.id,exportSha256:result.sha256,artifact,restartPreserved:'Content, unknown date, media bytes, session and idempotency',result:'PASS'});
 await request('POST','/api/v1/auth/logout',{});
 await fs.writeFile(path.join(evidenceRoot,`${runId}.json`),JSON.stringify({runId,environment:'e03',contractVersion:'C01-v0.1.0-review.3',transport:'real TCP HTTP, independent server processes',mode:'synthetic',records},null,2));
 console.log(JSON.stringify({runId,result:'PASS',contentId:c.id,assetId:asset.assetId,exportId:job.id,artifact}));
}finally{await stop();}

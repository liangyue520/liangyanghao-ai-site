import fs from 'node:fs/promises';import path from 'node:path';import {randomUUID} from 'node:crypto';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import sharp from 'sharp';import {fileTypeFromFile} from 'file-type';import yauzl from 'yauzl';
import type {Purpose} from '../../shared/contracts';import type {Config} from './config';import type {createStorage} from './storage';import {AppError} from './errors';
const exec=promisify(execFile);
export const MEDIA_LIMITS={diaryPage:20*1024**2,cover:20*1024**2,video:300*1024**2,resourceFile:50*1024**2} as const;
export interface InspectedMedia {mime:string;width:number|null;height:number|null;durationMs:number|null;derived:{name:'display'|'thumbnail';key:string;mime:string}[]}
export async function inspectZip(filename:string){
 return new Promise<{entries:number;declaredBytes:number}>((resolve,reject)=>{
  yauzl.open(filename,{lazyEntries:true,strictFileNames:true,validateEntrySizes:true},(err,zip)=>{
   if(err||!zip)return reject(new AppError(422,'CORRUPT_MEDIA','ZIP结构无效'));
   let entries=0,declaredBytes=0,done=false;const names=new Set<string>();
   const timer=setTimeout(()=>fail(),10000);
   const fail=()=>{if(done)return;done=true;clearTimeout(timer);zip.close();reject(new AppError(422,'CORRUPT_MEDIA','ZIP路径、加密或容量检查失败'));};
   zip.on('error',fail);zip.on('entry',(e:yauzl.Entry)=>{
    entries++;declaredBytes+=e.uncompressedSize;
    const p=e.fileName;const parts=p.replace(/\/$/,'').split('/');
    if(entries>1000||declaredBytes>500*1024**2||e.generalPurposeBitFlag&1||p.startsWith('/')||p.includes('\\')||p.includes(':')||parts.some(x=>!x||x==='.'||x==='..'||/[. ]$/.test(x)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(x))||names.has(p)||((e.externalFileAttributes>>>16)&0o170000)===0o120000)return fail();
    names.add(p);zip.readEntry();
   });zip.on('end',()=>{if(!done){done=true;clearTimeout(timer);resolve({entries,declaredBytes});}});zip.readEntry();
  });
 });
}
export function createMediaTools(config:Config,storage:ReturnType<typeof createStorage>){
 async function probe(filename:string){
  if(!config.ffprobePath)throw new AppError(503,'SERVICE_UNAVAILABLE','视频检测工具尚未配置');
  try{const r=await exec(config.ffprobePath,['-v','error','-protocol_whitelist','file','-show_format','-show_streams','-of','json',filename],{timeout:30000,maxBuffer:1024*1024,windowsHide:true});return JSON.parse(r.stdout) as {format:{format_name:string;duration:string};streams:{codec_type:string;codec_name:string;width?:number;height?:number}[]};}
  catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')throw new AppError(503,'SERVICE_UNAVAILABLE','视频检测工具不可用');throw new AppError(422,'CORRUPT_MEDIA','视频探测失败或超时');}
 }
 async function inspect(key:string,purpose:Purpose,originalName:string,declaredMime:string):Promise<InspectedMedia>{
  const filename=storage.resolve(key);const stat=await fs.stat(filename);if(!stat.size)throw new AppError(422,'CORRUPT_MEDIA','空文件');if(stat.size>MEDIA_LIMITS[purpose])throw new AppError(413,'PAYLOAD_TOO_LARGE','文件超限');
  const ext=path.extname(originalName).toLowerCase();const type=await fileTypeFromFile(filename).catch(()=>undefined);
  const mime=type?.mime||(['.txt','.md'].includes(ext)?'text/plain':'');
  if(declaredMime&&declaredMime!=='application/octet-stream'&&declaredMime!==mime&&!(ext==='.md'&&declaredMime==='text/markdown'&&mime==='text/plain'))throw new AppError(415,'UNSUPPORTED_MEDIA_TYPE','声明类型与文件不一致');
  const result:InspectedMedia={mime,width:null,height:null,durationMs:null,derived:[]};
  if(purpose==='diaryPage'||purpose==='cover'){
   if(!({'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'} as Record<string,string>)[ext]||({'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'} as Record<string,string>)[ext]!==mime)throw new AppError(415,'UNSUPPORTED_MEDIA_TYPE','只接受JPEG/PNG/WebP静态图');
   try{const meta=await sharp(filename,{limitInputPixels:40000000,failOn:'warning'}).metadata();if(!meta.width||!meta.height||meta.width>20000||meta.height>20000||(meta.pages||1)>1)throw Error('Invalid image dimensions or animation');
    result.width=meta.width;result.height=meta.height;
    for(const [name,size] of [['display',2400],['thumbnail',480]] as const){const outKey='tmp/'+randomUUID()+'.webp';const info=await sharp(filename,{limitInputPixels:40000000,failOn:'warning'}).rotate().resize({width:size,height:size,fit:'inside',withoutEnlargement:true}).webp().timeout({seconds:30}).toFile(storage.resolve(outKey));result.derived.push({name,key:outKey,mime:'image/webp'});if(name==='display'){result.width=info.width;result.height=info.height;}}
   }catch{for(const d of result.derived)await storage.removeTemp(d.key);throw new AppError(422,'CORRUPT_MEDIA','图片解码失败、动画或像素超限');}
  }else if(purpose==='video'){
   if(ext!=='.mp4'||mime!=='video/mp4')throw new AppError(415,'UNSUPPORTED_MEDIA_TYPE','仅支持MP4');const data=await probe(filename);const video=data.streams.filter(s=>s.codec_type==='video'),audio=data.streams.filter(s=>s.codec_type==='audio');
   if(video.length!==1||video[0].codec_name!=='h264'||audio.length>1||audio.some(s=>s.codec_name!=='aac')||data.streams.some(s=>!['video','audio'].includes(s.codec_type)))throw new AppError(415,'UNSUPPORTED_MEDIA_TYPE','视频轨道不支持');
   const v=video[0],duration=Number(data.format.duration);if(!v.width||!v.height||Math.max(v.width,v.height)>1920||Math.min(v.width,v.height)>1080||!Number.isFinite(duration)||duration<=0||duration>1800)throw new AppError(422,'CORRUPT_MEDIA','视频尺寸或时长无效');result.width=v.width;result.height=v.height;result.durationMs=Math.round(duration*1000);
  }else{
   if(ext==='.zip'&&mime==='application/zip')await inspectZip(filename);
   else if(ext==='.pdf'&&mime==='application/pdf'){
    try{await exec(process.execPath,['--import','tsx',path.join(config.root,'server/core/pdf-worker.ts'),filename],{cwd:config.root,timeout:30000,maxBuffer:128*1024,windowsHide:true});}catch{throw new AppError(422,'CORRUPT_MEDIA','PDF结构无法验证');}
   }else if(['.txt','.md'].includes(ext)&&mime==='text/plain'){
    try{const data=await fs.readFile(filename);if(data.includes(0))throw Error();new TextDecoder('utf-8',{fatal:true}).decode(data);}catch{throw new AppError(422,'CORRUPT_MEDIA','文本不是有效UTF-8或包含NUL');}
   }else throw new AppError(415,'UNSUPPORTED_MEDIA_TYPE','资源格式不支持');
  }
  return result;
 }
 return {probe,inspect,inspectZip,limits:MEDIA_LIMITS};
}

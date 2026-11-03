import fs from 'node:fs';import fsp from 'node:fs/promises';import path from 'node:path';import {createHash,randomUUID} from 'node:crypto';import {AppError} from './errors';
export function createStorage(root:string){
 function resolve(key:string){if(!key||path.isAbsolute(key)||key.includes('\\')||key.includes(':')||key.split('/').some(x=>x==='..'||x==='.'||!x))throw new AppError(400,'BAD_REQUEST','非法存储键');const target=path.resolve(root,key);if(!target.startsWith(path.resolve(root)+path.sep))throw new AppError(400,'BAD_REQUEST','非法存储路径');let cursor=root;for(const part of key.split('/')){cursor=path.join(cursor,part);if(fs.existsSync(cursor)&&fs.lstatSync(cursor).isSymbolicLink())throw new AppError(400,'BAD_REQUEST','不允许链接路径');}return target;}
 return {root,resolve,
  async space(){const s=await fsp.statfs(root);return s.bavail*s.bsize;},
  async requireSpace(bytes:number){const s=await fsp.statfs(root);if(s.bavail*s.bsize<bytes)throw new AppError(507,'INSUFFICIENT_STORAGE','磁盘空间不足');},
  read(key:string,start?:number,end?:number){return fs.createReadStream(resolve(key),{start,end});},
  async hash(key:string){const h=createHash('sha256');let byteSize=0;for await(const b of fs.createReadStream(resolve(key))){h.update(b);byteSize+=b.length;}return {sha256:h.digest('hex'),byteSize};},
  async writeTemp(source:AsyncIterable<Uint8Array>,limit:number){const key='tmp/'+randomUUID();const file=resolve(key);const h=createHash('sha256');let byteSize=0;const out=await fsp.open(file,'wx');try{for await(const b of source){byteSize+=b.byteLength;if(byteSize>limit)throw new AppError(413,'PAYLOAD_TOO_LARGE','文件超限');h.update(b);let offset=0;while(offset<b.byteLength){const r=await out.write(b,offset,b.byteLength-offset);offset+=r.bytesWritten;}}if(!byteSize)throw new AppError(422,'CORRUPT_MEDIA','空文件');await out.sync();return {key,byteSize,sha256:h.digest('hex')};}catch(e){await out.close();await fsp.rm(file,{force:true});throw e;}finally{await out.close().catch(()=>{});}},
  async commit(tempKey:string,objectKey:string){if(!tempKey.startsWith('tmp/')||!objectKey.startsWith('objects/'))throw Error('Commit paths must be tmp -> objects');const source=resolve(tempKey),target=resolve(objectKey);await fsp.mkdir(path.dirname(target),{recursive:true});resolve(objectKey);if(fs.existsSync(target))throw Error('Immutable object already exists');await fsp.rename(source,target);},
  async removeTemp(key:string){if(!key.startsWith('tmp/'))throw Error('Only temporary files may be removed');await fsp.rm(resolve(key),{force:true});}
 };
}

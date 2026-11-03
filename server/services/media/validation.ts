import type {Content,Purpose} from '../../../shared/contracts';
import {AppError} from '../../core/errors';
import {editable} from '../content/policy';

export function uploadAllowed(c:Content,purpose:Purpose){editable(c);if(!(purpose==='cover'||purpose==='diaryPage'&&c.kind==='diary'||purpose==='video'&&c.kind==='video'||purpose==='resourceFile'&&c.kind==='resource'))throw new AppError(422,'VALIDATION_FAILED','内容类型不支持此附件',[{path:'purpose',message:'请选择对应附件类型'}]);}
export function safeFilename(name:string){return Array.from(name.replace(/[\u0000-\u001f\u007f]/g,'').replace(/\\/g,'/').split('/').pop()||'file').slice(0,255).join('');}
export function byteRange(range:string|undefined,size:number):{start:number;end:number}|undefined {
  if(!range)return;
  const fail=()=>{throw new AppError(416,'RANGE_NOT_SATISFIABLE','请求范围无效',[],{'Content-Range':`bytes */${size}`});};
  const m=/^bytes=(\d*)-(\d*)$/.exec(range);if(!m||(!m[1]&&!m[2]))return fail();
  const first=m[1]?Number(m[1]):undefined,last=m[2]?Number(m[2]):undefined;
  if(first!==undefined&&!Number.isSafeInteger(first)||last!==undefined&&!Number.isSafeInteger(last))return fail();
  const start=first===undefined?Math.max(0,size-(last||0)):first,end=first===undefined?size-1:last===undefined?size-1:Math.min(last,size-1);
  if(start<0||start>=size||end<start)return fail();return {start,end};
}
export const binaryHeaders=(mime:string,size:number)=>({'Content-Type':mime,'Content-Length':String(size),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'});

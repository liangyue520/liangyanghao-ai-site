import type {ZodType} from 'zod';
export class AppError extends Error {constructor(public status:number,public code:string,message:string,public fields:{path:string;message:string}[]=[],public headers:Record<string,string>={}){super(message);}}
export function parse<T>(schema:ZodType<T>,data:unknown,status=422):T{const r=schema.safeParse(data);if(!r.success)throw new AppError(status,status===400?'BAD_REQUEST':'VALIDATION_FAILED','输入不符合约定',r.error.issues.map(i=>({path:i.path.join('.'),message:i.message})));return r.data;}
export const unavailable=():never=>{throw new AppError(503,'SERVICE_UNAVAILABLE','业务模块尚未接通；当前为E01工程骨架');};

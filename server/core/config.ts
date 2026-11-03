import fs from 'node:fs';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
export const ROOT=process.cwd();
export const environments={dev:{api:3100,web:5173},e02:{api:3102,web:5175},e03:{api:3103,web:5177},e04:{api:3104,web:5174},qa:{api:3105,web:5176},prod:{api:3100,web:80}} as const;
export interface Config {env:string;root:string;dataRoot:string;dbPath:string;host:'127.0.0.1';apiPort:number;webPort:number;origin:string;csrfSecret:string;ffprobePath:string;secureCookie:boolean}
export function readConfig(env=process.env.SITE_ENV||'dev'):Config{
 if(!/^(dev|e02|e03|e04|qa|prod|test-[a-z0-9-]+)$/.test(env))throw Error('Invalid isolated environment');
 const ports=environments[env as keyof typeof environments]||{api:3199,web:5199};const dataRoot=path.join(ROOT,'.local',env);
 for(const d of ['','objects','tmp','exports','logs'])fs.mkdirSync(path.join(dataRoot,d),{recursive:true});
 const secretFile=path.join(dataRoot,'csrf.key');if(!fs.existsSync(secretFile))fs.writeFileSync(secretFile,randomBytes(32).toString('hex'),{flag:'wx',mode:0o600});
 const csrfSecret=fs.readFileSync(secretFile,'utf8').trim();if(!/^[a-f0-9]{64}$/.test(csrfSecret))throw Error('Invalid CSRF secret');
 const toolFile=path.join(ROOT,'.local/tools/media-tools.json');
 const tool=fs.existsSync(toolFile)?JSON.parse(fs.readFileSync(toolFile,'utf8').replace(/^\uFEFF/,'')):{};
 const origin=process.env.SITE_ORIGIN||`http://127.0.0.1:${ports.web}`;
 const secureCookie=process.env.SITE_SECURE_COOKIE==='true';
 return {env,root:ROOT,dataRoot,dbPath:path.join(dataRoot,'site.sqlite'),host:'127.0.0.1',apiPort:ports.api,webPort:ports.web,origin,csrfSecret,ffprobePath:process.env.FFPROBE_PATH||tool.ffprobe||'',secureCookie};
}

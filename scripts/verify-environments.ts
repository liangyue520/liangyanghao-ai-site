import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {environments,ROOT} from '../server/core/config';
const results:unknown[]=[];let devCookie='';
for(const env of ['dev','e02','e03','e04'] as const){const ports=environments[env];const origin=`http://127.0.0.1:${ports.web}`,api=`http://127.0.0.1:${ports.api}`;const identity=JSON.parse(fs.readFileSync(path.join(ROOT,'.local',env,'test-identity.json'),'utf8'));
 const health=await fetch(origin+'/api/v1/health');assert.equal(health.status,200);const front=await fetch(origin+'/');assert.equal(front.status,200);const login=await fetch(api+'/api/v1/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username:identity.username,password:identity.password})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie')!.split(';')[0];const data=await login.json() as any;let isolated=true;
 if(env==='dev')devCookie=cookie;else{const cross=await fetch(api+'/api/v1/auth/session',{headers:{Cookie:devCookie}});assert.equal(cross.status,401);isolated=cross.status===401;}
 const pending=await fetch(origin+'/api/v1/public/contents');assert.equal(pending.status,503);
 const logout=await fetch(api+'/api/v1/auth/logout',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json','X-CSRF-Token':data.data.csrfToken},body:'{}'});assert.equal(logout.status,200);
 results.push({environment:env,origin,api,health:health.status,front:front.status,login:login.status,crossEnvironmentSessionRejected:isolated,publicBusiness:pending.status});
}
const dir=path.join(ROOT,'协作管理/验证证据/E01');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'environments.json'),JSON.stringify({at:new Date().toISOString(),synthetic:true,results},null,2));console.log('Four isolated environments: front/proxy health/login/logout verified; foreign sessions denied; business stubs remain 503.');

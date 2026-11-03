import {spawn} from 'node:child_process';import {environments} from '../server/core/config';
const index=process.argv.indexOf('--env'),env=index>=0?process.argv[index+1]:'dev';const p=environments[env as keyof typeof environments];if(!p)throw Error('Use --env dev/e02/e03/e04/qa');
const childEnv={...process.env,SITE_ENV:env,SITE_API_PORT:String(p.api),SITE_WEB_PORT:String(p.web)};
const server=spawn(process.execPath,['--import','tsx','server/main.ts','--env',env],{stdio:'inherit',env:childEnv,windowsHide:true});
const front=spawn(process.execPath,['node_modules/vite/bin/vite.js'],{stdio:'inherit',env:childEnv,windowsHide:true});
let closing=false;function close(code=0){if(closing)return;closing=true;server.kill();front.kill();setTimeout(()=>process.exit(code),400).unref();}
server.on('exit',code=>close(code||0));front.on('exit',code=>close(code||0));process.on('SIGINT',()=>close());process.on('SIGTERM',()=>close());

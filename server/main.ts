import {readConfig} from './core/config';import {createContext} from './core/context';import {loadServices} from './core/services';import {buildApp} from './app';
const envArg=process.argv.indexOf('--env');const config=readConfig(envArg>=0?process.argv[envArg+1]:undefined);const ctx=createContext(config),services=await loadServices(ctx);const {app}=await buildApp(ctx,services);
await services.exports.resumeAfterRestart();const timer=setInterval(()=>services.exports.expire(ctx.clock()).catch(()=>ctx.logger.error('export_expiry_failed')),60000);timer.unref();
await app.listen({host:config.host,port:config.apiPort});console.log(JSON.stringify({event:'ready',env:config.env,url:`http://${config.host}:${config.apiPort}`,business:'services integrated locally; acceptance pending'}));
async function stop(){clearInterval(timer);await app.close();process.exit(0);}process.on('SIGINT',stop);process.on('SIGTERM',stop);

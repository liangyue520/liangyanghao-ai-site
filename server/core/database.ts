import {DatabaseSync,type SQLInputValue} from 'node:sqlite';
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
export class Database {
 readonly raw:DatabaseSync;
 constructor(filename:string){this.raw=new DatabaseSync(filename);this.raw.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');this.migrate();}
 prepare(sql:string){return this.raw.prepare(sql);}
 run(sql:string,...args:SQLInputValue[]){return this.prepare(sql).run(...args);}
 get<T=Record<string,unknown>>(sql:string,...args:SQLInputValue[]):T|undefined{return this.prepare(sql).get(...args) as T|undefined;}
 all<T=Record<string,unknown>>(sql:string,...args:SQLInputValue[]):T[]{return this.prepare(sql).all(...args) as T[];}
 transaction<T>(work:()=>T):T{if(this.raw.isTransaction)throw Error('Nested transaction not supported');this.raw.exec('BEGIN IMMEDIATE');try{const v=work();if(v&&typeof (v as any).then==='function')throw Error('Transaction callback must be synchronous');this.raw.exec('COMMIT');return v;}catch(e){this.raw.exec('ROLLBACK');throw e;}}
 private migrate(){this.raw.exec('CREATE TABLE IF NOT EXISTS schema_migrations(name TEXT PRIMARY KEY,sha256 TEXT NOT NULL,applied_at TEXT NOT NULL)');const dir=path.join(process.cwd(),'schema/migrations');for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.sql')).sort()){const sql=fs.readFileSync(path.join(dir,name),'utf8');const hash=createHash('sha256').update(sql).digest('hex');const old=this.get<{sha256:string}>('SELECT sha256 FROM schema_migrations WHERE name=?',name);if(old){if(old.sha256!==hash)throw Error('Applied migration changed');continue;}this.transaction(()=>{this.raw.exec(sql);this.run('INSERT INTO schema_migrations VALUES(?,?,?)',name,hash,new Date().toISOString());});}}
 close(){this.raw.close();}
}

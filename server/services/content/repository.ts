import type {Content} from '../../../shared/contracts';
import type {ServiceContext} from '../../../shared/service-ports';
import {AppError} from '../../core/errors';

export function contentRepository(ctx:ServiceContext) {
  return {
    all():Content[] { return ctx.db.all<{data_json:string}>('SELECT data_json FROM contents').map(r=>JSON.parse(r.data_json)); },
    find(id:string):Content|undefined { const r=ctx.db.get<{data_json:string}>('SELECT data_json FROM contents WHERE id=?',id); return r ? JSON.parse(r.data_json) : undefined; },
    get(id:string):Content { const c=this.find(id); if(!c)throw new AppError(404,'NOT_FOUND','未找到内容'); return c; },
    save(c:Content) {
      if(c.kind==='profile'&&!c.deletedAt&&ctx.db.get('SELECT id FROM contents WHERE kind=? AND deleted_at IS NULL AND id<>?', 'profile',c.id))throw new AppError(409,'STATE_CONFLICT','只能保留一条个人介绍');
      ctx.db.run('INSERT INTO contents(id,kind,status,visibility,revision,created_at,updated_at,deleted_at,data_json) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,visibility=excluded.visibility,revision=excluded.revision,updated_at=excluded.updated_at,deleted_at=excluded.deleted_at,data_json=excluded.data_json',c.id,c.kind,c.status,c.visibility,c.revision,c.createdAt,c.updatedAt,c.deletedAt,JSON.stringify(c));
    }
  };
}

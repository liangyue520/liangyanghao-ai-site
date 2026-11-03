import test from 'node:test';
import assert from 'node:assert/strict';
import {reactive} from 'vue';
import {kinds,type AdminDetail} from '../../../shared/contracts';
import {editSchemaFor} from '../../../shared/schemas';
import {ApiError} from '../../lib/request';
import {analyzeToolboxRelease,applySkillTemplate,blankEdit,blankResource,createAdminApi,EditorModel,editPayload,isToolboxCategory,normalizeMedia,toolboxCategories} from './api';
import {createMockTransport} from './mock';

test('模拟：同一日记上传→排序→保存→重开→公开发布→私密→撤回，上传不修改 revision',async()=>{
 const mock=createMockTransport(),api=createAdminApi(mock.transport),m=reactive(new EditorModel(api));m.form.title='模拟日记';m.isDemo=true;await m.save();assert.ok(m.saved);assert.equal(m.saved.visibility,'private');
 const originalRevision=m.saved.revision;
 for(const name of ['第一页.png','第二页.png']){const {asset}=await api.upload(m.saved.id,'diaryPage',new File(['synthetic'],name,{type:'image/png'}),crypto.randomUUID());m.keepAsset(asset);m.link(asset);}
 assert.equal(m.saved.revision,originalRevision);assert.equal((await api.get(m.saved.id)).media.length,0);assert.equal(m.dirty,true);
 m.form.media=normalizeMedia([...m.form.media].reverse());m.form.recordDate={precision:'range',value:null,fromYear:2007,toYear:2008,approximate:true,note:'年份不确定'};m.form.transcription='合成整理文字';m.form.reflection='合成旁白';await m.save();assert.equal(m.dirty,false);
 const reopened=reactive(new EditorModel(api));await reopened.load(m.saved.id);assert.equal(reopened.form.media[0].assetId,m.form.media[0].assetId);assert.deepEqual(reopened.form.recordDate,m.form.recordDate);assert.equal(reopened.form.reflection,'合成旁白');
 reopened.form.visibility='public';await reopened.save();await reopened.action('publish');assert.equal(reopened.saved!.status,'published');await reopened.action('visibility','private');assert.equal(reopened.saved!.visibility,'private');await reopened.action('withdraw');assert.equal(reopened.saved!.status,'withdrawn');
});
test('模拟：保存 422/409 保留输入，不显示成功，不增加已知版本',async()=>{
 const mock=createMockTransport(),m=reactive(new EditorModel(createAdminApi(mock.transport)));m.form.title='原稿';await m.save();m.form.bodyText='不能丢失的编辑';const revision=m.saved!.revision;
 for(const e of [new ApiError(422,'VALIDATION_FAILED','拒绝'),new ApiError(409,'REVISION_CONFLICT','冲突')]){mock.failNext(e);await m.save();assert.equal(m.form.bodyText,'不能丢失的编辑');assert.equal(m.saved!.revision,revision);assert.equal(m.notice,'');assert.equal(m.dirty,true);assert.equal(m.pending,null);assert.ok(m.error);}
});
test('模拟：响应丢失后用相同键和正文重试，不能重复创建或保存',async()=>{
 const mock=createMockTransport(),m=reactive(new EditorModel(createAdminApi(mock.transport)));m.form.title='丢失响应';mock.loseNextReply();await m.save();assert.equal(m.saved,null);assert.ok(m.pending);assert.equal(m.locked,true);await m.retry();assert.equal(mock.contents.size,1);assert.ok(m.saved);assert.equal(mock.calls[0].options.idempotencyKey,mock.calls[1].options.idempotencyKey);
 m.form.bodyText='第二次';mock.loseNextReply();await m.save();const key=mock.calls.at(-1)!.options.idempotencyKey;await m.retry();assert.equal(mock.calls.at(-1)!.options.idempotencyKey,key);assert.equal((m.saved as AdminDetail|null)?.revision,2);assert.equal(m.dirty,false);
});
test('模拟：上传失败不产生资产与关联，原键重试可恢复',async()=>{
 const mock=createMockTransport(),api=createAdminApi(mock.transport),m=new EditorModel(api);m.form.title='上传失败';await m.save();const key=crypto.randomUUID(),file=new File(['synthetic'],'合成.png',{type:'image/png'});mock.failNext(Error('模拟断线'));
 await assert.rejects(api.upload(m.saved!.id,'diaryPage',file,key));assert.equal(mock.assets.size,0);assert.equal(m.form.media.length,0);const result=await api.upload(m.saved!.id,'diaryPage',file,key);assert.ok(result.asset);assert.equal(mock.assets.size,1);assert.equal(m.saved!.media.length,0);
});
test('六种类型完整 PUT、external 切换和日期不补值',()=>{
 for(const kind of kinds){const p=editPayload(kind,{...blankEdit(),title:'合成记录'});assert.equal(Object.keys(p).length,12);assert.ok(editSchemaFor(kind).safeParse(p).success);assert.equal(p.recordDate.value,null);}
 const source={...blankEdit(),title:'资源',resource:blankResource(),media:[{assetId:crypto.randomUUID(),role:'resourceFile' as const,position:0,alt:null}]};assert.equal(editPayload('resource',source).media.length,0);assert.equal(source.media.length,1);
});
test('模拟：访客统计只请求后台统计接口，不写入采集接口',async()=>{
 const paths:string[]=[];const api=createAdminApi({request:async <T>(path:string)=>{paths.push(path);return {range:'7d',since:'2026-10-06T00:00:00.000Z',overview:{pageviews:3,visitors:2,visits:2},topPages:[],referrers:[],devices:[],browsers:[],recent:[]} as T;},upload:async()=>{throw Error('本测试不上传');}});
 const result=await api.analyticsSummary('7d');assert.equal(result.overview?.pageviews ?? result.pageViews ?? result.totals?.pageviews,3);assert.deepEqual(paths,['/api/v1/admin/analytics/summary?range=7d']);
});

test('模拟：导出 pending/ready 与失败传播，软删除保留资产',async()=>{
 const mock=createMockTransport(),api=createAdminApi(mock.transport);const created=await api.exportCreate(crypto.randomUUID());assert.equal(created.state,'pending');assert.equal((await api.exportGet(created.id)).state,'ready');mock.failNext(new ApiError(503,'SERVICE_UNAVAILABLE','尚未接通'));await assert.rejects(api.exportCreate(crypto.randomUUID()));
 const m=new EditorModel(api);m.form.title='待删除合成稿';await m.save();const {asset}=await api.upload(m.saved!.id,'diaryPage',new File(['test'],'页.png'),crypto.randomUUID());m.keepAsset(asset);m.link(asset);await m.save();await m.remove();assert.ok(m.saved!.deletedAt);assert.equal(mock.assets.size,1);
});
test('V02：AI 工具箱固定分类和 Skill Markdown 模板',()=>{
 assert.deepEqual([...toolboxCategories],['写作工具','开发协作','知识整理','网站运营','通用提示词']);
 assert.equal(isToolboxCategory('写作工具'),true);assert.equal(isToolboxCategory('随手分类'),false);
 const edit=blankEdit();edit.category='写作工具';applySkillTemplate(edit);
 assert.match(edit.bodyText||'',/## 适用场景/);assert.match(edit.bodyText||'',/已脱敏：否/);assert.equal(edit.resource?.usageInstructions,'按正文中的适用场景、输入和使用步骤使用。');
});
test('V02：发布前阻止本地路径、密钥、真实日记和许可不足下载',()=>{
 const edit=blankEdit();edit.title='合成 Skill';edit.category='开发协作';edit.bodyText='已脱敏：是\n请读取 F:/个人网站/.local/test\nAPI Key: sk-test-secret\n真实日记';edit.resource={...blankResource(),mode:'download',sourceUrl:'https://example.com/skill',author:'站主',usageInstructions:'说明'};
 const result=analyzeToolboxRelease(edit);
 assert.ok(result.blockers.some(x=>x.includes('本地路径')));
 assert.ok(result.blockers.some(x=>x.includes('API Key')));
 assert.ok(result.blockers.some(x=>x.includes('真实日记')));
 assert.ok(result.blockers.some(x=>x.includes('本站下载')));
});
test('V02：WARNING 需要确认但不等同阻止项',()=>{
 const edit=blankEdit();edit.title='合成 Skill';edit.category='网站运营';edit.bodyText='已脱敏：是\n这是抽象部署经验，包含 example.com 占位符';edit.resource={...blankResource(),mode:'external',sourceUrl:'https://example.com/skill',author:'站主',usageInstructions:'打开原出处使用'};
 const result=analyzeToolboxRelease(edit);
 assert.equal(result.blockers.length,0);assert.ok(result.warnings.length>=2);
});

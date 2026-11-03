import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {Readable} from 'node:stream';
import {harness,key,edit,evidenceRoot} from '../harness';
import type {AdminDetail,ResourceData} from '../../../../../shared/contracts';
import {isToolboxContent,toolboxReleaseCheck,TOOLBOX_CATEGORIES} from '../../../content/policy';

const externalResource:ResourceData={mode:'external',sourceUrl:'https://example.com/toolbox',author:'E03 V02 synthetic',licenseName:'Synthetic License',redistribution:'unknown',permissionNote:null,usageInstructions:'仅用于 AI 工具箱合成验证。',modificationNote:'无真实资料。',versionLabel:'v0.2-synthetic'};
const downloadResource:ResourceData={...externalResource,mode:'download',redistribution:'allowed',permissionNote:'合成 TXT 附件允许在本地测试中下载。'};

function toolboxBody(name:string){
  return [
    '标签：Skill, SOP, 合成样本',
    '',
    '## 适用场景',
    `${name} 用于验证 AI 工具箱公开展示。`,
    '',
    '## 输入',
    '合成输入，使用低敏占位内容。',
    '',
    '## 输出',
    '公开说明、来源许可和可复制正文片段。',
    '',
    '## 使用步骤',
    '1. 阅读公开说明。',
    '2. 按授权范围使用。',
    '',
    '## 示例（已脱敏）',
    'example.com 仅作为占位符。',
    '',
    '## 注意事项',
    '发布前请先移除个人隐私、内部材料和未确认授权的全文。',
    '',
    '## 版本与许可',
    'v0.2-synthetic'
  ].join('\n');
}

async function createToolbox(h:Awaited<ReturnType<typeof harness>>,title:string,patch:Partial<AdminDetail>={}){
  const c=await h.services.content.create(h.actor,{kind:'resource',title,isDemo:true,summary:'E03 V02 合成 Skill',category:'开发协作',featured:false,bodyText:toolboxBody(title),resource:externalResource},key());
  return h.services.content.replace(h.actor,c.id,edit(c,{visibility:'public',...patch}),c.revision);
}

test('v02 toolbox service policy, public DTO and media authorization',async()=>{
  const h=await harness('v02-toolbox');
  try {
    const external=await createToolbox(h,`${h.runId}-public-external`,{featured:true});
    let publicExternal=await h.services.content.publish(h.actor,external.id,'public',external.revision);
    assert.equal(isToolboxContent(publicExternal),true);
    const list=await h.services.content.listPublic({page:1,pageSize:20,kind:'resource',category:'开发协作',featured:true});
    assert.ok(list.items.some(item=>item.id===publicExternal.id));
    assert.deepEqual([...TOOLBOX_CATEGORIES],['写作工具','开发协作','知识整理','网站运营','通用提示词']);
    const detail=await h.request('GET',`/api/v1/public/contents/${publicExternal.id}`,undefined,{},true);
    assert.equal(detail.statusCode,200);
    const dto=detail.json().data;
    assert.equal(dto.kind,'resource');
    assert.equal(dto.category,'开发协作');
    for(const forbidden of ['revision','status','visibility','deletedAt','storageKey','updatedAt'])assert.equal(forbidden in dto,false);
    assert.equal(JSON.stringify(dto).includes('storageKey'),false);
    assert.equal(dto.media.some((m:any)=>m.role==='resourceFile'),false);
    assert.equal(toolboxReleaseCheck(publicExternal).blockers.length,0);
    assert.ok(toolboxReleaseCheck(publicExternal).warnings.includes('模板占位符需确认不是可用真实值'));

    const offCategory=await createToolbox(h,`${h.runId}-ordinary-resource`,{category:'普通资源'});
    const publishedOffCategory=await h.services.content.publish(h.actor,offCategory.id,'public',offCategory.revision);
    assert.equal(isToolboxContent(publishedOffCategory),false);

    const blocked=await createToolbox(h,`${h.runId}-blocked`,{bodyText:'这是合成阻止样本，包含 F:/个人网站/secret 和 storageKey。'});
    const blockedPublish=await h.request('POST',`/api/v1/admin/contents/${blocked.id}/publish`,{confirmVisibility:'public'},{'if-match':`"${blocked.revision}"`});
    assert.equal(blockedPublish.statusCode,422);
    assert.equal(blockedPublish.json().error.code,'PUBLISH_VALIDATION_FAILED');
    assert.equal((await h.services.content.getAdmin(h.actor,blocked.id)).status,'draft');

    const download=await createToolbox(h,`${h.runId}-public-download`,{resource:downloadResource});
    const upload=await h.services.media.upload(h.actor,download.id,'resourceFile',{stream:Readable.from([Buffer.from('SYNTHETIC V02 TOOLBOX DOWNLOAD\n')]),originalName:'v02-toolbox-synthetic.txt',declaredMime:'text/plain'},key());
    const linked=await h.services.content.replace(h.actor,download.id,edit(download,{resource:downloadResource,media:[{assetId:upload.asset.assetId,role:'resourceFile',position:0,alt:null}]}),download.revision);
    const publicDownload=await h.services.content.publish(h.actor,linked.id,'public',linked.revision);
    const publicDownloadDetail=await h.request('GET',`/api/v1/public/contents/${publicDownload.id}`,undefined,{},true);
    assert.equal(publicDownloadDetail.statusCode,200);
    const downloadUrl=publicDownloadDetail.json().data.media.find((m:any)=>m.role==='resourceFile')?.urls?.download;
    assert.ok(downloadUrl);
    assert.equal((await h.request('GET',downloadUrl,undefined,{},true)).statusCode,200);
    assert.equal((await h.request('HEAD',downloadUrl,undefined,{},true)).statusCode,200);
    assert.equal((await h.request('GET',`/api/v1/media/${upload.asset.assetId}/original`,undefined,{},true)).statusCode,404);
    assert.equal((await h.request('GET',downloadUrl,undefined,{range:'bytes=0-5'},true)).statusCode,200);

    const withdrawn=await h.services.content.withdraw(h.actor,publicDownload.id,publicDownload.revision);
    assert.equal((await h.request('GET',`/api/v1/public/contents/${withdrawn.id}`,undefined,{},true)).statusCode,404);
    assert.equal((await h.request('HEAD',downloadUrl,undefined,{},true)).statusCode,404);

    const privateSkill=await createToolbox(h,`${h.runId}-private`,{visibility:'private'});
    const publishedPrivate=await h.services.content.publish(h.actor,privateSkill.id,'private',privateSkill.revision);
    assert.equal((await h.request('GET',`/api/v1/public/contents/${publishedPrivate.id}`,undefined,{},true)).statusCode,404);

    const insufficient=await createToolbox(h,`${h.runId}-license-insufficient`,{resource:{...downloadResource,permissionNote:null}});
    const insufficientPublish=await h.request('POST',`/api/v1/admin/contents/${insufficient.id}/publish`,{confirmVisibility:'public'},{'if-match':`"${insufficient.revision}"`});
    assert.equal(insufficientPublish.statusCode,422);
    assert.equal(insufficientPublish.json().error.code,'PUBLISH_VALIDATION_FAILED');

    const exportJob=await h.services.exports.create(h.actor,key());
    let ready=await h.services.exports.get(h.actor,exportJob.id);
    for(let i=0;i<300&&['pending','running'].includes(ready.state);i++){await new Promise(r=>setTimeout(r,20));ready=await h.services.exports.get(h.actor,exportJob.id);}
    assert.equal(ready.state,'ready',JSON.stringify(ready.error));
    h.records.push({
      samples:{
        publicExternalId:publicExternal.id,
        publicDownloadId:publicDownload.id,
        downloadAssetId:upload.asset.assetId,
        withdrawnId:withdrawn.id,
        privateId:publishedPrivate.id,
        licenseInsufficientId:insufficient.id,
        blockedId:blocked.id,
        ordinaryResourceId:publishedOffCategory.id
      },
      toolboxCategories:TOOLBOX_CATEGORIES,
      exportId:ready.id,
      exportState:ready.state,
      exportSha256:ready.sha256
    });
    await fs.mkdir(path.join(evidenceRoot,'V02'),{recursive:true});
    await fs.writeFile(path.join(evidenceRoot,'V02',`${h.runId}-q03-samples.json`),JSON.stringify(h.records.at(-1),null,2));
  }finally{await h.finish('V02');}
});

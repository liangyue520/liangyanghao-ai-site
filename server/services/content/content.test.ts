import test from 'node:test';
import assert from 'node:assert/strict';
import {harness,key,edit} from '../fixtures/e03/harness';

test('content real routes: anonymous denial, durable draft, replay, publication and withdrawal',async()=>{
  const h=await harness('content');
  try {
    assert.equal((await h.request('POST','/api/v1/admin/contents',{kind:'story',title:'合成拒绝'}, {},true)).statusCode,401);
    const input={kind:'story',title:h.runId,isDemo:true,bodyText:'明确合成故事，不是真实日记'},requestKey=key();
    const created=await h.request('POST','/api/v1/admin/contents',input,{'idempotency-key':requestKey});assert.equal(created.statusCode,201);let c=created.json().data;h.records.push({contentId:c.id});
    assert.equal(c.visibility,'private');assert.equal(c.status,'draft');assert.equal(c.recordDate.precision,'unknown');assert.equal(c.recordDate.value,null);
    const replay=await h.request('POST','/api/v1/admin/contents',input,{'idempotency-key':requestKey});assert.deepEqual(replay.json().data,c);
    assert.equal((await h.request('POST','/api/v1/admin/contents',{...input,title:'另一个输入'},{'idempotency-key':requestKey})).statusCode,409);
    assert.equal((await h.request('GET',`/api/v1/public/contents/${c.id}`,undefined,{},true)).statusCode,404);
    const url=`/api/v1/admin/contents/${c.id}`;
    const invalid=edit(c) as any;delete invalid.transcription;
    assert.equal((await h.request('PUT',url,invalid,{'if-match':'"1"'})).statusCode,422);
    assert.equal((await h.request('PUT',url,edit(c,{transcription:''}),{'if-match':'"1"'})).statusCode,422);
    let response=await h.request('PUT',url,edit(c,{visibility:'public'}),{'if-match':'"1"'});assert.equal(response.statusCode,200);c=response.json().data;
    assert.equal((await h.request('PUT',url,edit(c),{'if-match':'"1"'})).statusCode,409);
    response=await h.request('POST',url+'/publish',{confirmVisibility:'public'},{'if-match':`"${c.revision}"`});assert.equal(response.statusCode,200);c=response.json().data;
    const pub=await h.request('GET',`/api/v1/public/contents/${c.id}`,undefined,{},true);assert.equal(pub.statusCode,200);assert.equal(pub.json().data.bodyText,input.bodyText);assert.equal('revision' in pub.json().data,false);
    const list=await h.request('GET','/api/v1/public/contents?kind=story',undefined,{},true);assert.equal(list.statusCode,200);
    assert.equal((await h.request('PUT',url,edit(c),{'if-match':`"${c.revision}"`})).json().error.code,'EDIT_REQUIRES_WITHDRAW');
    const withdrawKey=key(),oldRev=c.revision;
    response=await h.request('POST',url+'/withdraw',{}, {'if-match':`"${oldRev}"`,'idempotency-key':withdrawKey});c=response.json().data;assert.equal(response.statusCode,200);
    assert.equal((await h.request('GET',`/api/v1/public/contents/${c.id}`,undefined,{},true)).statusCode,404);
    assert.deepEqual((await h.request('POST',url+'/withdraw',{}, {'if-match':`"${oldRev}"`,'idempotency-key':withdrawKey})).json().data,c);
    assert.equal((await h.request('POST',url+'/withdraw',{}, {'if-match':`"${c.revision}"`})).json().data.revision,c.revision);
    response=await h.request('DELETE',url,undefined,{'if-match':`"${c.revision}"`});assert.equal(response.statusCode,200);const deleted=response.json().data;
    assert.deepEqual((await h.request('DELETE',url,undefined,{'if-match':`"${deleted.revision}"`})).json().data,deleted);
    assert.equal((await h.request('PUT',url,edit(c),{'if-match':`"${deleted.revision}"`})).statusCode,410);
    for(const kind of ['diary','video','resource','game'] as const){const d=await h.services.content.create(h.actor,{kind,title:`${h.runId}-${kind}`,isDemo:true},key());const saved=await h.services.content.replace(h.actor,d.id,edit(d),d.revision);assert.equal(saved.recordDate.value,null);await assert.rejects(h.services.content.publish(h.actor,d.id,'private',saved.revision),{code:'PUBLISH_VALIDATION_FAILED'});}
    // profile uniqueness is preserved: only create a new synthetic profile if the environment has none.
    const profiles=await h.services.content.listAdmin(h.actor,{page:1,pageSize:50,kind:'profile'});
    if(!profiles.total){const d=await h.services.content.create(h.actor,{kind:'profile',title:h.runId+'-profile',isDemo:true},key());const saved=await h.services.content.replace(h.actor,d.id,edit(d),d.revision);await h.services.content.softDelete(h.actor,d.id,saved.revision);}
    await assert.rejects(h.services.content.create(null as any,input as any,key()),{code:'AUTH_REQUIRED'});
  }finally{await h.finish();}
});

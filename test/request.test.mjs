import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequestSchema,validateAccessRequest,requestMessage} from '../src/index.mjs';
import {handleAccessRequest} from '../src/server.mjs';
const identity={first_name:'Example',last_name:'Person',email:'user@example.org',email_confirmation:'user@example.org',source:'course:example'};
const form=values=>{const data=new FormData();for(const [key,value] of Object.entries({...identity,...values}))data.set(key,value);return data;};
test('the existing three request reasons keep their field requirements',()=>{
  for(const values of [{reason:'already-enrolled',current_program:'Current class'},{reason:'sample'},{reason:'between-sessions',recent_program:'Recent',upcoming_program:'Next'}])assert.equal(validateAccessRequest(identity,form(values)).ok,true);
  assert.equal(validateAccessRequest(identity,form({reason:'already-enrolled'})).ok,false);
});
test('inactive program details are ignored, including duplicate inactive values',()=>{
  const data=form({reason:'sample',current_program:'stale'});data.append('current_program','duplicate');
  const result=validateAccessRequest(identity,data);assert.equal(result.ok,true);assert.deepEqual(result.data.request,{reason:'sample'});
});
test('duplicate active fields, duplicate reasons, missing and oversize values are rejected',()=>{
  for(const mode of ['duplicate-field','duplicate-reason','oversize']){
    const data=form({reason:'already-enrolled',current_program:'Current'});
    if(mode==='duplicate-field')data.append('current_program','other');
    if(mode==='duplicate-reason')data.append('reason','sample');
    if(mode==='oversize')data.set('current_program','x'.repeat(201));
    assert.equal(validateAccessRequest(identity,data).ok,false);
  }
});
test('another workflow is expressed as declarative reasons and fields',()=>{
  const schema=createRequestSchema({identity:{allowedSources:['quote']},reasons:[{value:'estimate',label:'Request an estimate',fields:[{name:'budget',label:'Budget',required:false,limit:30}]},{value:'callback',label:'Please call me',fields:[]}],messages:{reason:'Choose an option',field:'Check your details'}});
  const result=schema.validate({...identity,source:'quote'},form({reason:'estimate',budget:'Under 5000'}));
  assert.equal(result.ok,true);assert.equal(schema.formatMessage(result.data.request),'Request an estimate\n\nBudget: Under 5000');
  assert.throws(()=>schema.formatMessage({reason:'other'}));
});
test('default request formatting preserves existing class detail wording',()=>{
  assert.equal(requestMessage({reason:'between-sessions',recent_program:'Recent',upcoming_program:'Next'}),"I'm between sessions and would like to prep for the next one\n\nCurrent or recent class or program: Recent\nNext or upcoming class or program: Next");
});
test('the server shares core security/transport while leaving authorization to the application',async()=>{
  let delivered;const data=form({reason:'sample',current_program:'ignored'});data.append('current_program','also ignored');
  const response=await handleAccessRequest(new Request('https://example.org/request',{method:'POST',body:data}),{},{verifyHuman:async()=>({ok:true}),deliver:async value=>{delivered=value;}});
  assert.equal(response.status,202);assert.deepEqual(delivered.request,{reason:'sample'});
});
test('conflicting or unsafe schema fields cannot silently replace identity inputs',()=>{
  for(const reasons of [[{value:'x',label:'Example',fields:[{name:'email',label:'Email'}]}],[{value:'x',label:'Example',fields:[]},{value:'x',label:'Other',fields:[]}]])assert.throws(()=>createRequestSchema({reasons}));
  assert.throws(()=>createRequestSchema({reasonField:'email'}));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestPost,validateInquiry} from '../functions/api/contact.js';
const data={type:'Private teaching',name:'Test Person',email:'guest@example.com',date:'January',message:'Lesson inquiry',website:''};
const request=(body=data,origin='https://nashmusic.org')=>new Request('https://nashmusic.org/api/contact',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
const env=()=>({EMAIL_SEND_TOKEN:'test',CF_ACCOUNT_ID:'test',CONTACT_LIMITS:{get:async()=>null,put:async()=>{}}});
test('rejects invalid fields and header injection',()=>{for(const change of [{name:'A\r\nB'},{email:'bad'},{type:'attacker@example.com'},{message:''},{message:'x'.repeat(3001)}])assert.throws(()=>validateInquiry({...data,...change}));});
test('unconfigured, cross-origin, honeypot, and rate limits cannot send',async()=>{
 assert.equal((await onRequestPost({request:request(),env:{}})).status,503);
 assert.equal((await onRequestPost({request:request(data,'https://elsewhere.example'),env:env()})).status,403);
 assert.equal((await onRequestPost({request:request({...data,website:'spam'}),env:env()})).status,400);
 const e=env();e.CONTACT_LIMITS.get=async()=>5;
 assert.equal((await onRequestPost({request:request(),env:e})).status,429);
});
test('routes to fixed teaching mailbox, sets reply-to, and handles rejected delivery honestly',async t=>{
 let payload;
 t.mock.method(globalThis,'fetch',async(_url,options)=>{payload=JSON.parse(options.body);return Response.json({success:true,result:{queued:['lessons@nashmusic.org']}});});
 assert.equal((await onRequestPost({request:request({...data,to:'attacker@example.com'}),env:env()})).status,200);
 assert.equal(payload.to,'lessons@nashmusic.org');assert.equal(payload.reply_to,'guest@example.com');assert.equal(payload.from,'nash@nashmusic.org');
 globalThis.fetch=async()=>Response.json({success:true,result:{permanent_bounces:['lessons@nashmusic.org']}});
 assert.equal((await onRequestPost({request:request(),env:env()})).status,502);
});

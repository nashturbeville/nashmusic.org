import {json,body,normalize,sameOrigin,authorized,throttle,notify} from './_lib.js';
export async function onRequest({request,env,waitUntil}){
 if(!env.REQUESTS)return json({error:'The request desk is not connected yet. Use “Text my request” when available.'},503);
 if(request.method==='GET'){
  if(!authorized(request,env))return json({error:'Enter a valid admin access key.'},401);
  const list=await env.REQUESTS.list({prefix:'request:',limit:1000});const records=await Promise.all(list.keys.map(k=>env.REQUESTS.get(k.name,'json')));
  return json({requests:records.filter(Boolean).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))});
 }
 if(request.method==='PATCH'){
  if(!authorized(request,env)||!sameOrigin(request))return json({error:'Unauthorized.'},401);
  try{const data=await body(request);if(!['New','Up next','Played'].includes(data.status)||!/^[a-f0-9-]{36}$/.test(data.id))return json({error:'Invalid request.'},400);const key='request:'+data.id,record=await env.REQUESTS.get(key,'json');if(!record)return json({error:'Request not found.'},404);record.status=data.status;await env.REQUESTS.put(key,JSON.stringify(record),{expirationTtl:2592000});return json({ok:true});}catch{return json({error:'Invalid request.'},400);}
 }
 if(request.method!=='POST')return json({error:'Method not allowed.'},405);
 if(!sameOrigin(request))return json({error:'Please submit from this website.'},403);
 if(await throttle(request,env))return json({error:'Please wait a minute before sending another request.'},429);
 try{const record=normalize(await body(request));if(!record.song)return json({error:'Choose a song first.'},400);const key='request:'+record.id;if(!await env.REQUESTS.get(key)){await env.REQUESTS.put(key,JSON.stringify(record),{expirationTtl:2592000});waitUntil(notify(env,record));}return json({ok:true,id:record.id});}catch{return json({error:'Please check your request and try again.'},400);}
}

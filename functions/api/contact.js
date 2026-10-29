import {json,body,sameOrigin} from './_lib.js';
const recipients={'Solo performance':'booking@nashmusic.org','Dueling pianos':'booking@nashmusic.org','Private teaching':'lessons@nashmusic.org','Other':'nash@nashmusic.org'};
export const contactReady=env=>!!(env.EMAIL_SEND_TOKEN&&env.CF_ACCOUNT_ID&&env.CONTACT_LIMITS);
export function validateInquiry(data){
 if(!data||typeof data!=='object'||!Object.hasOwn(recipients,data.type))throw Error('Choose an inquiry type.');
 for(const [key,max] of [['name',100],['email',254],['date',100],['message',3000]])if(typeof data[key]!=='string'||data[key].length>max)throw Error('Check your name, email, and message.');
 if(!data.name.trim()||!data.message.trim()||!/^\S+@[^\s@]+\.[^\s@]+$/.test(data.email)||/[\r\n]/.test(data.name+data.email))throw Error('Check your name, email, and message.');
 return {type:data.type,name:data.name.trim(),email:data.email.trim(),date:data.date.trim(),message:data.message.trim()};
}
export async function onRequestPost({request,env}){
 if(!sameOrigin(request))return json({error:'Please use the contact form on this website.'},403);
 if(!contactReady(env))return json({error:'Please email booking@nashmusic.org directly for now.'},503);
 let input;try{input=await body(request);if(input.website)return json({error:'Please leave the website field empty.'},400);input=validateInquiry(input);}catch(error){return json({error:error.message},400);}
 try{
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(request.headers.get('CF-Connecting-IP')||'unknown'));
  const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  const key=`contact:${hash}:${Math.floor(Date.now()/3600000)}`;
  const count=Number(await env.CONTACT_LIMITS.get(key)||0);
  if(count>=5)return json({error:'Please wait before submitting again, or email Nash directly.'},429);
  await env.CONTACT_LIMITS.put(key,String(count+1),{expirationTtl:7200});
  const to=recipients[input.type];
  const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CF_ACCOUNT_ID)}/email/sending/send`,{method:'POST',headers:{Authorization:`Bearer ${env.EMAIL_SEND_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({from:'nash@nashmusic.org',to,reply_to:input.email,subject:`Website inquiry: ${input.type} — ${input.name}`,text:`Inquiry from nashmusic.org\n\nName: ${input.name}\nReply email: ${input.email}\nInterest: ${input.type}\nDate: ${input.date||'Not specified'}\n\n${input.message}`}),signal:AbortSignal.timeout(10000)});
  const data=await response.json();
  const accepted=[...(data.result?.delivered||[]),...(data.result?.queued||[])];
  if(!response.ok||!data.success||!accepted.includes(to))return json({error:'Email delivery was not accepted. Please use the email address on this page.'},502);
  return json({ok:true});
 }catch{return json({error:'Email delivery could not be confirmed. Please email Nash directly.'},502);}
}

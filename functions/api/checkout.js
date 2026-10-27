import {json,body,normalize,sameOrigin,throttle} from './_lib.js';
export async function onRequestPost({request,env}){
 if(!sameOrigin(request))return json({error:'Please start checkout from this website.'},403);
 if(!env.STRIPE_SECRET_KEY)return json({error:'Apple Pay and card checkout are not connected yet. Please use another available payment option.'},503);
 if(await throttle(request,env))return json({error:'Please wait a minute before trying again.'},429);
 try{
  const data=await body(request),record=normalize(data),amount=Number(data.amount),cents=Math.round(amount*100);
  if(!Number.isFinite(amount)||cents<100||cents>50000)return json({error:'Choose a tip between $1 and $500.'},400);
  const origin=new URL(request.url).origin;
  const params=new URLSearchParams({mode:'payment','payment_method_types[0]':'card','line_items[0][price_data][currency]':'usd','line_items[0][price_data][unit_amount]':String(cents),'line_items[0][price_data][product_data][name]':'Tip for Nash’s live music','line_items[0][quantity]':'1',success_url:origin+'/thanks?session_id={CHECKOUT_SESSION_ID}',cancel_url:origin+'/requests',client_reference_id:record.id,'metadata[request_id]':record.id,'metadata[song]':record.song,'metadata[dedication]':record.dedication,'metadata[guest_name]':record.name});
  const r=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':`${record.id}-${cents}`},body:params});
  const result=await r.json();if(!r.ok||!result.url)return json({error:'Checkout could not be opened. Please try again shortly.'},502);
  if(env.REQUESTS&&!await env.REQUESTS.get('request:'+record.id))await env.REQUESTS.put('request:'+record.id,JSON.stringify(record),{expirationTtl:2592000});
  return json({url:result.url});
 }catch{return json({error:'Please check the tip amount and try again.'},400);}
}

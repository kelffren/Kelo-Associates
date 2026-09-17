import {createClient} from 'npm:@supabase/supabase-js@2';

const env=(n:string)=>Deno.env.get(n)||'';
function secretKey(){const modern=env('SUPABASE_SECRET_KEYS');if(modern){try{return JSON.parse(modern).default||''}catch{}}return env('SUPABASE_SERVICE_ROLE_KEY')}
const db=createClient(env('SUPABASE_URL'),secretKey(),{auth:{persistSession:false}});

async function signTwilio(url:string,params:URLSearchParams,token:string){
  const pairs=[...new Set([...params.keys()])].sort().flatMap(k=>params.getAll(k).sort().map(v=>`${k}${v}`)).join('');
  const data=new TextEncoder().encode(url+pairs);const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(token),{name:'HMAC',hash:'SHA-1'},false,['sign']);
  const sig=new Uint8Array(await crypto.subtle.sign('HMAC',key,data));let binary='';for(const b of sig)binary+=String.fromCharCode(b);return btoa(binary);
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return new Response('method not allowed',{status:405});
  const token=env('TWILIO_AUTH_TOKEN'),expectedUrl=env('TWILIO_WEBHOOK_URL'),provided=req.headers.get('x-twilio-signature')||'';
  if(!token||!expectedUrl)return new Response('webhook not configured',{status:503});
  const raw=await req.text();const params=new URLSearchParams(raw);const expected=await signTwilio(expectedUrl,params,token);
  if(provided!==expected)return new Response('invalid signature',{status:403});
  const from=params.get('From')||'',to=params.get('To')||'',body=params.get('Body')||'',sid=params.get('MessageSid')||'';
  const channel=(from.startsWith('whatsapp:')||to.startsWith('whatsapp:'))?'whatsapp':'sms';const workspace=env('KELO_DEFAULT_WORKSPACE')||'default';
  await db.from('kelo_messages').insert({workspace,channel,direction:'in',to_address:to,from_address:from,body,provider_id:sid||null,status:'received',payload:Object.fromEntries(params.entries())});
  await db.from('kelo_audit').insert({workspace,event_type:'message.received',object_type:'message',object_id:sid||null,payload:{channel,from,to}});
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>',{status:200,headers:{'Content-Type':'text/xml'}});
});

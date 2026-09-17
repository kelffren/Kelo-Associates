import {createClient} from 'npm:@supabase/supabase-js@2';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-kelo-workspace','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
const env=(name:string)=>Deno.env.get(name)||'';
function secretKey(){const modern=env('SUPABASE_SECRET_KEYS');if(modern){try{return JSON.parse(modern).default||''}catch{}}return env('SUPABASE_SERVICE_ROLE_KEY')}
const supabase=createClient(env('SUPABASE_URL'),secretKey(),{auth:{persistSession:false,autoRefreshToken:false}});
const workspaceOf=(req:Request)=>String(req.headers.get('x-kelo-workspace')||'default').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,64)||'default';

async function authorize(req:Request){
  const supplied=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();if(!supplied)return {ok:false,mode:'none'};
  const legacy=env('KELO_ADMIN_TOKEN');if(legacy&&supplied.length===legacy.length&&supplied===legacy)return {ok:true,mode:'legacy-token',role:'admin'};
  const {data,error}=await supabase.auth.getUser(supplied);const user=data?.user;if(error||!user)return {ok:false,mode:'supabase',reason:'invalid_session'};
  const {data:admin,error:adminError}=await supabase.from('kelo_admins').select('role,active').eq('user_id',user.id).eq('active',true).maybeSingle();
  if(adminError||!admin)return {ok:false,mode:'supabase',reason:'not_approved',userId:user.id};
  return {ok:true,mode:'supabase',userId:user.id,role:admin.role||'operator'};
}
async function audit(workspace:string,event_type:string,payload:Record<string,unknown>={},object_type?:string,object_id?:string){await supabase.from('kelo_audit').insert({workspace,event_type,payload,object_type:object_type||null,object_id:object_id||null})}

async function materializeOrders(workspace:string,state:any){
  for(const order of state?.retail?.orders||[]){if(!order?.id||!['watches','zara','moissanite'].includes(order.vertical))continue;await supabase.from('kelo_orders').upsert({id:String(order.id),workspace,client_id:order.clientId||null,vertical:order.vertical,status:order.status||'draft',total:Number(order.total||0),payment_provider_id:order.paymentProviderId||null,payment_url:order.paymentUrl||null,payload:order,updated_at:new Date().toISOString()},{onConflict:'id'})}
}
async function getState(workspace:string){const {data,error}=await supabase.from('kelo_state').select('revision,state,updated_at').eq('workspace',workspace).maybeSingle();if(error)throw error;return data||{revision:0,state:null,updated_at:null}}
async function putState(workspace:string,body:any){const expectedRevision=Number(body?.expectedRevision||0),nextState=body?.state;if(!nextState||typeof nextState!=='object')return json({error:'invalid_state'},400);const current=await getState(workspace),currentRevision=Number(current?.revision||0);if(currentRevision!==expectedRevision)return json({error:'revision_conflict',message:'Remote state changed',current},409);const nextRevision=currentRevision+1;const {error}=await supabase.from('kelo_state').upsert({workspace,revision:nextRevision,state:nextState,updated_at:new Date().toISOString()},{onConflict:'workspace'});if(error)throw error;await materializeOrders(workspace,nextState);await audit(workspace,'state.saved',{revision:nextRevision});return json({ok:true,revision:nextRevision})}

async function sendTwilio(workspace:string,body:any){
  const channel=String(body?.channel||'sms'),to=String(body?.to||'').trim(),message=String(body?.body||'').trim();if(!['sms','whatsapp'].includes(channel)||!to||!message)return json({error:'invalid_message'},400);
  const sid=env('TWILIO_ACCOUNT_SID'),token=env('TWILIO_AUTH_TOKEN'),from=channel==='whatsapp'?env('TWILIO_WHATSAPP_FROM'):env('TWILIO_SMS_FROM');if(!sid||!token||!from)return json({error:'provider_not_configured',provider:'twilio'},503);
  const normalizeWa=(v:string)=>v.startsWith('whatsapp:')?v:`whatsapp:${v}`;const form=new URLSearchParams({To:channel==='whatsapp'?normalizeWa(to):to,From:channel==='whatsapp'?normalizeWa(from):from,Body:message});if(body?.mediaUrl)form.set('MediaUrl',String(body.mediaUrl));
  const res=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,{method:'POST',headers:{Authorization:`Basic ${btoa(`${sid}:${token}`)}`,'Content-Type':'application/x-www-form-urlencoded'},body:form});const data=await res.json();
  await supabase.from('kelo_messages').insert({workspace,channel,direction:'out',to_address:to,from_address:from,body:message,provider_id:data?.sid||null,status:data?.status||String(res.status),payload:data});await audit(workspace,'message.sent',{channel,to,status:data?.status||res.status},'message',data?.sid||undefined);return json(data,res.ok?200:res.status);
}

async function createPayment(workspace:string,body:any){
  const secret=env('STRIPE_SECRET_KEY');if(!secret)return json({error:'provider_not_configured',provider:'stripe'},503);const amount=Number(body?.amount||0);if(!Number.isFinite(amount)||amount<=0)return json({error:'invalid_amount'},400);const orderId=String(body?.orderId||'').trim();if(!orderId)return json({error:'order_id_required'},400);
  const base=env('APP_BASE_URL').replace(/\/$/,''),successUrl=String(body?.successUrl||`${base}/?payment=success`),cancelUrl=String(body?.cancelUrl||`${base}/?payment=cancelled`);if(!successUrl.startsWith('http')||!cancelUrl.startsWith('http'))return json({error:'checkout_urls_required'},400);
  const params=new URLSearchParams();params.set('mode','payment');params.set('success_url',successUrl);params.set('cancel_url',cancelUrl);params.set('line_items[0][quantity]','1');params.set('line_items[0][price_data][currency]',String(body?.currency||'usd').toLowerCase());params.set('line_items[0][price_data][unit_amount]',String(Math.round(amount*100)));params.set('line_items[0][price_data][product_data][name]',String(body?.description||`Kelo Associates order ${orderId}`));params.set('metadata[workspace]',workspace);params.set('metadata[order_id]',orderId);if(body?.customerPhone)params.set('metadata[customer_phone]',String(body.customerPhone));
  const res=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/x-www-form-urlencoded'},body:params});const data=await res.json();if(res.ok){await supabase.from('kelo_orders').update({payment_provider_id:data.id,payment_url:data.url,status:'payment_link_created',updated_at:new Date().toISOString()}).eq('workspace',workspace).eq('id',orderId);await audit(workspace,'payment.link_created',{orderId,sessionId:data.id,url:data.url},'order',orderId)}return json(data,res.ok?200:res.status);
}

async function catalogRoute(req:Request,workspace:string,url:URL){
  if(req.method==='GET'){
    const vertical=String(url.searchParams.get('vertical')||'').trim(),sku=String(url.searchParams.get('sku')||'').trim();
    let query=supabase.from('kelo_catalog').select('id,workspace,vertical,sku,name,active,pricing,attributes,updated_at').eq('workspace',workspace).order('vertical').order('name');
    if(vertical)query=query.eq('vertical',vertical);if(sku)query=query.eq('sku',sku);
    const {data,error}=await query;if(error)throw error;return json({items:data||[],count:data?.length||0});
  }
  const body=await req.json();const vertical=String(body?.vertical||'').trim(),sku=String(body?.sku||'').trim(),name=String(body?.name||'').trim();
  if(!['watches','zara','moissanite'].includes(vertical)||!sku||!name)return json({error:'invalid_catalog_item'},400);
  const pricing=body?.pricing&&typeof body.pricing==='object'&&!Array.isArray(body.pricing)?body.pricing:{};
  const attributes=body?.attributes&&typeof body.attributes==='object'&&!Array.isArray(body.attributes)?body.attributes:{};
  const record={workspace,vertical,sku,name,active:body?.active!==false,pricing,attributes,updated_at:new Date().toISOString()};
  const {data,error}=await supabase.from('kelo_catalog').upsert(record,{onConflict:'workspace,vertical,sku'}).select().single();if(error)throw error;
  await audit(workspace,'catalog.upsert',{vertical,sku,name,active:record.active},'catalog',`${vertical}:${sku}`);return json(data);
}

async function inventoryRoute(req:Request,workspace:string,url:URL){
  if(req.method==='GET'){const vertical=url.searchParams.get('vertical')||'',sku=url.searchParams.get('sku')||'',variant_key=url.searchParams.get('variantKey')||'default';const {data,error}=await supabase.from('kelo_inventory').select('*').eq('workspace',workspace).eq('vertical',vertical).eq('sku',sku).eq('variant_key',variant_key).maybeSingle();if(error)throw error;return json(data||{quantity:null,status:'not_tracked'})}
  const body=await req.json(),quantity=Math.floor(Number(body?.quantity));if(!Number.isFinite(quantity)||quantity<0)return json({error:'invalid_quantity'},400);const vertical=String(body?.vertical||''),sku=String(body?.sku||''),variant_key=String(body?.variantKey||'default');if(!['watches','zara','moissanite'].includes(vertical)||!sku)return json({error:'invalid_inventory_key'},400);const record={workspace,vertical,sku,variant_key,quantity,updated_at:new Date().toISOString()};const {data,error}=await supabase.from('kelo_inventory').upsert(record,{onConflict:'workspace,vertical,sku,variant_key'}).select().single();if(error)throw error;await audit(workspace,'inventory.set',{vertical,sku,variant_key,quantity},'inventory',`${vertical}:${sku}:${variant_key}`);return json(data);
}
async function reserveInventory(workspace:string,body:any){const vertical=String(body?.vertical||''),sku=String(body?.sku||''),variantKey=String(body?.variantKey||'default'),quantity=Math.floor(Number(body?.quantity||0));if(!['watches','zara','moissanite'].includes(vertical)||!sku||quantity<=0)return json({error:'invalid_reservation'},400);const {data,error}=await supabase.rpc('kelo_reserve_inventory',{p_workspace:workspace,p_vertical:vertical,p_sku:sku,p_variant_key:variantKey,p_quantity:quantity});if(error)throw error;const result=Array.isArray(data)?data[0]:data;await audit(workspace,'inventory.reserve',{vertical,sku,variantKey,quantity,...(result||{})},'inventory',`${vertical}:${sku}:${variantKey}`);return json(result||{reserved:false,status:'unknown',remaining:null})}

async function health(){
  const {count,error}=await supabase.from('kelo_catalog').select('*',{count:'exact',head:true}).eq('workspace','default');
  return json({ok:!error,service:'kelo-api',database:{connected:!error,catalogItems:error?null:count},providers:{twilio:!!(env('TWILIO_ACCOUNT_SID')&&env('TWILIO_AUTH_TOKEN')),stripe:!!env('STRIPE_SECRET_KEY')},auth:{supabase:true,legacyAdminTokenConfigured:!!env('KELO_ADMIN_TOKEN')},time:new Date().toISOString()},error?503:200);
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});const url=new URL(req.url),path=url.pathname.replace(/^.*\/kelo-api/,'')||'/',workspace=workspaceOf(req);
  try{
    if(path==='/health')return await health();
    const auth=await authorize(req);if(!auth.ok)return json({error:'unauthorized',reason:auth.reason||'authentication_required'},401);
    if(path==='/auth/me'&&req.method==='GET')return json({ok:true,mode:auth.mode,role:auth.role||'operator',userId:auth.userId||null});
    if(path==='/state'&&req.method==='GET')return json(await getState(workspace));if(path==='/state'&&req.method==='PUT')return await putState(workspace,await req.json());if(path==='/catalog'&&['GET','PUT'].includes(req.method))return await catalogRoute(req,workspace,url);if(path==='/messages/send'&&req.method==='POST')return await sendTwilio(workspace,await req.json());if(path==='/payments/create'&&req.method==='POST')return await createPayment(workspace,await req.json());if(path==='/inventory/reserve'&&req.method==='POST')return await reserveInventory(workspace,await req.json());if(path==='/inventory'&&['GET','PUT'].includes(req.method))return await inventoryRoute(req,workspace,url);return json({error:'not_found',path},404)
  }catch(error){console.error(error);return json({error:'server_error',message:error instanceof Error?error.message:String(error)},500)}
});

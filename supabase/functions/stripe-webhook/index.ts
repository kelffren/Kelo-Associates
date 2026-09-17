import Stripe from 'npm:stripe@18.5.0';
import {createClient} from 'npm:@supabase/supabase-js@2';

const env=(n:string)=>Deno.env.get(n)||'';
function secretKey(){const modern=env('SUPABASE_SECRET_KEYS');if(modern){try{return JSON.parse(modern).default||''}catch{}}return env('SUPABASE_SERVICE_ROLE_KEY')}
const db=createClient(env('SUPABASE_URL'),secretKey(),{auth:{persistSession:false}});
const stripe=new Stripe(env('STRIPE_SECRET_KEY'));

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return new Response('method not allowed',{status:405});
  const signature=req.headers.get('stripe-signature');const webhookSecret=env('STRIPE_WEBHOOK_SECRET');
  if(!signature||!webhookSecret)return new Response('webhook not configured',{status:503});
  const raw=await req.text();let event:Stripe.Event;
  try{event=await stripe.webhooks.constructEventAsync(raw,signature,webhookSecret,undefined,Stripe.createSubtleCryptoProvider())}
  catch(error){console.error(error);return new Response('invalid signature',{status:400})}
  if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
    const session=event.data.object as Stripe.Checkout.Session;const workspace=session.metadata?.workspace||'default';const orderId=session.metadata?.order_id;
    if(orderId){
      await db.from('kelo_orders').update({status:'paid',payment_provider_id:session.id,payment_url:session.url||null,updated_at:new Date().toISOString()}).eq('workspace',workspace).eq('id',orderId);
      await db.from('kelo_audit').insert({workspace,event_type:'payment.completed',object_type:'order',object_id:orderId,payload:{sessionId:session.id,amountTotal:session.amount_total,currency:session.currency}});
    }
  }
  if(event.type==='checkout.session.expired'){
    const session=event.data.object as Stripe.Checkout.Session;const workspace=session.metadata?.workspace||'default';const orderId=session.metadata?.order_id;
    if(orderId)await db.from('kelo_orders').update({status:'payment_expired',updated_at:new Date().toISOString()}).eq('workspace',workspace).eq('id',orderId);
  }
  return new Response('ok',{status:200});
});

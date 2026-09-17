import {CURRENT_VERTICALS,ensureRetailState,searchRetailCatalog,quoteRetail,scoreRetailIntent,retailTemperature,setTrackedInventory,reserveRetailInventory,createRetailOrder,buildSalesPlaybook,getRetailMetrics} from './retail-engine.js';

const STORAGE='kelo-associates-v2';
const VOICE_SCHEMA=2;

const uid=(prefix='id')=>`${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
const clone=value=>JSON.parse(JSON.stringify(value));
const isoDay=(offset=0)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const isoAt=(day,time)=>new Date(`${day}T${time}:00`).toISOString();

function baseVoiceState(){
  return {
    schema:VOICE_SCHEMA,
    mode:'demo',
    provider:{telephony:'backend-required',realtime:'backend-required',sms:'backend-required',payments:'backend-required'},
    settings:{businessName:'Kelo Associates',defaultAgent:'agent_kelo',languages:['en','es'],humanTransferEnabled:true,autoBook:true,minimumHotScore:75,minimumRetailHotScore:65,currentVerticals:[...CURRENT_VERTICALS]},
    calls:[],actions:[],automationRuns:[]
  };
}

export function ensureVoiceState(state){
  if(!state||typeof state!=='object')throw new Error('Estado inválido');
  ensureRetailState(state);
  state.voice={...baseVoiceState(),...(state.voice||{})};
  state.voice.schema=VOICE_SCHEMA;
  state.voice.provider={...baseVoiceState().provider,...(state.voice.provider||{})};
  state.voice.settings={...baseVoiceState().settings,...(state.voice.settings||{}),currentVerticals:[...CURRENT_VERTICALS]};
  state.voice.calls=Array.isArray(state.voice.calls)?state.voice.calls:[];
  state.voice.actions=Array.isArray(state.voice.actions)?state.voice.actions:[];
  state.voice.automationRuns=Array.isArray(state.voice.automationRuns)?state.voice.automationRuns:[];
  state.clients=Array.isArray(state.clients)?state.clients:[];
  state.tasks=Array.isArray(state.tasks)?state.tasks:[];
  state.appointments=Array.isArray(state.appointments)?state.appointments:[];
  state.opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
  state.timeline=Array.isArray(state.timeline)?state.timeline:[];
  return state;
}

export function loadKeloState(){
  try{const raw=localStorage.getItem(STORAGE);if(!raw)return null;return ensureVoiceState(JSON.parse(raw))}catch{return null}
}

export function saveKeloState(state){
  ensureVoiceState(state);if(state.meta)state.meta.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE,JSON.stringify(state));return state;
}

export function normalizePhone(value=''){
  const text=String(value).trim();if(!text)return '';const plus=text.startsWith('+')?'+':'';return plus+text.replace(/\D/g,'');
}

export function scoreLead({homeowner,budget=0,timelineDays=999,zip='',projectType='',vertical=''}={}){
  let score=10;if(homeowner===true)score+=28;if(homeowner===false)score-=20;
  const b=Number(budget||0);if(b>=25000)score+=25;else if(b>=15000)score+=20;else if(b>=10000)score+=15;else if(b>=5000)score+=7;
  const t=Number(timelineDays||999);if(t<=14)score+=22;else if(t<=30)score+=18;else if(t<=90)score+=8;
  if(String(zip).trim())score+=5;if(String(projectType).trim())score+=5;if(['bathroom','kitchen','roofing'].includes(vertical))score+=5;
  return Math.max(0,Math.min(100,Math.round(score)));
}

export function leadTemperature(score){return score>=75?'hot':score>=45?'warm':'cold'}

function logAction(state,callId,type,label,payload={}){const action={id:uid('va'),callId,type,label,payload:clone(payload),createdAt:new Date().toISOString()};state.voice.actions.unshift(action);return action}
function timeline(state,clientId,type,text){state.timeline.unshift({id:uid('evt'),clientId,type,text,timestamp:new Date().toISOString()})}
function findClientByPhone(state,phone){const needle=normalizePhone(phone);return state.clients.find(c=>normalizePhone(c.phone)===needle)}

const ALLOWED_TOOLS=new Set(['get_or_create_customer','qualify_lead','qualify_retail_intent','get_calendar_availability','create_appointment','create_task','send_sms','transfer_to_human','search_catalog','set_inventory','quote_retail','reserve_inventory','create_order','create_payment_link']);

export class VoiceToolRouter{
  constructor(state){this.state=ensureVoiceState(state)}
  execute(name,args={},context={}){if(!ALLOWED_TOOLS.has(name)||typeof this[name]!=='function')throw new Error(`Tool no permitido: ${name}`);return this[name](args,context)}

  get_or_create_customer({name='Caller',phone,email='',source='Kelo Voice'}={},ctx={}){
    if(!phone)throw new Error('phone requerido');let client=findClientByPhone(this.state,phone);
    if(client){client.updatedAt=new Date().toISOString();if(name&&client.name==='Caller')client.name=name;logAction(this.state,ctx.callId,'tool','Cliente identificado',{clientId:client.id,phone:client.phone});return {created:false,client:clone(client)}}
    client={id:uid('c'),name:name||'Caller',phone,email,status:'warm',ownerId:'agent_unassigned',source,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),followupAt:null,interests:[],tags:['Kelo Voice']};
    this.state.clients.push(client);timeline(this.state,client.id,'voice_lead_created','Lead creado automáticamente desde Kelo Voice');logAction(this.state,ctx.callId,'tool','Cliente creado',{clientId:client.id,phone:client.phone});return {created:true,client:clone(client)};
  }

  qualify_retail_intent({clientId,vertical='watches',product='',quantity=1,readyToBuy=false,askedPrice=true,askedAvailability=true,fulfillment='',variantComplete=false}={},ctx={}){
    if(!CURRENT_VERTICALS.includes(vertical))throw new Error('Negocio no activo');const client=this.state.clients.find(c=>c.id===clientId);if(!client)throw new Error('Cliente no encontrado');
    const score=scoreRetailIntent({readyToBuy,askedPrice,askedAvailability,fulfillment,quantity,product,variantComplete});const temp=retailTemperature(score);client.status=temp;client.updatedAt=new Date().toISOString();client.tags=[...(client.tags||[]).filter(t=>!['HOT','WARM','COLD'].includes(t)),temp.toUpperCase(),'Kelo Voice',vertical];if(product&&!client.interests.includes(product))client.interests.push(product);
    client.retailQualification={vertical,product,quantity:Number(quantity||1),readyToBuy:!!readyToBuy,fulfillment,variantComplete:!!variantComplete,score,qualifiedAt:new Date().toISOString()};
    let opportunity=this.state.opportunities.find(o=>o.clientId===clientId&&o.stage!=='won'&&o.vertical===vertical);if(!opportunity){opportunity={id:uid('o'),clientId,vertical,estimatedValue:0,stage:temp==='hot'?'qualified':'new',source:'Kelo Voice',createdAt:new Date().toISOString()};this.state.opportunities.push(opportunity)}else if(temp==='hot')opportunity.stage='qualified';
    timeline(this.state,clientId,'retail_qualified',`Kelo Voice detectó intención ${score}/100 (${temp.toUpperCase()}) en ${vertical}`);logAction(this.state,ctx.callId,'tool','Intención de compra calificada',{clientId,vertical,score,temperature:temp});return {clientId,vertical,score,temperature:temp,qualified:score>=this.state.voice.settings.minimumRetailHotScore};
  }

  search_catalog({vertical='watches',query=''}={},ctx={}){const products=searchRetailCatalog(this.state,{vertical,query});logAction(this.state,ctx.callId,'tool','Catálogo consultado',{vertical,query,count:products.length});return products}

  set_inventory({vertical,sku,variantKey='default',quantity}={},ctx={}){const record=setTrackedInventory(this.state,{vertical,sku,variantKey,quantity});logAction(this.state,ctx.callId,'tool','Inventario confirmado',{vertical,sku,variantKey,quantity:record.quantity});return record}

  quote_retail(args={},ctx={}){const quote=quoteRetail(this.state,args);logAction(this.state,ctx.callId,'tool',quote.needsManualPrice?'Precio requiere revisión':'Cotización calculada',{quoteId:quote.id,vertical:quote.vertical,quantity:quote.quantity,unitPrice:quote.unitPrice,total:quote.subtotal,tier:quote.tier});return quote}

  reserve_inventory(args={},ctx={}){const result=reserveRetailInventory(this.state,args);logAction(this.state,ctx.callId,'tool',result.reserved?'Inventario reservado':'Stock requiere revisión',{...args,...result});return result}

  create_order(args={},ctx={}){const order=createRetailOrder(this.state,args);const opportunity=this.state.opportunities.find(o=>o.clientId===order.clientId&&o.stage!=='won'&&o.vertical===order.vertical);if(opportunity){opportunity.stage='order';opportunity.estimatedValue=order.total}timeline(this.state,order.clientId,'retail_order_created',`Pedido ${order.id} creado · $${order.total}`);logAction(this.state,ctx.callId,'tool','Pedido creado',{orderId:order.id,status:order.status,total:order.total});return order}

  create_payment_link({orderId,clientId,amount}={},ctx={}){if(!orderId||!clientId)throw new Error('orderId y clientId requeridos');logAction(this.state,ctx.callId,'external_stub','Link de pago preparado',{orderId,clientId,amount:Number(amount||0),status:'backend-required'});return {status:'backend-required',url:null,orderId,amount:Number(amount||0)}}

  qualify_lead({clientId,vertical='bathroom',homeowner=null,budget=0,timelineDays=999,zip='',projectType=''}={},ctx={}){
    const client=this.state.clients.find(c=>c.id===clientId);if(!client)throw new Error('Cliente no encontrado');const score=scoreLead({homeowner,budget,timelineDays,zip,projectType,vertical});const temp=leadTemperature(score);
    client.status=temp;client.updatedAt=new Date().toISOString();client.tags=[...(client.tags||[]).filter(t=>!['HOT','WARM','COLD'].includes(t)),temp.toUpperCase(),'Kelo Voice'];if(projectType&&!client.interests.includes(projectType))client.interests.push(projectType);
    client.voiceQualification={vertical,homeowner,budget:Number(budget||0),timelineDays:Number(timelineDays||999),zip,projectType,score,qualifiedAt:new Date().toISOString()};
    let opportunity=this.state.opportunities.find(o=>o.clientId===clientId&&o.stage!=='won');if(!opportunity){opportunity={id:uid('o'),clientId,vertical,estimatedValue:Number(budget||0),stage:temp==='hot'?'qualified':'new',source:'Kelo Voice',createdAt:new Date().toISOString()};this.state.opportunities.push(opportunity)}else{opportunity.vertical=vertical;opportunity.estimatedValue=Number(budget||opportunity.estimatedValue||0);opportunity.stage=temp==='hot'?'qualified':opportunity.stage}
    timeline(this.state,clientId,'voice_qualified',`Kelo Voice calificó el lead ${score}/100 (${temp.toUpperCase()})`);logAction(this.state,ctx.callId,'tool','Lead calificado',{clientId,score,temperature:temp});return {clientId,score,temperature:temp,qualified:score>=this.state.voice.settings.minimumHotScore};
  }

  get_calendar_availability({day=isoDay(1),durationMinutes=30,startHour=10,endHour=18}={},ctx={}){
    const occupied=new Set(this.state.appointments.filter(a=>String(a.dateTime||'').slice(0,10)===day&&a.status==='scheduled').map(a=>new Date(a.dateTime).toISOString().slice(11,16)));const slots=[];
    for(let h=Number(startHour);h<Number(endHour);h++)for(const m of [0,30]){if(durationMinutes>30&&m===30)continue;const time=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;if(!occupied.has(time))slots.push({day,time,dateTime:isoAt(day,time)})}
    const result=slots.slice(0,6);logAction(this.state,ctx.callId,'tool','Disponibilidad consultada',{day,count:result.length});return result;
  }

  create_appointment({clientId,vertical='watches',dateTime,location='Pickup',estimatedValue=0,notes='Agendada por Kelo Voice'}={},ctx={}){
    if(!clientId||!dateTime)throw new Error('clientId y dateTime requeridos');const client=this.state.clients.find(c=>c.id===clientId);if(!client)throw new Error('Cliente no encontrado');
    const appt={id:uid('a'),clientId,vertical,dateTime:new Date(dateTime).toISOString(),location,status:'scheduled',assignedAgentId:this.state.voice.settings.defaultAgent||'agent_kelo',notes,estimatedValue:Number(estimatedValue||0),items:[]};this.state.appointments.push(appt);
    const opportunity=this.state.opportunities.find(o=>o.clientId===clientId&&o.stage!=='won');if(opportunity)opportunity.stage='appointment';timeline(this.state,clientId,'appointment_created','Cita agendada automáticamente por Kelo Voice');logAction(this.state,ctx.callId,'tool','Cita creada',{appointmentId:appt.id,dateTime:appt.dateTime});return clone(appt);
  }

  create_task({clientId=null,title,dueAt,priority='medium',kind='voice_followup'}={},ctx={}){
    if(!title||!dueAt)throw new Error('title y dueAt requeridos');const task={id:uid('t'),clientId,appointmentId:null,title,dueAt:new Date(dueAt).toISOString(),status:'pending',priority,kind,createdAt:new Date().toISOString()};this.state.tasks.push(task);logAction(this.state,ctx.callId,'tool','Tarea creada',{taskId:task.id,title});return clone(task);
  }

  send_sms({clientId,phone,body}={},ctx={}){
    const client=clientId?this.state.clients.find(c=>c.id===clientId):findClientByPhone(this.state,phone);const target=client?.phone||phone;if(!target||!body)throw new Error('Destino y body requeridos');logAction(this.state,ctx.callId,'external_stub','SMS preparado',{clientId:client?.id||null,phone:target,body,status:'backend-required'});return {queued:false,status:'backend-required',phone:target,body};
  }

  transfer_to_human({clientId=null,reason='requested'}={},ctx={}){logAction(this.state,ctx.callId,'handoff','Transferencia humana solicitada',{clientId,reason});return {status:'requested',agentId:this.state.voice.settings.defaultAgent,reason}}
}

export function startVoiceCall(state,{name='Caller',phone,language='auto',vertical='watches',direction='inbound'}={}){
  ensureVoiceState(state);const call={id:uid('call'),status:'active',direction,name,phone:normalizePhone(phone),language,vertical,startedAt:new Date().toISOString(),endedAt:null,clientId:null,leadScore:null,summary:'',transcript:[]};state.voice.calls.unshift(call);logAction(state,call.id,'call','Llamada iniciada',{direction,phone:call.phone,vertical});return call;
}
export function appendTranscript(state,callId,role,text){const call=state.voice.calls.find(c=>c.id===callId);if(!call)throw new Error('Llamada no encontrada');call.transcript.push({role,text,timestamp:new Date().toISOString()});return call}
export function completeVoiceCall(state,callId,{clientId=null,leadScore=null,summary='',outcome='handled'}={}){const call=state.voice.calls.find(c=>c.id===callId);if(!call)throw new Error('Llamada no encontrada');call.status='completed';call.endedAt=new Date().toISOString();call.clientId=clientId||call.clientId;call.leadScore=leadScore??call.leadScore;call.summary=summary;call.outcome=outcome;logAction(state,callId,'call','Llamada completada',{outcome,clientId:call.clientId,leadScore:call.leadScore});return call}

export function runDemoRetailSale(state,input={}){
  ensureVoiceState(state);const vertical=CURRENT_VERTICALS.includes(input.vertical)?input.vertical:'watches';const call=startVoiceCall(state,{...input,vertical});const router=new VoiceToolRouter(state);const customer=router.execute('get_or_create_customer',{name:input.name||'Caller',phone:input.phone,source:'Kelo Voice Retail'},{callId:call.id});call.clientId=customer.client.id;
  const playbook=buildSalesPlaybook(vertical,input);appendTranscript(state,call.id,'assistant',input.language==='en'?`Thanks for calling Kelo Associates ${playbook.label}. What are you looking for today?`:`Gracias por llamar a Kelo Associates ${playbook.label}. ¿Qué estás buscando hoy?`);appendTranscript(state,call.id,'caller',`${input.product||playbook.label} · qty ${input.quantity||1} · ${input.fulfillment||'fulfillment pending'}`);
  const qualification=router.execute('qualify_retail_intent',{clientId:customer.client.id,vertical,product:input.product||playbook.label,quantity:input.quantity||1,readyToBuy:!!input.readyToBuy,askedPrice:true,askedAvailability:true,fulfillment:input.fulfillment||'',variantComplete:!!input.variantComplete},{callId:call.id});
  const products=router.execute('search_catalog',{vertical,query:input.product||''},{callId:call.id});const product=products[0]||router.execute('search_catalog',{vertical,query:''},{callId:call.id})[0];if(!product)throw new Error('No hay producto configurado');
  const variantKey=input.variantKey||[input.product||'default',input.withBox?'box':'no-box',input.size||'',input.color||'',input.stoneSize||'',input.metal||''].filter(Boolean).join('|');
  if(input.stockConfirmed)router.execute('set_inventory',{vertical,sku:product.sku,variantKey,quantity:Number(input.stockAvailable||0)},{callId:call.id});
  const quote=router.execute('quote_retail',{vertical,sku:product.sku,quantity:input.quantity||1,withBox:!!input.withBox,manualUnitPrice:input.manualUnitPrice,variantKey},{callId:call.id});
  let reservation=null,order=null,payment=null,outcome='followup';
  if(quote.needsManualPrice){router.execute('create_task',{clientId:customer.client.id,title:`Definir precio: ${playbook.label}`,dueAt:new Date(Date.now()+10*60*1000).toISOString(),priority:'high',kind:'manual_price'},{callId:call.id});outcome='manual_price_required'}
  else if(qualification.qualified){
    reservation=router.execute('reserve_inventory',{vertical,sku:product.sku,variantKey,quantity:input.quantity||1},{callId:call.id});order=router.execute('create_order',{clientId:customer.client.id,vertical,sku:product.sku,variantKey,quantity:quote.quantity,unitPrice:quote.unitPrice,total:quote.subtotal,fulfillment:input.fulfillment||'pickup',reservationStatus:reservation.status,notes:input.notes||''},{callId:call.id});
    if(reservation.reserved){payment=router.execute('create_payment_link',{orderId:order.id,clientId:customer.client.id,amount:order.total},{callId:call.id});router.execute('send_sms',{clientId:customer.client.id,body:`Kelo Associates: pedido ${order.id} por $${order.total}. El link de pago se enviará desde el backend seguro.`},{callId:call.id});outcome='order_created'}
    else{router.execute('create_task',{clientId:customer.client.id,title:`Confirmar stock para ${playbook.label}`,dueAt:new Date(Date.now()+10*60*1000).toISOString(),priority:'high',kind:'stock_check'},{callId:call.id});outcome=reservation.status}
  }else{router.execute('create_task',{clientId:customer.client.id,title:`Follow-up venta · ${playbook.label}`,dueAt:new Date(Date.now()+60*60*1000).toISOString(),priority:qualification.temperature==='warm'?'medium':'low',kind:'retail_followup'},{callId:call.id})}
  const summary=`${playbook.label} · ${qualification.temperature.toUpperCase()} ${qualification.score}/100 · ${quote.needsManualPrice?'precio pendiente':`$${quote.subtotal}`}${order?` · ${order.status}`:' · follow-up'}`;completeVoiceCall(state,call.id,{clientId:customer.client.id,leadScore:qualification.score,summary,outcome});state.voice.automationRuns.unshift({id:uid('run'),trigger:'voice.retail.completed',callId:call.id,vertical,result:outcome,createdAt:new Date().toISOString()});return {call:clone(call),customer,qualification,product,quote,reservation,order,payment,playbook,actions:state.voice.actions.filter(a=>a.callId===call.id)};
}

export function runDemoQualification(state,input={}){
  ensureVoiceState(state);const call=startVoiceCall(state,input);const router=new VoiceToolRouter(state);const customer=router.get_or_create_customer({name:input.name||'Caller',phone:input.phone,source:'Kelo Voice'},{callId:call.id});call.clientId=customer.client.id;
  appendTranscript(state,call.id,'assistant',input.language==='es'?'Gracias por llamar a Kelo Associates. ¿En qué proyecto te puedo ayudar?':'Thanks for calling Kelo Associates. How can I help with your project?');appendTranscript(state,call.id,'caller',`${input.projectType||input.vertical||'Project'} · budget ${input.budget||0} · timeline ${input.timelineDays||999} days`);
  const qualification=router.qualify_lead({clientId:customer.client.id,vertical:input.vertical,homeowner:input.homeowner,budget:input.budget,timelineDays:input.timelineDays,zip:input.zip,projectType:input.projectType},{callId:call.id});let appointment=null;
  if(qualification.qualified&&state.voice.settings.autoBook){const slots=router.get_calendar_availability({day:input.preferredDay||isoDay(1)},{callId:call.id});if(slots[0])appointment=router.create_appointment({clientId:customer.client.id,vertical:input.vertical,dateTime:slots[0].dateTime,location:input.location||'Virtual consultation',estimatedValue:input.budget,notes:'Auto-booked by Kelo Voice demo'},{callId:call.id});if(appointment)router.send_sms({clientId:customer.client.id,body:`Kelo Associates: your consultation is confirmed for ${new Date(appointment.dateTime).toLocaleString()}.`},{callId:call.id})}
  else{const due=new Date(Date.now()+60*60*1000).toISOString();router.create_task({clientId:customer.client.id,title:'Kelo Voice follow-up',dueAt:due,priority:qualification.temperature==='warm'?'medium':'low'},{callId:call.id})}
  const summary=`${qualification.temperature.toUpperCase()} · ${qualification.score}/100 · ${input.projectType||input.vertical||'Lead'}${appointment?' · cita creada':' · follow-up creado'}`;completeVoiceCall(state,call.id,{clientId:customer.client.id,leadScore:qualification.score,summary,outcome:appointment?'appointment_booked':'followup'});state.voice.automationRuns.unshift({id:uid('run'),trigger:'voice.call.completed',callId:call.id,result:appointment?'appointment_booked':'followup',createdAt:new Date().toISOString()});return {call:clone(call),customer,qualification,appointment,actions:state.voice.actions.filter(a=>a.callId===call.id)};
}

export function getVoiceMetrics(state){
  ensureVoiceState(state);const today=isoDay(0);const calls=state.voice.calls.filter(c=>String(c.startedAt||'').slice(0,10)===today);const completed=calls.filter(c=>c.status==='completed');const booked=completed.filter(c=>c.outcome==='appointment_booked');const orders=completed.filter(c=>c.outcome==='order_created');const handled=completed.filter(c=>c.outcome!=='human_transfer');const hot=completed.filter(c=>Number(c.leadScore||0)>=Math.min(state.voice.settings.minimumHotScore,state.voice.settings.minimumRetailHotScore));return {calls:calls.length,completed:completed.length,handled:handled.length,booked:booked.length,orders:orders.length,hot:hot.length,resolutionRate:completed.length?Math.round((handled.length/completed.length)*100):0,retail:getRetailMetrics(state)};
}

export {STORAGE,VOICE_SCHEMA,CURRENT_VERTICALS};

import {seedState} from './data.js';
import {ensureVoiceState,loadKeloState,saveKeloState,runDemoRetailSale,getVoiceMetrics,CURRENT_VERTICALS} from './voice-core.js';
import {getVerticalProfile,getCatalog,setTrackedInventory} from './retail-engine.js';
import {backendApi,getBackendStatus} from './backend-client.js';
import {bootRemoteSync,syncNow} from './remote-sync.js';

const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(v||0));
let state=ensureVoiceState(loadKeloState()||seedState());
let toastTimer;let liveHealth=null;let liveCatalogByVertical={};

function toast(text){const el=$('#voiceToast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400)}
function fmtTime(value){return new Date(value).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}
function fmtDate(value){return new Date(value).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
function providerLabel(value){return value==='connected'?'LIVE':value==='backend-required'?'BACKEND':'OFF'}
function finitePositive(value){const n=Number(value);return Number.isFinite(n)&&n>0?n:null}
function liveProduct(vertical){return liveCatalogByVertical[vertical]?.[0]||getCatalog(vertical)[0]||null}

function applyCentralCatalog(items=[]){
  liveCatalogByVertical={};
  for(const item of items){if(!item?.active||!CURRENT_VERTICALS.includes(item.vertical))continue;(liveCatalogByVertical[item.vertical]||=[]).push(item)}
  const watch=liveProduct('watches')?.pricing||{};const noBox=finitePositive(watch.base_price),withBox=finitePositive(watch.with_box_price);if(noBox)state.retail.settings.watchNoBoxPrice=noBox;if(withBox)state.retail.settings.watchWithBoxPrice=withBox;
  const zara=liveProduct('zara')?.pricing||{};if(Array.isArray(zara.tiers)){for(const tier of zara.tiers){const min=Number(tier?.min_qty),price=finitePositive(tier?.unit_price);if(!price)continue;if(min===1)state.retail.settings.zaraRetailPrice=price;if(min===28)state.retail.settings.zaraDeliveryTierUnitPrice=price;if(min===200)state.retail.settings.zaraWholesaleUnitPrice=price}}
  const moissanite=liveProduct('moissanite')?.pricing||{};const moissPrice=finitePositive(moissanite.unit_price);state.retail.settings.moissaniteDefaultUnitPrice=moissPrice;
}

async function refreshLiveHealth(){
  if(!getBackendStatus().ready){liveHealth=null;liveCatalogByVertical={};state.voice.mode='demo';return null}
  try{liveHealth=await backendApi.health();const catalog=await backendApi.getCatalog();applyCentralCatalog(catalog?.items||[]);state.voice.mode='live';state.voice.provider.sms=liveHealth?.providers?.twilio?'connected':'backend-required';state.voice.provider.payments=liveHealth?.providers?.stripe?'connected':'backend-required';saveKeloState(state);return liveHealth}catch{liveHealth=null;liveCatalogByVertical={};state.voice.mode='demo';return null}
}

function renderProviders(){
  const labels={telephony:'Telephony',realtime:'Realtime AI',sms:'SMS / WhatsApp',payments:'Payments'};
  $('#providerRow').innerHTML=Object.entries(state.voice.provider).map(([key,value])=>`<span class="provider-chip"><strong>${esc(labels[key]||key)}</strong> · ${esc(providerLabel(value))}</span>`).join('');
  $('#modePill').textContent=state.voice.mode==='live'&&liveHealth?.database?.connected?'LIVE DATA':'DEMO';
}
function renderBusinessFocus(){$('#businessFocus').innerHTML=CURRENT_VERTICALS.map(vertical=>{const p=getVerticalProfile(vertical);return `<article class="business-card"><div class="business-icon">${esc(p.icon)}</div><div><h4>${esc(p.label)}</h4><p>${esc(p.objective)}</p><small>${esc(p.questions.slice(0,2).join(' · '))}</small></div></article>`}).join('')}
function renderKpis(){const m=getVoiceMetrics(state),rows=[['Calls',m.calls],['HOT',m.hot],['Orders',m.orders],['Stock checks',m.retail.stockChecks],['Pipeline',money(m.retail.pipelineValue)]];$('#voiceKpis').innerHTML=rows.map(([label,value])=>`<div class="kpi"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join('')}
function renderCalls(){const rows=state.voice.calls.slice(0,12);$('#callList').innerHTML=rows.length?rows.map(call=>{const score=Number(call.leadScore||0),hot=score>=state.voice.settings.minimumRetailHotScore;return `<article class="call"><div class="call-icon">${call.direction==='outbound'?'↗':'↘'}</div><div><h4>${esc(call.name||call.phone||'Caller')}</h4><p>${esc(call.summary||call.vertical||'Retail call')} · ${fmtDate(call.startedAt)} ${fmtTime(call.startedAt)}</p></div><span class="call-score ${hot?'hot':''}">${call.leadScore==null?'—':score+'/100'}</span></article>`}).join(''):'<div class="empty">Todavía no hay conversaciones. Ejecuta una venta para probar el pipeline.</div>'}
function renderActions(){const icons={tool:'⌘',external_stub:'↗',external_live:'✓',call:'◉',handoff:'⇄'},rows=state.voice.actions.slice(0,22);$('#actionList').innerHTML=rows.length?rows.map(a=>`<article class="action"><div class="action-icon">${icons[a.type]||'•'}</div><div><h4>${esc(a.label)}</h4><p>${esc(a.type)} · ${fmtTime(a.createdAt)}</p></div><span class="safe-badge">${a.type==='external_stub'?'STUB':a.type==='external_live'?'LIVE':'OK'}</span></article>`).join(''):'<div class="empty">El Tool Bus está listo. Catálogo, precio, stock, pedido y pagos quedarán auditados aquí.</div>'}
function render(){renderProviders();renderBusinessFocus();renderKpis();renderCalls();renderActions()}

function setDefaultsForVertical(vertical){const form=$('#voiceDemoForm'),product=form.elements.product,qty=form.elements.quantity,stock=form.elements.stockAvailable,manual=form.elements.manualUnitPrice,box=form.elements.withBox;if(vertical==='watches'){product.value='Reloj';qty.value='1';stock.value='5';manual.value='';box.disabled=false}if(vertical==='zara'){product.value='Prenda Zara';qty.value='28';stock.value='100';manual.value='';box.checked=false;box.disabled=true}if(vertical==='moissanite'){product.value='Aretes de moissanita';qty.value='1';stock.value='10';manual.value='';box.checked=false;box.disabled=true}}
$('#voiceDemoForm').elements.vertical.addEventListener('change',event=>setDefaultsForVertical(event.target.value));

function logLiveAction(callId,label,payload={}){state.voice.actions.unshift({id:`va_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`,callId,type:'external_live',label,payload,createdAt:new Date().toISOString()})}
function checkoutUrls(){const base=`${location.origin}${location.pathname.replace(/voice\.html$/,'')}`;return {successUrl:`${base}index.html?payment=success`,cancelUrl:`${base}voice.html?payment=cancelled`}}
function patchOrder(result,patch){if(!result?.order)return;Object.assign(result.order,patch);const stored=state.retail.orders.find(o=>o.id===result.order.id);if(stored)Object.assign(stored,patch,{updatedAt:new Date().toISOString()})}

function centralInventorySelection(){const form=$('#centralInventoryForm'),vertical=form.elements.vertical.value,variantKey=String(form.elements.variantKey.value||'default').trim()||'default',product=liveProduct(vertical);$('#centralSku').value=product?.sku||'';return {vertical,variantKey,sku:product?.sku||'',quantity:Math.max(0,Math.floor(Number(form.elements.quantity.value||0)))}}
$('#centralInventoryForm').elements.vertical.addEventListener('change',centralInventorySelection);
$('#inventoryLookup').addEventListener('click',async()=>{
  const box=$('#inventoryResult');box.hidden=false;if(!getBackendStatus().ready){box.innerHTML='<strong>Backend no conectado</strong><p>Conéctalo desde Kelo Associates → Más → Central Backend.</p>';return}
  try{const key=centralInventorySelection(),record=await backendApi.getInventory(key);if(Number.isFinite(Number(record?.quantity))){$('#centralInventoryForm').elements.quantity.value=String(record.quantity);box.innerHTML=`<strong>${esc(key.sku)} · ${esc(key.variantKey)}</strong><p>Stock central: ${esc(record.quantity)}.</p>`}else box.innerHTML=`<strong>${esc(key.sku)} · ${esc(key.variantKey)}</strong><p>Esta variante todavía no está registrada en inventario central.</p>`}catch(error){box.innerHTML=`<strong>Error</strong><p>${esc(error?.message||'No se pudo consultar')}</p>`}
});
$('#centralInventoryForm').addEventListener('submit',async event=>{
  event.preventDefault();const box=$('#inventoryResult');box.hidden=false;if(!getBackendStatus().ready){box.innerHTML='<strong>Backend no conectado</strong><p>El stock real sólo se puede guardar en modo LIVE.</p>';return}
  try{const key=centralInventorySelection(),record=await backendApi.setInventory(key);setTrackedInventory(state,key);saveKeloState(state);await syncNow().catch(()=>{});box.innerHTML=`<strong>Stock guardado</strong><p>${esc(key.sku)} · ${esc(key.variantKey)} = ${esc(record.quantity)} unidades.</p>`;toast('Inventario central actualizado')}catch(error){box.innerHTML=`<strong>Error</strong><p>${esc(error?.message||'No se pudo guardar')}</p>`}
});
centralInventorySelection();

$('#voiceDemoForm').addEventListener('submit',async event=>{
  event.preventDefault();const fd=new FormData(event.currentTarget),manualRaw=String(fd.get('manualUnitPrice')||'').trim();
  const input={name:String(fd.get('name')||'Caller').trim(),phone:String(fd.get('phone')||'').trim(),vertical:String(fd.get('vertical')||'watches'),language:String(fd.get('language')||'auto'),product:String(fd.get('product')||'').trim(),variantKey:String(fd.get('variantKey')||'default').trim()||'default',quantity:Math.max(1,Number(fd.get('quantity')||1)),fulfillment:String(fd.get('fulfillment')||'pickup'),sendChannel:String(fd.get('sendChannel')||'sms'),manualUnitPrice:manualRaw===''?null:Number(manualRaw),stockAvailable:Math.max(0,Number(fd.get('stockAvailable')||0)),stockConfirmed:fd.get('stockConfirmed')==='on',readyToBuy:fd.get('readyToBuy')==='on',variantComplete:fd.get('variantComplete')==='on',withBox:fd.get('withBox')==='on',direction:'inbound'};
  if(!input.phone){toast('Necesito un teléfono');return}
  const live=state.voice.mode==='live'&&!!liveHealth?.database?.connected,product=liveProduct(input.vertical);
  try{
    if(live&&product){const central=await backendApi.getInventory({vertical:input.vertical,sku:product.sku,variantKey:input.variantKey});if(Number.isFinite(Number(central?.quantity))){input.stockAvailable=Number(central.quantity);input.stockConfirmed=true}else input.stockConfirmed=false}
    const result=runDemoRetailSale(state,input);let status='Follow-up creado.';
    if(result.quote.needsManualPrice)status='Precio pendiente: se creó una tarea para revisión humana.';else if(result.order?.status==='needs_stock_confirmation')status='Pedido pendiente de confirmar stock; se creó tarea prioritaria.';else if(result.order?.status==='pending_payment')status=`Pedido ${result.order.id} creado por ${money(result.order.total)}. Pago preparado.`;
    if(live&&result.order&&result.quote&&!result.quote.needsManualPrice){
      const reserved=await backendApi.reserveInventory({vertical:result.order.vertical,sku:result.order.sku,variantKey:result.order.variantKey,quantity:result.order.quantity});
      if(!reserved?.reserved){patchOrder(result,{status:'needs_stock_confirmation',reservationStatus:reserved?.status||'needs_stock_confirmation'});status=reserved?.status==='insufficient_stock'?`Stock central insuficiente${reserved.remaining!==null?` · quedan ${reserved.remaining}`:''}. No se generó cobro.`:'Stock central no confirmado. No se generó cobro.';if(Number.isFinite(Number(reserved?.remaining)))setTrackedInventory(state,{vertical:result.order.vertical,sku:result.order.sku,variantKey:result.order.variantKey,quantity:Number(reserved.remaining)})}
      else{
        patchOrder(result,{reservationStatus:'reserved'});if(Number.isFinite(Number(reserved.remaining)))setTrackedInventory(state,{vertical:result.order.vertical,sku:result.order.sku,variantKey:result.order.variantKey,quantity:Number(reserved.remaining)});logLiveAction(result.call.id,'Stock reservado en backend',{orderId:result.order.id,remaining:reserved.remaining});
        const payment=await backendApi.createPaymentLink({orderId:result.order.id,amount:result.order.total,description:`Kelo Associates · ${result.playbook.label}`,customerPhone:input.phone,...checkoutUrls()});patchOrder(result,{paymentUrl:payment?.url||null,paymentProviderId:payment?.id||null,status:payment?.url?'payment_link_created':'pending_payment'});logLiveAction(result.call.id,'Link de pago creado',{orderId:result.order.id,url:payment?.url||null});
        if(payment?.url&&input.sendChannel!=='none'){await backendApi.sendMessage({channel:input.sendChannel,to:input.phone,body:`Kelo Associates: tu pedido ${result.order.id} por ${money(result.order.total)} está listo. Paga aquí: ${payment.url}`});logLiveAction(result.call.id,`${input.sendChannel==='whatsapp'?'WhatsApp':'SMS'} enviado`,{orderId:result.order.id,to:input.phone});status=`LIVE · pedido ${result.order.id} · ${money(result.order.total)} · link de pago enviado por ${input.sendChannel==='whatsapp'?'WhatsApp':'SMS'}.`}else if(payment?.url)status=`LIVE · pedido ${result.order.id} · link de pago creado.`;
      }
    }else if(result.order?.status==='pending_payment'&&!live)status+=' Backend aún no autenticado: no se envió nada real.';
    saveKeloState(state);if(live)await syncNow().catch(()=>{});const box=$('#runResult');box.hidden=false;box.innerHTML=`<strong>${esc(result.playbook.label)} · ${result.qualification.temperature.toUpperCase()} · ${result.qualification.score}/100</strong><p>${esc(status)} ${result.actions.length} acciones internas auditadas.</p>`;await refreshLiveHealth();render();toast(live?'Pipeline LIVE ejecutado':'Pipeline demo ejecutado');
  }catch(error){saveKeloState(state);render();toast(error?.message||'No se pudo ejecutar')}
});

$('#refreshVoice').addEventListener('click',async()=>{state=ensureVoiceState(loadKeloState()||state);await refreshLiveHealth();render();toast('Actualizado')});
window.addEventListener('storage',()=>{state=ensureVoiceState(loadKeloState()||state);render()});
async function boot(){render();await bootRemoteSync();state=ensureVoiceState(loadKeloState()||state);await refreshLiveHealth();centralInventorySelection();render()}
boot();

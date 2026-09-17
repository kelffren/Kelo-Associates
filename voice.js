import {seedState} from './data.js';
import {ensureVoiceState,loadKeloState,saveKeloState,runDemoRetailSale,getVoiceMetrics,CURRENT_VERTICALS} from './voice-core.js';
import {getVerticalProfile} from './retail-engine.js';

const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(v||0));
let state=ensureVoiceState(loadKeloState()||seedState());
let toastTimer;

function toast(text){const el=$('#voiceToast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2000)}
function fmtTime(value){return new Date(value).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}
function fmtDate(value){return new Date(value).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
function providerLabel(value){return value==='connected'?'LIVE':value==='backend-required'?'BACKEND':'OFF'}

function renderProviders(){
  const labels={telephony:'Telephony',realtime:'Realtime AI',sms:'SMS',payments:'Payments'};
  $('#providerRow').innerHTML=Object.entries(state.voice.provider).map(([key,value])=>`<span class="provider-chip"><strong>${esc(labels[key]||key)}</strong> · ${esc(providerLabel(value))}</span>`).join('');
  $('#modePill').textContent=state.voice.mode==='live'?'LIVE':'DEMO';
}

function renderBusinessFocus(){
  $('#businessFocus').innerHTML=CURRENT_VERTICALS.map(vertical=>{const p=getVerticalProfile(vertical);return `<article class="business-card"><div class="business-icon">${esc(p.icon)}</div><div><h4>${esc(p.label)}</h4><p>${esc(p.objective)}</p><small>${esc(p.questions.slice(0,2).join(' · '))}</small></div></article>`}).join('');
}

function renderKpis(){
  const m=getVoiceMetrics(state);const rows=[['Calls',m.calls],['HOT',m.hot],['Orders',m.orders],['Stock checks',m.retail.stockChecks],['Pipeline',money(m.retail.pipelineValue)]];
  $('#voiceKpis').innerHTML=rows.map(([label,value])=>`<div class="kpi"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join('');
}

function renderCalls(){
  const rows=state.voice.calls.slice(0,12);
  $('#callList').innerHTML=rows.length?rows.map(call=>{const score=Number(call.leadScore||0);const hot=score>=state.voice.settings.minimumRetailHotScore;return `<article class="call"><div class="call-icon">${call.direction==='outbound'?'↗':'↘'}</div><div><h4>${esc(call.name||call.phone||'Caller')}</h4><p>${esc(call.summary||call.vertical||'Retail call')} · ${fmtDate(call.startedAt)} ${fmtTime(call.startedAt)}</p></div><span class="call-score ${hot?'hot':''}">${call.leadScore==null?'—':score+'/100'}</span></article>`}).join(''):'<div class="empty">Todavía no hay conversaciones. Ejecuta la simulación para probar el pipeline.</div>';
}

function renderActions(){
  const icons={tool:'⌘',external_stub:'↗',call:'◉',handoff:'⇄'};const rows=state.voice.actions.slice(0,22);
  $('#actionList').innerHTML=rows.length?rows.map(a=>`<article class="action"><div class="action-icon">${icons[a.type]||'•'}</div><div><h4>${esc(a.label)}</h4><p>${esc(a.type)} · ${fmtTime(a.createdAt)}</p></div><span class="safe-badge">${a.type==='external_stub'?'STUB':'OK'}</span></article>`).join(''):'<div class="empty">El Tool Bus está listo. Catálogo, precio, stock, pedido y pagos quedarán auditados aquí.</div>';
}

function render(){renderProviders();renderBusinessFocus();renderKpis();renderCalls();renderActions()}

function setDefaultsForVertical(vertical){
  const form=$('#voiceDemoForm');const product=form.elements.product;const qty=form.elements.quantity;const stock=form.elements.stockAvailable;const manual=form.elements.manualUnitPrice;const box=form.elements.withBox;
  if(vertical==='watches'){product.value='Reloj';qty.value='1';stock.value='5';manual.value='';box.disabled=false}
  if(vertical==='zara'){product.value='Prenda Zara';qty.value='28';stock.value='100';manual.value='';box.checked=false;box.disabled=true}
  if(vertical==='moissanite'){product.value='Aretes de moissanita';qty.value='1';stock.value='10';manual.value='';box.checked=false;box.disabled=true}
}

$('#voiceDemoForm').elements.vertical.addEventListener('change',event=>setDefaultsForVertical(event.target.value));

$('#voiceDemoForm').addEventListener('submit',event=>{
  event.preventDefault();const fd=new FormData(event.currentTarget);const manualRaw=String(fd.get('manualUnitPrice')||'').trim();
  const input={
    name:String(fd.get('name')||'Caller').trim(),phone:String(fd.get('phone')||'').trim(),vertical:String(fd.get('vertical')||'watches'),language:String(fd.get('language')||'auto'),product:String(fd.get('product')||'').trim(),variantKey:String(fd.get('variantKey')||'default').trim()||'default',quantity:Math.max(1,Number(fd.get('quantity')||1)),fulfillment:String(fd.get('fulfillment')||'pickup'),manualUnitPrice:manualRaw===''?null:Number(manualRaw),stockAvailable:Math.max(0,Number(fd.get('stockAvailable')||0)),stockConfirmed:fd.get('stockConfirmed')==='on',readyToBuy:fd.get('readyToBuy')==='on',variantComplete:fd.get('variantComplete')==='on',withBox:fd.get('withBox')==='on',direction:'inbound'
  };
  if(!input.phone){toast('Necesito un teléfono');return}
  try{
    const result=runDemoRetailSale(state,input);saveKeloState(state);const box=$('#runResult');box.hidden=false;
    let status='Follow-up creado.';
    if(result.quote.needsManualPrice)status='Precio pendiente: se creó una tarea para revisión humana.';
    else if(result.order?.status==='pending_payment')status=`Pedido ${result.order.id} creado por ${money(result.order.total)}. Pago/SMS preparados para backend.`;
    else if(result.order?.status==='needs_stock_confirmation')status='Pedido pendiente de confirmar stock; se creó tarea prioritaria.';
    box.innerHTML=`<strong>${esc(result.playbook.label)} · ${result.qualification.temperature.toUpperCase()} · ${result.qualification.score}/100</strong><p>${esc(status)} ${result.actions.length} acciones auditadas.</p>`;render();toast('Pipeline de venta ejecutado');
  }catch(error){toast(error?.message||'No se pudo ejecutar')}
});

$('#refreshVoice').addEventListener('click',()=>{state=ensureVoiceState(loadKeloState()||state);render();toast('Actualizado')});
window.addEventListener('storage',()=>{state=ensureVoiceState(loadKeloState()||state);render()});
render();

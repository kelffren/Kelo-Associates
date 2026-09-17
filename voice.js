import {seedState,isoDay} from './data.js';
import {ensureVoiceState,loadKeloState,saveKeloState,runDemoQualification,getVoiceMetrics} from './voice-core.js';

const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
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

function renderKpis(){
  const m=getVoiceMetrics(state);const rows=[['Calls',m.calls],['Handled',m.handled],['HOT',m.hot],['Booked',m.booked],['Resolution',`${m.resolutionRate}%`]];
  $('#voiceKpis').innerHTML=rows.map(([label,value])=>`<div class="kpi"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join('');
}

function renderCalls(){
  const rows=state.voice.calls.slice(0,12);
  $('#callList').innerHTML=rows.length?rows.map(call=>{const score=Number(call.leadScore||0);const hot=score>=state.voice.settings.minimumHotScore;return `<article class="call"><div class="call-icon">${call.direction==='outbound'?'↗':'↘'}</div><div><h4>${esc(call.name||call.phone||'Caller')}</h4><p>${esc(call.summary||call.vertical||'Voice call')} · ${fmtDate(call.startedAt)} ${fmtTime(call.startedAt)}</p></div><span class="call-score ${hot?'hot':''}">${call.leadScore==null?'—':score+'/100'}</span></article>`}).join(''):'<div class="empty">Todavía no hay llamadas. Ejecuta la simulación para probar el pipeline.</div>';
}

function renderActions(){
  const icons={tool:'⌘',external_stub:'↗',call:'◉',handoff:'⇄'};const rows=state.voice.actions.slice(0,18);
  $('#actionList').innerHTML=rows.length?rows.map(a=>`<article class="action"><div class="action-icon">${icons[a.type]||'•'}</div><div><h4>${esc(a.label)}</h4><p>${esc(a.type)} · ${fmtTime(a.createdAt)}</p></div><span class="safe-badge">${a.type==='external_stub'?'STUB':'OK'}</span></article>`).join(''):'<div class="empty">El Tool Bus está listo. Cada acción quedará aquí para auditoría.</div>';
}

function render(){renderProviders();renderKpis();renderCalls();renderActions()}

$('#voiceDemoForm').addEventListener('submit',event=>{
  event.preventDefault();const fd=new FormData(event.currentTarget);
  const input={name:String(fd.get('name')||'Caller').trim(),phone:String(fd.get('phone')||'').trim(),vertical:String(fd.get('vertical')||'bathroom'),language:String(fd.get('language')||'auto'),projectType:String(fd.get('projectType')||'').trim(),budget:Number(fd.get('budget')||0),timelineDays:Number(fd.get('timelineDays')||999),zip:String(fd.get('zip')||'').trim(),homeowner:fd.get('homeowner')==='on',preferredDay:isoDay(1),direction:'inbound'};
  if(!input.phone){toast('Necesito un teléfono');return}
  try{
    const result=runDemoQualification(state,input);saveKeloState(state);const box=$('#runResult');box.hidden=false;box.innerHTML=`<strong>${result.qualification.temperature.toUpperCase()} · ${result.qualification.score}/100</strong><p>${result.appointment?`Cita creada para ${new Date(result.appointment.dateTime).toLocaleString()}.`:'Lead guardado y follow-up automático creado.'} ${result.actions.length} acciones registradas.</p>`;render();toast('Pipeline ejecutado');
  }catch(error){toast(error?.message||'No se pudo ejecutar')}
});

$('#refreshVoice').addEventListener('click',()=>{state=ensureVoiceState(loadKeloState()||state);render();toast('Actualizado')});
window.addEventListener('storage',()=>{state=ensureVoiceState(loadKeloState()||state);render()});
render();

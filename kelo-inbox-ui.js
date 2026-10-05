import {buildAttentionQueue,notificationCandidates} from './kelo-intelligence.js';

const demoAccounts=[
{id:'fb1',name:'Facebook Principal',status:'connected',unread:12,hot:4,opportunity:73},
{id:'fb2',name:'Facebook 2',status:'connected',unread:7,hot:3,opportunity:66},
{id:'fb3',name:'Facebook 3',status:'connected',unread:4,hot:1,opportunity:42},
{id:'fb4',name:'Facebook 4',status:'connected',unread:9,hot:5,opportunity:81},
];

const demoSignals=[
{conversationId:'intel-1',clientId:'c1',channelId:'fb4',name:'Carlos Rivera',account:'Facebook 4',explicitBuyingIntent:true,priceOrAvailabilityQuestion:true,appointmentIntent:true,shippingIntent:false,priorCustomer:true,estimatedValue:285,unreadCount:2,lastInboundAt:new Date(Date.now()-28*60000).toISOString(),lastHumanReplyAt:null,aiLoopDetected:false,humanRequested:false,negativeSentiment:false},
{conversationId:'intel-2',clientId:'c2',channelId:'fb1',name:'Juan Pérez',account:'Facebook Principal',explicitBuyingIntent:false,priceOrAvailabilityQuestion:true,appointmentIntent:false,shippingIntent:true,priorCustomer:false,estimatedValue:200,unreadCount:1,lastInboundAt:new Date(Date.now()-64*60000).toISOString(),lastHumanReplyAt:null,aiLoopDetected:true,humanRequested:false,negativeSentiment:false},
{conversationId:'intel-3',clientId:'c3',channelId:'fb2',name:'Miguel Santos',account:'Facebook 2',explicitBuyingIntent:true,priceOrAvailabilityQuestion:true,appointmentIntent:false,shippingIntent:false,priorCustomer:false,estimatedValue:285,unreadCount:3,lastInboundAt:new Date(Date.now()-12*60000).toISOString(),lastHumanReplyAt:null,aiLoopDetected:false,humanRequested:true,negativeSentiment:false},
{conversationId:'intel-4',clientId:'c4',channelId:'fb3',name:'Luis M.',account:'Facebook 3',explicitBuyingIntent:false,priceOrAvailabilityQuestion:false,appointmentIntent:false,shippingIntent:false,priorCustomer:false,estimatedValue:0,unreadCount:1,lastInboundAt:new Date(Date.now()-95*60000).toISOString(),lastHumanReplyAt:null,aiLoopDetected:false,humanRequested:false,negativeSentiment:true}
];

const labelReason={
 customer_requested_human:'Pidió hablar con una persona',explicit_buying_intent:'Intención de compra',
 price_or_availability:'Preguntó precio/disponibilidad',appointment_intent:'Quiere coordinar',
 shipping_intent:'Interés en envío',prior_customer:'Cliente previo',unread:'Sin responder',
 ai_loop_detected:'IA atascada',negative_sentiment:'Posible fricción',estimated_value:'Valor estimado',
 stale_without_human_reply:'Esperando demasiado'
};
const actionLabel={human_takeover:'Tomar conversación',close_appointment:'Cerrar cita',close_sale:'Intentar cerrar',resolve_shipping_trust:'Resolver envío',review_ai_conversation:'Revisar IA',follow_up_now:'Follow-up ahora',review:'Revisar'};
let activeFilter='all';

function byId(id){return document.getElementById(id)}
function esc(v=''){return String(v).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]))}

function renderAccounts(){
 const host=byId('intelAccounts'); if(!host)return;
 host.innerHTML=demoAccounts.map(a=>`<button class="account-card ${activeFilter===a.id?'active':''}" data-intel-account="${a.id}">
 <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><h4>${esc(a.name)}</h4><span class="connection-pill">Conectada</span></div>
 <p>Fuente demo · reemplazable</p><div class="account-health"><span><b>${a.unread}</b> pendientes</span><span><b>${a.hot}</b> HOT</span><span><b>${a.opportunity}</b> score</span></div></button>`).join('');
}

function queue(){
 const q=buildAttentionQueue(demoSignals);
 return activeFilter==='all'?q:q.filter(x=>x.channelId===activeFilter);
}
function renderAttention(){
 const host=byId('intelAttentionList'); if(!host)return; const q=queue();
 host.innerHTML=q.length?q.map(item=>{const s=demoSignals.find(x=>x.conversationId===item.conversationId);return `<article class="attention-card">
 <div class="attention-top"><div><h4>${esc(s.name)}</h4><p>${esc(s.account)} · DEMO</p></div><div class="score-badges"><span class="score attn">Atención ${item.attentionScore}</span><span class="score money">Dinero ${item.moneyScore}</span>${item.reasons.includes('ai_loop_detected')?'<span class="score ai">IA atascada</span>':''}</div></div>
 <div class="reason-row">${item.reasons.slice(0,4).map(r=>`<span class="reason-chip">${esc(labelReason[r]||r)}</span>`).join('')}</div>
 <div class="next-action"><span>Prioridad ${item.priorityScore} · ${esc(actionLabel[item.recommendedAction]||'Revisar')}</span><button data-intel-open="${item.conversationId}">Ver conversación</button></div>
 </article>`}).join(''):'<div class="intel-empty">Nada crítico en esta cuenta.</div>';
 const all=buildAttentionQueue(demoSignals); const notices=notificationCandidates(all);
 byId('intelAttentionCount').textContent=all.filter(x=>x.attentionScore>=40).length;
 byId('intelMoneyCount').textContent=all.filter(x=>x.moneyScore>=35).length;
 byId('intelAiCount').textContent=all.filter(x=>x.reasons.includes('ai_loop_detected')).length;
 byId('intelPushCount').textContent=notices.length;
}

function renderConnections(){
 const host=byId('intelConnections'); if(!host)return;
 host.innerHTML=demoAccounts.map(a=>`<div class="connection-row"><div><h4>${esc(a.name)}</h4><p>Meta · estado visual demo · historial independiente</p></div><span class="connection-pill">ACTIVA</span></div>`).join('')+
 '<button class="secondary wide" id="intelConnectDemo" type="button">＋ Conectar otra cuenta</button>';
 byId('intelConnectDemo')?.addEventListener('click',()=>alert('UI lista. La conexión OAuth real se activará cuando conectemos el backend oficial.'));
}

function runAnalysis(){
 const btn=byId('intelAnalyzeNow'); const stamp=byId('intelLastRun'); if(!btn)return;
 btn.disabled=true; btn.textContent='Analizando…';
 setTimeout(()=>{renderAttention();stamp.textContent='Analizado ahora · datos demo';btn.disabled=false;btn.textContent='Analizar ahora';},420);
}

function init(){
 renderAccounts();renderAttention();renderConnections();
 document.addEventListener('click',e=>{
   const a=e.target.closest('[data-intel-account]'); if(a){activeFilter=a.dataset.intelAccount;renderAccounts();renderAttention();}
   const tab=e.target.closest('[data-intel-filter]'); if(tab){document.querySelectorAll('[data-intel-filter]').forEach(x=>x.classList.toggle('active',x===tab)); const type=tab.dataset.intelFilter; const cards=[...document.querySelectorAll('#intelAttentionList .attention-card')]; cards.forEach(card=>{const text=card.textContent;card.style.display=type==='all'||(type==='money'&&text.includes('Dinero'))||(type==='ai'&&text.includes('IA atascada'))||(type==='attention'&&text.includes('Atención'))?'grid':'none'})}
   const open=e.target.closest('[data-intel-open]'); if(open) alert('Demo visual: aquí abriremos el chat real conservando cuenta, cliente y contexto de IA.');
 });
 byId('intelAnalyzeNow')?.addEventListener('click',runAnalysis);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();

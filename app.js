import {seedState,isoDay,isoAt,uid} from './data.js';
import {integrations,requestNotifications} from './integrations.js';

const STORAGE='kelo-associates-v2';
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(v||0));
const localDay=d=>{d=new Date(d);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const fmtTime=d=>new Date(d).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
const fmtDate=d=>new Date(d).toLocaleDateString('es-US',{weekday:'short',month:'short',day:'numeric'});
const now=()=>new Date();
let toastTimer;

function load(){try{const raw=localStorage.getItem(STORAGE);if(!raw)return seedState();const parsed=JSON.parse(raw);if(!parsed?.meta||parsed.meta.version!==2)return seedState();return parsed}catch{return seedState()}}
let state=load();
function save(){state.meta.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE,JSON.stringify(state))}
function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200)}
function getClient(id){return state.clients.find(x=>x.id===id)}
function getAgent(id){return state.agents.find(x=>x.id===id)}
function getConversationByClient(clientId){return state.conversations.find(x=>x.clientId===clientId)}
function getChannel(id){return state.channels.find(x=>x.id===id)}
function addTimeline(clientId,type,text){state.timeline.unshift({id:uid('evt'),clientId,type,text,timestamp:new Date().toISOString()})}
function openSheet(id){$('#'+id).classList.add('open')}
function closeSheet(id){$('#'+id).classList.remove('open')}
function navigate(target){$$('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen===target));$$('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.target===target));window.scrollTo({top:0,behavior:'smooth'});if(target==='more')renderIntegrations()}

function renderChannels(){
  const all=[{id:'all',name:'Todos'},...state.channels];
  $('#channelSwitch').innerHTML=all.map(c=>`<button class="pill ${state.ui.channel===c.id?'active':''}" data-channel="${c.id}">${esc(c.name)}</button>`).join('');
}

function todaysAppointments(){return state.appointments.filter(a=>localDay(a.dateTime)===isoDay(0)&&!['cancelled','no_show'].includes(a.status)).sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime))}
function pendingTasks(){return state.tasks.filter(t=>t.status==='pending').sort((a,b)=>new Date(a.dueAt)-new Date(b.dueAt))}
function overdueFollowups(){return state.tasks.filter(t=>t.status==='pending'&&t.kind==='followup'&&new Date(t.dueAt)<=now()).sort((a,b)=>new Date(a.dueAt)-new Date(b.dueAt))}
function unreadTotal(){return state.conversations.reduce((n,c)=>n+Number(c.unread||0),0)}
function terminalAppointments(){return state.appointments.filter(a=>['sold','cancelled','no_show','followup'].includes(a.status))}

function renderToday(){
  const appts=todaysAppointments();const pending=pendingTasks();const follows=overdueFollowups();const revenue=state.sales.filter(s=>localDay(s.closedAt)===isoDay(0)).reduce((n,s)=>n+s.amount,0);
  $('#todayLabel').textContent=new Date().toLocaleDateString('es-US',{weekday:'long',month:'short',day:'numeric'});
  $('#todaySummary').textContent=`${appts.length} cita${appts.length===1?'':'s'} · ${unreadTotal()} mensaje${unreadTotal()===1?'':'s'} por revisar`;
  $('#todayKpis').innerHTML=[['Chats sin responder',unreadTotal()],['Citas hoy',appts.length],['Tareas pendientes',pending.length],['Vendido hoy',money(revenue)]].map(([l,v])=>`<div class="kpi"><strong>${esc(v)}</strong><span>${esc(l)}</span></div>`).join('');
  $('#todayAppointments').innerHTML=appts.length?appts.map(a=>appointmentRow(a,true)).join(''):'<div class="empty">No hay citas hoy.</div>';
  renderBag();
  const priority=pending.filter(t=>new Date(t.dueAt)<=new Date(Date.now()+4*3600000)).slice(0,6);
  $('#priorityList').innerHTML=priority.length?priority.map(taskRow).join(''):'<div class="empty">Nada crítico en las próximas horas.</div>';
  $('#followupList').innerHTML=follows.length?follows.slice(0,5).map(t=>{const c=getClient(t.clientId);return `<div class="taskrow"><div><h4>${esc(c?.name||'Cliente')}</h4><p>${esc(t.title)} · ${fmtTime(t.dueAt)}</p></div><button class="secondary" data-client-open="${esc(t.clientId)}">Abrir</button></div>`}).join(''):'<div class="empty">No hay follow-ups vencidos.</div>';
}

function appointmentRow(a,compact=false){
  const c=getClient(a.clientId);const ready=a.items?.length?a.items.every(i=>i.prepared):true;const statusLabel=a.status==='sold'?'VENDIDO':a.status==='scheduled'?(ready?'PREPARADO':'PREPARAR'):a.status.toUpperCase();
  const statusClass=a.status==='sold'?'sold':ready?'ready':a.status==='scheduled'?'pending':'cancelled';
  return `<div class="appointment"><div class="time">${fmtTime(a.dateTime)}</div><div><h4>${esc(c?.name||'Cliente')}</h4><p>${esc((a.items||[]).map(i=>`${i.qty>1?i.qty+'× ':''}${i.name}`).join(' · ')||'Sin artículos')}<br>${esc(a.location)}</p></div><button class="status ${statusClass}" data-appointment-open="${a.id}">${statusLabel}</button></div>`;
}

function renderBag(){
  const map=new Map();todaysAppointments().filter(a=>a.status==='scheduled').forEach(a=>(a.items||[]).forEach(i=>{const key=i.name.trim().toLowerCase();const cur=map.get(key)||{name:i.name,qty:0,prepared:true};cur.qty+=Number(i.qty||1);cur.prepared=cur.prepared&&!!i.prepared;map.set(key,cur)}));
  const items=[...map.values()];
  $('#bagList').innerHTML=items.length?items.map(i=>`<div class="checkrow"><input type="checkbox" data-bag-name="${encodeURIComponent(i.name)}" ${i.prepared?'checked':''}><label>${i.qty} × ${esc(i.name)}</label><small>${i.prepared?'Listo':'Pendiente'}</small></div>`).join(''):'<div class="empty">No necesitas preparar artículos hoy.</div>';
  const ready=items.filter(i=>i.prepared).length;$('#bagSummary').textContent=items.length?`${ready}/${items.length} tipos de artículo preparados. Antes de salir, confirma físicamente la bolsa.`:'Bolsa libre por ahora.';
}

function chatFilterMatches(conv){
  if(state.ui.chatFilter==='unread')return conv.unread>0;if(state.ui.chatFilter==='hot')return conv.leadTemp==='hot';if(state.ui.chatFilter==='followup'){const c=getClient(conv.clientId);return c?.followupAt&&new Date(c.followupAt)>=new Date(Date.now()-86400000)}return true;
}
function renderChats(){
  let rows=state.conversations.filter(c=>(state.ui.channel==='all'||c.channelId===state.ui.channel)&&chatFilterMatches(c)).sort((a,b)=>new Date(b.lastMessageAt)-new Date(a.lastMessageAt));
  $('#chatList').innerHTML=rows.length?rows.map(c=>{const cl=getClient(c.clientId);const ch=getChannel(c.channelId);return `<div class="chat" data-chat-open="${c.id}"><div class="avatar">${esc((cl?.name||'?').split(/\s+/).map(x=>x[0]).slice(0,2).join(''))}</div><div><h4>${esc(cl?.name||'Cliente')} <span class="tag ${c.leadTemp==='hot'?'green':c.leadTemp==='warm'?'orange':''}">${esc(c.leadTemp.toUpperCase())}</span></h4><p>${esc(c.lastMessage)}</p></div><div class="chatmeta"><small class="muted">${esc(ch?.name||'')}</small><br>${c.unread?`<span class="badge">${c.unread}</span>`:''}</div></div>`}).join(''):'<div class="empty">No hay chats con este filtro.</div>';
}

function renderClients(){
  const q=$('#clientSearch')?.value.trim().toLowerCase()||'';
  const rows=state.clients.filter(c=>!q||[c.name,c.phone,c.email,...(c.interests||[]),...(c.tags||[])].join(' ').toLowerCase().includes(q)).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
  $('#clientList').innerHTML=rows.length?rows.map(c=>{const sales=state.sales.filter(s=>s.clientId===c.id);const ltv=sales.reduce((n,s)=>n+s.amount,0);const owner=getAgent(c.ownerId);return `<div class="clientrow" data-client-open="${c.id}"><div class="avatar">${esc(c.name.split(/\s+/).map(x=>x[0]).slice(0,2).join(''))}</div><div><h4>${esc(c.name)}</h4><p>${esc((c.interests||[]).join(' · ')||'Sin interés definido')} · ${esc(owner?.name||'Sin asignar')}</p></div><div class="chatmeta"><strong class="money">${money(ltv)}</strong><br><span class="tag ${c.status==='hot'?'green':c.status==='warm'?'orange':''}">${esc(c.status.toUpperCase())}</span></div></div>`}).join(''):'<div class="empty">No encontré clientes.</div>';
}

function renderAgenda(){
  const today=isoDay(0);let rows=[...state.appointments];
  if(state.ui.agendaFilter==='today')rows=rows.filter(a=>localDay(a.dateTime)===today);
  else if(state.ui.agendaFilter==='past')rows=rows.filter(a=>new Date(a.dateTime)<new Date()||['sold','cancelled','no_show','followup'].includes(a.status));
  else rows=rows.filter(a=>new Date(a.dateTime)>=new Date()&&a.status==='scheduled');
  rows.sort((a,b)=>state.ui.agendaFilter==='past'?new Date(b.dateTime)-new Date(a.dateTime):new Date(a.dateTime)-new Date(b.dateTime));
  $('#agendaList').innerHTML=rows.length?rows.map(a=>appointmentRow(a)).join(''):'<div class="empty">No hay citas aquí.</div>';
}

function taskRow(t){const c=getClient(t.clientId);return `<div class="taskrow" style="grid-template-columns:1fr auto"><div><h4>${esc(t.title)}</h4><p>${esc(c?.name||'General')} · ${fmtDate(t.dueAt)} ${fmtTime(t.dueAt)} · ${esc(t.priority)}</p></div><button class="secondary" data-task-done="${t.id}">Hecho</button></div>`}
function renderReminders(){
  const labels={dayBefore:'1 día antes',morningSummary:'Resumen por la mañana',twoHours:'2 horas antes',thirtyMinutes:'30 minutos antes',postAppointment:'Registrar resultado después'};
  $('#reminderRules').innerHTML=Object.entries(labels).map(([k,l])=>`<div class="metricrow"><span>${esc(l)}</span><input class="toggle" type="checkbox" data-rule="${k}" ${state.reminderRules[k]?'checked':''}></div>`).join('');
  const rows=[...state.tasks].sort((a,b)=>a.status===b.status?new Date(a.dueAt)-new Date(b.dueAt):a.status==='pending'?-1:1);
  $('#reminderList').innerHTML=rows.length?rows.map(t=>`<div class="reminder"><div class="remicon">${t.status==='done'?'✓':t.priority==='high'?'!':'○'}</div><div><h4 style="${t.status==='done'?'text-decoration:line-through;opacity:.6':''}">${esc(t.title)}</h4><p>${esc(getClient(t.clientId)?.name||'General')} · ${fmtDate(t.dueAt)} ${fmtTime(t.dueAt)}</p></div>${t.status==='pending'?`<button class="secondary" data-task-done="${t.id}">Hecho</button>`:'<span class="tag green">LISTO</span>'}</div>`).join(''):'<div class="empty">Sin tareas.</div>';
}

function renderMetrics(){
  const terminal=terminalAppointments();const sold=state.sales.length;const closedValue=state.sales.reduce((n,s)=>n+s.amount,0);const closeRate=terminal.length?Math.round((sold/terminal.length)*100):0;const pendingF=state.tasks.filter(t=>t.status==='pending'&&t.kind==='followup').length;
  $('#metricKpis').innerHTML=[['Sin responder',unreadTotal()],['Ventas',sold],['Tasa cierre',`${closeRate}%`],['Valor vendido',money(closedValue)],['Follow-ups',pendingF],['Citas totales',state.appointments.length],['No-shows',state.appointments.filter(a=>a.status==='no_show').length],['Clientes',state.clients.length]].map(([l,v])=>`<div class="kpi"><strong>${esc(v)}</strong><span>${esc(l)}</span></div>`).join('');
  const channelData=state.channels.map(ch=>{const convs=state.conversations.filter(c=>c.channelId===ch.id);const clientIds=new Set(convs.map(c=>c.clientId));const sales=state.sales.filter(s=>s.channelId===ch.id||clientIds.has(s.clientId));return {name:ch.name,leads:clientIds.size,value:sales.reduce((n,s)=>n+s.amount,0),sales:sales.length}});const max=Math.max(1,...channelData.map(x=>x.value));
  $('#channelMetrics').innerHTML=channelData.map(x=>`<div class="metricrow"><div><strong>${esc(x.name)}</strong><p class="muted">${x.leads} clientes · ${x.sales} ventas</p><div class="bar"><i style="width:${Math.round((x.value/max)*100)}%"></i></div></div><strong>${money(x.value)}</strong></div>`).join('');
  const agentData=state.agents.filter(a=>a.id!=='agent_unassigned').map(a=>{const sales=state.sales.filter(s=>s.agentId===a.id);const assigned=state.clients.filter(c=>c.ownerId===a.id).length;return {name:a.name,assigned,value:sales.reduce((n,s)=>n+s.amount,0),sales:sales.length}});const amax=Math.max(1,...agentData.map(x=>x.value));
  $('#agentMetrics').innerHTML=agentData.map(x=>`<div class="metricrow"><div><strong>${esc(x.name)}</strong><p class="muted">${x.assigned} clientes · ${x.sales} ventas</p><div class="bar"><i style="width:${Math.round((x.value/amax)*100)}%"></i></div></div><strong>${money(x.value)}</strong></div>`).join('');
  const events=[...state.timeline].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).slice(0,12);$('#activityList').innerHTML=events.map(e=>`<div class="timeline"><span class="dot"></span><div><strong>${esc(getClient(e.clientId)?.name||'Sistema')}</strong><p class="muted">${esc(e.text)}</p></div><small class="muted">${fmtDate(e.timestamp)}</small></div>`).join('')||'<div class="empty">Sin actividad.</div>';
}

function renderIntegrations(){
  $('#integrationStatus').innerHTML=Object.entries(integrations).map(([key,x])=>`<div class="metricrow"><span>${esc(x.name)}</span><button class="${x.connected?'status ready':'secondary'}" ${key==='notifications'&&!x.connected?'data-enable-notifications':''}>${x.connected?'CONECTADO':key==='notifications'?'ACTIVAR':'BACKEND'}</button></div>`).join('');
}

function fillSelects(){
  const clients=state.clients.map(c=>`<option value="${c.id}">${esc(c.name)} — ${esc(c.phone)}</option>`).join('');$('#appointmentClient').innerHTML=clients;$('#taskClient').innerHTML='<option value="">General</option>'+clients;
  $('#appointmentAgent').innerHTML=state.agents.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('');
  $('#verticalSelect').value=state.meta.vertical||'watches';
}

function renderAll(){renderChannels();renderToday();renderChats();renderClients();renderAgenda();renderReminders();renderMetrics();renderIntegrations();fillSelects()}

function openChat(id){
  const conv=state.conversations.find(c=>c.id===id);if(!conv)return;conv.unread=0;save();const c=getClient(conv.clientId),ch=getChannel(conv.channelId);state.ui.openConversation=id;
  $('#chatTitle').textContent=c?.name||'Cliente';$('#chatSubtitle').textContent=`${ch?.name||''} · ${c?.phone||''}`;
  $('#chatActions').innerHTML=`<button class="secondary" data-client-open="${c.id}">Ver cliente</button><button class="secondary" data-schedule-client="${c.id}">Agendar</button><button class="secondary" data-followup-client="${c.id}">Follow-up</button>`;
  renderThread();openSheet('chatSheet');renderToday();renderChats();
}
function renderThread(){const convId=state.ui.openConversation;const msgs=state.messages.filter(m=>m.conversationId===convId).sort((a,b)=>new Date(a.sentAt)-new Date(b.sentAt));$('#chatThread').innerHTML=msgs.length?msgs.map(m=>`<div class="bubble ${m.direction}">${esc(m.body)}<div style="font-size:9px;opacity:.65;margin-top:3px">${fmtTime(m.sentAt)}${m.direction==='out'?' · '+esc(m.status):''}</div></div>`).join(''):'<div class="empty">Conversación vacía.</div>';$('#chatThread').scrollTop=$('#chatThread').scrollHeight}

function clientProfileHtml(c){
  const owner=getAgent(c.ownerId);const sales=state.sales.filter(s=>s.clientId===c.id).sort((a,b)=>new Date(b.closedAt)-new Date(a.closedAt));const opps=state.opportunities.filter(o=>o.clientId===c.id);const appts=state.appointments.filter(a=>a.clientId===c.id).sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime));const events=state.timeline.filter(e=>e.clientId===c.id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));const ltv=sales.reduce((n,s)=>n+s.amount,0);
  return `<div class="card flat"><div class="row" style="gap:12px"><div class="avatar">${esc(c.name.split(/\s+/).map(x=>x[0]).slice(0,2).join(''))}</div><div><h3>${esc(c.name)}</h3><p class="muted">${esc(c.phone)}${c.email?' · '+esc(c.email):''}</p></div></div><div class="kpis" style="margin-top:12px"><div class="kpi"><strong>${money(ltv)}</strong><span>Lifetime value</span></div><div class="kpi"><strong>${sales.length}</strong><span>Ventas</span></div></div></div>
  <div class="card flat" style="margin-top:10px"><div class="sectiontitle"><h3>Relación comercial</h3></div><div class="metricrow"><span>Estado</span><strong>${esc(c.status.toUpperCase())}</strong></div><div class="metricrow"><span>Fuente</span><strong>${esc(c.source||'—')}</strong></div><div class="metricrow"><span>Intereses</span><strong>${esc((c.interests||[]).join(', ')||'—')}</strong></div><div class="field" style="margin-top:10px"><label>Responsable</label><select id="profileAgentSelect" data-client="${c.id}">${state.agents.map(a=>`<option value="${a.id}" ${a.id===c.ownerId?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div><div class="actions" style="margin-top:10px"><button class="primary" data-schedule-client="${c.id}">Agendar cita</button><button class="secondary" data-followup-client="${c.id}">Crear follow-up</button></div></div>
  <div class="card flat" style="margin-top:10px"><div class="sectiontitle"><h3>Oportunidades</h3></div>${opps.length?opps.map(o=>`<div class="metricrow"><span>${esc(o.vertical)} · ${esc(o.stage)}</span><strong>${money(o.estimatedValue)}</strong></div>`).join(''):'<div class="empty">Sin oportunidades.</div>'}</div>
  <div class="card flat" style="margin-top:10px"><div class="sectiontitle"><h3>Citas</h3></div>${appts.length?appts.slice(0,5).map(a=>appointmentRow(a)).join(''):'<div class="empty">Sin citas.</div>'}</div>
  <div class="card flat" style="margin-top:10px"><div class="sectiontitle"><h3>Historial único</h3></div>${events.length?events.slice(0,8).map(e=>`<div class="timeline"><span class="dot"></span><div><strong>${esc(e.type.replaceAll('_',' '))}</strong><p class="muted">${esc(e.text)}</p></div><small class="muted">${fmtDate(e.timestamp)}</small></div>`).join(''):'<div class="empty">Sin historial.</div>'}</div>`;
}
function openClient(id){const c=getClient(id);if(!c)return;$('#clientContent').innerHTML=clientProfileHtml(c);openSheet('clientSheet')}

function prefillAppointment(clientId){fillSelects();if(clientId)$('#appointmentClient').value=clientId;const f=$('#appointmentForm');f.elements.date.value=isoDay(0);f.elements.time.value='17:30';const c=getClient(clientId);if(c?.ownerId)f.elements.agent.value=c.ownerId;openSheet('appointmentSheet')}

function createReminderTasksForAppointment(a){
  const base=new Date(a.dateTime);const defs=[];
  if(state.reminderRules.dayBefore){const d=new Date(base);d.setDate(d.getDate()-1);d.setHours(20,0,0,0);defs.push(['Preparar artículos para la cita',d,'high','appointment'])}
  if(state.reminderRules.morningSummary){const d=new Date(base);d.setHours(8,0,0,0);defs.push(['Revisar cita de hoy',d,'medium','appointment'])}
  if(state.reminderRules.twoHours){const d=new Date(base.getTime()-2*3600000);defs.push(['Confirmar cliente y artículos',d,'high','appointment'])}
  if(state.reminderRules.thirtyMinutes){const d=new Date(base.getTime()-30*60000);defs.push(['Salir / preparación final',d,'high','appointment'])}
  if(state.reminderRules.postAppointment){const d=new Date(base.getTime()+45*60000);defs.push(['Registrar resultado de la cita',d,'medium','result'])}
  defs.forEach(([title,d,priority,kind])=>state.tasks.push({id:uid('task'),clientId:a.clientId,appointmentId:a.id,title,dueAt:d.toISOString(),status:'pending',priority,kind,createdAt:new Date().toISOString()}));
}

function createFollowup(clientId,hours=24){const c=getClient(clientId);if(!c)return;const d=new Date(Date.now()+hours*3600000);c.followupAt=d.toISOString();state.tasks.push({id:uid('task'),clientId,title:`Follow-up con ${c.name}`,dueAt:d.toISOString(),status:'pending',priority:'high',kind:'followup',createdAt:new Date().toISOString()});addTimeline(clientId,'followup_created',`Follow-up programado para ${fmtDate(d)} ${fmtTime(d)}`);save();renderAll();toast('Follow-up creado')}

function openAppointment(id){const a=state.appointments.find(x=>x.id===id);if(!a)return;state.ui.resultAppointmentId=id;const c=getClient(a.clientId);$('#resultContext').innerHTML=`<strong>${esc(c?.name||'Cliente')}</strong><br>${fmtDate(a.dateTime)} · ${fmtTime(a.dateTime)}<br>${esc(a.location)}<br>${esc((a.items||[]).map(i=>i.name).join(' · '))}`;openSheet('resultSheet')}
function setAppointmentResult(result){
  const a=state.appointments.find(x=>x.id===state.ui.resultAppointmentId);if(!a)return;const c=getClient(a.clientId);a.status=result;a.completedAt=new Date().toISOString();
  state.tasks.filter(t=>t.appointmentId===a.id&&t.status==='pending').forEach(t=>t.status='done');
  if(result==='sold'){
    const conv=getConversationByClient(a.clientId);state.sales.push({id:uid('sale'),clientId:a.clientId,appointmentId:a.id,vertical:a.vertical,amount:Number(a.estimatedValue||0),commission:0,closedAt:new Date().toISOString(),channelId:conv?.channelId||null,agentId:a.assignedAgentId});const opp=state.opportunities.find(o=>o.clientId===a.clientId&&o.stage!=='won');if(opp)opp.stage='won';addTimeline(a.clientId,'sale',`Venta cerrada por ${money(a.estimatedValue)}`);
  }else if(result==='followup'){createFollowup(a.clientId,24);const opp=state.opportunities.find(o=>o.clientId===a.clientId&&o.stage!=='won');if(opp)opp.stage='followup';addTimeline(a.clientId,'appointment_result','Cita terminó en follow-up');
  }else addTimeline(a.clientId,'appointment_result',`Resultado: ${result.replace('_',' ')}`);
  if(c)c.updatedAt=new Date().toISOString();save();closeSheet('resultSheet');renderAll();toast(result==='sold'?'Venta registrada':'Resultado guardado')
}

function markTaskDone(id){const t=state.tasks.find(x=>x.id===id);if(!t)return;t.status='done';t.completedAt=new Date().toISOString();if(t.clientId)addTimeline(t.clientId,'task_done',`Tarea completada: ${t.title}`);save();renderAll();toast('Tarea completada')}

function createClient(form){const f=new FormData(form),id=uid('client');const c={id,name:String(f.get('name')).trim(),phone:String(f.get('phone')).trim(),email:String(f.get('email')||'').trim(),status:'warm',ownerId:'agent_unassigned',source:String(f.get('source')||'Manual'),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),followupAt:null,interests:[String(f.get('interest')||'').trim()].filter(Boolean),tags:[]};state.clients.push(c);const channel=String(f.get('channel')||'wa1');state.conversations.push({id:uid('conv'),clientId:id,channelId:channel,status:'open',unread:0,leadTemp:'warm',lastMessage:'Cliente creado manualmente',lastMessageAt:new Date().toISOString()});addTimeline(id,'client_created','Cliente creado manualmente');save();form.reset();closeSheet('newClientSheet');renderAll();openClient(id);toast('Cliente creado')}

function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`kelo-associates-backup-${isoDay(0)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Respaldo exportado')}
async function importData(file){try{const parsed=JSON.parse(await file.text());if(parsed?.meta?.version!==2||!Array.isArray(parsed.clients))throw new Error('Formato no válido');state=parsed;save();renderAll();toast('Respaldo importado')}catch(e){toast(`No se pudo importar: ${e.message}`)}}

function checkDueTasks(){const due=state.tasks.filter(t=>t.status==='pending'&&new Date(t.dueAt)<=now()&&!t.notifiedAt);if(!due.length)return;due.slice(0,3).forEach(t=>{t.notifiedAt=new Date().toISOString();if(integrations.notifications.connected&&'Notification'in window){try{new Notification('Kelo Associates',{body:t.title})}catch{}}});save()}

// Navegación y delegación
$$('.navbtn').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.target)));$$('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go)));
$('#channelSwitch').addEventListener('click',e=>{const b=e.target.closest('[data-channel]');if(!b)return;state.ui.channel=b.dataset.channel;save();renderChannels();renderChats()});
$('#chatList').addEventListener('click',e=>{const r=e.target.closest('[data-chat-open]');if(r)openChat(r.dataset.chatOpen)});
document.addEventListener('click',e=>{
  const c=e.target.closest('[data-client-open]');if(c){openClient(c.dataset.clientOpen);return}
  const a=e.target.closest('[data-appointment-open]');if(a){openAppointment(a.dataset.appointmentOpen);return}
  const t=e.target.closest('[data-task-done]');if(t){markTaskDone(t.dataset.taskDone);return}
  const s=e.target.closest('[data-schedule-client]');if(s){closeSheet('chatSheet');closeSheet('clientSheet');prefillAppointment(s.dataset.scheduleClient);return}
  const f=e.target.closest('[data-followup-client]');if(f){createFollowup(f.dataset.followupClient);return}
  const close=e.target.closest('[data-close]');if(close){closeSheet(close.dataset.close);return}
  const n=e.target.closest('[data-enable-notifications]');if(n){requestNotifications().then(()=>{renderIntegrations();toast(integrations.notifications.connected?'Notificaciones activadas':'Permiso no concedido')});return}
});
$$('.sheetback').forEach(x=>x.addEventListener('click',e=>{if(e.target===x)x.classList.remove('open')}));
$('#messageForm').addEventListener('submit',e=>{e.preventDefault();const input=e.currentTarget.elements.message;const body=input.value.trim();if(!body)return;const conv=state.conversations.find(c=>c.id===state.ui.openConversation);if(!conv)return;state.messages.push({id:uid('msg'),conversationId:conv.id,direction:'out',body,status:'mock-sent',sentAt:new Date().toISOString()});conv.lastMessage=body;conv.lastMessageAt=new Date().toISOString();conv.unread=0;const c=getClient(conv.clientId);if(c)c.updatedAt=new Date().toISOString();addTimeline(conv.clientId,'message_sent','Mensaje saliente registrado en demo');save();input.value='';renderThread();renderAll()});
$('#appointmentForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);const clientId=String(f.get('clientId'));const date=String(f.get('date')),time=String(f.get('time'));const items=String(f.get('items')||'').split(',').map(x=>x.trim()).filter(Boolean).map(name=>({name,qty:1,prepared:false}));const a={id:uid('appt'),clientId,vertical:state.meta.vertical||'watches',dateTime:isoAt(date,time),location:String(f.get('location')),status:'scheduled',assignedAgentId:String(f.get('agent')),notes:String(f.get('notes')||''),estimatedValue:Number(f.get('value')||0),items};state.appointments.push(a);createReminderTasksForAppointment(a);const existing=state.opportunities.find(o=>o.clientId===clientId&&o.stage!=='won');if(existing){existing.stage='appointment';existing.estimatedValue=Math.max(existing.estimatedValue,a.estimatedValue)}else state.opportunities.push({id:uid('opp'),clientId,vertical:a.vertical,estimatedValue:a.estimatedValue,stage:'appointment',source:getClient(clientId)?.source||'Manual',createdAt:new Date().toISOString()});addTimeline(clientId,'appointment_created',`Cita creada para ${fmtDate(a.dateTime)} ${fmtTime(a.dateTime)}`);save();e.currentTarget.reset();closeSheet('appointmentSheet');renderAll();navigate('today');toast('Cita + recordatorios creados')});
$('#taskForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),clientId=String(f.get('clientId')||'');state.tasks.push({id:uid('task'),clientId:clientId||null,appointmentId:null,title:String(f.get('title')),dueAt:isoAt(String(f.get('date')),String(f.get('time'))),status:'pending',priority:String(f.get('priority')),kind:'manual',createdAt:new Date().toISOString()});if(clientId)addTimeline(clientId,'task_created',`Tarea creada: ${f.get('title')}`);save();e.currentTarget.reset();closeSheet('taskSheet');renderAll();toast('Tarea creada')});
$('#clientForm').addEventListener('submit',e=>{e.preventDefault();createClient(e.currentTarget)});
$('#clientContent').addEventListener('change',e=>{if(e.target.id==='profileAgentSelect'){const c=getClient(e.target.dataset.client);if(!c)return;c.ownerId=e.target.value;state.assignments.push({id:uid('assign'),objectType:'client',objectId:c.id,agentId:c.ownerId,assignedAt:new Date().toISOString()});addTimeline(c.id,'assignment',`Asignado a ${getAgent(c.ownerId)?.name||'Sin asignar'}`);save();renderAll();toast('Responsable actualizado')}});
$('#bagList').addEventListener('change',e=>{const x=e.target.closest('[data-bag-name]');if(!x)return;const name=decodeURIComponent(x.dataset.bagName).toLowerCase();todaysAppointments().forEach(a=>(a.items||[]).forEach(i=>{if(i.name.trim().toLowerCase()===name)i.prepared=x.checked}));save();renderToday();renderAgenda();toast(x.checked?'Artículo preparado':'Artículo pendiente')});
$('#reminderRules').addEventListener('change',e=>{const x=e.target.closest('[data-rule]');if(!x)return;state.reminderRules[x.dataset.rule]=x.checked;save();toast('Regla actualizada')});
$('#agendaTabs').addEventListener('click',e=>{const b=e.target.closest('[data-agenda]');if(!b)return;state.ui.agendaFilter=b.dataset.agenda;$$('#agendaTabs button').forEach(x=>x.classList.toggle('active',x===b));save();renderAgenda()});
$$('[data-chat-filter]').forEach(b=>b.addEventListener('click',()=>{state.ui.chatFilter=b.dataset.chatFilter;$$('[data-chat-filter]').forEach(x=>x.classList.toggle('active',x===b));save();renderChats()}));
$$('[data-result]').forEach(b=>b.addEventListener('click',()=>setAppointmentResult(b.dataset.result)));
$('#clientSearch').addEventListener('input',renderClients);
$('#newClient').onclick=()=>openSheet('newClientSheet');$('#newTask').onclick=()=>{fillSelects();$('#taskForm').elements.date.value=isoDay(0);$('#taskForm').elements.time.value='14:00';openSheet('taskSheet')};$('#fab').onclick=()=>prefillAppointment();$('#newAppointmentTop').onclick=()=>prefillAppointment();$('#openQuick').onclick=()=>navigate('more');$('#refreshNow').onclick=()=>{renderAll();checkDueTasks();toast('Actualizado')};
$('#markAllRead').onclick=()=>{state.conversations.forEach(c=>c.unread=0);save();renderAll();toast('Chats revisados')};
$('#prepareAll').onclick=()=>{todaysAppointments().forEach(a=>(a.items||[]).forEach(i=>i.prepared=true));save();renderToday();renderAgenda();toast('Bolsa marcada como preparada')};
$('#clearCompleted').onclick=()=>{state.tasks=state.tasks.filter(t=>t.status!=='done');save();renderAll();toast('Tareas completadas limpiadas')};
$('#verticalSelect').addEventListener('change',e=>{state.meta.vertical=e.target.value;save();toast('Vertical activa cambiada')});
$('#exportData').onclick=exportData;$('#importData').onclick=()=>$('#importFile').click();$('#importFile').addEventListener('change',e=>{if(e.target.files[0])importData(e.target.files[0]);e.target.value='' });
$('#resetDemo').onclick=()=>{if(confirm('¿Restaurar los datos demo? Se reemplazarán los datos locales actuales.')){state=seedState();save();renderAll();toast('Demo restaurada')}};

renderAll();checkDueTasks();setInterval(checkDueTasks,60000);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});

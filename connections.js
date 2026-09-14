import {loadChannels,upsertChannel} from './channels.js';

const CORE_KEY='kelo-associates-v2';
const EVENTS_KEY='kelo-connection-events-v1';
const $=s=>document.querySelector(s);
let toastTimer;

function toast(text){const e=$('#operatorToast');e.textContent=text;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),2200)}
function now(){return new Date().toISOString()}
function uid(p){return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`}
function loadEvents(){try{return JSON.parse(localStorage.getItem(EVENTS_KEY)||'[]')}catch{return []}}
function saveEvents(rows){localStorage.setItem(EVENTS_KEY,JSON.stringify(rows.slice(0,50)))}
function addEvent(type,text){const rows=loadEvents();rows.unshift({id:uid('evt'),type,text,at:now()});saveEvents(rows);renderEvents()}
function renderEvents(){const rows=loadEvents();$('#eventLog').innerHTML=rows.length?rows.map(e=>`<div class="event"><div><strong>${e.type}</strong><br><small>${e.text}</small></div><small>${new Date(e.at).toLocaleString()}</small></div>`).join(''):'<p style="color:var(--muted)">No events yet.</p>'}

function loadCore(){try{return JSON.parse(localStorage.getItem(CORE_KEY)||'null')||{clients:[],conversations:[],messages:[],tasks:[],sales:[]}}catch{return {clients:[],conversations:[],messages:[],tasks:[],sales:[]}}}
function saveCore(core){localStorage.setItem(CORE_KEY,JSON.stringify(core))}

function current(){return loadChannels().find(c=>c.id==='WA_WATCHES_01')}
function fill(){const c=current();$('#phoneNumber').value=c?.phoneNumber||'';$('#phoneNumberId').value=c?.phoneNumberId||'';$('#wabaId').value=c?.whatsappBusinessAccountId||'';const metadataReady=Boolean(c?.phoneNumber&&c?.phoneNumberId&&c?.whatsappBusinessAccountId);$('#channelStatus').textContent=metadataReady?'METADATA READY':'NOT CONNECTED';$('#channelStatus').classList.toggle('ready',metadataReady);$('#webhookStatus').textContent=c?.webhookReady?'Verified':'Pending';$('#aiStatus').textContent=c?.aiEnabled===false?'Disabled':'Enabled'}

$('#saveMetadata').addEventListener('click',()=>{const phoneNumber=$('#phoneNumber').value.trim(),phoneNumberId=$('#phoneNumberId').value.trim(),waba=$('#wabaId').value.trim();upsertChannel({id:'WA_WATCHES_01',business:'watches',name:'Watches Main',type:'whatsapp',phoneNumber,phoneNumberId,whatsappBusinessAccountId:waba,status:phoneNumber&&phoneNumberId&&waba?'metadata_ready':'not_connected'});addEvent('METADATA_SAVED','WA_WATCHES_01 updated. No secrets stored in browser.');fill();toast('Metadata saved')});

$('#testIncoming').addEventListener('click',()=>{const core=loadCore();let client=core.clients.find(c=>c.phone==='+15550000001');if(!client){client={id:uid('client'),name:'Cliente prueba WhatsApp',phone:'+15550000001',interests:['Daytona negro'],source:'WA_WATCHES_01'};core.clients.push(client)}let conv=core.conversations.find(c=>c.clientId===client.id);if(!conv){conv={id:uid('conv'),clientId:client.id,channelId:'WA_WATCHES_01',leadTemp:'hot',unread:1,lastMessage:'¿Tienes Daytona negro?'};core.conversations.push(conv)}else{conv.lastMessage='¿Tienes Daytona negro?';conv.unread=(conv.unread||0)+1;conv.channelId='WA_WATCHES_01'}core.messages=core.messages||[];core.messages.push({id:uid('msg'),conversationId:conv.id,direction:'inbound',type:'text',text:'¿Tienes Daytona negro?',channelId:'WA_WATCHES_01',createdAt:now(),simulated:true});saveCore(core);upsertChannel({id:'WA_WATCHES_01',lastInboundAt:now()});addEvent('SIMULATED_INBOUND','Created test customer/conversation: “¿Tienes Daytona negro?”');toast('Incoming test injected into Kelo')});

$('#testOutgoing').addEventListener('click',()=>{const c=current();if(!c?.phoneNumberId){toast('Save channel metadata first');return}upsertChannel({id:'WA_WATCHES_01',lastOutboundAt:now()});addEvent('SIMULATED_OUTBOUND','Outbound path validated locally. Real send still requires backend token + Meta API.');toast('Outbound UI path OK · backend still required')});

$('#clearEvents').addEventListener('click',()=>{saveEvents([]);renderEvents();toast('Event log cleared')});

fill();renderEvents();

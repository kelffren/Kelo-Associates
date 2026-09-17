import {backendApi,configureBackend,disconnectBackend,getBackendConfig,getBackendStatus} from './backend-client.js';
import {bootRemoteSync,getSyncStatus,syncNow} from './remote-sync.js';

const backendStatus=getBackendStatus();
export const integrations={
  backend:{name:'Central Backend',connected:backendStatus.ready,mode:'secure-api'},
  whatsapp:{name:'WhatsApp Business',connected:false,mode:'backend-required'},
  meta:{name:'Meta / Facebook Ads',connected:false,mode:'backend-required'},
  sms:{name:'SMS',connected:false,mode:'backend-required'},
  email:{name:'Email',connected:false,mode:'backend-required'},
  voice:{name:'Kelo Voice Retail · AI Sales',connected:false,mode:'backend-required'},
  payments:{name:'Payments',connected:false,mode:'backend-required'},
  notifications:{name:'Web Notifications',connected:typeof window!=='undefined'&&'Notification' in window&&Notification.permission==='granted',mode:'browser'}
};

export async function requestNotifications(){
  if(!('Notification' in window)) return {ok:false,reason:'unsupported'};
  const permission=await Notification.requestPermission();integrations.notifications.connected=permission==='granted';return {ok:permission==='granted',permission};
}

export function notifyLocal(title,body){
  if('Notification'in window&&Notification.permission==='granted'){try{new Notification(title,{body,icon:'icon.svg'});return true}catch{return false}}return false;
}

export async function sendExternal({channel='sms',to,body,mediaUrl=null}={}){
  if(!getBackendStatus().ready)throw new Error('Conecta Central Backend antes de enviar mensajes reales.');
  return backendApi.sendMessage({channel,to,body,mediaUrl});
}

async function refreshBackendCapabilities(){
  const status=getBackendStatus();integrations.backend.connected=status.ready;
  if(!status.ready){integrations.sms.connected=false;integrations.whatsapp.connected=false;integrations.payments.connected=false;return null}
  try{const health=await backendApi.health();integrations.sms.connected=!!health?.providers?.twilio;integrations.whatsapp.connected=!!health?.providers?.twilio;integrations.payments.connected=!!health?.providers?.stripe;return health}catch{return null}
}

function focusCurrentBusinesses(){
  const select=document.querySelector('#verticalSelect');
  if(select){const previous=select.value;select.innerHTML='<option value="watches">Relojes</option><option value="zara">Ropa Zara</option><option value="moissanite">Aretes de moissanita</option>';select.value=['watches','zara','moissanite'].includes(previous)?previous:'watches'}
  const card=select?.closest('.card');if(card){const heading=card.querySelector('h3');if(heading)heading.textContent='Negocio activo';const notice=card.querySelector('.notice');if(notice)notice.textContent='Foco actual: relojes, ropa Zara y aretes de moissanita. Cada negocio comparte clientes, pedidos, tareas, mensajes y métricas, pero usa su propio playbook de venta.'}
}

function installKeloVoiceEntry(){
  const more=document.querySelector('[data-screen="more"] .grid.two');if(!more||document.querySelector('#keloVoiceEntry'))return;
  const card=document.createElement('div');card.id='keloVoiceEntry';card.className='card stack';card.innerHTML=`<div class="sectiontitle"><h3>Kelo Voice Retail</h3><span class="tag orange">V3</span></div><p class="muted">Sales Engine para relojes, Zara y moissanita: intención → catálogo → precio → stock → pedido → pago/SMS.</p><button class="secondary wide" id="openKeloVoice" type="button">Abrir Sales Engine</button>`;
  const operations=more.querySelector('.card.stack');if(operations?.nextSibling)more.insertBefore(card,operations.nextSibling);else more.prepend(card);card.querySelector('#openKeloVoice').addEventListener('click',()=>{location.href='voice.html'});
}

function syncStatusText(){const s=getSyncStatus();if(s.state==='synced')return `● Sincronizado${s.revision?` · r${s.revision}`:''}`;if(s.state==='syncing')return '◌ Sincronizando…';if(s.state==='error')return `! ${s.message}`;return '○ Modo local'}

function installBackendCard(){
  const more=document.querySelector('[data-screen="more"] .grid.two');if(!more||document.querySelector('#backendCard'))return;
  const cfg=getBackendConfig();const card=document.createElement('div');card.id='backendCard';card.className='card stack';
  card.innerHTML=`<div class="sectiontitle"><h3>Central Backend</h3><span class="tag ${getBackendStatus().ready?'green':'orange'}" id="backendBadge">${getBackendStatus().ready?'CONNECTED':'SETUP'}</span></div><p class="muted">Sincroniza CRM, inventario y pedidos entre dispositivos. El token se guarda sólo durante esta sesión.</p><div class="field"><label>API endpoint</label><input id="backendEndpoint" inputmode="url" autocomplete="off" placeholder="https://.../functions/v1/kelo-api" value="${String(cfg.endpoint||'').replace(/"/g,'&quot;')}"></div><div class="field"><label>Workspace</label><input id="backendWorkspace" autocomplete="off" value="${String(cfg.workspace||'default').replace(/"/g,'&quot;')}"></div><div class="field"><label>Admin token</label><input id="backendToken" type="password" autocomplete="off" placeholder="Session-only token"></div><div class="notice" id="backendSyncState">${syncStatusText()}</div><button class="primary wide" id="backendConnect" type="button">Conectar y sincronizar</button><button class="secondary wide" id="backendSyncNow" type="button">Sincronizar ahora</button><button class="ghost wide" id="backendDisconnect" type="button">Desconectar backend</button>`;
  more.prepend(card);
  const renderStatus=()=>{const connected=getBackendStatus().ready;card.querySelector('#backendBadge').textContent=connected?'CONNECTED':'SETUP';card.querySelector('#backendBadge').className=`tag ${connected?'green':'orange'}`;card.querySelector('#backendSyncState').textContent=syncStatusText()};
  document.addEventListener('kelo:sync-status',renderStatus);
  card.querySelector('#backendConnect').addEventListener('click',async()=>{try{configureBackend({endpoint:card.querySelector('#backendEndpoint').value,workspace:card.querySelector('#backendWorkspace').value,token:card.querySelector('#backendToken').value});await refreshBackendCapabilities();await bootRemoteSync();renderStatus();location.reload()}catch(error){card.querySelector('#backendSyncState').textContent=`! ${error?.message||'No se pudo conectar'}`}});
  card.querySelector('#backendSyncNow').addEventListener('click',async()=>{try{await syncNow();await refreshBackendCapabilities();renderStatus()}catch(error){card.querySelector('#backendSyncState').textContent=`! ${error?.message||'Falló sync'}`}});
  card.querySelector('#backendDisconnect').addEventListener('click',()=>{disconnectBackend();integrations.backend.connected=false;renderStatus()});
}

async function bootRetailFocus(){focusCurrentBusinesses();installKeloVoiceEntry();installBackendCard();await refreshBackendCapabilities();await bootRemoteSync()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootRetailFocus);else bootRetailFocus();

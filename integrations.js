import {backendApi,configureBackend,disconnectBackend,getBackendConfig,getBackendStatus} from './backend-client.js';
import {signInSecure,signOutSecure,signUpSecure,secureAuthStatus} from './supabase-auth.js';
import {bootRemoteSync,getSyncStatus,syncNow} from './remote-sync.js';

let backendVerified=false;
const backendStatus=getBackendStatus();
export const integrations={
  backend:{name:'Central Backend',connected:false,mode:'secure-api'},
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
  if(!backendVerified)throw new Error('Inicia sesión en Central Backend antes de enviar mensajes reales.');
  return backendApi.sendMessage({channel,to,body,mediaUrl});
}

async function refreshBackendCapabilities(){
  const status=getBackendStatus();backendVerified=false;integrations.backend.connected=false;
  if(!status.ready){integrations.sms.connected=false;integrations.whatsapp.connected=false;integrations.payments.connected=false;return null}
  try{
    const [identity,health]=await Promise.all([backendApi.me(),backendApi.health()]);
    backendVerified=!!identity?.ok;integrations.backend.connected=backendVerified;
    integrations.sms.connected=backendVerified&&!!health?.providers?.twilio;integrations.whatsapp.connected=backendVerified&&!!health?.providers?.twilio;integrations.payments.connected=backendVerified&&!!health?.providers?.stripe;
    return {identity,health};
  }catch{integrations.sms.connected=false;integrations.whatsapp.connected=false;integrations.payments.connected=false;return null}
}

function focusCurrentBusinesses(){
  const select=document.querySelector('#verticalSelect');
  if(select){const previous=select.value;select.innerHTML='<option value="watches">Relojes</option><option value="zara">Ropa Zara</option><option value="moissanite">Aretes de moissanita</option>';select.value=['watches','zara','moissanite'].includes(previous)?previous:'watches'}
  const card=select?.closest('.card');if(card){const heading=card.querySelector('h3');if(heading)heading.textContent='Negocio activo';const notice=card.querySelector('.notice');if(notice)notice.textContent='Foco actual: relojes, ropa Zara y aretes de moissanita. Cada negocio comparte clientes, pedidos, tareas, mensajes y métricas, pero usa su propio playbook de venta.'}
}

function installKeloVoiceEntry(){
  const more=document.querySelector('[data-screen="more"] .grid.two');if(!more||document.querySelector('#keloVoiceEntry'))return;
  const card=document.createElement('div');card.id='keloVoiceEntry';card.className='card stack';card.innerHTML=`<div class="sectiontitle"><h3>Kelo Voice Retail</h3><span class="tag orange">V4</span></div><p class="muted">Sales Engine para relojes, Zara y moissanita: catálogo central → precio → stock → pedido → pago/SMS.</p><button class="secondary wide" id="openKeloVoice" type="button">Abrir Sales Engine</button>`;
  const operations=more.querySelector('.card.stack');if(operations?.nextSibling)more.insertBefore(card,operations.nextSibling);else more.prepend(card);card.querySelector('#openKeloVoice').addEventListener('click',()=>{location.href='voice.html'});
}

function syncStatusText(){const s=getSyncStatus();if(s.state==='synced')return `● Sincronizado${s.revision?` · r${s.revision}`:''}`;if(s.state==='syncing')return '◌ Sincronizando…';if(s.state==='error')return `! ${s.message}`;return '○ Modo local'}
function backendBadge(){const auth=secureAuthStatus();if(backendVerified)return {text:'APPROVED',tone:'green'};if(auth.signedIn)return {text:'WAITING APPROVAL',tone:'orange'};return {text:'SETUP',tone:'orange'}}

function installBackendCard(){
  const more=document.querySelector('[data-screen="more"] .grid.two');if(!more||document.querySelector('#backendCard'))return;
  const cfg=getBackendConfig(),auth=secureAuthStatus();const card=document.createElement('div');card.id='backendCard';card.className='card stack';
  card.innerHTML=`<div class="sectiontitle"><h3>Central Backend</h3><span class="tag orange" id="backendBadge">SETUP</span></div><p class="muted">Cuenta segura de Supabase. Registrarte no da acceso por sí solo: el usuario debe estar aprobado en la lista privada de administradores.</p><div class="field"><label>Email seguro</label><input id="backendEmail" type="email" inputmode="email" autocapitalize="none" autocomplete="username" value="${String(auth.email||'').replace(/"/g,'&quot;')}" placeholder="tu@email.com"></div><div class="field"><label>Contraseña</label><input id="backendPassword" type="password" autocomplete="current-password" placeholder="Contraseña de tu cuenta segura"></div><div class="field"><label>Workspace</label><input id="backendWorkspace" autocomplete="off" value="${String(cfg.workspace||'default').replace(/"/g,'&quot;')}"></div><details><summary>Configuración avanzada</summary><div class="field"><label>API endpoint</label><input id="backendEndpoint" inputmode="url" autocomplete="off" value="${String(cfg.endpoint||'').replace(/"/g,'&quot;')}"></div></details><div class="notice" id="backendSyncState">${syncStatusText()}</div><button class="primary wide" id="backendSignIn" type="button">Entrar y sincronizar</button><button class="secondary wide" id="backendSignUp" type="button">Crear cuenta segura</button><button class="secondary wide" id="backendSyncNow" type="button">Sincronizar ahora</button><button class="ghost wide" id="backendDisconnect" type="button">Cerrar sesión segura</button>`;
  more.prepend(card);
  const statusBox=card.querySelector('#backendSyncState');
  const saveConfig=()=>configureBackend({endpoint:card.querySelector('#backendEndpoint').value,workspace:card.querySelector('#backendWorkspace').value});
  const renderStatus=()=>{const badge=backendBadge();card.querySelector('#backendBadge').textContent=badge.text;card.querySelector('#backendBadge').className=`tag ${badge.tone}`;if(!statusBox.dataset.message)statusBox.textContent=syncStatusText()};
  const message=text=>{statusBox.dataset.message='1';statusBox.textContent=text;setTimeout(()=>{delete statusBox.dataset.message;renderStatus()},6000)};
  document.addEventListener('kelo:sync-status',renderStatus);
  card.querySelector('#backendSignIn').addEventListener('click',async()=>{try{saveConfig();await signInSecure(card.querySelector('#backendEmail').value,card.querySelector('#backendPassword').value);card.querySelector('#backendPassword').value='';const result=await refreshBackendCapabilities();if(!result?.identity?.ok){message('Cuenta autenticada, pero todavía no está aprobada como admin.');renderStatus();return}await bootRemoteSync();await syncNow();renderStatus();message('Backend aprobado y sincronizado.')}catch(error){const waiting=error?.data?.reason==='not_approved'||error?.message==='unauthorized';message(waiting?'Cuenta válida, pendiente de aprobación como admin.':`No se pudo entrar: ${error?.message||'error de autenticación'}`);renderStatus()}});
  card.querySelector('#backendSignUp').addEventListener('click',async()=>{try{saveConfig();const result=await signUpSecure(card.querySelector('#backendEmail').value,card.querySelector('#backendPassword').value);card.querySelector('#backendPassword').value='';renderStatus();message(result.confirmationRequired?'Cuenta creada. Confirma el correo y luego pulsa Entrar. Falta aprobación admin.':'Cuenta creada y sesión iniciada. Falta aprobación admin.')}catch(error){message(`No se pudo crear la cuenta: ${error?.message||'error'}`)}});
  card.querySelector('#backendSyncNow').addEventListener('click',async()=>{try{const result=await refreshBackendCapabilities();if(!result?.identity?.ok)throw new Error('Cuenta no aprobada');await syncNow();renderStatus();message('Sincronización completada.')}catch(error){message(`No se pudo sincronizar: ${error?.message||'error'}`)}});
  card.querySelector('#backendDisconnect').addEventListener('click',async()=>{await signOutSecure();disconnectBackend();backendVerified=false;integrations.backend.connected=false;renderStatus();message('Sesión segura cerrada. La app local sigue disponible.')});
  renderStatus();
}

async function bootRetailFocus(){focusCurrentBusinesses();installKeloVoiceEntry();installBackendCard();await refreshBackendCapabilities();if(backendVerified)await bootRemoteSync();const card=document.querySelector('#backendCard');if(card){const badge=backendBadge();card.querySelector('#backendBadge').textContent=badge.text;card.querySelector('#backendBadge').className=`tag ${badge.tone}`}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootRetailFocus);else bootRetailFocus();

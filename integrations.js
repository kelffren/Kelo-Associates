export const integrations={
  whatsapp:{name:'WhatsApp Business',connected:false,mode:'backend-required'},
  meta:{name:'Meta / Facebook Ads',connected:false,mode:'backend-required'},
  sms:{name:'SMS',connected:false,mode:'backend-required'},
  email:{name:'Email',connected:false,mode:'backend-required'},
  voice:{name:'Kelo Voice · Telephony + Realtime AI',connected:false,mode:'backend-required'},
  payments:{name:'Payments',connected:false,mode:'backend-required'},
  notifications:{name:'Web Notifications',connected:'Notification' in window&&Notification.permission==='granted',mode:'browser'}
};

export async function requestNotifications(){
  if(!('Notification' in window)) return {ok:false,reason:'unsupported'};
  const permission=await Notification.requestPermission();
  integrations.notifications.connected=permission==='granted';
  return {ok:permission==='granted',permission};
}

export function notifyLocal(title,body){
  if('Notification'in window&&Notification.permission==='granted'){
    try{new Notification(title,{body,icon:'icon.svg'});return true}catch(_){return false}
  }
  return false;
}

export async function sendExternal(){
  throw new Error('Integración externa no configurada. Conecta el backend seguro antes de enviar mensajes reales.');
}

function installKeloVoiceEntry(){
  const more=document.querySelector('[data-screen="more"] .grid.two');
  if(!more||document.querySelector('#keloVoiceEntry'))return;
  const card=document.createElement('div');
  card.id='keloVoiceEntry';
  card.className='card stack';
  card.innerHTML=`<div class="sectiontitle"><h3>Kelo Voice</h3><span class="tag orange">V1</span></div><p class="muted">Agente telefónico: lead scoring, citas, Tool Bus y auditoría. Las llamadas reales requieren backend.</p><button class="secondary wide" id="openKeloVoice" type="button">Abrir Kelo Voice</button>`;
  const operations=more.querySelector('.card.stack');
  if(operations?.nextSibling)more.insertBefore(card,operations.nextSibling);else more.prepend(card);
  card.querySelector('#openKeloVoice').addEventListener('click',()=>{location.href='voice.html'});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installKeloVoiceEntry);else installKeloVoiceEntry();

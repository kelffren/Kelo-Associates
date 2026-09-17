export const integrations={
  whatsapp:{name:'WhatsApp Business',connected:false,mode:'backend-required'},
  meta:{name:'Meta / Facebook Ads',connected:false,mode:'backend-required'},
  sms:{name:'SMS',connected:false,mode:'backend-required'},
  email:{name:'Email',connected:false,mode:'backend-required'},
  voice:{name:'Kelo Voice Retail · AI Sales',connected:false,mode:'backend-required'},
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

function focusCurrentBusinesses(){
  const select=document.querySelector('#verticalSelect');
  if(select){
    const previous=select.value;
    select.innerHTML='<option value="watches">Relojes</option><option value="zara">Ropa Zara</option><option value="moissanite">Aretes de moissanita</option>';
    select.value=['watches','zara','moissanite'].includes(previous)?previous:'watches';
  }
  const card=select?.closest('.card');
  if(card){const heading=card.querySelector('h3');if(heading)heading.textContent='Negocio activo';const notice=card.querySelector('.notice');if(notice)notice.textContent='Foco actual: relojes, ropa Zara y aretes de moissanita. Cada negocio comparte clientes, pedidos, tareas, mensajes y métricas, pero usa su propio playbook de venta.'}
}

function installKeloVoiceEntry(){
  const more=document.querySelector('[data-screen="more"] .grid.two');
  if(!more||document.querySelector('#keloVoiceEntry'))return;
  const card=document.createElement('div');
  card.id='keloVoiceEntry';
  card.className='card stack';
  card.innerHTML=`<div class="sectiontitle"><h3>Kelo Voice Retail</h3><span class="tag orange">V2</span></div><p class="muted">Sales Engine para relojes, Zara y moissanita: intención → catálogo → precio → stock → pedido → pago/SMS.</p><button class="secondary wide" id="openKeloVoice" type="button">Abrir Sales Engine</button>`;
  const operations=more.querySelector('.card.stack');
  if(operations?.nextSibling)more.insertBefore(card,operations.nextSibling);else more.prepend(card);
  card.querySelector('#openKeloVoice').addEventListener('click',()=>{location.href='voice.html'});
}

function bootRetailFocus(){focusCurrentBusinesses();installKeloVoiceEntry()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootRetailFocus);else bootRetailFocus();

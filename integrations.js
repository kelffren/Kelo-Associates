export const integrations={
  whatsapp:{name:'WhatsApp Business',connected:false,mode:'backend-required'},
  meta:{name:'Meta / Facebook Ads',connected:false,mode:'backend-required'},
  sms:{name:'SMS',connected:false,mode:'backend-required'},
  email:{name:'Email',connected:false,mode:'backend-required'},
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

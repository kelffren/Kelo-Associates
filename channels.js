export const CHANNELS_KEY='kelo-channels-v1';

export const DEFAULT_CHANNELS=[{
  id:'WA_WATCHES_01',
  business:'watches',
  name:'Watches Main',
  type:'whatsapp',
  status:'not_connected',
  phoneNumber:'',
  phoneNumberId:'',
  whatsappBusinessAccountId:'',
  aiEnabled:true,
  humanTakeover:false,
  webhookReady:false,
  lastInboundAt:null,
  lastOutboundAt:null
}];

export function loadChannels(){
  try{
    const saved=JSON.parse(localStorage.getItem(CHANNELS_KEY)||'null');
    return Array.isArray(saved)&&saved.length?saved:structuredClone(DEFAULT_CHANNELS);
  }catch{return structuredClone(DEFAULT_CHANNELS)}
}

export function saveChannels(channels){localStorage.setItem(CHANNELS_KEY,JSON.stringify(channels))}
export function getChannel(id){return loadChannels().find(c=>c.id===id)}
export function upsertChannel(channel){const rows=loadChannels();const i=rows.findIndex(c=>c.id===channel.id);if(i>=0)rows[i]={...rows[i],...channel};else rows.push(channel);saveChannels(rows);return channel}

export function resolveBusinessFromChannel(channelId){
  return getChannel(channelId)?.business||'general';
}

// IMPORTANT: tokens/secrets are intentionally absent from this browser registry.
// They belong only in the future backend environment/secrets store.

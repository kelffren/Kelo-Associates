/**
 * Kelo Inbox domain core.
 * Provider accounts are replaceable connectors; Kelo clients/history are durable.
 * No tokens or provider secrets belong in this module.
 */

export const CONNECTION_STATUS = Object.freeze({
  CONNECTED:'connected', DEGRADED:'degraded', DISCONNECTED:'disconnected',
  REVOKED:'revoked', NEEDS_REAUTH:'needs_reauth'
});

export const CHANNEL_TYPES = Object.freeze([
  'facebook_page','instagram_business','whatsapp_number','messenger',
  'email','web_form','marketplace_reference','other'
]);

export function createConnection({id,provider,displayName,externalOwnerId=null,capabilities=[],status='disconnected',metadata={}}){
  if(!id||!provider||!displayName) throw new Error('connection id, provider and displayName are required');
  return {id,provider,displayName,externalOwnerId,status,capabilities:[...new Set(capabilities)],metadata,connectedAt:null,lastSyncAt:null};
}

export function createChannel({id,connectionId,provider,type,displayName,externalChannelId=null,business='general',capabilities=[],status='active'}){
  if(!id||!connectionId||!provider||!type||!displayName) throw new Error('invalid channel');
  if(!CHANNEL_TYPES.includes(type)) throw new Error('unsupported channel type');
  return {id,connectionId,provider,type,displayName,externalChannelId,business,status,capabilities:[...new Set(capabilities)],archivedAt:null};
}

export function archiveConnection(state,connectionId,at=new Date().toISOString()){
  const connection=state.connections?.find(x=>x.id===connectionId);
  if(!connection) throw new Error('connection not found');
  connection.status=CONNECTION_STATUS.DISCONNECTED;
  connection.disconnectedAt=at;
  (state.channels||[]).filter(x=>x.connectionId===connectionId).forEach(ch=>{ch.status='archived';ch.archivedAt=at;});
  // Deliberately preserve clients, conversations, messages, appointments and sales.
  return state;
}

export function canChannel(channel,capability){
  return Boolean(channel?.capabilities?.includes(capability) && channel.status==='active');
}

export function externalIdentityKey(identity){
  if(!identity?.provider||!identity?.externalUserId) return null;
  return `${identity.provider}:${identity.externalUserId}:${identity.channelId||'*'}`;
}

export function findIdentityMatches(clients,incoming){
  const phone=incoming.normalizedPhone||null;
  const email=(incoming.email||'').trim().toLowerCase()||null;
  const externalKey=externalIdentityKey(incoming);
  return (clients||[]).map(client=>{
    let score=0; const reasons=[];
    if(phone && (client.phones||[]).includes(phone)){score+=100;reasons.push('verified_phone');}
    if(email && (client.emails||[]).map(x=>x.toLowerCase()).includes(email)){score+=100;reasons.push('verified_email');}
    if(externalKey && (client.externalIdentities||[]).some(x=>externalIdentityKey(x)===externalKey)){score+=120;reasons.push('external_identity');}
    if(incoming.name && client.name && incoming.name.trim().toLowerCase()===client.name.trim().toLowerCase()){score+=10;reasons.push('same_name_weak');}
    return {clientId:client.id,score,reasons};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
}

export function suggestIdentityResolution(clients,incoming){
  const matches=findIdentityMatches(clients,incoming);
  const best=matches[0]||null;
  return {
    action: best?.score>=100?'link':'review',
    best,
    matches,
    // Never auto-merge from weak signals such as name/avatar alone.
    autoLinkAllowed:Boolean(best?.score>=100)
  };
}

export function mergeClients(state,{canonicalClientId,duplicateClientId,actor='operator',reason='confirmed_duplicate',at=new Date().toISOString()}){
  if(canonicalClientId===duplicateClientId) throw new Error('clients must differ');
  const canonical=state.clients.find(x=>x.id===canonicalClientId);
  const duplicate=state.clients.find(x=>x.id===duplicateClientId);
  if(!canonical||!duplicate) throw new Error('client not found');
  const uniq=(arr,key=x=>JSON.stringify(x))=>[...new Map(arr.map(x=>[key(x),x])).values()];
  canonical.phones=uniq([...(canonical.phones||[]),...(duplicate.phones||[])]);
  canonical.emails=uniq([...(canonical.emails||[]),...(duplicate.emails||[])],x=>x.toLowerCase());
  canonical.externalIdentities=uniq([...(canonical.externalIdentities||[]),...(duplicate.externalIdentities||[])],externalIdentityKey);
  (state.conversations||[]).filter(x=>x.clientId===duplicateClientId).forEach(x=>x.clientId=canonicalClientId);
  ['appointments','opportunities','sales','tasks'].forEach(k=>(state[k]||[]).filter(x=>x.clientId===duplicateClientId).forEach(x=>x.clientId=canonicalClientId));
  state.clients=state.clients.filter(x=>x.id!==duplicateClientId);
  state.auditEvents=state.auditEvents||[];
  state.auditEvents.push({type:'CLIENT_MERGED',at,actor,reason,canonicalClientId,duplicateClientId});
  return canonical;
}

export function normalizeConversation({id,channelId,externalThreadId=null,clientId=null,status='open',lastMessageAt=null,unreadCount=0}){
  if(!id||!channelId) throw new Error('conversation id and channelId are required');
  return {id,channelId,externalThreadId,clientId,status,lastMessageAt,unreadCount};
}

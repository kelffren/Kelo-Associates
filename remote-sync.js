import {backendApi,getBackendStatus} from './backend-client.js';

const STORAGE='kelo-associates-v2';
const REVISION_KEY='kelo-backend-revision-v1';
const BACKUP_KEY='kelo-local-backup-before-remote-v1';
let pushTimer=null;
let bypass=false;
let installed=false;
let lastStatus={state:'idle',message:'Local only'};

const hasLocal=()=>typeof localStorage!=='undefined';
const timeOf=x=>new Date(x?.updatedAt||x?.timestamp||x?.createdAt||0).getTime()||0;
const clone=x=>JSON.parse(JSON.stringify(x));

function mergeArray(local=[],remote=[]){
  const hasIds=[...local,...remote].some(x=>x&&typeof x==='object'&&'id'in x);
  if(!hasIds)return clone(local.length?local:remote);
  const map=new Map();
  for(const item of remote)if(item?.id)map.set(item.id,clone(item));
  for(const item of local){if(!item?.id)continue;const prev=map.get(item.id);if(!prev||timeOf(item)>=timeOf(prev))map.set(item.id,clone(item))}
  return [...map.values()];
}

function mergeInventory(local={},remote={}){
  const out={...clone(remote)};
  for(const [key,item] of Object.entries(local||{})){const prev=out[key];if(!prev||timeOf(item)>=timeOf(prev))out[key]=clone(item)}
  return out;
}

export function mergeStates(local={},remote={}){
  const out={...clone(remote),...clone(local)};
  const arrayKeys=new Set([...Object.keys(remote||{}),...Object.keys(local||{})].filter(k=>Array.isArray(remote?.[k])||Array.isArray(local?.[k])));
  for(const key of arrayKeys)out[key]=mergeArray(local?.[key]||[],remote?.[key]||[]);
  out.meta={...(remote.meta||{}),...(local.meta||{}),updatedAt:new Date(Math.max(timeOf(remote.meta),timeOf(local.meta),Date.now())).toISOString()};
  if(local.retail||remote.retail){
    out.retail={...(remote.retail||{}),...(local.retail||{})};
    out.retail.inventory=mergeInventory(local.retail?.inventory||{},remote.retail?.inventory||{});
    out.retail.orders=mergeArray(local.retail?.orders||[],remote.retail?.orders||[]);
    out.retail.quotes=mergeArray(local.retail?.quotes||[],remote.retail?.quotes||[]);
  }
  if(local.voice||remote.voice){
    out.voice={...(remote.voice||{}),...(local.voice||{})};
    out.voice.calls=mergeArray(local.voice?.calls||[],remote.voice?.calls||[]);
    out.voice.actions=mergeArray(local.voice?.actions||[],remote.voice?.actions||[]);
    out.voice.automationRuns=mergeArray(local.voice?.automationRuns||[],remote.voice?.automationRuns||[]);
  }
  return out;
}

function emit(state,message,extra={}){lastStatus={state,message,...extra,at:new Date().toISOString()};if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('kelo:sync-status',{detail:lastStatus}));return lastStatus}
export const getSyncStatus=()=>({...lastStatus,...getBackendStatus()});
const getRevision=()=>hasLocal()?Number(localStorage.getItem(REVISION_KEY)||0):0;
const setRevision=v=>{if(hasLocal())localStorage.setItem(REVISION_KEY,String(Number(v||0)))};

export async function pullRemote({apply=true}={}){
  if(!getBackendStatus().ready)return emit('offline','Backend not connected');
  emit('syncing','Pulling remote state');
  const remote=await backendApi.getState();
  if(apply&&remote?.state&&hasLocal()){
    const raw=localStorage.getItem(STORAGE);if(raw)localStorage.setItem(BACKUP_KEY,raw);
    bypass=true;localStorage.setItem(STORAGE,JSON.stringify(remote.state));bypass=false;setRevision(remote.revision||0);
  }
  emit('synced','Remote state loaded',{revision:remote?.revision||0});return remote;
}

export async function pushRemote(state){
  if(!getBackendStatus().ready)return emit('offline','Backend not connected');
  const localState=state||(()=>{try{return JSON.parse(localStorage.getItem(STORAGE)||'null')}catch{return null}})();if(!localState)return null;
  emit('syncing','Saving central state');
  try{
    const result=await backendApi.putState(localState,getRevision());setRevision(result.revision||0);emit('synced','Central state saved',{revision:result.revision||0});return result;
  }catch(error){
    if(error.status===409&&error.data?.current?.state){
      const merged=mergeStates(localState,error.data.current.state);const retry=await backendApi.putState(merged,error.data.current.revision||0);setRevision(retry.revision||0);
      if(hasLocal()){bypass=true;localStorage.setItem(STORAGE,JSON.stringify(merged));bypass=false}
      emit('synced','Conflict merged and saved',{revision:retry.revision||0});return retry;
    }
    emit('error',error.message||'Sync failed');throw error;
  }
}

export function scheduleRemotePush(state=null,delay=700){clearTimeout(pushTimer);pushTimer=setTimeout(()=>pushRemote(state).catch(()=>{}),delay)}

export function installStorageSync(){
  if(installed||typeof Storage==='undefined')return;installed=true;
  const original=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){const result=original.call(this,key,value);if(!bypass&&this===localStorage&&key===STORAGE&&getBackendStatus().ready){try{scheduleRemotePush(JSON.parse(value))}catch{}}return result};
}

export async function bootRemoteSync(){
  installStorageSync();if(!getBackendStatus().ready){emit('offline','Local mode');return}
  try{
    const remote=await backendApi.getState();const localRaw=hasLocal()?localStorage.getItem(STORAGE):null;const local=localRaw?JSON.parse(localRaw):null;
    if(remote?.state){const merged=local?mergeStates(local,remote.state):remote.state;bypass=true;localStorage.setItem(STORAGE,JSON.stringify(merged));bypass=false;setRevision(remote.revision||0);emit('synced','Central state connected',{revision:remote.revision||0});scheduleRemotePush(merged,250)}
    else if(local){setRevision(0);await pushRemote(local)}
  }catch(error){emit('error',error.message||'Backend unavailable')}
}

export async function syncNow(){const raw=hasLocal()?localStorage.getItem(STORAGE):null;return pushRemote(raw?JSON.parse(raw):null)}
export {STORAGE,REVISION_KEY,BACKUP_KEY};

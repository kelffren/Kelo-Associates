const CONFIG_KEY='kelo-backend-config-v1';
const TOKEN_KEY='kelo-backend-token-v1';

const hasLocal=()=>typeof localStorage!=='undefined';
const hasSession=()=>typeof sessionStorage!=='undefined';
const cleanUrl=value=>String(value||'').trim().replace(/\/+$/,'');

export function getBackendConfig(){
  if(!hasLocal())return {endpoint:'',workspace:'default'};
  try{return {...{endpoint:'',workspace:'default'},...JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}')}}catch{return {endpoint:'',workspace:'default'}}
}

export function configureBackend({endpoint,workspace='default',token=''}={}){
  const url=cleanUrl(endpoint);if(!url)throw new Error('Backend endpoint requerido');
  if(hasLocal())localStorage.setItem(CONFIG_KEY,JSON.stringify({endpoint:url,workspace:String(workspace||'default').trim()||'default'}));
  if(token&&hasSession())sessionStorage.setItem(TOKEN_KEY,String(token));
  return getBackendStatus();
}

export function setBackendToken(token=''){if(!hasSession())return false;if(token)sessionStorage.setItem(TOKEN_KEY,String(token));else sessionStorage.removeItem(TOKEN_KEY);return true}
export function disconnectBackend(){if(hasLocal())localStorage.removeItem(CONFIG_KEY);if(hasSession())sessionStorage.removeItem(TOKEN_KEY)}

export function getBackendStatus(){
  const cfg=getBackendConfig();const token=hasSession()?sessionStorage.getItem(TOKEN_KEY)||'':'';
  return {configured:!!cfg.endpoint,authenticated:!!token,endpoint:cfg.endpoint,workspace:cfg.workspace,ready:!!cfg.endpoint&&!!token};
}

async function request(path,{method='GET',body,signal,timeoutMs=12000,auth=true}={}){
  const cfg=getBackendConfig();if(!cfg.endpoint)throw new Error('Backend no configurado');
  const token=hasSession()?sessionStorage.getItem(TOKEN_KEY)||'':'';if(auth&&!token)throw new Error('Backend token no configurado');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
  if(signal)signal.addEventListener('abort',()=>controller.abort(),{once:true});
  try{
    const res=await fetch(`${cfg.endpoint}${path}`,{method,headers:{'Content-Type':'application/json','X-Kelo-Workspace':cfg.workspace,...(auth?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});
    const text=await res.text();let data=null;try{data=text?JSON.parse(text):null}catch{data={raw:text}}
    if(!res.ok){const error=new Error(data?.message||data?.error||`Backend ${res.status}`);error.status=res.status;error.data=data;throw error}
    return data;
  }finally{clearTimeout(timer)}
}

export const backendApi={
  health:()=>request('/health',{auth:false,timeoutMs:5000}),
  getState:()=>request('/state'),
  putState:(state,expectedRevision=0)=>request('/state',{method:'PUT',body:{state,expectedRevision}}),
  sendMessage:({channel,to,body,mediaUrl=null})=>request('/messages/send',{method:'POST',body:{channel,to,body,mediaUrl}}),
  createPaymentLink:({orderId,amount,currency='usd',description,customerPhone,successUrl,cancelUrl})=>request('/payments/create',{method:'POST',body:{orderId,amount,currency,description,customerPhone,successUrl,cancelUrl}}),
  getInventory:({vertical,sku,variantKey='default'})=>request(`/inventory?vertical=${encodeURIComponent(vertical)}&sku=${encodeURIComponent(sku)}&variantKey=${encodeURIComponent(variantKey)}`),
  setInventory:({vertical,sku,variantKey='default',quantity})=>request('/inventory',{method:'PUT',body:{vertical,sku,variantKey,quantity}}),
  reserveInventory:({vertical,sku,variantKey='default',quantity})=>request('/inventory/reserve',{method:'POST',body:{vertical,sku,variantKey,quantity}})
};

export {CONFIG_KEY,TOKEN_KEY};

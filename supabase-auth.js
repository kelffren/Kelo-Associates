const SUPABASE_URL='https://rrlrbvhbepcdsjmhrpeb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_c2L2e1T3Fobgb5FEIwFhbw_O-QBM5iB';
const SESSION_KEY='kelo-supabase-auth-session-v1';

const hasSessionStorage=()=>typeof sessionStorage!=='undefined';
const nowSeconds=()=>Math.floor(Date.now()/1000);

function readSession(){
  if(!hasSessionStorage())return null;
  try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null')}catch{return null}
}
function writeSession(session){
  if(!hasSessionStorage())return session;
  if(session)sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));else sessionStorage.removeItem(SESSION_KEY);
  return session;
}
function normalizeSession(payload,previous=null){
  if(!payload?.access_token)return null;
  const expiresAt=Number(payload.expires_at||0)||nowSeconds()+Number(payload.expires_in||3600);
  return {
    access_token:String(payload.access_token),
    refresh_token:String(payload.refresh_token||previous?.refresh_token||''),
    expires_at:expiresAt,
    token_type:String(payload.token_type||'bearer'),
    user:payload.user?{id:payload.user.id||'',email:payload.user.email||''}:previous?.user||null
  };
}
async function authRequest(path,{method='POST',body,token}={}){
  const response=await fetch(`${SUPABASE_URL}/auth/v1${path}`,{
    method,
    headers:{apikey:SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data={message:text}}
  if(!response.ok){const error=new Error(data?.msg||data?.message||data?.error_description||data?.error||`Auth ${response.status}`);error.status=response.status;error.data=data;throw error}
  return data;
}

export function getSecureSession(){return readSession()}
export function hasSecureSession(){const s=readSession();return !!(s?.access_token||s?.refresh_token)}
export function clearSecureSession(){writeSession(null)}

export async function signInSecure(email,password){
  const cleanEmail=String(email||'').trim().toLowerCase();if(!cleanEmail||!password)throw new Error('Email y contraseña requeridos');
  const data=await authRequest('/token?grant_type=password',{body:{email:cleanEmail,password:String(password)}});const session=normalizeSession(data);if(!session)throw new Error('Supabase no devolvió una sesión');writeSession(session);return session;
}

export async function signUpSecure(email,password){
  const cleanEmail=String(email||'').trim().toLowerCase();if(!cleanEmail||String(password||'').length<6)throw new Error('Usa un email válido y una contraseña de al menos 6 caracteres');
  const data=await authRequest('/signup',{body:{email:cleanEmail,password:String(password)}});const session=normalizeSession(data);if(session)writeSession(session);return {session,user:data?.user||session?.user||null,confirmationRequired:!session};
}

export async function refreshSecureSession(){
  const current=readSession();if(!current?.refresh_token){writeSession(null);return null}
  try{const data=await authRequest('/token?grant_type=refresh_token',{body:{refresh_token:current.refresh_token}});const session=normalizeSession(data,current);writeSession(session);return session}catch(error){writeSession(null);throw error}
}

export async function getSecureAccessToken(){
  const current=readSession();if(!current)return '';
  if(current.access_token&&Number(current.expires_at||0)>nowSeconds()+90)return current.access_token;
  const refreshed=await refreshSecureSession();return refreshed?.access_token||'';
}

export async function signOutSecure(){
  const current=readSession();try{if(current?.access_token)await authRequest('/logout',{body:{},token:current.access_token})}catch{}finally{writeSession(null)}
}

export function secureAuthStatus(){const s=readSession();return {signedIn:hasSecureSession(),email:s?.user?.email||'',userId:s?.user?.id||'',expiresAt:Number(s?.expires_at||0)||null}}

export {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,SESSION_KEY};

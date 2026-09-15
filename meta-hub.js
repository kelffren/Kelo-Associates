const META_KEY='kelo-meta-hub-v1';
const DEFAULT_STATE={version:1,apiBase:'',connections:[],assets:{businesses:[],pages:[],adAccounts:[]},campaignsByAccount:{},lastSync:null,error:null};
const $m=(s,r=document)=>r.querySelector(s);
const escm=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const safeId=v=>encodeURIComponent(String(v??''));
const fmtMoney=(v,currency='USD')=>{try{return new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:2}).format(Number(v||0))}catch{return String(v||0)}};
const fmtMetaDate=v=>v?new Date(v).toLocaleString('es-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'—';

function loadMeta(){
  try{
    const parsed=JSON.parse(localStorage.getItem(META_KEY));
    return parsed&&parsed.version===1?{...DEFAULT_STATE,...parsed,assets:{...DEFAULT_STATE.assets,...(parsed.assets||{})},campaignsByAccount:parsed.campaignsByAccount||{}}:{...DEFAULT_STATE};
  }catch{return {...DEFAULT_STATE}}
}
let meta=loadMeta();
function saveMeta(){localStorage.setItem(META_KEY,JSON.stringify(meta))}
function base(){return String(meta.apiBase||'').trim().replace(/\/+$/,'')}
function configured(){return /^https:\/\//i.test(base())||/^http:\/\/localhost(?::\d+)?$/i.test(base())}

async function metaApi(path,options={}){
  if(!configured())throw new Error('Configura primero el backend seguro de Meta.');
  const res=await fetch(`${base()}${path}`,{
    credentials:'include',
    ...options,
    headers:{'Accept':'application/json',...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}
  });
  let body=null;try{body=await res.json()}catch{}
  if(!res.ok)throw new Error(body?.error||body?.message||`Meta backend respondió ${res.status}`);
  return body||{};
}

function injectMetaStyles(){
  if($m('#metaHubStyles'))return;
  const style=document.createElement('style');style.id='metaHubStyles';style.textContent=`
  .meta-card{position:relative;overflow:hidden}.meta-card:before{content:'';position:absolute;inset:-60px auto auto -50px;width:150px;height:150px;border-radius:50%;background:rgba(24,119,242,.08);pointer-events:none}.meta-card .meta-brand{display:flex;align-items:center;gap:10px}.meta-logo{width:34px;height:34px;border-radius:11px;background:#1877f2;color:#fff;display:grid;place-items:center;font-weight:800;font-size:20px}.meta-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.meta-stat{padding:10px;border:1px solid rgba(127,127,127,.18);border-radius:14px}.meta-stat strong{display:block;font-size:18px}.meta-stat span{font-size:11px;opacity:.65}.meta-status{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700}.meta-dot{width:7px;height:7px;border-radius:50%;background:#ff9f0a}.meta-status.online .meta-dot{background:#30d158}.meta-sheet-body{display:grid;gap:12px}.meta-section{border:1px solid rgba(127,127,127,.18);border-radius:18px;padding:13px}.meta-section h4{margin:0 0 4px}.meta-list{display:grid;gap:8px;margin-top:9px}.meta-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 0;border-top:1px solid rgba(127,127,127,.13)}.meta-row:first-child{border-top:0}.meta-row p{margin:3px 0 0;font-size:12px;opacity:.68}.meta-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.meta-chip{display:inline-flex;padding:4px 7px;border-radius:999px;background:rgba(127,127,127,.12);font-size:10px;font-weight:700}.meta-warning{font-size:12px;line-height:1.45;padding:10px;border-radius:13px;background:rgba(255,159,10,.10)}.meta-campaign{padding:10px 0;border-top:1px solid rgba(127,127,127,.13)}.meta-campaign:first-child{border-top:0}.meta-kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:7px}.meta-mini{font-size:11px;padding:7px;border-radius:10px;background:rgba(127,127,127,.08)}.meta-mini strong{display:block;font-size:13px}.meta-backend-form{display:grid;gap:8px}.meta-backend-form input{width:100%}@media(max-width:520px){.meta-grid{grid-template-columns:repeat(3,1fr)}.meta-row{grid-template-columns:1fr}.meta-actions{justify-content:flex-start}}
  `;document.head.appendChild(style);
}

function summary(){
  const businesses=meta.assets?.businesses?.length||0,pages=meta.assets?.pages?.length||0,ads=meta.assets?.adAccounts?.length||0;
  return {businesses,pages,ads,connections:meta.connections?.length||0};
}
function cardHTML(){
  const s=summary();const online=configured()&&s.connections>0;
  return `<div class="sectiontitle"><div class="meta-brand"><div class="meta-logo">f</div><div><h3>Meta Hub</h3><p class="muted">Facebook, Pages y Ads Manager</p></div></div><span class="meta-status ${online?'online':''}"><i class="meta-dot"></i>${online?'CONECTADO':'POR CONFIGURAR'}</span></div>
  <div class="meta-grid" style="margin-top:10px"><div class="meta-stat"><strong>${s.connections}</strong><span>Facebook</span></div><div class="meta-stat"><strong>${s.pages}</strong><span>Pages</span></div><div class="meta-stat"><strong>${s.ads}</strong><span>Ad Accounts</span></div></div>
  <button class="primary wide" id="openMetaHub" style="margin-top:10px">Abrir Meta Hub</button>`;
}

function connectionRows(){
  if(!meta.connections?.length)return '<div class="empty">Todavía no hay cuentas de Facebook autorizadas.</div>';
  return meta.connections.map(c=>`<div class="meta-row"><div><strong>${escm(c.name||c.label||'Facebook')}</strong> <span class="meta-chip">${escm(c.status||'connected')}</span><p>${escm(c.email||c.externalUserId||c.id||'Conexión Meta')} · ${c.updatedAt?'Actualizado '+fmtMetaDate(c.updatedAt):'autorizado'}</p></div><div class="meta-actions"><button class="secondary" data-meta-refresh="${escm(c.id)}">Actualizar</button><button class="ghost" data-meta-disconnect="${escm(c.id)}">Quitar</button></div></div>`).join('');
}
function adRows(){
  const rows=meta.assets?.adAccounts||[];
  if(!rows.length)return '<div class="empty">No hay cuentas publicitarias sincronizadas.</div>';
  return rows.map(a=>`<div class="meta-row"><div><strong>${escm(a.name||a.id)}</strong> <span class="meta-chip">${escm(a.accountStatusLabel||a.status||'AD ACCOUNT')}</span><p>${escm(a.id)}${a.businessName?' · '+escm(a.businessName):''}${a.currency?' · '+escm(a.currency):''}</p></div><div class="meta-actions"><button class="secondary" data-meta-campaigns="${escm(a.id)}">Campañas</button><button class="secondary" data-meta-insights="${escm(a.id)}">Métricas</button></div></div>`).join('');
}
function pageRows(){
  const rows=meta.assets?.pages||[];
  if(!rows.length)return '<div class="empty">No hay Pages sincronizadas.</div>';
  return rows.map(p=>`<div class="meta-row"><div><strong>${escm(p.name||p.id)}</strong><p>${escm(p.id)}${p.connectionName?' · '+escm(p.connectionName):''}${p.instagramName?' · IG '+escm(p.instagramName):''}</p></div><div class="meta-actions"><span class="meta-chip">${escm((p.tasks||[]).slice(0,2).join(' · ')||'PAGE')}</span></div></div>`).join('');
}
function businessRows(){
  const rows=meta.assets?.businesses||[];
  if(!rows.length)return '<div class="empty">No hay Business portfolios sincronizados.</div>';
  return rows.map(b=>`<div class="meta-row"><div><strong>${escm(b.name||b.id)}</strong><p>${escm(b.id)}${b.verificationStatus?' · '+escm(b.verificationStatus):''}</p></div><span class="meta-chip">BUSINESS</span></div>`).join('');
}
function campaignPanel(){
  const selected=meta.selectedAdAccount;if(!selected)return '';
  const data=meta.campaignsByAccount?.[selected]||{};const rows=data.campaigns||[];const account=(meta.assets?.adAccounts||[]).find(x=>String(x.id)===String(selected));
  return `<div class="meta-section" id="metaCampaignSection"><div class="sectiontitle"><div><h4>Campañas · ${escm(account?.name||selected)}</h4><p class="muted">Activa o pausa campañas sin cambiar de cuenta.</p></div><button class="secondary" data-meta-close-campaigns>Ocultar</button></div>${data.loading?'<div class="empty">Cargando campañas…</div>':data.error?`<div class="meta-warning">${escm(data.error)}</div>`:rows.length?`<div class="meta-list">${rows.map(c=>`<div class="meta-campaign"><div class="sectiontitle"><div><strong>${escm(c.name||c.id)}</strong><p class="muted">${escm(c.status||c.effectiveStatus||'UNKNOWN')}</p></div><button class="${String(c.status).toUpperCase()==='ACTIVE'?'danger':'primary'}" data-meta-campaign-status="${escm(c.id)}" data-meta-account="${escm(selected)}" data-next-status="${String(c.status).toUpperCase()==='ACTIVE'?'PAUSED':'ACTIVE'}">${String(c.status).toUpperCase()==='ACTIVE'?'Pausar':'Activar'}</button></div><div class="meta-kpis"><div class="meta-mini"><span>Gasto</span><strong>${fmtMoney(c.spend,account?.currency||'USD')}</strong></div><div class="meta-mini"><span>Resultados</span><strong>${escm(c.results??'—')}</strong></div></div></div>`).join('')}</div>`:'<div class="empty">No hay campañas para esta cuenta.</div>'}</div>`;
}
function sheetHTML(){
  const s=summary();return `<div class="sheetback" id="metaHubSheet" role="dialog" aria-modal="true" aria-label="Meta Hub"><div class="sheet"><div class="handle"></div><div class="sheethead"><div><h3>Meta Hub</h3><p class="muted">${s.connections} Facebook · ${s.pages} Pages · ${s.ads} Ad Accounts</p></div><button class="iconbtn" data-meta-close aria-label="Cerrar">×</button></div><div class="meta-sheet-body">
  <div class="meta-section"><div class="sectiontitle"><div><h4>Cuentas de Facebook</h4><p class="muted">Cada autorización puede aportar negocios, Pages y cuentas publicitarias distintas.</p></div><button class="primary" id="metaConnectFacebook">＋ Conectar</button></div><div class="meta-list">${connectionRows()}</div></div>
  <div class="meta-section"><div class="sectiontitle"><div><h4>Ads Manager</h4><p class="muted">Cambia de cuenta sin salir de Kelo Associates.</p></div><button class="secondary" id="metaSyncAll">↻ Sincronizar</button></div><div class="meta-list">${adRows()}</div></div>
  ${campaignPanel()}
  <div class="meta-section"><h4>Facebook Pages</h4><div class="meta-list">${pageRows()}</div></div>
  <div class="meta-section"><h4>Business portfolios</h4><div class="meta-list">${businessRows()}</div></div>
  <div class="meta-section"><h4>Backend seguro</h4><p class="muted">Los access tokens nunca se guardan en GitHub Pages ni en localStorage. Esta URL debe apuntar al backend OAuth de Kelo Associates.</p><form id="metaBackendForm" class="meta-backend-form"><div class="field"><label>URL del backend</label><input name="apiBase" inputmode="url" autocomplete="url" placeholder="https://api.keloassociates.com" value="${escm(meta.apiBase)}"></div><button class="secondary wide">Guardar backend</button></form><div class="meta-warning" style="margin-top:9px">${configured()?'Backend configurado. Los datos visibles pueden guardarse localmente para modo offline, pero nunca los tokens.':'Falta backend. La interfaz ya está lista, pero Meta OAuth no debe conectarse directamente desde esta página pública.'}</div>${meta.lastSync?`<p class="muted" style="margin-top:8px">Última sincronización: ${fmtMetaDate(meta.lastSync)}</p>`:''}${meta.error?`<div class="meta-warning" style="margin-top:8px">Último error: ${escm(meta.error)}</div>`:''}</div>
  </div></div></div>`;
}

function renderMeta(){
  const card=$m('#metaHubCard');if(card)card.innerHTML=cardHTML();
  const old=$m('#metaHubSheet');if(old){const wasOpen=old.classList.contains('open');old.outerHTML=sheetHTML();if(wasOpen)$m('#metaHubSheet')?.classList.add('open')}
}
function openMeta(){renderMeta();$m('#metaHubSheet')?.classList.add('open')}
function closeMeta(){$m('#metaHubSheet')?.classList.remove('open')}

async function syncMeta(){
  meta.error=null;saveMeta();renderMeta();
  try{
    const payload=await metaApi('/v1/meta/sync',{method:'POST'});
    meta.connections=Array.isArray(payload.connections)?payload.connections:meta.connections;
    meta.assets={businesses:payload.businesses||[],pages:payload.pages||[],adAccounts:payload.adAccounts||[]};
    meta.lastSync=new Date().toISOString();meta.error=null;saveMeta();renderMeta();return true;
  }catch(err){meta.error=err.message;saveMeta();renderMeta();return false}
}
function startConnect(){
  if(!configured()){openMeta();$m('#metaBackendForm input[name="apiBase"]')?.focus();return}
  const returnUrl=new URL(location.href);returnUrl.searchParams.set('meta_return','1');
  location.href=`${base()}/v1/meta/oauth/start?return_url=${encodeURIComponent(returnUrl.toString())}`;
}
async function disconnect(id){
  if(!confirm('¿Quitar esta conexión de Facebook de Kelo Associates?'))return;
  try{await metaApi(`/v1/meta/connections/${safeId(id)}`,{method:'DELETE'});await syncMeta()}catch(err){meta.error=err.message;saveMeta();renderMeta()}
}
async function refreshConnection(id){
  try{await metaApi(`/v1/meta/connections/${safeId(id)}/sync`,{method:'POST'});await syncMeta()}catch(err){meta.error=err.message;saveMeta();renderMeta()}
}
async function loadCampaigns(accountId){
  meta.selectedAdAccount=accountId;meta.campaignsByAccount[accountId]={loading:true,campaigns:[]};saveMeta();renderMeta();
  try{const payload=await metaApi(`/v1/meta/ad-accounts/${safeId(accountId)}/campaigns`);meta.campaignsByAccount[accountId]={loading:false,campaigns:Array.isArray(payload.campaigns)?payload.campaigns:[]};saveMeta();renderMeta()}catch(err){meta.campaignsByAccount[accountId]={loading:false,campaigns:[],error:err.message};saveMeta();renderMeta()}
}
async function loadInsights(accountId){
  meta.selectedAdAccount=accountId;meta.campaignsByAccount[accountId]={loading:true,campaigns:[]};saveMeta();renderMeta();
  try{const payload=await metaApi(`/v1/meta/ad-accounts/${safeId(accountId)}/campaigns?include_insights=1`);meta.campaignsByAccount[accountId]={loading:false,campaigns:Array.isArray(payload.campaigns)?payload.campaigns:[]};saveMeta();renderMeta()}catch(err){meta.campaignsByAccount[accountId]={loading:false,campaigns:[],error:err.message};saveMeta();renderMeta()}
}
async function setCampaignStatus(accountId,campaignId,status){
  try{await metaApi(`/v1/meta/campaigns/${safeId(campaignId)}/status`,{method:'POST',body:JSON.stringify({status})});await loadCampaigns(accountId)}catch(err){meta.error=err.message;saveMeta();renderMeta()}
}

function mountMeta(){
  injectMetaStyles();
  const grid=$m('[data-screen="more"] .grid.two');
  if(grid&&!$m('#metaHubCard')){const card=document.createElement('div');card.className='card stack meta-card';card.id='metaHubCard';card.innerHTML=cardHTML();grid.prepend(card)}
  if(!$m('#metaHubSheet'))document.body.insertAdjacentHTML('beforeend',sheetHTML());
  const params=new URLSearchParams(location.search);
  if(params.get('meta_return')==='1'||params.has('meta_status')){
    params.delete('meta_return');params.delete('meta_status');params.delete('meta_error');
    const clean=`${location.pathname}${params.toString()?'?'+params.toString():''}${location.hash}`;history.replaceState({},'',clean);
    if(configured())syncMeta();
  }
}

document.addEventListener('click',e=>{
  if(e.target.closest('#openMetaHub')){openMeta();return}
  if(e.target.closest('[data-meta-close]')){closeMeta();return}
  if(e.target.closest('#metaConnectFacebook')){startConnect();return}
  if(e.target.closest('#metaSyncAll')){syncMeta();return}
  const disc=e.target.closest('[data-meta-disconnect]');if(disc){disconnect(disc.dataset.metaDisconnect);return}
  const refresh=e.target.closest('[data-meta-refresh]');if(refresh){refreshConnection(refresh.dataset.metaRefresh);return}
  const camp=e.target.closest('[data-meta-campaigns]');if(camp){loadCampaigns(camp.dataset.metaCampaigns);return}
  const ins=e.target.closest('[data-meta-insights]');if(ins){loadInsights(ins.dataset.metaInsights);return}
  const stat=e.target.closest('[data-meta-campaign-status]');if(stat){setCampaignStatus(stat.dataset.metaAccount,stat.dataset.metaCampaignStatus,stat.dataset.nextStatus);return}
  if(e.target.closest('[data-meta-close-campaigns]')){meta.selectedAdAccount=null;saveMeta();renderMeta();return}
});
document.addEventListener('submit',e=>{
  if(e.target.id!=='metaBackendForm')return;e.preventDefault();const f=new FormData(e.target);const value=String(f.get('apiBase')||'').trim().replace(/\/+$/,'');
  if(value&&!/^https:\/\//i.test(value)&&!/^http:\/\/localhost(?::\d+)?$/i.test(value)){meta.error='La URL del backend debe usar HTTPS.';saveMeta();renderMeta();return}
  meta.apiBase=value;meta.error=null;saveMeta();renderMeta();openMeta();
});

document.addEventListener('click',e=>{const sheet=e.target.closest('#metaHubSheet');if(sheet&&e.target===sheet)closeMeta()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountMeta);else mountMeta();

export {syncMeta};

const VAULT_DB='kelo-contact-vault-v1';
const VAULT_VERSION=1;
const SHORTCUT_NAME='Kelo Contacts Backup';
const CRM_KEY='kelo-associates-v2';
const $v=(s,r=document)=>r.querySelector(s);
const $$v=(s,r=document)=>[...r.querySelectorAll(s)];
const safe=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const isoDay=d=>{d=new Date(d);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const stamp=()=>new Date().toISOString();
let dbPromise;
let currentFilter='active';

function request(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
function txDone(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||new Error('Transacción cancelada'));tx.onerror=()=>reject(tx.error||new Error('Error de base de datos'))})}
function openDB(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(VAULT_DB,VAULT_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('contacts')){
        const store=db.createObjectStore('contacts',{keyPath:'key'});
        store.createIndex('active','active',{unique:false});
        store.createIndex('updatedAt','updatedAt',{unique:false});
      }
      if(!db.objectStoreNames.contains('runs')){
        const runs=db.createObjectStore('runs',{keyPath:'id'});
        runs.createIndex('createdAt','createdAt',{unique:false});
      }
      if(!db.objectStoreNames.contains('settings'))db.createObjectStore('settings',{keyPath:'key'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
  return dbPromise;
}
async function getAll(store){const db=await openDB();return request(db.transaction(store,'readonly').objectStore(store).getAll())}
async function getSetting(key){const db=await openDB();return request(db.transaction('settings','readonly').objectStore('settings').get(key))}
async function setSetting(key,value){const db=await openDB();const tx=db.transaction('settings','readwrite');tx.objectStore('settings').put({key,value,updatedAt:stamp()});await txDone(tx);return value}

function normalizePhone(value){
  let raw=String(value||'').trim().replace(/^tel:/i,'');
  if(raw.startsWith('00'))raw='+'+raw.slice(2);
  const plus=raw.startsWith('+');
  const digits=raw.replace(/\D/g,'');
  if(!digits)return'';
  return plus?`+${digits}`:digits;
}
function contactKey(contact){
  const phones=(contact.phones||[]).map(normalizePhone).filter(Boolean);
  if(phones.length)return `phone:${phones[0].replace(/\D/g,'')}`;
  const email=String((contact.emails||[])[0]||'').trim().toLowerCase();
  return email?`email:${email}`:'';
}
function decodeVCardValue(v){return String(v||'').replace(/\\n/gi,'\n').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\').trim()}
function parseVCard(text){
  const unfolded=String(text||'').replace(/\r?\n[ \t]/g,'');
  const blocks=unfolded.split(/BEGIN:VCARD/i).slice(1).map(x=>x.split(/END:VCARD/i)[0]);
  const out=[];
  for(const block of blocks){
    let name='';let nFallback='';const phones=[];const emails=[];
    for(const line of block.split(/\r?\n/)){
      const i=line.indexOf(':');if(i<0)continue;
      const lhs=line.slice(0,i).toUpperCase();const value=decodeVCardValue(line.slice(i+1));
      const prop=lhs.split(';')[0].split('.').pop();
      if(prop==='FN')name=value;
      else if(prop==='N'){
        const p=value.split(';').map(decodeVCardValue);nFallback=[p[1],p[2],p[0],p[3],p[4]].filter(Boolean).join(' ').trim();
      }else if(prop==='TEL'){
        const phone=normalizePhone(value);if(phone&&!phones.includes(phone))phones.push(phone);
      }else if(prop==='EMAIL'){
        const email=value.trim().toLowerCase();if(email&&!emails.includes(email))emails.push(email);
      }
    }
    if(phones.length||emails.length)out.push({name:name||nFallback||'Sin nombre',phones,emails,source:'vcard'});
  }
  return out;
}
function parseCSV(text){
  const lines=String(text||'').split(/\r?\n/).filter(Boolean);if(!lines.length)return[];
  const split=line=>{const cells=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++}else q=!q}else if(c===','&&!q){cells.push(cur);cur=''}else cur+=c}cells.push(cur);return cells.map(x=>x.trim())};
  const first=split(lines[0]).map(x=>x.toLowerCase());const hasHeader=first.some(x=>['name','nombre','phone','telefono','teléfono','email'].includes(x));
  const idx={name:first.findIndex(x=>['name','nombre'].includes(x)),phone:first.findIndex(x=>['phone','telefono','teléfono','number','numero','número'].includes(x)),email:first.findIndex(x=>x==='email')};
  return lines.slice(hasHeader?1:0).map(line=>{const c=split(line);const name=hasHeader&&idx.name>=0?c[idx.name]:c[0];const phone=hasHeader&&idx.phone>=0?c[idx.phone]:c[1];const email=hasHeader&&idx.email>=0?c[idx.email]:c[2];return{name:name||'Sin nombre',phones:[normalizePhone(phone)].filter(Boolean),emails:[String(email||'').trim().toLowerCase()].filter(Boolean),source:'csv'}}).filter(c=>c.phones.length||c.emails.length);
}
async function parseFile(file){
  const text=await file.text();const lower=file.name.toLowerCase();
  if(lower.endsWith('.vcf')||/BEGIN:VCARD/i.test(text))return parseVCard(text);
  if(lower.endsWith('.csv'))return parseCSV(text);
  const data=JSON.parse(text);const rows=Array.isArray(data)?data:Array.isArray(data.contacts)?data.contacts:[];
  return rows.map(c=>({name:c.name||c.fullName||'Sin nombre',phones:(c.phones||[c.phone]).filter(Boolean).map(normalizePhone).filter(Boolean),emails:(c.emails||[c.email]).filter(Boolean).map(x=>String(x).trim().toLowerCase()),source:c.source||'json'})).filter(c=>c.phones.length||c.emails.length);
}
function stableShape(c){return JSON.stringify({name:c.name||'',phones:[...(c.phones||[])].sort(),emails:[...(c.emails||[])].sort()})}
async function mergeContacts(rows,{source='import',fileName='',fullSnapshot=true}={}){
  const db=await openDB();const existing=await getAll('contacts');const map=new Map(existing.map(c=>[c.key,c]));const seen=new Set();
  let added=0,updated=0,unchanged=0,reactivated=0,missing=0;const now=stamp();
  const tx=db.transaction(['contacts','runs'],'readwrite');const store=tx.objectStore('contacts');
  for(const input of rows){
    const normalized={name:String(input.name||'Sin nombre').trim()||'Sin nombre',phones:[...new Set((input.phones||[]).map(normalizePhone).filter(Boolean))],emails:[...new Set((input.emails||[]).map(x=>String(x).trim().toLowerCase()).filter(Boolean))]};
    const key=contactKey(normalized);if(!key||seen.has(key))continue;seen.add(key);
    const old=map.get(key);
    if(!old){store.put({...normalized,key,active:true,source,firstSeenAt:now,lastSeenAt:now,updatedAt:now});added++;continue}
    const changed=stableShape(old)!==stableShape(normalized);
    if(!old.active)reactivated++;
    if(changed)updated++;else unchanged++;
    store.put({...old,...normalized,active:true,source:old.source||source,lastSeenAt:now,updatedAt:changed?now:old.updatedAt||now,missingAt:null});
  }
  if(fullSnapshot){
    for(const old of existing){
      if(old.active&&!seen.has(old.key)){store.put({...old,active:false,missingAt:now,lastSeenAt:old.lastSeenAt||old.updatedAt||now});missing++}
    }
  }
  const run={id:`run_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,createdAt:now,type:source,fileName,total:seen.size,added,updated,unchanged,reactivated,missing,fullSnapshot};
  tx.objectStore('runs').put(run);await txDone(tx);return run;
}
function crmRows(){
  try{const data=JSON.parse(localStorage.getItem(CRM_KEY)||'null');return (data?.clients||[]).map(c=>({name:c.name||'Sin nombre',phones:[c.phone].filter(Boolean),emails:[c.email].filter(Boolean),source:'kelo-crm'}))}catch{return[]}
}
async function snapshotCRM(auto=false){
  const rows=crmRows();if(!rows.length)return null;
  const run=await mergeContacts(rows,{source:auto?'crm-auto':'crm-manual',fileName:'Kelo Inbox CRM',fullSnapshot:false});
  await setSetting('lastCRMSnapshotAt',run.createdAt);return run;
}
async function maybeDailyCRM(){
  const last=(await getSetting('lastCRMSnapshotAt'))?.value;
  if(!last||isoDay(last)!==isoDay(new Date()))await snapshotCRM(true).catch(()=>{});
}
function fmtDateTime(v){if(!v)return'Nunca';return new Date(v).toLocaleString('es-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}
function download(name,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function vcfEscape(v){return String(v||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function toVCard(contacts){return contacts.map(c=>['BEGIN:VCARD','VERSION:3.0',`FN:${vcfEscape(c.name||'Sin nombre')}`,...(c.phones||[]).map(p=>`TEL;TYPE=CELL:${vcfEscape(p)}`),...(c.emails||[]).map(e=>`EMAIL:${vcfEscape(e)}`),'END:VCARD'].join('\r\n')).join('\r\n')+'\r\n'}
async function exportRecovery(){const contacts=await getAll('contacts');if(!contacts.length)return vaultToast('Todavía no hay contactos protegidos');download(`kelo-contact-recovery-${isoDay(new Date())}.vcf`,toVCard(contacts),'text/vcard;charset=utf-8');vaultToast(`Recuperación creada: ${contacts.length} contactos`)}
async function exportJSON(){const contacts=await getAll('contacts');const runs=await getAll('runs');const payload={version:1,exportedAt:stamp(),contacts,runs};download(`kelo-contact-vault-${isoDay(new Date())}.json`,JSON.stringify(payload,null,2),'application/json');vaultToast('Bóveda exportada')}
function vaultToast(text){const host=$v('#toast');if(host){host.textContent=text;host.classList.add('show');setTimeout(()=>host.classList.remove('show'),2400);return}alert(text)}

function injectStyles(){if($v('#contactVaultStyles'))return;const s=document.createElement('style');s.id='contactVaultStyles';s.textContent=`
.vault-hero{background:linear-gradient(145deg,rgba(28,28,30,.96),rgba(55,55,58,.92));color:#fff;border-radius:24px;padding:20px;margin-bottom:12px;box-shadow:0 18px 44px rgba(0,0,0,.18)}
.vault-hero h3{font-size:24px;margin:5px 0}.vault-hero p{margin:0;opacity:.76;line-height:1.45}.vault-shield{font-size:28px}.vault-status{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;margin-top:14px}.vault-dot{width:9px;height:9px;border-radius:50%;background:#34c759;box-shadow:0 0 0 5px rgba(52,199,89,.15)}
.vault-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.vault-stat{padding:14px;border-radius:18px;background:var(--card,rgba(127,127,127,.08));border:1px solid rgba(127,127,127,.12)}.vault-stat strong{display:block;font-size:24px}.vault-stat span{font-size:12px;opacity:.62}
.vault-actions{display:grid;gap:9px}.vault-history{display:grid;gap:8px}.vault-run{display:grid;grid-template-columns:1fr auto;gap:8px;padding:11px 0;border-bottom:1px solid rgba(127,127,127,.15)}.vault-run:last-child{border-bottom:0}.vault-run p{margin:3px 0 0;font-size:12px;opacity:.65}.vault-contact{display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(127,127,127,.12)}.vault-contact:last-child{border-bottom:0}.vault-avatar{width:42px;height:42px;border-radius:15px;display:grid;place-items:center;background:rgba(0,122,255,.12);font-weight:800}.vault-contact h4{margin:0}.vault-contact p{margin:3px 0 0;font-size:12px;opacity:.62}.vault-chip{font-size:10px;font-weight:800;padding:5px 7px;border-radius:999px;background:rgba(52,199,89,.13);color:#248a3d}.vault-chip.missing{background:rgba(255,149,0,.15);color:#c86b00}.vault-note{font-size:12px;line-height:1.45}.vault-code{font:600 11px ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all;background:rgba(127,127,127,.1);padding:10px;border-radius:12px}.vault-search{margin-top:10px}.vault-filter{display:flex;gap:6px;overflow:auto;padding-bottom:3px}.vault-filter button{white-space:nowrap}
@media(min-width:760px){.vault-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
`;document.head.appendChild(s)}
function screenHTML(){return `<section class="screen" data-screen="vault" id="contactVaultScreen">
  <div class="screenhead"><div><h2>Contact Vault</h2><p>Caja fuerte independiente para tus números.</p></div><button class="iconbtn" id="vaultBack" aria-label="Volver">‹</button></div>
  <div class="vault-hero"><div class="vault-shield">◈</div><h3>Tus contactos no dependen de WhatsApp.</h3><p>Guarda una copia recuperable, detecta contactos desaparecidos y conserva historial de importaciones.</p><div class="vault-status"><span class="vault-dot"></span><span id="vaultHeadline">Preparando bóveda…</span></div></div>
  <div class="vault-grid" id="vaultStats"></div>
  <div class="grid two" style="margin-top:12px">
    <div class="card stack"><div class="sectiontitle"><h3>Copia inmediata</h3><span class="tag green">iPhone</span></div><p class="muted vault-note">Guarda primero los clientes actuales de Kelo Inbox y ejecuta el Atajo “${SHORTCUT_NAME}”.</p><button class="primary wide" id="vaultBackupNow">Hacer copia ahora</button><button class="secondary wide" id="vaultImport">Importar VCF / JSON / CSV</button><input id="vaultFile" type="file" accept=".vcf,.json,.csv,text/vcard,text/x-vcard,application/json,text/csv" hidden></div>
    <div class="card stack"><div class="sectiontitle"><h3>Automática diaria</h3><span id="vaultAutomationBadge" class="tag">PENDIENTE</span></div><div id="vaultAutomationText" class="notice"></div><button class="primary wide" id="vaultCreateShortcut">Crear / configurar Atajo</button><button class="secondary wide" id="vaultOpenShortcut">Abrir Atajo existente</button><button class="ghost wide" id="vaultMarkAutomation">Ya configuré la automatización diaria</button></div>
  </div>
  <div class="grid two" style="margin-top:12px">
    <div class="card stack"><div class="sectiontitle"><h3>Recuperación</h3></div><button class="secondary wide" id="vaultExportVCF">Exportar todos a VCF</button><button class="secondary wide" id="vaultExportJSON">Exportar bóveda JSON</button><div class="notice vault-note">El VCF puede importarse de nuevo en Contactos del iPhone. La bóveda local conserva también los que hayan desaparecido de la lista más reciente.</div></div>
    <div class="card"><div class="sectiontitle"><h3>Historial</h3><span class="muted">Últimas copias</span></div><div class="vault-history" id="vaultHistory"></div></div>
  </div>
  <div class="card" style="margin-top:12px"><div class="sectiontitle"><h3>Contactos protegidos</h3><span class="muted" id="vaultListCount"></span></div><div class="field vault-search"><input id="vaultSearch" type="search" inputmode="search" placeholder="Buscar nombre, número o email"></div><div class="vault-filter" style="margin-top:8px"><button class="pill active" data-vault-filter="active">Actuales</button><button class="pill" data-vault-filter="missing">Desaparecidos</button><button class="pill" data-vault-filter="all">Todos</button></div><div id="vaultContacts"></div></div>
  <div class="card" style="margin-top:12px"><div class="sectiontitle"><h3>Puente iPhone → Vault</h3></div><p class="muted vault-note">Una automatización “Hora del día” puede ejecutar el Atajo todos los días sin preguntar. Haz que el Atajo lea tus contactos y guarde un archivo diario en iCloud Drive/Kelo Associates/Contacts. Luego puedes importar cualquiera de esos archivos aquí.</p><div class="vault-code">Atajo: ${SHORTCUT_NAME}<br>Frecuencia recomendada: cada día · 3:00 AM<br>Carpeta: iCloud Drive/Kelo Associates/Contacts</div></div>
</section>`}
function moreCardHTML(){return `<div class="card stack" id="contactVaultCard"><div class="sectiontitle"><h3>Contact Vault</h3><span class="tag green">NUEVO</span></div><p class="muted">Backup diario y recuperación de números de WhatsApp/iPhone.</p><button class="primary wide" id="openContactVault">Abrir caja fuerte</button></div>`}
function mount(){
  injectStyles();const main=$v('main');if(main&&!$v('#contactVaultScreen'))main.insertAdjacentHTML('beforeend',screenHTML());
  const moreGrid=$v('[data-screen="more"] .grid.two');if(moreGrid&&!$v('#contactVaultCard'))moreGrid.insertAdjacentHTML('afterbegin',moreCardHTML());
}
function showVault(){
  $$v('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen==='vault'));$$v('.navbtn').forEach(b=>b.classList.remove('active'));window.scrollTo({top:0,behavior:'smooth'});renderVault();
}
function backToMore(){
  $$v('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen==='more'));$$v('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.target==='more'));window.scrollTo({top:0,behavior:'smooth'});
}
async function renderVault(){
  if(!$v('#vaultStats'))return;
  try{
    const [contacts,runs,auto,lastManual,lastSuccess]=await Promise.all([getAll('contacts'),getAll('runs'),getSetting('automationConfigured'),getSetting('lastManualRequestedAt'),getSetting('lastShortcutSuccessAt')]);
    const active=contacts.filter(c=>c.active).length,missing=contacts.length-active;
    $v('#vaultStats').innerHTML=[['Actuales',active],['Protegidos',contacts.length],['Desaparecidos',missing],['Copias',runs.length]].map(([l,n])=>`<div class="vault-stat"><strong>${n}</strong><span>${l}</span></div>`).join('');
    const lastRun=[...runs].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0];$v('#vaultHeadline').textContent=lastRun?`Última actividad: ${fmtDateTime(lastRun.createdAt)}`:'Importa tu primera lista para empezar';
    const configured=!!auto?.value;$v('#vaultAutomationBadge').textContent=configured?'ACTIVA':'PENDIENTE';$v('#vaultAutomationBadge').classList.toggle('green',configured);
    $v('#vaultAutomationText').innerHTML=configured?`Marcada como configurada. Último lanzamiento manual: <strong>${safe(fmtDateTime(lastManual?.value))}</strong>${lastSuccess?.value?`<br>Último retorno correcto: <strong>${safe(fmtDateTime(lastSuccess.value))}</strong>`:''}`:'Falta crear el Atajo y una automatización “Hora del día → Cada día”. El código ya está preparado para lanzarlo desde aquí.';
    const sortedRuns=[...runs].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,8);$v('#vaultHistory').innerHTML=sortedRuns.length?sortedRuns.map(r=>`<div class="vault-run"><div><strong>${safe(r.type.replaceAll('-',' '))}</strong><p>${safe(fmtDateTime(r.createdAt))} · ${r.total} vistos · +${r.added} nuevos${r.missing?` · ${r.missing} desaparecidos`:''}</p></div><span class="vault-chip">OK</span></div>`).join(''):'<div class="empty">Todavía no hay copias registradas.</div>';
    renderContacts(contacts);
  }catch(err){$v('#vaultHeadline').textContent='No se pudo abrir la bóveda';vaultToast('Error al abrir Contact Vault')}
}
function renderContacts(all){
  const q=($v('#vaultSearch')?.value||'').trim().toLowerCase();let rows=all||[];
  if(currentFilter==='active')rows=rows.filter(c=>c.active);else if(currentFilter==='missing')rows=rows.filter(c=>!c.active);
  if(q)rows=rows.filter(c=>[c.name,...(c.phones||[]),...(c.emails||[])].join(' ').toLowerCase().includes(q));
  rows.sort((a,b)=>String(a.name).localeCompare(String(b.name),'es'));$v('#vaultListCount').textContent=`${rows.length} mostrado${rows.length===1?'':'s'}`;
  $v('#vaultContacts').innerHTML=rows.length?rows.slice(0,250).map(c=>`<div class="vault-contact"><div class="vault-avatar">${safe(String(c.name||'?').split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase())}</div><div><h4>${safe(c.name)}</h4><p>${safe((c.phones||[]).join(' · ')||(c.emails||[]).join(' · '))}</p></div><span class="vault-chip ${c.active?'':'missing'}">${c.active?'ACTUAL':'GUARDADO'}</span></div>`).join('')+(rows.length>250?`<div class="empty">Mostrando 250 de ${rows.length}. Usa la búsqueda para filtrar.</div>`:''):'<div class="empty">No hay contactos en este filtro.</div>';
}
async function importSelected(file){
  try{vaultToast('Procesando contactos…');const rows=await parseFile(file);if(!rows.length)throw new Error('No encontré contactos válidos');const run=await mergeContacts(rows,{source:file.name.toLowerCase().endsWith('.vcf')?'vcard':file.name.toLowerCase().endsWith('.csv')?'csv':'json',fileName:file.name,fullSnapshot:true});await setSetting('lastImportAt',run.createdAt);await renderVault();vaultToast(`${run.total} contactos · ${run.added} nuevos · ${run.missing} desaparecidos`)}catch(err){vaultToast(`No se pudo importar: ${err.message}`)}
}
async function runManualBackup(){
  await snapshotCRM(false).catch(()=>{});await setSetting('lastManualRequestedAt',stamp());
  const base=`${location.origin}${location.pathname}`;const success=encodeURIComponent(`${base}?vault=1&backup=ok`);const cancel=encodeURIComponent(`${base}?vault=1&backup=cancel`);const error=encodeURIComponent(`${base}?vault=1&backup=error`);
  const url=`shortcuts://x-callback-url/run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}&input=text&text=${encodeURIComponent('manual|'+stamp())}&x-success=${success}&x-cancel=${cancel}&x-error=${error}`;
  location.href=url;setTimeout(()=>renderVault(),900);
}
async function handleCallback(){
  const p=new URLSearchParams(location.search);if(p.get('vault')!=='1')return;
  const status=p.get('backup');if(status==='ok'){await setSetting('lastShortcutSuccessAt',stamp());vaultToast('Atajo terminado correctamente')}else if(status==='error')vaultToast('El Atajo devolvió un error');else if(status==='cancel')vaultToast('Copia cancelada');
  history.replaceState({},'',location.pathname+location.hash);setTimeout(showVault,0);
}
function wire(){
  document.addEventListener('click',async e=>{
    if(e.target.closest('#openContactVault')){showVault();return}
    if(e.target.closest('#vaultBack')){backToMore();return}
    if(e.target.closest('#vaultBackupNow')){await runManualBackup();return}
    if(e.target.closest('#vaultImport')){$v('#vaultFile')?.click();return}
    if(e.target.closest('#vaultCreateShortcut')){location.href='shortcuts://create-shortcut';return}
    if(e.target.closest('#vaultOpenShortcut')){location.href=`shortcuts://open-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}`;return}
    if(e.target.closest('#vaultMarkAutomation')){await setSetting('automationConfigured',true);await setSetting('automationConfiguredAt',stamp());await renderVault();vaultToast('Automatización marcada como configurada');return}
    if(e.target.closest('#vaultExportVCF')){await exportRecovery();return}
    if(e.target.closest('#vaultExportJSON')){await exportJSON();return}
    const f=e.target.closest('[data-vault-filter]');if(f){currentFilter=f.dataset.vaultFilter;$$v('[data-vault-filter]').forEach(b=>b.classList.toggle('active',b===f));renderContacts(await getAll('contacts'));return}
  });
  document.addEventListener('change',e=>{if(e.target.id==='vaultFile'){const file=e.target.files?.[0];if(file)importSelected(file);e.target.value=''}});
  document.addEventListener('input',async e=>{if(e.target.id==='vaultSearch')renderContacts(await getAll('contacts'))});
}
async function boot(){mount();wire();await maybeDailyCRM();await handleCallback();await renderVault()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

const IDENTITY_DB='kelo-contact-vault-v1';
const IDENTITY_DB_VERSION=1;
const $vi=(s,r=document)=>r.querySelector(s);
const nowIso=()=>new Date().toISOString();
const dayStamp=()=>new Date().toISOString().slice(0,10);
let identityDbPromise;

function reqVI(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
function txVI(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||new Error('Transacción cancelada'));tx.onerror=()=>reject(tx.error||new Error('Error de base de datos'))})}
function openIdentityDB(){
  if(identityDbPromise)return identityDbPromise;
  identityDbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(IDENTITY_DB,IDENTITY_DB_VERSION);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
  return identityDbPromise;
}
async function allVI(store){const db=await openIdentityDB();return reqVI(db.transaction(store,'readonly').objectStore(store).getAll())}

function canonicalPhone(value){
  const raw=String(value||'').trim().replace(/^tel:/i,'');
  const digits=raw.replace(/\D/g,'');
  if(!digits)return'';
  if(digits.length===10)return `+1${digits}`;
  if(digits.length===11&&digits.startsWith('1'))return `+${digits}`;
  if(raw.startsWith('+')||raw.startsWith('00'))return `+${digits}`;
  return digits;
}
function canonicalEmail(value){return String(value||'').trim().toLowerCase()}
function sourceList(contact){return [...new Set([...(contact.sources||[]),contact.source].filter(Boolean).map(String))]}
function bestName(names){
  const cleaned=[...new Set(names.map(v=>String(v||'').trim()).filter(Boolean))];
  const useful=cleaned.filter(n=>!/^(sin nombre|contacto whatsapp|unknown)$/i.test(n));
  return (useful.length?useful:cleaned).sort((a,b)=>b.length-a.length)[0]||'Sin nombre';
}
function minDate(values){const rows=values.filter(Boolean).map(v=>new Date(v)).filter(d=>!Number.isNaN(d.getTime()));return rows.length?new Date(Math.min(...rows.map(d=>d.getTime()))).toISOString():nowIso()}
function maxDate(values){const rows=values.filter(Boolean).map(v=>new Date(v)).filter(d=>!Number.isNaN(d.getTime()));return rows.length?new Date(Math.max(...rows.map(d=>d.getTime()))).toISOString():nowIso()}
function contactKeyFromMerged(contact){const phone=(contact.phones||[])[0];if(phone)return `phone:${String(phone).replace(/\D/g,'')}`;const email=(contact.emails||[])[0];return email?`email:${email}`:`vault:${crypto.randomUUID?.()||Date.now()}`}

async function reconcileVault(){
  const contacts=await allVI('contacts');
  if(!contacts.length)return {before:0,after:0,merged:0};
  const parent=contacts.map((_,i)=>i);
  const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i]}return i};
  const union=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a};
  const signatures=new Map();
  contacts.forEach((c,i)=>{
    const sigs=[...(c.phones||[]).map(p=>`p:${canonicalPhone(p)}`),...(c.emails||[]).map(e=>`e:${canonicalEmail(e)}`)].filter(x=>!/[pe]:$/.test(x));
    sigs.forEach(sig=>{if(signatures.has(sig))union(i,signatures.get(sig));else signatures.set(sig,i)});
  });
  const groups=new Map();contacts.forEach((c,i)=>{const root=find(i);if(!groups.has(root))groups.set(root,[]);groups.get(root).push(c)});
  const now=nowIso();
  const merged=[];
  for(const group of groups.values()){
    const phones=[...new Set(group.flatMap(c=>c.phones||[]).map(canonicalPhone).filter(Boolean))];
    const emails=[...new Set(group.flatMap(c=>c.emails||[]).map(canonicalEmail).filter(Boolean))];
    const aliases=[...new Set(group.flatMap(c=>[c.name,...(c.aliases||[])]).map(v=>String(v||'').trim()).filter(Boolean))];
    const sources=[...new Set(group.flatMap(sourceList))];
    const active=group.some(c=>c.active!==false);
    const record={
      name:bestName(aliases),phones,emails,aliases,sources,source:sources[0]||'vault',active,
      firstSeenAt:minDate(group.map(c=>c.firstSeenAt||c.updatedAt)),
      lastSeenAt:maxDate(group.map(c=>c.lastSeenAt||c.updatedAt)),
      updatedAt:group.length>1?now:maxDate(group.map(c=>c.updatedAt)),
      missingAt:active?null:maxDate(group.map(c=>c.missingAt).filter(Boolean))
    };
    record.key=contactKeyFromMerged(record);merged.push(record);
  }
  const db=await openIdentityDB();const tx=db.transaction(['contacts','runs'],'readwrite');const store=tx.objectStore('contacts');store.clear();merged.forEach(c=>store.put(c));
  const mergedCount=contacts.length-merged.length;
  tx.objectStore('runs').put({id:`reconcile_${Date.now()}`,createdAt:now,type:'reconcile',fileName:'Kelo Vault identity engine',total:contacts.length,added:0,updated:mergedCount,unchanged:merged.length-mergedCount,reactivated:0,missing:merged.filter(c=>!c.active).length,fullSnapshot:false,after:merged.length});
  await txVI(tx);
  return {before:contacts.length,after:merged.length,merged:mergedCount};
}

function csvCell(value){const s=String(value??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function contactsCSV(contacts){
  const head=['name','phone','email','status','sources'];
  const rows=contacts.map(c=>[c.name,(c.phones||[]).join(' | '),(c.emails||[]).join(' | '),c.active===false?'saved':'active',sourceList(c).join(' | ')]);
  return [head,...rows].map(row=>row.map(csvCell).join(',')).join('\n');
}
async function buildDriveFiles(){
  const contacts=await allVI('contacts');const runs=await allVI('runs');
  const payload={version:2,exportedAt:nowIso(),kind:'kelo-vault-backup',contacts,runs};
  const jsonText=JSON.stringify(payload,null,2);
  const csvText=contactsCSV(contacts);
  return {
    contacts,
    files:[
      new File([jsonText],`kelo-vault-${dayStamp()}.json.txt`,{type:'text/plain'}),
      new File([csvText],`kelo-vault-contacts-${dayStamp()}.csv`,{type:'text/csv'})
    ],
    raw:{jsonText,csvText}
  };
}
function downloadVI(name,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function toastVI(text){const host=$vi('#toast');if(host){host.textContent=text;host.classList.add('show');setTimeout(()=>host.classList.remove('show'),2600)}else alert(text)}
async function exportToDrive(){
  const bundle=await buildDriveFiles();if(!bundle.contacts.length)return toastVI('Primero importa o sincroniza contactos');
  const shareData={title:`Kelo Vault ${dayStamp()}`,text:'Backup de Kelo Vault. En iPhone elige Google Drive en Compartir.',files:bundle.files};
  try{
    if(navigator.share&&navigator.canShare?.({files:bundle.files})){
      await navigator.share(shareData);toastVI('Backup enviado a Compartir. Elige Google Drive.');return;
    }
  }catch(err){if(err?.name==='AbortError')return}
  downloadVI(`kelo-vault-${dayStamp()}.json`,bundle.raw.jsonText,'application/json');
  downloadVI(`kelo-vault-contacts-${dayStamp()}.csv`,bundle.raw.csvText,'text/csv');
  toastVI('Tu navegador no compartió archivos; descargué el backup para guardarlo en Drive');
}

function sourceStats(contacts){
  const counts=new Map();contacts.forEach(c=>sourceList(c).forEach(s=>counts.set(s,(counts.get(s)||0)+1)));
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]);
}
async function renderIdentityStatus(){
  const host=$vi('#vaultIdentityStatus');if(!host)return;
  const contacts=await allVI('contacts');const stats=sourceStats(contacts);
  host.innerHTML=stats.length?stats.slice(0,6).map(([name,count])=>`<span class="tag">${name.replaceAll('-',' ')} · ${count}</span>`).join(' '):'<span class="muted">Aún no hay fuentes importadas.</span>';
}
function refreshVault(){const open=$vi('#openContactVault');if(open)open.click();setTimeout(renderIdentityStatus,120)}

function injectIdentityUI(){
  const exportJson=$vi('#vaultExportJSON');if(!exportJson||$vi('#vaultExportDrive'))return;
  const recovery=exportJson.closest('.card');if(!recovery)return;
  const reconcile=document.createElement('button');reconcile.className='primary wide';reconcile.id='vaultReconcile';reconcile.textContent='Contrastar y unir duplicados';
  const drive=document.createElement('button');drive.className='primary wide';drive.id='vaultExportDrive';drive.textContent='Exportar backup a Google Drive';
  recovery.insertBefore(reconcile,recovery.querySelector('#vaultExportVCF'));
  recovery.insertBefore(drive,recovery.querySelector('#vaultExportVCF'));
  const info=document.createElement('div');info.className='notice vault-note';info.innerHTML='<strong>Identidad maestra:</strong> mismo teléfono = misma persona. Conservamos nombres alternos y todas sus fuentes.';
  recovery.appendChild(info);
  const stats=document.createElement('div');stats.id='vaultIdentityStatus';stats.className='vault-filter';stats.style.marginTop='8px';recovery.appendChild(stats);
  renderIdentityStatus();
}

async function upsertExternalContacts(rows,source='external'){
  const db=await openIdentityDB();const tx=db.transaction('contacts','readwrite');const store=tx.objectStore('contacts');const existing=await reqVI(store.getAll());
  const byPhone=new Map(),byEmail=new Map();existing.forEach(c=>{(c.phones||[]).forEach(p=>byPhone.set(canonicalPhone(p),c));(c.emails||[]).forEach(e=>byEmail.set(canonicalEmail(e),c))});
  for(const row of rows||[]){
    const phones=[...new Set((row.phones||[row.phone]).filter(Boolean).map(canonicalPhone).filter(Boolean))];
    const emails=[...new Set((row.emails||[row.email]).filter(Boolean).map(canonicalEmail).filter(Boolean))];
    const old=phones.map(p=>byPhone.get(p)).find(Boolean)||emails.map(e=>byEmail.get(e)).find(Boolean);
    const aliases=[...new Set([old?.name,row.name,...(old?.aliases||[])].filter(Boolean))];const sources=[...new Set([...(old?sourceList(old):[]),source])];
    const next={...(old||{}),name:bestName(aliases),aliases,sources,source:sources[0],phones:[...new Set([...(old?.phones||[]).map(canonicalPhone),...phones])],emails:[...new Set([...(old?.emails||[]).map(canonicalEmail),...emails])],active:true,lastSeenAt:nowIso(),updatedAt:nowIso(),firstSeenAt:old?.firstSeenAt||nowIso(),missingAt:null};
    next.key=old?.key||contactKeyFromMerged(next);store.put(next);
  }
  await txVI(tx);return reconcileVault();
}

function bootIdentity(){
  injectIdentityUI();
  const observer=new MutationObserver(()=>injectIdentityUI());observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',async e=>{
    if(e.target.closest('#vaultReconcile')){const btn=e.target.closest('#vaultReconcile');btn.disabled=true;btn.textContent='Contrastando…';try{const r=await reconcileVault();toastVI(r.merged?`Unidos ${r.merged} duplicados · ${r.after} personas únicas`:`Sin duplicados · ${r.after} personas únicas`);refreshVault()}catch(err){toastVI(`No se pudo contrastar: ${err.message}`)}finally{btn.disabled=false;btn.textContent='Contrastar y unir duplicados'}return}
    if(e.target.closest('#vaultExportDrive')){await exportToDrive();return}
    if(e.target.closest('#openContactVault'))setTimeout(renderIdentityStatus,120);
  });
}

window.KeloVault={reconcile:reconcileVault,exportToDrive,ingestContacts:upsertExternalContacts};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootIdentity,{once:true});else bootIdentity();

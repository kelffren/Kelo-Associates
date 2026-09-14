// Mature UI interaction layer — vanilla JS, no business logic mutation.
const q=(s,r=document)=>r.querySelector(s);const qa=(s,r=document)=>[...r.querySelectorAll(s)];

function loadProfitLedger(){
  if(!document.querySelector('link[href="daily-profit-ledger.css"]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='daily-profit-ledger.css';document.head.appendChild(link);
  }
  import('./daily-profit-ledger.js').catch(err=>console.warn('Daily profit ledger unavailable',err));
}

function enhanceMatureUI(){
  document.documentElement.classList.add('mature-ui');

  // Accessible labels / current state.
  qa('[data-view]').forEach(btn=>{
    btn.setAttribute('role','tab');
    btn.setAttribute('aria-selected',btn.classList.contains('active')?'true':'false');
  });
  const tablist=q('.operator-tabs'); if(tablist) tablist.setAttribute('role','tablist');

  // Keep aria-selected in sync without touching existing navigation behavior.
  document.addEventListener('click',e=>{
    const tab=e.target.closest('[data-view]');
    if(tab) requestAnimationFrame(()=>qa('[data-view]').forEach(b=>b.setAttribute('aria-selected',b.classList.contains('active')?'true':'false')));
  });

  // Escape closes modal surfaces.
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape') return;
    const sale=q('#saleEntrySheet'); if(sale && !sale.hidden){sale.hidden=true;return}
    const task=q('#taskBuilder'); if(task && !task.hidden){q('#closeTaskBuilder')?.click();return}
    const alert=q('#hotAlert'); if(alert && !alert.hidden){q('#hotAlertClose')?.click()}
  });

  qa('.business-switch button,.operator-tabs button,.task-actions button,.task-presets button').forEach(b=>{
    if(!b.hasAttribute('type')) b.type='button';
  });

  const activeBiz=()=>q('.business-switch button.active')?.textContent?.trim()||'Todo';
  const activeView=()=>q('.operator-tabs button.active')?.textContent?.trim()||'HOY';
  const updateTitle=()=>{document.title=`${activeView()} · ${activeBiz()} — Kelo`};
  document.addEventListener('click',e=>{if(e.target.closest('[data-view],[data-business]')) requestAnimationFrame(updateTitle)});
  updateTitle();

  ['#todayKpis','#todayActions','#chatCards','#orderCards','#productCards','#moneyCards','#collectionsLedger'].forEach(sel=>{
    const el=q(sel);if(el){el.setAttribute('aria-live','polite');el.setAttribute('aria-atomic','false')}
  });

  const save=q('#saveStructuredTask');
  if(save){save.addEventListener('click',()=>{save.dataset.busy='true';setTimeout(()=>delete save.dataset.busy,500)},{capture:true})}

  qa('input[type="time"],input[type="date"]').forEach(i=>i.addEventListener('focus',()=>{try{i.showPicker?.()}catch{}}));

  document.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(b&&!b.disabled)b.classList.add('is-pressed')});
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>document.addEventListener(ev,e=>e.target.closest('button')?.classList.remove('is-pressed')));

  loadProfitLedger();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhanceMatureUI);else enhanceMatureUI();

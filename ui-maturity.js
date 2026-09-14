// Mature UI interaction layer — vanilla JS, no business logic mutation.
const q=(s,r=document)=>r.querySelector(s);const qa=(s,r=document)=>[...r.querySelectorAll(s)];

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

  // Escape closes the two modal surfaces that currently exist.
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape') return;
    const task=q('#taskBuilder'); if(task && !task.hidden){q('#closeTaskBuilder')?.click();return}
    const alert=q('#hotAlert'); if(alert && !alert.hidden){q('#hotAlertClose')?.click()}
  });

  // Enter/Space activation parity on chip-like buttons supplied by dynamic modules.
  qa('.business-switch button,.operator-tabs button,.task-actions button,.task-presets button').forEach(b=>{
    if(!b.hasAttribute('type')) b.type='button';
  });

  // Better page title context for PWA/app switcher.
  const activeBiz=()=>q('.business-switch button.active')?.textContent?.trim()||'Todo';
  const activeView=()=>q('.operator-tabs button.active')?.textContent?.trim()||'HOY';
  const updateTitle=()=>{document.title=`${activeView()} · ${activeBiz()} — Kelo`};
  document.addEventListener('click',e=>{if(e.target.closest('[data-view],[data-business]')) requestAnimationFrame(updateTitle)});
  updateTitle();

  // Mark dynamic content areas as polite live regions for screen readers.
  ['#todayKpis','#todayActions','#chatCards','#orderCards','#productCards','#moneyCards','#collectionsLedger'].forEach(sel=>{
    const el=q(sel);if(el){el.setAttribute('aria-live','polite');el.setAttribute('aria-atomic','false')}
  });

  // Prevent accidental double submissions on the structured task save button.
  const save=q('#saveStructuredTask');
  if(save){save.addEventListener('click',()=>{save.dataset.busy='true';setTimeout(()=>delete save.dataset.busy,500)},{capture:true})}

  // Auto-select text where it saves taps on numeric/date style fields.
  qa('input[type="time"],input[type="date"]').forEach(i=>i.addEventListener('focus',()=>{try{i.showPicker?.()}catch{}}));

  // Mature touch feedback without vibration assumptions.
  document.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(b&&!b.disabled)b.classList.add('is-pressed')});
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>document.addEventListener(ev,e=>e.target.closest('button')?.classList.remove('is-pressed')));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhanceMatureUI);else enhanceMatureUI();

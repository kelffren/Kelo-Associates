const BRIDGE_URL='https://kelo-whatsapp-test-bridge-2fl3w8.v2.appdeploy.ai/';
const CALLBACK_URL=`${BRIDGE_URL}api/webhook`;

function mountWhatsAppBridge(){
  const grid=document.querySelector('[data-screen="more"] .grid.two');
  if(!grid||document.getElementById('whatsappTestBridgeCard'))return;
  const card=document.createElement('div');
  card.className='card stack';
  card.id='whatsappTestBridgeCard';
  card.innerHTML=`<div class="sectiontitle"><h3>WhatsApp 1 · Prueba</h3><span class="tag orange">WEBHOOK LISTO</span></div>
    <div class="notice">Puente HTTPS de prueba para WhatsApp Cloud API. Las credenciales de Meta se guardarán fuera de GitHub Pages.</div>
    <div class="metricrow"><span>Callback</span><strong style="font-size:11px;max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${CALLBACK_URL}</strong></div>
    <a class="primary wide" href="${BRIDGE_URL}" target="_blank" rel="noopener noreferrer" style="text-align:center;text-decoration:none">Abrir WhatsApp 1 Bridge</a>
    <button class="secondary wide" id="copyWhatsAppCallback">Copiar Callback URL</button>`;
  grid.prepend(card);
  card.querySelector('#copyWhatsAppCallback')?.addEventListener('click',async e=>{
    try{await navigator.clipboard.writeText(CALLBACK_URL);e.currentTarget.textContent='Callback copiado';setTimeout(()=>e.currentTarget.textContent='Copiar Callback URL',1200)}catch{e.currentTarget.textContent='No se pudo copiar'}
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountWhatsAppBridge);else mountWhatsAppBridge();

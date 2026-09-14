const SW_URL='./service-worker.js';
const CHECK_INTERVAL=2*60*1000;
let checking=false;
let reloading=false;
let hadController='serviceWorker' in navigator&&!!navigator.serviceWorker.controller;
let lastCheck=0;

function updateBanner(text='Actualizando Kelo Associates…'){
  let el=document.getElementById('keloAutoUpdate');
  if(!el){
    el=document.createElement('div');
    el.id='keloAutoUpdate';
    Object.assign(el.style,{position:'fixed',left:'50%',bottom:'calc(92px + env(safe-area-inset-bottom, 0px))',transform:'translateX(-50%) translateY(16px)',zIndex:'99999',padding:'11px 15px',borderRadius:'999px',background:'rgba(17,17,17,.92)',color:'#fff',font:'600 13px -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif',boxShadow:'0 12px 34px rgba(0,0,0,.22)',backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)',opacity:'0',transition:'opacity .18s ease, transform .18s ease',pointerEvents:'none',whiteSpace:'nowrap'});
    document.body.appendChild(el);
  }
  el.textContent=text;
  requestAnimationFrame(()=>{el.style.opacity='1';el.style.transform='translateX(-50%) translateY(0)'});
  return el;
}

function hideBanner(){
  const el=document.getElementById('keloAutoUpdate');
  if(!el)return;
  el.style.opacity='0';
  el.style.transform='translateX(-50%) translateY(16px)';
}

function watchRegistration(reg){
  if(reg.waiting&&navigator.serviceWorker.controller){
    updateBanner();
    reg.waiting.postMessage({type:'SKIP_WAITING'});
  }
  reg.addEventListener('updatefound',()=>{
    const worker=reg.installing;
    if(!worker)return;
    worker.addEventListener('statechange',()=>{
      if(worker.state==='installed'&&navigator.serviceWorker.controller){
        updateBanner();
        if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
      }
    });
  });
}

async function checkForUpdate(force=false){
  if(!('serviceWorker' in navigator)||checking||!navigator.onLine)return;
  const now=Date.now();
  if(!force&&now-lastCheck<15000)return;
  checking=true;lastCheck=now;
  try{
    let reg=await navigator.serviceWorker.getRegistration('./');
    if(!reg){
      reg=await navigator.serviceWorker.register(SW_URL,{scope:'./',updateViaCache:'none'});
      watchRegistration(reg);
      return;
    }
    if(!reg.__keloWatched){watchRegistration(reg);reg.__keloWatched=true}
    await reg.update();
  }catch(err){
    console.warn('[Kelo updater] No se pudo comprobar actualización',err);
    hideBanner();
  }finally{checking=false}
}

if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!hadController){hadController=true;return}
    if(reloading)return;
    reloading=true;
    updateBanner('Nueva versión lista. Actualizando…');
    setTimeout(()=>location.reload(),450);
  });

  window.addEventListener('load',()=>checkForUpdate(true));
  window.addEventListener('online',()=>checkForUpdate(true));
  window.addEventListener('focus',()=>checkForUpdate());
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkForUpdate(true)});
  setInterval(()=>checkForUpdate(),CHECK_INTERVAL);
}

export {checkForUpdate};

const CORE_KEY='kelo-associates-v2';
const OP_KEY='kelo-operator-v1';
const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n||0));

function load(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}}
function core(){return load(CORE_KEY,{clients:[],conversations:[],sales:[],tasks:[]})}
function operator(){return load(OP_KEY,{filter:'all',orders:[],products:[],tasks:[],promises:[],manualChats:[]})}
function saveOperator(state){localStorage.setItem(OP_KEY,JSON.stringify(state))}
function businessOK(item,filter){return filter==='all'||item.business===filter}

function heatFromConversation(conv,client){
  let score=0; const reasons=[]; const text=(conv.lastMessage||'').toLowerCase();
  if((client.interests||[]).length){score+=18;reasons.push('producto definido')}
  if(/precio|\$|cu[aá]nto|price/.test(text)){score+=18;reasons.push('precio')}
  if(/hoy|today|ahora|now|mañana|tomorrow/.test(text)){score+=20;reasons.push('timing')}
  if(/delivery|entrega|pickup|recoger|ubicaci[oó]n|bronx|queens|manhattan|nj/.test(text)){score+=18;reasons.push('logística')}
  if(/quiero|lo llevo|perfecto|nos vemos|comprar|buy/.test(text)){score+=22;reasons.push('intención')}
  if(conv.unread>0)score+=4;
  return {score:Math.min(100,score),reasons};
}

function allChats(c,o){
  const fromCore=(c.conversations||[]).map(conv=>{
    const client=(c.clients||[]).find(x=>x.id===conv.clientId)||{};
    const h=heatFromConversation(conv,client);
    return {id:conv.id,business:'watches',name:client.name||'Cliente',product:(client.interests||[])[0]||'Reloj',heat:Math.max(h.score,conv.leadTemp==='hot'?78:conv.leadTemp==='warm'?52:25),summary:conv.lastMessage||'',signals:h.reasons,unread:Number(conv.unread||0)};
  });
  const names=new Set(fromCore.map(x=>x.name));
  return [...fromCore,...(o.manualChats||[]).filter(x=>!names.has(x.name))];
}

function urgencyFromText(text=''){
  const t=text.toLowerCase();
  if(/hoy|today|ahora|now|vencid|overdue/.test(t))return 100;
  if(/mañana|tomorrow/.test(t))return 78;
  if(/esta semana|this week|viernes|sábado|sabado|domingo/.test(t))return 58;
  return 38;
}

function scoreAction({moneyValue=0,heat=0,urgency=40,risk=30,effort=20}){
  const value=Math.min(100,Math.log10(Math.max(1,moneyValue)+1)*32);
  return Math.round(value*.25 + heat*.30 + urgency*.25 + risk*.15 + (100-effort)*.05);
}

function buildNextActions(){
  const c=core(),o=operator(),filter=o.filter||'all'; const actions=[];
  const chats=allChats(c,o).filter(x=>businessOK(x,filter));

  chats.forEach(chat=>{
    const value=(o.orders||[]).find(x=>x.customer===chat.name)?.total || (/zara/i.test(chat.business)?400:/moissan/i.test(chat.business)?700:200);
    const urgency=urgencyFromText(chat.summary);
    const priority=scoreAction({moneyValue:value,heat:chat.heat,urgency,risk:chat.unread?75:45,effort:15});
    let verb='FOLLOW UP',reason='Mantener momentum';
    if(chat.heat>=88){verb='CLOSE NOW';reason='Intención alta + señales de compra'}
    else if(chat.heat>=72){verb='TAKE OVER';reason='Lead caliente antes de que enfríe'}
    actions.push({id:'chat:'+chat.id,business:chat.business,kind:'chat',priority,verb,title:`${chat.name} · ${chat.product}`,detail:chat.summary,value,heat:chat.heat,reason,target:chat.id});
  });

  (o.orders||[]).filter(x=>businessOK(x,filter)&&x.total>x.paid).forEach(order=>{
    const balance=order.total-order.paid;
    const priority=scoreAction({moneyValue:balance,heat:82,urgency:88,risk:90,effort:10});
    actions.push({id:'collect:'+order.id,business:order.business,kind:'collect',priority,verb:`COLLECT ${money(balance)}`,title:order.customer,detail:`${order.item} · ${order.status}`,value:balance,heat:82,reason:'Dinero ya vendido pero no cobrado',target:order.id});
  });

  (o.products||[]).filter(x=>businessOK(x,filter)&&x.stock<=x.reorderAt).forEach(product=>{
    const lostDemand=Math.max(0,product.asks7d-product.stock)*Number(product.price||0);
    const urgency=product.stock<=product.reserved?95:74;
    const priority=scoreAction({moneyValue:lostDemand,heat:Math.min(95,50+product.asks7d*4),urgency,risk:85,effort:25});
    actions.push({id:'buy:'+product.id,business:product.business,kind:'buy',priority,verb:'BUY STOCK',title:product.name,detail:`${product.stock} disponibles · ${product.reserved} reservados · ${product.asks7d} interesados/7d`,value:lostDemand,heat:Math.min(95,50+product.asks7d*4),reason:'Demanda supera stock disponible',target:product.id});
  });

  (o.promises||[]).filter(x=>businessOK(x,filter)&&!x.resolved).forEach(p=>{
    const priority=scoreAction({moneyValue:150,heat:65,urgency:urgencyFromText(p.text),risk:95,effort:8});
    actions.push({id:'promise:'+p.id,business:p.business,kind:'promise',priority,verb:'KEEP PROMISE',title:p.customer,detail:p.text,value:0,heat:65,reason:'Promesa al cliente pendiente',target:p.id});
  });

  (o.tasks||[]).filter(x=>businessOK(x,filter)&&!x.done).forEach(t=>{
    const priority=scoreAction({moneyValue:t.type==='collect'?250:t.type==='purchase'?200:100,heat:55,urgency:urgencyFromText(`${t.dueText||''} ${t.title||''}`),risk:t.priority==='high'?90:65,effort:20});
    actions.push({id:'task:'+t.id,business:t.business,kind:'task',priority,verb:(t.action||t.type||'TASK').toString().toUpperCase(),title:t.customer||t.title,detail:t.product?`${t.product} · ${t.dueText||''}`:`${t.title} · ${t.dueText||''}`,value:0,heat:55,reason:'Tarea pendiente',target:t.id});
  });

  return actions.sort((a,b)=>b.priority-a.priority);
}

function actionMarkup(a,index){
  const badge=a.priority>=85?'CRITICAL':a.priority>=70?'NOW':a.priority>=55?'SOON':'LATER';
  return `<article class="op-card" data-nae-card="${a.id}">
    <div class="op-card-head"><div><small>${index+1}. ${a.verb} · ${String(a.business||'general').toUpperCase()}</small><h3>${a.title}</h3></div><span class="heat-pill">${a.priority} · ${badge}</span></div>
    <div class="heat-track"><i style="width:${a.priority}%"></i></div>
    <p>${a.detail||''}</p><p><small>WHY: ${a.reason}${a.value?` · ${money(a.value)} at stake`:''}</small></p>
    <div class="inline-actions"><button class="primary" data-nae-do="${a.id}">${a.verb}</button><button class="secondary" data-nae-snooze="${a.id}">SNOOZE</button></div>
  </article>`;
}

function renderNextActions(){
  const actions=buildNextActions(); const host=$('#todayActions'); if(!host)return;
  host.innerHTML=actions.slice(0,8).map(actionMarkup).join('')||'<div class="op-card"><p>Nada importante ahora.</p></div>';
  const title=$('#attentionTitle'); if(title)title.textContent=actions.length?`Tus ${Math.min(actions.length,8)} próximas acciones, ordenadas por impacto.`:'Todo bajo control.';
  const kpis=$('#todayKpis'); if(kpis){
    const now=actions.filter(x=>x.priority>=70).length;
    const moneyAtStake=actions.filter(x=>['collect','chat'].includes(x.kind)).reduce((n,x)=>n+Number(x.value||0),0);
    const buys=actions.filter(x=>x.kind==='buy').length;
    const promises=actions.filter(x=>x.kind==='promise').length;
    kpis.innerHTML=[[now,'Actuar ahora'],[money(moneyAtStake),'Dinero en juego'],[buys,'Comprar stock'],[promises,'Promesas pendientes']].map(([v,l])=>`<div class="kpi"><small>${l}</small><strong>${v}</strong></div>`).join('');
  }
}

function completeOrAdvance(action){
  const o=operator();
  if(action.kind==='task'){
    const t=(o.tasks||[]).find(x=>x.id===action.target); if(t)t.done=true;
  }else if(action.kind==='promise'){
    const p=(o.promises||[]).find(x=>x.id===action.target); if(p)p.resolved=true;
  }else if(action.kind==='collect'){
    const order=(o.orders||[]).find(x=>x.id===action.target); if(order){order.paid=order.total;order.status=order.status==='reserved'?'paid':order.status;}
  }else if(action.kind==='buy'){
    const p=(o.products||[]).find(x=>x.id===action.target); if(p){
      o.tasks.unshift({id:'task_'+Date.now(),title:`Comprar ${p.name}`,business:p.business,customer:'',product:p.name,action:'purchase',type:'purchase',dueText:'Hoy',priority:'high',done:false});
    }
  }
  saveOperator(o); window.dispatchEvent(new Event('kelo:next-action-updated')); renderNextActions();
}

function snooze(action){
  const o=operator();
  o.tasks.unshift({id:'task_'+Date.now(),title:`Revisar: ${action.title}`,business:action.business,customer:action.title,action:'followup',type:'followup',dueText:'En 1 hora',priority:'medium',done:false});
  saveOperator(o); renderNextActions();
}

document.addEventListener('click',e=>{
  const doBtn=e.target.closest('[data-nae-do]');
  const snoozeBtn=e.target.closest('[data-nae-snooze]');
  if(!doBtn&&!snoozeBtn)return;
  const id=(doBtn||snoozeBtn).dataset.naeDo||(doBtn||snoozeBtn).dataset.naeSnooze;
  const action=buildNextActions().find(x=>x.id===id); if(!action)return;
  if(doBtn)completeOrAdvance(action); else snooze(action);
});

window.addEventListener('storage',renderNextActions);
window.addEventListener('kelo:next-action-updated',renderNextActions);
window.addEventListener('DOMContentLoaded',()=>setTimeout(renderNextActions,0));
setTimeout(renderNextActions,200);

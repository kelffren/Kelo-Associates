const PROFIT_KEY='kelo-daily-profit-v1';
const $=(s,r=document)=>r.querySelector(s);
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n||0));
const uid=()=>`sale_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;

function load(){try{return JSON.parse(localStorage.getItem(PROFIT_KEY)||'[]')}catch{return []}}
function save(rows){localStorage.setItem(PROFIT_KEY,JSON.stringify(rows))}
function todayKey(){return new Date().toISOString().slice(0,10)}
function num(v){return Math.max(0,Number(v||0))}
function calc(row){const costs=num(row.itemCost)+num(row.boxCost)+num(row.gasCost)+num(row.tollCost)+num(row.otherCost);const revenue=num(row.soldFor);return {...row,totalCost:costs,profit:revenue-costs,margin:revenue?((revenue-costs)/revenue)*100:0}}

function ensureUI(){const moneyPanel=document.querySelector('[data-view-panel="money"]');if(!moneyPanel||document.getElementById('dailyProfitLedger'))return;
  const section=document.createElement('section');section.id='dailyProfitLedger';section.className='profit-ledger';section.innerHTML=`
    <div class="profit-head"><div><small>VENTAS DEL DÍA</small><h2>Beneficio real</h2><p>Venta menos producto, caja, gasolina, tolls y otros gastos.</p></div><button class="primary" id="openSaleEntry">＋ REGISTRAR VENTA</button></div>
    <div class="kpi-grid" id="profitKpis"></div>
    <div class="stack" id="profitRows"></div>
  `;moneyPanel.appendChild(section);

  const sheet=document.createElement('div');sheet.className='task-sheet-back';sheet.id='saleEntrySheet';sheet.hidden=true;sheet.innerHTML=`
    <section class="task-sheet" role="dialog" aria-modal="true" aria-labelledby="saleEntryTitle">
      <div class="task-sheet-handle"></div>
      <div class="task-sheet-head"><div><small>NUEVA VENTA</small><h2 id="saleEntryTitle">¿Cuánto dejó realmente?</h2></div><button class="task-close" id="closeSaleEntry" aria-label="Cerrar">×</button></div>
      <div class="task-form-grid two">
        <label>Negocio<select id="saleBusiness"><option value="watches">⌚ Relojes</option><option value="zara">👗 Zara</option><option value="moissanite">💎 Moissanita</option></select></label>
        <label>Cliente<input id="saleCustomer" placeholder="Ej. Carlos"></label>
      </div>
      <label class="task-note">Producto<input id="saleProduct" placeholder="Ej. Daytona Black"></label>
      <div class="task-form-grid two">
        <label>Vendí en<input id="saleSoldFor" inputmode="decimal" type="number" min="0" placeholder="200"></label>
        <label>Me costó<input id="saleItemCost" inputmode="decimal" type="number" min="0" placeholder="40"></label>
        <label>Caja<input id="saleBoxCost" inputmode="decimal" type="number" min="0" placeholder="0"></label>
        <label>Gasolina<input id="saleGasCost" inputmode="decimal" type="number" min="0" placeholder="0"></label>
        <label>Tolls<input id="saleTollCost" inputmode="decimal" type="number" min="0" placeholder="0"></label>
        <label>Otros<input id="saleOtherCost" inputmode="decimal" type="number" min="0" placeholder="0"></label>
      </div>
      <div class="profit-preview" id="saleProfitPreview">Beneficio estimado: $0</div>
      <button class="primary task-save" id="saveSaleEntry">GUARDAR VENTA</button>
    </section>`;document.body.appendChild(sheet);

  $('#openSaleEntry').addEventListener('click',()=>{sheet.hidden=false;preview()});
  $('#closeSaleEntry').addEventListener('click',()=>sheet.hidden=true);
  sheet.addEventListener('click',e=>{if(e.target===sheet)sheet.hidden=true});
  ['saleSoldFor','saleItemCost','saleBoxCost','saleGasCost','saleTollCost','saleOtherCost'].forEach(id=>$('#'+id).addEventListener('input',preview));
  $('#saveSaleEntry').addEventListener('click',saveEntry);
  render();
}

function preview(){const revenue=num($('#saleSoldFor')?.value);const cost=['saleItemCost','saleBoxCost','saleGasCost','saleTollCost','saleOtherCost'].reduce((s,id)=>s+num($('#'+id)?.value),0);const profit=revenue-cost;const el=$('#saleProfitPreview');if(el){el.textContent=`Beneficio estimado: ${money(profit)} · Costos ${money(cost)}`;el.dataset.positive=profit>=0?'true':'false'}}

function saveEntry(){const row=calc({id:uid(),date:todayKey(),createdAt:new Date().toISOString(),business:$('#saleBusiness').value,customer:$('#saleCustomer').value.trim(),product:$('#saleProduct').value.trim(),soldFor:num($('#saleSoldFor').value),itemCost:num($('#saleItemCost').value),boxCost:num($('#saleBoxCost').value),gasCost:num($('#saleGasCost').value),tollCost:num($('#saleTollCost').value),otherCost:num($('#saleOtherCost').value)});if(!row.product||row.soldFor<=0)return;const rows=load();rows.unshift(row);save(rows);$('#saleEntrySheet').hidden=true;['saleCustomer','saleProduct','saleSoldFor','saleItemCost','saleBoxCost','saleGasCost','saleTollCost','saleOtherCost'].forEach(id=>$('#'+id).value='');render();window.dispatchEvent(new CustomEvent('kelo:sale-profit-saved',{detail:row}))}

function render(){const rows=load().filter(r=>r.date===todayKey()).map(calc);const revenue=rows.reduce((s,r)=>s+r.soldFor,0),cost=rows.reduce((s,r)=>s+r.totalCost,0),profit=rows.reduce((s,r)=>s+r.profit,0);const k=$('#profitKpis'),list=$('#profitRows');if(k)k.innerHTML=[[rows.length,'Ventas hoy'],[money(revenue),'Vendido'],[money(cost),'Costos reales'],[money(profit),'Ganancia neta']].map(([v,l])=>`<div class="kpi"><small>${l}</small><strong>${v}</strong></div>`).join('');if(list)list.innerHTML=rows.map(r=>`<article class="op-card profit-row"><div class="op-card-head"><div><small>${r.business.toUpperCase()}</small><h3>${r.customer||'Cliente'} · ${r.product}</h3></div><strong class="${r.profit>=0?'money-positive':'money-due'}">${money(r.profit)}</strong></div><p>Venta ${money(r.soldFor)} · Compra ${money(r.itemCost)} · Caja ${money(r.boxCost)} · Gas ${money(r.gasCost)} · Tolls ${money(r.tollCost)}${r.otherCost?` · Otros ${money(r.otherCost)}`:''}</p><div class="profit-breakdown"><span>Costo total <b>${money(r.totalCost)}</b></span><span>Margen <b>${r.margin.toFixed(1)}%</b></span></div></article>`).join('')||'<div class="op-card empty-state"><h3>No hay ventas registradas hoy</h3><p>Cuando cierres una, registra precio y costos para ver la ganancia real del día.</p></div>'}

document.addEventListener('DOMContentLoaded',ensureUI);
window.addEventListener('storage',e=>{if(e.key===PROFIT_KEY)render()});

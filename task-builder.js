const OP_KEY='kelo-operator-v1';
const CORE_KEY='kelo-associates-v2';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=(p='id')=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;

const sheet=$('#taskBuilder');
const business=$('#taskBusiness');
const customer=$('#taskCustomer');
const product=$('#taskProduct');
const customWrap=$('#taskCustomProductWrap');
const customProduct=$('#taskCustomProduct');
const dateInput=$('#taskDate');
const timeInput=$('#taskTime');
const alertInput=$('#taskAlert');
const priority=$('#taskPriority');
const note=$('#taskNote');
const preview=$('#taskPreview');
let selectedAction='';

function loadJSON(key,fallback={}){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}}
function isoDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function setDateOffset(days){const d=new Date();d.setDate(d.getDate()+days);dateInput.value=isoDate(d)}

function populateCustomers(){
  const core=loadJSON(CORE_KEY,{clients:[]});
  const current=customer.value;
  customer.innerHTML='<option value="">Sin cliente</option>'+((core.clients||[]).map(c=>`<option value="${c.name}">${c.name}</option>`).join(''))+'<option value="__custom__">Otro cliente…</option>';
  if([...customer.options].some(o=>o.value===current))customer.value=current;
}

function productsForBusiness(b){
  const op=loadJSON(OP_KEY,{products:[]});
  const stored=(op.products||[]).filter(p=>b==='general'||p.business===b).map(p=>p.name);
  const defaults={
    watches:['Daytona Black','Daytona Panda','Submariner','Datejust','GMT','Caja'],
    zara:['Prendas mixtas','Vestidos','Tops','Jeans','Chaquetas','Lote mayorista'],
    moissanite:['Cuban Chain','Tennis Chain','Pulsera','Anillo','Cadena','Aretes'],
    general:[]
  };
  return [...new Set([...(stored||[]),...(defaults[b]||[])])];
}
function populateProducts(){
  const items=productsForBusiness(business.value);
  product.innerHTML='<option value="">Seleccionar producto</option>'+items.map(x=>`<option value="${x}">${x}</option>`).join('')+'<option value="__custom__">Otro…</option>';
  customWrap.hidden=true;customProduct.value='';
}

function getProduct(){return product.value==='__custom__'?customProduct.value.trim():product.value}
function updatePreview(){
  const who=customer.value&&customer.value!=='__custom__'?` para ${customer.value}`:'';
  const what=getProduct()?` · ${getProduct()}`:'';
  const when=dateInput.value?` · ${dateInput.value} ${timeInput.value||''}`:'';
  preview.textContent=selectedAction?`${selectedAction}${what}${who}${when} · alerta ${alertInput.value} min antes`:'Selecciona una acción para crear la tarea.';
}

function openBuilder(){
  populateCustomers();populateProducts();
  selectedAction='';$$('[data-task-action]').forEach(b=>b.classList.remove('active'));
  setDateOffset(0);timeInput.value='11:00';alertInput.value='15';priority.value='high';note.value='';
  $$('[data-when]').forEach(b=>b.classList.toggle('active',b.dataset.when==='today'));
  updatePreview();sheet.hidden=false;
}
function closeBuilder(){sheet.hidden=true}

$('#openTaskBuilder')?.addEventListener('click',openBuilder);
$('#closeTaskBuilder')?.addEventListener('click',closeBuilder);
sheet?.addEventListener('click',e=>{if(e.target===sheet)closeBuilder()});

$$('[data-task-action]').forEach(btn=>btn.addEventListener('click',()=>{
  $$('[data-task-action]').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');selectedAction=btn.dataset.taskAction;updatePreview();
}));

$$('[data-when]').forEach(btn=>btn.addEventListener('click',()=>{
  $$('[data-when]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
  if(btn.dataset.when==='today')setDateOffset(0);
  if(btn.dataset.when==='tomorrow')setDateOffset(1);
  if(btn.dataset.when==='2days')setDateOffset(2);
  if(btn.dataset.when==='custom')dateInput.focus();
  updatePreview();
}));

business?.addEventListener('change',()=>{populateProducts();updatePreview()});
customer?.addEventListener('change',updatePreview);
product?.addEventListener('change',()=>{customWrap.hidden=product.value!=='__custom__';if(!customWrap.hidden)customProduct.focus();updatePreview()});
customProduct?.addEventListener('input',updatePreview);
[dateInput,timeInput,alertInput,priority,note].forEach(el=>el?.addEventListener('input',updatePreview));

$('#saveStructuredTask')?.addEventListener('click',()=>{
  if(!selectedAction){preview.textContent='Elige primero una acción.';return}
  const op=loadJSON(OP_KEY,{tasks:[]});
  const taskProduct=getProduct();
  const taskCustomer=customer.value==='__custom__'?'Cliente':customer.value;
  const dueAt=dateInput.value?new Date(`${dateInput.value}T${timeInput.value||'11:00'}:00`).toISOString():null;
  const title=[selectedAction,taskProduct,taskCustomer?`para ${taskCustomer}`:''].filter(Boolean).join(' ');
  const task={
    id:uid('task'),title,business:business.value,customer:taskCustomer||'',product:taskProduct||'',type:selectedAction.toLowerCase().replaceAll(' ','_'),dueText:`${dateInput.value} ${timeInput.value}`,
    dueAt,alertBeforeMinutes:Number(alertInput.value||15),priority:priority.value,note:note.value.trim(),done:false,createdAt:new Date().toISOString(),source:'structured_task_builder'
  };
  op.tasks=Array.isArray(op.tasks)?op.tasks:[];op.tasks.unshift(task);localStorage.setItem(OP_KEY,JSON.stringify(op));
  preview.textContent=`✓ ${title} — tarea y alerta creadas.`;
  setTimeout(()=>location.reload(),450);
});

populateCustomers();populateProducts();setDateOffset(0);updatePreview();
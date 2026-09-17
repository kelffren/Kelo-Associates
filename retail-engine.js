const RETAIL_SCHEMA=1;
const uid=(prefix='id')=>`${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
const clone=value=>JSON.parse(JSON.stringify(value));

export const CURRENT_VERTICALS=['watches','zara','moissanite'];

export const VERTICAL_PROFILES={
  watches:{
    label:'Relojes',icon:'⌚',objective:'Cerrar rápido por modelo/estilo, caja y pickup/delivery.',
    questions:['¿Qué estilo/modelo buscas?','¿Lo quieres con caja o sin caja?','¿Pickup o delivery?','¿Lo quieres hoy?'],
    upsells:['Caja (+$85 cuando aplique)','Segundo modelo para comparar','Delivery'],
    guardrails:['No afirmar que un reloj es original/auténtico si no está verificado.','No inventar stock; consultar inventario antes de prometer.']
  },
  zara:{
    label:'Ropa Zara',icon:'👕',objective:'Convertir por talla/color/cantidad y empujar packs o mayorista cuando encaje.',
    questions:['¿Qué prenda buscas?','¿Qué talla y color?','¿Cuántas unidades necesitas?','¿Pickup o delivery?'],
    upsells:['28+ unidades: tier de delivery configurado','200+ unidades: tier mayorista','Combinar tallas/colores en el mismo pedido'],
    guardrails:['No vender una variante sin confirmar talla/color/stock.','Conservar procedencia/autenticidad documentada cuando se use una marca.']
  },
  moissanite:{
    label:'Aretes de moissanita',icon:'💎',objective:'Cerrar por tamaño, metal/acabado, par y método de entrega.',
    questions:['¿Qué tamaño de piedra buscas?','¿Qué metal/acabado prefieres?','¿Un par o varias unidades?','¿Pickup o delivery?'],
    upsells:['Tamaño superior','Segundo par/regalo','Delivery'],
    guardrails:['Describir la piedra como moissanita, no como diamante.','Un tester térmico por sí solo no demuestra que una piedra sea diamante.','No inventar precio: si no está configurado, pedir revisión humana.']
  }
};

const CATALOG={
  watches:[
    {sku:'WATCH-CORE',title:'Reloj',aliases:['watch','reloj','chronograph','cronografo','cronógrafo','panda','diver'],trackVariants:['style','box'],basePrice:200,boxPrice:285}
  ],
  zara:[
    {sku:'ZARA-UNIT',title:'Prenda Zara',aliases:['zara','ropa','shirt','camisa','pantalon','pantalón','dress','vestido','jacket','chaqueta'],trackVariants:['category','size','color'],basePrice:25}
  ],
  moissanite:[
    {sku:'MOISS-EARRINGS',title:'Aretes de moissanita',aliases:['moissanite','moissanita','aretes','earrings','studs'],trackVariants:['stoneSize','metal','finish'],basePrice:null}
  ]
};

function baseRetailState(){
  return {
    schema:RETAIL_SCHEMA,
    activeVerticals:[...CURRENT_VERTICALS],
    settings:{
      requireTrackedStock:true,
      moissaniteDefaultUnitPrice:null,
      zaraRetailPrice:25,
      zaraDeliveryTierMinQty:28,
      zaraDeliveryTierUnitPrice:19,
      zaraWholesaleMinQty:200,
      zaraWholesaleUnitPrice:15,
      watchNoBoxPrice:200,
      watchWithBoxPrice:285
    },
    inventory:{},orders:[],quotes:[],researchLog:[]
  };
}

export function ensureRetailState(state){
  if(!state||typeof state!=='object')throw new Error('Estado inválido');
  state.retail={...baseRetailState(),...(state.retail||{})};
  state.retail.settings={...baseRetailState().settings,...(state.retail.settings||{})};
  state.retail.activeVerticals=[...CURRENT_VERTICALS];
  state.retail.inventory=state.retail.inventory&&typeof state.retail.inventory==='object'?state.retail.inventory:{};
  state.retail.orders=Array.isArray(state.retail.orders)?state.retail.orders:[];
  state.retail.quotes=Array.isArray(state.retail.quotes)?state.retail.quotes:[];
  state.retail.researchLog=Array.isArray(state.retail.researchLog)?state.retail.researchLog:[];
  return state;
}

export function getVerticalProfile(vertical){
  return clone(VERTICAL_PROFILES[vertical]||VERTICAL_PROFILES.watches);
}

export function getCatalog(vertical){return clone(CATALOG[vertical]||[])}

function normalize(text=''){return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()}
function inventoryKey(vertical,sku,variantKey='default'){return `${vertical}:${sku}:${normalize(variantKey)||'default'}`}

export function setTrackedInventory(state,{vertical,sku,variantKey='default',quantity}){
  ensureRetailState(state);if(!CURRENT_VERTICALS.includes(vertical))throw new Error('Vertical no soportada');
  const qty=Number(quantity);if(!Number.isFinite(qty)||qty<0)throw new Error('Cantidad inválida');
  const key=inventoryKey(vertical,sku,variantKey);state.retail.inventory[key]={quantity:Math.floor(qty),updatedAt:new Date().toISOString()};return clone(state.retail.inventory[key]);
}

export function getTrackedInventory(state,{vertical,sku,variantKey='default'}){
  ensureRetailState(state);const record=state.retail.inventory[inventoryKey(vertical,sku,variantKey)];return record?clone(record):null;
}

export function searchRetailCatalog(state,{vertical,query=''}){
  ensureRetailState(state);const q=normalize(query);const rows=CATALOG[vertical]||[];
  const matched=!q?rows:rows.filter(p=>normalize([p.title,p.sku,...(p.aliases||[])].join(' ')).includes(q)||q.split(/\s+/).some(token=>normalize([p.title,...(p.aliases||[])].join(' ')).includes(token)));
  return clone(matched);
}

export function quoteRetail(state,{vertical,sku,quantity=1,withBox=false,manualUnitPrice=null,variantKey='default'}={}){
  ensureRetailState(state);const qty=Math.max(1,Math.floor(Number(quantity||1)));let unitPrice=null;let tier='standard';let needsManualPrice=false;
  if(vertical==='watches')unitPrice=withBox?Number(state.retail.settings.watchWithBoxPrice):Number(state.retail.settings.watchNoBoxPrice);
  else if(vertical==='zara'){
    if(qty>=Number(state.retail.settings.zaraWholesaleMinQty)){unitPrice=Number(state.retail.settings.zaraWholesaleUnitPrice);tier='wholesale'}
    else if(qty>=Number(state.retail.settings.zaraDeliveryTierMinQty)){unitPrice=Number(state.retail.settings.zaraDeliveryTierUnitPrice);tier='delivery-tier'}
    else unitPrice=Number(state.retail.settings.zaraRetailPrice);
  }else if(vertical==='moissanite'){
    const candidate=manualUnitPrice!==null&&manualUnitPrice!==''?Number(manualUnitPrice):Number(state.retail.settings.moissaniteDefaultUnitPrice);
    if(Number.isFinite(candidate)&&candidate>0)unitPrice=candidate;else needsManualPrice=true;
  }else throw new Error('Vertical no soportada');
  const quote={id:uid('q'),vertical,sku:sku||CATALOG[vertical]?.[0]?.sku||'',variantKey,quantity:qty,unitPrice,subtotal:unitPrice===null?null:unitPrice*qty,tier,withBox:!!withBox,needsManualPrice,createdAt:new Date().toISOString()};
  state.retail.quotes.unshift(quote);return clone(quote);
}

export function scoreRetailIntent({readyToBuy=false,askedPrice=false,askedAvailability=false,fulfillment='',quantity=1,product='',variantComplete=false}={}){
  let score=10;if(readyToBuy)score+=35;if(askedPrice)score+=10;if(askedAvailability)score+=10;if(String(fulfillment).trim())score+=10;if(String(product).trim())score+=10;if(variantComplete)score+=10;
  const qty=Number(quantity||1);if(qty>=200)score+=15;else if(qty>=28)score+=10;else if(qty>=2)score+=5;
  return Math.max(0,Math.min(100,Math.round(score)));
}

export function retailTemperature(score){return score>=65?'hot':score>=40?'warm':'cold'}

export function reserveRetailInventory(state,{vertical,sku,variantKey='default',quantity=1}={}){
  ensureRetailState(state);const qty=Math.max(1,Math.floor(Number(quantity||1)));const key=inventoryKey(vertical,sku,variantKey);const record=state.retail.inventory[key];
  if(!record)return {status:'needs_stock_confirmation',reserved:false,available:null};
  if(Number(record.quantity)<qty)return {status:'insufficient_stock',reserved:false,available:Number(record.quantity)};
  record.quantity-=qty;record.updatedAt=new Date().toISOString();return {status:'reserved',reserved:true,available:Number(record.quantity)};
}

export function createRetailOrder(state,{clientId,vertical,sku,variantKey='default',quantity=1,unitPrice,total,fulfillment='pickup',reservationStatus='needs_stock_confirmation',notes=''}={}){
  ensureRetailState(state);if(!clientId)throw new Error('clientId requerido');if(!CURRENT_VERTICALS.includes(vertical))throw new Error('Vertical no soportada');
  const order={id:uid('ord'),clientId,vertical,sku,variantKey,quantity:Number(quantity||1),unitPrice:Number(unitPrice||0),total:Number(total||0),fulfillment,status:reservationStatus==='reserved'?'pending_payment':'needs_stock_confirmation',reservationStatus,notes,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  state.retail.orders.unshift(order);return clone(order);
}

export function buildSalesPlaybook(vertical,{quantity=1,withBox=false,fulfillment=''}={}){
  const p=getVerticalProfile(vertical);const next=[...p.questions];
  if(vertical==='watches'&&withBox)next.unshift('Confirmar variante exacta y stock de la versión con caja.');
  if(vertical==='zara'&&Number(quantity)>=28)next.unshift('Confirmar tallas/colores por variante antes de cerrar el pack.');
  if(vertical==='moissanite')next.unshift('Confirmar precio configurado, tamaño y metal antes de enviar link de pago.');
  if(!fulfillment)next.unshift('Definir pickup o delivery.');
  return {...p,next};
}

export function getRetailMetrics(state){
  ensureRetailState(state);const today=new Date().toISOString().slice(0,10);const orders=state.retail.orders.filter(o=>String(o.createdAt).slice(0,10)===today);const pending=orders.filter(o=>o.status==='pending_payment');const stockChecks=orders.filter(o=>o.status==='needs_stock_confirmation');const value=pending.reduce((n,o)=>n+Number(o.total||0),0);return {orders:orders.length,pendingPayment:pending.length,stockChecks:stockChecks.length,pipelineValue:value};
}

export {RETAIL_SCHEMA};

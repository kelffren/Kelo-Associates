import assert from 'node:assert/strict';
import {ensureRetailState,quoteRetail,setTrackedInventory,reserveRetailInventory,scoreRetailIntent} from '../retail-engine.js';
import {ensureVoiceState,runDemoRetailSale,getVoiceMetrics} from '../voice-core.js';

const state=ensureVoiceState(ensureRetailState({
  meta:{version:2,createdAt:new Date().toISOString()},
  clients:[],tasks:[],appointments:[],opportunities:[],timeline:[],agents:[{id:'agent_kelo',name:'Kelo'}]
}));

assert.equal(quoteRetail(state,{vertical:'watches',sku:'WATCH-CORE',quantity:1,withBox:false}).subtotal,200);
assert.equal(quoteRetail(state,{vertical:'watches',sku:'WATCH-CORE',quantity:1,withBox:true}).subtotal,285);
assert.equal(quoteRetail(state,{vertical:'zara',sku:'ZARA-UNIT',quantity:28}).unitPrice,19);
assert.equal(quoteRetail(state,{vertical:'zara',sku:'ZARA-UNIT',quantity:200}).unitPrice,15);
assert.equal(quoteRetail(state,{vertical:'moissanite',sku:'MOISS-EARRINGS',quantity:1}).needsManualPrice,true);
assert.ok(scoreRetailIntent({readyToBuy:true,askedPrice:true,askedAvailability:true,fulfillment:'pickup',quantity:1,product:'Reloj',variantComplete:true})>=65);

setTrackedInventory(state,{vertical:'zara',sku:'ZARA-UNIT',variantKey:'mixed-pack',quantity:100});
const reservation=reserveRetailInventory(state,{vertical:'zara',sku:'ZARA-UNIT',variantKey:'mixed-pack',quantity:28});
assert.equal(reservation.reserved,true);
assert.equal(reservation.available,72);

const result=runDemoRetailSale(state,{
  name:'Retail Test',phone:'+1 917 555 0101',vertical:'zara',language:'es',product:'Prenda Zara',variantKey:'mixed-pack-2',quantity:28,fulfillment:'delivery',readyToBuy:true,variantComplete:true,stockConfirmed:true,stockAvailable:100
});
assert.equal(result.qualification.qualified,true);
assert.equal(result.quote.unitPrice,19);
assert.equal(result.order.status,'pending_payment');
assert.equal(result.order.total,532);
assert.equal(result.payment.status,'backend-required');
assert.ok(state.voice.actions.some(a=>a.type==='external_stub'));

const metrics=getVoiceMetrics(state);
assert.equal(metrics.orders,1);
console.log('retail-smoke: ok');

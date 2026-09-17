import assert from 'node:assert/strict';
import {mergeStates} from '../remote-sync.js';

const remote={
  meta:{version:2,updatedAt:'2026-09-17T10:00:00Z'},
  clients:[{id:'c1',name:'Old',updatedAt:'2026-09-17T09:00:00Z'},{id:'c2',name:'Remote only',updatedAt:'2026-09-17T10:00:00Z'}],
  retail:{inventory:{'watches:WATCH-CORE:panda':{quantity:4,updatedAt:'2026-09-17T10:00:00Z'}},orders:[]},
  voice:{calls:[],actions:[],automationRuns:[]}
};
const local={
  meta:{version:2,updatedAt:'2026-09-17T10:01:00Z'},
  clients:[{id:'c1',name:'New',updatedAt:'2026-09-17T10:01:00Z'}],
  retail:{inventory:{'watches:WATCH-CORE:panda':{quantity:3,updatedAt:'2026-09-17T10:01:00Z'}},orders:[{id:'o1',status:'pending_payment',updatedAt:'2026-09-17T10:01:00Z'}]},
  voice:{calls:[{id:'call1',updatedAt:'2026-09-17T10:01:00Z'}],actions:[],automationRuns:[]}
};
const merged=mergeStates(local,remote);
assert.equal(merged.clients.find(x=>x.id==='c1').name,'New');
assert.equal(merged.clients.find(x=>x.id==='c2').name,'Remote only');
assert.equal(merged.retail.inventory['watches:WATCH-CORE:panda'].quantity,3);
assert.equal(merged.retail.orders.length,1);
assert.equal(merged.voice.calls.length,1);
console.log('remote-sync-smoke: ok');

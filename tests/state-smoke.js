import assert from 'node:assert/strict';
import {seedState,isoDay} from '../data.js';

const state=seedState();
assert.equal(state.meta.version,2);
assert.ok(state.channels.length>=3,'expected 3 channels');
assert.ok(state.clients.length>0,'expected demo clients');
assert.ok(state.conversations.length>0,'expected demo conversations');
assert.ok(state.appointments.length>0,'expected demo appointments');
assert.ok(state.tasks.length>0,'expected demo tasks');

const clientIds=new Set(state.clients.map(x=>x.id));
for(const c of state.conversations)assert.ok(clientIds.has(c.clientId),`orphan conversation ${c.id}`);
for(const a of state.appointments){
  assert.ok(clientIds.has(a.clientId),`orphan appointment ${a.id}`);
  assert.ok(Array.isArray(a.items),`appointment ${a.id} items missing`);
  for(const item of a.items)assert.equal(typeof item.prepared,'boolean',`item prepared must be boolean`);
}
for(const t of state.tasks)if(t.clientId)assert.ok(clientIds.has(t.clientId),`orphan task ${t.id}`);
for(const s of state.sales)assert.ok(clientIds.has(s.clientId),`orphan sale ${s.id}`);

const ids=[];
for(const key of ['channels','agents','clients','conversations','messages','appointments','tasks','opportunities','assignments','sales','timeline'])for(const row of state[key])ids.push(row.id);
assert.equal(ids.length,new Set(ids).size,'duplicate IDs found');

const todays=state.appointments.filter(a=>{
  const d=new Date(a.dateTime);const local=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;return local===isoDay(0);
});
assert.ok(todays.length>=1,'expected at least one appointment today');
console.log(`OK: ${state.clients.length} clients, ${state.conversations.length} conversations, ${todays.length} appointments today`);

import assert from 'node:assert/strict';
import {ensureVoiceState,runDemoQualification,getVoiceMetrics,scoreLead} from '../voice-core.js';

const state=ensureVoiceState({
  meta:{version:2,createdAt:new Date().toISOString()},
  clients:[],tasks:[],appointments:[],opportunities:[],timeline:[],
  agents:[{id:'agent_kelo',name:'Kelo'}]
});

const score=scoreLead({homeowner:true,budget:18000,timelineDays:21,zip:'10312',projectType:'Full bathroom remodel',vertical:'bathroom'});
assert.ok(score>=75,'expected a qualified HOT lead');

const result=runDemoQualification(state,{
  name:'Maria',phone:'+1 917 555 0188',vertical:'bathroom',language:'es',
  projectType:'Full bathroom remodel',budget:18000,timelineDays:21,zip:'10312',homeowner:true
});

assert.equal(result.qualification.qualified,true);
assert.ok(result.appointment,'qualified lead should auto-book');
assert.equal(state.clients.length,1);
assert.equal(state.appointments.length,1);
assert.ok(state.voice.actions.some(a=>a.type==='external_stub'),'SMS must stay stubbed without secure backend');

const metrics=getVoiceMetrics(state);
assert.equal(metrics.calls,1);
assert.equal(metrics.booked,1);
console.log('voice-smoke: ok');

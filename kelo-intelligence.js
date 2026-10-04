/**
 * Kelo Intelligence — provider/model agnostic supervisor.
 * It ranks normalized conversations for human attention and commercial opportunity.
 * Actual LLM calls, hourly scheduling and push delivery belong on the backend.
 */

export const KELO_INTELLIGENCE_VERSION='v0.1';

export const DEFAULT_INTELLIGENCE_POLICY=Object.freeze({
  staleMinutes:45,
  maxItems:50,
  weights:{
    explicitBuyingIntent:30,
    priceOrAvailabilityQuestion:16,
    appointmentIntent:22,
    shippingIntent:12,
    priorCustomer:12,
    estimatedValue:18,
    unread:8,
    stale:14,
    aiLoop:18,
    humanRequested:35,
    negativeSentiment:10
  }
});

const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
const minutesSince=(iso,nowMs)=>iso?Math.max(0,(nowMs-new Date(iso).getTime())/60000):0;

export function scoreConversation(signal,policy=DEFAULT_INTELLIGENCE_POLICY,nowMs=Date.now()){
  const w=policy.weights;
  let attention=0, money=0; const reasons=[];
  const add=(condition,a,m,reason)=>{if(condition){attention+=a;money+=m;reasons.push(reason)}};
  add(signal.humanRequested,w.humanRequested,8,'customer_requested_human');
  add(signal.explicitBuyingIntent,18,w.explicitBuyingIntent,'explicit_buying_intent');
  add(signal.priceOrAvailabilityQuestion,8,w.priceOrAvailabilityQuestion,'price_or_availability');
  add(signal.appointmentIntent,12,w.appointmentIntent,'appointment_intent');
  add(signal.shippingIntent,7,w.shippingIntent,'shipping_intent');
  add(signal.priorCustomer,5,w.priorCustomer,'prior_customer');
  add(Boolean(signal.unreadCount),w.unread,4,'unread');
  add(signal.aiLoopDetected,w.aiLoop,6,'ai_loop_detected');
  add(signal.negativeSentiment,w.negativeSentiment,0,'negative_sentiment');
  if(signal.estimatedValue>0){
    const valuePoints=clamp(Math.round(signal.estimatedValue/25),0,w.estimatedValue);
    money+=valuePoints; reasons.push('estimated_value');
  }
  const stale=minutesSince(signal.lastInboundAt,nowMs)>=policy.staleMinutes && !signal.lastHumanReplyAt;
  add(stale,w.stale,5,'stale_without_human_reply');
  return {
    conversationId:signal.conversationId,
    clientId:signal.clientId||null,
    channelId:signal.channelId,
    attentionScore:clamp(attention),
    moneyScore:clamp(money),
    priorityScore:clamp(Math.round(attention*.55+money*.45)),
    reasons,
    recommendedAction:recommendAction({...signal,stale})
  };
}

function recommendAction(s){
  if(s.humanRequested) return 'human_takeover';
  if(s.appointmentIntent) return 'close_appointment';
  if(s.explicitBuyingIntent) return 'close_sale';
  if(s.shippingIntent) return 'resolve_shipping_trust';
  if(s.aiLoopDetected) return 'review_ai_conversation';
  if(s.stale) return 'follow_up_now';
  return 'review';
}

export function buildAttentionQueue(signals,policy=DEFAULT_INTELLIGENCE_POLICY,nowMs=Date.now()){
  return (signals||[]).map(x=>scoreConversation(x,policy,nowMs))
    .sort((a,b)=>b.priorityScore-a.priorityScore || b.moneyScore-a.moneyScore)
    .slice(0,policy.maxItems);
}

export function summarizeAccounts(queue,conversationsById={}){
  const map=new Map();
  for(const item of queue){
    const c=conversationsById[item.conversationId]||{};
    const key=c.connectionId||c.channelId||item.channelId||'unknown';
    const row=map.get(key)||{connectionId:key,attentionCount:0,hotCount:0,totalOpportunityScore:0,topPriority:0};
    row.attentionCount++;
    if(item.moneyScore>=40) row.hotCount++;
    row.totalOpportunityScore+=item.moneyScore;
    row.topPriority=Math.max(row.topPriority,item.priorityScore);
    map.set(key,row);
  }
  return [...map.values()].sort((a,b)=>b.topPriority-a.topPriority);
}

export function createIntelligenceRun({trigger='manual',startedAt=new Date().toISOString(),model='unconfigured'}={}){
  if(!['manual','hourly','event'].includes(trigger)) throw new Error('unsupported intelligence trigger');
  return {id:`ki_${startedAt}_${trigger}`,trigger,startedAt,finishedAt:null,model,status:'running',items:[],accountSummary:[]};
}

export function finishIntelligenceRun(run,{queue,accountSummary,finishedAt=new Date().toISOString()}){
  return {...run,status:'completed',finishedAt,items:queue,accountSummary};
}

export function notificationCandidates(queue,{attentionThreshold=65,moneyThreshold=55}={}){
  return (queue||[]).filter(x=>x.attentionScore>=attentionThreshold||x.moneyScore>=moneyThreshold)
    .map(x=>({
      type:x.moneyScore>=moneyThreshold?'MONEY_OPPORTUNITY':'ATTENTION_REQUIRED',
      conversationId:x.conversationId,
      clientId:x.clientId,
      priorityScore:x.priorityScore,
      attentionScore:x.attentionScore,
      moneyScore:x.moneyScore,
      reasons:x.reasons,
      recommendedAction:x.recommendedAction
    }));
}

// Backend contract:
// POST /v1/intelligence/runs { trigger: "manual" } -> enqueue immediate analysis.
// Scheduled worker invokes the same service hourly.
// Never run provider tokens or OpenAI API keys in the browser.
// Push notifications are emitted by backend only after thresholds/dedupe/cooldown.

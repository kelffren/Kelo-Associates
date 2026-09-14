const pad=n=>String(n).padStart(2,'0');
export const isoDay=(offset=0)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
export const isoAt=(day,time)=>new Date(`${day}T${time}:00`).toISOString();
export const uid=(prefix='id')=>`${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;

export function seedState(){
  const today=isoDay(0), tomorrow=isoDay(1), yesterday=isoDay(-1);
  const at=(d,t)=>isoAt(d,t);
  return {
    meta:{version:2,createdAt:new Date().toISOString(),vertical:'watches'},
    channels:[
      {id:'wa1',type:'whatsapp',name:'WhatsApp 1',status:'mock'},
      {id:'wa2',type:'whatsapp',name:'WhatsApp 2',status:'mock'},
      {id:'wa3',type:'whatsapp',name:'WhatsApp 3',status:'mock'}
    ],
    agents:[
      {id:'agent_kelo',name:'Kelo',active:true},
      {id:'agent_andrea',name:'Andrea',active:true},
      {id:'agent_unassigned',name:'Sin asignar',active:true}
    ],
    clients:[
      {id:'c1',name:'Carlos M.',phone:'+1 347 555 0198',email:'',status:'hot',ownerId:'agent_kelo',source:'Marketplace',createdAt:at(yesterday,'09:15'),updatedAt:at(today,'09:24'),followupAt:null,interests:['Daytona negro'],tags:['Reloj','HOT']},
      {id:'c2',name:'Ana Rodríguez',phone:'+1 917 555 0102',email:'',status:'warm',ownerId:'agent_andrea',source:'Instagram',createdAt:at(yesterday,'12:30'),updatedAt:at(today,'08:50'),followupAt:at(today,'14:00'),interests:['Datejust'],tags:['Follow-up']},
      {id:'c3',name:'Luis Herrera',phone:'+1 646 555 0145',email:'',status:'hot',ownerId:'agent_kelo',source:'Referido',createdAt:at(yesterday,'15:10'),updatedAt:at(today,'08:10'),followupAt:null,interests:['Submariner'],tags:['Entrega hoy']},
      {id:'c4',name:'María González',phone:'+1 929 555 0177',email:'',status:'warm',ownerId:'agent_unassigned',source:'Marketplace',createdAt:at(yesterday,'11:00'),updatedAt:at(yesterday,'18:45'),followupAt:at(today,'11:00'),interests:['GMT'],tags:['Reloj']},
      {id:'c5',name:'Javier Torres',phone:'+1 718 555 0128',email:'',status:'cold',ownerId:'agent_unassigned',source:'Facebook',createdAt:at(yesterday,'17:40'),updatedAt:at(yesterday,'17:55'),followupAt:at(tomorrow,'10:00'),interests:['Daytona'],tags:['Follow-up']}
    ],
    conversations:[
      {id:'v1',clientId:'c1',channelId:'wa1',status:'open',unread:2,leadTemp:'hot',lastMessage:'Quiere Daytona negra',lastMessageAt:at(today,'09:24')},
      {id:'v2',clientId:'c2',channelId:'wa2',status:'open',unread:1,leadTemp:'warm',lastMessage:'¿Sigues teniendo el Datejust?',lastMessageAt:at(today,'08:50')},
      {id:'v3',clientId:'c3',channelId:'wa1',status:'open',unread:1,leadTemp:'hot',lastMessage:'Perfecto, nos vemos hoy',lastMessageAt:at(today,'08:10')},
      {id:'v4',clientId:'c4',channelId:'wa3',status:'open',unread:0,leadTemp:'warm',lastMessage:'Gracias por la información',lastMessageAt:at(yesterday,'18:45')},
      {id:'v5',clientId:'c5',channelId:'wa3',status:'open',unread:0,leadTemp:'cold',lastMessage:'¿Me puedes enviar más fotos?',lastMessageAt:at(yesterday,'17:55')}
    ],
    messages:[
      {id:'m1',conversationId:'v1',direction:'in',body:'Bro, ¿tienes Daytona negra?',status:'read',sentAt:at(today,'09:20')},
      {id:'m2',conversationId:'v1',direction:'out',body:'Sí, la tengo. ¿La quieres ver hoy?',status:'delivered',sentAt:at(today,'09:22')},
      {id:'m3',conversationId:'v1',direction:'in',body:'Sí, y llévame también un Submariner para compararlos.',status:'received',sentAt:at(today,'09:24')},
      {id:'m4',conversationId:'v2',direction:'in',body:'¿Sigues teniendo el Datejust?',status:'received',sentAt:at(today,'08:50')},
      {id:'m5',conversationId:'v3',direction:'in',body:'Perfecto, nos vemos hoy.',status:'received',sentAt:at(today,'08:10')}
    ],
    appointments:[
      {id:'a1',clientId:'c3',vertical:'watches',dateTime:at(today,'12:30'),location:'Grand Concourse, Bronx',status:'scheduled',assignedAgentId:'agent_kelo',notes:'Confirmar 1 hora antes.',estimatedValue:200,items:[{name:'Submariner negro',qty:1,prepared:true},{name:'Caja',qty:1,prepared:true}]},
      {id:'a2',clientId:'c1',vertical:'watches',dateTime:at(today,'17:30'),location:'Grand Concourse, Bronx',status:'scheduled',assignedAgentId:'agent_kelo',notes:'Quiere comparar dos modelos.',estimatedValue:200,items:[{name:'Daytona negro',qty:1,prepared:false},{name:'Submariner negro',qty:1,prepared:false}]},
      {id:'a3',clientId:'c5',vertical:'watches',dateTime:at(tomorrow,'15:00'),location:'Yonkers, NY',status:'scheduled',assignedAgentId:'agent_unassigned',notes:'Mandar fotos antes de salir.',estimatedValue:200,items:[{name:'Daytona panda',qty:1,prepared:false}]},
      {id:'a0',clientId:'c2',vertical:'watches',dateTime:at(yesterday,'18:00'),location:'Bronx, NY',status:'sold',assignedAgentId:'agent_andrea',notes:'Venta completada.',estimatedValue:285,items:[{name:'Datejust',qty:1,prepared:true},{name:'Caja',qty:1,prepared:true}]}
    ],
    tasks:[
      {id:'t1',clientId:'c2',appointmentId:null,title:'Follow-up con Ana',dueAt:at(today,'14:00'),status:'pending',priority:'high',kind:'followup',createdAt:at(yesterday,'19:00')},
      {id:'t2',clientId:'c4',appointmentId:null,title:'Responder precio final a María',dueAt:at(today,'11:00'),status:'pending',priority:'high',kind:'followup',createdAt:at(yesterday,'19:05')},
      {id:'t3',clientId:'c1',appointmentId:'a2',title:'Confirmar cita con Carlos',dueAt:at(today,'15:30'),status:'pending',priority:'high',kind:'appointment',createdAt:at(today,'09:30')}
    ],
    reminderRules:{dayBefore:true,morningSummary:true,twoHours:true,thirtyMinutes:true,postAppointment:true},
    opportunities:[
      {id:'o1',clientId:'c1',vertical:'watches',estimatedValue:200,stage:'appointment',source:'Marketplace',createdAt:at(today,'09:25')},
      {id:'o2',clientId:'c2',vertical:'watches',estimatedValue:285,stage:'won',source:'Instagram',createdAt:at(yesterday,'13:00')},
      {id:'o3',clientId:'c3',vertical:'watches',estimatedValue:200,stage:'appointment',source:'Referido',createdAt:at(yesterday,'16:00')}
    ],
    assignments:[
      {id:'as1',objectType:'client',objectId:'c1',agentId:'agent_kelo',assignedAt:at(today,'09:26')},
      {id:'as2',objectType:'client',objectId:'c2',agentId:'agent_andrea',assignedAt:at(yesterday,'13:10')}
    ],
    sales:[
      {id:'s1',clientId:'c2',appointmentId:'a0',vertical:'watches',amount:285,commission:0,closedAt:at(yesterday,'18:25'),channelId:'wa2',agentId:'agent_andrea'}
    ],
    timeline:[
      {id:'e1',clientId:'c2',type:'sale',text:'Venta cerrada — Datejust + caja',timestamp:at(yesterday,'18:25')},
      {id:'e2',clientId:'c1',type:'appointment_created',text:'Cita creada para ver Daytona y Submariner',timestamp:at(today,'09:30')},
      {id:'e3',clientId:'c3',type:'appointment_created',text:'Entrega agendada',timestamp:at(yesterday,'16:10')}
    ],
    ui:{channel:'all',chatFilter:'all',agendaFilter:'upcoming'}
  };
}

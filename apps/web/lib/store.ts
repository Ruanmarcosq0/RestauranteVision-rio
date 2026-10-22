import { db } from './db';
import { demoTables, transition, alerts, type Event, type Table } from './domain';
import { demo, productionReady } from './auth';
import { summarizeVisits } from './analytics';
export const restaurantId=()=>{if(!process.env.RESTAURANT_ID)throw new Error('RESTAURANT_ID ausente');return process.env.RESTAURANT_ID;};
export async function snapshot(){
 if(!demo()&&!productionReady())return {mode:'installation',name:'Minha operação',threshold:300,tables:[],events:[],cameras:[],analytics:summarizeVisits([]),installation:{database:!!process.env.DATABASE_URL,access:!!(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD_HASH&&process.env.SESSION_SECRET),camera:false}};
 if(demo())return {mode:'demo',name:'Bistrô Aurora',threshold:300,tables:demoTables(),events:[],cameras:[{id:'demo-1',name:'Salão principal',sourceType:'Simulação',zones:[],lastSeen:null},{id:'demo-2',name:'Varanda',sourceType:'Simulação',zones:[],lastSeen:null}]};
 const id=restaurantId();const [r,tables,events,cameras,visits]=await Promise.all([db.restaurant.findUniqueOrThrow({where:{id}}),db.diningTable.findMany({where:{restaurantId:id},orderBy:{name:'asc'}}),db.visionEvent.findMany({where:{restaurantId:id},orderBy:{occurredAt:'desc'},take:1000}),db.camera.findMany({where:{restaurantId:id}}),db.visit.findMany({where:{restaurantId:id,startedAt:{gte:new Date(Date.now()-7*86400000)}},orderBy:{startedAt:'desc'},take:50000})]);
 const records=visits.map(v=>({...v,startedAt:v.startedAt.getTime(),servedAt:v.servedAt?.getTime()??null,endedAt:v.endedAt?.getTime()??null}));
 return {mode:'production',name:r.name,threshold:r.threshold,tables:tables.map(t=>({...t,state:t.state as Table['state'],occupiedAt:t.occupiedAt?.getTime()??null,servedAt:t.servedAt?.getTime()??null,updatedAt:t.updatedAt.getTime()})),events:events.map(e=>({...e,occurredAt:e.occurredAt.getTime()})),cameras,analytics:summarizeVisits(records,7,r.timezone)};
}
export async function ingest(event:Event){
 const id=restaurantId();return db.$transaction(async tx=>{
 // Lock per table so overlapping deliveries cannot overwrite newer state.
 await tx.$queryRaw`SELECT id FROM "DiningTable" WHERE id=${event.tableId} AND "restaurantId"=${id} FOR UPDATE`;
 if(await tx.visionEvent.findUnique({where:{id:event.id}}))return {duplicate:true};
 const row=await tx.diningTable.findFirstOrThrow({where:{id:event.tableId,restaurantId:id}});
 if(event.people>row.capacity)throw new Error('Pessoas excedem capacidade');
 const current:Table={...row,state:row.state as Table['state'],occupiedAt:row.occupiedAt?.getTime()??null,servedAt:row.servedAt?.getTime()??null,updatedAt:row.updatedAt.getTime()};
 const next=transition(current,event);
 if(next===current)return {ignored:true,reason:'Transição inválida ou evento antigo'};
 const at=new Date(event.occurredAt);
 await tx.visionEvent.create({data:{...event,restaurantId:id,occurredAt:new Date(event.occurredAt)}});
 if(event.type==='occupied')await tx.visit.create({data:{id:event.id,restaurantId:id,tableId:row.id,tableName:row.name,zone:row.zone,people:event.people,startedAt:at}});
 if(event.type==='served')await tx.visit.updateMany({where:{restaurantId:id,tableId:row.id,endedAt:null,servedAt:null},data:{servedAt:at}});
 if(event.type==='heartbeat')await tx.visit.updateMany({where:{restaurantId:id,tableId:row.id,endedAt:null},data:{people:event.people}});
 if(event.type==='vacated')await tx.visit.updateMany({where:{restaurantId:id,tableId:row.id,endedAt:null},data:{endedAt:at}});
 await tx.diningTable.update({where:{id:row.id},data:{state:next.state,people:next.people,occupiedAt:next.occupiedAt===null?null:new Date(next.occupiedAt),servedAt:next.servedAt===null?null:new Date(next.servedAt),updatedAt:new Date(next.updatedAt)}});
 return {duplicate:false};
 });
}
export async function enqueueAlerts(){const s=await snapshot();if(s.mode==='demo')return 0;const active=alerts(s.tables,Date.now(),s.threshold);for(const a of active)await db.outbox.upsert({where:{id:a.id},create:{id:a.id,restaurantId:restaurantId(),payload:{...a,type:'wait_alert',mode:'production'}},update:{}});return active.length;}
export async function deliver(){
 const url=process.env.N8N_WEBHOOK_URL;if(!url)return {configured:false,delivered:0};
 if(!url.startsWith('https://')&&process.env.NODE_ENV==='production')throw new Error('Webhook requer HTTPS');
 let delivered=0;const s=await snapshot();const active=new Set(alerts(s.tables,Date.now(),s.threshold).map(a=>a.id));
 const rows=await db.outbox.findMany({where:{restaurantId:restaurantId(),deliveredAt:null,attempts:{lt:10}},take:20});
 for(const row of rows){
  if(!active.has(row.id)){await db.outbox.update({where:{id:row.id},data:{deliveredAt:new Date()}});continue;}
  try{const body=JSON.stringify({id:row.id,...row.payload as object});const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json','x-vision-secret':process.env.N8N_WEBHOOK_SECRET??''},body,signal:AbortSignal.timeout(5000)});await db.outbox.update({where:{id:row.id},data:{attempts:{increment:1},...(response.ok?{deliveredAt:new Date()}: {})}});if(response.ok)delivered++;}catch{await db.outbox.update({where:{id:row.id},data:{attempts:{increment:1}}});}
 }return {configured:true,delivered};
}

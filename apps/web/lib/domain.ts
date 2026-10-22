export type TableState = 'FREE'|'WAITING'|'SERVED'|'CLEANING';
export type Table = {id:string; name:string; zone:string; capacity:number; people:number; state:TableState; occupiedAt:number|null; servedAt:number|null; updatedAt:number};
export type Event = {id:string; tableId:string; type:'occupied'|'served'|'vacated'|'cleaned'|'heartbeat'; people:number; occurredAt:number; source:'demo'|'edge'|'manual'};
export const labels:Record<TableState,string>={FREE:'Livre',WAITING:'Aguardando',SERVED:'Em atendimento',CLEANING:'Limpeza'};
export function transition(table:Table,event:Event):Table {
 if(event.occurredAt<table.updatedAt) return table;
 const t={...table,updatedAt:event.occurredAt};
 if(event.type==='occupied' && table.state==='FREE') return {...t,state:'WAITING',people:event.people,occupiedAt:event.occurredAt,servedAt:null};
 if(event.type==='heartbeat' && ['WAITING','SERVED'].includes(table.state)) return {...t,people:event.people};
 if(event.type==='served' && table.state==='WAITING') return {...t,state:'SERVED',servedAt:event.occurredAt};
 if(event.type==='vacated' && ['WAITING','SERVED'].includes(table.state)) return {...t,state:'CLEANING',people:0};
 if(event.type==='cleaned' && table.state==='CLEANING') return {...t,state:'FREE',people:0,occupiedAt:null,servedAt:null};
 return table;
}
export function alerts(tables:Table[],now=Date.now(),threshold=300) { return tables.filter(t=>t.state==='WAITING' && t.occupiedAt!==null && (now-t.occupiedAt)>=threshold*1000).map(t=>({id:`wait-${t.id}-${t.occupiedAt}`,tableId:t.id,title:`${t.name} precisa de atenção`,seconds:Math.floor((now-t.occupiedAt!)/1000),zone:t.zone})); }
export function metrics(tables:Table[]) {const occupied=tables.filter(t=>['WAITING','SERVED'].includes(t.state));return {occupancy:tables.length?Math.round(occupied.length/tables.length*100):0,occupied:occupied.length,free:tables.filter(t=>t.state==='FREE').length,people:tables.reduce((n,t)=>n+t.people,0)};}
export function demoTables(now=Date.now()):Table[] {return Array.from({length:12},(_,i)=>{const state:TableState=i===3||i===8?'WAITING':i===6?'CLEANING':[1,4,9,11].includes(i)?'FREE':'SERVED';return {id:`table-${i+1}`,name:`Mesa ${String(i+1).padStart(2,'0')}`,zone:i<8?'Salão principal':'Varanda',capacity:i%3===0?6:4,people:['FREE','CLEANING'].includes(state)?0:2+i%3,state,occupiedAt:['FREE','CLEANING'].includes(state)?null:now-(i===3?383:i===8?325:600+i*80)*1000,servedAt:state==='SERVED'?now-(400+i*70)*1000:null,updatedAt:now-1000};});}
export function formatTime(seconds:number) {const n=Math.max(0,Math.floor(seconds));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}

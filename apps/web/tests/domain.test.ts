import test from 'node:test';
import assert from 'node:assert/strict';
import { transition,alerts,metrics,type Table,type Event } from '../lib/domain';
import {eventSchema} from '../lib/validation';
const table:Table={id:'t',name:'Mesa',zone:'Salão',capacity:4,state:'FREE',people:0,occupiedAt:null,servedAt:null,updatedAt:0};
const event=(type:Event['type'],at:number):Event=>({id:'12345678',tableId:'t',type,people:2,occurredAt:at,source:'edge'});
test('visit lifecycle, threshold and reset',()=>{let t=transition(table,event('occupied',1000));assert.equal(t.state,'WAITING');assert.equal(alerts([t],300999).length,0);assert.equal(alerts([t],301000).length,1);t=transition(t,event('served',302000));assert.equal(alerts([t],303000).length,0);t=transition(t,event('vacated',304000));assert.equal(t.state,'CLEANING');t=transition(t,event('cleaned',305000));assert.equal(t.state,'FREE');assert.equal(t.occupiedAt,null);assert.equal(metrics([t]).people,0)});
test('old and invalid transitions cannot reopen served visit',()=>{let t=transition(table,event('occupied',1000));t=transition(t,event('served',2000));assert.deepEqual(transition(t,event('vacated',1500)),t);assert.equal(transition(t,event('occupied',3000)).state,'SERVED')});
test('production rejects explicitly simulated events',()=>{assert.equal(eventSchema.safeParse({...event('occupied',1000),source:'demo'}).success,false);assert.equal(eventSchema.safeParse({...event('occupied',1000),people:-1}).success,false)});

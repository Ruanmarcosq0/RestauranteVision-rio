import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeVisits,type VisitRecord} from '../lib/analytics';
const visit=(id:string,start:string,end:string|null,people:number,served:string|null=null):VisitRecord=>({id,tableId:'one',tableName:'Mesa 01',zone:'Salão',people,startedAt:Date.parse(start),endedAt:end?Date.parse(end):null,servedAt:served?Date.parse(served):null});
test('empty operation never invents a peak or averages',()=>{const a=summarizeVisits([]);assert.equal(a.peakHour,null);assert.equal(a.meanStaySeconds,null);assert.equal(a.people,0)});
test('uses Sao Paulo local date and hour, measures completed visits only',()=>{const a=summarizeVisits([visit('a','2026-10-22T01:30:00Z','2026-10-22T02:30:00Z',4,'2026-10-22T01:35:00Z'),visit('b','2026-10-22T01:50:00Z',null,2)]);assert.equal(a.peakHour,22);assert.equal(a.peakDay,'2026-10-21');assert.equal(a.meanStaySeconds,3600);assert.equal(a.meanWaitSeconds,300);assert.equal(a.people,6);assert.equal(a.hours[22].count,6)});
test('counts all 24 hours and picks the highest observed hour',()=>{const a=summarizeVisits([visit('a','2026-10-22T04:00:00Z',null,8),visit('b','2026-10-22T22:00:00Z',null,3)]);assert.equal(a.hours.length,24);assert.equal(a.peakHour,1);assert.match(a.recommendation,/01h/)});

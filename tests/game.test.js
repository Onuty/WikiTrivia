import { test } from 'node:test';
import assert from 'node:assert/strict';
import { events } from '../src/data/events.js';
import { formatYear, isCorrectPosition, correctIndex, pointsFor, filterEvents, makeDeck, seededRandom } from '../src/game.js';
test('題庫至少150題，欄位完整、無重複識別碼、沒有公元零年',()=>{
 assert.ok(events.length >= 150);
 assert.equal(new Set(events.map(e=>e.id)).size,events.length);
 for(const e of events){ for(const key of ['id','title','description','region','category']) assert.ok(typeof e[key] === 'string' && e[key].length > 0); assert.ok(Number.isInteger(e.year)&&e.year!==0); }
 for(const filter of ['中國','亞洲','歐洲','美洲','戰爭','科技']) assert.ok(filterEvents(events,filter).length >= 3);
});
test('歷史紀年格式',()=>{assert.equal(formatYear(-221),'公元前 221 年');assert.equal(formatYear(476),'公元 476 年');assert.equal(formatYear(1789),'1789 年');assert.throws(()=>formatYear(0));});
test('公元前、跨紀元、頭尾與同年排序',()=>{
 const line=[-500,-221,476,1789,1789,2001].map(year=>({year}));
 assert.ok(isCorrectPosition(line,-300,1));assert.ok(!isCorrectPosition(line,-300,2));
 assert.ok(isCorrectPosition(line,-1000,0));assert.ok(isCorrectPosition(line,2020,6));
 assert.ok(isCorrectPosition(line,1,2));
 for(const i of [3,4,5]) assert.ok(isCorrectPosition(line,1789,i));
 for(const i of [-1,7,1.5]) assert.equal(isCorrectPosition(line,10,i),false);
 assert.equal(correctIndex(line,-600),0);assert.equal(correctIndex(line,1789),5);assert.equal(correctIndex(line,2020),6);
});
test('所有事件插入後均保持年代有序，同年不誤判',()=>{
 const line=[];
 for(const e of makeDeck(events,[],seededRandom('test'))){const i=correctIndex(line,e.year);assert.ok(isCorrectPosition(line,e.year,i));line.splice(i,0,e);}
 assert.deepEqual(line.map(e=>e.year),events.map(e=>e.year).sort((a,b)=>a-b));
});
test('抽題不重複、近期題目後移、每日種子可重現且不更動原資料',()=>{
 const ids=events.slice(0,20).map(e=>e.id);const deck=makeDeck(events,ids,seededRandom('day'));
 assert.equal(new Set(deck.map(e=>e.id)).size,events.length);assert.ok(deck.slice(0,events.length-20).every(e=>!ids.includes(e.id)));
 assert.deepEqual(makeDeck(events,[],seededRandom('day')),makeDeck(events,[],seededRandom('day')));
 assert.notDeepEqual(makeDeck(events,[],seededRandom('day')),makeDeck(events,[],seededRandom('next-day')));
 assert.equal(pointsFor(1),100);assert.equal(pointsFor(5),180);
});

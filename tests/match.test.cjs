/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {calculateMatch,rankCafes}=require('../.next/match-tests/utils/matchV1.js');
const {calculateStudyScore}=require('../.next/match-tests/utils/studyScoreV1.js');
const {validPreferences}=require('../.next/match-tests/types/studyPreferences.js');
const perfect={wifi:'Great WiFi',noise:'Quiet',seating:'Comfortable',sockets:'Plenty',coffee:'Excellent',busyness:'Quiet',seatCount:50};
const prefs={atmosphere_preference:'quiet',session_length:'medium',priorities:[]};
test('perfect, poor and final-only rounding',()=>{
 assert.equal(calculateMatch(perfect,prefs).score,100);
 const poor={wifi:'Okay WiFi',noise:'Loud',seating:'Basic',sockets:'Few',coffee:'Basic',busyness:'Busy',seatCount:0};
 assert.equal(calculateMatch(poor,prefs).score,Math.round((45*18+25*15+40*15+35*15+40*13+30*12+35*12)/100));
 assert.equal(calculateMatch({...perfect,wifi:'Good WiFi'},prefs).score,96);
 assert.equal(calculateMatch(poor,prefs).reasons.length,0);
});
test('atmosphere mappings and different people, same cafe',()=>{
 const scores=[];
 for(const [atmosphere,expectedNoise,expectedBusy] of [['quiet',[100,70,25],[100,70,30]],['balanced',[90,100,55],[90,100,65]],['lively',[70,100,80],[75,100,85]]]){
  const p={...prefs,atmosphere_preference:atmosphere};scores.push(calculateMatch(perfect,p).score);
  for(let i=0;i<3;i++){
   const r=calculateMatch({...perfect,noise:['Quiet','Moderate','Loud'][i],busyness:['Quiet','Moderate','Busy'][i]},p);
   assert.equal(r.components.noise.compatibility,expectedNoise[i]);assert.equal(r.components.busyness.compatibility,expectedBusy[i]);
  }
 }
 assert.equal(new Set(scores).size,3);
});
test('session modifiers multiply each priority and preserve unselected weights',()=>{
 for(const [session,seat,socket,capacity] of [['short',.85,.75,.9],['medium',1,1,1],['long',1.25,1.25,1.15]]){
  for(const [priority,factor,base] of [['wifi','wifi',18],['sockets','sockets',15],['seating','seating',15],['coffee','coffee',13],['space','seatCount',12]]){
   const r=calculateMatch(perfect,{...prefs,session_length:session,priorities:[priority]});
   const modifiers={seating:seat,sockets:socket,seatCount:capacity};
   assert.equal(r.components[factor].weight,base*1.35*(modifiers[factor]??1));
   assert.equal(r.components.noise.weight,15);
  }
 }
});
test('priorities validate maximum, distinct values and valid keys',()=>{
 assert(validPreferences({...prefs,priorities:['wifi','coffee','space']}));
 for(const priorities of [['wifi','coffee','space','sockets'],['wifi','wifi'],['chain'],[null]]){
  assert(!validPreferences({...prefs,priorities}));assert.throws(()=>calculateMatch(perfect,{...prefs,priorities}));
 }
});
test('missing factors renormalize, zero seats remain known and capacity bands are exact',()=>{
 const cafe={...perfect,wifi:'Okay WiFi',seatCount:null};
 assert.equal(calculateMatch(cafe,prefs).score,Math.round((45*18+70*100)/88));
 assert(!calculateMatch(cafe,prefs).components.seatCount);
 for(const [seats,score] of [[0,35],[7,35],[8,50],[14,50],[15,65],[24,65],[25,80],[34,80],[35,90],[49,90],[50,100]])assert.equal(calculateMatch({...perfect,seatCount:seats},prefs).components.seatCount.compatibility,score);
 assert.equal(calculateMatch({},prefs),null);
 assert.equal(calculateMatch({wifi:'Great WiFi'},prefs).score,100);
});
test('changes affect Match, never universal Study Score or contextual factors',()=>{
 const cafe={...perfect,wifi:'Okay WiFi',sockets:'Few',studyScore:80};const original=structuredClone(cafe);const study=calculateStudyScore(cafe);
 const first=calculateMatch(cafe,prefs);
 assert.notEqual(first.score,calculateMatch(cafe,{...prefs,session_length:'long',priorities:['sockets']}).score);
 assert.deepEqual(calculateMatch({...cafe,rating:0,price:'x',city:'Exeter',isIndependent:false,coords:[0,0],image:'',studyScore:1},prefs),first);
 assert.deepEqual(cafe,original);assert.equal(calculateStudyScore(cafe),study);
});
test('range and exact normalization across all preference combinations',()=>{
 for(const atmosphere_preference of ['quiet','balanced','lively'])for(const session_length of ['short','medium','long'])for(let mask=0;mask<32;mask++){
  const priorities=['wifi','sockets','seating','coffee','space'].filter((_,i)=>mask&(1<<i));if(priorities.length>3)continue;
  for(const seatCount of [null,0,8,15,25,35,50]){
   const r=calculateMatch({...perfect,wifi:'Okay WiFi',noise:'Loud',seatCount},{atmosphere_preference,session_length,priorities});
   assert(Number.isInteger(r.score)&&r.score>=0&&r.score<=100);
   const c=Object.values(r.components);assert.equal(r.score,Math.round(c.reduce((s,x)=>s+x.compatibility*x.weight,0)/c.reduce((s,x)=>s+x.weight,0)));
  }
 }
});
test('ranking uses Match then universal score without mutating input',()=>{
 const a={studyScore:80},b={studyScore:90},c={studyScore:70};const input=[a,b,c];const matches=new Map([[a,{score:90}],[b,{score:90}],[c,{score:95}]]);
 assert.deepEqual(rankCafes(input,matches),[c,b,a]);assert.deepEqual(rankCafes(input,new Map()),[b,a,c]);assert.deepEqual(input,[a,b,c]);
});

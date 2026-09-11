/* eslint-disable @typescript-eslint/no-require-imports -- Node tests use compiled CommonJS helpers and an isolated PostgreSQL engine. */
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PGlite } = require("@electric-sql/pglite");
const { calculateStudyScore, getStudyScoreBreakdown, STUDY_SCORE_V1_POINTS } = require("../.next/score-tests/utils/studyScoreV1.js");
const { filterCafes } = require("../.next/score-tests/utils/filters.js");
const { createDefaultFilters } = require("../.next/score-tests/types/filters.js");
const snapshot = require("./fixtures/study-score-cafes-2026-09-11.json");
const migrationPath = path.join(__dirname, "../supabase/migrations/20260911222828_study_score_v1.sql");
const migration = fs.readFileSync(migrationPath, "utf8");
const perfect = { wifi: "Great WiFi", noise: "Quiet", seating: "Comfortable", sockets: "Plenty", coffee: "Excellent", busyness: "Quiet", seatCount: 50 };
const fields = ["wifi", "noise", "seating", "sockets", "coffee", "busyness"];
const seatBoundaries = [[0,2],[7,2],[8,4],[14,4],[15,6],[24,6],[25,8],[34,8],[35,10],[49,10],[50,12]];
const inputs = row => ({ ...row, seatCount: row.seat_count });

test("perfect cafe scores 100 with all seven explainable components", () => {
  assert.deepEqual(getStudyScoreBreakdown(perfect), {
    total: 100, rawTotal: 100,
    components: { wifi: 18, noise: 15, seating: 15, sockets: 15, coffee: 13, busyness: 12, seats: 12 },
  });
});

test("mixed cafe preserves half points and rounds only the final total", () => {
  const score = getStudyScoreBreakdown({wifi:"Good WiFi",noise:"Moderate",seating:"Average",sockets:"Some",coffee:"Good",busyness:"Moderate",seatCount:15});
  assert.deepEqual(score, { total:69,rawTotal:68.5,components:{wifi:13.5,noise:10,seating:10,sockets:10,coffee:9,busyness:10,seats:6} });
  assert.equal(calculateStudyScore({...perfect,wifi:"Good WiFi"}),96);
  assert.equal(calculateStudyScore({...perfect,wifi:"Okay WiFi",noise:"Loud",seating:"Basic",sockets:"Few",coffee:"Basic",busyness:"Busy",seatCount:0}),30);
});

for (const [seatCount,points] of seatBoundaries) test(`seat boundary ${seatCount} earns ${points}/12`, () => {
  assert.equal(getStudyScoreBreakdown({...perfect,seatCount}).components.seats,points);
  assert.equal(calculateStudyScore({...perfect,seatCount}),88+points);
});

test("missing, invalid and unknown required inputs are unavailable", () => {
  for (const seatCount of [null,undefined,-1,1.5,NaN,Infinity,"50",2_147_483_648]) {
    assert.equal(calculateStudyScore({...perfect,seatCount}),null);
    assert.equal(getStudyScoreBreakdown({...perfect,seatCount}),null);
  }
  assert.equal(calculateStudyScore({...perfect,seatCount:2_147_483_647}),100);
  for (const field of fields) for (const value of [null,undefined,"Unknown","toString","__proto__",12]) {
    assert.equal(calculateStudyScore({...perfect,[field]:value}),null);
  }
});

test("unrelated attributes never enter the universal calculation", () => {
  const extra={openingHours:"Closed",weeklyOpeningHours:null,isOpen:false,price:"£££",rating:0,isIndependent:false,city:"Exeter",image:"",walkTime:999,coords:[0,0],lastVerifiedAt:null,confidence:0,studyScore:1};
  assert.deepEqual(getStudyScoreBreakdown({...perfect,...extra}),getStudyScoreBreakdown(perfect));
  assert.equal(calculateStudyScore({...perfect,...extra,seatCount:null}),null);
});

describe("PostgreSQL migration, trigger and TypeScript parity", () => {
  let db, prior, migrated, securityBefore;
  let sequence=0;
  const security=async()=>({
    table:(await db.query("select relrowsecurity, relforcerowsecurity, relacl::text from pg_class where oid='public.cafes'::regclass")).rows,
    policies:(await db.query("select policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname='public' and tablename='cafes' order by policyname")).rows,
  });
  async function insert(overrides={}) {
    const row={slug:`score-test-${++sequence}`,name:"Score test",city:"Exeter",description:"Isolated test",latitude:50.72,longitude:-3.53,
      study_score:73,wifi:"Great WiFi",noise:"Quiet",seating:"Comfortable",sockets:"Plenty",coffee:"Excellent",busyness:"Quiet",seat_count:50,
      rating:4,price:"££",image_url:"",...overrides};
    const keys=Object.keys(row).filter(k=>row[k]!==undefined);
    return (await db.query(`insert into public.cafes (${keys.join(",")}) values (${keys.map((_,i)=>`$${i+1}`).join(",")}) returning *`,keys.map(k=>row[k]))).rows[0];
  }
  async function update(id,field,value) {
    assert(["study_score","wifi","noise","seating","sockets","coffee","busyness","seat_count"].includes(field));
    return (await db.query(`update public.cafes set ${field}=$1 where id=$2 returning *`,[value,id])).rows[0];
  }
  before(async()=>{
    db=new PGlite();
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
    for(const file of ["202608280001_create_cafes.sql","202609100001_cafe_cities_and_workspace_details.sql","202609110001_cafe_independence.sql"]){
      // PGlite provides core gen_random_uuid(); pgcrypto itself isn't needed.
      const sql=fs.readFileSync(path.join(__dirname,"../supabase/migrations",file),"utf8").replace("create extension if not exists pgcrypto;","");
      await db.exec(sql);
    }
    await db.exec("grant usage on schema public to anon,authenticated,service_role; grant select,insert,update,delete on public.cafes to service_role;");
    for(const row of snapshot)await insert(row);
    prior=(await db.query("select * from public.cafes order by slug")).rows;
    securityBefore=await security();
    await db.exec(migration);
    migrated=(await db.query("select * from public.cafes order by slug")).rows;
  });
  after(async()=>{await db?.close();});

  test("backfill retains all 16 cafes; changes only seven eligible scores and timestamps",async()=>{
    assert.equal(prior.length,16);assert.equal(migrated.length,16);
    let changed=0,pending=0;
    for(let i=0;i<prior.length;i++){
      const {study_score:oldScore,updated_at:oldTimestamp,...oldFields}=prior[i];
      const {study_score:newScore,updated_at:newTimestamp,...newFields}=migrated[i];
      assert.deepEqual(newFields,oldFields);
      const canonical=calculateStudyScore(inputs(prior[i]));
      assert.equal(newScore,canonical??oldScore,prior[i].name);
      if(canonical===null){pending++;assert.deepEqual(newTimestamp,oldTimestamp);}
      if(oldScore!==newScore)changed++;else assert.deepEqual(newTimestamp,oldTimestamp);
    }
    assert.equal(changed,7);assert.equal(pending,7);
    assert.deepEqual(await security(),securityBefore);
  });

  test("SQL matches TypeScript for all category combinations and every seat boundary",async()=>{
    let cases=[{}];
    for(const field of fields)cases=cases.flatMap(c=>Object.keys(STUDY_SCORE_V1_POINTS[field]).map(value=>({...c,[field]:value})));
    cases=cases.flatMap(c=>seatBoundaries.map(([seatCount])=>({...c,seatCount})));
    assert.equal(cases.length,8019);
    for(let start=0;start<cases.length;start+=500){
      const batch=cases.slice(start,start+500);
      const sql=await db.query(`select public.calculate_study_score_v1(value->>'wifi',value->>'noise',value->>'seating',value->>'sockets',value->>'coffee',value->>'busyness',(value->>'seatCount')::integer) as score from jsonb_array_elements($1::jsonb) with ordinality as cases(value,n) order by n`,[JSON.stringify(batch)]);
      assert.deepEqual(sql.rows.map(r=>r.score),batch.map(calculateStudyScore));
      assert(sql.rows.every(r=>Number.isInteger(r.score)&&r.score>=0&&r.score<=100));
    }
    for(const override of [{seatCount:null},{seatCount:-1},...fields.flatMap(f=>[{[f]:null},{[f]:"Unknown"}])]){
      const c={...perfect,...override};
      const result=await db.query("select public.calculate_study_score_v1($1,$2,$3,$4,$5,$6,$7) as score",[...fields.map(f=>c[f]),c.seatCount]);
      assert.equal(result.rows[0].score,calculateStudyScore(c));
    }
  });

  test("complete inserts need no manual score; supplied scores are overridden",async()=>{
    assert.equal((await insert({study_score:undefined})).study_score,100);
    assert.equal((await insert({study_score:12,wifi:"Good WiFi"})).study_score,96);
    const incomplete=await insert({seat_count:null,study_score:57});
    assert.equal(incomplete.study_score,57);
    await assert.rejects(insert({seat_count:null,study_score:undefined}),/null value in column "study_score"/);
  });

  test("every relevant input update recalculates automatically",async()=>{
    for(const [field,value] of [["wifi","Good WiFi"],["noise","Moderate"],["seating","Average"],["sockets","Some"],["coffee","Good"],["busyness","Moderate"],["seat_count",14]]){
      const row=await insert();const changed=await update(row.id,field,value);
      assert.equal(changed.study_score,calculateStudyScore(inputs(changed)),field);
      assert.notEqual(changed.study_score,100);
    }
  });

  test("missing capacity preserves stored score until verified; clearing it freezes the last score",async()=>{
    let row=await insert({seat_count:null,study_score:57});
    row=await update(row.id,"coffee","Good");assert.equal(row.study_score,57);
    row=await update(row.id,"study_score",99);assert.equal(row.study_score,57);
    row=await update(row.id,"seat_count",15);assert.equal(row.study_score,calculateStudyScore(inputs(row)));
    const last=row.study_score;
    row=await update(row.id,"seat_count",null);assert.equal(row.study_score,last);
    row=await update(row.id,"wifi","Okay WiFi");assert.equal(row.study_score,last);
    row=await update(row.id,"seat_count",0);assert.equal(row.study_score,calculateStudyScore(inputs(row)));
  });

  test("manual score overrides and upserts cannot create drift",async()=>{
    const row=await insert();assert.equal((await update(row.id,"study_score",1)).study_score,100);
    const result=await db.query("insert into public.cafes select * from public.cafes where id=$1 on conflict(id) do update set wifi='Good WiFi', study_score=1 returning *",[row.id]);
    assert.equal(result.rows[0].study_score,96);
  });

  test("unrelated updates never recalculate, for complete or incomplete records",async()=>{
    const complete=await insert(), incomplete=await insert({seat_count:null,study_score:57});
    // Deliberately create stale complete data with the trigger disabled locally:
    // an unrelated update must not silently become a backfill operation.
    await db.exec("alter table public.cafes disable trigger cafes_calculate_study_score_v1");
    await update(complete.id,"study_score",77);
    await db.exec("alter table public.cafes enable trigger cafes_calculate_study_score_v1");
    for(const [row,expected] of [[complete,77],[incomplete,57]]){
      const changed=await db.query("update public.cafes set opening_hours='Closed',weekly_opening_hours=null,price='£££',rating=0,walk_time=99,is_independent=false,city='Cambridge',image_url='changed',last_verified_at=now() where id=$1 returning study_score",[row.id]);
      assert.equal(changed.rows[0].study_score,expected);
    }
  });

  test("inactive records also recalculate without changing visibility",async()=>{
    const row=await insert({is_active:false,wifi:"Good WiFi"});
    assert.equal(row.study_score,96);assert.equal(row.is_active,false);
    assert.equal((await update(row.id,"seat_count",8)).study_score,88);
  });

  test("public RLS reads and write restrictions are preserved; service writes recalculate",async()=>{
    const active=(await db.query("select count(*)::int as n from public.cafes where is_active")).rows[0].n;
    for(const role of ["anon","authenticated"]){
      await db.exec(`set role ${role}`);
      assert.equal((await db.query("select count(*)::int as n from public.cafes")).rows[0].n,active);
      await assert.rejects(db.exec("update public.cafes set study_score=0"),/permission denied/);
      await assert.rejects(db.exec("delete from public.cafes"),/permission denied/);
      await assert.rejects(db.exec("insert into public.cafes default values"),/permission denied/);
      await assert.rejects(db.exec("select public.calculate_study_score_v1('Great WiFi','Quiet','Comfortable','Plenty','Excellent','Quiet',50)"),/permission denied/);
      await db.exec("reset role");
    }
    await db.exec("set role service_role");
    const row=await insert({study_score:undefined});assert.equal(row.study_score,100);
    assert.equal((await update(row.id,"wifi","Good WiFi")).study_score,96);
    await db.exec("reset role");
    assert.deepEqual(await security(),securityBefore);
  });

  test("score filtering consumes the same persisted values used by every display",()=>{
    const cafes=migrated.map(row=>({...inputs(row),studyScore:row.study_score,isIndependent:null,weeklyOpeningHours:null,coords:[row.longitude,row.latitude]}));
    for(const city of ["Exeter","Cambridge"])for(const minStudyScore of [0,50,60,70,80,90]){
      const actual=filterCafes(cafes,{...createDefaultFilters(),minStudyScore},{city,search:"",coordinates:null,now:null});
      const expected=migrated.filter(row=>row.city===city&&row.study_score>=minStudyScore);
      assert.deepEqual(actual.map(c=>c.name),expected.map(r=>r.name));
    }
  });

  test("duplicate application fails transactionally without changing records",async()=>{
    const beforeRows=(await db.query("select * from public.cafes order by slug")).rows;
    await assert.rejects(db.exec(migration),/already exists/);await db.exec("rollback");
    assert.deepEqual((await db.query("select * from public.cafes order by slug")).rows,beforeRows);
  });
});

/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {PGlite}=require('@electric-sql/pglite');
test('preferences migration: constraints, own CRUD, isolation, cascades and existing tables unchanged',async()=>{
 const db=new PGlite();const alice='00000000-0000-0000-0000-000000000001',bob='00000000-0000-0000-0000-000000000002';
 const as=async(role,id,fn)=>{await db.exec(`set role ${role}`);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);try{return await fn();}finally{await db.exec('reset role');}};
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;`);
  const files=fs.readdirSync('supabase/migrations').sort();
  for(const f of files.filter(f=>!f.includes('personalised_match')))await db.exec(fs.readFileSync('supabase/migrations/'+f,'utf8').replace('create extension if not exists pgcrypto;',''));
  await db.exec(fs.readFileSync('supabase/seed.sql','utf8'));
  await db.query('insert into auth.users values($1,$2),($3,$4)',[alice,JSON.stringify({username:'alice'}),bob,JSON.stringify({username:'bobby'})]);
  const snapshot=async()=>({cafes:(await db.query('select * from cafes order by id')).rows,profiles:(await db.query('select * from profiles order by id')).rows,policies:(await db.query("select * from pg_policies where tablename in ('cafes','profiles') order by tablename,policyname")).rows,triggers:(await db.query("select tgname,pg_get_triggerdef(oid) as definition from pg_trigger where tgrelid='cafes'::regclass order by tgname")).rows});
  const before=await snapshot();await db.exec(fs.readFileSync('supabase/migrations/'+files.find(f=>f.includes('personalised_match')),'utf8'));
  assert.deepEqual(await snapshot(),before);
  const insert=id=>db.query("insert into user_study_preferences(user_id,atmosphere_preference,session_length,priorities) values($1,'quiet','medium',array['wifi']) returning *",[id]);
  await as('authenticated',bob,()=>insert(bob));
  await as('authenticated',alice,async()=>{
   await insert(alice);assert.equal((await db.query('select * from user_study_preferences')).rows.length,1);
   assert.equal((await db.query('select * from user_study_preferences where user_id=$1',[bob])).rows.length,0);
   assert.equal((await db.query("update user_study_preferences set session_length='long' where user_id=$1 returning *",[alice])).rows[0].session_length,'long');
   assert.equal((await db.query("update user_study_preferences set session_length='short' where user_id=$1 returning *",[bob])).rows.length,0);
   assert.equal((await db.query('delete from user_study_preferences where user_id=$1 returning *',[bob])).rows.length,0);
   await assert.rejects(insert(bob),/row-level security/);
   await assert.rejects(db.query('update user_study_preferences set user_id=$1',[bob]),/permission denied/);
   for(const sql of ["atmosphere_preference='bad'","session_length='bad'","priorities=array['wifi','coffee','space','sockets']","priorities=array['wifi','wifi']","priorities=array['bad']","priorities=array[null]","priorities=null"]){await assert.rejects(db.query('update user_study_preferences set '+sql),/constraint|null value/);}
   const profile=(await db.query("select * from get_public_profile('bobby')")).rows[0];assert(!('priorities' in profile));
   await db.query('delete from user_study_preferences where user_id=$1',[alice]);assert.equal((await db.query('select * from user_study_preferences')).rows.length,0);
   await insert(alice);
  });
  await as('anon',null,async()=>{for(const sql of ['select * from user_study_preferences',"update user_study_preferences set session_length='long'",'delete from user_study_preferences'])await assert.rejects(db.query(sql),/permission denied/);await assert.rejects(insert(alice),/permission denied/);});
  assert.deepEqual(await snapshot(),before);
  await db.query('delete from auth.users where id=$1',[bob]);assert.equal((await db.query('select * from user_study_preferences where user_id=$1',[bob])).rows.length,0);
 }finally{await db.close();}
});

/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node/PostgreSQL tests. */
const {test,describe,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const {PGlite}=require('@electric-sql/pglite');
const {validateAuthFields,normalizeUsername,authErrorMessage}=require('../.next/auth-tests/utils/auth.js');
const migration=fs.readFileSync(path.join(__dirname,'../supabase/migrations/20260912100549_accounts_profiles.sql'),'utf8');
const valid={username:'george_green',email:'george@example.test',password:'study-time-2026'};

test('signup validation accepts clean usernames and normalizes uppercase',()=>{
 assert.deepEqual(validateAuthFields(valid,true),{});
 assert.equal(normalizeUsername('  Alex23 '),'alex23');
 for(const username of ['ab','a'.repeat(21),'user.name','user name','éclair','name-123'])assert(validateAuthFields({...valid,username},true).username);
 for(const username of ['abc','a'.repeat(20),'alex23','study_with_sam'])assert.equal(validateAuthFields({...valid,username},true).username,undefined);
});
test('inline email/password errors and older sign-in passwords',()=>{
 for(const email of ['','wrong','@example.com','a b@example.com','a@'])assert(validateAuthFields({...valid,email},true).email);
 assert(validateAuthFields({...valid,password:'1234567'},true).password);
 assert.equal(validateAuthFields({...valid,password:'12345678'},true).password,undefined);
 assert.equal(validateAuthFields({...valid,username:'',password:'old123'},false).password,undefined);
 assert(validateAuthFields({...valid,password:''},false).password);
});
test('auth errors are useful without leaking backend details',()=>{
 assert.match(authErrorMessage({code:'invalid_credentials'}),/don’t match/);
 assert.match(authErrorMessage({code:'email_not_confirmed'}),/confirm/);
 assert.match(authErrorMessage({code:'weak_password'}),/stronger password/);
 assert.match(authErrorMessage({status:429}),/wait/);
 assert(!authErrorMessage({code:'unexpected_failure',message:'sensitive backend detail'}).includes('sensitive'));
});

async function baseDatabase(existing=[]){
 const db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create role supabase_auth_admin;
 create schema auth;
 create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated,supabase_auth_admin;
 grant insert on auth.users to supabase_auth_admin;`);
 for(const file of ['202608280001_create_cafes.sql','202609100001_cafe_cities_and_workspace_details.sql','202609110001_cafe_independence.sql','20260911222828_study_score_v1.sql']){
  await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations',file),'utf8').replace('create extension if not exists pgcrypto;',''));
 }
 for(const user of existing)await db.query('insert into auth.users values($1,$2,$3)',[user.id,user.email,JSON.stringify(user.metadata)]);
 return db;
}
const alice='00000000-0000-0000-0000-000000000001',bob='00000000-0000-0000-0000-000000000002';
describe('profiles migration and authorization',()=>{
 let db,cafeState;
 const security=async()=>({
  flags:(await db.query("select relrowsecurity,relacl::text from pg_class where oid='public.cafes'::regclass")).rows,
  policies:(await db.query("select * from pg_policies where schemaname='public' and tablename='cafes'")).rows,
  rows:(await db.query('select * from public.cafes')).rows,
 });
 async function as(role,id,fn){
  await db.exec(`set role ${role}`);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);
  try{return await fn();}finally{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub','',false)");}
 }
 async function user(id,username,extra={}){return db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[id,`${id}@private.test`,JSON.stringify({username,...extra})]);}
 before(async()=>{
  db=await baseDatabase();
  await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/seed.sql'),'utf8'));
  cafeState=await security();await db.exec(migration);
 });
 after(async()=>{await db?.close();});
 test('auth transaction automatically creates only approved profile fields',async()=>{
  await as('supabase_auth_admin',null,()=>user(alice,' Alice_23 ',{display_name:' Alice ',email:'injected',role:'admin',is_admin:true,avatar_url:'https://injected.example/image'}));
  await user(bob,'bob_456');
  const row=(await db.query('select * from public.profiles where id=$1',[alice])).rows[0];
  assert.equal(row.username,'alice_23');assert.equal(row.display_name,'Alice');assert.equal(row.avatar_url,null);
  assert.deepEqual(Object.keys(row).sort(),['id','username','display_name','avatar_url','created_at','updated_at'].sort());
  assert(row.created_at);assert(row.updated_at);
 });
 test('invalid/missing and case-duplicate usernames roll back the auth user too',async()=>{
  for(const [i,name] of [undefined,'ab','UPPER-INVALID','alice_23','ALICE_23'].entries()){
   const id=`10000000-0000-0000-0000-${String(i).padStart(12,'0')}`;
   await assert.rejects(user(id,name),/null value|check constraint|unique constraint/);
   assert.equal((await db.query('select * from auth.users where id=$1',[id])).rows.length,0);
   assert.equal((await db.query('select * from public.profiles where id=$1',[id])).rows.length,0);
  }
 });
 test('anonymous username availability exposes a boolean only',async()=>{
  await as('anon',null,async()=>{
   for(const [candidate,expected] of [['alice_23',false],['ALICE_23',false],['free_name',true],['bad-name',false],[null,false]])assert.equal((await db.query('select public.is_username_available($1) as available',[candidate])).rows[0].available,expected);
   await assert.rejects(db.query('select * from public.profiles'),/permission denied/);
   await assert.rejects(db.query("update public.profiles set display_name='Hacked'"),/permission denied/);
   await assert.rejects(db.query("select * from public.get_public_profile('alice_23')"),/permission denied/);
   await assert.rejects(db.query("select * from hot_seats_private.public_profile('alice_23')"),/permission denied/);
  });
 });
 test('signed-in users read their own full profile, and only the safe projection of others',async()=>{
  await as('authenticated',alice,async()=>{
   const own=(await db.query('select * from public.profiles')).rows;assert.equal(own.length,1);assert.equal(own[0].id,alice);
   const other=(await db.query("select * from public.get_public_profile('bob_456')")).rows[0];
   assert.deepEqual(Object.keys(other).sort(),['id','username','display_name','avatar_url'].sort());assert.equal(other.id,bob);
   assert(!JSON.stringify(other).includes('@private.test'));
   assert.equal((await db.query('select * from public.profiles where id=$1',[bob])).rows.length,0);
  });
  await as('authenticated',null,async()=>assert.equal((await db.query("select * from public.get_public_profile('alice_23')")).rows.length,0));
 });
 test('own profile updates work; other rows and immutable/private columns are protected',async()=>{
  await as('authenticated',alice,async()=>{
   const changed=await db.query("update public.profiles set display_name='Alice Green',avatar_url='https://example.test/alice.png' where id=$1 returning *",[alice]);assert.equal(changed.rows[0].display_name,'Alice Green');
   assert.equal((await db.query("update public.profiles set display_name='Hacked' where id=$1 returning id",[bob])).rows.length,0);
   for(const column of ['id','created_at','updated_at'])await assert.rejects(db.query(`update public.profiles set ${column}=${column} where id=$1`,[alice]),/permission denied/);
   await assert.rejects(db.query("insert into public.profiles(id,username) values($1,'fake')",[alice]),/permission denied/);
   await assert.rejects(db.query('delete from public.profiles where id=$1',[alice]),/permission denied/);
   await assert.rejects(db.query("update public.profiles set username='BOB_456' where id=$1",[alice]),/check constraint/);
   await assert.rejects(db.query("update public.profiles set username='bob_456' where id=$1",[alice]),/unique constraint/);
   await assert.rejects(db.query("update public.profiles set avatar_url='javascript:alert(1)' where id=$1",[alice]),/check constraint/);
  });
 });
 test('editing auth metadata cannot rename a profile or grant privileges',async()=>{
  await db.query("update auth.users set raw_user_meta_data=$1 where id=$2",[JSON.stringify({username:'stolen_name',role:'admin'}),alice]);
  assert.equal((await db.query('select username from public.profiles where id=$1',[alice])).rows[0].username,'alice_23');
 });
 test('deleting an auth user cascades only their profile',async()=>{
  await db.query('delete from auth.users where id=$1',[bob]);assert.equal((await db.query('select * from public.profiles where id=$1',[bob])).rows.length,0);
  assert.equal((await db.query('select * from public.profiles where id=$1',[alice])).rows.length,1);
 });
 test('cafe rows and cafe RLS/grants are unchanged',async()=>assert.deepEqual(await security(),cafeState));
 test('new functions have explicit security boundaries and a fixed search path',async()=>{
  const funcs=(await db.query("select n.nspname,p.proname,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='hot_seats_private' or p.proname in ('is_username_available','get_public_profile')")).rows;
  assert.equal(funcs.length,5);
  for(const f of funcs){assert.equal(f.prosecdef,f.nspname==='hot_seats_private');assert(f.proconfig.some(v=>v.startsWith('search_path=')));}
 });
});
test('migration handles existing reviewed users and fails atomically for missing usernames',async()=>{
 const good=await baseDatabase([{id:alice,email:'private@test.example',metadata:{username:'existing_user'}}]);
 try{await good.exec(migration);assert.equal((await good.query('select username from public.profiles')).rows[0].username,'existing_user');}finally{await good.close();}
 const bad=await baseDatabase([{id:alice,email:'never-derived@test.example',metadata:{}}]);
 try{await assert.rejects(bad.exec(migration),/null value/);await bad.exec('rollback');assert.equal((await bad.query("select to_regclass('public.profiles') as name")).rows[0].name,null);assert.equal((await bad.query('select count(*)::int as n from auth.users')).rows[0].n,1);}finally{await bad.close();}
});

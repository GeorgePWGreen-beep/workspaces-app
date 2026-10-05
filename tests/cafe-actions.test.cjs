/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const { cafeShareUrl, cafeDirections } = require('../.next/cafe-actions-tests/cafeActions.js');

test('share URLs use the current origin and stable identity, without auth or filter parameters', () => {
  const url = new URL(cafeShareUrl({ id: 'uuid', slug: 'cafe-and-co', name: 'Café & Co' }, 'https://hotseats.example'));
  assert.equal(url.origin, 'https://hotseats.example');
  assert.equal(url.pathname, '/'); assert.equal(url.searchParams.get('cafe'), 'cafe-and-co');
  assert.equal([...url.searchParams].length, 1);
  assert.equal(new URL(cafeShareUrl({ id: 'uuid', name: 'Test' }, url.origin)).searchParams.get('cafe'), 'uuid');
});

test('maps use latitude,longitude and encode name/address fallback safely', () => {
  const cafe = { name: 'Café & Co', city: 'Exeter', coords: [-3.53, 50.72] };
  const links = cafeDirections(cafe);
  assert(links.hasCoordinates);
  assert.equal(new URL(links.apple).searchParams.get('daddr'), '50.72,-3.53');
  assert.equal(new URL(links.google).searchParams.get('destination'), '50.72,-3.53');
  assert.equal(new URL(links.google).searchParams.get('api'), '1');
  for (const coords of [undefined, null, [], [NaN, 50], [0, 91], [181, 0]]) {
    const fallback = cafeDirections({ ...cafe, coords, address: '1 High St & Lane' });
    assert(!fallback.hasCoordinates);
    assert.equal(new URL(fallback.apple).searchParams.get('daddr'), 'Café & Co, 1 High St & Lane');
    assert.equal(new URL(fallback.google).searchParams.get('destination'), 'Café & Co, 1 High St & Lane');
  }
  assert.equal(new URL(cafeDirections({ ...cafe, coords: null }).google).searchParams.get('destination'), 'Café & Co, Exeter');
  assert(cafeDirections({ ...cafe, coords: [0, 0] }).hasCoordinates);
});

test('saved cafes migration: own CRUD only, uniqueness, foreign keys, cascades and data preservation', async () => {
  const db = new PGlite();
  const alice = '00000000-0000-0000-0000-000000000001', bob = '00000000-0000-0000-0000-000000000002';
  const as = async (role, user, callback) => {
    await db.exec(`set role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user || '']);
    try { return await callback(); } finally { await db.exec('reset role'); }
  };
  const snapshot = async () => Promise.all(['cafes', 'profiles', 'user_study_preferences', 'friendships'].map(async table => (await db.query(`select to_jsonb(t) as row from ${table} t order by to_jsonb(t)::text`)).rows));
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to anon,authenticated;");
    const migrations = fs.readdirSync('supabase/migrations').sort();
    for (const file of migrations.filter(f => !f.endsWith('_saved_cafes.sql'))) await db.exec(fs.readFileSync('supabase/migrations/' + file, 'utf8').replace('create extension if not exists pgcrypto;', ''));
    await db.exec(fs.readFileSync('supabase/seed.sql', 'utf8'));
    await db.query('insert into auth.users values($1,$2),($3,$4)', [alice, '{"username":"alice"}', bob, '{"username":"bobby"}']);
    const before = await snapshot();
    const policiesBefore = (await db.query('select * from pg_policies order by tablename,policyname')).rows;
    await db.exec(fs.readFileSync('supabase/migrations/' + migrations.find(f => f.endsWith('_saved_cafes.sql')), 'utf8'));
    assert.deepEqual(await snapshot(), before);
    assert.deepEqual((await db.query("select * from pg_policies where tablename <> 'saved_cafes' order by tablename,policyname")).rows, policiesBefore);
    assert.equal((await db.query("select relrowsecurity from pg_class where oid='saved_cafes'::regclass")).rows[0].relrowsecurity, true);
    assert.equal((await db.query("select * from pg_policies where tablename='saved_cafes'")).rows.length, 3);
    const cafe = (await db.query('select id from cafes limit 1')).rows[0].id;
    const save = (user = alice, id = cafe) => db.query('insert into saved_cafes(user_id,cafe_id) values($1,$2) returning *', [user, id]);
    await as('authenticated', alice, async () => {
      assert.equal((await save()).rows[0].cafe_id, cafe);
      await assert.rejects(save(), /saved_cafes_user_cafe_unique/);
      await assert.rejects(save(bob), /row-level security/);
      await assert.rejects(save(alice, '00000000-0000-0000-0000-000000000099'), /foreign key/);
      await assert.rejects(db.query('update saved_cafes set cafe_id=$1', [cafe]), /permission denied/);
      await assert.rejects(db.query('insert into saved_cafes(user_id,cafe_id,created_at) values($1,$2,now())', [alice, cafe]), /permission denied/);
    });
    await as('authenticated', bob, async () => {
      assert.equal((await db.query('select * from saved_cafes')).rows.length, 0);
      assert.equal((await db.query('delete from saved_cafes where user_id=$1 returning *', [alice])).rows.length, 0);
      await save(bob); // Same cafe can be saved independently by each account.
    });
    await as('anon', null, async () => {
      await assert.rejects(db.query('select * from saved_cafes'), /permission denied/);
      await assert.rejects(save(), /permission denied/);
    });
    await as('authenticated', alice, async () => {
      assert.equal((await db.query('select * from saved_cafes')).rows.length, 1);
      assert.equal((await db.query('delete from saved_cafes returning *')).rows.length, 1);
      await save();
    });
    assert.deepEqual(await snapshot(), before);
    await db.query('delete from auth.users where id=$1', [alice]);
    assert.equal((await db.query('select * from saved_cafes')).rows.length, 1);
    await db.query('delete from cafes where id=$1', [cafe]);
    assert.equal((await db.query('select * from saved_cafes')).rows.length, 0);
  } finally { await db.close(); }
});

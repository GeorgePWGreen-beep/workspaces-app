/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const { normalizeFriendUsername, validFriendUsername, groupFriendships, friendError } = require('../.next/friends-tests/utils/friends.js');

test('username normalization, validation and actionable failures', () => {
  assert.equal(normalizeFriendUsername('  @Alice_2 '), 'alice_2');
  for (const value of ['alice_2', '123']) assert(validFriendUsername(value));
  for (const value of ['ab', 'a'.repeat(21), 'a@b.com', 'a b', '%', 'Alice']) assert(!validFriendUsername(value));
  assert.match(friendError({ code: '23505' }), /already/i);
  assert.match(friendError({ code: 'PGRST116' }), /changed|available|refresh/i);
  assert.match(friendError(new Error('offline')), /try again|connection/i);
});

test('friendships migration: CRUD, identity, RLS, privacy and existing data', async t => {
  const db = new PGlite();
  const [alice, bob, outsider] = [1, 2, 3].map(n => `00000000-0000-0000-0000-00000000000${n}`);
  const as = async (role, id, fn) => {
    await db.exec(`set role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id || '']);
    try { return await fn(); } finally { await db.exec('reset role'); }
  };
  const send = (from = alice, to = bob) => db.query('insert into friendships(requester_id,addressee_id) values($1,$2) returning *', [from, to]);
  const accept = id => db.query("update friendships set status='accepted' where id=$1 and status='pending' returning *", [id]);
  const remove = (id, status) => db.query('delete from friendships where id=$1 and status=$2 returning *', [id, status]);
  const snapshot = async () => ({
    cafes: (await db.query('select * from cafes order by id')).rows,
    profiles: (await db.query('select * from profiles order by id')).rows,
    preferences: (await db.query('select * from user_study_preferences order by user_id')).rows,
    policies: (await db.query("select * from pg_policies where tablename in ('cafes','profiles','user_study_preferences') order by tablename,policyname")).rows,
  });
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to anon,authenticated;");
    const files = fs.readdirSync('supabase/migrations').sort();
    for (const file of files.filter(f => !f.includes('friends_v1'))) await db.exec(fs.readFileSync('supabase/migrations/' + file, 'utf8').replace('create extension if not exists pgcrypto;', ''));
    await db.exec(fs.readFileSync('supabase/seed.sql', 'utf8'));
    for (const [id, username] of [[alice, 'alice'], [bob, 'bobby'], [outsider, 'outsider']]) await db.query('insert into auth.users values($1,$2,$3)', [id, username + '@private.test', JSON.stringify({ username })]);
    const before = await snapshot();
    await db.exec(fs.readFileSync('supabase/migrations/' + files.find(f => f.includes('friends_v1')), 'utf8'));
    assert.deepEqual(await snapshot(), before);
    let id;
    await t.test('send, self rejection, unordered unique pair, incoming/outgoing and projection', async () => {
      await as('authenticated', alice, async () => {
        await assert.rejects(send(alice, alice), /friendships_no_self/);
        const row = (await send()).rows[0]; id = row.id;
        assert.equal(row.status, 'pending'); assert.equal(row.accepted_at, null);
        await assert.rejects(send(), /friendships_unique_pair/);
        const rows = (await db.query('select * from get_friendships()')).rows;
        assert.equal(rows[0].profile_id, bob);
        assert.equal(groupFriendships(rows, alice).outgoing.length, 1);
        assert.deepEqual(Object.keys(rows[0]).sort(), ['id','requester_id','addressee_id','status','created_at','updated_at','accepted_at','profile_id','username','display_name','avatar_url'].sort());
      });
      await as('authenticated', bob, async () => {
        await assert.rejects(send(bob, alice), /friendships_unique_pair/);
        assert.equal(groupFriendships((await db.query('select * from get_friendships()')).rows, bob).incoming.length, 1);
      });
    });
    await t.test('outsider cannot see or mutate, requester cannot accept, IDs and timestamps immutable', async () => {
      await as('authenticated', outsider, async () => {
        assert.equal((await db.query('select * from friendships')).rows.length, 0);
        assert.equal((await db.query('select * from get_friendships()')).rows.length, 0);
        assert.equal((await accept(id)).rows.length, 0);
        assert.equal((await remove(id, 'pending')).rows.length, 0);
        await assert.rejects(send(alice, outsider), /row-level security/);
      });
      await as('authenticated', alice, async () => {
        assert.equal((await accept(id)).rows.length, 0);
        for (const assignment of ["requester_id='" + bob + "'", "addressee_id='" + outsider + "'", 'created_at=now()', 'accepted_at=now()', 'updated_at=now()', 'id=gen_random_uuid()']) await assert.rejects(db.query('update friendships set ' + assignment), /permission denied/);
        await assert.rejects(db.query("insert into friendships(requester_id,addressee_id,status) values($1,$2,'accepted')", [alice, outsider]), /permission denied/);
      });
      await as('authenticated', bob, () => assert.rejects(send(alice, outsider), /row-level security/));
    });
    await t.test('recipient accepts, stale cancellation cannot remove accepted friend, either side removes', async () => {
      await as('authenticated', bob, async () => {
        const row = (await accept(id)).rows[0]; assert.equal(row.status, 'accepted'); assert(row.accepted_at); assert.equal(row.updated_at.getTime(), row.accepted_at.getTime());
        assert.equal((await accept(id)).rows.length, 0);
        assert.equal((await db.query("update friendships set status='pending' returning *")).rows.length, 0);
      });
      await as('authenticated', alice, async () => {
        assert.equal(groupFriendships((await db.query('select * from get_friendships()')).rows, alice).friends.length, 1);
        assert.equal((await remove(id, 'pending')).rows.length, 0);
        assert.equal((await remove(id, 'accepted')).rows.length, 1);
        id = (await send()).rows[0].id;
      });
      await as('authenticated', bob, async () => { await accept(id); assert.equal((await remove(id, 'accepted')).rows.length, 1); });
    });
    await t.test('decline, cancel, stale/deleted acceptance and resend', async () => {
      id = await as('authenticated', alice, async () => (await send()).rows[0].id);
      await as('authenticated', bob, async () => { assert.equal((await remove(id, 'pending')).rows.length, 1); assert.equal((await accept(id)).rows.length, 0); });
      await as('authenticated', alice, async () => { id = (await send()).rows[0].id; assert.equal((await remove(id, 'pending')).rows.length, 1); });
    });
    await t.test('exact search only exposes four public fields and preserves owner-only profiles', async () => {
      await as('authenticated', alice, async () => {
        const result = (await db.query("select * from get_public_profile(' BOBBY ')")).rows;
        assert.equal(result[0].id, bob);
        assert.deepEqual(Object.keys(result[0]).sort(), ['id','username','display_name','avatar_url'].sort());
        assert.equal((await db.query("select * from get_public_profile('bob')")).rows.length, 0);
        assert.equal((await db.query('select * from profiles')).rows.length, 1);
      });
      await as('anon', null, async () => {
        for (const sql of ['select * from friendships', 'select * from get_friendships()', "select * from get_public_profile('bobby')", 'delete from friendships', "update friendships set status='accepted'"]) await assert.rejects(db.query(sql), /permission denied/);
        await assert.rejects(send(), /permission denied/);
      });
      await as('authenticated', null, async () => { assert.equal((await db.query('select * from get_friendships()')).rows.length, 0); await assert.rejects(send(), /row-level security/); });
    });
    assert.deepEqual(await snapshot(), before);
    await t.test('deleting either account cascades relationships', async () => {
      await as('authenticated', alice, () => send());
      await db.query('delete from auth.users where id=$1', [bob]);
      assert.equal((await db.query('select * from friendships')).rows.length, 0);
      await as('authenticated', alice, () => send(alice, outsider));
      await db.query('delete from auth.users where id=$1', [alice]);
      assert.equal((await db.query('select * from friendships')).rows.length, 0);
    });
  } finally { await db.close(); }
});

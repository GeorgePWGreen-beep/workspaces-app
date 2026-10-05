/* eslint-disable @typescript-eslint/no-require-imports */
// Local-only protocol fixture: real PostgreSQL migrations/RLS, fake Auth tokens.
// No production connection, real email or passwords. Bound to loopback only.
const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
const crypto = require('node:crypto');
const http = require('node:http');
const accounts = new Map();
const session = user => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = [ { alg: 'HS256', typ: 'JWT' }, { sub: user.id, role: 'authenticated', aud: 'authenticated', exp } ].map(v => Buffer.from(JSON.stringify(v)).toString('base64url')).join('.') + '.local-test-signature';
  return { access_token: token, refresh_token: user.email, expires_in: 3600, expires_at: exp, token_type: 'bearer', user };
};
function identity(req) {
  try {
    const payload = JSON.parse(Buffer.from(req.headers.authorization.split('.')[1], 'base64url'));
    return [...accounts.values()].find(u => u.id === payload.sub);
  } catch { return null; }
}
(async () => {
  const db = new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to anon,authenticated;");
  for (const file of fs.readdirSync('supabase/migrations').sort()) await db.exec(fs.readFileSync('supabase/migrations/' + file, 'utf8').replace('create extension if not exists pgcrypto;', ''));
  await db.exec(fs.readFileSync('supabase/seed.sql', 'utf8'));
  for (const username of ['alice_studies', 'bob_studies', 'carol_studies']) {
    const id = crypto.randomUUID(), email = username + '@example.test';
    await db.query('insert into auth.users values($1,$2)', [id, JSON.stringify({ username, display_name: username === 'bob_studies' ? 'Bob — a very long display name for responsive verification' : null })]);
    if (username === 'bob_studies') await db.query("update profiles set avatar_url='https://avatars.example.test/bob.png' where id=$1", [id]);
    accounts.set(email, { id, email, aud: 'authenticated', role: 'authenticated', created_at: new Date().toISOString(), email_confirmed_at: new Date().toISOString(), app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { username }, identities: [] });
  }
  async function dispatch(req, res) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization,apikey,content-type,x-client-info,x-supabase-api-version,prefer,accept,accept-profile,content-profile,range');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    const send = (value, status = 200) => { res.statusCode = status; res.end(JSON.stringify(value)); };
    if (req.method === 'OPTIONS') return send({});
    const url = new URL(req.url, 'http://127.0.0.1');
    let raw = ''; for await (const part of req) raw += part;
    const body = raw ? JSON.parse(raw) : {}, user = identity(req);
    if (url.pathname === '/rest/v1/cafes') return send((await db.query('select * from cafes where is_active order by study_score desc,name')).rows);
    if (url.pathname === '/auth/v1/.well-known/jwks.json') return send({ keys: [] });
    if (url.pathname === '/auth/v1/token') {
      const account = accounts.get(body.email || body.refresh_token);
      return account && (body.password === 'study-time-2026' || body.refresh_token) ? send(session(account)) : send({ code: 'invalid_credentials', msg: 'Invalid login credentials' }, 400);
    }
    if (url.pathname === '/auth/v1/user') return user ? send(user) : send({ message: 'Invalid JWT' }, 401);
    if (url.pathname === '/auth/v1/logout') { res.statusCode = 204; return res.end(); }
    if (!user) return send({ code: '42501', message: 'Sign in required' }, 401);
    await db.exec('set role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user.id]);
    try {
      let rows;
      if (url.pathname === '/rest/v1/rpc/get_public_profile') rows = (await db.query('select * from get_public_profile($1)', [body.requested_username])).rows;
      else if (url.pathname === '/rest/v1/rpc/get_friendships') rows = (await db.query('select * from get_friendships() order by created_at desc,id offset $1 limit $2', [Number(url.searchParams.get('offset') || 0), Number(url.searchParams.get('limit') || 100)])).rows;
      else if (url.pathname === '/rest/v1/profiles') rows = (await db.query('select * from profiles')).rows;
      else if (url.pathname === '/rest/v1/user_study_preferences') rows = (await db.query('select * from user_study_preferences')).rows;
      else if (url.pathname === '/rest/v1/saved_cafes') {
        if (req.method === 'POST') rows = (await db.query('insert into saved_cafes(user_id,cafe_id) values($1,$2) returning *', [body.user_id, body.cafe_id])).rows;
        else if (req.method === 'DELETE') rows = (await db.query('delete from saved_cafes where user_id=$1 and cafe_id=$2 returning *', [url.searchParams.get('user_id')?.replace(/^eq\./, ''), url.searchParams.get('cafe_id')?.replace(/^eq\./, '')])).rows;
        else rows = (await db.query('select cafe_id from saved_cafes where user_id=$1 order by created_at desc,cafe_id offset $2 limit $3', [url.searchParams.get('user_id')?.replace(/^eq\./, ''), Number(url.searchParams.get('offset') || 0), Number(url.searchParams.get('limit') || 100)])).rows;
      }
      else if (url.pathname === '/rest/v1/friendships') {
        if (req.method === 'POST') rows = (await db.query('insert into friendships(requester_id,addressee_id) values($1,$2) returning id', [body.requester_id, body.addressee_id])).rows;
        else {
          const values = [], filters = [];
          for (const name of ['id', 'status', 'requester_id', 'addressee_id']) if (url.searchParams.has(name)) { values.push(url.searchParams.get(name).replace(/^eq\./, '')); filters.push(name + '=$' + values.length); }
          const where = filters.length ? ' where ' + filters.join(' and ') : '';
          if (req.method === 'PATCH') { values.push(body.status); rows = (await db.query('update friendships set status=$' + values.length + where + ' returning id', values)).rows; }
          else rows = (await db.query((req.method === 'DELETE' ? 'delete from friendships' : 'select * from friendships') + where + (req.method === 'DELETE' ? ' returning id' : ''), values)).rows;
        }
      } else return send({ message: 'Unknown test route' }, 404);
      if (req.headers.accept?.includes('vnd.pgrst.object')) return rows.length === 1 ? send(rows[0]) : send({ code: 'PGRST116', message: 'No row' }, 406);
      return send(rows);
    } catch (error) { return send({ code: error.code, message: error.message }, 400); }
    finally { await db.exec('reset role'); }
  }
  // One connection: serialize requests so SET ROLE never leaks between identities.
  let queue = Promise.resolve();
  http.createServer((req, res) => { queue = queue.then(() => dispatch(req, res)).catch(error => { console.error(error); res.statusCode = 500; res.end('{}'); }); }).listen(54335, '127.0.0.1', () => console.log('Friends fixture ready on 127.0.0.1:54335 (isolated PGlite)'));
})().catch(error => { console.error(error); process.exit(1); });

# Hot Seats accounts

Implemented on the current Study Score v1 repository without changing cafe data,
scoring, filters or navigation. No commit or push was made.

## Files

- `components/AuthProvider.tsx`: shared validated user/profile state and auth actions.
- `components/AccountSheet.tsx`, `components/AccountButton.tsx`: account UI.
- `components/HomeClient.tsx`, `components/FloatingSearch.tsx`, `components/Sidebar.tsx`,
  `app/layout.tsx`: existing icon, desktop access, provider and sheet integration.
- `proxy.ts`, `lib/supabase/proxy.ts`, `lib/supabase/server.ts`,
  `app/auth/confirm/route.ts`: cookie refresh and confirmation callback.
- `utils/auth.ts`, `types/profile.ts`, `types/database.ts`: validation and typed contracts.
- `supabase/migrations/20260912100549_accounts_profiles.sql`: schema/security/trigger.
- `tests/auth.test.cjs`, `package.json`: focused validation and PostgreSQL security tests.
- `docs/accounts-auth.md`: implementation and deployment report.

No dependency changes or environment-file changes.

## Profiles and permissions

| Column | Type | Rules |
| --- | --- | --- |
| id | uuid | Primary key; references auth.users(id), delete cascades |
| username | text | Required, unique, lowercase `[a-z0-9_]{3,20}` |
| display_name | text | Nullable; 1–80 characters when supplied |
| avatar_url | text | Nullable; HTTPS, no whitespace, maximum 2,048 characters |
| created_at | timestamptz | Required; defaults to now() |
| updated_at | timestamptz | Required; defaults to now(); timestamp trigger on update |

RLS is enabled. `profiles_read_own` permits authenticated SELECT only where
`auth.uid() = id`. `profiles_update_own` applies that condition to both existing
and replacement rows. Column grants allow updates only to username, display_name
and avatar_url. Clients cannot insert/delete profiles, change ownership or set
timestamps. Other profiles are unavailable through direct table reads.

Authenticated `get_public_profile(requested_username)` returns only id, username,
display_name and avatar_url for an exact normalized username. It never exposes
timestamps, email or auth metadata. Anonymous `is_username_available(candidate)`
returns a boolean only; usernames can consequently be checked for availability.

Public RPC wrappers are SECURITY INVOKER. Their narrowly scoped SECURITY DEFINER
implementations are in `hot_seats_private`, use an empty search_path and fully
qualified relations. The public-profile implementation also checks auth.uid().
Keep this private schema out of Supabase's exposed API schemas. The creation
trigger function cannot be called by application roles. Profile metadata carries
no authorization roles or admin flags. Existing cafe grants/RLS are untouched.

## Signup, login and sessions

Signup requires username, email and password. The app normalizes usernames to
lowercase, validates inline, checks availability, and passes the username in
Supabase signup metadata. The database unique/check constraints are authoritative.
A username race is checked again after a failed auth insert and receives an
inline duplicate message. Passwords require at least eight characters in signup;
Supabase's configured password rules remain authoritative.

`hot_seats_auth_user_created` inserts the profile in the same transaction as the
auth user. Invalid metadata or a duplicate username rolls back the account insert,
preventing silent partial accounts. Existing users are backfilled only from supplied
metadata; missing/invalid/duplicate usernames abort the entire migration for review.
Usernames are never generated from email. Editing auth metadata later does not
change profile ownership or bypass profile rules.

One AuthProvider handles signup, password login, logout, loading, validated user
restoration and own-profile loading. It handles SDK auth events outside the SDK's
callback lock and rejects stale profile responses. A profile read failure leaves
the signed-in user visible with an explicit Retry account action and logout.
Submission guards and disabled controls prevent duplicate requests.

The existing browser client uses persistent Supabase SSR cookies. The Next.js 16
proxy validates/refreshes with getClaims and propagates refreshed cookies to the
request and response, including SDK cache headers. The provider uses getUser rather
than trusting a client session as authorization. The proxy covers `/` and `/auth/*`;
future protected routes must add server-side authorization and appropriate matching.
Database access continues to rely on RLS. Logout uses local scope, removes this
browser's session and preserves current city/search/filter/map state.

The mobile profile icon opens welcome/signup/signin when logged out, or a minimal
username/display-name, private email and logout view when signed in. Desktop has
the same button alongside the existing wordmark. The account dialog temporarily
obscures the existing mobile sheet without unmounting it; close restores focus.
Native modal focus handling, Escape, backdrop and close-button dismissal work.

## Email confirmation and required deployment steps

Read-only checks on 2026-09-12 against project **npsnnumnlderkkywwehj**,
`https://npsnnumnlderkkywwehj.supabase.co`, showed email signup enabled and
`mailer_autoconfirm: false`: **email confirmation is enabled**. Public cafe reads
returned 16 records. The profiles REST endpoint returned 404. The CLI had no
access token, so **the migration was not applied**. No production accounts were
created and no emails were sent during this work.

Apply only `20260912100549_accounts_profiles.sql` to the `postgres` database in
that project after the following admin preflight. Do not use the original
greenfield setup/seed instructions for this existing project.

1. Confirm the project reference in the dashboard. Inspect migration history and
   the actual schema using the SQL editor or an authenticated administrator connection:

   ```sql
   select version from supabase_migrations.schema_migrations order by version;
   select to_regclass('public.profiles') as profiles,
          to_regnamespace('hot_seats_private') as private_schema,
          to_regprocedure('public.set_updated_at()') as timestamp_function,
          to_regprocedure('public.is_username_available(text)') as availability_rpc,
          to_regprocedure('public.get_public_profile(text)') as profile_rpc;
   select tgname from pg_trigger
   where tgrelid = 'auth.users'::regclass and not tgisinternal;
   select count(*) as cafe_count from public.cafes;
   select relrowsecurity from pg_class where oid = 'public.cafes'::regclass;
   select * from pg_policies where schemaname = 'public' and tablename = 'cafes';
   select count(*) as existing_auth_users from auth.users;
   with candidates as (
     select id, lower(btrim(raw_user_meta_data ->> 'username')) as username,
            nullif(btrim(raw_user_meta_data ->> 'display_name'), '') as display_name
     from auth.users
   )
   select id, username from candidates
   where username is null or username !~ '^[a-z0-9_]{3,20}$'
      or char_length(display_name) > 80
      or username in (select username from candidates group by username having count(*) > 1);
   ```

   New object names should be absent and the existing timestamp function should
   exist. Review any existing user candidates returned; obtain valid, distinct
   usernames before applying. Do not invent them or silently skip users. Existing
   auth triggers should be reviewed for compatibility. Save cafe rows/policies
   before/after for comparison. Authentication was unavailable here, so these
   administrator-only checks remain pending.

2. Run the exact migration file as one transaction in the project's SQL editor,
   or authenticate/link the CLI and use its migration workflow **only after a dry
   run shows this one new migration**. If older files appear pending, reconcile
   their already-applied history first rather than replaying them. No reset,
   reseed or previous migration reapplication is required. The new migration fails
   on conflicting objects or invalid existing account metadata and rolls back;
   it has 5-second lock and 60-second statement timeouts.

3. Configure Auth Site URL to the deployed Hot Seats origin and allow its exact
   `/auth/confirm` URL in Auth redirect URLs. Add local development callback URLs
   separately when needed. Same-browser default PKCE confirmation is supported.
   For confirmation on another browser/device, set the Confirm signup email link to:

   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm email</a>
   ```

   The callback verifies with Supabase, sets session cookies, and redirects to a
   fixed same-origin home URL with a success/error notice. Arbitrary `next` URLs
   are ignored. Query tokens are removed from the final URL; the response is
   private/no-store and no-referrer. Confirmation-required signup displays a
   Check your email state. Immediate-session signup also works if confirmation is
   disabled later. A repeated-email signup follows Supabase's non-enumerating
   confirmation response, rather than promising a new account was created.

4. After migration and deploy, test a real confirmation email with an authorized
   test account. Verify profile creation, login/reload/logout and public cafe reads.
   Verify own-profile update succeeds, other-profile update fails, and the public
   lookup contains only its four fields. Confirm SMTP delivery, redirect allowlist
   and email template in the dashboard; these settings were not changed or fully
   observable through the available public API.

## Validation

- `npx tsc --noEmit`, `npm run lint -- --ignore-pattern '.npm-cache/**'` and
  `npm run build` pass. The ESLint exclusion covers ignored local test fixtures
  and their generated builds, not application source.
- Filter tests: 19 passing; Study Score tests: 26 passing, including 8,019 SQL/TS
  parity combinations; opening-hours/data tests: 9 passing; auth/profile tests: 13 passing.
- Auth tests execute the actual migration in isolated PostgreSQL (PGlite), covering
  atomic profile creation, duplicate/invalid rollback, existing-account backfill
  failure, anonymous access, own updates, forbidden ownership/timestamp/other-user
  writes, safe projection, metadata injection, cascade deletion and unchanged cafes/RLS.
- Browser checks use the real application and Supabase SDK against an isolated
  Auth protocol test double plus the real profile migration in PGlite. At 390×844,
  360×844 and 1440×844: signup, invalid fields, duplicate username, correct/incorrect
  login, confirmation-required state, callback, reload persistence, logout,
  city/filter preservation, focus restoration and no horizontal overflow pass.
- A 360×500 viewport verifies vertical form scrolling at reduced keyboard height.
  Screenshots were reviewed and a refinement pass improved invalid-field focus
  colors and confirmation copy. Native device keyboards were not tested.
- Production-mode checks also cover cross-device token-hash confirmation, expired
  session refresh/Set-Cookie/private-no-store, bad-link/open-redirect rejection and
  failed-profile retry. No browser runtime errors were observed.
- Additional browser checks cover raced usernames with atomic rollback, the
  disabled submission state, Escape/backdrop dismissal, Saved/Friends empty
  states, Nearby and sheet drag dismissal.
- Map-pin selection opens CafeDetails; search, Independent/Open Now, Study Score
  filtering, Clear All and Exeter (10 cafes) / Cambridge (6 cafes) switching pass.
  A final read-only production query matched all 16 original cafe rows exactly,
  including Arrietty and Cambridge. No production database content was changed.

## Limits

Live signup/SMTP and real GoTrue integration still require the deployment checks
above; protocol fixtures are not proof of live email delivery or Auth configuration.
Profile editing is permitted securely by the database but no settings form or avatar
upload is included. Password recovery/resend UI, OAuth, social features, Saved
persistence, Match, preferences and admin features are outside this change. Saved
and Friends remain their existing empty states. No service-role credentials were
added to the app; only the existing public configuration is used.

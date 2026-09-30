# Friends v1 verification

Friends v1 adds exact username lookup, requests, accepted friends and removal. It reuses the account flow and safe public-profile lookup. There is no presence, location sharing, invitation, messaging or feed.

## Files

- `components/FriendsPanel.tsx`: signed-out prompt, search, friend/request lists, avatars, confirmations and inline feedback.
- `components/WorkspacesSheet.tsx`: Friends in the existing mobile sheet and a desktop panel.
- `components/HomeClient.tsx`, `components/Sidebar.tsx`, `components/AccountSheet.tsx`: navigation and direct sign-in/sign-up entry.
- `lib/data/friends.ts`: centralized search, paginated relationship loading and guarded mutations.
- `types/friends.ts`, `types/database.ts`, `utils/friends.ts`: types, normalization, grouping and errors.
- `supabase/migrations/20260930165506_friends_v1.sql`: the only schema change.
- `tests/friends.test.cjs`, `tests/friends-browser.cjs`, `tests/support/friends-server.cjs`, `tests/support/friends-app.cjs`: SQL/logic tests and isolated browser verification.
- `package.json`: `test:friends` command.
- This report.

## Migration and live verification

Applied **only** `friends_v1` to the existing Hot Seats Supabase project on 2026-09-30. Supabase recorded version **20260930165506**. The CLI originally generated `20260930164149_friends_v1.sql`; the local file was renamed to the recorded version after successful application. Its SQL did not change. No previous migration was reapplied and no production reset, seed or test account was created.

Live catalog checks confirmed the table, foreign keys, checks, indexes, all four RLS policies and restricted column permissions. Anonymous users cannot select friendships or execute the list RPC. Authenticated users cannot insert a status or update participant IDs.

Before/after aggregate row checksums were identical for **cafes, profiles and user_study_preferences**. Checksums of their existing RLS policy definitions were also identical. The new table was empty after migration. No further manual Supabase step is required for this PR; do not apply this migration again.

The post-migration security advisor reported no new Friends findings. Existing project warnings remain about `public.rls_auto_enable()` execution grants and disabled leaked-password protection; these settings were not changed in this PR. Remediation references: [anonymous function execution](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [authenticated function execution](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Schema and authorization

`public.friendships` has a generated UUID `id`, `requester_id` and `addressee_id` referencing `auth.users` with cascading deletion, `status` (pending/accepted), `created_at`, `updated_at`, and nullable `accepted_at`. New requests default to pending. Acceptance sets both timestamps on the server.

A check rejects self-friending. A unique expression index on `least(requester_id, addressee_id), greatest(requester_id, addressee_id)` rejects duplicate pairs in either direction. Acceptance timestamps must agree with status. Participants and creation time are immutable; accepted relationships cannot return to pending.

| Policy | Permission |
| --- | --- |
| `friendships_read_participant` | Only the two participants can read. |
| `friendships_request_own` | Insert only as the authenticated requester, initially pending. |
| `friendships_accept_incoming` | Only the addressee can change pending to accepted. |
| `friendships_delete_participant` | Recipient declines, requester cancels, either participant removes an accepted friendship. |

Column grants further restrict inserts to the two participant columns and updates to status. Client mutations also filter by the expected status and participant to detect stale actions rather than silently removing an accepted friendship.

`get_friendships()` has no user-ID argument. Its private, fixed-search-path implementation checks `auth.uid()` and projects only the other user's `id`, `username`, `display_name`, and `avatar_url` alongside relationship fields. Existing owner-only profile RLS is unchanged. Email, auth metadata, preferences, city, location and saved cafes are not returned.

## Behavior

Search is an explicit form submission, not a request on each keystroke. It trims whitespace, accepts an optional leading `@`, lowercases input and requires a full 3–20 character username. It reuses `get_public_profile`; partial matches are not supported. The current user is excluded from displayed results.

Search results show Add friend, Request sent, Accept/Decline, or Friends according to the current relationship. Every mutation refetches the canonical relationship list on success and failure, reconciling duplicates and stale requests. Manual refresh clears obsolete notices. Another user's changes appear on refresh or reopening Friends; there are no realtime subscriptions.

Removal requires inline confirmation. Errors remain inline and controls become usable again for retry. Avatars use HTTPS public URLs with no referrer; missing or failed images fall back to an initial.

Signed-out users see “Sign in to connect with friends.” Both Sign in and Create account open the existing account flow in the requested mode. Signed-in state is keyed to the current user so another session cannot inherit the previous user's list.

## Verification results

- TypeScript, ESLint and production build: passed.
- 92 automated tests passed: Friends 8, Auth 13, Match/preferences 12, filters 19, Study Score 26, data/opening hours/walking 9, onboarding 5.
- Browser flows passed at **390×844**, **360×844** and **1440×844**, with no page or panel horizontal overflow or page JavaScript errors.
- At each size: signed out, signup/signin entry, empty friends, own-username rejection, no results, public search result, outgoing request, cancel, incoming request, decline, stale cancellation, acceptance, accepted list, removal confirmation, removal failure/retry and load failure/retry.
- Mobile closing returns the dock; Saved opens and dismisses by dragging, and Nearby opens normally afterwards. The existing sheet drag/snap code was retained.
- Desktop-to-mobile resizing after closing Friends leaves no phantom sheet; an open Friends panel also survives switching between desktop and mobile. The desktop close action uses the same sheet cleanup, and touch listeners reattach at the breakpoint.
- SQL tests exercise both participant roles and an unrelated user, duplicate and reversed pairs, self-friending, requester spoofing, forbidden acceptance, immutable fields, stale actions, cascades and exact public-field projection. Existing data and policies are checked before and after the migration.
- Screenshots are in `.npm-cache/friends-qa/screenshots/` (ignored generated artifacts).

Browser verification uses Chromium with an isolated Auth/PostgREST protocol fixture backed by the real SQL migrations in PGlite. External map tiles and avatar responses are stubbed. It does not prove Safari/iOS keyboard behavior or exercise live account credentials. Production schema, grants, RLS and data preservation were checked separately through Supabase.

The pre-existing `/cafes/placeholder.jpg` referenced by seeded cafe data is missing and returns 404 in local browser checks. It is unrelated to Friends avatars and was left outside this PR.

## Repeat the isolated browser checks

1. Install Playwright into a disposable directory if it is not already available, and install its Chromium browser. Set `PLAYWRIGHT_MODULE` to the absolute path of that installation's `@playwright/test` directory. The script defaults to the existing `.npm-cache/hot-seats-qa/tools/node_modules/@playwright/test` tool installation.
2. From the repository root, run `node tests/support/friends-server.cjs`. It binds only `127.0.0.1:54335`, uses in-memory PostgreSQL and seeds only that isolated database.
3. In a second terminal, run `node tests/support/friends-app.cjs`. It copies current sources to an ignored directory and starts a separate app on port 3105 with fixture-only API settings.
4. Run `node tests/friends-browser.cjs`. The two test accounts and password exist only in the loopback fixture; no live email is sent.
5. Stop both local servers when finished. Run `npm run test:friends` for the SQL and utility suite without a browser.

No commit or push was performed.

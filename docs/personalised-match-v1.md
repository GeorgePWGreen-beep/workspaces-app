# Personalised Match v1

Implemented from the existing accounts/profiles architecture. No commit or push. Study Score v1, its SQL trigger, cafe records, map pins and filters are unchanged.

## Files

New: `types/studyPreferences.ts`, `utils/matchV1.ts`, `components/StudyPreferencesProvider.tsx`, `components/StudyPreferencesSheet.tsx`, `components/MatchBadge.tsx`, `tests/match.test.cjs`, `tests/preferences-db.test.cjs`, this report, and the migration below.

Updated: `types/database.ts`, `components/HomeClient.tsx`, `components/AccountSheet.tsx`, `components/CafeCard.tsx`, `components/CafeDetails.tsx`, `components/Sidebar.tsx`, `components/WorkspacesSheet.tsx`, `package.json`, `eslint.config.mjs` (excludes the existing ignored generated QA cache).

## Migration and privacy

`supabase/migrations/202609190001_personalised_match_v1.sql`

`public.user_study_preferences` has `user_id uuid primary key references auth.users(id) on delete cascade`, required `atmosphere_preference text`, `session_length text`, `priorities text[]`, and `created_at`/`updated_at timestamptz not null default now()`. The existing timestamp trigger function maintains updates.

CHECK constraints enforce quiet/balanced/lively, short/medium/long, and zero to three distinct priorities from wifi/sockets/seating/coffee/space, without null entries. UI and TypeScript enforce the same values. Zero priorities is an explicit valid choice; atmosphere and session must be answered.

RLS policies `preferences_select_own`, `preferences_insert_own`, `preferences_update_own`, `preferences_delete_own` restrict every operation to authenticated users whose `auth.uid()` equals `user_id`. UPDATE has both USING and WITH CHECK. Anonymous access is revoked. Column grants prevent editing ownership and timestamps. No profile lookup exposes preferences, and no existing policy or cafe trigger is changed.

The Supabase CLI was unavailable. The user-authorized fallback migration was prepared manually and was **not applied to a live Supabase project**. Apply only this new migration through your normal migration workflow or the Supabase SQL editor before releasing the feature. Do not reset, reseed, or reapply older migrations. Local PGlite execution verified the SQL and RLS; hosted deployment remains required.

## Preferences and auth

The existing AuthProvider supplies identity; a single preferences provider loads after auth/profile restoration completes. Explicit logged-out/loading/missing/available/error states hide Match until saved preferences are available. It does not block the map, duplicate cafe state, or make per-cafe requests. Requests have cancellation/stale-result guards and identity changes clear private state without remounting the map or clearing city/filters.

Three short steps ask atmosphere, session length, and up to three priorities. No answers are preselected for new users. Continue/Back/Finish, Skip, inline errors and retry are provided. Skip writes no preference row and suppresses prompting for that user for the current mounted app visit. A later full reload may offer onboarding again.

Account > Study preferences opens the same UI with saved values. Cancel preserves the saved version; Finish persists changes and recalculates all local Matches. Reset deletes the row and removes Match. Supabase is the source of truth; answers never use localStorage. Another device restores saved preferences on sign-in. Already-open devices do not receive realtime preference updates; reload restores the latest version.

## Exact algorithm

`calculateMatch` in `utils/matchV1.ts` is canonical and independent of Study Score. It returns integer score, available components (compatibility, adjusted weight, normalized contribution), and up to three deterministic positive reasons. Invalid preferences throw; entirely unavailable cafe factors return null rather than inventing a score.

Base weights: Wi-Fi 18, noise 15, seating 15, sockets 15, coffee 13, busyness 12, seat count 12.

Each selected priority multiplies its matching factor by 1.35; space targets seat count. Short sessions multiply seating by 0.85, sockets by 0.75, seats by 0.90. Medium adds no modifier. Long multiplies seating/sockets by 1.25 and seats by 1.15. Priority and session modifiers multiply together.

Compatibility mappings:

| Factor | Values in order | Compatibility |
| --- | --- | --- |
| Wi-Fi | Great / Good / Okay | 100 / 75 / 45 |
| Seating | Comfortable / Average / Basic | 100 / 70 / 40 |
| Sockets | Plenty / Some / Few | 100 / 70 / 35 |
| Coffee | Excellent / Good / Basic | 100 / 75 / 40 |
| Seats | 50+ / 35-49 / 25-34 / 15-24 / 8-14 / 0-7 | 100 / 90 / 80 / 65 / 50 / 35 |
| Quiet preference: noise | Quiet / Moderate / Loud | 100 / 70 / 25 |
| Balanced preference: noise | Quiet / Moderate / Loud | 90 / 100 / 55 |
| Lively preference: noise | Quiet / Moderate / Loud | 70 / 100 / 80 |
| Quiet preference: busyness | Quiet / Moderate / Busy | 100 / 70 / 30 |
| Balanced preference: busyness | Quiet / Moderate / Busy | 90 / 100 / 65 |
| Lively preference: busyness | Quiet / Moderate / Busy | 75 / 100 / 85 |

Final score = round(sum(compatibility * adjusted weight) / sum(active adjusted weights)), bounded to 0-100. Only the final result is rounded. Null/invalid/missing seats are excluded from numerator and denominator; known zero seats remains a real value. Every factor uses the same exclusion mechanism for future optional inputs.

No location, hours, walking, ratings, prices, city, independence, images or social information enters the formula. Explanations use accurate cafe attributes with compatibility >=75, ordered by normalized weighted contribution. At most three reasons appear; fewer are shown when a cafe has fewer genuine strengths.

## UI and ranking

Small green Match pills appear on mobile Nearby cards and desktop sidebar cards, with Match for you and concise reasons in CafeDetails. The universal details ring and map pin scores are untouched. Cards retain their original height when no Match is available. No competing score circle or analytics screen was added.

Both Nearby lists rank by descending Match for users with saved preferences, then descending Study Score for ties. Without preferences they rank by Study Score. A small label explains the active ranking. Existing filters continue to use cafe fields and universal Study Score. No new Match filter or sorting settings system was introduced.

## Verification

- `npx.cmd tsc --noEmit`: passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed (Next.js 16.2.1 production build).
- `test:auth`: 13 passed; `test:filters`: 19 passed; `test:score`: 26 passed; `test:data`: 9 passed.
- `test:match`: 9 passed, including real PostgreSQL/PGlite migration execution and owner CRUD, other-user/anonymous isolation, constraints, cascading deletion, and unchanged cafe/profile rows, policies and cafe triggers.
- Match tests cover all requested atmosphere/session/priority mappings, null seats, boundaries, final rounding, contextual independence, changing preferences, range/normalization across 1,638 preference/capacity combinations, and sorting/ties.
- Isolated Playwright verification: 390x844, 360x844, 1440x844. Onboarding, skip, priority limit, saved editing, Match cards/details, reload restoration, reset, logout, overflow and page errors checked. Expanded sheet gestures and reduced-motion details visually inspected.
- Additional browser checks: load-error retry; failed save preserves answers; one read per preference load; independent browser context restores the same saved Match; switching accounts never retains another user's Match.
- Two visual passes corrected label encoding and retained existing card dimensions for users without Match.

Browser QA used a local auth/API test double and the current copied app, not live accounts. PGlite tests independently exercise actual SQL authorization. External map styles/images were network-restricted: browser QA substituted a blank map style; real imagery/tile rendering was not reverified. Screenshots and QA harness are under ignored `.npm-cache/match-qa/`.

No Friends, Saved persistence, live location, admin tools, AI recommendations or unrelated redesign were implemented.

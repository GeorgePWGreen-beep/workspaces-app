# Hot Seats Study Score v1

Study Score is now defined by a fixed seven-input formula, with a PostgreSQL migration that maintains the stored integer and a TypeScript mirror for tests, local fixtures, and future explanations. No score UI, filter architecture, score colours, or navigation was redesigned. No commit, push, reset, production reseed, or production write was performed.

## Implementation and files

- `utils/studyScoreV1.ts`: `calculateStudyScore`, `getStudyScoreBreakdown`, typed category points and seat bands.
- `supabase/migrations/20260911222828_study_score_v1.sql`: SQL calculator, automatic trigger, and calculated backfill.
- `data/cafes.ts`: local development fixtures use the helper when complete and retain their legacy values otherwise.
- `lib/data/cafes.ts`: documents the existing stored-score mapping; no second production calculation.
- `types/database.ts`: complete inserts can omit `study_score`; incomplete legacy inserts still need an explicit retained score.
- `tests/study-score.test.cjs`: formula, SQL parity, migration, trigger, RLS, and score-filter tests.
- `tests/fixtures/study-score-cafes-2026-09-11.json`: public-data audit snapshot containing the existing scores and scoring attributes for all 16 visible cafes.
- `package.json`, `package-lock.json`: `test:score` command and pinned `@electric-sql/pglite@0.5.8` development dependency for reproducible PostgreSQL tests.
- `docs/study-score-v1.md`: this report and rollout instructions.

## Exact formula

| Component | Points |
| --- | --- |
| Wi-Fi, maximum 18 | Great WiFi 18; Good WiFi 13.5; Okay WiFi 8 |
| Noise, maximum 15 | Quiet 15; Moderate 10; Loud 3 |
| Seating comfort, maximum 15 | Comfortable 15; Average 10; Basic 4 |
| Sockets, maximum 15 | Plenty 15; Some 10; Few 4 |
| Coffee, maximum 13 | Excellent 13; Good 9; Basic 4 |
| Busyness, maximum 12 | Quiet 12; Moderate 10; Busy 5 |
| Capacity, maximum 12 | 50+ seats 12; 35–49 10; 25–34 8; 15–24 6; 8–14 4; 0–7 2 |

Maximum: 100. Add the raw component values and round the final sum once. PostgreSQL uses `numeric` arithmetic and `round`; TypeScript uses exact integer/half-point values and `Math.round`. For this non-negative domain, `.5` rounds upward in both. The helper returns the integer total or null; its breakdown also exposes raw total and each component's points.

Neither implementation accepts or weighs opening status/hours, walking time/location, price, public rating, independence, city, image availability, or confidence. The universal score is identical for everyone. No personalised Match implementation or explanation UI was added.

## Database behavior

`public.calculate_study_score_v1(text,text,text,text,text,text,integer)` is the authoritative database formula. It is immutable, strict, security invoker, and uses an empty search path. Null inputs, unrecognized categorical values, or negative capacity return null. Existing table constraints still reject invalid stored categories and negative capacities.

`cafes_calculate_study_score_v1` runs **BEFORE INSERT OR UPDATE OF** `wifi`, `noise`, `seating`, `sockets`, `coffee`, `busyness`, `seat_count`, and `study_score`. `public.set_cafe_study_score_v1()` assigns the calculated result when complete. Including `study_score` also prevents direct manual overrides from making a complete record inconsistent. Unrelated updates do not fire it. This uses PostgreSQL's [column-specific trigger behavior](https://www.postgresql.org/docs/current/sql-createtrigger.html).

For an incomplete update, the trigger retains `OLD.study_score`, even if the caller also supplies another score. Populating the missing capacity immediately enables calculation; changing it back to null freezes the last stored score. A genuine capacity of zero earns 2 points. Unknown capacity earns no invented points and produces no calculated total.

For a complete insert, the trigger fills the score before the existing NOT NULL check, so callers can omit it. An incomplete legacy insert must provide an explicit retained score; otherwise the existing NOT NULL constraint rejects it. No default score or seat count was introduced.

The migration backfills **all complete records**, including inactive ones, through the same SQL function. Its update skips null results and already-correct scores. It changes no IDs, slugs, seat counts, cafe content, existing constraints, indexes, table privileges, or RLS policies. The existing `updated_at` trigger runs for records whose score changes. Everything is transactional, with a five-second lock timeout and a sixty-second statement timeout.

Both new functions use [security invoker](https://supabase.com/docs/guides/database/functions#security-definer-vs-invoker). Their execution is revoked from PUBLIC, anon, and authenticated and granted to service_role; the owner can also execute them. They neither bypass RLS nor grant any new table-write permission. Future custom writer roles need appropriate function execution rights as well as their independently reviewed table/RLS permissions.

## Frontend consistency

Production continues mapping `public.cafes.study_score` directly to `Cafe.studyScore`. The database query still orders by stored `study_score DESC, name`; Nearby still sorts the same domain value. Map labels/pins, Nearby score badges, CafeDetails' StudyScore ring, semantic colours, and the minimum-score filter all consume that one integer. Components contain no new scoring calculation.

The seven existing local development fixtures currently lack capacity, so their existing fallback scores remain unchanged. The helper automatically derives scores if those fixtures later receive complete verified inputs. Production never silently substitutes the TypeScript calculation for a stale database value: apply the migration to enable v1 there.

## Current public-data audit

A read-only API inspection on 11 September 2026 returned **16 visible active cafes**, 10 Exeter and 6 Cambridge, from Supabase project `npsnnumnlderkkywwehj`, table `public.cafes`. Unlike the previous filter report's historical state, `is_independent` is now present alongside `city`, `seat_count`, weekly hours, and verification dates.

The table below is the **tested migration outcome**, not a claim that production was changed. The original values came from the live API; new values were produced by executing this exact migration against that snapshot in isolated PostgreSQL.

| Cafe | City | Previous stored score | V1 calculated score | Stored score after migration | Status |
| --- | --- | ---: | ---: | ---: | --- |
| Aromi | Cambridge | 75 | — | 75 | Pending seat-count verification |
| Bould Brothers Coffee | Cambridge | 50 | — | 50 | Pending seat-count verification |
| Espresso Library | Cambridge | 80 | — | 80 | Pending seat-count verification |
| Fitzbillies | Cambridge | 40 | — | 40 | Pending seat-count verification |
| Hot Numbers | Cambridge | 90 | — | 90 | Pending seat-count verification |
| Urban Larder | Cambridge | 70 | — | 70 | Pending seat-count verification |
| 18g Coffee Roasters | Exeter | 68 | 66 | 66 | Fully calculated; changed |
| Arrietty | Exeter | 85 | — | 85 | Pending seat-count verification |
| Between Bread | Exeter | 78 | 64 | 64 | Fully calculated; changed |
| Boatyard Bakery | Exeter | 60 | 60 | 60 | Fully calculated; already correct |
| Knoops | Exeter | 74 | 80 | 80 | Fully calculated; changed |
| Suki Cafe | Exeter | 88 | 90 | 90 | Fully calculated; changed |
| Sundays | Exeter | 72 | 75 | 75 | Fully calculated; changed |
| The Common Beaver | Exeter | 80 | 68 | 68 | Fully calculated; changed |
| The Ridge Coffee Shop | Exeter | 64 | 56 | 56 | Fully calculated; changed |
| The Sunset Society | Exeter | 80 | 80 | 80 | Fully calculated; already correct |

Nine complete cafes: seven score changes and two already correct. Seven incomplete cafes retain their existing score: **Study Score v1 pending seat-count verification**. No capacities were invented or changed. Source fixtures are an audit snapshot, not a production seed.

## Manual Supabase step

**Not applied to production.** CLI 2.117.0 was run through a pinned temporary npx installation and generated the migration filename. `supabase projects list` reported `LegacyPlatformAuthRequiredError` / access token not provided. This checkout has no linked project and there are no callable authenticated Supabase MCP tools in this session. Public API access cannot inspect exact live SQL constraints, trigger definitions, migration history, hidden rows, or RLS definitions.

An administrator should compare the live schema/history before applying **only** `20260911222828_study_score_v1.sql` to project `npsnnumnlderkkywwehj` (`https://npsnnumnlderkkywwehj.supabase.co`), database `postgres`, table `public.cafes`. Do not blindly push every migration: the older city and independence changes are already reflected in the live API.

Useful read-only preflight queries:

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'cafes'
order by ordinal_position;

select tgname, pg_get_triggerdef(oid)
from pg_trigger where tgrelid = 'public.cafes'::regclass and not tgisinternal;

select * from pg_policies where schemaname = 'public' and tablename = 'cafes';

select id, slug, name, city, study_score, wifi, noise, seating,
       sockets, coffee, busyness, seat_count, is_active, updated_at
from public.cafes order by city, name;
```

Expected existing types: integer `study_score` and nullable integer `seat_count`; the six categorical fields are required text with the checked values above. Retain an export of the pre-migration rows/scores and compare migration history with actual schema. Confirm the two new function names and trigger do not already exist. Duplicate application intentionally fails and rolls back rather than silently replacing an existing definition.

Apply the exact migration file in one transaction. Afterwards compare row counts/IDs, pending-record scores, RLS/policies/table grants, and the app's public active-cafe read. This query must return no complete rows with mismatched scores:

```sql
with calculated as (
  select id, name, study_score,
    public.calculate_study_score_v1(wifi, noise, seating, sockets,
      coffee, busyness, seat_count) as expected
  from public.cafes
)
select * from calculated
where expected is not null and study_score is distinct from expected;
```

Hidden/new records, if any, should be reviewed as part of the administrative audit. The migration derives their scores from their own inputs too; it does not depend on the 16 names in the report. Future writers should stop manually supplying scores for complete records. Existing frontend reads remain compatible before and after deployment.

## Verification

- TypeScript: `npx.cmd tsc --noEmit --incremental false` passed.
- ESLint: `npm.cmd run lint -- --ignore-pattern .npm-cache/**` passed.
- Production build: `npm.cmd run build` passed.
- Existing filters: `npm.cmd run test:filters` — 19 passed.
- Existing data/opening-hours/walking: `npm.cmd run test:data` — 9 passed.
- Study Score: `npm.cmd run test:score` — 26 passed, including 8,019 SQL/TypeScript parity cases spanning every category combination and all requested seat boundaries.

The score suite runs the actual migration in PGlite's isolated PostgreSQL engine. It covers exact mappings, maximum/minimum totals, final half-point rounding, missing/invalid inputs, exclusion of unrelated attributes, preservation of all 16 snapshot records, incomplete-score retention, complete inserts without manual scores, every relevant update, direct overrides, upserts, inactive records, public read/write restrictions, service-role updates, score thresholds, and transactional duplicate failure. This is local database verification, not a live Supabase migration or administrative RLS audit.

Playwright browser checks at 390×844 passed for Exeter and Cambridge against the actual SQL-migrated snapshot: all 16 map-pin and Nearby-card values matched the stored scores; details rings showed the same integers for Suki Cafe, Knoops, Arrietty, Hot Numbers, and Bould Brothers Coffee. Every score threshold, the five quick filters, result counts, null-seat records, and city switching passed. Advancing the clock across opening-status changes left every score unchanged. There were no browser runtime errors. Screenshots confirmed the existing score styling and integer-only presentation. QA scripts, screenshots, and full public snapshots are under ignored `.npm-cache/score-qa/`; production data was not modified. The existing missing placeholder image remains outside this PR.

Remaining limitations: seven capacities still need research; until the migration is deployed, production retains its previous stored scores. Pending legacy scores intentionally remain comparable through the existing UI without a new confidence/explanation UI. Split shifts, holiday hours, routes, Match, Auth, and social features remain outside this change.

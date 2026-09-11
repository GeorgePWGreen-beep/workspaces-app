# Cities and workspace information

**Current rollout status (11 September 2026):** this document records the earlier
city/workspace-data implementation. A later read-only inspection found 16 public
cafes and the city/hours/seats/verification fields already present in production.
Do not reapply the older migration below. Only the new independence migration
remains pending; see [the filter report](filter-system.md) and
[independence rollout instructions](independent-classification.md).

## Files changed in this pass

- Data/schema: `types/cafe.ts`, `types/database.ts`, new `types/openingHours.ts`,
  `lib/data/cafes.ts`, new `lib/cities.ts`, `data/cafes.ts`, `supabase/seed.sql`,
  and the new migration below.
- Experience: `components/HomeClient.tsx`, `components/Map.tsx`,
  `components/Sidebar.tsx`, `components/WorkspacesSheet.tsx`,
  `components/CafeCard.tsx`, `components/CafeDetails.tsx`; new
  `components/CityChooser.tsx`, `components/LocationProvider.tsx`,
  `components/OpeningHours.tsx`, `components/WalkTime.tsx`.
- Logic/checks: new `utils/openingHours.ts`, `utils/walking.ts`,
  `tests/cafe-data.test.cjs`; `package.json` adds `test:data`.
- Documentation: this file.

`app/page.tsx` continues using the existing Supabase repository unchanged.
The pre-existing wordmark restoration in `components/FloatingSearch.tsx` and
the local CafeDetails feature-label edits were retained. No commit or push.

The earlier migration is
`supabase/migrations/202609100001_cafe_cities_and_workspace_details.sql`.
Its rollout notes below describe databases that have not yet received those schema
changes. The current production fields are already present, so those notes are not
an instruction to reapply it. No production migration is run by the application.
The migration leaves the existing public SELECT policy and write restrictions
unchanged.

## Safe rollout

- The six existing Cambridge slugs and Exeter's `arrietty` were checked against
  public records on 10 September 2026. Both slug and coordinate ranges guard the
  backfill. IDs and slugs are unchanged.
- If **any** existing row, including an inactive row, cannot be assigned, the
  transaction stops and lists its slug. Verify that row's city and add an explicit
  assignment before rerunning the migration. Never default all unknown rows to
  Cambridge.
- A small repository compatibility bridge uses the same verified records before
  the migration is deployed. Unknown records fail with a city-review error.
  Once the migration is deployed everywhere, the bridge can be removed.
- `city` is required with a check constraint for `Cambridge` and `Exeter`.
  Extend the constraint and `lib/cities.ts` together when adding cities.
- `seat_count` is a nullable, non-negative integer estimating physical customer
  capacity. It does not change `busyness`, which describes typical demand.
- `last_verified_at` is a nullable timestamp with time zone. Populate it only
  when someone actually checks the cafe's information; it is not `updated_at`.
- `walk_time` is retained, nullable and documented as deprecated. The frontend
  domain and UI no longer use it.
- `weekly_opening_hours` is nullable JSONB. The old `opening_hours` text is kept
  exactly as stored and becomes nullable for new structured-only records. Undated legacy ranges cannot safely establish weekday or
  weekend hours, so the migration deliberately does not fabricate a schedule.
- The seed and development fallback contain the six Cambridge cafes and the
  existing Arrietty record in Exeter. No seating estimates or verification dates
  have been invented. The seed does not overwrite the new enrichment fields.
  Do not rerun the full development seed over curated production data.

## Weekly opening hours

Provide all seven lowercase weekday keys. A day set to `null` means **closed**;
the whole SQL column set to `NULL` means **unknown**. Each open day has one
`{ "open": "HH:MM", "close": "HH:MM" }` interval, using local 24-hour time.
The database constraint and TypeScript validator reject missing days, extra
keys, invalid times and equal opening/closing times.

Example for illustration only; this is not a verified schedule for any cafe:

```json
{
  "monday": null,
  "tuesday": { "open": "08:30", "close": "15:00" },
  "wednesday": { "open": "08:30", "close": "15:00" },
  "thursday": { "open": "08:30", "close": "15:00" },
  "friday": { "open": "08:30", "close": "15:00" },
  "saturday": { "open": "09:30", "close": "14:00" },
  "sunday": null
}
```

An earlier closing time denotes an overnight interval into the next day.
`24:00` is allowed for closing only; `00:00`–`24:00` represents an entire day.
Opening is inclusive and closing is exclusive. Yesterday's overnight interval
is considered before today's hours. The next opening is searched for up to a
week ahead. Both cities use `Europe/London`, including UK daylight saving changes,
regardless of the viewer's time zone. Status refreshes every 30 seconds and when
the page becomes visible. An expandable weekly list is secondary to the status.
Unknown schedules show the preserved listed hours with an unconfirmed-days label.
Split shifts and date-specific holiday exceptions are not modeled yet.

## Location experience

`HomeClient` owns the city. On first visit, the accessible native modal dialog
offers Exeter and Cambridge before the map is mounted. The city is stored in
`hot-seats.city.v1`. Invalid stored values reopen the chooser; blocked storage
still permits a selection for that visit. A small **Change city** link in the
Nearby list and desktop sidebar reopens the chooser.

City filtering happens before text/workspace filters. Markers and lists share
that filtered data. Map bounds come from the chosen city's cafe coordinates;
single-cafe and empty-city views have sensible centres. Changing city clears the
previous selection and search text, preserves the shared workspace filters, and
remounts the map for the new context.
Geolocation never changes the chosen city.

After the first mobile map loads, the existing Nearby sheet opens using its
unchanged collapsed/expanded/dismissed gesture mechanics. The separate
`hot-seats.nearby-guidance.v1` flag is written when this guidance is opened.
Repeat visits retain the city and show the dock. The chooser and workspace sheet
are not displayed together. If map loading is unavailable, Nearby remains
accessible from the dock.

## Walking estimates and details

The shared location provider watches position when permission is already granted.
Otherwise, **Enable walking estimates** requests permission through a user action;
there is no competing geolocation prompt during the city chooser. Denied or
unavailable locations display no estimate. Readings with accuracy worse than
1 km are discarded.

`utils/walking.ts` is the routing replacement boundary. It estimates minutes from
Haversine distance × 1.3 at 4.8 km/h, rounding to at least one minute. The label is
explicitly approximate (`~8 min walk`). Straight-line distances above 10 km are
hidden, so choosing a different city does not produce absurd inter-city walks.
This cannot account for rivers, inaccessible paths or actual pedestrian routes.
No routing subscription or paid dependency has been introduced.

Details show opening status below the rating, key work factors, compact
`Approx. 20 seats` metadata when available, the existing description/features and
action styling, and a small muted verification date below the actions. Null
seats/dates are omitted; zero seats is a valid value and remains visible.
The existing Save/Share/Directions buttons are preserved; their existing placeholder
behaviour has not been expanded into persistence or new action features.

## Verification

```sh
npm run test:data
npx tsc --noEmit --incremental false
npm run lint -- --ignore-pattern .npm-cache/**
npm run build
```

`test:data` runs nine regression tests covering validation, exact opening/closing
boundaries, closed days, weekend differences, overnight/week rollover, 24:00,
UK clock changes, verification date formatting, walking distances and guarded
legacy city assignments. Its compiled files live in ignored `.next` output.

Additional local verification used temporary PGlite and Playwright installations
in the ignored cache, with no application dependency changes:

- Executed the final migration in isolated PostgreSQL: unknown-city rollback,
  guarded backfill, preserved IDs/slugs/legacy hours, nullable legacy fields,
  weekly-hours validation, required/constrained city, non-negative seats,
  both-city seed compatibility and preservation of enriched fields.
- Checked anonymous active-record reads, hidden inactive rows, and denied writes.
- Browser-tested 390×844, 360×844 and 1440×1000: first visit with both cities,
  repeat visit, switching, city-specific markers and map bounds, search/Quiet
  filtering, details, overnight/closed-day logic via data tests, populated/null
  seats and dates, zero seats, granted/denied location, explicit permission action,
  and unavailable localStorage.
- Exercised mobile drag expansion, collapse and dismissal, with dock return.
- Reviewed screenshots of the chooser, metadata and footer, then refined chooser
  focus and singular workspace counts. No horizontal page overflow was found.
- Smoke-tested the production build against real public Supabase data before
  migration: Arrietty in Exeter and six Cambridge cafes, actual Mapbox rendering,
  no browser runtime errors. Production records were not modified.

Screenshots and temporary verification scripts are in
`.npm-cache/hot-seats-qa/`. They use synthetic enrichment values only in an
isolated local database; those values are not proposed cafe facts.

Before release, verify and populate each cafe's weekly schedule, seating capacity
and last-checked date as information becomes available. Until then, unknown fields
remain unknown. No auth, profiles, admin features or occupancy tracking are added.

An existing asset limitation remains: `/cafes/placeholder.jpg` is referenced by
several records but is absent from this checkout, so those images use the existing
blank fallback. The hero/image error-handling behaviour was preserved.

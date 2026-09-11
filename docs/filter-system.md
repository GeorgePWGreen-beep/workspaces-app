# Hot Seats filter system

This report describes the completed filter implementation on the current working tree. Earlier city, opening-hours, walking-estimate, wordmark, and CafeDetails work is retained. No commit, push, production migration, production reseed, or production cafe-content edit was performed.

## Shared filter architecture

`HomeClient` owns one `CafeFilters` object. `types/filters.ts` defines its fields, valid choices, and fresh unrestricted defaults. The mobile search controls, desktop sidebar, and full Filters sheet all read and update that object; there is no separate quick-filter or draft-sheet state.

`utils/filters.ts` performs the only dataset filtering. Choices within each multi-select category use OR; categories, selected city, and case-insensitive trimmed cafe-name search use AND. Thresholds are inclusive. `HomeClient` passes the same memoized `filteredCafes` array to the map, desktop list, and mobile Nearby list, and derives the sheet result count from its length.

Changes take effect immediately. Clear all resets every filter to its unrestricted default while preserving the selected city and search text. Show N cafes closes the sheet; its count already reflects current choices, search, and city. Changing city preserves filter choices, clears search and the previous cafe selection, and opens the new city's map context. Filters are held in memory for the current visit, not persisted across reloads.

## Quick filters

The shared quick controls form two rows of three buttons, in this order:

| Row | First control | Second control | Third control |
| --- | --- | --- | --- |
| 1 | Open now | Quiet | Great Wi-Fi |
| 2 | Sockets | Independent | Filters |

Open now toggles `openNow`; Quiet selects only `noise = Quiet`; Great Wi-Fi selects only `wifi = Great WiFi`; Sockets selects only `sockets = Plenty`; Independent selects `cafeType = independent`. Tapping an active preset clears that category. If the full sheet has a mixed selection, tapping its quick preset narrows the category to that preset. Other categories are preserved.

Buttons are 44 px high in a three-column grid, with solid backgrounds, visible selected states, and no horizontal scrolling container. The Filters badge counts active categories not already represented by a selected quick preset. Multiple OR choices within one category count once. The same controls appear in the desktop sidebar, and Nearby also has a Filters entry point.

## Extended Filters sheet

The full sheet uses the same live state and includes:

| Filter | Choices |
| --- | --- |
| Minimum Study Score | Any, 50+, 60+, 70+, 80+, 90+ |
| Price | £, ££, £££; multi-select |
| Wi-Fi | Great WiFi, Good WiFi, Okay WiFi; multi-select |
| Noise | Quiet, Moderate, Loud; multi-select |
| Sockets | Plenty, Some, Few; multi-select |
| Busyness | Quiet, Moderate, Busy; multi-select |
| Cafe type | All, Independent, Chain / non-independent |
| Coffee quality | Excellent, Good, Basic; multi-select |
| Seating comfort | Comfortable, Average, Basic; multi-select |
| Number of seats | Any, 10+, 20+, 40+ |
| Maximum walk time | Any, ≤5 min, ≤10 min, ≤20 min |
| Opening hours | Open now toggle |

An empty multi-select category is unrestricted. Seat count describes approximate total capacity, not available seats. The native modal dialog has a labeled heading, selected-state semantics, close button, Escape/backdrop dismissal, and focus restoration. Its content scrolls vertically between a persistent header and an always-accessible Clear all / Show N cafes footer. Responsive grids, minimum-width constraints, and wrapped long choices keep the sheet within the viewport.

Opening Filters temporarily hides Nearby while preserving its mount and gesture state. The existing map, cafe-detail interactions, city chooser, search, bottom dock, and Nearby drag mechanics remain in place.

## Opening status and closed cafes

`CafeTimeProvider` supplies one clock to filtering, map markers, cards, and opening-hours details. It refreshes every 30 seconds and on visibility changes. Status uses structured weekly hours in the cafe city's `Europe/London` time zone, including overnight intervals and daylight saving changes. Legacy free-text `opening_hours` is never parsed into a claim that a cafe is open or closed.

With Open now off, closed cafes remain in the result dataset. Their map markers have `opacity: 0.48` and `filter: grayscale(1)`, retain pointer interactions, and include closed status in their accessible label. Cards retain their existing styling with a muted closed/next-opening label. With Open now on, confirmed closed cafes disappear from both map and list.

Unknown hours remain a separate status: they are visible by default, are not given the closed marker treatment, and are never labeled closed. The chosen Open now policy is **confirmed openings only**, so cafes with unknown weekly hours are excluded when that filter is active. This policy is isolated in `OPEN_NOW_INCLUDES_UNKNOWN` and `matchesOpenNow`; the sheet explains it. Before the shared clock is initialized, opening status is unknown.

## Missing values and walking estimates

| Value | Unrestricted behavior | Behavior when its filter is active |
| --- | --- | --- |
| `seat_count = NULL` | Cafe remains visible | Excluded by a numeric seat minimum |
| `weekly_opening_hours = NULL` | Visible, unknown status, normal marker | Excluded by the confirmed-only Open now policy |
| `is_independent = NULL` or field absent before rollout | Visible under All | Excluded from both Independent and Chain / non-independent |
| User location unavailable or denied | No walking estimate | Walk choices disabled; any previously selected limit is retained but paused |
| Invalid cafe coordinates or distance beyond 10 km | Cafe remains visible without a walk estimate | Excluded by a walk limit when user location is available |

Walking limits use current coordinates from the shared location provider and `estimateWalkMinutes`, never legacy `walk_time`. The estimate is Haversine distance multiplied by 1.3 at 4.8 km/h, rounded to at least one minute. It is explicitly approximate and is not pedestrian routing. A paused walk limit resumes when usable location returns; other filters continue to apply while it is paused. Clear all also removes a paused limit.

## Independent classification and database migration

The frontend expects `public.cafes.is_independent` as a nullable PostgreSQL `boolean`, mapped to `Cafe.isIndependent: boolean | null`. Only actual boolean values are accepted; there is no name-based frontend classification or default that turns unknown cafes into chains.

The prepared migration is [`202609110001_cafe_independence.sql`](../supabase/migrations/202609110001_cafe_independence.sql). It transactionally adds that one nullable column with no default, documents it, and updates reviewed exact city/slug pairs. It does not add/remove rows, delete legacy columns, change other cafe content, modify policies/grants, reset, or reseed. The existing `updated_at` trigger updates timestamps for the 14 classified records.

Read-only inspection found 16 current public active records in project `npsnnumnlderkkywwehj`: 10 Exeter and 6 Cambridge. The live API already exposes city, structured hours, seat counts, and verification dates, but not `is_independent`. **Do not reapply the earlier city/seat/opening-hours migration.** Supabase CLI/authenticated administrative access and a linked-project configuration were unavailable, so this task did not change production.

The prepared classifications for the current records are:

| City | Independent (`true`) | Chain / non-independent (`false`) | Unverified (`NULL`) |
| --- | --- | --- | --- |
| Exeter | Arrietty; The Sunset Society; Suki Cafe; Sundays; Boatyard Bakery; The Ridge Coffee Shop; Between Bread; The Common Beaver; 18g Coffee Roasters | Knoops | None |
| Cambridge | Aromi; Bould Brothers Coffee; Fitzbillies; Hot Numbers | None | Espresso Library; Urban Larder |

This yields **13 independent, 1 chain, 2 unknown** for the 16 inspected records. Exeter classifications were supplied by the project owner; Cambridge classifications use current official ownership evidence where sufficiently clear. Exact slugs, sources, and confidence notes are in [`independent-classification.md`](independent-classification.md).

An administrator still needs to compare live SQL schema and migration history, then apply only the new independence migration to this project's `public.cafes`. Afterwards, verify all 16 known rows, Arrietty and the six Cambridge records, classification values, RLS/public reads, and the app's active-cafe read. Public-only inspection cannot establish hidden-row counts or live policy definitions. Unknown or subsequently added cafe records need individual classification review. Before deployment, the app continues reading cafes safely, but Independent and Chain filters have no confirmed matches from the unmigrated production data.

## File inventory

Files introduced for this filter work:

- `types/filters.ts`, `utils/filters.ts`: shared model, presets, predicates, counts, and defaults.
- `components/QuickFilters.tsx`, `components/FiltersSheet.tsx`: synchronized quick controls and complete extended sheet.
- `components/CafeTimeProvider.tsx`: shared opening-status clock.
- `supabase/migrations/202609110001_cafe_independence.sql`: nullable independence column and reviewed classifications.
- `tests/filters.test.cjs`: filter regression tests.
- `docs/filter-system.md`, `docs/independent-classification.md`: behavior, validation, classifications, and rollout instructions.

Existing or already-uncommitted files updated for integration:

- `components/HomeClient.tsx`, `components/FloatingSearch.tsx`, `components/Sidebar.tsx`, `components/WorkspacesSheet.tsx`: state ownership, entry points, shared results, and sheet coexistence.
- `components/Map.tsx`, `app/globals.css`: closed marker state and mobile map padding for the two-row controls.
- `components/CafeCard.tsx`, `components/OpeningHours.tsx`: consistent clock and compact closed-status presentation.
- `types/cafe.ts`, `types/database.ts`, `lib/data/cafes.ts`: nullable independence typing and safe repository mapping.
- `data/cafes.ts`, `supabase/seed.sql`: classifications for the existing local development records only; no production seed execution.
- `package.json`: `test:filters` script; no added application dependency.
- `docs/cities-and-workspace-data.md`: current city-switch/filter behavior and a dated rollout clarification.

The prior uncommitted city chooser, location provider, walk display, city configuration, opening-hours types/utilities, data tests, and `202609100001_cafe_cities_and_workspace_details.sql` are preserved. Existing CafeDetails contrast/action styling, local feature-label changes, restored wordmark typography, and earlier Supabase work are retained; they are not new filter changes.

## Validation and remaining limitations

The following checks passed after the final focus-restoration fix:

- `npx.cmd tsc --noEmit --incremental false`
- `npm.cmd run lint -- --ignore-pattern .npm-cache/**`
- `npm.cmd run build`
- `npm.cmd run test:filters`: 19 tests passed.
- `npm.cmd run test:data`: 9 tests passed.

Filter tests cover each categorical OR selection, AND combinations with city/search/score, inclusive thresholds, independent/chain/unknown behavior, missing seats, dynamic and unavailable-location walking, opening boundaries/overnight hours, quick/full synchronization, and active-category counts. Data tests preserve the earlier weekly-hours, city, and walking regression coverage.

The new migration was executed against an isolated PostgreSQL-compatible database loaded with the inspected 16-record snapshot. It preserved 16 rows (10 Exeter, 6 Cambridge), existing field values except trigger-updated timestamps, IDs/slugs, and simulated RLS policies/grants. Prepared classifications were 13/1/2; additional unrecognized active/inactive test records stayed null. Anonymous/authenticated read behavior and denied writes were checked locally. Duplicate application failed transactionally without partial changes. These isolated checks do not claim live RLS inspection or production migration execution.

The full Playwright run passed at **390×844 and 360×844**, with no browser runtime errors. It exercised every quick and extended choice; OR/AND combinations; search and city switching; Clear all; null values; and matching map, Nearby, and live footer counts. Granted-location walking choices produced the expected results at both widths. Denied and unavailable location disabled walk choices and preserved all 10 default Exeter results.

A separate 1440 px desktop smoke test ran the production build against the live public Supabase data. It read all 16 records across the two cities, opened Arrietty details, and passed quick controls, the full sheet, search, map/list equality, Open now, and focus restoration without browser runtime errors. Missing production independence values safely produced no confirmed matches until rollout. The initial sandboxed server could not reach Supabase; the same build passed after its local process was granted network access. No database writes were made.

Closed markers were verified at 48% opacity with grayscale and remained tappable. Sheet/dock interactions and focus restoration after closing Filters from expanded Nearby passed. The first pass found that hiding Nearby could blur the opener before focus was captured; `HomeClient` now records it before hiding Nearby and restores it after close, and the full regression passed with that fix.

Screenshots of the quick controls and the sheet's top and bottom were inspected at both widths. Quick controls retained 44 px touch targets, readable selected states, and two complete rows without horizontal scrolling. Section spacing, responsive choices, and the accessible footer fit without horizontal overflow. Two visual refinement passes adjusted quick-control spacing/order/badge behavior and the sheet grid/footer/closed-status presentation before the final focus fix. QA scripts, fixture data, screenshots, and isolated migration results are under the ignored `.npm-cache/filter-qa/` directory; no application test dependency was added.

Remaining data work is to verify Espresso Library and Urban Larder's current ownership, and fill missing weekly hours, seat counts, and verification dates when reviewed. Arrietty and the six Cambridge records currently have unknown enrichment fields; nine Exeter records already have them. Hours do not model split shifts or date-specific holiday exceptions. Walking estimates do not account for actual pedestrian routes. The existing missing `/cafes/placeholder.jpg` asset/fallback remains outside this filter change.

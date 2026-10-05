# Cafe actions and Saved

Share, Directions and Save use the existing cafe detail action layout. Study Score,
Match, cafe photos, walking calculations and the map implementation are unchanged.

## Behaviour

- Share uses `navigator.share` when present, with the cafe name, Hot Seats message
  and an origin-relative `/?cafe=<slug>` link. These links reopen the correct cafe
  and city for new visitors without requiring onboarding or sign-in. UUID is the
  fallback identity. Browser addresses follow the selected cafe without reloads.
- Without native sharing, the link is copied and “Link copied” is announced.
  Cancellation is silent; other share/clipboard failures give friendly feedback.
- Directions opens a native modal dialog with subtle existing Framer Motion
  animation, keyboard focus containment, Escape, close and outside dismissal.
  Apple Maps and Google Maps links open externally, using latitude/longitude.
  Missing/invalid coordinates use name plus address, or city when no address is
  available in the existing data. The chooser explains when it uses this fallback.
- Save uses the existing account sign-in dialog. Signed-in changes are optimistic,
  with per-cafe pending locks and rollback on failure. Both details and Saved read
  one provider; loading failures offer retry, and logout clears account state.
- Saved reuses `CafeCard` with a contextual `saved` variant (`#F7FAF5`). Other cards
  retain their normal surface even when the cafe is saved. The list includes saved
  active cafes across cities, independently of Nearby filters. Removed/inactive
  cafes are not displayed. Saved also has an entry in the desktop sidebar.

## Database

Applied **only** `20261004182548_saved_cafes.sql` to HotSeats
(`npsnnumnlderkkywwehj`) on 2026-10-04 through Supabase MCP. The CLI initially
generated the local migration; its filename was aligned to the version recorded
by the live migration service. No previous migration was reapplied.

`public.saved_cafes` has UUID `id`, UUID `user_id` referencing `auth.users`, UUID
`cafe_id` referencing existing `cafes.id`, and `created_at timestamptz`.
Foreign keys cascade on deletion. `(user_id, cafe_id)` is unique; the unique
index covers owner lookups, and a separate cafe index supports FK cascades.

RLS is enabled. Authenticated users can select, insert and delete their own rows
through `saved_cafes_select_own`, `saved_cafes_insert_own` and
`saved_cafes_delete_own`. Inserts can supply only `user_id` and `cafe_id`.
There is no client UPDATE grant or policy, and anonymous access is revoked.

Live before/after row counts and full-row checksums matched for all 32 cafes,
3 profiles, 1 preferences row, 0 friendships and the 11 existing policies.
No production fixture data or test accounts were created.
The security advisor reported no new findings. Its existing warnings about
`rls_auto_enable()` execution and disabled leaked-password protection remain
outside this change.

**No manual Supabase step is needed for this project.** Other environments must
apply this migration once before testing Save. Do not reapply it to this project.

## Verification

- `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed.
- `npm run test:cafe-actions` checks share/map URLs, coordinate fallbacks and the
  real migration in PGlite: owner isolation, duplicate rejection, protected
  columns, anonymous denial, foreign keys/cascades and preservation of old data.
- Auth, Friends, Match, filters, Study Score, data/opening-hours and onboarding
  suites passed with the new migration present.
- `node tests/cafe-actions-browser.cjs` passed at 360×844, 375×844, 393×844 and
  1440×844: public deep links, auth entry, share API branches, clipboard failure,
  directions URLs/dismissal, save/unsave, optimistic state, failure rollback,
  persistence after reload, Saved tint, 44px+ actions and no horizontal overflow.
  Additional 393px checks cover opening details directly from Saved, loading
  failure/retry and clearing saved state on logout.
- Friends browser regression checks passed at 390, 360 and 1440 pixels, including
  return to Saved/Nearby and desktop/mobile resizing.

Browser checks use the existing isolated PGlite fixture, never production Auth:

```text
node tests/support/friends-server.cjs
node tests/support/friends-app.cjs
node tests/cafe-actions-browser.cjs
```

The browser test accepts `PLAYWRIGHT_MODULE` for an existing Playwright install.
`CAFE_QA_WIDTH` optionally limits it to one viewport. No runtime dependency was
added. Screenshots are in ignored `.npm-cache/cafe-actions-qa/screenshots`.

Native share success/cancellation are verified with browser API mocks. Actual
iOS share sheets and installed Maps/PWA handoff still require a physical-device
smoke test. Maps and photos are stubbed only in the isolated visual test harness.

## Changed files

- `components/CafeActions.tsx`: functional existing buttons and maps chooser.
- `components/SavedCafesProvider.tsx`, `components/SavedPanel.tsx`: shared persisted
  state and Saved list, empty, signed-out, loading and error states.
- `components/CafeDetails.tsx`, `components/BottomSheet.tsx`: action/auth wiring.
- `components/HomeClient.tsx`: provider, public cafe links and Saved navigation.
- `components/Sidebar.tsx`, `components/WorkspacesSheet.tsx`: mobile/desktop Saved.
- `components/CafeCard.tsx`: contextual Saved tint only.
- `lib/data/cafes.ts`, `types/cafe.ts`, `types/database.ts`: existing stable cafe
  identifiers and Saved database types.
- `utils/cafeActions.ts`: reusable URL/coordinate handling.
- `supabase/migrations/20261004182548_saved_cafes.sql`: new Saved schema/policies.
- `tests/cafe-actions.test.cjs`, `tests/cafe-actions-browser.cjs`: regression tests.
- `tests/support/friends-server.cjs`, `tests/friends-browser.cjs`: extend the local
  fixture and update the former Saved placeholder expectation.
- `package.json`: cafe action test command.
- `docs/cafe-actions.md`: behaviour, migration and validation notes.

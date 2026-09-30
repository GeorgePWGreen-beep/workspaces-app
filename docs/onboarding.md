# First-time Hot Seats onboarding

## Experience

New visitors see Welcome, City, a personalisation introduction, Atmosphere, Session length, Priorities, then a completion screen. Guest users never face a login wall. Explore without an account goes through City directly to the map; Skip for now exits from the introduction or preference steps. The two example score cards are explicitly labelled as examples.

The flow uses existing design tokens, restrained Lucide icons, short Framer Motion transitions with reduced-motion support, native radio/checkbox controls, visible focus, and focused headings on step changes. Back preserves answers. Priorities are capped at three; zero priorities remains valid under the existing schema. The required atmosphere/session answers have no invented defaults.

The session labels are Under 1 hour, 1–2 hours, and 2+ hours, with Quick session, Typical study session and Longer focus session as supporting copy. Their canonical keys remain short/medium/long. Existing stored preferences retain their keys and Match weights; this visual pass makes no data migration or calculation change.

## Architecture and files

Created:
- `components/onboarding/OnboardingFlow.tsx`: one step controller and draft, submit/skip/back/completion.
- `components/onboarding/WelcomeStep.tsx`: value proposition and entry choices.
- `components/onboarding/DiscoverySteps.tsx`: city cards and clearly labelled illustrative scores.
- `components/onboarding/PreferenceFields.tsx`: shared accessible preference controls for onboarding and account editing.
- `lib/onboarding.ts`: versioned keys, compatibility rules, validated local preferences, capped priority toggle.
- `tests/onboarding.test.cjs`: persistence/compatibility and input boundary tests.
- This document.

Modified:
- `components/HomeClient.tsx`: first-run gate, existing city state/storage, completion, and deferred once-only Nearby introduction.
- `components/StudyPreferencesProvider.tsx`: guest source in the existing provider, guarded account import, existing Supabase persistence and unchanged canonical Match calculation.
- `components/StudyPreferencesSheet.tsx`: shared fields and guest editing/reset support.
- `components/AccountSheet.tsx`: Study preferences entry for guests as well as signed-in users.
- `package.json`: `test:onboarding` command.
- `docs/personalised-match-v1.md`: pointer to this extension of the original signed-in-only behaviour.

No map, cafe data, Study Score calculation, Match calculation, filters, Saved, Friends, auth provider or database schema was rewritten.

## Persistence and compatibility

- `hot-seats.onboarding-complete.v1 = true` records explicit completion, including skipping.
- `hot-seats.onboarding-started.v1 = true` distinguishes a new user's in-progress city selection from a returning user's legacy city. Completion clears it. Reloading an unfinished flow restarts the welcome sequence with the saved city; unsaved preference drafts are only retained while navigating Back within the flow.
- Existing `hot-seats.city.v1` remains the only persisted selected city.
- A legacy saved city, previous Nearby-introduction flag, or valid guest preferences bypasses onboarding when no in-progress/new completion flag exists. That compatibility migration also marks Nearby as already introduced, keeping returning visitors on the full map.
- Restored account preferences bypass onboarding when no flow is in progress. A returning account without a saved city still uses the existing city chooser.
- Storage errors are caught. Guest answers still work in memory for that visit; persistence across launches cannot be guaranteed when browser storage is unavailable or cleared.

## Guest preferences and account transition

`hot-seats.guest-study-preferences.v1` stores only the validated canonical atmosphere, session and priority values. Guests can edit/reset from the existing account sheet, but see no Match scores and retain Study Score ordering. After sign-in and successful account loading/import, the same StudyPreferencesProvider calculates Match for cards, details and Nearby ranking. Signed-in preferences are never copied into guest storage. The completion screen explains that sign-in enables personalised Matches.

After auth restoration, the provider reads the current user's Supabase preferences once. Existing remote answers win. If the row is missing and guest answers exist, the provider inserts those answers for that user. A concurrent insert conflict re-reads the authoritative row. The local guest copy is cleared only after a successful remote result; errors retain the guest copy for retry and never fall back to a different user's Match. Logout removes account-derived Match from the UI. No per-cafe network requests are added.

The current private `public.user_study_preferences` table, RLS and column grants are assumed to exist. Inserts and updates remain separate to respect the existing immutable user_id grant. No migration, RLS modification or live database operation was needed for this task. Guest answers are transferred into the private account table only after authentication.

## First map visit

The existing `hot-seats.nearby-guidance.v1 = seen` flag is reused. After the map's existing ready callback, and once no account/filter/preferences/city modal is active, new mobile users get Nearby at its existing approximately 45% position. The flag is then persisted. Desktop already has the permanent Nearby sidebar, so it records the introduction without opening a hidden mobile sheet. Future visits start with the normal full map and mobile dock. A reload after completing onboarding but before map readiness keeps the introduction pending.

## Verification

- `npm.cmd run test:onboarding`: 5 passed.
- Existing `test:auth` (13), `test:filters` (19), `test:score` (26), `test:data` (9), `test:match` (9): 76 passed, including existing PGlite database/RLS coverage.
- `npx.cmd tsc --noEmit`, `npm.cmd run lint`, `npm.cmd run build`: passed.
- Isolated Playwright: 393x852 (iPhone 14 Pro-sized), 360x852, 1440x852. Full guest journey, selected city, back retention, required fields, three-priority cap, local persistence, actual Match display, first Nearby opening, returning dock, guest editing, both skip paths, and legacy migration passed without horizontal overflow.
- Account checks: guest import and server restoration, existing remote answers winning over local guest answers, logout isolation, authenticated onboarding insert and editing update, search and Independent filter passed.
- Keyboard checks: heading focus, Tab/Space, native radio arrow navigation and checkboxes passed; both ordinary and reduced-motion flows were exercised.
- Blocked localStorage: onboarding completed and local Match worked for the visit.
- Two visual passes reviewed welcome, city, introduction, priorities, completion and first-map screens; priority controls were compacted after the first pass.

One data-test run overlapped the production build clearing `.next` and lost its compiled test file. Rerunning that suite after the build passed all nine tests. Build and tests that emit into `.next` should run sequentially.

Browser QA used an isolated local auth/API backend and copied application. Artifacts and scripts are in ignored `.npm-cache/onboarding-qa/`. No production account or cafe rows were changed. External map styles and cafe imagery remain network-restricted in this environment, so the map-style request was replaced with a blank style for browser tests. Live Supabase integration was not exercised here; actual schema/authorization is covered by the existing local PostgreSQL tests. Preference changes on another already-open device still require a reload, as before.

No commit or push was performed.

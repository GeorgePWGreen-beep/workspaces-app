# Welcome onboarding

The original `components/onboarding/OnboardingFlow.tsx` is mounted by `HomeClient` after client storage and study preferences load. The welcome layout, branding, feature cards and actions are reused. Study Scores expands accessibly, with reduced-motion support, to explain the seven inputs and four classifications. The existing scroll container keeps actions reachable on small screens.

Get started opens ?Make Hot Seats yours? directly. Personalise my matches opens the existing three preference questions; Skip for now and Explore without an account complete onboarding and open the normal map. No account is required. The initial city uses the saved city or a populated default; Change city remains available on the map. Both example cards use the shared cafe-detail `StudyScore` circle at 84 (Great), with Match at 93%.

Completion uses `hot-seats.onboarding-complete.v1`. A started marker distinguishes unfinished onboarding from legacy city/preferences data. Existing completion, legacy city/preferences, or a completed old Nearby introduction bypass welcome. Pending contextual tutorial flags do not affect navigation. Shared cafe links and authentication callback notices retain their direct entry paths. Storage failures do not block the current visit; persistence is unavailable when browser storage is blocked.

The automatic Nearby reveal and `FeatureIntroductionsContext` provider are no longer mounted. Their dormant components/storage helpers remain for compatibility; no old tutorial observers or storage listeners are started. The sheet's existing drag/snap interruption fix is unchanged.

## Local reset

With `npm run dev`, visit `/?intro=reset`. This clears welcome completion and old Nearby completion and marks onboarding started, preserving city and preferences. The parameter is removed after use. Production ignores it. A fresh browser context is another option.

## Checks

- `npx tsc --noEmit`
- `npm run test:onboarding`
- `node tests/onboarding-browser.cjs` with the isolated `tests/support/friends-server.cjs` and `friends-app.cjs` fixtures; `QA_BROWSER=webkit` selects WebKit. The old progressive test filename delegates to this restored-flow suite.
- `tests/sheet-interruption-browser.cjs` now completes welcome before running first-visit gestures; its interruption checks are unchanged.

## Manual smoke test

1. On a fresh phone browser, verify red branding and original welcome. Expand/collapse Study Scores; verify all thresholds and scroll to both actions, including with larger text.
2. Get started: verify the second screen's circular 84 / Great and Match 93%. Open preferences, go back, then skip. Confirm the normal map and floating dock.
3. On a new context, Explore without an account. Reload: welcome and Nearby do not appear automatically. Check Change city, search, filters, Saved, Friends and account entry.
4. Complete the existing guest preference questions; verify saved preferences and map entry without registration.
5. Open Nearby; interrupt opening/closing snaps, swipe between 45% and 95%, scroll, dismiss and reopen. Repeat on physical iPhone Safari and installed PWA.

No physical-device or broad performance claim is made by the focused onboarding tests.

# Personalised Match v1 — final verification, 28 September 2026

## Scope and files changed in this pass

Continued from the existing implementation and preserved the pre-existing onboarding, branding, manifest and account changes. No commit, push, production write, migration, or Friends implementation.

- `components/StudyPreferencesProvider.tsx`: require a signed-in identity before calculating/displaying Match; retain guest answers and existing account transfer.
- `components/Sidebar.tsx`, `components/WorkspacesSheet.tsx`: show Best Match only when account Matches exist; otherwise retain Highest Study Score.
- `components/onboarding/OnboardingFlow.tsx`: explain that saved guest answers enable Match after sign-in.
- `components/onboarding/PreferenceFields.tsx`: restrained rounded icon backgrounds with selected-state colour treatment; shared by onboarding and Account editing.
- `tests/match.test.cjs`: explicit two-preference ranking reversal, unchanged Study Score, deterministic supported reasons, and city/filter-before-ranking regressions.
- `package.json`: compile filter dependencies for the expanded Match tests.
- `docs/onboarding.md`, `docs/personalised-match-v1.md`, this report: current behaviour and verification evidence.

The working tree already contained additional modified and untracked files when this pass began. They were preserved rather than reset or attributed to this pass.

## Findings and behaviour

The newer guest onboarding implementation was showing actual Match scores and Best Match ordering while signed out, contrary to the final v1 requirement. This is fixed. Guest answers remain editable and can transfer to a missing account preference row after sign-in; existing remote preferences take precedence. Signed-in preferences are never copied to guest storage.

`calculateMatch` in `utils/matchV1.ts` remains the sole canonical algorithm, unchanged in this pass. All seven base weights, the 1.35 priority multiplier, session modifiers and atmosphere compatibility mappings are unchanged. Match is a weighted compatibility average rounded once to an integer in 0–100, not a probability. Unknown capacity contributes neither a value nor a weight; the other weights renormalise. Unknown capacity has no approximate-seat label in details.

Auth restoration and preference loading hide Match without inventing defaults. Returning users with a saved city can use the map while preferences load. The provider performs one preference read per load, guards stale responses, and updates shared state after successful insert/update/delete. Cards, details and both Nearby lists consume that state, so edits and resets apply without logout or page reload. Failed saves preserve the draft; failed loads offer retry. Session reload reads the saved account preferences again.

Account → Study preferences displays current selections and supports editing, saving, cancelling and reset. First-time onboarding can be skipped. Native radio/checkbox controls, a three-priority limit, off-white surfaces, green accents and fixed sheet actions remain in place. The visual refinement adds small line-icon backgrounds without changing the rest of Hot Seats.

Both Nearby lists rank by descending Match, with descending universal Study Score breaking ties. Signed-out/missing/loading/error states retain Study Score ordering. City selection and other filters run before ranking; Exeter and Cambridge stay separate. Map pins continue to show only Study Score.

CafeCard retains the prominent universal score and a smaller `97% Match` pill. CafeDetails retains its main Study Score ring and shows `97% Match for you`, followed by up to three positive reasons ordered by weighted contribution. Reasons are deterministic and attribute-supported; e.g. `Some` sockets never produce “Plenty of sockets”. Weak data can legitimately yield fewer than two positive reasons rather than fabricated claims.

## Preference-change evidence

The isolated browser fixture used these exact preference sets:

| Set | Atmosphere | Session | Priorities |
| --- | --- | --- | --- |
| A | Quiet | Long | Wi-Fi, sockets, seating |
| B | Lively | Short | Coffee, space |

Arrietty changed from **97% to 95% Match**, while its **Study Score remained 85**, on cards and details. Its reasons changed from “Comfortable seating · Plenty of sockets · Great Wi-Fi” to “Great Wi-Fi · Excellent coffee · Comfortable seating”. Nearby changed as well: Sundays moved ahead of The Sunset Society, and 18g Coffee Roasters moved from eighth to tenth. The automated unit fixture additionally proves a complete ordering reversal between two contrasting cafes.

## Verification results

| Check | Result |
| --- | --- |
| TypeScript (`npx.cmd tsc --noEmit`) | Pass |
| ESLint (`npm.cmd run lint`) | Pass |
| Production build (`npm.cmd run build`) | Pass |
| Auth | 13 passed |
| Filters | 19 passed |
| Study Score | 26 passed |
| Opening-hours/data/walking | 9 passed |
| Match and preference database | 12 passed |
| Onboarding | 5 passed |

**84 automated tests passed.** Match tests cover 1,638 preference/capacity combinations, exact weight normalization, capacity boundaries, missing factors, integer range, mappings, priorities, ranking, unchanged Study Score and truthful reasons. PGlite database tests cover create/read/edit/delete, ownership isolation, constraints and preservation of existing cafe/profile data.

Browser checks passed at **390×844, 360×844 and 1440×844**: onboarding selections, three-priority cap, signed-out hidden Match, guest-to-account transfer, Account entry, saving, editing both preference sets, immediate card/detail/ranking updates, deliberately delayed preference loading, session reload, reset, subsequent save, and logout. No horizontal overflow or uncaught page errors occurred. Screenshots were inspected for onboarding, cards, details and the editor; the scrolling preference body keeps its Save/Cancel actions accessible. The mobile Nearby sheet was expanded through its drag handle.

Additional isolated browser checks passed for load-error retry, failed-save draft retention, one read per preference load, independent-session restoration, account isolation, signed-in missing-preference onboarding/skip, Cambridge-only results and hidden unknown capacity. Test runs and screenshots are retained locally under `.npm-cache/match-qa/` (ignored QA artifacts).

## Live database and verification limits

Read-only inspection of the live Hot Seats project confirmed exactly the six expected preference columns: `user_id`, `atmosphere_preference`, `session_length`, `priorities`, `created_at`, `updated_at`. RLS is enabled; all four CRUD policies enforce `auth.uid() = user_id`, including both UPDATE predicates. Column grants match the frontend's separate insert/update approach: ownership can be inserted but not updated, and timestamps are read-only. No schema blocker was found and no migration was reapplied.

Authenticated browser writes used the existing isolated GoTrue/PostgREST protocol fixture backed by PGlite and the repository migrations, not a production user account. Live authenticated save/edit/delete was therefore not performed. Map tiles were stubbed in browser tests; these runs verify map controls/pins and interaction, not external Mapbox tile delivery. The existing missing cafe-image fallback (`/cafes/placeholder.jpg`) produced 404s/blank image areas in the fixture; that pre-existing asset issue is outside this Match pass. Preference changes on another already-open device are not realtime; reload restores them.

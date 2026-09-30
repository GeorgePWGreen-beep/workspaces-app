# Hot Seats brand polish

## Identity and colour

Warm brick red identifies Hot Seats. Sage remains the product interaction and suitability colour. The red is intentionally limited to the chair tile, onboarding/app-shell lockup, and browser/installed-app identity; it is not a new error, success, score or selection colour.

Tokens in `app/globals.css`:

| Token | Value | Purpose |
| --- | --- | --- |
| `--hs-brand-red` | `#B64B43` | Primary identity red |
| `--hs-brand-red-hover` | `#9F4039` | Reserved identity hover/emphasis; no product buttons changed |
| `--hs-brand-red-soft` | `#FBF1EF` | Quiet identity tint |
| `--hs-brand-red-border` | `#E8C7C1` | Decorative identity border |
| `--hs-brand-on-red` | `#FFFCF8` | Warm light chair stroke |
| `--hs-green` / `--hs-sage` | `#2F7138` | Existing product interaction |
| `--hs-green-deep` / `--hs-sage-dark` | `#255D2F` | Existing deeper product emphasis |
| `--hs-green-soft` / `--hs-sage-soft` | `#EAF3E9` | Existing selected-card/Match surface |

The canvas remains `#FAFAF7`, surfaces white, and ink `#1C211D`. The soft/hover/border red tokens are supporting palette options, not a reason to add red accents throughout the UI. The system-font wordmark is unchanged in character; the previously unused serif token now aliases the system font to keep future brand usage consistent.

## Mark and placement

The mark remains a simple geometric armchair in a rounded square, with consistent strokes, clear arms/back/feet, and no extra detail or shadow. `lib/brand-mark.json` is the canonical geometry. `components/BrandMark.tsx` renders it with CSS tokens and supplies a shared compact/standard `BrandLockup`.

The welcome hero gets one 64px focal mark. The welcome header remains a restrained wordmark to avoid repeating the tile. Other onboarding steps, including completion, use the compact lockup. The mobile map header and desktop sidebar share the same mark/wordmark spacing and sizing. The initial loading shell also uses the lockup.

Preference cards, primary buttons, progress, Match, success check, filters, accounts and map pins retain their existing sage or functional colours. Seating-feature chair icons remain product icons, not red brand marks. No score colour scale or map styling was changed.

## Preference editor

The account/profile Study Preferences sheet now presents Atmosphere, Session length and Priorities as one scrollable editor with fixed Save changes and Cancel actions. It uses the exact same `PreferenceFields` cards, icons, native radios/checkboxes, checkmarks, cap and selected styles as onboarding. There is no second preference-card implementation. Close/Escape/cancel preserve saved data, failed saves retain the draft, and reset remains available.

Onboarding retains its existing step order, navigation, copy, progress, completion and persistence. Its Continue/profile-creation wording remains appropriate to onboarding; only the account editor uses Save changes semantics. Values, Supabase persistence, Match calculation and database constraints are untouched in this branding pass.

## Icon assets

The inspected original `app/favicon.ico` was the starter triangle. It has been replaced by a multi-resolution ICO with 16px, 32px and 48px PNG entries from the same chair geometry.

New exports:
- `public/brand/hot-seats.svg`: scalable standalone mark.
- `public/brand/icon-192.png` and `icon-512.png`: standard PWA icons.
- `public/brand/icon-maskable-512.png`: full red background and central safe-area chair for system masks.
- `app/apple-icon.png`: opaque 180x180 Apple touch icon.

`app/layout.tsx` references the SVG and explicitly declares the Apple touch icon. Next.js retains the file-based ICO fallback. `app/manifest.ts` uses correctly sized PNG icons, including a separate maskable entry. Manifest/browser theme and launch background stay warm off-white.

Run `npm.cmd run icons:generate` after changing mark geometry or identity tokens. `scripts/generate-brand-icons.cjs` reads the geometry and CSS colours, then uses the existing installed Sharp dependency to render deterministic assets and pack the ICO. No image generation service or new dependency is required. No visual asset needs manual replacement.

## Files changed in this pass

Added: `components/BrandMark.tsx`, `lib/brand-mark.json`, `scripts/generate-brand-icons.cjs`, `app/apple-icon.png`, the four `public/brand/` exports, and this report.

Modified: `app/globals.css`, `app/layout.tsx`, `app/manifest.ts`, `app/favicon.ico`, `components/FloatingSearch.tsx`, `components/Sidebar.tsx`, `components/HomeClient.tsx` (loading branding only), `components/onboarding/WelcomeStep.tsx`, `components/onboarding/OnboardingFlow.tsx` (lockup only), `components/StudyPreferencesSheet.tsx`, and `package.json` (icon-generation command).

The repository already contained uncommitted onboarding work when this task began. It was preserved. This pass does not modify the preferences provider, auth, schema, cafe data, Study Score or Match algorithms.

## Accessibility and verification

Calculated WCAG contrast:
- Identity red on warm canvas: **4.93:1**.
- Identity red on its soft tint: **4.64:1**.
- Warm light chair stroke on red: **5.04:1**.
- Existing sage on canvas: **5.67:1**.
- Existing deep sage on selected sage surface: **6.89:1**.

The mark is decorative beside readable Hot Seats text; it adds no redundant screen-reader announcement. Interactive states retain labels, native checked state, borders and checkmarks rather than relying only on colour. Touch targets and visible focus are retained. The editor traps focus through the native modal, supports Escape, and keeps actions visible in a 360x500 shortened viewport.

Commands/checks:
- `npm.cmd run icons:generate`: passed; repeated generation produced identical asset hashes.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit`: passed.
- `npm.cmd run build`: passed, including the Apple icon route.
- `test:onboarding` (5), `test:auth` (13), `test:filters` (19), `test:score` (26), `test:data` (9), `test:match` (9): **81 passed**.
- Isolated Playwright at 393x852, 360x852 and 1440x852: welcome, all onboarding preference steps/completion, main map, shared editor/cancel/save, selected-state colours, icon/manifest links, no horizontal overflow or page errors passed.
- Signed-in editor: insert/update, restore after reload, three-priority cap, failed-save draft retention, Escape and 360x500 action visibility passed using the isolated auth/API backend.
- Every favicon/Apple/manifest URL returned 200. PNG dimensions and ICO entries were decoded and checked. Favicon at 16/32/48px, normal PWA icon and circular mask were visually inspected.

Screenshots and browser scripts are in ignored `.npm-cache/brand-qa/`. External map tiles/cafe images are restricted in this environment, so browser QA used a blank map style. Production Supabase data was not written. Native home-screen installation on a physical iOS/Android device was not tested; references, dimensions, masks and browser-rendered exports were verified.

No commit or push was performed.

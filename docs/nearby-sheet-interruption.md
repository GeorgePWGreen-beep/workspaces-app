# Nearby spring interruption fix

## Confirmed cause and scope

The gesture state described a spring's **destination**, not its current position.
`beginDrag` stopped the spring but initialized the gesture from the collapsed or
expanded snap offset. The next pointer move therefore jumped to that offset.
Grabs during expansion were rejected while content scrolling was disabled;
closing animations were rejected by the closing/closed guard.

WebKit also reproduced native text dragging taking over a sheet gesture. Input
traces showed `dragstart`/`dragend` replacing the expected `pointerup`, leaving
the stopped sheet between snaps. Preventing the default pointer action when the
sheet takes ownership avoids this without disabling ordinary expanded scrolling.

This logic also exists in the pre-onboarding `03d78ce` version. The comparison
does not establish that onboarding introduced a general frame-rate regression.
Automatic opening makes interrupting an opening spring possible on first visit.

In an isolated fixture, instrumented 30-move drags produced zero HomeClient,
WorkspacesSheet or CafeCard renders, zero storage writes, and zero sheet-height
reads, both with and without the welcome. These remained zero after the fix.
The observers for Study Score and Match are not mounted in Nearby.

Before the fix, an 8px downward movement during opening moved the sheet roughly
40–62px upward in the sampled runs. The pre-onboarding version reproduced a
44px upward jump. The regression test now checks actual position continuity,
stationary holds, and stale completion callbacks instead of relying on FPS alone.

## Focused change

Only `components/WorkspacesSheet.tsx` changes production behavior:

- Stop/invalidate the previous spring before reading `sheetY.get()` for the drag
  origin. Keep pointer moves on the existing MotionValue, outside React renders.
- Prevent native text dragging when taking ownership of the pointer. Interactive
  controls still bypass sheet drag initiation and keep their normal click behavior.
- Accept grabs during opening, expansion, collapse, and dismissal. Cancelling a
  dismissal restores its open state and clears a queued collapse-then-close.
- Apply overscroll resistance relative to the interrupted position when it is
  below 45%, so resistance does not compress the existing offset into a jump.
- Keep native scrolling locked during a spring, then restore it when expanded
  and settled. Ordinary expanded-list scrolling and top-of-list pulls are unchanged.

The spring (stiffness 360, damping 38, mass 0.8), release thresholds, resistance
factor, and dismissed/45%/95% resting positions remain unchanged. No onboarding,
map, calculation, data, layout, or styling changes are part of this fix.

## Reproduce and verify

Use separate terminals for the existing local fixtures:

```text
node tests/support/friends-server.cjs
node tests/support/search-server.cjs
node tests/support/friends-app.cjs --search
node tests/sheet-interruption-browser.cjs
```

The test uses the existing Playwright installation or `PLAYWRIGHT_MODULE`.
Set `QA_BROWSER=webkit` and the appropriate `PLAYWRIGHT_BROWSERS_PATH` to run
WebKit. Optional `SHEET_QA_WIDTH=390` narrows a diagnostic run; the default checks
390x844 and 360x780, each with first-visit and returning-user storage.

Chromium sends native touch input through CDP. WebKit exercises pointer input;
it does not simulate physical iPhone touch hardware. The multi-cafe local fixture
allows real list scrolling. Mapbox runs with external tiles/images stubbed.
Position measurements are saved under `.npm-cache/sheet-performance/`.

Checks cover interruption of opening and closing, reversals during both snaps,
cancellation of queued dismissal, held fingers, repeated quick swipes, slow body
drags, exact resting positions, collapsed scroll lock, expanded scrolling, cafe
selection/details, dock navigation, and returning visits.

Also run the existing onboarding/progressive-onboarding browser suites against
`friends-app.cjs` without `--search`, the onboarding/search/filter unit scripts,
TypeScript, lint, and production build.

## Remaining performance limits

This fixes the reproduced input-handoff defects. Headless frame times were
variable and did not demonstrate a reliable overall FPS improvement or sustained
60fps. An isolated `will-change: transform` experiment did not demonstrate a
reliable gain, so no compositing/style change was shipped.

On physical iPhone Safari and an installed PWA, test with both fresh/reset and
returning storage. Grab during every opening/snap/close, reverse direction, hold
still, and repeat fast swipes. Verify 45%/95% rests, top-of-list pull-down,
collapsed dismissal, ordinary card taps/scrolling, map gestures after dismissal,
Safari chrome changes, rotation, and safe areas. Profile sustained dragging on
the affected device if general frame pacing still feels slow.

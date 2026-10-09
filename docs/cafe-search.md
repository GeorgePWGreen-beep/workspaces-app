# Cafe search and map results

Search remains client-side, over the cafe records already loaded by `HomeClient`.
Its existing `search` and `filters` state is authoritative for suggestions, map
markers, and Nearby. City and all active filters are applied before name ranking.
Nearby retains its existing personal Match / Study Score ordering.

## Files changed

- `components/CafeSearch.tsx` (new shared suggestions control)
- `components/FloatingSearch.tsx` and `components/Sidebar.tsx` (search integration)
- `components/HomeClient.tsx` (existing search/selection wiring and camera intent)
- `components/Map.tsx` (focus, bounds, padding, and gesture cancellation)
- `utils/cafeSearch.ts` and `utils/mapViewport.ts` (new pure utilities)
- `utils/filters.ts` (shared ranked name matching)
- `package.json` (search test command)
- `tests/search.test.cjs` and `tests/search-browser.cjs` (new coverage)
- `tests/support/search-server.cjs` (isolated search fixture)
- `tests/support/friends-app.cjs` (optional isolated search app mode)
- `docs/cafe-search.md` (this implementation and verification report)

## Matching

`utils/cafeSearch.ts` normalizes case, accents, apostrophes, punctuation, and
whitespace. It ranks exact names, name prefixes, word prefixes, substrings, then
Levenshtein matches. Fuzzy matching compares complete name tokens (or contiguous
token groups for a multiword query). Four- and five-character queries permit one
edit; longer queries permit two. Short and numeric queries need literal matches.
Within a tier, closer typo matches win, then Study Score descending, then name.
An empty normalized query preserves the incoming data order.

No dependency, server search, per-keystroke fetch, descriptions, or feature search
was added.

## Interaction

`CafeSearch` is shared by `FloatingSearch` and `Sidebar`. Its compact scrollable
suggestions start at two normalized characters and show name plus Study Score.
Arrow keys move focus between the input and result buttons. Enter on a button
selects it; Enter in the input selects only a sole result or a strictly better
name match. Study Score alone never resolves an ambiguous Enter. Escape or focus
leaving the control dismisses suggestions. The clear button preserves filters.

Selection blurs the focused input/button and calls the existing `openCafe` flow,
including CafeDetails and the existing shareable URL. The dropdown uses
`visualViewport` resize/scroll events to stay above a software keyboard where
space allows. Its mobile height is capped at 208px and its rows remain scrollable.

## Camera behavior

`utils/mapViewport.ts` produces a stable camera intent from normalized query,
canonical filter values, and an explicit cafe selection counter. The counter
allows selecting the same cafe again after manually panning away. React effect
events read the current result set without making clock ticks, location-provider
renders, or sheet state changes camera triggers.

- One cafe: fly to zoom 16. Automatic result focus does not open details.
- Multiple cafes: fit every coordinate, with maximum zoom 15.
- No cafes: stop a previous camera animation without changing the view.
- Query/filter changes coalesce for 220ms; selection is immediate.
- Pan, wheel, or map keyboard input cancels a pending fit. Mapbox retains control
  of gesture interruption during an active flight.
- Padding accounts for the visible search controls/dropdown, marker height,
  bottom dock, and collapsed sheet. It is read once per intent and is not retained
  as Mapbox global padding. Desktop uses the actual map container, excluding the
  sidebar/details pane.

A fully expanded sheet intentionally covers the map. Dragging it does not cause
camera movement. Opening hours/location can update the filtered list without
moving a manually positioned camera; the next explicit search/filter/selection
intent fits the current results.

## Verification

Run `npm run test:search` for the 23 matching, filter integration, ranking,
clearing, Enter, camera plan, padding, and intent stability tests. All eight
pre-existing unit/database test scripts also pass (95 tests).

The browser runner uses local fixtures, synthetic cafe locations, and the real
Mapbox engine with external tile requests stubbed. In separate terminals run:

```text
node tests/support/friends-server.cjs
node tests/support/search-server.cjs
node tests/support/friends-app.cjs --search
node tests/search-browser.cjs
```

The runner uses the existing Playwright installation in the ignored QA directory,
or `PLAYWRIGHT_MODULE` can point to an installed `@playwright/test` module.
It checks 390×844, 360×844, and 1440×844: partial/typo names, keyboard controls,
selection/details, real camera calls and projected pin positions, pan/zoom,
quick/full filters, no results, clearing, city scope, Nearby gestures, dock,
horizontal overflow, and simulated software-keyboard viewport shrinkage.
Screenshots are written under `.npm-cache/search-qa/screenshots/`.

Existing Friends and cafe-action browser regressions are also exercised with the
original isolated fixture app on port 3105. Lint, TypeScript, and the production
build are checked. Native iOS/Android keyboards, assistive technology, and live
Mapbox tiles still need device/manual verification; browser emulation does not
replace those checks.

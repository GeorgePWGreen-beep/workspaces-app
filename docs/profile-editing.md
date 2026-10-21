# Profile editing and avatar presets

The account screen opens an editor inside its existing modal sheet. Display names
are trimmed, internal whitespace is collapsed, and blank names or names longer
than 40 Unicode code points are rejected before a request is sent. A missing
display name falls back to the unique username. The username remains read-only.

`AuthProvider.updateProfile` reuses the existing authenticated browser client and
submission guard. `updateOwnProfile` updates only `display_name` and, when changed,
`avatar_url`, filtered by the signed-in user's ID. It requires a returned row from
`update(...).eq('id', userId).select(...).single()` before publishing the confirmed
profile or showing success. There is no upsert, metadata update, or optimistic
success. Missing rows and denied/network writes leave the editor's draft intact.
Stale responses cannot restore a profile after a session change.

## Stable preset identifiers

The existing database accepts only null or HTTPS-shaped `avatar_url` values. To
reuse that field without weakening its constraint, presets use this exact format:

`https://hotseats.co.uk/avatars/presets/v3/{appearance}/{hair}/{skin}/{colour}/{presentation}/{hairColour}`

These values are **opaque identifiers, not image endpoints**. `ProfileAvatar`
recognizes the exact allow-listed combinations and renders original flat SVG
portraits locally. No network request is made for a preset. Do not change
versioned meanings or derive the hostname from the current origin; the same stored
value must work on every device and deployment.

- Presentations: `boy`, `girl`, with subtle hairstyle variations; all haircuts remain available.
- Hair colours: `brown`, `blonde`, `ginger`, `black`.
- Saved `v2/{appearance}/{hair}/{skin}/{colour}` portraits retain their choices
  (Boy presentation, Black hair). Only a changed portrait is saved as v3.
- Appearances: `soft`, `oval`, `defined` (face shape, independent of hairstyle).
- Hairstyles: `crop`, `parted`, `waves`, `long`.
- Skin tones: `light`, `sand`, `tan`, `brown`, `deep`.
- Colours: `sage`, `forest`, `cream`, `clay`, `slate`.
- Null continues to mean initials in sage, the default and fallback.
- Legacy `v1/{style}/{colour}` identifiers retain their existing rendering for
  `initials`, `leaf`, `coffee`, and `book`. They are no longer picker options.
- The editor preserves the current avatar until a portrait choice is made.
  “Keep current” restores the saved value while editing, including legacy avatars.
- An omitted avatar update keeps the existing value, including a legacy photo.
- New arbitrary URLs, query strings, extra paths and unknown presets are rejected.
- Existing HTTPS photos remain displayable with no referrer and an initials
  fallback if loading fails. Unknown preset versions fall back to initials.

The shared avatar renderer is used by the account header, editor preview, account
button and Friends rows. There are no uploads, storage buckets or new dependencies.
`PortraitAvatar` contains only head-and-shoulders vector geometry, with neutral
features and a fixed understated top. The shared artwork uses flat oval heads,
small eyes, a minimal nose and clean hair silhouettes, with no mouth or shading.
This visual refinement applies to saved v2 and v3 portraits without rewriting their
identifiers or choices. Four keyboard-accessible tabs keep the
appearance (including presentation), hair (including colour), skin and background
choices compact. Choices use the existing `avatar_url` field; no migration is needed.

## Database boundaries

Read-only live inspection confirmed the existing profile constraints, column
grants and owner-only SELECT/UPDATE policies. Both UPDATE USING and WITH CHECK
require `auth.uid() = id`. No schema, RLS or production data was changed.

The editor's 40-character limit is intentionally stricter than the database's
existing 80-character limit. Existing longer names are displayed intact; editing
requires shortening them. The database still permits its original HTTPS values
and username updates to an owner; this editor exposes neither arbitrary URL input
nor username changes. No service-role client or new authorization mechanism is used.

## Checks

Run `npm run test:profile`, `npm run test:auth`, TypeScript, and lint. Profile tests
cover validation, catalog parsing, the exact update payload, retained/default
avatars, missing rows and sanitized failures. The auth suite executes the existing
migration in isolated PostgreSQL and checks preset persistence, public projection
and cross-user write rejection. The local browser fixture supports profile PATCH
requests against those same PostgreSQL permissions for focused UI checks.

With `node tests/support/friends-server.cjs` and `node tests/support/friends-app.cjs`
running, `node tests/profile-browser.cjs` checks the real UI against that isolated
fixture: Cancel/focus, validation, live preview, mobile and reduced-height layouts,
loading, confirmed saves, failures, missing rows, reload, a separate browser session,
retaining existing avatars, and sign-out/sign-in persistence. It uses the existing local
Playwright installation (or `PLAYWRIGHT_MODULE`); no production account is edited.

# Password recovery

## Required Supabase settings

In **Authentication → URL Configuration**:

- Site URL: `https://hotseats.co.uk`
- Add exact redirect URL `https://hotseats.co.uk/auth/recovery`.
- Add `http://localhost:3000/auth/recovery` for development. Add a different local port explicitly if used.
- Keep existing `/auth/confirm` entries. If `www.hotseats.co.uk` serves the app instead of redirecting to the canonical host, add `https://www.hotseats.co.uk/auth/recovery` too.

In **Authentication → Email Templates → Reset Password**, use the standard Supabase URL:

```html
<a href="{{ .ConfirmationURL }}">Reset your Hot Seats password</a>
```

Change only the **Reset Password** template if necessary. Leave signup confirmation unchanged. Do not point recovery at `/auth/confirm` or replace this URL with a token-hash link: this implementation uses the existing SSR client's PKCE flow. Configure production SMTP and verify its sender; retain Supabase password and rate-limit protections.

Requests use the current origin for the callback, checked against Supabase's allowlist. The callback always redirects locally to `/auth/reset-password`; caller-supplied destinations are ignored.

PKCE requires opening the link in the same browser/profile and origin that requested it, where Supabase stored its verifier cookie. For PWA requests, use that same browser context, or request a fresh link from the browser where the email opens. Missing verifiers or another browser/device receive a friendly new-link form. No custom reset tokens, secret keys or database changes are used.

References: [Supabase recovery](https://supabase.com/docs/guides/auth/passwords), [resetPasswordForEmail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [JWT authentication methods](https://supabase.com/docs/guides/auth/jwt-fields).

## Implementation

- `AccountSheet`: Forgot password beneath the sign-in password field, email entry, sending state, neutral confirmation and back navigation.
- `AuthProvider.requestPasswordReset`: existing browser client and submission guard; no email/account lookup. Account-specific failures receive the same neutral success response as unknown addresses. Service/network errors and rate limits use fixed messages without provider details.
- `/auth/recovery`: exchanges the Supabase PKCE code, validates recovery, and redirects without codes or provider descriptions. Responses use no-store and no-referrer. Email confirmation is unchanged.
- `/auth/reset-password`: `getUser` contacts Auth and `getClaims` validates signed claims. The user ID must match, the JWT must be unexpired, and its recovery authentication must be within the last hour. Ordinary sign-in/signup sessions cannot use the form. This one-hour form window starts when the link is exchanged; the email link's expiry remains controlled by Supabase.
- The password Server Action repeats validation and session authorization before `updateUser({ password })`. Passwords must match and meet the existing eight-character minimum; Supabase enforces any stronger configured policies. Success offers a full navigation to Hot Seats to refresh browser session state.
- Invalid/expired links offer a fresh reset request; connection failures offer retry. Passwords are cleared on success or session invalidation, and never logged or persisted by this UI. The page is non-indexable with no-referrer metadata; the existing `/auth/*` proxy supplies private/no-store session responses.

## Verification and release smoke test

Run `npx tsc --noEmit` and `npm run test:auth`. Tests cover validation, neutral responses, expired/revoked/non-recovery sessions, submission authorization, sanitized failures, both origins, open-redirect prevention, unchanged confirmation and existing RLS. Recovery SDK calls are mocked; tests do not send real emails.

After applying dashboard settings, check a test account on localhost and production:

1. Account → Sign in → Forgot password. Existing and unknown email addresses must show identical neutral confirmation.
2. Open the latest link in the requesting browser. Reject weak/mismatched passwords, save a valid password, continue to Hot Seats, then sign out and sign in using the new password.
3. Reopen a used/expired link; it must offer a new request. Also test another browser and direct reset-page navigation while signed out or normally signed in.
4. Simulate offline/rate-limited requests. Check clear errors, back navigation, mobile scrolling and keyboard access.
5. Confirm signup email confirmation still works.

Live SMTP delivery and deployed project recovery claims/configuration still require this smoke test; local fixtures cannot validate the actual Supabase service.

# CR-05 — Second-window session honesty until the BFF (do not implement IS-15)

**Do not fork IS-15.** **Do not fork SD-09** (trust-center XSS residual). **Do not implement** HttpOnly BFF, CSRF tokens, or Key Vault session material. This file is the leftover **all-day continuity** while tokens live in `sessionStorage`: a second window, restored tab, or projector machine does not silently look signed-in, and meeting keepalive (PT-19) is documented as the interim.

## Goal

Until IS-15, Working documents and in-app session-expired copy tell the truth: the architect SPA session is **this browser tab’s `sessionStorage`**. A new window may require sign-in. PT-19 / presenter heartbeat remains the meeting interim. Do not move tokens to `localStorage`. Do not claim the SPA is XSS-safe.

## Why

Livelihoods depending on the sealed record include dual-monitor and conference-room projector loops (R4). `sessionStorage` is tab-scoped. A second window that looks logged out, or a restored tab that looks logged in with an empty store, is casual-SPA. Implementing the BFF is IS-15. Silence plus a surprising login wall mid-ARB is the failure.

## Context

- `archlucid-ui/src/lib/oidc/session.ts` `persistTokenResponse` / `sessionStorage`
- `docs/architecture/adrs/0059-spa-bff-http-only-session-plan.md` — leave **Proposed** until IS-15
- SD-09 trust-center residual — extend with second-window / tab-restore, do not duplicate the XSS paragraph
- `OidcTokenExpiryWarningGuard` / `SESSION_IDLE_WORKING_TIMEOUT_MS` — 4h Working idle stays
- PT-19 presenter/print activity heartbeat — reuse if present; do not invent a second token store

## What to build

1. Confirm tokens still persist via `sessionStorage`. If IS-15 already removed them on Working GA builds, this prompt is a no-op besides Status notes.
2. Trust-center (or the identity residual SD-09 already added): one sentence that a new window or tab restore may require sign-in because the session is tab-scoped until the BFF.
3. Session-expired / signed-out operator copy: do not say “your session is saved on this device.” Say this tab’s session ended; sign in to resume last-open work (IS-13 prefs still apply after sign-in).
4. If presenter/print heartbeat is missing, add only the PT-19 activity ping — not a BFF.
5. Vitest: copy assertion. Do not add a XSS demo payload.

## Acceptance criteria

- A buyer/security reader can learn that a second window may not share the SPA session without opening `session.ts`.
- Refresh tokens are not written to `localStorage`.
- Working idle remains 4 hours. CLI Bearer still documented as supported.
- IS-15 remains the implementation owner.

## Constraints

- Do not replace Entra/Google IdP cookies.
- Do not disable idle timeout.
- Do not put `sessionStorage` in customer chrome banners.

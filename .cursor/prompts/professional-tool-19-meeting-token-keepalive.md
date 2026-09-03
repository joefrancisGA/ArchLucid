# PT-19 — Meeting-safe token keep-alive (presenter and print)

## Goal

While **Presenter** (`presenter=1`) or the **print** view is open, access-token expiry must not dump the room to `/auth/session-expired` with a two-minute warning as the only notice. Refresh the session on the existing heartbeat (or a presenter/print-specific activity write) so a long ARB does not log the architect out. Do **not** shorten Working idle (4 hours). Do **not** disable idle timeout entirely.

## Why

`OidcTokenExpiryWarningGuard` uses `SESSION_TOKEN_EXPIRY_WARNING_MS = 2 minutes`. Idle Working timeout is already 4 hours with a 60s **focus** heartbeat (`session-idle-timeout.ts`). Projector reading counts as focus if the tab is focused; a **second window** for print, or a token TTL shorter than the meeting, still kills the session. Livelihood failure mode: presenting findings and the screen becomes “Sign-in could not start.”

## Context

- `archlucid-ui/src/components/OidcTokenExpiryWarningGuard.tsx`
- `archlucid-ui/src/components/SessionIdleTimeoutGuard.tsx` — already uses Working 4h when mounted
- `archlucid-ui/src/lib/auth/session-idle-timeout.ts`
- Print route `architecture/reviews/[reviewId]/print/page.tsx`
- PT-15 presenter query flag — if PT-15 has not landed, still special-case the print route and any `presenter=1` you add here as a thin flag
- PT-09: mount the idle guard at first paint; this prompt is **token refresh during present/print**, not first-load JS

## What to build

1. When print view or presenter is active: treat the page as continuously active (reuse `writeSharedSessionLastActivityAt` on the existing focus heartbeat). If print is a separate window, it must write the shared `localStorage` activity key so the opener does not idle-out.
2. Token: trigger the same silent refresh path the shell already uses **before** the 2-minute warning when presenter/print is active. If no silent refresh exists, extend the warning copy and keep the session until the user dismisses — do not silently drop to session-expired while presenter is on without a blocking dialog.
3. Do not change `SESSION_IDLE_TIMEOUT_MS` / `SESSION_IDLE_WORKING_TIMEOUT_MS`.
4. Guided/demo: no change required beyond print if they use the same print route.
5. Vitest: activity writer called on print page mount; presenter/print does not shorten idle math; token warning still appears if refresh fails.

## Acceptance criteria

- Opening print or presenter does not, by itself, start a 2-minute countdown to a dead session while the tab stays open.
- A failed refresh still tells the user to re-authenticate; it does not look like a review crash.
- Normal desk use (no presenter/print) keeps current warning behavior.
- Working idle remains 4 hours.

## Constraints

- Do not disable session timeout as a global “never log out.”
- Do not lengthen idle for Guided.
- Do not store tokens in `localStorage` beyond existing OIDC session helpers.

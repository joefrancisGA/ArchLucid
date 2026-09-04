# RS-09 — Print window keeps the meeting session alive

**Do not fork LI-14, PT-15, PT-19, WD-07, or LD-13.** LD-13 owns the mediator/projector loop. Presenter query flag and print-pathname meeting-safe refresh already exist. This file is the leftover: **print is often a second window; the opener can still idle or expire**.

## Goal

While print or presenter is open, access-token expiry must not dump the room to `/auth/session-expired` with a two-minute warning as the only notice. A **print popup/tab** must write the shared `localStorage` activity key so the **opener** does not idle-out. Silent refresh stays on the existing heartbeat. Do **not** shorten Working idle (4 hours). Do **not** disable idle timeout globally. Do **not** build WD-07 live meeting elicitation or a second intake wizard.

## Why

`OidcTokenExpiryWarningGuard` `isMeetingSafeSessionSurface` is true when `pathname.includes("/print")` **in that window** or presenter query is set. The opener review-detail tab may still have a short token TTL and a 4-hour idle clock that only heartbeats while **that** tab is focused. Livelihood failure: presenting findings and the screen becomes “Sign-in could not start.”

## Context

- `archlucid-ui/src/components/OidcTokenExpiryWarningGuard.tsx`
- `archlucid-ui/src/lib/auth/session-idle-timeout.ts` — `writeSharedSessionLastActivityAt`, `SESSION_LAST_ACTIVITY_STORAGE_KEY`
- `archlucid-ui/src/components/SessionIdleTimeoutGuard.tsx`
- Print route `architecture/reviews/[reviewId]/print/page.tsx`
- `readPresenterModeFromSearchParams` / `readPresenterModeFromWindowLocation`
- LI-14 presenter layout — if presenter chrome is still missing, a **minimal** hide-teaching + large type on `presenter=1` is in scope; do not build the CTO demo overlay

## What to build

1. Print page mount: always `writeSharedSessionLastActivityAt` on an interval (reuse `SESSION_IDLE_FOCUS_HEARTBEAT_MS`) even if the print window is focused and the opener is not.
2. If print is `window.open`, the print page owns the heartbeat. If print is the same tab, existing pathname check stays.
3. Token: keep meeting-safe silent refresh **before** the 2-minute warning. If refresh fails, blocking dialog — do not silently drop to session-expired while presenter/print is on.
4. Do not change `SESSION_IDLE_TIMEOUT_MS` / `SESSION_IDLE_WORKING_TIMEOUT_MS`.
5. Vitest: print page writes the shared activity key; presenter/print does not shorten idle math; token warning still appears if refresh fails; presenter hides first-visit coaches if that chrome is touched.

## Acceptance criteria

- Opening print does not, by itself, start a 2-minute countdown to a dead **opener** session while print stays open.
- A failed refresh still tells the user to re-authenticate; it does not look like a review crash.
- Normal desk use (no presenter/print) keeps current warning behavior.
- Working idle remains 4 hours.

## Constraints

- Do not disable session timeout as a global “never log out.”
- Do not lengthen idle for Guided.
- Do not store tokens in `localStorage` beyond existing OIDC session helpers.
- Do not implement WD-07 meeting elicitation.

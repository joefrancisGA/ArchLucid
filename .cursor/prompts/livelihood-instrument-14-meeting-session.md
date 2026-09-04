# LI-14 — Meeting-safe presenter session (print + token keep-alive)

**Do not fork PT-15 / PT-19 / WD-07.** Presenter query flag already exists (`readPresenterModeFromSearchParams`). This file is **session survival + a presenter surface that is not the CTO demo overlay**.

## Goal

While **Presenter** (`presenter=1`) or the **print** view is open, access-token expiry must not dump the room to `/auth/session-expired` with a two-minute warning as the only notice. Refresh the session on the existing heartbeat so a long ARB does not log the architect out. Do **not** shorten Working idle (4 hours). Do **not** disable idle timeout entirely. WD-07 live meeting elicitation is **not** this prompt — do not build a second intake wizard for the conference room.

## Why

`OidcTokenExpiryWarningGuard` uses a two-minute warning (`SESSION_TOKEN_EXPIRY_WARNING_MS`). Idle Working timeout is already 4 hours with a 60s **focus** heartbeat. Projector reading counts as focus if the tab is focused; a **second window** for print, or a token TTL shorter than the meeting, still kills the session. Livelihood failure mode: presenting findings and the screen becomes “Sign-in could not start.”

## Context

- `archlucid-ui/src/lib/review-detail-workspace-tabs.ts` — `readPresenterModeFromSearchParams`
- `archlucid-ui/src/components/reviews/ReviewDetailWorkspace.tsx`
- `archlucid-ui/src/components/OidcTokenExpiryWarningGuard.tsx`
- `archlucid-ui/src/components/SessionIdleTimeoutGuard.tsx`
- `archlucid-ui/src/lib/auth/session-idle-timeout.ts`
- Print route `architecture/reviews/[reviewId]/print/page.tsx`
- `writeSharedSessionLastActivityAt` (existing shared activity key)

## What to build

1. Presenter mode (`presenter=1`): a dedicated layout for the open review — large type, findings + verdict + trail, hide teaching chrome and ops pills. Reuse review-detail data. Not the buyer CTO demo tour.
2. When print view or presenter is active: treat the page as continuously active (reuse `writeSharedSessionLastActivityAt` on the existing focus heartbeat). If print is a separate window, it must write the shared `localStorage` activity key so the opener does not idle-out.
3. Token: trigger the same silent refresh path the shell already uses **before** the 2-minute warning when presenter/print is active. If refresh fails, keep a blocking dialog — do not silently drop to session-expired while presenter is on.
4. Do not change `SESSION_IDLE_TIMEOUT_MS` / `SESSION_IDLE_WORKING_TIMEOUT_MS`.
5. Vitest: activity writer called on print page mount; presenter/print does not shorten idle math; token warning still appears if refresh fails; presenter hides first-visit coaches.

## Acceptance criteria

- Opening print or presenter does not, by itself, start a 2-minute countdown to a dead session while the tab stays open.
- A failed refresh still tells the user to re-authenticate; it does not look like a review crash.
- Normal desk use (no presenter/print) keeps current warning behavior.
- Working idle remains 4 hours.

## Constraints

- Do not disable session timeout as a global “never log out.”
- Do not lengthen idle for Guided.
- Do not store tokens in `localStorage` beyond existing OIDC session helpers.
- Do not implement WD-07 meeting elicitation (live capture) in this prompt.

# WA-17 — Token keepalive on long Finalize and export (not only presenter)

**Do not fork LI-14 or PT-19** for presenter query-flag heartbeat and refresh-before-warning. Those shipped for the projector. This file is **the same session death on Finalize, package ZIP, and sponsor export**.

## Goal

Working-mode long mutations (Finalize, package export, receipt/PDF) refresh the OIDC session **before** the two-minute expiry warning, using the same helper as presenter. Do not disable idle timeout. Working idle stays 4 hours. Do not store tokens in `localStorage` beyond existing OIDC helpers.

## Why

Idle was extended because projector sessions dropped — a patch on the wrong interaction. Finalize/export is the career action and can still die mid-stamp. Casual SPAs dump you to login. Livelihoods keep the stamp.

## Context

- Presenter keepalive / `session-idle-timeout.ts` — **reuse**
- Finalize CTA / export download buttons
- `SESSION_IDLE_WORKING_TIMEOUT_MS` — do not shorten; do not lengthen Guided
- RS-09 print opener — do not fork; this is the **opener** mutation, not the print window

## What to build

1. Reuse presenter refresh-before-warning on Finalize and export start (and while a download is in flight if a hook already exists).
2. If refresh fails, TB-2155: what failed / what’s intact / sign-in — do not claim the package sealed if commit did not return.
3. Vitest: Finalize path invokes the same keepalive helper as presenter; Guided idle unchanged.

## Acceptance criteria

- A Working user whose token is near expiry can Finalize without an unexpected login interstitial wiping the form.
- Presenter keepalive still holds.
- No global “never log out.”

## Constraints

- Do not disable session timeout.
- Do not lengthen idle for Guided.
- Do not collapse review tabs.

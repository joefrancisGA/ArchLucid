# WA-15 — Refresh restores workbench column, filters, and scroll

**Do not fork PT-14 or RS-13** for `findingId` URL restore or workbench-first-paint flash. Finding deep-link shipped. This file is **remaining workspace context**: workbench focus column, findings filter/sort, and scroll position (or the focused finding row) survive refresh on the same review URL.

## Goal

Working-mode review-detail encodes enough context in the URL (preferred) or session that a refresh does not dump the architect back to Overview tab-only with filters cleared. Do not use `localStorage` as the only SoT across devices — URL first, then account prefs from WA-14 for defaults.

## Why

All-day tools survive F5. Casual SPAs reset. PT-14 named this; only `REVIEW_DETAIL_FINDING_PARAM` landed. Meetings die when the selected column and hide-generic vanish.

## Context

- `REVIEW_DETAIL_FINDING_PARAM` — keep
- `?reviewTab=` — keep as default landing only where already used
- `review-findings-visibility-url.ts` / Wave 25–26 URL filters — extend, do not invent a second query language
- `ReviewWorkbenchLayout.tsx` / column focus
- RS-13 first-paint — do not regress tab-only flash

## What to build

1. Workbench focus column in the URL (or existing workbench pref if column is user-level). Restore on load.
2. Findings sort/filter already in URL stay authoritative on refresh; if any remain component state only, lift them.
3. Scroll: restore to the selected finding row when `findingId` is present (do not fight Radix).
4. Vitest: review-detail with query params hydrates column + filters without a tab-only first paint.

## Acceptance criteria

- Refresh on a filtered findings workbench returns the architect to the same desk.
- Guided may ignore column restore if workbench is off.
- Desktop tabs remain a full strip (do not stash context in a More menu).

## Constraints

- Do not persist tokens or raw evidence blobs in the URL.
- Do not collapse review tabs.
- Do not start a dev server.

# WA-14 — Remaining desk prefs follow the signed-in account

**Do not fork RS-10** for ROI loaded hourly cost. That field is shipped. This file is **other meeting-defended prefs** still URL-or-browser only: findings hide-generic, low-confidence/advisory visibility, sample-reviews-on-overview already has an API — wire remaining density toggles the same way.

## Goal

Preferences that change what an architect will show a sponsor persist on `GET /v1/user/preferences` (same plane as workspace mode / workbench / ROI). `localStorage` is cache. Last write wins. URL may still deep-link a one-off (`hideGeneric=1`) without becoming the only SoT. Theme/dev-testing stay device-local.

## Why

Professionals switch dock and laptop. Hide-generic on findings is currently URL/useState (`RunDetailFindingsWorkspace.tsx`). Casual SPAs keep triage filters in the query string. Livelihood tools follow the seat.

## Context

- `archlucid-ui/src/lib/api/user-preferences-types.ts` — extend DTO; do not invent a second API
- `RunDetailFindingsWorkspace.tsx` hide-generic / showLowConfidence / showAdvisory
- Governance findings queue hide-generic
- `sampleReviewsOnOverviewEnabled` — already on DTO; do not regress
- `professionalWorkbenchEnabled` — pattern to copy
- All SQL DDL in the single database file

## What to build

1. Persist hide-generic (and findings visibility trio if they are user-level, not review-level). If they must be per-review, persist per-review on the server — pick one SoT, say it in copy, do not dual-write silently.
2. Hydrate like workbench: server explicit wins; avoid flash of “show all generics.”
3. Leave `DevTestingQuickSwitchPanel` browser-only.
4. Vitest: Working/Guided share the pref; mock PUT hits user-preferences. Scoped compile if C# changes.

## Acceptance criteria

- Architect who opts into hide-generic on one browser sees it after sign-in on another (after prefs load).
- Deep-link `?hideGeneric=1` still works for a one-off share without wiping the account default unless you document that the URL wins for that tab only.
- Engineer overrides remain device-local.

## Constraints

- Do not store tokens in preferences.
- Do not change `typed-engine-protected` (hide-generic stays opt-in).
- Do not collapse review tabs.

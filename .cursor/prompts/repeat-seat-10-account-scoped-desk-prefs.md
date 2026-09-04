# RS-10 — Desk preferences follow the signed-in account

**Do not fork LI-12 or PT-13** for architecture-draft autosave copy. Draft autosave already has an account sentence. This file is the leftover: **ROI loaded hourly cost (and similar desk prefs) still advertise this-browser-only**.

## Goal

Preferences that change the **numbers an architect will defend in a meeting** persist on the signed-in account (same user-preferences API as workspace mode / workbench), with `localStorage` as cache. Last write wins. Honest copy if a value is truly device-local (theme override, dev-testing panel). Working vs Guided does not split the store.

## Why

Professionals switch dock and laptop. Casual SPAs keep ROI assumptions in the browser. `roi-summary-help-guide-content.ts` still says: “Loaded hourly cost is saved in this browser only — it is not shared across people or devices.” That is a livelihood defect when the sponsor packet uses that rate. Workbench already syncs via `GET /v1/user/preferences` — reuse, do not invent a second preferences plane.

## Context

- `archlucid-ui/src/lib/roi-summary-help-guide-content.ts`
- `archlucid-ui/src/app/(operator)/insights/roi-summary/_sections/RoiSummaryLoadedHourlyCostField.tsx`
- Baseline settings if that is the SoT for the rate
- `archlucid-ui/src/lib/api/user-preferences.ts` / `user-preferences-workspace.ts`
- `archlucid-ui/src/lib/workspace-mode/professional-workbench-preference.ts` — pattern to copy
- Dev-testing / authority theme “this browser only” — **keep** those device-local; do not migrate engineer overrides to the account

## What to build

1. Persist loaded hourly cost (and any other sponsor-facing assumption currently local-only) on user preferences. Extend the existing DTO; all SQL DDL in the single database file; tenant isolation.
2. Help copy: account-scoped, not this-browser-only. If the field is workspace-level instead of user-level, say that honestly — pick one SoT, do not dual-write silently.
3. Hydrate like workbench: server explicit wins; cache in localStorage; no flash of $0 if avoidable.
4. Leave `DevTestingQuickSwitchPanel` and `AuthorityThemeDevSelector` browser-only.
5. Vitest: help copy no longer claims browser-only for hourly cost; client write hits user-preferences (mock); Guided/Working share the value.

## Acceptance criteria

- An architect who sets loaded hourly cost on one browser sees it after sign-in on another (after preferences load).
- Sponsor/ROI help does not say the rate is this-browser-only.
- Engineer chrome overrides remain device-local.
- No TB-645 jargon.

## Constraints

- Do not store tokens in preferences.
- Do not collapse review tabs.
- One class per file; no `ConfigureAwait(false)` in tests.
- Do not invent a second preferences API if `GET /v1/user/preferences` can grow a field.

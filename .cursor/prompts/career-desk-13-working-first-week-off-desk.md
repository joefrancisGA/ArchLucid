# CD-13 — First-week guidance stays off the Working review desk

**Do not fork WA-04 or CD-01** for help rows or deferral *copy*. This file is the **mount**: `RunDetailFirstWeekRouteGuidanceDeferred` still renders on review-detail. Working review-detail is the livelihood desk (findings, stamp, trail). First-week theater belongs on Guided / first-pilot Home.

## Goal

Working-mode review-detail does not mount first-week route guidance. Guided / buyer-eval may keep it. Teaching chrome fails closed until Guided (`use-teaching-chrome-visible.ts` — reuse). Do not remove the component; gate the mount.

## Why

An eight-hour desk that still shows “Recommended first session path” on the open package is an evaluator product. CD-01 fixes lying copy; this file removes the chrome from the desk.

## Context

- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailPageViewShell.tsx`
- `archlucid-ui/src/components/FirstWeekRouteGuidance.tsx`
- `use-teaching-chrome-visible.ts` / `resolveProductionDeskChrome`
- Home / onboarding may still show first-week for Guided (CD-01 copy)

## What to build

1. Gate `RunDetailFirstWeekRouteGuidanceDeferred` (and any review-detail first-week sibling) on eval chrome, not on “always.”
2. Vitest: Working review-detail fixture has no first-week heading (`FIRST_WEEK_ROUTE_GUIDANCE_HOME_SUMMARY` / committed summary). Guided fixture may. No tab collapse.

## Acceptance criteria

- Working open package is not a first-session tutorial.
- Guided review-detail may still teach finalize.
- Desktop tabs remain a full strip.

## Constraints

- Do not auto-switch Guided to Working.
- Do not hide Getting started by inventing a **More** menu on review tabs.
- Do not implement **M-90**.

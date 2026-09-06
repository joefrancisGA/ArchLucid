# DA-09 — Working eval leakage: wizard launcher and demo compare

**Do not fork LK-15** (mock CI identity). **Do not fork IS-08** except remaining call sites this file names. **Do not delete** Guided/demo/trial chrome. This prompt is **eval DNA on the paying desk**.

## Goal

Working seats do not start the day in an evaluator.

1. **Compare:** `CompareDemoQuickPick` and demo one-tap cards render only when `useProductionEvalChrome` (or equivalent eval resolver) is true. Working compare is two **real** reviews, preferably filtered to the open architecture when DA-04 passed an id (URL query `architectureId=`).
2. **Start:** Working `/architecture/reviews/new` without an explicit `?path=` does not open the first-run path switcher as the primary layout. It follows `resolveWorkingStartHref` / identity desk (IS-03 / DA-04). Guided keeps `ReviewsNewPathSwitcher`.
3. Copy: operator-adjacent “15 minutes” strings stay on **marketing / eval**, not Working compare/helper bands (`cloud-neutral-primary-copy.ts` — move or gate; do not rewrite GTM pages beyond the Working leak).

## Why

Casual tools optimize first-run success and demo one-taps. A repeat professional comparing drift on a production system must not see “Demo — Claims Intake comparison.” ADR 0069 already forbade two start products on Working Home; this is the leftover on Compare and `/reviews/new`.

## Context

- `CompareDemoQuickPick.tsx`
- `compare-workspace-copy.ts` (`COMPARE_HOW_IT_WORKS_SUMMARY`)
- `reviews-new-path-copy.ts` / `ReviewsNewPathSwitcher`
- `production-desk-chrome.ts` / `resolveProductionEvalChrome`
- IS-08 grandfather inventory; LK-15 CI mock identity — **do not change Playwright default project** here

## What to build

1. Gate demo compare + path switcher on eval chrome.
2. Working compare: architecture-scoped picker when `architectureId` query is present (DA-03/04). Still exactly two reviews.
3. Vitest: Working fixture has no demo quick-pick heading; Guided/eval fixture still can.
4. Inventory grep test for the demo heading string on Working-only modules (follow existing grandfather-inventory pattern — add rows, do not delete Guided allowlist).

## Acceptance criteria

- Working compare page screenshot/copy cannot contain the demo one-tap heading.
- Guided first-run switcher still exists.
- No N-way compare.

## Constraints

- Do not auto-switch stored Guided users to Working.
- Do not implement BFF.
- No GTM **M-90**.

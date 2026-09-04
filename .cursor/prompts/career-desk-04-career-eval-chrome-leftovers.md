# CD-04 — Career surfaces leave the WA-01 grandfather list

**Do not fork WA-01** for the resolver, CI inventory, or migrating every remaining path in this session. This file is **four livelihood clusters** still on `PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS`: package print, finding inspect, run-detail loaders, reviews list.

## Goal

Those clusters use `useProductionEvalChrome` / `resolveProductionEvalChrome` (or `resolveProductionDeskChrome`) for eval vs desk chrome — not `isBuyerPolishedOperatorShellEnv()` alone. Working + live tenant → desk. Guided / demo / trial → eval. Vocabulary stays TB-645 on both. Remove migrated paths from the grandfather list so the WA-01 guard keeps shrinking.

## Why

WA-01 shipped the inventory so new files cannot skip the resolver. Print, inspect, and the open package are where a career is defended. Buyer-polish-only branches there still treat the paying architect as a prospect.

## Context

- `archlucid-ui/src/lib/production-desk-chrome-eval-inventory.ts`
- `archlucid-ui/src/lib/production-desk-chrome.ts`
- Print: `PackagePrintPageView.tsx` (still imports `isBuyerPolishedOperatorShellEnv`)
- Inspect: `FindingInspectView.tsx` and sibling `FindingInspect*` files on the grandfather list
- Run detail: `load-run-detail-page-model.ts`, `RunDetailBuyerModeFallbackBanner.tsx`
- Reviews list: `use-runs-list.ts`, `runs-list-row-presentation.ts`
- `archlucid-ui/src/lib/production-desk-chrome-eval-guard.test.ts`

## What to build

1. Migrate the four clusters. Classify each call: eval chrome vs vocabulary vs engineer widget (engineer widgets stay capability + admin rank).
2. Delete migrated paths from `PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS`.
3. Vitest: Working + env-unset on print/inspect/list does not take sample/buyer fallback banners that still key off buyer-polish alone. Guard test still fails if a *new* operator file uses buyer-polish for eval chrome outside the (shorter) grandfather list.

## Acceptance criteria

- Print, inspect, open package, and reviews list no longer appear on the grandfather list.
- Guided/demo still get eval chrome via the resolver.
- No thirteenth env flag. No TB-645 regression.

## Constraints

- Do not attempt to drain the entire grandfather list in one session.
- Do not collapse review tabs.
- Do not revert `isBuyerPolishedOperatorShellEnv()` to `return true`.

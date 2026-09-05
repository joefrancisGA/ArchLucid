# CR-11 — Finding inspect leaves the eval grandfather list

**Do not fork IS-08** (desk-not-mode-matrix / resolver). **Do not fork SD-06** (remaining help first-session). **Do not auto-switch** stored Guided users. This file is leftover **finding-inspect cluster** still on `PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS` so the career document (the finding) still branches on `isBuyerPolishedOperatorShellEnv()`.

## Goal

Working finding inspect (`.../findings/[findingId]/**`) uses `useProductionEvalChrome` / `resolveProductionEvalChrome`. Buyer-polish eval chrome stays on Guided / demo / trial. Remove migrated paths from the grandfather list so the guard fails if inspect regresses.

## Why

The seatholder spends the day on findings. If inspect still keys off buyer-polish, the paying desk inherits first-session density, sample recovery, and softened labels on the document they will defend.

## Context

- `archlucid-ui/src/lib/production-desk-chrome-eval-inventory.ts` — finding-inspect paths under `reviews/[reviewId]/findings/[findingId]/`
- `production-desk-chrome-eval-guard.ts` / `.test.ts`
- `useProductionEvalChrome` / `resolveProductionEvalChrome`
- Finding inspect sections listed in the grandfather array (audit, evidence, body, ITSM, reasoning, why-matters, wayfinding, loaders)

## What to build

1. Migrate the finding-inspect cluster only (not the entire grandfather list). Administration / help / sponsor remaining paths stay grandfathered unless they are one-line resolver swaps in the same files you already open.
2. Working: full inspect chrome. Guided: existing eval softening allowed via the resolver, not a raw buyer-polish call.
3. Remove migrated paths from `PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS`. Guard test must pass.
4. Vitest on one inspect section: Working vs Guided chrome branch uses the resolver.

## Acceptance criteria

- Grep of `findings/[findingId]` production files has no raw `isBuyerPolishedOperatorShellEnv()` except tests.
- Grandfather list no longer includes those inspect paths.
- Guided inspect still works.

## Constraints

- Do not delete Guided.
- Do not change `typed-engine-protected` / the gate.
- Do not collapse review tabs.

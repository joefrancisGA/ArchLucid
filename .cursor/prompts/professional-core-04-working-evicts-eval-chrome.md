# PC-04 — Working shell mount graph evicts eval/buyer chunks

**Do not fork WA-01** (resolver — extend with CI inventory). **Do not fork LK-15** (mock CI identity — complement). **Do not remove Guided eval chrome.**

## Goal

1. **Runtime:** `useProductionEvalChrome` / buyer-polish gates return **false** on every Working hub and review-detail route — no CTO caption chunk, no buyer-polish callouts, no sample-recovery footer on live tenant data.
2. **CI:** Vitest inventory fails when a new operator page mounts eval-only chrome without `isWorkingMode` guard (extend `production-desk-chrome-eval-guard.test.ts` grandfather list only with one-line rationale per entry).

## Why

Dual product spine: eval chrome is not a skin — it is a second IA teaching first-run success. All-day users should never see “demo” or “first review” theater on a paying Working seat.

## Context

- `useProductionEvalChrome`, `WorkspaceModeProvider`
- `ArchitecturesHubBuyerChrome.tsx` — must not render in Working
- `production-desk-chrome-eval-guard.test.ts`
- LD-01, WA-03, FD-08 leftovers

## What to build

1. Grep `buyerPolish`, `evalChrome`, `BuyerCto`, `sample recovery` on `(operator)` routes; fix Working leaks.
2. Remove or gate `ArchitecturesHubBuyerChrome` when `isWorkingMode`.
3. Inventory test + fix regressions.

## Acceptance criteria

- Working Overview + architectures hub + review-detail: no buyer-polish-only components in React tree (Vitest or resolver inventory).
- Guided/demo unchanged.

## Constraints

- No auto-switch Guided → Working.

# WA-01 — Chrome-resolver CI inventory (eval chrome must not skip the desk switch)

**Do not fork LD-01 or WD-01.** `resolveProductionDeskChrome()` / `useProductionDeskChrome()` already exist. Buyer-polish env already returns false on production Working. This file is the leftover **platform**: new and remaining call sites still key eval chrome off `isBuyerPolishedOperatorShellEnv()` alone, and there is no CI inventory (the chrome analogue of RS-07).

## Goal

Every operator-shell **eval chrome** branch (sample CTAs, wizard collapse, teaching heroes, first-run recovery) goes through `resolveProductionDeskChrome` / `resolveProductionEvalChrome` (or the hooks). A Vitest/CI inventory fails if a new production operator file uses `isBuyerPolishedOperatorShellEnv()` for eval chrome without going through that resolver. Vocabulary (TB-645) stays on all customer surfaces. Engineer widgets stay capability + admin rank.

## Why

LD-01 shipped the switch. Production Working + live tenant is supposed to be the desk. Grep still shows `isBuyerPolishedOperatorShellEnv()` across operator pages, help `*BuyerChrome`, and tests; `useProductionDeskChrome` is used almost only on Insights evidence-graph. Casual tools grow a thirteenth flag. A livelihood desk has one question: desk or eval session.

## Context

- `archlucid-ui/src/lib/production-desk-chrome.ts` / `useProductionDeskChrome.ts` — **reuse**
- `archlucid-ui/src/lib/architect-workspace-chrome.ts`
- `archlucid-ui/src/lib/demo-ui-env.ts` — keep terminal `return false` on `isBuyerPolishedOperatorShellEnv`
- Grep `isBuyerPolishedOperatorShellEnv(` under `archlucid-ui/src` (exclude `*.test.*` first, then classify tests)
- RS-07 dirty-guard inventory — copy the **inventory test pattern**, not the dirty-guard helper
- `docs/library/OPERATOR_UI_EXPERIENCE_MODES.md` — already Working-desk default; do not resurrect TB-643 as identity

## What to build

1. Classify remaining production `isBuyerPolishedOperatorShellEnv()` / `isOperatorExperienceFullShellEnv()` call sites:
   - **Eval chrome** → resolver (Working + live → desk; Guided/demo/trial → eval).
   - **Vocabulary** → leave TB-645; density ≠ jargon.
   - **Engineer widgets** → leave for WA-03; do not make Working show COGS.
2. Add a Vitest inventory (new file next to `production-desk-chrome.test.ts` or a scripts/ci assert): operator production TS/TSX that branches sample/first-run/teaching on buyer-polish **without** importing the production-desk resolver fails CI. Allowlist: demo-ui-env itself, Vitest override, marketing, `*BuyerChrome` that is **vocabulary only** (document the allowlist).
3. Migrate the highest-traffic leftover eval branches you touch while adding the inventory (home, reviews hub, review-detail chrome). Do not boil the ocean in one PR if the inventory lands; leftover allowlisted sites must be named in the test.
4. Vitest: Working + env-unset → desk; Guided/demo/trial → eval; engineer flag still isolated. No new env var.

## Acceptance criteria

- A new operator file that uses buyer-polish for a sample CTA fails CI unless it goes through the resolver or is explicitly allowlisted as vocabulary/demo.
- Working live tenant does not take an eval branch that still keys off buyer-polish alone on the migrated surfaces.
- Guided / demo / trial still get eval chrome.
- `DeterministicInsightDensityGate.cs` untouched.

## Constraints

- Do not revert `isBuyerPolishedOperatorShellEnv()` to `return true`.
- Do not auto-switch stored Guided users to Working.
- Do not collapse review tabs.
- Do not implement GTM **M-90**.

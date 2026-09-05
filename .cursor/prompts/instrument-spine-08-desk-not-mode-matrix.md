# IS-08 — Production identity is the desk, not a mode matrix

**Do not fork WD-01 or WA-01.** `resolveProductionDeskChrome()` and the eval inventory already exist. FD assessment recorded **grandfather inventory violations** on unrelated operator surfaces. This file **finishes the call-site matrix** so production Working is not an overlay on buyer-polish / full-shell / demo / unlock-phase forks.

## Goal

Every remaining `isBuyerPolishedOperatorShellEnv()` / `isOperatorExperienceFullShellEnv()` call site under operator routes is classified: **eval chrome** (follow `resolveProductionEvalChrome`), **vocabulary** (TB-645 always), or **engineer widgets** (rank/capability only). Production Working + live tenant never takes sample recovery, Claims Intake heroes, or first-run wizards from leftover buyer-polish branches. `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator` remains internal engineer chrome only. No new env var.

## Why

Excel does not ship an evaluator skin that changes recovery and Home. The livelihood failure is an eval-first spine. A helper that defaults Working is useless if fifty surfaces still key off the old flags.

## Context

- `archlucid-ui/src/lib/production-desk-chrome.ts`
- `archlucid-ui/src/lib/production-desk-chrome-eval-inventory.ts`
- `archlucid-ui/src/lib/production-desk-chrome-eval-guard.test.ts` (known grandfather failures)
- Grep `isBuyerPolishedOperatorShellEnv(` under `archlucid-ui/src`
- `docs/library/OPERATOR_UI_EXPERIENCE_MODES.md`
- Finding-detail `finding-detail-route-display.ts` (heavy buyer-polish forks)

## What to build

1. Drive the guard test to green by migrating grandfathered files onto `resolveProductionDeskChrome` / `resolveProductionEvalChrome` **or** documenting a short, named exception list with owner rationale (eval-only marketing, demo showcase). Do not grow the grandfather list.
2. Working live recovery never offers Claims Intake / sample run as the primary recovery (PT-02 / WD-08 leftover if any call site remains).
3. Update `OPERATOR_UI_EXPERIENCE_MODES.md` so production identity is Working desk; buyer-polish is demo/trial/Guided.
4. Vitest: inventory guard passes; Working + env-unset → desk; Guided/demo/trial → eval.

## Acceptance criteria

- `production-desk-chrome-eval-guard.test.ts` is green on this branch.
- A Working user on env-unset does not hit sample/first-run branches that still assume buyer-polish is the production default.
- Engineer COGS/LLM pills still do not appear for ranks that cannot act.

## Constraints

- Do not auto-switch stored Guided users.
- Do not collapse review tabs.
- Do not change API authorization.

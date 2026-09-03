# WD-01 — Production identity is Working, not a mode overlay

**Do not fork PT-01.** The env function already returns false. This file is the residual: **call-site matrix** (buyer-polish × full-shell × demo × Guided) still driving eval branches.

## Goal

Authenticated **Working** seats on a production build *are* the product. Demo, static showcase, frictionless trial, and **Guided** are explicit eval/teaching sessions. Dense architect chrome must not require `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`. Do not invent a thirteenth flag.

## Why

The livelihood failure is an **eval-first spine**. Working mode, `resolveArchitectWorkspaceChrome()`, and `isBuyerPolishedOperatorShellEnv()` returning false are overlays. Dozens of surfaces still key off buyer-polish, demo, full-shell, unlock phase, and operator-experience independently. A daily user should not occupy that matrix. Excel does not ship an evaluator skin that changes recovery, home, and error copy.

Founding contract: seat for a repeat professional (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R13; ADR 0052). `docs/library/OPERATOR_UI_EXPERIENCE_MODES.md` still documents buyer-polished as the production default in places (TB-643) even after the env function changed.

## Context

- `archlucid-ui/src/lib/demo-ui-env.ts` — `isBuyerPolishedOperatorShellEnv`, `isOperatorExperienceFullShellEnv`, `isBuyerSafeDemoMarketingChromeEnv`
- `archlucid-ui/src/lib/architect-workspace-chrome.ts` / `useArchitectWorkspaceChrome.ts`
- `archlucid-ui/src/lib/workspace-mode/workspace-mode.ts` — already defaults to **working**
- Grep `isBuyerPolishedOperatorShellEnv(` and `isOperatorExperienceFullShellEnv(` under `archlucid-ui/src`
- `docs/library/OPERATOR_UI_EXPERIENCE_MODES.md`, `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`
- PT-01 residual: do not revert the terminal `return false`; finish call-site classification

## What to build

1. Introduce **one client resolver** used from operator surfaces: `resolveProductionDeskChrome({ workspaceMode, demo, trial })` (name as you like). Production Working + live tenant → desk chrome. Guided / demo / trial → eval chrome.
2. Audit every `isBuyerPolishedOperatorShellEnv()` / `isOperatorExperienceFullShellEnv()` call site. Classify:
   - **Eval chrome** (sample CTAs, wizard collapse, teaching heroes) → follow the resolver.
   - **Vocabulary** → leave **TB-645** on *all* customer surfaces. Density ≠ jargon.
   - **Engineer widgets** (COGS, LLM budget, RAG health) → capability + admin rank only, never “Working makes them appear.”
3. `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator` remains **internal engineer chrome** only. Pilots must not need it.
4. Update `OPERATOR_UI_EXPERIENCE_MODES.md` so production default is Working desk, not buyer-polished-as-identity.
5. Vitest: Working + env-unset → desk; Guided/demo/trial → eval; engineer flag still isolated.

## Acceptance criteria

- A Working user on a production (env-unset) build does not take eval/sample/first-run branches that still key off the old always-true mental model.
- Guided / demo / trial do not grow COGS/LLM pills for roles that cannot act on them.
- No customer-visible run/job/manifest relabel regression (TB-645).
- No new env var. No auto-switch of stored Guided users to Working.

## Constraints

- Do not collapse review workspace tabs.
- Do not change API authorization.
- Do not implement GTM **M-90** first-session cohorts.

# LD-01 — Production identity is Working desk, not a buyer-polish matrix

**Do not fork WD-01 or PT-01.** The env function already returns false. LI-01–15 shipped overlays. This file is the residual: **dozens of call sites still key eval chrome off `isBuyerPolishedOperatorShellEnv()` independently of Working mode**, and `docs/library/OPERATOR_UI_EXPERIENCE_MODES.md` still tells deployers that buyer-oriented chrome is the production default (TB-643).

## Goal

Authenticated **Working** seats on a production (env-unset) build *are* the product. Demo, static showcase, frictionless trial, and **Guided** are explicit eval/teaching sessions. One client resolver decides desk vs eval chrome. Dense architect chrome must not require `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`. Do not invent a thirteenth flag.

## Why

Casual tools ship an evaluator skin that changes recovery, home, and error copy. Excel does not. ArchLucid’s livelihood failure is an **eval-first spine**: Working mode and `resolveArchitectWorkspaceChrome()` overlay density on some surfaces while governance hubs, alerts, findings queue, and audit still branch on buyer-polish alone. A daily user should not occupy that matrix. The modes doc still contradicts the Working-is-default contract (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R13; ADR 0052).

## Context

- `archlucid-ui/src/lib/demo-ui-env.ts` — keep terminal `return false`
- `archlucid-ui/src/lib/architect-workspace-chrome.ts` / `useArchitectWorkspaceChrome.ts`
- `archlucid-ui/src/lib/workspace-mode/workspace-mode.ts` — already defaults to **working**
- Grep `isBuyerPolishedOperatorShellEnv(` under `archlucid-ui/src` (governance hubs, alerts, findings queue, audit)
- `docs/library/OPERATOR_UI_EXPERIENCE_MODES.md` — “Buyer-default shell … default for all authenticated production deploys”
- `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`

## What to build

1. Introduce **one client resolver** used from operator surfaces: `resolveProductionDeskChrome({ workspaceMode, demo, trial })` (name as you like). Production Working + live tenant → desk chrome. Guided / demo / trial → eval chrome.
2. Audit every `isBuyerPolishedOperatorShellEnv()` / `isOperatorExperienceFullShellEnv()` call site. Classify:
   - **Eval chrome** (sample CTAs, wizard collapse, teaching heroes) → follow the resolver.
   - **Vocabulary** → leave **TB-645** on *all* customer surfaces. Density ≠ jargon.
   - **Engineer widgets** (COGS, LLM budget, RAG health) → capability + admin rank only, never “Working makes them appear.”
3. `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator` remains **internal engineer chrome** only. Pilots must not need it.
4. Rewrite `OPERATOR_UI_EXPERIENCE_MODES.md` so production default is Working desk. Keep a short TB-643 history note so agents do not resurrect buyer-polish-as-identity.
5. Vitest: Working + env-unset → desk; Guided/demo/trial → eval; engineer flag still isolated.

## Acceptance criteria

- A Working user on a production (env-unset) build does not take eval/sample/first-run branches that still key off buyer-polish alone.
- Guided / demo / trial do not grow COGS/LLM pills for roles that cannot act on them.
- Modes doc no longer tells deployers that buyer-oriented chrome is the production identity.
- No new env var. No auto-switch of stored Guided users to Working. No TB-645 regression.

## Constraints

- Do not collapse review workspace tabs.
- Do not change API authorization.
- Do not implement GTM **M-90**.
- Do not revert `isBuyerPolishedOperatorShellEnv()` to `return true`.

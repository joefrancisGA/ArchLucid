# PT-01 — Buyer-polished is eval-only, not the production identity

## Goal

`isBuyerPolishedOperatorShellEnv()` is true only for **demo, static-showcase, frictionless trial, and Guided** sessions. Authenticated **Working** seats on a production build are not buyer-polished. Dense architect chrome comes from workspace mode, not from `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`.

## Why

`archlucid-ui/src/lib/demo-ui-env.ts` ends `isBuyerPolishedOperatorShellEnv()` with **`return true`**. `docs/library/OPERATOR_UI_EXPERIENCE_MODES.md` and `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md` still make buyer-polished the production default (TB-643). A later helper (`resolveArchitectWorkspaceChrome`) overlays Working chrome on a few call sites, but dozens of surfaces still key off the always-true flag — including review-detail error recovery (PT-02). A livelihood user cannot turn the instrument on without a redeploy, and many paths never ask about Working mode.

## Context

- `archlucid-ui/src/lib/demo-ui-env.ts` — `isBuyerPolishedOperatorShellEnv`, `isOperatorExperienceFullShellEnv`
- `archlucid-ui/src/lib/architect-workspace-chrome.ts` / `archlucid-ui/src/hooks/useArchitectWorkspaceChrome.ts`
- `docs/library/OPERATOR_UI_EXPERIENCE_MODES.md`
- Grep `isBuyerPolishedOperatorShellEnv()` under `archlucid-ui/src` (dozens of call sites: run detail header, progress tracker, home gate, error.tsx)
- Workspace mode: `archlucid-ui/src/lib/workspace-mode/workspace-mode.ts` (already defaults to **working** — do not revert)

## What to build

1. Change `isBuyerPolishedOperatorShellEnv()` so the terminal default is **`false`**. Keep **true** for:
   - `isNextPublicDemoMode()`
   - `NEXT_PUBLIC_DEMO_STATIC_OPERATOR`
   - frictionless trial session
   - (optional, if you can do it without turning this into a hook) Guided mode via an explicit argument — prefer a new `resolveBuyerPolishedOperatorShell({ workspaceMode })` used from client components, and keep the env function demo/trial-only.
2. Audit every `isBuyerPolishedOperatorShellEnv()` call site. Classify each as:
   - **Eval chrome** (sample CTAs, wizard collapse, hidden shortcut chips) — follow the new function / Working overlay.
   - **Vocabulary** (package / finding / sealed review record) — **leave TB-645 copy in place** for all customer surfaces. Chrome density ≠ jargon.
3. Production Working seats use `useArchitectWorkspaceChrome()` (already true when Working and not demo/trial) for shortcut chips, denser nav titles, identifiers behind existing disclosures. Do not require `NEXT_PUBLIC_OPERATOR_EXPERIENCE`.
4. Guided, demo, and trial stay buyer-polished.
5. Update `OPERATOR_UI_EXPERIENCE_MODES.md` and the first-pilot runbook sentence that forbids `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator` on pilots — that flag is engineer chrome only; Working seats no longer need it.
6. Vitest: Working + non-demo → buyer-polish false; Guided/demo/trial → true; env flag still enables engineer widgets only.

## Acceptance criteria

- A Working-mode user on a production (env-unset) build is **not** buyer-polished.
- Guided / demo / trial sessions do not grow engineering chrome (COGS/LLM budget pills stay capability-gated).
- No customer-visible “run / job / manifest” relabel regression (TB-645).
- `isBuyerPolishedOperatorShellEnv()` no longer has a bare `return true`.

## Constraints

- Do not silently enable COGS/LLM budget pills for roles that cannot act on them.
- Do not collapse review workspace tabs.
- Do not change API authorization.
- Do not auto-switch stored Guided users to Working.

# PT-02 — Working seats get architect-workspace chrome without a rebuild

## Goal

Professionals in **Working** mode get dense architect-workspace chrome (shortcut chips, nav metadata, identifiers behind disclosure) on production builds. Buyer-polished chrome stays for Guided, demo, trial, and CTO-tour sessions. Do not require `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator` for a paying seat.

## Why

`docs/library/OPERATOR_UI_EXPERIENCE_MODES.md` and the first-pilot runbook make **buyer-polished the production default**. `isBuyerPolishedOperatorShellEnv()` in `archlucid-ui/src/lib/demo-ui-env.ts` currently falls through to **`return true`** for every authenticated deploy. Full density is a **build-time** flag (`isOperatorExperienceFullShellEnv`) aimed at local engineers. A livelihood user cannot turn on their instrument without a redeploy.

## Context

- `archlucid-ui/src/lib/demo-ui-env.ts` — `isBuyerPolishedOperatorShellEnv`, `isOperatorExperienceFullShellEnv`
- `docs/library/OPERATOR_UI_EXPERIENCE_MODES.md` (TB-643)
- `archlucid-ui/src/components/shell/OperatorShellTopBar.tsx` — `showDevOperatorChrome`
- `archlucid-ui/src/components/HomeFirstRunWorkflowGate.tsx` — curated shortcuts rail when not full shell
- `archlucid-ui/src/components/usability/FirstVisitHelpAutoOpen.tsx`
- Buyer vocabulary pass **TB-645** must stay: never revert labels to raw run/manifest jargon on customer surfaces

## What to build

1. Introduce a single helper, e.g. `useArchitectWorkspaceChrome()`, true when:
   - workspace mode is Working, **and**
   - not demo/static-operator/CTO-tour/frictionless-trial.
2. Use that helper (not only the build-time env) to show: shortcut chips, denser nav titles, technical identifiers behind existing disclosures, AI-budget/admin widgets **only** when the user already has the matching capability.
3. Keep **buyer vocabulary** on all customer surfaces (package, finding, sealed review record). Chrome density ≠ jargon.
4. Guided mode and all demo flags keep today’s buyer-polished chrome.
5. Document the split in `OPERATOR_UI_EXPERIENCE_MODES.md`: production Working seats get architect chrome; the env flag remains for engineers who need it before sign-in.
6. Vitest: Working + non-demo → chrome on; Guided → chrome off; `NEXT_PUBLIC_DEMO_MODE` still forces buyer chrome.

## Acceptance criteria

- A Working-mode user on a production (buyer-default) build sees shortcut discoverability and dense shell chrome without setting `NEXT_PUBLIC_OPERATOR_EXPERIENCE`.
- Guided, demo, and trial sessions do not grow engineering chrome.
- No customer-visible “run / job / manifest” relabel regression (TB-645).
- Pilot env template can stay unset; behavior is user-mode, not deploy-mode.

## Constraints

- Do not silently enable COGS/LLM budget pills for roles that cannot act on them.
- Do not collapse review workspace tabs.
- Do not change API authorization.

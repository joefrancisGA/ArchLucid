# WS-05 — Working cannot resolve as eval chrome

Do not make Guided production-dense. Do not auto-switch stored Guided users to Working.

## Goal

`resolveProductionEvalChrome({ workspaceMode: "working" })` is **false** on production builds even if a buyer-polish cookie or `NEXT_PUBLIC_OPERATOR_EXPERIENCE` is unset/misleading. Demo / static / frictionless trial still eval. Working + those flags stays eval (those are not paying daily seats).

## Why

`resolveProductionEvalChrome` is already `!resolveProductionDeskChrome`. The leftover is call sites that skip the resolver and use `isBuyerPolishedOperatorShellEnv()` (demo-only) or treat unset experience as buyer. Cookie `buyer-polished` on a Working seat must not win.

## Context

- `archlucid-ui/src/lib/production-desk-chrome.ts`
- `archlucid-ui/src/lib/architect-workspace-chrome.ts`
- `archlucid-ui/src/lib/demo-ui-env.ts` (`isOperatorExperienceFullShellEnv` cookie override)
- `archlucid-ui/src/hooks/useProductionDeskChrome.ts`

## What to build

1. Add `resolveWorkingForbidsBuyerPolish` (or equivalent) so Working + non-demo + non-trial **cannot** be buyer-polished.
2. Dev cookie `buyer-polished` may still preview eval **only** when workspace mode is Guided, or behind an explicit “preview Guided chrome” that does not persist as Working identity.
3. Vitest matrix: Working production → eval false; Guided → eval true; Working+demo → eval true.

## Acceptance criteria

- Working production seat is never buyer-polished.
- Guided still eval.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0067, 0068, 0069, 0070, 0072, 0074, or 0077 bodies — Related pointers only. This wave **adds ADR 0080** and **Accepts 0078 / 0079**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run SY-01–100, AO-01–50, CA-01–50, FC-01–80, PC-01–13, DR-01–16, DX, or PT overlay waves except as a named leftover. Implement only *What to build*.
- **Do not** ship `/al-ui-rate` buyer-walkthrough remediations onto Working production modules (WS-07). Guided / demo / trial remain eval seats.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.


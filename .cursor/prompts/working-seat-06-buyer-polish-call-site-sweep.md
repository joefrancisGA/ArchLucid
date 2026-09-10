# WS-06 — Sweep buyer-polish call sites that ignore workspace mode

Do not restyle Guided. Prefer architecture/review/desk paths from the WS-04 inventory. Admin settings may stay grandfathered.

## Goal

Replace `isBuyerPolishedOperatorShellEnv()` used as **eval chrome** on Working operator routes with `useProductionEvalChrome` / `resolveProductionEvalChrome`. Keep the env helper for demo/trial detection only.

## Why

Finding inspect, sponsor ROI, architectures/new subtitle, review-detail deferred model still call the env function directly (`production-desk-chrome-eval-inventory.ts`).

## Context

- WS-04 inventory
- `PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS`
- Finding inspect and review-detail paths listed there

## What to build

1. Migrate **priority** architecture/review/desk/findings/sponsor paths off the env function for chrome decisions.
2. Shrink grandfather list for those paths only.
3. TB-645 vocabulary is not eval chrome — do not “fix” package/finding copy into jargon.

## Acceptance criteria

- Priority paths use the production-desk resolver.
- Eval-guard still green; grandfather did not grow.

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


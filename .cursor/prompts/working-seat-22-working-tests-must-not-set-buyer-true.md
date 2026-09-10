# WS-22 — Working Vitest fixtures must not set buyer-polished true

Guided/buyer-polished test files may still mock true. Do not delete those tests.

## Goal

Default Working unit tests under architecture/reviews/desk must mock `isBuyerPolishedOperatorShellEnv` **false** and `useProductionEvalChrome` **false**. A dedicated `*.buyer-polished.test.tsx` is the only place Working routes are tested with eval chrome, and those tests must name Guided/demo.

## Why

Many review-detail tests mock both env and eval chrome **true**, so regressions look like the product.

## Context

- Grep `isBuyerPolishedOperatorShellEnv: () => true` under `architecture/`
- `buyer-polished-shell-vitest-override.ts`

## What to build

1. Flip default review-detail/desk tests to Working (eval false) unless the filename says buyer-polished/guided.
2. Optional ratchet: files without `.buyer-polished.` / `.guided.` must not mock buyer true.
3. Keep at least one Guided fixture per hub so teaching does not rot.

## Acceptance criteria

- Working tests exercise the instrument skin.
- Guided coverage remains in named files.

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


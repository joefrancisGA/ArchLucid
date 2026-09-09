# WS-21 — Working keeps shortcut chips and dense identifiers

Do not show COGS/LLM budget pills to roles that cannot act. Do not require NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator.

## Goal

Working architect chrome (`useArchitectWorkspaceChrome`) keeps shortcut chips, denser nav titles, and identifiers behind existing disclosures. Buyer-polish must not hide them on Working.

## Why

PT-01 already said dense chrome comes from workspace mode. Buyer-polish still gates Jump controls and shortcut chips in several shells.

## Context

- `useArchitectWorkspaceChrome.ts`
- `AppShellClient` shortcut boundary
- Sidebar buyer-demo collapse

## What to build

1. Working + production: shortcut overlay and chips visible (help still documents them).
2. `sidebar-nav-buyer-demo-collapse` does not collapse Working.
3. Vitest: Working chrome true ⇒ collapse helper false.

## Acceptance criteria

- Working keyboard help matches visible chips.
- Demo build still collapses.

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


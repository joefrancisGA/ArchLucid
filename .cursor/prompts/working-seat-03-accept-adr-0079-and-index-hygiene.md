# WS-03 — Accept ADR 0079 and fix ADR index hygiene

Do not rewrite ADR 0077. Do not re-run SY nested routes.

## Goal

Mark **ADR 0079** **Accepted** with evidence to SY-80 / `system-desk-acceptance-guard.test.ts`. Align README Proposed rows that are already Accepted in the ADR files (**0069**, **0070**, **0059** if WS-01 did not finish the table).

## Why

SY-100 shipped nested Ask/Compare/Graph and Alt+R off the inbox. ADR 0079 still Proposed. Reviewers cannot refuse a new Working peer Insights page as the daily tool.

## Context

- `docs/architecture/adrs/0079-working-desk-is-the-work-surface.md`
- `docs/architecture/SYSTEM_DESK_ACCEPTANCE_2026-09-07.md`
- `archlucid-ui/src/lib/system-desk-acceptance-guard.test.ts`
- `docs/architecture/adrs/README.md`

## What to build

1. Accept 0079; cite SY-80 / SY-100 close audit.
2. README last-reviewed date and status column match files.
3. Do not add new nested routes here.

## Acceptance criteria

- 0079 Accepted.
- README does not list Accepted ADRs as Proposed.

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


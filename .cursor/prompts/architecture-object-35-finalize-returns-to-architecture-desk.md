# AO-35 — Finalize success returns to the architecture desk

**Do not fork LK-09 / ADR 0073 trail gate.** Navigation after success only.

## Goal

Working finalize success: navigate to `architectureIdentityPath` with the sealed child highlighted (or stay nested with desk header — pick desk as canonical). Do not land on a dead-end receipt-only page that has no parent link.

Trail gate still blocks incomplete trail. Infeasible receipt is still a complete package (LK-13) — return to desk with that job as a child row.

## Why

Success pages that are only packets re-center the run. The architect’s next action is usually the same system.

## Context

- finalize success navigation
- ADR 0073
- LK-13 infeasible as package

## What to build

1. Success router target = desk (+ query highlight).
2. Vitest on success href helper.
3. Guided may keep packet-centric success.

## Acceptance criteria

- Do not skip trail completeness.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`). Nested review chrome keeps the full strip.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0068, 0069, 0072, or 0074 bodies — Related pointers only. This wave **supersedes** 0072’s Working locator and 0069’s in-flight-review-first Start clause via **ADR 0077**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run CA-01–50, DA-01–12, PC-01–13, DR-01–16, or LK except as a named leftover.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact**. SQL stays in the single DDL file per database plus a numbered migration if schema changes (this wave should not need new tables).

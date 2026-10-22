# LP-09 — Implement promote / activate / submit co-commit

Do not fork approve/reject TB-956. Do not unseal.

## Goal

`GovernanceWorkflowService` (or the existing stage class) enlists **submit**, **promote**, and **activate** domain transitions on the same `IArchLucidUnitOfWork` connection/transaction as `IAuditService.LogAsync` for the matching Required events — identical shape to approve/reject.

In-memory tests without `SupportsExternalTransaction` keep sequential behavior (document in tests).

## Why

ADR 0083 without wiring leaves the production-change orphan: domain committed, audit failed, HTTP 500.

## Context

- LP-08 ADR 0083
- `GovernanceWorkflowServiceSameTxAuditTests` — extend, do not weaken approve/reject asserts
- TB-955 orphan probe — should not fire for new promote/activate rows after co-commit
- `docs/library/SAME_TX_GOVERNANCE_AUDIT_DESIGN.md`

## What to build

1. UoW enlistment on submit/promote/activate.
2. Rollback when Required audit throws.
3. C# tests mirroring approve/reject co-commit tests.
4. Update design-doc in-scope table.

## Acceptance criteria

- Promote success implies Required audit row in the same SQL transaction.
- Audit failure leaves governance status unpromoted.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0067–0081 bodies except Related pointers. This wave **adds ADR 0082** and **ADR 0083**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037).
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No G-REAL-06.
- **Do not** re-run WS-01–24, SY, FC, DR, DX, PC, LK except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.

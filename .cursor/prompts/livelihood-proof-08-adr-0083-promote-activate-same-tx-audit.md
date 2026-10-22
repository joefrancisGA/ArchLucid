# LP-08 — ADR 0083: Promote / activate / submit same-transaction Required audit

**Prefer before LP-09.** Do **not** rewrite TB-956 approve/reject co-commit. Do not reuse ADR 0081 or 0082 numbers.

## Goal

Author **`docs/architecture/adrs/0083-promote-activate-submit-same-tx-audit.md`** (**Status: Proposed**). Extend [`SAME_TX_GOVERNANCE_AUDIT_DESIGN.md`](../../docs/library/SAME_TX_GOVERNANCE_AUDIT_DESIGN.md):

1. **In scope:** governance **submit**, **promote**, and **activate** domain writes **co-commit** with their Required durable audit events in the same SQL UoW (same pattern as approve/reject).
2. **Out of scope this ADR:** informational audit (TB-001), risk-waiver wave 2 unless already trivial, baseline mutation companions.
3. Failure of Required audit **rolls back** the domain write — no “HTTP 500 after promote succeeded.”

Product wiring is **LP-09**. This prompt is ADR + matrix update + guard that the file exists.

## Why

Approve/reject are the signature. Promote/activate are when production actually changes. Livelihood defense is weaker on the hotter path.

## Context

- `docs/library/SAME_TX_GOVERNANCE_AUDIT_DESIGN.md` “Out of scope”
- `GovernanceWorkflowReviewStage.cs` approve/reject enlistment
- ADR 0075 coordinator audit echo — Related only; do not rewrite
- Next number after 0082 is **0083**

## What to build

1. ADR 0083 with Trade-offs, Constraints, Expected impact (security), Consequences.
2. README index row. Update the same-tx design doc “Out of scope” to point at 0083 without deleting shipped approve/reject text.
3. Guard test: ADR file present.

## Acceptance criteria

- Reviewers can quote 0083 for promote/activate audit atomicity.
- Constraints keep tenant isolation and do not require transactional audit outbox if `AppendAsync` already enlists.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0067–0081 bodies except Related pointers. This wave **adds ADR 0082** and **ADR 0083** (this file).
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037).
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No G-REAL-06.
- **Do not** re-run WS-01–24, SY, FC, DR, DX, PC, LK except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.

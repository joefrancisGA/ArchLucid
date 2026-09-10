# LP-10 — Authority-chain durable audit fail-closed on Working career path

Do not rewrite ADR 0075 body. Name the leftover: `[InformationalAudit]` / catch-and-warn on `AuthorityCommittedChainDurableAudit`.

## Goal

On Working career finalize/commit, **Required** durable audit for the committed authority chain must **fail closed** (existing `LogOrThrowAsync` / ADR 0075 pattern). Best-effort informational companions may remain warn-only.

If the chain persist succeeds and Required audit fails, the user sees a named recovery state — not a silent “sealed” UI.

## Why

A sealed review without a durable chain-audit row is indefensible later. Approve/reject already co-commit; this path is the remaining “stamp without paper.”

## Context

- ADR 0075, DR-07 leftover
- `AUDIT_COVERAGE_MATRIX.md`
- `AuthorityCommittedChainPersisted` / persist-committed-chain paths
- Career-artifact validators — do not claim audit row in PDF unless it exists

## What to build

1. Identify the catch-and-warn call sites on commit/finalize.
2. Working production-like: Required events throw / rollback per existing dual-channel rules; do not drop baseline logs.
3. C# test: audit throw → commit not reported complete to the client.
4. Honesty copy if Guided sample-mode remains fail-open — label sample.

## Acceptance criteria

- Working career commit cannot succeed while Required chain audit failed.
- Informational audit loss stays documented, not silently promoted to Required.

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

# LP-01 — ADR 0082: Decision-grade provenance fail-closed at emission and commit

**Wave:** livelihood-proof (**LP**). **Prefer first.** Do **not** rewrite ADR 0078, 0070, 0073, or the TB-1221 **contract** body. ADR **0081** is sidebar-nav — do not reuse that number.

## Goal

Author **`docs/architecture/adrs/0082-decision-grade-provenance-fail-closed.md`** (**Status: Proposed**). One ADR that **executes** [`DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md`](../../docs/library/DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md) (TB-1221 contract Done; gates follow-on):

1. Decision-grade findings require structural **ProvenanceKind A** (typed: non-empty `RelatedNodeIds` **and** `RulesApplied`) or **B** (agent: per-finding resolvable `EvidenceRefs` / citations).
2. Missing Kind A/B → **hold or reject** — never silently persist as `DecisionGradeFinding`.
3. Checklist / advisory / insight-density-demoted rows stay **exempt**.
4. `FindingCitationCoverageRatio` is a **Working Real PilotStrict** commit signal (LP-04), not Simulator.
5. Prompt text, Critic Low, run-level `AgentResult.EvidenceRefs`, and trust-label strings are **not** ProvenanceKind.

Product wiring is **LP-02–04**. This prompt is ADR + index row + a guard test that the file exists.

## Why

R4’s liability stance requires a cited record. Career-artifact honesty (ADR 0078) can still export decision-grade **labels** while empty `EvidenceRefs` persist. Architects will defend the stamp.

## Context

- ADR template: `docs/architecture/adrs/template.md`
- Next free number after **0081** (`0081-sidebar-nav-rows-label-only.md`) is **0082**
- `docs/library/DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md`
- `FindingFactory`, `FindingsOrchestrator`, `AgentResultParser`, `AgentOutputQualityGate`

## What to build

1. Write ADR 0082 with Context, numbered Decision, Trade-offs, Constraints, Expected impact (include **security**), Consequences.
2. Add row to `docs/architecture/adrs/README.md`. Proposed in this PR is OK.
3. Vitest or C# guard: ADR file exists; status Proposed or Accepted; does not claim semantic faithfulness.
4. Do **not** implement validators in this prompt.

## Acceptance criteria

- PR review can quote 0082 for “may this finding persist as decision-grade?”
- Trade-offs name hold-band noise vs silent overclaim.
- Constraints forbid flipping Simulator default Mode and forbid unsealing.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0067–0081 bodies except adding a Related pointer. This wave **adds ADR 0082** (this file) and **ADR 0083** (LP-08).
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037).
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No G-REAL-06.
- **Do not** re-run WS-01–24, SY, FC, DR, DX, PC, LK except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.

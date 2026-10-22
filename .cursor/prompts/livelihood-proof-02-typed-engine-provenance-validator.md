# LP-02 — Typed-engine provenance validator before persist

Do not fork ADR 0070 demotion. Do not delete typed rows. Checklist stays exempt.

## Goal

Ship `IFindingProvenanceValidator` (or extend `FindingPayloadValidator`) and call it from `FindingsOrchestrator` **before** typed findings persist. Decision-grade typed findings without Kind **A** (`RelatedNodeIds` and `RulesApplied`, or the engine-specific payload trace the contract already names) are **held** (`ChecklistCoverage` / withheld band) or **rejected** — never stored as `DecisionGradeFinding`.

## Why

Typed engines are the product of record (`FINDING_STREAM_PRODUCT_OF_RECORD.md`). Empty graph/rule provenance on a decision-grade row is a career-defense hole even when the density gate promoted the score.

## Context

- LP-01 ADR 0082
- `ArchLucid.Core` / Decisioning `FindingsOrchestrator`, `FindingFactory`, `FindingPayloadValidator`
- TB-1221 contract table “Today vs target”

## What to build

1. Validator: Kind A structural checks only — no LLM.
2. Orchestrator applies validator before persist; demoted/checklist rows skip Kind A.
3. C# tests: missing node ids → not decision-grade; concrete evidence + rules → persist decision-grade.
4. Update the TB-1221 contract **Today** column only if gates actually ship (honesty). Do not claim semantic faithfulness.

## Acceptance criteria

- Golden-corpus typed finding without Kind A cannot persist as decision-grade.
- Package completeness: held rows remain visible as checklist/withheld, not deleted.

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

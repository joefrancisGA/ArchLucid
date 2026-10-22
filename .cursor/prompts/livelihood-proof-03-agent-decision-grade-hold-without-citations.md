# LP-03 — Agent decision-grade hold without per-finding citations

Do not treat run-level `AgentResult.EvidenceRefs` as per-finding Kind B. Do not delete the advisory agent stream.

## Goal

Post-`AgentResultParser`, **before persist** of `ArchitectureFinding` lists: decision-grade agent findings without resolvable per-finding citations / `EvidenceRefs` are **held** (advisory / withheld band) or **rejected**. Never silently persist as `DecisionGradeFinding`.

Checklist, low-confidence, and density-demoted agent rows stay exempt.

## Why

The dual-stream contract already says agent findings are advisory rehearsal unless Real + emission gate + labels. The desk still shows decision-grade chrome on uncited LLM rows. That is the livelihood failure.

## Context

- LP-01 / LP-02
- `AgentResultParser`, `AgentArchitectureFindingEmissionGate`, `AgentOutputQualityGate`
- `MustNotFailEnforcer` / hallucination defense plane — reuse, do not fork a second citation parser

## What to build

1. Kind B check at emission: non-empty per-finding refs that resolve to allowlisted prefixes / evidence package rows.
2. Hold disposition named in UI as advisory/withheld — not “failed review.”
3. C# tests: empty refs → not decision-grade; resolvable `doc:` / `policy-rule:` → may remain decision-grade subject to density gate.
4. Honesty: do not update buyer copy to “all findings are citation-bound.”

## Acceptance criteria

- Agent finding with `EvidenceRefs = []` cannot persist as decision-grade on Working Real or Simulator.
- Sealed typed snapshot remains the finalize product of record.

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

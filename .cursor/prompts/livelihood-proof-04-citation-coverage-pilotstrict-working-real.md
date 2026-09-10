# LP-04 — Wire FindingCitationCoverageRatio into Working Real PilotStrict

Do **not** run this ratio as a commit gate on Simulator. Do not fork quality-gate floors already on Staging/Production.

## Goal

When `AgentExecution:Mode` is **Real** and PilotStrict Enforce/Block is on, `AgentOutputSemanticScore.FindingCitationCoverageRatio` below the existing option threshold **blocks** Working career commit / export the same way other PilotStrict floors do. Simulator keeps `SkipWhenSimulator` on the expensive judge; do not fake a ratio.

`FindingCitationCoverageRatio` today is **inert in production** per the TB-1221 contract.

## Why

Structural Kind B (LP-03) is necessary and not sufficient. Working Real still needs the named coverage ratio as a commit signal so “Real-mode verified” cannot mean uncited decision-grade.

## Context

- `AgentOutputQualityGate.cs`, `AgentOutputQualityGateOptions.cs`
- `FAITHFULNESS_SUPPORT_RATIO_SCORING_LANE_POSITIONING_CONTRACT.md` — semantic lane stays separate; this prompt only **wires the existing field**
- ADR 0078 execution-mode rules — call shared validators; do not rewrite 0078

## What to build

1. Quality gate: Real + PilotStrict → compare ratio to existing min; Block/Enforce per options.
2. Simulator: leave inert or skip — never invent coverage from canned findings.
3. C# tests: Real below floor → 409 / quality-rejected path already used; Simulator below floor → not this block.
4. Update TB-1221 “inert” sentence only after the gate is live.

## Acceptance criteria

- Working Real PilotStrict cannot career-export while citation coverage is below the configured floor.
- Simulator rehearsal is unchanged as default Mode.

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

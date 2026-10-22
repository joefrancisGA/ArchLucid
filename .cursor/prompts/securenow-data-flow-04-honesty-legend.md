# SN-DF-04 — Data Flow honesty legend

**Wave:** SecureNow data flow (**SN-DF**). **Depends on:** SN-DF-03. **Do not** implement SN-DF-05–08.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Data Flow (and Data Architecture once it exists) must show an operator-visible honesty line so a CISO does not read ADF arrows as **observed traffic**.

Locked copy (sentence case):

> Declared pipeline wiring, not observed traffic. External systems appear when a linked service names them, even if they are not in the subscription.

## Why

SecureNow architect hold: capability ≠ observed flow. ADF `adfWritesTo` is DerivedFact. Hostname match is DeterministicInference. Stamping “data flowed” would make the diagram a dangerous narrator.

## Context

- `docs/library/SECURENOW_ARCHITECT_HOLD.md`
- `docs/securenow/DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md` §2
- `ArchLucid.ArtifactSynthesis` legend / caption seams (IDA-09 SVG legend if present — reuse, do not add Microsoft icons)
- `DiagramViewPlanValidator.DefaultHonestyLabel` (Ask) — do not weaken Ask honesty

## What to build

1. Compile options or diagram AST metadata for Data Flow includes the locked honesty sentence (constant in its own file).
2. Forest/Mermaid export for Data Flow shows that sentence once (caption or legend item) — not on every edge.
3. Edge labels stay **Reads from** / **Writes to** / **Connected to** / **Likely connected to**. Do **not** add “TLS 1.3” or “Confidential”.
4. Tests: Data Flow AST/mermaid contains the honesty sentence; Network mermaid does **not**.
5. Do not change IE-DD Failed copy.

## Acceptance criteria

- Data Flow render includes the locked sentence.
- No ObservedFact upgrade for ADF or external nodes.
- No classification/protocol badges.

## Constraints

- Working-tree safety. TB-645 sentence case.
- Visible-boundary buttons if any UI control is added (prefer no new button — caption only).
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests|FullyQualifiedName~DiagramEdgeLabelHumanizer'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s if >15s.

## Done when

- A reviewer can see the honesty sentence on Data Flow without opening source.
- Network/Executive captions unchanged.

# FC-03 — Shared CareerArtifactCompletenessValidator (C#)

**Depends on FC-01.** **Do not fork** `AuthorityCommitTransparencyTrailCompletenessGate` — wrap or extend in one validator used by finalize and export services.

## Goal

Add **`ArchLucid.Decisioning/CareerArtifacts/CareerArtifactCompletenessValidator.cs`** (+ interface + tests) that enforces ADR 0078 server-side:

- Trail completeness (reuse 0073 gate logic — do not duplicate divergent rules)
- Skipped MUST block when configured (AuthorityCommitSkippedMustGate alignment)
- Measurement floor: `enginesSucceeded` null → not career-complete
- Quality gate / PilotStrict / execution-mode blocks for **external** export endpoints

Return structured `CareerArtifactBlockReason` list suitable for ProblemDetails and export DTOs.

## Why

Client-side honesty is insufficient — curl/CLI must not produce an official-looking PDF when the UI would block.

## Context

- Finalize orchestrator, `PilotsController` PDF endpoints, export services under `ArchLucid.Application`
- `InsightDensityMeasurementFloorPresenter`, `AuthorityCommitTransparencyTrailCompletenessGate`
- FC-02 TS module should mirror the same rules (document parity in ADR 0078 Expected impact)

## What to build

1. Validator class (one class per file). Check nulls. Prefer LINQ.
2. Wire into finalize path and **one** export endpoint in this PR; leave follow-ups to FC-45/FC-58.
3. Application or Decisioning tests — no `ConfigureAwait(false)` in tests.
4. Scoped `agent-compile-check.ps1` on touched projects.

## Acceptance criteria

- API returns 409/422 with named block reasons when trail incomplete — not a generic error.
- Parity test: same fixture blocked in TS `evaluateCareerArtifactHonesty` and C# validator.

## Constraints

- Do not change insight density demotion predicate.
- SQL only via existing patterns — no new DDL unless ADR explicitly requires audit row (it should not).

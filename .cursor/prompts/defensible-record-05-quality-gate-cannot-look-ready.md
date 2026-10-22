# DR-05 — WarnOnly quality gate cannot screenshot as Ready on Working real-mode

**Do not rewrite** structural/semantic floors. **Do not fork DR-04.** Staging/Production already use `Mode: PilotStrict` with Enforce/Block — do not regress those files.

## Goal

Minimal/base `appsettings.json` still lands **WarnOnly** (`Enabled: true`, `EnforceOnReject: false`, `BlockRunOnReject: false` per `AGENT_OUTPUT_EVALUATION.md`). Working **real-mode** finalize and career export must show the active quality-gate **mode** on the stamp and **must not** use Ready / Decision-grade sponsor wording when mode is WarnOnly or when disposition is `Warned`.

If the host is real-mode + Working + WarnOnly: block career export (same confirmation pattern as DR-01) until an operator with AdminAuthority switches the host to PilotStrict **or** the run is labeled sample.

Simulator-only runs stay labeled simulator (existing honesty).

## Why

Speculative LLM output can reach ReadyForCommit when WarnOnly. That is the career-ending false yes R4 forbids unless the trail and gates earn the liability stance.

## Context

- `AgentOutputQualityGateOptions.cs` defaults
- `RealCommitAgentOutputQualityGateEvaluator.cs`
- `docs/library/AGENT_OUTPUT_EVALUATION.md`
- `DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md` (`FindingClaimCoverageRatio` still inert except PilotStrict)

## What to build

1. Stamp / finalize strip: `Quality gate: WarnOnly | PilotStrict` from the run’s recorded gate version (existing quality-gate definition versioning).
2. Working real-mode + WarnOnly or `Warned`: no Ready chip; career export blocked with reason.
3. Optional (if small): surface `FindingClaimCoverageRatio` as honesty only — do not invent a new reject floor in this prompt.
4. Tests: WarnOnly real-mode Working fixture cannot career-export; PilotStrict + pass can.

## Acceptance criteria

- Sponsor-facing Ready is impossible on Working real-mode WarnOnly.
- Staging/Production PilotStrict JSON is not loosened.

## Constraints

- Public claim boundary. No fake transcripts. Scoped compile.

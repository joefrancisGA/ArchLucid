# Three-state evaluation contract

Every analytical engine has three semantically distinct outcomes:

1. **FINDING** — the engine evaluated its supported input and emitted one or more findings.
2. **NO FINDING** — the engine evaluated its supported input successfully and emitted none.
3. **EVALUATION FAILED** — the engine did not successfully complete evaluation.

ArchLucid already carries the third state through `FindingsSnapshot.EngineFailures` and `FindingsSnapshot.GenerationStatus`. This document makes that behavior an explicit product contract.

## Never collapse to NO FINDING

The following are not NO FINDING:

- exception;
- timeout/cancellation not attributable to caller cancellation;
- unsupported schema/input version;
- missing dependency required by that engine;
- malformed evidence;
- missing required inventory slice;
- unavailable external evaluator;
- failed parser when that parser is required for the engine's claim.

When an engine intentionally does not apply to an input, that is **not applicable/skipped**, not failure. If skip state materially affects coverage, expose it in coverage metadata rather than silently treating it as a successful negative.

## Snapshot rules

- `EngineFailures.Count > 0` means `GenerationStatus` cannot be `Complete`.
- Commit policy may distinguish blocking vs advisory failure, but the failure remains visible.
- A user-facing "0 findings" count must not imply all engines evaluated successfully when failures exist.
- Downstream exports and sponsor surfaces must preserve degraded-coverage warnings.

## Existing enforcement

`FindingsOrchestratorTests`, `FindingsStageTests`, commit classifiers, run explainability, persistence metadata tests, and the cross-engine `CredibilityTripwireTests` enforce the failure-visible contract.

> **Scope:** Phase 3 PR A2 — human-readable summary of cohort parity evidence (coordinator vs authority commit path). Linked from [`COORDINATOR_TO_AUTHORITY_PARITY.md`](../../runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md) and [`CHANGELOG.md`](../../CHANGELOG.md).

# PR A2 cohort parity evidence

This file lives under **`docs/evidence/phase3/`** (not `docs/artifacts/…`) because the repo `.gitignore` pattern **`artifacts/`** matches any directory named `artifacts`, which would untrack CI-local evidence if we nested markdown there.

## Where the mechanical proof lives

- **Tests:** `ArchitectureRunCommitPathParityIntegrationTests` in `ArchLucid.Api.Tests` (identical **traceability-bundle.zip** entry names; stable **`PilotRunDeltasResponse`** fields: findings-by-severity histogram, audit row count + truncation flag, LLM call count, demo flag, top severity string).
- **Composition:** `ServiceCollectionExtensionsCompositionResolveTests` resolves `IArchitectureRunCommitOrchestrator` → `RunCommitPathSelector` as appropriate for the host.

## Intentionally out of scope for bit-identical asserts

Clocks, seconds-to-commit, `topFindingId`, and evidence-chain pointers may differ between paths; do not use them as parity keys.

## Maintenance

Update this summary when the parity test matrix or stable-field contract changes so reviewers and the parity runbook stay aligned.

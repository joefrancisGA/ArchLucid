> Archived 2026-04-23 — superseded by [docs/START_HERE.md](../START_HERE.md). Kept for audit trail.

> **Scope:** Phase 3 PR A2 — human-readable summary of cohort parity evidence (coordinator vs authority commit path). Linked from [`COORDINATOR_TO_AUTHORITY_PARITY.md`](../../runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md) and [`CHANGELOG.md`](../../CHANGELOG.md).

# PR A2 cohort parity evidence

This file is the **checked-in narrative** companion to integration tests that prove the `Coordinator:LegacyRunCommitPath` **true** vs **false** factories produce aligned outcomes for the golden-cohort simulator create → execute → commit path.

## Where the mechanical proof lives

- **Tests:** `ArchitectureRunCommitPathParityIntegrationTests` in `ArchLucid.Api.Tests` (identical **traceability-bundle.zip** entry names; stable **`PilotRunDeltasResponse`** fields: findings-by-severity histogram, audit row count + truncation flag, LLM call count, demo flag, top severity string).
- **Composition:** `ServiceCollectionExtensionsCompositionResolveTests` resolves `IArchitectureRunCommitOrchestrator` → `RunCommitPathSelector` as appropriate for the host.

## Intentionally out of scope for bit-identical asserts

Clocks, seconds-to-commit, `topFindingId`, and evidence-chain pointers may differ between paths; do not use them as parity keys.

## Maintenance

Update this summary when the parity test matrix or stable-field contract changes so reviewers and the parity runbook stay aligned.

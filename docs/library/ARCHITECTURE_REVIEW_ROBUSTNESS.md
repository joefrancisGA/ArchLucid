> **Scope:** Contributor-reference — robustness controls for architecture creation and review (branch `robust`).

# Architecture create/review robustness

This document maps the ten robustness suggestions for **Create architecture** (synthesis kernel \(\mathcal{A}\)) and **Review** (evaluation kernel \(\mathcal{R}\)) to shipped code paths. See also [`../architecture/architecture_handbook/75-architecture-and-review-engines.md`](../architecture/architecture_handbook/75-architecture-and-review-engines.md).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1 | Separate synthesis kernel from review execute | `IArchitectureSynthesisKernel` / `ArchitectureSynthesisKernel` — no authority Seq or four-agent commit gate |
| 2 | Architecture version lattice | `dbo.ArchitectureVersions`, `IArchitectureVersionService`, `RunRecord.ArchitectureVersionId` (migration **339**) |
| 3 | Fail-closed decision-grade provenance at commit | `DecisionGradeFindingProvenanceValidator` + `CommitOutputIntegrityService` |
| 4 | Deterministic finding merge | `FindingSnapshotConfluentMerger` (ADR 0063 fingerprint join) in `FindingsOrchestrator` |
| 5 | Partial engine failure is incomplete, not silent success | `FindingsSnapshotGenerationStatus`, `FindingEngineFailureCommitClassifier`, decisioning stage block |
| 6 | Block mixed finish paths | `RunKernelCompleteness`, `ThrowIfAuthorityPipelineCompleteAsync`, `IncompleteAuthorityPipelineExecuteHandler` |
| 7 | Harden intake | TB-2343 sentinel blocking (`ArchitectureDraftStructuredBrief.HasUnconfirmedStructuredBriefPlaceholders`), server `PolicyPackCloudTargetMismatchEvaluator` |
| 8 | Validate before overlay | `AgentTopologyProposalMergeGate` before `AgentTopologyProposalGraphMerge` |
| 9 | Idempotent create + body fingerprint | `ArchitectureRunIdempotencyHashing.FingerprintRequest`, `ArchitectureRunCreateIdempotencyHelper` |
| 10 | Honest engine contracts | `IEffectfulFindingEngine`, `BuiltInFindingEngineTypeCatalog` synced to plugin skip set |

## Verification

Architecture guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessArchitectureTests.cs`.

Unit tests:

- `ArchitectureVersionServiceTests`
- `ArchitectureDraftReviewReadinessValidatorTests` (TB-2343)
- `PolicyPackCloudTargetMismatchEvaluatorTests`
- `DecisionGradeFindingProvenanceValidatorTests`
- `BuiltInFindingEngineTypeCatalogTests`

## Security / reliability / cost

- **Security:** Provenance and overlay gates reduce ungrounded or unvalidated agent text entering sealed packages.
- **Reliability:** Version pinning and idempotent create prevent ambiguous re-review and duplicate run rows.
- **Cost:** Partial-engine blocking avoids billing a “complete” review when required engines failed silently.

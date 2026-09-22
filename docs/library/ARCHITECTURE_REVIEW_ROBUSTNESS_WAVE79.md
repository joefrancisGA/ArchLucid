> **Scope:** Contributor-reference — wave-79 robustness controls for architecture create and review (branch `cursor/wave79-robustness-e14f`).

# Architecture create/review robustness — wave 79

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE78.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE78.md) (921–932 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 933 | Infra-evidence diff changes GET OpenAPI **409** | `InfraEvidenceDiffsController.cs` — `ListChangesForDiff`; `InfraEvidenceDiffsController.SealedManifestGuard.cs` — `MapDiffSealedManifestConflict` |
| 934 | Inventory drift report GET OpenAPI **409** | `InfraEvidenceInventoryController.cs` — `GetDriftReport`; `InfraEvidenceInventoryController.SealedManifestGuard.cs` — `MapInventorySealedManifestConflict` |
| 935 | Inventory diff narrative POST OpenAPI **409** | `InfraEvidenceInventoryController.cs` — `BuildNarrative`; `InfraEvidenceInventoryController.SealedManifestGuard.cs` |
| 936 | Advisory run-scoped reads OpenAPI **409** | `AdvisoryController.cs`; `AdvisoryController.SealedManifestGuard.cs` — `EnsureSealedManifestReadAllowedAsync` |
| 937 | Authority reads golden-manifest OpenAPI **409** | `AuthorityReadsController.cs`; `AuthorityReadsController.SealedManifestGuard.cs` — `EnsureGoldenManifestSealedReadAllowed` |
| 938 | Authority query trail reads OpenAPI **409** | `AuthorityQueryController.Trail.cs`; `AuthorityQueryController.SealedManifestGuard.cs` — `EnsureGoldenManifestSealedReadAllowed` |
| 939 | Authority query run detail reads OpenAPI **409** | `AuthorityQueryController.RunDetail.cs`; `AuthorityQueryController.SealedManifestGuard.cs` — `EnsureGoldenManifestSealedReadAllowed`, `EnsureRunSealedManifestReadAllowedAsync` |
| 940 | Explanation run reads OpenAPI **409** | `ExplanationController.RunExplain.cs`; `ExplanationController.SealedManifestGuard.cs` — `EnsureGoldenManifestSealedReadAllowed` |
| 941 | Explanation finding + holistic critic OpenAPI **409** | `ExplanationController.FindingExplain.cs`, `ExplanationController.CompareHolistic.cs`; `ExplanationController.SealedManifestGuard.cs` |
| 942 | Drift workbench load `blockedReason` | `infra-evidence-drift-mutation-blocked-reason.ts`, `infra-evidence-drift-api.ts` — `formatInfraEvidenceApiError` |
| 943 | Diagrams workbench load `blockedReason` | `infra-evidence-diagrams-mutation-blocked-reason.ts`, `infra-evidence-diagrams-api.ts`, `DiagramsWorkbenchClient.tsx` |
| 944 | Resource hub + explorer hub/remediation `blockedReason` | `infra-evidence-hub-api.ts` — `infraEvidenceHubBlockedReason`; `infra-evidence-remediation-api.ts` — `remediationInstanceMutationBlockedReason`; `ResourcesExplorerClient.tsx`, `ResourceHubClient.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave79ArchitectureTests.cs`.

**Hasher baseline note:** wave 79 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE80.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE80.md) (945–956).

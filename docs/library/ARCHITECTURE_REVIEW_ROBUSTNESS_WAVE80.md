> **Scope:** Contributor-reference — wave-80 robustness controls for architecture create and review (branch `cursor/wave80-robustness-e14f`).

# Architecture create/review robustness — wave 80

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE79.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE79.md) (933–944 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 945 | Internal trace forensics GET OpenAPI **409** | `InternalArchitectureTraceForensicsController.cs`; `InternalArchitectureTraceForensicsController.SealedManifestGuard.cs` — `EnsureSealedManifestReadAllowedAsync` |
| 946 | Run summary SSE OpenAPI **409** | `AuthorityRunEventsController.cs`; `AuthorityRunEventsController.SealedManifestGuard.cs` — `EnsureGoldenManifestSealedReadAllowed` |
| 947 | Run coverage GET/ack OpenAPI **409** | `RunCoverageController.cs`, `RunCoverageController.Acknowledgement.cs`; `RunCoverageController.SealedManifestGuard.cs` |
| 948 | Agent evaluation GET OpenAPI **409** | `RunAgentEvaluationController.cs`; `RunAgentEvaluationController.SealedManifestGuard.cs` — `EnsureSealedManifestReadAllowedAsync` |
| 949 | Manifest summary GET OpenAPI **409** | `AuthorityQueryController.Trail.cs` — `GetManifestSummary`; `AuthorityQueryController.SealedManifestGuard.cs` — `EnsureManifestSummarySealedReadAllowed` |
| 950 | Product run source-context GET OpenAPI **409** | `ArchitectureIntelligenceController.ProductPublish.cs`; `ArchitectureIntelligenceController.SealedManifestGuard.cs` — `EnsureRunSealedManifestReadAllowedAsync` |
| 951 | Provenance graph read guard | `AuthorityRunReadHandlers.cs`; `AuthorityRunReadHandlers.SealedManifestGuard.cs` — `EnsureGoldenManifestSealedReadAllowed` |
| 952 | Mermaid preview/render/export `blockedReason` | `infra-evidence-mermaid-mutation-blocked-reason.ts`, `infra-evidence-mermaid-api.ts` |
| 953 | Infra Ask submit `blockedReason` | `infra-evidence-ask-blocked-reason.ts`, `infra-evidence-ask-api.ts` — `formatInfraEvidenceAskApiError` |
| 954 | Diagram reconcile load/mutate `blockedReason` | `diagram-reconcile-*-blocked-reason.ts`, `infra-evidence-diagram-reconcile-api.ts` |
| 955 | Shared snapshot-list load `blockedReason` | `infra-evidence-snapshots-load-blocked-reason.ts`, `infra-evidence-drift-api.ts` |
| 956 | Manifest summary read `blockedReason` | `manifest-summary-read-blocked-reason.ts`, `ManifestDetailPageErrorViews.tsx`, `enrich-signed-records-list-rows.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave80ArchitectureTests.cs`.

**Hasher baseline note:** wave 80 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE81.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE81.md) (957–968) when opened.

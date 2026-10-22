> **Scope:** Contributor-reference — wave-12 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 12

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE11.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE11.md) (suggestions 101–110).

| # | Control | Primary wiring |
|---|---------|----------------|
| 111 | Decision receipt requires lifecycle `Complete` | `DecisionReceiptService` |
| 112 | Sponsor one-pager PDF requires `Complete` | `SponsorOnePagerPdfBuilder` |
| 113 | Finding evidence-chain + inspect require `Complete` | `RunFindingsQueryService` |
| 114 | Manifest compare requires `Complete` + pin fingerprint match | `CompareRunsApplicationFacade`, `RunComparePinFingerprintGuard` |
| 115 | ZIP / traceability bundles require `Complete` | `RunExportAuthorityMaterialLoader`, `TraceabilityBundleBuilder` |
| 116 | KM identity fallback verifies content hash | `ArchitectureKnowledgeModelAccess.TryLoadViaArchitectureIdentityAsync` |
| 117 | KM-aware graph reuse checks pin fingerprints | `KnowledgeModelAwareGraphSnapshotResolver`, `GraphSnapshotCommittedReuseResolver` |
| 118 | Pre-commit / execute / finalize governance from pins only | `PreCommitGovernanceGate`, `ExecuteTimeGovernanceScopeCaptureService`, `CommittedEffectiveGovernanceSnapshotCapturer`, finalization |
| 119 | Replay commit re-verifies pins | `ReplayRunCommitStage` |
| 120 | Hasher A v7 binds create-time provenance + OpenAPI pin docs | `ManifestHashService` v7, `AuthorityCommitCreateTimePinBinder`, OpenAPI transformer |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave12ArchitectureTests.cs`.

**Hasher baseline note:** suggestion 120 bumps production `h(M)` to **`v7`** (package origin, request id, structural execution mode, pilot AOAI snapshot). Owner re-lock via `tests/manifest-hash/hasher-baseline-v7.json`.

**Successor:** [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE13.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE13.md) (suggestions 121–130; Hasher A **`v8`**).

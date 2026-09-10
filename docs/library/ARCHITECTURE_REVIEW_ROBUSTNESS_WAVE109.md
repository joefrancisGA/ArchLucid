> **Scope:** Contributor-reference — wave-109 robustness controls for architecture create and review (branch `cursor/wave109-robustness-e14f`).

# Architecture create/review robustness — wave 109

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE108.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE108.md) (1281–1292 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1293 | Run coverage acknowledgement PUT runtime **409** mapper | `RunCoverageController.Acknowledgement.cs` — `PutAcknowledgedCoverage` |
| 1294 | Run coverage pack PATCH runtime **409** mapper | same file — `PatchRunCoveragePack` |
| 1295 | Explain comparison GET runtime **409** mapper | `ExplanationController.CompareHolistic.cs` — `ExplainComparison` |
| 1296 | Holistic critic POST runtime **409** mapper | same file — `HolisticCritic` |
| 1297 | Run query provenance artifact GET runtime **409** mapper | `RunQueryController.Provenance.cs` — `MapProductRunQuerySealedManifestConflict` |
| 1298 | Run ROI + stage timeline GET runtime **409** mapper | `RunQueryController.Detail.cs` — `MapProductRunQuerySealedManifestConflict` |
| 1299 | Run findings list GET runtime **409** mapper | `RunQueryController.Findings.cs` — `ListRunFindings` |
| 1300 | Coverage pack PATCH `blockedReason` | `run-coverage-acknowledgement-mutation-blocked-reason.ts`, `run-coverage-api.ts` — `patchRunCoveragePack` |
| 1301 | Run stage timeline GET `blockedReason` | `run-pipeline-timeline-blocked-reason.ts`, `architecture-runs-read-list.ts` — `getRunStageTimeline` |
| 1302 | Run pipeline timeline GET `blockedReason` | same helper — `getRunPipelineTimeline` |
| 1303 | Architecture graph page GET `blockedReason` | `architecture-graph-temporal-snapshot-blocked-reason.ts`, `graph-api.ts` — `getArchitectureGraphPage` |
| 1304 | Coverage acknowledgement GET `blockedReason` | `run-coverage-api.ts` — `getRunCoverageAcknowledgement` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave109ArchitectureTests.cs`.

**Hasher baseline note:** wave 109 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 86 run-query findings export/inspect follow-ups — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE110.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE110.md) (1305–1316) when opened.

> **Scope:** Contributor-reference — wave-106 robustness controls for architecture create and review (branch `cursor/wave106-robustness-e14f`).

# Architecture create/review robustness — wave 106

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE105.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE105.md) (1245–1256 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1257 | Evidence graph GET runtime **409** mapper | `GraphController.ReviewGraph.cs` — `MapGraphSealedManifestConflict` |
| 1258 | Temporal snapshot GET runtime **409** mapper | `GraphController.Snapshot.cs` — `MapGraphSealedManifestConflict` |
| 1259 | Run detail GET runtime **409** mapper | `RunQueryController.Detail.cs` — `MapProductRunQuerySealedManifestConflict` |
| 1260 | Run provenance GET runtime **409** mapper | `RunQueryController.Provenance.cs` — `MapProductRunQuerySealedManifestConflict` |
| 1261 | Explain run GET runtime **409** mapper | `ExplanationController.RunExplain.cs` — `MapExplanationSealedManifestConflict` |
| 1262 | Explain finding GET runtime **409** mapper | `ExplanationController.FindingExplain.cs` — `MapExplanationSealedManifestConflict` |
| 1263 | Run coverage GET runtime **409** mapper | `RunCoverageController.cs` — `MapRunCoverageSealedManifestConflict` |
| 1264 | Advisory recommendation apply POST `blockedReason` | `advisory-recommendation-apply-mutation-blocked-reason.ts`, `advisory-api.ts` — `applyRecommendationAction` |
| 1265 | Clarification answers POST `blockedReason` | `clarification-answers-mutation-blocked-reason.ts`, `knowledge-model-clarification-api.ts` — `applyKnowledgeModelClarificationAnswers` |
| 1266 | Realized value attestation PUT `blockedReason` | `realized-value-attestation-mutation-blocked-reason.ts`, `governance-stickiness-api-exceptions-schedules.ts` — `upsertRealizedValueAttestation` |
| 1267 | Run operator governance disposition POST `blockedReason` | `run-operator-governance-disposition-mutation-blocked-reason.ts`, `architecture-runs-read-list.ts` — `recordRunOperatorGovernanceDisposition` |
| 1268 | Policy pack assignment archive POST `blockedReason` | `policy-pack-archive-mutation-blocked-reason.ts`, `policy-packs-api-assign.ts` — `archivePolicyPackAssignment` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave106ArchitectureTests.cs`.

**Hasher baseline note:** wave 106 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 86/87/90 guard-partial action-level mapper follow-ups — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE107.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE107.md) (1269–1280) when opened.

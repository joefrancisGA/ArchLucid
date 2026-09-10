> **Scope:** Contributor-reference — wave-110 robustness controls for architecture create and review (branch `cursor/wave110-robustness-e14f`).

# Architecture create/review robustness — wave 110

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE109.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE109.md) (1293–1304 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1305 | Run findings CSV export GET runtime **409** mapper | `RunQueryController.Findings.cs` — `ExportRunFindingsCsv` |
| 1306 | Finding evidence chain GET runtime **409** mapper | same file — `GetFindingEvidenceChain` |
| 1307 | Run-scoped finding inspect GET runtime **409** mapper | same file — `GetFindingInspectForRun` |
| 1308 | Finding inspect GET runtime **409** mapper | `FindingInspectController.cs` — `GetInspectAsync` |
| 1309 | Finding LLM audit GET runtime **409** mapper | `ExplanationController.FindingExplain.cs` — `GetFindingLlmAudit` |
| 1310 | Aggregate run explanation GET runtime **409** mapper | `ExplanationController.RunExplain.cs` — `AggregateRunExplanation` |
| 1311 | Run pipeline timeline GET runtime **409** mapper | `AuthorityQueryController.Trail.cs` — `GetRunPipelineTimeline` |
| 1312 | Finding inspect GET `blockedReason` | `finding-inspect-blocked-reason.ts`, `findings-api.ts` — `getFindingInspect` |
| 1313 | Finding evidence chain GET `blockedReason` | `finding-evidence-chain-blocked-reason.ts`, `findings-api.ts` — `getFindingEvidenceChain` |
| 1314 | Finding explainability GET `blockedReason` | `finding-explain-blocked-reason.ts`, `findings-api.ts` — `getFindingExplainability` |
| 1315 | Finding LLM audit GET `blockedReason` | `finding-llm-audit-blocked-reason.ts`, `findings-api.ts` — `getFindingLlmAudit` |
| 1316 | Review-trail ZIP export `blockedReason` | `traceability-bundle-export-blocked-reason.ts`, `downloads-blob-trigger-artifact-bundle.ts` — `downloadTraceabilityBundleZip` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave110ArchitectureTests.cs`.

**Hasher baseline note:** wave 110 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 86 run-query review-trail rationale/provenance follow-ups — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE111.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE111.md) (1317–1328) when opened.

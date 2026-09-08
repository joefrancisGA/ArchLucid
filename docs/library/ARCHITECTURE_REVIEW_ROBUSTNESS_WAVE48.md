> **Scope:** Contributor-reference — wave-48 robustness controls for architecture create and review (branch `cursor/wave48-robustness-e14f`).

# Architecture create/review robustness — wave 48

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE47.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE47.md) (549–560 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 561 | Retrieval grounding read OpenAPI **409** | `AuthorityQueryController.RunDetail.cs` |
| 562 | Retrieval grounding fail-closed UX | `architecture-runs-read-detail-artifacts.ts`, `run-retrieval-grounding-blocked-reason.ts`, `RunDetailRetrievalGroundingSection.tsx`, `RunRetrievalGroundingPanel.tsx` |
| 563 | Run agent-traces read OpenAPI **409** | `RunQueryController.Provenance.cs` |
| 564 | Tool-invocation-forensics + agent-evaluation OpenAPI **409** | `RunQueryController.Provenance.cs`, `RunAgentEvaluationController.cs` |
| 565 | Agent forensics client sealed reads + UX | `architecture-runs-read-detail-artifacts.ts`, `run-agent-forensics-blocked-reason.ts`, `RunAgentForensicsSection.tsx` |
| 566 | Compare finding-correlation fail-closed UX | `use-compare-finding-correlation-query.ts`, `compare-finding-correlation-blocked-reason.ts`, `CompareFindingCorrelationPanel.tsx` |
| 567 | Compare governance diff fail-closed UX | `use-compare-governance-diff-query.ts`, `compare-governance-diff-blocked-reason.ts`, `CompareGovernanceDiffPanel.tsx` |
| 568 | Compare replay cost fail-closed UX | `ArchitectureComparisonReplayCostSection.tsx`, `comparison-replay-cost-blocked-reason.ts` |
| 569 | Review meeting packet programmatic exports | `ReviewMeetingPacketButton.tsx`, `downloads-blob-trigger-run-package.ts` |
| 570 | Review header share menu programmatic exports | `ReviewHeaderShareMenu.tsx` |
| 571 | Sponsor dashboard DOCX programmatic export | `SponsorExportsSection.tsx`, `downloads-blob-trigger-run-package.ts` |
| 572 | Compare results architecture DOCX download | `use-compare-results-panel.ts`, `CompareResultsPanelDiffStack.tsx`, `downloads-blob-trigger-architecture-package-docx.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave48ArchitectureTests.cs`.

**Hasher baseline note:** wave 48 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE49.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE49.md) (573–584).

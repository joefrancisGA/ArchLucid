> **Scope:** Contributor-reference — proof-based draft/intake sealed-manifest **409** wiring (branch `cursor/robustness-verification-e14f`).

# Architecture create/review robustness — verification batch

Pivot from wave-141 guard-test inventory to **runtime proof** on high-traffic architecture review mutations.

## Problem

Guard waves (132–140) locked pre-read sealed-manifest guards and many runtime mappers via source containment tests. Several endpoints still had **pre-read guards only**: if the application service or repository threw `ConflictException` during mutation, the API could fall through to an unhandled **500** or wrong status (e.g. **400** via `InvalidOperationException`) instead of OpenAPI **409**.

## Fixes

| Endpoint | Controller action | Runtime mapper |
|----------|-------------------|----------------|
| `PUT …/wizard-draft/{wizardId}` | `UpsertDraft` | `MapWizardIntakeDraftSealedManifestConflict` |
| `POST …/draft/{draftId}/abandon` | `AbandonDraft` | `MapDraftRequestSealedManifestConflict` |
| `POST …/draft/{draftId}/reopen` | `ReopenDraft` | `MapDraftRequestSealedManifestConflict` |
| `POST …/draft/{draftId}/clone-snapshot` | `CloneDraftSnapshot` | `MapDraftRequestSealedManifestConflict` |
| `POST …/draft/{draftId}/admit` | `AdmitDraft` | `MapDraftRequestSealedManifestConflict` |
| `POST …/draft/{draftId}/answer` | `AnswerQuestion` | `MapDraftRequestSealedManifestConflict` |
| `POST …/draft/{draftId}/skip` | `SkipQuestion` | `MapDraftRequestSealedManifestConflict` |
| `POST …/draft/{draftId}/reason` | `ReasonDraft` | `MapDraftRequestSealedManifestConflict` |
| `POST …/draft/{draftId}/branch` | `BranchDraft` | `MapDraftRequestSealedManifestConflict` |
| `POST …/draft` | `CreateDraft` | `MapDraftRequestSealedManifestConflict` |
| `POST …/review/{runId}/result` | `SubmitAgentResult` | `MapRunsSealedManifestConflict` |
| `POST …/request/batch` | `CreateRunBatch` | `MapRunsSealedManifestConflict` |
| `PATCH …/request/{requestId}/archive` | `ArchiveRequest` | `MapRunsSealedManifestConflict` |
| `DELETE …/request/{requestId}` | `DeleteRequest` | `MapRunsSealedManifestConflict` |
| `POST …/request/{requestId}/restore` | `RestoreRequest` | `MapRunsSealedManifestConflict` |
| `PATCH …/review/{runId}/pin` | `PinRun` | `MapRunsSealedManifestConflict` |
| `POST …/governance/promotions` | `Promote` | `MapGovernanceSealedManifestConflict` |
| `POST …/governance/activations` | `Activate` | `MapGovernanceSealedManifestConflict` |
| `POST …/governance/approval-requests` | `SubmitApprovalRequest` | `MapGovernanceSealedManifestConflict` |
| `POST …/governance/approval-requests/batch-review` | `BatchReviewApprovalRequests` | `MapGovernanceSealedManifestConflict` |
| `GET …/pilots/runs/{runId}/pilot-run-deltas` | `GetPilotRunDeltas` | `MapPilotPackSealedManifestConflict` |
| `GET …/pilots/runs/recent-deltas` | `GetRecentDeltas` | `MapPilotPackSealedManifestConflict` |
| `POST …/pilots/closeout` | `PostCloseout` | `MapPilotPackSealedManifestConflict` |

## Proof tests — API (backend)

```bash
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj \
  --filter "FullyQualifiedName~SealedManifestRuntimeConflict|FullyQualifiedName~DraftIntakeSealedManifestRuntimeConflict"
```

- `DraftIntakeSealedManifestRuntimeConflictTests.cs` — draft/wizard intake (10 tests)
- `SealedManifestRuntimeConflictVerificationBatch2Tests.cs` — governance, runs, pilots reads/writes (7 tests)
- `SealedManifestRuntimeConflictVerificationBatch3Tests.cs` — architecture request curation, pin, closeout (5 tests)

`BatchReviewApprovalRequests` has a controller-level mapper for defense; per-item batch conflicts remain item-scoped in the facade.

## Proof tests — UI (`blockedReason`)

High-traffic mutation paths surface lifecycle/sealed-hash **409** copy via `compareRunPairBlockedReason` (or `runSummaryBlockedReason` for package print meeting capture):

| Path | Helper | Wiring test |
|------|--------|-------------|
| Draft autosave PATCH / create POST | `architectureDraftAutosavePatchBlockedReason`, `architectureDraftCreateMutationBlockedReason` | `use-architecture-draft-autosave.test.ts` |
| Finalize commit POST | `reviewFinalizeMutationBlockedReason` | `architecture-runs-lifecycle.test.ts`, `CommitRunButton.test.tsx` |
| Package print meeting capture GET | `packagePrintMeetingCaptureBlockedReason` | `PackagePrintPageView.test.tsx` |

Helper wrappers are covered in `architecture-review-mutation-blocked-reason.test.ts`.

```bash
cd archlucid-ui && npm test -- --run \
  architecture-review-mutation-blocked-reason.test.ts \
  architecture-runs-lifecycle.test.ts \
  use-architecture-draft-autosave.test.ts \
  CommitRunButton.test.tsx \
  PackagePrintPageView.test.tsx
```

## Hasher baseline

No Hasher A schema bump; remains **`v12`** (`tests/manifest-hash/hasher-baseline-v12.json`).

## Wave 141 status

[`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE141.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE141.md) guard-test placeholder (1677–1688) is **superseded** by this verification batch until a new inventory wave is explicitly reopened.

## Finalize quality gate + assumption acknowledgements (TB-2321 / TB-2345 item 49)

Server-side finalize enforcement on branch `cursor/finalize-quality-gate-server-e14f`:

| Surface | Behavior |
|---------|----------|
| `ArchLucid:FinalizeQualityGate:Enabled` | When true (Staging/Production appsettings), `CommitOutputIntegrityService` re-derives the UI scorecard and throws `ConflictException` → **409** with the same copy as `finalize-quality-scorecard.ts`. |
| Scorecard dimensions (nine) | Blocking findings, uncovered mandatory requirements, open deferred, open contradictions, open cannot-determine questions, open verify-hypothesis findings (TB-2315), unverified assumptions (threshold 3), low-confidence extractions, unresolved high-severity dispositions. |
| `GET/PUT /v1/architecture/review/{runId}/assumptions/acknowledgement` | Persists pre-finalize assumption acknowledgements on the run header (`AcknowledgedAssumptionsJson`, migration **390**). Finalize unions request-body ids with persisted ids. |
| UI hook | `useReviewAssumptionAcknowledgements` hydrates from and pushes to the server; localStorage remains a same-tab cache. |

Proof tests:

```bash
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~FinalizeQuality|RunAssumptionAcknowledgement"
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~FinalizeQualityScorecardUiCopyParity"
dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~FinalizeQualityGateRuntimeConflict|FinalizeQualityGateHostedAppsettings"
dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~OpenApiContractSnapshotTests"
cd archlucid-ui && npx vitest run src/lib/review-quality/review-assumption-ack-sync.test.ts src/hooks/use-review-assumption-acknowledgements.test.tsx
```

## WS-14 degraded finding-engine coverage policy

Working seats block finalize when engine coverage is degraded:

| Layer | Gate |
|-------|------|
| **Server** | `CareerArtifactCompletenessValidator.EvaluateDegradedFindingCoverage` when `WorkingDesk && Finalize && DegradedFindingCoverage` (via `AuthorityDrivenArchitectureRunCommitOrchestrator`). |
| **UI scorecard** | `blockDegradedFindingCoverageOnWorking` wired from `buyerPolishedArtifactTable !== true` in `run-detail-page-presentation-governance.ts`; finalize blocking uses server `GET …/readiness` via `useAssumptionAwareCommitBlockedReason`. |

Copy parity: `DegradedFindingCoverageBlockedReasonUiCopyParityTests` (Decisioning) + `degraded-finding-coverage-blocked-reason.ts`.

## TB-2315 verify-hypothesis finalize block

Open findings in the **verify-hypotheses** job view block finalize on both UI scorecard and server gate (structural lane, not TB-1228 semantic faithfulness):

| Layer | Gate |
|-------|------|
| **Server scorecard** | `FinalizeQualityScorecardEvaluator` counts `IsOpenVerifyHypothesisJobView` → `FinalizeQualityGate` **409**. |
| **UI scorecard** | `deriveFinalizeQualityScorecardInput` counts `classifyReviewFindingJobView === "verify-hypotheses"`. |

Copy parity: `FinalizeQualityScorecardUiCopyParityTests` field `openVerifyHypothesisCount`.

## TB-2179 deferred + contradiction finalize blocks

Open findings in **deferred** and **resolve-contradictions** job views block finalize on both UI scorecard and server gate:

| Layer | Gate |
|-------|------|
| **Server scorecard** | `IsOpenDeferredJobView` / `IsOpenContradictionJobView` → `FinalizeQualityGate` **409**. |
| **UI scorecard** | `openDeferredCount` / `openContradictionCount` from `classifyReviewFindingJobView`. |

Copy parity: `FinalizeQualityScorecardUiCopyParityTests` fields `openDeferredCount`, `openContradictionCount`.

## Blocking finding count from live rows

Pre-manifest finalize derives `blockingFindingCount` from live finding rows (Error+, non-advisory, unresolved) via `isUnresolvedBlockingReviewFinding`, unioned with manifest `unresolvedIssueCount`. Server scorecard counts the same shape via `BlockingFindingCount`.

## Split-gate copy parity

| Gate | Parity test |
|------|-------------|
| Degraded coverage (WS-14) | `DegradedFindingCoverageBlockedReasonUiCopyParityTests` |
| Skipped MUST | `SkippedMustBlockedReasonUiCopyParityTests` |
| Existential assumptions | `ExistentialAssumptionBlockedReasonUiCopyParityTests` |

## Development parity

`ArchLucid.Api/appsettings.Development.json` enables `Governance:PreCommitGateEnabled` and `FinalizeQualityGate:Enabled` so local API finalize matches Staging/Production scorecard enforcement.

## Commit gate map (no duplicate enforcement)

| Layer | Responsibility |
|-------|----------------|
| `CommitOutputIntegrityService` | Structural mode, lifecycle phase, agent output quality, unsupported semantic support hold, decision-grade provenance, existential assumptions, create-time architecture version pin (κ), create-time policy/evidence/draft pin integrity, TB-2321 scorecard (nine dimensions), evidence referential integrity. |
| `AuthorityDrivenArchitectureRunCommitOrchestrator` | Skipped MUST, transparency trail, WS-14 degraded coverage on Working desk (`CareerArtifactCompletenessValidator`). |
| UI finalize fallback | When server readiness is unavailable, `useAssumptionAwareCommitBlockedReason` surfaces `READINESS_UNAVAILABLE_MESSAGE` instead of client scorecard recompute. |

Guard: `CommitOutputIntegrityGateMapArchitectureTests`.

## Golden corpus engine registration (requirement-gap + policy-declaration-inventory-contradiction)

| Engine | Harness | Case |
|--------|---------|------|
| `requirement-gap` | Registered (43→44 engine inventory) | Factory cases **02, 08, 14, 20, 26, 32** (unlinked requirement nodes) |
| `policy-declaration-inventory-contradiction` | Registered (44→45); effectful engine only when `assignedPackFixture` present | **case-73** — case-37 graph + inventory + filtered **`cis-az-006`** pack |

Proof tests:

```bash
dotnet test ArchLucid.Decisioning.Tests --filter "FullyQualifiedName~GoldenCorpusRegressionTests|FullyQualifiedName~GoldenCorpusHarnessEngineInventoryTests"
dotnet test ArchLucid.Decisioning.Tests --filter "FullyQualifiedName~PolicyDeclarationInventoryContradictionGoldenCorpus"
```

Golden normalization stabilizes **DecisionGradeFusion** rationale lines (surrogate constituent ids, engine-type sort) so case-73 record/replay is deterministic.

## Finalize quality gate API 409 proof (controller-level)

```bash
dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~FinalizeQualityGateRuntimeConflict"
```

`FinalizeQualityGateRuntimeConflictTests` proves `POST …/finalize` maps scorecard `ConflictException` (with `FinalizeQualityGate.BlockedPrefix`) to OpenAPI **409** without SQL integration.

## Finalize conflict SQL integration proof

`FinalizeConflictSqlIntegrationFixture` pins scorecard-shaped findings on an executed run's SQL findings snapshot so all nine finalize scorecard dimensions (blocking findings, uncovered requirements, deferred, contradictions, cannot-determine, verify-hypothesis, unverified assumptions, low-confidence extractions, unresolved high-severity dispositions) plus pre-commit proofs no longer depend on simulator output shape. Pre-commit proof pins a `BlockCommitOnCritical` policy pack row on the run header and injects a **Critical** finding into the findings snapshot.

`FinalizeConflictSqlIntegrationTests` proves lifecycle integrity blocks, scorecard blocks, and pre-commit governance blocks on `POST …/finalize` stay aligned with `GET …/readiness` through real SQL persistence:

- Create run without execute → 409 + readiness `lifecycle_phase_incomplete` integrity block.
- Execute run, bulk-disposition pinned finding as **Deferred** with revisit → 409 + readiness `scorecard` layer block (open deferred dimension).
- Execute run with pinned **verify-hypothesis** finding → 409 + readiness `scorecard` layer block containing `hypothesis` (TB-2315 parity).
- Execute run with pinned **contradiction** finding → 409 + readiness `scorecard` layer block containing `contradiction` (TB-2179 parity).
- Execute run with pinned **cannot-determine** finding → 409 + readiness `scorecard` layer block containing `open question` (TB-2302 parity).
- Execute run with pinned **blocking** finding → 409 + readiness `scorecard` layer block containing `unresolved blocking`.
- Execute run with pinned **low-confidence** critical finding → 409 + readiness `scorecard` layer block containing `low confidence`.
- Execute run with pinned **unverified assumptions** (threshold met) → 409 + readiness `scorecard` layer block containing `unverified assumptions`.
- Execute run with pinned **coverage-gap** finding → 409 + readiness `scorecard` layer block containing `mandatory requirement` / `design decision`.
- Execute run with pinned **unresolved high-severity** finding → 409 + readiness `scorecard` layer block containing `accepted-risk disposition`.
- Execute run blocked by **pre-commit governance** → finalize **409** with `ProblemTypes.GovernancePreCommitBlocked` aligned with readiness `pre_commit_gate` layer block (deterministic via pinned critical finding + `BlockCommitOnCritical` policy pack pin).
- Execute run with pinned **skipped MUST** intake question → finalize **409** with `ProblemTypes.GovernancePreCommitBlocked` aligned with readiness `career-artifact` / `skipped_must_questions` block.
- Execute run with **missing transparency trail** → finalize **409** aligned with readiness `career-artifact` / `transparency_trail_incomplete` block.
- Execute run with **degraded finding coverage** on Working desk → finalize **409** aligned with readiness `career-artifact` / `degraded_finding_coverage` block.
- Execute run with **decision-grade provenance violation** → finalize **409** with `ProblemTypes.Conflict` aligned with readiness `integrity` / `decision_grade_provenance` block.
- Execute run with **unacknowledged existential assumption** on request → finalize **409** aligned with readiness `integrity` / `existential_assumption` block.
- Execute run with **rejected agent output quality trace** (Real + PilotStrict) → finalize **409** aligned with readiness `integrity` / `agent_output_quality` block.
- Execute run with **evidence referential integrity violation** (pinned evidence packages + Critical finding without resolvable linkage) → finalize **409** aligned with readiness `integrity` / `evidence_referential_integrity` block.
- Execute run with **architecture version content hash (κ) drift** on run header → finalize **409** aligned with readiness `integrity` / `architecture_version_pin` block.
- Execute run with **policy pack pin hash drift** on run header → finalize **409** aligned with readiness `integrity` / `create_time_pin_integrity` block.
- Execute run with **evidence package pin hash drift** on run header → finalize **409** aligned with readiness `integrity` / `create_time_pin_integrity` block.
- Execute run with **draft spawn document hash drift** on linked draft row → finalize **409** aligned with readiness `integrity` / `create_time_pin_integrity` block.
- Execute run with **Fallback structural execution mode** → finalize **409** aligned with readiness `integrity` / `structural_execution_mode` block.
- Execute run with **Mixed structural execution mode** → finalize **409** aligned with readiness `integrity` / `structural_execution_mode` block.
- Execute run with **Unsupported semantic support** on a decision-grade finding (Real + PilotStrict + TB-1228 opt-in host flag) → finalize **409** aligned with readiness `integrity` / `unsupported_semantic_support` block.

```bash
dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~FinalizeConflictSqlIntegrationTests"
```

## Artifact export sealed-manifest runtime 409 proof

`ArtifactExportSealedManifestRuntimeConflictTests` proves artifact export controllers map runtime sealed-manifest `ConflictException` (and builder/verifier conflict outcomes) to OpenAPI **409**:

- `GET …/reviews/{runId}/export` (`DownloadRunExport`) — manifest compare guard and package-builder conflict
- `GET …/reviews/{runId}/export/verify` (`VerifyRunExportLineage`) — lineage verifier conflict
- `GET …/reviews/{runId}/terraform-advisory-export` (`DownloadTerraformAdvisoryExport`) — sealed hash drift
- `GET …/reviews/{runId}/decision-receipt` (`DownloadRunDecisionReceipt`) — sealed-hash mismatch outcome
- `GET …/architecture/reviews/{runId}/artifacts` (`ListArtifactsForRun`) — manifest compare guard
- `GET …/architecture/reviews/{runId}/artifacts/bundle` (`DownloadBundleForRun`) — manifest compare guard
- `GET …/architecture/reviews/{runId}/artifacts/{artifactId}` (`DownloadArtifactForRun`) — manifest compare guard

```bash
dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~ArtifactExportSealedManifestRuntimeConflictTests"
```

## DOCX export sealed-manifest runtime 409 proof

`DocxExportSealedManifestRuntimeConflictTests` proves consulting DOCX export maps lifecycle and compare-run sealed-manifest conflicts to OpenAPI **409**:

- `GET …/docx/reviews/{runId}/architecture-package` (`ExportRunDocx`) — lifecycle incomplete guard
- `GET …/docx/reviews/{runId}/architecture-package?compareWithRunId=` — compare-run sealed-manifest guard

```bash
dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~DocxExportSealedManifestRuntimeConflictTests"
```

## Wave-73 finding disposition sealed-manifest 409 proof

`GovernanceStickinessDispositionSealedManifestRuntimeConflictTests` proves governance disposition mutations map runtime `ConflictException` from persistence to OpenAPI **409** (`ProblemTypes.Conflict`):

- `POST …/findings/{findingId}/dispositions` (`RecordDisposition`)
- `POST …/findings/bulk-disposition` (`RecordBulkDisposition`)
- `POST …/runs/{runId}/finding-merge-conflicts/{findingId}/resolve` (`ResolveFindingMergeConflict`)

`Wave73SealedManifestRuntimeConflictTests` proves wave-73 suggestions **861–866** map runtime `ConflictException` to OpenAPI **409**:

- `GET …/runs/{runId}/sponsor-proof-pack.zip` (`GetSponsorProofPackZip`)
- `GET …/runs/{runId}/sponsor-review-packet` (`GetExecutiveReviewPacket`)
- `GET …/runs/{runId}/first-value-report` (`GetFirstValueReport`)
- `GET …/roi/sponsor-report/board-pack` (`GetSponsorReportBoardPackAsync`)
- `POST …/review/{runId}/analysis-report` (`AnalyzeRun`)
- `POST …/governance/risk-exceptions` (`CreateRiskException`)

UI copy parity: `finding-disposition-mutation-blocked-reason.ts` → `compareRunPairBlockedReason` for lifecycle/sealed-hash **409** detail.

Wave-73 export helpers (868–872) delegate to the same `compareRunPairBlockedReason` path; `wave-73-export-mutation-blocked-reason.test.ts` covers pilot collateral, sponsor ROI board pack, consulting DOCX, run summary/package export, and architecture package DOCX helpers.

```bash
pnpm --dir archlucid-ui exec vitest run src/lib/wave-73-export-mutation-blocked-reason.test.ts
```

```bash
dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~Wave73SealedManifestRuntimeConflictTests"
dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~GovernanceStickinessDispositionSealedManifestRuntimeConflictTests"
cd archlucid-ui && npx vitest run src/lib/findings/finding-disposition-mutation-blocked-reason.test.ts
```

## Unified finalize readiness API

`GET /v1/governance/pre-finalize/readiness/{runId}` composes career-artifact, integrity, scorecard, and pre-commit governance gates into one server contract (`FinalizeReadinessService`). Optional `acknowledgedAssumptionIds` query params union persisted TB-2345 acknowledgements for assumption-gate parity. Pre-commit governance reuses `IPreCommitGovernanceGate.EvaluateAsync(runId)` (same snapshot + supplemental findings path as checklist/commit; no manifest dry-run required for blocking parity). Embedded `checklist.readyToFinalize` on the readiness payload is aligned with commit authority (`readyToFinalize`) so finalize UI does not disagree on the same response; standalone `GET …/pre-finalize/checklist/{runId}` keeps operator-hygiene items.

Review detail loads readiness for **every uncommitted review** (`finalizeReadinessEnabled = !hasManifest`), preferring the unified contract over legacy lifecycle/coverage copy when the server responds. Client hook `useAssumptionAwareCommitBlockedReason` mirrors the same rule and falls back to SSR legacy copy only when readiness is unavailable.

Proof tests:

```bash
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~FinalizeReadinessServiceTests"
dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~FinalizeReadinessControllerTests"
```

UI: `useFinalizeReadiness` + `getFinalizeReadiness` replace client scorecard recompute in `useAssumptionAwareCommitBlockedReason` when the server contract is available. Structured `blocks[]` (layer + code + message) render in `FinalizeReadinessStrip` and `CommitRunButton` with per-block deep links via `resolveFinalizeReadinessBlockAction` (findings job views, activity tab, intake finalize-readiness anchor). SSR `finalizeReadinessBlocks` from `buildRunDetailGovernancePresentation` hydrate the hook during client fetch and flow through `RunDetailPageHeader`, `ReviewPackagePrimaryAction`, and `RunDetailWorkspaceStickyActionsResolved` (deferred sticky bar on standard review detail). `FinalizeReadinessChecklistParityBanner` explains when embedded checklist `readyToFinalize` differs from commit authority. Disposition mutations, assumption acknowledgement pushes, and finding merge-conflict resolution call `notifyFinalizeReadinessRefresh(runId)` so the strip refetches without a full page reload.

```bash
cd archlucid-ui && npx vitest run src/lib/review-quality/finalize-readiness-block-action.test.ts src/lib/review-quality/finalize-readiness-refresh-notify.test.ts src/components/reviews/FinalizeReadinessBlockList.test.tsx src/hooks/use-assumption-aware-commit-blocked-reason.test.ts
cd archlucid-ui && npx playwright test -c playwright.mock.config.ts e2e/finalize-readiness-block-deeplink.spec.ts
```

Mock Playwright CI job `ui-playwright-mock-smoke` runs all `e2e/**/*.spec.ts` including `finalize-readiness-block-deeplink.spec.ts` via `npm run test:e2e:mock:functional`.

## TB-184 governance-block explainer (Staging)

`AgentRuntime:ExplainGovernanceBlocks:Enabled` is **true** in `appsettings.Staging.json` so pre-commit governance **409** responses can include optional `blockExplanation` copy. Production remains default-off for cost control. The same flag and `PreCommitGovernanceBlockExplainer` now attach optional `blockExplanation` on readiness `pre_commit_gate` blocks in `FinalizeReadinessService` (readiness path uses a gate-context JSON excerpt instead of a manifest dry-run).

```bash
dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~ExplainGovernanceBlocksHostedAppsettingsTests"
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~PreCommitGovernanceBlockExplanationAttacher|FinalizeReadinessServiceTests"
cd archlucid-ui && npx vitest run src/components/reviews/FinalizeReadinessBlockList.test.tsx
```

## TB-2343 unknown sentinel intake gate (structured brief)

Unknown `"Unknown — confirm before review"` placeholders must not unlock **Start architecture review** or project into requirement-like graph inputs (TB-2343).

| Layer | Gate |
|-------|------|
| **Server readiness** | `ArchitectureDraftReviewReadinessValidator` treats sentinel-only structured-brief slots as blockers (`structured brief placeholders`); `EnsureReviewReady` throws before `DraftAdmissionService.SubmitAsync` creates a run. |
| **Graph projection** | `DraftRequestProjector` filters sentinel strings via `ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry` — constraints, assumptions, capabilities, and inline requirements omit unknowns. |
| **UI readiness** | `architecture-draft-readiness.ts` blocker id `structured-brief-placeholders`; field copy in `architecture-review-readiness-copy.ts`. |

Proof tests:

```bash
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~ArchitectureDraftReviewReadinessValidator|DraftAdmissionServiceSubmitTests.SubmitAsync_WhenStructuredBriefHasUnknownSentinels|DraftRequestProjectorTests.Project_ExcludesUnknownSentinel"
dotnet test ArchLucid.Contracts.Tests --filter "FullyQualifiedName~ArchitectureDraftStructuredBrief"
dotnet test ArchLucid.Architecture.Tests --filter "FullyQualifiedName~Suggestion7_intake_gates_block_sentinels"
cd archlucid-ui && npx vitest run src/lib/architecture/architecture-draft-readiness.test.ts src/lib/architecture/architecture-review-readiness-copy.test.ts
```

## TB-2348 projected spend on cost-constraint nodes

Cost engines need projected monthly spend on cost-constraint graph nodes before `CostBreachFindingEngine` can fire (TB-2348).

| Layer | Behavior |
|-------|----------|
| **Request materialization** | `RequestCostConstraintMaterializer` writes projected spend properties when constraints carry spend hints. |
| **Graph enrichment** | `CostConstraintProjectedSpendEnricher` (via `CostConstraintProjectedSpendEnrichmentStage`) derives spend from topology when absent. |

Proof tests:

```bash
dotnet test ArchLucid.KnowledgeGraph.Tests --filter "FullyQualifiedName~CostConstraintProjectedSpend|RequestCostConstraintMaterializer"
```

## TB-2344 actor/trust-boundary axes into security engines

Draft `ActorSet` JSON materializes onto the context graph as typed `Actor` and `TrustBoundary` nodes (`RequestActorMaterializer`, `request-actors` stage). Security engines (`trust-boundary`, `external-exposure`, `privileged-access`) read graph nodes — not parallel assumption strings.

| Layer | Behavior |
|-------|----------|
| **Materialization** | `RequestActorMaterializer` emits `TrustBoundary` nodes for external/public-anonymous actors with `actorNodeId` linkage. |
| **Pipeline** | `GraphMaterializationStages` stage `request-actors` reads `ContextScopeMetadataKeys.Actors` from the context snapshot. |
| **Engines** | `ExternalExposureFindingEngine` skips external actors with matching trust-boundary nodes; `TrustBoundaryFindingEngine` skips mixed-origin graphs that already have boundaries; `PrivilegedAccessFindingEngine` fires on internal human actors. |

Proof tests:

```bash
dotnet test ArchLucid.KnowledgeGraph.Tests --filter "FullyQualifiedName~RequestActorMaterializer|RequestActorsStage"
dotnet test ArchLucid.Decisioning.Tests --filter "FullyQualifiedName~ActorSecurityFindingEngine|GoldenCorpusActorEngineHarness"
dotnet test ArchLucid.Architecture.Tests --filter "FullyQualifiedName~TB2344_request_actors_materialize"
```

## TB-2345 quality attributes and availability theme (RTO/RPO)

Structured-brief quality text materializes as typed `QualityAttribute` nodes with parsed `rtoHours`/`rpoHours` on the availability theme (`RequestQualityAttributeMaterializer`, `request-quality-attributes` stage). `DrRpoTopologyAnalyzer` consumes those typed properties via `DrRpoQualityAttributeParser` — engines no longer need to re-parse brief strings when materialized nodes are present.

| Layer | Behavior |
|-------|----------|
| **Materialization** | `RequestQualityAttributeMaterializer` parses RTO/RPO durations into `rtoHours` / `rpoHours` node properties with `theme=availability`. |
| **Pipeline** | `GraphMaterializationStages` stage `request-quality-attributes` reads `ContextScopeMetadataKeys.QualityAttribute`. |
| **Engine** | `DrRpoTopologyFindingEngine` / `DrRpoTopologyAnalyzer` evaluate materialized quality-attribute nodes against datastore replica evidence (graph-wide datastore scan when no requirement-style links exist). |

Proof tests:

```bash
dotnet test ArchLucid.KnowledgeGraph.Tests --filter "FullyQualifiedName~RequestQualityAttribute"
dotnet test ArchLucid.Decisioning.Tests --filter "FullyQualifiedName~DrRpoQualityAttributeParser|DrRpoTopologyFindingEngine|RequestQualityAttributeMaterializer_output"
dotnet test ArchLucid.Architecture.Tests --filter "FullyQualifiedName~TB2345_quality_attribute"
```

## TB-2347 confirmed assumptions on the context graph

Structured-brief confirmed assumptions materialize as `Assumption` nodes and receive connector `RelatesTo` edges to related requirements and actors (`RequestAssumptionMaterializer`, `RequestAssumptionEdgeMaterializer`, `request-assumptions` + `request-assumption-edges` stages). Unknown sentinels remain excluded via TB-2343 filtering at projection time.

| Layer | Behavior |
|-------|----------|
| **Materialization** | `RequestAssumptionMaterializer` emits one node per pipe-separated assumption with `source=structured-brief`. |
| **Connector edges** | `RequestAssumptionEdgeMaterializer` links assumptions to requirement/actor labels using conservative token overlap heuristics. |
| **Pipeline** | Stage `request-assumption-edges` runs immediately after `request-assumptions`. |

Proof tests:

```bash
dotnet test ArchLucid.KnowledgeGraph.Tests --filter "FullyQualifiedName~RequestAssumption"
dotnet test ArchLucid.Architecture.Tests --filter "FullyQualifiedName~TB2347_assumption_nodes"
```

## TB-2346 required-capability coverage finalize gate

Open `required-capability-coverage` findings block finalize when the quality gate is enabled. The scorecard exposes a tenth dimension (`MissingRequiredCapabilityCount`) with UI-parity copy and readiness deeplinks to the coverage-gaps job view.

| Layer | Behavior |
|-------|----------|
| **Analyzer** | `RequiredCapabilityCoverageAnalyzer` scores context-snapshot `RequiredCapabilities` against topology/security/requirement evidence tokens. |
| **Engine** | `RequiredCapabilityCoverageFindingEngine` emits `RequiredCapabilityCoverageFinding` rows when capabilities remain unsatisfied. |
| **Gate** | `FinalizeQualityFindingSignals.IsOpenRequiredCapabilityCoverageJobView` feeds `FinalizeQualityScorecardEvaluator` blocking reasons. |

Proof tests:

```bash
dotnet test ArchLucid.Decisioning.Tests --filter "FullyQualifiedName~RequiredCapabilityCoverage"
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~FinalizeQualityScorecard"
dotnet test ArchLucid.Architecture.Tests --filter "FullyQualifiedName~TB2346_required_capability"
cd archlucid-ui && npm run test -- finalize-quality-scorecard finalize-readiness-block-action
```

## ConflictException → 409 controller sweep

Twenty controller `try` blocks that returned **400** for `InvalidOperationException` now catch `ConflictException` first. Guard: `ControllerConflictExceptionNotSwallowedAs400ArchitectureTests`.


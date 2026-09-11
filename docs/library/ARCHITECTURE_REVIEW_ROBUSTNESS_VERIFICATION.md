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
| **UI scorecard** | `blockDegradedFindingCoverageOnWorking` wired from `buyerPolishedArtifactTable !== true` in `run-detail-page-presentation-governance.ts` and client recompute (`resolveClientAwareCommitBlockedReason`). |

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
| `CommitOutputIntegrityService` | Structural mode, lifecycle phase, agent output quality, unsupported semantic support hold, decision-grade provenance, existential assumptions, TB-2321 scorecard (nine dimensions), evidence referential integrity. |
| `AuthorityDrivenArchitectureRunCommitOrchestrator` | Skipped MUST, transparency trail, WS-14 degraded coverage on Working desk (`CareerArtifactCompletenessValidator`). |
| UI-only scorecard rows | Blocking finding count, existential assumption ack UI, skipped MUST / transparency / degraded coverage (client recompute via `resolveClientAwareCommitBlockedReason`). |

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

`FinalizeConflictSqlIntegrationTests` proves lifecycle integrity blocks, scorecard blocks, and pre-commit governance blocks on `POST …/finalize` stay aligned with `GET …/readiness` through real SQL persistence:

- Create run without execute → 409 + readiness `lifecycle_phase_incomplete` integrity block.
- Execute run, bulk-disposition one finding as **Deferred** with revisit → 409 + readiness `scorecard` layer block (open deferred dimension).
- Execute run with open **verify-hypothesis** finding (when simulator emits one) → 409 + readiness `scorecard` layer block containing `hypothesis` (TB-2315 parity; self-skips when fixture absent).
- Execute run blocked by **pre-commit governance** → finalize **409** with `ProblemTypes.GovernancePreCommitBlocked` aligned with readiness `pre_commit_gate` layer block (self-skips when gate does not block).

```bash
dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~FinalizeConflictSqlIntegrationTests"
```

## Wave-73 finding disposition sealed-manifest 409 proof

`GovernanceStickinessDispositionSealedManifestRuntimeConflictTests` proves `POST …/governance/findings/{findingId}/dispositions` maps runtime `ConflictException` from disposition persistence to OpenAPI **409** (`ProblemTypes.Conflict`).

UI copy parity: `finding-disposition-mutation-blocked-reason.ts` → `compareRunPairBlockedReason` for lifecycle/sealed-hash **409** detail.

```bash
dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~GovernanceStickinessDispositionSealedManifestRuntimeConflictTests"
cd archlucid-ui && npx vitest run src/lib/findings/finding-disposition-mutation-blocked-reason.test.ts
```

## Unified finalize readiness API

`GET /v1/governance/pre-finalize/readiness/{runId}` composes career-artifact, integrity, scorecard, and pre-commit governance gates into one server contract (`FinalizeReadinessService`). Optional `acknowledgedAssumptionIds` query params union persisted TB-2345 acknowledgements for assumption-gate parity. Pre-commit governance reuses `IPreCommitGovernanceGate.EvaluateAsync(runId)` (same snapshot + supplemental findings path as checklist/commit; no manifest dry-run required for blocking parity).

Proof tests:

```bash
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~FinalizeReadinessServiceTests"
dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~FinalizeReadinessControllerTests"
```

UI: `useFinalizeReadiness` + `getFinalizeReadiness` replace client scorecard recompute in `useAssumptionAwareCommitBlockedReason` when the server contract is available. Structured `blocks[]` (layer + code + message) render in `FinalizeReadinessStrip` and `CommitRunButton`. SSR `finalizeReadinessBlocks` from `buildRunDetailGovernancePresentation` hydrate the hook during client fetch and flow through `RunDetailPageHeader`, `ReviewPackagePrimaryAction`, and `RunDetailWorkspaceStickyActionsResolved` (deferred sticky bar on standard review detail). `FinalizeReadinessChecklistParityBanner` explains when embedded checklist `readyToFinalize` differs from commit authority.

## ConflictException → 409 controller sweep

Twenty controller `try` blocks that returned **400** for `InvalidOperationException` now catch `ConflictException` first. Guard: `ControllerConflictExceptionNotSwallowedAs400ArchitectureTests`.


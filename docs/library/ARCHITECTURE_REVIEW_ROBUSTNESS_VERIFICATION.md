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

## Proof tests

```bash
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj \
  --filter "FullyQualifiedName~SealedManifestRuntimeConflict|FullyQualifiedName~DraftIntakeSealedManifestRuntimeConflict"
```

- `DraftIntakeSealedManifestRuntimeConflictTests.cs` — draft/wizard intake (10 tests)
- `SealedManifestRuntimeConflictVerificationBatch2Tests.cs` — governance, runs, pilots reads/writes (7 tests)
- `SealedManifestRuntimeConflictVerificationBatch3Tests.cs` — architecture request curation, pin, closeout (5 tests)

`BatchReviewApprovalRequests` has a controller-level mapper for defense; per-item batch conflicts remain item-scoped in the facade.

## Hasher baseline

No Hasher A schema bump; remains **`v12`** (`tests/manifest-hash/hasher-baseline-v12.json`).

## Wave 141 status

[`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE141.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE141.md) guard-test placeholder (1677–1688) is **superseded** by this verification batch until a new inventory wave is explicitly reopened.

> **Scope:** Contributor-reference — proof-based draft/intake sealed-manifest **409** wiring (branch `cursor/robustness-verification-e14f`).

# Architecture create/review robustness — verification batch

Pivot from wave-141 guard-test inventory to **runtime proof** on high-traffic draft intake mutations.

## Problem

Guard waves (132–140) locked pre-read sealed-manifest guards and many runtime mappers via source containment tests. Several draft intake endpoints still had **pre-read guards only**: if the application service threw `ConflictException` during mutation, the API could fall through to an unhandled **500** instead of OpenAPI **409**.

## Fixes (this batch)

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

## Proof tests

`ArchLucid.Api.Tests/DraftIntakeSealedManifestRuntimeConflictTests.cs` — mocks pass the pre-read guard (`SealedManifestHashTestSupport`), then asserts each action maps a service-thrown `ConflictException` to **409** with `ProblemTypes.Conflict` and does not audit on failure.

## Hasher baseline

No Hasher A schema bump; remains **`v12`** (`tests/manifest-hash/hasher-baseline-v12.json`).

## Wave 141 status

[`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE141.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE141.md) guard-test placeholder (1677–1688) is **superseded** by this verification batch until a new inventory wave is explicitly reopened.

> **Scope:** Contributor reference — engineering source of truth for fine-tuned model promote / reject / rollback audit (**TB-1292**). Distinct from governance manifest promotion records.

# Fine-tuning promotion decision record contract (TB-1292)

> **Audience:** Contributors, principal architects, ML ops reviewers, and GTM (**M-227** / **M-228**).  
> **Buyer summary:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#ft-promotion-decision-record-m-228`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#ft-promotion-decision-record-m-228) (path-stable alias: `FINE_TUNING_PROMOTION_DECISION_RECORD_PA_ONE_PAGER.md`).  
> **Governance ADR:** [0056 — manifest online fine-tuning](../architecture/adrs/0056-manifest-online-fine-tuning-governance.md).  
> **Honesty CI follow-on:** **TB-1293** / **M-227**.

---

## Decision in one line

Model promote / reject / rollback is **code-rollback-grade** only when an **append-only decision event** captures prior-active pointer, both support ratios + floor, cohort and training pins, actor, and gate reason. Shipped `FineTunedModelRegistryEntry` timestamps + a single `EvalSupportRatio` are **not** sufficient.

---

## Required append-only decision event fields

Each **Promote**, **Reject**, or **Rollback** writes a new row. Prior promote rows are never deleted. Rollback references the restored `RegistryEntryId` via `PreviousActiveRegistryEntryId`.

| Field group | Field | Required | Why |
| --- | --- | --- | --- |
| **Identity** | `DecisionId` | Yes | Stable event id (GUID or ULID). |
| | `TenantId` | Yes | Tenant scope. |
| | `RegistryEntryId` | Yes | Candidate registry row under decision. |
| | `PreviousActiveRegistryEntryId` | Promote / Rollback | Rollback restores a **known** prior deployment, not “whatever is warm”. Nullable on first promote. |
| | `DecisionKind` | Yes | `Promote` \| `Reject` \| `Rollback`. |
| | `DecidedUtc` | Yes | UTC decision time. |
| | `Actor` | Yes | System job principal vs human operator id. |
| **Model pointers** | `BaseModelDeploymentName` | Yes | Base deployment at decision time. |
| | `FineTunedModelDeploymentName` | Yes when known | Candidate fine-tuned deployment. |
| | `AzureFineTuningJobId` | Yes when job exists | Azure fine-tuning job correlation. |
| **Eval evidence** | `BaseSupportRatio` | Yes | Golden-cohort base ratio at gate time. |
| | `FineTunedSupportRatio` | Yes | Candidate ratio at gate time. |
| | `RequiredSupportRatio` | Yes | Floor (`Retrieval:FineTuning:MinEvalSupportRatio`) at decision time. |
| | `GateReason` | Yes | Human-readable outcome from gate (see `FineTuningEvalGateResult.Reason`). |
| | `GateVersion` | Yes | Gate implementation / config fingerprint (e.g. options hash or assembly version). |
| **Cohort pin** | `GoldenCohortLockBaselineId` | Yes | Lock-baseline / fixture fingerprint so “against which cohort?” is reconstructible (**TB-1156** / **TB-1172** complementary). |
| | `EvalArtifactUri` | Recommended | URI or blob path to eval artifact bundle. |
| **Training pin** | `TrainingExportBatchId` | Yes when export ran | Export batch / audit id from `FineTuningTrainingExportResult`. |
| | `ManifestConsentSnapshot` | Yes | `FineTuning.ManifestConsent` key snapshot at export time. |
| | `ManifestHashSetCount` | Optional | Count or hash set of manifests in training slice. |
| **Rollback semantics** | `RestoredRegistryEntryId` | Rollback only | Active model restored by rollback decision. |

---

## Shipped registry vs required decision record

| Concern | Shipped (`FineTunedModelRegistryEntry` + migration `267_FineTuningManifestOnlineLearning.sql`) | Required decision record |
| --- | --- | --- |
| Prior-active pointer | **Missing** — `IsActive` flip only | `PreviousActiveRegistryEntryId` on every Promote/Rollback |
| Both ratios + floor | **Partial** — one `EvalSupportRatio` on entry; gate ratios live in transient `FineTuningEvalGateResult` | Persist `BaseSupportRatio`, `FineTunedSupportRatio`, `RequiredSupportRatio` on event |
| Gate reason | In-memory during `GoldenCohortFineTuningPromotionGate.Evaluate` only | Durable `GateReason` + `GateVersion` |
| Cohort identity | Not on registry row | `GoldenCohortLockBaselineId` (+ optional artifact URI) |
| Training / consent pin | Export result exists in orchestration path | `TrainingExportBatchId` + `ManifestConsentSnapshot` on event |
| Actor | Not persisted on promote/rollback | `Actor` on every event |
| Append-only history | `PromotedUtc` / `RolledBackUtc` overwrite narrative | New row per decision; never delete prior Promote rows |
| Cache invalidation | Done **TB-594** — operational | **Not** the audit record |

**Code anchors:** `GoldenCohortFineTuningPromotionGate`, `FineTuningEvalGateResult`, `OnlineFineTuningOrchestrationService`, `FineTunedModelRegistryEntry`, `IFineTunedModelRegistry`.

**Do not conflate:** `GovernancePromotionRecord` (manifest workflow lifecycle) is a different domain.

---

## Rollback semantics

1. **Rollback** writes a new `DecisionKind = Rollback` row with `RestoredRegistryEntryId` / `PreviousActiveRegistryEntryId` populated.
2. Registry marks candidate inactive (`RolledBackUtc`, `IsActive = false`) and reactivates the prior entry — matching today’s `IFineTunedModelRegistry.RollbackActiveAsync` intent.
3. **Cache eviction** (**TB-594** Done) runs after registry mutation; eviction is operational, not the audit artifact.
4. Timestamps alone (`PromotedUtc` / `RolledBackUtc`) do **not** satisfy buyer rollback-grade claims.

---

## DDL / event-store follow-on (named, not required to close **TB-1292**)

| Follow-on | Scope |
| --- | --- |
| `FineTuningPromotionDecisionEvents` table or append-only event store | Persist rows per table above |
| API / operator export | Read-only decision history per tenant |
| **TB-1293** CI | Fail ratio-only / silent-swap / rollback-without-record claims (`check_fine_tuning_promotion_decision_record_honesty.py`) |

Owner may park schema to V1.1; **this contract remains V1 documentation**.

---

## Related backlog

| ID | Role |
| --- | --- |
| Done **TB-594** | Promotion gate + cache invalidation |
| Open **TB-690** | Fine-tuning job activation (not reopened here) |
| Open **TB-1228** | Faithfulness score lanes (complementary) |
| Open **TB-1293** | Honesty CI shipped (`check_fine_tuning_promotion_decision_record_honesty.py`) |
| **M-227** / **M-228** | GTM one-pager + procurement packet |

---

## CI anchors for **TB-1293**

| Anchor | Purpose |
| --- | --- |
| This contract + **M-227** PA one-pager | Drift guard for FT promotion audit claims |
| `scripts/ci/check_fine_tuning_promotion_decision_record_honesty.py` | Fail ratio-only / silent-swap / rollback-without-record overclaims |
| Code presence | `GoldenCohortFineTuningPromotionGate`, `FineTunedModelRegistryEntry` |

---

## Safe vs too-strong claims

| Too strong | Safe |
| --- | --- |
| “FT promote/rollback is as auditable as `git revert` today” | Only when append-only decision events with fields above exist |
| “`PromotedUtc` + one ratio = rollback-grade” | Timestamps are hints; decision record is the audit artifact |
| “Cache eviction is the audit record” | Eviction is operational (**TB-594**) |
| “Governance manifest promotion = FT model promotion” | Different lanes — cite this contract for FT |

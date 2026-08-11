> **Scope:** Engineering source of truth — finding concurrent disposition / `HumanReviewStatus` conflict semantics (**TB-986**). Not a buyer assurance attestation.

# Finding concurrent disposition / HumanReviewStatus conflict contract (TB-986)

> **Audience:** Contributors, principal-architect diligence, and coding agents implementing finding stickiness / ITSM inbound.  
> **Buyer / PA handout:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#finding-disposition-concurrency-m-141) (GTM **M-140** / **M-141**).  
> **Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (M-140 row).  
> **Closed engineering work:** [`TECH_BACKLOG.md`](TECH_BACKLOG.md) (`## TB-986`).

---

## Decision in one line

V1 keeps **append-only finding dispositions** (both racing writes persist; **current** = latest `OccurredAtUtc`) and **last-writer `HumanReviewStatus`** on the correlated snapshot row. **Governance approval requests** remain a separate **first-wins CAS** (`TryTransitionFromReviewableAsync`; loser **409**). Do not conflate finding approve/reject with approval-queue mutex semantics.

---

## V1 owner choice (recorded 2026-08-10)

| Option | Decision | Follow-on |
| --- | --- | --- |
| **A — Append-only + UX honesty** | **Shipped** | **TB-987** (stale-current UX, divergence disclosure); **TB-988** (race regression tests) |
| **B — Contradictory-disposition mutex (409)** | **Deferred** | Requires explicit product/API change; do not implement silently under **TB-987** |

---

## Three objects — do not conflate

| Object | Storage / API | Concurrent rule | Durable outcome when two operators race |
| --- | --- | --- | --- |
| **Finding disposition trail** | `INSERT dbo.FindingReviewEvents` via `FindingDispositionService` → `FindingReviewTrailAppendService` | **Append-only** — no CAS, no 409 | **Both events persist**; inspect / stickiness **current** = `TOP 1 … ORDER BY OccurredAtUtc DESC` (`DapperFindingInspectReadRepository`, `ArchitectureRiskRegisterReader`) |
| **`HumanReviewStatus` (ITSM inbound)** | `UPDATE dbo.FindingRecords` on correlated snapshot row | **Last writer wins** — plain `UPDATE`, no 409 | Final column value = last successful inbound sync; may **diverge** from disposition trail unless **TB-396** disposition map also appends |
| **Governance approval request** | `UPDATE dbo.GovernanceApprovalRequests` via `TryTransitionFromReviewableAsync` | **First transition wins** — `Serializable` + `@@ROWCOUNT` | Loser gets **409** / `GovernanceApprovalReviewConflictException`; **out of finding scope** but must be contrasted in PA answers |

---

## Racing approve + reject on the same finding (PA answer)

1. Two operators record opposing dispositions (e.g. Accept risk vs Remediate) through `POST /v1/governance/findings/{findingId}/dispositions` (or bulk disposition).
2. **Both HTTP calls succeed** (no conflict status).
3. **Both rows** appear in `dbo.FindingReviewEvents` and disposition history APIs.
4. **Current disposition** in inspect / risk register = whichever event has the **later** `OccurredAtUtc` (clock-order; **no event-id tie-break** — see [`EVIDENCE_AUDIT_ORDERING_CAUSALITY_CLAIM_MAP.md`](EVIDENCE_AUDIT_ORDERING_CAUSALITY_CLAIM_MAP.md)).
5. If an ITSM webhook races a human disposition, **`HumanReviewStatus`** follows last-writer on the snapshot row; mapped disposition (**TB-396** Done) may append a trail event — still not a mutex.

---

## Engineering surfaces (verification anchors)

| Surface | Path / symbol | TB-986 expectation |
| --- | --- | --- |
| Disposition append | `ArchLucid.Application/Governance/FindingDisposition/FindingDispositionService.cs` | Always `INSERT`; never updates prior events |
| Trail repository | `SqlFindingReviewTrailRepository` | `ListByFindingAsync` ordered `OccurredAtUtc DESC` |
| Inspect current | `DapperFindingInspectReadRepository` | `LatestDisposition` from latest disposition row |
| Approval CAS | `GovernanceApprovalRequestRepository.TryTransitionFromReviewableAsync` | Unchanged; loser 409 |
| Concurrent transition tests | `GovernanceWorkflowTransitionConflictPropertyTests` | Approval-request CAS only |
| Finding disposition race tests | `FindingDispositionConcurrentRaceTests` (**TB-988**) | Both opposing `RecordAsync` calls persist; `ListHistoryAsync` current = latest `OccurredAtUtc` |
| ITSM `HumanReviewStatus` race tests | `SqlItsmFindingCorrelationRepositoryInboundSnapshotScopingSqlIntegrationTests` (**TB-988** traits) | Sequential and concurrent dual updates — last writer wins on correlated snapshot row |
| ITSM inbound | `API_CONTRACTS.md` ITSM inbound row; **TB-390** / **TB-396** | `HumanReviewStatus` update + optional disposition append |

---

## Too-strong vs safe

| Too strong | Safe |
| --- | --- |
| “Finding approve/reject is mutually exclusive first-wins like the governance queue” | Dispositions are append-only history; current = latest by time |
| “Concurrent disposition returns 409 Conflict” | **409** is approval-request CAS today; finding disposition returns **200** with a new event |
| “ITSM status update is the durable approval trail” | ITSM updates queue state; disposition trail is separate unless mapped (**TB-396**) |
| “Current disposition is immutable” | Later disposition events supersede for **current** view; history remains |
| “Operators always see concurrent-update feedback” | **TB-987** **Done** — inspect stickiness surfaces concurrent-update notice after save |

---

## Enforcement follow-ons (not required to close TB-986)

| ID | Role |
| --- | --- |
| **TB-987** **Done** | Stale-current UX, ITSM queue provenance caption |
| **TB-988** **Done** | Automated concurrent approve/reject + ITSM dual-writer regression tests |
| **TB-396** **Done** | Optional ITSM status → disposition trail append |
| **TB-390** **Done** | Correlated `FindingRecordId` for inbound status target row |

---

## Related backlog / GTM

| ID | Role |
| --- | --- |
| **TB-986** | This contract |
| **TB-987** / **TB-988** | UX enforcement + CI |
| **M-140** / **M-141** | Claim honesty + PA one-pager (buyer packet) |
| Done governance approval CAS | `GOVERNANCE_WORKFLOW_UI.md`; `GovernanceWorkflowTransitionConflictPropertyTests` |

---

## Out of scope

- Changing segregation-of-duties on governance approval requests.
- ITSM vendor workflow redesign (**TB-398** V2).
- Option B contradictory-disposition mutex without explicit owner re-open.

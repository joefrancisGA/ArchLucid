> **Scope:** Engineering source of truth — finding concurrent disposition / `HumanReviewStatus` conflict semantics (**TB-986**). Not a buyer assurance attestation.

# Finding concurrent disposition / HumanReviewStatus conflict contract (TB-986)

> **Audience:** Contributors, principal-architect diligence, and coding agents implementing finding stickiness / ITSM inbound.  
> **Buyer / PA handout:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#finding-disposition-concurrency-m-141) (GTM **M-140** / **M-141**).  
> **Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (M-140 row).  
> **Closed engineering work:** [`TECH_BACKLOG.md`](TECH_BACKLOG.md) (`## TB-986`).

---

## Decision in one line

**Working (ADR 0076):** append-only `FindingReviewEvents` **plus** a CAS-protected **current pointer** (`dbo.FindingCurrentDispositions` / `RowVersionStamp`). The second racing writer receives **409** with the winner's disposition; history may still contain both events only when the loser retried after reload. **Governance approval requests** remain separate first-wins CAS (`TryTransitionFromReviewableAsync`).

**V1 (TB-986, superseded for current pointer):** both racing writes succeeded; **current** = latest `OccurredAtUtc`. See ADR 0076 for the Working target.

---

## V1 owner choice (recorded 2026-08-10)

| Option | Decision | Follow-on |
| --- | --- | --- |
| **A — Append-only + UX honesty** | **Shipped (V1)** | **TB-987** (stale-current UX); **TB-988** (race regression tests) |
| **B — Contradictory-disposition mutex (409)** | **Working via ADR 0076 (2026-09-06)** | Current pointer CAS; 409 payload; RS-11 conflict UI |

---

## Three objects — do not conflate

| Object | Storage / API | Concurrent rule | Durable outcome when two operators race |
| --- | --- | --- | --- |
| **Finding disposition trail** | `INSERT dbo.FindingReviewEvents` via `FindingDispositionService` → `FindingReviewTrailAppendService` | **Append-only** with **current-pointer CAS** when `dbo.FindingCurrentDispositions` exists (ADR 0076) | Loser gets **409** / `FindingDispositionConflictException`; history remains append-only; inspect **current** = pointer event |
| **`HumanReviewStatus` (ITSM inbound)** | `UPDATE dbo.FindingRecords` on correlated snapshot row | **Working (LP-17):** when mapped disposition CAS fails, **skip** snapshot update and emit `dispositionConflict` audit; otherwise last writer on snapshot row | Final column value = last successful inbound sync **only when disposition sync did not conflict**; may still **diverge** from disposition trail when disposition map is absent — Working inspect surfaces divergence banner + export suffix |
| **Governance approval request** | `UPDATE dbo.GovernanceApprovalRequests` via `TryTransitionFromReviewableAsync` | **First transition wins** — `Serializable` + `@@ROWCOUNT` | Loser gets **409** / `GovernanceApprovalReviewConflictException`; **out of finding scope** but must be contrasted in PA answers |

---

## Racing approve + reject on the same finding (PA answer)

1. Two operators record opposing dispositions (e.g. Accept risk vs Remediate) through `POST /v1/governance/findings/{findingId}/dispositions` (or bulk disposition).
2. **Working:** the first writer that matches (or creates) the current pointer succeeds (**200**). The second writer that omits `expectedCurrentDispositionRowVersionBase64` or sends a stale token receives **409 Conflict** with the winner's `currentDisposition` payload. The loser reloads the current disposition, then amends or records a correction. History remains **append-only**; inspect **current** is the CAS pointer, not latest `OccurredAtUtc`.
3. **V1 (superseded):** both HTTP calls succeeded and current = later `OccurredAtUtc`. Do not implement that behavior on Working.
4. If an ITSM webhook races a human disposition, **mapped disposition** (**TB-396**) uses the same ADR 0076 CAS as the UI. On conflict, **`HumanReviewStatus` is not updated** and audit records `dispositionConflict`; inspect shows the human current disposition. Unmapped inbound status may still last-writer on the snapshot row — Working inspect + export suffix flag divergence when terminal queue state disagrees with the current disposition pointer.

---

## Engineering surfaces (verification anchors)

| Surface | Path / symbol | TB-986 / ADR 0076 expectation |
| --- | --- | --- |
| Disposition append | `ArchLucid.Application/Governance/FindingDisposition/FindingDispositionService.cs` | Append + CAS when current pointer exists; 409 on conflict |
| Inspect save | `use-finding-inspect-governance-stickiness-dispositions.ts` | Sends `expectedCurrentDispositionRowVersionBase64`; 409 mounts `FindingDispositionConflictPanel`; retry adopts winner |
| Keyboard apply / undo | `FindingKeyboardTriageHost.tsx` | Apply and undo both send the token |
| Restore | `FindingDispositionRestoreButton.tsx` | Fetches history then sends the token; 409 keeps the snapshot |
| Bulk queue | `GovernanceFindingsBulkActions.tsx` + `RecordBulkFindingDispositionRequest.ExpectedCurrentDispositionRowVersionBase64ByFindingId` | Per-finding map; missing key = null expected (first write OK; existing pointer 409s); batch rolls back |
| Cluster strip | `RootCauseClusterDispositionStrip.tsx` | Same bulk map as queue actions |
| ITSM inbound disposition CAS | `ItsmInboundDispositionSync` + `ItsmInboundWebhookProcessPipeline` | Mapped status uses inspect row version; conflict skips `HumanReviewStatus` update |
| Working inspect divergence | `finding-human-review-disposition-divergence.ts` + `FindingInspectItsmWorkflowPanel` | Banner when CAS pointer exists and terminal ITSM queue state disagrees with current disposition |
| Export honesty | `FindingHumanReviewDispositionDivergence` + `ArchitectureRunFindingsCsvFormatter` | Appends `(diverged from disposition trail)` to HumanReviewStatus column when diverged |
| Trail repository | `SqlFindingReviewTrailRepository` | `ListByFindingAsync` ordered `OccurredAtUtc DESC` |
| Inspect current | `DapperFindingInspectReadRepository` | `LatestDisposition` from current pointer when present |
| Approval CAS | `GovernanceApprovalRequestRepository.TryTransitionFromReviewableAsync` | Unchanged; loser 409 |
| Concurrent transition tests | `GovernanceWorkflowTransitionConflictPropertyTests` | Approval-request CAS only |
| Finding disposition race tests | `FindingDispositionConcurrentRaceTests` (**TB-988** / FP-21) | One `RecordAsync` succeeds; the other conflicts; matching version allows amend; null expected after pointer exists 409s |
| Bulk CAS tests | `FindingDispositionServiceBulkAtomicityTests` (FP-20) | Null expected after pointer 409s; matching version records; stale version 409s; prior rows roll back |
| ITSM `HumanReviewStatus` race tests | `SqlItsmFindingCorrelationRepositoryInboundSnapshotScopingSqlIntegrationTests` (**TB-988** traits) | Sequential and concurrent dual updates — last writer wins on correlated snapshot row |
| ITSM inbound | `API_CONTRACTS.md` ITSM inbound row; **TB-390** / **TB-396** | `HumanReviewStatus` update + optional disposition append |

---

## Too-strong vs safe

| Too strong | Safe |
| --- | --- |
| “Finding approve/reject is mutually exclusive first-wins like the governance queue” | History is append-only; **current pointer** is CAS. The loser 409s and must reload. |
| “Omitting the expected token on inspect is last-write-wins” | Omitting the token when a pointer exists is a **client bug** and the server **409s**. First disposition (no pointer) may omit the token. |
| “Concurrent disposition returns 409 Conflict” | **409** on disposition when current pointer exists (UI + mapped ITSM inbound); approval-request CAS unchanged |
| “ITSM status update is the durable approval trail” | ITSM updates queue state; disposition trail is separate unless mapped (**TB-396**) |
| “Current disposition is immutable” | Later disposition events supersede for **current** view after a successful CAS write; history remains |
| “Operators always see concurrent-update feedback” | **TB-987** **Done** — inspect stickiness surfaces concurrent-update notice after save; inspect/bulk 409 also mounts `FindingDispositionConflictPanel` |

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

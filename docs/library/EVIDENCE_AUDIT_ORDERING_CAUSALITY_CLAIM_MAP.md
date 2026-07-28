> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# Evidence / audit ordering & causality

**Audience:** Engineering, security reviewers, principal-architect diligence. Not a buyer brochure.

**Status:** Working contract for **TB-1550** / GTM **M-284**. Pair honesty CI **TB-1551** / **M-284**.

**Verdict (one line):** List/export order is **app wall-clock `OccurredUtc`** (plus **`EventId` GUID tie-break** on primary paths) — **not** a database `IDENTITY`/`SEQUENCE`, commit LSN, or Lamport clock. Under clock skew, retries that preserve earlier stamps, dual-write lag, and **buyer-polished lifecycle re-sort**, the presented trail **can misrepresent causality**. Append-only ≠ causal order.

---

## 1. How ordering is derived (trace)

| Surface | Order key | Sequence / Lamport? |
|---------|-----------|---------------------|
| `dbo.AuditEvents` list / filtered search | `OccurredUtc DESC, EventId DESC` | No — wall-clock + random GUID |
| Filtered CSV/JSON export stream | `OccurredUtc ASC, EventId ASC` | Same |
| Legacy range export (`GetExportAsync`) | `OccurredUtc ASC` only | No `EventId` — unstable same-ms ties |
| Run pipeline audit timeline API | Re-sort `OccurredUtc`, then `EventId` ascending | Same wall-clock model |
| `dbo.FindingReviewEvents` / inspect disposition | `OccurredAtUtc DESC` only | No event-id tie-break |
| Policy pack change log | `ChangedUtc` | Wall-clock |
| Buyer-polished audit UI | **`auditEventLifecycleSortKey(eventType)` first**, then `occurredUtc` | **Narrative order can override timestamps** |
| Outbox delivery queues | `CreatedUtc, OutboxId` | Delivery order ≠ audit causality |

**Schema facts:** tenant `AuditEvents` PK is `EventId UNIQUEIDENTIFIER`; no `IDENTITY`, no `SEQUENCE`, no `ROWVERSION` for causality. Indexes are time+id keysets for pagination, not causal clocks.

---

## 2. What stamps the clock

| Path | Generator |
|------|-----------|
| `AuditEvent.OccurredUtc` default | `TimeProvider.System.UtcNowDateTime()` at construct |
| SQL INSERT | Binds app `@OccurredUtc` — **not** `SYSUTCDATETIME()` for tenant audit |
| `AuditService.EnrichAuditEvent` | Does **not** refresh `OccurredUtc` |
| Durable retry / drain queue | Retries **same** instance — stamp preserved; persist can be late |
| Finding review trail → `AuditEvents` dual-write | Trail uses caller `OccurredAtUtc`; audit row often gets a **fresh** construct-time stamp |

**Clock = host process UTC**, not SQL commit time, not a consensus clock across replicas/nodes.

---

## 3. Machines (do not conflate)

| Machine | Meaning |
|---------|---------|
| **A — App stamp** | Wall-clock when the `AuditEvent` object is constructed |
| **B — SQL append** | Row becomes durable; visibility may lag UoW commit |
| **C — Retry / drain** | Late insert with earlier stamp vs siblings written first |
| **D — Dual trail/audit** | Finding trail time ≠ companion `AuditEvents` time |
| **E — Buyer UI lifecycle sort** | Presentation order ≠ forensic time order |
| **F — Export paths** | Primary export uses `(OccurredUtc, EventId)`; legacy export omits `EventId` |

---

## 4. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Audit order is a DB sequence / insert order / Lamport causality” | Order is **best-effort wall-clock** + GUID tie-break |
| “Timestamps are SQL `SYSUTCDATETIME` for all tenant audit rows” | App `TimeProvider` stamps tenant audit |
| “Retry/outbox cannot reorder relative causality” | Late persist with earlier stamp can invert perceived order |
| “EventId proves who-happened-first” | Random GUID — stable tie-break only |
| “Buyer UI timeline = forensic chronological order” | Lifecycle re-sort may override timestamps |
| “Append-only + DENY UPDATE/DELETE ⇒ causal / hash-chained audit rows” | Immutability ≠ causal order; package/export hash is ADR 0040 |
| “Finding review trail and AuditEvents share one monotonic clock” | Dual stamps can diverge |
| “CTO demo integrity chain = production SQL hash lineage” | Demo/client sort by time string — not durable product chain |

---

## 5. Related owners

| ID | Role |
|----|------|
| INV-003 / **TB-953** Done | Required vs informational durability — **not** ordering |
| Open **TB-956** | Same-TX outbox — reduces lost/late writes, not Lamport |
| Open **TB-1009** / **M-160** | Append-only / sealed inventory — immutability ≠ causality |
| ADR 0039 / 0040 | Seal + export ManifestHash — not per-row audit Merkle |
| **TB-1550** / **M-284** | This ordering / causality claim map |

---

## 6. Optional follow-ons (not required to close honesty pin)

1. Add `EventId` to legacy `GetExportAsync` and finding-review list `ORDER BY`.  
2. Copy trail `OccurredAtUtc` onto companion audit events (or record both).  
3. Forensic UI mode that disables lifecycle re-sort.  
4. Optional insert-order / commit-LSN column if a buyer requires causal audit (product gap — do not sell as shipped).  
5. Review `NOLOCK` on audit hot-path reads under non-RCSI.

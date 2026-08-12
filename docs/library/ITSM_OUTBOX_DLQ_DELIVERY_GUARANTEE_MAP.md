> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# ITSM delivery guarantees — outbox, DLQ, duplicates (Jira / ServiceNow)

**Audience:** Engineering, integrations, principal-architect diligence. Not a buyer brochure.

**Status:** Working contract for **TB-1530** (Done 2026-08-12) / GTM **M-280**. Pair honesty CI **TB-1531** / **M-280**.

**Verdict (one line):** Do **not** treat “integration events → outbox → DLQ” as the native Jira/ServiceNow create path — native create is **background-job at-least-once** with **soft ArchLucid correlation skip**; customers **can see duplicate tickets**. Integration-event outbox/DLQ is a **separate** bridge path; poison lands in SQL + admin UI + Prometheus **warning** (not founder MVO paging by default).

---

## 1. Two paths (do not conflate)

| Path | Creates ITSM work? | Transport | Poison / DLQ |
|------|-------------------|-----------|--------------|
| **A — Native outbound create** | ArchLucid `POST` to Jira/ServiceNow APIs | `IBackgroundJobQueue` / `dbo.BackgroundJobs` when `DurableAsyncCreateEnabled` (default true); Done **TB-394** | Job terminal `Failed` (log may say “DLQ”) — **not** IntegrationEventOutbox |
| **B — Integration events → customer bridge** | Customer Power Automate / Logic Apps / webhook creates tickets from CloudEvents | `dbo.IntegrationEventOutbox` → Service Bus | `DeadLetteredUtc` + `/operate/integration-events/dlq` |

Native create does **not** enqueue into `IntegrationEventOutbox`.

---

## 2. Actual guarantees (Path A — what buyers mean by “Jira/ServiceNow”)

| Claim | Reality |
|-------|---------|
| Delivery semantics | **At-least-once create attempts** (worker retries on 429/5xx / `CorrelationPersistenceFailed`) |
| ITSM-side receiver dedupe | **No** — plain vendor `POST` create; no vendor idempotency headers |
| ArchLucid dedupe | Soft: `TryGetByFindingAndProviderAsync` skip-if-linked; UI disable when linked |
| Exactly-once ticket | **No** — customer ITSM **can** see duplicates |
| Duplicate windows | Create succeeds + correlation persist fails → retry → second ticket; concurrent creates (no unique finding+provider); new enqueue with new `Guid` correlation while ticket exists but correlation missing |

Job `CorrelationId` includes `Guid.NewGuid()` per enqueue — **not** a stable idempotency key.

---

## 3. Path B — Integration outbox / DLQ (bridges)

| Layer | Behavior |
|-------|----------|
| Publish | At-least-once to Service Bus; stable `MessageId` when set; crash-after-publish-before-mark re-drains (**TB-992**) |
| SB duplicate detection | Short window assist (~PT10M) — **not** forever exactly-once |
| Customer recipes | Must implement CloudEvents `id` / JQL / SharePoint dedupe — Power Automate has none built-in |
| Poison destination | `IntegrationEventOutbox.DeadLetteredUtc`; auto-requeue hosted service; permanent after retry budget |
| Who is told | Admin UI list/retry/suppress; `OperatorOutboxDiagnosticsCard`; Prometheus **warning** (`ArchLucidIntegrationEventOutboxDeadLetter`) when monitoring wired — **not** listed as solo-operator MVO P0 page by default |
| Bridge failures after SB delivery | Customer-owned (email/queue per recipe) |

---

## 4. Poison message — who is told (matrix)

| Poison type | Where it ends up | Who is told |
|-------------|------------------|-------------|
| Native ITSM create exhausted | `dbo.BackgroundJobs` `Failed` | Worker logs; no Integration DLQ UI parity |
| Integration outbox exhausted | SQL DLQ columns + admin API | Admin UI; warn-tier alert if Prometheus/action group applied |
| Customer bridge handler fail | Customer automation DLQ/email | Customer ops |

---

## 5. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Outbox + DLQ means Jira/SN create is durable and deduped” | Native create uses **background jobs**; soft correlation only |
| “At-least-once with receiver (ITSM) dedupe” | At-least-once attempts; **no** vendor receiver dedupe |
| “Managed connector natively idempotent via deduplicationKey / findingId” | Recipe §7 overclaim — soft pre-check only ([`JIRA_ISSUE_VIA_POWER_AUTOMATE.md`](../integrations/recipes/JIRA_ISSUE_VIA_POWER_AUTOMATE.md)) |
| “Poison ITSM create pages the founder” | Warn UI / optional Prometheus unless env wires critical AG |
| “SB duplicate detection = exactly-once forever” | Short assist window; handlers must be idempotent |
| Equating Path A and Path B as one pipeline | Separate machines |

---

## 6. Related owners

| ID | Role |
|----|------|
| Done **TB-394** | Durable async ITSM create via background jobs |
| Done **TB-992** / **M-144**–**M-145** | Integration outbox at-least-once contract (Path B) — [`TRANSACTIONAL_OUTBOX_REPLAY_VS_IDEMPOTENCY_CONTRACT.md`](./TRANSACTIONAL_OUTBOX_REPLAY_VS_IDEMPOTENCY_CONTRACT.md) |
| Open **TB-993**–**TB-994** | Stable `MessageId` enforcement + crash regression CI |
| Open **TB-1011** / **M-162** | Finalize vs outbox; delivery lag disclosed |
| **TB-1530** / **M-280** | This ITSM Path A vs B + duplicate/DLQ notify map |

---

## 7. Optional follow-ons (not required to close honesty pin)

1. Fix recipe §7 managed-connector idempotency overclaim.  
2. Unique `(TenantId, FindingId, Provider)` + create-then-correlate compensation / vendor lookup before retry.  
3. Stable create idempotency key; ITSM-job DLQ UI parity with Integration DLQ.  
4. Keep Path B honesty under **TB-992**; this map owns Path A residual + anti-conflation.

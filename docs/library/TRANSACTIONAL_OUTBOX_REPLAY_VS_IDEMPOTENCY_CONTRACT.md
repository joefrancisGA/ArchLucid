> **Scope:** Contributor-reference — transactional outbox replay vs consumer idempotency (TB-992); not a buyer-facing trust claim.

# Transactional outbox — replay-safe vs must-idempotent contract

**Status:** Active (V1)  
**Backlog:** **TB-992** (this contract) · **TB-993** (stable `MessageId` + handler inventory — **Done**) · **TB-994** (crash-between-publish-and-mark regression + anti-exactly-once CI — open)  
**Audience:** Principal architects, integration reviewers, coding agents  
**Related:** [ADR 0004](../architecture/adrs/0004-transactional-outbox-retrieval-indexing.md) · [ADR 0043](../architecture/adrs/0043-integration-event-outbox-durable-dispatch.md) · [ADR 0044](../architecture/adrs/0044-integration-event-outbox-reliability.md) · [TRANSACTIONAL_FINALIZE_VS_OUTBOX_CONTRACT.md](./TRANSACTIONAL_FINALIZE_VS_OUTBOX_CONTRACT.md) (**TB-1011**) · [DATA_CONSISTENCY_MATRIX.md](./DATA_CONSISTENCY_MATRIX.md) · [INTEGRATION_EVENTS_AND_WEBHOOKS.md](./INTEGRATION_EVENTS_AND_WEBHOOKS.md) · [INTEGRATION_EVENT_CATALOG.md](./INTEGRATION_EVENT_CATALOG.md) · [INTEGRATION_EVENT_DLQ_RETRY_POLICY.md](./INTEGRATION_EVENT_DLQ_RETRY_POLICY.md) · [ITSM_OUTBOX_DLQ_DELIVERY_GUARANTEE_MAP.md](./ITSM_OUTBOX_DLQ_DELIVERY_GUARANTEE_MAP.md) (**TB-1530**) · [BUYER_SECURITY_PROCUREMENT_PACKET.md § M-145](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#outbox-replay-vs-idempotency-m-145) · GTM **M-144** / **M-145** · open **TB-920** (shared outbox base refactor) · **TB-924** (DTF — out of scope)

---

## 1. Purpose

Name what is **replay-safe** when an outbox row is re-drained versus what **must be idempotent** at the consumer or handler — across integration-event Service Bus dispatch and internal SQL outboxes.

**One line:** Outbox drain is **at-least-once**; duplicate delivery is expected after crash, retry, or broker redelivery — consumers own side-effect deduplication.

---

## 2. Non-claims (say first)

| Do **not** claim | Why |
|------------------|-----|
| “Exactly-once integration events.” | Publish-then-mark and SB `CompleteMessageAsync` are both at-least-once windows. |
| “Service Bus duplicate detection = forever dedupe.” | Topic duplicate detection is a **short broker window** (~`PT10M` in Terraform `infra/terraform-servicebus`); not a consumer contract. |
| “A committed package means the provider received the event.” | Local TX proves enqueue intent; remote ack is async. |
| “Outbox replay makes handlers idempotent.” | Replay only re-issues the same intent; handlers must upsert/skip-if-done. |
| “V1 requires Durable Task Framework exactly-once.” | **TB-924** is deferred; this contract does not depend on DTF. |

---

## 3. Shared drain pattern (all outboxes)

Every outbox processor in V1 follows **work-then-mark**:

1. Dequeue pending row (SQL).
2. Perform side effect (`PublishAsync`, index upsert, blob push, …).
3. `MarkProcessedAsync` (or dead-letter after retry budget).

A process crash **after step 2 succeeds and before step 3** leaves the row pending → the next drain **replays** the same logical work.

| Layer | Replay of outbox row | Effect on downstream |
|-------|----------------------|----------------------|
| SQL outbox state | Safe to re-dequeue the same `OutboxId` | Depends on handler idempotency (**§5–§6**) |
| Integration `MessageId` | Stable when set at enqueue | SB duplicate detection may suppress republish within ~`PT10M` only |
| Consumer / indexer | N/A | Must treat duplicate input as no-op or superseding upsert |

**Code anchor (integration):** `IntegrationEventOutboxProcessor` — `PublishAsync` then `MarkProcessedAsync` (`ArchLucid.Persistence/IntegrationOutbox/IntegrationEventOutboxProcessor.cs`).

**Code anchor (retrieval):** `RetrievalIndexingOutboxProcessor` — `IndexAuthorityRunAsync` then `MarkProcessedAsync` (`ArchLucid.Host.Core/Coordination/Retrieval/RetrievalIndexingOutboxProcessor.cs`).

---

## 4. Crash / retry decision matrix — integration events (Path B)

Applies to `dbo.IntegrationEventOutbox` → Service Bus → customer bridge / internal worker.

| Failure point | Outbox row | Service Bus | Consumer effect | Classification |
|---------------|------------|-------------|-----------------|----------------|
| Crash **after** domain TX commit, **before** outbox enqueue | N/A (row missing) | Nothing sent | Missing event — ADR 0004 / finalize contract | **Enqueue must be transactional** with business commit |
| Crash **after** `PublishAsync` success, **before** `MarkProcessedAsync` | Still pending | Message may exist | Same `MessageId` republished on re-drain; SB duplicate window may drop duplicate within ~`PT10M` | **Replay-safe** at outbox; **at-least-once** to bus |
| Publish fails (transient) | Retry/backoff; eventual DLQ | May be absent or partial | None until success | Operator DLQ UI / **INTEGRATION_EVENT_DLQ_RETRY_POLICY** |
| Crash **after** consumer handler success, **before** `CompleteMessageAsync` | Already marked (if publish+mark completed earlier) | Message redelivered | Handler runs again | **Consumer must be idempotent** |
| After `PT10M` duplicate window | Re-drain or redelivery | Broker may deliver duplicate | Handler runs again | **Consumer must be idempotent** — broker assist expired |

**Stable `MessageId`:** When enqueue sets a non-empty stable id (natural key + event type), republish after publish-without-mark is **semantically the same message**. Null/unstable ids defeat SB duplicate detection — enforcement is **TB-993**.

---

## 5. Crash / retry decision matrix — internal SQL outboxes

Same work-then-mark semantics; no Service Bus duplicate window.

| Outbox | Work unit | Replay requirement | Notes |
|--------|-----------|-------------------|-------|
| **Retrieval indexing** (`RetrievalIndexingOutbox`) | Azure AI Search upsert for run/manifest | **Upsert / supersede** — re-index same run should converge | Incomplete run detail → mark processed skip (no index) |
| **Post-commit projection** (provenance, review-completed, rerank, IaC stubs, sample purge, …) | SQL/Cosmos projection writes | **Upsert or skip-if-done** per projection key | See ADR 0004 / finalize contract **§4** |
| **Export blob push** | Blob write for sponsor/export artifacts | **Overwrite same blob key** or versioned path | Replay must not create orphan duplicates with new keys |
| **Cosmos graph push** | Graph node/edge upsert | **Upsert by stable vertex/edge id** | Pair with **DATA_CONSISTENCY_MATRIX** |

**Classification rule:** If replay would create a **second customer-visible entity** (ticket, email, ticket comment) without a dedupe key, the handler is **not** replay-safe — fix handler or document residual (**TB-993** inventory).

---

## 6. Consumer idempotency — who owns what

| Owner | Responsibility | V1 enforcement |
|-------|----------------|----------------|
| **Outbox processor** | At-least-once dispatch; stable `MessageId` when set; DLQ after max attempts | Code + **TB-993** audit |
| **Service Bus** | Short duplicate detection on `MessageId` (~`PT10M`) | Terraform module config — **not** a product guarantee |
| **`IIntegrationEventHandler` / worker** | Upsert/skip-if-done per event type | **TB-993** handler inventory |
| **Customer Logic Apps / Power Automate** | CloudEvents `id`, JQL lookup, SharePoint keys | Recipes + **INTEGRATION_EVENTS_AND_WEBHOOKS** |
| **Native ITSM create (Path A)** | Soft correlation skip only — **not** outbox | **ITSM_OUTBOX_DLQ_DELIVERY_GUARANTEE_MAP** — duplicates possible |

---

## 7. Operator / PA review (replay drill)

1. Identify producer transaction and outbox row (`OutboxId`, `MessageId` if integration).
2. Kill dispatcher after persistence and **before** `MarkProcessed` (or simulate publish success + mark skip).
3. Verify second drain: integration → **identical `MessageId`** republish; internal → indexer/projection converges without duplicate customer artifacts.
4. Kill consumer after handler success and **before** ack; verify duplicate delivery does not double side effects.
5. Inspect DLQ / admin UI (`/operate/integration-events/dlq`) — do not assume silent eventual success.

---

## 8. Claim boundary (GTM **M-144** / **M-145**)

| Safe | Unsafe |
|------|--------|
| “At-least-once delivery with replay.” | “Exactly-once integration events.” |
| “Consumer idempotency required.” | “Duplicate-proof eventing.” |
| “Short SB duplicate-detection assist (~10 minutes).” | “Service Bus dedupes forever.” |
| “Committed package ≠ remote delivery ack.” | “Commit means the provider received it.” |

Buyer handout: [BUYER_SECURITY_PROCUREMENT_PACKET.md § M-145](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#outbox-replay-vs-idempotency-m-145). Path-stable alias: [TRANSACTIONAL_OUTBOX_REPLAY_IDEMPOTENCY_PA_ONE_PAGER.md](../go-to-market/TRANSACTIONAL_OUTBOX_REPLAY_IDEMPOTENCY_PA_ONE_PAGER.md).

---

## 9. Enforcement surfaces (follow-on)

| ID | Role |
|----|------|
| **TB-993** | **Done** — stable `MessageId` gateway + [`INTEGRATION_EVENT_HANDLER_IDEMPOTENCY_INVENTORY.md`](./INTEGRATION_EVENT_HANDLER_IDEMPOTENCY_INVENTORY.md) |
| **TB-994** | Integration test: publish succeeds → skip `MarkProcessed` → second drain asserts identical `MessageId`; CI guard against “exactly-once delivery” in buyer stubs |
| **TB-920** | Optional shared outbox base — does not change semantics |
| **TB-924** | DTF cutover — **out of scope** for this contract |

---

## 10. Explicit non-goals

- Exactly-once delivery end-to-end.
- Extending Service Bus duplicate-detection window without ops/cost review.
- Rewriting all six outboxes onto **TB-920** before **TB-993**/**TB-994**.
- Durable Task Framework saga semantics (**TB-924**).

> **Scope:** Contributor-reference — integration-event handler and subscriber idempotency inventory (**TB-993**); not a buyer-facing trust claim.

# Integration event handler idempotency inventory

**Status:** Active (V1)  
**Backlog:** **TB-993** (this inventory) · **TB-994** (publish-then-crash regression + anti-exactly-once CI — open)  
**Audience:** Integration engineers, operator runbook authors, principal architects  
**Related:** [`TRANSACTIONAL_OUTBOX_REPLAY_VS_IDEMPOTENCY_CONTRACT.md`](./TRANSACTIONAL_OUTBOX_REPLAY_VS_IDEMPOTENCY_CONTRACT.md) (**TB-992**) · [`INTEGRATION_EVENT_CATALOG.md`](./INTEGRATION_EVENT_CATALOG.md) · [`INTEGRATION_EVENTS_AND_WEBHOOKS.md`](./INTEGRATION_EVENTS_AND_WEBHOOKS.md) · [`ITSM_OUTBOX_DLQ_DELIVERY_GUARANTEE_MAP.md`](./ITSM_OUTBOX_DLQ_DELIVERY_GUARANTEE_MAP.md) (**TB-1530**)

---

## 1. Purpose

Inventory **who dedupes** after at-least-once Service Bus delivery or outbox replay, and name **residual duplicate risk** for operators/subscribers.

**One line:** Stable `MessageId` at enqueue is required (**TB-993**); consumer/handler idempotency still owns side effects.

---

## 2. Producer `MessageId` contract (enforced)

| Producer | Event type(s) | Stable `MessageId` pattern | Enforcement |
|----------|---------------|---------------------------|-------------|
| `AuthorityCommittedPipelineFinalizer` | `authority.run.completed` | `{runId:N}:com.archlucid.authority.run.completed` via `BuildAuthorityRunCompletedMessageId` | Architecture anchor + outbox gateway |
| `ManifestFinalizationService` (SQL proc) | `manifest.finalized.v1` | `{runId:N}:com.archlucid.manifest.finalized.v1` | `OutboxMessageId` in finalize proc |
| `GovernanceWorkflowService` | `governance.approval.submitted` / `governance.promotion.activated` | `{entityId}:{eventType}` | Architecture anchor |
| `AlertIntegrationEventPublishing` | `alert.fired` / `alert.resolved` | `{alertId:D}:{eventType}` | Architecture anchor |
| `AdvisoryScanRunner` | `advisory.scan.completed` | `{executionId:D}:{eventType}` | Architecture anchor |
| `MarketplaceWebhookIntegrationEventPublisher` | `billing.marketplace.webhook.received.v1` | `{providerDedupeKey}:{eventType}` | Architecture anchor |
| `TrialLifecycleIntegrationEventPublisher` | `notifications.trial-lifecycle-email.v1` | Caller-supplied (`trial-email-scan|…` or audit-derived) | `ThrowIfNullOrWhiteSpace(messageId)` |
| `DataConsistencyReconciliationHostedService` | `system.data-consistency-check.completed.v1` | `data-consistency-check:{checkedAtUtc:o}` | Architecture anchor |

**Gateway:** `OutboxAwareIntegrationEventPublishing` refuses enqueue when `TransactionalOutboxEnabled` and `MessageId` is empty (**TB-993**). Architecture tests scan production call sites for literal `null` `MessageId` arguments.

---

## 3. In-process `IIntegrationEventHandler` inventory

| Handler | Event type | Dedupe / replay behavior | Residual duplicate risk |
|---------|------------|--------------------------|-------------------------|
| `LoggingIntegrationEventHandler` (`*`) | All | Log-only | None (observability) |
| `AuthorityRunCompletedChatOpsIntegrationEventHandler` | `authority.run.completed` | Best-effort notify; swallows handler faults | Duplicate ChatOps posts possible on SB redelivery |
| `AuthorityRunCompletedAzureDevOpsIntegrationEventHandler` | `authority.run.completed` | PR decoration upsert via ADO API | Duplicate comments/checks if ADO path is create-always |
| `TrialLifecycleEmailIntegrationEventHandler` | `notifications.trial-lifecycle-email.v1` | `ISentEmailLedger.TryRecordSentAsync` idempotency key before send | Low for email body; audit row still append-only |

**Operator note:** duplicate ChatOps/email after the Service Bus duplicate-detection window is expected — treat as at-least-once unless the downstream documents stronger dedupe.

---

## 4. Customer bridge / Logic App subscribers

| Event family | Subscriber dedupe key | Guidance |
|--------------|----------------------|----------|
| Governance approval | CloudEvents `id` / approval id in payload | Filter subscription on `event_type`; dedupe in workflow |
| Alerts (ChatOps) | `deduplication_key` application property when present | See `INTEGRATION_EVENTS_AND_WEBHOOKS.md` § Alert ChatOps |
| Trial lifecycle email | **Internal** worker ledger — not a public integration contract | External subscribers should not rely on this event type |
| Marketplace webhook | Provider dedupe key in payload + SQL dedupe at ingress | Bridge must not create duplicate fulfillment rows |
| Authority run completed | `runId` + `manifestId` in JSON body | Recipes should upsert or skip-if-linked |

Recipe-level patterns: `docs/integrations/recipes/` — prefer lookup-before-create (JQL, SharePoint keys) over assuming Service Bus exactly-once.

---

## 5. Internal SQL outbox replay proof (**TB-993**)

| Outbox | Replay proof | Idempotency mechanism |
|--------|--------------|----------------------|
| **Retrieval indexing** | `RetrievalIndexingOutboxProcessorReplayIdempotencyTests` — two pending rows for the same run both call `IRetrievalRunCompletionIndexer` | `IRetrievalIndexingService` upserts documents with stable ids from `RetrievalDocumentBuilder` |
| Post-commit projections | Recoverability tests per outbox (existing) | Upsert/skip-if-done per projection key — see **TB-992** §5 |

**Gap (honest):** not every post-commit projection has a dedicated replay regression yet — **TB-994** adds publish-then-crash coverage for integration outbox.

---

## 6. Enforcement surfaces (follow-on)

| ID | Role |
|----|------|
| **TB-994** | Integration test: publish succeeds → skip `MarkProcessed` → second drain asserts identical `MessageId`; CI guard against “exactly-once delivery” stubs |
| **TB-920** | Optional shared outbox base — does not change idempotency semantics |

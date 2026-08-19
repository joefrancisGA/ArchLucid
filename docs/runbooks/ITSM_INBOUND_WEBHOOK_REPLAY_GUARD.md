> **Scope:** Operator runbook — ITSM inbound Jira/ServiceNow webhook shared-secret verification vs replay detection; investigation of duplicate status syncs. Complements billing replay: [`BILLING_WEBHOOK_REPLAY_GUARD.md`](BILLING_WEBHOOK_REPLAY_GUARD.md).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# ITSM inbound webhook replay guard (TB-968)

**Last reviewed:** 2026-08-04

**Audience:** Platform operators and support engineers investigating duplicate finding status updates after Jira or ServiceNow webhook retries.

ArchLucid applies these layers before mutating finding human-review / disposition from ITSM inbound:

1. **Shared-secret (and optional HMAC)** — `X-Jira-Token` / `X-ServiceNow-Token`; optional body HMAC + `X-ArchLucid-Timestamp` skew.
2. **In-memory replay guard** — tenant-scoped delivery/event ids remembered **after** successful mutation for **24 hours** (`MemoryCacheItsmInboundWebhookReplayGuard`).
3. **Handler no-op** — already-seen deliveries return **HTTP 200** with durable audit `Integration.ItsmInboundWebhookReplayIgnored` (does **not** re-apply status).

---

## Dedupe key

| Source (priority) | Header / construction |
|-------------------|------------------------|
| Preferred | `X-ArchLucid-Webhook-Delivery-Id` |
| Jira Cloud | `X-Atlassian-Webhook-Identifier` (when ArchLucid header absent) |
| Synthetic fallback | `{Jira\|ServiceNow}:{externalKey}:{statusOrState}` |

Cache key: `itsm-inbound-webhook-replay:{tenantId}:{provider}:{eventId}` · retention **24 hours**.

**Important:** This layer is **per API host process memory**. After a cold restart, synthetic keys protect only after the first post-restart delivery of that key on that instance. Prefer configuring a stable delivery id header from the middleware/proxy when available.

---

## Freshness

When `X-ArchLucid-Timestamp` (Unix seconds) is **present**, ArchLucid enforces `Integrations:ItsmInbound:WebhookTimestampSkewSeconds` (default **300**). When the header is **absent**, freshness is skipped — many stock Jira/ServiceNow webhook recipes cannot supply it; document that gap for the customer’s connector design.

---

## HTTP map

| Outcome | HTTP | Side effects |
|---------|------|--------------|
| Missing/empty shared secret | **401** | None |
| Bad token / HMAC / skew | **401** | None |
| Oversize body | **413** | Size audit only |
| First delivery (correlated) | **200** | Status/disposition mutate + sync audit |
| Replay within window | **200** | No mutation; `Integration.ItsmInboundWebhookReplayIgnored` |
| Unrecognized payload | **400** | Optional reject audit |

---

## Related

- Hostile-traffic contract: [`INBOUND_WEBHOOK_HOSTILE_TRAFFIC.md`](../library/INBOUND_WEBHOOK_HOSTILE_TRAFFIC.md)
- Billing counterpart: [`BILLING_WEBHOOK_REPLAY_GUARD.md`](BILLING_WEBHOOK_REPLAY_GUARD.md)

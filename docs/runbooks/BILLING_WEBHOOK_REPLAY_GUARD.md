> **Scope:** Operator runbook — billing webhook signature/JWT verification vs replay detection for Stripe and Azure Marketplace; investigation queries and safe replay procedures. Does not cover Marketplace GA rollback (`GaEnabled`) — see [`AZURE_MARKETPLACE_SAAS_OFFER.md`](../go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md#marketplace-ga-rollback-changeplan--changequantity).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Billing webhook replay guard

**Last reviewed:** 2026-07-21

**Audience:** Platform operators and support engineers investigating duplicate billing webhooks, HTTP **400** replay rejections, or subscription rows that did not update after a provider resend.

ArchLucid applies **three layers** before mutating subscription state:

1. **Cryptographic verification** — proves the caller is Stripe or Microsoft Marketplace (not a replay guard).
2. **In-memory replay guard** — rejects duplicate `EventId` within **24 hours** per API process.
3. **SQL ledger idempotency** — durable dedupe via `dbo.BillingWebhookEvents` (survives restarts).

---

## Endpoints and trust model

| Provider | Route | Trust mechanism | Dedupe key (`dbo.BillingWebhookEvents.EventId`) |
|----------|-------|-----------------|--------------------------------------------------|
| **Stripe** (wallet) | `POST /v1/billing/webhooks/stripe` | `Stripe-Signature` HMAC + wallet or fallback signing secret (300s clock skew) | Stripe `event.id` |
| **Stripe** (checkout / subscriptions) | `POST /v1/billing/webhooks/stripe/subscriptions` | `Stripe-Signature` HMAC + subscription or fallback signing secret (300s clock skew) | Stripe `event.id` |
| **Azure Marketplace** | `POST /v1/billing/webhooks/marketplace` | `Authorization: Bearer` JWT via OIDC metadata (`Billing:AzureMarketplace:OpenIdMetadataAddress`) | `{subscriptionId}|{action}|{payloadHash}` |

Checkout and subscription lifecycle events must register on **`/stripe/subscriptions`** — not the wallet route alone. Route matrix: [`STRIPE_CHECKOUT.md`](../go-to-market/STRIPE_CHECKOUT.md#webhooks).

Implementation: `StripeBillingProvider`, `AzureMarketplaceBillingProvider`, `MemoryCacheBillingWebhookReplayGuard`, `IBillingLedger`.

---

## Layer 1 — Signature / JWT (authentication)

| Symptom | HTTP | Meaning |
|---------|------|---------|
| Missing signing secret or header | **400** | Configuration or proxy stripped headers — fix before replay investigation. |
| Stripe signature invalid / timestamp outside tolerance | **400** | Wrong secret, body mutation, or event older than **300 seconds** at verification time. |
| Marketplace JWT validation failed | **400** | Wrong bearer, expired token, or metadata mismatch — not a duplicate-event case. |

**Operator action:** Fix secrets and network path first. See [`STRIPE_CHECKOUT.md`](../go-to-market/STRIPE_CHECKOUT.md#webhook-incident-triage) and [`BILLING.md`](../library/BILLING.md) § Security model.

---

## Layer 2 — In-memory replay guard (24 hours)

`MemoryCacheBillingWebhookReplayGuard` tracks processed event ids per provider:

| Property | Value |
|----------|-------|
| Retention | **24 hours** (`TimeSpan.FromHours(24)`) |
| Cache key | `billing-webhook-replay:{provider}:{eventId}` |
| Methods | `HasSeenAsync` (reject), `RememberAsync` (after successful processing) |

When `HasSeenAsync` returns true **before** ledger insert, the provider returns `BillingWebhookHandleResult.ReplayRejected` → controllers respond with **HTTP 400** and a problem detail explaining replay within the protection window.

**Important:** This layer is **per API host process memory**. After a cold restart, only the SQL ledger (below) protects against duplicates until the same event id is seen again within 24h on that instance.

---

## Layer 3 — SQL ledger idempotency (durable)

Table: **`dbo.BillingWebhookEvents`** (PK **`EventId`** = dedupe key).

| Step | Behavior |
|------|----------|
| First sight | `TryInsertWebhookEventAsync` inserts row with `ResultStatus = 'Received'`. |
| Success | `MarkWebhookProcessedAsync(..., 'Processed')` + replay guard `RememberAsync`. |
| Failure | `MarkWebhookProcessedAsync(..., 'Failed')` — event id remains reserved; investigate before forced replay. |
| Duplicate insert | PK violation → read prior `ResultStatus`. If **`Processed`**, treat as replay → **400** (Stripe/Marketplace providers today). |

Marketplace may also return **HTTP 200** with `DuplicateIgnored` when the controller path is wired for idempotent no-op (see `BillingMarketplaceWebhookController`).

---

## HTTP response map (operator cheat sheet)

| Result flag | Stripe HTTP | Marketplace HTTP | Side effects |
|-------------|-------------|------------------|--------------|
| Signature/JWT rejected | **400** | **400** | None |
| `IsReplayRejected` | **400** | **400** | None |
| `DuplicateIgnored` | — | **200** | None |
| `Returns202Accepted` (GA rollback no-op) | — | **202** | Ledger only (`AcknowledgedNoOp`) |
| Success | **200** | **200** | Subscription / trial activation per event type |

---

## Investigation queries (SQL)

Recent webhook rows for a provider:

```sql
SELECT TOP 100
    EventId,
    Provider,
    EventType,
    ResultStatus,
    ReceivedUtc,
    ProcessedUtc,
    LEFT(PayloadJson, 200) AS PayloadPreview
FROM dbo.BillingWebhookEvents
WHERE Provider IN (N'Stripe', N'AzureMarketplace')
  AND ReceivedUtc >= DATEADD(day, -7, SYSUTCDATETIME())
ORDER BY ReceivedUtc DESC;
```

Lookup a specific Stripe event id or Marketplace dedupe key:

```sql
SELECT *
FROM dbo.BillingWebhookEvents
WHERE EventId = @EventId;
```

Correlate with subscription state:

```sql
SELECT TenantId, Provider, ProviderSubscriptionId, Tier, Status, SeatsPurchased, UpdatedUtc
FROM dbo.BillingSubscriptions
WHERE TenantId = @TenantId;
```

---

## Safe replay procedures

### Stripe — legitimate provider resend (recommended)

1. Confirm the row is **`Failed`** or missing — not **`Processed`**.
2. Fix root cause (metadata, signing secret, environment routing, **correct webhook route** — checkout events on `/stripe/subscriptions`).
3. In Stripe Dashboard → **Developers → Events** → select event → **Resend**.
4. Expect **200** when processing succeeds; **400** replay rejected when already **`Processed`** or within 24h in-memory guard on a hot instance.

### Marketplace — Partner Center resend

1. Prefer Partner Center **Resend webhook** so Microsoft re-issues a valid JWT.
2. If `ResultStatus = 'Processed'`, resend is a no-op (**400** replay or **200** duplicate) — correct behavior.
3. For forced re-drive after a code fix, follow the gated `ResultStatus` mutation path in [`AZURE_MARKETPLACE_SAAS_OFFER.md`](../go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md#re-process-a-webhook-gated) (DB owner credentials only).

### Test-mode events

Stripe test-mode events use the same dedupe keys and ledger. Use a **non-production** ArchLucid environment with test signing secrets so test `event.id` values never collide with production ledger rows.

---

## False positives and security escalations

| Scenario | Interpretation | Action |
|----------|----------------|--------|
| **400** immediately after successful **200** for same `event.id` | Expected replay guard or ledger duplicate | No mutation; document for provider support if their dashboard shows repeated failures. |
| **400** `Stripe-Signature` after clean secret rotation | Possible replay attack or proxy body rewrite | Page security per [`../security/SYSTEM_THREAT_MODEL.md`](../security/SYSTEM_THREAT_MODEL.md) § Billing webhooks. |
| **200** but subscription unchanged | Wrong environment, wrong webhook route, missing session metadata, or prior **`Failed`** ledger row | [`STRIPE_CHECKOUT.md`](../go-to-market/STRIPE_CHECKOUT.md#webhook-incident-triage) symptom map. |

**Do not** delete rows from `dbo.BillingWebhookEvents` — the table is part of billing audit evidence.

---

## Related documents

| Doc | Use |
|-----|-----|
| [`BILLING.md`](../library/BILLING.md) | Provider abstraction, checkout flow, config keys |
| [`STRIPE_CHECKOUT.md`](../go-to-market/STRIPE_CHECKOUT.md#webhook-incident-triage) | Stripe delivery failures and secret rotation |
| [`AZURE_MARKETPLACE_SAAS_OFFER.md`](../go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md#marketplace-ga-rollback-changeplan--changequantity) | Marketplace GA rollback and forced re-process |
| [`../security/SYSTEM_THREAT_MODEL.md`](../security/SYSTEM_THREAT_MODEL.md) | Billing webhook STRIDE row |

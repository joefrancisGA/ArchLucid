> **Reviewed:** 2026-07-25

> **Scope:** Azure Marketplace — SaaS offer (fulfillment v2) checklist, publication (GTM), publisher identity placeholders, webhook behavior, GA rollback, and ArchLucid configuration.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Azure Marketplace — SaaS offer (fulfillment v2) checklist

**Last reviewed:** 2026-07-25

## Objective

Stand up a **transactable** SaaS offer that lands buyers in ArchLucid while using **managed identity** to call **`https://marketplaceapi.microsoft.com/.default`** for subscription activation.

## Publisher identity & Partner Center placeholders

**Status:** Owner placeholder scaffold — **`<<MPN_ID>>`** and **`<<OFFER_ID>>`** remain unfilled by design until Partner Center go-live. No live Partner Center secrets in this repository. Tracking: [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) item **8** (sub-rows **a**–**f**).

### Publisher display name

**`ArchLucid`** — the customer-facing **publisher display name** on the commercial marketplace listing (owner decision 2026-04-22).

### Microsoft Partner Network (MPN) ID

<!-- TODO(owner) -->

**MPN ID:** `<<MPN_ID>>` — replace after the owner records the real Microsoft Partner Network ID from Partner Center.

### Marketplace Offer ID

<!-- TODO(owner) -->

**Offer / product ID:** `<<OFFER_ID>>` — maps to **`Billing:AzureMarketplace:MarketplaceOfferId`** (required in Production when `Billing:AzureMarketplace:GaEnabled=true` — see § ArchLucid configuration below and [`ArchLucid.Api/appsettings.json`](../../ArchLucid.Api/appsettings.json)).

### Landing page URL

**Resolved 2026-04-27:** `https://archlucid.net/signup` — maps to **`Billing:AzureMarketplace:LandingPageUrl`** (non-loopback required in Production per `BillingProductionSafetyRules`).

### CI alignment

Tier naming for publication docs is guarded by **`python scripts/ci/assert_marketplace_pricing_alignment.py`** against [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md). That script does **not** validate Partner Center identity fields — fill `<<MPN_ID>>` and `<<OFFER_ID>>` here when the owner records them.

### Legal entity vs display name

The legal entity for Partner Center tax and payout profiles is **Joseph Francis (Sole Proprietorship)** (owner decision 2026-04-27). This name appears on tax and banking records, while the **publisher display name** on the listing card remains **`ArchLucid`**.

**Planned migration:** move seller-of-record and related commercial identity to **Francis Architecture, LLC** per [`FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER.md`](../runbooks/FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER.md). Until that runbook completes and **`CHANGELOG.md`** records execution, treat the **sole proprietorship** line above as the live Partner Center legal identity.

## Publication checklist (GTM)

Track **Partner Center** and repository steps so a transactable SaaS offer can go live without ad-hoc gaps. Technical webhook behavior is in § **Webhook actions** and § **Marketplace GA rollback** below; billing architecture is in [`BILLING.md`](../library/BILLING.md).

### Preconditions (owner)

1. **Microsoft Partner Center** account in **Commercial Marketplace** program — **seller / legal verification complete** (see § Publisher identity above).
2. **Landing page URL** aligned with `Billing:AzureMarketplace:LandingPageUrl` (query parameters documented in § Step-by-step).
3. **Webhook URL** reachable from Microsoft: `https://<api-host>/v1/billing/webhooks/marketplace` with Entra validation as configured.
4. **Managed identity** (or secret) authorized for Marketplace fulfillment API audience `https://marketplaceapi.microsoft.com` when activation calls are enabled.

### Publication steps

1. Create **Software as a Service** offer; map plans to ArchLucid tiers (`Team` / `Professional` / `Enterprise`) per [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) (single source of truth for list prices).
2. Paste **listing copy**; include reference-customer row from [`reference-customers/README.md`](reference-customers/README.md) when a **Published** row exists.
3. Complete **technical configuration** (landing page, webhook, tenant ID for JWT validation) — § Step-by-step below.
4. Run **certification** / validation in Partner Center; fix findings.
5. **Go live** — record date in [`CHANGELOG.md`](../CHANGELOG.md).

### Default Azure region

Production primary region is **Central US** for new Terraform stacks unless compliance requires otherwise — see [`REFERENCE_SAAS_STACK_ORDER.md`](../library/REFERENCE_SAAS_STACK_ORDER.md).

### Blockers requiring human owner

- **Tax profile** and **payout account** (Partner Center) until configured.
- **Azure subscription id** for production (dedicated) — see [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md).

## Step-by-step (operator)

1. **Partner Center** → Commercial Marketplace → New offer → **Software as a Service**.
2. **Plan IDs** align with ArchLucid commercial tiers (`Team`, `Professional`, `Enterprise`) or map in your landing page (names must match [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md) §3 — do not publish the middle tier as **Pro** alone; use **Professional**).
3. **Technical configuration**
   - **Landing page URL:** `https://archlucid.net/signup` (or the value in `Billing:AzureMarketplace:LandingPageUrl`) — must accept `tenantId`, `workspaceId`, `projectId`, `tier`, `session` query parameters from ArchLucid checkout.
   - **Webhook URL:** `https://<api-host>/v1/billing/webhooks/marketplace`
   - **Microsoft Entra ID tenant ID** for the webhook app registration (Microsoft validates JWTs against OIDC metadata).
4. **ArchLucid configuration**
   - `Billing:Provider=AzureMarketplace`
   - `Billing:AzureMarketplace:OpenIdMetadataAddress` (typically `https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration` or a tenant-specific metadata URL)
   - `Billing:AzureMarketplace:ValidAudiences` includes `https://marketplaceapi.microsoft.com`
   - `Billing:AzureMarketplace:FulfillmentApiEnabled=true` in production (set `false` only in isolated tests without network).
   - `Billing:AzureMarketplace:GaEnabled` — **default `true` since 2026-04-20** (Quality Assessment Improvement 4 Marketplace flip). `ChangePlan` / `ChangeQuantity` webhooks call `sp_Billing_ChangePlan` / `sp_Billing_ChangeQuantity` and return **HTTP 200** with the row mutated. Set to `false` only as a documented rollback (no redeploy needed via App Configuration override) — see § **Marketplace GA rollback** below. When `false`, the same two webhooks return **HTTP 202** with `AcknowledgedNoOp` and do **not** mutate `dbo.BillingSubscriptions`. The `false` branch is preserved precisely so operators can roll back without code changes.
   - `Billing:AzureMarketplace:MarketplaceOfferId` — Partner Center **offer / product** id (`<<OFFER_ID>>` until owner fills § Publisher identity above). **Production** requires this when `GaEnabled=true` (startup guard in `BillingProductionSafetyRules`).
5. **Managed identity**
   - Grant the API’s user-assigned or system MI permission to call Marketplace fulfillment APIs per Microsoft guidance.

## Webhook actions (implemented subset)

| Marketplace `action` | ArchLucid behavior |
|----------------------|--------------------|
| `Subscribe` / `Purchase` | Optional HTTP **activate** (when enabled) + `TenantTrialConverted` path |
| `Suspend` | `sp_Billing_Suspend` |
| `Reinstate` | `sp_Billing_Reinstate` |
| `Unsubscribe` | `sp_Billing_Cancel` |
| `ChangePlan` | **Default (`GaEnabled=true`):** `sp_Billing_ChangePlan` updates `Tier` from `planId` (substring map: `enterprise` → `Enterprise`, else `Standard`); returns **HTTP 200**. **Rollback (`GaEnabled=false`):** **HTTP 202** + `AcknowledgedNoOp`, no mutation. |
| `ChangeQuantity` | **Default (`GaEnabled=true`):** `sp_Billing_ChangeQuantity` sets `SeatsPurchased` from numeric `quantity`; returns **HTTP 200**. **Rollback (`GaEnabled=false`):** **HTTP 202** + `AcknowledgedNoOp`, no mutation. |

### Example webhook (curl)

Replace `<api-host>` and use a real Microsoft-issued bearer JWT from Partner Center validation flow:

```bash
curl -sS -X POST "https://<api-host>/v1/billing/webhooks/marketplace" \
  -H "Authorization: Bearer <marketplace_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"action":"ChangePlan","subscriptionId":"<saas_subscription_id>","planId":"contoso-enterprise","purchaser":{"tenantId":"<archlucid_tenant_guid>"}}'
```

Expect **HTTP 200** under the default (`GaEnabled=true`) when the subscription row exists. Expect **HTTP 202** only after an explicit rollback flip — see § **Marketplace GA rollback** below.

## Marketplace GA rollback (`ChangePlan` / `ChangeQuantity`)

**Audience:** SRE / on-call billing engineer.

**When to use:** A `ChangePlan` or `ChangeQuantity` webhook from Azure Marketplace has misbehaved (mis-mapped tier, wrong seat count, unexpected mutation), and you need to **stop further mutations** while you investigate. The `false` branch is **deliberately preserved** as the supported rollback path (see [`CHANGELOG.md`](../CHANGELOG.md) 2026-04-20 Marketplace GA flip).

**Related implementation:** [`BILLING.md`](../library/BILLING.md), [`architecture/adrs/0016-billing-provider-abstraction.md`](../architecture/adrs/0016-billing-provider-abstraction.md), migration **086** (`086_Billing_MarketplaceChangePlanQuantity.sql`), [`BILLING_WEBHOOK_REPLAY_GUARD.md`](../runbooks/BILLING_WEBHOOK_REPLAY_GUARD.md).

### First 5 minutes (copy-paste)

1. **Confirm the symptom.** Prefer **`dbo.BillingWebhookEvents`** (SQL below). If your deployment emits App Insights custom events or Prometheus counters for Marketplace webhooks, use those as a secondary signal.

2. **Flip `Billing:AzureMarketplace:GaEnabled` to `false`** (no redeploy required) at the App Configuration / appsettings overlay layer. The provider reloads via `IOptionsMonitor<BillingOptions>`:

   - **Azure App Configuration (preferred):** set `ArchLucid:Billing:AzureMarketplace:GaEnabled` to `false` (typically &lt; 60 s via `Sentinel`/cache expiry).
   - **Container Apps env override:** add `Billing__AzureMarketplace__GaEnabled=false` to the API revision's environment variables.
   - **Local / non-prod:** `appsettings.Development.json` or `--Billing:AzureMarketplace:GaEnabled=false` on the CLI.

3. **Verify the flip** with the example webhook curl above (or Partner Center resend). Expect **HTTP 202** with `AcknowledgedNoOp` in `dbo.BillingWebhookEvents` instead of **HTTP 200** + `Processed`.

4. **Page the on-call billing engineer** for post-incident analysis, data-fix, and re-enable timing.

### Architecture overview

**Nodes:** Azure Marketplace → `POST /v1/billing/webhooks/marketplace` → `AzureMarketplaceBillingProvider.HandleWebhookAsync` → `MarketplaceChange{Plan,Quantity}WebhookMutationHandler` → `IBillingLedger.{ChangePlanAsync, ChangeQuantityAsync}` → `dbo.sp_Billing_ChangePlan` / `dbo.sp_Billing_ChangeQuantity` → `dbo.BillingSubscriptions`.

**Edges:**

- **GA path (`GaEnabled=true`, default):** webhook → handler → ledger → stored procedure → row mutated → integration envelope published when configured.
- **Rollback path (`GaEnabled=false`):** handler returns `DeferredGaDisabled` → provider records `AcknowledgedNoOp` on `dbo.BillingWebhookEvents` → **HTTP 202** → **no** row mutation.

Handlers inspect `IOptionsMonitor<BillingOptions>.CurrentValue.AzureMarketplace.GaEnabled` on every call, so the flag flip propagates without a process restart.

### Component breakdown

| Component | Role |
|-----------|------|
| `Billing:AzureMarketplace:GaEnabled` | The single switch. `true` = mutate; `false` = `AcknowledgedNoOp`. |
| `MarketplaceChangePlanWebhookMutationHandler` | Maps `planId` → tier code; calls `IBillingLedger.ChangePlanAsync` only when GA is on. |
| `MarketplaceChangeQuantityWebhookMutationHandler` | Reads `quantity`; calls `IBillingLedger.ChangeQuantityAsync` only when GA is on. |
| `AzureMarketplaceBillingProvider` | Owns `AcknowledgedNoOp` vs `Processed` on `dbo.BillingWebhookEvents`. |
| `dbo.BillingWebhookEvents` (PK `EventId`) | Idempotency log; `EventId` = `{subscriptionId}|{action}|{payloadHash}`. |
| `dbo.sp_Billing_ChangePlan` / `dbo.sp_Billing_ChangeQuantity` | Only paths that mutate `dbo.BillingSubscriptions` (**EXECUTE AS OWNER**). |

### Data flow during rollback

1. Operator flips `GaEnabled=false`.
2. Within ~60 s, `IOptionsMonitor<BillingOptions>` reflects the new value.
3. The next `ChangePlan` / `ChangeQuantity` webhook is acknowledged with HTTP 202 and recorded as `AcknowledgedNoOp`.
4. `Subscribe`, `Suspend`, `Reinstate`, `Unsubscribe` are **unaffected**.
5. Operator chooses: (a) gated re-process from ledger after fix, (b) manual `sp_Billing_*` reconciliation, or (c) re-enable GA and let the next legitimate webhook overwrite.

### Investigate recent webhooks (SQL)

`EventId` is the dedupe key (`{subscriptionId}|{action}|{payloadHash}`). `EventType` stores the Marketplace `action` string.

```sql
SELECT TOP 50
    EventId,
    EventType,
    ResultStatus,
    ReceivedUtc,
    ProcessedUtc
FROM dbo.BillingWebhookEvents
WHERE Provider = N'AzureMarketplace'
  AND EventType IN (N'ChangePlan', N'ChangeQuantity')
  AND ReceivedUtc >= DATEADD(hour, -2, SYSUTCDATETIME())
ORDER BY ReceivedUtc DESC;
```

### Re-process a webhook (gated)

1. Read `PayloadJson` from `dbo.BillingWebhookEvents` for the target `EventId`.
2. POST it back to `/v1/billing/webhooks/marketplace` with a valid Marketplace JWT (Partner Center **Resend webhook** is often easier).
3. If `ResultStatus` is already **`Processed`**, the handler returns a replay no-op — correct behavior. To **force** re-processing, update `ResultStatus` to a non-`Processed` value (e.g. `Replaying`) with **DB owner credentials** before resend.

Do **not** delete rows from `dbo.BillingWebhookEvents` — audit trail is SOC 2 evidence.

### Reconcile tier / seats after a mis-map

**ChangePlan** (correct tier):

```sql
EXEC dbo.sp_Billing_ChangePlan
    @TenantId = @TenantId,
    @TierCode = N'Standard',
    @RawBody  = N'{"manualReconciliation":true,"originalEventId":"<EventId>"}';
```

**ChangeQuantity** (correct seats):

```sql
EXEC dbo.sp_Billing_ChangeQuantity
    @TenantId       = @TenantId,
    @SeatsPurchased = 12,
    @RawBody        = N'{"manualReconciliation":true,"originalEventId":"<EventId>"}';
```

### Confirm the rollback held

Five minutes after the flip, re-run the SQL query above. New `ChangePlan` / `ChangeQuantity` rows should show **`AcknowledgedNoOp`**, not **`Processed`**. If **`Processed`** still appears, the flag has not reached the running revision — re-check App Configuration / Container Apps env and `az containerapp revision list`.

### When to re-enable GA

After the root cause is fixed, re-enable in the **reverse** order of the flip: appsettings/CLI → env override → App Configuration. Spot-check with the example webhook curl before stepping away.

### Operational considerations

- **No schema changes** required — configuration flip only.
- **No data loss** — `AcknowledgedNoOp` rows retain webhook history; subscriptions are unchanged by rollback acknowledgements.
- **Stripe is unaffected** — this flag gates Marketplace mutation handlers only.
- **Tests:** `MarketplaceChangePlanWebhookMutationHandlerTests` and `MarketplaceChangeQuantityWebhookMutationHandlerTests` cover both `GaEnabled` branches.

### First-5-minutes summary

| Action | Where | Expected outcome |
|--------|-------|------------------|
| Set `Billing:AzureMarketplace:GaEnabled=false` | App Configuration / Container Apps env / appsettings | New config (~60s); next `ChangePlan`/`ChangeQuantity` → HTTP 202 |
| Smoke test webhook | Example curl above | HTTP 202, `AcknowledgedNoOp` in SQL ledger |
| Query `dbo.BillingWebhookEvents` | SSMS / sqlcmd | Recent rows show `AcknowledgedNoOp` for the two actions |
| Page on-call billing engineer | Pager / chat | Triage and data-fix path |

## Related

- [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) — item **8** (Marketplace publication go-live)
- [`BILLING.md`](../library/BILLING.md)
- [`BILLING_WEBHOOK_REPLAY_GUARD.md`](../runbooks/BILLING_WEBHOOK_REPLAY_GUARD.md) — signature/JWT + replay layers
- [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) — `Billing:AzureMarketplace:*` keys
- [`STRIPE_CHECKOUT.md`](STRIPE_CHECKOUT.md#webhook-incident-triage) — parallel Stripe webhook incident triage
- [`FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER.md`](../runbooks/FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER.md)
- [`architecture/adrs/0016-billing-provider-abstraction.md`](../architecture/adrs/0016-billing-provider-abstraction.md)
- [`redirects.md`](../redirects.md) — former doc paths

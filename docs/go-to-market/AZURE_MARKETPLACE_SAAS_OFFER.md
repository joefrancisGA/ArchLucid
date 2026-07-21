> **Scope:** Azure Marketplace — SaaS offer (fulfillment v2) checklist, publisher identity placeholders, webhook behavior, and ArchLucid configuration.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Azure Marketplace — SaaS offer (fulfillment v2) checklist

**Last reviewed:** 2026-07-21

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
   - `Billing:AzureMarketplace:GaEnabled` — **default `true` since 2026-04-20** (Quality Assessment Improvement 4 Marketplace flip). `ChangePlan` / `ChangeQuantity` webhooks call `sp_Billing_ChangePlan` / `sp_Billing_ChangeQuantity` and return **HTTP 200** with the row mutated. Set to `false` only as a documented rollback (no redeploy needed via App Configuration override) — see [`runbooks/MARKETPLACE_CHANGEPLAN_QUANTITY_ROLLBACK.md`](../runbooks/MARKETPLACE_CHANGEPLAN_QUANTITY_ROLLBACK.md). When `false`, the same two webhooks return **HTTP 202** with `AcknowledgedNoOp` and do **not** mutate `dbo.BillingSubscriptions`. The `false` branch is preserved precisely so operators can roll back without code changes.
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

Expect **HTTP 200** under the new default (`GaEnabled=true`) when the subscription row exists. Expect **HTTP 202** only after an explicit rollback flip — see [`runbooks/MARKETPLACE_CHANGEPLAN_QUANTITY_ROLLBACK.md`](../runbooks/MARKETPLACE_CHANGEPLAN_QUANTITY_ROLLBACK.md).

## Related

- [`MARKETPLACE_PUBLICATION.md`](MARKETPLACE_PUBLICATION.md) — publication checklist (GTM steps, region, owner blockers)
- [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) — item **8** (Marketplace publication go-live)
- [`BILLING.md`](../library/BILLING.md)
- [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) — `Billing:AzureMarketplace:*` keys
- [`STRIPE_CHECKOUT.md`](STRIPE_CHECKOUT.md#statement-descriptor) — parallel Stripe commercial identity
- [`FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER.md`](../runbooks/FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER.md)
- [`architecture/adrs/0016-billing-provider-abstraction.md`](../architecture/adrs/0016-billing-provider-abstraction.md)
- [`runbooks/MARKETPLACE_CHANGEPLAN_QUANTITY_ROLLBACK.md`](../runbooks/MARKETPLACE_CHANGEPLAN_QUANTITY_ROLLBACK.md) — rollback procedure for the `GaEnabled=true` default.
- [`redirects.md`](../redirects.md) — former doc paths

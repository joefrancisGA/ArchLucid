> **Reviewed:** 2026-07-25

> **Scope:** Stripe Checkout for Team tier — engineering hand-off, operator configuration checklist, marketing site + live Stripe GA, webhook incident triage, and staging verification.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Stripe Checkout — Team tier (hosted)

**Last reviewed:** 2026-07-25

## Goal

Provide a **low-friction conversion path** from self-serve trial to paid Team tier using **Stripe Checkout**, in parallel with Azure Marketplace SaaS.

Independent assessments that cite missing **live Stripe**, **self-serve checkout**, or **Commercial Packaging Readiness** gaps should link **§ Operator completion checklist** below so owner work stays on the same page session-to-session.

## Configuration summary

1. Populate Stripe secrets per `ArchLucid.Api` billing configuration (`Billing:Stripe:*` in Key Vault / environment).
2. Create or select a Stripe **Product**/**Price** for Team with the recurring USD amount recorded in **`PRICING_PHILOSOPHY.md` § 3.2**, and bind it to **`Billing:Stripe:PriceIdTeam`**.
3. Set `teamStripeCheckoutUrl` in `archlucid-ui/public/pricing.json` to the Stripe **Payment Link** or **Checkout Session** URL once issued.
4. Optional: continue using **`POST /v1/tenant/billing/checkout`** (`BillingCheckoutController`) for API-driven checkout when `Billing:Provider` selects Stripe.

---

## Operator completion checklist

**Canonical monthly amount** for interim Team Checkout: [`PRICING_PHILOSOPHY.md` § 3.2](PRICING_PHILOSOPHY.md#32-interim-stripe-team-self-serve-bundled-sku).

**Stripe Dashboard — Test vs Live.** Keys (`sk_test_…` / `sk_live_…`), **Price IDs** (`price_…`), and **webhook signing secrets** (`whsec_…`) are **mode-isolated**. Staging stays on **TEST** until you consciously cut over production.

Copy this checklist into tickets or strike items as you go.

**Synced to assessments (2026-05-01).** Narrative updates in **`QUALITY_ASSESSMENT_*_INDEPENDENT_*`** assume you completed § **A** (Product + recurring Price + **`price_…`**) and injected **`Billing:Stripe:PriceIdTeam`** in at least one secrets store. **Re-verify each environment** — unchecked items below remain legally authoritative until you confirm.

### A. Stripe account (Product Catalog)

- [ ] **Team Product** created with buyer-facing **name/description**.
- [ ] **Recurring monthly Price** in **USD** matching **§ 3.2** (bundled Team SKU — amount and seat cap documented in `PRICING_PHILOSOPHY.md`; no grandfather policy exists per the 2026-07-29 **M-200** pre-launch decision).
- [ ] **`price_…` id** captured (not **`prod_…`**).

### B. API configuration (ArchLucid.Api)

- [ ] **`Billing:Provider`** = **`Stripe`** on hosts that should charge (staging/production intent — local **Development** often stays **`Noop`**).
- [ ] **`Billing:Stripe:SecretKey`** (`sk_test_…` or `sk_live_…`) in Key Vault / env / secrets store — never commit.
- [ ] **`Billing:Stripe:PriceIdTeam`** = your Team **`price_…`** (`Billing__Stripe__PriceIdTeam` as env override).
- [ ] **`Billing:Stripe:WebhookSigningSecret`** = **`whsec_…`** from the **matching** Stripe webhook endpoint (same Test/Live mode as the secret key). **Production:** `sk_live_` pairing is enforced by startup safety rules — see [`BILLING.md`](../library/BILLING.md).
- [ ] **`Billing:Stripe:PublishableKey`** only if something in your stack needs **`pk_…`** server-side reference (many hosted-Checkout flows do not).

### C. Stripe webhooks

- [ ] **Endpoint URL** registered: `https://<public-api-host>/v1/billing/webhooks/stripe/subscriptions` for checkout/subscription events (wallet route: `/v1/billing/webhooks/stripe` for `payment_intent.*`).
- [ ] **Events:** subscribe at minimum to **`checkout.session.completed`** (implementation activates paid state from this today).
- [ ] After deploy, confirm Dashboard **delivery** succeeds (HTTP **2xx**).

### D. Buyer journey verification

- [ ] **Staging E2E** (recommended before live): § **Staging end-to-end verification** below (command-level sequence, SQL, Stripe CLI).
- [ ] After a real test Checkout: **`dbo.BillingWebhookEvents`**, **`dbo.BillingSubscriptions`**, and tenant trial-conversion audits per [`BILLING.md`](../library/BILLING.md).
- [ ] Optional smoke: **`archlucid trial smoke`** / nightly trial-funnel workflows as in [`TRIAL_FUNNEL_END_TO_END.md`](../runbooks/TRIAL_FUNNEL_END_TO_END.md).

### E. Marketing UX (`pricing.json` → Team “Subscribe with Stripe”)

The UI hides **Subscribe with Stripe** until `teamStripeCheckoutUrl` is non-empty **and** not a placeholder (`placeholder-replace-before-launch` / `checkout-placeholder` are rejected in `archlucid-ui/src/lib/team-stripe-checkout-url.ts`).

**Do not invent URLs.** Create one hosted buyer URL in Stripe Dashboard that sells the **same** recurring **`price_…`** as **`Billing:Stripe:PriceIdTeam`** (§ B), then paste it into JSON.

**Option 1 — Payment Link (simplest stable URL)**

1. Stripe Dashboard → **Product catalog** → select the Team Product → **Create payment link** (or **Payment Links** in the left nav → **New**).
2. Attach the **monthly USD Price** whose id matches **`Billing:Stripe:PriceIdTeam`**.
3. Publish and copy the hosted link — it normally starts with **`https://buy.stripe.com/`**.
4. Set **`teamStripeCheckoutUrl`** in **`archlucid-ui/public/pricing.json`** to that exact string (trimmed, no trailing junk).

**Option 2 — Checkout deep link**

If your process uses Checkout Session URLs copied from Dashboard/tests, ensure the final buyer-facing URL starts with **`https://checkout.stripe.com/`** (or redirects there). Paste that URL into **`teamStripeCheckoutUrl`**.

**Verification**

- [ ] **`teamStripeCheckoutUrl`** updated in **`archlucid-ui/public/pricing.json`** (still valid JSON; run `npm run test` / Vitest pricing fixtures if you touch generators).
- [ ] **`npm run build`** (or CI) — marketing **`/pricing`** shows **Subscribe with Stripe** on the Team card.
- [ ] Playwright: **`npx playwright test live-api-marketing-pricing-stripe-checkout.spec.ts`** (live stack) — opens Stripe host in a new tab when configured; with placeholder URL the link stays hidden (see spec comments).

### F. Production cutover (owner calendar)

- [ ] **`PENDING_QUESTIONS.md`** item **22** (Marketplace + Stripe live calendar) plus item **9** sub-bullets when choosing **live** keys.
- [ ] Incident triage bookmarked: § **Webhook incident triage** below (symptom map, signing-secret rotation).

---

## Webhooks

`BillingStripeWebhookController` receives Stripe events — configure **public HTTPS** endpoints and signing secrets per environment (see [`BILLING.md`](../library/BILLING.md)).

| Route | Events (today) | Signing secret config |
|-------|----------------|----------------------|
| `POST /v1/billing/webhooks/stripe` | Wallet `payment_intent.*` | `Billing:Stripe:WalletWebhookSigningSecret` or fallback `Billing:Stripe:WebhookSigningSecret` |
| `POST /v1/billing/webhooks/stripe/subscriptions` | `checkout.session.completed`, subscription lifecycle | `Billing:Stripe:SubscriptionWebhookSigningSecret` or fallback `Billing:Stripe:WebhookSigningSecret` |

- **Verification:** `Stripe-Signature` header + matching `whsec_…` (300s clock skew tolerance).
- **Rejections:** invalid signature, replay, or unhandled event type on the route → **HTTP 400** (fail-closed). Success → **HTTP 200**.
- **Replay / idempotency:** [`BILLING_WEBHOOK_REPLAY_GUARD.md`](../runbooks/BILLING_WEBHOOK_REPLAY_GUARD.md).

### Statement descriptor

The Stripe **statement descriptor prefix** is locked to **`ARCHLUCID PLATFORM`** (18 characters, within Stripe’s 22-character limit). Configure it as the **prefix** under Stripe Dashboard → **Settings** → **Public details** → **Statement descriptor**. ArchLucid v1 does **not** rely on a per-charge dynamic suffix; leave suffix behavior at Stripe defaults unless product explicitly adopts one later.

## Webhook incident triage

Sibling provider rollback pattern: [`AZURE_MARKETPLACE_SAAS_OFFER.md`](AZURE_MARKETPLACE_SAAS_OFFER.md#marketplace-ga-rollback-changeplan--changequantity) (`Billing:AzureMarketplace:GaEnabled` — **Marketplace only**; Stripe has no GA flag).

### Symptom map

| Symptom | First check |
|---------|-------------|
| Stripe dashboard shows webhook deliveries failing with HTTP **400** | Signing-secret mismatch, replay window exceeded, body mutation, or event type not handled on that route — see [`BILLING_WEBHOOK_REPLAY_GUARD.md`](../runbooks/BILLING_WEBHOOK_REPLAY_GUARD.md). |
| Stripe shows HTTP **200** but no row mutation in `dbo.BillingSubscriptions` | Wrong webhook route (checkout events must hit **`/stripe/subscriptions`**), unhandled event type, missing `tenant_id` / `workspace_id` / `project_id` metadata, prior **`Failed`** row in `dbo.BillingWebhookEvents`, or webhook delivered to wrong environment. |
| Stripe shows HTTP **400** with replay detail | Stripe redelivered an event within the replay window or SQL ledger already has **`Processed`** — usually safe to ignore if subscription state is correct. |
| Charge succeeded in Stripe but tenant tier did not change | Webhook delivered to stale environment, checkout registered on wallet route instead of subscriptions route, or session metadata missing **`tenant_id`**. |

### Triage steps (15 minutes)

1. **Confirm scope.** In the Stripe dashboard, filter webhook attempts to ArchLucid in the last hour. If failures are &lt;1% of attempts, treat as transient and watch.
2. **Check SQL ledger.** `dbo.BillingWebhookEvents` for the Stripe `evt_…` — `ResultStatus` **`Processed`**, **`Failed`**, or absent. See [`BILLING_WEBHOOK_REPLAY_GUARD.md`](../runbooks/BILLING_WEBHOOK_REPLAY_GUARD.md) for replay vs signature layers.
3. **Check Application Insights / Log Analytics** for `BillingStripeWebhookController` / `StripeBillingProvider` traces around the delivery timestamp (problem details on **400** responses).
4. **Confirm route registration.** Checkout and subscription lifecycle events must target **`POST /v1/billing/webhooks/stripe/subscriptions`**. Wallet top-ups use **`POST /v1/billing/webhooks/stripe`**.
5. **Check signing-secret hygiene.** Rotation cadence = **platform billing owner (LLC officer role)**, **quarterly + on-incident**. **On-incident** triggers: any **failed webhook delivery sequence after deploy**; any **suspected secret leak**. If either trigger fires, rotate immediately per § Rotation below. Record each rotation in **`Billing:Stripe:WebhookSigningSecretRotatedUtc`** and in **`docs/CHANGELOG.md`** under `## YYYY-MM-DD — Stripe webhook secret rotated` (append-only audit). Broader rotation context: [`SECRET_AND_CERT_ROTATION.md`](../runbooks/SECRET_AND_CERT_ROTATION.md).

### Rotation (signing secret)

**Cadence reminder:** platform billing owner (LLC officer role), quarterly + on-incident; record `Billing:Stripe:WebhookSigningSecretRotatedUtc` + `CHANGELOG` heading on every rotation.

1. In Stripe dashboard, **Roll** the endpoint signing secret. Stripe accepts both old and new for 24 hours.
2. Update the matching secret in Key Vault (`Billing:Stripe:WebhookSigningSecret` and/or route-specific overrides) — do **not** commit.
3. Trigger a Container Apps revision redeploy or wait for the in-process secret refresh interval (default 5 minutes).
4. In Stripe dashboard, **Resend** any failed events from the rotation window.
5. Update `Billing:Stripe:WebhookSigningSecretRotatedUtc` in App Configuration (or the equivalent tracked store).

### Manual replay (after a fix)

The endpoint is **idempotent** by Stripe's `event.id`. Resending a previously-failed event is safe:

```text
Stripe dashboard: Developers → Events → <event id> → Resend
```

If `ResultStatus` is **`Failed`**, fix the root cause before resend; investigate ledger state per [`BILLING_WEBHOOK_REPLAY_GUARD.md`](../runbooks/BILLING_WEBHOOK_REPLAY_GUARD.md).

### When to engage product

- Repeated **`Failed`** webhook rows for **`checkout.session.completed`** with valid signatures: checkout metadata wiring or tier mapping may be wrong — only product can decide which subscriptions to backfill.
- Any signature failures **after** a confirmed-clean rotation on the correct route: possible attempted replay attack — page security per [`docs/security/SYSTEM_THREAT_MODEL.md`](../security/SYSTEM_THREAT_MODEL.md).

## Staging end-to-end verification (Stripe TEST mode)

**Objective:** An operator with **no code changes** can wire, exercise, and verify Stripe Test mode + ArchLucid staging: checkout session, webhook, SQL ledger, and tenant conversion.

Use this path **before** live keys exist: Stripe Dashboard in **Test mode**, ArchLucid API configured with **`sk_test_…`** and a **test** webhook signing secret, and marketing signup pointing at the staging API + UI.

### Code references

| Item | Location |
|------|----------|
| Checkout API (Admin) | `ArchLucid.Api/Controllers/Billing/BillingCheckoutController.cs` — `POST` **`/v1/tenant/billing/checkout`**, policy **`AdminAuthority`**, model **`BillingCheckoutPostRequest`** |
| Webhook (subscriptions) | `ArchLucid.Api/Controllers/Billing/BillingStripeWebhookController.cs` — `POST` **`/v1/billing/webhooks/stripe/subscriptions`**, `AllowAnonymous`, signature inside `StripeBillingProvider` |
| Webhook (wallet) | Same controller — `POST` **`/v1/billing/webhooks/stripe`** for `payment_intent.*` |
| Provider logic | `ArchLucid.Persistence/Billing/Stripe/StripeBillingProvider.cs` — activation on **`checkout.session.completed`** only |
| Billing data model | [`BILLING.md`](../library/BILLING.md) — `dbo.BillingSubscriptions`, `dbo.BillingWebhookEvents` |
| UI pricing (optional CTA) | `archlucid-ui/src/lib/pricing-types.ts` — optional **`teamStripeCheckoutUrl`** on `public/pricing.json` |

**Activation event:** `HandleWebhookAsync` calls `HandleCheckoutSessionCompletedAsync` only when `stripeEvent.Type` is **`checkout.session.completed`** (case-insensitive) and `stripeEvent.Data.Object` is a **`Session`**. Other event types may be recorded as **Processed** but do **not** activate subscriptions.

**Tier mapping:** `BillingTierCode.FromCheckoutTier` maps **Team** and **Pro** to **`Standard`** in `dbo.Tenants.Tier`; **Enterprise** maps to **`Enterprise`**.

### Doc vs repo notes

| Topic | This doc | Actual code / repo |
|--------|----------|-------------------|
| Checkout method | `POST /v1/tenant/billing/checkout` | Requires **JWT** + **`AdminAuthority`**, not anonymous |
| `pricing.json` | Set `teamStripeCheckoutUrl` when using marketing CTA | Committed **`archlucid-ui/public/pricing.json`** is packages-only; property is **optional** in TypeScript |
| Webhook events | Subscribe to **`checkout.session.completed`** minimum | Only this type drives entitlement activation today |
| Staging host | Examples use `staging.archlucid.net` | Substitute your real `<staging-api-host>` everywhere |

### Prerequisites

| # | Prerequisite | Verify |
|---|----------------|--------|
| 1 | **Stripe** account; **Test mode** ON | Dashboard shows “Test mode” |
| 2 | Staging **ArchLucid API** over **HTTPS** | `curl -fsS -o /dev/null -w "%{http_code}\n" "https://<staging-api-host>/health/live"` → **200** |
| 3 | Staging app can receive **`Billing:*`** (Key Vault / Container Apps secrets) | Portal / `az containerapp show` — settings present (redact in logs) |
| 4 | **SQL** reachable from a secure operator path | `sqlcmd` or SSMS to staging database |
| 5 | **Tenant admin** Bearer token for checkout API | Sign in to UI as Admin; or org token procedure |
| 6 | Stripe **Product** + **Price** created in Dashboard (step below) | N/A |

### Environment variables (staging)

| Setting | Value (test) |
|---------|----------------|
| `Billing:Provider` | `Stripe` |
| `Billing:Stripe:SecretKey` | `sk_test_…` |
| `Billing:Stripe:WebhookSigningSecret` | `whsec_…` from test webhook endpoint or **`stripe listen`** |
| `Billing:Stripe:PriceIdTeam` | `price_…` for Team test price |
| `Billing:Stripe:PriceIdPro` | Optional `price_…` |
| `Billing:Stripe:PriceIdEnterprise` | Optional `price_…` |
| `ASPNETCORE_ENVIRONMENT` | `Staging` (recommended) |

**Verify in Azure:**

```bash
az containerapp show -g <resource-group> -n <api-container-app-name> --query "properties.template.containers[0].env" -o table
```

Illustrative Key Vault names: `billing-stripe-secret`, `billing-stripe-webhook-signing-secret` — map to `Billing:Stripe:*` per [`BILLING.md`](../library/BILLING.md).

Production safety rules **do not** treat `sk_test_` like `sk_live_`; only **live** keys require webhook secret pairing (`BillingProductionSafetyRules`).

### Step-by-step

#### 1. Load configuration

1. Apply **Billing** settings from the table above to the **staging** API revision.
2. Restart or wait for the revision to become healthy.

```bash
curl -fsS "https://<staging-api-host>/health/ready"
```

Expect top-level **Healthy** in JSON.

#### 2. Register the Stripe **test** webhook

1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint** (**Test mode**).
2. **URL:** `https://<staging-api-host>/v1/billing/webhooks/stripe/subscriptions`
3. **Events:** at minimum **`checkout.session.completed`**.
4. Copy **Signing secret** (`whsec_…`) into `Billing:Stripe:WebhookSigningSecret`.

**Stripe CLI (local/tunnel):**

```bash
stripe listen --forward-to https://<staging-api-host>/v1/billing/webhooks/stripe/subscriptions
```

Use the CLI-printed `whsec_…` while forwarding, then:

```bash
stripe trigger checkout.session.completed
```

**Negative curl (expect non-success without valid signature):**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" -X POST "https://<staging-api-host>/v1/billing/webhooks/stripe/subscriptions" \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=0,v1=invalid" \
  -d '{"id":"evt_test_placeholder","type":"checkout.session.completed","data":{"object":{}}}'
```

A healthy deployment returns **non-2xx** for invalid signatures (fail-closed). With **Stripe CLI forwarding**, the same route returns **2xx** when Stripe signs the payload.

#### 3. Create test **Product** and **Price**

1. Dashboard → **Product catalog** → **Add product** (test mode).
2. Add a **recurring** price in **Subscription** mode (`CreateCheckoutSessionAsync` uses **`mode = subscription`**).
3. Copy **Price ID** (`price_…`) → `Billing:Stripe:PriceIdTeam`; redeploy/restart API if needed.

#### 4. (Optional) Marketing UI — `pricing.json`

1. Add **`teamStripeCheckoutUrl`** to served `public/pricing.json` (Payment Link or hosted Checkout URL in test mode).
2. Confirm `https://<staging-ui-host>/pricing.json` exposes the property when using the marketing CTA.

#### 5. Admin checkout API call

`BillingCheckoutController` requires **`AdminAuthority`**. Body: `targetTier` (`Team` / `Pro` / `Enterprise`), `returnUrl`, `cancelUrl`, optional `seats`, `workspaces`, `billingEmail`.

**Browser:** Use **Convert to paid** in the architect workspace ([`operator-shell.md`](../library/operator-shell.md)); capture **`POST /v1/tenant/billing/checkout`** in DevTools if needed.

**curl** (`export JWT='<your token>'` first):

```bash
curl -sS -X POST "https://<staging-api-host>/v1/tenant/billing/checkout" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: <tenant-guid>" \
  -H "X-Workspace-Id: <workspace-guid>" \
  -H "X-Project-Id: <project-guid>" \
  -d "{\"targetTier\":\"Team\",\"returnUrl\":\"https://<staging-ui-host>/welcome\",\"cancelUrl\":\"https://<staging-ui-host>/pricing\",\"seats\":1,\"workspaces\":1}"
```

**Response (200):** `checkoutUrl`, `providerSessionId`, optional `expiresUtc`. Open `checkoutUrl`; pay with test card **`4242 4242 4242 4242`**.

**Conflict:** `409` if tenant already has **Active** subscription (`IBillingLedger.TenantHasActiveSubscriptionAsync`).

**CLI smoke (optional):**

```bash
archlucid trial smoke --org "StripeStagingSmoke" --email "you+smoke@example.invalid" --api-base-url "https://<staging-api-host>"
```

#### 6. Buyer journey on staging UI

1. Open `https://staging.archlucid.net/signup` (or current staging hostname).
2. Complete trial signup; trigger **Team** conversion via `pricing.json` CTA or checkout API above.
3. After Checkout, Stripe posts **`checkout.session.completed`**; provider validates signature, idempotency-inserts `dbo.BillingWebhookEvents`, activates subscription.

### Routes quick reference

| Action | Method | Path | Auth |
|--------|--------|------|------|
| Create Checkout Session | `POST` | `/v1/tenant/billing/checkout` | **Bearer** + **AdminAuthority** + tenant scope |
| Stripe webhook (subscriptions) | `POST` | `/v1/billing/webhooks/stripe/subscriptions` | **Anonymous** — **`Stripe-Signature`** + body |
| Stripe webhook (wallet) | `POST` | `/v1/billing/webhooks/stripe` | **Anonymous** — **`Stripe-Signature`** + body |

### SQL verification

Replace **`@TenantId`** with your test tenant `uniqueidentifier`. Use an account that can read RLS-protected `dbo.BillingSubscriptions`.

**Recent webhook events:**

```sql
SELECT TOP 30
    EventId,
    EventType,
    ResultStatus,
    ReceivedUtc,
    ProcessedUtc
FROM dbo.BillingWebhookEvents
WHERE Provider = N'Stripe'
ORDER BY ReceivedUtc DESC;
```

**Expected:** row for Stripe `evt_…`, `EventType = 'checkout.session.completed'`, `ResultStatus = 'Processed'`.

**Subscription for tenant:**

```sql
SELECT
    TenantId,
    WorkspaceId,
    ProjectId,
    Provider,
    ProviderSubscriptionId,
    Tier,
    Status,
    SeatsPurchased,
    WorkspacesPurchased,
    ActivatedUtc,
    CreatedUtc,
    UpdatedUtc
FROM dbo.BillingSubscriptions
WHERE TenantId = @TenantId;
```

**Expected:** `Status = 'Active'`, `Provider = 'Stripe'`, `ActivatedUtc` set.

**Tenant tier:**

```sql
SELECT Id, Tier
FROM dbo.Tenants
WHERE Id = @TenantId;
```

**Expected:** **`Standard`** for Team/Pro, **`Enterprise`** for Enterprise checkout tier.

**Audit stream (optional):**

```sql
SELECT TOP 20
    OccurredUtc,
    EventType,
    ActorUserId,
    DataJson
FROM dbo.AuditEvents
WHERE TenantId = @TenantId
  AND EventType IN (N'BillingCheckoutInitiated', N'BillingCheckoutCompleted', N'TenantTrialConverted')
ORDER BY OccurredUtc DESC;
```

### Funnel metrics (optional)

Prometheus: **`archlucid_billing_checkouts_total`**, trial conversion series — see [`TRIAL_FUNNEL.md`](../runbooks/TRIAL_FUNNEL.md). Not required for a single E2E pass if SQL and Stripe Dashboard agree.

### Rollback / resetting test state

1. **Stripe (Test mode):** Cancel test subscription/customer in Dashboard — does not automatically revert ArchLucid SQL.
2. **Repeat checkout on same tenant:** API blocks when `dbo.BillingSubscriptions.Status = 'Active'`. To re-test, clear **Active** in **staging only** via approved change process (`dbo.sp_Billing_*` per [`BILLING.md`](../library/BILLING.md)) — prefer a **new test tenant** when possible.
3. **Idempotent webhooks:** Duplicate `EventId` hits dedupe; replays return **200** without double activation if already **Processed**.
4. **Secrets rotation:** Update `Billing:Stripe:WebhookSigningSecret` before next event or signatures **fail** (400).

See also [`TRIAL_FUNNEL_END_TO_END.md`](../runbooks/TRIAL_FUNNEL_END_TO_END.md).

---

## Marketing site + Stripe GA (public go-live)

Tracks **Marketability Improvement 2** — public marketing go-live and Stripe self-serve paid conversion. Assumes Azure-first deployment and private storage boundaries (no SMB port **445** exposure). Complete § **Staging end-to-end verification** in **TEST** mode before live cutover.

### Objective

Ship **`archlucid-ui`** marketing routes (`(marketing)/welcome`, `(marketing)/signup`, …) behind **Azure Front Door** with a custom domain, and operate **Stripe Checkout** + webhooks in **live** mode with idempotent SQL persistence ([`BILLING.md`](../library/BILLING.md), migration **078**).

### Assumptions

- Terraform modules under `infra/terraform-edge/` (Front Door + WAF) and application hosting (Container Apps or Static Web Apps) are provisioned for non-prod.
- Stripe **live** keys and webhook signing secrets live in **Key Vault**, not in repo configuration.
- CI uses **non-credential-shaped** placeholders for Stripe (see `.github/copilot-instructions.md` gitleaks guidance).

### Architecture

**Nodes:** Public DNS → Front Door → Static Web Apps or Container Apps (UI) | `ArchLucid.Api` (checkout + webhooks) → `dbo.BillingSubscriptions` / `dbo.BillingWebhookEvents`.

**Edges:** Browser → marketing pages → signup → tenant bootstrap → operator converts via Checkout URL → Stripe → webhook → `sp_Billing_*` → trial conversion.

| Area | Responsibility |
|------|----------------|
| `archlucid-ui` `(marketing)/*` | Signup + verification flows |
| `infra/terraform-edge/frontdoor.tf` | TLS, WAF, routing to origin |
| `ArchLucid.Api` `BillingCheckoutController` / `BillingStripeWebhookController` | Checkout + webhook surface |
| `ArchLucid.Persistence.Billing.Stripe` | Signature verification + ledger writes |

### Go-live sequence

1. Register DNS + Front Door endpoint; attach custom domain and managed certificate.
2. Deploy UI artifact to the origin (SWA `az staticwebapp` or ACA revision) with environment-specific API base URL.
3. In Stripe Dashboard (**Live** mode): enable products/prices aligned with `pricing.json`; register webhook URL `https://<api-host>/v1/billing/webhooks/stripe/subscriptions` (checkout events); copy **signing secret** to Key Vault `billing-stripe-webhook-signing-secret`.
4. Rotate any `sk_test_…` literals out of automation; use CI-safe placeholders in tests only.
5. Publish `sitemap.xml` from the marketing app once the domain is live (Search Console).

### Security and operations

- **Webhooks:** trust-on-crypto only — `Stripe-Signature` verified before any tenant mutation. Production requires `Billing:Provider=Stripe` plus validated secrets (`ProductionSafetyRules.CollectBillingStripeSecret`).
- **Front Door:** WAF enabled; rate-limit anonymous marketing routes at the edge where possible.
- **Secrets:** Stripe secrets never logged; webhook payloads are not echoed to application logs. Runtime identity reads Key Vault via managed identity.
- **Smoke:** `POST /v1/tenant/billing/checkout` in staging with Stripe **test** mode before flipping DNS to production.
- **Monitor:** `dbo.BillingWebhookEvents` for `Failed` rows and Stripe Dashboard delivery retries after deploys — § **Webhook incident triage** above.

## Manual provisioning (until Marketplace GA settles)

If webhooks only flip entitlement bits asynchronously, document the **manual runbook** for support to confirm `dbo.Tenants.Tier` after payment (link internal ops doc when available).

## Related

| Doc | Use |
|-----|-----|
| [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) | Team bundled SKU amount and seat cap (§ 3.2) |
| [`TRIAL_AND_SIGNUP.md`](TRIAL_AND_SIGNUP.md) | Trial → conversion product design |
| [`BILLING.md`](../library/BILLING.md) | Architecture, webhook route, SQL tables |
| [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) | `Billing:Stripe:*` keys |
| [`BILLING_WEBHOOK_REPLAY_GUARD.md`](../runbooks/BILLING_WEBHOOK_REPLAY_GUARD.md) | Replay guard, SQL ledger investigation |
| [`SECRET_AND_CERT_ROTATION.md`](../runbooks/SECRET_AND_CERT_ROTATION.md) | Broader secret rotation posture |
| [`PRODUCTION_DEPLOYMENT.md`](../runbooks/PRODUCTION_DEPLOYMENT.md) | Hosted staging deployment checks |
| [`TRIAL_FUNNEL_END_TO_END.md`](../runbooks/TRIAL_FUNNEL_END_TO_END.md) | Trial funnel validation before GA |
| [`redirects.md`](../redirects.md) | Former doc paths |

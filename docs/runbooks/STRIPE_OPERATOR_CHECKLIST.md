> **Scope:** Operator checklist to finish Stripe self-serve (Team tier). Code paths exist (`StripeBillingProvider`, `BillingStripeWebhookController`); this list is configuration + verification.

# Stripe integration — operator completion checklist

**Canonical monthly amount** for interim Team Checkout: [`PRICING_PHILOSOPHY.md` § 3.2](../go-to-market/PRICING_PHILOSOPHY.md#32-interim-stripe-team-self-serve-bundled-sku).

**Stripe Dashboard — Test vs Live.** Keys (`sk_test_…` / `sk_live_…`), **Price IDs** (`price_…`), and **webhook signing secrets** (`whsec_…`) are **mode-isolated**. Staging stays on **TEST** until you consciously cut over production.

Copy this checklist into tickets or strike items as you go.

**Synced to assessments (2026-05-01).** Narrative updates in **`QUALITY_ASSESSMENT_*_INDEPENDENT_*`** assume you completed § **A** (Product + recurring Price + **`price_…`**) and injected **`Billing:Stripe:PriceIdTeam`** in at least one secrets store. **Re-verify each environment** — unchecked items below remain legally authoritative until you confirm.

---

## A. Stripe account (Product Catalog)

- [ ] **Team Product** created with buyer-facing **name/description** — see onboarding notes under [`STRIPE_CHECKOUT.md`](../go-to-market/STRIPE_CHECKOUT.md).
- [ ] **Recurring monthly Price** in **USD** matching **§ 3.2** (bundled Team SKU — **grandfather policy** documented there).
- [ ] **`price_…` id** captured (not **`prod_…`**).

## B. API configuration (ArchLucid.Api)

- [ ] **`Billing:Provider`** = **`Stripe`** on hosts that should charge (staging/production intent — local **Development** often stays **`Noop`**).
- [ ] **`Billing:Stripe:SecretKey`** (`sk_test_…` or `sk_live_…`) in Key Vault / env / secrets store — never commit.
- [ ] **`Billing:Stripe:PriceIdTeam`** = your Team **`price_…`** (`Billing__Stripe__PriceIdTeam` as env override).
- [ ] **`Billing:Stripe:WebhookSigningSecret`** = **`whsec_…`** from the **matching** Stripe webhook endpoint (same Test/Live mode as the secret key). **Production:** `sk_live_` pairing is enforced by startup safety rules — see [`BILLING.md`](../library/BILLING.md).
- [ ] **`Billing:Stripe:PublishableKey`** only if something in your stack needs **`pk_…`** server-side reference (many hosted-Checkout flows do not).

## C. Stripe webhooks

- [ ] **Endpoint URL** registered: `https://<public-api-host>/v1/billing/webhooks/stripe` (HTTPS, reachable from Stripe).
- [ ] **Events:** subscribe at minimum to **`checkout.session.completed`** (implementation activates paid state from this today).
- [ ] After deploy, confirm Dashboard **delivery** succeeds (HTTP **2xx**).

## D. Buyer journey verification

- [ ] **Staging E2E** (recommended before live): [`STRIPE_STAGING_E2E_VERIFICATION.md`](STRIPE_STAGING_E2E_VERIFICATION.md) and [`STRIPE_CHECKOUT.md`](../go-to-market/STRIPE_CHECKOUT.md) (Stripe CLI `listen` / forward for local tunnels).
- [ ] After a real test Checkout: **`dbo.BillingWebhookEvents`**, **`dbo.BillingSubscriptions`**, and tenant trial-conversion audits per [`BILLING.md`](../library/BILLING.md).
- [ ] Optional smoke: **`archlucid trial smoke`** / nightly trial-funnel workflows as in [`TRIAL_FUNNEL_END_TO_END.md`](TRIAL_FUNNEL_END_TO_END.md).

## E. Marketing UX (optional)

- [ ] **`teamStripeCheckoutUrl`** in **`archlucid-ui/public/pricing.json`** — Stripe **Payment Link** or Checkout URL selling the **same** **`price_…`** (`generate_pricing_json.py` emits from locked block in **`PRICING_PHILOSOPHY.md`**; URL may still be pasted by hand).

## F. Production cutover (owner calendar)

- [ ] **`PENDING_QUESTIONS.md`** item **22** (Marketplace + Stripe live calendar) plus item **9** sub-bullets when choosing **live** keys.
- [ ] Incident runbook bookmarked: [`STRIPE_WEBHOOK_INCIDENT.md`](STRIPE_WEBHOOK_INCIDENT.md).

---

## Assessments — visibility rule

**Independent quality assessments** (e.g. `docs/library/QUALITY_ASSESSMENT_*_INDEPENDENT_*.md`) that cite missing **live Stripe**, **self-serve checkout**, or **Commercial Packaging Readiness** gaps should link **this checklist** near the Executive Summary so owner work stays on the same page session-to-session.

---

## Related

| Doc | Use |
|-----|-----|
| [`STRIPE_CHECKOUT.md`](../go-to-market/STRIPE_CHECKOUT.md) | Engineering hand-off, staging steps |
| [`BILLING.md`](../library/BILLING.md) | Architecture, webhook route, SQL tables |
| [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) | `Billing:Stripe:*` keys |

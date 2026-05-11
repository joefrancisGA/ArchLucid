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

## E. Marketing UX (`pricing.json` → Team “Subscribe with Stripe”)

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

## F. Production cutover (owner calendar)

- [ ] **`PENDING_QUESTIONS.md`** item **22** (Marketplace + Stripe live calendar) plus item **9** sub-bullets when choosing **live** keys.
- [ ] Incident runbook bookmarked: [`STRIPE_WEBHOOK_INCIDENT.md`](STRIPE_WEBHOOK_INCIDENT.md).

---

## Assessments — visibility rule

**Independent quality assessments** (e.g. `docs/archive/assessments/QUALITY_ASSESSMENT_*_INDEPENDENT_*.md`) that cite missing **live Stripe**, **self-serve checkout**, or **Commercial Packaging Readiness** gaps should link **this checklist** near the Executive Summary so owner work stays on the same page session-to-session.

---

## Related

| Doc | Use |
|-----|-----|
| [`STRIPE_CHECKOUT.md`](../go-to-market/STRIPE_CHECKOUT.md) | Engineering hand-off, staging steps |
| [`BILLING.md`](../library/BILLING.md) | Architecture, webhook route, SQL tables |
| [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) | `Billing:Stripe:*` keys |

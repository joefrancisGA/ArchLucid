> **Reviewed:** 2026-09-07

> **Scope:** ArchLucid — Pricing philosophy and packaging - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid — Pricing philosophy and packaging

**Audience:** Product leadership, sales, and finance — internal alignment before external pricing publication.

**Last reviewed:** 2026-09-07 (**M-305** profit re-rate — §5.1 discount-stack work-down, Professional expansion SKU, overage/COGS, LLM caps)

**Grounding:** Pricing anchors to the ROI model in [ROI_MODEL.md](ROI_MODEL.md) (break-even at ~184 architect-hours/year) and buyer personas in [BUYER_PERSONAS.md](BUYER_PERSONAS.md).

**Single source of truth:** All price figures live **only** in this file, [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md), [TRIAL_AND_SIGNUP.md](TRIAL_AND_SIGNUP.md), and [docs/CHANGELOG.md](../CHANGELOG.md). Every other doc must **link here** rather than restate numbers; the CI check `scripts/ci/check_pricing_single_source.py` enforces this on every pull request. **Marketplace tier naming** (Team / Professional / Enterprise) is guarded by `scripts/ci/assert_marketplace_pricing_alignment.py` against [`AZURE_MARKETPLACE_SAAS_OFFER.md`](AZURE_MARKETPLACE_SAAS_OFFER.md).

**Readiness scoring boundary:** Trust, reference, and assurance discounts are **commercial pricing choices** that account for buyer friction. They are not `(A)` headline product-readiness deductions and must not be used to imply that V1 pilots are blocked by SOC 2 CPA attestation, third-party pen-test publication, live commerce, or public references. Those items remain procurement realism / deferred-scope context unless a separate owner decision picks them up.

**Quote path vs live checkout (2026-04-22):** When Stripe / Marketplace checkout is not yet enabled for a segment, buyers can submit **`POST /v1/marketing/pricing/quote-request`** from the public **`/pricing`** page (rate-limited, honeypot). Requests append to **`dbo.MarketingPricingQuoteRequests`** for sales follow-up — they **do not** auto-provision tenants. After SQL persist, **`Email:PricingQuoteSalesInbox`** receives a transactional notification when mail is configured ([`docs/runbooks/MARKETING_PRICING_QUOTE_NOTIFICATIONS.md`](../runbooks/MARKETING_PRICING_QUOTE_NOTIFICATIONS.md)). Owner CRM routing beyond inbox mail remains in **`docs/PENDING_QUESTIONS.md`** item **13**.

**Public `/pricing` UX (sales-led default):** The quote panel is placed **above** the tier grid so the primary buyer path is obvious. **Team** shows **Request quote** unless **`NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED`** is explicitly enabled at Next.js build time **and** `teamStripeCheckoutUrl` resolves to a non-placeholder URL (`archlucid-ui/src/lib/team-stripe-checkout-url.ts`, `archlucid-ui/src/lib/marketing/is-public-stripe-team-checkout-enabled.ts`). Hosted **test-mode** Stripe URLs (`cs_test_*`, `buy.stripe.com/test_*`) render the primary button as **Subscribe (Stripe test)** so buyers are not misled into thinking production self-serve is live. Placeholder checkout strings never become clickable links. CI guards: `scripts/ci/pricing_json_checkout_guard.py`, `scripts/ci/assert_public_pricing_placeholder_guard.py`.

---

## 1. Pricing principles

| Principle | Rationale |
|-----------|-----------|
| **Value-based, not cost-plus** | Buyers compare ArchLucid to the cost of manual architecture review (40+ hours per review), not to our LLM token costs. Price against value delivered, not infrastructure consumed. |
| **Predictable for buyer budgeting** | Enterprise procurement needs a number they can put in a PO. Avoid pure consumption pricing that creates forecasting anxiety. |
| **Expansion-friendly** | Revenue should grow as the customer gets more value — more teams, more workspaces, more governance adoption — without requiring a full re-negotiation. |
| **Competitive with manual review cost** | The ROI model shows ~$294K annual savings for a 6-architect team. Pricing should be a small fraction of that value (typically 10–20% of value delivered). |
| **Transparent early-access framing** | Buyers who understand why the price is low are more likely to convert, not less. The discount stack is an honest early-adopter signal, not a distress indicator. |

---

## 2. Pricing model evaluation

| Model | Pros | Cons | Fit for ArchLucid |
|-------|------|------|-------------------|
| **Per-seat (architect)** | Simple, predictable, easy to quote | Caps adoption — customers may limit seats to control cost; penalizes broader team usage | **Good base** — aligns with buyer's architect headcount; simple to explain |
| **Per-package (usage)** | Aligns with value delivered; high-volume users pay more | Unpredictable costs; discourages experimentation; complex metering needed | **Poor as primary** — buyers dislike variable cost; good as an overage mechanism |
| **Platform fee + consumption** | Predictable base with usage upside; expansion-friendly | More complex to explain; requires metering infrastructure | **Best hybrid** — predictable base per workspace/team, with **architecture package** allowances per tier |

**Recommendation:** **Platform fee per workspace + included architecture package allowance** with per-seat pricing for named architects. This gives buyers predictability (platform fee + seats) while allowing expansion via additional workspaces, seats, and **architecture package** overages.

---

## 3. Packaging tiers

### Tier overview

| | **Team** | **Professional** | **Enterprise** |
|--|----------|-----------------|----------------|
| **Target buyer** | Small architecture team exploring AI-assisted review | Established architecture practice with governance needs | Large organization with compliance, audit, and multi-team requirements |
| **Target persona** | Persona 3 (CTO/VP Eng) | Persona 1 (Enterprise Architect) | Persona 1 + Persona 2 (Platform Eng Lead) |
| **Public / Stripe bundle** | **$1,169** / month (5 seats + 1 workspace) | **$2,299** / month (10 seats + 1 workspace) | Custom annual contract |
| **Platform fee (add-on / quote decomposition)** | $339 / workspace / month | $1,079 / workspace / month | Included in annual contract |
| **Seats included in bundle** | 5 architects | 10 architects | Unlimited (named) |
| **Seat price (add-on)** | $211 / architect / month (add-on seats capped at 5 — **10 seats max**; 11+ seats require Professional) | $215 / architect / month (seats 11–20; **20 seats max**; 21+ requires Enterprise) | Included in annual contract |
| **Workspaces** | 1 included (no Team add-on workspace) | 1 included; add-on workspaces at platform fee up to **5** | Unlimited |
| **Architecture packages / month** | 20 included; $25 / **architecture package** overage | 100 included; $20 / **architecture package** overage | Unlimited (2,000 **architecture packages**/mo fair-use soft cap; LLM spend scheduled in the contract — §3.3) |
| **Annual prepay** | 2 months free | 2 months free | Custom |
| **Finding engines** | All 10 | All 10 | All 10 + custom engine support |
| **Governance** | Basic (pre-finalize gate) | Full (approval workflows, policy packs, segregation of duties) | Full + custom policy packs |
| **Comparison / drift** | Included | Included | Included |
| **Audit trail** | 90-day retention | 1-year retention | Custom retention + export |
| **Authentication** | Entra ID default; generic OIDC / SAML 2.0 SP when configured | Entra ID default; generic OIDC / SAML 2.0 SP when configured | Entra ID default; generic OIDC / SAML 2.0 SP when configured |
| **Support** | Community / email | Business hours email + onboarding call | Dedicated CSM, priority response |
| **SLA** | Shared SLO targets | Shared SLO targets | Custom SLA with credits |

**Example monthly invoice — Team, 3 seats, 1 workspace (à la carte quote):**
Platform fee $339 + (3 × $211) = **$972 / month**. Self-serve Stripe still bills the 5-seat Team bundle (**$1,169**). Architect (**$169** / month, 1 seat) remains the discretionary self-serve entry SKU.

**Example monthly invoice — Professional, 8 seats, 1 workspace:**
Public / sales bundle **$2,299 / month** (10 seats + 1 workspace included — 8-seat teams pay the bundle, not a per-seat build-up). Within the $2K–$5K manager-approval range.

**Example monthly invoice — Professional, 15 seats, 2 workspaces:**
Bundle $2,299 + (5 × $215) + $1,079 = **$4,453 / month** (expansion above the included 10 seats / 1 workspace).

**Authentication scope.** Entra ID remains the default documented hosted-SaaS path. Generic OIDC issuers and native SAML 2.0 SP workforce SSO are V1-supported configuration surfaces where the tenant provides issuer / metadata / claim mapping details; see [`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.12 and [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md). Turnkey per-vendor admin wizards are separate implementation polish, not new pricing-tier commitments.

### Feature gates

| Feature | Team | Professional | Enterprise |
|---------|------|--------------|------------|
| Architecture runs | ✓ | ✓ | ✓ |
| Golden manifests | ✓ | ✓ | ✓ |
| Comparison runs | ✓ | ✓ | ✓ |
| Governance approvals | — | ✓ | ✓ |
| Policy packs | — | ✓ | ✓ (custom) |
| Audit export (CSV) | — | ✓ | ✓ |
| DOCX consulting export | — | ✓ | ✓ |
| Webhook / CloudEvents | — | ✓ | ✓ |
| Service Bus integration | — | — | ✓ |
| SCIM provisioning | — | — | ✓ |
| Dedicated support | — | — | ✓ |

### 3.1 Canonical Marketplace tier names

**Partner Center plan display names** and in-repo GTM docs must use **`Team`**, **`Professional`**, and **`Enterprise`** — the same labels as the packaging table above — not shorthand such as **`Pro`**. That keeps [`AZURE_MARKETPLACE_SAAS_OFFER.md`](AZURE_MARKETPLACE_SAAS_OFFER.md) and webhook tier mapping aligned. **CI:** `python scripts/ci/assert_marketplace_pricing_alignment.py`. **Configuration:** Stripe `Billing:Stripe:PriceIdPro` is a historical key name for the **Professional** tier Price ID only; do not use `Pro` as the external tier label in new docs.

### 3.2 Interim Stripe Team self-serve (bundled SKU)

Stripe Checkout uses **one** recurring **Price** for Team conversions (see **`Billing:Stripe:PriceIdTeam`** and [`STRIPE_CHECKOUT.md`](STRIPE_CHECKOUT.md)). Until per-component line items or metered bundles ship in Checkout, product treats self-serve Team as **one bundled monthly SKU**.

| Field | Value |
|-------|-------|
| **Monthly amount (USD)** | **$1,169** / billing period for subscriptions created under this SKU (**M-305** profit re-rate, 2026-09-07; supersedes **M-200** $499) |
| **Relationship to § 5.2** | Locked list still decomposes Team as **workspace + seats** for **quotes**, order forms, and ROI comparisons ($339 + 5 × $211 = **$1,394** / month à la carte); the **$1,169** bundle is an explicit **~16% bundle discount** against that decomposition and is **only** the self-serve Stripe subscription total for this interim implementation |
| **Team seat cap** | Team supports at most **10 architect seats** total — 5 included in the bundle plus up to **5 add-on seats** at the § 5.2 Team seat price. An 11th seat requires **Professional** (10 included seats, 20 max). The cap keeps the value ladder monotonic: Professional is better per seat, per AI credit, and per architecture package than Team at every allowed Team configuration |
| **Pre-launch status (no grandfathering)** | Decided **2026-07-29** (**M-200**) and reaffirmed **2026-09-07** (**M-305**): the product has **no active subscriptions**, so this repricing migrates nobody and no grandfathering policy exists. Any future list-price change for active subscribers goes through the § 5.3 re-rate gates (price-lock for the remainder of the current term plus one renewal) rather than a per-SKU grandfather clause |
| **Hosted AOAI spend guard (tier-scaled)** | Internal **estimated** USD from token counts × **`AgentExecution:LlmCostEstimation`** rates — **not** a separate Stripe line item. Warn at **75%** of the included band via durable audit **`LlmTenantMonthlyDollarBudgetApproaching`**. Simulator / fake / echo providers are excluded. Operators must align USD/M token rates with the **Azure OpenAI** deployment’s list price. See **§3.3**. |
| **Self-serve LLM overage wallet (TB-014, opt-in)** | Non-expiring prepaid balance after the UTC-month hard cap. **$50** auto-refill when balance **< $10**; tenant sets a **$0–$500** monthly auto-replenish cap in **$50** steps. Card charged at each refill (Stripe PaymentIntent). Wallet debits apply a **1.4× markup** on estimated LLM USD so overage is not sold at COGS. Balance **never expires**; on cancellation it is **non-refundable credit** consumable only via ArchLucid LLM usage. Default at signup: **overage off**. See [`docs/library/LLM_BUDGET_TOP_UP.md`](../library/LLM_BUDGET_TOP_UP.md). |

Operational setup (Dashboard Price object, webhook events) stays in **`docs/go-to-market/STRIPE_CHECKOUT.md`** and **`docs/library/BILLING.md`**.

### 3.3 Hosted LLM spend schedule (tier-scaled)

Hosted Azure OpenAI is **included up to a planning band**, then hard-stopped unless the tenant enables the TB-014 wallet. Bands are sized so included architecture-package allowances remain deliverable at typical $2–$10/run LLM cost without selling the cheapest SKU at a loss.

| Plan | Included (estimated USD / UTC month) | Hard stop | Notes |
|------|--------------------------------------|-----------|-------|
| **Architect** | $20 | $35 | Protects the $169 SKU; ~5 included packages at typical run cost |
| **Team** | $50 | $75 | Default SaaS host overlay; ~20 included packages with wallet for heavy real-mode months |
| **Professional** | $200 | $300 | Sized for 100 included packages at ~$2–$3 estimated USD/run |
| **Enterprise** | Contract schedule | Contract schedule | Fair-use 2,000 packages/month does **not** include unlimited AOAI. Every Enterprise order form must attach an LLM spend schedule (included USD, hard stop, and overage/wallet rules). |
| **Trial (Free)** | $10 (`AiUsageControls:DefaultTrialAiBudgetUsd`) | Same as included unless operator override | Unchanged |

Host config: `LlmMonthlyTenantDollarBudget` in **`appsettings.SaaS.json`** (Team band as the host default) plus **`ByPlan`** overlays. Paid tenants resolve Architect / Team / Professional via billing subscription shape (`LlmMonthlySpendPlanId`); per-tenant `dbo.TenantAiBudgetPolicy` rows win when present. Enterprise uses the host default until the contracted schedule is written to that override. Wallet overage after the hard stop debits at **1.4×** estimated USD (`LlmTenantWalletDefaults.OverageDebitMarkupMultiplier`).

---

## 4. Pilot pricing

| Scenario | Pricing | Duration | Conversion path |
|----------|---------|----------|-----------------|
| **Self-serve trial** | Free | 30 days | Auto-upgrade prompt; see [TRIAL_AND_SIGNUP.md](TRIAL_AND_SIGNUP.md). Team-tier features, simulator agents, 10 runs, 3 seats, sample seeded. One-time 14-day extension available. |
| **Guided pilot** | $15,000 flat, fully credited on conversion to Professional or Enterprise **if conversion is signed within 90 days of pilot end** | 6 weeks (per [PILOT_SUCCESS_SCORECARD.md](PILOT_SUCCESS_SCORECARD.md)) | Scorecard review → commercial proposal |
| **Design partner** | 50% off Professional list price for 12 months; **capped at first 3 customers** | Contract term | In exchange for: published case study + quarterly reference call |
| **Enterprise evaluation** | Custom | Negotiated | Champion + sponsor sponsor path |

**Guided pilot credit:** The $15,000 pilot fee is fully credited against the first annual invoice on conversion to Professional or Enterprise, making it zero net cost to the buyer who converts **within 90 days of the pilot end date**. After 90 days the credit expires (it is not an indefinite option). Credit is not transferable to Team or Architect SKUs.

**Design partner eligibility:** Must be within the first 3 signed design-partner agreements. Sales must confirm the slot before quoting. Commitment deliverables (case study + reference call) are contractual. Design partner **cannot** stack with the §4.1 reference-customer discount — the design-partner term already purchases the reference commitment (see §4.3).

### 4.1 Reference-customer discount (standardized 2026-04-21)

When a customer agrees to be a **published reference** (logo + case study + at least one annual reference call), they receive a **standing 15% discount off the applicable tier list price** for the duration of the reference agreement. This is a **standard offer**, not a per-deal negotiation:

| Field | Value |
|-------|-------|
| **Discount magnitude** | **15%** off applicable list (Team / Professional seat + workspace fee) |
| **Eligibility** | Customer must approve published case study **and** logo on the marketing site **and** stand up at least one annual reference call |
| **Duration** | For the contract term in which the reference is published, plus one renewal at the same discount; renegotiated thereafter |
| **Owner** | Product marketing |
| **Trigger** | Row in [`reference-customers/README.md`](reference-customers/README.md) reaches `Status: Published`; `scripts/ci/check_reference_customer_status.py` strict step auto-flips |
| **Stack interaction** | **Mutually exclusive** with the §4 design-partner 50% discount (both purchase a published reference). May combine with annual prepay (2 months free) only. Subject to the §4.3 aggregate floor. |

**Why standardized.** Negotiating per deal slows decision velocity and creates inconsistency between accounts. A standard 15% offer is the industry norm for B2B reference programs.

### 4.3 Discount stacking and floors (M-305)

Quote-time discounts are commercial choices, not product-readiness deductions. Rules:

| Rule | Detail |
|------|--------|
| **Design partner ⊻ reference** | A customer is either a design partner (50% off Professional list for 12 months) **or** a published-reference customer (15% off applicable list) — never both. |
| **Trust concession** | The −25% trust discount is **baked into Professional / Enterprise list** only (attestation-sensitive, sales-led). It is **not** a second quote-time off those lists, and it is **not** offered on Architect / Team (those lists destack trust — see §5.1). |
| **Aggregate floor** | Combined quote-time discounts (design partner, reference, promotional §7, and any one-off) must never take the **effective monthly price below 50% of the applicable locked list** in §5.2. Design partner at 50% sits on the floor; do not add further percentage off. |
| **Pilot credit window** | Guided-pilot $15,000 credit applies only when conversion is signed within **90 days** of pilot end. |
| **PS SKUs** | Custom policy-pack fees do **not** stack with SaaS reference or design-partner discounts. |

### 4.2 Custom Policy Pack Authoring (professional services)

Productized **fixed-fee** professional services for authoring customer-specific governance policy packs. This is separate from bundled **`PlatformDefault`** packs documented in [`docs/library/V1_DEFERRED.md` §6j](../library/V1_DEFERRED.md) (23 default bundles — unchanged). Engagements are **owner-delivered only** (no SI / partner channel for V1).

**IP model (two tiers):**

| Tier | Meaning |
|------|---------|
| **Customer-exclusive** | Pack content and rule keys remain customer-confidential; ArchLucid does not resell the pack verbatim. |
| **ArchLucid-owned (shared)** | Customer receives unlimited internal use; ArchLucid may reuse **generalized patterns** (not verbatim competitor-targeted packs) in other engagements and, at ArchLucid's discretion, in **`PlatformDefault`**. Shared tier is priced at approximately **37% below** customer-exclusive list. |

**SKU matrix (USD, one-time authoring fee unless noted):**

| SKU | Customer-exclusive | ArchLucid-owned (shared) | Scope | Delivery window | Post-delivery support |
|-----|-------------------|--------------------------|-------|-----------------|----------------------|
| Custom Pack — Starter | $15,000 | $9,500 | 1 pack, up to 20 rules | 4 weeks | 30 days |
| Custom Pack — Standard | $40,000 | $25,000 | Up to 3 packs OR 1 pack with 50+ rules | 8 weeks | 90 days |
| Custom Pack — Program | $100,000+ | $65,000+ | Multi-pack engagement, dedicated PS lead, quarterly refresh | Negotiated | Annual |

**Maintenance:** **20% of original authoring fee** per year, **or** bundled into Enterprise contracts at or above **$150,000 ARR**.

**Discount stacking:** These PS SKUs do **not** stack with the §4.1 reference-customer **15%** SaaS discount.

**SoW template:** [`CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md`](CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md)

**KPI (re-rate at §5.3 cadence):** **share-rate** — % of engagements electing ArchLucid-owned IP. Target **40%–60%** over the first 12 months; outside that window triggers a discount re-tune.

---

## 5. Locked list prices (2026)

> **Effective date:** 2026-09-07 (**M-305** profit re-rate; prior freeze 2026-04-17, Team bundle **M-200** 2026-07-29).
> **Valid for:** 12 months, or until a re-rate gate below triggers an explicit re-rate decision.
> **Change control:** Any revision to the numbers in this section requires a product leadership decision and an update to this file + CHANGELOG.md before becoming effective.
> **Grandfathering:** none — no active subscriptions at re-rate (same as **M-200**).

### 5.1 Derivation (split stack after M-305)

| Input | Value | Source |
|-------|-------|--------|
| Annual value delivered (6-architect team) | ~$294,000 / year | [ROI_MODEL.md](ROI_MODEL.md) §5 |
| Value per architect per year | ~$49,000 | $294K ÷ 6 |
| Capture target (10–20% of value) | $4,900–$9,800 / architect / year | Industry benchmark for B2B SaaS |
| "Fair value" seat price | $408–$817 / seat / month | Divide by 12 |

**April 2026 lock** applied a uniform **−50%** stack (trust −25% + reference −15% + self-serve −10%). **M-305 (2026-09-07)** executes the overdue self-serve gate and destacks trust from self-serve SKUs:

| Discount | Architect / Team (self-serve) | Professional / Enterprise (sales-led, attestation-sensitive) |
|----------|-------------------------------|--------------------------------------------------------------|
| Trust (−25%) | **Destacked from list** — not a quote lever on these SKUs | **Remains in list** — named concession, not an extra 25% off at quote time |
| Reference (−15%) | Remains in list | Remains in list |
| Self-serve (−10%) | **Removed (gate #3 applied)** | **Removed (gate #3 applied)** |
| **Resulting multiplier vs original fair-value band** | **~85%** (reference only) | **~60%** (trust + reference) |

Architect / Team list therefore moves more than Professional. The Team public bundle also includes a **ladder-alignment bump** so Professional can include **10 seats** (not 20) without inverting per-seat / per-credit / per-package unit rates on `/pricing` (`pricing-catalog-coherence.ts`).

**Discount stack remaining after M-305:**

| Discount | Reason | Magnitude | Where it still sits |
|----------|--------|-----------|---------------------|
| Trust discount | SOC 2 Type II not yet attested; no published pen-test report | −25% | Professional / Enterprise list only |
| Reference discount | No named reference customer logo or published case study | −15% | All paid lists |
| Self-serve discount | Trial/billing loop engineering bar cleared 2026-04-17; **applied 2026-09-07** | — | **Cleared** |

### 5.2 Locked price table (do not edit without re-rate gate decision)

The fenced JSON block below is the **machine-readable** source for `archlucid-ui/public/pricing.json` (generated in CI via `scripts/ci/generate_pricing_json.py`). Do not remove the **locked-prices** fence (three backticks + the token `locked-prices` on its own line).

```locked-prices
{
  "schemaVersion": 1,
  "effectiveDate": "2026-09-07",
  "currency": "USD",
  "architectStripeCheckoutUrl": "https://checkout.stripe.com/placeholder-replace-before-launch",
  "architectStripeCheckoutUrlSalesLedPlaceholder": true,
  "teamStripeCheckoutUrl": "https://checkout.stripe.com/placeholder-replace-before-launch",
  "teamStripeCheckoutUrlSalesLedPlaceholder": true,
  "packages": [
    {
      "id": "architect",
      "title": "Architect",
      "summary": "For one architect creating and reviewing architecture packages.",
      "planMonthlyUsd": 169,
      "pricingDisplay": "monthly",
      "includedUsers": 1,
      "includedWorkspaces": 1,
      "monthlyAiCredits": 500,
      "includedReviewsPerMonth": 5,
      "overageReviewUsd": 30,
      "llmIncludedUsdPerUtcMonth": 20,
      "llmHardCutoffUsdPerUtcMonth": 35
    },
    {
      "id": "team",
      "title": "Team",
      "summary": "Small architecture team with basic governance",
      "planMonthlyUsd": 1169,
      "pricingDisplay": "monthly",
      "includedUsers": 5,
      "includedWorkspaces": 1,
      "monthlyAiCredits": 2500,
      "workspaceMonthlyUsd": 339,
      "includedArchitectSeats": 5,
      "maxArchitectSeats": 10,
      "seatMonthlyUsd": 211,
      "includedReviewsPerMonth": 20,
      "overageReviewUsd": 25,
      "llmIncludedUsdPerUtcMonth": 50,
      "llmHardCutoffUsdPerUtcMonth": 75
    },
    {
      "id": "professional",
      "title": "Professional",
      "summary": "Governed architecture review practice with policy packs and audit exports",
      "planMonthlyUsd": 2299,
      "pricingDisplay": "monthly",
      "includedUsers": 10,
      "includedWorkspaces": 1,
      "monthlyAiCredits": 10000,
      "workspaceMonthlyUsd": 1079,
      "maxWorkspaces": 5,
      "includedArchitectSeats": 10,
      "maxArchitectSeats": 20,
      "seatMonthlyUsd": 215,
      "includedReviewsPerMonth": 100,
      "overageReviewUsd": 20,
      "llmIncludedUsdPerUtcMonth": 200,
      "llmHardCutoffUsdPerUtcMonth": 300
    },
    {
      "id": "enterprise",
      "title": "Enterprise",
      "summary": "Large organization — SSO, procurement, and private deployment",
      "pricingDisplay": "custom",
      "includedUsers": 0,
      "includedWorkspaces": 0,
      "monthlyAiCredits": 0,
      "annualFloorUsd": 60000,
      "annualCeilingUsd": 250000
    }
  ]
}
```

**`teamStripeCheckoutUrl` (Team card — optional Stripe CTA).** The value above is a **non-production placeholder** (not a real Payment Link or Checkout session). Replace it with a live `https://buy.stripe.com/…` or `https://checkout.stripe.com/c/…` URL before launch, or remove the key to hide the “Subscribe with Stripe” button until billing is ready. **`teamStripeCheckoutUrlSalesLedPlaceholder`** must remain **`true`** while the URL contains substring markers matched by **`archlucid-ui/src/lib/team-stripe-checkout-url.ts`** (`placeholder-replace-before-launch`, `checkout-placeholder`) so CI proves the Subscribe CTA stays **sales-led** unless **Next.js build-time** **`NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED`** opt-in deliberately surfaces Stripe. **Allowed states for public pricing JSON:** (**a**) live buyer-facing checkout — use a live Stripe URL, set **`teamStripeCheckoutUrlSalesLedPlaceholder`** to **`false`** or omit it, and set **`teamStripeCheckoutUrlStripeTestMode`** to **`false`** or omit it; (**b**) placeholder URL with **`teamStripeCheckoutUrlSalesLedPlaceholder: true`** (Subscribe CTA stays hidden in the UI — **`team-stripe-checkout-url.ts`** — quote request remains available); (**c**) no **`teamStripeCheckoutUrl`** key (no checkout URL in the bundle); (**d**) Stripe **test-mode** hosted checkout only — for URLs matching hosted test patterns (`cs_test_*` session paths, `buy.stripe.com/test_*` Payment Links), set **`teamStripeCheckoutUrlStripeTestMode: true`** so CI cannot merge unlabeled test checkout; do **not** set that flag on live **`cs_live_*`** or live **`buy.stripe.com/…`** links. Shared validation: **`scripts/ci/pricing_json_checkout_guard.py`** (also invoked from **`scripts/ci/generate_pricing_json.py`** and **`scripts/ci/assert_public_pricing_placeholder_guard.py`**). Backend Checkout (**`Billing:Stripe:PriceIdTeam`**) must attach a Stripe recurring Price matching **§ 3.2** (**$1,169** / month interim Team SKU).

| Item | Price |
|------|-------|
| Architect bundle | $169 / month (1 seat, 1 workspace) |
| Architect architecture package overage | $30 / architecture package |
| Team public / Stripe bundle | $1,169 / month (5 seats, 1 workspace) |
| Team platform fee (quote decomposition / not an extra workspace) | $339 / workspace / month |
| Team seat (add-on) | $211 / architect / month |
| Team architecture package overage | $25 / architecture package |
| Professional public bundle | $2,299 / month (10 seats, 1 workspace) |
| Professional platform fee (add-on workspace) | $1,079 / workspace / month |
| Professional seat (add-on, seats 11–20) | $215 / architect / month |
| Professional architecture package overage | $20 / architecture package |
| Enterprise annual floor | $60,000 / year |
| Enterprise land range | $60,000–$250,000 / year |
| Enterprise **review** metering | Unlimited in fair-use (2,000 / month soft cap) plus a contracted LLM spend schedule (§3.3) |
| Guided pilot | $15,000 flat (fully credited on conversion within 90 days of pilot end) |
| Design partner discount | 50% off Professional list, 12 months, first 3 customers only; mutually exclusive with §4.1 |
| Custom Pack — Starter (customer-exclusive) | $15,000 one-time |
| Custom Pack — Starter (ArchLucid-owned) | $9,500 one-time |
| Custom Pack — Standard (customer-exclusive) | $40,000 one-time |
| Custom Pack — Standard (ArchLucid-owned) | $25,000 one-time |
| Custom Pack — Program (customer-exclusive) | $100,000+ one-time |
| Custom Pack — Program (ArchLucid-owned) | $65,000+ one-time |
| Custom Pack maintenance (annual) | 20% of original authoring fee |

**Professional bundle vs add-on rate card.** The **$2,299** SKU is the buyer-facing Professional base (10 seats + 1 workspace). Component rates ($1,079 / workspace, $215 / seat) apply to **expansion above that allotment** and to order-form line items when quoting extra seats or workspaces — they are not a second public price for the same 10+1 pack.

### 5.3 Re-rate plan

Each remaining gate below removes its associated discount from the stack. Trigger a **product leadership pricing review** (not an automatic price change) when any gate clears. Existing customers receive **price-lock for the remainder of their current term plus one renewal** before any increase applies.

| Gate | Discount removed | Expected list price increase | Status |
|------|-----------------|------------------------------|--------|
| CPA SOC 2 evidence gate cleared under NDA | −25% trust discount (Professional / Enterprise list) | Raise Professional / Enterprise list ~25% relative | Open — GTM owner work **G-REAL-05** / **G-ASSURANCE-02** (do not treat as an engineering batch) |
| Two named, referenceable customers (case study or logo + quote) | −15% reference discount | Raise all paid lists ~15% relative | Open |
| Self-serve signup → tenant → billing loop in production | −10% self-serve discount | Raise list ~10% relative | **Applied 2026-09-07 (M-305)** |

**Gate #3 applied (2026-09-07):** In-repo evidence cleared the *engineering* bar on 2026-04-17: merge-blocking **`ui-e2e-live`** runs [`archlucid-ui/e2e/live-api-trial-end-to-end.spec.ts`](../../archlucid-ui/e2e/live-api-trial-end-to-end.spec.ts). Product leadership ratified the list-price change in **M-305**; this is not an automatic future increase.

**Both remaining gates cleared:** fair-value pricing (~$408–$817 / seat / month) becomes defensible. Re-rate Professional add-on seat toward ~$299 / seat / month as a full-discount-cleared target.

### 5.4 Discount-stack work-down

> **Why this section.** § 5.3 above describes *what triggers a re-rate*. This section is the **operational tracker** that names *who is driving each remaining gate to clear*. Locked prices in § 5.2 change only via an explicit product-leadership decision (as **M-305** just did).

| Discount line | Magnitude | Owner | Target close date | Evidence link | Re-rate trigger |
|---------------|-----------|-------|-------------------|---------------|-----------------|
| Trust discount (SOC 2 Type II + published pen-test) | −25% on Professional / Enterprise list only | TBD (security lead) | TBD (gated on auditor selection) | `docs/security/PEN_TEST_PROGRAM.md` once it lands (file does not yet exist; the link will be made live in the same PR that introduces the program); future CPA attestation evidence filed under NDA after issuance | Auditor opinion letter received **and** filed in the trust portal; pen-test report (or sponsor summary) approved for prospect distribution |
| Reference discount (named, published reference customer) | −15% | **Product marketing** (standardized 2026-04-21) | Standing offer — clears the moment first row reaches `Status: Published` | [`reference-customers/README.md`](reference-customers/README.md) — first row reaching `Status: Published`; CI runs `scripts/ci/check_reference_customer_status.py` twice in `.github/workflows/ci.yml` — warn-only first, then a **strict** re-run **only when** the warn step succeeds (auto-flip; **do not** remove `continue-on-error` by hand on publish day) | At least **one** row in the reference-customers index has `Status: Published` **and** the strict re-run step is active (same commit that introduces the Published row is enough). **Outbound offer to subsequent customers is the standardized 15% per § 4.1** — mutually exclusive with design partner per §4.3. |
| Self-serve discount (trial / billing loop in production) | −10% | Product leadership | **Applied 2026-09-07** | Merge-blocking `ui-e2e-live` plus **M-305** list update | No further evidence required; do not re-open as a list-price hold |

> **TODO (reference discount copy removal):** Do **not** delete the −15% line from §5.1 until product leadership runs the next §5.3 **re-rate review**. The **engineering** signal that the gate is ready is the **same** merge to `main` where the first README row hits `Published` (strict CI step auto-flips — no YAML surgery).

**How this table is maintained.** Every PR that materially advances a remaining gate updates the matching row's *Owner* and *Target close date* fields and adds a one-line entry to [`docs/CHANGELOG.md`](../CHANGELOG.md). This table does **not** authorize price changes on its own.

**Cross-references.** The reference-customers index and case-study placeholder live in [`reference-customers/`](reference-customers/). The CI guard backing the reference row is `scripts/ci/check_reference_customer_status.py`, wired non-blocking in `.github/workflows/ci.yml`. Both are described from the discoverability side in **[`REPOSITORY_README.md`](../REPOSITORY_README.md)** (documentation spine / deeper index).

---

## 6. Expansion levers

| Lever | Trigger |
|-------|---------|
| **Add seats** | New architects join the practice or additional teams adopt (Team add-ons to 10; Professional add-ons 11–20) |
| **Add workspaces** | Professional add-on workspaces 2–5 at the platform fee; new business units, product lines, or projects |
| **Tier upgrade** | Need governance, policy packs, audit export, or dedicated support; Team 11th seat requires Professional |
| **Package overage** | Sustained usage above tier allowance (priced above typical LLM COGS — §5.2) |
| **LLM wallet** | Real-mode spend above the tier hard stop (1.4× estimated USD) |
| **Professional services** | Custom finding engines, policy packs, integration consulting |

---

## 7. Sensitivity playbook

Use this when first deals produce signal about price tolerance. Do not change list prices without a product leadership decision — use discounting within deal economics **and the §4.3 floor** until patterns emerge.

| Signal | Recommended response |
|--------|---------------------|
| Deals stalling at Professional; price is the stated objection | Offer Professional add-on seat at **$165 / seat / month** as a first-year promotional price (document separately; do not change list; remain above the 50% floor) |
| First 5 Professional deals close in < 30 days without discount | Raise Professional add-on seat toward **$259 / seat / month** at next quarterly re-rate |
| Azure Marketplace is the primary buying motion | Collapse to flat tiers: Team **$1,169 / month** (up to 5 seats); Professional **$2,299 / month** (up to 10 seats); Enterprise: talk to sales |
| Package overage causes friction (> 3 deals cite it) | Move Professional/Enterprise to **unlimited packages in fair-use**; keep overage only at Architect/Team |
| Buyers ignore platform fee / only count per-seat | Quote the public bundle; do not discount below the §4.3 floor |

---

## 8. What is NOT included

- **Professional services (other):** Custom connector development, training workshops — priced separately. **Custom policy pack authoring** is a **productized PS SKU** (see [§4.2](PRICING_PHILOSOPHY.md#42-custom-policy-pack-authoring-professional-services) and [`CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md`](CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md)) — not an ad-hoc bespoke quote.
- **Custom infrastructure:** Dedicated compute, customer-managed keys (BYOK), air-gapped deployment — not available in V1 SaaS.
- **Data migration:** Importing architecture data from other tools — roadmap connector (see [INTEGRATION_CATALOG.md](INTEGRATION_CATALOG.md)).
- **Adds priced separately at Enterprise:** SCIM provisioning (inbound automation — see [`docs/integrations/SCIM_PROVISIONING.md`](../integrations/SCIM_PROVISIONING.md)), Azure Service Bus integration setup.

---

## Related documents

| Doc | Use |
|-----|-----|
| [ROI_MODEL.md](ROI_MODEL.md) | Value model, break-even analysis, and payback math |
| [BUYER_PERSONAS.md](BUYER_PERSONAS.md) | Who buys and their budget authority |
| [COMPETITIVE_LANDSCAPE.md](COMPETITIVE_LANDSCAPE.md) | Competitor pricing context |
| [TRIAL_AND_SIGNUP.md](TRIAL_AND_SIGNUP.md) | Self-serve trial design and trial parameters |
| [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md) | Subscription order template (prices link back here) |
| [PILOT_SUCCESS_SCORECARD.md#customer-onboarding-operating-playbook](PILOT_SUCCESS_SCORECARD.md#customer-onboarding-operating-playbook) | Post-conversion onboarding (6-week pilot) |
| [POSITIONING.md](POSITIONING.md) | Positioning narrative and proof points |
| [PILOT_SUCCESS_SCORECARD.md](PILOT_SUCCESS_SCORECARD.md) | Guided pilot success criteria |
| [../CHANGELOG.md](../CHANGELOG.md) | Release history including pricing freeze entry |

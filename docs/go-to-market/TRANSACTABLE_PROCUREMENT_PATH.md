> **Scope:** Decision tree for how a buyer can actually purchase an ArchLucid pilot or service-led engagement. Defines available vs. unavailable purchase channels and copy-guard coverage for buyer-facing materials.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Transactable procurement path

**Audience:** Founder, sales engineer, and buyers' procurement teams selecting a purchase mechanism.

**Last reviewed:** 2026-06-01

**Related:** [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md), [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md), [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md), [`LEGAL_PROCUREMENT_TERMS_PACKET.md`](LEGAL_PROCUREMENT_TERMS_PACKET.md).

---

## 1. Purchase path decision tree

```
Start: Buyer wants to purchase
        |
        v
   Is this a pilot / service engagement
   or an ongoing subscription request?
        |
        +-- Service engagement / pilot --> Section 2.1 (Invoice / SOW)
        |
        +-- Ongoing subscription request
                |
                +-- Buyer can receive invoice --> Section 2.2 (Order form + invoice)
                |
                +-- Buyer requires Marketplace listing --> Section 2.3 (HOLD — not available)
                |
                +-- Buyer requires Stripe self-serve --> Section 2.4 (HOLD — not available)
                |
                +-- Buyer requires private offer (MACC / Azure Commitment) --> Section 2.5 (Owner decision required)
```

---

## 2. Purchase paths in detail

### 2.1 Invoice / SOW (available now)

**Use for:** Pilot engagements, service-led architecture review SKUs, custom consulting scope.

| Item | Detail |
| --- | --- |
| Status | **Available** |
| Mechanism | Founder-executed SOW or service order; invoice via agreed payment method |
| Template | [`SERVICE_LED_SOW_QUOTE_TEMPLATE.md`](SERVICE_LED_SOW_QUOTE_TEMPLATE.md) |
| Payment terms | Net 30 standard; negotiable for enterprise buyers |
| Legal readiness | Draft MSA + DPA templates available; owner/legal review before execution |
| Tax readiness | Owner to confirm applicable tax registration before invoicing |
| Minimum order | No minimum; align with [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) bands |
| Owner approval required | Yes — every SOW requires owner review before send |

### 2.2 Order form + invoice (available now)

**Use for:** Annual or multi-month subscription engagements where the buyer can receive a standard invoice.

| Item | Detail |
| --- | --- |
| Status | **Available** |
| Mechanism | Founder-executed order form; invoice via agreed channel |
| Template | [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) |
| Payment terms | Net 30 standard |
| Subscription billing automation | Not yet automated — manual invoice per period |
| Owner approval required | Yes — each order form requires owner review |

### 2.3 Azure Marketplace self-serve listing

**Use for:** Buyers who require a transactable Azure Marketplace offer.

| Item | Detail |
| --- | --- |
| Status | **Not available — V1.1 / V2 roadmap** |
| Blocking dependencies | Publisher account enrollment, offer configuration, Azure commerce legal terms, pricing publication, and owner approval |
| Safe language | "We are exploring a Marketplace listing for a future release. Current purchase is invoice / order form." |
| Unsafe language | "Available on Azure Marketplace" — do not use until listing is live and approved |
| Reference | [`AZURE_MARKETPLACE_SAAS_OFFER.md`](AZURE_MARKETPLACE_SAAS_OFFER.md) (planning doc only) |

### 2.4 Stripe self-serve checkout

**Use for:** Buyers who expect a self-serve, credit-card checkout experience.

| Item | Detail |
| --- | --- |
| Status | **Not available — V1.1 roadmap** |
| Blocking dependencies | Stripe account configuration, live key setup, checkout flow development, tax/legal compliance, owner approval |
| Safe language | "Self-serve checkout is not available yet. Pilots and subscriptions are purchased via invoice or order form." |
| Unsafe language | "Buy now" buttons or "Start free trial" flows that imply live Stripe — do not use until configured and approved |
| Reference | [`STRIPE_CHECKOUT.md`](STRIPE_CHECKOUT.md) (planning doc only) |
| Related | [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) |

### 2.5 Private offer / MACC draw-down (owner decision required)

**Use for:** Large enterprise buyers who want to draw down against an existing Microsoft Azure Consumption Commitment.

| Item | Detail |
| --- | --- |
| Status | **Owner decision required** — legal and technical readiness must be confirmed before offering |
| Blocking dependencies | Azure Marketplace publisher account (required for private offers), partner agreement, pricing configuration |
| Next step | Owner to confirm publisher status and partner agreement before this path is offered |
| Safe language | "We are evaluating MACC-eligible private offers. Please confirm your MACC status so we can assess feasibility." |
| Unsafe language | "You can use your MACC budget today" — do not use without confirmed publisher status |

---

## 3. Payment terms and legal/tax readiness

| Dependency | Current status | Owner action |
| --- | --- | --- |
| Tax registration (VAT/GST) | Owner to confirm applicability | Required before invoicing non-US buyers |
| Business entity / legal name | Owner-confirmed | Confirm legal name on all invoices |
| ACH / wire / check acceptance | Owner decision | Define accepted payment methods before first invoice |
| Currency | USD default | Owner to confirm multi-currency posture before quoting in other currencies |

---

## 4. Copy-guard coverage

The following phrases or UI elements in any buyer-facing material must be reviewed against this document before publication:

| Phrase / element | Guard rule |
| --- | --- |
| "Buy now" / "Purchase" / "Subscribe" buttons | Allowed only if invoice / order form path is the destination; disallowed if linking to Stripe or Marketplace that is not live |
| "Available on Azure Marketplace" | Not allowed until listing is live and owner-approved |
| "Start a free trial" with payment capture | Not allowed without owner-approved Stripe or payment configuration |
| "MACC eligible" | Not allowed without confirmed publisher status |
| Pricing listed without "contact for quote" option | Must align with [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) posture |
| Any claim of "instant provisioning" or "self-serve" | Not allowed in V1; pilots require manual setup |

---

## 5. HOLD reasons for commercial closeout

If the commercial closeout in [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md) reaches the purchase step and no available path fits, record as HOLD or DEFERRED_SCOPE:

| Scenario | Commercial state | Record |
| --- | --- | --- |
| Buyer requires Marketplace listing | DEFERRED_SCOPE | V1.1 roadmap; do not promise timeline |
| Buyer requires Stripe self-serve | DEFERRED_SCOPE | V1.1 roadmap; do not promise timeline |
| Buyer requires MACC draw-down | HOLD | Owner must confirm publisher status before continuing |
| Buyer cannot accept invoice | HOLD | Explore workarounds; do not improvise a payment path without owner approval |
| Tax or legal terms unresolved | HOLD | Owner must resolve before closing |

---

## 6. References

| Document | Purpose |
| --- | --- |
| [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) | Pricing posture and band guidance |
| [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) | Order form template |
| [`SERVICE_LED_SOW_QUOTE_TEMPLATE.md`](SERVICE_LED_SOW_QUOTE_TEMPLATE.md) | SOW and quote template |
| [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md) | Commercial close-out checklist |
| [`LEGAL_PROCUREMENT_TERMS_PACKET.md`](LEGAL_PROCUREMENT_TERMS_PACKET.md) | Legal terms and approval guidance |
| [`AZURE_MARKETPLACE_SAAS_OFFER.md`](AZURE_MARKETPLACE_SAAS_OFFER.md) | Marketplace planning document (not live) |
| [`STRIPE_CHECKOUT.md`](STRIPE_CHECKOUT.md) | Stripe checkout planning document (not live) |
| [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) | GTM overclaim guardrails |
| [`../library/V1_DEFERRED.md`](../library/V1_DEFERRED.md) | V1 deferred items (Stripe, Marketplace) |

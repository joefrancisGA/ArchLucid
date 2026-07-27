> **Reviewed:** 2026-07-26

> **Scope:** Decision tree for how a buyer can actually purchase an ArchLucid pilot or service-led engagement — available vs. unavailable purchase channels, copy-guard coverage, and the legal/procurement terms packet (formerly `LEGAL_PROCUREMENT_TERMS_PACKET.md`). Planning and conversation guide, not a substitute for executed contracts.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Transactable procurement path

**Audience:** Founder, sales engineer, and buyers' procurement teams selecting a purchase mechanism or reviewing commercial terms.

**Last reviewed:** 2026-07-26

**Related:** [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md), [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md), [`QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist`](QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist), [`#legal-and-procurement-terms`](#legal-and-procurement-terms), [`BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-objection-playbook`](BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-objection-playbook) (`PROCUREMENT_OBJECTION_PLAYBOOK.md` alias).

**Approval path:** Owner must review before sending legal/commercial commitments to any buyer. Items marked **"owner/legal review required"** must not be committed verbally or in product copy without that review.

---

## 0. Pilot vs procurement fast lane

| Motion | Start here | Often |
|--------|------------|--------|
| **Pilot (first useful outcome)** | [`CORE_PILOT.md`](../CORE_PILOT.md) — request → pipeline → finalize → review artifacts | Same day–few days (team + environment) |
| **Internal sponsor yes/no** | Sponsor brief + scorecard | 1–4 weeks |
| **Procurement diligence** | [`trust-center.md`](trust-center.md) → [`BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-response-accelerator`](BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-response-accelerator) → evidence ZIP / [`PROCUREMENT_PACK_INDEX.md#how-to-request-and-build-the-pack`](PROCUREMENT_PACK_INDEX.md#how-to-request-and-build-the-pack) | 2–8+ weeks |
| **Contract execution** | Templates in pack (DPA/MSA/order form) — customer legal review required | 2–8+ weeks after paper starts |

**Escalation (founder / legal / security):** contractual demand for SOC 2 Type II **attestation date** or third-party pen **vendor report** inside V1; custom DPA terms that contradict in-repo stance; multi-region active/active or rigid residency guarantees not in signed commercial terms.

**One-email sponsor kit:** [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md#12-one-email-sponsor--procurement-kit).

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
| Template | [`QUOTE_TO_PROOF_PACKET.md#private-quote--sow-template`](QUOTE_TO_PROOF_PACKET.md#private-quote--sow-template) |
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
| Related | [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) |

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

If the commercial closeout in [`QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist`](QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist) reaches the purchase step and no available path fits, record as HOLD or DEFERRED_SCOPE:

| Scenario | Commercial state | Record |
| --- | --- | --- |
| Buyer requires Marketplace listing | DEFERRED_SCOPE | V1.1 roadmap; do not promise timeline |
| Buyer requires Stripe self-serve | DEFERRED_SCOPE | V1.1 roadmap; do not promise timeline |
| Buyer requires MACC draw-down | HOLD | Owner must confirm publisher status before continuing |
| Buyer cannot accept invoice | HOLD | Explore workarounds; do not improvise a payment path without owner approval |
| Tax or legal terms unresolved | HOLD | Owner must resolve before closing |

---

## 6. Legal and procurement terms

**Audience:** Founder / operator preparing for a first paid-pilot procurement conversation; buyers' legal or procurement teams reviewing commercial terms.  
Maps common term questions to current source documents (or marks draft / not yet available) and identifies owner or legal review before commitment.

### MSA / contract terms posture

| Term area | Current status | Source | Owner action required |
| --- | --- | --- | --- |
| Master Services Agreement (MSA) template | Available — draft | [`MSA_TEMPLATE.md`](MSA_TEMPLATE.md) | Owner + buyer legal review before execution |
| SOW / quote template | Available | [`QUOTE_TO_PROOF_PACKET.md#private-quote--sow-template`](QUOTE_TO_PROOF_PACKET.md#private-quote--sow-template) | Owner review per engagement |
| Order form template | Available | [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) | Owner review per engagement |
| Data Processing Addendum (DPA) | Template available | [`DPA_TEMPLATE.md`](DPA_TEMPLATE.md) | Owner + buyer legal review before execution |
| Cross-tenant patterns opt-in (DPA §10) | Template available | [`DPA_TEMPLATE.md` §10](DPA_TEMPLATE.md#10-cross-tenant-patterns-opt-in) | Owner review before execution |
| Redline owner | Founder / owner | — | Owner is the redline contact for V1 pilots |
| Legal counsel engaged | Owner decision required | — | Owner must confirm before complex enterprise redlines |

### Data-retention commitments

| Item | Current position | Notes |
| --- | --- | --- |
| Retention period | Configurable; formal default schedule pending owner definition | Do not commit a specific retention period without owner-approved schedule |
| Deletion on contract end | Intended; exact SLA is owner-review required | Do not promise a specific deletion SLA without owner approval |
| Backup retention | Azure Blob and SQL backup retention documented in trust center | [`trust-center.md`](trust-center.md) |
| Audit log retention | Append-only; retention period is owner-defined | Do not commit a minimum audit-log retention period without owner approval |

> **Guardrail:** Do not promise specific retention periods, deletion timelines, or data-portability SLAs in product copy, demos, or verbal commitments without owner-approved language.

### Support and SLA terms

| Item | Current position | Source | Notes |
| --- | --- | --- | --- |
| Pilot support posture | White-glove, founder-led | [`SUPPORT_POLICY.md`](SUPPORT_POLICY.md#v1-pilot-operating-model) | Applies to V1 controlled pilots only |
| Support hours | Business hours (Eastern); reasonable effort response on critical issues | [`SUPPORT_POLICY.md`](SUPPORT_POLICY.md#v1-pilot-operating-model) | Not a 24×7 enterprise SLA |
| Response time targets | Pilot SLA: P1 same business day; P2 2 business days | [`SUPPORT_POLICY.md`](SUPPORT_POLICY.md#v1-pilot-operating-model) | Draft — owner review required before commitment |
| Uptime SLA | No formal SLA in V1; reasonable-effort availability for controlled pilots | [`SLA_SUMMARY.md`](SLA_SUMMARY.md) | Do not quote a percentage SLA without owner approval |
| Support model (GA) | Not available — post-V1 | — | Do not promise GA support tier in V1 materials |

### Liability and indemnification posture

| Item | Current position | Notes |
| --- | --- | --- |
| Limitation of liability | Standard SaaS limitation of liability in MSA template | Owner/legal review before execution; do not commit specific caps verbally |
| Indemnification scope | Standard IP indemnification in MSA template | Owner/legal review required |
| Gross negligence / willful misconduct carve-out | Included in template | Standard; owner may negotiate |
| AI output liability | ArchLucid output is decision support; operator and user remain responsible for architecture decisions | Reinforce in all materials; do not imply automated architecture approval |
| Product warranty | No warranty beyond reasonable SaaS standard; ArchLucid makes no warranty that outputs are complete, accurate, or suitable for any specific purpose | State in pilot intake |

### Approval and commitment authority

| Commitment type | Who can commit | Process |
| --- | --- | --- |
| Pilot SOW (≤ 90 days, ≤ $25K) | Founder / owner | Owner review; execute via order form or SOW |
| Annual subscription | Founder / owner | Owner review; execute via order form |
| Custom MSA redline | Founder + legal counsel (recommended) | Do not accept material redlines without counsel |
| Data-retention specific SLA | Owner only | Must be owner-approved before commitment |
| Uptime SLA commitment | Owner only | Must be owner-approved; no auto-commit from product copy |
| Any SOC 2 CPA or third-party pen-test timeline | Not available | Do not commit a timeline; refer to V1.1 roadmap only |

### Terms that must not be committed without owner approval

> Do not commit the following verbally, in product copy, in demo scripts, or in sales materials without explicit owner approval. Mark them as "owner review required" in any customer communication.

- [ ] Specific uptime SLA percentage (e.g., "99.9% uptime")
- [ ] Data deletion within a specific number of days after contract termination
- [ ] SOC 2 CPA attestation delivery date
- [ ] Third-party penetration test report delivery date
- [ ] ISO 27001 certification timeline
- [ ] Live Azure Marketplace or Stripe checkout availability date
- [ ] Named public reference customer quotes or case-study publication
- [ ] Guaranteed ROI dollar figure (vs. source-labeled estimate)
- [ ] Multi-region active/active SLA
- [ ] MCP or native connector GA dates (Jira, ServiceNow, etc.)

### Common procurement questions and safe answers

| Question | Safe answer |
| --- | --- |
| "Can we redline your MSA?" | "Yes. We have a draft MSA template we use as a starting point. Owner review is required before accepting any material changes." |
| "What is your data retention policy?" | "Retention is configurable. A formal default schedule is in owner review. We will confirm the applicable retention period before contract execution." |
| "Do you have cyber liability insurance?" | "Owner-decision required. Do not confirm or deny coverage without owner input." |
| "Can you sign our DPA?" | "We have a DPA template as a starting point and can review your form. Owner and, for complex terms, legal counsel review is required before execution." |
| "What is your SLA?" | "V1 is a controlled pilot with founder-led white-glove support and reasonable-effort availability. A formal SLA percentage is owner-approval-required before we commit one in writing." |
| "When will SOC 2 be done?" | "SOC 2 CPA attestation is in our V1.1 backlog. We cannot commit a timeline for V1." |

Former standalone: `docs/go-to-market/LEGAL_PROCUREMENT_TERMS_PACKET.md` → this section.

---

## 7. References

| Document | Purpose |
| --- | --- |
| [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) | Pricing posture and band guidance |
| [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) | Order form template |
| [`QUOTE_TO_PROOF_PACKET.md#private-quote--sow-template`](QUOTE_TO_PROOF_PACKET.md#private-quote--sow-template) | SOW and quote template |
| [`QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist`](QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist) | Commercial close-out checklist |
| [`#legal-and-procurement-terms`](#legal-and-procurement-terms) | Legal terms and approval guidance |
| [`MSA_TEMPLATE.md`](MSA_TEMPLATE.md) | Master Services Agreement template |
| [`DPA_TEMPLATE.md`](DPA_TEMPLATE.md) | Data Processing Addendum template |
| [`SUPPORT_POLICY.md`](SUPPORT_POLICY.md#v1-pilot-operating-model) | Support entitlements + V1 pilot operating model |
| [`SLA_SUMMARY.md`](SLA_SUMMARY.md) | SLA summary |
| [`trust-center.md`](trust-center.md) | Trust and assurance index |
| [`AZURE_MARKETPLACE_SAAS_OFFER.md`](AZURE_MARKETPLACE_SAAS_OFFER.md) | Marketplace planning document (not live) |
| [`STRIPE_CHECKOUT.md`](STRIPE_CHECKOUT.md) | Stripe checkout planning document (not live) |
| [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) | GTM overclaim guardrails |
| [`../library/V1_DEFERRED.md`](../library/V1_DEFERRED.md) | V1 deferred items (Stripe, Marketplace) |

> **Scope:** ArchLucid — Support and professional services (buyer summary).  
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# ArchLucid — Support and professional services

**Audience:** Procurement, customer success, and technical evaluators assessing support entitlements before purchase.

**Last reviewed:** 2026-05-30

**Pricing source:** Subscription tiers and list prices live only in [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md). This document describes **support and services posture**, not price figures.

**Related:** [SLA_SUMMARY.md](SLA_SUMMARY.md) (availability targets) · [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md) (contract framing) · [TRUST_CENTER.md](TRUST_CENTER.md)

---

## Available today vs planned

| Topic | Available today | Planned / scales with demand |
|-------|-----------------|------------------------------|
| Email support intake | Yes — all tiers | — |
| Documentation and in-app help | Yes | Ongoing expansion |
| Founder-led onboarding (early access / initial pilots) | Yes — included during early enterprise pilots | Packaged guided pilot / paid add-on as patterns stabilize |
| Enterprise dedicated Microsoft Teams support channel | Yes — when Enterprise tier is contracted | — |
| Business-day response targets | Yes — measured from ticket receipt | Specific hour targets finalized per Enterprise order form |
| Enterprise 99.9% monthly availability **target** | Yes — engineering target | Contractual SLA + service credits only in executed Enterprise agreement |
| Enterprise service credits | Defined in order form / SLA exhibit | Percentage schedule finalized at first Enterprise contract |
| Formal staffed-hours coverage | **Not promised** | Hired rotation (e.g. India-based) as Enterprise demand requires |
| SOC 2 CPA attestation | **Not available** | V1.1 backlog (TB-135) |
| Third-party penetration test publication | **Not available** | V1.1 backlog (TB-136) |

---

## Support tiers

### Team

- **Email support** plus product documentation and in-app help.
- **One** lightweight onboarding session or office-hours slot within the **first 30 days** (capacity permitting).
- Feature requests are **non-committed product input** only — no delivery promise.

### Professional

- **Priority email support** plus **one** included onboarding call.
- Optional **paid** implementation/support add-ons and **paid** custom feature work (e.g. custom policy packs).
- Unpaid feature requests may enter the product backlog with **no delivery commitment**.

### Enterprise

- **Named support contact**.
- **Dedicated Microsoft Teams support channel** for support and onboarding — distinct from any first-party product Teams **notification** integration.
- **Priority escalation** path for Severity 1 issues (see below).
- **Negotiable deal-specific committed features** governed by deal economics and documented in the order form / SOW with scope, acceptance criteria, delivery window, IP/reuse terms, exclusions, and dependency fallback.

---

## Coverage model (founder-operated phase)

Support is defined by **business-day response targets measured from ticket receipt**, not fixed staffed hours. The operator currently maintains a separate full-time role; ArchLucid does **not** publish a fixed staffed-hours promise during this phase.

- **Enterprise Severity 1:** **best-effort immediate escalation** (see narrow definition below).
- **Formal staffed coverage** (likely a hired India-based rotation) is added as Enterprise demand requires.

Exact response-target hours per severity tier are finalized in the **Enterprise order form**; this document states the model honestly without overpromising.

---

## Severity definitions

### Severity 1 (narrow)

Use Severity 1 only when **all** of the following apply:

1. Hosted ArchLucid service is **broadly unavailable** (API + operator UI), **or**
2. Customer is **blocked** from committed review packages / evidence needed for an **active procurement or governance deadline**, **or**
3. **Suspected tenant data exposure** or security incident.

Everything else is lower severity.

### Severity 2–4

Lower severities cover degraded performance, non-blocking defects, configuration questions, and general product guidance. See [INCIDENT_COMMUNICATIONS_POLICY.md](INCIDENT_COMMUNICATIONS_POLICY.md) for incident notification targets when availability is at risk.

---

## Support intake

| Tier | Primary intake |
|------|----------------|
| Team | Email |
| Professional | Priority email |
| Enterprise | Email + dedicated Teams support channel (post-onboarding) |

Include **`X-Correlation-ID`** on API requests when reporting API-related issues ([CUSTOMER_TRUST_AND_ACCESS.md](../library/CUSTOMER_TRUST_AND_ACCESS.md)).

**Security incidents:** `security@archlucid.net` (see [TRUST_CENTER.md](TRUST_CENTER.md)).

---

## Availability and maintenance

### Availability target

| Tier | Hosted API + operator UI monthly target | Contractual SLA / credits |
|------|----------------------------------------|---------------------------|
| Team | **99.9%** engineering target | No credits — target only |
| Professional | **99.9%** engineering target | No credits — target only |
| Enterprise | **99.9%** monthly | Availability-based **service credits** in executed agreement (monthly capped, sole remedy) |

**Measurement:** Successful API responses (non-5xx) over a 30-day rolling window for the hosted API; operator UI availability aligned to the same deployment. Detail: [SLA_SUMMARY.md](SLA_SUMMARY.md), [API_SLOS.md](../library/API_SLOS.md).

### Exclusions (availability)

- Planned maintenance (see below)
- Customer misconfiguration, blocked network paths, or excess load beyond agreed limits
- Preview / beta features explicitly marked as such
- Third-party cloud outages outside ArchLucid control
- Force majeure

### Planned maintenance

- Performed in a **published Sunday early-morning maintenance window** in the customer's primary region/time zone.
- **≥ 72 hours' notice** for planned maintenance expected to affect availability.
- **Emergency security maintenance** may occur with shorter notice.

---

## Service credits (Enterprise only)

When included in an executed Enterprise agreement:

- **Availability-based** credits only — not support response-time credits.
- **Monthly capped**; credits are the customer's **sole remedy** for availability shortfalls.
- Percentage schedule and cap are defined in the **order form / SLA exhibit** (finalized at contract).
- Standard exclusions in § Availability and maintenance apply.

ArchLucid does **not** assert production SLA compliance without production probe evidence and owner-approved contractual terms.

---

## Feature commitments and IP / reuse

| Tier | Feature commitment posture |
|------|---------------------------|
| Team | No committed features — feedback only |
| Professional | Paid custom work (e.g. policy packs) via SOW; unpaid backlog only |
| Enterprise | Negotiable deal-specific features in order form / SOW |

**Default IP / reuse (customer-funded or deal-included enhancements):**

- Enhancements are **ArchLucid-owned and reusable by default**.
- Customer-confidential data, configurations, and implementation details stay confidential.
- **Exclusivity** requires a separate written, separately priced agreement.

**Custom policy packs — two options:**

1. **Customer-exclusive** — higher price; customer-confidential rule text and examples.
2. **ArchLucid-owned reusable** — lower price; generalized pack may ship to other customers.

Even for customer-exclusive packs, ArchLucid may reuse **generalized architecture lessons, non-confidential patterns, principles, and product improvements** — not proprietary rule text or confidential examples.

Committed Enterprise features in the SOW must include: **scope, acceptance criteria, delivery window, IP/reuse, exclusions, and dependency fallback**.

---

## Professional services

Offered when they accelerate adoption:

| Service | Description |
|---------|-------------|
| Onboarding / first-review facilitation | Guided first committed review |
| Evidence-intake setup | Tenant evidence paths and operator workflow |
| Custom policy pack authoring | See IP options above |
| Custom integration support | REST/CLI/webhook alignment |
| Architecture-review advisory | Advisory sessions on review cadence and governance |

**Commercial posture:**

- **Default:** fixed-fee packages for procurement simplicity.
- **Fallback:** ad-hoc hourly (≈ **$200/hr** floor), billed in **30-minute or 1-hour** increments, **no hard minimum engagement** for open-ended work.
- Bespoke work is billed; repeatable patterns fold back into the product.

**Early access:** During early access and initial enterprise pilots, **founder-led onboarding is included at no extra charge** (product discovery and conversion). This becomes a packaged guided pilot or implementation add-on as onboarding patterns stabilize. The **paid guided pilot credited on conversion** remains available for later enterprise sales.

---

## Related documents

| Doc | Use |
|-----|-----|
| [SLA_SUMMARY.md](SLA_SUMMARY.md) | Buyer SLO summary |
| [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md) | Subscription and SLA exhibit framing |
| [PROCUREMENT_OBJECTION_PLAYBOOK.md](PROCUREMENT_OBJECTION_PLAYBOOK.md) | Standard objection responses |
| [INCIDENT_COMMUNICATIONS_POLICY.md](INCIDENT_COMMUNICATIONS_POLICY.md) | Incident notification |
| [CUSTOMER_ONBOARDING_PLAYBOOK.md](CUSTOMER_ONBOARDING_PLAYBOOK.md) | Onboarding checklist |

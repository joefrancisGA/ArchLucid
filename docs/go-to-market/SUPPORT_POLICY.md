> **Reviewed:** 2026-07-26

> **Scope:** ArchLucid — Support and professional services (buyer summary), plus V1 controlled-pilot operating model (formerly `SUPPORT_AND_PILOT_OPERATING_MODEL.md`).  
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# ArchLucid — Support and professional services

**Audience:** Procurement, customer success, and technical evaluators assessing support entitlements before purchase; pilot champions running a V1 controlled pilot.

**Last reviewed:** 2026-07-26

**Pricing source:** Subscription tiers and list prices live only in [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md). This document describes **support and services posture**, not price figures.

**Related:** [SLA_SUMMARY.md](SLA_SUMMARY.md) (availability targets) · [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md) (contract framing) · [trust-center.md](trust-center.md) · [LEGAL_PROCUREMENT_TERMS_PACKET.md](LEGAL_PROCUREMENT_TERMS_PACKET.md)

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

1. Hosted ArchLucid service is **broadly unavailable** (API + architect workspace), **or**
2. Customer is **blocked** from finalized architecture packages / evidence needed for an **active procurement or governance deadline**, **or**
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

**Security incidents:** `security@archlucid.net` (see [trust-center.md](trust-center.md)).

---

## Availability and maintenance

### Availability target

| Tier | Hosted API + architect workspace monthly target | Contractual SLA / credits |
|------|----------------------------------------|---------------------------|
| Team | **99.9%** engineering target | No credits — target only |
| Professional | **99.9%** engineering target | No credits — target only |
| Enterprise | **99.9%** monthly | Availability-based **service credits** in executed agreement (monthly capped, sole remedy) |

**Measurement:** Successful API responses (non-5xx) over a 30-day rolling window for the hosted API; architect workspace availability aligned to the same deployment. Detail: [SLA_SUMMARY.md](SLA_SUMMARY.md), [API_SLOS.md](../library/API_SLOS.md).

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
| Onboarding / first-review facilitation | Guided first finalized review |
| Evidence-intake setup | Tenant evidence paths and architect workflow |
| Custom policy pack authoring | See IP options above |
| Custom integration support | REST/CLI/webhook alignment |
| Architecture-review advisory | Advisory sessions on review cadence and governance |

**Commercial posture:**

- **Default:** fixed-fee packages for procurement simplicity.
- **Fallback:** ad-hoc hourly (≈ **$200/hr** floor), billed in **30-minute or 1-hour** increments, **no hard minimum engagement** for open-ended work.
- Bespoke work is billed; repeatable patterns fold back into the product.

**Early access:** During early access and initial enterprise pilots, **founder-led onboarding is included at no extra charge** (product discovery and conversion). This becomes a packaged guided pilot or implementation add-on as onboarding patterns stabilize. The **paid guided pilot credited on conversion** remains available for later enterprise sales.

---

## V1 pilot operating model

Support posture for V1 controlled pilots. Not a formal SLA until owner-approved and executed in a contract. Operator path: [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) · troubleshooting: [`TROUBLESHOOTING.md`](../runbooks/TROUBLESHOOTING.md).

### Pilot posture: white-glove founder-led

V1 pilots operate under a **white-glove, founder-led support posture**. The founder is the primary point of contact for onboarding, configuration, and issue resolution. This model maximizes evidence quality and minimizes first-pilot friction, but it does not scale to dozens of simultaneous pilots without additional staffing.

**What this means for buyers:**
- Direct access to the founder/operator for questions, configuration, and feedback.
- Issues escalate without a tiered support queue.
- Response times are faster than a typical SaaS support portal but depend on founder availability.

**What this does not mean:**
- Not a 24×7 NOC.
- Not a formal enterprise SLA unless negotiated and executed in the contract.

| Mode | When used |
| --- | --- |
| **White-glove pilot** | Default for first design partner; founder attends first commit review |
| **Guided self-serve** | Buyer operators trained; founder office hours weekly |
| **Pure self-serve** | Not claimed in V1 pilot offers — reserved for future GA motion |

### Support hours and contact (pilot)

| Item | V1 pilot posture |
| --- | --- |
| Support hours | Business hours — Monday through Friday, 9 AM–6 PM Eastern |
| Critical-issue response | Reasonable-effort same business-day response for P1 issues |
| Primary channel | Email or agreed async channel (Slack shared channel where configured) |
| Owner-availability during pilot | Founder available for weekly check-in call and async within support hours |
| After-hours coverage | Reasonable-effort for P1 confirmed incidents; no contractual obligation outside business hours |

> **Procurement claim guardrail:** Do not quote "24×7 support" or a specific uptime SLA percentage in buyer materials without owner approval.

### Response-time targets (pilot-only)

These targets apply to V1 controlled pilots. They are not a published GA SLA.

| Priority | Definition | Initial response target | Update cadence |
| --- | --- | --- | --- |
| **P1 — Critical** | Pilot completely blocked; no runs can complete; data breach suspected | Same business day | Every 4 hours until resolved |
| **P2 — High** | Core workflow degraded; runs complete but results are incorrect or partially missing | Within 2 business days | Daily update while active |
| **P3 — Medium** | Non-blocking issue; workaround exists; UI cosmetic or documentation gap | Within 5 business days | Weekly update while active |
| **P4 — Low** | Enhancement request; informational question | Best effort; addressed in next pilot check-in | N/A |

> **Owner approval required** before quoting these targets in a contract or order form.

### Escalation path

| Step | Trigger | Action |
| --- | --- | --- |
| 1 — Buyer champion contacts founder | Any issue | Send email or agreed-channel message with issue description and priority |
| 2 — Founder acknowledges | Within response target | Founder confirms receipt and initial assessment |
| 3 — Root-cause investigation | P1 or P2 | Founder engages relevant engineering context; shares interim findings |
| 4 — Resolution or workaround | All priorities | Founder documents resolution, workaround, or "no fix in V1" with explanation |
| 5 — Post-incident review (P1 only) | After P1 resolution | Brief written summary of cause, resolution, and preventative action where applicable |

### Incident communications (pilot)

| Scenario | Communication protocol |
| --- | --- |
| Service disruption affecting pilot environment | Notify buyer champion within 4 business hours of confirmed impact |
| Data confidentiality incident (suspected or confirmed) | Notify buyer executive sponsor within 24 hours; provide written incident summary within 72 hours |
| Degraded performance (not blocking) | Notify at next scheduled check-in unless buyer requests faster updates |
| Planned maintenance | 48-hour advance notice via agreed channel |

**Full incident communications policy:** [`INCIDENT_COMMUNICATIONS_POLICY.md`](INCIDENT_COMMUNICATIONS_POLICY.md).

### Pilot operating rhythm

| Cadence | Activity | Artifact produced |
| --- | --- | --- |
| **Pre-pilot (week 0)** | Onboarding call; environment configuration; policy pack setup; baseline metric collection | Intake checklist completed; first run target set |
| **Weekly check-in** | Review run results; address open issues; adjust configuration if needed | Meeting notes in agreed channel |
| **Midpoint review (week 3)** | Qualitative interviews per [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) §3; scorecard midpoint fill | Midpoint qualitative scores captured |
| **End-of-pilot review (week 6)** | Final scorecard; ROI calculation; sponsor packet preparation | Proof bundle, `go-no-go-summary.md`, `first-value-report.md` |
| **Commercial close conversation** | Walk through [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md) | Commercial state recorded (SEND / HOLD / DEFERRED_SCOPE) |

### Self-serve resources (before founder escalate)

| Resource | Purpose |
| --- | --- |
| [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) | Step-by-step first-pilot operator guide |
| [`TROUBLESHOOTING.md`](../runbooks/TROUBLESHOOTING.md) | Common issues and resolutions |
| [`DEMO_QUICKSTART.md`](DEMO_QUICKSTART.md) | Quick-start for demo workspace validation |
| API documentation | Swagger/OpenAPI at `/swagger` |

### Pilot-only vs GA vs not offered

| Item | V1 pilot posture | Generally available (GA) | Not offered |
| --- | --- | --- | --- |
| White-glove onboarding | Pilot-only | Post-V1.1 tiered plan | — |
| Weekly founder check-in | Pilot-only | Not GA — scales with dedicated CS | — |
| P1 same-business-day response | Pilot only (draft) | Requires negotiated enterprise SLA | — |
| 24×7 NOC / on-call | — | — | Not offered in V1 |
| Formal uptime SLA % | — | Post-V1 owner decision | — |
| Self-serve support portal | — | V1.1+ roadmap | — |
| Dedicated CSM | — | V1.1+ | — |

### Support model links to proof bundle

- Open or unresolved P1/P2 issues at pilot end → flag in `go-no-go-summary.md` as potential HOLD signal.
- Support interaction log (anonymized) can be included in sponsor proof ZIP as evidence of responsiveness.
- Incident post-incident reviews (if any) are included in the first-pilot evidence bundle at buyer's option.

See [`PILOT_ACCEPTANCE_THRESHOLDS.md`](PILOT_ACCEPTANCE_THRESHOLDS.md) for how open issues affect the PASS/HOLD outcome.

### Honest posture statement (for buyer materials)

> ArchLucid V1 is a controlled pilot product with founder-led, white-glove support. We are not a 24×7 enterprise support organization yet. What we offer pilots is direct founder access, fast escalation, and evidence-backed remediation. If your procurement requires a formal SLA percentage, 24×7 NOC, or enterprise support tier, those are items for a future contract negotiation after the pilot validates value.

---

## Related documents

| Doc | Use |
|-----|-----|
| [SLA_SUMMARY.md](SLA_SUMMARY.md) | Buyer SLO summary |
| [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md) | Subscription and SLA exhibit framing |
| [PROCUREMENT_OBJECTION_PLAYBOOK.md](PROCUREMENT_OBJECTION_PLAYBOOK.md) | Standard objection responses |
| [INCIDENT_COMMUNICATIONS_POLICY.md](INCIDENT_COMMUNICATIONS_POLICY.md) | Incident notification |
| [CUSTOMER_ONBOARDING_PLAYBOOK.md](CUSTOMER_ONBOARDING_PLAYBOOK.md) | Onboarding checklist |
| [LEGAL_PROCUREMENT_TERMS_PACKET.md](LEGAL_PROCUREMENT_TERMS_PACKET.md) | Legal packet pointers into this support + pilot posture |

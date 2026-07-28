> **Reviewed:** 2026-07-27

> **Scope:** ArchLucid — Support and professional services (buyer summary), plus V1 controlled-pilot operating model (formerly `SUPPORT_AND_PILOT_OPERATING_MODEL.md`), plus incident communications policy and status-page plan (formerly the body of `INCIDENT_COMMUNICATIONS_POLICY.md`; that filename remains a path-stable deal-ready alias).  
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# ArchLucid — Support and professional services

**Audience:** Procurement, customer success, and technical evaluators assessing support entitlements before purchase; pilot champions running a V1 controlled pilot.

**Last reviewed:** 2026-07-27

**Pricing source:** Subscription tiers and list prices live only in [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md). This document describes **support and services posture**, not price figures.

**Incident communications + status-page plan:** [`#incident-communications-and-status-page`](#incident-communications-and-status-page) (`INCIDENT_COMMUNICATIONS_POLICY.md` alias).

**Related:** [SLA_SUMMARY.md](SLA_SUMMARY.md) (availability targets) · [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md) (contract framing) · [trust-center.md](trust-center.md) · [TRANSACTABLE_PROCUREMENT_PATH.md#legal-and-procurement-terms](TRANSACTABLE_PROCUREMENT_PATH.md#legal-and-procurement-terms)

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

Lower severities cover degraded performance, non-blocking defects, configuration questions, and general product guidance. See [`#incident-communications-and-status-page`](#incident-communications-and-status-page) for SEV-1–4 incident notification targets when availability is at risk (distinct from the support severity-1 model above).

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

**Full incident communications policy:** [`#incident-communications-and-status-page`](#incident-communications-and-status-page) (`INCIDENT_COMMUNICATIONS_POLICY.md` alias). Pilot table above is the abbreviated pilot rhythm; SEV timelines and status-page plan live in that section.

### Pilot operating rhythm

| Cadence | Activity | Artifact produced |
| --- | --- | --- |
| **Pre-pilot (week 0)** | Onboarding call; environment configuration; policy pack setup; baseline metric collection | Intake checklist completed; first run target set |
| **Weekly check-in** | Review run results; address open issues; adjust configuration if needed | Meeting notes in agreed channel |
| **Midpoint review (week 3)** | Qualitative interviews per [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) §3; scorecard midpoint fill | Midpoint qualitative scores captured |
| **End-of-pilot review (week 6)** | Final scorecard; ROI calculation; sponsor packet preparation | Proof bundle, `go-no-go-summary.md`, `first-value-report.md` |
| **Commercial close conversation** | Walk through [`QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist`](QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist) | Commercial state recorded (SEND / HOLD / DEFERRED_SCOPE) |

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

## Incident communications and status page {#incident-communications-and-status-page}

Former standalone body: `docs/go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md` → this section (filename kept as a path-stable deal-ready alias). Public status page is **planned**, not claimed as live.

**Audience:** Customers and internal operators; complements internal runbooks (not duplicated here). Also product/engineering planning the public status page.

**Canonical assurance wording:** [`ASSURANCE_STATUS_CANONICAL.md`](ASSURANCE_STATUS_CANONICAL.md)

This section describes how ArchLucid classifies service and security incidents and **communicates** with customers in a **SaaS** context. It aligns with correlation and support practices in [`../library/CUSTOMER_TRUST_AND_ACCESS.md`](../library/CUSTOMER_TRUST_AND_ACCESS.md) and service objectives in [`../library/API_SLOS.md`](../library/API_SLOS.md). [`#8-operational-transparency--status-page-plan`](#8-operational-transparency--status-page-plan) defines **where** and **how** a public status page will surface incidents (planned — not live).

Support **severity-1** (narrow, ticket SLAs above) is **not** the same scale as incident **SEV-1–4** below — do not collapse the two systems.

### Objective

- Provide **timely**, **accurate** incident communication.
- Separate **service availability** incidents from **security** incidents (personal data breach) per [`DPA_TEMPLATE.md`](DPA_TEMPLATE.md).

### Severity classification (SEV-1–4)

| Severity | Description | Examples |
|----------|-------------|----------|
| **SEV-1** | Critical — service **unavailable** or **severely degraded** for **all** or **most** tenants | Regional outage, data plane unavailable, auth broken for Entra path |
| **SEV-2** | Major — **subset** of tenants or **material features** impaired | Elevated 5xx on critical paths, worker backlog causing governance delay |
| **SEV-3** | Minor — limited impact, **workaround** exists | Single feature degraded, non-critical background lag |
| **SEV-4** | Low — **no** material customer impact | Cosmetic UI, internal-only tooling |

### Communication timelines (service incidents)

Targets are **goals**; actual events may require adjustment (e.g., unknown root cause).

| Severity | Initial customer-visible notice | Updates | Post-incident summary |
|----------|----------------------------------|---------|------------------------|
| **SEV-1** | Within **1 hour** of confirmed impact | At least every **30 minutes** while impact continues | Within **5 business days** (root cause, impact, remediation) |
| **SEV-2** | Within **4 hours** | At least every **2 hours** while impact continues | Within **10 business days** |
| **SEV-3** | Next business day or in scheduled report | As needed | Optional summary |
| **SEV-4** | Monthly operations / release notes | — | — |

**Channels:** public status page URL is published in [`trust-center.md`](trust-center.md) once live; until then, use `security@archlucid.net` for incident notices and procurement follow-up. In-app banners remain SEV-1/2 communication channel when available.

### Security incidents and personal data breaches

If an incident involves **unauthorized access to** or **loss of** Personal Data (as defined in [`DPA_TEMPLATE.md`](DPA_TEMPLATE.md)):

- **Processor** notifies **Controller** **without undue delay** after becoming aware, and within **72 hours** where **GDPR Article 33** applies and Processor is responsible, unless a different timeline is required by law.
- Communication includes **known facts**, **containment** steps, and **recommended customer actions** (e.g., rotate API keys, review audit export).

Internal technical response may reference **[`../runbooks/`](../runbooks/)**; those runbooks are **not** customer-facing.

### Customer responsibilities

- Include **`X-Correlation-ID`** on API requests when reporting issues so support can align logs across edge, API, and audit ([`../library/CUSTOMER_TRUST_AND_ACCESS.md`](../library/CUSTOMER_TRUST_AND_ACCESS.md) §8).
- Provide a **security contact** on file for DPA and incident notices.

### Post-incident review (internal)

Blameless review covers: **timeline**, **customer impact**, **root cause**, **remediation**, **preventive actions**. Outputs may feed **SOC 2** evidence ([`ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap`](ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap)).

### Escalation contacts

| Role | Contact |
|------|---------|
| Security | `security@archlucid.net` |
| Support (interim) | `security@archlucid.net` |

### Operational transparency / status page plan {#8-operational-transparency--status-page-plan}

SaaS buyers — especially in enterprise and regulated environments — need confidence that service disruptions will be **visible**, **communicated**, and **resolved transparently**. The sections above define **what** we communicate; this subsection defines **where** and **how**. The public status page is **planned**, not claimed as live.

#### Status page options

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **Atlassian Statuspage** | Industry standard, subscriber notifications, API, components/groups, incident templates | Vendor dependency, monthly cost ($29–$399+/mo) | Medium |
| **Instatus** | Modern UI, generous free tier, API, custom domain | Smaller ecosystem, fewer enterprise references | Low |
| **GitHub repo + Actions** | Free, version-controlled, RSS via releases | Manual, lacks subscriber notifications, less professional appearance | Free |
| **Cachet (self-hosted)** | Full control, open-source | Operational overhead, maintenance burden | Low (infra cost) |

**Recommendation:** Start with **Instatus** (free tier) or **Atlassian Statuspage** (Starter) — lowest effort to a professional public page. Migrate to a higher tier or self-hosted solution if requirements grow.

#### Components to track

| Component | Maps to | Health source |
|-----------|---------|---------------|
| **API** | `ArchLucid.Api` | Synthetic probe (`GET /health/live`, `GET /version`) |
| **Web UI** | `archlucid-ui` (Next.js) | HTTP check on UI hostname |
| **Agent pipeline** | Run execution via Worker | Outbox convergence metric; run completion rate |
| **Authentication** | Entra ID / API key validation | Synthetic authenticated request or Entra status |
| **Background processing** | `ArchLucid.Worker` | Worker heartbeat, outbox age gauge |

#### Mapping to incident severity

| Status page state | Incident severity | Description |
|-------------------|-------------------|-------------|
| **Operational** | — | All components healthy |
| **Degraded performance** | SEV-3 | Minor impact, workaround available |
| **Partial outage** | SEV-2 | Subset of tenants or features impaired |
| **Major outage** | SEV-1 | Service unavailable for all or most tenants |
| **Under maintenance** | Planned | Scheduled maintenance window per [`SLA_SUMMARY.md`](SLA_SUMMARY.md) §3 |

#### Integration points

- **Prometheus/Grafana alerts** → Status page updates. **Phase 1:** Manual update by on-call when alert fires. **Phase 3:** Automate via status page API (e.g., Statuspage API `POST /incidents` triggered by alert webhook).
- **Incident communications** → Status page is the **primary public channel** for SEV-1 and SEV-2 incidents (see communication timelines above).
- **Synthetic probes** (GitHub Actions) → Feed uptime percentage displayed on the status page.

#### Implementation plan

| Phase | Scope | Timeline target |
|-------|-------|---------------------|
| **Phase 1** | Choose provider, create page with 5 components, add URL to [`trust-center.md`](trust-center.md), [`SLA_SUMMARY.md`](SLA_SUMMARY.md), and channels above | Near-term |
| **Phase 2** | Manual incident updates aligned with this policy; team trained on update workflow | With first production customer |
| **Phase 3** | Automated uptime checks feeding the page; alert-to-incident webhook integration | Post Phase 2 stabilization |

When a dedicated status URL is published, keep [`SLA_SUMMARY.md`](SLA_SUMMARY.md) §8 and the channels language above aligned in the same change.

Former standalone plan: `docs/go-to-market/OPERATIONAL_TRANSPARENCY.md` → [`#8-operational-transparency--status-page-plan`](#8-operational-transparency--status-page-plan).

---

## Related documents

| Doc | Use |
|-----|-----|
| [SLA_SUMMARY.md](SLA_SUMMARY.md) | Buyer SLO summary |
| [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md) | Subscription and SLA exhibit framing |
| [BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-objection-playbook](BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-objection-playbook) (`PROCUREMENT_OBJECTION_PLAYBOOK.md` alias) | Standard objection responses |
| [`#incident-communications-and-status-page`](#incident-communications-and-status-page) · [`INCIDENT_COMMUNICATIONS_POLICY.md`](INCIDENT_COMMUNICATIONS_POLICY.md) (alias) | Incident notification + status-page plan |
| [PILOT_SUCCESS_SCORECARD.md](PILOT_SUCCESS_SCORECARD.md) | Onboarding / scorecard (customer onboarding playbook folded there) |
| [TRANSACTABLE_PROCUREMENT_PATH.md#legal-and-procurement-terms](TRANSACTABLE_PROCUREMENT_PATH.md#legal-and-procurement-terms) | Legal packet pointers into this support + pilot posture |

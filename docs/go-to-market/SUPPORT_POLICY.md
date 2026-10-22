> **Reviewed:** 2026-07-27

> **Scope:** ArchLucid — Support and professional services (buyer summary), plus V1 controlled-pilot operating model (formerly `SUPPORT_AND_PILOT_OPERATING_MODEL.md`), plus incident communications policy and status-page plan (formerly the body of `INCIDENT_COMMUNICATIONS_POLICY.md`; that filename remains a path-stable deal-ready alias), plus buyer service-level objectives / hosted SaaS availability target / backup-DR (formerly the body of `SLA_SUMMARY.md`; that filename remains a path-stable deal-ready alias).  
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# ArchLucid — Support and professional services

**Audience:** Procurement, customer success, and technical evaluators assessing support entitlements before purchase; pilot champions running a V1 controlled pilot.

**Last reviewed:** 2026-07-27

**Pricing source:** Subscription tiers and list prices live only in [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md). This document describes **support and services posture**, not price figures.

**Incident communications + status-page plan:** [`#incident-communications-and-status-page`](#incident-communications-and-status-page) (`INCIDENT_COMMUNICATIONS_POLICY.md` alias).

**Service level objectives + backup/DR:** [`#service-level-objectives`](#service-level-objectives) (`SLA_SUMMARY.md` alias; hosted target [`#hosted-saas-availability-target`](#hosted-saas-availability-target)).

**Related:** [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md) (contract framing) · [trust-center.md](trust-center.md) · [QUOTE_TO_PROOF_PACKET.md#legal-and-procurement-terms](QUOTE_TO_PROOF_PACKET.md#legal-and-procurement-terms) (`TRANSACTABLE_PROCUREMENT_PATH.md` alias)

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

## Service level objectives {#service-level-objectives}

Former standalone body: `docs/go-to-market/SLA_SUMMARY.md` → this section (filename kept as a path-stable deal-ready alias). For engineering depth (Prometheus rules, OTel metrics, burn-rate math), see [`../library/API_SLOS.md`](../library/API_SLOS.md).

**Important:** Team and Professional tiers receive **engineering SLO targets** below. **Contractual SLA terms and service credits apply to Enterprise only** when included in the executed commercial agreement. See [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md).

ArchLucid does **not** assert production SLA compliance without production probe evidence and owner-approved contractual terms.

### 1. Availability

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Monthly availability** | **99.9%** | Ratio of successful API responses (**non-5xx**) to total requests, measured over a **30-day rolling window** (same SLI as Prometheus burn-rate rules in `infra/prometheus/archlucid-slo-rules.yml`). |

**Tier posture:**

| Tier | Target | Contractual SLA / credits |
|------|--------|---------------------------|
| Team | 99.9% engineering target | No credits |
| Professional | 99.9% engineering target | No credits |
| Enterprise | 99.9% monthly (hosted API + architect workspace) | Availability-based service credits when included in executed agreement |

**What counts as downtime:** Periods where the API fails to meet the availability target above. **5xx rate** is the same signal: a **99.9%** target implies at most **0.1%** of requests may be **5xx** over the window for that measurement. Planned maintenance windows that are communicated in advance are **excluded** from the availability calculation.

#### Error rate (5xx)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **HTTP 5xx** | ≤ **0.1%** of requests | 30-day rolling window; server-side counts (pairs with availability SLI above). |

**LLM provider carve-out:** Contract may define a **separate** sub-budget for documented upstream model unavailability; see [`../library/API_SLOS.md`](../library/API_SLOS.md).

### 2. Latency

Latency is **tiered** so infrastructure probes, standard API traffic, and **AI-augmented** routes each have credible targets. Full table: [`../library/API_SLOS.md`](../library/API_SLOS.md) § *Latency tiers (customer-visible)*.

| Tier | Examples | **p95** (customer-visible) | **p99** (customer-visible) |
|------|----------|----------------------------|---------------------------|
| **1 — Infrastructure** | `GET /health/live`, `GET /version` | **< 300 ms** | **< 500 ms** |
| **2 — Synchronous API** | Typical reads/writes without LLM in the hot path | **< 800 ms** | **< 1.5 s** |
| **3 — AI-augmented** | Documented LLM-backed request paths | **< 8 s** | *tracked internally until pilot proof* |

**Async work:** Operations that return **202** + polling are measured on **polling** latency (Tier **2**), not end-to-end job duration.

### 3. Planned maintenance

| Commitment | Detail |
|------------|--------|
| **Advance notice** | **72 hours** minimum for scheduled maintenance that may affect availability. |
| **Maintenance windows** | **Sunday early-morning** window in the customer's primary region/time zone. |
| **Zero-downtime target** | Rolling deployments are the default; maintenance requiring downtime is exceptional and always communicated. |
| **Emergency security maintenance** | May occur with shorter notice. |

### 4. Service credits (Enterprise only)

**Enterprise only:** When included in an executed Enterprise agreement, availability-based service credits are **monthly capped** and the customer's **sole remedy** for availability shortfalls. Credits do **not** apply to support response-time targets. Percentage schedule is defined in the order form / SLA exhibit.

Team and Professional receive **no service credits** — 99.9% remains an engineering target only.

### 5. Exclusions

The availability target does **not** apply to:

- **Scheduled maintenance** communicated per §3.
- **Force majeure** events (natural disasters, widespread infrastructure outages beyond ArchLucid's control).
- **Customer-caused issues** (misconfigured API keys, blocked network paths, excessive request volumes beyond agreed limits).
- **Beta or preview features** explicitly marked as such.
- **Third-party cloud outages** outside ArchLucid control.

### 6. How we measure

- **Internal monitoring:** Continuous server-side metrics collected via OpenTelemetry, aggregated into availability ratios and latency percentiles. Burn-rate alerts detect budget consumption before it becomes visible to customers.
- **External probes:** Periodic synthetic checks from outside the cluster verify reachability and basic response correctness of health and version endpoints — see [`#hosted-saas-availability-target`](#hosted-saas-availability-target) for minute-based hosted product measurement.
- **Engineering detail:** [`../library/API_SLOS.md`](../library/API_SLOS.md).

### Hosted SaaS availability target {#hosted-saas-availability-target}

Former standalone body: `docs/library/SLA_TARGETS.md` → this section (filename kept as a path-stable alias). Pre-GA **target**, not a contractual SLA until negotiated per customer.

#### Service availability target (API + architect workspace)

| Surface | Monthly target | Notes |
|---------|----------------|--------|
| **ArchLucid API** + **operator web UI** | **99.9%** | Reflects Azure Container Apps + Azure SQL high-availability posture for the hosted stack. |

**Meaning:** For each calendar month, we target at least **99.9%** uptime for API and architect workspace together, measured as described below.

**Relationship to HTTP SLOs:** The **HTTP** rolling objective in [`../library/API_SLOS.md`](../library/API_SLOS.md) and §1 above is aligned to **99.9%** availability (non-5xx / all requests) with tiered latency; this section states the **full hosted product** (API + UI) narrative **also** at **99.9%** for packaging and Trust Center. Minute-based probe signal differs from the request-ratio SLI — both are engineering targets.

#### Probe measurement

**Availability** = (total minutes − downtime minutes) ÷ total minutes × 100.

**Downtime:** `/health/live` on the API returns **non-200** for **5+ consecutive minutes** from an **external** synthetic probe (same class of signal as [`.github/workflows/api-synthetic-probe.yml`](../../.github/workflows/api-synthetic-probe.yml)). Architect workspace availability uses the **production Front Door / UI hostname** with an equivalent **HTTP 2xx** check on a configured health or shell route as exercised by [`.github/workflows/hosted-saas-probe.yml`](../../.github/workflows/hosted-saas-probe.yml).

#### Exclusions (hosted product narrative)

Targets **do not** apply during:

- **Scheduled maintenance** communicated with at least **72 hours** notice (same buyer commitment as §3 — previously a 48h draft in `SLA_TARGETS.md`; **72h** is the SoT shared with MSA / order-form wording).
- **Force majeure** and **third-party cloud outages** outside ArchLucid’s direct control.
- **Customer-caused** outages (blocked networks, invalid configuration, abuse).

#### Disaster recovery pointer

For **RTO/RPO** estimates and backup posture, see [`../library/RTO_RPO_TARGETS.md`](../library/RTO_RPO_TARGETS.md) and [#9-backup-disaster-recovery-and-data-lifecycle](#9-backup-disaster-recovery-and-data-lifecycle).

#### Monitoring evidence

Synthetic and operational probes (including scheduled GitHub Actions workflows above) demonstrate ongoing measurement investment; they are **canaries**, not by themselves a monthly percentage.

### 7. Incident response (SLO pointer)

When availability or latency targets are at risk, the [incident communications](#incident-communications-and-status-page) section governs customer notification (SEV-1–4 timelines). Support severity-1–4 above is a separate ticket taxonomy.

### 8. Status page (SLO pointer)

Public status URL is published in [trust-center.md](trust-center.md). Until a dedicated URL is live, incident updates are routed through [incident communications channels](#incident-communications-and-status-page). Implementation plan: [`#8-operational-transparency--status-page-plan`](#8-operational-transparency--status-page-plan).

### 9. Backup, disaster recovery, and data lifecycle {#9-backup-disaster-recovery-and-data-lifecycle}

Former standalone: `docs/go-to-market/BACKUP_AND_DR.md` → this section.

This section describes ArchLucid's backup, disaster recovery, and data lifecycle posture **honestly** — stating what is in place, what uses Azure platform defaults, and what is roadmap. Engineering RTO/RPO depth: [`../library/RTO_RPO_TARGETS.md`](../library/RTO_RPO_TARGETS.md).

#### Backup

##### Azure SQL Database

| Property | Value |
|----------|-------|
| **Backup type** | Azure SQL automated backups (full, differential, transaction log) |
| **Point-in-time restore** | Azure SQL default retention window (7–35 days depending on service tier; standard default is **7 days**) |
| **Geo-redundant backup** | Available when configured via Terraform (`infra/terraform-sql-failover/`); enables restore to a paired region |
| **Encryption** | Backups are encrypted at rest via Transparent Data Encryption (TDE) — Azure platform default |

Operators should confirm the configured retention window in their Azure subscription and adjust if business requirements exceed the default.

##### Blob storage

| Property | Value |
|----------|-------|
| **Soft delete** | Not configured by default in the current Terraform modules; **roadmap** item |
| **Versioning** | Not configured by default; **roadmap** item |
| **Geo-replication** | Available at the storage account level (GRS/RA-GRS); not enforced by default |

Blob storage holds optional agent execution traces and export artifacts. Operators deploying in production should enable soft delete and consider versioning based on data classification requirements.

#### Disaster recovery

##### SQL failover group

ArchLucid's infrastructure includes a Terraform module for **Azure SQL failover groups** (`infra/terraform-sql-failover/`), enabling automatic failover to a secondary region.

| Property | Estimate |
|----------|----------|
| **RPO** (Recovery Point Objective) | **< 5 minutes** (Azure SQL async geo-replication; actual depends on replication lag) |
| **RTO** (Recovery Time Objective) | **< 1 hour** (includes DNS propagation, application reconnection, and verification) |

These are **current best estimates**, not contractual commitments. Formalized RTO/RPO targets will be documented in the commercial SLA when available. See also [`../library/RTO_RPO_TARGETS.md`](../library/RTO_RPO_TARGETS.md).

##### Geo-failover drill

An internal drill runbook exists and is exercised periodically to validate failover procedures, measure actual RTO/RPO, and identify gaps. Drill results inform infrastructure improvements.

##### Application resilience

- **Connection resiliency:** `ResilientSqlConnectionFactory` with retry and circuit-breaker patterns.
- **Worker recovery:** Background services recover from transient failures; integration event outbox ensures at-least-once delivery.
- **Multi-host:** API and Worker can be deployed on separate compute instances for independent scaling and failure isolation.

#### Data lifecycle

##### Retention defaults

ArchLucid retains customer data **until archived or deleted by operator workflows**. There is no automatic purge on a fixed schedule — operators control data lifecycle through:

- **Run archival:** Reviews, architecture packages (API: golden manifests), and findings snapshots carry `ArchivedUtc` columns; archived data is excluded from active queries.
- **Audit events:** Append-only in SQL with export capabilities (CSV via `GET /v1/audit/export`). Retention is operator-managed.
- **Agent traces:** Optional full-prompt persistence in blob storage; lifecycle follows blob retention configuration.

##### Data deletion on termination

On contract termination, ArchLucid deletes customer data per the timeline agreed in the [DPA](DPA_TEMPLATE.md) (§9). Customers may export data prior to termination using product export features (DOCX/ZIP exports, audit CSV).

##### Data export

| Method | Scope | Access |
|--------|-------|--------|
| DOCX / ZIP export | Architecture artifacts, manifests | Operator or Admin role |
| Audit CSV | Typed audit events | Auditor or Admin role |
| API (JSON) | All data accessible via REST API | Per endpoint RBAC |

#### What we do NOT claim (yet)

| Capability | Status |
|------------|--------|
| Cross-region **active-active** | Not available; failover is active-passive |
| Customer-controlled **backup schedules** | Uses Azure platform defaults; not exposed to customers |
| Blob **geo-replication** enforcement | Available but not enforced by default |
| Customer-managed **encryption keys** (BYOK) | Not available; uses Azure-managed keys |
| Guaranteed **RTO/RPO** in SLA | Estimates only; formalization pending |

Do not invent stronger DR/attestation claims here — align wording with [ASSURANCE_STATUS_CANONICAL.md](ASSURANCE_STATUS_CANONICAL.md).

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
| Data confidentiality incident (suspected or confirmed) | Notify buyer sponsor sponsor within 24 hours; provide written incident summary within 72 hours |
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
| **Under maintenance** | Planned | Scheduled maintenance window per [planned maintenance](#3-planned-maintenance) |

#### Integration points

- **Prometheus/Grafana alerts** → Status page updates. **Phase 1:** Manual update by on-call when alert fires. **Phase 3:** Automate via status page API (e.g., Statuspage API `POST /incidents` triggered by alert webhook).
- **Incident communications** → Status page is the **primary public channel** for SEV-1 and SEV-2 incidents (see communication timelines above).
- **Synthetic probes** (GitHub Actions) → Feed uptime percentage displayed on the status page.

#### Implementation plan

| Phase | Scope | Timeline target |
|-------|-------|---------------------|
| **Phase 1** | Choose provider, create page with 5 components, add URL to [`trust-center.md`](trust-center.md), this support policy (status-page + SLO sections), and channels above | Near-term |
| **Phase 2** | Manual incident updates aligned with this policy; team trained on update workflow | With first production customer |
| **Phase 3** | Automated uptime checks feeding the page; alert-to-incident webhook integration | Post Phase 2 stabilization |

When a dedicated status URL is published, keep [status page (SLO pointer)](#8-status-page-slo-pointer) and the channels language above aligned in the same change.

Former standalone plan: `docs/go-to-market/OPERATIONAL_TRANSPARENCY.md` → [`#8-operational-transparency--status-page-plan`](#8-operational-transparency--status-page-plan).

---

## Related documents

| Doc | Use |
|-----|-----|
| [`#service-level-objectives`](#service-level-objectives) · [`SLA_SUMMARY.md`](SLA_SUMMARY.md) (alias) | Buyer SLO summary + hosted target + backup/DR |
| [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md) | Subscription and SLA exhibit framing |
| [BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-objection-playbook](BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-objection-playbook) (`PROCUREMENT_OBJECTION_PLAYBOOK.md` alias) | Standard objection responses |
| [`#incident-communications-and-status-page`](#incident-communications-and-status-page) · [`INCIDENT_COMMUNICATIONS_POLICY.md`](INCIDENT_COMMUNICATIONS_POLICY.md) (alias) | Incident notification + status-page plan |
| [PILOT_SUCCESS_SCORECARD.md](PILOT_SUCCESS_SCORECARD.md) | Onboarding / scorecard (customer onboarding playbook folded there) |
| [QUOTE_TO_PROOF_PACKET.md#legal-and-procurement-terms](QUOTE_TO_PROOF_PACKET.md#legal-and-procurement-terms) · [TRANSACTABLE_PROCUREMENT_PATH.md](TRANSACTABLE_PROCUREMENT_PATH.md) (alias) | Legal packet pointers into this support + pilot posture |

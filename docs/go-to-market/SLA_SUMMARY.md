> **Reviewed:** 2026-07-26

> **Scope:** ArchLucid — Service level objectives (buyer summary) plus backup, disaster recovery, and data lifecycle (formerly `BACKUP_AND_DR.md`). Full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid — Service level objectives (buyer summary)

**Audience:** Procurement, security reviewers, and technical evaluators assessing ArchLucid's reliability commitments.

**Last reviewed:** 2026-07-26

ArchLucid targets **high availability and low latency** for the production API. This document translates internal engineering objectives into buyer-readable commitments and states backup / DR / data-lifecycle posture honestly. For engineering depth (Prometheus rules, OTel metrics, burn-rate math), see [../API_SLOS.md](../library/API_SLOS.md).

**Support entitlements:** [SUPPORT_POLICY.md](SUPPORT_POLICY.md) — per-tier support, severity definitions, professional services, and feature-commitment posture (owner terms resolved 2026-05-30).

**Important:** Team and Professional tiers receive **engineering SLO targets** below. **Contractual SLA terms and service credits apply to Enterprise only** when included in the executed commercial agreement. See [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md).

---

## 1. Availability

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Monthly availability** | **99.9%** | Ratio of successful API responses (**non-5xx**) to total requests, measured over a **30-day rolling window** (same SLI as Prometheus burn-rate rules in `infra/prometheus/archlucid-slo-rules.yml`). |

**Tier posture:**

| Tier | Target | Contractual SLA / credits |
|------|--------|---------------------------|
| Team | 99.9% engineering target | No credits |
| Professional | 99.9% engineering target | No credits |
| Enterprise | 99.9% monthly (hosted API + architect workspace) | Availability-based service credits when included in executed agreement — [SUPPORT_POLICY.md](SUPPORT_POLICY.md) |

**What counts as downtime:** Periods where the API fails to meet the availability target above. **5xx rate** is the same signal: a **99.9%** target implies at most **0.1%** of requests may be **5xx** over the window for that measurement. Planned maintenance windows that are communicated in advance are **excluded** from the availability calculation.

### Error rate (5xx)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **HTTP 5xx** | ≤ **0.1%** of requests | 30-day rolling window; server-side counts (pairs with availability SLI above). |

**LLM provider carve-out:** Contract may define a **separate** sub-budget for documented upstream model unavailability; see [../library/API_SLOS.md](../library/API_SLOS.md).

---

## 2. Latency

Latency is **tiered** so infrastructure probes, standard API traffic, and **AI-augmented** routes each have credible targets. Full table: [../library/API_SLOS.md](../library/API_SLOS.md) § *Latency tiers (customer-visible)*.

| Tier | Examples | **p95** (customer-visible) | **p99** (customer-visible) |
|------|----------|----------------------------|---------------------------|
| **1 — Infrastructure** | `GET /health/live`, `GET /version` | **< 300 ms** | **< 500 ms** |
| **2 — Synchronous API** | Typical reads/writes without LLM in the hot path | **< 800 ms** | **< 1.5 s** |
| **3 — AI-augmented** | Documented LLM-backed request paths | **< 8 s** | *tracked internally until pilot proof* |

**Async work:** Operations that return **202** + polling are measured on **polling** latency (Tier **2**), not end-to-end job duration.

Engineering detail (synthetic probes, Prometheus histograms, internal early warnings): [../library/API_SLOS.md](../library/API_SLOS.md).

---

## 3. Planned maintenance

| Commitment | Detail |
|------------|--------|
| **Advance notice** | **72 hours** minimum for scheduled maintenance that may affect availability. |
| **Maintenance windows** | **Sunday early-morning** window in the customer's primary region/time zone (see [SUPPORT_POLICY.md](SUPPORT_POLICY.md)). |
| **Zero-downtime target** | Rolling deployments are the default; maintenance requiring downtime is exceptional and always communicated. |

---

## 4. Service credits

**Enterprise only:** When included in an executed Enterprise agreement, availability-based service credits are **monthly capped** and the customer's **sole remedy** for availability shortfalls. Credits do **not** apply to support response-time targets. Percentage schedule is defined in the order form / SLA exhibit.

Team and Professional receive **no service credits** — 99.9% remains an engineering target only. Full posture: [SUPPORT_POLICY.md](SUPPORT_POLICY.md).

---

## 5. Exclusions

The availability target does **not** apply to:

- **Scheduled maintenance** communicated per §3.
- **Force majeure** events (natural disasters, widespread infrastructure outages beyond ArchLucid's control).
- **Customer-caused issues** (misconfigured API keys, blocked network paths, excessive request volumes beyond agreed limits).
- **Beta or preview features** explicitly marked as such.

---

## 6. How we measure

- **Internal monitoring:** Continuous server-side metrics collected via OpenTelemetry, aggregated into availability ratios and latency percentiles. Burn-rate alerts detect budget consumption before it becomes visible to customers.
- **External probes:** Periodic synthetic checks from outside the cluster verify reachability and basic response correctness of health and version endpoints.
- **Engineering detail:** [../API_SLOS.md](../library/API_SLOS.md).

---

## 7. Incident response

When availability or latency targets are at risk, the incident communications policy governs customer notification:

- **SEV-1 (service unavailable):** Customer notification within **1 hour**; updates every **30 minutes**.
- **SEV-2 (degraded):** Notification within **4 hours**; updates every **2 hours**.
- Full details: [INCIDENT_COMMUNICATIONS_POLICY.md](INCIDENT_COMMUNICATIONS_POLICY.md).

---

## 8. Status page

Public status URL is published in [trust-center.md](trust-center.md). Until a dedicated URL is live, incident updates are routed through [INCIDENT_COMMUNICATIONS_POLICY.md](INCIDENT_COMMUNICATIONS_POLICY.md) channels (`security@archlucid.net` fallback).

See [INCIDENT_COMMUNICATIONS_POLICY.md](INCIDENT_COMMUNICATIONS_POLICY.md#8-operational-transparency--status-page-plan) for the status page implementation plan.

---

## 9. Backup, disaster recovery, and data lifecycle

Former standalone: `docs/go-to-market/BACKUP_AND_DR.md` → this section.

This section describes ArchLucid's backup, disaster recovery, and data lifecycle posture **honestly** — stating what is in place, what uses Azure platform defaults, and what is roadmap. Engineering RTO/RPO depth: [`../library/RTO_RPO_TARGETS.md`](../library/RTO_RPO_TARGETS.md).

### Backup

#### Azure SQL Database

| Property | Value |
|----------|-------|
| **Backup type** | Azure SQL automated backups (full, differential, transaction log) |
| **Point-in-time restore** | Azure SQL default retention window (7–35 days depending on service tier; standard default is **7 days**) |
| **Geo-redundant backup** | Available when configured via Terraform (`infra/terraform-sql-failover/`); enables restore to a paired region |
| **Encryption** | Backups are encrypted at rest via Transparent Data Encryption (TDE) — Azure platform default |

Operators should confirm the configured retention window in their Azure subscription and adjust if business requirements exceed the default.

#### Blob storage

| Property | Value |
|----------|-------|
| **Soft delete** | Not configured by default in the current Terraform modules; **roadmap** item |
| **Versioning** | Not configured by default; **roadmap** item |
| **Geo-replication** | Available at the storage account level (GRS/RA-GRS); not enforced by default |

Blob storage holds optional agent execution traces and export artifacts. Operators deploying in production should enable soft delete and consider versioning based on data classification requirements.

### Disaster recovery

#### SQL failover group

ArchLucid's infrastructure includes a Terraform module for **Azure SQL failover groups** (`infra/terraform-sql-failover/`), enabling automatic failover to a secondary region.

| Property | Estimate |
|----------|----------|
| **RPO** (Recovery Point Objective) | **< 5 minutes** (Azure SQL async geo-replication; actual depends on replication lag) |
| **RTO** (Recovery Time Objective) | **< 1 hour** (includes DNS propagation, application reconnection, and verification) |

These are **current best estimates**, not contractual commitments. Formalized RTO/RPO targets will be documented in the commercial SLA when available. See also [`../library/RTO_RPO_TARGETS.md`](../library/RTO_RPO_TARGETS.md).

#### Geo-failover drill

An internal drill runbook exists and is exercised periodically to validate failover procedures, measure actual RTO/RPO, and identify gaps. Drill results inform infrastructure improvements.

#### Application resilience

- **Connection resiliency:** `ResilientSqlConnectionFactory` with retry and circuit-breaker patterns.
- **Worker recovery:** Background services recover from transient failures; integration event outbox ensures at-least-once delivery.
- **Multi-host:** API and Worker can be deployed on separate compute instances for independent scaling and failure isolation.

### Data lifecycle

#### Retention defaults

ArchLucid retains customer data **until archived or deleted by operator workflows**. There is no automatic purge on a fixed schedule — operators control data lifecycle through:

- **Run archival:** Reviews, architecture packages (API: golden manifests), and findings snapshots carry `ArchivedUtc` columns; archived data is excluded from active queries.
- **Audit events:** Append-only in SQL with export capabilities (CSV via `GET /v1/audit/export`). Retention is operator-managed.
- **Agent traces:** Optional full-prompt persistence in blob storage; lifecycle follows blob retention configuration.

#### Data deletion on termination

On contract termination, ArchLucid deletes customer data per the timeline agreed in the [DPA](DPA_TEMPLATE.md) (§9). Customers may export data prior to termination using product export features (DOCX/ZIP exports, audit CSV).

#### Data export

| Method | Scope | Access |
|--------|-------|--------|
| DOCX / ZIP export | Architecture artifacts, manifests | Operator or Admin role |
| Audit CSV | Typed audit events | Auditor or Admin role |
| API (JSON) | All data accessible via REST API | Per endpoint RBAC |

### What we do NOT claim (yet)

| Capability | Status |
|------------|--------|
| Cross-region **active-active** | Not available; failover is active-passive |
| Customer-controlled **backup schedules** | Uses Azure platform defaults; not exposed to customers |
| Blob **geo-replication** enforcement | Available but not enforced by default |
| Customer-managed **encryption keys** (BYOK) | Not available; uses Azure-managed keys |
| Guaranteed **RTO/RPO** in SLA | Estimates only; formalization pending |

Do not invent stronger DR/attestation claims here — align wording with [ASSURANCE_STATUS_CANONICAL.md](ASSURANCE_STATUS_CANONICAL.md).

---

## Related documents

| Doc | Use |
|-----|-----|
| [trust-center.md](trust-center.md) | Trust index |
| [ASSURANCE_STATUS_CANONICAL.md](ASSURANCE_STATUS_CANONICAL.md) | Canonical assurance wording |
| [../API_SLOS.md](../library/API_SLOS.md) | Engineering SLO detail |
| [../library/RTO_RPO_TARGETS.md](../library/RTO_RPO_TARGETS.md) | Engineering RTO/RPO targets |
| [INCIDENT_COMMUNICATIONS_POLICY.md](INCIDENT_COMMUNICATIONS_POLICY.md) | Incident classification and comms |
| [SUPPORT_POLICY.md](SUPPORT_POLICY.md) | Support entitlements and professional services |
| [DPA_TEMPLATE.md](DPA_TEMPLATE.md) | Data deletion on termination (§9) |
| [TENANT_ISOLATION.md](TENANT_ISOLATION.md) | Data isolation architecture |
| [SUBPROCESSORS.md](SUBPROCESSORS.md) | Azure services and data residency |

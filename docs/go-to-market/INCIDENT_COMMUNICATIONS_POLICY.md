> **Reviewed:** 2026-07-26

> **Scope:** ArchLucid incident communications policy plus the operational transparency / status-page plan (formerly `OPERATIONAL_TRANSPARENCY.md`). Public status page is **planned**, not claimed as live.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid — Incident communications policy

**Audience:** Customers and internal operators; complements internal runbooks (not duplicated here). Also product/engineering planning the public status page.

**Last reviewed:** 2026-07-26

**Canonical assurance wording:** [ASSURANCE_STATUS_CANONICAL.md](ASSURANCE_STATUS_CANONICAL.md)

This policy describes how ArchLucid classifies service and security incidents and **communicates** with customers in a **SaaS** context. It aligns with correlation and support practices in [../CUSTOMER_TRUST_AND_ACCESS.md](../library/CUSTOMER_TRUST_AND_ACCESS.md) and service objectives in [../API_SLOS.md](../library/API_SLOS.md). [§8 Operational transparency](#8-operational-transparency--status-page-plan) defines **where** and **how** a public status page will surface incidents (planned — not live).

---

## 1. Objective

- Provide **timely**, **accurate** incident communication.
- Separate **service availability** incidents from **security** incidents (personal data breach) per [DPA_TEMPLATE.md](DPA_TEMPLATE.md).

---

## 2. Severity classification

| Severity | Description | Examples |
|----------|-------------|----------|
| **SEV-1** | Critical — service **unavailable** or **severely degraded** for **all** or **most** tenants | Regional outage, data plane unavailable, auth broken for Entra path |
| **SEV-2** | Major — **subset** of tenants or **material features** impaired | Elevated 5xx on critical paths, worker backlog causing governance delay |
| **SEV-3** | Minor — limited impact, **workaround** exists | Single feature degraded, non-critical background lag |
| **SEV-4** | Low — **no** material customer impact | Cosmetic UI, internal-only tooling |

---

## 3. Communication timelines (service incidents)

Targets are **goals**; actual events may require adjustment (e.g., unknown root cause).

| Severity | Initial customer-visible notice | Updates | Post-incident summary |
|----------|----------------------------------|---------|------------------------|
| **SEV-1** | Within **1 hour** of confirmed impact | At least every **30 minutes** while impact continues | Within **5 business days** (root cause, impact, remediation) |
| **SEV-2** | Within **4 hours** | At least every **2 hours** while impact continues | Within **10 business days** |
| **SEV-3** | Next business day or in scheduled report | As needed | Optional summary |
| **SEV-4** | Monthly operations / release notes | — | — |

**Channels:** public status page URL is published in [trust-center.md](trust-center.md) once live; until then, use `security@archlucid.net` for incident notices and procurement follow-up. In-app banners remain SEV-1/2 communication channel when available.

---

## 4. Security incidents and personal data breaches

If an incident involves **unauthorized access to** or **loss of** Personal Data (as defined in [DPA_TEMPLATE.md](DPA_TEMPLATE.md)):

- **Processor** notifies **Controller** **without undue delay** after becoming aware, and within **72 hours** where **GDPR Article 33** applies and Processor is responsible, unless a different timeline is required by law.
- Communication includes **known facts**, **containment** steps, and **recommended customer actions** (e.g., rotate API keys, review audit export).

Internal technical response may reference **[../runbooks/](../runbooks/)**; those runbooks are **not** customer-facing.

---

## 5. Customer responsibilities

- Include **`X-Correlation-ID`** on API requests when reporting issues so support can align logs across edge, API, and audit ([../CUSTOMER_TRUST_AND_ACCESS.md](../library/CUSTOMER_TRUST_AND_ACCESS.md) §8).
- Provide a **security contact** on file for DPA and incident notices.

---

## 6. Post-incident review (internal)

Blameless review covers: **timeline**, **customer impact**, **root cause**, **remediation**, **preventive actions**. Outputs may feed **SOC 2** evidence ([SOC2_ROADMAP.md](SOC2_ROADMAP.md)).

---

## 7. Escalation contacts

| Role | Contact |
|------|---------|
| Security | `security@archlucid.net` |
| Support (interim) | `security@archlucid.net` |

---

## 8. Operational transparency / status page plan

SaaS buyers — especially in enterprise and regulated environments — need confidence that service disruptions will be **visible**, **communicated**, and **resolved transparently**. Sections 1–7 define **what** we communicate; this section defines **where** and **how**. The public status page is **planned**, not claimed as live.

### Status page options

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **Atlassian Statuspage** | Industry standard, subscriber notifications, API, components/groups, incident templates | Vendor dependency, monthly cost ($29–$399+/mo) | Medium |
| **Instatus** | Modern UI, generous free tier, API, custom domain | Smaller ecosystem, fewer enterprise references | Low |
| **GitHub repo + Actions** | Free, version-controlled, RSS via releases | Manual, lacks subscriber notifications, less professional appearance | Free |
| **Cachet (self-hosted)** | Full control, open-source | Operational overhead, maintenance burden | Low (infra cost) |

**Recommendation:** Start with **Instatus** (free tier) or **Atlassian Statuspage** (Starter) — lowest effort to a professional public page. Migrate to a higher tier or self-hosted solution if requirements grow.

### Components to track

| Component | Maps to | Health source |
|-----------|---------|---------------|
| **API** | `ArchLucid.Api` | Synthetic probe (`GET /health/live`, `GET /version`) |
| **Web UI** | `archlucid-ui` (Next.js) | HTTP check on UI hostname |
| **Agent pipeline** | Run execution via Worker | Outbox convergence metric; run completion rate |
| **Authentication** | Entra ID / API key validation | Synthetic authenticated request or Entra status |
| **Background processing** | `ArchLucid.Worker` | Worker heartbeat, outbox age gauge |

### Mapping to incident severity

| Status page state | Incident severity | Description |
|-------------------|-------------------|-------------|
| **Operational** | — | All components healthy |
| **Degraded performance** | SEV-3 | Minor impact, workaround available |
| **Partial outage** | SEV-2 | Subset of tenants or features impaired |
| **Major outage** | SEV-1 | Service unavailable for all or most tenants |
| **Under maintenance** | Planned | Scheduled maintenance window per [SLA_SUMMARY.md](SLA_SUMMARY.md) §3 |

### Integration points

- **Prometheus/Grafana alerts** ? Status page updates. **Phase 1:** Manual update by on-call when alert fires. **Phase 3:** Automate via status page API (e.g., Statuspage API `POST /incidents` triggered by alert webhook).
- **Incident communications** ? Status page is the **primary public channel** for SEV-1 and SEV-2 incidents (see §3 channels).
- **Synthetic probes** (GitHub Actions) ? Feed uptime percentage displayed on the status page.

### Implementation plan

| Phase | Scope | Timeline target |
|-------|-------|---------------------|
| **Phase 1** | Choose provider, create page with 5 components, add URL to [trust-center.md](trust-center.md), [SLA_SUMMARY.md](SLA_SUMMARY.md), and this policy §3 | Near-term |
| **Phase 2** | Manual incident updates aligned with this policy; team trained on update workflow | With first production customer |
| **Phase 3** | Automated uptime checks feeding the page; alert-to-incident webhook integration | Post Phase 2 stabilization |

When a dedicated status URL is published, keep [SLA_SUMMARY.md](SLA_SUMMARY.md) §8 and this policy §3 (channels) aligned in the same change.

---

## Related documents

| Doc | Use |
|-----|-----|
| [trust-center.md](trust-center.md) | Trust index |
| [../API_SLOS.md](../library/API_SLOS.md) | HTTP SLOs (e.g. **99.9%** availability, tiered latency) |
| [DPA_TEMPLATE.md](DPA_TEMPLATE.md) | Breach notification clause |
| [SLA_SUMMARY.md](SLA_SUMMARY.md) | Availability targets |

Former standalone plan: `docs/go-to-market/OPERATIONAL_TRANSPARENCY.md` ? [§8](#8-operational-transparency--status-page-plan).

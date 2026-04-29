> **Scope:** Hosted SaaS service availability target (API + operator UI) — pre-contractual engineering posture.
> **Spine doc:** [FIRST_5_DOCS.md](../FIRST_5_DOCS.md).

# Hosted SaaS availability target

**Audience:** Buyers, procurement, and operators evaluating ArchLucid as a **vendor-hosted** service.

**Status:** Pre-GA — **target**, not a contractual SLA until negotiated per customer.

---

## Service availability target

| Surface | Monthly target | Notes |
|---------|----------------|--------|
| **ArchLucid API** + **operator web UI** | **99.9%** | Reflects Azure Container Apps + Azure SQL high-availability posture for the hosted stack. |

**Meaning:** For each calendar month, we target at least **99.9%** uptime for API and operator UI together, measured as described below.

**Relationship to other docs:** The **HTTP** rolling objective in [`API_SLOS.md`](API_SLOS.md) and [`SLA_SUMMARY.md`](../go-to-market/SLA_SUMMARY.md) is aligned to **99.9%** availability (non-5xx / all requests) with tiered latency; this document states the **full hosted product** (API + UI) narrative **also** at **99.9%** for packaging and Trust Center (minute-based signal differs — see *Measurement* below).

---

## Measurement

**Availability** = (total minutes − downtime minutes) ÷ total minutes × 100.

**Downtime:** `/health/live` on the API returns **non-200** for **5+ consecutive minutes** from an **external** synthetic probe (same class of signal as [`.github/workflows/api-synthetic-probe.yml`](../../.github/workflows/api-synthetic-probe.yml)). Operator UI availability uses the **production Front Door / UI hostname** with an equivalent **HTTP 2xx** check on a configured health or shell route as exercised by [`.github/workflows/hosted-saas-probe.yml`](../../.github/workflows/hosted-saas-probe.yml).

---

## Exclusions

Targets **do not** apply during:

- **Scheduled maintenance** communicated with at least **48 hours** notice (see [`SLA_SUMMARY.md`](../go-to-market/SLA_SUMMARY.md) for related buyer wording).
- **Force majeure** and **third-party cloud outages** outside ArchLucid’s direct control.
- **Customer-caused** outages (blocked networks, invalid configuration, abuse).

---

## Disaster recovery

For **RTO/RPO** estimates and backup posture, see [`RTO_RPO_TARGETS.md`](RTO_RPO_TARGETS.md) and [`../go-to-market/BACKUP_AND_DR.md`](../go-to-market/BACKUP_AND_DR.md).

---

## Monitoring evidence

Synthetic and operational probes (including scheduled GitHub Actions workflows above) demonstrate ongoing measurement investment; they are **canaries**, not by themselves a monthly percentage.

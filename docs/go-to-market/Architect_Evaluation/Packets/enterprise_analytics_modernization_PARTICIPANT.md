> **Reviewed:** 2026-07-26

# Architecture Review Packet: Enterprise Analytics Modernization

**Classification:** Sanitized synthetic packet for principal architect evaluation  
**Domain:** Data platform / analytics / governance / lineage  
**Length target:** 8–15 page review-session packet  
**Use:** Participant raw material for ArchLucid principal-architect insight validation

---

## 1. Business context

Apex Manufacturing is consolidating reporting from ERP, CRM, plant telemetry, finance, and support systems. The first sponsor use case is an sponsor margin and operations dashboard. The platform uses landing, raw, curated, and semantic zones, with future ML feature tables under consideration.

The packet is intentionally realistic rather than polished. It includes open questions, scope deferrals, cross-boundary assumptions, and implementation notes that may or may not be acceptable depending on risk tolerance.

---

## 2. System overview

| Component | Description |
|---|---|
| Ingestion Jobs | Pull data from ERP, CRM, SaaS APIs, and plant telemetry |
| Landing Zone | Initial source extracts |
| Raw Zone | Immutable source-shaped data |
| Curated Zone | Cleaned/conformed datasets |
| Semantic Layer | Business model for BI tools |
| Data Quality Service | Completeness/freshness/anomaly rules |
| Data Catalog | Metadata, ownership, lineage |
| Data Science Sandbox | Future feature engineering workspace |

---

## 3. User types and trust boundaries

| Actor | Trust origin | Interaction |
|---|---|---|
| Data engineer | Internal | Pipeline development |
| Analyst | Internal | BI datasets |
| Sponsor sponsor | Internal | Dashboard viewer |
| Plant operations lead | Internal/OT-adjacent | Plant metrics |
| Data scientist | Internal | Sandbox access |
| SaaS source system | External vendor | API extraction |
| Finance controller | Internal | Certified metrics |

Reviewers should pay special attention to where data, identity, operational responsibility, and auditability cross boundaries.

---

## 4. Main request and data flows

1. SaaS extraction lands data, copies raw, transforms curated, and exposes semantic model.
2. ERP feed validates row counts and reconciles finance totals.
3. Plant telemetry summary joins plant metrics with product and order data.
4. Data science sandbox receives approved dataset copies for feature engineering.

---

## 5. Data classification and retention

| Data category | Classification | Retention |
|---|---|---|
| ERP orders | Internal/financial | 7 years |
| CRM accounts | Customer confidential | Contract lifetime |
| Support tickets | Customer data / possible PII | 5 years |
| Plant telemetry | Operational sensitive | 2 years |
| Sandbox copies | Derived/mixed | 90 days proposed |

---

## 6. Security and identity model

- Access is through Entra groups mapped to zones and BI workspaces.
- Raw zone access is broad for data engineers.
- Sandbox access approval is manual.
- Row-level security exists in BI for plant-specific dashboards.
- Source-to-curated lineage is partially captured.
- Notebook-derived features are not yet cataloged.
- Lower environment refreshes may use production extracts with masking planned later.

---

## 7. Reliability, resiliency, and performance

- Sponsor dashboard must refresh by 7 AM local time.
- Finance measures must reconcile to ERP totals within tolerance.
- ERP row count variance >10% triggers warning.
- Support ticket free-text parse errors are logged but do not fail pipeline.
- Finance reconciliation failure blocks dashboard certification.

---

## 8. Operational model

The operating team intends to use standard CI/CD deployment with environment-specific configuration, centralized logs, metrics, and alerting. Some business operations are business-hours only, while the technical platform has after-hours escalation for critical incidents. Reviewers should examine whether the stated operational model is sufficient for the stated business goals, data sensitivity, and pilot commitments.

---

## 9. Architecture decisions / ADRs

### ADR-001: Use lake zones

**Decision/rationale:** Enable lineage/replay/governance; requires stronger policy.

### ADR-002: Allow sandbox copies

**Decision/rationale:** Enable future ML; makes retention/lineage harder.

### ADR-003: Defer full catalog integration

**Decision/rationale:** Catalog critical curated datasets first.

### ADR-004: Use production-like data in lower environments initially

**Decision/rationale:** Synthetic data missed data-quality issues; masking later.

---

## 10. Known constraints and open questions

The pilot is time-boxed and intentionally defers some production-hardening work. Reviewers should distinguish acceptable pilot risk from decisions that are likely to become unsafe production defaults.

Common review prompts:

1. Which deferred decision creates the greatest future risk?
2. Which trust boundary is least clearly protected?
3. Which operational assumption could fail during the first pilot?
4. Which evidence item is strongest?
5. Which finding would require immediate mitigation before launch?

---

## 11. Evidence appendix

```yaml
pipeline: crm_support_ingest
schedule: "0 2 * * *"
sources: [crm_accounts, support_tickets]
landingRetentionDays: 14
rawRetentionYears: 5
failOnFreeTextParseError: false
```

```json
{
  "requestId": "ds-req-9912",
  "datasets": ["crm_accounts_curated", "support_tickets_raw", "erp_orders_curated"],
  "purpose": "churn forecasting prototype",
  "retention": "90 days",
  "approval": "data-platform-manager"
}
```

Development and test refreshes initially use the last successful production extract. Masking and tokenization are planned for phase two. Some semantic model changes are manually applied by BI developers before sponsor review.

---

## 12. Participant scoring prompts

Use these during or after review:

1. Which finding would you not have written yourself in a first pass?
2. Which finding is wrong, unsupported, or overclaimed?
3. Which finding would change approval conditions, remediation priority, or launch readiness?
4. Where is the evidence trail stronger than a raw frontier-AI review?
5. Would you reuse this for a second review cycle?

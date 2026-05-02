> **Scope:** Index of reviewer-facing procurement and assurance artifacts — navigation only; not legal advice.
>
> **Canonical buyer evidence table:** **[`PROCUREMENT_PACK_INDEX.md`](PROCUREMENT_PACK_INDEX.md)** — CI-validated columns (evidence type, freshness, paths, buyer-safe claims).

# Procurement evidence pack — index

**Audience:** Security reviewers, procurement, and GRC contacts evaluating ArchLucid.

**Purpose:** Single checklist of **available** artifacts and **planned** attestations without restating SOC 2 roadmaps verbatim.

---

## Governance and security posture

| Artifact | Location | Notes |
|-----------|----------|--------|
| Security overview | [docs/library/SECURITY.md](../library/SECURITY.md) | Threat surface, scanning, auth modes |
| STRIDE summary | [docs/security/SYSTEM_THREAT_MODEL.md](../security/SYSTEM_THREAT_MODEL.md) | Boundary threat model |
| Multi-tenant RLS | [docs/security/MULTI_TENANT_RLS.md](../security/MULTI_TENANT_RLS.md) | SQL `SESSION_CONTEXT` posture |
| Trust Center (public) | [TRUST_CENTER.md](TRUST_CENTER.md) | Buyer-facing index |
| CAIQ-lite (owner self-assessment draft) | [docs/security/CAIQ_LITE_2026.md](../security/CAIQ_LITE_2026.md) | Pre-audit CAIQ-aligned responses |
| SIG Core questionnaire (draft fields) | [docs/security/SIG_CORE_2026.md](../security/SIG_CORE_2026.md) | Procurement questionnaire supplement |
| SOC 2 roadmap (timing placeholder) | [SOC2_ROADMAP.md](SOC2_ROADMAP.md) | **Not an auditor opinion** |

---

## Commercial and legal drafts

| Artifact | Location |
|-----------|----------|
| DPA template | [DPA_TEMPLATE.md](DPA_TEMPLATE.md) |
| Privacy / subprocessors | [PRIVACY_POLICY.md](PRIVACY_POLICY.md), [SUBPROCESSORS.md](SUBPROCESSORS.md) |
| MSA outline | [MSA_TEMPLATE.md](MSA_TEMPLATE.md) |

---

## Operational transparency

| Artifact | Location |
|-----------|----------|
| Incident communications | [INCIDENT_COMMUNICATIONS_POLICY.md](INCIDENT_COMMUNICATIONS_POLICY.md) |
| API SLO narrative | [../library/API_SLOS.md](../library/API_SLOS.md) |

---

## What is intentionally not bundled here

- Independent SOC 2 Type I report (see roadmap Milestone phases in [SOC2_ROADMAP.md](SOC2_ROADMAP.md)).
- Live pen test report (contracted via [pen-test summaries](../security/pen-test-summaries/); placeholders only until engagement completes).

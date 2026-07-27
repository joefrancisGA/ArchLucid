> **Reviewed:** 2026-07-26

> **Scope:** Canonical assurance status source for procurement-facing language — current status, deferred windows, allowed wording, evidence links — plus procurement documentation review cadence (formerly `REVIEW_CADENCE.md`) and the SOC 2 readiness roadmap (formerly `SOC2_ROADMAP.md`).

# Assurance Status Canonical

**Audience:** Procurement, security reviewers, and internal authors updating buyer-facing artifacts (including maintainers and release managers for review cadence).

**Last reviewed:** 2026-07-26

This document is the single source of truth for assurance status wording used by:

- `trust-center.md`
- `CURRENT_ASSURANCE_POSTURE.md`
- `BUYER_SECURITY_PROCUREMENT_PACKET.md` ([procurement FAQ Q&A](BUYER_SECURITY_PROCUREMENT_PACKET.md#enterprise-procurement-faq))
- `PROCUREMENT_RESPONSE_ACCELERATOR.md`
- `SOC2_STATUS_PROCUREMENT.md`

Cadence: [`#procurement-documentation-review-cadence`](#procurement-documentation-review-cadence).

---

## Canonical status table

| Assurance item | Current status | Deferred window | Allowed buyer wording | Evidence |
|---|---|---|---|---|
| SOC 2 Type II attestation | Not issued | Deferred (funding-gated) | "SOC 2 Type II is not currently issued. ArchLucid provides a self-assessment and evidence pack while attestation is deferred." | [SOC 2 self-assessment](../security/SOC2_SELF_ASSESSMENT_2026.md), [trust center](trust-center.md) |
| SOC 2 Type I engagement | Not started | Deferred (funding-gated) | "Type I scoping is deferred until funded assessor engagement." | [SOC 2 self-assessment](../security/SOC2_SELF_ASSESSMENT_2026.md), [trust center](trust-center.md) |
| Owner-conducted penetration-style assessment | Active V1 control | Not deferred | "V1 uses owner-conducted penetration-style testing documented in-repo." | [../security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md](../security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md), [trust-center.md](trust-center.md) |
| Third-party penetration test | Not executed | Planned, not yet scheduled | "External third-party penetration testing is planned, not yet scheduled; no external vendor engagement is claimed today." | [../library/V1_DEFERRED.md](../library/V1_DEFERRED.md), [trust-center.md](trust-center.md), [../security/pen-test-summaries/2026-Q2-SOW.md](../security/pen-test-summaries/2026-Q2-SOW.md) |
| Redacted third-party assessor summary | Not available | Planned, not yet scheduled | "Redacted third-party assessor summaries are NDA-gated and only available after an external engagement completes." | [trust-center.md](trust-center.md), [../library/V1_DEFERRED.md](../library/V1_DEFERRED.md) |

---

## Authoring rules

- [`SOC2_STATUS_PROCUREMENT.md`](SOC2_STATUS_PROCUREMENT.md) is a path-stable procurement-pack alias; this document is the wording source of truth.
- Do not use "in flight" for third-party pen-test or SOC2 attestation items while status remains deferred.
- Do not imply issuance of external attestations when evidence is self-assessment or template-only.
- If status changes, update this file first, then update all listed downstream docs in the same change.

---

## SOC 2 readiness roadmap {#soc-2-readiness-roadmap}

Former standalone: `docs/go-to-market/SOC2_ROADMAP.md` → this section.

**Audience:** Customers, prospects, and internal GRC stakeholders.

This section describes **controls and evidence** already reflected in the product and repo, **typical gaps** for a SOC 2 Type I / II program, and a **milestone roadmap**. It is **not** an auditor’s report.

**2026-05-26 — Readiness vs attestation:** **SOC 2 Type I readiness** remains a planning track (consultant shortlist, evidence-room preparation, and observation-period planning). A **CPA opinion** remains gated on executed attestation agreement and budget. Interim artifacts are **owner-led self-assessment** ([`../security/SOC2_SELF_ASSESSMENT_2026.md`](../security/SOC2_SELF_ASSESSMENT_2026.md)), CAIQ/SIG pre-fills, and future third-party pen-test **templates** / planning surfaces. A funded third-party penetration test is planned, not yet scheduled; see [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6c.

### Current strengths (engineering and operations)

The following are **observable** in the codebase and documentation (non-exhaustive):

| Area | Evidence (examples) |
|------|---------------------|
| **Access control** | JWT / Entra roles, API keys, policy-based authorization; [SECURITY.md](../library/contributor-reference/SECURITY.md) |
| **Network & edge** | Front Door / WAF, optional APIM, private endpoints; [../CUSTOMER_TRUST_AND_ACCESS.md](../library/CUSTOMER_TRUST_AND_ACCESS.md) |
| **Data protection** | Database-per-tenant catalogs + parameterized data access; [ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md), [TENANT_ISOLATION.md](TENANT_ISOLATION.md) |
| **Logging & audit** | Append-only `dbo.AuditEvents`, typed event catalog (CI-tracked count in [../AUDIT_COVERAGE_MATRIX.md](../library/AUDIT_COVERAGE_MATRIX.md)); correlation IDs |
| **Reliability measurement** | HTTP SLOs (e.g. **99.9%** / 30 days, tiered latency), Prometheus rules, synthetic probes; [../API_SLOS.md](../library/API_SLOS.md) |
| **Secure SDLC** | OWASP ZAP + Schemathesis in CI; [SECURITY.md](../library/contributor-reference/SECURITY.md) |
| **Threat modeling** | STRIDE summary; [../security/SYSTEM_THREAT_MODEL.md](../security/SYSTEM_THREAT_MODEL.md) |
| **Operational drills** | Geo-failover drill runbook; [../runbooks/GEO_FAILOVER_DRILL.md](../runbooks/GEO_FAILOVER_DRILL.md) |

### Typical gaps for SOC 2 (to close with process and policy)

SOC 2 requires **documented** policies, **operating evidence**, and often **independent** validation. Items commonly **not** fully satisfied by code alone:

| Gap | What “done” looks like |
|-----|-------------------------|
| **Formal ISMS / policies** | Written information security policy, acceptable use, access review cadence, approved exceptions |
| **Vendor / subprocessor risk** | Due diligence on Microsoft and any future vendors; [SUBPROCESSORS.md](SUBPROCESSORS.md) maintained under change control |
| **HR / training** | Security awareness training records, onboarding/offboarding checklists |
| **BCP / DR** | Tested recovery objectives aligned with customer messaging; tie internal drills to RTO/RPO statements |
| **Incident response** | Playbooks, tabletop exercises, evidence of post-incident reviews ([INCIDENT_COMMUNICATIONS_POLICY.md](INCIDENT_COMMUNICATIONS_POLICY.md)) |
| **Penetration testing** | Owner-conducted V1 penetration-style testing; third-party pen test or bug bounty is planned, not yet scheduled. Threat model notes “not a pen test” ([../security/SYSTEM_THREAT_MODEL.md](../security/SYSTEM_THREAT_MODEL.md) §3). |
| **Management oversight** | Risk register, periodic review minutes |
| **Customer commitments** | SLAs and support tiers published where offered |

### Milestone roadmap (illustrative quarters)

| Phase | Target | Outcomes |
|-------|--------|----------|
| **Phase 1** | Q3 2026 | Policy pack v1; vendor/subprocessor register; IR tabletop; evidence folders |
| **Phase 2** | Q4 2026 | Auditor shortlist; readiness gap assessment; third-party pen-test scope prepared if funding is approved |
| **Phase 3** | Q1 2027 | SOC 2 Type I **observation period**; control testing |
| **Phase 4** | Q2 2027 | **SOC 2 Type I** report issued (target) |
| **Phase 5** | Q3 2027+ | **Type II** observation window |

Dates are **placeholders** until leadership and an auditor confirm.

### What customers can request today

- **Security architecture:** [trust-center.md](trust-center.md), [TENANT_ISOLATION.md](TENANT_ISOLATION.md), [../security/SYSTEM_THREAT_MODEL.md](../security/SYSTEM_THREAT_MODEL.md)
- **Subprocessors:** [SUBPROCESSORS.md](SUBPROCESSORS.md)
- **DPA:** [DPA_TEMPLATE.md](DPA_TEMPLATE.md) (legal review required)
- **Incident process:** [INCIDENT_COMMUNICATIONS_POLICY.md](INCIDENT_COMMUNICATIONS_POLICY.md)
- **SLOs:** [../API_SLOS.md](../library/API_SLOS.md)

**SOC 2 report:** Not available until Phase 4; roadmap above applies.

---

## Procurement documentation review cadence

**Audience:** Maintainers of procurement/trust documents and release managers.  
Includes stale-document escalation expectations.

### Cadence matrix

| Document | Owner role | Review frequency | Escalation when stale |
|---|---|---|---|
| `ASSURANCE_STATUS_CANONICAL.md` (this file) | Security lead | Every 30 days | Update first, then refresh all downstream assurance surfaces in the same change |
| `trust-center.md` | Security lead | Every 30 days | Raise in release checklist and update before procurement pack release |
| `CURRENT_ASSURANCE_POSTURE.md` | Security lead | Every 30 days | Block procurement deal-ready mode until refreshed |
| `BUYER_SECURITY_PROCUREMENT_PACKET.md` | Security lead | Every 30 days | Re-validate isolation / evidence routing before principal-architect or security reviews |
| `CLAIM_READINESS_STATUS.md` | Founder / GTM owner | After each pilot or release review | Hold outbound claim stage advances until gates refreshed |
| `SLA_SUMMARY.md` | Platform lead | Every 45 days | Escalate to product + ops owner for confirmation |
| `INCIDENT_COMMUNICATIONS_POLICY.md` | Incident manager role | Every 45 days | Escalate to on-call manager; confirm channels and timelines |
| `INCIDENT_COMMUNICATIONS_POLICY.md` §8 (status-page plan) | Platform lead | Every 90 days | Confirm status-page plan honesty (planned vs live) before buyer send |
| `SUBPROCESSORS.md` | Privacy/legal operations role | Every 90 days | Escalate to legal review queue and update changelog note |

### Process

1. Update `Last reviewed` (and `> **Reviewed:**` when using the audit stamp) in each document when substantive validation is done.
2. Keep status wording aligned with this file — do not invent stronger SOC 2 / pen-test claims.
3. Run CI checks before shipping buyer packs.

### CI linkage

- Claim consistency: `scripts/ci/check_procurement_claim_coherence.py`
- Freshness check: `scripts/ci/check_procurement_doc_freshness.py`
- Trust-center links / posture: `scripts/ci/check_trust_center_links.py`, `scripts/ci/check_trust_center_posture_freshness.py`

Former standalone: `docs/go-to-market/REVIEW_CADENCE.md` → this section.  
Former standalone: `docs/go-to-market/SOC2_ROADMAP.md` → [`#soc-2-readiness-roadmap`](#soc-2-readiness-roadmap).


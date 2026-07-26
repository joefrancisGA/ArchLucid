> **Reviewed:** 2026-07-26

> **Scope:** Canonical assurance status source for procurement-facing language — current status, deferred windows, allowed wording, evidence links — plus procurement documentation review cadence (formerly `REVIEW_CADENCE.md`).

# Assurance Status Canonical

**Audience:** Procurement, security reviewers, and internal authors updating buyer-facing artifacts (including maintainers and release managers for review cadence).

**Last reviewed:** 2026-07-26

This document is the single source of truth for assurance status wording used by:

- `trust-center.md`
- `CURRENT_ASSURANCE_POSTURE.md`
- `PROCUREMENT_FAQ.md`
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


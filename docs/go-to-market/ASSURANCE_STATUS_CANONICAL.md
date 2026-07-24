> **Scope:** Canonical assurance status source for procurement-facing language; defines current status, deferred windows, allowed wording, and evidence links to prevent cross-document drift.

# Assurance Status Canonical

**Audience:** Procurement, security reviewers, and internal authors updating buyer-facing artifacts.

**Last reviewed:** 2026-07-24

This document is the single source of truth for assurance status wording used by:

- `trust-center.md`
- `CURRENT_ASSURANCE_POSTURE.md`
- `PROCUREMENT_FAQ.md`
- `PROCUREMENT_RESPONSE_ACCELERATOR.md`
- `SOC2_STATUS_PROCUREMENT.md`

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


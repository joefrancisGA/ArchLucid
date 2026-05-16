> **Scope:** Single canonical procurement evidence index — file paths are source of truth for CI; statuses are buyer-safe labels aligned with **`PROCUREMENT_RESPONSE_ACCELERATOR.md`**, not attestations. The **Procurement artifact status map** below uses a fixed vocabulary (`Implemented`, `Self-attested`, `Template`, `Deferred`, `Not applicable`, `External/NDA-gated`) enforced by **`scripts/ci/check_procurement_pack_index.py`** (links, **90-day** freshness on **Implemented** / **Self-asserted** canonical rows, buyer-placeholder strictness, and forbidden assurance wording). Release operators: **`docs/library/RELEASE_EVIDENCE_SUMMARY.md`** §8.

# Procurement evidence pack — buyer index (canonical)

**Audience:** Security, procurement, and GRC reviewers.

**How to cite:** Prefer **Evidence Artifact** titles and **`Source File`** links below rather than improvising statuses in questionnaires. Use **`trust-center.md`** for high-level posture; use this file for granular artifact inventory. **Five-minute skim (same paths as this table):** [`PROCUREMENT_FAST_LANE.md`](PROCUREMENT_FAST_LANE.md).

## Procurement artifact status map (buyer-safe classification)

Use this table for RFP spreadsheets and security portals that need a **single status column**. Labels are **not** attestations: **Deferred** items follow **[`V1_DEFERRED.md`](../library/V1_DEFERRED.md)** (especially **section 6c** for assurance). **Template** means legal or vendor execution is still required. **External/NDA-gated** means distribution depends on contract or assessor agreements, not public download.

| Procurement Artifact | Status | Source File | Notes |
|---|---|---|---|
| Data Processing Agreement (DPA) | Template | [DPA_TEMPLATE.md](DPA_TEMPLATE.md) | Template until executed; not legal advice. |
| Subprocessors register | Self-attested | [SUBPROCESSORS.md](SUBPROCESSORS.md) | In-repo list; buyer policy applies. |
| CAIQ Lite pre-fill | Self-attested | [../security/CAIQ_LITE_2026.md](../security/CAIQ_LITE_2026.md) | Questionnaire-aligned draft; map to CSA CAIQ. |
| SIG Core pre-fill | Self-attested | [../security/SIG_CORE_2026.md](../security/SIG_CORE_2026.md) | Questionnaire-aligned draft. |
| SOC 2 self-assessment (CC mapping) | Self-attested | [../security/SOC2_SELF_ASSESSMENT_2026.md](../security/SOC2_SELF_ASSESSMENT_2026.md) | Internal narrative — **not** a CPA opinion. |
| SOC 2 procurement status statement | Self-attested | [SOC2_STATUS_PROCUREMENT.md](SOC2_STATUS_PROCUREMENT.md) | Honest posture; confirms **no** CPA Type II issued today. |
| SOC 2 programme roadmap | Deferred | [SOC2_ROADMAP.md](SOC2_ROADMAP.md) | Planning only; CPA examination **not** V1/V1.1 headline gate — see [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) section 6c. |
| SOC 2 Type I / II examination report (CPA-issued) | Deferred | [SOC2_ROADMAP.md](SOC2_ROADMAP.md) | **No issued report** in-repo; timing owner-driven — [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) section 6c. |
| Owner-conducted penetration-style assessment | Self-attested | [../security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md](../security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md) | Not third-party attestation; V1-appropriate. |
| Third-party penetration test (vendor-led programme) | Deferred | [../library/V1_DEFERRED.md](../library/V1_DEFERRED.md) | **V2** per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) section 6c; no V1 vendor commitment. |
| Third-party pen-test SoW (planning template) | Template | [../security/pen-test-summaries/2026-Q2-SOW.md](../security/pen-test-summaries/2026-Q2-SOW.md) | For use when a vendor is selected. |
| Third-party pen-test redacted summary (when executed) | External/NDA-gated | [../security/pen-test-summaries/2026-Q2-REDACTED-SUMMARY.md](../security/pen-test-summaries/2026-Q2-REDACTED-SUMMARY.md) | Working surface; not a public assurance claim. |
| Audit coverage matrix | Self-attested | [../library/AUDIT_COVERAGE_MATRIX.md](../library/AUDIT_COVERAGE_MATRIX.md) | Typed audit event surface mapping. |
| Multi-tenant SQL RLS | Implemented | [../security/MULTI_TENANT_RLS.md](../security/MULTI_TENANT_RLS.md) | Design and session-context posture documented. |
| security.txt | Self-attested | [../../archlucid-ui/public/.well-known/security.txt](../../archlucid-ui/public/.well-known/security.txt) | Coordinated disclosure routing (published path). |
| SLA summary (targets) | Self-attested | [SLA_SUMMARY.md](SLA_SUMMARY.md) | Summary targets — contractual SLA only if MSA/order form says so. |
| Trust Center evidence pack (ZIP download) | Self-attested | [trust-center.md](trust-center.md) | Anonymous download; contents listed in Trust Center section. |
| PGP coordinated-disclosure key | Deferred | [../security/PGP_KEY_GENERATION_RECIPE.md](../security/PGP_KEY_GENERATION_RECIPE.md) | **V1.1** drop per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) section 6c; CI turns green when key file lands. |
| ISO 27001 certificate | Not applicable | [../library/V1_SCOPE.md](../library/V1_SCOPE.md) | No certificate claimed; buyer friction is informational — [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) / scope narratives. |

| Evidence Artifact | Evidence Type | Last Reviewed UTC | Source File | Buyer-safe Claim |
|---|---|---|---|---|
| Trust Center (buyer index) | Self-asserted | 2026-05-01 | [trust-center.md](trust-center.md) | Central index links only to in-repo evidence; distinguishes self-assessed vs deferred third-party artefacts. |
| Security overview | Self-asserted | 2026-05-01 | [docs/library/SECURITY.md](../library/SECURITY.md) | Describes scanning, boundaries, authentication modes documented in-repo. |
| System threat model (STRIDE) | Self-asserted | 2026-05-01 | [docs/security/SYSTEM_THREAT_MODEL.md](../security/SYSTEM_THREAT_MODEL.md) | Internal architectural threat enumeration — not substitute for customer architecture review. |
| Multi-tenant RLS | Implemented | 2026-05-01 | [docs/security/MULTI_TENANT_RLS.md](../security/MULTI_TENANT_RLS.md) | SQL `SESSION_CONTEXT` design and risk posture documented; engineering controls described in-linked implementation notes. |
| SOC 2 procurement statement | Self-asserted | 2026-04-24 | [docs/go-to-market/SOC2_STATUS_PROCUREMENT.md](SOC2_STATUS_PROCUREMENT.md) | States Type II issuance not yet claimed; directs to roadmap and self-assessment. |
| SOC 2 self-assessment narrative | Self-asserted | 2026-04-24 | [docs/security/SOC2_SELF_ASSESSMENT_2026.md](../security/SOC2_SELF_ASSESSMENT_2026.md) | Internal CC mapping narrative — explicitly not a CPA audit opinion. |
| SOC 2 roadmap | Deferred V1.1 | 2026-04-24 | [docs/go-to-market/SOC2_ROADMAP.md](SOC2_ROADMAP.md) | Planned programme timing only; confirms no SOC 2 report yet. |
| CAIQ-lite pre-fill | Self-asserted | 2026-05-01 | [docs/security/CAIQ_LITE_2026.md](../security/CAIQ_LITE_2026.md) | Questionnaire-aligned draft sourced from documented controls posture. |
| SIG Core pre-fill | Self-asserted | 2026-05-01 | [docs/security/SIG_CORE_2026.md](../security/SIG_CORE_2026.md) | Questionnaire-aligned draft referencing library evidence pointers. |
| SCIM + Entra ID provisioning recipe | Self-asserted | 2026-05-03 | [docs/integrations/SCIM_ENTRA_ID_SETUP.md](../integrations/SCIM_ENTRA_ID_SETUP.md) | Documents `/scim/v2` URLs, bearer secret issuance (`POST /v1/admin/scim/tokens`), automated Api.Tests Entra-shaped fixtures (no Entra tenant in CI), and parser guardrails for common Entra filter literals. |
| Tenant isolation narrative | Self-asserted | 2026-05-01 | [docs/go-to-market/TENANT_ISOLATION.md](TENANT_ISOLATION.md) | Logical isolation framing for diligence — contract-specific items via MSA/DPA. |
| DPA template | Self-asserted | 2026-05-01 | [docs/go-to-market/DPA_TEMPLATE.md](DPA_TEMPLATE.md) | Template wording only until executed under customer legal review. |
| Subprocessors register | Self-asserted | 2026-05-01 | [docs/go-to-market/SUBPROCESSORS.md](SUBPROCESSORS.md) | Lists subprocessors acknowledged in-repo; customer due diligence completes against their policy. |

**Historical navigation index:** The shorter navigation-only table remains in **`PROCUREMENT_EVIDENCE_PACK_INDEX.md`** — that file intentionally defers statuses to **this** index for CI-validated freshness.

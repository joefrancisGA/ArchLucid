> **Scope:** CAIQ Lite-style questionnaire (Cloud Security Alliance **CAIQ v4** alignment). **Not** a completed STAR / CCM submission — pre-filled for procurement drafts.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.


# CAIQ Lite — ArchLucid (2026 pre-fill)

**Source alignment:** CSA Consensus Assessment Initiative Questionnaire (CAIQ) **Lite** themes. Download the authoritative **CAIQ v4** spreadsheet from [Cloud Security Alliance](https://cloudsecurityalliance.org/) and map row IDs when submitting through a STAR registry.

**Product context:** ArchLucid SaaS (API + SQL authority plane + optional Azure OpenAI). Identity: Microsoft Entra ID. Data: Azure SQL with row-level security.

## Governance (GOV)

| Theme | Response (summary) | Evidence in repo |
|-------|----------------------|------------------|
| Security policies maintained | Yes — engineering [`SECURITY.md`](../library/SECURITY.md); incident comms [`../go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md`](../go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md) | Links |
| Risk assessments | Partial — internally maintained threat model + procurement SoW; enterprise risk-register export not in-repo | **Evidence:** STRIDE / control mapping [`SYSTEM_THREAT_MODEL.md`](SYSTEM_THREAT_MODEL.md); pen test program SoW [`pen-test-summaries/2026-Q2-SOW.md`](pen-test-summaries/2026-Q2-SOW.md); remediation tracking [`pen-test-summaries/REMEDIATION_TRACKER.md`](pen-test-summaries/REMEDIATION_TRACKER.md). **Gap / next step:** Standalone CAIQ-style consolidated risk register spreadsheet and third-party attestation remain **owner-budget** items; posture and honest buyer labels in [`../go-to-market/TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md); narrative cross-check [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) *(Resolved 2026-04-28 — third-party pen test / shareable summary scope)*. |
| Management oversight | Partial — roadmap and policy surface; board minutes not published in-repo | **Evidence:** SOC2 program outline [`../go-to-market/SOC2_ROADMAP.md`](../go-to-market/SOC2_ROADMAP.md) *(phases/commitments only — do not treat this row as amending that file’s dates)*; security policy expectations [`../library/SECURITY.md`](../library/SECURITY.md); Trust Center governance refs [`../go-to-market/TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md). **Gap / next step:** Formal management-review minutes for external auditors live **outside the repo** unless a future owner decision publishes a redacted summary artifact here. |

## Human resources (HRS)

| Theme | Response | Evidence |
|-------|----------|----------|
| Security awareness | Yes — annual engineering briefing tracked internally (calendar + attendance roster); policy refs [`SECURITY.md`](../library/SECURITY.md), [`INCIDENT_COMMUNICATIONS_POLICY.md`](../go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md) | HRIS exports available under NDA for enterprise diligence |

## Information management (IMC)

| Theme | Response | Evidence |
|-------|----------|----------|
| Data classification | Partial — isolation + policy hooks; buyer-specific taxonomy addenda | **Evidence:** Tenant isolation [`../go-to-market/TENANT_ISOLATION.md`](../go-to-market/TENANT_ISOLATION.md); engineering [`../library/SECURITY.md`](../library/SECURITY.md) (sensitive data / LLM forensic storage); conversation PII framing [`PII_RETENTION_CONVERSATIONS.md`](PII_RETENTION_CONVERSATIONS.md). **Gap / next step:** No single in-repo “data classification taxonomy” table for all customer content; enterprise buyers may require a **contract appendix** — track as commercial/legal deliverable (`PENDING_QUESTIONS.md` style backlog; not merge-blocking for product code). |
| Encryption in transit | Yes — TLS to API; private endpoints optional [`../CUSTOMER_TRUST_AND_ACCESS.md`](../library/CUSTOMER_TRUST_AND_ACCESS.md) | Link |
| Encryption at rest | Yes — Azure SQL / storage platform defaults (see Terraform modules under `infra/`) | IaC |

## Operations (OPS)

| Theme | Response | Evidence |
|-------|----------|----------|
| Logging / monitoring | Yes — audit matrix [`../AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md); SLOs [`../API_SLOS.md`](../library/API_SLOS.md) | Links |
| Vulnerability management | Partial — supply-chain + DAST + fuzz in CI; SARIF export GitHub-native | **Evidence:** Dependabot config [`.github/dependabot.yml`](../../.github/dependabot.yml); merge-blocking **`dotnet list … --vulnerable`** in CI job **`.NET: fast core (corset)`** [`../../.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (step **Vulnerable package audit**); SAST **`codeql.yml`** [`../../.github/workflows/codeql.yml`](../../.github/workflows/codeql.yml); PR API DAST **`Security: OWASP ZAP baseline (API container)`** + fuzz **`Security: Schemathesis light fuzz (PR)`** in same **`ci.yml`** — job keys `security-zap-api-baseline` / `api-schemathesis-light`; schedules [`../../.github/workflows/zap-baseline-strict-scheduled.yml`](../../.github/workflows/zap-baseline-strict-scheduled.yml) (`name`: **Security: ZAP baseline (scheduled, strict visibility)**); [`../../.github/workflows/schemathesis-scheduled.yml`](../../.github/workflows/schemathesis-scheduled.yml) (**Security: Schemathesis API fuzz (scheduled)**). **Gap / next step:** Consolidated SARIF/issue burn-down ledger is consumed via **GitHub Security** UX (not mirrored as a static committed CSV unless an owner publishes one for diligence). |

## Application security (APP)

| Theme | Response | Evidence |
|-------|----------|----------|
| Secure SDLC | Yes — CodeQL `security-extended`, ZAP strict, mutation testing (Persistence Stryker matrix) | `.github/workflows/` |
| API authorization | Yes — policy-based `[Authorize(Policy=...)]`; guard tests `ApiControllerMutationPolicyGuardTests` | `ArchLucid.Api.Tests` |

## Related

- [`SIG_CORE_2026.md`](SIG_CORE_2026.md)
- [`../go-to-market/TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md)

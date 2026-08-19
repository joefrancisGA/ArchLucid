> **Reviewed:** 2026-07-27

> **Scope:** Canonical assurance status source for procurement-facing language — current status, deferred windows, allowed wording, evidence links — plus procurement documentation review cadence (formerly `REVIEW_CADENCE.md`), the SOC 2 readiness roadmap (formerly `SOC2_ROADMAP.md`), the repository-linked current assurance posture evidence snapshot (formerly the body of `CURRENT_ASSURANCE_POSTURE.md`; that filename remains a path-stable pack alias), and the owner-conducted security assessment procurement excerpt (formerly the body of `OWNER_SECURITY_ASSESSMENT_REDACTED_FOR_PACK.md`; that filename remains a path-stable pack alias).

# Assurance Status Canonical

**Audience:** Procurement, security reviewers, and internal authors updating buyer-facing artifacts (including maintainers and release managers for review cadence).

**Last reviewed:** 2026-07-27

This document is the single source of truth for assurance status wording and the buyer-facing evidence snapshot used by:

- `trust-center.md`
- `CURRENT_ASSURANCE_POSTURE.md` (path-stable pack alias → [`#current-assurance-posture-evidence`](#current-assurance-posture-evidence))
- `OWNER_SECURITY_ASSESSMENT_REDACTED_FOR_PACK.md` (path-stable pack alias → [`#owner-security-assessment-procurement-excerpt`](#owner-security-assessment-procurement-excerpt))
- `BUYER_SECURITY_PROCUREMENT_PACKET.md` ([procurement FAQ](BUYER_SECURITY_PROCUREMENT_PACKET.md#enterprise-procurement-faq); [accelerator](BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-response-accelerator); `PROCUREMENT_RESPONSE_ACCELERATOR.md` path-stable alias)
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

- [`SOC2_STATUS_PROCUREMENT.md`](SOC2_STATUS_PROCUREMENT.md), [`CURRENT_ASSURANCE_POSTURE.md`](CURRENT_ASSURANCE_POSTURE.md), and [`OWNER_SECURITY_ASSESSMENT_REDACTED_FOR_PACK.md`](OWNER_SECURITY_ASSESSMENT_REDACTED_FOR_PACK.md) are path-stable procurement-pack aliases; this document is the wording and evidence-snapshot source of truth.
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
| **Data protection** | Database-per-tenant catalogs + parameterized data access; [ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md), [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview`](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview) |
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

- **Security architecture:** [trust-center.md](trust-center.md), [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview`](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview), [../security/SYSTEM_THREAT_MODEL.md](../security/SYSTEM_THREAT_MODEL.md)
- **Subprocessors:** [SUBPROCESSORS.md](SUBPROCESSORS.md)
- **DPA:** [DPA_TEMPLATE.md](DPA_TEMPLATE.md) (legal review required)
- **Incident process:** [INCIDENT_COMMUNICATIONS_POLICY.md](INCIDENT_COMMUNICATIONS_POLICY.md)
- **SLOs:** [../API_SLOS.md](../library/API_SLOS.md)

**SOC 2 report:** Not available until Phase 4; roadmap above applies.

---

## Current assurance posture (evidence snapshot) {#current-assurance-posture-evidence}

Former body of `docs/go-to-market/CURRENT_ASSURANCE_POSTURE.md` → this section. The filename [`CURRENT_ASSURANCE_POSTURE.md`](CURRENT_ASSURANCE_POSTURE.md) remains a **path-stable procurement-pack alias**.

**Classification:** Buyer-facing (include alias in procurement pack ZIP). This section summarizes security, compliance, and assurance evidence ArchLucid provides today. Every claim links to a source artifact in the repository. Status wording must match the [canonical status table](#canonical-status-table) above — do not introduce different assurance wording here.

### Continuous security testing in CI

ArchLucid runs automated security checks on every pull request and merge to main. These are **merge-blocking** unless noted.

| Check | Tool | What it catches | CI status |
|-------|------|----------------|-----------|
| Secret scanning | [Gitleaks](https://github.com/gitleaks/gitleaks) (`.gitleaks.toml`) | Leaked API keys, connection strings, tokens in committed code | **Merge-blocking** (Tier 0) |
| Static analysis (security-extended) | [CodeQL](https://codeql.github.com/) (`.github/workflows/codeql.yml`) | SQL injection, XSS, insecure deserialization, tainted data flows | **Merge-blocking** |
| DAST baseline | [OWASP ZAP](https://www.zaproxy.org/) (`infra/zap/`) | Common web vulnerabilities (OWASP Top 10) against running API image | **Scheduled** (strict variant: `zap-baseline-strict-scheduled.yml`) |
| API contract fuzz | [Schemathesis](https://schemathesis.readthedocs.io/) (`.github/workflows/schemathesis-scheduled.yml`) | Invalid inputs, unexpected status codes, OpenAPI contract violations | **Scheduled** |
| Container image scan | [Trivy](https://aquasecurity.github.io/trivy/) (in `ci.yml`) | Known CVEs in OS packages and .NET dependencies | **Merge-blocking** |
| IaC misconfiguration scan | [Trivy](https://aquasecurity.github.io/trivy/) (Terraform config check in `ci.yml`) | Public exposure, encryption gaps, IAM misconfigurations in Terraform | **Merge-blocking** |
| Dependency audit | [Dependabot](https://docs.github.com/en/code-security/dependabot) (`.github/dependabot.yml`) | Known vulnerabilities in NuGet and npm dependencies | **Automated PRs** |
| SBOM generation | CycloneDX (in `ci.yml`) | Software Bill of Materials for .NET and npm packages | **Per-build artifact** |

**Evidence:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), [`.github/workflows/codeql.yml`](../../.github/workflows/codeql.yml)

### Data isolation model

| Layer | Mechanism | Evidence |
|-------|-----------|---------|
| **Identity** | Microsoft Entra ID (OIDC / JWT) with app roles (Admin, Operator, Reader, Auditor); optional API keys for automation | [`docs/library/contributor-reference/SECURITY.md`](../library/contributor-reference/SECURITY.md) |
| **Application** | RBAC policies (`ReadAuthority`, `ExecuteAuthority`, `AdminAuthority`); request-scoped tenant/workspace/project context | [`ArchLucid.Api/Auth/`](../../ArchLucid.Api/Auth/) |
| **Database** | **Database-per-tenant** SQL catalogs via `TenantDatabaseBindings`; application scope predicates within each catalog — **SQL RLS is not used in production** ([ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md)) | [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview`](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview) · pack alias [`TENANT_ISOLATION.md`](TENANT_ISOLATION.md) |
| **Network** | Optional Azure Front Door + WAF; private endpoints for Azure SQL and Blob; no public SMB (port 445) | [`docs/library/CUSTOMER_TRUST_AND_ACCESS.md`](../library/CUSTOMER_TRUST_AND_ACCESS.md) |
| **Secrets** | Azure Key Vault references for application configuration in hosted deployments | [`docs/library/CONFIGURATION_KEY_VAULT.md`](../library/CONFIGURATION_KEY_VAULT.md) |

**Evidence:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview`](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview) · pack alias [`TENANT_ISOLATION.md`](TENANT_ISOLATION.md)

### Audit trail

| Capability | Detail |
|-----------|--------|
| Event catalog | 117 typed audit event constants with CI guard on count |
| Storage | Append-only SQL table (`dbo.AuditEvents`) with `DENY UPDATE` / `DENY DELETE` at database level |
| Search | Paginated API with keyset cursor, filtered by event type, actor, run ID, correlation ID, time window |
| Export | JSON and CSV bulk export (`GET /v1/audit/export`); 90-day window per request; max 10,000 rows per call |
| Retention | Tiered (hot 0-90 days, warm 90-365 days, cold 365+ days via operator-scheduled blob exports) |

**Evidence:** [`docs/library/AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md), [`docs/library/AUDIT_RETENTION_POLICY.md`](../library/AUDIT_RETENTION_POLICY.md)

### Threat modeling

| Artifact | Scope | Evidence |
|----------|-------|---------|
| STRIDE system threat model | Full product boundary (API, SQL, LLM, Blob, Service Bus, billing webhooks, trial lifecycle) | [`docs/security/SYSTEM_THREAT_MODEL.md`](../security/SYSTEM_THREAT_MODEL.md) |
| ASK/RAG threat model | Natural-language query surface (prompt injection, data exfiltration, context poisoning) | [`docs/security/ASK_RAG_THREAT_MODEL.md`](../security/ASK_RAG_THREAT_MODEL.md) |
| LLM prompt redaction | Configurable deny-list redaction before Azure OpenAI; aligned trace persistence redaction | [`docs/runbooks/LLM_PROMPT_REDACTION.md`](../runbooks/LLM_PROMPT_REDACTION.md) |

### Compliance and privacy

| Artifact | Status | Evidence |
|----------|--------|---------|
| SOC 2 self-assessment (Security + Availability) | **Completed** (internal; not CPA attestation) | [`docs/security/SOC2_SELF_ASSESSMENT_2026.md`](../security/SOC2_SELF_ASSESSMENT_2026.md) |
| SOC 2 Type I scoping | **Deferred (funding-gated)** | [SOC2_STATUS_PROCUREMENT.md](SOC2_STATUS_PROCUREMENT.md), [canonical status table](#canonical-status-table) |
| CAIQ Lite pre-fill (CSA STAR) | **Completed** | [`docs/security/CAIQ_LITE_2026.md`](../security/CAIQ_LITE_2026.md) |
| SIG Core pre-fill (Shared Assessments) | **Completed** | [`docs/security/SIG_CORE_2026.md`](../security/SIG_CORE_2026.md) |
| Compliance control matrix | **Completed** | [`docs/security/COMPLIANCE_MATRIX.md`](../security/COMPLIANCE_MATRIX.md) |
| VPAT® 2.5–style WCAG 2.1 A/AA Accessibility Conformance Report | **Completed** (honest, evidence-based; not legal certification) | [`docs/security/VPAT_2_5_WCAG_2_1_AA.md`](../security/VPAT_2_5_WCAG_2_1_AA.md); evidence map: [`docs/security/VPAT_EVIDENCE_MAP.md`](../security/VPAT_EVIDENCE_MAP.md) |
| Data Processing Agreement template | **Completed** (requires legal review) | [`docs/go-to-market/DPA_TEMPLATE.md`](DPA_TEMPLATE.md) |
| GDPR DSAR process | **Completed** | [`docs/security/DSAR_PROCESS.md`](../security/DSAR_PROCESS.md) |
| Subprocessors register | **Completed** | [`docs/go-to-market/SUBPROCESSORS.md`](SUBPROCESSORS.md) |

### Penetration testing

| Engagement | Status | Detail |
|-----------|--------|--------|
| Third-party pen test (external vendor) | **Deferred to V2** — no vendor awarded for V1; templates at [`docs/security/pen-test-summaries/2026-Q2-SOW.md`](../security/pen-test-summaries/2026-Q2-SOW.md) | Typical scope: API, architect workspace, hosted SaaS data plane — confirm in executed SoW |
| Owner-conducted penetration-style assessment | **Active V1 control** (owner-led) | [`docs/security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md`](../security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md) |
| Owner-conducted security self-assessment | **Completed** (interim posture) | [`docs/security/OWNER_SECURITY_ASSESSMENT_2026_Q2.md`](../security/OWNER_SECURITY_ASSESSMENT_2026_Q2.md) |

**Access to pen-test results:** Redacted summaries are available **under NDA only**. Contact `security@archlucid.net`.

### Infrastructure as Code

All infrastructure is defined in Terraform across 14 modules:

| Module | Purpose |
|--------|---------|
| `infra/terraform/` | Core Azure resources (resource group, app config) |
| `infra/terraform-sql-failover/` | Azure SQL with auto-failover groups, automatic tuning, consumption budgets |
| `infra/terraform-container-apps/` | Container Apps environment, jobs, secondary region |
| `infra/terraform-edge/` | Azure Front Door, WAF, marketing routes |
| `infra/terraform-monitoring/` | Application Insights, Grafana dashboards, Prometheus SLO rules |
| `infra/terraform-storage/` | Azure Blob Storage |
| `infra/terraform-keyvault/` | Azure Key Vault |
| `infra/terraform-servicebus/` | Azure Service Bus with IAM |
| `infra/terraform-entra/` | Entra ID app registrations, External ID |
| `infra/terraform-openai/` | Azure OpenAI |
| `infra/terraform-private/` | Private endpoints, App Service, network |
| `infra/terraform-otel-collector/` | OpenTelemetry collector |
| `infra/terraform-pilot/` | Pilot-sized deployment |
| `infra/terraform-orchestrator/` | Orchestrator resources |

**Evidence:** [`infra/`](../../infra/), [`docs/library/DEPLOYMENT_TERRAFORM.md`](../library/DEPLOYMENT_TERRAFORM.md)

### Contact

For security inquiries, procurement pack requests, or NDA-gated materials: **`security@archlucid.net`**

---

## Owner-conducted security assessment — procurement excerpt {#owner-security-assessment-procurement-excerpt}

Former body of `docs/go-to-market/OWNER_SECURITY_ASSESSMENT_REDACTED_FOR_PACK.md` → this section. The filename [`OWNER_SECURITY_ASSESSMENT_REDACTED_FOR_PACK.md`](OWNER_SECURITY_ASSESSMENT_REDACTED_FOR_PACK.md) remains a **path-stable procurement-pack alias** (pack ZIP name `OWNER_SECURITY_ASSESSMENT_REDACTED.md`).

**Classification:** Buyer-facing (include alias in procurement pack ZIP). Buyer-shareable excerpt for procurement bundles. It summarizes the **same program** as the in-repo canonical file [`../security/OWNER_SECURITY_ASSESSMENT_2026_Q2.md`](../security/OWNER_SECURITY_ASSESSMENT_2026_Q2.md) but **must not** be edited with customer-specific names in the pack — use `PROCUREMENT_PACK_COVER.md` for deal context only.

### What this is (and is not)

- **Is:** Internal **owner / engineering** security self-assessment structured for transparency until third-party artefacts exist.
- **Is not:** A SOC 2 report, ISO certificate, or third-party penetration-test result.

### Method (summary)

1. **Automated CI gates** — SAST, dependency and container scanning, contract testing, secret scanning, and documented API abuse paths (see [`SECURITY.md`](../library/contributor-reference/SECURITY.md) and [`../library/AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md)).
2. **Manual checklist** — ASVS-oriented review of authentication, authorization, tenant isolation (database-per-tenant catalogs + JWT / app RBAC; SQL RLS is not the production boundary — [ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md)), rate limits, and LLM prompt / trace handling (see [`../security/SYSTEM_THREAT_MODEL.md`](../security/SYSTEM_THREAT_MODEL.md)).
3. **Findings register** — tracked internally with severity, owner, and remediation dates (the full assessment tables are finalized after the assessment window closes; this excerpt omits environment-specific rows).

### Full draft under NDA

Detailed tables, environment-specific links, and sign-off names live in the repository draft linked above. Procurement teams requiring **assessor-grade** evidence should request the **separate** pen-test and SOC 2 roadmap items referenced from [`trust-center.md`](trust-center.md). Status wording for those deferred items must match the [canonical status table](#canonical-status-table).

---

## Procurement documentation review cadence {#procurement-documentation-review-cadence}

**Audience:** Maintainers of procurement/trust documents and release managers.  
Includes stale-document escalation expectations.

### Cadence matrix

| Document | Owner role | Review frequency | Escalation when stale |
|---|---|---|---|
| `ASSURANCE_STATUS_CANONICAL.md` (this file) | Security lead | Every 30 days | Update first, then refresh all downstream assurance surfaces in the same change |
| `trust-center.md` | Security lead | Every 30 days | Raise in release checklist and update before procurement pack release |
| `CURRENT_ASSURANCE_POSTURE.md` (pack alias) + [`#current-assurance-posture-evidence`](#current-assurance-posture-evidence) | Security lead | Every 30 days | Block procurement deal-ready mode until this file (evidence section) is refreshed |
| `OWNER_SECURITY_ASSESSMENT_REDACTED_FOR_PACK.md` (pack alias) + [`#owner-security-assessment-procurement-excerpt`](#owner-security-assessment-procurement-excerpt) | Security lead | Every 30 days | Refresh excerpt when Q2 assessment draft status changes; keep pack alias deal-ready |
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
Former body: `docs/go-to-market/CURRENT_ASSURANCE_POSTURE.md` → [`#current-assurance-posture-evidence`](#current-assurance-posture-evidence) (filename kept as pack alias).  
Former body: `docs/go-to-market/OWNER_SECURITY_ASSESSMENT_REDACTED_FOR_PACK.md` → [`#owner-security-assessment-procurement-excerpt`](#owner-security-assessment-procurement-excerpt) (filename kept as pack alias).


> **Reviewed:** 2026-07-31

> **Scope:** Consolidated security and procurement posture for buyers — links only to in-repo evidence; no third-party attestation claims beyond what cited files state — plus the buyer scalability FAQ (formerly the body of `docs/library/BUYER_SCALABILITY_FAQ.md`; that filename remains a path-stable alias).

# ArchLucid Trust Center

<!-- TRUST_CENTER_LAST_REVIEWED_UTC:2026-07-31 -->

**Last reviewed:** 2026-07-31

**Last reviewed (UTC):** 2026-07-31

**Canonical assurance wording:** [`ASSURANCE_STATUS_CANONICAL.md`](ASSURANCE_STATUS_CANONICAL.md).

This page is the **single buyer-facing index** for security questionnaires, self-assessments, and procurement artifacts. Status labels are honest about evidence type: **self-asserted** documentation, **planned but not yet scheduled** work, **owner-conducted** programmes documented in-repo, or **third-party confirmed** only where a linked file states that explicitly.

---

## Procurement questionnaire accelerator

**Canonical artefact/status table:** [PROCUREMENT_PACK_INDEX.md](PROCUREMENT_PACK_INDEX.md) (`scripts/ci/check_procurement_pack_index.py` validates paths, **90-day** freshness on **Implemented** and **Self-asserted** canonical rows, buyer-placeholder strictness, forbidden false-assurance wording, and **Procurement artifact status map** status tokens).

For spreadsheets (SIG-, CAIQ-style rows), use **[Procurement FAQ](/help/procurement)** and the in-repo **[procurement response accelerator](BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-response-accelerator)** (`PROCUREMENT_RESPONSE_ACCELERATOR.md` alias) — **50** prompts grouped like SIG themes, each row pointing **only** to existing repository evidence (**no fabricated SOC 2 Type II issuance**).

---

## Healthcare and PHI

ArchLucid is for **architecture and governance evidence** about systems you describe — not a regulated record system for clinical care. **Do not upload PHI** into briefs, uploads, or free-text fields intended for architecture context. For **BAA**, **MSA/DPA** wording, or **contractual** posture beyond the in-repo templates ([DPA template](/help/dpa-template), [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md), [`V1_SCOPE.md`](../library/V1_SCOPE.md)), contact **`sales@archlucid.net`**. For **tenant isolation** and residency messaging aimed at procurement, see [Data handling and tenant isolation](/help/data-handling#isolation). Deeper **vertical positioning** (Medicare/Medicaid–adjacent patterns, starter HIPAA *program* mapping for conversations — not a legal attestation) lives in [`POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md#healthcare-vertical-positioning-sales--architecture`](../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md#healthcare-vertical-positioning-sales--architecture) (`buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md` alias). This section states product fit and data-handling expectations only; it does **not** add new compliance-certification claims beyond what linked documents already say.

---

## Cloud inventory connectivity (Tier 1 default)

**Default (Tier 1):** You run the in-repo PowerShell collector in **your** cloud account and upload a schema-versioned ZIP from the **New architecture review** wizard. **No ArchLucid credentials run in your AWS or GCP account** on this path, and **no vendor Entra app or subscription role** is required in Azure for Tier 1.

| Cloud | Customer-run script |
|-------|-------------------|
| Azure | `Get-ArchLucidAzurePackage.ps1` |
| AWS | `Get-ArchLucidAwsPackage.ps1` |
| GCP | `Get-ArchLucidGcpPackage.ps1` |

Details: [Cloud connections](/help/cloud-connections), operator runbook [`AZURE_EXTRACTOR_INGEST.md`](../runbooks/AZURE_EXTRACTOR_INGEST.md), and technical follow-ups [`AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md`](../library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md).

**Azure — what we will never ask for (high level):** **`Global Reader`**, **`Owner`**, **`Contributor`**, **`User Access Administrator`**, or any **write/destructive** subscription role — see [`BUYER_SECURITY_PROCUREMENT_PACKET.md#azure-extractor--infosec-pre-read`](BUYER_SECURITY_PROCUREMENT_PACKET.md#azure-extractor--infosec-pre-read) for the explicit buyer-facing list.

---

## Download the evidence pack

Procurement teams can pull every artefact below in one ZIP — generated on-demand from the in-repo source files (no third-party tracking, no email gate, anonymous):

> **[⬇ Download evidence pack (ZIP)](https://api.archlucid.net/v1/marketing/trust-center/evidence-pack.zip)**

The ZIP includes the DPA template, subprocessors register, SLA summary, `security.txt`, CAIQ Lite pre-fill, SIG Core pre-fill, owner-conducted security self-assessment (not third-party audited), 2026-Q2 pen-test SoW **template** (reserved for a planned, not yet scheduled vendor engagement), and the audit coverage matrix — plus an auto-generated `README.md` index. The HTTP response carries an `ETag` (SHA-256 of the included files' content) and a `Cache-Control: public, max-age=3600` header; resending the same ETag in `If-None-Match` returns `304 Not Modified`. The endpoint **deliberately omits** the redacted **third-party** pen-test summary because no third-party assessor report exists yet, and the PGP key (V1.1).

---

## Tenant isolation (production)

Production tenant data is isolated with a **database-per-tenant** model (`SystemWithPerTenantCatalogs`) and connection routing — not SQL row-level security as the primary control. The accepted architecture decision is documented in **ADR** [0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md); normative detail lives in [Tenant isolation defense in depth](../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md). Buyer-facing summary: [Data handling and tenant isolation](/help/data-handling#isolation).

---

## Posture summary

| Control | Status | Evidence | Last reviewed |
|---------|--------|----------|---------------|
| SOC 2 Common Criteria mapping (self-assessment, not attestation) | Self-asserted | [SOC 2 self-assessment](/help/soc2-self-assessment), [ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap](ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap) | 2026-07-24 |
| Independent penetration test programme (third-party vendor-led) | Planned, not yet scheduled — no vendor committed | [V1_DEFERRED.md §6c](../library/V1_DEFERRED.md), [PEN_TEST_SUMMARY_PROCUREMENT_INTERIM.md](PEN_TEST_SUMMARY_PROCUREMENT_INTERIM.md), [ASSURANCE_STATUS_CANONICAL.md](ASSURANCE_STATUS_CANONICAL.md) | 2026-07-24 |
| 2026-Q2 owner-conducted penetration-style assessment | Active V1 control | [2026-Q2-OWNER-CONDUCTED.md](../security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md) | 2026-07-24 |
| Third-party pen-test SoW template (no awarded vendor) | Template only — use when a vendor engagement is scheduled | [2026-Q2-SOW.md](../security/pen-test-summaries/2026-Q2-SOW.md) | 2026-07-24 |
| SOC 2 Type II attestation (CPA) — procurement status | Not issued — interim self-assessment only | [SOC2_STATUS_PROCUREMENT.md](SOC2_STATUS_PROCUREMENT.md), [ASSURANCE_STATUS_CANONICAL.md](ASSURANCE_STATUS_CANONICAL.md) | 2026-07-24 |
| Durable audit catalog (append-only design) | Self-asserted | [Audit trail](/help/audit-trail) | 2026-07-24 |
| V1 scalability (single-region contract; documented levers; in-repo k6/load evidence) | Self-asserted | [V1 scalability and load evidence](#v1-scalability-and-load-evidence) (`BUYER_SCALABILITY_FAQ.md` alias) | 2026-07-31 |
| Penetration test remediation tracking (process) | Self-asserted | [REMEDIATION_TRACKER.md](../security/pen-test-summaries/REMEDIATION_TRACKER.md) | 2026-07-24 |

---

## V1 scalability and load evidence {#v1-scalability-and-load-evidence}

Former standalone body: `docs/library/BUYER_SCALABILITY_FAQ.md` → this section (filename kept as a path-stable alias). Buyer/procurement-facing — not a marketing SLA and not a contractual uptime commitment.

**Path-stable alias:** [`../library/BUYER_SCALABILITY_FAQ.md`](../library/BUYER_SCALABILITY_FAQ.md).

**Audience:** Procurement, solution architecture, and platform buyers who need short answers tied to repository sources.

**Last reviewed:** 2026-07-31

This section summarizes what the **V1** contract does and does **not** promise for scale and geography, where to read **RTO/RPO planning targets** (not automatic product SLAs), which **operational knobs** the docs describe, and what **load-test evidence** exists in CI and baselines.

### V1 posture and explicit non-promises

- **V1 describes supportable product scope today**, not a roadmap of net-new scale guarantees — see the opening framing in [`V1_SCOPE.md`](../library/V1_SCOPE.md) (**Status** / §1).
- **Multi-region active/active SaaS is not a V1 guarantee.** [`V1_SCOPE.md`](../library/V1_SCOPE.md) §3 lists **“Multi-region active/active product guarantees”** as **out of scope for V1**, with a pointer that documentation may still describe tier targets and failover runbooks via [`RTO_RPO_TARGETS.md`](../library/RTO_RPO_TARGETS.md); that cross-reference is for **planning and runbooks**, not a bundled active/active topology in the shipping product contract.
- **RTO/RPO numbers are tier planning defaults**, not contractual SLAs unless your organization adopts them formally — see [`RTO_RPO_TARGETS.md`](../library/RTO_RPO_TARGETS.md) (**Constraints**: “Targets below are **not** contractual SLAs…”).

### Practical scale-up levers (documentation pointers)

| Concern | Where it is documented |
|--------|-------------------------|
| **API vs worker replicas, SQL saturation, outbox depth, LLM/token signals** | [`CAPACITY_AND_COST_PLAYBOOK.md`](../library/CAPACITY_AND_COST_PLAYBOOK.md) §5 (Component breakdown table: Container Apps, SQL, Outboxes, LLM). |
| **SQL tier, failover group / listener, geo patterns for production RPO** | [`RTO_RPO_TARGETS.md`](../library/RTO_RPO_TARGETS.md) §Tier targets and §Production — SQL RPO; operational steps in [`DATABASE_FAILOVER.md`](../runbooks/DATABASE_FAILOVER.md) (cross-referenced from `RTO_RPO_TARGETS.md`). |
| **Redis cache, same-region vs paired region, Terraform gap note** | [`REDIS_AND_MULTI_REGION.md`](../library/REDIS_AND_MULTI_REGION.md) — production points to Azure Cache for Redis; **multi-region application tier** describes Front Door secondary origin, SQL failover stack, and states that a **full active/active** multi-region app tier needs a second Container Apps environment and coordinated deployments (**not** a single-switch V1 guarantee). |
| **Per-tenant LLM cost estimation (not invoices)** | [`PER_TENANT_COST_MODEL.md`](../library/PER_TENANT_COST_MODEL.md); sponsor-facing **line-item** sketch is referenced from [`CAPACITY_AND_COST_PLAYBOOK.md`](../library/CAPACITY_AND_COST_PLAYBOOK.md) §9 via [`deployment/PER_TENANT_COST_MODEL.md`](../deployment/PER_TENANT_COST_MODEL.md). |

### Load and performance evidence in-repo

- **Documented baseline table and methodology:** [`LOAD_TEST_BASELINE.md`](../library/LOAD_TEST_BASELINE.md) — Compose **full-stack** assumptions, initial **p50/p95/p99** row, scaling **threshold interpretation**, and **BenchmarkDotNet** CI job pointer.
- **Merge-blocking k6 smoke on every PR:** [`LOAD_TEST_BASELINE.md`](../library/LOAD_TEST_BASELINE.md) §**CI smoke (automated)** — `tests/load/ci-smoke.js` via the **`k6-ci-smoke`** job in `.github/workflows/ci.yml`, with thresholds and `scripts/ci/assert_k6_ci_smoke_summary.py` behavior described there.
- **Operator-path k6 after full regression:** same doc’s component table — `tests/load/k6-api-smoke.js` and its CI job name as listed in [`LOAD_TEST_BASELINE.md`](../library/LOAD_TEST_BASELINE.md).
- **Manual / heavier profiles:** `.github/workflows/load-test.yml` (manual workflow), `scripts/load/hotpaths.js`, and optional scheduled workflows referenced in [`LOAD_TEST_BASELINE.md`](../library/LOAD_TEST_BASELINE.md) (e.g. soak, per-tenant burst).

**Honest boundary:** Passing CI k6 jobs proves **regression-gated latency/failure-rate thresholds on the scripted paths** for the CI environment described in [`LOAD_TEST_BASELINE.md`](../library/LOAD_TEST_BASELINE.md); they do **not** by themselves prove capacity for every customer topology or peak tenant mix.

### Related (scalability)

| Doc | Use |
|-----|-----|
| [`V1_SCOPE.md`](../library/V1_SCOPE.md) | Authoritative V1 in/out scope including multi-region non-promise. |
| [`RTO_RPO_TARGETS.md`](../library/RTO_RPO_TARGETS.md) | RTO/RPO tier table and SQL/geo mechanisms for **planning**. |
| [`LOAD_TEST_BASELINE.md`](../library/LOAD_TEST_BASELINE.md) | Baseline numbers, k6 scripts, CI vs manual workflows. |
| [`CAPACITY_AND_COST_PLAYBOOK.md`](../library/CAPACITY_AND_COST_PLAYBOOK.md) | Day-2 knobs and FinOps cadence. |
| [`SUPPORT_POLICY.md`](SUPPORT_POLICY.md) | Support / SLA summary (separate from scale capacity claims). |

---

## Automated freshness posture

This page participates in CI merge gates:

| Check | Behaviour |
|---|---|
| **`scripts/ci/check_trust_center_links.py`** | Fails merges on broken outbound / relative links referenced here |
| **`scripts/ci/check_trust_center_posture_freshness.py`** | Parses **Last reviewed** dates; emits `STALE_ROW` warnings (`--fail-on-stale` is opt-in tightening) |

**Workflow:** **`docs/runbooks/TRUST_CENTER_FRESHNESS.md`**. **Procurement artefact catalogue with CI-reviewed rows:** **`docs/go-to-market/PROCUREMENT_PACK_INDEX.md`**.

---

## Self-asserted controls

ArchLucid publishes internal analysis, architecture, and control-mapping documents. They are **not** substitutes for a CPA SOC 2 report or a completed external pen test.

- [Tenant isolation defense in depth (ADR 0037)](../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md)
- [Historical — RLS design sketch (superseded)](../security/MULTI_TENANT_RLS.md)
- [Historical — RLS risk acceptance (superseded)](../security/RLS_RISK_ACCEPTANCE.md)
- [System threat model (STRIDE)](../security/SYSTEM_THREAT_MODEL.md)
- [Ask / RAG pipeline threat notes](../security/ASK_RAG_THREAT_MODEL.md)
- [OWASP ZAP baseline rules (CI)](../security/ZAP_BASELINE_RULES.md)
- [Compliance matrix](../security/COMPLIANCE_MATRIX.md)
- [Evidence pack overview](../security/EVIDENCE_PACK.md)
- [Managed identity and SQL / Blob boundaries](../security/MANAGED_IDENTITY_SQL_BLOB.md)
- [Gitleaks pre-receive guidance](../security/GITLEAKS_PRE_RECEIVE.md)
- [Tenant isolation (buyer-facing)](/help/data-handling#isolation)

---

## Planned controls

Work tracked for a future release window; see linked deferral register (e.g. PGP coordinated-disclosure key). **Third-party** pen testing is planned, not yet scheduled — see [V1_DEFERRED.md §6c](../library/V1_DEFERRED.md).

- [Deferred assurance and packaging (V1_DEFERRED)](../library/V1_DEFERRED.md)

---

## Third-party engagements

**V1:** There is **no** awarded third-party penetration-test vendor. **V1** assurance includes **owner-conducted** testing ([2026-Q2-OWNER-CONDUCTED.md](../security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md)) plus CI and self-assessment evidence linked above.

**Planned, not yet scheduled:** When a third-party programme is funded, publish the engagement here and use [2026-Q2-SOW.md](../security/pen-test-summaries/2026-Q2-SOW.md) / [pen-test-summaries/](../security/pen-test-summaries/README.md) as the working surface. Redacted findings remain **NDA-gated** until explicitly approved for wider distribution.

---

## Support responsiveness

In-product **Report problem** (on high-stakes error surfaces) submits through the structured intake API and returns a durable **report reference** id in the dialog, with submitter email acknowledgement when your account has a mailbox on file. ArchLucid commits to **respond by the next business day** for those structured reports — not immediate chat and not always-on live monitoring. Email to **support@archlucid.net** remains a manual path when you are not on a failure page; it does not automatically mint a system report reference. See **[Report a problem](/help/report-a-problem)** for the full workflow.

---

## Customer-facing artifacts

- [Data Processing Agreement (template)](/help/dpa-template)
- [GDPR Data Subject Access Request (operator process)](../security/DSAR_PROCESS.md) — PII map, DSAR fulfillment, erasure constraints vs append-only audit.
- [Subprocessors](/help/subprocessors)
- [CAIQ Lite / SIG Core questionnaire responses](/help/caiq-sig-response)

---

## How to request the procurement pack

Use the CLI from a repository clone, or follow the email-safe buyer steps:

- [How to request the procurement pack](PROCUREMENT_PACK_INDEX.md#how-to-request-and-build-the-pack)

Contact **security@archlucid.net** for NDA-gated pen-test materials or to align procurement on a specific diligence list.

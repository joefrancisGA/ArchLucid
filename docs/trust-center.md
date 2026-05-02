> **Scope:** Consolidated security and procurement posture for buyers — links only to in-repo evidence; no third-party attestation claims beyond what cited files state.

# ArchLucid Trust Center

<!-- TRUST_CENTER_LAST_REVIEWED_UTC:2026-05-01 -->

**Last reviewed (UTC):** 2026-05-01

This page is the **single buyer-facing index** for security questionnaires, self-assessments, and procurement artifacts. Status labels are honest about evidence type: **self-asserted** documentation, **V1.1-scheduled** work, **engagements in flight**, or **third-party confirmed** only where a linked file states that explicitly.

---

## Procurement questionnaire accelerator

**Canonical artefact/status table:** [PROCUREMENT_PACK_INDEX.md](go-to-market/PROCUREMENT_PACK_INDEX.md) (`scripts/ci/check_procurement_pack_index.py` validates paths + **Implemented** review-age budgets). **Ultra-short skim (same curated paths):** [PROCUREMENT_FAST_LANE.md](go-to-market/PROCUREMENT_FAST_LANE.md).

For spreadsheets (SIG-, CAIQ-style rows), use **`docs/go-to-market/PROCUREMENT_RESPONSE_ACCELERATOR.md`** — **50** prompts grouped like SIG themes, each row pointing **only** to existing repository evidence (**no fabricated SOC 2 Type II issuance**):

- [PROCUREMENT_RESPONSE_ACCELERATOR.md](go-to-market/PROCUREMENT_RESPONSE_ACCELERATOR.md)

---

## Healthcare and PHI

ArchLucid is for **architecture and governance evidence** about systems you describe — not a regulated record system for clinical care. **Do not upload PHI** into briefs, uploads, or free-text fields intended for architecture context. For **BAA**, **MSA/DPA** wording, or **contractual** posture beyond the in-repo templates ([DPA template](go-to-market/DPA_TEMPLATE.md), [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md), [`V1_SCOPE.md`](library/V1_SCOPE.md)), contact **`sales@archlucid.net`**. For **tenant isolation** and residency messaging aimed at procurement, see [`TENANT_ISOLATION.md`](go-to-market/TENANT_ISOLATION.md). Deeper **vertical positioning** (Medicare/Medicaid–adjacent patterns, starter HIPAA *program* mapping for conversations — not a legal attestation) lives in [`HEALTHCARE_VERTICAL_BRIEF.md`](go-to-market/HEALTHCARE_VERTICAL_BRIEF.md). This section states product fit and data-handling expectations only; it does **not** add new compliance-certification claims beyond what linked documents already say.

---

## Download the evidence pack

Procurement teams can pull every artefact below in one ZIP — generated on-demand from the in-repo source files (no third-party tracking, no email gate, anonymous):

> **[⬇ Download evidence pack (ZIP)](https://api.archlucid.net/v1/marketing/trust-center/evidence-pack.zip)**

The ZIP includes the DPA template, subprocessors register, SLA summary, `security.txt`, CAIQ Lite pre-fill, SIG Core pre-fill, owner-conducted security self-assessment (not third-party audited), 2026-Q2 pen-test SoW **template** (reserved for a **V2** vendor cycle), and the audit coverage matrix — plus an auto-generated `README.md` index. The HTTP response carries an `ETag` (SHA-256 of the included files' content) and a `Cache-Control: public, max-age=3600` header; resending the same ETag in `If-None-Match` returns `304 Not Modified`. The endpoint **deliberately omits** the redacted **third-party** pen-test summary (**V2** per `docs/library/V1_DEFERRED.md` §6c) and the PGP key (V1.1).

---

## Posture summary

| Control | Status | Evidence | Last reviewed |
|---------|--------|----------|---------------|
| SOC 2 Common Criteria mapping (self-assessment, not attestation) | Self-asserted | [SOC2_SELF_ASSESSMENT_2026.md](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/SOC2_SELF_ASSESSMENT_2026.md), [SOC2_ROADMAP.md](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/go-to-market/SOC2_ROADMAP.md) | 2026-04-24 |
| Independent penetration test programme (third-party vendor-led) | **V2-planned** — no vendor committed for V1 | [V1_DEFERRED.md §6c](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/library/V1_DEFERRED.md), [V1_SCOPE.md §3](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/library/V1_SCOPE.md) | 2026-05-01 |
| 2026-Q2 owner-conducted penetration-style assessment | In progress / tracked | [2026-Q2-OWNER-CONDUCTED.md](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md) | 2026-05-01 |
| Third-party pen-test SoW template (no awarded vendor) | Template only — use when V2 vendor selected | [2026-Q2-SOW.md](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/pen-test-summaries/2026-Q2-SOW.md) | 2026-05-01 |
| SOC 2 Type II attestation (CPA) — procurement status | Self-asserted | [SOC2_STATUS_PROCUREMENT.md](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/go-to-market/SOC2_STATUS_PROCUREMENT.md) (states **not yet issued**; interim evidence is the self-assessment above) | 2026-04-24 |
| Durable audit catalog (append-only design) | Self-asserted | [AUDIT_COVERAGE_MATRIX.md](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/library/AUDIT_COVERAGE_MATRIX.md) | 2026-04-24 |
| V1 scalability (single-region contract; documented levers; in-repo k6/load evidence) | Self-asserted | [BUYER_SCALABILITY_FAQ.md](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/library/BUYER_SCALABILITY_FAQ.md) | 2026-04-29 |
| Penetration test remediation tracking (process) | Self-asserted | [REMEDIATION_TRACKER.md](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/pen-test-summaries/REMEDIATION_TRACKER.md) | 2026-04-24 |

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

- [Row-level security (RLS) and session context](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/MULTI_TENANT_RLS.md)
- [RLS risk acceptance](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/RLS_RISK_ACCEPTANCE.md)
- [System threat model (STRIDE)](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/SYSTEM_THREAT_MODEL.md)
- [Ask / RAG pipeline threat notes](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/ASK_RAG_THREAT_MODEL.md)
- [OWASP ZAP baseline rules (CI)](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/ZAP_BASELINE_RULES.md)
- [Compliance matrix](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/COMPLIANCE_MATRIX.md)
- [Evidence pack overview](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/EVIDENCE_PACK.md)
- [Managed identity and SQL / Blob boundaries](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/MANAGED_IDENTITY_SQL_BLOB.md)
- [Gitleaks pre-receive guidance](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/GITLEAKS_PRE_RECEIVE.md)
- [Tenant isolation (buyer-facing)](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/go-to-market/TENANT_ISOLATION.md)

---

## V1.1-scheduled controls

Work tracked for a future release window; see linked deferral register (e.g. PGP coordinated-disclosure key). **Third-party** pen testing is **V2**, not V1.1 — see [V1_DEFERRED.md §6c](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/library/V1_DEFERRED.md).

- [Deferred assurance and packaging (V1_DEFERRED)](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/library/V1_DEFERRED.md)

---

## Third-party engagements

**V1:** There is **no** awarded third-party penetration-test vendor. **V1** assurance includes **owner-conducted** testing ([2026-Q2-OWNER-CONDUCTED.md](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md)) plus CI and self-assessment evidence linked above.

**V2:** When a third-party programme is funded, publish the engagement here and use [2026-Q2-SOW.md](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/pen-test-summaries/2026-Q2-SOW.md) / [pen-test-summaries/](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/pen-test-summaries/README.md) as the working surface. Redacted findings remain **NDA-gated** until explicitly approved for wider distribution.

---

## Customer-facing artifacts

- [Data Processing Agreement (template)](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/go-to-market/DPA_TEMPLATE.md)
- [GDPR Data Subject Access Request (operator process)](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/DSAR_PROCESS.md) — PII map, DSAR fulfillment, erasure constraints vs append-only audit.
- [Subprocessors](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/go-to-market/SUBPROCESSORS.md)
- [CAIQ Lite pre-fill (2026)](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/CAIQ_LITE_2026.md)
- [SIG Core pre-fill (2026)](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/security/SIG_CORE_2026.md)

---

## How to request the procurement pack

Use the CLI from a repository clone, or follow the email-safe buyer steps:

- [How to request the procurement pack](https://github.com/joefrancisGA/ArchLucid/blob/main/docs/go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md)

Contact **security@archlucid.net** for NDA-gated pen-test materials or to align procurement on a specific diligence list.

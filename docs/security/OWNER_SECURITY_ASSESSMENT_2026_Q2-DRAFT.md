> **Scope:** Owner-conducted security assessment (Q2 2026) — draft placeholder - full detail, tables, and links in the sections below.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.


# Owner-conducted security assessment — Q2 2026 (draft)

**This is not a third-party penetration test and is not a SOC 2 attestation.** It is an **internal security self-assessment** performed by the product owner / engineering team, structured for buyer transparency until a separately funded external assessor delivers a redacted summary under [`pen-test-summaries/`](pen-test-summaries/README.md).

**Assessment window (planned):** `<<START_DATE>>` — `<<END_DATE>>`

**Scope in / out:** `<<SCOPE_SUMMARY>>` (e.g., hosted staging + API surface area listed in SoW template)

**Related templates:** [`PEN_TEST_SOW_TEMPLATE.md`](PEN_TEST_SOW_TEMPLATE.md) (borrow structure for scope), [`../go-to-market/TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md) (buyer index)

---

## Method

1. **Automated gates already in CI** — OWASP ZAP (baseline / scheduled), Schemathesis, CodeQL, Gitleaks, Trivy, Simmy, k6 smoke paths — re-run against the assessment environment and attach run links: `<<CI_RUN_LINKS>>`
2. **Manual checklist** — OWASP ASVS Level 2–oriented review of authentication, authorization, tenant isolation (RLS + JWT), rate limits, SSRF surfaces, and LLM prompt / trace handling per [`SYSTEM_THREAT_MODEL.md`](SYSTEM_THREAT_MODEL.md)
3. **Findings register** — severity, component, remediation, owner, target date

---

## Findings summary

| ID | Severity | Title | Status |
|----|----------|-------|--------|
| `<<FINDING_1_ID>>` | `<<SEV>>` | `<<TITLE>>` | `<<Open|Fixed|Accepted>>` |

*(Replace table after the assessment completes.)*

---

## Sign-off (internal)

| Role | Name | Date |
|------|------|------|
| Owner | `<<NAME>>` | `<<DATE>>` |

When this document is ready for external readers, move a **sanitized** copy (or this file, fully de-scrubbed) to a buyer-visible path linked from the Trust Center and archive the working notes separately if they contain internal-only detail.

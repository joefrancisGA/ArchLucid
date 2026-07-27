> **Reviewed:** 2026-07-25

> **Scope:** Buyer-job packaging — Healthcare claims policy pack pilot outcome (V1 surfaces only; demo seed friendly). Includes the demo-derived proof shape for self-serve walkthroughs.

# Buyer job — Healthcare claims policy review

**Last reviewed:** 2026-07-25

**Classification:** **Specialty** template (optional). Use when the buyer’s job is PHI-minimization / claims intake policy — not as a mandatory pre-first-value checklist. **Core path:** [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

**Audience:** Pilot champions in regulated healthcare-adjacent workflows who need to show **PHI-minimization and intake boundary** policy landing on findings before finalize.

**Full architect walkthrough:** [`../../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md`](../../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md)

---

## Buyer question

**“How does PHI-minimization and healthcare claims policy land on findings before we finalize an architecture package?”**

---

## Target buyer and trigger event

Healthcare-adjacent product, compliance, or architecture sponsors use this accelerator when claims intake modernization needs PHI-minimization evidence, governance wants a policy-backed review before approval, or a pilot champion needs a defensible demo using synthetic claims data.

## Expected first finding types

- PHI minimization or retention-risk findings tied to intake, routing, or export boundaries.
- Missing evidence for policy-pack controls before finalize.
- Governance disposition gaps for critical/high healthcare claims findings.
- Audit/export readiness gaps when a sponsor package is requested.

## Sponsor artifact example

A proof package that says: “This healthcare claims review shows how PHI-minimization policy maps to findings, governance disposition, audit trail, and a finalized architecture package.” Use the synthetic Claims Intake package or a buyer-provided architecture brief with PHI removed.

## ROI and procurement proof points

- Reduced review-prep and documentation hours, labeled by source.
- Policy-pack assignment and pre-finalize gate evidence.
- Audit trail and architecture package export showing what was reviewed and approved.

## What not to claim

- Do not claim HIPAA certification, legal compliance, or third-party audit completion.
- Do not use real PHI in demo payloads or finalized examples.
- Do not imply Jira, Teams, ServiceNow, MCP, or outbound webhooks are required in V1.

---

## Required inputs

| Input | Notes |
|-------|--------|
| Architect access | **ReadAuthority** (review) and **ExecuteAuthority** (finalize / API `commit`) |
| Policy pack | **`healthcare-claims-v3`** (demo: `demo-healthcare-claims-pack`, version **3.4.1**) |
| Review | Demo **`claims-intake-modernization`** or net-new architecture request for claims intake modernization |
| Tier | **Standard** (or trial) with governance features per [`V1_SCOPE.md`](../../library/V1_SCOPE.md) |

Demo payloads are synthetic — no real PHI. Jira, Teams, ServiceNow, MCP, and outbound webhooks are **not** required ([`INTEGRATION_CATALOG.md`](../INTEGRATION_CATALOG.md)).

---

## Shipped product steps (V1)

1. **Open policy pack** — Confirm `healthcare-claims-v3` themes (Governance → Policy packs or demo deep link).
2. **Assign to scope** — Pin version; optionally enable **Block commit on critical** (pre-finalize gate).
3. **Open or create review** — Demo `claims-intake-modernization` or new review with claims intake narrative.
4. **Execute** — Inspect findings (e.g. `phi-minimization-risk` in demo seed).
5. **Pre-finalize gate** — Resolve or disposition blocking findings; finalize when gate passes (API `commit`).
6. **Export** — Run summary one-pager / board export from review detail **Exports**.

Spine reference: [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

---

## Expected artifacts

- Policy pack assignment record pinned to project scope
- Findings with healthcare compliance themes and severity aligned to pack rules
- Finalized architecture package sections (summary, artifacts, exports)
- Executive summary with ROI basis labels (Retail, EA-adjusted, Uploaded actual/amortized)

---

## Evidence generated

- Policy evaluation traces for healthcare-claims rules on architecture context
- Pre-finalize gate outcome (`409` + blocking finding ids when gate blocks)
- Signed architecture package and downloadable export bundle
- Optional compare pair in demo (`claims-intake-run-v1` vs `v2`) for **Operate** depth — not required for first-pilot success

---

## Sponsor outcome

A **policy-anchored architecture package** that shows how healthcare claims controls surface as findings and gate finalize — suitable for internal architecture or compliance readout without implying HIPAA certification. Narrative support: [`EXECUTIVE_SPONSOR_BRIEF.md`](../EXECUTIVE_SPONSOR_BRIEF.md).

---

## How to measure success

Use [`PILOT_SUCCESS_SCORECARD.md`](../PILOT_SUCCESS_SCORECARD.md): `healthcare-claims-v3` assigned and pinned, critical findings dispositioned before finalize, synthetic-only demo payloads, and sponsor export with labeled ROI basis (never real PHI).

---

## Healthcare vertical positioning (sales / architecture)

**Not** legal advice or a compliance attestation. For procurement posture, see [`trust-center.md`](../trust-center.md) and in-repo DPA/MSA templates.

ArchLucid helps teams produce **reviewable architecture manifests, findings, and governance evidence** for systems *you describe* in briefs and structured context. It is **not** an EHR, claims system, or clinical data store. **Do not upload PHI** into briefs or free-text context; use de-identified or architectural descriptions only. Contractual and BAA paths → **`sales@archlucid.net`**.

| Concern | How teams usually frame it in an architecture run | What ArchLucid evidence can reflect |
|--------|----------------------------------------------------|-------------------------------------|
| **Boundary systems** (e.g. CMS interfaces, state MMIS) | As components and data-flow edges in the manifest | Graph + findings on coupling and interfaces |
| **PII/PHI separation** | As explicit non-goals in the brief and policy packs | Drift and governance rules against “no PHI in context” team norms |
| **Audit trail** | As operational requirement | Append-only audit and run history ([`AUDIT_COVERAGE_MATRIX.md`](../../library/AUDIT_COVERAGE_MATRIX.md)) |

**Illustrative HIPAA *program* themes** (not HITRUST/SOC mapping): access control → app RBAC + tenant catalog routing ([`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview`](../BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview)); audit controls → [`AUDIT_COVERAGE_MATRIX.md`](../../library/AUDIT_COVERAGE_MATRIX.md); transmission/integrity → Azure patterns in [`MANAGED_IDENTITY_SQL_BLOB.md`](../../security/MANAGED_IDENTITY_SQL_BLOB.md). A **BAA** (if required) is a **legal** instrument, not a feature flag — default product positioning is **architecture evidence only, no clinical PHI in scope** unless a separate agreement says otherwise.

---

## Demo proof shape (Demo-derived only)

**Evidence basis:** **Demo-derived** · **Deferred scope** for production PHI environments. Synthetic/demo evidence only — no production PHI.

| Finding (illustrative) | Category | Evidence label |
| --- | --- | --- |
| PHI minimization rule triggered on narrative field | Policy | Demo-derived |
| BAA / production HIPAA attestation not in scope | Compliance | Deferred scope |
| Audit export path present | Auditability | Evidence-backed (structural) |

**Do not claim:** HIPAA compliance certification or sponsor ROI dollars from this demo shape.

---

## Related

| Doc | Use |
|-----|-----|
| [`library/walkthroughs/README.md`](../../library/walkthroughs/README.md) | Specialty accelerator template index |
| [`CORE_PILOT.md`](../../CORE_PILOT.md))))))))) | Four-step Core Pilot spine |
| [`PRODUCT_PACKAGING.md`](../../library/PRODUCT_PACKAGING.md) | Capability inventory |
| [`PRE_COMMIT_GOVERNANCE_GATE.md`](../../library/PRE_COMMIT_GOVERNANCE_GATE.md) | Gate behavior |

> **Scope:** Buyer-job packaging — Healthcare claims policy pack pilot outcome (V1 surfaces only; demo seed friendly).

# Buyer job — Healthcare claims policy review

**Classification:** **Specialty** template (optional). Use when the buyer’s job is PHI-minimization / claims intake policy — not as a mandatory pre-first-value checklist. **Core path:** [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

**Audience:** Pilot champions in regulated healthcare-adjacent workflows who need to show **PHI-minimization and intake boundary** policy landing on findings before commit.

**Full operator walkthrough:** [`../../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md`](../../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md)

---

## Buyer question

**“How does PHI-minimization and healthcare claims policy land on findings before we commit a review package?”**

---

## Target buyer and trigger event

Healthcare-adjacent product, compliance, or architecture sponsors use this accelerator when claims intake modernization needs PHI-minimization evidence, governance wants a policy-backed review before approval, or a pilot champion needs a defensible demo using synthetic claims data.

## Expected first finding types

- PHI minimization or retention-risk findings tied to intake, routing, or export boundaries.
- Missing evidence for policy-pack controls before commit.
- Governance disposition gaps for critical/high healthcare claims findings.
- Audit/export readiness gaps when a sponsor package is requested.

## Sponsor artifact example

A proof package that says: “This healthcare claims review shows how PHI-minimization policy maps to findings, governance disposition, audit trail, and a committed manifest.” Use the synthetic Claims Intake package or a buyer-provided architecture brief with PHI removed.

## ROI and procurement proof points

- Reduced review-prep and documentation hours, labeled by source.
- Policy-pack assignment and pre-commit gate evidence.
- Audit trail and manifest export showing what was reviewed and approved.

## What not to claim

- Do not claim HIPAA certification, legal compliance, or third-party audit completion.
- Do not use real PHI in demo payloads or committed examples.
- Do not imply Jira, Teams, ServiceNow, MCP, or outbound webhooks are required in V1.

---

## Required inputs

| Input | Notes |
|-------|--------|
| Operator access | **ReadAuthority** (review) and **ExecuteAuthority** (commit) |
| Policy pack | **`healthcare-claims-v3`** (demo: `demo-healthcare-claims-pack`, version **3.4.1**) |
| Review | Demo **`claims-intake-modernization`** or net-new architecture request for claims intake modernization |
| Tier | **Standard** (or trial) with governance features per [`V1_SCOPE.md`](../../library/V1_SCOPE.md) |

Demo payloads are synthetic — no real PHI. Jira, Teams, ServiceNow, MCP, and outbound webhooks are **not** required ([`INTEGRATION_CATALOG.md`](../INTEGRATION_CATALOG.md)).

---

## Shipped product steps (V1)

1. **Open policy pack** — Confirm `healthcare-claims-v3` themes (Governance → Policy packs or demo deep link).
2. **Assign to scope** — Pin version; optionally enable **Block commit on critical**.
3. **Open or create review** — Demo `claims-intake-modernization` or new review with claims intake narrative.
4. **Execute** — Inspect findings (e.g. `phi-minimization-risk` in demo seed).
5. **Pre-commit gate** — Resolve or disposition blocking findings; commit when gate passes.
6. **Export** — Run summary one-pager / board export from review detail **Exports**.

Spine reference: [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

---

## Expected artifacts

- Policy pack assignment record pinned to project scope
- Findings with healthcare compliance themes and severity aligned to pack rules
- Committed golden manifest and review package sections (summary, artifacts, exports)
- Executive summary with ROI basis labels (Retail, EA-adjusted, Uploaded actual/amortized)

---

## Evidence generated

- Policy evaluation traces for healthcare-claims rules on architecture context
- Pre-commit gate outcome (`409` + blocking finding ids when gate blocks)
- Signed manifest and downloadable export bundle
- Optional compare pair in demo (`claims-intake-run-v1` vs `v2`) for **Operate** depth — not required for first-pilot success

---

## Sponsor outcome

A **policy-anchored review package** that shows how healthcare claims controls surface as findings and gate commit — suitable for internal architecture or compliance readout without implying HIPAA certification. Narrative support: [`EXECUTIVE_SPONSOR_BRIEF.md`](../EXECUTIVE_SPONSOR_BRIEF.md).

---

## How to measure success

Use [`PILOT_SUCCESS_SCORECARD.md`](../PILOT_SUCCESS_SCORECARD.md): `healthcare-claims-v3` assigned and pinned, critical findings dispositioned before commit, synthetic-only demo payloads, and sponsor export with labeled ROI basis (never real PHI).

---

## Related

| Doc | Use |
|-----|-----|
| [`library/walkthroughs/README.md`](../../library/walkthroughs/README.md) | Specialty accelerator template index |
| [`CORE_PILOT.md`](../../CORE_PILOT.md) | Four-step Core Pilot spine |
| [`PRODUCT_PACKAGING.md`](../../library/PRODUCT_PACKAGING.md) | Capability inventory |
| [`PRE_COMMIT_GOVERNANCE_GATE.md`](../../library/PRE_COMMIT_GOVERNANCE_GATE.md) | Gate behavior |

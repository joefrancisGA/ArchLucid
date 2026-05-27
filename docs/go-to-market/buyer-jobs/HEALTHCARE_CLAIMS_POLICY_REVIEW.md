> **Scope:** Buyer-job packaging — Healthcare claims policy pack pilot outcome (V1 surfaces only; demo seed friendly).

# Buyer job — Healthcare claims policy review

**Audience:** Pilot champions in regulated healthcare-adjacent workflows who need to show **PHI-minimization and intake boundary** policy landing on findings before commit.

**Full operator walkthrough:** [`../../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md`](../../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md)

---

## Buyer question

**“How does PHI-minimization and healthcare claims policy land on findings before we commit a review package?”**

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

## Related

| Doc | Use |
|-----|-----|
| [`library/walkthroughs/README.md`](../../library/walkthroughs/README.md) | Accelerator pack index |
| [`CORE_PILOT.md`](../../CORE_PILOT.md) | Four-step Core Pilot spine |
| [`PRODUCT_PACKAGING.md`](../../library/PRODUCT_PACKAGING.md) | Capability inventory |
| [`PRE_COMMIT_GOVERNANCE_GATE.md`](../../library/PRE_COMMIT_GOVERNANCE_GATE.md) | Gate behavior |

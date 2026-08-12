> **Reviewed:** 2026-07-27

> **Scope:** Healthcare claims vertical pilot — assign `healthcare-claims-v3` policy pack, run review, pre-commit gate, and commit using shipped demo seed references — plus buyer-job packaging / demo proof shape / healthcare vertical positioning (formerly the body of `docs/go-to-market/buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md`; that filename remains a path-stable Specialty alias).

# Healthcare claims policy pack — pilot walkthrough

**Audience:** Pilot champions running the Claims Intake sample in the architect workspace or against a hosted trial tenant.

**Last reviewed:** 2026-07-27

**Grounding rule:** Every step maps to **shipped V1** API/UI surfaces. **Jira**, **Microsoft Teams**, and other first-party ITSM/chat connectors are **V1.1** — not required for this walkthrough ([`INTEGRATION_CATALOG.md`](../../go-to-market/INTEGRATION_CATALOG.md)). Demo payloads are synthetic — no real PHI.

**Buyer-job packaging:** [`#buyer-job-packaging`](#buyer-job-packaging) (`buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md` alias).

---

## Demo seed references

| Artifact | Id / route |
|----------|------------|
| Sample review run | `claims-intake-modernization` — `/reviews/claims-intake-modernization` |
| Policy pack (UI detail) | `demo-healthcare-claims-pack` — `/governance/policy-packs/demo-healthcare-claims-pack` |
| Rule set id (metadata) | `healthcare-claims-v3` (version **3.4.1** in static demo payloads) |
| Primary finding (PHI storyline) | `phi-minimization-risk` — `/reviews/claims-intake-modernization/findings/phi-minimization-risk` |
| Compare pair (optional, Operate) | `claims-intake-run-v1` vs `claims-intake-run-v2` — `/compare?priorRunId=claims-intake-run-v1&laterRunId=claims-intake-run-v2` |

Static operator/demo mode serves curated payloads from `archlucid-ui/src/lib/operator/operator-static-demo.ts` and `showcase-static-demo.ts` when APIs are unavailable.

---

## Prerequisites

1. **Architect workspace** access with authority to review and finalize for your tenant.
2. **Standard** tier (or trial) with governance features enabled per [`V1_SCOPE.md`](../V1_SCOPE.md).
3. For live API steps: bearer token or session auth configured (`Authorization: Bearer …` or Entra SSO).

---

## Step 1 — Open the healthcare claims policy pack

**UI**

1. Sign in to the architect workspace.
2. Expand sidebar: **Show all features** → **Sidebar layout** → enable **Show governance, audit & admin controls** (advanced disclosure).
3. Open **Governance** → **Policy packs** (or navigate directly to `/governance/policy-packs/demo-healthcare-claims-pack` in demo mode).
4. Confirm pack label references **`healthcare-claims-v3`** and healthcare compliance themes (PHI minimization, intake boundary controls).

**API (optional verify)**

```http
GET /v1/policy-packs/demo-healthcare-claims-pack
Authorization: Bearer {token}
```

Expect pack metadata with `ruleSetId: healthcare-claims-v3` in content JSON (demo seed).

---

## Step 2 — Assign pack to project scope

**UI**

1. On the policy pack detail page, use **Assign to scope** (project or tenant per your governance model).
2. Pin version **3.4.1** (or latest published version in your tenant).
3. Enable **Block commit on critical** or set **Minimum blocking severity** if your pilot exercises the pre-commit gate ([`PRE_COMMIT_GOVERNANCE_GATE.md`](../PRE_COMMIT_GOVERNANCE_GATE.md)).

**API**

```http
POST /v1/policy-packs/{policyPackId}/assign
Content-Type: application/json
Authorization: Bearer {token}

{
  "version": "3.4.1",
  "scopeLevel": "Project",
  "projectId": "default",
  "isPinned": true
}
```

---

## Step 3 — Open or create the Claims Intake review

**UI (demo path — fastest)**

1. Navigate to `/reviews/claims-intake-modernization` (or **Home** → **Reviews** → select **Claims Intake Modernization**).
2. Confirm run status shows a committed or in-progress review with healthcare/PHI findings narrative.

**UI (net-new review)**

1. **Capture** → **New review** (`/reviews/new`) with healthcare intake scenario inputs, **or** use the home-panel **Try healthcare claims sample** shortcut when offered.
2. Execute the review pipeline and wait for findings + manifest draft.

**API**

```http
GET /v1/architecture/review/claims-intake-modernization
Authorization: Bearer {token}
```

---

## Step 4 — Pre-commit governance dry-run

Before commit, preview gate outcome against the assigned pack.

**UI**

1. On review detail, open **Governance** / **Pre-commit check** (or policy dry-run panel when present).
2. Review blocking vs warning findings; note PHI minimization finding alignment with pack rules.

**API**

```http
POST /v1/governance/policy-packs/dry-run
Content-Type: application/json
Authorization: Bearer {token}

{
  "targetRunId": "claims-intake-modernization",
  "policyPackContentJson": "{ ... healthcare-claims-v3 content ... }",
  "blockCommitOnCritical": true
}
```

See [`PRE_COMMIT_GOVERNANCE_GATE.md`](../PRE_COMMIT_GOVERNANCE_GATE.md) for severity threshold semantics.

> Dry-run output is **architecture-review governance evidence** for sponsor packets — not HIPAA or regulatory certification.

---

## Step 5 — Finalize architecture package (when gate passes)

**UI**

1. Resolve or disposition blocking findings (or confirm warn-only severities per tenant config).
2. Select **Finalize** on review detail.
3. After success, open **Architecture package** sections: signed review record, artifacts, exports.

<details>
<summary>Administrator details — HTTP path</summary>

```http
POST /v1/architecture/review/claims-intake-modernization/commit
Authorization: Bearer {token}
```

On block: `409` with `#governance-pre-commit-blocked` and `blockingFindingIds` extension.

</details>

---

## Step 6 — Sponsor packet (exports)

1. Download **Run summary one-pager** or architecture review board export from review detail **Exports**.
2. Cross-check ROI basis labels on **Executive summary** (`/dashboard`) — pricing basis must read **Retail**, **EA-adjusted**, or **Uploaded actual/amortized** per tenant evidence ([`ROI_MODEL.md`](../../go-to-market/ROI_MODEL.md)).
3. CI golden fixture for packet composition: `ArchLucid.Application.Tests/Exports/ExecutiveReviewPacketGoldenFixtureTests.cs` (see [`PILOT_SUCCESS_SCORECARD.md`](../../go-to-market/PILOT_SUCCESS_SCORECARD.md)).

---

## Buyer-job packaging {#buyer-job-packaging}

Former standalone body: `docs/go-to-market/buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md` → this section (filename kept as a path-stable Specialty alias).

**Classification:** **Specialty** template (optional). Use when the buyer’s job is PHI-minimization / claims intake policy — not as a mandatory pre-first-value checklist. **Core path:** [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

### Buyer question

**“How does PHI-minimization and healthcare claims policy land on findings before we finalize an architecture package?”**

### Target buyer and trigger event

Healthcare-adjacent product, compliance, or architecture sponsors use this accelerator when claims intake modernization needs PHI-minimization evidence, governance wants a policy-backed review before approval, or a pilot champion needs a defensible demo using synthetic claims data.

### Expected first finding types

- PHI minimization or retention-risk findings tied to intake, routing, or export boundaries.
- Missing evidence for policy-pack controls before finalize.
- Governance disposition gaps for critical/high healthcare claims findings.
- Audit/export readiness gaps when a sponsor package is requested.

### Sponsor artifact example

A proof package that says: “This healthcare claims review shows how PHI-minimization policy maps to findings, governance disposition, audit trail, and a finalized architecture package.” Use the synthetic Claims Intake package or a buyer-provided architecture brief with PHI removed.

### ROI and procurement proof points

- Reduced review-prep and documentation hours, labeled by source.
- Policy-pack assignment and pre-finalize gate evidence.
- Audit trail and architecture package export showing what was reviewed and approved.

### What not to claim

- Do not claim HIPAA certification, legal compliance, or third-party audit completion.
- Do not use real PHI in demo payloads or finalized examples.
- Do not imply Jira, Teams, ServiceNow, MCP, or outbound webhooks are required in V1.

### Required inputs

| Input | Notes |
|-------|--------|
| Architect access | **ReadAuthority** (review) and **ExecuteAuthority** (finalize / API `commit`) |
| Policy pack | **`healthcare-claims-v3`** (demo: `demo-healthcare-claims-pack`, version **3.4.1**) |
| Review | Demo **`claims-intake-modernization`** or net-new architecture request for claims intake modernization |
| Tier | **Standard** (or trial) with governance features per [`V1_SCOPE.md`](../V1_SCOPE.md) |

Demo payloads are synthetic — no real PHI. Jira, Teams, ServiceNow, MCP, and outbound webhooks are **not** required ([`INTEGRATION_CATALOG.md`](../../go-to-market/INTEGRATION_CATALOG.md)).

### Shipped product steps (V1 summary)

1. **Open policy pack** — Confirm `healthcare-claims-v3` themes (Governance → Policy packs or demo deep link).
2. **Assign to scope** — Pin version; optionally enable **Block commit on critical** (pre-finalize gate).
3. **Open or create review** — Demo `claims-intake-modernization` or new review with claims intake narrative.
4. **Execute** — Inspect findings (e.g. `phi-minimization-risk` in demo seed).
5. **Pre-finalize gate** — Resolve or disposition blocking findings; finalize when gate passes (API `commit`).
6. **Export** — Run summary one-pager / board export from review detail **Exports**.

Detailed UI/API steps: sections above. Spine: [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

### Expected artifacts

- Policy pack assignment record pinned to project scope
- Findings with healthcare compliance themes and severity aligned to pack rules
- Finalized architecture package sections (summary, artifacts, exports)
- Executive summary with ROI basis labels (Retail, EA-adjusted, Uploaded actual/amortized)

### Evidence generated

- Policy evaluation traces for healthcare-claims rules on architecture context
- Pre-finalize gate outcome (`409` + blocking finding ids when gate blocks)
- Signed architecture package and downloadable export bundle
- Optional compare pair in demo (`claims-intake-run-v1` vs `v2`) for **Operate** depth — not required for first-pilot success

### Sponsor outcome

A **policy-anchored architecture package** that shows how healthcare claims controls surface as findings and gate finalize — suitable for internal architecture or compliance readout without implying HIPAA certification. Narrative support: [`EXECUTIVE_SPONSOR_BRIEF.md`](../../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md).

### How to measure success

Use [`PILOT_SUCCESS_SCORECARD.md`](../../go-to-market/PILOT_SUCCESS_SCORECARD.md): `healthcare-claims-v3` assigned and pinned, critical findings dispositioned before finalize, synthetic-only demo payloads, and sponsor export with labeled ROI basis (never real PHI).

### Healthcare vertical positioning (sales / architecture) {#healthcare-vertical-positioning-sales--architecture}

**Not** legal advice or a compliance attestation. For procurement posture, see [`trust-center.md`](../../go-to-market/trust-center.md) and in-repo DPA/MSA templates.

ArchLucid helps teams produce **reviewable architecture manifests, findings, and governance evidence** for systems *you describe* in briefs and structured context. It is **not** an EHR, claims system, or clinical data store. **Do not upload PHI** into briefs or free-text context; use de-identified or architectural descriptions only. Contractual and BAA paths → **`sales@archlucid.net`**.

| Concern | How teams usually frame it in an architecture run | What ArchLucid evidence can reflect |
|--------|----------------------------------------------------|-------------------------------------|
| **Boundary systems** (e.g. CMS interfaces, state MMIS) | As components and data-flow edges in the manifest | Graph + findings on coupling and interfaces |
| **PII/PHI separation** | As explicit non-goals in the brief and policy packs | Drift and governance rules against “no PHI in context” team norms |
| **Audit trail** | As operational requirement | Append-only audit and run history ([`AUDIT_COVERAGE_MATRIX.md`](../AUDIT_COVERAGE_MATRIX.md)) |

**Illustrative HIPAA *program* themes** (not HITRUST/SOC mapping): access control → app RBAC + tenant catalog routing ([`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview`](../../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview)); audit controls → [`AUDIT_COVERAGE_MATRIX.md`](../AUDIT_COVERAGE_MATRIX.md); transmission/integrity → Azure patterns in [`MANAGED_IDENTITY_SQL_BLOB.md`](../../security/MANAGED_IDENTITY_SQL_BLOB.md). A **BAA** (if required) is a **legal** instrument, not a feature flag — default product positioning is **architecture evidence only, no clinical PHI in scope** unless a separate agreement says otherwise.

### Demo proof shape (Demo-derived only) {#demo-proof-shape-demo-derived-only}

**Evidence basis:** **Demo-derived** Â· **Deferred scope** for production PHI environments. Synthetic/demo evidence only — no production PHI.

| Finding (illustrative) | Category | Evidence label |
| --- | --- | --- |
| PHI minimization rule triggered on narrative field | Policy | Demo-derived |
| BAA / production HIPAA attestation not in scope | Compliance | Deferred scope |
| Audit export path present | Auditability | Evidence-backed (structural) |

**Do not claim:** HIPAA compliance certification or sponsor ROI dollars from this demo shape.

---

## Related docs

- [`README.md`](README.md) — accelerator pack index
- [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md) — single V1 first-pilot path
- [`CORE_PILOT.md`](../../CORE_PILOT.md) — four-step Core Pilot spine
- [`AZURE_SAAS_READINESS_REVIEW.md`](AZURE_SAAS_READINESS_REVIEW.md) Â· [`AI_GOVERNANCE_REVIEW.md`](AI_GOVERNANCE_REVIEW.md) — sibling accelerators
- [`docs/samples/policy-packs/README.md`](../../samples/policy-packs/README.md) — sample pack JSON shapes
- [`BUYER_ORIENTATION_ONE_SCREEN.md`](../../go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md) — buyer pass/hold + next-step chooser
- [`#buyer-job-packaging`](#buyer-job-packaging) Â· [`../../go-to-market/buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md`](../../go-to-market/buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md) (alias) — Specialty buyer-job path

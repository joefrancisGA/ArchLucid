> **Reviewed:** 2026-07-27

> **Scope:** AI governance accelerator — Responsible AI policy pack, findings, governance gate, and sponsor export; V1 surfaces only — plus buyer-job packaging / demo proof shape (formerly the body of `docs/go-to-market/buyer-jobs/AI_GOVERNANCE_REVIEW.md`; that filename remains a path-stable Specialty alias).

# AI governance review — accelerator walkthrough

**Audience:** Risk, compliance, and architecture leaders who need a **Responsible AI** architecture package (model inventory, oversight, classification themes) without implying certification or real PHI.

**Last reviewed:** 2026-07-27

**Buyer outcome:** A finalized review demonstrating **ai-gov-*** rule coverage, governance disposition, and sponsor-readable exports — using shipped V1 policy packs and demo or live runs.

**Grounding rule:** No **Jira**, **Teams**, or **ServiceNow** required ([`INTEGRATION_CATALOG.md`](../../go-to-market/INTEGRATION_CATALOG.md) V1.1). Synthetic demo storyline uses **fabricated** Meridian / Alpine names only ([`DEMO_WORKSPACES.md`](../../go-to-market/DEMO_WORKSPACES.md)).

**Buyer-job packaging:** [`#buyer-job-packaging`](#buyer-job-packaging) (`buyer-jobs/AI_GOVERNANCE_REVIEW.md` alias).

---

## Demo fast path (finalized storyline)

| Artifact | Id / route |
|----------|------------|
| Regulated AI + security baseline review | `61c60d76-2b80-93f9-46bb-2f66fd608b9b` — `/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b` |
| Scope triplet | [`DEMO_WORKSPACES.md`](../../go-to-market/DEMO_WORKSPACES.md) Workspace B headers |
| Curated rules corpus | [`ai-governance-responsible-ai-rules-v1.json`](../../samples/policy-packs/ai-governance-responsible-ai-rules-v1.json) |
| Rule appendix | [`POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md`](../POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md) |

---

## Prerequisites

1. Architect workspace access with authority to execute and finalize reviews.
2. Tenant compliance catalog includes **`ai-gov-001`** through **`ai-gov-020`** (default seed).
3. For net-new reviews: architecture request describing ML inference, training, and data-handling boundaries.

---

## Step 1 — Open or create the AI governance review

**UI (demo)**

1. Set workspace scope to Workspace B triplet (scope switcher or headers per DEMO_WORKSPACES).
2. Open `/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b`.
3. Confirm storyline: **Alpine Patient Risk Scoring Platform** (synthetic; no real PHI).

**UI (net-new)**

1. **New review** with AI/ML workload description and governance tags in request narrative.
2. Attach evidence (extractor ZIP, uploaded diagrams, or registry exports as your pilot allows).

**API**

```http
GET /v1/architecture/review/61c60d76-2b80-93f9-46bb-2f66fd608b9b
Authorization: Bearer {token}
```

---

## Step 2 — Assign AI Governance / Responsible AI pack

Template body: `DefaultPolicyPackTemplates.AiGovernanceResponsibleAiV1Json` (metadata `templateId: ai-governance-responsible-ai-v1`).

**UI**

1. **Governance** → **Policy packs** → create or select **AI Governance / Responsible AI**.
2. **Assign** to project scope; enable **Block commit on critical** if exercising enforcement.

**API**

```http
POST /v1/policy-packs
Content-Type: application/json
Authorization: Bearer {token}

{
  "displayName": "AI Governance / Responsible AI (pilot)",
  "initialContentJson": "{ ... AiGovernanceResponsibleAiV1Json ... }"
}
```

Framework mapping is **thematic only** — see disclaimer in pack metadata and appendix doc.

---

## Step 3 — Execute pipeline and inspect ai-gov findings

**UI**

1. **Execute** (if not already committed on demo run).
2. Open **Findings** queue; filter for **ai-gov-*** identifiers and Responsible AI themes.
3. Open individual finding inspect routes for evidence refs and reasoning trace (when present).

**API**

```http
GET /v1/architecture/review/{runId}/findings
Authorization: Bearer {token}
```

---

## Step 4 — Pre-commit governance dry-run

**UI**

1. Review **Pre-commit check** / dry-run panel on review detail.
2. Note blocking vs warning severities for `ai-gov-*` rules.

**API**

```http
POST /v1/governance/policy-packs/dry-run
Content-Type: application/json
Authorization: Bearer {token}

{
  "targetRunId": "{runId}",
  "policyPackContentJson": "{ ... }",
  "blockCommitOnCritical": true
}
```

See [`PRE_COMMIT_GOVERNANCE_GATE.md`](../PRE_COMMIT_GOVERNANCE_GATE.md).

> Dry-run output is **architecture-review governance evidence** for sponsor packets — not regulatory or AI Act certification.

---

## Step 5 — Finalize architecture package and governance decision

**UI**

1. Disposition blocking findings or record approval per tenant workflow.
2. **Finalize** when the gate passes.
3. Optional: **Governance dashboard** for cross-review approvals ([`PRODUCT_PACKAGING.md`](../PRODUCT_PACKAGING.md) Operate Â· governance).

<details>
<summary>Administrator details — HTTP path</summary>

```http
POST /v1/architecture/review/{runId}/finalize
Authorization: Bearer {token}
```

On block: `409` with `#governance-pre-commit-blocked`.

</details>

---

## Step 6 — Sponsor export and ROI proof

1. Export **whitelabel / board sample** deliverables when demo seed provides them (Workspace B export stub).
2. Download DOCX / ZIP exports from review detail.
3. Cross-check sponsor ROI labels — no mock production KPIs in live tenant paths ([`PILOT_SUCCESS_SCORECARD.md`](../../go-to-market/PILOT_SUCCESS_SCORECARD.md)).

**API**

```http
GET /v1/docx/runs/{runId}/architecture-package
GET /v1/artifacts/runs/{runId}/export
Authorization: Bearer {token}
```

---

## Buyer-job packaging {#buyer-job-packaging}

Former standalone body: `docs/go-to-market/buyer-jobs/AI_GOVERNANCE_REVIEW.md` → this section (filename kept as a path-stable Specialty alias).

**Classification:** **Specialty** template (optional). Use when the buyer’s job is Responsible AI oversight — not as a mandatory pre-first-value checklist. **Core path:** [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

### Buyer question

**“Can we show Responsible AI governance on a real architecture package — model inventory, oversight themes, and disposition — without implying certification?”**

### Target buyer and trigger event

Risk, compliance, architecture, or AI platform sponsors use this accelerator when an internal AI launch needs oversight evidence, an sponsor asks how model-assisted systems are governed, or a customer diligence review asks for Responsible AI controls.

### Expected first finding types

- Missing model/data lineage, monitoring, or human-review evidence.
- Ambiguous policy ownership for AI-assisted decisions.
- Insufficient safety, prompt-redaction, or evidence-grounding posture for the proposed AI workflow.
- Governance findings that need disposition before a sponsor-ready package is finalized.

### Sponsor artifact example

A proof package that states: “This Responsible AI review maps architecture evidence to AI governance findings, disposition status, and a finalized architecture package.” Include the architecture package export, finding explanations, and governance gate status.

### ROI and procurement proof points

- Reduced manual governance-review preparation time, clearly labeled as baseline/default/measured.
- Evidence-backed finding explanations and faithfulness/grounding diagnostics where available.
- Procurement-safe distinction between an internal Responsible AI review and formal regulatory certification.

### What not to claim

- Do not claim AI Act, NIST, ISO, HIPAA, or SOC certification.
- Do not imply the model output proves factual truth; it is evidence-supported review assistance.
- Do not require ITSM/chat/MCP connectors for V1 pilot success.

### Required inputs

| Input | Notes |
|-------|--------|
| Architect access | **ReadAuthority** / **ExecuteAuthority** |
| AI workload description | ML inference, training boundaries, data-handling narrative in the architecture request |
| Policy pack | **`ai-gov-001`–`ai-gov-020`** in tenant catalog (default seed) |
| Evidence (pilot-dependent) | Extractor ZIP, uploaded diagrams, or registry exports as your pilot allows |

Demo path: Workspace B review `61c60d76-2b80-93f9-46bb-2f66fd608b9b` ([`DEMO_WORKSPACES.md`](../../go-to-market/DEMO_WORKSPACES.md)). Synthetic names only — no real PHI.

No ITSM, chat-ops, MCP, or V1.1 connectors required ([`INTEGRATION_CATALOG.md`](../../go-to-market/INTEGRATION_CATALOG.md)).

### Shipped product steps (V1 summary)

1. **Open or create** the AI governance architecture review (demo review or `/reviews/new`).
2. **Assign** AI Governance / Responsible AI policy pack to project scope; enable pre-finalize gate if exercising enforcement.
3. **Execute** pipeline — inspect `ai-gov-*` findings and governance disposition.
4. **Resolve or disposition** blocking items per tenant workflow.
5. **Finalize** architecture package when the pre-finalize gate passes (API `commit`).
6. **Export** sponsor deliverables from review detail (DOCX / ZIP / whitelabel samples when demo seed provides them).

Detailed UI/API steps: sections above. Spine: [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

### Expected artifacts

- Finalized architecture package with **ai-gov** finding coverage
- Governance gate status and disposition record on review detail
- Sponsor-readable exports with thematic (not certifying) framework mapping disclaimer
- Sponsor ROI / summary surfaces with live-data basis labels (no mock production KPIs on live tenant paths)

### Evidence generated

- Policy pack evaluation against architecture request and attached evidence
- Finding-level explainability and confidence labels (buyer-facing: Evidence-backed / Model-assisted / Unknown)
- Pre-finalize gate audit trail when blocking severities are configured
- Export bundle suitable for architecture review or risk committee readout

### Sponsor outcome

A **defensible Responsible AI narrative** anchored in a finalized architecture package — showing oversight themes, findings, and governance status — without claiming regulatory certification. Cross-check claims with [`EXECUTIVE_SPONSOR_BRIEF.md`](../../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) and [`POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md`](../POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md).

### How to measure success

Use [`PILOT_SUCCESS_SCORECARD.md`](../../go-to-market/PILOT_SUCCESS_SCORECARD.md): `ai-gov-*` findings dispositioned, pre-finalize gate status recorded when configured, sponsor export bundle attached, and ROI basis labels explicit (no mock production KPIs on live tenant paths).

### Demo proof shape (Demo-derived only) {#demo-proof-shape-demo-derived-only}

**Evidence basis:** **Demo-derived** Â· **Estimate** for ROI rows without buyer baselines. Not a verified customer outcome or production attestation.

| Finding (illustrative) | Category | Evidence label |
| --- | --- | --- |
| Model inventory incomplete in evidence ZIP | Compliance | Demo-derived |
| Human-in-the-loop approval not mapped | Governance | Demo-derived |
| Citation coverage below sponsor threshold | AI quality | Low support |

**Do not claim:** regulator sign-off, SOC 2 CPA, or projected dollar savings without buyer baselines. Deferred: public reference customer, Marketplace checkout, MCP (V1.1+).

---

## Related

- [`README.md`](README.md) — accelerator pack index
- [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md)
- [`POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md`](POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md) — regulated vertical variant
- [`CUSTOM_AGENT_HANDLER_GUIDE.md`](../CUSTOM_AGENT_HANDLER_GUIDE.md) — in-repo agent extension (advanced)
- [`EXECUTIVE_SPONSOR_BRIEF.md`](../../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md)
- [`#buyer-job-packaging`](#buyer-job-packaging) Â· [`../../go-to-market/buyer-jobs/AI_GOVERNANCE_REVIEW.md`](../../go-to-market/buyer-jobs/AI_GOVERNANCE_REVIEW.md) (alias) — Specialty buyer-job path
- [`../../samples/policy-packs/ai-governance-responsible-ai-rules-v1.json`](../../samples/policy-packs/ai-governance-responsible-ai-rules-v1.json) — curated rules corpus sample

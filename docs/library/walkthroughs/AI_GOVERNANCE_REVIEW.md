> **Scope:** AI governance accelerator — Responsible AI policy pack, findings, governance gate, and sponsor export; V1 surfaces only.

# AI governance review — accelerator walkthrough

**Audience:** Risk, compliance, and architecture leaders who need a **Responsible AI** review package (model inventory, oversight, classification themes) without implying certification or real PHI.

**Buyer outcome:** A committed review demonstrating **ai-gov-*** rule coverage, governance disposition, and sponsor-readable exports — using shipped V1 policy packs and demo or live runs.

**Grounding rule:** No **Jira**, **Teams**, or **ServiceNow** required ([`INTEGRATION_CATALOG.md`](../../go-to-market/INTEGRATION_CATALOG.md) V1.1). Synthetic demo storyline uses **fabricated** Meridian / Alpine names only ([`DEMO_WORKSPACES.md`](../../go-to-market/DEMO_WORKSPACES.md)).

**Buyer-job detail:** Target buyer, trigger event, expected first findings, sponsor artifact example, ROI/procurement proof points, and claim boundaries live in [`AI_GOVERNANCE_REVIEW.md`](../../go-to-market/buyer-jobs/AI_GOVERNANCE_REVIEW.md). Use that page for sponsor-facing framing; use this walkthrough for operator steps.

---

## Demo fast path (committed storyline)

| Artifact | Id / route |
|----------|------------|
| Regulated AI + security baseline review | `61c60d76-2b80-93f9-46bb-2f66fd608b9b` — `/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b` |
| Scope triplet | [`DEMO_WORKSPACES.md`](../../go-to-market/DEMO_WORKSPACES.md) Workspace B headers |
| Curated rules corpus | [`ai-governance-responsible-ai-rules-v1.json`](../../samples/policy-packs/ai-governance-responsible-ai-rules-v1.json) |
| Rule appendix | [`POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md`](../POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md) |

---

## Prerequisites

1. Operator shell with **ReadAuthority** / **ExecuteAuthority**.
2. Tenant compliance catalog includes **`ai-gov-001`** through **`ai-gov-020`** (default seed).
3. For net-new reviews: architecture request describing ML inference, training, and data-handling boundaries.

---

## Step 1 — Open or create the AI governance review

**UI (demo)**

1. Set operator scope to Workspace B triplet (scope switcher or headers per DEMO_WORKSPACES).
2. Open `/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b`.
3. Confirm storyline: **Alpine Patient Risk Scoring Platform** (synthetic; no real PHI).

**UI (net-new)**

1. **New review** with AI/ML workload description and governance tags in request narrative.
2. Attach evidence (extractor ZIP, uploaded diagrams, or registry exports as your pilot allows).

**API**

```http
GET /v1/architecture/run/61c60d76-2b80-93f9-46bb-2f66fd608b9b
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
GET /v1/architecture/run/{runId}/findings
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

---

## Step 5 — Commit manifest and governance decision

**UI**

1. Disposition blocking findings or record approval per tenant workflow.
2. **Commit manifest** when gate passes.
3. Optional: **Governance dashboard** for cross-review approvals ([`PRODUCT_PACKAGING.md`](../PRODUCT_PACKAGING.md) Operate · governance).

**API**

```http
POST /v1/architecture/run/{runId}/commit
Authorization: Bearer {token}
```

On block: `409` with `#governance-pre-commit-blocked`.

---

## Step 6 — Sponsor export and ROI proof

1. Export **whitelabel / board sample** deliverables when demo seed provides them (Workspace B export stub).
2. Download DOCX / ZIP exports from review detail.
3. Cross-check executive ROI labels — no mock production KPIs in live tenant paths ([`PILOT_SUCCESS_SCORECARD.md`](../../go-to-market/PILOT_SUCCESS_SCORECARD.md)).

**API**

```http
GET /v1/docx/runs/{runId}/architecture-package
GET /v1/artifacts/runs/{runId}/export
Authorization: Bearer {token}
```

---

## Related

- [`README.md`](README.md) — accelerator pack index
- [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md)
- [`POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md`](POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md) — regulated vertical variant
- [`CUSTOM_AGENT_HANDLER_GUIDE.md`](../CUSTOM_AGENT_HANDLER_GUIDE.md) — in-repo agent extension (advanced)
- [`EXECUTIVE_SPONSOR_BRIEF.md`](../../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md)

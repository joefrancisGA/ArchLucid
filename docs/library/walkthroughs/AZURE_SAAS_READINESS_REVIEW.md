> **Scope:** Azure SaaS readiness accelerator — WAF-aligned and SaaS security baseline policy packs on Azure extractor evidence; V1 surfaces only.

# Azure SaaS readiness review — accelerator walkthrough

**Audience:** Cloud architects and platform engineers evaluating ArchLucid on **Azure-hosted SaaS** posture (reliability, security, operations) before a production pilot.

**Buyer outcome:** A committed architecture review package that ties **Azure inventory evidence** to **Well-Architected–style** and **SaaS security baseline** findings, with an exportable sponsor narrative — without requiring ITSM or chat connectors.

**Grounding rule:** V1 only — REST, operator UI, CLI, **Azure extractor Tier 1 ZIP**, bundled policy pack templates. **Jira / ServiceNow / Teams / Slack** are **V1.1** ([`INTEGRATION_CATALOG.md`](../../go-to-market/INTEGRATION_CATALOG.md)).

**Buyer-job detail:** Target buyer, trigger event, expected first findings, sponsor artifact example, ROI/procurement proof points, and claim boundaries live in [`AZURE_SAAS_READINESS.md`](../../go-to-market/buyer-jobs/AZURE_SAAS_READINESS.md). Use that page for sponsor-facing framing; use this walkthrough for operator steps.

---

## Demo fast path (no extractor)

| Artifact | Id / route |
|----------|------------|
| Product Tour committed review | `b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` — `/reviews/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` |
| Scope triplet (Development seed) | See [`DEMO_WORKSPACES.md`](../../go-to-market/DEMO_WORKSPACES.md) Workspace A headers |

Use this path for evaluator demos; skip to **Step 5** (inspect package) when the run is already committed.

---

## Prerequisites

1. Operator shell with **ReadAuthority** and **ExecuteAuthority** for your tenant.
2. **Azure extractor Tier 1** script output ZIP **or** demo Product Tour review (above).
3. Policy pack keys `saas-ctrl-001`–`008` present in tenant compliance catalog (default tenant seed).

---

## Step 1 — Capture architecture request (Azure target)

**UI**

1. **Capture** → **New review** (`/runs/new`).
2. Set **cloud provider** to **Azure** and describe the SaaS workload (multi-tenant API, data plane, identity).
3. Submit; note **run id** from success path or **Reviews** list.

**API**

```http
POST /v1/architecture/request
Content-Type: application/json
Authorization: Bearer {token}

{
  "systemName": "Contoso SaaS API Platform",
  "description": "Multi-tenant SaaS on Azure — pilot readiness review",
  "cloudProvider": "Azure"
}
```

---

## Step 2 — Ingest Azure evidence

**UI**

1. Open review detail → **Upload** Azure extractor ZIP (or equivalent ingest control).
2. Confirm timeline shows ingest / evidence attachment events.

**API**

```http
POST /v1/azure-extractor/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

(runId + file fields per OpenAPI)
```

See [`AZURE_EXTRACTOR.md`](../AZURE_EXTRACTOR.md).

---

## Step 3 — Create and assign policy packs (WAF + SaaS baseline)

Use bundled template bodies from [`DefaultPolicyPackTemplates.cs`](../../../ArchLucid.Application/Governance/DefaultPolicyPacks/DefaultPolicyPackTemplates.cs) (`AzureWellArchitectedAnalogueJson`, `SecurityBaselineSaaSJson`) or samples under [`docs/samples/policy-packs/`](../../samples/policy-packs/README.md).

**UI**

1. **Governance** → **Policy packs** (enable governance nav if hidden).
2. **Create pack** from **Azure WAF aligned starter** / **Security baseline SaaS** metadata.
3. **Assign** to project scope; pin version; set pre-commit severity floor if exercising the gate.

**API (create + assign pattern)**

```http
POST /v1/policy-packs
Content-Type: application/json
Authorization: Bearer {token}

{
  "displayName": "Azure WAF aligned starter (pilot)",
  "initialContentJson": "{ ... AzureWellArchitectedAnalogueJson ... }"
}
```

```http
POST /v1/policy-packs/{policyPackId}/assign
Authorization: Bearer {token}
```

Curated WAF pillar rules (12 rules): [`azure-waf-rules-v1.json`](../../samples/policy-packs/azure-waf-rules-v1.json).

---

## Step 4 — Execute, dry-run, and commit

**UI**

1. **Execute** review pipeline; wait for **Ready for commit**.
2. Run **Pre-commit governance** dry-run against assigned packs ([`PRE_COMMIT_GOVERNANCE_GATE.md`](../PRE_COMMIT_GOVERNANCE_GATE.md)).
3. Resolve or disposition blocking findings → **Commit manifest**.

**API**

```http
POST /v1/architecture/run/{runId}/execute
POST /v1/governance/policy-packs/dry-run
POST /v1/architecture/run/{runId}/commit
Authorization: Bearer {token}
```

> Pre-commit governance dry-run output is **architecture-review evidence** for sponsor packets — not regulatory certification.

---

## Step 5 — Inspect findings and ROI proof

1. Review **findings** tied to `saas-ctrl-*` and cost/topology evidence from extractor ingest.
2. Open **Executive summary** / per-run ROI when surfaced — basis labels must cite **Retail**, **EA-adjusted**, or **Uploaded actual** ([`ROI_MODEL.md`](../../go-to-market/ROI_MODEL.md)).
3. Optional **Operate (analysis):** `/compare` two commits if a prior baseline run exists.

---

## Step 6 — Governance decision and sponsor export

**UI**

1. If approvals are enabled: **Governance** → disposition blocking items or record approval per tenant workflow.
2. Download **architecture package** / sponsor export from review detail **Exports**.
3. Align narrative with [`EXECUTIVE_SPONSOR_BRIEF.md`](../../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md).

**API**

```http
GET /v1/docx/runs/{runId}/architecture-package
GET /v1/artifacts/runs/{runId}/export
Authorization: Bearer {token}
```

---

## Related

- [`README.md`](README.md) — accelerator pack index
- [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md) — full first-pilot spine
- [`REFERENCE_SAAS_STACK_ORDER.md`](../REFERENCE_SAAS_STACK_ORDER.md) — hosted SaaS Terraform ordering (operators)
- [`CORE_PILOT.md`](../../CORE_PILOT.md) — four-step Core Pilot
- [`PRODUCT_PACKAGING.md`](../PRODUCT_PACKAGING.md) — capability inventory

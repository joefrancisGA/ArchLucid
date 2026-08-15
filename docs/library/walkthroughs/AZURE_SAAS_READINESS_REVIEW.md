> **Reviewed:** 2026-07-27

> **Scope:** Azure SaaS readiness accelerator — WAF-aligned and SaaS security baseline policy packs on Azure extractor evidence; V1 surfaces only — plus buyer-job packaging / demo proof shape (formerly the body of `docs/go-to-market/buyer-jobs/AZURE_SAAS_READINESS.md`; that filename remains a path-stable Specialty alias).

# Azure SaaS readiness review — accelerator walkthrough

**Audience:** Cloud architects and platform engineers evaluating ArchLucid on **Azure-hosted SaaS** posture (reliability, security, operations) before a production pilot.

**Last reviewed:** 2026-07-27

**Buyer outcome:** A finalized architecture package that ties **Azure inventory evidence** to **Well-Architected–style** and **SaaS security baseline** findings, with an exportable sponsor narrative — without requiring ITSM or chat connectors.

**Grounding rule:** V1 only — REST, architect workspace, CLI, **Azure extractor Tier 1 ZIP**, bundled policy pack templates. **Jira / ServiceNow / Teams / Slack** are **V1.1** ([`INTEGRATION_CATALOG.md`](../../go-to-market/INTEGRATION_CATALOG.md)).

**Buyer-job packaging:** [`#buyer-job-packaging`](#buyer-job-packaging) (`buyer-jobs/AZURE_SAAS_READINESS.md` alias).

---

## Demo fast path (no extractor)

| Artifact | Id / route |
|----------|------------|
| Product Tour finalized review | `b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` — `/architecture/reviews/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` |
| Scope triplet (Development seed) | See [`DEMO_WORKSPACES.md`](../../go-to-market/DEMO_WORKSPACES.md) Workspace A headers |

Use this path for evaluator demos; skip to **Step 5** (inspect package) when the review is already finalized.

---

## Prerequisites

1. Architect workspace access with authority to execute and finalize reviews for your tenant.
2. **Azure extractor Tier 1** script output ZIP **or** demo Product Tour review (above).
3. Policy pack keys `saas-ctrl-001`–`008` present in tenant compliance catalog (default tenant seed).

---

## Step 1 — Capture architecture request (Azure target)

**UI**

1. **Capture** → **New review** (`/architecture/reviews/new`; retired bookmark).
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

## Step 4 — Execute, dry-run, and finalize

**UI**

1. **Execute** review pipeline; wait for **Ready to finalize** (API status may still say `ReadyForCommit`).
2. Run **Pre-finalize governance** dry-run against assigned packs ([`PRE_COMMIT_GOVERNANCE_GATE.md`](../PRE_COMMIT_GOVERNANCE_GATE.md)).
3. Resolve or disposition blocking findings → **Finalize** the architecture package.

<details>
<summary>Administrator details — HTTP paths</summary>

```http
POST /v1/architecture/review/{runId}/execute
POST /v1/governance/policy-packs/dry-run
POST /v1/architecture/review/{runId}/finalize
Authorization: Bearer {token}
```

</details>

> Governance dry-run output is **architecture-review evidence** for sponsor packets — not regulatory certification.

---

## Step 5 — Inspect findings and ROI proof

1. Review **findings** tied to `saas-ctrl-*` and cost/topology evidence from extractor ingest.
2. Open **Sponsor summary** / per-run ROI when surfaced — basis labels must cite **Retail**, **EA-adjusted**, or **Uploaded actual** ([`ROI_MODEL.md`](../../go-to-market/ROI_MODEL.md)).
3. Optional **Operate (analysis):** `/compare` two commits if a prior baseline run exists.

---

## Step 6 — Governance decision and sponsor export

**UI**

1. If approvals are enabled: **Governance** → disposition blocking items or record approval per tenant workflow.
2. Download **architecture package** / sponsor export from review detail **Exports**.
3. Align narrative with [`EXECUTIVE_SPONSOR_BRIEF.md`](../../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md).

**API**

```http
GET /v1/docx/architecture/reviews/{runId}/architecture-package
GET /v1/artifacts/architecture/reviews/{runId}/export
Authorization: Bearer {token}
```

---

## Buyer-job packaging {#buyer-job-packaging}

Former standalone body: `docs/go-to-market/buyer-jobs/AZURE_SAAS_READINESS.md` → this section (filename kept as a path-stable Specialty alias).

**Classification:** **Specialty** template (optional). Use when the buyer’s job is Azure SaaS production readiness — not as a mandatory pre-first-value checklist. **Core path:** [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

### Buyer question

**“Does our Azure SaaS posture hold up on Well-Architected and security-baseline themes before we commit to production?”**

### Target buyer and trigger event

Platform engineering, cloud architecture, or a founder/CTO sponsor uses this accelerator when a SaaS workload is nearing production, a board/customer diligence review asks for Azure posture evidence, or a platform team wants a single reviewable package before a release gate.

### Expected first finding types

- Public exposure or missing private endpoint patterns on data/control-plane dependencies.
- Cost or topology mismatches between the architecture brief and uploaded Azure evidence.
- Missing audit, backup, or identity posture evidence for production-readiness claims.
- Policy-pack findings around tenant isolation, operational readiness, and SaaS baseline controls.

### Sponsor artifact example

A proof package that opens with: “This Azure SaaS review links customer-run Azure inventory, policy-pack checks, findings, and a finalized architecture package into one sealed review record.” Attach the architecture package export plus the Azure extractor ingest summary; do not attach raw secrets or customer identifiers.

### ROI and procurement proof points

- Time saved versus manual Azure architecture review, labeled as customer-entered baseline, model default, or measured review runtime.
- Evidence provenance from Azure extractor ZIP to finding to architecture package.
- Procurement-safe caveat: evidence is self-attested/customer-provided unless a buyer supplies separate third-party assurance.

### What not to claim

- Do not claim Well-Architected certification, SOC 2 readiness, production SLA compliance, or Azure invoice accuracy.
- Do not imply AWS/GCP analysis in V1.
- Do not require V1.1 connectors for the pilot path.

### Required inputs

| Input | Notes |
|-------|--------|
| Architect access | **ReadAuthority** and **ExecuteAuthority** for the tenant |
| Architecture brief | System name, SaaS workload description, Azure as cloud provider |
| Azure evidence | **Azure extractor Tier 1 ZIP** (customer-run, read-only) **or** Product Tour demo review |
| Policy packs | Bundled **`saas-ctrl-001`–`008`** in tenant compliance catalog (default seed) |

No Jira, ServiceNow, Teams, Slack, Confluence, MCP, or outbound webhooks are required ([`INTEGRATION_CATALOG.md`](../../go-to-market/INTEGRATION_CATALOG.md)).

### Shipped product steps (V1 summary)

1. **Capture** — New architecture review with Azure target (`/architecture/reviews/new` or `POST /v1/architecture/request`).
2. **Ingest evidence** — Upload extractor ZIP on review detail (`POST /v1/azure-extractor/upload`).
3. **Assign policy packs** — WAF analogue + SaaS security baseline packs to project scope.
4. **Execute** — Run the review pipeline; inspect findings tied to `saas-ctrl-*` and cost/topology evidence.
5. **Finalize** — Lock the architecture package when findings and gate status are acceptable (`POST /v1/architecture/review/{runId}/finalize`).
6. **Export** — Download architecture package / sponsor exports from review detail.

Detailed UI/API steps: sections above. Spine: [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

### Expected artifacts

- Finalized **architecture package** with sealed review record
- **Findings** linked to Azure inventory evidence and policy pack rules
- **Architecture package** exports (DOCX / ZIP) from review detail
- Optional **sponsor summary** / per-run ROI with explicit basis labels (Retail, EA-adjusted, Uploaded actual)

### Evidence generated

- Azure subscription/resource inventory from extractor ingest (read-only, customer-controlled)
- Policy evaluation traces for WAF and SaaS baseline themes
- Provenance from ingest → finding → architecture package (inspectable on review detail)
- Audit-friendly finalize record and export bundle

### Sponsor outcome

A **board- or architecture-review-ready package** that ties Azure posture evidence to actionable findings and a finalized architecture package — without claiming third-party certification. Align narrative with [`EXECUTIVE_SPONSOR_BRIEF.md`](../../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md).

### How to measure success

Use [`PILOT_SUCCESS_SCORECARD.md`](../../go-to-market/PILOT_SUCCESS_SCORECARD.md): finalized architecture package present, top findings traceable to Azure extractor or labeled demo evidence, sponsor disposition **SEND** or documented HOLD, and ROI basis labels that do not present demo-derived hours as buyer outcomes.

### Demo proof shape (Demo-derived only) {#demo-proof-shape-demo-derived-only}

**Evidence basis:** **Demo-derived** Â· **Manual review required** for AI narrative. Not a verified customer deployment.

| Finding (illustrative) | Category | Evidence label |
| --- | --- | --- |
| Managed identity for app → Key Vault | Topology | Demo-derived |
| Front Door TLS termination | Topology | Demo-derived |
| App Service zone redundancy gap | Cost | Estimate |

**Do not claim:** verified customer ROI, production SLA history, or procurement-safe proof without a committed buyer `runId`. Deferred: CPA SOC 2, third-party pen-test publication, native ITSM connectors (V1.1).

---

## Related

- [`README.md`](README.md) — accelerator pack index
- [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md) — full first-pilot spine
- [`REFERENCE_SAAS_STACK_ORDER.md`](../REFERENCE_SAAS_STACK_ORDER.md) — hosted SaaS Terraform ordering (operators)
- [`CORE_PILOT.md`](../../CORE_PILOT.md) — four-step Core Pilot
- [`PRODUCT_PACKAGING.md`](../PRODUCT_PACKAGING.md) — capability inventory
- [`AZURE_EXTRACTOR.md`](../AZURE_EXTRACTOR.md) — extractor script and upload contract
- [`#buyer-job-packaging`](#buyer-job-packaging) Â· [`../../go-to-market/buyer-jobs/AZURE_SAAS_READINESS.md`](../../go-to-market/buyer-jobs/AZURE_SAAS_READINESS.md) (alias) — Specialty buyer-job path

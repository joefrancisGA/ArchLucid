> **Scope:** Copy-paste adoption recipes that map existing product surfaces (API, CLI, operator UI) to four buyer/operator personas. No new product commitments; defer anything not in V1 scope to the linked depth docs.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# Workflow recipes by persona

Canonical route and HTTP map: [OPERATOR_ATLAS.md](../OPERATOR_ATLAS.md). **[`NAVIGATOR.md`](../../archive/NAVIGATOR.md)** lists one “best next doc” per task.

---

## 1) Solution architect: from request to committed review package

**Goal:** Produce a durable **review package** (pipeline outcome, findings, committed golden manifest, exports) suitable for sponsor and engineering handoff.

**Prerequisites:** Tenant access with **Read** + **Execute** authority; at least one architecture request worth of context. See [CORE_PILOT.md](../../CORE_PILOT.md) and [SECOND_RUN.md](../SECOND_RUN.md) for a follow-on run.

**Steps**

1. **Request** — UI: `/runs/new` · API: `POST /v1/architecture/request` · CLI: `dotnet run --project ArchLucid.Cli -- run` (see [CLI_USAGE.md](../CLI_USAGE.md)).
2. **Track pipeline** — UI: `/runs/{runId}` · API: `GET /v1/architecture/run/{runId}` · CLI: `… status <runId>`.
3. **Commit** — UI: run detail commit control · API: `POST /v1/architecture/run/{runId}/commit` · CLI: `… commit <runId>` (manifest must exist before downstream exports).
4. **Package for stakeholders** — UI: run detail exports · API: `GET /v1/pilots/runs/{runId}/first-value-report` (Markdown) · CLI: `… first-value-report <runId> [--save]`, `… sponsor-one-pager <runId> [--save]` where applicable.

**Expected outputs:** Committed run with golden manifest; Markdown/PDF-style sponsor artefacts when generated; shareable links into `/runs/{runId}` (or review routes under `/reviews/...` if your shell aliases them).

**Failure hints:** `404` on first-value report → run not committed or wrong scope; commit blocked → see recipe 2 (governance gate) and [PRE_COMMIT_GOVERNANCE_GATE.md](../PRE_COMMIT_GOVERNANCE_GATE.md). If your automation mixes **`POST …/execute`**, **`…/result`**, and **`…/commit`** with the Authority pipeline, read [ARCHITECTURE_FLOWS.md](../ARCHITECTURE_FLOWS.md) Flow A1 first.

**Reference:** [CORE_PILOT.md](../../CORE_PILOT.md), [ARCHITECTURE_FLOWS.md](../ARCHITECTURE_FLOWS.md), [API_CONTRACTS.md](../API_CONTRACTS.md).

---

## 2) Governance lead: critical finding to approval / policy gate

**Goal:** Move from **material findings** on a run to an auditable **approval** or **pre-commit gate** posture (policy packs, dry runs, promotions where you use environments).

**Prerequisites:** Roles that can read governance workflow; **Execute** for mutations. Policy assignments live under `/policy-packs` ([OPERATOR_ATLAS.md](../OPERATOR_ATLAS.md)).

**Steps**

1. **Triage in UI** — Open `/runs/{runId}` or `/reviews/{runId}`; drill **findings** (`/reviews/{runId}/findings/{findingId}`) and confirm severity labels match your pack intent.
2. **Assign / confirm policy** — UI: `/policy-packs` · API: `/v1/policy-packs…` · Behaviour matrix: [PRE_COMMIT_GOVERNANCE_GATE.md](../PRE_COMMIT_GOVERNANCE_GATE.md) (`BlockCommitOnCritical`, `BlockCommitMinimumSeverity`).
3. **Pre-commit dry run** — API: `POST /v1/governance/approval-requests?dryRun=true` (validation path per [GOVERNANCE.md](../contributor-reference/GOVERNANCE.md)).
4. **Workflow** — UI: `/governance`, `/governance/dashboard` · API: `POST /v1/governance/approval-requests`, promote/activate routes on `GovernanceController` as needed ([GOVERNANCE.md](../contributor-reference/GOVERNANCE.md)).
5. **Optional gate feature flag** — Host: `ArchLucid:Governance:PreCommitGateEnabled` ([PRE_COMMIT_GOVERNANCE_GATE.md](../PRE_COMMIT_GOVERNANCE_GATE.md)).

**Expected outputs:** Recorded approval request or documented rejection; commit either allowed or blocked with a clear policy reason in API/UI.

**Failure hints:** `403` → authority tier; commit still succeeds when gate flag off → expected until gate enabled; mismatch between finding severity and pack thresholds → adjust assignment or severity taxonomy in workflow docs ([GOVERNANCE_WORKFLOW_UI.md](../GOVERNANCE_WORKFLOW_UI.md)).

**Reference:** [GOVERNANCE.md](../contributor-reference/GOVERNANCE.md), [COMMERCIAL_BOUNDARY_HARDENING_SEQUENCE.md](../COMMERCIAL_BOUNDARY_HARDENING_SEQUENCE.md).

---

## 3) Procurement / security reviewer: trust artefacts and run-level proof

**Goal:** Collect **procurement-grade trust narrative**, the **bundled evidence ZIP**, and **run-scoped** artefacts (committed run) without implying third-party attestations you do not have.

**Prerequisites:** For anonymous trust ZIP, none. For run exports, **ReadAuthority** API key or signed-in operator with read access.

**Steps**

1. **Read trust posture** — Hosted narrative: [trust-center.md](../../go-to-market/trust-center.md) · UI: `/trust` (download control mirrors API; workspace variant `/workspace/security-trust` per [OPERATOR_ATLAS.md](../OPERATOR_ATLAS.md)).
2. **Download evidence pack** — API (anonymous): `GET /v1/marketing/trust-center/evidence-pack.zip` · Index / fast lane: [go-to-market/PROCUREMENT_PACK_INDEX.md](../../go-to-market/PROCUREMENT_PACK_INDEX.md), [go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md](../../go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md).
3. **Run-level proof (after commit)** — API: `GET /v1/pilots/runs/{runId}/first-value-report`, `GET /v1/pilots/runs/{runId}/pilot-run-deltas` · UI: exports on run detail.
4. **Operational bundle (internal)** — UI: `/admin/support` · API: `POST /v1/admin/support-bundle` · CLI: `archlucid support-bundle` — use only with explicit disclosure rules ([OPERATOR_ATLAS.md](../OPERATOR_ATLAS.md)).

**Expected outputs:** ZIP + Markdown/JSON run exports suitable for RFP appendices; internal support ZIP only when policy allows.

**Failure hints:** Empty or missing run exports → run not committed or wrong `runId`; `429` on public endpoints → backoff; do not mistake **self-assessment / SoW templates** in the ZIP for finished CPA reports ([trust-center.md](../../go-to-market/trust-center.md)).

**Reference:** [SECURITY.md](../contributor-reference/SECURITY.md), [API_CONTRACTS.md](../API_CONTRACTS.md).

---

## 4) Platform engineer: manifest delta in CI and deployment evidence

**Goal:** Wire **golden manifest comparison** into PR/CD signals and capture **deployment smoke** evidence (OpenAPI, `/version`, health).

**Prerequisites:** Two **committed** run IDs in tenant scope for `GET /v1/compare` (automation uses `X-Api-Key`). **Standard** commercial tier is required for `/v1/compare` and end-to-end compare routes (`ArchLucid.Api/Controllers/Planning/ComparisonController.cs`, `ArchLucid.Api/Controllers/Authority/RunComparisonController.cs`).

**Steps**

1. **Pick integration flavour** — GitHub: [integrations/GITHUB_ACTION_MANIFEST_DELTA.md](../../integrations/GITHUB_ACTION_MANIFEST_DELTA.md) (job summary) · Azure DevOps: [integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md](../../integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md) · PR comment variants in the same `docs/integrations/` folder.
2. **Call the compare API** — `GET /v1/compare?baseRunId=…&targetRunId=…` returns structured deltas (see integration readmes); `404` means missing manifest or scope — [API_CONTRACTS.md](../API_CONTRACTS.md), [COMPARISON_REPLAY.md](../COMPARISON_REPLAY.md).
3. **Optional UI replay** — `/compare` for human-readable compare ([OPERATOR_ATLAS.md](../OPERATOR_ATLAS.md)); end-to-end export family under `GET /v1/architecture/run/compare/end-to-end/...` (Standard tier).
4. **Contract drift guard** — Canonical OpenAPI at `GET /openapi/v1.json` — [OPENAPI_CONTRACT_DRIFT.md](../OPENAPI_CONTRACT_DRIFT.md).
5. **Post-deploy evidence** — CLI: `dotnet run --project ArchLucid.Cli -- deployment-evidence --environment <staging|production|dev> --api-base-url <url> [--out <file.md>]`; align with [DEPLOYMENT_CD_PIPELINE.md](../DEPLOYMENT_CD_PIPELINE.md), [DEPLOYMENT.md](../DEPLOYMENT.md).

**Expected outputs:** CI summary or PR annotation with delta counts; archived Markdown probe report for the target environment.

**Failure hints:** `403` on compare → tier; `404` on compare → uncommitted baseline/target; OpenAPI probe fails → break-glass documented in CLI triage only when policy demands (`ArchLucid.Cli/Commands/DeploymentEvidenceTriageCatalog.cs`).

**Reference:** [go-to-market/INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md), [DEPLOYMENT_TERRAFORM.md](../DEPLOYMENT_TERRAFORM.md).

> **Scope:** Integration and engineering documentation — persona API/CLI recipes that map product surfaces to automation workflows. **Not** rendered as in-app product help (`/help`); use [Start a review](/help/evidence-intake) and [Architecture packages](/help/review-packages) for architect guidance.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# Workflow recipes by persona

Canonical route and HTTP map: [OPERATOR_ATLAS.md](../OPERATOR_ATLAS.md). **[`START_HERE.md`](../../START_HERE.md)** lists one “best next doc” per task.


## 1) Solution architect: from request to finalized architecture package

**Goal:** Produce a durable **architecture package** (pipeline outcome, findings, signed review record, exports) suitable for sponsor and engineering handoff.

**Prerequisites:** Tenant access with **Read** + **Execute** authority; at least one architecture request worth of context. See [CORE_PILOT.md](../../CORE_PILOT.md) and [SECOND_RUN.md](../SECOND_RUN.md) for a follow-on review.

**Steps**

1. **Request** — UI: `/architecture/reviews/new` (retired bookmark) Â· API: `POST /v1/architecture/request` Â· CLI: `dotnet run --project ArchLucid.Cli -- run` (see [CLI_USAGE.md](../CLI_USAGE.md)).
2. **Track pipeline** — UI: `/architecture/reviews/{runId}` Â· API: `GET /v1/architecture/review/{runId}` Â· CLI: `… status <runId>`.
3. **Finalize** — UI: review detail **Finalize** Â· API: `POST /v1/architecture/review/{runId}/finalize` Â· CLI: `… commit <runId>` (signed review record must exist before downstream exports).
4. **Package for stakeholders** — UI: review detail exports (first-value report, sponsor artefacts) Â· API: **review export** — first-value report (`text/markdown`, ReadAuthority) Â· CLI: `… first-value-report <runId> [--save]`, `… sponsor-one-pager <runId> [--save]` where applicable.

**Expected outputs:** Finalized architecture package with signed review record; Markdown/PDF-style sponsor artefacts when generated; shareable links into `/architecture/reviews/{runId}`.

**Failure hints:** `404` on first-value report → review not finalized or wrong scope; finalize blocked → see recipe 2 (governance gate) and [PRE_COMMIT_GOVERNANCE_GATE.md](../PRE_COMMIT_GOVERNANCE_GATE.md). If your automation mixes **`POST …/execute`**, **`…/result`**, and **`…/commit`** with the Authority pipeline, read [ARCHITECTURE_FLOWS.md](../ARCHITECTURE_FLOWS.md) Flow A1 first.

**Reference:** [CORE_PILOT.md](../../CORE_PILOT.md), [ARCHITECTURE_FLOWS.md](../ARCHITECTURE_FLOWS.md), [API_CONTRACTS.md](../API_CONTRACTS.md).


## 2) Governance lead: critical finding to approval / policy gate {#governance-gate}

**Goal:** Move from **material findings** on a review to an auditable **approval** or **pre-finalize gate** posture (policy packs, dry runs, promotions where you use environments).

**Prerequisites:** Roles that can read governance workflow; **Execute** for mutations. Policy assignments live under `/policy-packs` ([OPERATOR_ATLAS.md](../OPERATOR_ATLAS.md)).

**Steps**

1. **Triage in UI** — Open `/architecture/reviews/{runId}`; drill **findings** (`/architecture/reviews/{runId}/findings/{findingId}`) and confirm severity labels match your pack intent.
2. **Assign / confirm policy** — UI: `/policy-packs` Â· API: `/v1/policy-packs…` Â· Behavior matrix: [PRE_COMMIT_GOVERNANCE_GATE.md](../PRE_COMMIT_GOVERNANCE_GATE.md) (`BlockCommitOnCritical`, `BlockCommitMinimumSeverity`).
3. **Pre-finalize dry run** — API: `POST /v1/governance/approval-requests?dryRun=true` (validation path per [GOVERNANCE.md](../contributor-reference/GOVERNANCE.md)).
4. **Workflow** — UI: `/governance?runId={runId}`, `/governance/dashboard` Â· API: `POST /v1/governance/approval-requests`, promote/activate routes on `GovernanceController` as needed ([GOVERNANCE.md](../contributor-reference/GOVERNANCE.md)).
5. **Audit trail** — UI: `/audit?runId={runId}` (scoped review events; avoid unscoped `/audit` without a review id) Â· API: `GET /v1/audit/search?runId=…`.
6. **Optional gate feature flag** — Host: `ArchLucid:Governance:PreCommitGateEnabled` ([PRE_COMMIT_GOVERNANCE_GATE.md](../PRE_COMMIT_GOVERNANCE_GATE.md)).

**Expected outputs:** Recorded approval request or documented rejection; finalize either allowed or blocked with a clear policy reason in API/UI.

**Failure hints:** `403` → authority tier; finalize still succeeds when gate flag off → expected until gate enabled; mismatch between finding severity and pack thresholds → adjust assignment or severity taxonomy in workflow docs ([GOVERNANCE_WORKFLOW_UI.md](../GOVERNANCE_WORKFLOW_UI.md)).

**Reference:** [GOVERNANCE.md](../contributor-reference/GOVERNANCE.md), [COMMERCIAL_BOUNDARY_HARDENING_SEQUENCE.md](../COMMERCIAL_BOUNDARY_HARDENING_SEQUENCE.md).


## 3) Procurement / security reviewer: trust artefacts and review-level proof

**Goal:** Collect **procurement-grade trust narrative**, the **bundled evidence ZIP**, and **review-scoped** artefacts (finalized architecture package) without implying third-party attestations you do not have.

**Prerequisites:** For anonymous trust ZIP, none. For review exports, **ReadAuthority** API key or signed-in architect/admin with read access.

**Steps**

1. **Read trust posture** — Hosted narrative: [trust-center.md](../../go-to-market/trust-center.md) Â· UI: `/trust` (download control mirrors API; workspace variant `/workspace/security-trust` per [OPERATOR_ATLAS.md](../OPERATOR_ATLAS.md)).
2. **Download evidence pack** — API (anonymous): `GET /v1/marketing/trust-center/evidence-pack.zip` Â· Index / build: [go-to-market/PROCUREMENT_PACK_INDEX.md](../../go-to-market/PROCUREMENT_PACK_INDEX.md#how-to-request-and-build-the-pack).
3. **Review-level proof (after finalize)** — UI: exports on review detail (first-value report, before/after proof metrics) Â· API: **review exports** — first-value report (`text/markdown`) and review proof metrics (`PilotRunDeltasResponse` JSON), ReadAuthority.
4. **Operational bundle (internal)** — UI: `/admin/support` Â· API: `POST /v1/admin/support-bundle` Â· CLI: `archlucid support-bundle` — use only with explicit disclosure rules ([OPERATOR_ATLAS.md](../OPERATOR_ATLAS.md)).

**Expected outputs:** ZIP + Markdown/JSON review exports suitable for RFP appendices; internal support ZIP only when policy allows.

**Failure hints:** Empty or missing review exports → package not finalized or wrong review id; `429` on public endpoints → backoff; do not mistake **self-assessment / SoW templates** in the ZIP for finished CPA reports ([trust-center.md](../../go-to-market/trust-center.md)).

**Reference:** [SECURITY.md](../contributor-reference/SECURITY.md), [API_CONTRACTS.md](../API_CONTRACTS.md).


## 4) Platform engineer: manifest delta in CI and deployment evidence

**Goal:** Wire **architecture package comparison** into PR/CD signals and capture **deployment smoke** evidence (OpenAPI, `/version`, health).

**Prerequisites:** Two **finalized** review IDs in tenant scope for `GET /v1/compare` (automation uses `X-Api-Key`). **Standard** commercial tier is required for `/v1/compare` and end-to-end compare routes (`ArchLucid.Api/Controllers/Planning/ComparisonController.cs`, `ArchLucid.Api/Controllers/Authority/RunComparisonController.cs`).

**Steps**

1. **Pick integration flavour** — GitHub: [integrations/GITHUB_ACTION_MANIFEST_DELTA.md](../../integrations/GITHUB_ACTION_MANIFEST_DELTA.md) (job summary) Â· Azure DevOps: [integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md](../../integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md) Â· PR comment variants in the same `docs/integrations/` folder.
2. **Call the compare API** — `GET /v1/compare?baseRunId=…&targetRunId=…` returns structured deltas (see integration readmes); `404` means missing manifest or scope — [API_CONTRACTS.md](../API_CONTRACTS.md), [COMPARISON_REPLAY.md](../COMPARISON_REPLAY.md).
3. **Optional UI replay** — `/compare` for human-readable compare ([OPERATOR_ATLAS.md](../OPERATOR_ATLAS.md)); end-to-end export family under `GET /v1/architecture/review/compare/end-to-end/...` (Standard tier).
4. **Contract drift guard** — Canonical OpenAPI at `GET /openapi/v1.json` — [OPENAPI_CONTRACT_DRIFT.md](../OPENAPI_CONTRACT_DRIFT.md).
5. **Post-deploy evidence** — CLI: `dotnet run --project ArchLucid.Cli -- deployment-evidence --environment <staging|production|dev> --api-base-url <url> [--out <file.md>]`; align with [DEPLOYMENT_CD_PIPELINE.md](../DEPLOYMENT_CD_PIPELINE.md), [DEPLOYMENT.md](../../engineering/DEPLOYMENT.md).

**Expected outputs:** CI summary or PR annotation with delta counts; archived Markdown probe report for the target environment.

**Failure hints:** `403` on compare → tier; `404` on compare → unfinalized baseline/target; OpenAPI probe fails → break-glass documented in CLI triage only when policy demands (`ArchLucid.Cli/Commands/DeploymentEvidenceTriageCatalog.cs`).

**Reference:** [go-to-market/INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md), [DEPLOYMENT_TERRAFORM.md](../DEPLOYMENT_TERRAFORM.md).


<details>
<summary>API alias (backward compatibility) — legacy <code>/v1/pilots/</code> routes</summary>

The numbered steps above use **review** vocabulary. HTTP clients that still call pilot-scoped routes can use these backward-compatible aliases (same auth and payloads; see [API_CONTRACTS.md](../API_CONTRACTS.md) Pilots section):

| Review export | Backward-compatible alias |
| --- | --- |
| First-value report (Markdown) | `GET /v1/pilots/architecture/reviews/{runId}/first-value-report` |
| Review proof metrics (JSON) | `GET /v1/pilots/architecture/reviews/{runId}/pilot-run-deltas` |
| Sponsor PDF attachment | `POST /v1/pilots/architecture/reviews/{runId}/first-value-report.pdf` |
| Recent review proof rows | `GET /v1/pilots/architecture/reviews/recent-deltas?count=…` |

</details>

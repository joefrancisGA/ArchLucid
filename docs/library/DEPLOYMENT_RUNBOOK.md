> **Scope:** Contributor-reference — Deployment runbook — failed deploys and rollback (practical) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Deployment runbook — failed deploys and rollback (practical)

**Audience:** operators on call. **Scope:** Azure Container Apps + GitHub CD (see [DEPLOYMENT_CD_PIPELINE.md](DEPLOYMENT_CD_PIPELINE.md)). For schema and data rollback posture, use [runbooks/MIGRATION_ROLLBACK.md](../runbooks/MIGRATION_ROLLBACK.md).

**Repo-local preflight (before first prod apply):** run `scripts/Emit-ProductionProfilePreflightMarkdown.ps1` from the repository root to emit `artifacts/deployment/production-profile-preflight.md` — Terraform roots + **merged** `ArchLucid.Api` production appsettings (auth/JWT, API key off, SQL + Key Vault sample, redaction, observability, billing rules), Worker `appsettings` notes, and SMB/445 heuristics **without** Azure login or printing secret values (see [AZURE_PRODUCTION_PROFILE.md](AZURE_PRODUCTION_PROFILE.md) and [RELEASE_EVIDENCE_SUMMARY.md](RELEASE_EVIDENCE_SUMMARY.md)).

**Release readiness bundle (observability + preflight index):** `pwsh ./scripts/Emit-ReleaseReadinessEvidence.ps1` writes `artifacts/release-readiness/` including environment label, commit/version, health/version probe status when `-ApiBaseUrl` is supplied, per-host Application Insights / OTLP / Prometheus verdicts from `scripts/report_observability_export_readiness.py`, config lint output, Terraform drift preflight, DB-migration attachment note, k6 attachment note, and redaction guidance. Use the strict telemetry check when `ProductionValidation:RequireTelemetryExport=true` must fail closed without a configured exporter. Missing optional evidence is labeled `SKIPPED`; the bundle does not claim production SLA compliance unless live probe, migration, and smoke artifacts are attached. See [OBSERVABILITY.md](OBSERVABILITY.md).

---

## 1. Deployment “succeeded” but health / post-deploy validation fails

**Symptoms:** GitHub **Post-deploy validation** job failed, or users see 5xx while the pipeline turned green on earlier jobs.

**Do this first**

1. Open the failed workflow run → **Post-deploy validation** (or **smoke-test**) log. It runs **`archlucid deployment-evidence`** (or the legacy `scripts/ci/cd-post-deploy-verify.sh`): note HTTP codes, download the **deployment evidence** Markdown artifact when present, and inspect **`/health/ready`** in the report (overall **`status`** and body preview).
2. From a machine that can reach the API (same URL as **`SMOKE_TEST_BASE_URL`**):
   - `GET {base}/health/live` — process up?
   - `GET {base}/health/ready` — which check is **Unhealthy** / **Degraded**? (SQL, blob, schema, etc.)
   - `GET {base}/version` — which **commit** / **informationalVersion** is actually running?

**If automated rollback is on:** set repository variable **`CD_ROLLBACK_ON_SMOKE_FAILURE`** to **`true`** *before* the next deploy so a failed validation restores traffic to the captured **last-known-good** API/worker/UI revisions (digest/BUILD_ID identity), verifies runtime BUILD_ID, and uploads a rollback report (see §4 and [DEPLOYMENT_CD_PIPELINE.md](DEPLOYMENT_CD_PIPELINE.md) § Application rollback).

**If you must fix forward:** resolve the failing dependency (connection string, Key Vault, network, RLS, storage). Redeploy the same or a fixed image tag after config is correct.

**Deeper checks:** [RELEASE_SMOKE.md](RELEASE_SMOKE.md) (local **`release-smoke`**) for a fuller path than CD’s HTTP gate.

**Cold-start evidence (TB-759):** When smoke “succeeds after retries” or users see brief 502/503 during deploy, capture a baseline per [`COLD_START_MEASUREMENT.md`](../runbooks/COLD_START_MEASUREMENT.md) before raising `min_replicas` or CPU — see [`cold-start-baselines/`](../operations/cold-start-baselines/README.md).

---

## 2. Image publish succeeded but Container Apps deploy failed

**Symptoms:** **Build and push images** green; **deploy-container-apps** or **`az containerapp update`** failed (RBAC, quota, bad image digest, wrong RG/name).

**Do this**

1. Read the failing step output (Azure CLI error text).
2. Confirm secrets: **`AZURE_RESOURCE_GROUP`**, **`CONTAINER_APP_API_NAME`**, optional **`CONTAINER_APP_WORKER_NAME`** / **`CONTAINER_APP_UI_NAME`**, **`ACR_LOGIN_SERVER`** — must match the real app names in Azure.
3. Verify the identity used in GitHub (**federated credential**) can update those apps and pull from ACR (**AcrPull** / registry attachment as you configured in Terraform).
4. In Azure Portal → Container App → **Revisions** / **System logs**, or run:
   ```bash
   az containerapp show -g <rg> -n <app> -o table
   az containerapp revision list -g <rg> -n <app> -o table
   ```
5. Re-run the failed job or run **CD** again with **workflow_dispatch** after fixing IAM or naming. The image tag (often **git SHA**) is already in ACR; you do not need to rebuild unless the image itself was wrong.

**Avoid unnecessary reruns (TB-756):** If the failure was in **post-deploy validation** but the **deploy** step already rolled a new revision, do not immediately re-run full CD "to be safe" when the fix is config-only or transient cold start — use retries (`CD_POST_DEPLOY_MAX_ATTEMPTS`) or fix the dependency first. Do not run CD for docs-only or test-only commits with no API/UI image change. CD uses digest-pinned images plus `--revision-suffix`; even an unchanged digest still creates a new revision on deploy.

**Terraform note:** If you use **`terraform apply`** with image variables, a later apply can reset images to tfvars. Align tfvars with the tag you intend, or rely on CLI-only rollouts until the next planned apply ([DEPLOYMENT_CD_PIPELINE.md](DEPLOYMENT_CD_PIPELINE.md)).

---

## 3. How to identify the currently deployed version

| Method | What you learn |
|--------|----------------|
| **`GET https://{api-host}/version`** | Anonymous JSON: **informationalVersion**, **commit** (or equivalent build fields), **environment**. Best single check for “what code is live.” |
| **GitHub Actions run** | **IMAGE_TAG** output / variable (defaults to **`github.sha`** for that deploy). |
| **ACR** | Repository tags on **`archlucid-api`** / **`archlucid-ui`** (e.g. digest or `:abc1234` SHA tag). |
| **Azure CLI** | Image on the active revision: `az containerapp show -g <rg> -n <api-app> --query "properties.template.containers[0].image" -o tsv` |

Repeat for the **worker** app if present (same **`archlucid-api:<tag>`** image, different command).

---

## 4. Manual rollback (BUILD_ID / digest-pinned)

**Goal:** Restore a known-good **immutable BUILD_ID** (git SHA) for API (+ worker + UI when configured), not merely “deactivate latest.”

**Prerequisites:** Azure CLI / GitHub OIDC; ACR still holds `archlucid-api:<BUILD_ID>` (and `archlucid-ui:<BUILD_ID>` when UI is deployed); **`AZURE_RESOURCE_GROUP`** and Container App names.

**Option A — GitHub (preferred)**  
Run workflow **CD** → **workflow_dispatch** → **action = rollback** → set required input **`rollback_build_id`** to the immutable git SHA / BUILD_ID → pick **staging** or **production**. The **manual-rollback** job:

1. Resolves ACR digests for that BUILD_ID (fails if missing).
2. Runs the schema gate (blocks when destructive migrations landed after the target — see [MIGRATION_ROLLBACK.md](../runbooks/MIGRATION_ROLLBACK.md)).
3. Digest-pins Container Apps updates and verifies API `/version` (+ UI public-shell BUILD_ID when UI is configured).
4. Uploads a `cd-manual-rollback-*` report artifact.

**Option B — Azure CLI (emergency)**  
Prefer Option A. If you must use CLI, pin by **digest** for a known BUILD_ID (never mutable `latest*`), set `ARCHLUCID_BUILD_COMMIT_SHA`, then re-check **`GET /version`**, **`GET /health/ready`**, and UI public-shell meta when applicable.

```bash
# Resolve digest for BUILD_ID, then update (example shape — use your ACR name)
az acr manifest show-metadata --registry "$ACR" --name "archlucid-api:${BUILD_ID}" --query digest -o tsv
az containerapp update -g "$RG" -n "$API_APP" --image "${ACR_LOGIN}/archlucid-api@sha256:…" \
  --set-env-vars "ARCHLUCID_BUILD_COMMIT_SHA=${BUILD_ID}"
```

**Caveats**

- **Schema:** App rollback does **not** undo DbUp. Destructive migrations after LKG **block** automated/manual app rollback until operators follow [MIGRATION_ROLLBACK.md](../runbooks/MIGRATION_ROLLBACK.md).
- **Auto-rollback** (smoke failure + `CD_ROLLBACK_ON_SMOKE_FAILURE=true`) restores the pre-deploy LKG revisions; the workflow still fails because smoke failed.
- **Canary:** Smoke failure during canary bake uses the same auto-rollback decision path (restore LKG / schema gate / report).

---

## 5. Hosted environment rollback (staging + production)

**When to use:** Post-deploy validation failed, canary bake surfaced errors, or operators need the fastest path to restore a known-good Container Apps revision without a full CD re-run. Full promotion checklists live in [`docs/runbooks/PRODUCTION_DEPLOYMENT.md`](../runbooks/PRODUCTION_DEPLOYMENT.md); this section is the **on-call rollback** companion.

### Application (Container Apps) — fastest

1. Record **current** and **previous** revision names (`az containerapp revision list -g <rg> -n <app> -o table`).
2. **Drain traffic** to the prior revision:
   - `az containerapp ingress traffic set` (pattern in [`.github/workflows/cd-staging-on-merge.yml`](../../.github/workflows/cd-staging-on-merge.yml) and [`.github/workflows/cd.yml`](../../.github/workflows/cd.yml)), **or**
   - `az containerapp revision activate` on the last-known-good revision and `az containerapp revision deactivate` on the bad revision.
3. **Verify** `GET /health/ready` Healthy on the public hostname; re-run `bash scripts/ci/cd-post-deploy-verify.sh <base>`.

Repeat for **worker** and **UI** Container Apps when those revisions were part of the failed deploy.

### Terraform / state

- **Do not** “revert state” without a matching infrastructure plan — state files live **per root** (`*.tfstate` keys). Undo by applying a known-good **plan** or `terraform apply` with rolled-back **tfvars**, in **reverse dependency order** only for destroys ([`FIRST_AZURE_DEPLOYMENT.md`](FIRST_AZURE_DEPLOYMENT.md) destroy guidance).
- **DNS / Front Door:** If edge routing is misconfigured, revert custom-domain binding in `infra/terraform-edge` and re-apply before re-pointing traffic.

### SQL / data plane

- **Production** data plane (SQL, storage): prefer **PITR** or geo-failover per [MIGRATION_ROLLBACK.md](../runbooks/MIGRATION_ROLLBACK.md) and [DATABASE_FAILOVER.md](../runbooks/DATABASE_FAILOVER.md) — schema rollback is **not** automated by DbUp.
- **Staging:** Forward-fix preferred; use the same PITR posture only when a migration cannot be fixed forward.

**RBAC:** *Azure Container Apps Contributor* for revision operations; Terraform deployer same as apply; SQL restore **owner-only**.

---

## Production-profile configuration fail-fast validation

API and worker hosts evaluate **production-profile dangerous misconfiguration** before migrations. Logged startup errors include a stable **`[rule_name]`** prefix (for example **`jwt_bearer_missing_authority_and_pem`**) so operators can match CLI + metrics.

Validation runs when **ASP.NET Core** is **Production**, when **`ARCHLUCID_ENVIRONMENT=Production`**, or when **`ProductionValidation:Strict=true`** together with **Staging** (ASP.NET Core or ArchLucid environment name). Optional **`ProductionValidation:RequireTelemetryExport=true`** requires at least one telemetry sink: OTLP endpoint, Application Insights connection string, or Prometheus enabled. Operators can dry-run matching checks with **`archlucid config lint`** (use **`--simulate-production`** and optional **`--strict-staging`** with **`--hosting-advisor`** for advisory parity).

**Observability readiness artifact (repo-only, no secrets printed):**

```powershell
python scripts/report_observability_export_readiness.py --environment Production --out artifacts/observability-export-readiness.md
```

Add **`--strict-exit-code`** for release gates. See [`OBSERVABILITY.md`](OBSERVABILITY.md) for warn vs fail behavior on hosts vs the report script.

**Scale decisions:** when single-replica assumptions stop holding, see [`SCALE_THRESHOLD_RUNBOOK.md`](SCALE_THRESHOLD_RUNBOOK.md).

---

For **Azure Container Apps**, set a head-based sampling ratio so OTLP trace volume stays manageable in production (see [OBSERVABILITY.md](OBSERVABILITY.md) §Sampling strategy).

**Recommended:** add environment variable **`Observability__Tracing__SamplingRatio`** = **`0.1`** on the **API** and **worker** container apps (double underscores match nested JSON `Observability:Tracing:SamplingRatio`). Omit the variable or use **`1.0`** in non-production. Default in code and **`appsettings.json`** remains **`1.0`** so existing environments are unchanged until operators opt in.

**UI (archlucid-ui):** optional build-time / runtime public env **`NEXT_PUBLIC_TRACE_VIEWER_URL_TEMPLATE`** — URL with **`{traceId}`** placeholder so the run detail and provenance pages can render **View trace** (see [customer-facing/customer-facing/OPERATOR_QUICKSTART.md](customer-facing/OPERATOR_QUICKSTART.md)). The UI proxy forwards **`X-Trace-Id`** (and **`traceparent`**) from the API response for browser-side fetches.

---

## Related links

| Topic | Document |
|--------|----------|
| CD jobs, secrets, post-deploy script | [DEPLOYMENT_CD_PIPELINE.md](DEPLOYMENT_CD_PIPELINE.md) |
| Umbrella deploy / rollback story | [../engineering/../engineering/DEPLOYMENT.md](../engineering/DEPLOYMENT.md) |
| Observability export readiness report | [OBSERVABILITY.md](OBSERVABILITY.md) |
| Hosted SaaS scale thresholds | [SCALE_THRESHOLD_RUNBOOK.md](SCALE_THRESHOLD_RUNBOOK.md) |
| Local / release smoke depth | [RELEASE_SMOKE.md](RELEASE_SMOKE.md) |
| SQL / migration rollback | [runbooks/MIGRATION_ROLLBACK.md](../runbooks/MIGRATION_ROLLBACK.md) |
| Hosted deploy validation (staging + production) | [runbooks/PRODUCTION_DEPLOYMENT.md](../runbooks/PRODUCTION_DEPLOYMENT.md) |

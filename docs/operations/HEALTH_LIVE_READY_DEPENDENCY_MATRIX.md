# Health live vs ready — dependency matrix

**Purpose:** One place that answers which checks run on `/health/live` vs `/health/ready`, what fails traffic safety, and how Azure Container Apps probes relate to CD.

**Registration source:** `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.DataHealthAndJobs.cs` (`ReadinessTags.Live` / `ReadinessTags.Ready`).

## Platform probe policy (API)

**API Container Apps readiness uses `/health/live`** (same path as liveness). Deep dependency checks on `/health/ready` are too slow for ACA’s probe budget and historically recycled healthy revisions when SQL/blob/Key Vault probes exceeded timeouts.

**CD smoke requires `GET /health/ready`** (HTTP 200 and JSON `status == "Healthy"`) before a release is considered traffic-safe. Azure may send replica traffic once the **platform** readiness probe passes; the **release** gate is CD + operator monitors on `/health/ready`.

| Layer | API path | Meaning |
|-------|----------|---------|
| ACA liveness | `/health/live` | Restart the replica if the process / control-plane SQL liveness fails |
| ACA readiness | `/health/live` | Replica may receive platform traffic; **not** full app readiness |
| CD / release gate | `/health/ready` | Essential dependencies Healthy — **required before declaring deploy success** |
| Worker ACA readiness | `/health/ready` | Worker may take longer; deep ready is appropriate for background role |
| UI ACA probes | `/api/health` | Next.js process up + build fingerprint (does not call the API) |

## Traffic is safe when

1. **API** `GET /health/ready` → **200** and `.status == "Healthy"` (CD smoke / deployment-evidence).
2. **API** `GET /version` `commitSha` matches the release `BUILD_ID` when lineage checks run.
3. **UI** `GET /api/health` → **200** and `.status == "Healthy"` (platform probes; optional CD UI base URL check).
4. Revision image digest / lineage checks pass when Azure deploy is configured.

ACA marking an API replica “ready” on `/health/live` alone is **not** sufficient to call the release green.

## `/health/live` checks (`ReadinessTags.Live`)

| Check name | Blocks live? | Why it is on live | Notes |
|------------|--------------|-------------------|-------|
| `liveness` | Yes (Unhealthy) | Process is running | Always registered |
| `database_liveness` | Yes (Unhealthy) | Control-plane SQL `SELECT 1` with short timeout | Skipped when storage is InMemory; fails live (and thus ACA probes) if system SQL is down |

Live intentionally avoids schema packs, blob, OpenAI, Key Vault, and other deep dependency work so a transient dependency outage does not force unnecessary replica restarts.

## `/health/ready` checks (`ReadinessTags.Ready`)

Overall ready HTTP mapping: **Degraded** and **Unhealthy** both return **503** (`ArchLucidReadinessHealthCheckOptions`). CD treats any non-`Healthy` status as fail.

| Check name | Typical failure status | Blocks ready (503)? | Required vs optional | Why it blocks traffic safety |
|------------|------------------------|---------------------|----------------------|------------------------------|
| `agent_execution_mode` | Always Healthy | No | Informational | Surfaces Simulator vs Real; does not fail ready |
| `database` | Unhealthy / Degraded | Yes | Required when SQL storage | Primary catalog connectivity + latency brownout |
| `sql_system_plane` | Unhealthy | Yes when applicable | Required in system+tenant topology; else skip Healthy | Control-plane catalog must answer |
| `sql-read-replica` | Unhealthy | Yes when configured | Optional config; required when template set | Read path must not silently hit primary incorrectly |
| `redis` | Degraded | Yes (503) | Optional cache | Cache outage degrades; still fails strict ready |
| `graph-projection-cache` | Unhealthy / Degraded | Yes when enabled | Optional feature | Graph cache enabled but Redis broken |
| `schema_files` | Unhealthy | Yes | Required | Agent/manifest JSON schemas must exist on disk |
| `compliance_rule_pack` | Unhealthy | Yes | Required | Rule pack files must load |
| `temp_directory` | Unhealthy | Yes | Required | Process temp must be writable |
| `blob_storage` | Unhealthy | Yes when Azure Blob offload enabled | Optional until enabled | Artifact large-payload path |
| `run_golden_manifest_consistency` | Degraded | Yes (503) | Soft signal | Consistency probe issues |
| `orchestrator` | Degraded | Yes (503) | Soft signal | Stall / orchestrator health |
| `demo_viewer_data` | Degraded | Yes (503) | Soft when demo viewer on | Demo seed missing |
| `openai` | Unhealthy | Yes when Real mode | Required in Real; skip Healthy in Simulator | Endpoint reachability (TCP), no model calls |
| `vector_store` | Degraded / Unhealthy | Yes | Soft / config-gated | Retrieval store |
| `retrieval_index_freshness` | Degraded | Yes (503) | Soft | Empty index signal |
| `keyvault` | Unhealthy | Yes when URI configured | Optional until configured | Secrets plane reachability |
| `data_archival` | Degraded | Yes (503) | Worker/Combined only | Archival host signal |
| `data_consistency` | Unhealthy | Yes | Worker/Combined only | Consistency reconciliation state |

**Detailed-only (not on live/ready tags):** `circuit_breakers`, `distributed_cache` — appear on authenticated `GET /health`.

## UI `/api/health`

| Field | Meaning |
|-------|---------|
| `status` | Always `"Healthy"` while the Next.js route handler can run |
| `commitSha` | `NEXT_PUBLIC_BUILD_COMMIT_SHA` (or `unknown`) — build identity, not a customer claim |
| `buildTimestamp` | `NEXT_PUBLIC_BUILD_TIMESTAMP` |
| `environment` | `NEXT_PUBLIC_DEPLOY_ENV` or `NODE_ENV` |

Does **not** proxy to the API. API readiness for operator flows remains `GET /api/proxy/health/ready`.

## Drift guard

`scripts/ci/container_app_probe_paths.py` asserts Terraform probe paths and that this matrix remains present.

## Related

- Post-deploy smoke steps: [`docs/library/DEPLOYMENT_CD_PIPELINE.md`](../library/DEPLOYMENT_CD_PIPELINE.md)
- Operator triage: [`docs/runbooks/COMMON_ERRORS.md`](../runbooks/COMMON_ERRORS.md) §10
- Observability notes: [`docs/library/OBSERVABILITY.md`](../library/OBSERVABILITY.md)

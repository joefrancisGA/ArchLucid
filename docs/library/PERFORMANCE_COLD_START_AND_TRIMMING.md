> **Scope:** Contributor-reference — Cold start, profiling, and trimming (API) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Cold start, profiling, and trimming (API)

**Objective:** Reduce first-request latency and deployment size where safe.

**Assumptions:** Default shipping remains **non-trimmed** until each feature area is audited for reflection/DI edge cases.

## Profiling

- Capture **Startup** and **first request** with `dotnet-trace` (`.NET Runtime` + `ASP.NET Core` providers) or your APM vendor.
- Watch **JIT**, **R2R** (if enabled), **SQL migration** (`DatabaseMigrator.Run`), and **first OpenAI/embedding** calls — these dominate cold paths more than minor assembly savings.

## CD cold-start measurement (operators)

After deploy, split **revision → `/health/ready`** from **first authenticated business call** (`/api/auth/me` when **TB-758** is configured). Record baselines before proposing paid levers (`min_replicas`, R2R, CPU bump).

- **Runbook:** [`docs/runbooks/COLD_START_MEASUREMENT.md`](../runbooks/COLD_START_MEASUREMENT.md) (**TB-759**)
- **Baseline register:** [`docs/operations/cold-start-baselines/`](../operations/cold-start-baselines/README.md)

## Trimming (optional)

- `PublishTrimmed` and `TrimMode` can shrink containers but break **reflection-based** registration (some serializers, certain DI conveniences). Enable only after testing a **published** build end-to-end (health, migrations, OpenAPI, one replay path).
- Prefer **tiered publishing**: trimmed image for **stateless read-only** roles only if split in the future; keep the main API untrimmed until validated.

## Container layers

- Multi-stage Dockerfiles (`ArchLucid.Api/Dockerfile`) already separate restore/publish/runtime — layer cache hits matter more than trimming for most teams.

## Paid-lever decision pack (**TB-2124**)

Free CD levers (**TB-754**–**TB-759**) shipped. Paid levers stay **evidence-gated** — do not change Terraform SKUs, publish flags, or `min_replicas` without an owner row in the matrix below and a baseline in [`cold-start-baselines/`](../operations/cold-start-baselines/README.md).

### Consolidated measurements (2026-08-09)

| Phase | Staging gate | Dev baseline ([`dev-2026-07-16-806b3a0`](../operations/cold-start-baselines/dev-2026-07-16-806b3a0.md)) | Gap |
|-------|--------------|-------------------------------------------------------------------------------------------------------------|-----|
| **A — revision → `/health/ready`** | **≤ 90 s** platform (≤ 120 s investigate) | **~66 s** platform | Within gate; **staging row still missing** |
| **B — `/api/auth/me` after ready** | **median < 1.0 s** | *Not captured* | Capture on next dev/staging CD before Phase-B paid levers |
| **C — CD deployment-evidence** | Pass attempt **1–2** | Pass attempt **1** | Free levers sufficient on snapshot |

**Interpretation:** Routine **dev** CD does not justify paid levers today. Revisit after a **staging** baseline or when Phase **A** > 120 s / Phase **B** median ≥ 2.0 s per [`COLD_START_MEASUREMENT.md`](../runbooks/COLD_START_MEASUREMENT.md).

### Cost × latency matrix (paid levers)

Estimates are **order-of-magnitude** for a single API Container App in **centralus/eastus2** consumption; multiply by replica count and environments. Monthly bands assume 24/7 floor replicas where applicable.

| Lever | Primary symptom | Latency impact (estimate) | Monthly Azure delta (estimate) | Risk | Rollback |
|-------|-----------------|---------------------------|----------------------------------|------|----------|
| **`api_min_replicas` 0 → 1** (dev idle) | Scale-from-zero after idle | **−30 s to −90 s** first request after idle | **+$25–45** per 0.5 vCPU / 1.0Gi replica | **Unblocked (TB-2167):** singleton hosted loops are leader-elected when `HostLeaderElection:Enabled` and SQL storage; re-evaluate with a fresh baseline before raising replicas | `api_min_replicas = 0` in tfvars; `terraform apply` |
| **`api_min_replicas` +1** (already ≥1) | Revision swap 502/503 | **−5 s to −20 s** user-visible warm path during deploy | **+$25–45** per added warm replica | Cost at idle; not a substitute for **TB-755** canary | Revert tfvars |
| **API CPU 0.5 → 1.0 vCPU** | Phase **A**/**B** CPU-bound | **−10% to −25%** wall time | **~2×** vCPU $ for API replicas while running | Low; watch autoscale max bill | `api_cpu = 0.5`; apply |
| **API memory 1.0Gi → 2.0Gi** | GC / LOH pressure on cold path | **−0% to −15%** unless profiling shows memory pressure | **~1.5–2×** memory $ on API replicas | Low | Revert `api_memory`; apply |
| **ReadyToRun (R2R) publish** | Phase **B** JIT-heavy | **−15% to −40%** first business request | **~$0** compute; **+5–15 s** Phase **A** image pull possible | Larger images; publish pipeline change | Remove R2R from publish/Dockerfile |
| **`PublishTrimmed`** | Image pull size | **−0 s to −15 s** Phase **A** if pull-bound | **~$0** compute | **High** — reflection/DI breaks without audit | Disable trim in `.csproj` / Dockerfile |
| **Redis L2 (`enable_redis_cache`)** | Sustained hot-path cache miss (not cold start) | **−20% to −60%** p95 on cached reads after warm-up | **+$55–75** Standard C1 (region-dependent); see **TB-2120** | Ops + invalidation; requires `ExpectedApiReplicaCount` | Disable cache connection / `enable_redis_cache = false` |
| **Pre-migrate Job (V1.1+)** | Phase **A** DbUp-dominated | **−20 s to −50 s** when migrations dominate ready | **+$5–15** Job compute per deploy | Orchestration + ordering | Revert to in-process `DatabaseMigrator` |

**Rule:** Prefer **one** paid lever per hypothesis; re-capture a baseline before stacking changes.

### Owner go / no-go (2026-08-09)

| Lever | Decision | Rationale |
|-------|----------|-----------|
| `api_min_replicas` 0 → 1 (dev) | **No-go** | Dev Phase **A** ~66 s within gate; cost without measured idle pain |
| API CPU / memory bump | **No-go** | No profiling evidence of CPU/memory-bound cold path |
| ReadyToRun | **No-go** | Phase **B** not baselined; R2R defers until `dotnet-trace` shows JIT dominance |
| `PublishTrimmed` | **No-go** | High break risk; trimming doc still requires published E2E audit |
| Redis L2 | **No-go** | Tracked under **TB-2120** (ops enablement + hit-rate evidence); not a cold-start fix |
| Pre-migrate Job | **Defer V1.1** | Migrations not dominant on dev snapshot (~66 s total platform) |

**Next evidence triggers:** (1) append **staging** baseline row; (2) capture Phase **B** median on that deploy; (3) re-open only levers matching the symptom table in [`COLD_START_MEASUREMENT.md`](../runbooks/COLD_START_MEASUREMENT.md#decision-table-paid-levers).

### TB-2146 staging capture + paid-lever reopen gate (shipped 2026-08-14)

In-repo enablement (owner still runs capture on the next staging CD):

| Artifact | Purpose |
|----------|---------|
| [`staging-2026-08-14-tb2146-pending.md`](../operations/cold-start-baselines/staging-2026-08-14-tb2146-pending.md) | Pending staging row scaffold |
| `scripts/ops/capture-cold-start-baseline.ps1` | Phase **B** median (`/api/auth/me`, 3 samples) + baseline markdown writer |
| `scripts/ops/enable-cold-start-staging-baseline-checklist.ps1` | Owner checklist (Phase **A** from CD logs, matrix update, no silent `min_replicas`) |

**Automatic reopen hints** (owner sign-off still required before Terraform/publish changes):

| Signal | Threshold | Revisit levers |
|--------|-----------|----------------|
| Phase **A** platform time | **> 120 s** | `min_replicas`, pre-migrate Job (V1.1+), SQL/connectivity (**TB-754**/**TB-756**) |
| Phase **B** `/api/auth/me` median | **≥ 2.0 s** | ReadyToRun, API CPU/memory, `min_replicas` per matrix above |
| Phase **B** within staging target | **< 1.0 s** | Paid levers remain **no-go** on Phase **B** evidence |

## Free runtime knobs (**TB-2161**)

Shipped **2026-08-10** via shared [`ArchLucid.Host.Runtime.props`](../../ArchLucid.Host.Runtime.props) imported by **Api**, **Worker**, and **Jobs.Cli**:

| Knob | Setting | Intent | Azure cost |
|------|---------|--------|------------|
| **Server GC** | `ServerGarbageCollection=true` + `GCConserveMemory=1` | Parallel collections under concurrent JSON/SQL load on multi-core ACA replicas; conserve memory on **1.0 Gi** floor | **$0** |
| **Tiered PGO** | `TieredPGO=true` | Steady-state throughput after warm-up | **$0** |
| **Invariant globalization** | **Declined** — `InvariantGlobalization=false`; Dockerfile keeps `icu-libs` and `DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false` | `Microsoft.Data.SqlClient` throws `NotSupportedException: Globalization Invariant Mode is not supported` on first SQL open (local + ACA). Server GC + Tiered PGO remain. | **$0** |

**Measurement:** Re-capture Phase **A**/**B** on the next dev/staging CD and append a row to [`cold-start-baselines/`](../operations/cold-start-baselines/README.md). Decline Server GC if working set breaches the **1.0 Gi** limit after deploy.

## API JSON source generation (**TB-2162**)

Shipped **2026-08-10** — per-slice `JsonSerializerContext` types under `ArchLucid.Api/Serialization/` chained in `ArchLucidApiJsonSerializerOptions` before `DefaultJsonTypeInfoResolver` (reflection fallback for uncovered DTOs):

| Slice | Hot paths | Types |
|-------|-----------|-------|
| **Auth** | `GET /api/auth/me` (Phase B) | `CallerIdentityResponse`, `CallerClaimResponse` |
| **Runs** | Run list keyset reads | `RunListItemResponse`, `RunSummary`, `CursorPagedResponse<RunListItemResponse>` |
| **Findings** | Findings keyset metadata | `FindingRecordMetadataPage`, `FindingRecordMetadataRow` |
| **Audit** | Admin audit list/search | `AuditEvent`, `CursorPagedResponse<AuditEvent>` |
| **ProblemDetails** | RFC 7807 errors | `ValidationProblemDetails`, `HttpValidationProblemDetails` |

Wire-format parity is guarded by `ArchLucidApiJsonSourceGenerationTests` (reflection baseline vs configured API options). **Run detail** (`RunDetailsResponse`) remains on reflection until a follow-on slice registers its nested graph.

**Measurement:** Pair with **TB-2146** Phase B capture on next CD; append row to [`cold-start-baselines/`](../operations/cold-start-baselines/README.md).

## Host leader election (**TB-2167**)

Shipped **2026-08-10** — SQL-backed lease election for singleton hosted background loops when **`HostLeaderElection:Enabled`** is true (default in `appsettings.Advanced.json`) and storage is **SQL**:

| Component | Role |
|-----------|------|
| **`HostLeaderElectionCoordinator`** | Acquire / renew / release per-lease; cancels leader work on lease loss |
| **`dbo.HostLeaderLeases`** | Lease rows (`LeaseName`, `HolderInstanceId`, `LeaseExpiresUtc`) |
| **`GET /v1/admin/diagnostics/leases`** | Operator visibility into current holders and lease expiry |
| **Gated loops** | Outbox drains, watchdog, reconciliation, archival, advisory scan, extractors, and related singleton workers under `ArchLucid.Host.Core/Hosted/*` |

**Effect:** Removes **(N−1)×** duplicate background SQL polling at **N** API/worker replicas (~**67%** at N=3). Unblocks re-evaluation of **`api_min_replicas`** levers under owner-gated **TB-2146** — do not raise replicas in this row without a fresh baseline.

**Tests:** `HostLeaderElectionCoordinatorTests` (contention + renewal loss), `SqlHostLeaderLeaseRepositorySqlIntegrationTests` (SQL acquire / release / expiry).

## Outbound HTTP sockets pooling (**TB-2163**)

Shipped **2026-08-10** — tuned `SocketsHttpHandler` pools on every product `AddHttpClient` registration via `ConfigureArchLucidOutboundSocketsHandler` and the existing `AddOutboundExternalHttpResilience` / `AddLongLivedPolicyHandler` chains:

| Profile | Typical clients | `PooledConnectionLifetime` | `MaxConnectionsPerServer` |
|---------|-----------------|----------------------------|---------------------------|
| **InternalLoopback** | Config health probe, trial funnel probe, SAML metadata fetch | 2 min | 4 |
| **ExternalIntegration** | ITSM, webhooks, OAuth, Turnstile, DNS, GitHub | 5 min | 20 |
| **CloudControlPlane** | ARM, retail prices, multi-cloud pricing | 5 min | 50 |
| **LlmCompletion** | Azure OpenAI batch transport | 10 min | 20 |

Handler factory lifetime is `Timeout.InfiniteTimeSpan` so `PooledConnectionLifetime` owns TCP/TLS recycling (avoids fighting the default 2-minute `IHttpClientFactory` handler rotation). Polly resilience wiring is unchanged.

**Measurement:** ARM + Azure OpenAI wall-clock before/after on next staging pass (**TB-2146** Phase B).

## See also

- Sustained throughput and p50/p95/p99 baselines: `docs/LOAD_TEST_BASELINE.md` (k6 against Compose `full-stack`, plus scaling thresholds).
- **Free-cost CD cold-start ops cluster (no Azure SKU bump):** **TB-754**–**TB-759** in [`TECH_BACKLOG.md`](TECH_BACKLOG.md) — post-deploy retries, canary+bake, avoid no-op revisions, UI warm-up tolerance, synthetic smoke path, [measurement runbook](../runbooks/COLD_START_MEASUREMENT.md).
- **Paid-lever owner matrix:** this section (**TB-2124**); peer **TB-2120** (Redis enablement).

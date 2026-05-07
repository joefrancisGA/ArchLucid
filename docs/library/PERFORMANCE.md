> **Scope:** Performance — caching and hot paths (ArchLucid) - full detail, tables, and links in the sections below.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.


# Performance — caching and hot paths (ArchLucid)

**Audience:** Operators and developers tuning latency, cache behavior, and LLM cost for the API and worker.

**Scope:** High-level behavior of **read-through caches** and related configuration. For the full DI map, see **[DI_REGISTRATION_MAP.md](DI_REGISTRATION_MAP.md)**; for metric names, see **[OBSERVABILITY.md](OBSERVABILITY.md)**.

---

## V1 pilot-scale envelope (evidence-backed)

This section bounds what **ArchLucid V1** performance evidence actually supports: **pilot-style** SaaS usage under **documented** k6 profiles and CI jobs. It is **not** a maximum production throughput specification. Deep tables live in **[LOAD_TEST_BASELINE.md](LOAD_TEST_BASELINE.md)** and **[PERFORMANCE_TESTING.md](PERFORMANCE_TESTING.md)**; script inventory in **[`tests/load/README.md`](../../tests/load/README.md)**.

### Merge-blocking CI smoke (regression only — not an SLA)

These jobs prove **latency and failure-rate budgets on synthetic traffic** so obvious regressions do not merge. They are **not** a contractual requests-per-second or availability SLA for your tenant. Product-facing SLO narrative (separate from CI ceilings) is **[API_SLOS.md](API_SLOS.md)**.

| Job (`.github/workflows/ci.yml`) | k6 script | Post-step assert |
| --- | --- | --- |
| **`Performance: k6 CI smoke (read + write baseline)`** (`k6-ci-smoke`) | [`tests/load/ci-smoke.js`](../../tests/load/ci-smoke.js) | [`scripts/ci/assert_k6_ci_smoke_summary.py`](../../scripts/ci/assert_k6_ci_smoke_summary.py) `--per-tag-ci-smoke` |
| **`Performance: k6 API smoke (operator path)`** (`k6-smoke-api`) | [`tests/load/k6-api-smoke.js`](../../tests/load/k6-api-smoke.js) | [`scripts/ci/assert_k6_ci_smoke_summary.py`](../../scripts/ci/assert_k6_ci_smoke_summary.py) **`--per-tag-k6-api-smoke`** |

**CI environment:** API is started via **`scripts/ci/start_api_for_k6.sh`** against a **fresh SQL catalog** (job-specific database name), **DevelopmentBypass**, **Simulator** agent mode, and **raised** `RateLimiting:FixedWindow:PermitLimit` so k6 is not dominated by **`429`** (see **[PERFORMANCE_TESTING.md](PERFORMANCE_TESTING.md)**). Artifacts: **`k6-ci-smoke-summary`**, **`k6-smoke-results`**.

**Explicit non-claim:** Passing these jobs does **not** certify **steady-state RPS**, **peak concurrent pilots**, **multi-region** deployment, **active/active** failover, or **worst-case** real-LLM tail latency.

### Scheduled burst and soak (telemetry signal, not merge gates)

| Workflow | Script | Role |
| --- | --- | --- |
| [`.github/workflows/k6-per-tenant-burst-scheduled.yml`](../../.github/workflows/k6-per-tenant-burst-scheduled.yml) | [`tests/load/per-tenant-burst.js`](../../tests/load/per-tenant-burst.js) | **Weekly** multi-tenant-scoped **burst** (Simulator path); assert **`--max-failed-rate 0.05`**, **`--max-p95-ms 3000`** (global summary, not per-tag). |
| [`.github/workflows/k6-soak-scheduled.yml`](../../.github/workflows/k6-soak-scheduled.yml) | [`tests/load/soak.js`](../../tests/load/soak.js) | **Low-rate read** mix against **`ARCHLUCID_SOAK_BASE_URL`** when set — **`continue-on-error`**; drift detection only. |

Do **not** treat soak failures as release blockers by default (guidance in **[LOAD_TEST_BASELINE.md](LOAD_TEST_BASELINE.md)**).

### Local and operator reproduction (same scripts as CI)

1. Install **k6** and start **`ArchLucid.Api`** in a configuration matching the workload (typically **DevelopmentBypass**, **SQL** catalog, **Simulator** for parity with CI). Raise **`RateLimiting__FixedWindow__PermitLimit`** for high VU counts (see **Rate limiting** in **[PERFORMANCE_TESTING.md](PERFORMANCE_TESTING.md)**).
2. **Operator path smoke (mirrors merge gate `k6-smoke-api`):**

   ```bash
   k6 run tests/load/k6-api-smoke.js --summary-export tests/load/results/k6-summary.json
   python scripts/ci/assert_k6_ci_smoke_summary.py tests/load/results/k6-summary.json --max-failed-rate 0.02 --max-p95-ms 2000 --per-tag-k6-api-smoke
   python scripts/ci/print_k6_summary_metrics.py tests/load/results/k6-summary.json
   ```

3. **Read + write CI smoke (mirrors merge gate `k6-ci-smoke`):** `k6 run tests/load/ci-smoke.js --summary-export /tmp/k6-ci-summary.json` then **`python scripts/ci/assert_k6_ci_smoke_summary.py /tmp/k6-ci-summary.json --max-failed-rate 0.02 --max-p95-ms 3000 --per-tag-ci-smoke`** (see **[LOAD_TEST_BASELINE.md](LOAD_TEST_BASELINE.md)**).
4. **Heavier Compose / hot-path baseline (manual, non-blocking):** **`pwsh ./scripts/load/record_baseline.ps1`** or **`bash scripts/load/record_baseline.sh`** and workflow **[`.github/workflows/load-test.yml`](../../.github/workflows/load-test.yml)** — see **[LOAD_TEST_BASELINE.md](LOAD_TEST_BASELINE.md)**.

Azure **hosting** order-of-operations (no capacity promise): **[DEPLOYMENT.md](DEPLOYMENT.md)**.

### Simulator versus real LLM

- **Envelope above (CI smokes, per-tenant burst, local `k6-api-smoke` parity)** uses **Simulator** execution unless you intentionally change **`AgentExecution`** mode. That measures **API + orchestration + SQL + caching** overheads — **not** Azure OpenAI queuing, token throughput, or model latency.
- **Real LLM end-to-end** benchmarking is a **separate** script, **[`tests/load/real-mode-e2e-benchmark.js`](../../tests/load/real-mode-e2e-benchmark.js)** (`AzureOpenAI` mode targets). It has **cost** (token usage) and **different** tails; thresholds there are **benchmark** defaults in the script — **not** merge-blocking CI gates.
- **Heavier pilot-shaped load** (mixed readers/writers) can use **`tests/load/core-pilot.js`** profiles documented in **`tests/load/README.md`** — still **Simulator** unless reconfigured.

### Cost and telemetry prerequisites (interpreting any run)

- **Cost:** Simulator-mode k6 has **negligible** LLM spend; **`real-mode-e2e-benchmark.js`** incurs **live** Azure OpenAI charges — budget before running. Worker/API SKU and SQL DTU still consume cloud cost for long Soak/burst schedules.
- **Telemetry:** Correlate with **`X-Correlation-ID`** (k6 prefixes documented in **[PERFORMANCE_TESTING.md](PERFORMANCE_TESTING.md)**) and use metric names in **[OBSERVABILITY.md](OBSERVABILITY.md)**. Without Application Insights (or equivalent) and SQL/CPU context, **k6 numbers alone** do not diagnose root cause.
- **Common distortions:** Cold SQL container, **reader/writer contention** on shared CI SQL (mitigations in **[LOAD_TEST_BASELINE.md](LOAD_TEST_BASELINE.md)**), stale data volume differences between **fresh CI catalog** and **staging soak**.

### What this envelope does not claim

- **No** guaranteed **production** RPS, tenant count, or **linear** scale-out without a **new** measured run on **your** subscription and data shape.
- **No** **multi-region** or **active/active** availability story implied by these tests (single-region pilot evidence only).
- **No** substitute for **buyer-specific** penetration testing or formal SOC 2 **attestation** (see trust docs); k6 proves **software regression bounds** under stated assumptions.

---

## Aggregate run explanation summary (`CachingRunExplanationSummaryService`)

**What:** The **`IRunExplanationSummaryService`** implementation can be wrapped in **`CachingRunExplanationSummaryService`** when **`HotPathCache:Enabled`** is **`true`** (see **`RegisterRunExplanationSummaryService`** in **`ServiceCollectionExtensions.CoordinatorAndArtifacts.cs`**).

**Cache key:** `explanation:aggregate:{runId}:{hex(RowVersion)}`, where **`RowVersion`** is the SQL **`ROWVERSION`** (or equivalent) on the authority run row, read via **`IAuthorityQueryService.GetRunDetailAsync`** before the inner service runs.

**TTL:** Entry lifetime follows **`HotPathCacheOptions.AbsoluteExpirationSeconds`** (clamped by the **`IHotPathReadCache`** implementation, same as manifest/run/policy-pack hot-path entries). Configure under the **`HotPathCache`** configuration section.

**Invalidation without explicit deletes:** When a run row is updated in a way that advances **`ROWVERSION`** (for example after manifest re-commit or other persistence that bumps the row version), the **hex suffix** in the key changes, so the next request **misses** the old entry and recomputes the aggregate summary. Entries for superseded keys expire naturally by TTL.

**Bypass:** If **`HotPathCache:Enabled`** is **`false`**, **`RunExplanationSummaryService`** is registered directly and no explanation summary caching occurs. If **`Run.RowVersion`** is missing on the detail DTO, the decorator delegates to the inner service **without** caching.

---

## k6 operator-path smoke (CI baseline)

**What:** After a green **`.NET: full regression (SQL)`**, CI runs **`tests/load/k6-api-smoke.js`** (native k6 on the Ubuntu runner) against a fresh **`ArchLucid.Api`** process and SQL catalog **`ArchLucidK6Smoke`**. The script exercises a **Core Pilot-shaped** slice: **`/health/ready`** (expects JSON **`status: "Healthy"`**), **`/version`**, **`POST /v1/architecture/request`**, **`GET /v1/architecture/run/{id}`**, **`GET /v1/authority/projects/default/runs?take=10`**, then (default) **`POST …/seed-fake-results`**, **`POST …/commit`**, **`GET /v1/artifacts/manifests/{manifestId}`**. Budgets are **per-`k6api` tag** (tier-style **`ARCHLUCID_K6_P95_*`** env overrides) — **CI/pilot smoke only**, not a throughput proof; details in **[PERFORMANCE_TESTING.md](PERFORMANCE_TESTING.md)**.

**Job:** **`Performance: k6 API smoke (operator path)`** in **`.github/workflows/ci.yml`**. **~60s** profile: ramp to **5** VUs (10s hold 40s ramp 10s). **Merge-blocking:** k6 **`thresholds`** + Python **`scripts/ci/assert_k6_ci_smoke_summary.py --per-tag-k6-api-smoke`** (**`http_req_failed`** ≤ **2%**, per-tag p95 caps; global fallback p95 ≤ **2000 ms**). Artifact **`k6-smoke-results`** holds the summary JSON.

**Local:** See **[`tests/load/README.md`](../../tests/load/README.md)**. Full hot-path baselines and Compose **`full-stack`**: **[LOAD_TEST_BASELINE.md](LOAD_TEST_BASELINE.md)**.

## k6 per-tenant burst (weekly)

**What:** **[`tests/load/per-tenant-burst.js`](../../tests/load/per-tenant-burst.js)** runs **10** fixed tenant scopes (HTTP **`x-tenant-id`** / workspace / project GUIDs), each at **5** iterations/s for **5 minutes** (override with **`K6_BURST_DURATION`**). Each iteration executes the operator path: **`POST /v1/architecture/request`** → **`POST …/seed-fake-results`** → **`POST …/commit`** → **`GET /v1/artifacts/manifests/{manifestId}`**.

**Job:** **`.github/workflows/k6-per-tenant-burst-scheduled.yml`** (weekly **Monday 06:15 UTC** + **`workflow_dispatch`**). Thresholds: **`scripts/ci/assert_k6_ci_smoke_summary.py`** with **`--max-p95-ms 3000`** and failed-rate cap **5%** (burstier than merge-blocking smokes). Summary artifact: **`k6-per-tenant-burst-summary`**.

**Why:** Exercises **per-tenant burst** against **Simulator** mode (same pattern as **`start_api_for_k6.sh`**) without live LLM spend.

---

## Related documents

- [OBSERVABILITY.md](OBSERVABILITY.md) — **`archlucid_explanation_cache_*`** and other business KPI metrics.
- [DI_REGISTRATION_MAP.md](DI_REGISTRATION_MAP.md) — conditional **`IRunExplanationSummaryService`** registration.
- [ArchLucid.Persistence.Coordination/Caching/HotPathCacheOptions.cs](../../ArchLucid.Persistence.Coordination/Caching/HotPathCacheOptions.cs) — options type (source).

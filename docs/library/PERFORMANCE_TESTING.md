> **Scope:** Contributor-reference — Performance testing (k6 smoke) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Performance testing (k6 smoke)

## Purpose

> **Script reference:** see **[`tests/load/README.md`](../../tests/load/README.md)** for the environment-variable matrix, per-script examples, and CI job mapping.

The **`tests/load/smoke.js`** script is a **short, read-only** load profile against the ArchLucid API. It complements:

- **`docs/PERFORMANCE.md`** — runtime caching and hot-path design notes.
- **`docs/API_SLOS.md`** — product SLOs and error budgets.

k6 establishes a **regression baseline** for latency and error rate on health, version, coordinator runs list, and audit search.

## Running locally

1. Start the API (for example `dotnet run --project ArchLucid.Api` with `ArchLucidAuth:Mode=DevelopmentBypass` and storage you prefer).
2. Install [k6](https://k6.io/docs/get-started/installation/).
3. From the repo root:

```bash
BASE_URL=http://127.0.0.1:5128 k6 run tests/load/smoke.js --out json=k6-results.json
```

Adjust **`BASE_URL`** if the API listens elsewhere.

### Rate limiting (local runs)

Controllers that use **`[EnableRateLimiting("fixed")]`** share a **fixed window** (default **100 requests / minute** per partition, **no queue**). k6’s scenarios issue **far more** than that, so you will see **`429 Too Many Requests`** and a failed **`http_req_failed`** threshold unless you raise the limit for the test process.

**CI** sets **`RateLimiting__FixedWindow__PermitLimit=200000`** for the k6 API job only. For a comparable local run, set the same env vars (or a large value) when starting **`ArchLucid.Api`**, for example:

```bash
# PowerShell example
$env:RateLimiting__FixedWindow__PermitLimit = "200000"
$env:RateLimiting__FixedWindow__WindowMinutes = "1"
dotnet run --project ArchLucid.Api
```

## Scenarios and thresholds

| Scenario | Traffic | p95 target | Notes |
|----------|---------|------------|--------|
| `health` | Ramp to **10** VUs over **30s** | **&lt; 500ms** | `GET /health/live`, `GET /health/ready` |
| `version` | Ramp to **5** VUs, **30s** | **&lt; 500ms** | `GET /version` |
| `runs_list` | Ramp to **5** VUs, **30s** | **&lt; 2000ms** | `GET /v1/architecture/runs` (scope from DevelopmentBypass defaults) |
| `audit_search` | Ramp to **3** VUs, **30s** | **&lt; 2000ms** | `GET /v1/audit/search?take=50` |

Global: **`http_req_failed` rate &lt; 1%**.

Every request sends **`X-Correlation-ID: k6-smoke-{scenario}-{vu}-{iter}`** for log correlation.

## Soak profile (scheduled / manual)

**`tests/load/soak.js`** runs a **longer, low-rate** read-only mix (`health`, `version`, `runs_list`, `audit_search`) with relaxed thresholds. Use it for **scheduled** or **manual** runs against a real base URL — not as a merge gate.

- **Workflow:** `.github/workflows/k6-soak-scheduled.yml` (weekly cron + `workflow_dispatch`). Set repository secret **`ARCHLUCID_SOAK_BASE_URL`** (for example `https://api.staging.example`) or the job no-ops with a log line.
- **Local:** `BASE_URL=http://127.0.0.1:5128 SOAK_VUS=3 SOAK_DURATION=4m k6 run tests/load/soak.js`

## Tuning thresholds

Raise thresholds only when a change **intentionally** increases latency (for example new mandatory work in the hot path). Document the reason in the PR. If thresholds are too loose, the suite stops catching regressions.

## JSON output

`--out json=results.json` produces k6’s JSON stream (metrics and samples). In CI the artifact is uploaded for **trend comparison** and post-processing (for example Grafana k6 Cloud or a custom parser). For a quick local view, omit `--out` and read the end-of-test summary in the console.

## CI

See **`docs/TEST_EXECUTION_MODEL.md`** — job **`Performance: k6 API smoke (operator path)`** (**merge-blocking**). After **`dotnet-full-regression`**, the workflow creates catalog **`ArchLucidK6Smoke`**, starts **`ArchLucid.Api`** (DevelopmentBypass, simulator agents, **raised `RateLimiting:FixedWindow:PermitLimit`**), waits for **`/health/ready`**, installs **k6** on the runner, runs **`tests/load/k6-api-smoke.js`** with **`K6_SUMMARY_PATH`** pointing at the job temp dir, asserts via **`scripts/ci/assert_k6_ci_smoke_summary.py --per-tag-k6-api-smoke`** (duplicate gate on k6’s own thresholds), prints **`scripts/ci/print_k6_summary_metrics.py`**, and uploads artifact **`k6-smoke-results`**.

### Core Pilot operator-path smoke budget (merge gate)

**`tests/load/k6-api-smoke.js`** enforces **per-request-tag** p(95) ceilings (via k6 **`thresholds`**) for the default **Core Pilot-shaped** HTTP slice: **`/health/ready`**, **`GET /version`**, **`POST /v1/architecture/request`**, **`GET /v1/architecture/run/{id}`** (run snapshot), **`GET /v1/authority/projects/…/runs`**, then **`POST …/seed-fake-results`** → **`POST …/commit`** → **`GET /v1/artifacts/manifests/{manifestId}`** (descriptor listing). Caps default to the same tier hints as **`ci-smoke.js`** (**`ARCHLUCID_K6_P95_HEALTH_READY_MS`**, **`ARCHLUCID_K6_P95_TIER2_MS`**, **`ARCHLUCID_K6_P95_TIER3_MS`**, optional **`ARCHLUCID_K6_P95_SEED_FAKE_MS`** / **`ARCHLUCID_K6_P95_COMMIT_MS`**, **`ARCHLUCID_K6_HTTP_FAIL_RATE_MAX`**).

**What this budget proves:** on a **fresh SQL catalog** with **Simulator** agents and **DevelopmentBypass**, the **first-pilot-shaped API sequence** stays within **documented CI/pilot smoke ceilings** and does not regress sharply on latency or check failures versus recent baseline PRs.

### Post-commit operator path (local / optional CI)

**`tests/load/post-commit-operator-path.js`** extends the finish path with read-heavy routes after commit: run detail, manifest summary, artifacts, aggregate explanation, provenance, executive ROI summary, and sponsor packet download. Uses **`k6pc:*`** tags and writes `tests/load/results/post-commit-operator-path.json` (slowest tagged route in summary).

```bash
ARCHLUCID_BASE_URL=http://127.0.0.1:5128 K6_COMPRESS=1 k6 run tests/load/post-commit-operator-path.js
```

Tune via **`ARCHLUCID_K6_P95_TIER2_MS`**, **`ARCHLUCID_K6_P95_TIER3_MS`**, **`K6_POST_COMMIT_VUS`**, **`K6_POST_COMMIT_DURATION`**. Requires internal **seed-fake-results** (DevelopmentBypass) like **`k6-api-smoke.js`**.

**What it does *not* prove:** production throughput, multi-tenant isolation under adversarial load, real LLM latency, or contractual SLO adherence — see **`docs/library/API_SLOS.md`** for product-facing targets and **`docs/library/LOAD_TEST_BASELINE.md`** for heavier manual Compose profiles.

For environments **without** internal seed/commit (for example strict ApiKey-only targets), set **`ARCHLUCID_K6_OPERATOR_MINIMAL=1`** so the script stops after the authority runs list (legacy four-call operator slice).

The read-only **`tests/load/smoke.js`** profile remains documented for local / manual comparison; the **merge gate** uses **`k6-api-smoke.js`** (operator path including **`POST /v1/architecture/request`** and the Core Pilot finish path above unless minimal mode is set).

### Docker k6 (local / soak)

Both **`k6-smoke-api`** and **`k6-ci-smoke`** CI jobs install **native k6** via the Grafana APT repo (same pattern). If you prefer Docker locally, for example for the read + write mix:

```bash
docker run --rm --network host \
  -v "$(pwd)/tests/load:/scripts:ro" \
  -e BASE_URL=http://127.0.0.1:5128 \
  grafana/k6:latest run /scripts/ci-smoke.js
```

Pass **`--user "$(id -u):$(id -g)"`** when bind-mounting a host output directory so the container user can write summary files. The scheduled **`k6-soak-scheduled`** workflow still uses the Docker image.

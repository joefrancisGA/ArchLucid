> **Scope:** ArchLucid HTTP API — merge-blocking k6 p95 latency ceilings tied to measured baselines — not customer SLA text (see **`API_SLOS.md`**) and not SQL named-query allowlists (**TB-003** / **`OBSERVABILITY.md`**).

# API performance targets (k6-enforced p95)

## Objective

Publish **route-oriented** p95 ceilings enforced by **k6 `thresholds`** on merge-blocking CI jobs and duplicated by **`scripts/ci/assert_k6_ci_smoke_summary.py`**, so regressions fail the workflow without changing runtime API code.

## Assumptions

- **Synthetic CI profile:** **`tests/load/ci-smoke.js`** (**`k6-ci-smoke`**) and **`tests/load/k6-api-smoke.js`** (**`k6-smoke-api`**) against **`ArchLucid.Api`** on GitHub Actions with SQL Server service container and DevelopmentBypass (**`.github/workflows/ci.yml`**).
- Targets are **ceilings** for **external HTTP latency** on those profiles; production paths differ (network, auth, data volume).

## Constraints

- Thresholds apply **only** where k6 already tags requests (**`k6ci:*`**, **`k6api:*`**). **`GET /v1/audit`** (non-search list) and **`GET /v1/governance/dashboard`** have **no** merge-blocking k6 coverage today — see **Coverage gaps** below.
- Do **not** infer contractual SLA numeric tightening from this page alone — **`API_SLOS.md`** remains the buyer-facing tier narrative.

## Architecture overview

| Enforcement layer | Location |
| --- | --- |
| k6 process exit (primary gate) | **`options.thresholds`** in **`tests/load/ci-smoke.js`** and **`tests/load/k6-api-smoke.js`** |
| Summary JSON duplicate gate | **`scripts/ci/assert_k6_ci_smoke_summary.py`** (**`--per-tag-ci-smoke`**, **`--per-tag-k6-api-smoke`**) |
| Workflow env defaults | **`.github/workflows/ci.yml`** jobs **`k6-ci-smoke`** and **`k6-smoke-api`** |

## Named-query pattern reference (TB-003)

SQL-level latency uses an **allowlist JSON** plus OTel histogram **`archlucid_query_p95_ms`** (**`query_name`** label) — **`tests/performance/query-allowlist.json`**, **`scripts/ci/assert_query_performance.py`**, **`ArchLucid.Core`** instrumentation (**`ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds`**). HTTP k6 targets here are **orthogonal**: they guard end-to-end route latency on CI smoke traffic, not individual SQL statements.

## Top routes — targets and k6 mapping

**Methodology**

1. **Tier 2 synchronous reads/writes (aggregate baseline):** **`k6-summary.json`** at repo root (**Initial** row in **`LOAD_TEST_BASELINE.md`**, recorded **2026-04-14**) reports **`metrics.http_req_duration`** **`p(95)` ≈ 773 ms** for **`scripts/load/hotpaths.js`** (Compose full-stack, five-path mix). **Target ms** = **ceil(1.2 × 773)** = **928 ms** applied to every **`k6ci`** / **`k6api`** tag that shares the Tier 2 CI smoke bucket (list/detail/version/audit search/telemetry/snapshot/list-authority/artifacts).
2. **Tier 3 architecture writes / pilot finish:** Baseline **5500 ms** (pilot-scale midpoint under the prior **8000 ms** Tier 3 CI ceiling; no standalone per-route export in **`k6-summary.json`**). **Target ms** = **ceil(1.2 × 5500)** = **6600 ms** for **`POST /v1/architecture/request`**, internal **`seed-fake-results`**, **`POST …/commit`**, and **`POST`** variants measured under **`k6api:create_run`** / **`seed_fake`** / **`pilot_commit`**.
3. **Tier 1 live / ready:** Ceilings remain **300 ms** / **1200 ms** (**`API_SLOS.md`** CI-ready variance). Documented implicit baseline = **target / 1.2** (**250 ms** / **1000 ms**) where hotpaths JSON does not isolate probes.

**Last-updated (targets table):** **2026-05-10** (UTC).

| # | Route (canonical) | k6 tag(s) | Script | p95 ceiling (ms) | Baseline source |
| --- | --- | --- | --- | --- | --- |
| 1 | `GET /health/live` | `k6ci:health_live` | ci-smoke | **300** | Tier 1 CI ceiling / implicit baseline 250 ms |
| 2 | `GET /health/ready` | `k6ci:health_ready`, `k6api:health_ready` | ci-smoke; api-smoke | **1200** | Ready aggregates deps on Actions / baseline 1000 ms |
| 3 | `GET /v1/architecture/runs` | `k6ci:list_runs`, `k6ci:list_for_get_run` | ci-smoke | **928** | 1.2 × **`k6-summary.json`** hotpaths p95 (**773 ms**) |
| 4 | `GET /v1/architecture/run/{runId}` | `k6ci:get_run_detail`, `k6api:run_status` | ci-smoke; api-smoke | **928** | Same Tier 2 aggregate baseline |
| 5 | `POST /v1/architecture/request` | `k6ci:create_run`, `k6api:create_run` | ci-smoke; api-smoke | **6600** | 1.2 × **5500 ms** pilot write baseline |
| 6 | `POST /v1/architecture/run/{runId}/commit` | `k6api:pilot_commit` | api-smoke | **6600** | Same Tier 3 baseline (**6600** ms); **`ARCHLUCID_K6_P95_COMMIT_MS`** overrides |
| 7 | `GET /v1/audit/search` | `k6ci:audit_search` | ci-smoke | **928** | Tier 2 aggregate baseline |
| 8 | `GET /version` | `k6ci:version`, `k6api:version` | ci-smoke; api-smoke | **928** | Tier 2 aggregate baseline |
| 9 | `GET /v1/audit` | — | — | *No k6 gate* | Add **`tests/load/ci-smoke.js`** coverage before enforcing |
| 10 | `GET /v1/governance/dashboard` | — | — | *No k6 gate* | Add scenario coverage before enforcing |

### Auxiliary endpoints already gated (same Tier 2 / Tier 3 buckets)

These satisfy expanded regression coverage but are not in the numbered “top ten” product list above:

| Route | k6 tag | Ceiling (ms) |
| --- | --- | --- |
| `POST /v1/diagnostics/client-error` | `k6ci:client_error_telemetry` | **928** |
| `GET /v1/authority/projects/{projectSlug}/runs` | `k6api:list_authority_runs` | **928** |
| `POST /v1/internal/architecture/runs/{runId}/seed-fake-results` | `k6api:seed_fake` | **6600** |
| `GET /v1/artifacts/manifests/{manifestId}` | `k6api:artifacts_list` | **928** |

## Coverage gaps

**Routes 9–10** lack merge-blocking k6 requests; thresholds cannot be added without extending **`tests/load/ci-smoke.js`** (out of scope for threshold-only work).

## Operational considerations

- **Fork overrides:** **`ARCHLUCID_K6_P95_*`** env vars in **`ci.yml`** mirror script defaults; forks may raise caps for noisy runners — update **this doc**, **`LOAD_TEST_BASELINE.md`**, and **`API_SLOS.md`** cross-references together when changing contracted CI ceilings.
- **Failure modes:** k6 exits non-zero when **`thresholds`** breach; the Python assert step repeats the same numeric caps on **`--summary-export`** JSON so drift between engines is caught.

## Security model

Targets describe **latency bounds** on synthetic CI traffic only; they do not widen auth boundaries or expose new endpoints.

## Scalability / reliability / cost

Stricter Tier 2/Tier 3 ceilings increase **PR flake sensitivity** if SQL or cold-start variance grows — mitigate with migrations/indexes (**`LOAD_TEST_BASELINE.md`** § reader–writer contention) rather than permanently widening gates. No additional cloud spend.

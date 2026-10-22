# Launch load drill (public-traffic burst)

**Exposure gate:** `LATEST_EXPOSURE.md` §20 Tier 3 — public self-service readiness (Load/Traffic Readiness).

**Purpose:** Rehearse a LinkedIn-scale anonymous traffic spike on static marketing/showcase routes and a smaller authenticated read burst before enabling public self-service signup.

## Scripts

| Script | Target | Default peak VUs | Notes |
| --- | --- | ---: | --- |
| `scripts/load/public-showcase-burst.js` | `/showcase/claims-intake-modernization`, `/demo/preview`, `/welcome` | 50 | Must remain static — **no live LLM** on these paths |
| `scripts/load/authenticated-first-review-burst.js` | `GET /v1/audit/search`, `GET /v1/authority/runs/{runId}` | 15 | Simulator-friendly API; optional `ARCHLUCID_LOAD_TEST_WRITES=true` for low-rate creates |

## Local run

1. Build UI and start mock-backed standalone (same spine as Lighthouse CI / Playwright mock E2E):

```bash
cd archlucid-ui
npm run build
MOCK_E2E_SKIP_NEXT_BUILD=1 npx tsx e2e/start-e2e-with-mock.ts
```

2. In another shell, start API for k6 (Simulator):

```bash
bash scripts/ci/start_api_for_k6.sh ArchLucidLaunchDrill /tmp/launch-drill-api.log /tmp/launch-drill-api.pid
```

3. Run the drill orchestrator:

```bash
export ARCHLUCID_UI_BASE_URL=http://127.0.0.1:3000
export ARCHLUCID_BASE_URL=http://127.0.0.1:5128
bash scripts/ci/run_launch_load_drill.sh
```

Summaries land under `artifacts/launch-load-drill/<timestamp>/`.

## CI (manual)

Workflow **`.github/workflows/k6-launch-load-drill.yml`** — `workflow_dispatch` only (not merge-blocking). Uploads k6 summary JSON and logs.

## Recording results

After each drill, append a row to **Latest run** below with:

- Traffic shape (peak VUs, ramp/hold durations)
- p50 / p95 / p99 `http_req_duration`
- `http_req_failed` rate
- Any 5xx or unexpected LLM proxy calls on showcase paths (treat as regression)

**TB-905 (staging):** after `run_launch_load_drill.sh`, run:

```powershell
.\scripts\ops\append-launch-load-drill-results.ps1 -SummaryDir artifacts/launch-load-drill/<timestamp> -Environment staging -Apply
```

See `docs/runbooks/TB-905_STAGING_RELIABILITY_DRILL.md`.

### Latest run

| Date | Environment | Showcase peak VUs | Showcase p95 (ms) | Error rate | Auth peak VUs | Auth p95 (ms) | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| _pending_ | local/staging | — | — | — | — | — | Scripts shipped 2026-07-11; first measured run pending owner traffic-sizing input |

## Pre-launch scale bake-off (**TB-946**)

Before the launch-load half of **TB-905**, run single-signal drills A (HTTP/LLM-wait), B (CPU-bound), and C (worker backlog when enabled). Record time-to-first-extra-replica and which scale rule fired.

**Runbook:** [`SCALE_MICRO_DRILL.md`](SCALE_MICRO_DRILL.md) — k6 scripts under `scripts/load/scale-drill-*.js`, orchestrator `scripts/ci/run_scale_micro_drill.sh`, results via `scripts/ops/append-scale-micro-drill-results.ps1`. **Gate:** drills **A** and **B** must pass on staging before Phase C of `docs/runbooks/TB-905_STAGING_RELIABILITY_DRILL.md` (owner **G-SCALE-01**).

**Capacity gate:** complete [`infra/terraform-container-apps/README.md` § API max-replicas sizing](../../infra/terraform-container-apps/README.md#api-max-replicas-sizing-vs-bulkhead-and-aoai-tpm-tb-947) (**TB-947**) so `api_max_replicas` is capped against `MaxConcurrentHandlers` and AOAI TPM — do not assume more replicas equals more LLM throughput.

## Non-goals

- Changing production rate-limit partitions (measure first, tune only when drill shows failure)
- Merge-blocking CI gate (periodic drill, not per-PR)
- Live Azure OpenAI calls on showcase/marketing routes

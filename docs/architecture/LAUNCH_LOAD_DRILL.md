# Launch load drill (public-traffic burst)

**Exposure gate:** `LATEST_EXPOSURE.md` §20 Tier 3 — public self-service readiness (Load/Traffic Readiness).

**Purpose:** Rehearse a LinkedIn-scale anonymous traffic spike on static marketing/showcase routes and a smaller authenticated read burst before enabling public self-service signup.

## Scripts

| Script | Target | Default peak VUs | Notes |
| --- | --- | ---: | --- |
| `scripts/load/public-showcase-burst.js` | `/showcase/claims-intake-modernization`, `/demo/preview`, `/welcome` | 50 | Must remain static — **no live LLM** on these paths |
| `scripts/load/authenticated-first-review-burst.js` | `GET /v1/audit/search`, `GET /v1/authority/runs/{runId}` | 15 | Simulator-friendly API; optional `ARCHIFORGE_LOAD_TEST_WRITES=true` for low-rate creates |

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

### Latest run

| Date | Environment | Showcase peak VUs | Showcase p95 (ms) | Error rate | Auth peak VUs | Auth p95 (ms) | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| _pending_ | local/staging | — | — | — | — | — | Scripts shipped 2026-07-11; first measured run pending owner traffic-sizing input |

## Non-goals

- Changing production rate-limit partitions (measure first, tune only when drill shows failure)
- Merge-blocking CI gate (periodic drill, not per-PR)
- Live Azure OpenAI calls on showcase/marketing routes

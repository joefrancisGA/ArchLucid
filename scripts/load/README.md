# Load testing (k6)

Scripts target the five API hot paths documented in `docs/LOAD_TEST_BASELINE.md`.

## Prerequisites

- [k6](https://k6.io/docs/get-started/installation/) installed locally.
- API reachable at `BASE_URL` (default `http://127.0.0.1:5000`).
- For **Docker Compose full-stack** (`docker compose --profile full-stack up -d`), wait until `GET /health/live` returns 200 on the API port.

## Run locally

```bash
export BASE_URL=http://127.0.0.1:5000
# Optional: export API_KEY=... when not using DevelopmentBypass
k6 run scripts/load/hotpaths.js
```

### Tune VUs and duration

```bash
VUS=10 DURATION=5m k6 run scripts/load/hotpaths.js
```

## CI

The workflow `.github/workflows/load-test.yml` runs on **manual** `workflow_dispatch` against Compose `full-stack` with fixed runner resources (see workflow). It uploads a summary snippet to the job log; copy p50/p95/p99 into `docs/LOAD_TEST_BASELINE.md` after each formal baseline run.

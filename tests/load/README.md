# k6 load scripts (`tests/load`)

## `k6-api-smoke.js` — operator path (CI + local)

Exercises: **`GET /health/ready`** (JSON **`status`** must be **`Healthy`**), **`GET /version`**, **`POST /v1/architecture/request`**, **`GET /v1/authority/projects/{project}/runs?take=10`** (default project slug **`default`**).

**Environment**

| Variable | Default | Purpose |
|----------|---------|---------|
| **`ARCHLUCID_BASE_URL`** | `http://127.0.0.1:5128` | API base URL (`BASE_URL` is accepted as alias) |
| **`ARCHLUCID_API_KEY`** | *(unset)* | Optional **`X-Api-Key`** for keyed auth |
| **`ARCHLUCID_AUTHORITY_PROJECT`** | `default` | Authority project slug for list runs |
| **`K6_SCENARIO`** | *(unset = smoke)* | Set to **`load`** for ~3m / 20 VU ramping scenario |
| **`K6_SUMMARY_PATH`** | `tests/load/results/k6-summary.json` | **`handleSummary`** output path |

**Local run**

1. Start SQL + API (e.g. `docker compose up -d` for infra, then `dotnet run --project ArchLucid.Api` with **`DevelopmentBypass`** and **`AgentExecution:Mode: Simulator`** recommended).
2. Ensure `tests/load/results/` exists (tracked via `.gitkeep`).
3. Run:

```bash
k6 run tests/load/k6-api-smoke.js
```

Summary JSON is written to **`tests/load/results/k6-summary.json`** (gitignored). Override with **`K6_SUMMARY_PATH`**.

**Load scenario**

```bash
K6_SCENARIO=load k6 run tests/load/k6-api-smoke.js --summary-export /tmp/k6-load-summary.json
```

**Thresholds (built into script)**

- **`http_req_failed`**: rate &lt; **1%**
- **`http_req_duration`**: **p95** &lt; **2000** ms, **p99** &lt; **5000** ms

**CI**

Job **`Performance: k6 API smoke (operator path)`** in **`.github/workflows/ci.yml`** runs after **`.NET: full regression (SQL)`**, installs k6 on the runner, starts **`ArchLucid.Api`** against catalog **`ArchLucidK6Smoke`**, runs this script with **`K6_SCENARIO=smoke`**, then **`scripts/ci/assert_k6_ci_smoke_summary.py`** (same gate as k6 CI smoke: failed rate + p95). Artifact: **`k6-smoke-results`**.

## Other scripts

| File | Purpose |
|------|---------|
| **`smoke.js`** | Read-only paths; used for broader read mix (see **`docs/LOAD_TEST_BASELINE.md`**) |
| **`ci-smoke.js`** | Parallel read+write scenarios; CI job **`Performance: k6 CI smoke (read + write baseline)`** |
| **`soak.js`** | Longer soak profile (manual / scheduled workflows) |

Deeper baselines and Compose full-stack runs: **`docs/LOAD_TEST_BASELINE.md`**, **`scripts/load/README.md`**.

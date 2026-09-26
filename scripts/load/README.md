# Load testing (k6)

Scripts target the five API hot paths documented in `docs/LOAD_TEST_BASELINE.md`.

## Prerequisites

- **Recommended:** Docker (for Compose + optional k6 container — no local k6 install).
- Or [k6](https://k6.io/docs/get-started/installation/) installed locally.
- API reachable at `BASE_URL` (default `http://127.0.0.1:5000`).
- For **Docker Compose full-stack** (`docker compose --profile full-stack up -d`), wait until `GET /health/live` returns 200 on the API port.

## Record baseline (Compose + k6 container + summary)

From repo root (fills `k6-summary.json`, prints metrics — see `docs/LOAD_TEST_BASELINE.md`):

```powershell
pwsh ./scripts/load/record_baseline.ps1
```

```bash
bash scripts/load/record_baseline.sh
```

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

## Email OTP abuse flood (Evidence E1)

Staging-only identity drills (not production):

| Script | Purpose |
|--------|---------|
| `email-otp-challenge-flood.js` | Anonymous OTP challenge flood + body leak checks |
| `email-otp-challenge-stub.js` | Alias for runbooks |
| `self-service-trial-farm-stub.js` | Registration farm (requires `PublicSelfService` temporarily) |

Orchestrator (unit flood proof + optional k6):

```powershell
.\scripts\ci\run_email_otp_abuse_drill.ps1 -SkipK6 -WriteEvidenceStub
.\scripts\ci\run_email_otp_abuse_drill.ps1 -BaseUrl 'https://YOUR-STAGING-API' -ExpectBotChallenge -WriteEvidenceStub
```

See `docs/runbooks/EMAIL_OTP_DELIVERY_AND_ABUSE.md` § Abuse drill (Evidence E1).

## Scale micro-drills (TB-946)

Single-signal staging drills before **TB-905** launch load — validate HTTP, CPU, and worker backlog scale rules independently:

| Script | Drill |
|--------|-------|
| `scale-drill-a-http-llm-wait.js` | A — HTTP / LLM-wait concurrency |
| `scale-drill-b-cpu-bound.js` | B — CPU-bound reads |
| `scale-drill-c-worker-backlog.js` | C — worker export backlog |

```bash
export ARCHLUCID_BASE_URL=https://<staging-api>
bash scripts/ci/run_scale_micro_drill.sh
```

Full runbook: `docs/architecture/SCALE_MICRO_DRILL.md`.

## CI

The workflow `.github/workflows/load-test.yml` runs on **manual** `workflow_dispatch` against Compose `full-stack` with fixed runner resources (see workflow). It uploads a summary snippet to the job log; copy p50/p95/p99 into `docs/LOAD_TEST_BASELINE.md` after each formal baseline run.

## SecureNow synthetic multi-tenant read envelope

Provision at least two disposable, distinct tenants with seeded snapshots and
ranked paths. Supply `SECURENOW_TEST_SCOPES_JSON` as an array of objects with
`tenantId`, `workspaceId`, `projectId`, `snapshotId`, and `apiKey`. Keep that
secret-bearing input outside the repository and evidence files. Run:

```bash
k6 run scripts/load/securenow-multitenant-read.js
```

The script emits `securenow-multitenant-k6.json`. Create a separate metadata JSON
with `profile: "synthetic-multitenant"`, `tenantCount`, `gitSha`,
`environment`, and `workload: "scripts/load/securenow-multitenant-read.js"`.
Evaluate the run without writing credentials into the report:

```bash
python3 scripts/ci/evaluate_securenow_scale_run.py \
  --k6-summary securenow-multitenant-k6.json \
  --run-metadata run-metadata.json --json-out scale-verdict.json
```

Only HTTP 200 responses count as successful checks. The evaluator requires
complete metrics, passing thresholds, and at least two declared tenants.
It labels the result as synthetic read evidence, not a production SLA or proof
of ingestion/write throughput.

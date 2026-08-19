# Scale micro-drill harness (TB-946)

**Exposure / launch gate:** Run **before** the launch-load half of **TB-905** (Phase C in `docs/runbooks/TB-905_STAGING_RELIABILITY_DRILL.md`). Owner execution and evidence capture: GTM **G-SCALE-01**.

**Purpose:** Prove each autoscale signal independently (HTTP concurrency, CPU utilization, worker queue/backlog) so a mixed launch-load drill does not mask which rule fired.

**Prerequisites:**

| Check | Detail |
| --- | --- |
| **TB-915** scale rules on staging | API `http` + `cpu` (default); worker `azure-queue` and/or `prometheus` when enabled |
| **TB-947** sizing | Complete [`infra/terraform-container-apps/README.md` § API max-replicas sizing](../../infra/terraform-container-apps/README.md#api-max-replicas-sizing-vs-bulkhead-and-aoai-tpm-tb-947) before raising `api_max_replicas` |
| Observability | Azure Portal Container Apps **Scale** tab + App Insights replica count / `archlucid_authority_pipeline_work_pending` when drill C uses Prometheus scaler |
| k6 | `https://k6.io/docs/get-started/installation/` or Docker k6 image |

## Drills

| Drill | Signal under test | k6 script | Expected dominant scale rule | Pass criteria (staging) |
| --- | --- | --- | --- | --- |
| **A** | HTTP / LLM-wait | `scripts/load/scale-drill-a-http-llm-wait.js` | API `http_scale_rule` (concurrent requests) | Extra API replica within **5 min** of hold; CPU may stay **below** CPU rule threshold; note any AOAI **429** / breaker opens |
| **B** | CPU-bound | `scripts/load/scale-drill-b-cpu-bound.js` | API `cpu` custom rule (**TB-915**) | Extra API replica while HTTP concurrent metric stays **below** HTTP target; CPU utilization crosses rule threshold |
| **C** | Worker backlog | `scripts/load/scale-drill-c-worker-backlog.js` | Worker `azure-queue` and/or `prometheus` | Worker replica increase; **API HTTP scale should not** be the primary signal |

**Drill A writes:** set `ARCHLUCID_LOAD_TEST_WRITES=true` only on **Simulator** staging with an API key that has **ExecuteAuthority**. Without writes, drill A still hammers `GET /v1/retrieval/search` for HTTP concurrency.

**Drill C:** skip when worker queue / authority outbox Prometheus scaling is disabled — document **N/A** in the results table.

## Run (orchestrated)

From repo root against staging (replace hosts):

```bash
export ARCHLUCID_BASE_URL=https://<staging-api-host>
export ARCHLUCID_API_KEY=<staging-key-with-read-and-optional-execute>
export ARCHLUCID_LOAD_TEST_WRITES=true   # drill A + C when Simulator allows
bash scripts/ci/run_scale_micro_drill.sh
```

Summaries land under `artifacts/scale-micro-drill/<timestamp>/`.

PowerShell wrapper (same env vars):

```powershell
$env:ARCHLUCID_BASE_URL = 'https://<staging-api-host>'
$env:ARCHLUCID_API_KEY = '<key>'
.\scripts\ops\run-scale-micro-drill.ps1
```

### Interaction smoke (after A and B pass individually)

Run a **short** combined window (default 3 min hold each, lower VUs):

```bash
export K6_DRILL_A_PEAK_VUS=12
export K6_DRILL_B_PEAK_VUS=6
export K6_DRILL_A_HOLD=2m
export K6_DRILL_B_HOLD=2m
bash scripts/ci/run_scale_micro_drill.sh --drills A,B
```

Confirm OR semantics: scale-out without rapid scale-in thrash; note if both HTTP and CPU rules fired.

## Record results

During each drill, capture in Azure Portal / metrics:

- Baseline replica count (API + worker)
- **Time-to-first-extra-replica** (seconds from hold start)
- Dominant rule name from scale events
- Scale-in after load stops (minutes)
- Drill A only: AOAI 429 rate or shared breaker opens

Append a row:

```powershell
.\scripts\ops\append-scale-micro-drill-results.ps1 `
  -SummaryDir artifacts/scale-micro-drill/<timestamp> `
  -Environment staging `
  -DrillAReplicasObserved 2 `
  -DrillADominantRule http `
  -DrillBReplicasObserved 2 `
  -DrillBDominantRule cpu `
  -Apply
```

Without replica observations, `-Apply` still records k6 p95 / error rate from summary JSON.

### Latest results (G-SCALE-01)

| Date | Environment | Drill A replicas | A dominant rule | A p95 (ms) | Drill B replicas | B dominant rule | B p95 (ms) | Drill C | Notes |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | --- | --- |
| _pending_ | staging | — | — | — | — | — | — | — | Harness shipped **TB-946**; owner staging run pending **G-SCALE-01** |

## Gate before TB-905 launch load

Do **not** start **TB-905** Phase C (`run_launch_load_drill.sh`) until:

1. Drill **A** and **B** pass on staging (replica + dominant rule recorded).
2. Drill **C** passes or is **N/A** with rationale when worker scalers are off.
3. Interaction smoke completed without thrash.

See also: [`LAUNCH_LOAD_DRILL.md`](LAUNCH_LOAD_DRILL.md) § Pre-launch scale bake-off.

## Related

- `scripts/ci/run_scale_micro_drill.sh`
- `scripts/ops/run-scale-micro-drill.ps1`
- `scripts/ops/append-scale-micro-drill-results.ps1`
- `docs/runbooks/TB-905_STAGING_RELIABILITY_DRILL.md`
- `infra/terraform-container-apps/README.md` § Scale-rule mix (**TB-915**)

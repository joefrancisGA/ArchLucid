> **Scope:** TB-905 — owner-executed staging reliability drill (geo-failover + launch load). Agent prepares; owner runs in Azure.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# TB-905 — Staging reliability drill (owner execution)

**Last updated:** 2026-07-21

## Objective

Produce **measured** RTO/RPO and throughput evidence for V1 continuity claims:

1. **Geo-failover** — Azure SQL manual failover against staging with apps on the **failover group listener**.
2. **Launch load** — k6 burst on static showcase routes + authenticated API reads.

Record results in:

- `docs/quality/game-day-log/FAILOVER_RESULTS.md`
- `docs/architecture/LAUNCH_LOAD_DRILL.md` (Latest run table)

Policy targets: `docs/library/RTO_RPO_TARGETS.md` (production planning defaults: RTO &lt; 60 min, RPO &lt; 5 min for relational data).

## Preconditions (Terraform / staging)

| Check | Root / file | Required for drill |
| --- | --- | --- |
| Secondary region compute **always on** | `infra/terraform-container-apps` — `posture_tier = "staging"`, `secondary_region_stack_enabled = true` | Yes (**TB-903**) |
| SQL failover group **enabled for drill window** | `infra/terraform-sql-failover/staging.tfvars.example` — `enable_sql_failover_group = true` | Yes (geo drill) |
| Connection string uses **failover group listener** | Key Vault / app config | Yes |
| Front Door origin points at staging API (optional) | `infra/terraform-edge` | Load drill only if testing via edge |
| Monitoring dashboards open | App Insights / Grafana | Recommended |

**Outside the drill window:** set `enable_sql_failover_group = false` and add `posture_waivers` entry `staging-sql-failover-drill-window` (see `staging.tfvars.example` comments).

## Phase A — Preflight (15 min)

```powershell
# From repo root — checklist only (no Azure changes)
.\scripts\ops\run-tb905-preflight.ps1 -ApiBaseUrl https://<staging-api-host> -WhatIf

# With live health probe
.\scripts\ops\run-tb905-preflight.ps1 -ApiBaseUrl https://<staging-api-host>
```

Confirm:

- [ ] `GET /health/ready` returns 2xx on staging API
- [ ] Azure Portal: failover group replication lag **&lt; 5 minutes** (note value for RPO column)
- [ ] No pending schema migrations
- [ ] On-call / owner notified; maintenance window logged

## Phase B — Geo-failover drill (30–60 min)

**Runbook detail:** `docs/runbooks/GEO_FAILOVER_DRILL.md`, `docs/runbooks/DATABASE_FAILOVER.md`

```powershell
.\scripts\ops\run-failover-drill.ps1 `
  -ApiBaseUrl https://<staging-api-host> `
  -ReplicationLagMinutes <lag-from-portal>
```

The script:

1. Records pre-drill health.
2. Waits for you to initiate **manual failover** (`az sql failover-group set-primary` or Portal).
3. Measures time to first `/health/ready` failure and time to recovery.
4. Appends a dated section + summary row to `FAILOVER_RESULTS.md`.

**Post-drill smoke (manual):**

- [ ] Create run → execute → commit (or `docs/library/LIVE_E2E_HAPPY_PATH.md` subset)
- [ ] Verify last run id from before T0 still visible
- [ ] Check worker outbox / error rate in App Insights

## Phase C — Launch load drill (30–60 min)

**Precondition (TB-946):** Complete scale micro-drills **A** and **B** on staging per [`SCALE_MICRO_DRILL.md`](../architecture/SCALE_MICRO_DRILL.md) and record results (**G-SCALE-01**). Do not run this phase until HTTP and CPU scale signals are independently verified (drill **C** when worker scalers are enabled, or document **N/A**).

**Harness:** `docs/architecture/LAUNCH_LOAD_DRILL.md`

**Against staging** (after API/UI URLs are known):

```bash
export ARCHLUCID_UI_BASE_URL=https://<staging-ui-host>
export ARCHLUCID_BASE_URL=https://<staging-api-host>
export K6_SHOWCASE_PEAK_VUS=50   # tune to expected LinkedIn spike
export K6_AUTH_PEAK_VUS=15
bash scripts/ci/run_launch_load_drill.sh
```

Or trigger GitHub Actions workflow **`k6-launch-load-drill`** (`workflow_dispatch`).

**Record results:**

```powershell
.\scripts\ops\append-launch-load-drill-results.ps1 `
  -SummaryDir artifacts/launch-load-drill/<timestamp> `
  -Environment staging `
  -Apply
```

Without `-Apply`, prints the markdown table row to paste into `LAUNCH_LOAD_DRILL.md`.

## Phase D — Close-out

1. If targets missed, open follow-up TB items (do not silently change `RTO_RPO_TARGETS.md`).
2. If SQL failover was drill-window-only, revert Terraform waiver path (disable failover group + waiver) per `staging.tfvars.example`.
3. Mark **TB-905** Done in `TECH_BACKLOG.md` only after both logs have dated measured numbers.

## Acceptance mapping (TB-905)

| Criterion | Evidence location |
| --- | --- |
| Dated geo-failover with RTO/RPO | `FAILOVER_RESULTS.md` summary table + drill section |
| Launch load with throughput | `LAUNCH_LOAD_DRILL.md` Latest run row |
| Misses tracked | New TB rows linked from drill notes |

## Related

- `scripts/ops/run-failover-drill.ps1`
- `scripts/ops/run-tb905-preflight.ps1`
- `scripts/ops/append-launch-load-drill-results.ps1`
- `scripts/ci/run_scale_micro_drill.sh` / `docs/architecture/SCALE_MICRO_DRILL.md` (**TB-946** gate)
- **TB-903** (secondary stack always-on; SQL failover waiver model)

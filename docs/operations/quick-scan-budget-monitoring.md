# Quick Scan budget monitoring and reconciliation (TB-899)

**Audience:** Operators and on-call engineers monitoring anonymous Quick Scan spend.

**Related:** [`quick-scan-emergency-shutdown.md`](quick-scan-emergency-shutdown.md) (TB-898 kill switch) · [`quick_scan_budget_safety_assessment.md`](../architecture/quick_scan_budget_safety_assessment.md) · **TB-894** reservations · **TB-898** operational override.

---

## What to monitor

| Signal | Source | Notes |
| --- | --- | --- |
| Hourly / daily reserved vs committed USD | `GET /v1/admin/quick-scan/budget` | Compare to `ArchLucid:QuickScan:Safety:GlobalBudget` ceilings |
| Pending reservation count | Same endpoint | Should stay low; spikes during traffic |
| Expired abandoned reservations (last reconcile) | Same endpoint | Reconciliation job releases TTL-expired pending rows |
| Recent usage records | Same endpoint | No raw prompts — hashed identity + cost/tokens/status only |
| Operational mode | `GET /v1/admin/quick-scan/safety` | Emergency / sample-only suppresses new AI |

---

## Admin API

**Snapshot:** `GET /v1/admin/quick-scan/budget`  
**Auth:** `AdminAuthority` policy (same as safety override).

Response includes:

- Feature enabled flag and operational mode
- Current UTC hour/day bucket reserved + committed totals vs configured ceilings
- Pending reservation count
- Count of reservations reconciled as expired on the last job pass
- Last reconciliation UTC
- Recent usage records (status, route kind, reserved/actual USD, tokens, duration, rejection reason)

---

## Reconciliation job

`QuickScanBudgetReconciliationHostedService` runs on **Worker** and **Combined** hosts (leader-elected when enabled):

1. Finds **pending** global budget reservations past `ExpiresUtc`
2. Releases reserved USD back to hour/day buckets (same semantics as `ReleaseAsync`)
3. Marks reservation **Expired**
4. Emits structured log + audit event `QuickScanBudgetReconciled` with `expiredCount`

**Interval:** default every **15 minutes** (`ArchLucid:QuickScan:BudgetMonitoring:ReconciliationIntervalMinutes`).

---

## Alert thresholds (log-based)

The monitoring service emits **Warning** / **Error** logs (wire to App Insights / Prometheus action groups in hosted environments):

| Severity | Condition |
| --- | --- |
| **Medium** | Hour or day `(reserved + committed) / ceiling` ≥ **80%** |
| **High** | Hour or day utilization ≥ **95%** |
| **Medium** | Last reconciliation released **≥ 1** expired pending reservation |
| **Critical** | Budget store unhealthy or reconciliation throws |

No raw prompt text is logged. Identity fields are SHA-256 prefixes only.

---

## Runbook actions

### Spend approaching ceiling

1. Confirm traffic is expected (marketing campaign, load test).
2. Review recent usage records for abuse patterns (**TB-897** identity layer is separate).
3. If unplanned: set operational override to **Emergency disabled** or **Sample-only** via `PUT /v1/admin/quick-scan/safety` (see emergency shutdown runbook).
4. Do **not** disable safety validation — use operational override.

### Reconciliation finding abandoned reservations

1. Check API/worker logs for failed scans after reserve (client disconnect, provider timeout).
2. Verify reconciliation job is running on the leader worker.
3. Expired releases are expected; sustained high counts may indicate orchestrator failures before commit/release.

### Reserved ≫ committed for long periods

1. Inspect pending reservation count on budget snapshot.
2. Run reconciliation manually by restarting worker or waiting for next interval.
3. If SQL store shows stuck pending rows past TTL, capture `ReservationId` samples for engineering.

---

## Configuration

| Key | Default | Purpose |
| --- | --- | --- |
| `ArchLucid:QuickScan:BudgetMonitoring:ReconciliationIntervalMinutes` | `15` | Reconciliation loop interval |
| `ArchLucid:QuickScan:BudgetMonitoring:AlertHourlyUtilizationMedium` | `0.80` | Medium alert threshold |
| `ArchLucid:QuickScan:BudgetMonitoring:AlertHourlyUtilizationHigh` | `0.95` | High alert threshold |

---

## Privacy

Usage records store **hashed** client IP and session identifiers. Do not enable full prompt/response retention without explicit governed retention policy.

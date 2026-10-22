> **Scope:** Operator runbook for the create→execute→commit (finalize) review-path canary that pages the founder (TB-959).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Review-path canary (TB-959)

## 1. What this canary does

| Component | Purpose |
|-----------|---------|
| **[`scripts/staging-smoke.ps1`](../../scripts/staging-smoke.ps1)** | Health → create → execute → poll `ReadyForCommit` → **commit** → authority manifest |
| **[`.github/workflows/review-path-canary.yml`](../../.github/workflows/review-path-canary.yml)** | Cron every **6 hours** + `workflow_dispatch` |
| **[`scripts/ops/page-critical-canary-failure.sh`](../../scripts/ops/page-critical-canary-failure.sh)** | On failure → PagerDuty Events API v2 or critical webhook |

Unlike [`REAL_MODE_STAGING_SMOKE.md`](./REAL_MODE_STAGING_SMOKE.md) (stops at `ReadyForCommit`, real LLM tokens), this canary **commits** so finalize/commit regressions page before a customer does. Prefer a **simulator / Economy** smoke tenant so LLM spend stays near zero.

Auth/showcase synthetics (**TB-758** / **TB-889**) are **not** substitutes for this journey.

## 2. Enable unattended runs

1. Dedicated staging API key on a **canary/smoke tenant** (reuse `ARCHLUCID_STAGING_SMOKE_API_KEY` when that tenant is simulator-safe).
2. Repository **variable** `ARCHLUCID_REVIEW_PATH_CANARY_ENABLED` = `true`.
3. Optional **kill-switch** variable `ARCHLUCID_REVIEW_PATH_CANARY_KILL_SWITCH` = `true` to suppress the canary without disabling the enable flag.
4. Paging (pick one):
   - **Preferred:** secret `ARCHLUCID_PAGERDUTY_ROUTING_KEY` — Events API v2 routing key for the **same** PagerDuty service wired to `azurerm_monitor_action_group.critical` (`alert-pagerduty-webhook-uri` in Key Vault uses `/integration/{key}/enqueue`; the routing key is that `{key}`).
   - Or `ARCHLUCID_CRITICAL_ALERT_WEBHOOK_URL` / `STAGING_ONCALL_WEBHOOK_URL` (generic JSON `{ "text": "…" }`).
5. Run **`workflow_dispatch`** once; confirm green before trusting the cron.

Optional: `vars.ARCHLUCID_STAGING_API_BASE_URL` / `ARCHLUCID_STAGING_BASE_URL` (default `https://staging.archlucid.net`).

## 3. Cost and safety envelope

| Control | Value |
|---------|-------|
| Frequency | ≤ 4 runs / day (cron `40 */6 * * *`) |
| Path | Simulator/Economy tenant preferred — no live AOAI requirement |
| Kill-switch | `ARCHLUCID_REVIEW_PATH_CANARY_KILL_SWITCH=true` |
| Customer data | None — synthetic “Staging Smoke” request body only |
| Prod E2E harness | **Do not** enable for this canary |
| Timeout | Workflow 20m; smoke poll budget 5m inside the script |

If you intentionally point the canary at a **real-mode** tenant, pair with the golden-cohort budget probe pattern in [`REAL_MODE_STAGING_SMOKE.md`](./REAL_MODE_STAGING_SMOKE.md) before raising frequency.

## 4. Manual pre-flight

```powershell
$env:ARCHLUCID_API_KEY = '<staging-smoke-api-key>'
$env:ARCHLUCID_API_BASE_URL = 'https://staging.archlucid.net'
pwsh -NoProfile -File ./scripts/staging-smoke.ps1
```

Expect `STAGING SMOKE OK runId=…`.

Forced-fail page proof: set `skip_page_on_failure=false`, break auth briefly, confirm PagerDuty/webhook fires, then restore.

## 5. Related

- MVO checklist: [`SOLO_OPERATOR_MVO_OBSERVABILITY.md`](../operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md)
- Real-mode (no commit): [`REAL_MODE_STAGING_SMOKE.md`](./REAL_MODE_STAGING_SMOKE.md)
- Hosted health/showcase: [`.github/workflows/hosted-saas-probe.yml`](../../.github/workflows/hosted-saas-probe.yml)
- Stale-run paging (TB-958): [`STALE_IN_FLIGHT_RUNS.md`](./STALE_IN_FLIGHT_RUNS.md)

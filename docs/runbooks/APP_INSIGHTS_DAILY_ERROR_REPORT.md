# App Insights daily error report (GitHub Actions)

**Audience:** Platform owner / on-call reviewing hosted dev telemetry without opening Azure Portal daily.

**Workflow:** [`.github/workflows/app-insights-daily-error-report.yml`](../../.github/workflows/app-insights-daily-error-report.yml)  
**Scripts:** `scripts/ci/report_app_insights_daily_errors.py`, `scripts/ci/app_insights_report_email.py`

---

## What it does

1. Runs **daily at 07:30 America/New_York** (and on `workflow_dispatch`).
2. Authenticates to Azure with the **dev** GitHub Environment OIDC app (`azure/login@v3`).
3. Queries the linked **Log Analytics** workspace (`AppExceptions`, failed `AppRequests` ≥500, failed `AppDependencies`).
4. Compares normalized error **signatures** against a cached baseline so only **new** signatures trigger email.
5. Uploads JSON + Markdown artifacts and updates the baseline cache for the next run.

Email is sent **only when there is at least one new signature** (`--only-when-new`). Recurring errors stay in the Markdown artifact and step summary but do not spam your inbox.

---

## One-time setup

Configure the **dev** GitHub Environment (same OIDC app as CD):

| Kind | Name | Example / notes |
|------|------|-----------------|
| Secret | `AZURE_CLIENT_ID` | Federated app registration (already used by CD) |
| Secret | `AZURE_TENANT_ID` | Entra tenant |
| Secret | `AZURE_SUBSCRIPTION_ID` | Subscription hosting dev |
| Secret | `APP_INSIGHTS_REPORT_EMAIL_TO` | Your mailbox |
| Variable | `ARCHLUCID_LOG_ANALYTICS_WORKSPACE_ID` | Log Analytics **customerId** (dev centralus: `c741f930-21ec-45ec-adfb-37a7f8aa87f7` for `law-archlucid-ca` in `rg-ArchLucid-dev-cus`) |
| Variable | `APP_INSIGHTS_DAILY_REPORT_ENABLED` | Optional; set `false` to disable without deleting secrets |

### Email transport (pick one)

**Preferred — Azure Communication Services Email**

| Kind | Name | Notes |
|------|------|-------|
| Variable | `ACS_EMAIL_ENDPOINT` | ACS Email resource endpoint (`https://….communication.azure.com`) |
| Variable | `ACS_EMAIL_SENDER_ADDRESS` | Verified sender, e.g. `DoNotReply@….azurecomm.net` |

Grant the GitHub federated identity **Contributor** (or a narrower custom role) on the Communication Services resource so `emails:send` succeeds.

**Fallback — SMTP**

| Kind | Name |
|------|------|
| Secret | `SMTP_HOST` |
| Secret | `SMTP_PORT` (optional, default 587) |
| Secret | `SMTP_USERNAME` |
| Secret | `SMTP_PASSWORD` |
| Secret | `SMTP_FROM_ADDRESS` |
| Variable | `SMTP_USE_TLS` (optional, default true) |

If neither ACS nor SMTP is configured, the workflow still produces artifacts but skips send (noop).

### Azure RBAC for queries

The federated app needs **Log Analytics Reader** on the workspace (or subscription/resource group scope).

---

## Manual run

GitHub → **Actions** → **Ops: App Insights daily error report** → **Run workflow**.

---

## Local / offline test

```powershell
python scripts/ci/report_app_insights_daily_errors.py `
  --workspace-id c741f930-21ec-45ec-adfb-37a7f8aa87f7 `
  --fixture-dir fixtures/app-insights-daily-errors `
  --baseline-in fixtures/app-insights-daily-errors/baseline.json `
  --json-out artifacts/app-insights-daily-errors/local/daily-error-report.json `
  --markdown-out artifacts/app-insights-daily-errors/local/daily-error-report.md

python -m unittest discover -s scripts/ci/tests -p test_report_app_insights_daily_errors.py
```

Live query (requires `az login`):

```powershell
$env:ARCHLUCID_LOG_ANALYTICS_WORKSPACE_ID = 'c741f930-21ec-45ec-adfb-37a7f8aa87f7'
python scripts/ci/report_app_insights_daily_errors.py `
  --json-out artifacts/app-insights-daily-errors/live/daily-error-report.json `
  --markdown-out artifacts/app-insights-daily-errors/live/daily-error-report.md
```

---

## Signature model

Signatures normalize GUIDs and numeric tokens so the same SQL or HTTP failure does not create duplicate “new” rows when ids change. Categories:

- `ex:` — `AppExceptions` (`Type`, `ProblemId`, normalized `OuterMessage`)
- `req:` — failed HTTP requests (`Name`, `ResultCode`)
- `dep:` — failed dependencies (`Type`, `Name`, `ResultCode`)

Baseline schema: `archlucid.app-insights-error-baseline.v1` (GitHub Actions cache).

---

## Related docs

- [`docs/library/OBSERVABILITY.md`](../library/OBSERVABILITY.md) — export paths and alert routing
- [`docs/runbooks/COMMON_ERRORS.md`](COMMON_ERRORS.md) — triage for recurring SQL / tenant errors

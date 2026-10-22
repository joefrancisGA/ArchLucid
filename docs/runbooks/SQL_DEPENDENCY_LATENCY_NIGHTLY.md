# SQL dependency latency nightly report

**Audience:** Platform owner reviewing SQL call latency without opening Azure Portal daily.

**Workflow:** [`.github/workflows/sql-dependency-latency-nightly.yml`](../../.github/workflows/sql-dependency-latency-nightly.yml)  
**Scripts:** `scripts/ci/report_sql_dependency_latency_nightly.py`, `scripts/ci/sql_dependency_latency_telemetry.py`

---

## What it does

1. Runs **nightly at 06:00 America/New_York** (and on `workflow_dispatch`).
2. Queries Log Analytics `AppDependencies` for Azure SQL targets (`*.database.windows.net`) over the last 24 hours.
   Note: in this workspace SQL often appears as `DependencyType=Other` (not `SQL`); filtering by Target is required.
3. Summarizes **count, p50, p95, p99** by dependency `Name` + `Target`.
4. Emails the digest to `APP_INSIGHTS_REPORT_EMAIL_TO` (same mailbox as the App Insights error digest).
5. Uploads JSON + Markdown artifacts.

Unlike the error digest, this report **always emails** (even when the window is empty).

---

## Configuration

Reuses the same **dev** environment secrets/vars as [`APP_INSIGHTS_DAILY_ERROR_REPORT.md`](APP_INSIGHTS_DAILY_ERROR_REPORT.md):

- `ARCHLUCID_LOG_ANALYTICS_WORKSPACE_ID`
- `APP_INSIGHTS_REPORT_EMAIL_TO`
- `SMTP_*` (or ACS email vars)
- Azure OIDC (`AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID`)

Set `APP_INSIGHTS_DAILY_REPORT_ENABLED=false` to disable both digests.

### Comcast / Xfinity SMTP notes

GitHub Actions runners authenticate to `smtp.comcast.net:587`. If the email step logs `535 authentication rejected`:

1. Confirm the mailbox password still works in a normal mail client.
2. Prefer an **Xfinity app password** (if available for the account) over the interactive login password.
3. Update the secret without pasting into chat:

```powershell
gh secret set SMTP_PASSWORD --env dev
```

4. Re-run **Ops: SQL dependency latency nightly** from Actions.

---

## Local fixture test

```powershell
python scripts/ci/report_sql_dependency_latency_nightly.py `
  --workspace-id c741f930-21ec-45ec-adfb-37a7f8aa87f7 `
  --fixture-json fixtures/sql-dependency-latency/sample-query.json `
  --json-out artifacts/sql-dependency-latency/local/report.json `
  --markdown-out artifacts/sql-dependency-latency/local/report.md

python -m unittest discover -s scripts/ci/tests -p test_report_sql_dependency_latency_nightly.py
```

---

## Related

- Named-query p95 allowlist (TB-003): `tests/performance/README.md`
- Observability export: [`docs/library/OBSERVABILITY.md`](../library/OBSERVABILITY.md)

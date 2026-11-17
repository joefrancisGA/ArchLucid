# Read-only Azure SQL Monitor capacity collector

`scripts/ops/collect_azure_sql_monitor_capacity.py` retrieves approved Azure SQL database metrics through Azure Resource Manager's `Microsoft.Insights/metrics` REST endpoint. It requires an existing Azure CLI login or OIDC-authenticated CLI session with a **read-only Monitoring Reader** assignment scoped to the approved test database. The script obtains a short-lived ARM token with `az account get-access-token`; it does not persist tokens or include them in JSON artifacts. No service principals, secrets, or credentials are configured in the repo.

Only database resource IDs ending in `ArchLucidCapacityTest_...` are accepted. The caller specifies an explicit UTC time window up to 24 hours and one allowlisted metric (`cpu_percent`, `dtu_consumption_percent`, `storage_percent`, `log_write_percent`). One-minute average samples are normalized to the existing `correlate_sql_azure_monitor.py` observation shape. Missing, ambiguous, dimensioned, negative, out-of-window, or unordered data fail closed. Metric availability varies by Azure SQL service tier.

Example after approved test benchmark:
```sh
python3 scripts/ops/collect_azure_sql_monitor_capacity.py \
  --resource-id "/subscriptions/REPLACE/resourceGroups/REPLACE/providers/Microsoft.Sql/servers/REPLACE/databases/ArchLucidCapacityTest_Bench" \
  --metric cpu_percent --start 2026-10-28T12:00:00Z --end 2026-10-28T12:10:00Z \
  --output artifacts/capacity/azure-sql-monitor.json
python3 scripts/ci/correlate_sql_azure_monitor.py \
  --benchmark artifacts/capacity/azure-sql-benchmark.json \
  --monitor artifacts/capacity/azure-sql-monitor.json \
  --output artifacts/capacity/azure-sql-correlation.json
```

The Azure Monitor series measures **resource-level aggregate utilization**, not CPU-seconds attributable to an individual query. One-minute Azure metric granularity may be too coarse for a short benchmark, and no in-window observations can legitimately produce correlation failure. A matching resource ID string is not cryptographic proof of benchmark execution identity. No production workload, deployment, or billing modification is performed. Cloud metrics have not been fetched in this change.

API reference: https://learn.microsoft.com/en-us/azure/azure-monitor/platform/rest-api-walkthrough

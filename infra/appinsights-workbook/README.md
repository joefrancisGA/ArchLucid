# Application Insights workbook (reference)

**Purpose.** Store **operators-as-code** KQL snippets and workbook JSON exports beside Terraform so on-call can rebuild dashboards after greenfield deployments.

## Usage

1. In Azure Portal → Application Insights → **Workbooks** → create or import a workbook.
2. Export the workbook definition (**JSON**) when it stabilizes; commit a sanitized copy under this folder (strip subscription-specific IDs if your policy requires it).
3. Wire data sources with **private** ingestion endpoints per [OBSERVABILITY.md](../../docs/library/OBSERVABILITY.md) and your landing zone — **never** publish SMB or broad public storage as a telemetry sink.

## Starter queries

### API request rate (replace table/schema with your deployment)

```kusto
requests
| summarize RequestCount = count() by bin(timestamp, 5m), resultCode
| order by timestamp desc
```

### Failed dependencies

```kusto
dependencies
| where success == false
| project timestamp, name, type, data, resultCode
| order by timestamp desc
| take 200
```

## Related

- `infra/terraform-monitoring` — IaC entry for monitoring resources.
- [OBSERVABILITY.md](../../docs/library/OBSERVABILITY.md) — product-side metrics and OTEL conventions.

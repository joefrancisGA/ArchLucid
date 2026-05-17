> **Scope:** Operator runbook for pseudonymized internal cross-tenant analytics rollups (`dbo.InternalCrossTenantRollupDaily`); not a tenant-facing feature or DPA cross-tenant pattern library (see ADR 0031).

# Internal cross-tenant analytics rollups

## Who may query

| Actor | Access |
|-------|--------|
| JWT with **Operator** (or higher) internal role | `GET/POST /v1/internal/analytics/cross-tenant/daily*` via `RequireOperatorRole` |
| Platform engineers / founders | Same APIs or read `dbo.InternalCrossTenantRollupDaily` on the **system catalog** with break-glass SQL credentials |
| Tenant users | **No access** — no UI opt-in; rollups are internal BI only |

## Data stored

- **Keyed by:** `AnalyticsTenantKey` (64-char lowercase hex HMAC-SHA256 of tenant id + `ArchLucid:InternalCrossTenantAnalytics:PseudonymizationSalt`).
- **Never stored:** tenant slug, domain, display name, raw `TenantId`, review text, findings bodies, evidence filenames, manifest excerpts.
- **Metrics:** non-archived run counts, completed-run durations, `RunTelemetry.EstimatedHoursSaved`, optional `LlmDailyTenantTokenWindowState` token totals for the UTC day.

## Operations

1. **Configure salt** in Key Vault / app settings (`ArchLucid:InternalCrossTenantAnalytics:PseudonymizationSalt`). Rotating salt changes surrogate keys (historical rows remain under old keys until backfilled).
2. **Scheduled job:** `InternalCrossTenantRollupHostedService` (leader lease `hosted:internal-cross-tenant-rollup`) upserts the current UTC calendar day on `RollupIntervalHours` (default 24). Disable with `RollupJobEnabled: false`.
3. **On-demand:** `POST /v1/internal/analytics/cross-tenant/daily/refresh?rollupDate=YYYY-MM-DD`
4. **Read:** `GET /v1/internal/analytics/cross-tenant/daily?rollupDate=YYYY-MM-DD`
5. **Export:** `GET /v1/internal/analytics/cross-tenant/daily/export?rollupDate=YYYY-MM-DD&format=csv|json`

## Security notes

- Table has **no RLS**; restrict SQL logins to platform operators.
- Do not join rollup rows to `dbo.Tenants` in shared dashboards without a documented break-glass process.
- Portfolio summary without per-tenant keys remains at `GET /v1/internal/analytics/cross-tenant`.

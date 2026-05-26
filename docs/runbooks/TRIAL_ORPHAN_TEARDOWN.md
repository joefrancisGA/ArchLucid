> **Scope:** Manual teardown of orphaned trial tenant SQL catalogs when control-plane metadata and bindings diverge (TB-017). Unattended purge remains deferred.

> **Spine doc:** [`../START_HERE.md`](../START_HERE.md).

# Trial orphaned-catalog teardown (manual SOP)

## Objective

Reclaim Azure SQL storage from **dormant trial catalogs** whose `dbo.TenantDatabaseBindings` row is **Failed**, **Pending** without a matching active tenant, or whose tenant row was removed while a catalog still exists. This runbook is **manual** — do not automate DROP without an explicit product decision.

## When to use

| Signal | Action |
|--------|--------|
| FinOps reports elastic-pool growth with no matching active trials | Run **§3** inventory; tear down only rows matching **§4** criteria |
| Signup failed mid-provision (`ProvisioningState = Failed`) | Confirm tenant row state; follow **§5** order |
| Warm-catalog claim failed after `dbo.Tenants` insert | See [`TENANT_DATABASE_TOPOLOGY.md`](../library/TENANT_DATABASE_TOPOLOGY.md) warm-pool notes; orphan `archlucid_warm_*` DBs may remain |

## Prerequisites

- Break-glass SQL login on the **system** catalog and permission to `DROP DATABASE` on the tenant logical server (or equivalent Terraform operator role).
- Access to Azure Portal / `az sql db` for the target elastic pool.
- Familiarity with [`TRIAL_LIFECYCLE.md`](TRIAL_LIFECYCLE.md) and [`TENANT_SQL_TOPOLOGY_RUNBOOK.md`](TENANT_SQL_TOPOLOGY_RUNBOOK.md).

## Inventory query (system catalog)

Run on the **control-plane** database. Adjust `@MinIdleDays` as needed.

```sql
-- Dormant trial bindings: Pending/Failed or tenant missing; trial tier only.
DECLARE @MinIdleDays int = 30;

SELECT
    b.TenantId,
    b.SqlLogicalDatabaseName,
    b.ProvisioningState,
    b.LastError,
    b.UpdatedUtc,
    t.TrialStatus,
    t.TrialExpiresUtc,
    t.OffboardedUtc
FROM dbo.TenantDatabaseBindings AS b
LEFT JOIN dbo.Tenants AS t ON t.Id = b.TenantId
WHERE
    (
        b.ProvisioningState IN (0, 2) -- Pending, Failed
        OR t.Id IS NULL
        OR (t.Tier = 0 AND t.TrialStatus IN (3, 4, 5)) -- illustrative: expired/read-only/export-only
    )
    AND b.UpdatedUtc < DATEADD(day, -@MinIdleDays, SYSUTCDATETIME())
ORDER BY b.UpdatedUtc ASC;
```

**Warm standby rows** (no tenant yet):

```sql
SELECT StandbyId, SqlLogicalDatabaseName, SchemaReadyUtc, CreatedUtc
FROM dbo.WarmTenantCatalogStandby
WHERE ClaimedUtc IS NULL
  AND CreatedUtc < DATEADD(day, -7, SYSUTCDATETIME());
```

## Teardown order (safe)

1. **Verify** the tenant is not in `TrialStatus = Active` with recent sign-in audit (`AuditEvents` / support bundle).
2. **Export** if legal hold or customer request: run existing export-only path per [`TRIAL_LIFECYCLE.md`](TRIAL_LIFECYCLE.md).
3. **Delete binding** (system DB): `DELETE FROM dbo.TenantDatabaseBindings WHERE TenantId = @TenantId` (only after confirmation).
4. **Drop catalog** on SQL logical server: `DROP DATABASE [archlucid_tenant_…]` or warm name `archlucid_warm_…`.
5. **Remove warm standby row** if applicable: `DELETE FROM dbo.WarmTenantCatalogStandby WHERE SqlLogicalDatabaseName = @DbName`.
6. **Invalidate** any cached resolver entries (restart API worker pod or wait for cache TTL).

## Metrics / alerts

| Metric / query | Purpose |
|----------------|---------|
| Count of `TenantDatabaseBindings` where `ProvisioningState = Failed` | Spike detection after deploy |
| Elastic pool `storage_percent` + binding count | Capacity planning |
| `WarmTenantCatalogStandby` unclaimed age | Replenish worker health |

## Security

- Teardown credentials must **not** be the runtime app identity used by `ArchLucid.Api`.
- Do not copy customer manifest blobs to personal machines during investigation.
- Log each manual teardown in the ops ticket with `TenantId`, `SqlLogicalDatabaseName`, and operator id.

## Related

- [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) **TB-017**, **TB-018**
- [`docs/go-to-market/TRIAL_AND_SIGNUP.md`](../go-to-market/TRIAL_AND_SIGNUP.md)

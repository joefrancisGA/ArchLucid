> **Scope:** Runbook for **system vs tenant** SQL catalogs when `ArchLucid:SqlTopology:Mode=SystemWithPerTenantCatalogs`; not application-layer debugging or generic SQL performance tuning.

# Tenant SQL topology — operations

## Objective

Operators can triage **control-plane** failures separately from **tenant catalog** failures without scanning every tenant on each readiness probe.

## Symptoms

| Symptom | Likely plane | Checks |
|--------|--------------|--------|
| `GET /health/ready` — **`sql_system_plane` unhealthy** | System catalog | `ConnectionStrings:ArchLucidSystem`, private DNS to SQL, firewall, identity |
| **`database` unhealthy, `sql_system_plane` healthy** | Primary / template catalog or scoped tenant path | `ConnectionStrings:ArchLucid`, `TenantCatalogConnectionStringTemplate`, binding row state |
| Registration / trial fails after tenant insert | Tenant provisioning | `TenantDatabaseBindings.ProvisioningState`, app logs from `SqlTenantSqlCatalogProvisioner`, tenant DbUp output |
| Admin list works; scoped API fails | Tenant routing | Missing **Active** binding; resolver cache (`TenantBindingCacheSeconds`); ambient tenant scope |

## Commands (redacted)

- **Do not** paste full connection strings into tickets; use **server name + database name** only.
- Compare **`DevelopmentTenantConnectionString`** (local) vs Terraform-provisioned catalog names (`archlucid_tenant_<guid>` pattern).

## Recovery

1. **System DB down:** restore **system** catalog first; re-run `DatabaseMigrator.RunSystem` on greenfield DR host if needed.
2. **Single tenant DB failed:** restore **that** catalog; re-run `DatabaseMigrator.RunTenant` against restored DB; verify binding **Active**.
3. **Stale binding:** mark **Failed** in DB, fix root cause, re-invoke provisioning workflow or manual `RunTenant` + `MarkActive`.

## References

- [TENANT_DATABASE_TOPOLOGY.md](../library/TENANT_DATABASE_TOPOLOGY.md)
- [SQL_SCRIPTS.md](../library/SQL_SCRIPTS.md)
- `infra/modules/azure-sql-tenant-pool/` (Terraform sketch)

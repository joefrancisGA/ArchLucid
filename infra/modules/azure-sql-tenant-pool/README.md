# Azure SQL elastic pool + tenant database (Terraform sketch)

> **Scope:** Represents **database-per-tenant** hosting next to a **system** catalog on Azure SQL. Aligns with private networking + least-privilege from your landing-zone modules; this module is a **minimal** building block—not a full subscription deployment.

## Objective

Provide Terraform resources for:

- One **system** database (control plane / bindings).
- One **elastic pool** for pooled tenant catalogs.
- Zero or more **tenant** databases created in the pool (or referenced as data sources if provisioned app-side).

## Variables (representative)

See `variables.tf` — key inputs:

- `location`, `resource_group_name`
- `server_name` / private-endpoint linkage (consume from existing SQL server module)
- `system_database_name`, `elastic_pool_name`, `sku` (pool DTU/vCore family)
- Optional `tenant_database_names` for IaC-owned catalogs

## Security

- **No** public SMB/445 exposure; SQL server should use **private endpoint** only (parent module).
- SQL authentication vs Entra ID — follow org standard; store secrets in Key Vault.
- Runtime app identity: **read/write** tenant DBs; provisioning identity: **`dbmanager`** / equivalent only on automation principal.

## Cost / scale

- Elastic pools amortize DTU/vCore across many small tenant DBs; dedicated SKUs for enterprise tenants escape the pool via separate module instance or variables.

## Files

- `main.tf` — `azurerm_mssql_elasticpool`, `azurerm_mssql_database` resources
- `variables.tf`, `outputs.tf`

## Operational split

- **Terraform** owns server, pool, budgets, private endpoints, and optionally **empty** tenant databases.
- **Application** (`SqlTenantSqlCatalogProvisioner`) runs **tenant-plane DbUp** and updates **`TenantDatabaseBindings`** when bindings are app-led.

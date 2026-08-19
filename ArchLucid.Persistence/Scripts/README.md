# `ArchLucid.Persistence/Scripts`

| File | Role |
|------|------|
| **`ArchLucid.sql`** | SQL Server **consolidated** schema (tenant / product plane). Copied to build output for **`SqlSchemaBootstrapper`**. |
| **`ArchLucid.System.sql`** | SQL Server **consolidated** schema (system / control-plane catalog only). Copied to build output; runs after **`DatabaseMigrator.RunSystem`** on split-topology hosts. |
| **`ArchLucid_Unified_Schema.sql`** | **Generated — do not edit by hand.** IaC reference subset derived from **`ArchLucid.sql`**; never applied by DbUp. Regenerate: `python scripts/ci/build_archlucid_unified_schema_sql.py`. CI drift gate: `scripts/ci/check_archlucid_unified_schema_snapshot.py` (**TB-066**). |
| **`Maintenance/QueryStore-ArchLucid-hotpaths.sql`** | Optional **read-only** Query Store rankings (duration / logical reads / ArchLucid table slice). Run against production-like workload DB after telemetry confirms slow paths. |

**Full documentation:** [../../docs/SQL_SCRIPTS.md](../../docs/library/SQL_SCRIPTS.md) (execution pathways, migration catalog, change checklist, troubleshooting).

DbUp incremental scripts live in **`../Migrations/`**, not in this folder.

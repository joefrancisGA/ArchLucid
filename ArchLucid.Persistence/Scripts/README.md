# `ArchLucid.Persistence/Scripts`

| File | Role |
|------|------|
| **`ArchLucid.sql`** | SQL Server **consolidated** schema (tenant / product plane). Copied to build output for **`SqlSchemaBootstrapper`**. |
| **`ArchLucid.System.sql`** | SQL Server **consolidated** schema (system / control-plane catalog only). Copied to build output; runs after **`DatabaseMigrator.RunSystem`** on split-topology hosts. |
| **`Maintenance/QueryStore-ArchLucid-hotpaths.sql`** | Optional **read-only** Query Store rankings (duration / logical reads / ArchLucid table slice). Run against production-like workload DB after telemetry confirms slow paths. |

**Full documentation:** [../../docs/SQL_SCRIPTS.md](../../docs/library/SQL_SCRIPTS.md) (execution pathways, migration catalog, change checklist, troubleshooting).

DbUp incremental scripts live in **`../Migrations/`**, not in this folder.

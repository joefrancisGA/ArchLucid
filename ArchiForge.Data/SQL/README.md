# `ArchiForge.Data/SQL`

| File | Role |
|------|------|
| **`ArchiForge.sql`** | SQL Server **consolidated** schema (API + authority + decisioning). Copied to `ArchiForge.Persistence` output as `Scripts/ArchiForge.sql` for **`SqlSchemaBootstrapper`**. |
| **`ArchiForge.Sqlite.sql`** | SQLite consolidated schema; embedded in **ArchiForge.Data** as `ArchiForge.Data.SQL.ArchiForge.Sqlite.sql` for **`SqliteConnectionFactory`**. |

**Full documentation:** [../../docs/SQL_SCRIPTS.md](../../docs/SQL_SCRIPTS.md) (three execution pathways, migration catalog, change checklist, troubleshooting).

DbUp incremental scripts live in **`../Migrations/`**, not in this folder.

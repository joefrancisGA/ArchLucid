# `ArchiForge.Data/Migrations`

SQL Server **incremental** migrations consumed by **DbUp** at API startup.

- **Embedded** in assembly `ArchiForge.Data` (`EmbeddedResource Include="Migrations\*.sql"`).
- **Ordering:** Resource names must sort lexicographically — use prefixes `001_`, `002_`, … `017_`, … (see `ArchiForge.Api.Tests/DatabaseMigrationScriptTests.cs`).
- **Skipped** when the connection string is SQLite (`DatabaseMigrator`).

**Catalog, consolidated scripts, Persistence bootstrap, and change workflow:** [../../docs/SQL_SCRIPTS.md](../../docs/SQL_SCRIPTS.md).

After editing migrations, update **`SQL/ArchiForge.sql`** (and usually **`SQL/ArchiForge.Sqlite.sql`**) so greenfield installs and tests stay aligned.

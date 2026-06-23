using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.TestSupport;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

/// <summary>
///     TB-069 integration coverage for <see cref="GreenfieldBaselineMigrationRunner" /> repair paths on real SQL Server
///     catalogs.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class GreenfieldBaselineMigrationRunnerSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Empty_catalog_replays_baseline_and_stamps_journal_through_050()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        string connectionString = await CreateIsolatedCatalogConnectionStringAsync();

        GreenfieldBaselineMigrationRunner.TryApplyBaselineAndStampThrough050(connectionString);

        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync(CancellationToken.None);

        bool has001 = await JournalContainsInitialSchemaAsync(connection);
        int stampedThrough050 = await CountStampedScriptsThrough050Async(connection);

        has001.Should().BeTrue();
        stampedThrough050.Should().BeGreaterThan(0);

        bool auditEventsExists = await ObjectExistsAsync(connection, "dbo.AuditEvents");

        auditEventsExists.Should().BeTrue();
    }

    [SkippableFact]
    public async Task Partial_journal_missing_001_row_is_repaired_without_duplicate_object_errors()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        string connectionString = await CreateIsolatedCatalogConnectionStringAsync();

        DatabaseMigrator.Run(connectionString);

        await using (SqlConnection connection = new(connectionString))
        {
            await connection.OpenAsync(CancellationToken.None);

            await using SqlCommand delete001 = new(
                "DELETE FROM dbo.SchemaVersions WHERE ScriptName LIKE N'%001_InitialSchema%';",
                connection);

            int deleted = await delete001.ExecuteNonQueryAsync(CancellationToken.None);

            deleted.Should().Be(1);
        }

        Action repair = () => GreenfieldBaselineMigrationRunner.TryApplyBaselineAndStampThrough050(connectionString);

        repair.Should().NotThrow();

        await using SqlConnection verify = new(connectionString);
        await verify.OpenAsync(CancellationToken.None);

        bool has001 = await JournalContainsInitialSchemaAsync(verify);

        has001.Should().BeTrue();
    }

    [SkippableFact]
    public async Task ArchitectureRequests_in_non_dbo_schema_triggers_drift_stamp_without_replaying_001()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        string connectionString = await CreateIsolatedCatalogConnectionStringAsync();
        string schemaName = "tb069_" + Guid.NewGuid().ToString("N")[..6];

        await using (SqlConnection connection = new(connectionString))
        {
            await connection.OpenAsync(CancellationToken.None);

            await using SqlCommand createSchema = new($"CREATE SCHEMA [{schemaName}];", connection);
            await createSchema.ExecuteNonQueryAsync(CancellationToken.None);

            await using SqlCommand createTable = new(
                $"""
                 CREATE TABLE [{schemaName}].[ArchitectureRequests] (
                     RequestId NVARCHAR(64) NOT NULL PRIMARY KEY);
                 """,
                connection);

            await createTable.ExecuteNonQueryAsync(CancellationToken.None);
        }

        Action repair = () => GreenfieldBaselineMigrationRunner.TryApplyBaselineAndStampThrough050(connectionString);

        repair.Should().NotThrow();

        await using SqlConnection verify = new(connectionString);
        await verify.OpenAsync(CancellationToken.None);

        bool has001 = await JournalContainsInitialSchemaAsync(verify);

        has001.Should().BeTrue();
    }

    [SkippableFact]
    public async Task Duplicate_dbo_ArchitectureRequests_triggers_drift_repair_instead_of_failing_full_replay()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        string connectionString = await CreateIsolatedCatalogConnectionStringAsync();

        await using (SqlConnection connection = new(connectionString))
        {
            await connection.OpenAsync(CancellationToken.None);

            await using SqlCommand createTable = new(
                """
                CREATE TABLE dbo.ArchitectureRequests (
                    RequestId NVARCHAR(64) NOT NULL PRIMARY KEY);
                """,
                connection);

            await createTable.ExecuteNonQueryAsync(CancellationToken.None);
        }

        Action repair = () => GreenfieldBaselineMigrationRunner.TryApplyBaselineAndStampThrough050(connectionString);

        repair.Should().NotThrow();

        await using SqlConnection verify = new(connectionString);
        await verify.OpenAsync(CancellationToken.None);

        bool has001 = await JournalContainsInitialSchemaAsync(verify);

        has001.Should().BeTrue();
    }

    private async Task<string> CreateIsolatedCatalogConnectionStringAsync()
    {
        string suffix = Guid.NewGuid().ToString("N")[..10];
        string databaseName = "ArchLucidBaselineTb069_" + suffix;

        SqlConnectionStringBuilder builder =
            new(fixture.ConnectionString) { InitialCatalog = databaseName };

        string connectionString =
            SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(builder.ConnectionString);

        await SqlServerTestCatalogCommands.EnsureCatalogExistsAsync(connectionString, CancellationToken.None);

        return connectionString;
    }

    private static async Task<bool> JournalContainsInitialSchemaAsync(SqlConnection connection)
    {
        await using SqlCommand command = new(
            """
            SELECT CASE WHEN EXISTS (
                SELECT 1
                FROM dbo.SchemaVersions
                WHERE ScriptName LIKE N'%001_InitialSchema%') THEN 1 ELSE 0 END;
            """,
            connection);

        object? scalar = await command.ExecuteScalarAsync(CancellationToken.None);

        return Convert.ToInt32(scalar, System.Globalization.CultureInfo.InvariantCulture) != 0;
    }

    private static async Task<int> CountStampedScriptsThrough050Async(SqlConnection connection)
    {
        await using SqlCommand command = new(
            """
            SELECT COUNT(*)
            FROM dbo.SchemaVersions
            WHERE ScriptName LIKE N'%.Migrations.0%';
            """,
            connection);

        object? scalar = await command.ExecuteScalarAsync(CancellationToken.None);

        return Convert.ToInt32(scalar, System.Globalization.CultureInfo.InvariantCulture);
    }

    private static async Task<bool> ObjectExistsAsync(SqlConnection connection, string twoPartName)
    {
        await using SqlCommand command = new(
            "SELECT CASE WHEN OBJECT_ID(@Name, N'U') IS NOT NULL THEN 1 ELSE 0 END;",
            connection);

        command.Parameters.AddWithValue("@Name", twoPartName);

        object? scalar = await command.ExecuteScalarAsync(CancellationToken.None);

        return Convert.ToInt32(scalar, System.Globalization.CultureInfo.InvariantCulture) != 0;
    }
}

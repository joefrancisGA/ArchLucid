using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Application.Tests.Runs.Finalization;

/// <summary>
///     Lightweight SQL checks for finalization stored procedures (skipped unless <c>ARCHLUCID_SQL_TEST</c> is set).
/// </summary>
[Trait("Category", "SqlIntegration")]
public sealed class ManifestFinalizationSqlProcedureSurfaceTests
{
    /// <summary>
    ///     Confirms <c>dbo.sp_FinalizeManifest</c> is deployed to the configured catalog (CI / local SQL regression).
    /// </summary>
    [SkippableFact]
    public async Task dbo_sp_FinalizeManifest_exists_when_sql_catalog_configured()
    {
        string? raw = Environment.GetEnvironmentVariable(TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable);

        Skip.If(
            string.IsNullOrWhiteSpace(raw),
            "Set " + TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable + " to run this SQL integration test.");

        // CI provides a fresh SQL container: catalog does not exist until we create it and run DbUp (same as SqlServerPersistenceFixture).
        string normalized = SqlServerIntegrationTestConnections.NormalizePersistenceConnectionString(
            raw.Trim(),
            "ArchLucidPersistenceTests");

        await SqlServerTestCatalogCommands.EnsureCatalogExistsAsync(normalized, CancellationToken.None);

        DatabaseMigrator.Run(normalized);

        await using SqlConnection connection = new(normalized);
        await connection.OpenAsync();

        await using SqlCommand command = connection.CreateCommand();
        command.CommandText =
            "SELECT COUNT(1) FROM sys.procedures WHERE schema_id = SCHEMA_ID(N'dbo') AND name = N'sp_FinalizeManifest';";

        object? scalar = await command.ExecuteScalarAsync(CancellationToken.None);
        int count = Convert.ToInt32(scalar);

        count.Should().Be(1);
    }
}

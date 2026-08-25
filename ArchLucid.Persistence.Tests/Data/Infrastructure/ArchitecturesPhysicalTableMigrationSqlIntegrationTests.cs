using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

/// <summary>
///     Migration 323/324 must add run-header columns on the physical table after ADR 0064
///     renamed <c>dbo.Runs</c> to a synonym for <c>dbo.Reviews</c> (SQL 4909 otherwise).
/// </summary>
[Trait("Category", "SqlServerContainer")]
[Trait("Suite", "Persistence")]
public sealed class ArchitecturesPhysicalTableMigrationSqlIntegrationTests
{
    [SkippableFact]
    public void DbUp_adds_architecture_id_and_improve_loop_json_on_reviews_not_runs_synonym()
    {
        string connectionString = CreateEphemeralCatalogConnectionStringOrSkip();

        try
        {
            SqlServerTestCatalogCommands.EnsureCatalogExists(connectionString);
            DatabaseMigrator.Run(connectionString);

            using SqlConnection connection = new(connectionString);
            connection.Open();

            AssertRunsIsSynonymForReviews(connection);
            AssertTableExists(connection, "dbo.Reviews");
            AssertTableExists(connection, "dbo.Architectures");
            AssertColumnExists(connection, "dbo.Reviews", "ArchitectureId");
            AssertColumnExists(connection, "dbo.Reviews", "ImproveLoopEvidenceJson");
            AssertIndexExists(connection, "dbo.Reviews", "IX_Runs_ArchitectureId");
            AssertColumnExists(connection, "dbo.ArchitectureReviewRecurrenceSchedules", "ArchitectureId");
        }
        catch (Exception ex)
        {
            Skip.If(true, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason + " " + ex.Message);
            throw new InvalidOperationException("Unreachable: Skip.If should throw.", ex);
        }
    }

    private static string CreateEphemeralCatalogConnectionStringOrSkip()
    {
        try
        {
            string name = "ArchLucidArch323" + Guid.NewGuid().ToString("N");

            return SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString(name);
        }
        catch (InvalidOperationException ex)
        {
            Skip.If(true, ex.Message);
            throw new InvalidOperationException("Unreachable: Skip.If should throw.", ex);
        }
    }

    private static void AssertRunsIsSynonymForReviews(SqlConnection connection)
    {
        using SqlCommand command = connection.CreateCommand();
        command.CommandText = """
            SELECT COUNT(1)
            FROM sys.synonyms
            WHERE name = N'Runs'
              AND SCHEMA_NAME(schema_id) = N'dbo'
              AND PARSENAME(base_object_name, 1) = N'Reviews';
            """;
        object? result = command.ExecuteScalar();
        result.Should().NotBeNull();
        Convert.ToInt32(result, System.Globalization.CultureInfo.InvariantCulture)
            .Should()
            .Be(1, "dbo.Runs must be a synonym for dbo.Reviews after ADR 0064 / migration 295");
    }

    private static void AssertTableExists(SqlConnection connection, string qualifiedName)
    {
        using SqlCommand command = connection.CreateCommand();
        command.CommandText = "SELECT OBJECT_ID(@QualifiedName, N'U');";
        command.Parameters.AddWithValue("@QualifiedName", qualifiedName);
        object? result = command.ExecuteScalar();
        result.Should().NotBeNull().And.NotBe(DBNull.Value, $"table {qualifiedName} must exist");
    }

    private static void AssertColumnExists(SqlConnection connection, string qualifiedTable, string columnName)
    {
        using SqlCommand command = connection.CreateCommand();
        command.CommandText = "SELECT COL_LENGTH(@QualifiedTable, @ColumnName);";
        command.Parameters.AddWithValue("@QualifiedTable", qualifiedTable);
        command.Parameters.AddWithValue("@ColumnName", columnName);
        object? result = command.ExecuteScalar();
        result.Should().NotBe(DBNull.Value, $"column {qualifiedTable}.{columnName} must exist");
    }

    private static void AssertIndexExists(SqlConnection connection, string qualifiedTable, string indexName)
    {
        using SqlCommand command = connection.CreateCommand();
        command.CommandText = """
            SELECT COUNT(1)
            FROM sys.indexes
            WHERE name = @IndexName
              AND object_id = OBJECT_ID(@QualifiedTable);
            """;
        command.Parameters.AddWithValue("@IndexName", indexName);
        command.Parameters.AddWithValue("@QualifiedTable", qualifiedTable);
        object? result = command.ExecuteScalar();
        result.Should().NotBeNull();
        Convert.ToInt32(result, System.Globalization.CultureInfo.InvariantCulture)
            .Should()
            .Be(1, $"index {indexName} must exist on {qualifiedTable}");
    }
}

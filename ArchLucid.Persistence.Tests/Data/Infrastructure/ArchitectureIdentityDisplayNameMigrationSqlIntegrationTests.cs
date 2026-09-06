using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

/// <summary>Migration 366/367 add customer-visible architecture identity columns (CA-02/03).</summary>
[Trait("Category", "SqlServerContainer")]
[Trait("Suite", "Persistence")]
public sealed class ArchitectureIdentityDisplayNameMigrationSqlIntegrationTests
{
    [SkippableFact]
    public void DbUp_adds_architecture_display_name_and_draft_architecture_fk()
    {
        string connectionString = CreateEphemeralCatalogConnectionStringOrSkip();

        try
        {
            SqlServerTestCatalogCommands.EnsureCatalogExists(connectionString);
            DatabaseMigrator.Run(connectionString);

            using SqlConnection connection = new(connectionString);
            connection.Open();

            AssertColumnExists(connection, "dbo.Architectures", "DisplayName");
            AssertColumnExists(connection, "dbo.Architectures", "Description");
            AssertColumnExists(connection, "dbo.DraftRequests", "ArchitectureId");
            AssertForeignKeyExists(connection, "FK_DraftRequests_Architectures");
            AssertIndexExists(connection, "dbo.DraftRequests", "IX_DraftRequests_Scope_ArchitectureId");
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
            string name = "ArchLucidArch366" + Guid.NewGuid().ToString("N");

            return SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString(name);
        }
        catch (InvalidOperationException ex)
        {
            Skip.If(true, ex.Message);
            throw new InvalidOperationException("Unreachable: Skip.If should throw.", ex);
        }
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

    private static void AssertForeignKeyExists(SqlConnection connection, string foreignKeyName)
    {
        using SqlCommand command = connection.CreateCommand();
        command.CommandText = """
            SELECT COUNT(1)
            FROM sys.foreign_keys
            WHERE name = @ForeignKeyName;
            """;
        command.Parameters.AddWithValue("@ForeignKeyName", foreignKeyName);
        object? result = command.ExecuteScalar();
        result.Should().NotBeNull();
        Convert.ToInt32(result, System.Globalization.CultureInfo.InvariantCulture)
            .Should()
            .Be(1, $"foreign key {foreignKeyName} must exist");
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

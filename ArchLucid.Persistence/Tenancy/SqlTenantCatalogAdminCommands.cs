using System.Data;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>Master-catalog admin commands for warm standby provisioning (TB-018).</summary>
internal static class SqlTenantCatalogAdminCommands
{
    private const int CatalogAdminCommandTimeoutSeconds = 120;

    internal static async Task EnsureCatalogExistsAsync(string connectionString, CancellationToken cancellationToken)
    {
        SqlConnectionStringBuilder target = new(connectionString);

        if (string.IsNullOrWhiteSpace(target.InitialCatalog))
            throw new InvalidOperationException("Connection string must specify Initial Catalog.");

        string databaseName = target.InitialCatalog;
        target.InitialCatalog = "master";

        await using SqlConnection connection = new(target.ConnectionString);
        await connection.OpenAsync(cancellationToken);

        await using SqlCommand command = new(
            """
            DECLARE @name sysname = @db;
            IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = @name)
            BEGIN
              DECLARE @sql nvarchar(max) = N'CREATE DATABASE ' + QUOTENAME(@name);
              EXEC sys.sp_executesql @sql;
            END
            """,
            connection);

        command.CommandTimeout = CatalogAdminCommandTimeoutSeconds;

        SqlParameter dbParameter = command.Parameters.Add("@db", SqlDbType.NVarChar, 128);
        dbParameter.Value = databaseName;

        try
        {
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        catch (SqlException)
        {
            // Best-effort: restricted roles may not CREATE; caller handles migrate failure.
        }
    }
}

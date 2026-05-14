using Microsoft.Data.SqlClient;

namespace ArchLucid.TestSupport;

/// <summary>
///     Builds SQL Server connection strings for test assemblies. Resolution order is explicit and environment-driven.
/// </summary>
public static class SqlServerIntegrationTestConnections
{
    /// <summary>
    ///     Connection string for an ephemeral API test database (per factory). Does not create the catalog — callers use
    ///     <see cref="SqlServerTestCatalogCommands" />.
    /// </summary>
    /// <remarks>
    ///     <list type="number">
    ///         <item>
    ///             <description><see cref="TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable" /> if set.</description>
    ///         </item>
    ///         <item>
    ///             <description>
    ///                 <see cref="TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable" /> if set (same
    ///                 server/auth, new catalog).
    ///             </description>
    ///         </item>
    ///         <item>
    ///             <description>Windows: <c>localhost</c> + integrated security.</description>
    ///         </item>
    ///         <item>
    ///             <description>Non-Windows: throws — set one of the environment variables (Docker/CI SQL Server).</description>
    ///         </item>
    ///     </list>
    /// </remarks>
    public static string CreateEphemeralApiDatabaseConnectionString(string databaseName)
    {
        if (string.IsNullOrWhiteSpace(databaseName))
            throw new ArgumentException("Database name is required.", nameof(databaseName));

        string? apiHost =
            Environment.GetEnvironmentVariable(TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable);

        if (!string.IsNullOrWhiteSpace(apiHost))
            return WithDatabaseName(apiHost.Trim(), databaseName);

        string? persistence =
            Environment.GetEnvironmentVariable(TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable);

        if (!string.IsNullOrWhiteSpace(persistence))
            return WithDatabaseName(persistence.Trim(), databaseName);

        if (!OperatingSystem.IsWindows())
            throw new InvalidOperationException(
                "API integration tests require SQL Server. On Linux or macOS set environment variable "
                + TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable
                + " or "
                + TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable
                + " to a reachable instance (see docs/BUILD.md).");

        return BuildNormalizedWindowsLocalHostIntegratedConnectionString(databaseName);
    }

    /// <summary>
    ///     When <see cref="TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable" /> is unset on Windows, persistence
    ///     integration tries these connection strings in order: <c>localhost</c> + integrated security (same implicit default
    ///     as <see cref="CreateEphemeralApiDatabaseConnectionString" />), then <c>(localdb)\mssqllocaldb</c>.
    /// </summary>
    public static IEnumerable<string> EnumerateWindowsPersistenceFallbackConnectionStrings(string defaultCatalog)
    {
        if (string.IsNullOrWhiteSpace(defaultCatalog))
            throw new ArgumentException("Database catalog name is required.", nameof(defaultCatalog));

        if (!OperatingSystem.IsWindows())
            yield break;

        yield return BuildNormalizedWindowsLocalHostIntegratedConnectionString(defaultCatalog);

        SqlConnectionStringBuilder localDb = new()
        {
            DataSource = "(localdb)\\mssqllocaldb",
            InitialCatalog = defaultCatalog,
            IntegratedSecurity = true,
            MultipleActiveResultSets = true
        };

        yield return NormalizePersistenceConnectionString(localDb.ConnectionString, defaultCatalog);
    }

    /// <summary>
    ///     Normalizes a persistence test connection string: ensures <c>TrustServerCertificate</c> and default catalog when
    ///     missing.
    /// </summary>
    public static string NormalizePersistenceConnectionString(string raw, string defaultCatalog)
    {
        if (string.IsNullOrWhiteSpace(raw))
            throw new ArgumentException("Connection string is required.", nameof(raw));

        SqlConnectionStringBuilder builder = new(raw.Trim())
        {
            Encrypt = SqlConnectionEncryptOption.Mandatory,
            TrustServerCertificate = true
        };

        if (string.IsNullOrWhiteSpace(builder.InitialCatalog))
            builder.InitialCatalog = defaultCatalog;

        return builder.ConnectionString;
    }

    private static string WithDatabaseName(string templateConnectionString, string databaseName)
    {
        SqlConnectionStringBuilder builder = new(templateConnectionString.Trim())
        {
            Encrypt = SqlConnectionEncryptOption.Mandatory,
            TrustServerCertificate = true,
            InitialCatalog = databaseName,
            MultipleActiveResultSets = true
        };

        return builder.ConnectionString;
    }

    private static string BuildNormalizedWindowsLocalHostIntegratedConnectionString(string initialCatalog)
    {
        SqlConnectionStringBuilder windowsLocal = new()
        {
            DataSource = "localhost",
            InitialCatalog = initialCatalog,
            IntegratedSecurity = true,
            MultipleActiveResultSets = true
        };

        return NormalizePersistenceConnectionString(windowsLocal.ConnectionString, initialCatalog);
    }
}

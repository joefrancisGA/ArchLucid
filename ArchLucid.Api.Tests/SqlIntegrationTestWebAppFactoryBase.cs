using ArchLucid.TestSupport;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests;

/// <summary>
///     SQL-backed integration host with ephemeral catalog provisioning, env pinning, and shared
///     <see cref="BaseIntegrationTestFixture.ConfigureWebHost" /> test defaults.
/// </summary>
/// <remarks>
///     Subclasses choose authority vs. greenfield catalog posture via <see cref="SqlCatalogProvisioningProfile" />.
/// </remarks>
public abstract class SqlIntegrationTestWebAppFactoryBase : IntegrationTestWebAppFactoryBase
{
    private readonly IntegrationTestSqlCatalogEnvironment? _sqlCatalogEnvironment;

    private readonly bool _ownsSqlCatalog;

    /// <summary>Creates a factory that provisions a new ephemeral SQL catalog.</summary>
    protected SqlIntegrationTestWebAppFactoryBase(
        string storageProvider,
        SqlCatalogProvisioningProfile provisioningProfile)
        : base(storageProvider)
    {
        _ownsSqlCatalog = true;

        try
        {
            SqlConnectionString = CreateEphemeralSqlConnectionString(provisioningProfile.DatabaseNamePrefix);
            SqlServerTestCatalogCommands.EnsureCatalogExists(SqlConnectionString);

            if (provisioningProfile.PinSqlCatalogEnvironment)
                _sqlCatalogEnvironment = CreateSqlCatalogEnvironment(SqlConnectionString, provisioningProfile);
        }
        catch (Exception ex) when (provisioningProfile.WrapProvisioningErrors)
        {
            throw CreateProvisioningException(provisioningProfile, ex);
        }
    }

    /// <summary>Reuses an existing SQL catalog (second host in the same integration test).</summary>
    protected SqlIntegrationTestWebAppFactoryBase(
        string storageProvider,
        string existingSqlConnectionString,
        SqlCatalogProvisioningProfile provisioningProfile)
        : base(storageProvider)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(existingSqlConnectionString);

        _ownsSqlCatalog = false;
        SqlConnectionString = existingSqlConnectionString;

        if (provisioningProfile.PinSqlCatalogEnvironment)
            _sqlCatalogEnvironment = CreateSqlCatalogEnvironment(SqlConnectionString, provisioningProfile);
    }

    /// <summary>
    ///     Connection string for this factory's SQL Server catalog. Tests that open
    ///     <see cref="SqlConnection" /> must use this property so they hit the same database as the hosted API.
    /// </summary>
    public string SqlConnectionString
    {
        get;
    }

    /// <summary>Whether <see cref="ApplySqlPersistenceHostOverrides" /> runs during host configuration.</summary>
    protected virtual bool UsesSqlPersistenceHostOverrides => StorageProvider == "Sql";

    /// <inheritdoc />
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);

        if (UsesSqlPersistenceHostOverrides)
            ApplySqlPersistenceHostOverrides(builder, SqlConnectionString, GetAdditionalHostConfigurationOverrides());
    }

    /// <summary>Subclasses add test-only host keys merged into the early Sql bootstrap configuration.</summary>
    protected virtual IReadOnlyDictionary<string, string?>? GetAdditionalHostConfigurationOverrides()
    {
        return null;
    }

    /// <inheritdoc />
    protected override void AddCustomSettings(Dictionary<string, string?> settings)
    {
        settings["ArchLucid:StorageProvider"] = StorageProvider;
        settings["ConnectionStrings:ArchLucid"] = SqlConnectionString;

        ApplySqlCatalogCustomSettings(settings);
    }

    /// <summary>Authority vs. greenfield catalog keys beyond the shared connection string.</summary>
    protected virtual void ApplySqlCatalogCustomSettings(Dictionary<string, string?> settings)
    {
    }

    /// <inheritdoc />
    public override ValueTask DisposeAsync()
    {
        string? ownedCatalog = _ownsSqlCatalog ? SqlConnectionString : null;

        return IntegrationTestOwnedSqlCatalogDispose.DisposeHostAndDropOwnedCatalogAsync(
            FactoryLogPrefix,
            HostLifecycle,
            DisposeWebApplicationFactoryCoreAsync,
            ownedCatalog);
    }

    /// <inheritdoc />
    protected override void Dispose(bool disposing)
    {
        if (disposing)
            _sqlCatalogEnvironment?.Dispose();

        base.Dispose(disposing);

        if (!disposing || !_ownsSqlCatalog)
            return;

        IntegrationTestOwnedSqlCatalogDispose.TryDropOwnedCatalog(SqlConnectionString);
    }

    /// <summary>Shared by authority and greenfield factories when provisioning a new catalog.</summary>
    protected static string CreateEphemeralSqlConnectionString(string databaseNamePrefix)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(databaseNamePrefix);

        string databaseName = databaseNamePrefix + Guid.NewGuid().ToString("N");
        string raw = SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString(databaseName);
        SqlConnectionStringBuilder builder = new(raw)
        {
            MaxPoolSize = 200,
            ConnectTimeout = 120
        };

        return builder.ConnectionString;
    }

    private static IntegrationTestSqlCatalogEnvironment CreateSqlCatalogEnvironment(
        string sqlConnectionString,
        SqlCatalogProvisioningProfile provisioningProfile)
    {
        return new IntegrationTestSqlCatalogEnvironment(
            sqlConnectionString,
            pinSystemCatalogToSameDatabase: provisioningProfile.PinSystemCatalogToSameDatabase,
            pinSingleCatalogTopology: provisioningProfile.PinSingleCatalogTopology);
    }

    private static InvalidOperationException CreateProvisioningException(
        SqlCatalogProvisioningProfile provisioningProfile,
        Exception innerException)
    {
        return new InvalidOperationException(
            provisioningProfile.ProvisioningErrorMessage
            ?? "SqlIntegrationTestWebAppFactoryBase could not prepare an ephemeral SQL catalog. "
            + "Set environment variable "
            + TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable
            + " or "
            + TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable
            + " to a reachable SQL Server (Linux/macOS require this). On Windows, ensure localhost accepts the connection. "
            + "See docs/BUILD.md (API integration tests).",
            innerException);
    }
}

/// <summary>Catalog provisioning posture for <see cref="SqlIntegrationTestWebAppFactoryBase" /> subclasses.</summary>
/// <param name="DatabaseNamePrefix">Prefix for the ephemeral database name (suffix is a GUID).</param>
/// <param name="PinSqlCatalogEnvironment">
///     When <see langword="true" />, pins process env connection strings for the catalog lifetime.
/// </param>
/// <param name="PinSystemCatalogToSameDatabase">Pins <c>ConnectionStrings__ArchLucidSystem</c> to the same catalog.</param>
/// <param name="PinSingleCatalogTopology">Pins <c>ArchLucid__SqlTopology__Mode</c> to <c>SingleCatalog</c>.</param>
/// <param name="WrapProvisioningErrors">Wrap catalog creation failures in <see cref="InvalidOperationException" />.</param>
/// <param name="ProvisioningErrorMessage">Optional override for the wrapped provisioning error message.</param>
public readonly record struct SqlCatalogProvisioningProfile(
    string DatabaseNamePrefix,
    bool PinSqlCatalogEnvironment = true,
    bool PinSystemCatalogToSameDatabase = false,
    bool PinSingleCatalogTopology = false,
    bool WrapProvisioningErrors = false,
    string? ProvisioningErrorMessage = null);

using ArchLucid.TestSupport;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests;

/// <summary>
///     <see cref="WebApplicationFactory{TEntryPoint}" /> for the real API: provisions a dedicated SQL Server catalog per
///     instance,
///     wires <c>ConnectionStrings:ArchLucid</c>, and defaults <c>ArchLucid:StorageProvider=InMemory</c> so authority runs
///     stay fast
///     while SQL-backed probes can still open <see cref="SqlConnectionString" /> against the same catalog when needed.
/// </summary>
/// <remarks>
///     <para>
///         SQL Server connectivity is resolved by
///         <see cref="SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString" />:
///         <see cref="TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable" />, then
///         <see cref="TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable" />,
///         then Windows <c>localhost</c> integrated security.
///     </para>
///     <para>
///         In-memory configuration forces <c>AgentExecution:Mode=Simulator</c>, clears <c>AzureOpenAI:*</c> so user
///         secrets cannot enable real completion clients (503 from circuit breaker); sets
///         <c>DataConsistency:InitialDelaySeconds=0</c> and <c>HostLeaderElection:Enabled=false</c> so
///         <see cref="ArchLucid.Application.DataConsistency.DataConsistencyHealthCheck" /> can complete its first reconciliation promptly (otherwise
///         <c>appsettings.Advanced.json</c> 120s delay wins over Development and readiness/detailed health aggregate
///         Unhealthy → 503; see CI greenfield boot env comments). Rate limits are
///         raised for stable CI/local runs.
///     </para>
/// </remarks>
public class ArchLucidApiFactory : BaseIntegrationTestFixture, IAsyncLifetime
{
    private const string LogPrefix = nameof(ArchLucidApiFactory);

    private readonly IntegrationTestStorageProviderEnvironment _storageProviderEnvironment;
    private readonly IntegrationTestSqlCatalogEnvironment? _sqlCatalogEnvironment;
    private readonly bool _ownsSqlCatalog;
    private readonly string _storageProvider;
    private readonly IntegrationTestWebAppFactoryHostLifecycle _hostLifecycle = new();

    /// <summary>Creates the factory, ensures the unique test database exists, and applies migrations.</summary>
    public ArchLucidApiFactory()
        : this(sqlAuthorityStorage: false)
    {
    }

    /// <summary>Ephemeral catalog with SQL authority storage (forensics cross-host probes).</summary>
    internal ArchLucidApiFactory(bool sqlAuthorityStorage)
    {
        _storageProvider = sqlAuthorityStorage ? "Sql" : "InMemory";
        _storageProviderEnvironment = new IntegrationTestStorageProviderEnvironment(_storageProvider);
        _ownsSqlCatalog = true;
        SqlConnectionString = CreateEphemeralSqlConnectionString();
        SqlServerTestCatalogCommands.EnsureCatalogExists(SqlConnectionString);

        if (_storageProvider == "Sql")
            _sqlCatalogEnvironment = new IntegrationTestSqlCatalogEnvironment(SqlConnectionString);
    }

    /// <summary>Reuses an existing SQL catalog (second host in the same integration test).</summary>
    protected ArchLucidApiFactory(string existingSqlConnectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(existingSqlConnectionString);
        _storageProvider = "Sql";
        _storageProviderEnvironment = new IntegrationTestStorageProviderEnvironment(_storageProvider);
        _ownsSqlCatalog = false;
        SqlConnectionString = existingSqlConnectionString;
        _sqlCatalogEnvironment = new IntegrationTestSqlCatalogEnvironment(SqlConnectionString);
    }

    private static string CreateEphemeralSqlConnectionString()
    {
        string databaseName = "ArchLucidTest_" + Guid.NewGuid().ToString("N");
        string raw = SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString(databaseName);
        SqlConnectionStringBuilder builder = new(raw)
        {
            MaxPoolSize = 200,
            ConnectTimeout = 120
        };

        return builder.ConnectionString;
    }

    /// <summary>
    ///     Connection string for this factory’s SQL Server database (per-test database).
    ///     Tests that open <see cref="Microsoft.Data.SqlClient.SqlConnection" /> must use this instance property so they hit
    ///     the same DB as the hosted API.
    /// </summary>
    public string SqlConnectionString
    {
        get;
    }

    protected override void AddCustomSettings(Dictionary<string, string?> settings)
    {
        settings["ArchLucid:StorageProvider"] = _storageProvider;
        settings["ConnectionStrings:ArchLucid"] = SqlConnectionString;
        settings["ArchLucidAuth:AllowTestActorHeaders"] = "true";
        // appsettings.Development.json enables Demo:SeedOnStartup; integration tests seed explicitly via IDemoSeedService.
        settings["Demo:SeedOnStartup"] = "false";
    }

    /// <inheritdoc />
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);

        if (_storageProvider == "Sql")
            ApplySqlPersistenceHostOverrides(builder, SqlConnectionString);
    }

    /// <inheritdoc />
    protected override void ConfigureClient(HttpClient client)
    {
        base.ConfigureClient(client);

        // Default integration HTTP ceiling; idempotency/greenfield factories raise per-test via AlignHttpClientTimeoutForSqlIdempotencyLockChain.
        client.Timeout = TimeSpan.FromMinutes(5);
    }

    /// <inheritdoc />
    public Task InitializeAsync()
    {
        return EnsureServicesStartedAsync();
    }

    /// <inheritdoc cref="IAsyncLifetime.DisposeAsync" />
    Task IAsyncLifetime.DisposeAsync()
    {
        return Task.CompletedTask;
    }

    internal Task<IServiceProvider> EnsureServicesStartedAsync()
    {
        return _hostLifecycle.EnsureServicesStartedAsync(LogPrefix, StartServicesCoreAsync);
    }

    private Task<IServiceProvider> StartServicesCoreAsync()
    {
        return IntegrationTestStorageProviderHostGate.RunExclusiveAsync(StartServicesCoreUnderGateAsync);
    }

    private async Task<IServiceProvider> StartServicesCoreUnderGateAsync()
    {
        _storageProviderEnvironment.Apply();

        Console.Error.WriteLine(
            $"[{LogPrefix}] Host startup beginning at {DateTime.UtcNow:HH:mm:ss.fff}Z");

        // Services access and first CreateClient share one Task.Run worker so WebApplicationFactory.EnsureServer
        // is never entered concurrently from an abandoned startup thread and a later CreateClient (CI #2168).
        IServiceProvider services = await IntegrationTestHostStartup.EnsureStartedAsync(() =>
        {
            IServiceProvider resolvedServices = Services;
            _ = CreateClient();

            Console.Error.WriteLine(
                $"[{LogPrefix}] Services resolved + CreateClient complete at {DateTime.UtcNow:HH:mm:ss.fff}Z");

            return resolvedServices;
        }).ConfigureAwait(false);

        return services;
    }

    /// <summary>
    ///     Ensures the host is started (including TestServer client cache priming), then returns an
    ///     <see cref="HttpClient" />.
    /// </summary>
    internal async Task<HttpClient> CreateBoundedClientAsync()
    {
        await EnsureServicesStartedAsync().ConfigureAwait(false);

        return await IntegrationTestHostStartup.EnsureCompletedAsync(
            () => CreateClient(),
            IntegrationTestHostStartup.DefaultClientCreationTimeout).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public override ValueTask DisposeAsync()
    {
        string? ownedCatalog = _ownsSqlCatalog ? SqlConnectionString : null;

        return IntegrationTestOwnedSqlCatalogDispose.DisposeHostAndDropOwnedCatalogAsync(
            LogPrefix,
            _hostLifecycle,
            () => base.DisposeAsync(),
            ownedCatalog);
    }

    /// <summary>Drops the per-factory SQL database when the host is disposed (best-effort).</summary>
    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _sqlCatalogEnvironment?.Dispose();
            _storageProviderEnvironment.Dispose();
        }

        base.Dispose(disposing);

        if (!disposing || !_ownsSqlCatalog)
            return;

        try
        {
            SqlServerTestCatalogCommands.DropCatalogIfExists(SqlConnectionString);
        }
        catch
        {
            // Best-effort cleanup (SQL Server may be unavailable on teardown).
        }
    }
}

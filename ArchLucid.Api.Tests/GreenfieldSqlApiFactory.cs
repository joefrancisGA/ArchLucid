using ArchLucid.TestSupport;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Boots <see cref="Program" /> with <c>ArchLucid:StorageProvider=Sql</c> against an **empty** SQL catalog (no DbUp
///     journal).
///     Host startup must run DbUp then <c>ISchemaBootstrapper</c> — same path as greenfield deployments and CI
///     <c>api-greenfield-boot</c>.
/// </summary>
public class GreenfieldSqlApiFactory : BaseIntegrationTestFixture, IAsyncLifetime
{
    private const string LogPrefix = nameof(GreenfieldSqlApiFactory);

    private readonly IntegrationTestWebAppFactoryHostLifecycle _hostLifecycle = new();
    private readonly IntegrationTestStorageProviderEnvironment _storageProviderEnvironment = new("Sql");
    private readonly IntegrationTestSqlCatalogEnvironment? _sqlCatalogEnvironment;

    /// <summary>Creates the factory and ensures the catalog exists without applying migrations (host does that on boot).</summary>
    public GreenfieldSqlApiFactory()
    {
        try
        {
            string databaseName = "ArchLucidGreenfield_" + Guid.NewGuid().ToString("N");
            string raw = SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString(databaseName);
            SqlConnectionStringBuilder builder = new(raw)
            {
                // Parallel integration tests (same host process) can open many connections at once; CI SQL is slower than local.
                MaxPoolSize = 200,
                ConnectTimeout = 120
            };

            SqlConnectionString = builder.ConnectionString;
            SqlServerTestCatalogCommands.EnsureCatalogExists(SqlConnectionString);
            _sqlCatalogEnvironment = new IntegrationTestSqlCatalogEnvironment(
                SqlConnectionString,
                pinSystemCatalogToSameDatabase: true,
                pinSingleCatalogTopology: true);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                "GreenfieldSqlApiFactory could not prepare an ephemeral SQL catalog. "
                + "Set environment variable "
                + TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable
                + " or "
                + TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable
                + " to a reachable SQL Server (Linux/macOS require this). On Windows, ensure localhost accepts the connection. "
                + "See docs/BUILD.md (API integration tests).",
                ex);
        }
    }

    /// <summary>ADO.NET connection string for the empty catalog the API migrates on startup.</summary>
    public string SqlConnectionString
    {
        get;
    }

    /// <inheritdoc />
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);

        ApplySqlPersistenceHostOverrides(builder, SqlConnectionString, GetAdditionalHostConfigurationOverrides());
    }

    /// <summary>Subclasses add test-only host keys merged into the single early Sql <c>UseConfiguration</c> bootstrap.</summary>
    protected virtual IReadOnlyDictionary<string, string?>? GetAdditionalHostConfigurationOverrides()
    {
        return null;
    }

    protected override void AddCustomSettings(Dictionary<string, string?> settings)
    {
        settings["ArchLucid:StorageProvider"] = "Sql";
        settings["ConnectionStrings:ArchLucid"] = SqlConnectionString;
        // Pin control-plane + tenant-plane to the same ephemeral catalog so /v1/register duplicate gates
        // cannot split inserts and lookups across different SQL catalogs when env/config layers SqlTopology.
        settings["ArchLucid:SqlTopology:Mode"] = "SingleCatalog";
        settings["ConnectionStrings:ArchLucidSystem"] = SqlConnectionString;
        settings["ArchLucidAuth:Mode"] = "DevelopmentBypass";
        settings["Authentication:ApiKey:DevelopmentBypassAll"] = "true";
        settings["ArchLucidAuth:AllowTestActorHeaders"] = "true";
        // 300 s covers sp_getapplock wait (DistributedIdempotencyLockTimeoutMilliseconds = 180 s + 120 s ADO headroom)
        // and heavy migration queries.  Individual repositories that must fail fast under CI SQL pressure
        // (e.g. DapperAuditRepository.AppendAsync) must set an explicit commandTimeout on their CommandDefinition
        // rather than relying on this global.  Do NOT raise this value without also reviewing audit / outbox
        // commandTimeout caps — they intentionally do NOT inherit the global to avoid consuming the pipeline budget.
        settings["ArchLucid:Persistence:DefaultSqlCommandTimeoutSeconds"] = "300";
        settings["AuthorityPipeline:PipelineTimeout"] = "00:05:00";
        // Keep lock wait below slow-shard hang guards; 3 min is enough for one winner + idempotent replays in CI.
        settings["ArchLucid:CreateRun:DistributedIdempotencyLockTimeoutMilliseconds"] = "180000";
        // Parallel greenfield factories on CI SQL can surface network-layer connection faults; give open retries more
        // headroom than production defaults without unbounded ADO connect-timeout stacking.
        settings["Persistence:SqlOpenResilience:MaxRetryAttempts"] = "6";
        settings["Persistence:SqlOpenResilience:BaseDelayMilliseconds"] = "500";
        settings["Demo:SeedOnStartup"] = "false";
        settings["Demo:SeedDepth"] = "quickstart";
        settings["Auth:PublicSignup:Mode"] = "PublicSelfService";
    }

    /// <inheritdoc />
    protected override void ConfigureClient(HttpClient client)
    {
        base.ConfigureClient(client);

        // Worst wall clock for one POST: 3 min applock wait + 5 min pipeline + cold SQL headroom.
        client.Timeout = ArchitectureRequestConcurrencyTestSupport.GreenfieldSqlArchitectureRequestBurstHttpTimeout;
    }

    /// <inheritdoc />
    public async Task InitializeAsync()
    {
        GreenfieldSqlIntegrationWarmup.SkipIfShardWarmupAlreadyTimedOut();

        try
        {
            await EnsureServicesStartedAsync().ConfigureAwait(false);
        }
        catch (WarmupTimedOutException)
        {
            GreenfieldSqlIntegrationWarmup.RecordShardWarmupTimedOut();
            throw;
        }
    }

    /// <inheritdoc />
    Task IAsyncLifetime.DisposeAsync()
    {
        return Task.CompletedTask;
    }

    internal Task<IServiceProvider> EnsureServicesStartedAsync()
    {
        return _hostLifecycle.EnsureServicesStartedAsync(LogPrefix, StartServicesCoreAsync);
    }

    /// <summary>
    ///     Ensures the host is started under the greenfield bootstrap budget, then returns an <see cref="HttpClient" />.
    /// </summary>
    internal async Task<HttpClient> CreateBoundedClientAsync()
    {
        // Keep process env aligned for any late configuration reloads / sibling factory dispose races.
        RepinSqlCatalogEnvironmentVariables();

        await EnsureServicesStartedAsync().ConfigureAwait(false);

        return await IntegrationTestHostStartup.EnsureCompletedAsync(
            () => CreateClient(),
            IntegrationTestHostStartup.DefaultClientCreationTimeout).ConfigureAwait(false);
    }

    /// <summary>
    ///     Pins control-plane + topology env keys to <see cref="SqlConnectionString" /> (same keys as
    ///     <see cref="IntegrationTestSqlCatalogEnvironment" />).
    /// </summary>
    private void RepinSqlCatalogEnvironmentVariables()
    {
        Environment.SetEnvironmentVariable("ConnectionStrings__ArchLucid", SqlConnectionString);
        Environment.SetEnvironmentVariable("ConnectionStrings__ArchLucidSystem", SqlConnectionString);
        Environment.SetEnvironmentVariable("ArchLucid__SqlTopology__Mode", "SingleCatalog");
    }

    private Task<IServiceProvider> StartServicesCoreAsync()
    {
        return IntegrationTestStorageProviderHostGate.RunExclusiveAsync(StartServicesCoreUnderGateAsync);
    }

    private async Task<IServiceProvider> StartServicesCoreUnderGateAsync()
    {
        IServiceProvider? resolvedServices = null;

        await ArchitectureRequestConcurrencyTestSupport.RunGreenfieldSqlFactoryBootstrapAsync(async cancellationToken =>
        {
            // Other ArchLucidEnvMutation factories pin ConnectionStrings__* in their ctors (outside this gate).
            // Re-assert this factory's catalog immediately before host build so Program's AddEnvironmentVariables()
            // cannot freeze a sibling greenfield/PersistenceTests catalog while fixture.SqlConnectionString differs.
            RepinSqlCatalogEnvironmentVariables();

            _storageProviderEnvironment.Apply();

            Console.Error.WriteLine(
                $"[{LogPrefix}] Host startup beginning at {DateTime.UtcNow:HH:mm:ss.fff}Z");

            resolvedServices = await IntegrationTestHostStartup.EnsureStartedAsync(() =>
            {
                IServiceProvider services = Services;
                HttpClient client = CreateClient();

                Console.Error.WriteLine(
                    $"[{LogPrefix}] Services resolved + CreateClient complete at {DateTime.UtcNow:HH:mm:ss.fff}Z");

                return services;
            }).ConfigureAwait(false);

            HttpClient healthClient = CreateClient();
            ArchitectureRequestConcurrencyTestSupport.AlignHttpClientTimeoutForSqlIdempotencyLockChain(
                healthClient,
                ArchitectureRequestConcurrencyTestSupport.GreenfieldSqlArchitectureRequestBurstHttpTimeout);

            await HealthReadyProbe.EnsureReadyAsync(healthClient, cancellationToken).ConfigureAwait(false);
        }).ConfigureAwait(false);

        return resolvedServices
            ?? throw new InvalidOperationException("Greenfield SQL host startup did not resolve services.");
    }

    /// <inheritdoc />
    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _sqlCatalogEnvironment?.Dispose();
            _storageProviderEnvironment.Dispose();
        }

        base.Dispose(disposing);

        if (!disposing)
            return;

        IntegrationTestOwnedSqlCatalogDispose.TryDropOwnedCatalog(SqlConnectionString);
    }

    /// <summary>
    ///     Bounds host teardown so a wedged SQL hosted service or connection cannot consume the CI
    ///     blame-hang inactivity window. Mirrors the guard added to <see cref="AlertLifecycleWebAppFactory" />
    ///     for CI #2168/#2195 — applied here because greenfield SQL host teardown is heavier (active
    ///     connections, outbox workers) and the missing cap was identified in CI #2224.
    /// </summary>
    public override ValueTask DisposeAsync()
    {
        return IntegrationTestOwnedSqlCatalogDispose.DisposeHostAndDropOwnedCatalogAsync(
            LogPrefix,
            _hostLifecycle,
            () => base.DisposeAsync(),
            SqlConnectionString);
    }
}

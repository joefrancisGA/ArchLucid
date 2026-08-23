using ArchLucid.TestSupport;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Boots <see cref="Program" /> with <c>ArchLucid:StorageProvider=Sql</c> against an **empty** SQL catalog (no DbUp
///     journal).
///     Host startup must run DbUp then <c>ISchemaBootstrapper</c> — same path as greenfield deployments and CI
///     <c>api-greenfield-boot</c>.
/// </summary>
public class GreenfieldSqlApiFactory : SqlIntegrationTestWebAppFactoryBase
{
    private static readonly SqlCatalogProvisioningProfile GreenfieldCatalogProfile = new(
        DatabaseNamePrefix: "ArchLucidGreenfield_",
        PinSqlCatalogEnvironment: true,
        PinSystemCatalogToSameDatabase: true,
        PinSingleCatalogTopology: true,
        WrapProvisioningErrors: true,
        ProvisioningErrorMessage:
            "GreenfieldSqlApiFactory could not prepare an ephemeral SQL catalog. "
            + "Set environment variable "
            + ArchLucid.TestSupport.TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable
            + " or "
            + ArchLucid.TestSupport.TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable
            + " to a reachable SQL Server (Linux/macOS require this). On Windows, ensure localhost accepts the connection. "
            + "See docs/BUILD.md (API integration tests).");

    /// <summary>Creates the factory and ensures the catalog exists without applying migrations (host does that on boot).</summary>
    public GreenfieldSqlApiFactory()
        : base("Sql", GreenfieldCatalogProfile)
    {
    }

    /// <inheritdoc />
    protected override string FactoryLogPrefix => nameof(GreenfieldSqlApiFactory);

    /// <inheritdoc />
    protected override bool UsesSqlPersistenceHostOverrides => true;

    /// <inheritdoc />
    protected override TimeSpan HttpClientTimeout =>
        ArchitectureRequestConcurrencyTestSupport.GreenfieldSqlArchitectureRequestBurstHttpTimeout;

    /// <inheritdoc />
    protected override void ApplySqlCatalogCustomSettings(Dictionary<string, string?> settings)
    {
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
    public override async Task InitializeAsync()
    {
        GreenfieldSqlIntegrationWarmup.SkipIfShardWarmupAlreadyTimedOut();

        try
        {
            await base.InitializeAsync().ConfigureAwait(false);
        }
        catch (WarmupTimedOutException)
        {
            GreenfieldSqlIntegrationWarmup.RecordShardWarmupTimedOut();
            throw;
        }
    }

    /// <inheritdoc />
    protected override Task PrepareForClientCreationAsync()
    {
        RepinSqlCatalogEnvironmentVariables();

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    protected override void OnPrepareHostStartup()
    {
        RepinSqlCatalogEnvironmentVariables();
    }

    /// <inheritdoc />
    protected override Task RunUnderHostStartupGateAsync(Func<CancellationToken, Task> startupWork)
    {
        return ArchitectureRequestConcurrencyTestSupport.RunGreenfieldSqlFactoryBootstrapAsync(startupWork);
    }

    /// <inheritdoc />
    protected override async Task OnAfterHostStartedAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        HttpClient healthClient = CreateClient();
        ArchitectureRequestConcurrencyTestSupport.AlignHttpClientTimeoutForSqlIdempotencyLockChain(
            healthClient,
            ArchitectureRequestConcurrencyTestSupport.GreenfieldSqlArchitectureRequestBurstHttpTimeout);

        await HealthReadyProbe.EnsureReadyAsync(healthClient, cancellationToken).ConfigureAwait(false);
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
}

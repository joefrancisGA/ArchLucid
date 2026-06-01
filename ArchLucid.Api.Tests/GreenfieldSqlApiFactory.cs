using ArchLucid.TestSupport;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Boots <see cref="Program" /> with <c>ArchLucid:StorageProvider=Sql</c> against an **empty** SQL catalog (no DbUp
///     journal).
///     Host startup must run DbUp then <c>ISchemaBootstrapper</c> — same path as greenfield deployments and CI
///     <c>api-greenfield-boot</c>.
/// </summary>
public class GreenfieldSqlApiFactory : BaseIntegrationTestFixture
{
    private readonly IntegrationTestStorageProviderEnvironment _storageProviderEnvironment = new("Sql");

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

        ApplySqlPersistenceHostOverrides(builder, GetAdditionalHostConfigurationOverrides());
    }

    /// <summary>Subclasses add test-only host keys merged into the single early Sql <c>UseConfiguration</c> bootstrap.</summary>
    protected virtual IReadOnlyDictionary<string, string?>? GetAdditionalHostConfigurationOverrides()
    {
        return null;
    }

    /// <summary>Sql catalog overrides every greenfield host must apply before <see cref="Program" /> registers DI.</summary>
    protected Dictionary<string, string?> CreateSqlPersistenceHostOverrides()
    {
        return new Dictionary<string, string?>
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] = SqlConnectionString
        };
    }

    /// <summary>
    ///     Minimal-hosting <see cref="WebApplicationFactory{TEntryPoint}" /> can register DI before
    ///     <see cref="IWebHostBuilder.ConfigureAppConfiguration" /> wins over
    ///     <c>appsettings.Development.json</c> (<c>StorageProvider=InMemory</c>). Startup then runs
    ///     <c>ISchemaBootstrapper</c> without it registered — same early-merge pattern as
    ///     <see cref="JwtLocalSigningWebAppFactory" /> and
    ///     <see cref="Billing.BillingCheckoutEndToEndSqlJwtFactoryBase" />.
    /// </summary>
    protected void ApplySqlPersistenceHostOverrides(
        IWebHostBuilder builder,
        IReadOnlyDictionary<string, string?>? additionalOverrides = null)
    {
        Dictionary<string, string?> overrides = CreateSqlPersistenceHostOverrides();
        MergeHostConfigurationOverrides(overrides, additionalOverrides);

        foreach (KeyValuePair<string, string?> pair in overrides)
        {
            if (pair.Value is null)
            {
                continue;
            }

            builder.UseSetting(pair.Key, pair.Value);
        }

        IConfiguration bootstrap = new ConfigurationBuilder().AddInMemoryCollection(overrides).Build();
        builder.UseConfiguration(bootstrap);

        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(overrides));
    }

    /// <summary>
    ///     Merges test-only settings without replacing the early Sql <see cref="IWebHostBuilder.UseConfiguration" />
    ///     bootstrap (subclasses such as marketplace webhook tests add billing keys this way).
    /// </summary>
    protected void ApplyAdditionalHostOverrides(
        IWebHostBuilder builder,
        IReadOnlyDictionary<string, string?> additionalOverrides)
    {
        foreach (KeyValuePair<string, string?> pair in additionalOverrides)
        {
            if (pair.Value is null)
            {
                continue;
            }

            builder.UseSetting(pair.Key, pair.Value);
        }

        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(additionalOverrides));
    }

    private void MergeHostConfigurationOverrides(
        Dictionary<string, string?> overrides,
        IReadOnlyDictionary<string, string?>? additionalOverrides)
    {
        Dictionary<string, string?> customSettings = new();
        AddCustomSettings(customSettings);

        foreach (KeyValuePair<string, string?> pair in customSettings)
        {
            overrides[pair.Key] = pair.Value;
        }

        if (additionalOverrides is null)
        {
            return;
        }

        foreach (KeyValuePair<string, string?> pair in additionalOverrides)
        {
            overrides[pair.Key] = pair.Value;
        }
    }

    protected override void AddCustomSettings(Dictionary<string, string?> settings)
    {
        settings["ArchLucid:StorageProvider"] = "Sql";
        settings["ConnectionStrings:ArchLucid"] = SqlConnectionString;
        settings["ArchLucidAuth:Mode"] = "DevelopmentBypass";
        settings["Authentication:ApiKey:DevelopmentBypassAll"] = "true";
        settings["ArchLucidAuth:AllowTestActorHeaders"] = "true";
        settings["ArchLucid:Persistence:DefaultSqlCommandTimeoutSeconds"] = "300";
        settings["AuthorityPipeline:PipelineTimeout"] = "00:05:00";
        // Keep lock wait below slow-shard hang guards; 3 min is enough for one winner + idempotent replays in CI.
        settings["ArchLucid:CreateRun:DistributedIdempotencyLockTimeoutMilliseconds"] = "180000";
        settings["Demo:SeedDepth"] = "quickstart";
    }

    /// <inheritdoc />
    protected override void ConfigureClient(HttpClient client)
    {
        base.ConfigureClient(client);

        // Worst wall clock for one POST: 3 min applock wait + 5 min pipeline + cold SQL headroom.
        client.Timeout = ArchitectureRequestConcurrencyTestSupport.GreenfieldSqlArchitectureRequestBurstHttpTimeout;
    }

    /// <inheritdoc />
    protected override void Dispose(bool disposing)
    {
        if (disposing)
            _storageProviderEnvironment.Dispose();

        base.Dispose(disposing);

        if (!disposing)
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

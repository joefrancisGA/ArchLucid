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
public class GreenfieldSqlApiFactory : BaseIntegrationTestFixture
{
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
            _sqlCatalogEnvironment = new IntegrationTestSqlCatalogEnvironment(SqlConnectionString);
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
        {
            _sqlCatalogEnvironment?.Dispose();
            _storageProviderEnvironment.Dispose();
        }

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

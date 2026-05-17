using ArchLucid.TestSupport;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Boots <see cref="Program" /> with <c>ArchLucid:StorageProvider=Sql</c> against an **empty** SQL catalog (no DbUp
///     journal).
///     Host startup must run DbUp then <c>ISchemaBootstrapper</c> — same path as greenfield deployments and CI
///     <c>api-greenfield-boot</c>.
/// </summary>
public class GreenfieldSqlApiFactory : WebApplicationFactory<Program>
{
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
                MaxPoolSize = 200, ConnectTimeout = 120
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
        builder.UseEnvironment("Development");

        builder.UseSetting("ConnectionStrings:ArchLucid", SqlConnectionString);
        builder.UseSetting("ArchLucid:StorageProvider", "Sql");
        builder.UseSetting("ArchLucidAuth:Mode", "DevelopmentBypass");
        builder.UseSetting("Authentication:ApiKey:DevelopmentBypassAll", "true");
        builder.UseSetting("ArchLucidAuth:AllowTestActorHeaders", "true");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            Dictionary<string, string?> settings = new()
            {
                ["ArchLucid:StorageProvider"] = "Sql",
                ["ConnectionStrings:ArchLucid"] = SqlConnectionString,
                ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
                ["Authentication:ApiKey:DevelopmentBypassAll"] = "true",
                ["ArchLucidAuth:AllowTestActorHeaders"] = "true",
                ["AgentExecution:Mode"] = "Simulator",
                ["AzureOpenAI:Endpoint"] = "",
                ["AzureOpenAI:ApiKey"] = "",
                ["AzureOpenAI:DeploymentName"] = "",
                ["AzureOpenAI:EmbeddingDeploymentName"] = "",
                ["RateLimiting:FixedWindow:PermitLimit"] = "100000",
                ["RateLimiting:FixedWindow:WindowMinutes"] = "1",
                ["RateLimiting:Expensive:PermitLimit"] = "100000",
                ["RateLimiting:Expensive:WindowMinutes"] = "1",
                ["RateLimiting:Replay:Light:PermitLimit"] = "100000",
                ["RateLimiting:Replay:Heavy:PermitLimit"] = "100000",
                ["RateLimiting:Registration:PermitLimit"] = "100000",
                ["RateLimiting:Registration:WindowMinutes"] = "1",
                ["ArchLucid:Persistence:DefaultSqlCommandTimeoutSeconds"] = "300",
                // Simulator finishes in seconds; 5 min is ample and keeps the lock chain well under the per-request CTS.
                ["AuthorityPipeline:PipelineTimeout"] = "00:05:00",
                // Losers wait on sp_getapplock while the winner runs the pipeline — must exceed PipelineTimeout (5 min).
                // 10 min gives 5 min headroom; SqlCommandTimeoutSecondsForLockWait adds a further 120 s on top.
                ["ArchLucid:CreateRun:DistributedIdempotencyLockTimeoutMilliseconds"] = "600000",
                // appsettings.Advanced.json sets 120s; that blocks DataConsistency readiness on Combined hosts until the first reconciliation.
                ["DataConsistency:InitialDelaySeconds"] = "0",
                // Http-only URL list disables HTTPS redirection middleware for in-memory TestServer (avoids redirect handler + long POST interaction quirks in CI).
                ["ASPNETCORE_URLS"] = "http://127.0.0.1:0"
            };

            ApiTestWebHostLogging.AddQuietDefaultLogLevel(settings);
            config.AddInMemoryCollection(settings);
        });
    }

    /// <inheritdoc />
    protected override void ConfigureClient(HttpClient client)
    {
        base.ConfigureClient(client);

        // Worst wall clock for one POST: applock wait budget (10 min) + pipeline ceiling (5 min) — stay aligned with settings above.
        client.Timeout = TimeSpan.FromMinutes(28);
    }

    /// <inheritdoc />
    protected override void Dispose(bool disposing)
    {
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

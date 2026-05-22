using ArchLucid.TestSupport;

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
public class ArchLucidApiFactory : BaseIntegrationTestFixture
{
    /// <summary>Creates the factory, ensures the unique test database exists, and applies migrations.</summary>
    public ArchLucidApiFactory()
    {
        string databaseName = "ArchLucidTest_" + Guid.NewGuid().ToString("N");
        string raw = SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString(databaseName);
        SqlConnectionStringBuilder builder = new(raw)
        {
            MaxPoolSize = 200,
            ConnectTimeout = 120
        };

        SqlConnectionString = builder.ConnectionString;
        SqlServerTestCatalogCommands.EnsureCatalogExists(SqlConnectionString);
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
        settings["ArchLucid:StorageProvider"] = "InMemory";
        settings["ConnectionStrings:ArchLucid"] = SqlConnectionString;
        settings["ArchLucidAuth:AllowTestActorHeaders"] = "true";
        settings["ArchLucid:EvidenceBulkUploadMaxFiles"] = "30";
    }

    /// <inheritdoc />
    protected override void ConfigureClient(HttpClient client)
    {
        base.ConfigureClient(client);

        // Align with ArchitectureRequestBurstHttpTimeout + lock/pipeline slack (see ArchitectureRequestConcurrencyTestSupport).
        client.Timeout = TimeSpan.FromMinutes(65);
    }

    /// <summary>Drops the per-factory SQL database when the host is disposed (best-effort).</summary>
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

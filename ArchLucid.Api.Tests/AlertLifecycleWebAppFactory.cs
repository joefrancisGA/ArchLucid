using ArchLucid.TestSupport;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests;

/// <summary>
///     API host with <c>ArchLucid:StorageProvider=InMemory</c> so advisory scans use in-memory authority + alert stores
///     (same DI graph as production, different backing stores).
/// </summary>
public sealed class AlertLifecycleWebAppFactory : BaseIntegrationTestFixture
{
    private readonly string _connectionString;

    public AlertLifecycleWebAppFactory()
    {
        string databaseName = "ArchLucidAlertTest_" + Guid.NewGuid().ToString("N");
        _connectionString =
            SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString(databaseName);
        SqlServerTestCatalogCommands.EnsureCatalogExists(_connectionString);
    }

    protected override void AddCustomSettings(Dictionary<string, string?> settings)
    {
        settings["ArchLucid:StorageProvider"] = "InMemory";
        settings["ConnectionStrings:ArchLucid"] = _connectionString;
        settings["ArchLucidAuth:Mode"] = "DevelopmentBypass";
        settings["Authentication:ApiKey:DevelopmentBypassAll"] = "true";
        settings["ArchLucidAuth:AllowTestActorHeaders"] = "true";
        // Background TrialFunnelHealthProbe defaults to http://127.0.0.1:5000 under TestServer; disable for integration hosts.
        settings["Demo:Enabled"] = "false";
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (!disposing)
            return;

        try
        {
            SqlServerTestCatalogCommands.DropCatalogIfExists(_connectionString);
        }
        catch
        {
            // Best-effort cleanup.
        }
    }
}

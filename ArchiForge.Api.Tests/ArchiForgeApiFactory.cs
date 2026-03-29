using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace ArchiForge.Api.Tests;

/// <summary>
/// <see cref="WebApplicationFactory{TEntryPoint}"/> for the real API: provisions a dedicated SQL Server database per instance, runs DbUp migrations, and wires <c>ConnectionStrings:ArchiForge</c> plus in-memory auxiliary storage.
/// </summary>
/// <remarks>
/// Disposed with the test class; drops the database best-effort. Requires SQL Server on <c>localhost</c>.
/// In-memory configuration forces <c>AgentExecution:Mode=Simulator</c>, clears <c>AzureOpenAI:*</c> so user secrets
/// cannot enable real completion clients (503 from circuit breaker), and raises rate limits for stable CI/local runs.
/// </remarks>
public class ArchiForgeApiFactory : WebApplicationFactory<Program>
{
    private readonly string _connectionString;

    /// <summary>Creates the factory, ensures the unique test database exists, and applies migrations.</summary>
    public ArchiForgeApiFactory()
    {
        string databaseName = "ArchiForgeTest_" + Guid.NewGuid().ToString("N");
        _connectionString =
            $"Server=localhost;Database={databaseName};Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True";
        SqlServerTestDatabaseHelper.EnsureDatabaseExists(_connectionString);
    }

    /// <summary>
    /// Connection string for this factory’s SQL Server database (per-test database on <c>localhost</c>).
    /// Tests that open <see cref="Microsoft.Data.SqlClient.SqlConnection"/> must use this instance property so they hit the same DB as the hosted API.
    /// </summary>
    public string SqlConnectionString => _connectionString;

    /// <summary>
    /// Points the hosted API at this factory’s SQL connection string and sets in-memory storage for non-relational dependencies.
    /// </summary>
    /// <param name="builder">ASP.NET Core host builder.</param>
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.UseSetting("ConnectionStrings:ArchiForge", _connectionString);
        builder.UseSetting("ArchiForge:StorageProvider", "InMemory");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            // Last-in wins over appsettings / user secrets: keep integration tests off real OpenAI and
            // avoid circuit-breaker 503s; relax rate limits so parallel runs do not exhaust shared windows.
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchiForge:StorageProvider"] = "InMemory",
                ["ConnectionStrings:ArchiForge"] = _connectionString,
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
                ["RateLimiting:Replay:Heavy:PermitLimit"] = "100000"
            });
        });
    }

    /// <summary>Drops the per-factory SQL database when the host is disposed (best-effort).</summary>
    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (!disposing) return;
        
        // Dispose the database when the factory is disposed.
        // Note: The factory is disposed when the test host is disposed.
        // This typically happens at the end of a test class or method.
        try
        {
            SqlServerTestDatabaseHelper.DropDatabaseIfExists(_connectionString);
        }
        catch
        {
            // Best-effort cleanup (SQL Server may be unavailable on teardown).
        }
    }
}

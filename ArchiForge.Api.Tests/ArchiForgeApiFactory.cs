using ArchiForge.Data.Infrastructure;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchiForge.Api.Tests;

public class ArchiForgeApiFactory : WebApplicationFactory<Program>
{
    private readonly string _sqliteConnectionString =
        $"Data Source=file:archiforge-test-{Guid.NewGuid():N}?mode=memory&cache=shared";

    /// <summary>
    /// Connection string for this factory’s in-memory SQLite (<see cref="IDbConnectionFactory"/>).
    /// Tests that open <see cref="Microsoft.Data.Sqlite.SqliteConnection"/> must use this instance property so they hit the same DB as the hosted API.
    /// </summary>
    public string SqliteConnectionString => _sqliteConnectionString;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Ensure Development appsettings (e.g. StorageProvider) apply when CI sets another environment.
        builder.UseEnvironment("Development");

        // Last configuration sources win: force in-memory authority + SQLite for ArchiForge.Data regardless of UseSetting ordering.
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchiForge:StorageProvider"] = "InMemory",
                ["ConnectionStrings:ArchiForge"] = _sqliteConnectionString
            });
        });

        // Must run after Program registrations; ConfigureServices in ConfigureWebHost can run too early, so SqlConnectionFactory wins over Sqlite.
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IDbConnectionFactory>();
            services.AddSingleton<IDbConnectionFactory>(new SqliteConnectionFactory(_sqliteConnectionString));
        });
    }
}

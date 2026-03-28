using ArchiForge.Data.Infrastructure;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

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
        // Avoid SqlConnection + SQLite connection string (503) when environment omits Development overrides (e.g. Production in CI).
        builder.UseSetting("ArchiForge:StorageProvider", "InMemory");
        builder.UseSetting("ConnectionStrings:ArchiForge", _sqliteConnectionString);
        builder.ConfigureServices(services =>
        {
            List<ServiceDescriptor> descriptors = services.Where(d => d.ServiceType == typeof(IDbConnectionFactory)).ToList();
            foreach (ServiceDescriptor d in descriptors)
                services.Remove(d);
            services.AddSingleton<IDbConnectionFactory>(
                new SqliteConnectionFactory(_sqliteConnectionString));
        });
    }
}

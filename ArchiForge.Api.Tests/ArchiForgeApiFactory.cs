using System.Collections.Generic;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace ArchiForge.Api.Tests;

public class ArchiForgeApiFactory : WebApplicationFactory<Program>
{
    private readonly string _sqliteConnectionString =
        $"Data Source=file:archiforge-test-{Guid.NewGuid():N}?mode=memory&cache=shared";

    /// <summary>
    /// Connection string for this factory’s in-memory SQLite (<see cref="ArchiForge.Data.Infrastructure.IDbConnectionFactory"/>).
    /// Tests that open <see cref="Microsoft.Data.Sqlite.SqliteConnection"/> must use this instance property so they hit the same DB as the hosted API.
    /// </summary>
    public string SqliteConnectionString => _sqliteConnectionString;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        // In-memory authority + SQLite: IDbConnectionFactory is chosen in RegisterDataInfrastructure when the connection string is SQLite.
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchiForge:StorageProvider"] = "InMemory",
                ["ConnectionStrings:ArchiForge"] = _sqliteConnectionString
            });
        });
    }
}

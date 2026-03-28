using System.Collections.Generic;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace ArchiForge.Api.Tests;

/// <summary>
/// API host with <c>ArchiForge:StorageProvider=InMemory</c> so advisory scans use in-memory authority + alert stores (same DI graph as production, different backing stores).
/// </summary>
/// <remarks>
/// <see cref="ArchiForgeApiFactory"/> uses the same SQLite-in-memory connection string pattern; <see cref="ArchiForge.Data.Infrastructure.IDbConnectionFactory"/> resolves to SQLite via DI.
/// </remarks>
public sealed class AlertLifecycleWebAppFactory : WebApplicationFactory<Program>
{
    private readonly string _sqliteConnectionString =
        $"Data Source=file:alert-lifecycle-{Guid.NewGuid():N}?mode=memory&cache=shared";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

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

using ArchiForge.Data.Infrastructure;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace ArchiForge.Api.Tests;

/// <summary>
/// API host with <c>ArchiForge:StorageProvider=InMemory</c> so advisory scans use in-memory authority + alert stores (same DI graph as production, different backing stores).
/// </summary>
/// <remarks>
/// <see cref="ArchiForgeApiFactory"/> keeps <c>Sql</c> storage; alert lifecycle tests seed in-memory authority (<c>IRunRepository</c> / <c>IGoldenManifestRepository</c>) without SQL authority tables.
/// </remarks>
public sealed class AlertLifecycleWebAppFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ArchiForge:StorageProvider", "InMemory");
        builder.UseSetting("ConnectionStrings:ArchiForge", ArchiForgeApiFactory.SqliteInMemoryConnectionString);

        builder.ConfigureServices(services =>
        {
            List<ServiceDescriptor> descriptors = services.Where(static d => d.ServiceType == typeof(IDbConnectionFactory)).ToList();

            foreach (ServiceDescriptor d in descriptors)
            {
                services.Remove(d);
            }

            services.AddSingleton<IDbConnectionFactory>(
                new SqliteConnectionFactory(ArchiForgeApiFactory.SqliteInMemoryConnectionString));
        });
    }
}

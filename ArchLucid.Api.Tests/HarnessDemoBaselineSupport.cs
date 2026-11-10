using ArchLucid.Application.Bootstrap;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>Contoso retail demo baseline used by inspect, insight-signal, and related Core endpoint tests.</summary>
internal static class HarnessDemoBaselineSupport
{
    internal static Guid AuthorityRunId => ContosoRetailDemoIdentifiers.AuthorityRunBaselineId;

    internal static string DemoPrimaryFindingId =>
        $"finding-demo-{AuthorityRunId:N}-primary";

    internal static async Task EnsureSeededAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(services);

        using IServiceScope scope = services.CreateScope();
        IDemoSeedService seed = scope.ServiceProvider.GetRequiredService<IDemoSeedService>();
        await seed.SeedAsync(cancellationToken).ConfigureAwait(false);
    }
}

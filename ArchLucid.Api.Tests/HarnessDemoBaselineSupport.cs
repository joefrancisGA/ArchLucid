using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Scoping;

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

    internal static HttpClient CreateForeignTenantClient(
        ArchLucidApiFactory factory,
        Guid? workspaceId = null,
        Guid? projectId = null)
    {
        ArgumentNullException.ThrowIfNull(factory);

        HttpClient client = factory.CreateClient();
        WireForeignTenantScopeHeaders(client, workspaceId, projectId);

        return client;
    }

    internal static void WireForeignTenantScopeHeaders(
        HttpClient client,
        Guid? workspaceId = null,
        Guid? projectId = null)
    {
        ArgumentNullException.ThrowIfNull(client);

        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-tenant-id",
            HarnessWellKnownTenants.ForeignTenantHeaderValue);
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-workspace-id",
            (workspaceId ?? ScopeIds.DefaultWorkspace).ToString("D"));
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-project-id",
            (projectId ?? ScopeIds.DefaultProject).ToString("D"));
    }
}

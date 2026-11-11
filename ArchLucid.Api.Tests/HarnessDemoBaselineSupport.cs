using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>Contoso retail demo baseline used by inspect, insight-signal, and related Core endpoint tests.</summary>
internal static class HarnessDemoBaselineSupport
{
    internal static Guid AuthorityRunId => ContosoRetailDemoIdentifiers.AuthorityRunBaselineId;

    internal static Guid AuthorityRunHardenedId => ContosoRetailDemoIdentifiers.AuthorityRunHardenedId;

    /// <summary>Authority run id as compact <c>N</c> format (marketing and demo DTO strings).</summary>
    internal static string AuthorityRunIdCompact => AuthorityRunId.ToString("N");

    /// <summary>Canonical demo run key surfaced on pilot/marketing endpoints.</summary>
    internal static string DemoRunId => ContosoRetailDemoIdentifiers.RunBaseline;

    /// <summary>Canonical hardened demo run key (leak-detection in greenfield polls).</summary>
    internal static string DemoRunHardened => ContosoRetailDemoIdentifiers.RunHardened;

    /// <summary>Canonical baseline manifest version string for Contoso demo fixtures.</summary>
    internal static string ManifestBaseline => ContosoRetailDemoIdentifiers.ManifestBaseline;

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

    /// <summary>Greenfield / tenant runs must not reuse canonical showcase run keys.</summary>
    internal static void AssertRunIdIsNotShowcase(string runId)
    {
        ArgumentException.ThrowIfNullOrEmpty(runId);

        runId.Should().NotBe(DemoRunId);
        runId.Should().NotBe(DemoRunHardened);
    }

    /// <summary>Exported text for real runs must not embed canonical showcase run keys.</summary>
    internal static void AssertTextExcludesShowcaseRunKeys(string text)
    {
        ArgumentNullException.ThrowIfNull(text);

        text.Should().NotContain(DemoRunId);
        text.Should().NotContain(DemoRunHardened);
    }

    /// <summary>Exported text must not embed Contoso authority run guids used in marketing/demo fixtures.</summary>
    internal static void AssertTextExcludesShowcaseAuthorityRunGuids(string text)
    {
        ArgumentNullException.ThrowIfNull(text);

        text.Should().NotContain(AuthorityRunId.ToString("D"));
        text.Should().NotContain(AuthorityRunHardenedId.ToString("D"));
    }
}

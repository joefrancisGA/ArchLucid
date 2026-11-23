using System.Net;
using ArchLucid.Api.Tests.Security;
using ArchLucid.Core.Scoping;
using FluentAssertions;

namespace ArchLucid.Api.Tests.Planning;

/// <summary>
/// Uses the existing authority-chain seed and real HTTP clients. A scope is never
/// authorized merely because it knows the other tenant's run identifier.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class SecureNowPersistedTenantHttpTests(ArchLucidApiFactory factory)
    : IClassFixture<ArchLucidApiFactory>
{
    [SkippableFact]
    public async Task Disabled_exchange_hides_seeded_graph_from_owner_and_foreign_tenant()
    {
        using HttpClient owner = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(owner);

        Guid run = await AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync(
            factory.Services, CancellationToken.None);

        string url = $"/v1/evidence-graph/snapshot?runId={run:D}&asOf={Uri.EscapeDataString(DateTimeOffset.UtcNow.AddMinutes(1).ToString("O"))}";
        using HttpResponseMessage ownerResponse = await owner.GetAsync(url);

        // This factory uses production-default feature flags. A seeded
        // authority graph must remain completely undiscoverable while
        // SecureNow.ReadOnlySnapshotExchange is disabled. The separate
        // SecureNowEnabledPersistedHttpTests factory explicitly enables
        // exchange and REQUIRES owner 200 / cross-tenant 404.
        ownerResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);

        GreenfieldIntegrationTenantScope.Scope foreignScope = GreenfieldIntegrationTenantScope.CreateUniqueScope();
        await GreenfieldIntegrationTenantScope.EnsureScopeAsync(factory.SqlConnectionString, foreignScope);
        using HttpClient outsider = factory.CreateClient();
        GreenfieldIntegrationTenantScope.WireScope(outsider, foreignScope);
        using HttpResponseMessage denied = await outsider.GetAsync(url);
        denied.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}

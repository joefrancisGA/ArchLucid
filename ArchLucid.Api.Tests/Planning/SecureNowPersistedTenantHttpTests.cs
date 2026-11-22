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
    public async Task Seeded_default_scope_graph_is_not_visible_to_foreign_tenant()
    {
        using HttpClient owner = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(owner);

        Guid run = await AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync(
            factory.Services, CancellationToken.None);

        string url = $"/v1/evidence-graph/snapshot?runId={run:D}&asOf={Uri.EscapeDataString(DateTimeOffset.UtcNow.AddMinutes(1).ToString("O"))}";
        using HttpResponseMessage ownerResponse = await owner.GetAsync(url);

        // A seeded graph may still be rejected by sealed-manifest/pin guards.
        // It must never be misrepresented as a successful authorized read.
        ownerResponse.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK, HttpStatusCode.Conflict);

        GreenfieldIntegrationTenantScope.Scope foreignScope = GreenfieldIntegrationTenantScope.CreateUniqueScope();
        await GreenfieldIntegrationTenantScope.EnsureScopeAsync(factory.SqlConnectionString, foreignScope);
        using HttpClient outsider = factory.CreateClient();
        GreenfieldIntegrationTenantScope.WireScope(outsider, foreignScope);
        using HttpResponseMessage denied = await outsider.GetAsync(url);
        denied.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}

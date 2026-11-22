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

        using HttpClient outsider = factory.CreateClient();
        GreenfieldIntegrationTenantScope.WireScope(
            outsider,
            Guid.Parse("99999999-9999-4999-8999-999999999999"),
            Guid.Parse("88888888-8888-4888-8888-888888888888"),
            Guid.Parse("77777777-7777-4777-8777-777777777777"));
        using HttpResponseMessage denied = await outsider.GetAsync(url);
        denied.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}

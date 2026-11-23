using System.Net;
using ArchLucid.Api.Tests.Security;
using FluentAssertions;

namespace ArchLucid.Api.Tests.Planning;

/// <summary>
/// Exercises two distinct authenticated test scopes through real HTTP middleware.
/// No cross-tenant graph is seeded: this verifies fail-closed unknown-run behavior
/// but must not be represented as a complete populated-tenant isolation proof.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class SecureNowSnapshotTwoTenantHttpTests(GreenfieldSqlApiFactory factory)
    : IClassFixture<GreenfieldSqlApiFactory>
{
    [SkippableFact]
    public async Task Two_distinct_tenants_cannot_resolve_unknown_graph_run()
    {
        Guid tenantA = Guid.Parse("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
        Guid tenantB = Guid.Parse("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
        Guid workspaceA = Guid.Parse("aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa");
        Guid workspaceB = Guid.Parse("bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb");
        Guid projectA = Guid.Parse("aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa");
        Guid projectB = Guid.Parse("bbbbbbbb-4444-4444-8444-bbbbbbbbbbbb");
        Guid unknownRun = HarnessWellKnownGuids.UnknownRunForStoredEvidenceFiles;
        // This is a read-only unknown-run denial test. The shared tenant scenario's
        // create-run primer posts an unrelated architecture request; its HTTP 400
        // prevented this fail-closed contract from being exercised on SQL CI.
        // GreenfieldSqlApiFactory already verifies /health/ready on host startup.
        using HttpClient clientA = factory.CreateClient();
        using HttpClient clientB = factory.CreateClient();
        GreenfieldIntegrationTenantScope.WireScope(clientA, tenantA, workspaceA, projectA);
        GreenfieldIntegrationTenantScope.WireScope(clientB, tenantB, workspaceB, projectB);

        string url = $"/v1/evidence-graph/snapshot?runId={unknownRun:D}&asOf=2026-11-22T09%3A00%3A00Z";
        using HttpResponseMessage a = await clientA.GetAsync(url);
        using HttpResponseMessage b = await clientB.GetAsync(url);
        a.StatusCode.Should().Be(HttpStatusCode.NotFound);
        b.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}

using System.Net;
using FluentAssertions;

namespace ArchLucid.Api.Tests.Planning;

/// <summary>
/// HTTP pipeline smoke checks using the existing integration factory.
/// These intentionally do not seed cross-tenant graph data.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class SecureNowSnapshotHttpIntegrationTests(ArchLucidApiFactory factory)
    : IClassFixture<ArchLucidApiFactory>
{
    [SkippableFact]
    public async Task Disabled_exchange_is_hidden_over_real_http()
    {
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        Guid run = HarnessWellKnownGuids.UnknownRunForStoredEvidenceFiles;
        using HttpResponseMessage response = await client.GetAsync(
            $"/v1/evidence-graph/snapshot?runId={run:D}&asOf=2026-11-22T09%3A00%3A00Z&secureNowExchange=true");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task Default_temporal_snapshot_still_uses_existing_not_found_semantics()
    {
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        Guid run = HarnessWellKnownGuids.UnknownRunForStoredEvidenceFiles;
        using HttpResponseMessage response = await client.GetAsync(
            $"/v1/evidence-graph/snapshot?runId={run:D}&asOf=2026-11-22T09%3A00%3A00Z");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}

using ArchLucid.Api.Models.Pilots;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class PilotInProductScorecardEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetInProductScorecard_returns_ok_with_metric_shape()
    {
        HttpResponseMessage response = await Client.GetPilotInProductScorecardHttpAsync();
        PilotInProductScorecardResponse body =
            await response.ReadJsonForTestAsync<PilotInProductScorecardResponse>(JsonOptions);

        body.TenantId.Should().NotBeEmpty();
        body.TotalRunsCommitted.Should().BeGreaterThanOrEqualTo(0);
        body.TotalManifestsCreated.Should().BeGreaterThanOrEqualTo(0);
        body.RoiEstimate.Should().BeNull();
    }
}

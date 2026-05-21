using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Routing;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>GET /v1/roi/executive-summary</c>.</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class ExecutiveRoiSummaryEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetExecutiveSummary_returns_ok_with_expected_shape()
    {
        HttpResponseMessage response = await Client.GetAsync($"/{ApiV1Routes.RoiExecutiveSummary}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        ExecutiveRoiSummaryResponse? body =
            await response.Content.ReadFromJsonAsync<ExecutiveRoiSummaryResponse>(JsonOptions);

        body.Should().NotBeNull();
        body.Systems.Should().NotBeNull();
        body.TopSystemicIssues.Should().NotBeNull();
        body.TotalEstimatedUsdSavings.Should().BeGreaterThanOrEqualTo(0m);
        body.SystemCount.Should().Be(body.Systems.Count);
        body.LatestRunCount.Should().Be(body.Systems.Count);
    }
}

using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Routing;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>GET /v1/roi/sponsor-report</c>.</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class SponsorRoiSummaryEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetSponsorReport_returns_ok_with_expected_shape()
    {
        HttpResponseMessage response = await Client.GetAsync($"/{ApiV1Routes.RoiSponsorReport}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        SponsorRoiSummaryResponse? body =
            await response.Content.ReadFromJsonAsync<SponsorRoiSummaryResponse>(JsonOptions);

        body.Should().NotBeNull();
        body.Systems.Should().NotBeNull();
        body.TopSystemicIssues.Should().NotBeNull();
        body.TotalEstimatedUsdSavings.Should().BeGreaterThanOrEqualTo(0m);
        body.SystemCount.Should().Be(body.Systems.Count);
        body.LatestRunCount.Should().Be(body.Systems.Count);
    }
}

using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Contracts;
using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     HTTP coverage for <see cref="ArchLucid.Api.Controllers.Advisory.AdvisoryController.ListRecommendations" />
///     (<c>GET /v1/advisory/runs/{finalized.RunId}/recommendations</c>).
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class AdvisoryControllerListRecommendationsIntegrationTests(ArchLucidApiFactory factory)
    : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task ListRecommendations_for_run_with_no_rows_returns_ok_empty_array()
    {
        Guid unusedRunId = Guid.Parse("00000000-0000-0000-0000-00000000bb01");

        HttpResponseMessage response = await Client.GetAsync(
            $"/v1/advisory/runs/{unusedRunId:D}/recommendations");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        AdvisoryRunRecommendationsListResponse? payload =
            await response.ReadJsonForTestAsync<AdvisoryRunRecommendationsListResponse>(JsonOptions);

        payload.Should().NotBeNull();
        payload!.Recommendations.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task ListRecommendations_after_commit_before_improvements_returns_ok_empty_array()
    {
        FinalizedRun finalized = await CreateFinalizedRunAsync(TestRequestIds.ForScenario(nameof(AdvisoryControllerListRecommendationsIntegrationTests)));
        HttpResponseMessage response = await Client.GetAsync($"/v1/advisory/runs/{finalized.RunId}/recommendations");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        AdvisoryRunRecommendationsListResponse? payload =
            await response.ReadJsonForTestAsync<AdvisoryRunRecommendationsListResponse>(JsonOptions);

        payload.Should().NotBeNull();
        payload!.Recommendations.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task ListRecommendations_after_improvements_includes_finding_source_evidence_links()
    {
        FinalizedRun finalized = await CreateFinalizedRunAsync(TestRequestIds.ForScenario(nameof(AdvisoryControllerListRecommendationsIntegrationTests)));

        HttpResponseMessage improvementsResponse =
            await Client.GetAsync($"/v1/advisory/runs/{finalized.RunId}/improvements");
        await improvementsResponse.EnsureSuccessForTestAsync();

        HttpResponseMessage response = await Client.GetAsync($"/v1/advisory/runs/{finalized.RunId}/recommendations");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        AdvisoryRunRecommendationsListResponse? payload =
            await response.ReadJsonForTestAsync<AdvisoryRunRecommendationsListResponse>(JsonOptions);

        payload.Should().NotBeNull();
        payload!.Recommendations.Should().NotBeEmpty();

        RecommendationRecordResponse findingBacked = payload.Recommendations
            .First(rec => rec.SourceEvidenceLinks.Any(link =>
                string.Equals(link.Kind, "finding", StringComparison.OrdinalIgnoreCase)));

        findingBacked.SourceEvidenceLinks.Should().Contain(link =>
            string.Equals(link.Kind, "finding", StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(link.Id));
    }
}

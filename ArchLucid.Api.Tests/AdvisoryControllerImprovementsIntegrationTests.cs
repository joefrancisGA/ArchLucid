using System.Net;
using System.Net.Http.Json;

using FluentAssertions;

using Microsoft.AspNetCore.WebUtilities;

namespace ArchLucid.Api.Tests;

/// <summary>
///     HTTP coverage for <see cref="ArchLucid.Api.Controllers.Advisory.AdvisoryController" /> improvements path
///     (<c>GET /v1/advisory/runs/{finalized.RunId}/improvements</c>) — lowest-covered API surface per coverage gap analysis.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class AdvisoryControllerImprovementsIntegrationTests(ArchLucidApiFactory factory)
    : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetImprovements_unknown_run_returns_404_problem()
    {
        HttpResponseMessage response = await Client.GetAsync(
            "/v1/advisory/runs/00000000-0000-0000-0000-00000000aa01/improvements");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        await response.AssertProblemForTestAsync(HttpStatusCode.NotFound, ProblemTypes.RunNotFound);
    }

    [SkippableFact]
    public async Task GetImprovements_compareTo_missing_run_returns_404_run_problem()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();
        Guid primaryRunId = finalized.RunGuid;

        Guid missingCompareRunId = Guid.Parse("00000000-0000-0000-0000-00000000aa02");
        string improvementsPath = QueryHelpers.AddQueryString(
            $"/v1/advisory/runs/{primaryRunId:D}/improvements",
            "compareToRunId",
            missingCompareRunId.ToString("D"));

        HttpResponseMessage response = await Client.GetAsync(improvementsPath);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        await response.AssertProblemForTestAsync(
            HttpStatusCode.NotFound,
            ProblemTypes.RunNotFound,
            detailContains: "Comparison run");
    }
}

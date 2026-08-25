using System.Net;
using System.Net.Http.Json;

using FluentAssertions;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Api.Tests;

/// <summary>
///     HTTP coverage for canonical <c>/v1/runs/*</c> read routes on
///     <see cref="ArchLucid.Api.Controllers.Authority.AuthorityReadsController" />.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class AuthorityReadsControllerIntegrationTests(ArchLucidApiFactory factory)
    : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task ListRuns_returns_cursor_paged_envelope()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/runs?take=20");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("\"items\"");
        body.Should().Contain("\"requestedTake\"");
    }

    [SkippableFact]
    public async Task GetRunDetail_unknown_run_returns_404_problem()
    {
        Guid missing = Guid.Parse("00000000-0000-0000-0000-00000000cc02");
        HttpResponseMessage response = await Client.GetAsync($"/v1/runs/{missing:D}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        MvcProblemDetails? problem = await response.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem.Should().NotBeNull();
        problem!.Type.Should().Be(ProblemTypes.RunNotFound);
    }

    [SkippableFact]
    public async Task GetReviewTrail_unknown_run_returns_404_problem()
    {
        Guid missing = Guid.Parse("00000000-0000-0000-0000-00000000cc03");
        HttpResponseMessage response = await Client.GetAsync($"/v1/runs/{missing:D}/review-trail");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task Legacy_authority_list_route_still_serves_same_envelope_shape()
    {
        HttpResponseMessage canonical = await Client.GetAsync("/v1/runs?take=5");
        HttpResponseMessage legacy = await Client.GetAsync("/v1/authority/reviews?take=5");

        canonical.StatusCode.Should().Be(HttpStatusCode.OK);
        legacy.StatusCode.Should().Be(HttpStatusCode.OK);

        string canonicalBody = await canonical.Content.ReadAsStringAsync();
        string legacyBody = await legacy.Content.ReadAsStringAsync();

        canonicalBody.Should().Contain("\"items\"");
        legacyBody.Should().Contain("\"items\"");
    }
}

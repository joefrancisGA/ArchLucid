using System.Net;
using System.Text.Json;

using FluentAssertions;

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
        string body = await Client.ReadRunsListBodyAsync();

        body.Should().Contain("\"items\"");
        body.Should().Contain("\"requestedTake\"");
    }

    [SkippableFact]
    public async Task GetRunDetail_unknown_run_returns_404_problem()
    {
        HttpResponseMessage response = await Client.GetRunDetailHttpAsync(HarnessWellKnownGuids.UnknownCanonicalRunDetail);

        JsonDocument problem = await response.AssertRunNotFoundAsync();
        problem.RootElement.GetProperty("type").GetString().Should().Be(ProblemTypes.RunNotFound);
    }

    [SkippableFact]
    public async Task GetReviewTrail_unknown_run_returns_404_problem()
    {
        HttpResponseMessage response = await Client.GetRunReviewTrailHttpAsync(HarnessWellKnownGuids.UnknownAuthorityRunForSmoke);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task Legacy_authority_list_route_still_serves_same_envelope_shape()
    {
        string canonicalBody = await Client.ReadRunsListBodyAsync(take: 5);

        HttpResponseMessage legacy = await Client.GetAuthorityReviewsInScopeHttpAsync("take=5");
        await legacy.EnsureSuccessForTestAsync();
        string legacyBody = await legacy.Content.ReadAsStringAsync();

        canonicalBody.Should().Contain("\"items\"");
        legacyBody.Should().Contain("\"items\"");
    }
}

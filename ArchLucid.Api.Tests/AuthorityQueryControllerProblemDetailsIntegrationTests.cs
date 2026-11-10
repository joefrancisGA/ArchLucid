using System.Net;
using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Problem-details branches on <see cref="ArchLucid.Api.Controllers.Authority.AuthorityQueryController" />:
///     validation (whitespace project id), missing run summary, and provenance preconditions (422).
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class AuthorityQueryControllerProblemDetailsIntegrationTests(ArchLucidApiFactory factory)
    : IntegrationTestBase(factory)
{
    [Theory]
    [InlineData("%20")]
    [InlineData("%09")]
    public async Task ListRunsByProject_whitespace_project_id_returns_400_problem(string encodedWhitespaceProjectId)
    {
        HttpResponseMessage response =
            await Client.GetAuthorityProjectReviewsHttpAsync(encodedWhitespaceProjectId, querySuffix: null);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        string body = await response.Content.ReadAsStringAsync();
        body.ToLowerInvariant().Should().Contain("projectid");
    }

    [SkippableFact]
    public async Task GetRunSummary_unknown_run_returns_404_problem()
    {
        HttpResponseMessage response = await Client.GetAuthorityReviewSummaryHttpAsync(
            HarnessWellKnownGuids.UnknownAuthorityRunForSummary);

        JsonDocument problem = await response.AssertProblemForTestAsync(
            HttpStatusCode.NotFound,
            ProblemTypes.RunNotFound);
        problem.RootElement.GetProperty("type").GetString().Should().Be(ProblemTypes.RunNotFound);
    }

    [SkippableFact]
    public async Task GetRunProvenance_when_run_lacks_snapshot_chain_returns_422_problem()
    {
        Guid runId =
            await AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync(Factory.Services, CancellationToken.None);

        HttpResponseMessage response = await Client.GetAuthorityRunProvenanceHttpAsync(runId);

        JsonDocument problem = await response.AssertProblemForTestAsync(
            HttpStatusCode.UnprocessableEntity,
            ProblemTypes.ValidationFailed);
        problem.RootElement.GetProperty("type").GetString().Should().Be(ProblemTypes.ValidationFailed);
        problem.RootElement.GetProperty("detail").GetString().Should().Contain("Provenance requires");
    }
}

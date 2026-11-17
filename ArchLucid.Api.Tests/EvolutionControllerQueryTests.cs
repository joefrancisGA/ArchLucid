using System.Net;

using ArchLucid.Api.Models.Evolution;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>Read and validation paths for <c>/v1/evolution/*</c> on a dedicated factory instance (no seeding).</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Trait("ChangeSet", "60R")]
public sealed class EvolutionControllerQueryTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task ListCandidates_Default_ReturnsOk_Empty()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/evolution/candidates");

        EvolutionCandidateChangeSetListResponse body =
            await response.ReadJsonForTestAsync<EvolutionCandidateChangeSetListResponse>(JsonOptions);

        body.Candidates.Should().NotBeNull();
        body.Candidates.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task ListCandidates_InvalidMax_Returns400Problem()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/evolution/candidates?max=0");

        await response.AssertProblemForTestAsync(HttpStatusCode.BadRequest, ProblemTypes.ValidationFailed);
    }

    [SkippableFact]
    public async Task GetCandidate_Unknown_Returns404Problem()
    {
        HttpResponseMessage response =
            await Client.GetAsync("/v1/evolution/candidates/00000000-0000-0000-0000-000000000002");

        await response.AssertProblemForTestAsync(
            HttpStatusCode.NotFound,
            ProblemTypes.EvolutionCandidateChangeSetNotFound);
    }

    [SkippableFact]
    public async Task GetResults_UnknownCandidate_Returns404Problem()
    {
        HttpResponseMessage response =
            await Client.GetAsync("/v1/evolution/results/00000000-0000-0000-0000-000000000099");

        await response.AssertProblemForTestAsync(
            HttpStatusCode.NotFound,
            ProblemTypes.EvolutionCandidateChangeSetNotFound);
    }

    [SkippableFact]
    public async Task ExportResults_UnknownCandidate_Returns404Problem()
    {
        HttpResponseMessage response = await Client.GetAsync(
            "/v1/evolution/results/00000000-0000-0000-0000-000000000088/export?format=markdown");

        await response.AssertProblemForTestAsync(
            HttpStatusCode.NotFound,
            ProblemTypes.EvolutionCandidateChangeSetNotFound);
    }

    [SkippableFact]
    public async Task ExportResults_InvalidFormat_Returns400Problem()
    {
        Guid candidateId = Guid.Parse("00000000-0000-0000-0000-000000000077");
        HttpResponseMessage response =
            await Client.GetAsync($"/v1/evolution/results/{candidateId:D}/export?format=xml");

        await response.AssertProblemForTestAsync(HttpStatusCode.BadRequest, ProblemTypes.ValidationFailed);
    }

    [SkippableFact]
    public async Task CreateFromPlan_UnknownPlan_Returns404Problem()
    {
        HttpResponseMessage response = await Client.PostAsync(
            "/v1/evolution/candidates/from-plan/00000000-0000-0000-0000-000000000001",
            null);

        await response.AssertProblemForTestAsync(
            HttpStatusCode.NotFound,
            ProblemTypes.LearningImprovementPlanNotFound);
    }

    [SkippableFact]
    public async Task Simulate_UnknownCandidate_Returns404Problem()
    {
        HttpResponseMessage response = await Client.PostAsync(
            "/v1/evolution/simulate/00000000-0000-0000-0000-0000000000aa",
            null);

        await response.AssertProblemForTestAsync(
            HttpStatusCode.NotFound,
            ProblemTypes.EvolutionCandidateChangeSetNotFound);
    }

    [SkippableFact]
    public async Task ExportResults_OmittedFormat_UnknownCandidate_Returns404Problem()
    {
        HttpResponseMessage response = await Client.GetAsync(
            "/v1/evolution/results/00000000-0000-0000-0000-0000000000bb/export");

        await response.AssertProblemForTestAsync(
            HttpStatusCode.NotFound,
            ProblemTypes.EvolutionCandidateChangeSetNotFound);
    }
}

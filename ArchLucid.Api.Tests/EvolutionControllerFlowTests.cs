using System.Net;

using ArchLucid.Api.Models.Evolution;
using ArchLucid.Contracts.Evolution;
using ArchLucid.Contracts.ProductLearning.Planning;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Coordination.ProductLearning.Planning;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>Execute paths for <c>/v1/evolution/*</c> (separate fixture from query tests so list endpoints stay isolated).</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Trait("ChangeSet", "60R")]
public sealed class EvolutionControllerFlowTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task ShadowEvaluate_UnknownCandidate_Returns404Problem()
    {
        HttpResponseMessage response = await Client.PostAsync(
            "/v1/evolution/candidates/00000000-0000-0000-0000-000000000003/shadow-evaluate",
            null);

        await response.AssertProblemForTestAsync(
            HttpStatusCode.NotFound,
            ProblemTypes.EvolutionCandidateChangeSetNotFound);
    }

    [SkippableFact]
    public async Task PlanWithNoLinkedRuns_CreateShadowGet_YieldsSimulatedCandidateWithNoSimulationRows()
    {
        Guid planId = await SeedMinimalPlanInDefaultScopeAsync();

        EvolutionCandidateChangeSetResponse created = await CreateCandidateFromPlanAsync(planId);

        created.SourcePlanId.Should().Be(planId);
        created.Status.Should().Be(EvolutionCandidateChangeSetStatusValues.Draft);
        created.DerivationRuleVersion.Should().Be("60R-v1");

        EvolutionShadowEvaluateResponse shadowBody = await ShadowEvaluateAsync(created.CandidateChangeSetId);

        shadowBody.SimulationRuns.Should().BeEmpty();

        EvolutionCandidateDetailResponse detail = await GetCandidateDetailAsync(created.CandidateChangeSetId);

        detail.Candidate.Status.Should().Be(EvolutionCandidateChangeSetStatusValues.Simulated);
        detail.SimulationRuns.Should().BeEmpty();
        detail.PlanSnapshotJson.Should().NotBeNullOrWhiteSpace();
    }

    [SkippableFact]
    public async Task Simulate_ThenGetResults_NoLinkedRuns_ReturnsCandidateAndEmptyRuns()
    {
        Guid planId = await SeedMinimalPlanInDefaultScopeAsync();

        EvolutionCandidateChangeSetResponse created = await CreateCandidateFromPlanAsync(planId);

        EvolutionSimulateResponse simBody = await SimulateAsync(created.CandidateChangeSetId);

        simBody.Candidate.CandidateChangeSetId.Should().Be(created.CandidateChangeSetId);
        simBody.SimulationRuns.Should().BeEmpty();

        EvolutionResultsResponse resultsBody = await GetResultsAsync(created.CandidateChangeSetId);

        resultsBody.Candidate.CandidateChangeSetId.Should().Be(created.CandidateChangeSetId);
        resultsBody.PlanSnapshotJson.Should().NotBeNullOrWhiteSpace();
        resultsBody.SimulationRuns.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task ExportResults_MarkdownAndJson_ContainDescriptionDiffAndSchema()
    {
        Guid planId = await SeedMinimalPlanInDefaultScopeAsync();

        EvolutionCandidateChangeSetResponse created = await CreateCandidateFromPlanAsync(planId);

        await SimulateAsync(created.CandidateChangeSetId);

        Guid candidateId = created.CandidateChangeSetId;

        HttpResponseMessage markdownResponse =
            await Client.GetAsync($"/v1/evolution/results/{candidateId:D}/export?format=markdown");

        markdownResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        string markdown = await markdownResponse.Content.ReadAsStringAsync();
        markdown.Should().Contain("Evolution test plan");
        markdown.Should().Contain("60R-simulation-export-v1");
        markdown.Should().Contain("## Simulation results");
        markdown.Should().Contain("No simulation rows persisted for this candidate.");

        HttpResponseMessage jsonResponse =
            await Client.GetAsync($"/v1/evolution/results/{candidateId:D}/export?format=json");

        jsonResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        string json = await jsonResponse.Content.ReadAsStringAsync();
        json.Should().Contain("Evolution test plan");
        json.Should().Contain("60R-simulation-export-v1");
        json.Should().Contain("\"simulationRuns\"");
    }

    private async Task<EvolutionCandidateChangeSetResponse> CreateCandidateFromPlanAsync(Guid planId)
    {
        HttpResponseMessage response = await Client.PostAsync($"/v1/evolution/candidates/from-plan/{planId:D}", null);

        return await response.ReadJsonForTestAsync<EvolutionCandidateChangeSetResponse>(JsonOptions);
    }

    private async Task<EvolutionShadowEvaluateResponse> ShadowEvaluateAsync(Guid candidateId)
    {
        HttpResponseMessage response =
            await Client.PostAsync($"/v1/evolution/candidates/{candidateId:D}/shadow-evaluate", null);

        return await response.ReadJsonForTestAsync<EvolutionShadowEvaluateResponse>(JsonOptions);
    }

    private async Task<EvolutionCandidateDetailResponse> GetCandidateDetailAsync(Guid candidateId)
    {
        HttpResponseMessage response = await Client.GetAsync($"/v1/evolution/candidates/{candidateId:D}");

        return await response.ReadJsonForTestAsync<EvolutionCandidateDetailResponse>(JsonOptions);
    }

    private async Task<EvolutionSimulateResponse> SimulateAsync(Guid candidateId)
    {
        HttpResponseMessage response = await Client.PostAsync($"/v1/evolution/simulate/{candidateId:D}", null);

        return await response.ReadJsonForTestAsync<EvolutionSimulateResponse>(JsonOptions);
    }

    private async Task<EvolutionResultsResponse> GetResultsAsync(Guid candidateId)
    {
        HttpResponseMessage response = await Client.GetAsync($"/v1/evolution/results/{candidateId:D}");

        return await response.ReadJsonForTestAsync<EvolutionResultsResponse>(JsonOptions);
    }

    private async Task<Guid> SeedMinimalPlanInDefaultScopeAsync()
    {
        using IServiceScope scope = Factory.Services.CreateScope();
        IProductLearningPlanningRepository planning =
            scope.ServiceProvider.GetRequiredService<IProductLearningPlanningRepository>();

        Guid themeId = Guid.NewGuid();
        string themeKey = "evolution-test-" + themeId.ToString("N");

        await planning.InsertThemeAsync(
            new ProductLearningImprovementThemeRecord
            {
                ThemeId = themeId,
                TenantId = ScopeIds.DefaultTenant,
                WorkspaceId = ScopeIds.DefaultWorkspace,
                ProjectId = ScopeIds.DefaultProject,
                ThemeKey = themeKey,
                Title = "Evolution test theme",
                Summary = "Seeded for 60R API tests.",
                AffectedArtifactTypeOrWorkflowArea = "Test",
                SeverityBand = "Low",
                DerivationRuleVersion = "test"
            },
            CancellationToken.None);

        Guid planId = Guid.NewGuid();

        await planning.InsertPlanAsync(
            new ProductLearningImprovementPlanRecord
            {
                PlanId = planId,
                TenantId = ScopeIds.DefaultTenant,
                WorkspaceId = ScopeIds.DefaultWorkspace,
                ProjectId = ScopeIds.DefaultProject,
                ThemeId = themeId,
                Title = "Evolution test plan",
                Summary = "No linked runs; shadow path completes without simulation rows.",
                ActionSteps =
                [
                    new ProductLearningImprovementPlanActionStep
                    {
                        Ordinal = 1, ActionType = "Observe", Description = "Observe only."
                    }
                ]
            },
            CancellationToken.None);

        return planId;
    }
}

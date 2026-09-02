using ArchLucid.Api.Models.Evolution;
using ArchLucid.Api.Services.Evolution;
using ArchLucid.Contracts.Evolution;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Persistence.Coordination.Evolution;

using FluentAssertions;

using Moq;

namespace ArchLucid.Api.Tests.Services.Evolution;

[Trait("Category", "Unit")]
public sealed class EvolutionApplicationFacadeTests
{
  private static readonly ProductLearningScope Scope = new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
    };

    [Fact]
    public async Task TryLoadCandidateBundleAsync_returns_null_when_candidate_missing()
    {
        Guid candidateId = Guid.NewGuid();

        Mock<IEvolutionCandidateChangeSetRepository> candidates = new();
        candidates
            .Setup(r => r.GetByIdAsync(candidateId, Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync((EvolutionCandidateChangeSetRecord?)null);

        EvolutionApplicationFacade sut = new(candidates.Object, new Mock<IEvolutionSimulationRunRepository>().Object);

        EvolutionCandidateReadBundle? bundle =
            await sut.TryLoadCandidateBundleAsync(candidateId, Scope, CancellationToken.None);

        bundle.Should().BeNull();
    }

    [Fact]
    public async Task TryBuildResultsResponseAsync_maps_candidate_and_simulation_runs()
    {
        Guid candidateId = Guid.NewGuid();
        EvolutionCandidateChangeSetRecord candidate = new()
        {
            CandidateChangeSetId = candidateId,
            PlanSnapshotJson = "{\"plan\":true}",
        };

        List<EvolutionSimulationRunRecord> runs = [
            new()
            {
                CandidateChangeSetId = candidateId,
                OutcomeJson = "{\"schemaVersion\":\"60R-v2\"}",
            }
        ];

        Mock<IEvolutionCandidateChangeSetRepository> candidates = new();
        candidates
            .Setup(r => r.GetByIdAsync(candidateId, Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(candidate);

        Mock<IEvolutionSimulationRunRepository> simulations = new();
        simulations
            .Setup(r => r.ListByCandidateAsync(candidateId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(runs);

        EvolutionApplicationFacade sut = new(candidates.Object, simulations.Object);

        EvolutionResultsResponse? response =
            await sut.TryBuildResultsResponseAsync(candidateId, Scope, CancellationToken.None);

        response.Should().NotBeNull();
        response!.Candidate.CandidateChangeSetId.Should().Be(candidateId);
        response.PlanSnapshotJson.Should().Be(candidate.PlanSnapshotJson);
        response.SimulationRuns.Should().HaveCount(1);
    }
}

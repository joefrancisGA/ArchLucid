using ArchLucid.Contracts.Evolution;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Persistence.Coordination.Evolution;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Coordination.Evolution;

[Trait("Category", "Unit")]
public sealed class InMemoryEvolutionRepositoryCoverageTests
{
    [Fact]
    public async Task Candidate_change_set_repository_round_trips_insert_get_list_and_update()
    {
        InMemoryEvolutionCandidateChangeSetRepository sut = new();
        Guid candidateId = Guid.NewGuid();
        ProductLearningScope scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        EvolutionCandidateChangeSetRecord record = new()
        {
            CandidateChangeSetId = candidateId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            SourcePlanId = Guid.NewGuid(),
            Status = EvolutionCandidateChangeSetStatusValues.Draft,
            Title = "title",
            Summary = "summary",
            CreatedUtc = DateTime.UtcNow,
        };

        await sut.InsertAsync(record, CancellationToken.None);

        Func<Task> duplicate = () => sut.InsertAsync(record, CancellationToken.None);
        await duplicate.Should().ThrowAsync<InvalidOperationException>();

        EvolutionCandidateChangeSetRecord? loaded =
            await sut.GetByIdAsync(candidateId, scope, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.Title.Should().Be("title");

        await sut.UpdateStatusAsync(candidateId, scope, EvolutionCandidateChangeSetStatusValues.Simulated, CancellationToken.None);

        EvolutionCandidateChangeSetRecord? updated =
            await sut.GetByIdAsync(candidateId, scope, CancellationToken.None);

        updated!.Status.Should().Be(EvolutionCandidateChangeSetStatusValues.Simulated);

        IReadOnlyList<EvolutionCandidateChangeSetRecord> listed =
            await sut.ListAsync(scope, take: 10, CancellationToken.None);

        listed.Should().ContainSingle(x => x.CandidateChangeSetId == candidateId);
    }

    [Fact]
    public async Task Candidate_change_set_repository_returns_null_for_scope_mismatch()
    {
        InMemoryEvolutionCandidateChangeSetRepository sut = new();
        Guid candidateId = Guid.NewGuid();
        ProductLearningScope scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        await sut.InsertAsync(
            new EvolutionCandidateChangeSetRecord
            {
                CandidateChangeSetId = candidateId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                SourcePlanId = Guid.NewGuid(),
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        ProductLearningScope otherScope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
        };

        EvolutionCandidateChangeSetRecord? loaded =
            await sut.GetByIdAsync(candidateId, otherScope, CancellationToken.None);

        loaded.Should().BeNull();
    }

    [Fact]
    public async Task Simulation_run_repository_lists_and_deletes_by_candidate()
    {
        InMemoryEvolutionSimulationRunRepository sut = new();
        Guid candidateId = Guid.NewGuid();

        EvolutionSimulationRunRecord first = new()
        {
            SimulationRunId = Guid.NewGuid(),
            CandidateChangeSetId = candidateId,
            BaselineArchitectureRunId = "run-b",
            CompletedUtc = DateTime.UtcNow.AddMinutes(-1),
        };

        EvolutionSimulationRunRecord second = new()
        {
            SimulationRunId = Guid.NewGuid(),
            CandidateChangeSetId = candidateId,
            BaselineArchitectureRunId = "run-a",
            CompletedUtc = DateTime.UtcNow,
        };

        await sut.InsertAsync(first, CancellationToken.None);
        await sut.InsertAsync(second, CancellationToken.None);

        IReadOnlyList<EvolutionSimulationRunRecord> listed =
            await sut.ListByCandidateAsync(candidateId, CancellationToken.None);

        listed.Should().HaveCount(2);
        listed[0].BaselineArchitectureRunId.Should().Be("run-a");

        await sut.DeleteByCandidateAsync(candidateId, CancellationToken.None);

        (await sut.ListByCandidateAsync(candidateId, CancellationToken.None)).Should().BeEmpty();
    }
}

using ArchLucid.Application;
using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance.Coverage;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CoverageQueryServiceTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task Empty_run_assignments_set_legacy_coverage_not_recorded()
    {
        InMemoryCoverageAssignmentRepository repository = new();
        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(repo => repo.GetByIdAsync(TestScope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = Guid.NewGuid() });

        CoverageQueryService service = new(repository, new InMemoryPolicyPackRepository(), runRepository.Object);
        CoverageSummary summary = await service.GetByRunIdAsync(TestScope, Guid.NewGuid());

        summary.LegacyCoverageNotRecorded.Should().BeTrue();
        summary.Assignments.Should().BeEmpty();
    }

    [Fact]
    public async Task Empty_scope_assignments_set_legacy_coverage_not_recorded()
    {
        CoverageQueryService service = new(
            new InMemoryCoverageAssignmentRepository(),
            new InMemoryPolicyPackRepository(),
            Mock.Of<IRunRepository>());

        CoverageSummary summary = await service.GetByScopeAsync(TestScope);

        summary.LegacyCoverageNotRecorded.Should().BeTrue();
    }

    [Fact]
    public async Task Assignments_build_type_counts()
    {
        InMemoryCoverageAssignmentRepository repository = new();
        Guid packId = Guid.NewGuid();
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        await repository.AddAsync(CreateAssignment(CoverageType.ProviderNeutralBaseline, packId, runId));
        await repository.AddAsync(CreateAssignment(CoverageType.OrganizationRequired, packId, runId));
        await repository.AddAsync(CreateAssignment(CoverageType.ContextualRecommended, packId, runId));

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(repo => repo.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runGuid });

        InMemoryPolicyPackRepository packRepository = new();
        await packRepository.CreateAsync(CreatePack(packId), CancellationToken.None);

        CoverageQueryService service = new(repository, packRepository, runRepository.Object);
        CoverageSummary summary = await service.GetByRunIdAsync(TestScope, runGuid);

        summary.LegacyCoverageNotRecorded.Should().BeFalse();
        summary.ProviderNeutralBaselineCount.Should().Be(1);
        summary.OrganizationRequiredCount.Should().Be(1);
        summary.ContextualRecommendedCount.Should().Be(1);
        summary.Assignments.Should().HaveCount(3);
    }

    [Fact]
    public async Task Missing_run_throws_run_not_found()
    {
        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(repo => repo.GetByIdAsync(TestScope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        CoverageQueryService service = new(
            new InMemoryCoverageAssignmentRepository(),
            new InMemoryPolicyPackRepository(),
            runRepository.Object);

        Func<Task> act = () => service.GetByRunIdAsync(TestScope, Guid.NewGuid());

        await act.Should().ThrowAsync<RunNotFoundException>();
    }

    private static CoverageAssignment CreateAssignment(CoverageType type, Guid packId, string runId) => new()
    {
        CoverageAssignmentId = Guid.NewGuid(),
        TenantId = TestScope.TenantId,
        WorkspaceId = TestScope.WorkspaceId,
        ProjectId = TestScope.ProjectId,
        RunId = runId,
        PolicyPackId = packId,
        PolicyPackVersion = "1.0.0",
        CoverageType = type,
        SelectionState = CoverageSelectionState.OptionalAndSelected,
        ActorUserId = "operator",
        CreatedUtc = DateTime.UtcNow,
        EvaluationVersion = "coverage-v1",
        RecommendationConfidence = type == CoverageType.ContextualRecommended ? RecommendationConfidence.Medium : null,
    };

    private static PolicyPack CreatePack(Guid packId) => new()
    {
        PolicyPackId = packId,
        TenantId = TestScope.TenantId,
        WorkspaceId = TestScope.WorkspaceId,
        ProjectId = TestScope.ProjectId,
        Name = "Pack",
        Description = "Pack",
    };
}

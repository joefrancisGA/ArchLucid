using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class AuthorityFindingsSnapshotUpdaterTests
{
  private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task MergeSubstantiatedFindingsAsync_merges_only_substantiated_findings()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid snapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        RunRecord run = new()
        {
            RunId = runId,
            FindingsSnapshotId = snapshotId,
        };

        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = snapshotId,
            Findings = [],
        };

        SpecialistReviewFinding substantiated = new()
        {
            FindingId = "finding-substantiated",
            Title = "Substantiated gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        SpecialistFindingsSubstantiationResult substantiation = new()
        {
            SubstantiatedFindings = [substantiated],
            Challenges = [],
            ValidationResults = [],
        };

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(repository => repository.GetByIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(run);
        runRepository
            .Setup(repository => repository.UpdateAsync(run, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IFindingsSnapshotRepository> findingsRepository = new();
        findingsRepository
            .Setup(repository => repository.GetByIdAsync(TestScope, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);
        findingsRepository
            .Setup(repository => repository.SaveAsync(snapshot, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        AuthorityFindingsSnapshotUpdater sut = new(
            runRepository.Object,
            findingsRepository.Object,
            Mock.Of<ISpecialistFindingsSubstantiationService>(),
            TimeProvider.System);

        IReadOnlyList<string> mergedIds = await sut.MergeSubstantiatedFindingsAsync(
            TestScope,
            runId,
            substantiation,
            CancellationToken.None);

        mergedIds.Should().ContainSingle(id => id == "finding-substantiated");
        snapshot.Findings.Should().ContainSingle(finding => finding.FindingId == "finding-substantiated");
    }

    [Fact]
    public async Task MergeSubstantiatedFindingsAsync_creates_snapshot_when_run_has_none()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        RunRecord run = new()
        {
            RunId = runId,
            FindingsSnapshotId = null,
        };

        SpecialistReviewFinding substantiated = new()
        {
            FindingId = "finding-new-snapshot",
            Title = "New snapshot gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        SpecialistFindingsSubstantiationResult substantiation = new()
        {
            SubstantiatedFindings = [substantiated],
            Challenges = [],
            ValidationResults = [],
        };

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(repository => repository.GetByIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(run);
        runRepository
            .Setup(repository => repository.UpdateAsync(run, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IFindingsSnapshotRepository> findingsRepository = new();
        findingsRepository
            .Setup(repository => repository.SaveAsync(It.IsAny<FindingsSnapshot>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        AuthorityFindingsSnapshotUpdater sut = new(
            runRepository.Object,
            findingsRepository.Object,
            Mock.Of<ISpecialistFindingsSubstantiationService>(),
            TimeProvider.System);

        IReadOnlyList<string> mergedIds = await sut.MergeSubstantiatedFindingsAsync(
            TestScope,
            runId,
            substantiation,
            CancellationToken.None);

        mergedIds.Should().ContainSingle(id => id == "finding-new-snapshot");
        run.FindingsSnapshotId.Should().NotBeNull();
        findingsRepository.Verify(
            repository => repository.SaveAsync(
                It.Is<FindingsSnapshot>(snapshot =>
                    snapshot.Findings!.Any(finding => finding.FindingId == "finding-new-snapshot")),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}

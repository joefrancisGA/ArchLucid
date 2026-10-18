using ArchLucid.Application.InfraEvidence.RemediationPrioritization;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationPrioritizationRankBatchTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid PatternId = Guid.Parse("44444444-4444-4444-4444-444444444444");

    [Fact]
    public async Task RankOpenFindings_batches_metadata_versions_and_score_writes()
    {
        Guid findingA = Guid.NewGuid();
        Guid findingB = Guid.NewGuid();

        Mock<IProjectScopedOperationalSecurityFindingRepository> findingRepository = new();
        findingRepository
            .Setup(item => item.ListByScopeAsync(It.IsAny<ProjectScopeKey>(), OperationalSecurityFindingStatus.Open, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                CreateFinding(findingA),
                CreateFinding(findingB),
            ]);

        findingRepository
            .Setup(item => item.ListMetadataByFindingIdsInScopeAsync(
                It.IsAny<ProjectScopeKey>(),
                It.IsAny<IReadOnlyList<Guid>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        findingRepository
            .Setup(item => item.ListMetadataByFindingInScopeAsync(
                It.IsAny<ProjectScopeKey>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IOperationalSecurityExceptionRepository> exceptionRepository = new();
        exceptionRepository
            .Setup(item => item.ListByScopeAsync(It.IsAny<ProjectScopeKey>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IRemediationPatternMatchRepository> matchRepository = new();
        matchRepository
            .Setup(item => item.ListActiveMatchesByOpenFindingInScopeAsync(It.IsAny<ProjectScopeKey>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, RemediationPatternMatchResultRecord>
            {
                [findingA] = CreateMatch(findingA, "1.0.0"),
                [findingB] = CreateMatch(findingB, "1.0.0"),
            });

        Mock<IRemediationPatternRepository> patternRepository = new();
        patternRepository
            .Setup(item => item.TryGetVersionsAsync(
                TenantId,
                It.IsAny<IReadOnlyList<RemediationPatternVersionKey>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([CreateVersion("1.0.0")]);

        Mock<IRemediationPrioritizationRepository> prioritizationRepository = new();
        prioritizationRepository
            .Setup(item => item.TryGetWeightsAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RemediationPrioritizationWeightsRecord?)null);

        RemediationPrioritizationService sut = new(
            findingRepository.Object,
            exceptionRepository.Object,
            matchRepository.Object,
            patternRepository.Object,
            prioritizationRepository.Object);

        await sut.RankOpenFindingsAsync(CreateScope(), "operator");

        findingRepository.Verify(
            item => item.ListMetadataByFindingIdsInScopeAsync(
                It.IsAny<ProjectScopeKey>(),
                It.Is<IReadOnlyList<Guid>>(ids => ids.Count == 2),
                It.IsAny<CancellationToken>()),
            Times.Once);

        patternRepository.Verify(
            item => item.TryGetVersionsAsync(
                TenantId,
                It.Is<IReadOnlyList<RemediationPatternVersionKey>>(keys => keys.Count == 1),
                It.IsAny<CancellationToken>()),
            Times.Once);

        prioritizationRepository.Verify(
            item => item.UpsertScoresInScopeAsync(
                It.IsAny<ProjectScopeKey>(),
                It.Is<IReadOnlyList<RemediationPrioritizationScoreMutation>>(rows => rows.Count == 2),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetExplanation_still_reads_metadata_per_finding()
    {
        Guid findingId = Guid.NewGuid();

        Mock<IProjectScopedOperationalSecurityFindingRepository> findingRepository = new();
        findingRepository
            .Setup(item => item.TryGetByIdInScopeAsync(It.IsAny<ProjectScopeKey>(), findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateFinding(findingId));

        findingRepository
            .Setup(item => item.ListMetadataByFindingInScopeAsync(It.IsAny<ProjectScopeKey>(), findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IOperationalSecurityExceptionRepository> exceptionRepository = new();
        exceptionRepository
            .Setup(item => item.HasActiveExceptionForFindingInScopeAsync(
                It.IsAny<ProjectScopeKey>(),
                findingId,
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<IRemediationPatternMatchRepository> matchRepository = new();
        matchRepository
            .Setup(item => item.TryGetActiveMatchInScopeAsync(It.IsAny<ProjectScopeKey>(), findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RemediationPatternMatchResultRecord?)null);

        Mock<IRemediationPatternRepository> patternRepository = new();
        Mock<IRemediationPrioritizationRepository> prioritizationRepository = new();
        prioritizationRepository
            .Setup(item => item.TryGetWeightsAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RemediationPrioritizationWeightsRecord?)null);

        RemediationPrioritizationService sut = new(
            findingRepository.Object,
            exceptionRepository.Object,
            matchRepository.Object,
            patternRepository.Object,
            prioritizationRepository.Object);

        await sut.GetExplanationAsync(CreateScope(), findingId);

        findingRepository.Verify(
            item => item.ListMetadataByFindingInScopeAsync(It.IsAny<ProjectScopeKey>(), findingId, It.IsAny<CancellationToken>()),
            Times.Once);

        findingRepository.Verify(
            item => item.ListMetadataByFindingIdsInScopeAsync(
                It.IsAny<ProjectScopeKey>(),
                It.IsAny<IReadOnlyList<Guid>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

    private static OperationalSecurityFindingRecord CreateFinding(Guid findingId) =>
        new()
        {
            FindingId = findingId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            Provider = CloudProvider.Azure,
            SourceSystem = "test",
            SourceFindingId = findingId.ToString("N"),
            Status = OperationalSecurityFindingStatus.Open,
            Severity = "high",
        };

    private static RemediationPatternMatchResultRecord CreateMatch(Guid findingId, string version) =>
        new()
        {
            FindingId = findingId,
            PatternId = PatternId,
            PatternVersion = version,
            PatternKey = "pattern-key",
            TenantId = TenantId,
        };

    private static RemediationPatternVersionRecord CreateVersion(string version) =>
        new()
        {
            PatternId = PatternId,
            TenantId = TenantId,
            Version = version,
            AutomationLevel = RemediationAutomationLevel.Guided,
            ContentJson = "{}",
        };
}

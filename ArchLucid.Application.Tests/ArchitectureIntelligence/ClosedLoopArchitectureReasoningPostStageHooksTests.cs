using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopArchitectureReasoningPostStageHooksTests
{
    [Fact]
    public async Task IntegrateReReviewFindingsAsync_merges_authority_snapshot_after_integrator()
    {
        string runId = Guid.NewGuid().ToString("N");
        ClosedLoopReasoningRequest request = new() { TenantId = "tenant-1", RunId = runId };
        SpecialistReviewFinding existing = new() { FindingId = "finding-existing", Title = "Existing" };
        SpecialistReviewFinding incremental = new() { FindingId = "finding-new", Title = "New from re-review" };
        List<SpecialistReviewFinding> allFindings = [existing];
        List<EvidenceValidationResult> validationResults = [];
        Dictionary<string, EvidenceValidationResult> validationByFindingId = new(StringComparer.Ordinal);

        IncrementalReReviewResult reReview = new()
        {
            SpecialistResults =
            [
                new SpecialistReviewResult
                {
                    Findings = [existing, incremental],
                },
            ],
        };

        SpecialistFindingsSubstantiationResult substantiation = new()
        {
            SubstantiatedFindings = [incremental],
            ValidationResults =
            [
                new EvidenceValidationResult
                {
                    FindingId = "finding-new",
                    OverallPassedIntegrity = true,
                },
            ],
        };

        Mock<ISpecialistFindingsSubstantiationService> substantiationService = new();
        substantiationService
            .Setup(service => service.SubstantiateAsync(
                It.Is<IReadOnlyList<SpecialistReviewFinding>>(findings =>
                    findings.Count == 1 && findings[0].FindingId == "finding-new"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(substantiation);

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(scope);

        Mock<IAuthorityFindingsSnapshotUpdater> authorityUpdater = new();
        authorityUpdater
            .Setup(updater => updater.MergeSubstantiatedFindingsAsync(
                scope,
                Guid.Parse(runId),
                substantiation,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(["finding-new"]);

        ClosedLoopArchitectureReasoningPostStageHooks hooks = new(
            substantiationService.Object,
            Mock.Of<IArchitectureIntelligenceProductPublishService>(),
            scopeProvider.Object,
            authorityUpdater.Object);

        await hooks.IntegrateReReviewFindingsAsync(
            runId,
            reReview,
            allFindings,
            validationResults,
            validationByFindingId,
            CancellationToken.None);

        allFindings.Should().HaveCount(2);
        reReview.MergedFindingIds.Should().Equal("finding-new");
        authorityUpdater.Verify(
            updater => updater.MergeSubstantiatedFindingsAsync(
                scope,
                Guid.Parse(runId),
                substantiation,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ApplyProductPublishAsync_applies_publish_result_to_reasoning_result()
    {
        ClosedLoopReasoningRequest request = new()
        {
            TenantId = "tenant-publish",
            WorkspaceId = "workspace-publish",
            ProjectId = "project-publish",
            RunId = "run-publish",
        };

        ClosedLoopReasoningResult result = new();

        Mock<IArchitectureIntelligenceProductPublishService> publishService = new();
        publishService
            .Setup(service => service.PublishAsync(
                result,
                "tenant-publish",
                "workspace-publish",
                "project-publish",
                "run-publish",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIntelligencePublishResult
            {
                Published = true,
                FindingsSnapshotId = Guid.NewGuid(),
                RecommendationCount = 3,
                SkipReason = null,
            });

        ClosedLoopArchitectureReasoningPostStageHooks hooks = new(
            Mock.Of<ISpecialistFindingsSubstantiationService>(),
            publishService.Object);

        await hooks.ApplyProductPublishAsync(
            request,
            result,
            "tenant-publish",
            "run-publish",
            CancellationToken.None);

        result.PublishedToProduct.Should().BeTrue();
        result.PublishedFindingsSnapshotId.Should().NotBeNull();
        result.PublishedRecommendationCount.Should().Be(3);
        result.PublishSkipReason.Should().BeNull();
    }
}

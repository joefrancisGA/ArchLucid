using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class RecommendationImproveLoopCoordinatorTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task TryApplyAsync_returns_diff_entries_without_full_before_or_after_models()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        ArchitectureKnowledgeModel before = new()
        {
            ModelId = "before-model",
            Elements = [new ArchitectureModelElement { ElementId = "svc-1", Name = "API" }],
        };
        ArchitectureKnowledgeModel after = new()
        {
            ModelId = "after-model",
            Elements =
            [
                new ArchitectureModelElement { ElementId = "svc-1", Name = "API" },
                new ArchitectureModelElement { ElementId = "rec-el", Name = "Add auth" },
            ],
        };

        ArchitectureModelDiff appliedDiff = new()
        {
            RecommendationId = "rec-1",
            Entries =
            [
                new ArchitectureModelDiffEntry
                {
                    ElementId = "rec-el",
                    ChangeKind = "Added",
                    Description = "Proposed recommendation",
                },
            ],
            BeforeModel = before,
            AfterModel = after,
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        Mock<IArchitectureKnowledgeModelAccess> knowledgeModelAccess = new();
        knowledgeModelAccess
            .Setup(access => access.GetForRunAsync(TestScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(before);
        knowledgeModelAccess
            .Setup(access => access.SaveForRunAsync(TestScope, runId, after, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureModelDiffApplier> diffApplier = new();
        diffApplier
            .Setup(applier => applier.ApplyRecommendation(before, It.IsAny<ArchitectureRecommendation>()))
            .Returns(appliedDiff);

        Mock<IChangeImpactAnalyzer> changeImpactAnalyzer = new();
        changeImpactAnalyzer
            .Setup(analyzer => analyzer.Analyze(appliedDiff, It.IsAny<ArchitectureRecommendation>()))
            .Returns(new ChangeImpactResult
            {
                RecommendationId = "rec-1",
                RequiresFullReReview = false,
                ImpactedItems =
                [
                    new ChangeImpactItem { ElementId = "rec-el", ImpactKind = "Recommendation" },
                ],
            });

        Mock<IIncrementalReReviewService> reReviewService = new();
        reReviewService
            .Setup(service => service.ReReviewAsync(
                after,
                It.IsAny<ReReviewScope>(),
                It.IsAny<IAsyncSpecialistReviewService>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IncrementalReReviewResult { PartialScopeDisclaimer = "partial" });

        Mock<ISpecialistFindingsSubstantiationService> substantiationService = new();
        substantiationService
            .Setup(service => service.SubstantiateAsync(It.IsAny<IReadOnlyList<SpecialistReviewFinding>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SpecialistFindingsSubstantiationResult());

        RecommendationImproveLoopCoordinator sut = new(
            scopeProvider.Object,
            knowledgeModelAccess.Object,
            diffApplier.Object,
            changeImpactAnalyzer.Object,
            reReviewService.Object,
            Mock.Of<IAsyncSpecialistReviewService>(),
            substantiationService.Object,
            new MustNotFailEnforcer(),
            new TrustPublishGate(),
            findingsSnapshotUpdater: null);

        RecommendationImproveLoopResult? result = await sut.TryApplyAsync(new RecommendationRecord
        {
            RecommendationId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            RunId = runId,
            Title = "Add authentication",
            SuggestedAction = "Put an identity boundary in front of the public API.",
            PriorityScore = 80,
        });

        result.Should().NotBeNull();
        result!.Diff.Entries.Should().ContainSingle(entry => entry.ElementId == "rec-el");
        result.Diff.BeforeModel.Elements.Should().BeEmpty();
        result.Diff.AfterModel.Elements.Should().BeEmpty();
        result.Diff.BeforeModel.ModelId.Should().BeNull();
        result.Diff.AfterModel.ModelId.Should().BeNull();
        result.PartialScopeDisclaimer.Should().Be("partial");

        knowledgeModelAccess.Verify(
            access => access.SaveForRunAsync(TestScope, runId, after, It.IsAny<CancellationToken>()),
            Times.Once);
        reReviewService.Verify(
            service => service.ReReviewAsync(
                after,
                It.IsAny<ReReviewScope>(),
                It.IsAny<IAsyncSpecialistReviewService>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}

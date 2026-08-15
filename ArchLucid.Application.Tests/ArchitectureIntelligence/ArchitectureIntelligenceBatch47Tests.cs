using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceBatch47Tests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void MergeFramingIncompletePublishBlock_blocks_publish_and_clears_recommendations()
    {
        TrustPublishDecision publishDecision = new()
        {
            PublishableFindings = [],
            PublishableRecommendations =
            [
                new ArchitectureRecommendation
                {
                    RecommendationId = "rec-1",
                    Problem = "Gap",
                    ProposedChange = "Fix gap",
                },
            ],
            IntegrityPassedFindingIds = new HashSet<string>(StringComparer.Ordinal),
            PublishBlocked = false,
            BlockReasons = [],
        };

        ProgressiveInterviewState interview = new()
        {
            IsFramingComplete = false,
        };

        TrustPublishDecision merged = ArchitectureFramingMustGate.MergeFramingIncompletePublishBlock(
            interview,
            publishDecision);

        merged.PublishBlocked.Should().BeTrue();
        merged.PublishableRecommendations.Should().BeEmpty();
        merged.BlockReasons.Should().Contain(ArchitectureFramingMustGate.PublishBlockReason);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void ApplyWhileFramingIncomplete_downgrades_constraint_adequacy_pass_to_indeterminate()
    {
        SpecialistReviewResult review = new()
        {
            Dimension = QualityDimension.Cost,
            Findings =
            [
                new SpecialistReviewFinding
                {
                    FindingId = "cost-pass",
                    Dimension = QualityDimension.Cost,
                    Title = "Cost drivers align with stated constraints.",
                    Rationale = "Cost drivers are documented and no stated monthly cost ceiling was found to contradict them.",
                    Conclusion = ReviewConclusion.Pass,
                    EvidenceCondition = EvidenceCondition.Sufficient,
                    Severity = "Low",
                },
            ],
        };

        SpecialistReviewProvisionalGating.ApplyWhileFramingIncomplete([review]);

        review.Findings[0].Conclusion.Should().Be(ReviewConclusion.Indeterminate);
        review.Findings[0].Rationale.Should().Contain("L0 framing answers declare recovery/cost constraints");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task RunAsync_skips_recommendations_and_blocks_review_complete_when_framing_incomplete()
    {
        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        ServiceProvider provider = services.BuildServiceProvider();
        IClosedLoopArchitectureReasoningOrchestrator orchestrator =
            provider.GetRequiredService<IClosedLoopArchitectureReasoningOrchestrator>();

        ClosedLoopReasoningRequest request = new()
        {
            TenantId = "tenant-batch47",
            RunId = "run-batch47",
            DeclaredPriorities = ["Security", "Cost"],
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "cost.md",
                    ContentType = "text/markdown",
                    Content = """
                        Primary cost driver: compute and storage for billing workloads.
                        Public API exposes customer records without authentication.
                        """,
                },
            ],
        };

        ClosedLoopReasoningResult result = await orchestrator.RunAsync(request);

        result.Interview.IsFramingComplete.Should().BeFalse();
        result.ReviewCompleteBlocked.Should().BeTrue();
        result.PublishBlocked.Should().BeTrue();
        result.PublishBlockReasons.Should().Contain(ArchitectureFramingMustGate.PublishBlockReason);
        result.Recommendations.Should().BeEmpty();
        result.ModelDiffs.Should().BeEmpty();
        result.ReReview.Should().BeNull();
        result.ProductRecommendations.Should().BeEmpty();
    }
}

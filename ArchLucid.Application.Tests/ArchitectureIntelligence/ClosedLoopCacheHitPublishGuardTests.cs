using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopCacheHitPublishGuardTests
{
    [Fact]
    public void ApplyCacheHitPolicy_sets_skip_reason_and_clears_published_flags_when_publish_requested()
    {
        Guid findingsSnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        ClosedLoopReasoningRequest request = new() { PublishToProduct = true };
        ClosedLoopReasoningResult cached = new()
        {
            RunId = "cached-run",
            Model = new ArchitectureKnowledgeModel { RunId = "cached-run", ModelId = "cached-model" },
            PublishedToProduct = true,
            PublishedFindingsSnapshotId = findingsSnapshotId,
            PublishedRecommendationCount = 2,
        };

        ClosedLoopCacheHitPublishGuard.ApplyCacheHitPolicy(request, "current-run", cached);

        cached.RunId.Should().Be("current-run");
        cached.Model.RunId.Should().Be("current-run");
        cached.ModelId.Should().Be("cached-model");
        cached.Model.ModelId.Should().Be("cached-model");
        cached.PublishedToProduct.Should().BeFalse();
        cached.PublishedFindingsSnapshotId.Should().BeNull();
        cached.PublishedRecommendationCount.Should().Be(0);
        cached.PublishSkipReason.Should().Be(ClosedLoopCacheHitPublishGuard.SkipReason);
    }

    [Fact]
    public void ApplyCacheHitPolicy_strips_product_payloads_and_preserves_model_identity()
    {
        ClosedLoopReasoningRequest request = new() { PublishToProduct = false };
        ClosedLoopReasoningResult cached = new()
        {
            RunId = "cached-run",
            ModelId = "cached-model",
            Model = new ArchitectureKnowledgeModel { RunId = "cached-run", ModelId = "cached-model" },
            Interview = new ProgressiveInterviewState { ModelId = "cached-model" },
            ProductFindings =
            [
                new ArchLucid.Contracts.Findings.Finding
                {
                    FindingId = "finding-1",
                    FindingType = "gap",
                    Category = "security",
                    EngineType = "specialist",
                    Severity = ArchLucid.Contracts.Findings.FindingSeverity.Error,
                    Title = "Gap",
                    Rationale = "Rationale.",
                    RunIdRef = "cached-run",
                },
            ],
            ProductRecommendations =
            [
                new ArchLucid.Contracts.Advisory.Workflow.RecommendationRecord
                {
                    RecommendationId = Guid.NewGuid(),
                    RunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    Title = "Fix gap",
                    Category = "security",
                    Rationale = "Rationale.",
                    SuggestedAction = "Action",
                },
            ],
        };

        ClosedLoopCacheHitPublishGuard.ApplyCacheHitPolicy(request, "current-run", cached);

        cached.Interview.ModelId.Should().Be("cached-model");
        cached.ProductFindings.Should().BeEmpty();
        cached.ProductRecommendations.Should().BeEmpty();
    }

    [Fact]
    public void ApplyCacheHitPolicy_clears_published_flags_even_when_publish_was_not_requested()
    {
        ClosedLoopReasoningRequest request = new() { PublishToProduct = false };
        ClosedLoopReasoningResult cached = new()
        {
            PublishedToProduct = true,
            PublishedRecommendationCount = 1,
        };

        ClosedLoopCacheHitPublishGuard.ApplyCacheHitPolicy(request, "current-run", cached);

        cached.PublishedToProduct.Should().BeFalse();
        cached.PublishedRecommendationCount.Should().Be(0);
        cached.PublishSkipReason.Should().BeNull();
    }

    [Fact]
    public void ShouldApplyCacheHitPolicyOnCoalescedResult_when_run_id_differs_or_publish_not_satisfied()
    {
        ClosedLoopReasoningRequest publishRequest = new() { PublishToProduct = true };
        ClosedLoopReasoningResult published = new()
        {
            RunId = "leader-run",
            PublishedToProduct = true,
        };

        ClosedLoopCacheHitPublishGuard.ShouldApplyCacheHitPolicyOnCoalescedResult(
                publishRequest,
                "follower-run",
                published)
            .Should().BeTrue();

        ClosedLoopCacheHitPublishGuard.ShouldApplyCacheHitPolicyOnCoalescedResult(
                publishRequest,
                "leader-run",
                published)
            .Should().BeFalse();

        ClosedLoopReasoningResult notPublished = new()
        {
            RunId = "leader-run",
            PublishedToProduct = false,
        };

        ClosedLoopCacheHitPublishGuard.ShouldApplyCacheHitPolicyOnCoalescedResult(
                publishRequest,
                "leader-run",
                notPublished)
            .Should().BeTrue();

        ClosedLoopReasoningRequest analysisRequest = new() { PublishToProduct = false };

        ClosedLoopCacheHitPublishGuard.ShouldApplyCacheHitPolicyOnCoalescedResult(
                analysisRequest,
                "leader-run",
                notPublished)
            .Should().BeFalse();
    }

    [Fact]
    public void SanitizeForStorage_strips_publish_side_effects_from_result()
    {
        ClosedLoopReasoningResult result = new()
        {
            PublishedToProduct = true,
            PublishedFindingsSnapshotId = Guid.NewGuid(),
            PublishedRecommendationCount = 4,
            PublishSkipReason = "already published",
            ProductFindings =
            [
                new ArchLucid.Contracts.Findings.Finding
                {
                    FindingId = "finding-1",
                    FindingType = "gap",
                    Category = "security",
                    EngineType = "specialist",
                    Severity = ArchLucid.Contracts.Findings.FindingSeverity.Error,
                    Title = "Gap",
                    Rationale = "Rationale.",
                },
            ],
            ProductRecommendations =
            [
                new ArchLucid.Contracts.Advisory.Workflow.RecommendationRecord
                {
                    RecommendationId = Guid.NewGuid(),
                    Title = "Fix gap",
                    Category = "security",
                    Rationale = "Rationale.",
                    SuggestedAction = "Action",
                },
            ],
        };

        ClosedLoopCacheHitPublishGuard.SanitizeForStorage(result);

        result.PublishedToProduct.Should().BeFalse();
        result.PublishedFindingsSnapshotId.Should().BeNull();
        result.PublishedRecommendationCount.Should().Be(0);
        result.PublishSkipReason.Should().BeNull();
        result.ProductFindings.Should().BeEmpty();
        result.ProductRecommendations.Should().BeEmpty();
    }
}

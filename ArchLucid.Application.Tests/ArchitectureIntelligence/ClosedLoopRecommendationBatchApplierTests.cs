using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopRecommendationBatchApplierTests
{
    [Fact]
    public void Apply_applies_every_recommendation_not_only_the_first()
    {
        ClosedLoopRecommendationBatchApplier sut = new(
            new ArchitectureModelDiffApplier(),
            new ChangeImpactAnalyzer());

        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-batch-apply",
            TenantId = "tenant-batch-apply",
        };

        ArchitectureRecommendation first = CreateRecommendation(
            "rec-first",
            "Missing authentication on the public API",
            "Add an identity boundary in front of the public API.");
        ArchitectureRecommendation second = CreateRecommendation(
            "rec-second",
            "Billing worker has no owner",
            "Assign an owner and on-call for the billing worker.");

        ClosedLoopRecommendationBatchApplyResult result = sut.Apply(model, [first, second]);

        result.ModelDiffs.Should().HaveCount(2);
        result.ImpactResults.Should().HaveCount(2);
        result.ModelDiffs[0].RecommendationId.Should().Be("rec-first");
        result.ModelDiffs[1].RecommendationId.Should().Be("rec-second");
        result.WorkingModel.Elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Recommendation
            && element.Properties.ContainsKey("recommendationId")
            && element.Properties["recommendationId"] == "rec-first");
        result.WorkingModel.Elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Recommendation
            && element.Properties.ContainsKey("recommendationId")
            && element.Properties["recommendationId"] == "rec-second");
        result.Scope.AffectedElementIds.Should().NotBeEmpty();
    }

    [Fact]
    public void Apply_unions_impacted_elements_and_sets_full_re_review_when_any_impact_requires_it()
    {
        ClosedLoopRecommendationBatchApplier sut = new(
            new ArchitectureModelDiffApplier(),
            new ChangeImpactAnalyzer());

        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-full-rereview",
            TenantId = "tenant-full-rereview",
        };

        ArchitectureRecommendation topology = CreateRecommendation(
            "rec-topology",
            "No documented trust boundary",
            "Introduce a trust boundary around the public API.");
        ArchitectureRecommendation owner = CreateRecommendation(
            "rec-owner",
            "Billing worker has no owner",
            "Assign an owner for the billing worker.");

        ClosedLoopRecommendationBatchApplyResult result = sut.Apply(model, [topology, owner]);

        result.ModelDiffs.Should().HaveCount(2);
        result.Scope.FullReReview.Should().BeTrue();
        result.Scope.Trigger.Should().Be(ReReviewTrigger.NewTrustBoundary);
        result.Scope.AffectedElementIds.Should().HaveCountGreaterThan(1);
    }

    [Fact]
    public void Apply_returns_original_model_when_recommendation_list_is_empty()
    {
        ClosedLoopRecommendationBatchApplier sut = new(
            new ArchitectureModelDiffApplier(),
            new ChangeImpactAnalyzer());

        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-empty",
            TenantId = "tenant-empty",
        };

        ClosedLoopRecommendationBatchApplyResult result = sut.Apply(model, []);

        result.WorkingModel.Should().BeSameAs(model);
        result.ModelDiffs.Should().BeEmpty();
        result.ImpactResults.Should().BeEmpty();
        result.Scope.FullReReview.Should().BeFalse();
        result.Scope.Trigger.Should().BeNull();
        result.Scope.AffectedElementIds.Should().BeEmpty();
    }

    [Fact]
    public void Resolve_returns_null_when_full_re_review_is_not_required()
    {
        ReReviewTrigger? trigger = ClosedLoopReReviewTriggerResolver.Resolve(
            new ChangeImpactResult { RequiresFullReReview = false },
            CreateRecommendation("rec-none", "Gap", "Document the owner."));

        trigger.Should().BeNull();
    }

    private static ArchitectureRecommendation CreateRecommendation(
        string recommendationId,
        string problem,
        string proposedChange)
    {
        return new ArchitectureRecommendation
        {
            RecommendationId = recommendationId,
            Problem = problem,
            ProposedChange = proposedChange,
            Evidence = string.Empty,
            AffectedRequirementOrQualityAttribute = string.Empty,
            ConsequenceOfInaction = string.Empty,
            Confidence = 0.8,
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.SystemProposed,
                SupportStatus = SupportStatus.IndirectlySupported,
                Confidence = 0.8,
            },
        };
    }
}

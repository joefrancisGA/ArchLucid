using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceLlmResponseMapperMissingValueTests
{
    [Fact]
    public void MapRecommendation_labels_missing_recommendation_values_without_defaulting_them()
    {
        ArchitectureRecommendation recommendation = ArchitectureIntelligenceLlmResponseMapper.MapRecommendation(
            new ArchitectureIntelligenceLlmResponseShapes.RecommendationShape
            {
                Problem = "Problem",
                ProposedChange = "Change",
                ValidationMethod = null,
                EffortBand = null,
                RiskReductionLevel = null,
            });

        recommendation.ValidationMethod.Should().Be("Validation method was not stored.");
        recommendation.Effort.Band.Should().Be("Effort band was not stored.");
        recommendation.Effort.ImplementationEstimateAvailable.Should().BeFalse();
        recommendation.RiskReduction.Level.Should().Be("Risk reduction was not stored.");
        recommendation.RequiresHumanApproval.Should().BeNull();
    }

    [Fact]
    public void A_model_reported_pass_cannot_accept_its_own_claim()
    {
        var finding = ArchitectureIntelligenceLlmResponseMapper.MapReviewFinding(
            new ArchitectureIntelligenceLlmResponseShapes.ReviewFindingShape
            {
                Title = "All replicas satisfy the policy",
                Conclusion = "Pass", Confidence = 1,
                EvidenceCondition = "Sufficient", SupportStatus = "DirectlyEstablished",
            }, QualityDimension.Reliability);

        finding.Conclusion.Should().Be(ReviewConclusion.Pass);
        finding.Provenance.Origin.Should().Be(ClaimOrigin.ModelInferred);
        finding.Provenance.SupportStatus.Should().Be(SupportStatus.NotYetEvaluated);
        finding.EvidenceCondition.Should().Be(EvidenceCondition.Unverified);
        finding.GovernanceDisposition.Should().Be(GovernanceDisposition.Open);
    }

    [Fact]
    public void MapReviewFinding_labels_missing_severity_without_defaulting_to_medium()
    {
        SpecialistReviewFinding finding = ArchitectureIntelligenceLlmResponseMapper.MapReviewFinding(
            new ArchitectureIntelligenceLlmResponseShapes.ReviewFindingShape
            {
                Title = "Gap",
                Rationale = "Because",
            },
            QualityDimension.Security);

        finding.Severity.Should().Be("Severity was not stored.");
    }

    [Theory]
    [InlineData("2147483647")]
    [InlineData("-2147483648")]
    public void Undefined_model_enum_values_use_uncertain_fallbacks(string value)
    {
        var element = ArchitectureIntelligenceLlmResponseMapper.MapExtractionElement(
            new ArchitectureIntelligenceLlmResponseShapes.ExtractionElementShape
            {
                Name = "Unverified element",
                Kind = value,
                SupportStatus = value,
                Origin = value,
            }, "artifact");

        element.Should().NotBeNull();
        element!.Kind.Should().Be(ArchitectureElementKind.Assumption);
        element.Provenance.SupportStatus.Should().Be(SupportStatus.NotYetEvaluated);
        element.Provenance.Origin.Should().Be(ClaimOrigin.ModelInferred);

        var finding = ArchitectureIntelligenceLlmResponseMapper.MapReviewFinding(
            new ArchitectureIntelligenceLlmResponseShapes.ReviewFindingShape { Conclusion = value },
            QualityDimension.Security);

        finding.Conclusion.Should().Be(ReviewConclusion.Indeterminate);
    }
}

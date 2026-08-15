using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class SpecialistReviewProvisionalGatingTests
{
    [Fact]
    public void ApplyWhileFramingIncomplete_downgrades_fail_to_indeterminate()
    {
        SpecialistReviewFinding failFinding = new()
        {
            FindingId = "finding-1",
            Dimension = QualityDimension.Security,
            Title = "Public endpoint exposure",
            Rationale = "No authentication on public API.",
            Conclusion = ReviewConclusion.Fail,
            EvidenceCondition = EvidenceCondition.Sufficient,
            Severity = "High",
        };

        SpecialistReviewResult review = new()
        {
            Dimension = QualityDimension.Security,
            Findings = [failFinding],
        };

        SpecialistReviewProvisionalGating.ApplyWhileFramingIncomplete([review]);

        review.Findings.Should().ContainSingle();
        review.Findings[0].Conclusion.Should().Be(ReviewConclusion.Indeterminate);
        review.Findings[0].Rationale.Should().Contain("Provisional until framing questions");
    }

    [Fact]
    public void ApplyWhileFramingIncomplete_preserves_pass_and_indeterminate()
    {
        SpecialistReviewResult review = new()
        {
            Dimension = QualityDimension.Reliability,
            Findings =
            [
                new SpecialistReviewFinding
                {
                    FindingId = "pass-1",
                    Dimension = QualityDimension.Reliability,
                    Title = "Recovery objective documented",
                    Rationale = "RTO present.",
                    Conclusion = ReviewConclusion.Pass,
                    EvidenceCondition = EvidenceCondition.Sufficient,
                    Severity = "Low",
                },
                new SpecialistReviewFinding
                {
                    FindingId = "indeterminate-1",
                    Dimension = QualityDimension.Reliability,
                    Title = "Backup interval unclear",
                    Rationale = "No backup interval cited.",
                    Conclusion = ReviewConclusion.Indeterminate,
                    EvidenceCondition = EvidenceCondition.Insufficient,
                    Severity = "Medium",
                },
            ],
        };

        SpecialistReviewProvisionalGating.ApplyWhileFramingIncomplete([review]);

        review.Findings.Should().HaveCount(2);
        review.Findings[0].Conclusion.Should().Be(ReviewConclusion.Pass);
        review.Findings[1].Conclusion.Should().Be(ReviewConclusion.Indeterminate);
    }
}

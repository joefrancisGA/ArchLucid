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
    public void ApplyWhileFramingIncomplete_preserves_non_constraint_pass_and_indeterminate()
    {
        SpecialistReviewResult review = new()
        {
            Dimension = QualityDimension.Reliability,
            Findings =
            [
                new SpecialistReviewFinding
                {
                    FindingId = "pass-1",
                    Dimension = QualityDimension.Security,
                    Title = "No immediate public exposure gap detected",
                    Rationale = "Security review did not identify a public endpoint without trust boundary context.",
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

    [Fact]
    public void ApplyWhileFramingIncomplete_downgrades_constraint_adequacy_pass()
    {
        SpecialistReviewResult review = new()
        {
            Dimension = QualityDimension.Reliability,
            Findings =
            [
                new SpecialistReviewFinding
                {
                    FindingId = "recovery-pass",
                    Dimension = QualityDimension.Reliability,
                    Title = "Recovery objectives appear adequate for stated targets.",
                    Rationale = "Stated RTO is 30 minutes and backup interval is 15 minutes.",
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
}

using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class AdversarialReviewServiceTests
{
    private readonly AdversarialReviewService _service = new();

    [Fact]
    public void Review_suppresses_challenge_without_falsification_evidence()
    {
        SpecialistReviewFinding passFinding = new()
        {
            FindingId = "finding-pass",
            Dimension = QualityDimension.Reliability,
            Title = "Passes",
            Rationale = "All good.",
            Conclusion = ReviewConclusion.Pass,
            EvidenceCondition = EvidenceCondition.Sufficient,
            Severity = "Low",
        };

        AdversarialReviewResult result = _service.Review([passFinding]);

        result.Challenges.Should().BeEmpty();
    }

    [Fact]
    public void Review_keeps_challenge_when_falsification_evidence_is_present()
    {
        SpecialistReviewFinding failFinding = new()
        {
            FindingId = "finding-fail",
            Dimension = QualityDimension.Security,
            Title = "Missing auth",
            Rationale = "Public endpoint has no authentication.",
            Conclusion = ReviewConclusion.Fail,
            EvidenceCondition = EvidenceCondition.Insufficient,
            Severity = "High",
        };

        AdversarialReviewResult result = _service.Review([failFinding]);

        result.Challenges.Should().ContainSingle();
        result.Challenges[0].FalsificationEvidenceNeeded.Should().NotBeNullOrWhiteSpace();
    }
}

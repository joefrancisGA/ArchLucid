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

    [Fact]
    public void Review_uses_integrity_pass_set_for_substantiated_lane()
    {
        SpecialistReviewFinding withArtifactsButFailedIntegrity = new()
        {
            FindingId = "finding-fail-integrity",
            Dimension = QualityDimension.Security,
            Title = "Looks evidenced",
            Rationale = "Has artifact ids but integrity failed.",
            Conclusion = ReviewConclusion.Fail,
            EvidenceCondition = EvidenceCondition.Sufficient,
            Severity = "High",
            EvidenceArtifactIds = [$"{ArchitectureIntelligenceArtifactPrefixes.KnownArtifactIdPrefix}abc"],
        };

        SpecialistReviewFinding integrityPassed = new()
        {
            FindingId = "finding-pass-integrity",
            Dimension = QualityDimension.Security,
            Title = "Verified",
            Rationale = "Integrity passed.",
            Conclusion = ReviewConclusion.Fail,
            EvidenceCondition = EvidenceCondition.Sufficient,
            Severity = "Medium",
        };

        AdversarialReviewResult result = _service.Review(
            [withArtifactsButFailedIntegrity, integrityPassed],
            new HashSet<string>(StringComparer.Ordinal) { "finding-pass-integrity" });

        result.SubstantiatedFindings.Should().ContainSingle(finding => finding.FindingId == "finding-pass-integrity");
        result.Challenges.Should().ContainSingle(challenge =>
            challenge.Hypothesis.Contains("Looks evidenced", StringComparison.Ordinal));
        result.Challenges.Should().NotContain(challenge =>
            challenge.Hypothesis.StartsWith("Selective High/Critical re-check:", StringComparison.Ordinal));
    }

    [Fact]
    public void Review_adds_selective_challenge_when_integrity_passed_and_severity_is_high()
    {
        SpecialistReviewFinding integrityPassedHigh = new()
        {
            FindingId = "finding-pass-integrity-high",
            Dimension = QualityDimension.Security,
            Title = "Verified high",
            Rationale = "Integrity passed but severity warrants re-check.",
            Conclusion = ReviewConclusion.Fail,
            EvidenceCondition = EvidenceCondition.Sufficient,
            Severity = "High",
        };

        AdversarialReviewResult result = _service.Review(
            [integrityPassedHigh],
            new HashSet<string>(StringComparer.Ordinal) { integrityPassedHigh.FindingId });

        result.SubstantiatedFindings.Should().ContainSingle();
        result.Challenges.Should().ContainSingle(challenge =>
            challenge.SourceFindingId == integrityPassedHigh.FindingId);
    }
}


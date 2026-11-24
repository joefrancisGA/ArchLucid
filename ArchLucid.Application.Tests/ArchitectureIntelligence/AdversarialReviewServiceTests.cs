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
    public void Citation_ids_alone_neither_substantiate_a_finding_nor_measure_provider_quality()
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = "f", Title = "Unconfirmed observation", Rationale = "Review required",
            Conclusion = ReviewConclusion.Fail, Confidence = 1, EvidenceArtifactIds = ["source-1"],
        };
        var result = _service.Review([finding]);
        result.SubstantiatedFindings.Should().BeEmpty();
        result.Challenges.Should().ContainSingle();
        result.FalsePositiveRateByLane.Should().BeEmpty();
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

    [Theory]
    [InlineData(PublicNetworkAccessVerificationOutcome.Contradicted, true, true, InventoryFalsificationOutcome.Refuted)]
    [InlineData(PublicNetworkAccessVerificationOutcome.Verified, true, true, InventoryFalsificationOutcome.SurvivedWithinTestedScope)]
    [InlineData(PublicNetworkAccessVerificationOutcome.Verified, false, true, InventoryFalsificationOutcome.Untestable)]
    [InlineData(PublicNetworkAccessVerificationOutcome.Verified, true, false, InventoryFalsificationOutcome.Untestable)]
    [InlineData(PublicNetworkAccessVerificationOutcome.Unverified, false, false, InventoryFalsificationOutcome.HumanReviewRequired)]
    public void Inventory_probe_stays_in_the_challenge_lane_and_survives_the_review_cache(
        PublicNetworkAccessVerificationOutcome observationOutcome, bool hasEvidence, bool matchingResource,
        InventoryFalsificationOutcome expected)
    {
        Guid resourceId = expected == InventoryFalsificationOutcome.HumanReviewRequired ? Guid.Empty : Guid.NewGuid();
        SpecialistReviewFinding finding = new()
        {
            FindingId = "claim", Conclusion = ReviewConclusion.Pass, Confidence = 1,
            PublicNetworkAccessDisabledResourceId = resourceId,
        };
        var validation = new EvidenceValidationResult
        {
            FindingId = finding.FindingId,
            PublicNetworkAccess = new(matchingResource ? resourceId : Guid.NewGuid(),
                observationOutcome, Guid.NewGuid(), DateTime.UtcNow)
            {
                Evidence = hasEvidence
                    ? new("inventory/1", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
                        Guid.NewGuid(), "publicNetworkAccess", 24)
                    : null,
            },
        };

        AdversarialReviewResult review = _service.Review([finding]);
        review.Challenges.Should().BeEmpty();
        AdversarialReviewService.RecordInventoryCounterexamples(
            review, [finding], new Dictionary<string, EvidenceValidationResult> { [finding.FindingId] = validation });

        review.SubstantiatedFindings.Should().BeEmpty();
        AdversarialChallenge challenge = review.Challenges.Should().ContainSingle().Which;
        challenge.Lane.Should().Be(AdversarialLane.AdversarialChallenge);
        challenge.InventoryProbe!.Outcome.Should().Be(expected);
        challenge.InventoryProbe.Coverage.Should().Contain("explicit Azure property only");
        if (matchingResource)
            challenge.InventoryProbe.Verification.Should().Be(validation.PublicNetworkAccess);
        else
            challenge.InventoryProbe.Verification.Should().BeNull();
        _service.ToOpenQuestions(review).Should().HaveCount(
            expected is InventoryFalsificationOutcome.Untestable or InventoryFalsificationOutcome.HumanReviewRequired ? 1 : 0);

        var cached = ClosedLoopReasoningResultCloner.Clone(new ClosedLoopReasoningResult { Adversarial = review });
        cached.Adversarial.Challenges.Should().ContainSingle().Which.InventoryProbe.Should().Be(challenge.InventoryProbe);
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


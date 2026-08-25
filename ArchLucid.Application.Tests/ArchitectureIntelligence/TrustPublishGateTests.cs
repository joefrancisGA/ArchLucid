using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class TrustPublishGateTests
{
    private readonly TrustPublishGate _gate = new();

    [Fact]
    public void Decide_excludes_findings_that_failed_integrity()
    {
        SpecialistReviewFinding passed = CreateFinding("ok", "Integrity ok");
        SpecialistReviewFinding failed = CreateFinding("bad", "Integrity bad");

        TrustPublishDecision decision = _gate.Decide(
            [passed, failed],
            [],
            [
                new EvidenceValidationResult
                {
                    FindingId = "ok",
                    OverallPassedIntegrity = true,
                },
                new EvidenceValidationResult
                {
                    FindingId = "bad",
                    OverallPassedIntegrity = false,
                },
            ],
            []);

        decision.PublishableFindings.Should().ContainSingle(finding => finding.FindingId == "ok");
        decision.IntegrityPassedFindingIds.Should().Contain("ok");
        decision.IntegrityPassedFindingIds.Should().NotContain("bad");
    }

    [Fact]
    public void Decide_excludes_cloud_recommendation_without_assumption_when_blocked()
    {
        ArchitectureRecommendation recommendation = new()
        {
            RecommendationId = "rec-1",
            Problem = "Use managed identity",
            Evidence = "Security guidance.",
            AffectedRequirementOrQualityAttribute = "Security",
            ConsequenceOfInaction = "Risk remains.",
            ProposedChange = "Deploy on Azure App Service.",
            ValidationMethod = "Review.",
        };

        MustNotFailViolation violation = new()
        {
            Class = MustNotFailClass.UnlabeledCloudSpecificRecommendation,
            Message = "Recommendation 'Use managed identity' mentions a cloud provider without an explicit assumption note.",
            Blocked = true,
            RecommendationId = "rec-1",
        };

        TrustPublishDecision decision = _gate.Decide(
            [],
            [recommendation],
            [],
            [violation]);

        decision.PublishableRecommendations.Should().BeEmpty();
        decision.BlockReasons.Should().NotBeEmpty();
    }

    [Fact]
    public void Decide_blocks_publish_when_hard_violation_remains_with_publishable_findings()
    {
        SpecialistReviewFinding publishable = CreateFinding("ok", "Integrity ok");

        TrustPublishDecision decision = _gate.Decide(
            [publishable],
            [],
            [
                new EvidenceValidationResult
                {
                    FindingId = "ok",
                    OverallPassedIntegrity = true,
                },
            ],
            [
                new MustNotFailViolation
                {
                    Class = MustNotFailClass.UnlabeledCloudSpecificRecommendation,
                    Message = "Hard policy violation.",
                    Blocked = true,
                },
            ]);

        decision.PublishableFindings.Should().ContainSingle();
        decision.PublishBlocked.Should().BeTrue();
    }

    [Fact]
    public void Decide_excludes_finding_when_violation_carries_finding_id()
    {
        SpecialistReviewFinding finding = CreateFinding("blocked-finding", "Fabricated evidence");

        TrustPublishDecision decision = _gate.Decide(
            [finding],
            [],
            [
                new EvidenceValidationResult
                {
                    FindingId = "blocked-finding",
                    OverallPassedIntegrity = true,
                },
            ],
            [
                new MustNotFailViolation
                {
                    Class = MustNotFailClass.FabricatedCitation,
                    Message = "Hard policy violation.",
                    Blocked = true,
                    FindingId = "blocked-finding",
                },
            ]);

        decision.PublishableFindings.Should().BeEmpty();
    }

    private static SpecialistReviewFinding CreateFinding(string id, string title)
    {
        return new SpecialistReviewFinding
        {
            FindingId = id,
            Dimension = QualityDimension.Security,
            Title = title,
            Rationale = "Rationale.",
            Conclusion = ReviewConclusion.Fail,
            EvidenceCondition = EvidenceCondition.Sufficient,
            Severity = "High",
        };
    }
}

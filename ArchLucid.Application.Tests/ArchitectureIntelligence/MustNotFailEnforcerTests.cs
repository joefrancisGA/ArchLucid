using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class MustNotFailEnforcerTests
{
    private readonly MustNotFailEnforcer _enforcer = new();

    [Fact]
    public void Evaluate_blocks_fabricated_citation_for_directly_established_finding()
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = "finding-1",
            Dimension = QualityDimension.Security,
            Title = "Bad citation",
            Rationale = "Claim without valid artifact.",
            Conclusion = ReviewConclusion.Fail,
            EvidenceCondition = EvidenceCondition.Insufficient,
            Severity = "High",
            Provenance = new ClaimProvenance
            {
                SupportStatus = SupportStatus.DirectlyEstablished,
            },
            EvidenceArtifactIds = ["invalid-id"],
        };

        IReadOnlyList<MustNotFailViolation> violations = _enforcer.Evaluate([finding], []);

        violations.Should().Contain(violation =>
            violation.Class == MustNotFailClass.FabricatedCitation && violation.Blocked);
    }

    [Fact]
    public void Evaluate_blocks_invented_regulation_without_external_provenance()
    {
        ArchitectureRecommendation recommendation = new()
        {
            RecommendationId = "rec-1",
            Problem = "Compliance gap",
            Evidence = "This requires GDPR Article 32 controls.",
            AffectedRequirementOrQualityAttribute = "Privacy",
            ConsequenceOfInaction = "Risk remains.",
            ProposedChange = "Add controls.",
            ValidationMethod = "Audit.",
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.SystemProposed,
            },
        };

        IReadOnlyList<MustNotFailViolation> violations = _enforcer.Evaluate([], [recommendation]);

        violations.Should().Contain(violation =>
            violation.Class == MustNotFailClass.InventedRegulation && violation.Blocked);
    }
}

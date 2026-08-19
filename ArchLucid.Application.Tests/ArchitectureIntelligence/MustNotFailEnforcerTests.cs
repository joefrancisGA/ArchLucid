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

    [Fact]
    public void Evaluate_blocks_absence_treated_as_defect()
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = "finding-absence",
            Dimension = QualityDimension.Reliability,
            Title = "Missing backups",
            Rationale = "Backups are missing from the architecture.",
            Conclusion = ReviewConclusion.Fail,
            EvidenceCondition = EvidenceCondition.Insufficient,
            Severity = "High",
        };

        IReadOnlyList<MustNotFailViolation> violations = _enforcer.Evaluate([finding], []);

        violations.Should().Contain(violation =>
            violation.Class == MustNotFailClass.AbsenceTreatedAsDefect && violation.Blocked);
    }

    [Fact]
    public void Evaluate_allows_externally_sourced_regulation_when_labeled_unverified()
    {
        ArchitectureRecommendation recommendation = new()
        {
            RecommendationId = "rec-2",
            Problem = "Privacy controls",
            Evidence = "This requires GDPR Article 32 controls.",
            AffectedRequirementOrQualityAttribute = "Privacy",
            ConsequenceOfInaction = "Risk remains.",
            ProposedChange = "Add controls.",
            ValidationMethod = "Audit.",
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.ExternallySourced,
                Notes = "unverified citation pending counsel review",
            },
        };

        IReadOnlyList<MustNotFailViolation> violations = _enforcer.Evaluate([], [recommendation]);

        violations.Should().NotContain(violation => violation.Class == MustNotFailClass.InventedRegulation);
    }

    [Fact]
    public void Evaluate_blocks_unlabeled_cloud_specific_recommendation()
    {
        ArchitectureRecommendation recommendation = CreateCloudRecommendation();

        IReadOnlyList<MustNotFailViolation> violations = _enforcer.Evaluate([], [recommendation]);

        violations.Should().Contain(violation =>
            violation.Class == MustNotFailClass.UnlabeledCloudSpecificRecommendation && violation.Blocked);
    }

    [Fact]
    public void Evaluate_allows_cloud_recommendation_when_alternative_path_labels_assumption()
    {
        ArchitectureRecommendation recommendation = CreateCloudRecommendation();
        recommendation.AlternativeOptions =
        [
            new RecommendationAlternative
            {
                Path = "Keep Azure as an assumption until multi-cloud is required",
                ValidationCriteria = "The Azure assumption is recorded in the architecture package.",
            },
        ];

        IReadOnlyList<MustNotFailViolation> violations = _enforcer.Evaluate([], [recommendation]);

        violations.Should().NotContain(violation =>
            violation.Class == MustNotFailClass.UnlabeledCloudSpecificRecommendation);
    }

    private static ArchitectureRecommendation CreateCloudRecommendation()
    {
        return new ArchitectureRecommendation
        {
            RecommendationId = "rec-cloud",
            Problem = "Hosting location",
            Evidence = "The package names Azure as the target platform.",
            AffectedRequirementOrQualityAttribute = "Reliability",
            ConsequenceOfInaction = "Cloud lock-in remains unlabeled.",
            ProposedChange = "Deploy the workload on Azure App Service.",
            ValidationMethod = "Review the deployment topology.",
            Provenance = new ClaimProvenance(),
        };
    }
}


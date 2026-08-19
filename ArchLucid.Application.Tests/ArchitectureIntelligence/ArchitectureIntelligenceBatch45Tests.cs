using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceBatch45Tests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void Review_adds_selective_challenge_for_substantiated_high_severity_finding()
    {
        AdversarialReviewService sut = new();
        SpecialistReviewFinding substantiatedHigh = new()
        {
            FindingId = "finding-high-substantiated",
            Dimension = QualityDimension.Security,
            Title = "Missing encryption",
            Rationale = "Data store lacks encryption at rest.",
            Conclusion = ReviewConclusion.Fail,
            EvidenceCondition = EvidenceCondition.Sufficient,
            Severity = "High",
        };

        AdversarialReviewResult result = sut.Review(
            [substantiatedHigh],
            new HashSet<string>(StringComparer.Ordinal) { substantiatedHigh.FindingId });

        result.SubstantiatedFindings.Should().ContainSingle();
        result.Challenges.Should().ContainSingle(challenge =>
            challenge.SourceFindingId == substantiatedHigh.FindingId
            && challenge.Hypothesis.StartsWith("Selective High/Critical re-check:", StringComparison.Ordinal));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void EvidenceSupportTierResolver_labels_integrity_verified_vs_inference()
    {
        EvidenceValidationResult integrityVerified = new()
        {
            FindingId = "f-1",
            OverallPassedIntegrity = true,
            SemanticAssessment = SemanticSupportAssessment.Supports,
        };
        integrityVerified.SupportTier = EvidenceSupportTierResolver.Resolve(integrityVerified);

        EvidenceValidationResult inference = new()
        {
            FindingId = "f-2",
            OverallPassedIntegrity = false,
            SemanticAssessment = SemanticSupportAssessment.PartiallySupports,
            StageResults =
            [
                new EvidenceValidationStageOutcome
                {
                    Stage = EvidenceValidationStage.SemanticSupport,
                    Passed = true,
                    IsDeterministic = false,
                },
            ],
        };
        inference.SupportTier = EvidenceSupportTierResolver.Resolve(inference);

        integrityVerified.SupportTier.Should().Be(EvidenceSupportTier.IntegrityVerified);
        inference.SupportTier.Should().Be(EvidenceSupportTier.SemanticInferenceFromPartialEvidence);

        SpecialistReviewFinding finding = new()
        {
            FindingId = "f-2",
            Dimension = QualityDimension.Security,
            Title = "Inference finding",
            Rationale = "Partial",
            Conclusion = ReviewConclusion.Indeterminate,
            Severity = "Medium",
        };

        EvidenceSupportTierResolver.ApplyToFinding(finding, inference);
        finding.EvidenceSupportTier.Should().Be(EvidenceSupportTier.SemanticInferenceFromPartialEvidence);
        finding.EvidenceCondition.Should().Be(EvidenceCondition.Unverified);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void ToFindings_maps_evidence_support_tier_property()
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = "finding-tier",
            Dimension = QualityDimension.Cost,
            Title = "Cost gap",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
            EvidenceSupportTier = EvidenceSupportTier.IntegrityVerified,
        };

        List<Finding> mapped = ArchitectureIntelligenceProductBridge.ToFindings([finding]);

        mapped[0].Properties["architectureIntelligence.evidenceSupportTier"]
            .Should().Be(EvidenceSupportTier.IntegrityVerified.ToString());
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void ChangeImpactAnalyzer_categorizes_decision_and_compliance_impacts()
    {
        ChangeImpactAnalyzer analyzer = new();
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-impact",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "dec-1",
                    Kind = ArchitectureElementKind.Decision,
                    Name = "Use private endpoints",
                },
                new ArchitectureModelElement
                {
                    ElementId = "obl-1",
                    Kind = ArchitectureElementKind.ComplianceObligation,
                    Name = "HIPAA encryption",
                },
            ],
        };

        ArchitectureRecommendation recommendation = new()
        {
            RecommendationId = "rec-impact",
            Problem = "HIPAA encryption gap",
            Evidence = "Obligation cited.",
            AffectedRequirementOrQualityAttribute = "ComplianceObligation",
            ConsequenceOfInaction = "Exposure remains.",
            ProposedChange = "Align HIPAA encryption decision with private endpoints.",
            ValidationMethod = "Review.",
        };

        ChangeImpactResult impact = analyzer.Analyze(model, recommendation);

        impact.ImpactedItems.Should().Contain(item =>
            item.ElementId == "dec-1" && item.Category == ChangeImpactCategory.Decision);
        impact.ImpactedItems.Should().Contain(item =>
            item.ElementId == "obl-1" && item.Category == ChangeImpactCategory.ComplianceMapping);
    }
}

using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRecommendationEngineTests
{
    [Fact]
    public void BuildRecommendations_cloned_inputs_produce_the_same_recommendation_id_sequence()
    {
        ArchitectureRecommendationEngine sut = new();
        List<SpecialistReviewFinding> findings =
        [
            CreateFailingFinding("f-a", QualityDimension.Security, "Public endpoint lacks documented trust boundary"),
            CreateFailingFinding("f-b", QualityDimension.Reliability, "Stated recovery objective may not be achievable"),
        ];
        ArchitectureKnowledgeModel model = CreateModel();
        string[] priorities = ["Security", "Reliability"];

        IReadOnlyList<ArchitectureRecommendation> first = sut.BuildRecommendations(model, findings, priorities);
        IReadOnlyList<ArchitectureRecommendation> second = sut.BuildRecommendations(
            CreateModel(),
            findings.Select(CloneFinding).ToList(),
            [.. priorities]);

        first.Select(recommendation => recommendation.RecommendationId).Should().Equal(
            second.Select(recommendation => recommendation.RecommendationId));
        first.Select(recommendation => recommendation.RecommendationId).Should().OnlyHaveUniqueItems();
        first[0].ProposedChange.Should().Be(ArchitectureRecommendationProposedChange.Build(findings[0]));
        first[1].ProposedChange.Should().Be(ArchitectureRecommendationProposedChange.Build(findings[1]));
    }

    [Fact]
    public void BuildRecommendations_preserves_input_finding_order()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding reliability = CreateFailingFinding(
            "f-rel",
            QualityDimension.Reliability,
            "Stated recovery objective may not be achievable");
        SpecialistReviewFinding security = CreateFailingFinding(
            "f-sec",
            QualityDimension.Security,
            "Public endpoint lacks documented trust boundary");

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            CreateModel(),
            [reliability, security],
            ["Reliability", "Security"]);

        recommendations.Should().HaveCount(2);
        recommendations[0].Problem.Should().Be(reliability.Title);
        recommendations[1].Problem.Should().Be(security.Title);
        recommendations[0].RecommendationId.Should().NotBe(recommendations[1].RecommendationId);
    }

    [Fact]
    public void BuildRecommendations_changing_finding_id_changes_recommendation_id()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding original = CreateFailingFinding(
            "f-id-1",
            QualityDimension.Cost,
            "Spend exceeds stated ceiling");
        SpecialistReviewFinding changedId = CloneFinding(original);
        changedId.FindingId = "f-id-2";

        string originalId = SingleRecommendationId(sut, original);
        string changed = SingleRecommendationId(sut, changedId);

        changed.Should().NotBe(originalId);
    }

    [Fact]
    public void BuildRecommendations_changing_proposed_change_via_title_changes_recommendation_id()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding original = CreateFailingFinding(
            "f-title",
            QualityDimension.Security,
            "Public endpoint lacks documented trust boundary");
        SpecialistReviewFinding changedTitle = CloneFinding(original);
        changedTitle.Title = "Missing encryption at rest";

        ArchitectureRecommendationProposedChange.Build(changedTitle).Should().NotBe(
            ArchitectureRecommendationProposedChange.Build(original));

        string originalId = SingleRecommendationId(sut, original);
        string changed = SingleRecommendationId(sut, changedTitle);

        changed.Should().NotBe(originalId);
    }

    [Fact]
    public void BuildRecommendations_changing_dimension_changes_recommendation_id()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding original = CreateFailingFinding(
            "f-dim",
            QualityDimension.Security,
            "Gap in documented controls");
        SpecialistReviewFinding changedDimension = CloneFinding(original);
        changedDimension.Dimension = QualityDimension.Cost;

        string originalId = SingleRecommendationId(sut, original);
        string changed = SingleRecommendationId(sut, changedDimension);

        changed.Should().NotBe(originalId);
    }

    [Fact]
    public void BuildRecommendations_skips_fail_findings_whose_governance_disposition_is_accepted()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding acceptedRisk = CreateFailingFinding(
            "f-accepted",
            QualityDimension.Security,
            "Residual exposure after explicit risk acceptance");
        acceptedRisk.GovernanceDisposition = GovernanceDisposition.Accepted;

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            CreateModel(),
            [acceptedRisk],
            ["Security"]);

        recommendations.Should().BeEmpty();
    }

    [Fact]
    public void BuildRecommendations_skips_fail_findings_whose_governance_disposition_is_exception_granted()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding excepted = CreateFailingFinding(
            "f-excepted",
            QualityDimension.Security,
            "Documented exception for legacy exposure");
        excepted.GovernanceDisposition = GovernanceDisposition.ExceptionGranted;

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            CreateModel(),
            [excepted],
            ["Security"]);

        recommendations.Should().BeEmpty();
    }

    [Fact]
    public void BuildRecommendations_skips_fail_findings_whose_governance_disposition_is_deferred()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding deferred = CreateFailingFinding(
            "f-deferred",
            QualityDimension.Cost,
            "Spend review deferred to next quarter");
        deferred.GovernanceDisposition = GovernanceDisposition.Deferred;

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            CreateModel(),
            [deferred],
            ["Cost"]);

        recommendations.Should().BeEmpty();
    }

    [Fact]
    public void BuildRecommendations_skips_fail_findings_whose_governance_disposition_is_remediation_planned()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding planned = CreateFailingFinding(
            "f-planned",
            QualityDimension.Reliability,
            "Failover gap with remediation scheduled");
        planned.GovernanceDisposition = GovernanceDisposition.RemediationPlanned;

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            CreateModel(),
            [planned],
            ["Reliability"]);

        recommendations.Should().BeEmpty();
    }

    [Fact]
    public void BuildRecommendations_skips_fail_findings_whose_governance_disposition_is_human_decision_required()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding pendingHuman = CreateFailingFinding(
            "f-human",
            QualityDimension.Security,
            "Exposure awaiting human disposition");
        pendingHuman.GovernanceDisposition = GovernanceDisposition.HumanDecisionRequired;

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            CreateModel(),
            [pendingHuman],
            ["Security"]);

        recommendations.Should().BeEmpty();
    }

    [Fact]
    public void BuildRecommendations_stamps_system_proposed_indirectly_supported_when_evidence_is_insufficient()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding insufficient = CreateFailingFinding(
            "f-insufficient",
            QualityDimension.Security,
            "Gap without complete evidence");
        insufficient.EvidenceCondition = EvidenceCondition.Insufficient;

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            CreateModel(),
            [insufficient],
            ["Security"]);

        recommendations.Should().ContainSingle();
        recommendations[0].Provenance.SupportStatus.Should().Be(SupportStatus.IndirectlySupported);
        recommendations[0].Provenance.Origin.Should().Be(ClaimOrigin.SystemProposed);
    }

    [Fact]
    public void BuildRecommendations_stamps_system_proposed_indirectly_supported_when_fail_evidence_is_unverified()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding unverified = CreateFailingFinding(
            "f-unverified",
            QualityDimension.Cost,
            "Spend signal without corroboration");
        unverified.EvidenceCondition = EvidenceCondition.Unverified;

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            CreateModel(),
            [unverified],
            ["Cost"]);

        recommendations.Should().ContainSingle();
        recommendations[0].Provenance.SupportStatus.Should().Be(SupportStatus.IndirectlySupported);
        recommendations[0].Provenance.Origin.Should().Be(ClaimOrigin.SystemProposed);
    }

    [Fact]
    public void FromFinding_throws_when_finding_is_null()
    {
        Action act = () => ArchitectureRecommendationStableId.FromFinding(null!, "proposed");

        act.Should().Throw<ArgumentNullException>().WithParameterName("finding");
    }

    private static string SingleRecommendationId(
        ArchitectureRecommendationEngine sut,
        SpecialistReviewFinding finding)
    {
        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            CreateModel(),
            [finding],
            ["Priority"]);

        recommendations.Should().ContainSingle();
        return recommendations[0].RecommendationId;
    }

    private static ArchitectureKnowledgeModel CreateModel()
    {
        return new ArchitectureKnowledgeModel
        {
            ModelId = "model-1",
            TenantId = "tenant-1",
        };
    }

    private static SpecialistReviewFinding CreateFailingFinding(
        string findingId,
        QualityDimension dimension,
        string title)
    {
        return new SpecialistReviewFinding
        {
            FindingId = findingId,
            Dimension = dimension,
            Title = title,
            Rationale = "Rationale for " + title,
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
            Confidence = 0.8,
        };
    }

    private static SpecialistReviewFinding CloneFinding(SpecialistReviewFinding source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new SpecialistReviewFinding
        {
            FindingId = source.FindingId,
            Dimension = source.Dimension,
            Title = source.Title,
            Rationale = source.Rationale,
            Conclusion = source.Conclusion,
            EvidenceCondition = source.EvidenceCondition,
            GovernanceDisposition = source.GovernanceDisposition,
            Provenance = source.Provenance,
            Confidence = source.Confidence,
            EvidenceArtifactIds = [.. source.EvidenceArtifactIds],
            Severity = source.Severity,
            LifecycleScope = source.LifecycleScope,
            RelatedModelElementIds = [.. source.RelatedModelElementIds],
            RelatedRequirementElementIds = [.. source.RelatedRequirementElementIds],
            RelatedDecisionElementIds = [.. source.RelatedDecisionElementIds],
            EvidenceSupportTier = source.EvidenceSupportTier,
        };
    }
}

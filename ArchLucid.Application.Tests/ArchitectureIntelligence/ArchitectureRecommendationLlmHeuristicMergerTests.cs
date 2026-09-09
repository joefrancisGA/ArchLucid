using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureRecommendationLlmHeuristicMergerTests
{
    [Fact]
    public void Merge_preserves_system_proposed_origin_when_llm_overlays_heuristic_row()
    {
        SpecialistReviewFinding finding = CreateFinding("f-1", "Public endpoint lacks documented trust boundary");
        ArchitectureRecommendationEngine heuristicEngine = new();
        ArchitectureRecommendation heuristic = heuristicEngine.BuildRecommendations(
            CreateModel(),
            [finding],
            ["Security"]).Single();

        ArchitectureRecommendation llmOverlay = new()
        {
            RecommendationId = "llm-only-id",
            Problem = finding.Title,
            Evidence = string.Empty,
            AffectedRequirementOrQualityAttribute = finding.Dimension.ToString(),
            ConsequenceOfInaction = "Risk remains.",
            ProposedChange = "LLM refined remediation path.",
            ValidationMethod = "Re-run review.",
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.ModelInferred,
                SupportStatus = SupportStatus.Unsupported,
            },
        };

        IReadOnlyList<ArchitectureRecommendation> merged = ArchitectureRecommendationLlmHeuristicMerger.Merge(
            [heuristic],
            [llmOverlay],
            [finding]);

        merged.Should().ContainSingle();
        merged[0].RecommendationId.Should().Be(heuristic.RecommendationId);
        merged[0].ProposedChange.Should().Be("LLM refined remediation path.");
        merged[0].Provenance.Origin.Should().Be(ClaimOrigin.SystemProposed);
        merged[0].Provenance.SupportStatus.Should().Be(SupportStatus.IndirectlySupported);
    }

    [Fact]
    public void Merge_labels_model_only_recommendations_and_requires_approval_without_evidence()
    {
        ArchitectureRecommendation llmOnly = new()
        {
            RecommendationId = ArchitectureRecommendationStableId.FromLlmRecommendation(
                "Unmatched model idea",
                "Do something novel",
                "Security"),
            Problem = "Unmatched model idea",
            Evidence = string.Empty,
            AffectedRequirementOrQualityAttribute = "Security",
            ConsequenceOfInaction = "Unknown.",
            ProposedChange = "Do something novel",
            ValidationMethod = "Review.",
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.SystemProposed,
                SupportStatus = SupportStatus.IndirectlySupported,
            },
        };

        IReadOnlyList<ArchitectureRecommendation> merged = ArchitectureRecommendationLlmHeuristicMerger.Merge(
            [],
            [llmOnly],
            []);

        merged.Should().ContainSingle();
        merged[0].Provenance.Origin.Should().Be(ClaimOrigin.ModelInferred);
        merged[0].Provenance.SupportStatus.Should().Be(SupportStatus.Unsupported);
        merged[0].RequiresHumanApproval.Should().BeTrue();
    }

    [Fact]
    public void Merge_keeps_unmatched_heuristic_rows_when_llm_covers_other_findings()
    {
        SpecialistReviewFinding matched = CreateFinding("f-1", "Public endpoint lacks documented trust boundary");
        SpecialistReviewFinding unmatched = CreateFinding("f-2", "Stated recovery objective may not be achievable");
        ArchitectureRecommendationEngine heuristicEngine = new();
        IReadOnlyList<ArchitectureRecommendation> heuristic = heuristicEngine.BuildRecommendations(
            CreateModel(),
            [matched, unmatched],
            ["Security", "Reliability"]);

        ArchitectureRecommendation llmOverlay = new()
        {
            RecommendationId = "llm-id",
            Problem = matched.Title,
            ProposedChange = "LLM overlay",
            AffectedRequirementOrQualityAttribute = matched.Dimension.ToString(),
            ConsequenceOfInaction = "Risk.",
            Evidence = "Evidence.",
            ValidationMethod = "Review.",
        };

        IReadOnlyList<ArchitectureRecommendation> merged = ArchitectureRecommendationLlmHeuristicMerger.Merge(
            heuristic,
            [llmOverlay],
            [matched, unmatched]);

        merged.Should().HaveCount(2);
        merged.Select(recommendation => recommendation.RecommendationId)
            .Should()
            .BeEquivalentTo(heuristic.Select(recommendation => recommendation.RecommendationId));
    }

    private static ArchitectureKnowledgeModel CreateModel() =>
        new()
        {
            ModelId = "model-1",
            TenantId = "tenant-1",
        };

    private static SpecialistReviewFinding CreateFinding(string findingId, string title) =>
        new()
        {
            FindingId = findingId,
            Dimension = QualityDimension.Security,
            Title = title,
            Rationale = "Rationale.",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
            Confidence = 0.8,
        };
}

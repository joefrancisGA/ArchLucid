using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class LlmBackedArchitectureRecommendationEngineTests
{
    [Fact]
    public async Task BuildRecommendationsAsync_falls_back_to_heuristic_when_llm_returns_empty()
    {
        SpecialistReviewFinding finding = CreateFinding();
        Mock<IArchitectureIntelligenceLlmGateway> gateway = new();
        gateway
            .Setup(g => g.DraftRecommendationsAsync(
                It.IsAny<ArchitectureKnowledgeModel>(),
                It.IsAny<IReadOnlyList<SpecialistReviewFinding>>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<ArchitectureRecommendation>?)null);

        LlmBackedArchitectureRecommendationEngine sut = new(
            gateway.Object,
            new ArchitectureRecommendationEngine());

        IReadOnlyList<ArchitectureRecommendation> recommendations = await sut.BuildRecommendationsAsync(
            CreateModel(),
            [finding],
            ["Security"]);

        recommendations.Should().ContainSingle();
        recommendations[0].Provenance.Origin.Should().Be(ClaimOrigin.SystemProposed);
    }

    [Fact]
    public async Task BuildRecommendationsAsync_merges_llm_prose_without_dropping_heuristic_origin()
    {
        SpecialistReviewFinding finding = CreateFinding();
        ArchitectureRecommendationEngine heuristicEngine = new();
        ArchitectureRecommendation heuristic = heuristicEngine.BuildRecommendations(
            CreateModel(),
            [finding],
            ["Security"]).Single();

        ArchitectureRecommendation llmRecommendation = new()
        {
            RecommendationId = "llm-id",
            Problem = finding.Title,
            Evidence = string.Empty,
            AffectedRequirementOrQualityAttribute = finding.Dimension.ToString(),
            ConsequenceOfInaction = "Risk remains.",
            ProposedChange = "Model-authored remediation.",
            ValidationMethod = "Review.",
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.ModelInferred,
                SupportStatus = SupportStatus.Unsupported,
            },
        };

        Mock<IArchitectureIntelligenceLlmGateway> gateway = new();
        gateway
            .Setup(g => g.DraftRecommendationsAsync(
                It.IsAny<ArchitectureKnowledgeModel>(),
                It.IsAny<IReadOnlyList<SpecialistReviewFinding>>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([llmRecommendation]);

        LlmBackedArchitectureRecommendationEngine sut = new(gateway.Object, heuristicEngine);

        IReadOnlyList<ArchitectureRecommendation> recommendations = await sut.BuildRecommendationsAsync(
            CreateModel(),
            [finding],
            ["Security"]);

        recommendations.Should().ContainSingle();
        recommendations[0].RecommendationId.Should().Be(heuristic.RecommendationId);
        recommendations[0].ProposedChange.Should().Be("Model-authored remediation.");
        recommendations[0].Provenance.Origin.Should().Be(ClaimOrigin.SystemProposed);
    }

    private static ArchitectureKnowledgeModel CreateModel() =>
        new()
        {
            ModelId = "model-1",
            TenantId = "tenant-1",
        };

    private static SpecialistReviewFinding CreateFinding() =>
        new()
        {
            FindingId = "f-1",
            Dimension = QualityDimension.Security,
            Title = "Public endpoint lacks documented trust boundary",
            Rationale = "No trust boundary element exists.",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
            Confidence = 0.8,
        };
}

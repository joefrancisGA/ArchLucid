using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class SpecialistReviewRouterServiceTests
{
    [Fact]
    public async Task ReviewAsync_uses_llm_when_router_enables_it()
    {
        SpecialistReviewRouterService sut = CreateService(
            useLlmReview: true,
            clientAvailable: true,
            llmReturnsFindings: true);

        ArchitectureKnowledgeModel model = CreateModelWithPublicEndpoint();

        SpecialistReviewResult result = await sut.ReviewAsync(model, [QualityDimension.Security]);

        result.Findings.Should().ContainSingle(finding =>
            finding.Title.Contains("LLM finding", StringComparison.Ordinal));
    }

    [Fact]
    public async Task ReviewAsync_falls_back_to_heuristic_when_router_disables_llm()
    {
        SpecialistReviewRouterService sut = CreateService(
            useLlmReview: false,
            clientAvailable: true,
            llmReturnsFindings: true);

        ArchitectureKnowledgeModel model = CreateModelWithPublicEndpoint();

        SpecialistReviewResult result = await sut.ReviewAsync(model, [QualityDimension.Security]);

        result.Findings.Should().ContainSingle(finding =>
            finding.Title.Contains("public endpoint", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task ReviewAsync_falls_back_to_heuristic_when_gateway_returns_null()
    {
        SpecialistReviewRouterService sut = CreateService(
            useLlmReview: true,
            clientAvailable: true,
            llmReturnsFindings: false);

        ArchitectureKnowledgeModel model = CreateModelWithPublicEndpoint();

        SpecialistReviewResult result = await sut.ReviewAsync(model, [QualityDimension.Security]);

        result.Findings.Should().ContainSingle(finding =>
            finding.Title.Contains("public endpoint", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Review_sync_path_always_uses_heuristic()
    {
        SpecialistReviewRouterService sut = CreateService(
            useLlmReview: true,
            clientAvailable: true,
            llmReturnsFindings: true);

        ArchitectureKnowledgeModel model = CreateModelWithPublicEndpoint();

        SpecialistReviewResult result = sut.Review(model, [QualityDimension.Security]);

        result.Findings.Should().ContainSingle(finding =>
            finding.Title.Contains("public endpoint", StringComparison.OrdinalIgnoreCase));
    }

    private static SpecialistReviewRouterService CreateService(
        bool useLlmReview,
        bool clientAvailable,
        bool llmReturnsFindings)
    {
        Mock<IOptionsMonitor<ArchitectureIntelligencePipelineOptions>> options = new();
        options.SetupGet(monitor => monitor.CurrentValue)
            .Returns(new ArchitectureIntelligencePipelineOptions
            {
                UseLlmReview = useLlmReview,
            });

        FixedSpecialistGateway gateway = new(clientAvailable, llmReturnsFindings);
        ArchitectureIntelligenceReviewRouter router = new(options.Object, gateway);

        return new SpecialistReviewRouterService(router, gateway, new SpecialistReviewService());
    }

    private static ArchitectureKnowledgeModel CreateModelWithPublicEndpoint() =>
        new()
        {
            ModelId = "model-1",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "iface-1",
                    Kind = ArchitectureElementKind.Interface,
                    Name = "Public endpoint",
                    Description = "Exposed API",
                },
            ],
        };

    private sealed class FixedSpecialistGateway : IArchitectureIntelligenceLlmGateway
    {
        private readonly bool _llmReturnsFindings;

        public FixedSpecialistGateway(bool isClientAvailable, bool llmReturnsFindings)
        {
            IsClientAvailable = isClientAvailable;
            _llmReturnsFindings = llmReturnsFindings;
        }

        public bool IsClientAvailable
        {
            get;
        }

        public Task<IReadOnlyList<ArchitectureModelElement>?> ExtractElementsAsync(
            string sourceText,
            string artifactId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<ArchitectureModelElement>?>(null);

        public Task<SpecialistReviewResult?> ReviewDimensionAsync(
            ArchitectureKnowledgeModel model,
            QualityDimension dimension,
            CancellationToken cancellationToken = default)
        {
            if (!_llmReturnsFindings)
            {
                return Task.FromResult<SpecialistReviewResult?>(null);
            }

            return Task.FromResult<SpecialistReviewResult?>(new SpecialistReviewResult
            {
                Dimension = dimension,
                Findings =
                [
                    new SpecialistReviewFinding
                    {
                        FindingId = "llm-1",
                        Dimension = dimension,
                        Title = "LLM finding",
                        Rationale = "From gateway.",
                        Conclusion = ReviewConclusion.Fail,
                        EvidenceCondition = EvidenceCondition.Insufficient,
                        Severity = "High",
                    },
                ],
            });
        }

        public Task<IReadOnlyList<AdversarialChallenge>?> GenerateAdversarialChallengesAsync(
            IReadOnlyList<SpecialistReviewFinding> findings,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<AdversarialChallenge>?>(null);

        public Task<IReadOnlyList<ArchitectureRecommendation>?> DraftRecommendationsAsync(
            ArchitectureKnowledgeModel model,
            IReadOnlyList<SpecialistReviewFinding> findings,
            IReadOnlyList<string> declaredPriorities,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<ArchitectureRecommendation>?>(null);

        public Task<SemanticSupportAssessment?> AssessSemanticSupportAsync(
            string claimedConclusion,
            IReadOnlyList<string> citedQuotes,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<SemanticSupportAssessment?>(null);
    }
}

using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class AdversarialReviewRouterServiceTests
{
    [Fact]
    public async Task ReviewAsync_uses_llm_challenges_when_router_enables_it()
    {
        AdversarialReviewRouterService sut = CreateService(
            useLlmReview: true,
            clientAvailable: true,
            hasChallenges: true);

        SpecialistReviewFinding finding = CreateChallengeableFinding("f1");

        AdversarialReviewResult result = await sut.ReviewAsync([finding], integrityPassedFindingIds: new HashSet<string>());

        result.Challenges.Should().ContainSingle(challenge =>
            challenge.Hypothesis.Contains("LLM hypothesis", StringComparison.Ordinal));
    }

    [Fact]
    public async Task ReviewAsync_falls_back_to_heuristic_when_router_disables_llm()
    {
        AdversarialReviewRouterService sut = CreateService(
            useLlmReview: false,
            clientAvailable: true,
            hasChallenges: true);

        SpecialistReviewFinding finding = CreateChallengeableFinding("f2");

        AdversarialReviewResult result = await sut.ReviewAsync([finding]);

        result.Challenges.Should().ContainSingle();
        result.Challenges[0].Hypothesis.Should().Contain("Challenge finding");
    }

    [Fact]
    public async Task ReviewAsync_falls_back_to_heuristic_when_gateway_returns_null()
    {
        AdversarialReviewRouterService sut = CreateService(
            useLlmReview: true,
            clientAvailable: true,
            hasChallenges: false);

        SpecialistReviewFinding finding = CreateChallengeableFinding("f3");

        AdversarialReviewResult result = await sut.ReviewAsync([finding]);

        result.Challenges.Should().ContainSingle();
        result.Challenges[0].Hypothesis.Should().Contain("Challenge finding");
    }

    private static AdversarialReviewRouterService CreateService(
        bool useLlmReview,
        bool clientAvailable,
        bool hasChallenges)
    {
        Mock<IOptionsMonitor<ArchitectureIntelligencePipelineOptions>> options = new();
        options.SetupGet(monitor => monitor.CurrentValue)
            .Returns(new ArchitectureIntelligencePipelineOptions
            {
                UseLlmReview = useLlmReview,
            });

        FixedAdversarialGateway gateway = new(clientAvailable, hasChallenges);
        ArchitectureIntelligenceReviewRouter router = new(options.Object, gateway);

        return new AdversarialReviewRouterService(router, gateway, new AdversarialReviewService());
    }

    private static SpecialistReviewFinding CreateChallengeableFinding(string findingId) =>
        new()
        {
            FindingId = findingId,
            Dimension = QualityDimension.Security,
            Title = "Missing auth",
            Rationale = "Public endpoint.",
            Conclusion = ReviewConclusion.Fail,
            EvidenceCondition = EvidenceCondition.Insufficient,
            Severity = "High",
        };

    private sealed class FixedAdversarialGateway : IArchitectureIntelligenceLlmGateway
    {
        private readonly bool _hasChallenges;

        public FixedAdversarialGateway(bool isClientAvailable, bool hasChallenges)
        {
            IsClientAvailable = isClientAvailable;
            _hasChallenges = hasChallenges;
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
            CancellationToken cancellationToken = default) =>
            Task.FromResult<SpecialistReviewResult?>(null);

        public Task<IReadOnlyList<AdversarialChallenge>?> GenerateAdversarialChallengesAsync(
            IReadOnlyList<SpecialistReviewFinding> findings,
            CancellationToken cancellationToken = default)
        {
            if (!_hasChallenges)
            {
                return Task.FromResult<IReadOnlyList<AdversarialChallenge>?>(null);
            }

            return Task.FromResult<IReadOnlyList<AdversarialChallenge>?>(
            [
                new AdversarialChallenge
                {
                    ChallengeId = "c1",
                    Hypothesis = "LLM hypothesis about missing auth",
                    FalsificationEvidenceNeeded = "Show auth middleware config",
                    Confidence = 0.6,
                    Lane = AdversarialLane.AdversarialChallenge,
                },
            ]);
        }

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
